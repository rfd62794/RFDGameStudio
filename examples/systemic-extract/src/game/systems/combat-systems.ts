import { World } from '../ecs';
import { EntityId, TileState } from '../../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';
import { ISystem } from '../core/system-types';
import { sound } from '../audio';
import type { Simulation } from '../simulation/simulation';

/**
 * ADR 007: LINE OF SIGHT (LOS) RAYCAST HELPER
 * Bresenham line intersection testing against structural walls.
 */
export function hasLineOfSight(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  map: TileState[][]
): boolean {
  const ix0 = Math.floor(x0);
  const iy0 = Math.floor(y0);
  const ix1 = Math.floor(x1);
  const iy1 = Math.floor(y1);

  const dx = Math.abs(ix1 - ix0);
  const dy = Math.abs(iy1 - iy0);
  const sx = ix0 < ix1 ? 1 : -1;
  const sy = iy0 < iy1 ? 1 : -1;
  let err = dx - dy;
  let curX = ix0;
  let curY = iy0;

  while (curX !== ix1 || curY !== iy1) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      curX += sx;
    }
    if (e2 < dx) {
      err += dx;
      curY += sy;
    }
    // Blocked if any intermediate grid tile contains an obstructive wall
    if ((curX !== ix1 || curY !== iy1) && map[curY]?.[curX]?.wallEntityId !== null) {
      return false;
    }
  }
  return true;
}

/**
 * SYSTEM 9: ADR 007 AutoTargetSystem (10Hz Tier - 100ms Frequency)
 * Brotato-style autonomous hardpoint matrix: scans 360° LOS for nearest hostile,
 * calculates firing vector, and dispatches recycled projectiles from memory pool.
 */
export class AutoTargetSystem implements ISystem {
  public readonly name = 'AutoTargetSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    if (!sim.isRaidActive || sim.isPlayerDead) return;

    const weapon = world.weapons.get(sim.playerEntityId);
    if (!weapon) return;

    if (weapon.cooldownTimer > 0) {
      weapon.cooldownTimer = Math.max(0, weapon.cooldownTimer - dt);
    }

    if (weapon.cooldownTimer > 0) return;

    const playerPos = world.gridPositions.get(sim.playerEntityId);
    if (!playerPos) return;

    // Scan for nearest hostile combatant within weapon range with clear Line of Sight
    let closestHostileId: EntityId | null = null;
    let closestDistSq = Infinity;
    let targetX = 0;
    let targetY = 0;

    const maxRangeSq = weapon.range * weapon.range;

    for (const [entityId, pos] of world.gridPositions.entries()) {
      if (entityId === sim.playerEntityId) continue;
      const kind = world.kinds.get(entityId);
      if (
        kind !== 'Security' &&
        kind !== 'Crawler' &&
        kind !== 'HiveBlob' &&
        kind !== 'ApexEcho'
      ) {
        continue;
      }
      const health = world.healths.get(entityId);
      if (!health || health.current <= 0) continue;

      const dX = pos.x - playerPos.x;
      const dY = pos.y - playerPos.y;
      const distSq = dX * dX + dY * dY;

      if (distSq <= maxRangeSq && distSq < closestDistSq) {
        if (hasLineOfSight(playerPos.x, playerPos.y, pos.x, pos.y, map)) {
          closestDistSq = distSq;
          closestHostileId = entityId;
          targetX = pos.x;
          targetY = pos.y;
        }
      }
    }

    if (closestHostileId !== null) {
      const projId = world.acquireProjectile();
      if (projId !== null) {
        const proj = world.projectiles.get(projId);
        const visual = world.visuals.get(projId);
        if (proj && visual) {
          const angle = Math.atan2(targetY - playerPos.y, targetX - playerPos.x);
          const vx = Math.cos(angle) * weapon.projectileSpeed;
          const vy = Math.sin(angle) * weapon.projectileSpeed;

          // Resonance Overclock boosts fire rate and damage
          const fireRateMult = 1 + sim.overclockStacks * 0.12;
          const bonusDamage = sim.overclockStacks * 4;
          weapon.cooldownTimer = 1 / (weapon.fireRate * fireRateMult);

          proj.isActive = true;
          proj.element = weapon.element;
          proj.damage = weapon.damage + bonusDamage;
          proj.knockback = weapon.knockback;
          proj.piercing = weapon.piercing;
          proj.startX = playerPos.x + 0.5;
          proj.startY = playerPos.y + 0.5;
          proj.currentX = playerPos.x + 0.5;
          proj.currentY = playerPos.y + 0.5;
          proj.vx = vx;
          proj.vy = vy;
          proj.range = weapon.range;
          proj.distanceTraveled = 0;
          proj.sourceEntityId = sim.playerEntityId;
          proj.hitEntityIds.clear();

          visual.renderX = playerPos.x + 0.5;
          visual.renderY = playerPos.y + 0.5;
          visual.facingAngle = angle;
          visual.colorOverride = weapon.element === 'plasma' ? '#22d3ee' : '#fbbf24';

          // Visual muzzle discharge & sound
          const pColor = weapon.element === 'plasma' ? '#22d3ee' : '#fbbf24';
          sim.spawnParticles(playerPos.x + 0.5, playerPos.y + 0.5, 4, 'spark', pColor);

          if (weapon.element === 'plasma') {
            sound.playPlasmaFire();
          } else {
            sound.playKineticFire();
          }
        }
      }
    }
  }
}

/**
 * SYSTEM 10: ADR 007 ProjectileSystem (60Hz Tier - Real-time Frame Precision)
 * DIVERT Grid-Snap Hit Registration & Elemental Rock-Paper-Scissors:
 * - Kinetic: 1.6x dmg vs Crawlers/Blobs, knockback push, non-piercing
 * - Plasma: 1.8x-2.0x dmg vs Armor/Apex, 0.5x vs Organics, penetrates targets
 */
export class ProjectileSystem implements ISystem {
  public readonly name = 'ProjectileSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    if (!sim.isRaidActive) return;

    for (const [id, proj] of world.projectiles.entries()) {
      if (!proj.isActive) continue;

      const visual = world.visuals.get(id);

      // Sub-tile ballistics movement
      const stepX = proj.vx * dt;
      const stepY = proj.vy * dt;
      proj.currentX += stepX;
      proj.currentY += stepY;
      proj.distanceTraveled += Math.hypot(stepX, stepY);

      if (visual) {
        visual.renderX = proj.currentX;
        visual.renderY = proj.currentY;
      }

      // Max Range cutoff
      if (proj.distanceTraveled >= proj.range) {
        world.releaseProjectile(id);
        continue;
      }

      // Grid-Snap Collision Registration (DIVERT O(1) Matrix Lookup)
      const tileX = Math.floor(proj.currentX);
      const tileY = Math.floor(proj.currentY);

      // Out of bounds check
      if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
        world.releaseProjectile(id);
        continue;
      }

      // Wall Collision & Destructible breaching
      const tile = map[tileY]?.[tileX];
      if (!tile) {
        world.releaseProjectile(id);
        continue;
      }
      if (tile.wallEntityId !== null) {
        const wallHealth = world.healths.get(tile.wallEntityId);
        if (wallHealth) {
          wallHealth.current -= proj.damage * 0.4;
          if (wallHealth.current <= 0) {
            sim.demolishWall(tileX, tileY, tile.wallEntityId, 'breached');
          }
        }
        sound.playRicochet();
        sim.spawnParticles(
          proj.currentX,
          proj.currentY,
          6,
          'spark',
          proj.element === 'plasma' ? '#22d3ee' : '#e2e8f0'
        );
        world.releaseProjectile(id);
        continue;
      }

      // Hit Registration (Hostile vs Operative OR Operative vs Hostiles)
      if (proj.isHostile) {
        // ADR 008: Hostile Projectile -> Operative Hit Registration
        // Friendly Fire Guard: Hostiles CANNOT damage other hostiles
        const playerPos = world.gridPositions.get(sim.playerEntityId);
        if (playerPos && !proj.hitEntityIds.has(sim.playerEntityId)) {
          const dX = Math.abs(proj.currentX - (playerPos.x + 0.5));
          const dY = Math.abs(proj.currentY - (playerPos.y + 0.5));

          if (dX <= 0.65 && dY <= 0.65) {
            proj.hitEntityIds.add(sim.playerEntityId);

            const playerHealth = world.healths.get(sim.playerEntityId);
            const playerVisual = world.visuals.get(sim.playerEntityId);

            if (playerHealth && playerHealth.current > 0) {
              // Sector 02 armor matrix & rig shielding:
              // Lead-shielded Hazmat rig absorbs 4 armor, base rig absorbs 2 armor
              const armorMitigation = sim.hasHazmatSuit ? 4 : 2;
              const finalDamage = Math.max(3, Math.round(proj.damage - armorMitigation));

              playerHealth.current = Math.max(0, playerHealth.current - finalDamage);
              if (playerVisual) playerVisual.flashTime = 0.25;

              // Kinetic knockback displacement against player
              if (proj.knockback > 0) {
                const pushX = Math.sign(proj.vx);
                const pushY = Math.sign(proj.vy);
                const knockX = playerPos.x + (Math.abs(proj.vx) >= Math.abs(proj.vy) ? pushX : 0);
                const knockY = playerPos.y + (Math.abs(proj.vy) > Math.abs(proj.vx) ? pushY : 0);

                const iknockX = Math.floor(knockX);
                const iknockY = Math.floor(knockY);
                if (
                  iknockX >= 0 &&
                  iknockX < MAP_WIDTH &&
                  iknockY >= 0 &&
                  iknockY < MAP_HEIGHT &&
                  map[iknockY]?.[iknockX]?.wallEntityId === null
                ) {
                  playerPos.x = knockX;
                  playerPos.y = knockY;
                  const pt = world.transforms.get(sim.playerEntityId);
                  if (pt) {
                    pt.x = knockX;
                    pt.y = knockY;
                  }
                }
              }

              // Visual impact & audio
              const pColor = proj.element === 'plasma' ? '#c084fc' : '#ef4444';
              sim.spawnParticles(playerPos.x + 0.5, playerPos.y + 0.5, 8, 'spark', pColor);
              sound.playMeleeHit();

              const attackerName =
                proj.sourceEntityId === sim.apexEntityId ? 'The Apex Echo' : 'Echo Guard';
              const weaponDesc =
                proj.element === 'plasma' ? 'Plasma Singularity' : 'Sub-Space Slug';

              sim.addLog(
                'damage',
                `${attackerName} struck operative with ${weaponDesc} for ${finalDamage} DMG! [HP: ${Math.round(playerHealth.current)}/${playerHealth.max}]`
              );

              if (playerHealth.current <= 0) {
                sim.isPlayerDead = true;
                sim.isRaidActive = false;
                sim.addLog('damage', 'CRITICAL: Operative neutralized by hostile ballistics!');
              }
            }

            if (!proj.piercing) {
              world.releaseProjectile(id);
              continue;
            }
          }
        }
      } else {
        // Operative Projectile -> Hostile Entity Hit Registration (ADR 007)
        for (const [targetId, pos] of world.gridPositions.entries()) {
          if (targetId === proj.sourceEntityId) continue;
          if (proj.hitEntityIds.has(targetId)) continue;

          const kind = world.kinds.get(targetId);
          if (
            kind !== 'Security' &&
            kind !== 'Crawler' &&
            kind !== 'HiveBlob' &&
            kind !== 'ApexEcho'
          ) {
            continue;
          }

          const dX = Math.abs(proj.currentX - (pos.x + 0.5));
          const dY = Math.abs(proj.currentY - (pos.y + 0.5));

          if (dX <= 0.65 && dY <= 0.65) {
            proj.hitEntityIds.add(targetId);

            const health = world.healths.get(targetId);
            const targetVisual = world.visuals.get(targetId);
            const resistance = world.resistances.get(targetId) || {
              kineticMult: kind === 'Crawler' || kind === 'HiveBlob' ? 1.6 : 0.6,
              plasmaMult: kind === 'Crawler' || kind === 'HiveBlob' ? 0.5 : 1.8,
              armor: kind === 'Crawler' || kind === 'HiveBlob' ? 0 : 3,
            };

            if (health && health.current > 0) {
              // Elemental Rock-Paper-Scissors matrix
              const effectiveDmgBeforeMult = Math.max(1, proj.damage - resistance.armor);
              const mult = proj.element === 'plasma' ? resistance.plasmaMult : resistance.kineticMult;
              const finalDamage = Math.max(1, Math.round(effectiveDmgBeforeMult * mult));

              health.current = Math.max(0, health.current - finalDamage);
              if (targetVisual) targetVisual.flashTime = 0.2;

              // Kinetic Knockback (Anti-Organic displacement)
              if (
                proj.element === 'kinetic' &&
                proj.knockback > 0 &&
                kind !== 'ApexEcho' &&
                kind !== 'HiveBlob'
              ) {
                const pushX = Math.sign(proj.vx);
                const pushY = Math.sign(proj.vy);
                const knockX = pos.x + (Math.abs(proj.vx) >= Math.abs(proj.vy) ? pushX : 0);
                const knockY = pos.y + (Math.abs(proj.vy) > Math.abs(proj.vx) ? pushY : 0);

                const iknockX = Math.floor(knockX);
                const iknockY = Math.floor(knockY);
                if (
                  iknockX >= 0 &&
                  iknockX < MAP_WIDTH &&
                  iknockY >= 0 &&
                  iknockY < MAP_HEIGHT &&
                  map[iknockY]?.[iknockX]?.wallEntityId === null
                ) {
                  pos.x = knockX;
                  pos.y = knockY;
                  const t = world.transforms.get(id);
                  if (t) {
                    t.x = knockX;
                    t.y = knockY;
                  }
                }
              }

              // Impact Particles & Audio
              const pColor = proj.element === 'plasma' ? '#22d3ee' : '#fbbf24';
              sim.spawnParticles(pos.x + 0.5, pos.y + 0.5, 8, 'spark', pColor);

              if (kind === 'Crawler') {
                sound.playCrawlerHit();
              } else {
                sound.playMeleeHit();
              }

              const targetName =
                kind === 'ApexEcho'
                  ? 'Apex Echo'
                  : kind === 'HiveBlob'
                  ? 'Hive Node'
                  : kind === 'Crawler'
                  ? 'Resonance Crawler'
                  : 'Echo Guard';

              const elemDesc =
                proj.element === 'plasma' ? 'Plasma Beam pierced' : 'Kinetic Round shredded';
              sim.addLog(
                'damage',
                `${elemDesc} ${targetName} for ${finalDamage} DMG (${mult}x)! [HP: ${Math.round(health.current)}/${health.max}]`
              );

              // Alert AI to source position
              const ai = world.aiComponents.get(targetId);
              if (ai && ai.state !== 'chase') {
                ai.state = 'chase';
                ai.lastKnownPlayerPos = { x: Math.floor(proj.startX), y: Math.floor(proj.startY) };
                ai.alertTimer = 8.0;
              }

              if (health.current <= 0) {
                sim.eliminateHostileEntity(targetId, pos.x, pos.y);
              }
            }

            // If non-piercing (Kinetic Scattergun), projectile ceases upon first collision
            if (!proj.piercing) {
              world.releaseProjectile(id);
              break;
            }
          }
        }
      }
    }
  }
}
