import { World } from '../ecs';
import { EntityId, GridPosition, TileState, Faction } from '../../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';
import { ISystem } from '../core/system-types';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 3: Demolition & Explosives Pipeline (60Hz)
 * Ticks active Spacial Disruptors, fuses, and triggers matter-erasing detonations.
 */
export class DemolitionSystem implements ISystem {
  public readonly name = 'DemolitionSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    const toDetonate: { id: EntityId; pos: GridPosition; explosive: any }[] = [];

    for (const [id, explosive] of world.explosives.entries()) {
      if (explosive.isArmed) {
        explosive.fuseTime -= dt;

        const visual = world.visuals.get(id);
        const pos = world.gridPositions.get(id);
        if (visual && pos && Math.sin(explosive.fuseTime * 15) > 0) {
          visual.flashTime = 0.05;
        }

        if (explosive.fuseTime <= 0) {
          if (pos) {
            toDetonate.push({ id, pos: { ...pos }, explosive });
          }
        }
      }
    }

    for (const item of toDetonate) {
      this.detonateExplosive(item.id, item.pos.x, item.pos.y, item.explosive, world, map, sim);
    }
  }

  private detonateExplosive(
    chargeId: EntityId,
    centerX: number,
    centerY: number,
    explosive: any,
    world: World,
    map: TileState[][],
    sim: Simulation
  ) {
    world.despawn(chargeId);
    sim.addLog('explosion', `DISRUPTION! Spacial Disruptor detonated at [${centerX}, ${centerY}], erasing matter!`);
    sim.spawnParticles(centerX + 0.5, centerY + 0.5, 35, 'blast', '#f97316');
    sim.spawnParticles(centerX + 0.5, centerY + 0.5, 20, 'smoke', '#475569');

    const radius = explosive.blastRadius;
    const damage = explosive.damage;
    const cx = Math.floor(centerX);
    const cy = Math.floor(centerY);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + 0.4) {
          const tile = map[ty]?.[tx];
          if (!tile) continue;

          // 1. Destroy Biomass Partitions
          if (tile.wallEntityId !== null) {
            const kind = world.kinds.get(tile.wallEntityId);
            if (kind === 'DestructibleWall') {
              sim.demolishWall(tx, ty, tile.wallEntityId, 'breached');
            }
          }

          // 2. Damage combatants
          for (const [id, pos] of world.gridPositions.entries()) {
            if (pos.x === tx && pos.y === ty) {
              const health = world.healths.get(id);
              const faction = world.factions.get(id);
              const visual = world.visuals.get(id);
              if (health) {
                health.current = Math.max(0, health.current - damage);
                if (visual) visual.flashTime = 0.3;
                sim.spawnParticles(tx + 0.5, ty + 0.5, 10, 'spark', '#ef4444');

                if (id === sim.playerEntityId) {
                  sim.addLog('damage', `Operative caught in spacial blast! Suffered ${damage} damage!`);
                } else if (
                  faction === Faction.Security ||
                  world.kinds.get(id) === 'Security' ||
                  world.kinds.get(id) === 'Crawler' ||
                  world.kinds.get(id) === 'HiveBlob' ||
                  world.kinds.get(id) === 'ApexEcho'
                ) {
                  const targetName = world.kinds.get(id) === 'ApexEcho' ? 'The Apex Echo' : 'Hostile entity';
                  sim.addLog('damage', `${targetName} hit by spacial shockwave (${damage} DMG).`);
                  if (health.current <= 0) {
                    sim.eliminateHostileEntity(id, tx, ty);
                  }
                }
              }
            }
          }

          // 3. Ignite fire at epicenter / chance
          if (dist <= 1.0) {
            sim.igniteTile(tx, ty);
          }
        }
      }
    }
  }
}
