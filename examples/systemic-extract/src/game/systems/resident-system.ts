import { World } from '../ecs';
import { TileState } from '../../types';
import { ISystem } from '../core/system-types';
import { STRUCTURE_BLUEPRINTS } from '../blueprints';
import { isSolidTile } from '../core/collision';
import { sound } from '../audio';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM: Resident Escort & Rescue System (60Hz - ADR 011)
 * Manages proximity tethering, dynamic follower trailing physics, and
 * Sanctuary entry detection to unlock physical construction blueprints.
 */
export class ResidentSystem implements ISystem {
  public readonly name = 'ResidentSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    if (!sim.isRaidActive || sim.isPlayerDead) return;

    const playerPos = world.gridPositions.get(sim.playerEntityId);
    if (!playerPos) return;

    for (const [resId, resident] of world.residents.entries()) {
      const resPos = world.gridPositions.get(resId);
      const resVisual = world.visuals.get(resId);
      if (!resPos || !resVisual) continue;

      // 1. UNRESCUED & WAITING: Check for player contact proximity (2.0 tiles)
      if (!resident.isRescued && !resident.isFollowing) {
        const distToPlayer = Math.hypot(playerPos.x - resPos.x, playerPos.y - resPos.y);
        if (distToPlayer <= 2.2) {
          resident.isFollowing = true;
          world.followers.set(resId, {
            targetEntityId: sim.playerEntityId,
            desiredDistance: 1.4,
            speed: 5.8,
          });

          sim.addLog(
            'alert',
            `[RESCUE CONTACT] ${resident.name} (${resident.title}) has tethered to your suit! Escort them to the Central Sanctuary!`
          );
          sim.spawnParticles(resPos.x + 0.5, resPos.y + 0.5, 12, 'spark', resident.color);
          sound.playAlert();
        }
      }

      // 2. UNRESCUED & FOLLOWING: Trailing physics toward player
      if (!resident.isRescued && resident.isFollowing) {
        const follower = world.followers.get(resId);
        const targetPos = playerPos;

        const dx = targetPos.x - resPos.x;
        const dy = targetPos.y - resPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > (follower?.desiredDistance || 1.4)) {
          const moveSpeed = follower?.speed || 5.8;
          const stepDist = Math.min(dist, moveSpeed * dt);
          const nx = dx / dist;
          const ny = dy / dist;

          const nextX = resPos.x + nx * stepDist;
          const nextY = resPos.y + ny * stepDist;

          // Simple step test: advance if not walking into a solid wall
          const checkTx = Math.floor(nextX + 0.5);
          const checkTy = Math.floor(nextY + 0.5);

          if (!isSolidTile(map, checkTx, checkTy)) {
            resPos.x = nextX;
            resPos.y = nextY;
          } else {
            // Slide along unobstructed axis
            if (!isSolidTile(map, checkTx, Math.floor(resPos.y + 0.5))) {
              resPos.x = nextX;
            } else if (!isSolidTile(map, Math.floor(resPos.x + 0.5), checkTy)) {
              resPos.y = nextY;
            }
          }

          resVisual.renderX = resPos.x;
          resVisual.renderY = resPos.y;
          resVisual.facingAngle = Math.atan2(ny, nx);
        }

        // 3. CHECK IF ENTERED FARADAY SANCTUARY BOUNDS
        // Sanctuary spans (X: 81-119, Y: 81-119)
        if (resPos.x >= 81 && resPos.x <= 119 && resPos.y >= 81 && resPos.y <= 119) {
          resident.isRescued = true;
          resident.isFollowing = false;
          world.followers.delete(resId);

          // Station resident in designated Sanctuary home alcove
          resPos.x = resident.homeX;
          resPos.y = resident.homeY;
          resVisual.renderX = resident.homeX;
          resVisual.renderY = resident.homeY;

          // Unlock corresponding Construction Blueprint
          const blueprint = STRUCTURE_BLUEPRINTS[resident.unlockedStructureId];
          sim.unlockBlueprint(resident.unlockedStructureId);

          sim.addLog(
            'extract',
            `[SANCTUARY SECURED] ${resident.name} is safe! Unlocked Construction Blueprint: [${blueprint?.name || resident.unlockedStructureId}]!`
          );
          sim.spawnParticles(resPos.x + 0.5, resPos.y + 0.5, 18, 'spark', '#10b981');
          sound.playUpgradeSuccess();
        }
      }

      // 4. RESCUED RESIDENTS: Idle station at home post
      if (resident.isRescued) {
        resVisual.renderX = resident.homeX;
        resVisual.renderY = resident.homeY;
      }
    }
  }
}
