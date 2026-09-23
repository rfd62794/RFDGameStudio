import { World } from '../ecs';
import { GridPosition, TileState, HazardState, Faction } from '../../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';
import { ISystem } from '../core/system-types';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 6: Hazard Chemistry & Volatile Gas Pipeline (2Hz)
 * ADR 003: Sub-frequency execution (500ms) across 2,500 grid blocks.
 * Handles:
 * - Fire spread & Biomass Partition combustion (-10 HP/tick)
 * - Volatile Gas rapid spread (2x faster than fire)
 * - Gas dissipation over time
 * - Volatile Gas + Fire = INSTANT CHAIN-REACTION EXPLOSION (1-tile AoE cascade)!
 */
export class HazardSpreadSystem implements ISystem {
  public readonly name = 'HazardSpreadSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    const fireToSpread: GridPosition[] = [];
    const gasToSpread = new Map<string, { x: number; y: number; duration: number }>();
    const gasToCombust: GridPosition[] = [];
    const toRemove: number[] = [];

    // 1. Active Hazards Sweep (O(ActiveHazards) instead of O(W*H))
    for (const key of sim.activeHazards) {
      const x = key % MAP_WIDTH;
      const y = Math.floor(key / MAP_WIDTH);
      const tile = map[y]?.[x];
      if (!tile) {
        toRemove.push(key);
        continue;
      }

      // ----------------------------------------------------
      // BRANCH A: FIRE HAZARDS
      // ----------------------------------------------------
      if (tile.hazard === HazardState.Fire) {
        tile.hazardTimer -= dt;
        if (tile.hazardTimer <= 0) {
          tile.hazard = HazardState.None;
          tile.hazardIntensity = 0;
          toRemove.push(key);
          continue;
        }

        // Check cardinal neighbors
        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];

        for (const n of neighbors) {
          if (n.x >= 0 && n.x < MAP_WIDTH && n.y >= 0 && n.y < MAP_HEIGHT) {
            const nTile = map[n.y]?.[n.x];
            if (!nTile) continue;

            // ADR 003: Gas + Fire = Instant explosive chain reaction!
            if (nTile.hazard === HazardState.PoisonGas) {
              gasToCombust.push({ x: n.x, y: n.y });
            }
            // Flammable Biomass Partition check
            else if (nTile.hazard !== HazardState.Fire && nTile.wallEntityId !== null) {
              const wallFlam = world.flammables.get(nTile.wallEntityId);
              if (wallFlam && Math.random() < 0.45) {
                fireToSpread.push(n);
              }
            }
          }
        }
      }

      // ----------------------------------------------------
      // BRANCH B: VOLATILE GAS HAZARDS (ADR 003 & ADR 004 DIVERT)
      // Volumetric Dilution Algorithm: T_child = T_parent * 0.65
      // Dissipates after 3-4 tiles unless reinforced (Reality Collapse T=999)
      // ----------------------------------------------------
      else if (tile.hazard === HazardState.PoisonGas) {
        tile.hazardTimer -= dt;
        if (tile.hazardTimer <= 0) {
          tile.hazard = HazardState.None;
          tile.hazardIntensity = 0;
          toRemove.push(key);
          continue;
        }

        // Volumetric dilution decay factor: child timer is 0.65 of parent
        const childDuration = tile.hazardTimer * 0.65;

        // Check 8-way neighbors for gas diffusion (2x rapid expansion)
        const gasNeighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
          { x: x + 1, y: y + 1 },
          { x: x - 1, y: y - 1 },
        ];

        for (const n of gasNeighbors) {
          if (n.x >= 0 && n.x < MAP_WIDTH && n.y >= 0 && n.y < MAP_HEIGHT) {
            const nTile = map[n.y]?.[n.x];
            if (!nTile) continue;
            // If neighbor has fire, gas combusts immediately!
            if (nTile.hazard === HazardState.Fire) {
              gasToCombust.push({ x, y });
            } else if (nTile.hazard === HazardState.None && nTile.wallEntityId === null && !nTile.isExtraction) {
              // Volumetric dilution threshold: Only expands if child duration >= 1.0s
              if (childDuration >= 1.0 && Math.random() < 0.35) {
                const keyStr = `${n.x},${n.y}`;
                const existing = gasToSpread.get(keyStr);
                if (!existing || existing.duration < childDuration) {
                  gasToSpread.set(keyStr, { x: n.x, y: n.y, duration: childDuration });
                }
              }
            }
          }
        }
      } else {
        toRemove.push(key);
      }
    }

    // Purge expired hazards from active tracker
    for (const key of toRemove) {
      sim.activeHazards.delete(key);
    }

    // 2. Execute Volatile Gas Chain Reactions (Gas + Fire)
    const processedCombustions = new Set<string>();
    for (const pos of gasToCombust) {
      const key = `${pos.x},${pos.y}`;
      if (processedCombustions.has(key)) continue;
      processedCombustions.add(key);
      this.triggerGasCombustion(pos.x, pos.y, world, map, sim);
    }

    // 3. Execute Fire Spread
    for (const pos of fireToSpread) {
      sim.igniteTile(pos.x, pos.y);
    }

    // 4. Execute Volatile Gas Spread with Volumetric Dilution
    for (const target of gasToSpread.values()) {
      sim.deployGas(target.x, target.y, target.duration);
    }

    // 5. Environmental Damage to Entities & Biomass Partitions
    this.processHazardDamage(dt, world, map, sim);
  }

  /**
   * ADR 003: Instant 1-tile AoE combustion when Fire touches Volatile Gas!
   */
  private triggerGasCombustion(
    centerX: number,
    centerY: number,
    world: World,
    map: TileState[][],
    sim: Simulation
  ): void {
    const tile = map[centerY]?.[centerX];
    if (!tile) return;

    tile.hazard = HazardState.Fire;
    tile.hazardTimer = 10.0; // Converted to active fire
    sim.activeHazards.add(centerY * MAP_WIDTH + centerX);

    sim.addLog('fire', `EMERGENT REACTION: Volatile Gas ignited at [${centerX}, ${centerY}]! Explosive shockwave cascading!`);
    sim.spawnParticles(centerX + 0.5, centerY + 0.5, 24, 'blast', '#eab308'); // Golden vapor flame
    sim.spawnParticles(centerX + 0.5, centerY + 0.5, 16, 'flame', '#f97316');
    sim.spawnParticles(centerX + 0.5, centerY + 0.5, 12, 'smoke', '#475569');

    // 1-Tile AoE Shockwave
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = centerX + dx;
        const ty = centerY + dy;
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;

        const targetTile = map[ty]?.[tx];
        if (!targetTile) continue;

        // Destroy adjacent Biomass Partitions
        if (targetTile.wallEntityId !== null) {
          const kind = world.kinds.get(targetTile.wallEntityId);
          if (kind === 'DestructibleWall') {
            sim.demolishWall(tx, ty, targetTile.wallEntityId, 'burned');
          }
        }

        // Damage any entities caught in the gas blast (35 DMG)
        for (const [id, pos] of world.gridPositions.entries()) {
          if (Math.hypot(pos.x - tx, pos.y - ty) <= 0.7) {
            const health = world.healths.get(id);
            const visual = world.visuals.get(id);
            if (health) {
              const damage = 35;
              health.current = Math.max(0, health.current - damage);
              if (visual) visual.flashTime = 0.25;
              sim.spawnParticles(tx + 0.5, ty + 0.5, 8, 'spark', '#f59e0b');

              if (id === sim.playerEntityId) {
                sim.addLog('damage', `Operative caught in gas deflagration! Suffered ${damage} damage!`);
              } else if (
                world.factions.get(id) === Faction.Security ||
                world.kinds.get(id) === 'Security' ||
                world.kinds.get(id) === 'Crawler' ||
                world.kinds.get(id) === 'HiveBlob' ||
                world.kinds.get(id) === 'ApexEcho'
              ) {
                const targetName = world.kinds.get(id) === 'ApexEcho' ? 'The Apex Echo' : 'Hostile entity';
                sim.addLog('damage', `${targetName} engulfed by gas explosion (${damage} DMG).`);
                if (health.current <= 0) {
                  sim.eliminateHostileEntity(id, tx, ty);
                }
              }
            }
          }
        }

        // Cascade fire to adjacent tiles (which will detonate adjacent gas on next sweep)
        if (targetTile.wallEntityId === null && targetTile.hazard === HazardState.None) {
          targetTile.hazard = HazardState.Fire;
          targetTile.hazardTimer = 6.0;
          sim.activeHazards.add(ty * MAP_WIDTH + tx);
        }
      }
    }
  }

  private processHazardDamage(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    // 1. Burn Biomass Partitions (-10 HP/tick) - O(ActiveHazards)
    for (const key of sim.activeHazards) {
      const x = key % MAP_WIDTH;
      const y = Math.floor(key / MAP_WIDTH);
      const tile = map[y]?.[x];
      if (tile && tile.hazard === HazardState.Fire && tile.wallEntityId !== null) {
        const wallId = tile.wallEntityId;
        const health = world.healths.get(wallId);
        const flam = world.flammables.get(wallId);
        if (health && flam) {
          health.current -= flam.burn_rate * dt;
          const visual = world.visuals.get(wallId);
          if (visual) visual.flashTime = 0.15;

          if (health.current <= 0) {
            sim.demolishWall(x, y, wallId, 'burned');
          }
        }
      }
    }

    // 2. Entity Damage inside Hazards (Fire: -10 HP/s, Volatile Gas: -15 HP/s)
    for (const [id, pos] of world.gridPositions.entries()) {
      const tileX = Math.floor(pos.x);
      const tileY = Math.floor(pos.y);
      const tile = map[tileY]?.[tileX];
      if (!tile) continue;

      // Deploy and extraction zones have active Faraday atmospheric scrubbers
      if (tile.isExtraction) {
        if (tile.hazard !== HazardState.None) {
          tile.hazard = HazardState.None;
          tile.hazardTimer = 0;
        }
        continue;
      }

      const health = world.healths.get(id);
      const visual = world.visuals.get(id);
      if (!health || health.current <= 0) continue;

      if (tile.hazard === HazardState.Fire) {
        health.current = Math.max(0, health.current - 10 * dt);
        if (visual) visual.flashTime = 0.1;

        if (id === sim.playerEntityId && Math.random() < 0.2) {
          sim.addLog('fire', 'WARNING: Operative sustaining burn damage in fire hazard (-10 HP/s)!');
        }
      } else if (tile.hazard === HazardState.PoisonGas) {
        health.current = Math.max(0, health.current - 15 * dt);
        if (visual) visual.flashTime = 0.1;

        if (id === sim.playerEntityId && Math.random() < 0.2) {
          sim.addLog('damage', 'TOXIC HAZARD: Inhaling volatile gas! Biological damage sustained (-15 HP/s)!');
        }
      }

      if (health.current <= 0) {
        if (id === sim.playerEntityId) {
          sim.isPlayerDead = true;
          sim.isRaidActive = false;
        } else if (
          world.factions.get(id) === Faction.Security ||
          world.kinds.get(id) === 'Security' ||
          world.kinds.get(id) === 'Crawler' ||
          world.kinds.get(id) === 'HiveBlob' ||
          world.kinds.get(id) === 'ApexEcho'
        ) {
          sim.eliminateHostileEntity(id, pos.x, pos.y);
        }
      }
    }
  }
}
