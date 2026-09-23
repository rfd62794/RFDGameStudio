/**
 * @file src/scoring/utilityScoring.ts
 * Pure utility scoring functions for workers and manager.
 */

import {
  BATHROOM_CLEAN_URGENCY_RISE_PER_SECOND,
  BATHROOM_WEAR_CHANCE,
  BLADDER_RISE_PER_MEAL_UNIT,
  BLADDER_URGENCY_MAX_SCORE,
  BLADDER_URGENCY_THRESHOLD,
  CLEAN_BATHROOM_BASE_SCORE,
  CLEAN_BATHROOM_MAX_SCORE,
  CLEAN_MESS_BASE_SCORE,
  COFFEE_BASE_SCORE,
  CONTAGION_EPSILON_FLOOR,
  MANAGER_ACTIVE_VIOLATION_TARGET_BONUS,
  MANAGER_AUTO_REPAIR_BASE,
  MANAGER_COFFEE_BASE_SCORE,
  MANAGER_EMERGENCY_CALL_BONUS,
  MANAGER_PATROL_BASE,
  MANAGER_REST_APPROACHING_THRESHOLD,
  MANAGER_REST_ENCOURAGEMENT_MAX,
  MANAGER_REST_URGENCY_MAX_SCORE,
  MANAGER_REST_URGENCY_THRESHOLD,
  MANAGER_SUPERVISE_BASE,
  MANAGER_SUPERVISION_RADIUS,
  MANAGER_TARGET_PROXIMITY_NORM_RANGE,
  MANAGER_TARGET_PROXIMITY_WEIGHT,
  MANAGER_TARGET_RISK_WEIGHT,
  MEAL_UNIT_COST,
  MEAL_URGENCY_MAX_SCORE,
  MEAL_URGENCY_THRESHOLD,
  REST_APPROACHING_THRESHOLD,
  REST_URGENCY_MAX_SCORE,
  REST_URGENCY_THRESHOLD,
  THIRST_URGENCY_MAX_SCORE,
  THIRST_URGENCY_THRESHOLD,
  WORKER_TYPE_CONFIGS,
} from '../data';
import { KitchenState, ManagerState, StationId, Worker, WorkerType } from '../types';

/**
 * Helper to calculate effective worker stamina (layering temporary coffee boost).
 */
export function getEffectiveStamina(w: Worker): number {
  return Math.min(1.0, w.stamina + (w.coffeeBoostRemaining || 0));
}

/**
 * Calculates manager proximity factor for a worker.
 */
export function managerProximityCurve(w: Worker, k: KitchenState): number {
  const dx = w.x - k.manager.x;
  const dy = w.y - k.manager.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= MANAGER_SUPERVISION_RADIUS) {
    const proximity = 1 - dist / MANAGER_SUPERVISION_RADIUS;
    return 1.0 + proximity * 1.8;
  }
  return 0.4;
}

/**
 * Calculates overall kitchen backpressure curve based on station buffer loads.
 */
export function queueBackpressureCurve(k: KitchenState): number {
  let totalItems = 0;
  let totalCapacity = 0;

  for (const station of k.stations) {
    if (k.unlockedStations && k.unlockedStations[station.id] === false) continue;
    totalItems += station.orders.length;
    totalCapacity += station.bufferCapacity;
  }

  const queueStation = k.stations.find((s) => s.id === 'queue');
  const queueRatio = queueStation ? queueStation.orders.length / queueStation.bufferCapacity : 0;
  const totalRatio = totalCapacity > 0 ? totalItems / totalCapacity : 0;

  const loadFactor = queueRatio * 0.6 + totalRatio * 0.4;
  return 0.15 + loadFactor * 2.5;
}

/**
 * Utility score for Protocol work.
 */
export function scoreProtocol(w: Worker, k: KitchenState, stationId?: StationId): number {
  const policyModifier = Math.max(0.05, 1 - k.policyDial);
  const targetStation = stationId || w.claimedResource || w.currentStation || w.primaryStation;
  let typeBonus = 0;
  if (w.type === 'line_cook' && w.preferredStation && targetStation === w.preferredStation) {
    typeBonus = WORKER_TYPE_CONFIGS.line_cook.stationAffinityBonus * (1 - k.policyDial);
  } else if (w.type === 'csr' && targetStation === 'window') {
    typeBonus = WORKER_TYPE_CONFIGS.csr.stationAffinityBonus * (1 - k.policyDial);
  }

  const baseScore = managerProximityCurve(w, k) * Math.max(0.1, w.morale) + typeBonus;
  return baseScore * policyModifier;
}

/**
 * Utility score for Corner-Cutting work.
 */
export function scoreCornerCut(w: Worker, k: KitchenState): number {
  const contagion = Math.max(CONTAGION_EPSILON_FLOOR, k.peerCorrCutNorm);
  const fatigue = Math.max(0.05, 1 - getEffectiveStamina(w)) + k.policyDial * 0.1;
  const policyModifier = 0.2 + k.policyDial * 1.8;

  return queueBackpressureCurve(k) * fatigue * contagion * policyModifier;
}

/**
 * Utility score for Rest.
 */
export function scoreRest(w: Worker, k: KitchenState): number {
  const effStamina = getEffectiveStamina(w);
  const urgency = Math.max(0, REST_URGENCY_THRESHOLD - effStamina) / REST_URGENCY_THRESHOLD;
  const baseScore = Math.pow(urgency, 2) * REST_URGENCY_MAX_SCORE;

  let encouragementBonus = 0;
  if (effStamina >= REST_URGENCY_THRESHOLD && effStamina < REST_APPROACHING_THRESHOLD) {
    const dx = w.x - k.manager.x;
    const dy = w.y - k.manager.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= MANAGER_SUPERVISION_RADIUS) {
      const proximity = 1 - dist / MANAGER_SUPERVISION_RADIUS;
      encouragementBonus = MANAGER_REST_ENCOURAGEMENT_MAX * (0.357 + proximity * 0.643);
    }
  }

  return baseScore + encouragementBonus;
}

/**
 * Utility score for Drinking Coffee.
 */
export function scoreCoffee(w: Worker, k: KitchenState): number {
  if (k.coffeePotUnits <= 0) return 0;
  const effStamina = getEffectiveStamina(w);
  if (effStamina < REST_URGENCY_THRESHOLD || effStamina >= REST_APPROACHING_THRESHOLD) return 0;
  const bandUrgency = (REST_APPROACHING_THRESHOLD - effStamina) / (REST_APPROACHING_THRESHOLD - REST_URGENCY_THRESHOLD);
  return bandUrgency * COFFEE_BASE_SCORE;
}

/**
 * Utility score for Eating Staff Meal.
 */
export function scoreEatMeal(w: Worker, k: KitchenState): number {
  const hasFood = w.currentMeal || k.wasteBuffer > 0 || (k.mealAvailable && k.mealUnits > 0);
  if (!hasFood) return 0;
  const urgency = Math.max(0, MEAL_URGENCY_THRESHOLD - w.morale) / MEAL_URGENCY_THRESHOLD;
  return Math.pow(urgency, 2) * MEAL_URGENCY_MAX_SCORE;
}

/**
 * Utility score for Drinking Water (Thirst).
 */
export function scoreThirst(w: Worker, k: KitchenState): number {
  const thirst = w.thirst ?? 1.0;
  const urgency = Math.max(0, THIRST_URGENCY_THRESHOLD - thirst) / THIRST_URGENCY_THRESHOLD;
  return Math.pow(urgency, 2) * THIRST_URGENCY_MAX_SCORE;
}

/**
 * Utility score for Using Bathroom.
 */
export function scoreUseBathroom(w: Worker, k: KitchenState): number {
  const bathroom = k.stations.find((s) => s.id === 'bathroom');
  if (!bathroom || bathroom.isOutOfOrder) return 0;
  const bladder = w.bladderPressure ?? 0;
  if (bladder < BLADDER_URGENCY_THRESHOLD) return 0;
  const urgency = Math.max(0, bladder - BLADDER_URGENCY_THRESHOLD) / (1.0 - BLADDER_URGENCY_THRESHOLD);
  return Math.pow(urgency, 2) * BLADDER_URGENCY_MAX_SCORE;
}

/**
 * Utility score for Cleaning Bathroom.
 */
export function scoreCleanBathroom(w: Worker, k: KitchenState): number {
  if ((w.bladderPressure ?? 0) >= BLADDER_URGENCY_THRESHOLD) return 0;
  const bathroom = k.stations.find((s) => s.id === 'bathroom');
  if (!bathroom || !bathroom.isOutOfOrder) return 0;
  const brokenElapsed = bathroom.brokenElapsedSeconds ?? 0;
  const score = CLEAN_BATHROOM_BASE_SCORE + brokenElapsed * BATHROOM_CLEAN_URGENCY_RISE_PER_SECOND;
  const typeBonus = w.type === 'janitor_mechanic' ? WORKER_TYPE_CONFIGS.janitor_mechanic.maintenanceAffinityBonus : 0;
  return Math.min(CLEAN_BATHROOM_MAX_SCORE, score + typeBonus);
}

/**
 * Utility score for Cleaning Messes on the kitchen floor.
 * Works for both Worker and ManagerState.
 */
export function scoreCleanMess(agent: { x: number; y: number; type?: WorkerType }, k: KitchenState): number {
  if (!k.messes || k.messes.length === 0) return 0;
  let minDist = Infinity;
  for (const m of k.messes) {
    const dx = m.x - agent.x;
    const dy = m.y - agent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  const proximityFactor =
    minDist <= MANAGER_SUPERVISION_RADIUS
      ? 1.0 + (1.0 - minDist / MANAGER_SUPERVISION_RADIUS) * 1.5
      : 0.5;
  const baseScore = CLEAN_MESS_BASE_SCORE * proximityFactor;
  const typeBonus = agent.type === 'janitor_mechanic' ? WORKER_TYPE_CONFIGS.janitor_mechanic.maintenanceAffinityBonus : 0;
  return baseScore + typeBonus;
}

/**
 * Utility score for Discharging Waste Buffer to Staff Meals.
 */
export function scoreDischargeMeal(w: Worker, k: KitchenState): number {
  if (k.wasteBuffer < MEAL_UNIT_COST) return 0;
  const lowMealBonus = k.mealUnits <= 5 ? 2.0 : 1.0;
  return Math.min(8.0, (1.5 + Math.min(3.0, k.wasteBuffer)) * lowMealBonus);
}

/**
 * Utility score for Manager Supervise task.
 */
export function scoreManagerSupervise(m: ManagerState, k: KitchenState): number {
  let nearestWorkerDist = Infinity;
  for (const w of k.workers) {
    const dx = w.x - m.x;
    const dy = w.y - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestWorkerDist) {
      nearestWorkerDist = dist;
    }
  }
  if (k.workers.length === 0) nearestWorkerDist = Infinity;

  const proximityFactor =
    nearestWorkerDist <= MANAGER_SUPERVISION_RADIUS
      ? 1.0 - (nearestWorkerDist / MANAGER_SUPERVISION_RADIUS) * 0.6
      : 0.4;

  const base = MANAGER_SUPERVISE_BASE * m.stamina * proximityFactor;
  const emergencyBonus = k.emergencyCallActive ? MANAGER_EMERGENCY_CALL_BONUS : 0;
  return base + emergencyBonus;
}

/**
 * Utility score for Manager Patrol task.
 */
export function scoreManagerPatrol(m: ManagerState, k: KitchenState): number {
  const workersOutsideCoverage = k.workers.filter((w) => {
    const dx = w.x - m.x;
    const dy = w.y - m.y;
    return Math.sqrt(dx * dx + dy * dy) > MANAGER_SUPERVISION_RADIUS;
  }).length;

  const coverageGap = k.workers.length > 0 ? workersOutsideCoverage / k.workers.length : 0;
  return MANAGER_PATROL_BASE * m.stamina * coverageGap;
}

/**
 * Utility score for Manager Rest task.
 */
export function scoreManagerRest(m: ManagerState): number {
  const effStamina = getManagerEffectiveStamina(m);
  const urgency = Math.max(0, MANAGER_REST_URGENCY_THRESHOLD - effStamina) / MANAGER_REST_URGENCY_THRESHOLD;
  return Math.pow(urgency, 2) * MANAGER_REST_URGENCY_MAX_SCORE;
}

/**
 * Calculates effective manager stamina (layering temporary coffee boost).
 */
export function getManagerEffectiveStamina(m: ManagerState): number {
  return Math.min(1.0, m.stamina + (m.coffeeBoostRemaining || 0));
}

/**
 * Utility score for Manager Drinking Coffee task.
 */
export function scoreManagerCoffee(m: ManagerState, k: KitchenState): number {
  if (k.coffeePotUnits <= 0) return 0;
  const effStamina = getManagerEffectiveStamina(m);
  if (effStamina < MANAGER_REST_URGENCY_THRESHOLD || effStamina >= MANAGER_REST_APPROACHING_THRESHOLD) return 0;
  const bandUrgency = (MANAGER_REST_APPROACHING_THRESHOLD - effStamina) / (MANAGER_REST_APPROACHING_THRESHOLD - MANAGER_REST_URGENCY_THRESHOLD);
  return bandUrgency * MANAGER_COFFEE_BASE_SCORE;
}

/**
 * Calculates risk-weighted supervision priority for a specific worker.
 */
export function scoreWorkerSupervisionPriority(w: Worker, k: KitchenState, m: ManagerState): number {
  const dx = w.x - m.x;
  const dy = w.y - m.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const proximityBonus = Math.max(0, 1 - dist / MANAGER_TARGET_PROXIMITY_NORM_RANGE);
  const activeBonus = w.currentTask === 'corner_cut' ? MANAGER_ACTIVE_VIOLATION_TARGET_BONUS : 0;

  return (
    MANAGER_TARGET_RISK_WEIGHT * scoreCornerCut(w, k) +
    MANAGER_TARGET_PROXIMITY_WEIGHT * proximityBonus +
    activeBonus
  );
}

/**
 * Utility score for Manager Autonomous Repair task.
 */
export function scoreManagerAutoRepair(m: ManagerState, k: KitchenState): number {
  if (!k.situationQueue || k.situationQueue.length === 0) return 0;
  const highestStage = Math.max(...k.situationQueue.map((s) => s.stage));
  return MANAGER_AUTO_REPAIR_BASE * m.stamina * (highestStage / 3);
}
