import { World } from '../ecs';
import { EntityId, TileState } from '../../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';
import { ISystem } from '../core/system-types';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 0B: ADR 010 SwarmSeparationSystem (30Hz Tier)
 * Spatial grid-partitioned repulsive force simulation preventing entity stacking
 * between player, crawlers, guards, hive nodes, and bosses.
 */
export class SwarmSeparationSystem implements ISystem {
  public readonly name = 'SwarmSeparationSystem';
  private static readonly CELL_SIZE = 2.5; // 2.5x2.5 tile spatial hash cells
  private static readonly REPULSION_STRENGTH = 16.0;

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    if (!sim.isRaidActive) return;

    interface SwarmEntity {
      id: EntityId;
      x: number;
      y: number;
      radius: number;
      mass: number;
      isStatic: boolean;
    }

    const entities: SwarmEntity[] = [];

    // 1. Faraday Operative
    const playerTransform = world.transforms.get(sim.playerEntityId);
    const playerPos = world.gridPositions.get(sim.playerEntityId);
    if (playerPos && !sim.isPlayerDead) {
      entities.push({
        id: sim.playerEntityId,
        x: playerTransform ? playerTransform.x : playerPos.x,
        y: playerTransform ? playerTransform.y : playerPos.y,
        radius: 0.36,
        mass: 3.5, // Heavy Faraday Rig
        isStatic: false,
      });
    }

    // 2. Active Hostile Combatants
    for (const [id, pos] of world.gridPositions.entries()) {
      if (id === sim.playerEntityId) continue;
      const kind = world.kinds.get(id);
      if (kind !== 'Security' && kind !== 'Crawler' && kind !== 'HiveBlob' && kind !== 'ApexEcho') {
        continue;
      }
      const health = world.healths.get(id);
      if (health && health.current <= 0) continue;

      let radius = 0.32;
      let mass = 1.0;
      let isStatic = false;

      if (kind === 'ApexEcho') {
        radius = 0.65;
        mass = 12.0;
        isStatic = true; // Immovable ontological boss
      } else if (kind === 'HiveBlob') {
        radius = 0.48;
        mass = 6.0;
        isStatic = true; // Stationary hive organ
      } else if (kind === 'Security') {
        radius = 0.34;
        mass = 1.8;
      } else if (kind === 'Crawler') {
        radius = 0.26;
        mass = 0.7; // Light skittering organism
      }

      const transform = world.transforms.get(id);
      entities.push({
        id,
        x: transform ? transform.x : pos.x,
        y: transform ? transform.y : pos.y,
        radius,
        mass,
        isStatic,
      });
    }

    if (entities.length <= 1) return;

    // 3. Populate Spatial Hash Grid
    const grid: Map<string, SwarmEntity[]> = new Map();
    for (const e of entities) {
      const cx = Math.floor(e.x / SwarmSeparationSystem.CELL_SIZE);
      const cy = Math.floor(e.y / SwarmSeparationSystem.CELL_SIZE);
      const key = `${cx},${cy}`;
      let cell = grid.get(key);
      if (!cell) {
        cell = [];
        grid.set(key, cell);
      }
      cell.push(e);
    }

    // 4. Pairwise Repulsive Vectors in 3x3 Local Neighborhood
    const displacements: Map<EntityId, { dx: number; dy: number }> = new Map();

    for (const e of entities) {
      if (e.isStatic) continue;

      const cx = Math.floor(e.x / SwarmSeparationSystem.CELL_SIZE);
      const cy = Math.floor(e.y / SwarmSeparationSystem.CELL_SIZE);
      let totalDx = 0;
      let totalDy = 0;

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const neighbors = grid.get(`${cx + ox},${cy + oy}`);
          if (!neighbors) continue;

          for (const other of neighbors) {
            if (other.id === e.id) continue;

            const dx = e.x - other.x;
            const dy = e.y - other.y;
            const distSq = dx * dx + dy * dy;
            const minDist = e.radius + other.radius;

            if (distSq < minDist * minDist && distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              // Mass-weighted soft spring repulsion
              const weight = other.isStatic ? 1.0 : other.mass / (e.mass + other.mass);
              const force = overlap * SwarmSeparationSystem.REPULSION_STRENGTH * weight;

              totalDx += nx * force * dt;
              totalDy += ny * force * dt;
            } else if (distSq <= 0.00001) {
              // Direct center overlap jitter
              const angle = Math.random() * Math.PI * 2;
              totalDx += Math.cos(angle) * 0.15;
              totalDy += Math.sin(angle) * 0.15;
            }
          }
        }
      }

      if (totalDx !== 0 || totalDy !== 0) {
        displacements.set(e.id, { dx: totalDx, dy: totalDy });
      }
    }

    // 5. Apply Repulsive Displacements with Wall Bounds Protection
    for (const [id, disp] of displacements.entries()) {
      const transform = world.transforms.get(id);
      const pos = world.gridPositions.get(id);
      const visual = world.visuals.get(id);
      if (!pos) continue;

      const curX = transform ? transform.x : pos.x;
      const curY = transform ? transform.y : pos.y;

      let nextX = curX + disp.dx;
      let nextY = curY + disp.dy;

      // Ensure entity stays within facility boundaries
      nextX = Math.max(1.2, Math.min(MAP_WIDTH - 2.2, nextX));
      nextY = Math.max(1.2, Math.min(MAP_HEIGHT - 2.2, nextY));

      const tx = Math.floor(nextX);
      const ty = Math.floor(nextY);

      if (map[ty]?.[tx]?.wallEntityId !== null) {
        // Attempt slide along open axis
        if (map[Math.floor(curY)]?.[tx]?.wallEntityId === null) {
          nextY = curY;
        } else if (map[ty]?.[Math.floor(curX)]?.wallEntityId === null) {
          nextX = curX;
        } else {
          nextX = curX;
          nextY = curY;
        }
      }

      if (transform) {
        transform.x = nextX;
        transform.y = nextY;
      }
      pos.x = nextX;
      pos.y = nextY;

      if (visual) {
        visual.renderX = nextX;
        visual.renderY = nextY;
      }
    }
  }
}
