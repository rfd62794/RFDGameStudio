import { Ant, Chamber, Colony, Egg, Nest, SimConfig, Tunnel, WayPoint } from './types';

export class TunnelNetwork {
  constructor(public config: SimConfig) {}

  public initChambersAndTunnels(colony: Colony): void {
    const cx = this.config.width / 2;
    const sy = colony.surfaceY;
    const dir = colony.direction;

    colony.chambers = [
      {
        id: 1,
        name: 'Granary Storage',
        chamberType: 'storage',
        x: cx - 200,
        y: sy + dir * 140,
        width: 100,
        height: 70,
      },
      {
        id: 2,
        name: 'Nursery',
        chamberType: 'nursery',
        x: cx,
        y: sy + dir * 140,
        width: 110,
        height: 75,
      },
      {
        id: 3,
        name: 'Royal Chamber',
        chamberType: 'queen',
        x: cx + 200,
        y: sy + dir * 140,
        width: 100,
        height: 70,
      },
    ];

    const queenChamber = colony.chambers.find(c => c.chamberType === 'queen') || colony.chambers[2];
    colony.queen = {
      x: queenChamber.x,
      y: queenChamber.y,
      radius: 18,
      queenHealth: 1.0,
      isDead: false,
      zeroHealthElapsedSeconds: 0,
    };

    const entranceWaypoint: WayPoint = { x: cx, y: sy };
    const storageCenter: WayPoint = { x: colony.chambers[0].x, y: colony.chambers[0].y };
    const nurseryCenter: WayPoint = { x: colony.chambers[1].x, y: colony.chambers[1].y };
    const queenCenter: WayPoint = { x: colony.chambers[2].x, y: colony.chambers[2].y };

    colony.tunnels = [
      {
        id: 1,
        chamberAId: 0,
        chamberBId: 1,
        waypoints: [
          entranceWaypoint,
          { x: cx - 100, y: sy + dir * 70 },
          storageCenter,
        ],
      },
      {
        id: 2,
        chamberAId: 1,
        chamberBId: 2,
        waypoints: [
          storageCenter,
          { x: cx - 100, y: sy + dir * 140 },
          nurseryCenter,
        ],
      },
      {
        id: 3,
        chamberAId: 2,
        chamberBId: 3,
        waypoints: [
          nurseryCenter,
          { x: cx + 100, y: sy + dir * 140 },
          queenCenter,
        ],
      },
    ];
  }

  public selectFoodReturnChamber(queenHealth: number | undefined, colony: Colony): number {
    const qHealth = queenHealth !== undefined ? queenHealth : colony.queen.queenHealth;

    if (colony.queen.isDead) {
      const storagePull = 1.0;
      const nurseryEggs = colony.eggs.filter(e => e.state === 'nursery');
      let nurseryPull = 0.0;
      if (nurseryEggs.length > 0) {
        const candidate = nurseryEggs.find(e => e.isRoyalCandidate);
        if (candidate) {
          const clampedCare = Math.min(1.0, Math.max(0, candidate.careLevel ?? 1.0));
          nurseryPull = (1.0 - clampedCare) * 6.0 + 3.0;
        } else {
          const minCare = Math.min(...nurseryEggs.map(e => e.careLevel ?? 1.0));
          const clampedCare = Math.min(1.0, Math.max(0, minCare));
          nurseryPull = (1.0 - clampedCare) * 3.0 + 0.1;
        }
      }
      const total = nurseryPull + storagePull;
      if (Math.random() * total < nurseryPull) {
        return 2;
      }
      return 1;
    }

    const clampedHealth = Math.min(1.0, Math.max(0, qHealth));
    const queenPull = (1.0 - clampedHealth) * 8.0 + 0.1;
    const storagePull = 1.0;

    const nurseryEggs = colony.eggs.filter(e => e.state === 'nursery');
    let nurseryPull = 0.0;
    if (nurseryEggs.length > 0) {
      const candidate = nurseryEggs.find(e => e.isRoyalCandidate);
      if (candidate) {
        const clampedCare = Math.min(1.0, Math.max(0, candidate.careLevel ?? 1.0));
        nurseryPull = (1.0 - clampedCare) * 5.0 + 2.0;
      } else {
        const minCare = Math.min(...nurseryEggs.map(e => e.careLevel ?? 1.0));
        const clampedCare = Math.min(1.0, Math.max(0, minCare));
        nurseryPull = (1.0 - clampedCare) * 3.0 + 0.1;
      }
    }

    const total = queenPull + nurseryPull + storagePull;
    const rand = Math.random() * total;
    if (rand < queenPull) {
      return 3;
    } else if (rand < queenPull + nurseryPull) {
      return 2;
    }
    return 1;
  }

  public getDigFacePosition(progressFraction: number, colony: Colony): WayPoint {
    const cx = this.config.width / 2;
    const sy = colony.surfaceY;
    const dir = colony.direction;

    const storage: WayPoint = { x: cx - 200, y: sy + dir * 140 };
    const midpoint: WayPoint = { x: cx - 100, y: sy + dir * 70 };
    const entrance: WayPoint = { x: cx, y: sy };

    const len1 = Math.hypot(midpoint.x - storage.x, midpoint.y - storage.y);
    const len2 = Math.hypot(entrance.x - midpoint.x, entrance.y - midpoint.y);
    const totalLen = len1 + len2;

    const p = Math.min(1.0, Math.max(0, progressFraction));
    const d = p * totalLen;

    if (d <= len1) {
      const t = len1 > 0 ? d / len1 : 0;
      return {
        x: storage.x + t * (midpoint.x - storage.x),
        y: storage.y + t * (midpoint.y - storage.y),
      };
    } else {
      const t = len2 > 0 ? (d - len1) / len2 : 0;
      return {
        x: midpoint.x + t * (entrance.x - midpoint.x),
        y: midpoint.y + t * (entrance.y - midpoint.y),
      };
    }
  }

  public getExcavatedTunnelWaypoints(progressFraction: number, colony: Colony): WayPoint[] {
    const cx = this.config.width / 2;
    const sy = colony.surfaceY;
    const dir = colony.direction;

    const storage: WayPoint = { x: cx - 200, y: sy + dir * 140 };
    const midpoint: WayPoint = { x: cx - 100, y: sy + dir * 70 };
    const entrance: WayPoint = { x: cx, y: sy };

    const digFace = this.getDigFacePosition(progressFraction, colony);
    const len1 = Math.hypot(midpoint.x - storage.x, midpoint.y - storage.y);
    const totalLen = len1 + Math.hypot(entrance.x - midpoint.x, entrance.y - midpoint.y);
    const d = Math.min(1.0, Math.max(0, progressFraction)) * totalLen;

    if (d <= len1) {
      return [storage, digFace];
    } else {
      return [storage, midpoint, digFace];
    }
  }

  public getTunnelWaypoints(fromChamberId: number, toChamberId: number, colony: Colony): WayPoint[] {
    if (!colony.nest.tunnelDug && (fromChamberId === 0 || toChamberId === 0)) {
      return [];
    }

    if (fromChamberId === toChamberId) {
      return [];
    }

    type QueueItem = {
      chamberId: number;
      path: { tunnel: Tunnel; forward: boolean }[];
    };

    const visited = new Set<number>();
    const queue: QueueItem[] = [{ chamberId: fromChamberId, path: [] }];
    visited.add(fromChamberId);

    let foundPath: { tunnel: Tunnel; forward: boolean }[] | null = null;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.chamberId === toChamberId) {
        foundPath = current.path;
        break;
      }

      for (const tunnel of colony.tunnels) {
        let nextId: number | null = null;
        let forward = true;
        if (tunnel.chamberAId === current.chamberId) {
          nextId = tunnel.chamberBId;
          forward = true;
        } else if (tunnel.chamberBId === current.chamberId) {
          nextId = tunnel.chamberAId;
          forward = false;
        }

        if (nextId !== null && !visited.has(nextId)) {
          visited.add(nextId);
          queue.push({
            chamberId: nextId,
            path: [...current.path, { tunnel, forward }],
          });
        }
      }
    }

    if (foundPath) {
      const waypoints: WayPoint[] = [];
      for (let i = 0; i < foundPath.length; i++) {
        const step = foundPath[i];
        const stepWaypoints = step.forward ? step.tunnel.waypoints : [...step.tunnel.waypoints].reverse();
        if (i === 0) {
          waypoints.push(...stepWaypoints);
        } else {
          waypoints.push(...stepWaypoints.slice(1));
        }
      }
      return waypoints;
    }

    return [
      { x: colony.nest.x, y: colony.surfaceY },
      { x: colony.chambers[0]?.x ?? colony.nest.x - 200, y: colony.chambers[0]?.y ?? colony.surfaceY + colony.direction * 140 },
    ];
  }

  public setAntWaypointPath(ant: Ant, fromChamberId: number, toChamberId: number, colony: Colony): void {
    const path = this.getTunnelWaypoints(fromChamberId, toChamberId, colony);
    if (path && path.length > 0) {
      ant.waypointPath = path;
      ant.waypointIndex = 0;
    } else {
      ant.waypointPath = undefined;
      ant.waypointIndex = 0;
    }
  }

  public isPointInUndergroundFootprint(px: number, py: number, colony: Colony): boolean {
    // 1. Check chambers
    for (const chamber of colony.chambers) {
      const minX = chamber.x - chamber.width / 2;
      const maxX = chamber.x + chamber.width / 2;
      const minY = chamber.y - chamber.height / 2;
      const maxY = chamber.y + chamber.height / 2;

      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        return true;
      }
    }

    // 2. Check tunnel corridors (radius 12)
    const CORRIDOR_RADIUS = 12;

    for (const tunnel of colony.tunnels) {
      let waypoints: WayPoint[];
      if (tunnel.chamberAId === 0 || tunnel.chamberBId === 0 || tunnel.id === 1) {
        if (!colony.nest.tunnelDug) {
          waypoints = this.getExcavatedTunnelWaypoints(colony.nest.tunnelDugProgress || 0, colony);
        } else {
          waypoints = tunnel.waypoints;
        }
      } else {
        waypoints = tunnel.waypoints;
      }

      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;

        let projX: number;
        let projY: number;

        if (lenSq === 0) {
          projX = p1.x;
          projY = p1.y;
        } else {
          const t = Math.max(0, Math.min(1, ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq));
          projX = p1.x + t * dx;
          projY = p1.y + t * dy;
        }

        const distToSeg = Math.hypot(px - projX, py - projY);
        if (distToSeg <= CORRIDOR_RADIUS) {
          return true;
        }
      }
    }

    return false;
  }

  public enforceUndergroundBoundary(ant: Ant, colony: Colony, enemyColony?: Colony): void {
    const isExemptInfiltrator = (ant.currentAction === 'infiltrate' || ant.currentAction === 'smuggle_home') && enemyColony !== undefined;
    if (!isExemptInfiltrator && enemyColony) {
      const inEnemyTerritory = enemyColony.direction === 1
        ? ant.y >= enemyColony.surfaceY
        : ant.y <= enemyColony.surfaceY;
      if (inEnemyTerritory) {
        ant.y = enemyColony.direction === 1 ? enemyColony.surfaceY - 1 : enemyColony.surfaceY + 1;
        return;
      }
    }

    let targetColony = colony;
    if (isExemptInfiltrator) {
      if (this.isPointInUndergroundFootprint(ant.x, ant.y, enemyColony!)) {
        targetColony = enemyColony!;
      } else if (this.isPointInUndergroundFootprint(ant.x, ant.y, colony)) {
        targetColony = colony;
      } else {
        const isEnemySide = enemyColony!.direction === 1
          ? ant.y >= enemyColony!.surfaceY
          : ant.y <= enemyColony!.surfaceY;
        targetColony = isEnemySide ? enemyColony! : colony;
      }
    }

    const isUnderground = targetColony.direction === 1
      ? ant.y >= targetColony.surfaceY
      : ant.y <= targetColony.surfaceY;

    if (!isUnderground) return;

    if (this.isPointInUndergroundFootprint(ant.x, ant.y, targetColony)) {
      return;
    }

    const px = ant.x;
    const py = ant.y;
    const CORRIDOR_RADIUS = 12;

    let bestX = px;
    let bestY = py;
    let minCandidateDist = Infinity;

    // Chamber candidates
    for (const chamber of targetColony.chambers) {
      const minX = chamber.x - chamber.width / 2;
      const maxX = chamber.x + chamber.width / 2;
      const minY = chamber.y - chamber.height / 2;
      const maxY = chamber.y + chamber.height / 2;

      const cx = Math.max(minX, Math.min(maxX, px));
      const cy = Math.max(minY, Math.min(maxY, py));
      const dist = Math.hypot(px - cx, py - cy);

      if (dist < minCandidateDist) {
        minCandidateDist = dist;
        bestX = cx;
        bestY = cy;
      }
    }

    // Tunnel corridor candidates
    for (const tunnel of targetColony.tunnels) {
      let waypoints: WayPoint[];
      if (tunnel.chamberAId === 0 || tunnel.chamberBId === 0 || tunnel.id === 1) {
        if (!targetColony.nest.tunnelDug) {
          waypoints = this.getExcavatedTunnelWaypoints(targetColony.nest.tunnelDugProgress || 0, targetColony);
        } else {
          waypoints = tunnel.waypoints;
        }
      } else {
        waypoints = tunnel.waypoints;
      }

      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;

        let projX: number;
        let projY: number;

        if (lenSq === 0) {
          projX = p1.x;
          projY = p1.y;
        } else {
          const t = Math.max(0, Math.min(1, ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq));
          projX = p1.x + t * dx;
          projY = p1.y + t * dy;
        }

        const distToSeg = Math.hypot(px - projX, py - projY);
        const distToCorridor = Math.max(0, distToSeg - CORRIDOR_RADIUS);

        if (distToCorridor < minCandidateDist) {
          minCandidateDist = distToCorridor;
          if (distToSeg > 0) {
            bestX = projX + (px - projX) * (CORRIDOR_RADIUS / distToSeg);
            bestY = projY + (py - projY) * (CORRIDOR_RADIUS / distToSeg);
          } else {
            bestX = projX;
            bestY = projY;
          }
        }
      }
    }

    ant.x = bestX;
    ant.y = bestY;
  }

  public processDigging(colony: Colony): void {
    if (colony.nest.tunnelDug) return;

    const maxDiggers = this.config.maxConcurrentDiggers !== undefined ? this.config.maxConcurrentDiggers : 4;
    const targetX = this.config.width / 2;
    const targetY = colony.surfaceY;
    const storageX = targetX - 200;
    const storageY = colony.surfaceY + colony.direction * 140;
    const midpointX = targetX - 100;
    const midpointY = colony.surfaceY + colony.direction * 70;

    const target = this.config.tunnelDigTarget !== undefined ? this.config.tunnelDigTarget : 40;
    const p = Math.min(1.0, Math.max(0, (colony.nest.tunnelDugProgress || 0) / target));
    const digFace = this.getDigFacePosition(p, colony);

    const candidates = colony.ants.filter(a => !a.carryingFood && !a.carryingEgg);
    const selectedDiggers = candidates.slice(0, maxDiggers);
    const remainingCandidates = candidates.slice(maxDiggers);

    let antsActuallyAtTheFace = 0;

    for (const ant of selectedDiggers) {
      ant.currentAction = 'dig_tunnel';

      const distToEntrance = Math.hypot(targetX - ant.x, targetY - ant.y);
      const distToDigFace = Math.hypot(digFace.x - ant.x, digFace.y - ant.y);

      if (distToEntrance <= 12) {
        antsActuallyAtTheFace++;
        ant.x = targetX;
        ant.y = targetY;
        ant.vx = 0;
        ant.vy = 0;
        continue;
      }

      if (distToDigFace <= 12) {
        antsActuallyAtTheFace++;
        ant.x = digFace.x;
        ant.y = digFace.y;
        ant.vx = 0;
        ant.vy = 0;
        continue;
      }

      let destX = digFace.x;
      let destY = digFace.y;

      if (ant.x > storageX + 20) {
        destX = storageX;
        destY = storageY;
      } else {
        const len1 = Math.hypot(midpointX - storageX, midpointY - storageY);
        const totalLen = len1 + Math.hypot(targetX - midpointX, targetY - midpointY);
        const passedMidpointThreshold = colony.direction === 1
          ? ant.y > midpointY + 15
          : ant.y < midpointY - 15;
        if (p * totalLen > len1 && passedMidpointThreshold) {
          destX = midpointX;
          destY = midpointY;
        }
      }

      const dx = destX - ant.x;
      const dy = destY - ant.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 12) {
        ant.x = destX;
        ant.y = destY;
        ant.vx = 0;
        ant.vy = 0;
      } else {
        ant.vx = (dx / dist) * this.config.antSpeed;
        ant.vy = (dy / dist) * this.config.antSpeed;
        ant.x += ant.vx;
        ant.y += ant.vy;
      }
    }

    for (const ant of remainingCandidates) {
      ant.currentAction = 'awaiting_dig_slot';

      const distToEntrance = Math.hypot(targetX - ant.x, targetY - ant.y);
      const distToDigFace = Math.hypot(digFace.x - ant.x, digFace.y - ant.y);

      if (distToEntrance <= 12) {
        ant.x = targetX;
        ant.y = targetY;
        ant.vx = 0;
        ant.vy = 0;
        continue;
      }

      if (distToDigFace <= 12) {
        ant.x = digFace.x;
        ant.y = digFace.y;
        ant.vx = 0;
        ant.vy = 0;
        continue;
      }

      let destX = digFace.x;
      let destY = digFace.y;

      if (ant.x > storageX + 20) {
        destX = storageX;
        destY = storageY;
      } else {
        const len1 = Math.hypot(midpointX - storageX, midpointY - storageY);
        const totalLen = len1 + Math.hypot(targetX - midpointX, targetY - midpointY);
        const passedMidpointThreshold = colony.direction === 1
          ? ant.y > midpointY + 15
          : ant.y < midpointY - 15;
        if (p * totalLen > len1 && passedMidpointThreshold) {
          destX = midpointX;
          destY = midpointY;
        }
      }

      const dx = destX - ant.x;
      const dy = destY - ant.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 12) {
        ant.x = destX;
        ant.y = destY;
        ant.vx = 0;
        ant.vy = 0;
      } else {
        ant.vx = (dx / dist) * this.config.antSpeed;
        ant.vy = (dy / dist) * this.config.antSpeed;
        ant.x += ant.vx;
        ant.y += ant.vy;
      }
    }

    const effectiveDiggers = Math.min(antsActuallyAtTheFace, maxDiggers);
    const digRate = this.config.tunnelDigRatePerAnt !== undefined ? this.config.tunnelDigRatePerAnt : 0.5;
    colony.nest.tunnelDugProgress = (colony.nest.tunnelDugProgress || 0) + digRate * Math.sqrt(effectiveDiggers) * 0.016;

    if (colony.nest.tunnelDugProgress >= target) {
      colony.nest.tunnelDug = true;
    }
  }
}
