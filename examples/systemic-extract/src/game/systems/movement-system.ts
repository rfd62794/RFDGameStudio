import { World } from '../ecs';
import { TileState } from '../../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';
import { ISystem } from '../core/system-types';
import { resolveCircleTileCollision, applyCornerAssistance } from '../core/collision';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 0: Continuous Kinematics & Player Input System (60Hz - ADR 009)
 * Translates analog/WASD input vectors into continuous velocity, resolving
 * silky smooth sliding Circle-vs-AABB tile collisions, internal edge filtering,
 * automatic corner assistance, and entity restitution.
 */
export class PlayerInputSystem implements ISystem {
  public readonly name = 'PlayerInputSystem';
  private static readonly BASE_SPEED = 6.2; // tiles per second
  private static readonly PLAYER_RADIUS = 0.28; // fractional tile radius calibrated for 1-tile corridors

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    if (!sim.isRaidActive || sim.isPlayerDead) return;

    const playerPos = world.gridPositions.get(sim.playerEntityId);
    const playerVisual = world.visuals.get(sim.playerEntityId);
    if (!playerPos || !playerVisual) return;

    let transform = world.transforms.get(sim.playerEntityId);
    if (!transform) {
      transform = {
        x: playerPos.x,
        y: playerPos.y,
        vx: 0,
        vy: 0,
        radius: PlayerInputSystem.PLAYER_RADIUS,
      };
      world.transforms.set(sim.playerEntityId, transform);
    }

    const { x: inX, y: inY } = sim.inputVector;
    if (inX === 0 && inY === 0) {
      transform.vx = 0;
      transform.vy = 0;
      return;
    }

    // Normalize input vector
    const len = Math.hypot(inX, inY);
    const dirX = inX / len;
    const dirY = inY / len;

    const speed = PlayerInputSystem.BASE_SPEED;
    transform.vx = dirX * speed;
    transform.vy = dirY * speed;

    const r = transform.radius || PlayerInputSystem.PLAYER_RADIUS;

    // Sub-stepping (2 steps) for rock-solid collision stability and zero tunneling
    const subSteps = 2;
    const subDt = dt / subSteps;

    let currentX = transform.x;
    let currentY = transform.y;

    for (let step = 0; step < subSteps; step++) {
      // 1. Apply intelligent Corner Assistance to guide operative into corridors and openings
      const assisted = applyCornerAssistance(currentX, currentY, inX, inY, r, subDt, map);
      currentX = assisted.x;
      currentY = assisted.y;

      // 2. Integrate continuous velocity
      const targetX = currentX + transform.vx * subDt;
      const targetY = currentY + transform.vy * subDt;

      // 3. Resolve Circle vs Block-Tile Collision with Internal Edge Filtering
      const colResult = resolveCircleTileCollision(targetX, targetY, r, map, 3);
      currentX = colResult.x;
      currentY = colResult.y;

      // 4. Slide velocity projection if a collision occurred
      if (colResult.collided) {
        const dot = transform.vx * colResult.normalX + transform.vy * colResult.normalY;
        if (dot < 0) {
          transform.vx -= dot * colResult.normalX;
          transform.vy -= dot * colResult.normalY;
        }
      }
    }

    let newX = currentX;
    let newY = currentY;

    // --------------------------------------------------------------------------
    // 5. SOLID OBSTACLE & HOSTILE COMBATANT COLLISION RESTITUTION
    // --------------------------------------------------------------------------
    for (const [entityId, pos] of world.gridPositions.entries()) {
      if (entityId === sim.playerEntityId) continue;
      const kind = world.kinds.get(entityId);
      if (!kind) continue;
      const health = world.healths.get(entityId);
      if (health && health.current <= 0) continue;

      let entRadius = 0;
      let isStatic = false;

      if (kind === 'HiveBlob') {
        entRadius = 0.5;
        isStatic = true;
      } else if (kind === 'ApexEcho') {
        entRadius = 0.72;
        isStatic = true;
      } else if (kind === 'Security') {
        entRadius = 0.35;
      } else if (kind === 'Crawler') {
        entRadius = 0.28;
      }

      if (entRadius > 0) {
        const edx = newX - pos.x;
        const edy = newY - pos.y;
        const edistSq = edx * edx + edy * edy;
        const minEdist = r + entRadius;
        if (edistSq < minEdist * minEdist && edistSq > 0.00001) {
          const edist = Math.sqrt(edistSq);
          const overlap = minEdist - edist;
          const enx = edx / edist;
          const eny = edy / edist;

          if (isStatic) {
            newX += enx * overlap;
            newY += eny * overlap;
          } else {
            newX += enx * overlap * 0.6;
            newY += eny * overlap * 0.6;
            pos.x -= enx * overlap * 0.4;
            pos.y -= eny * overlap * 0.4;
            const entT = world.transforms.get(entityId);
            if (entT) {
              entT.x = pos.x;
              entT.y = pos.y;
            }
          }
        }
      }
    }

    // Final boundary safeguard
    newX = Math.max(r, Math.min(MAP_WIDTH - 1 - r, newX));
    newY = Math.max(r, Math.min(MAP_HEIGHT - 1 - r, newY));

    // Update Transform & GridPosition
    transform.x = newX;
    transform.y = newY;
    playerPos.x = newX;
    playerPos.y = newY;

    // Visuals track transform immediately for 60FPS responsive feel
    playerVisual.renderX = newX;
    playerVisual.renderY = newY;
    playerVisual.facingAngle = Math.atan2(dirY, dirX);

    // Dynamic Melee Bump check with Overclock scaling
    sim.checkContinuousMelee(newX, newY, dt);

    // Item, Spark & Extraction Tile checks
    const tileX = Math.floor(newX + 0.5);
    const tileY = Math.floor(newY + 0.5);
    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
      sim.checkTileInteractions(tileX, tileY);
    }
  }
}
