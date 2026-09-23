import { World } from '../ecs';
import { TileState, HazardState } from '../../types';
import { ISystem } from '../core/system-types';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 7: Biomass Hive Node Spawner System (2Hz - ADR 005)
 * Spawns fast Resonance Crawlers when the operative is in proximity (<20 tiles).
 */
export class HiveSpawningSystem implements ISystem {
  public readonly name = 'HiveSpawningSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    const playerPos = world.gridPositions.get(sim.playerEntityId);
    if (!playerPos) return;

    for (const [hiveId, spawner] of world.spawners.entries()) {
      const hivePos = world.gridPositions.get(hiveId);
      const hiveHealth = world.healths.get(hiveId);
      if (!hivePos || !hiveHealth || hiveHealth.current <= 0) continue;

      // Filter alive active crawlers
      spawner.activeSpawnIds = spawner.activeSpawnIds.filter((id) => world.isAlive(id));

      spawner.spawnTimer += dt;
      if (spawner.spawnTimer >= spawner.spawnInterval) {
        spawner.spawnTimer = 0;

        // Proximity trigger (20 tiles) and active capacity check
        const dist = Math.hypot(playerPos.x - hivePos.x, playerPos.y - hivePos.y);
        if (dist <= 20 && spawner.activeSpawnIds.length < spawner.maxActive) {
          const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 1 },
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: -1, y: 1 },
          ];
          for (const d of dirs) {
            const nx = Math.floor(hivePos.x + d.x);
            const ny = Math.floor(hivePos.y + d.y);
            if (sim.isTileWalkable(nx, ny) && map[ny]?.[nx]?.hazard !== HazardState.Fire) {
              const crawlerId = sim.spawnCrawler(nx, ny);
              spawner.activeSpawnIds.push(crawlerId);
              sim.spawnParticles(nx + 0.5, ny + 0.5, 10, 'smoke', '#ec4899');
              sim.addLog('alert', `BIOMASS SURGE: Hive Node spawned a Resonance Crawler at [${nx}, ${ny}]!`);
              break;
            }
          }
        }
      }
    }
  }
}
