import { World } from '../ecs';
import { EntityId, GridPosition, TileState, HazardState, WeaponHardpoint } from '../../types';
import { ISystem } from '../core/system-types';
import { sound } from '../audio';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 5: Echo AI Patrol & Hostile Tracking Loop (10Hz)
 * ADR 003: Sub-frequency execution (100ms) to protect main-thread framerate.
 * Loop: Check Hazards (flee) -> Scan LOS -> Patrol routes.
 */
export class AiPatrolSystem implements ISystem {
  public readonly name = 'AiPatrolSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    if (sim.currentMapType === 'overworld') return;
    const playerPos = world.gridPositions.get(sim.playerEntityId);
    if (!playerPos) return;

    for (const [guardId, ai] of world.aiComponents.entries()) {
      const guardPos = world.gridPositions.get(guardId);
      const guardVisual = world.visuals.get(guardId);
      const guardHealth = world.healths.get(guardId);
      if (!guardPos || !guardVisual || !guardHealth || guardHealth.current <= 0) continue;

      const kind = world.kinds.get(guardId);
      const isApex = kind === 'ApexEcho';
      const isCrawler = kind === 'Crawler';

      if (ai.attackCooldown > 0) {
        ai.attackCooldown -= dt;
      }

      // ADR 008: Hostile Weapon Hardpoint Cooldown Tick
      const weapon = world.weapons.get(guardId);
      if (weapon && weapon.cooldownTimer > 0) {
        weapon.cooldownTimer = Math.max(0, weapon.cooldownTimer - dt);
      }

      // Apex Boss Periodic Volatile Gas Vent (every 6.0s)
      if (isApex) {
        if (typeof (ai as any).gasVentTimer !== 'number') {
          (ai as any).gasVentTimer = 6.0;
        }
        (ai as any).gasVentTimer -= dt;
        if ((ai as any).gasVentTimer <= 0) {
          (ai as any).gasVentTimer = 6.0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (Math.abs(dx) + Math.abs(dy) <= 3) {
                sim.deployGas(guardPos.x + dx, guardPos.y + dy, 8.0);
              }
            }
          }
          sim.spawnParticles(guardPos.x + 0.5, guardPos.y + 0.5, 16, 'smoke', '#84cc16');
          sim.addLog('fire', 'APEX VENT: The Apex Echo radiated a dense wave of Volatile Gas!');
        }
      }

      // STEP 1: Check current tile for hazardous conditions (Apex Echo ignores hazards)
      const gx = Math.floor(guardPos.x);
      const gy = Math.floor(guardPos.y);
      const currentTile = map[gy]?.[gx];
      if (!isApex && currentTile && (currentTile.hazard === HazardState.Fire || currentTile.hazard === HazardState.PoisonGas)) {
        this.fleeFromHazard(guardId, guardPos, map, sim);
        continue;
      }

      // STEP 2: Scan Line-of-Sight for hostile Factions (Player)
      const distToPlayer = Math.hypot(playerPos.x - guardPos.x, playerPos.y - guardPos.y);
      const canSeePlayer =
        isApex ||
        (distToPlayer <= ai.visionRange &&
          (isCrawler || sim.hasLineOfSight(guardPos.x, guardPos.y, playerPos.x, playerPos.y)));

      if (canSeePlayer) {
        ai.state = 'chase';
        ai.lastKnownPlayerPos = { ...playerPos };
        ai.alertTimer = isApex ? 999 : 6.0;

        if (distToPlayer <= 1.5) {
          // Melee attack range
          if (ai.attackCooldown <= 0) {
            ai.attackCooldown = isCrawler ? 0.9 : isApex ? 1.8 : 1.2;
            const playerHealth = world.healths.get(sim.playerEntityId);
            const playerVisual = world.visuals.get(sim.playerEntityId);
            if (playerHealth) {
              const damage = isCrawler ? 8 : isApex ? 25 : 15;
              playerHealth.current = Math.max(0, playerHealth.current - damage);
              if (playerVisual) playerVisual.flashTime = 0.25;

              if (isCrawler) sound.playCrawlerHit();
              else sound.playMeleeHit();

              const attackerName = isApex ? 'The Apex Echo' : isCrawler ? 'Resonance Crawler' : 'Echo Guard';
              sim.addLog('damage', `${attackerName} struck operative for ${damage} damage!`);
              sim.spawnParticles(playerPos.x + 0.5, playerPos.y + 0.5, 8, 'spark', isApex ? '#a855f7' : '#ef4444');
            }
          }
        } else if (weapon && distToPlayer <= weapon.range && sim.hasLineOfSight(guardPos.x, guardPos.y, playerPos.x, playerPos.y)) {
          // ADR 008: Hostile Autonomous Ranged Fire Loop
          // Halt movement to aim and fire, enabling strategic cover and evasion tactics for the operative
          guardVisual.facingAngle = Math.atan2(playerPos.y - guardPos.y, playerPos.x - guardPos.x);

          if (weapon.cooldownTimer <= 0) {
            weapon.cooldownTimer = 1 / weapon.fireRate;
            this.fireHostileProjectile(guardId, guardPos, playerPos, weapon, isApex, world, sim);
          }
        } else {
          // Move towards player (Apex ignores hazards; guards avoid fire/gas)
          this.moveTowards(guardId, guardPos, playerPos.x, playerPos.y, !isApex, map, sim);
        }
        continue;
      }

      // STEP 3: Alert state if lost sight but alert timer remaining
      if (ai.alertTimer > 0) {
        ai.alertTimer -= dt;
        if (ai.lastKnownPlayerPos) {
          if (guardPos.x === ai.lastKnownPlayerPos.x && guardPos.y === ai.lastKnownPlayerPos.y) {
            ai.lastKnownPlayerPos = null;
          } else {
            this.moveTowards(guardId, guardPos, ai.lastKnownPlayerPos.x, ai.lastKnownPlayerPos.y, !isApex, map, sim);
            continue;
          }
        }
      }

      // STEP 4: Default Patrol Routine
      ai.state = 'patrol';
      if (ai.patrolRoute && ai.patrolRoute.length > 0) {
        const targetWaypoint = ai.patrolRoute[ai.currentRouteIndex];
        const atWaypoint = Math.hypot(guardPos.x - targetWaypoint.x, guardPos.y - targetWaypoint.y) < 0.8;
        if (atWaypoint) {
          ai.currentRouteIndex = (ai.currentRouteIndex + 1) % ai.patrolRoute.length;
        } else {
          this.moveTowards(guardId, guardPos, targetWaypoint.x, targetWaypoint.y, true, map, sim);
        }
      }
    }
  }

  private fleeFromHazard(guardId: EntityId, currentPos: GridPosition, map: TileState[][], sim: Simulation) {
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    const cx = Math.floor(currentPos.x);
    const cy = Math.floor(currentPos.y);

    for (const dir of directions) {
      const nx = cx + dir.x;
      const ny = cy + dir.y;
      if (sim.isTileWalkable(nx, ny) && map[ny]?.[nx]?.hazard === HazardState.None) {
        currentPos.x = nx;
        currentPos.y = ny;
        const transform = sim.world.transforms.get(guardId);
        if (transform) {
          transform.x = nx;
          transform.y = ny;
        }
        break;
      }
    }
  }

  private moveTowards(
    guardId: EntityId,
    currentPos: GridPosition,
    targetX: number,
    targetY: number,
    avoidHazards: boolean,
    map: TileState[][],
    sim: Simulation
  ) {
    const cx = Math.floor(currentPos.x);
    const cy = Math.floor(currentPos.y);
    const tx = Math.floor(targetX);
    const ty = Math.floor(targetY);

    const dx = tx - cx;
    const dy = ty - cy;

    const primaryAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    const sX = Math.sign(dx) || (Math.random() < 0.5 ? 1 : -1);
    const sY = Math.sign(dy) || (Math.random() < 0.5 ? 1 : -1);
    const primaryStep = primaryAxis === 'x' ? { x: sX, y: 0 } : { x: 0, y: sY };
    const secondaryStep = primaryAxis === 'x' ? { x: 0, y: sY } : { x: sX, y: 0 };
    const altStep1 = primaryAxis === 'x' ? { x: 0, y: -sY } : { x: -sX, y: 0 };
    const altStep2 = primaryAxis === 'x' ? { x: -sX, y: 0 } : { x: 0, y: -sY };

    const candidates = [primaryStep, secondaryStep, altStep1, altStep2];

    for (const step of candidates) {
      if (step.x === 0 && step.y === 0) continue;
      const nextX = cx + step.x;
      const nextY = cy + step.y;

      if (sim.isTileWalkable(nextX, nextY)) {
        if (avoidHazards) {
          const targetTileHazard = map[nextY]?.[nextX]?.hazard;
          if (targetTileHazard === HazardState.Fire || targetTileHazard === HazardState.PoisonGas) {
            continue; // Route around environmental hazards
          }
        }
        currentPos.x = nextX;
        currentPos.y = nextY;
        const transform = sim.world.transforms.get(guardId);
        if (transform) {
          transform.x = nextX;
          transform.y = nextY;
        }
        return;
      }
    }
  }

  private fireHostileProjectile(
    guardId: EntityId,
    guardPos: GridPosition,
    playerPos: GridPosition,
    weapon: WeaponHardpoint,
    isApex: boolean,
    world: World,
    sim: Simulation
  ) {
    const projId = world.acquireProjectile();
    if (projId === null) return;

    const proj = world.projectiles.get(projId);
    const visual = world.visuals.get(projId);
    if (!proj || !visual) return;

    const originX = guardPos.x + 0.5;
    const originY = guardPos.y + 0.5;
    const targetX = playerPos.x + 0.5;
    const targetY = playerPos.y + 0.5;

    const angle = Math.atan2(targetY - originY, targetX - originX);
    const vx = Math.cos(angle) * weapon.projectileSpeed;
    const vy = Math.sin(angle) * weapon.projectileSpeed;

    proj.isActive = true;
    proj.isHostile = true;
    proj.element = weapon.element;
    proj.damage = weapon.damage;
    proj.knockback = weapon.knockback;
    proj.piercing = weapon.piercing;
    proj.startX = originX;
    proj.startY = originY;
    proj.currentX = originX;
    proj.currentY = originY;
    proj.vx = vx;
    proj.vy = vy;
    proj.range = weapon.range;
    proj.distanceTraveled = 0;
    proj.sourceEntityId = guardId;
    proj.hitEntityIds.clear();

    visual.renderX = originX;
    visual.renderY = originY;
    visual.facingAngle = angle;
    visual.colorOverride = isApex ? '#a855f7' : '#ef4444';

    // Muzzle discharge sparks & sound
    const muzzleColor = isApex ? '#c084fc' : '#f87171';
    sim.spawnParticles(originX, originY, isApex ? 6 : 4, 'spark', muzzleColor);

    sound.playHostileFire();

    if (isApex) {
      sim.addLog('fire', 'APEX BARRAGE: The Apex Echo fired its Sub-Space Cannon!');
    }
  }
}
