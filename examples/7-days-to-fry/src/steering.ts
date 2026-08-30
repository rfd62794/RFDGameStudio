/**
 * @file src/steering.ts
 * Layer 2 — Continuous Spatial Blend (60Hz)
 * Calculates steering forces (Seek + Avoidance) for worker spatial movement.
 * Strictly separate from task selection logic (Layer 1).
 */

import { Customer, KitchenState, ManagerState, Station, StationId, Worker } from './types';
import {
  AVOID_CLAIMED_STATION_DIST,
  AVOID_CLAIMED_STATION_WEIGHT,
  AVOID_WORKERS_DIST,
  AVOID_WORKERS_WEIGHT,
  BATHROOM_QUEUE_WAYPOINTS,
  CUSTOMER_MAX_FORCE,
  CUSTOMER_MAX_SPEED,
  CUSTOMER_RADIUS,
  ENTRANCE_POS,
  EXIT_POS,
  KITCHEN_HEIGHT,
  KITCHEN_WIDTH,
  MANAGER_DEFAULT_POS,
  MANAGER_SUPERVISION_RADIUS,
  MANAGER_TARGET_HYSTERESIS_MARGIN,
  MANAGER_TARGET_MAX_LOCK_SECONDS,
  QUEUE_WAYPOINTS,
  SEEK_FORCE_WEIGHT,
  STAFF_AREA,
  STATION_CONFIGS,
  WORKER_MAX_FORCE,
  WORKER_MAX_SPEED,
  WORKER_RADIUS,
} from './data';
import { scoreWorkerSupervisionPriority } from './utilityScoring';

export interface Vector2D {
  x: number;
  y: number;
}

export interface SteeringEntity {
  id?: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

/**
 * Calculates Seek steering force towards target coordinates.
 */
export function forceSeek(e: SteeringEntity, target: Vector2D, maxSpeed = WORKER_MAX_SPEED): Vector2D {
  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1e-4) return { x: 0, y: 0 };

  const currentVx = e.vx || 0;
  const currentVy = e.vy || 0;

  // Desired velocity towards target at max speed
  const desiredVx = (dx / dist) * maxSpeed;
  const desiredVy = (dy / dist) * maxSpeed;

  // Steering force = desired velocity - current velocity
  let fx = (desiredVx - currentVx) * SEEK_FORCE_WEIGHT;
  let fy = (desiredVy - currentVy) * SEEK_FORCE_WEIGHT;

  return { x: fx, y: fy };
}

/**
 * Calculates Separation force to avoid colliding with other entities.
 */
export function forceAvoid(e: SteeringEntity, others: SteeringEntity[], avoidDist = AVOID_WORKERS_DIST, maxSpeed = WORKER_MAX_SPEED): Vector2D {
  let totalFx = 0;
  let totalFy = 0;

  for (const other of others) {
    if (e.id && other.id === e.id) continue;

    const dx = e.x - other.x;
    const dy = e.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0 && dist < avoidDist) {
      // Repulsive force inversely proportional to distance
      const pushStrength = (avoidDist - dist) / avoidDist;
      totalFx += (dx / dist) * pushStrength * maxSpeed * AVOID_WORKERS_WEIGHT;
      totalFy += (dy / dist) * pushStrength * maxSpeed * AVOID_WORKERS_WEIGHT;
    }
  }

  return { x: totalFx, y: totalFy };
}

/**
 * Calculates Avoidance force for stations claimed/occupied by other workers.
 * Treats any Station with a non-null `occupiedBy` (other than the worker's own id)
 * as a hard avoid target, unclaimed stations as neutral.
 */
export function forceAvoidClaimedResources(w: Worker, stations: Station[]): Vector2D {
  let totalFx = 0;
  let totalFy = 0;

  for (const station of stations) {
    // Exclude station if unoccupied OR if occupied by THIS worker
    if (!station.occupiedBy || station.occupiedBy === w.id) continue;

    const stationCenterX = station.x + station.width / 2;
    const stationCenterY = station.y + station.height / 2;

    const dx = w.x - stationCenterX;
    const dy = w.y - stationCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0 && dist < AVOID_CLAIMED_STATION_DIST) {
      const pushStrength = (AVOID_CLAIMED_STATION_DIST - dist) / AVOID_CLAIMED_STATION_DIST;
      totalFx += (dx / dist) * pushStrength * WORKER_MAX_SPEED * AVOID_CLAIMED_STATION_WEIGHT;
      totalFy += (dy / dist) * pushStrength * WORKER_MAX_SPEED * AVOID_CLAIMED_STATION_WEIGHT;
    }
  }

  return { x: totalFx, y: totalFy };
}

/**
 * Sums all component steering forces into a single resultant force vector.
 */
export function sumForces(...forces: Vector2D[]): Vector2D {
  let fx = 0;
  let fy = 0;

  for (const f of forces) {
    fx += f.x;
    fy += f.y;
  }

  // Cap combined force to WORKER_MAX_FORCE
  const forceMag = Math.sqrt(fx * fx + fy * fy);
  if (forceMag > WORKER_MAX_FORCE) {
    fx = (fx / forceMag) * WORKER_MAX_FORCE;
    fy = (fy / forceMag) * WORKER_MAX_FORCE;
  }

  return { x: fx, y: fy };
}

type TaskTargetResolver = (w: Worker, k: KitchenState) => Vector2D;

const STAFF_AREA_RESOLVER: TaskTargetResolver = () => ({
  x: STAFF_AREA.x + STAFF_AREA.width / 2,
  y: STAFF_AREA.y + STAFF_AREA.height / 2,
});

const TASK_TARGET_RESOLVERS: Record<string, TaskTargetResolver> = {
  drink_coffee: () => ({
    x: STATION_CONFIGS.coffee.x + STATION_CONFIGS.coffee.width / 2,
    y: STATION_CONFIGS.coffee.y + STATION_CONFIGS.coffee.height / 2,
  }),
  clean_mess: (w, k) => {
    if (k.messes && k.messes.length > 0) {
      let nearestMess = k.messes[0];
      let minDist = Infinity;
      for (const m of k.messes) {
        const dx = w.x - m.x;
        const dy = w.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestMess = m;
        }
      }
      return { x: nearestMess.x, y: nearestMess.y };
    }
    return { x: w.x, y: w.y };
  },
  clean_bathroom: () => ({
    x: STATION_CONFIGS.bathroom.x + STATION_CONFIGS.bathroom.width / 2,
    y: STATION_CONFIGS.bathroom.y + STATION_CONFIGS.bathroom.height / 2,
  }),
  use_bathroom: (w, k) => {
    const bathroomStation = STATION_CONFIGS.bathroom;
    const bathroomState = k.stations ? k.stations.find((s) => s.id === 'bathroom') : undefined;
    const isOccupant = bathroomState ? bathroomState.occupiedByWorkerId === w.id : true;

    if (isOccupant) {
      return {
        x: bathroomStation.x + bathroomStation.width / 2,
        y: bathroomStation.y + bathroomStation.height / 2,
      };
    }

    const queue = k.bathroomQueue || [];
    const idx = queue.indexOf(w.id);
    const queueIndex = idx >= 0 ? idx : 0;

    if (queueIndex < BATHROOM_QUEUE_WAYPOINTS.length) {
      return BATHROOM_QUEUE_WAYPOINTS[queueIndex];
    }
    const last = BATHROOM_QUEUE_WAYPOINTS[BATHROOM_QUEUE_WAYPOINTS.length - 1];
    return {
      x: Math.min(750, last.x + (queueIndex - BATHROOM_QUEUE_WAYPOINTS.length + 1) * 25),
      y: last.y,
    };
  },
  rest: STAFF_AREA_RESOLVER,
  eat_meal: STAFF_AREA_RESOLVER,
  drink_water: STAFF_AREA_RESOLVER,
  discharge_meal: STAFF_AREA_RESOLVER,
};

const DEFAULT_STATION_RESOLVER: TaskTargetResolver = (w) => {
  const stationId: StationId = w.currentStation || w.claimedResource || 'queue';
  const config = STATION_CONFIGS[stationId];
  if (config) {
    return {
      x: config.x + config.width / 2,
      y: config.y + config.height / 2 + 15,
    };
  }
  return { x: w.x, y: w.y };
};

/**
 * Gets spatial target destination coordinates based on worker's assigned station or rest task.
 * Uses a data-driven dispatch strategy over task target resolvers.
 */
export function getWorkerTargetPos(w: Worker, k: KitchenState): Vector2D {
  if (w.currentTask && TASK_TARGET_RESOLVERS[w.currentTask]) {
    return TASK_TARGET_RESOLVERS[w.currentTask](w, k);
  }
  return DEFAULT_STATION_RESOLVER(w, k);
}

/**
 * Computes Layer 2 continuous steering vector for a worker.
 */
export function computeWorkerSteering(w: Worker, k: KitchenState): Vector2D {
  const targetPos = getWorkerTargetPos(w, k);
  const seek = forceSeek(w, targetPos);
  const avoidWorkers = forceAvoid(
    w,
    k.workers.filter((o) => o.id !== w.id)
  );
  const avoidClaimed = forceAvoidClaimedResources(w, k.stations);

  return sumForces(seek, avoidWorkers, avoidClaimed);
}

/**
 * Integration helper: Applies computed steering forces to worker kinematics over delta time dt.
 */
export function applyWorkerPhysics(w: Worker, force: Vector2D, dt: number): void {
  // Velocity integration
  w.vx += force.x * dt;
  w.vy += force.y * dt;

  // Cap velocity to MAX_SPEED
  const speed = Math.sqrt(w.vx * w.vx + w.vy * w.vy);
  if (speed > WORKER_MAX_SPEED) {
    w.vx = (w.vx / speed) * WORKER_MAX_SPEED;
    w.vy = (w.vy / speed) * WORKER_MAX_SPEED;
  }

  // Position integration
  w.x += w.vx * dt;
  w.y += w.vy * dt;

  // Dampening / friction when no force
  w.vx *= 0.92;
  w.vy *= 0.92;

  // Boundary constraints
  const minX = WORKER_RADIUS;
  const maxX = KITCHEN_WIDTH - WORKER_RADIUS;
  const minY = WORKER_RADIUS;
  const maxY = KITCHEN_HEIGHT - WORKER_RADIUS;

  if (w.x < minX) {
    w.x = minX;
    w.vx = 0;
  }
  if (w.x > maxX) {
    w.x = maxX;
    w.vx = 0;
  }
  if (w.y < minY) {
    w.y = minY;
    w.vy = 0;
  }
  if (w.y > maxY) {
    w.y = maxY;
    w.vy = 0;
  }
}

/**
 * Gets spatial target destination coordinates based on customer state (waiting, receiving, leaving).
 */
export function getCustomerTargetPos(c: Customer, k: KitchenState): Vector2D {
  if (c.state === 'leaving') {
    return EXIT_POS;
  }
  if (c.state === 'receiving') {
    const windowConfig = STATION_CONFIGS.window;
    return {
      x: windowConfig.x + windowConfig.width / 2,
      y: windowConfig.y + windowConfig.height + 35,
    };
  }
  // c.state === 'waiting'
  const waitingCustomers = k.customers ? k.customers.filter((other) => other.state === 'waiting') : [];
  const idx = waitingCustomers.findIndex((other) => other.id === c.id);
  const queueIndex = idx >= 0 ? idx : 0;
  if (queueIndex < QUEUE_WAYPOINTS.length) {
    return QUEUE_WAYPOINTS[queueIndex];
  }
  const last = QUEUE_WAYPOINTS[QUEUE_WAYPOINTS.length - 1];
  return { x: Math.max(10, last.x - (queueIndex - QUEUE_WAYPOINTS.length + 1) * 18), y: last.y };
}

/**
 * Computes Layer 2 continuous steering vector for a customer.
 */
export function computeCustomerSteering(c: Customer, k: KitchenState): Vector2D {
  const target = getCustomerTargetPos(c, k);
  const seek = forceSeek(c, target, CUSTOMER_MAX_SPEED);
  const avoid = forceAvoid(
    c,
    k.customers ? k.customers.filter((o) => o.id !== c.id) : [],
    20,
    CUSTOMER_MAX_SPEED
  );
  return sumForces(seek, avoid);
}

/**
 * Integration helper: Applies computed steering forces to customer kinematics over delta time dt.
 */
export function applyCustomerPhysics(c: Customer, force: Vector2D, dt: number): void {
  c.vx = (c.vx || 0) + force.x * dt;
  c.vy = (c.vy || 0) + force.y * dt;

  const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
  if (speed > CUSTOMER_MAX_SPEED) {
    c.vx = (c.vx / speed) * CUSTOMER_MAX_SPEED;
    c.vy = (c.vy / speed) * CUSTOMER_MAX_SPEED;
  }

  c.x += c.vx * dt;
  c.y += c.vy * dt;

  c.vx *= 0.90;
  c.vy *= 0.90;

  const minX = CUSTOMER_RADIUS;
  const maxX = KITCHEN_WIDTH - CUSTOMER_RADIUS;
  const minY = CUSTOMER_RADIUS;
  const maxY = KITCHEN_HEIGHT - CUSTOMER_RADIUS;

  if (c.x < minX) { c.x = minX; c.vx = 0; }
  if (c.x > maxX) { c.x = maxX; c.vx = 0; }
  if (c.y < minY) { c.y = minY; c.vy = 0; }
  if (c.y > maxY) { c.y = maxY; c.vy = 0; }
}

/**
 * Gets target position for manager based on Layer 1 selected task.
 */
export function getManagerTargetPos(m: ManagerState, k: KitchenState): Vector2D {
  if (m.currentTask === 'repair' || (k.committedRepairTask && k.committedRepairTask.remainingSeconds > 0)) {
    if (k.committedRepairTask) {
      const repairStation = k.stations.find((s) => s.id === k.committedRepairTask!.stationId);
      if (repairStation) {
        return {
          x: repairStation.x + repairStation.width / 2,
          y: repairStation.y + repairStation.height / 2,
        };
      }
    }
  }

  if (m.currentTask === 'clean_mess') {
    if (k.messes && k.messes.length > 0) {
      let nearestMess = k.messes[0];
      let minDist = Infinity;
      for (const mess of k.messes) {
        const dx = m.x - mess.x;
        const dy = m.y - mess.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestMess = mess;
        }
      }
      return { x: nearestMess.x, y: nearestMess.y };
    }
    return { x: m.x, y: m.y };
  }

  if (m.currentTask === 'drink_coffee') {
    const coffeeStation = STATION_CONFIGS.coffee;
    return {
      x: coffeeStation.x + coffeeStation.width / 2,
      y: coffeeStation.y + coffeeStation.height / 2,
    };
  }

  if (m.currentTask === 'rest') {
    return {
      x: STAFF_AREA.x + STAFF_AREA.width / 2,
      y: STAFF_AREA.y + STAFF_AREA.height / 2,
    };
  }

  if (m.currentTask === 'supervise') {
    const forceRotate =
      m.currentSuperviseTargetId != null &&
      m.currentSuperviseTargetLockedSeconds >= MANAGER_TARGET_MAX_LOCK_SECONDS;

    let bestWorker: Worker | null = null;
    let bestPriority = -Infinity;

    for (const w of k.workers) {
      if (forceRotate && w.id === m.currentSuperviseTargetId) continue;
      const priority = scoreWorkerSupervisionPriority(w, k, m);
      if (priority > bestPriority) {
        bestPriority = priority;
        bestWorker = w;
      }
    }

    if (!bestWorker && m.currentSuperviseTargetId != null) {
      bestWorker = k.workers.find((w) => w.id === m.currentSuperviseTargetId) ?? null;
    }

    if (!forceRotate && m.currentSuperviseTargetId != null) {
      const currentTarget = k.workers.find((w) => w.id === m.currentSuperviseTargetId);
      if (currentTarget) {
        const currentPriority = scoreWorkerSupervisionPriority(currentTarget, k, m);
        if (bestPriority - currentPriority < MANAGER_TARGET_HYSTERESIS_MARGIN) {
          bestWorker = currentTarget;
        }
      }
    }

    m.currentSuperviseTargetId = bestWorker?.id ?? null;

    if (bestWorker) {
      return { x: bestWorker.x, y: bestWorker.y };
    }
    return MANAGER_DEFAULT_POS;
  }

  if (m.currentTask === 'patrol') {
    // Target nearest worker outside supervision radius
    let nearestUncovered: Worker | null = null;
    let minDist = Infinity;
    for (const w of k.workers) {
      const dx = w.x - m.x;
      const dy = w.y - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > MANAGER_SUPERVISION_RADIUS && dist < minDist) {
        minDist = dist;
        nearestUncovered = w;
      }
    }
    if (nearestUncovered) {
      return { x: nearestUncovered.x, y: nearestUncovered.y };
    }
    return { x: KITCHEN_WIDTH / 2, y: KITCHEN_HEIGHT / 2 };
  }

  return MANAGER_DEFAULT_POS;
}

/**
 * Computes Layer 2 continuous steering vector for Manager.
 */
export function computeManagerSteering(m: ManagerState, k: KitchenState): Vector2D {
  const target = getManagerTargetPos(m, k);
  const seek = forceSeek(m, target, WORKER_MAX_SPEED);
  const avoidWorkers = forceAvoid(
    m,
    k.workers,
    30,
    WORKER_MAX_SPEED
  );
  return sumForces(seek, avoidWorkers);
}

/**
 * Applies computed steering forces to manager kinematics over delta time dt.
 */
export function applyManagerPhysics(m: ManagerState, force: Vector2D, dt: number): void {
  m.vx = (m.vx || 0) + force.x * dt;
  m.vy = (m.vy || 0) + force.y * dt;

  const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
  if (speed > WORKER_MAX_SPEED) {
    m.vx = (m.vx / speed) * WORKER_MAX_SPEED;
    m.vy = (m.vy / speed) * WORKER_MAX_SPEED;
  }

  m.x += m.vx * dt;
  m.y += m.vy * dt;

  m.vx *= 0.92;
  m.vy *= 0.92;

  const minX = WORKER_RADIUS;
  const maxX = KITCHEN_WIDTH - WORKER_RADIUS;
  const minY = WORKER_RADIUS;
  const maxY = KITCHEN_HEIGHT - WORKER_RADIUS;

  if (m.x < minX) { m.x = minX; m.vx = 0; }
  if (m.x > maxX) { m.x = maxX; m.vx = 0; }
  if (m.y < minY) { m.y = minY; m.vy = 0; }
  if (m.y > maxY) { m.y = maxY; m.vy = 0; }
}
