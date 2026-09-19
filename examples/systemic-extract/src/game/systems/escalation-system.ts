import { World } from '../ecs';
import { TileState, HazardState } from '../../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';
import { ISystem } from '../core/system-types';
import { sound } from '../audio';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 9: Escalation & Reality Collapse System (2Hz - ADR 004 & ADR 005)
 * Tracks raid duration, manages dimensional stability, spawns the Apex Echo boss
 * at 180s (3:00), and triggers creeping perimeter Volatile Gas cascade.
 */
export class EscalationSystem implements ISystem {
  public readonly name = 'EscalationSystem';
  public static readonly COLLAPSE_THRESHOLD: number = 180; // 3 minutes
  private lastAlertTime: number = 0;
  private collapseAnnounced: boolean = false;
  private toxicHazardTimer: number = 0;
  private lastHazardAlertTime: number = 0;

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    if (!sim.isRaidActive) return;

    // Overworld is designed to be the Safe Zone. ENTIRELY SAFE.
    // No timer, no world dissolve/collapse, no toxic hazard, no perimeter gas flooding.
    if (sim.currentMapType === 'overworld') {
      sim.dimensionalStability = 100;
      sim.realityCollapseActive = false;
      sim.collapseRingDepth = 0;
      this.collapseAnnounced = false;
      this.toxicHazardTimer = 0;
      return;
    }

    // ADR 006: Sector 02 Corrosive Sub-Space Radiation Ambient Hazard
    if (
      sim.biomeProfile.hazardProfile.ambientHazardType === 'toxic_atmosphere' &&
      !sim.hasHazmatSuit &&
      !sim.isInsideSanctuary
    ) {
      this.toxicHazardTimer += dt;
      if (this.toxicHazardTimer >= 2.0) {
        this.toxicHazardTimer = 0;
        const playerHealth = world.healths.get(sim.playerEntityId);
        const playerVisual = world.visuals.get(sim.playerEntityId);
        const playerPos = world.gridPositions.get(sim.playerEntityId);

        if (playerHealth && playerHealth.current > 0) {
          const dpsDamage = sim.biomeProfile.hazardProfile.dps || 3;
          playerHealth.current = Math.max(0, playerHealth.current - dpsDamage);
          if (playerVisual) playerVisual.flashTime = 0.2;

          if (playerPos) {
            sim.spawnParticles(playerPos.x, playerPos.y, 3, 'smoke', '#06b6d4');
          }

          if (sim.raidElapsedSeconds - this.lastHazardAlertTime > 8.0) {
            this.lastHazardAlertTime = sim.raidElapsedSeconds;
            sim.addLog(
              'damage',
              `SECTOR 02 HAZARD: Corrosive atmosphere drains ${dpsDamage} HP! [Lead-Shielded Rig Required]`
            );
          }
        }
      }
    }

    // 1. Calculate Dimensional Stability (100% -> 0% over 180 seconds in Dungeons)
    if (sim.raidElapsedSeconds < EscalationSystem.COLLAPSE_THRESHOLD) {
      const remainingRatio = 1 - (sim.raidElapsedSeconds / EscalationSystem.COLLAPSE_THRESHOLD);
      sim.dimensionalStability = Math.max(1, Math.round(remainingRatio * 100));
      sim.realityCollapseActive = false;
      sim.collapseRingDepth = 0;
      this.collapseAnnounced = false;
    } else {
      sim.dimensionalStability = 0;
      sim.realityCollapseActive = true;

      // 2. Announce initial collapse breach & deploy Apex Echo
      if (!this.collapseAnnounced) {
        this.collapseAnnounced = true;
        sim.addLog('alert', 'REALITY COLLAPSE CASCADE: Dimensional stability at 0%! Perimeter containment breached!');
        sim.addLog('fire', 'CRITICAL ESCALATION: Creeping anomalous gas flooding sector boundaries inward!');
        sound.playRealityKlaxon();
        if (!sim.apexBossSpawned) {
          sim.spawnApexBoss(50, 50);
        }
      }

      // 3. Creeping Perimeter Flooding (Creeps inward 1 tile depth every 4 seconds, preserving central deploy zone)
      const secondsPast = sim.raidElapsedSeconds - EscalationSystem.COLLAPSE_THRESHOLD;
      const targetRing = Math.min(42, Math.floor(secondsPast / 4));
      sim.collapseRingDepth = targetRing;

      // Periodic reminder every 10 seconds
      if (sim.raidElapsedSeconds - this.lastAlertTime > 10) {
        this.lastAlertTime = sim.raidElapsedSeconds;
        sim.addLog('alert', `ANOMALOUS FRONT ADVANCING: Sector perimeter collapsing inward (Depth ${targetRing}/42)! Fall back to Central Deploy Zone!`);
      }

      // Flood perimeter tiles up to current ring depth
      for (let r = 0; r <= targetRing; r++) {
        const minX = r;
        const maxX = MAP_WIDTH - 1 - r;
        const minY = r;
        const maxY = MAP_HEIGHT - 1 - r;

        // Top & Bottom edges
        for (let x = minX; x <= maxX; x++) {
          this.collapseTile(x, minY, map, world, sim, r === targetRing);
          this.collapseTile(x, maxY, map, world, sim, r === targetRing);
        }
        // Left & Right edges
        for (let y = minY; y <= maxY; y++) {
          this.collapseTile(minX, y, map, world, sim, r === targetRing);
          this.collapseTile(maxX, y, map, world, sim, r === targetRing);
        }
      }
    }
  }

  private collapseTile(
    x: number,
    y: number,
    map: TileState[][],
    world: World,
    sim: Simulation,
    isFrontier: boolean
  ) {
    if (sim.currentMapType === 'overworld') return;
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
    const tile = map[y]?.[x];
    if (!tile) return;

    // Faraday Sanctuary and extraction zones are protected by atmospheric scrubbers & Faraday shields
    if (x >= 79 && x <= 121 && y >= 79 && y <= 121) return;
    if (tile.isExtraction) return;

    // Permanently convert into anomalous poison gas
    if (tile.hazard !== HazardState.PoisonGas) {
      tile.hazard = HazardState.PoisonGas;
      tile.hazardTimer = 999; // Permanent anomaly front
      tile.hazardIntensity = 1.0;
    }
    sim.activeHazards.add(y * MAP_WIDTH + x);

    // Demolish Biomass partitions in the collapse path
    if (tile.wallEntityId !== null) {
      sim.demolishWall(x, y, tile.wallEntityId, 'gas');
    }

    // Spawn green anomalous particles at the advancing frontier
    if (isFrontier && Math.random() < 0.08) {
      sim.spawnParticles(x, y, 1, 'smoke', '#84cc16');
    }
  }
}
