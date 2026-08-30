/**
 * @file src/execution/breakExecution.ts
 * Break area actions processing (rest, staff meals, drinking coffee).
 */

import {
  BATHROOM_CLOG_CHANCE,
  BLADDER_RISE_PER_MEAL_UNIT,
  BLADDER_RISE_PER_WATER,
  CLEAN_BATHROOM_DURATION_SECONDS,
  CLEAN_MESS_DURATION_SECONDS,
  COFFEE_STAMINA_BOOST,
  COFFEE_WORKER_PORTION_SIZE,
  MEAL_CONSUME_SECONDS,
  MEAL_MORALE_REGEN_RATE,
  MEAL_PORTION_SIZE,
  STAFF_AREA,
  STAMINA_RECOVERY_REST,
  STATION_CONFIGS,
} from '../data';
import { KitchenState, Worker } from '../types';
import { dischargeStaffMeal } from '../wasteEconomy';

/**
 * Handles worker break actions (rest, eat_meal, drink_coffee, drink_water, use_bathroom, clean_bathroom, discharge_meal).
 * Returns true if the worker was performing a break/maintenance action and processed it.
 */
export function processWorkerBreakExecution(worker: Worker, state: KitchenState, dt?: number): boolean {
  const actualDt = dt ?? 0.1;
  if (worker.currentTask === 'rest') {
    const dx = worker.x - (STAFF_AREA.x + STAFF_AREA.width / 2);
    const dy = worker.y - (STAFF_AREA.y + STAFF_AREA.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < 45 || dt === undefined) {
      worker.stamina = Math.min(1.0, worker.stamina + STAMINA_RECOVERY_REST * actualDt);
      worker.totalRestTicks++;
    }
    worker.currentStation = null;
    worker.taskProgress = 0;
    return true;
  }

  if (worker.currentTask === 'eat_meal') {
    const dx = worker.x - (STAFF_AREA.x + STAFF_AREA.width / 2);
    const dy = worker.y - (STAFF_AREA.y + STAFF_AREA.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < 45 || dt === undefined) {
      if (!worker.currentMeal) {
        if (state.wasteBuffer > 0) {
          const portion = Math.min(MEAL_PORTION_SIZE, state.wasteBuffer);
          state.wasteBuffer -= portion;
          worker.currentMeal = { unitsRemaining: portion };
          worker.bladderPressure = Math.min(1.0, (worker.bladderPressure || 0) + BLADDER_RISE_PER_MEAL_UNIT);
        } else if (state.mealUnits > 0) {
          const portion = Math.min(MEAL_PORTION_SIZE, state.mealUnits);
          state.mealUnits -= portion;
          if (state.mealUnits <= 0) {
            state.mealAvailable = false;
          }
          worker.currentMeal = { unitsRemaining: portion };
          worker.bladderPressure = Math.min(1.0, (worker.bladderPressure || 0) + BLADDER_RISE_PER_MEAL_UNIT);
        } else {
          // Nothing to draw, worker stands in scarcity with no meal
          worker.currentStation = null;
          worker.taskProgress = 0;
          return true;
        }
      }

      const depletion = (MEAL_PORTION_SIZE / MEAL_CONSUME_SECONDS) * actualDt;
      worker.currentMeal.unitsRemaining = Math.max(0, worker.currentMeal.unitsRemaining - depletion);
      worker.morale = Math.min(1.0, worker.morale + MEAL_MORALE_REGEN_RATE * actualDt);
      worker.totalMealTicks = (worker.totalMealTicks || 0) + 1;

      if (worker.currentMeal.unitsRemaining <= 0) {
        worker.currentMeal = null; // consumed
      }
    }
    worker.currentStation = null;
    worker.taskProgress = 0;
    return true;
  }

  if (worker.currentTask === 'drink_coffee') {
    const coffeeStation = STATION_CONFIGS.coffee;
    const dx = worker.x - (coffeeStation.x + coffeeStation.width / 2);
    const dy = worker.y - (coffeeStation.y + coffeeStation.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < 50 && state.coffeePotUnits >= COFFEE_WORKER_PORTION_SIZE) {
      state.coffeePotUnits -= COFFEE_WORKER_PORTION_SIZE;
      worker.coffeeBoostRemaining = Math.min(1.0, worker.coffeeBoostRemaining + COFFEE_STAMINA_BOOST);
    }
    worker.currentStation = null;
    worker.taskProgress = 0;
    return true;
  }

  if (worker.currentTask === 'drink_water') {
    const dx = worker.x - (STAFF_AREA.x + STAFF_AREA.width / 2);
    const dy = worker.y - (STAFF_AREA.y + STAFF_AREA.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < 45 || dt === undefined) {
      worker.thirst = 1.0;
      worker.bladderPressure = Math.min(1.0, (worker.bladderPressure || 0) + BLADDER_RISE_PER_WATER);
    }
    worker.currentStation = null;
    worker.taskProgress = 0;
    return true;
  }

  if (worker.currentTask === 'use_bathroom') {
    const bathroomStation = state.stations ? state.stations.find((s) => s.id === 'bathroom') : undefined;
    const isOccupant = !bathroomStation || bathroomStation.occupiedByWorkerId === null || bathroomStation.occupiedByWorkerId === worker.id;

    const bathroom = STATION_CONFIGS.bathroom;
    const dx = worker.x - (bathroom.x + bathroom.width / 2);
    const dy = worker.y - (bathroom.y + bathroom.height / 2);

    if ((Math.sqrt(dx * dx + dy * dy) < 50 || dt === undefined) && isOccupant) {
      worker.bladderPressure = 0;
      if (Math.random() < BATHROOM_CLOG_CHANCE) {
        if (bathroomStation) {
          bathroomStation.isOutOfOrder = true;
          bathroomStation.brokenElapsedSeconds = 0;
        }
      }
      if (bathroomStation) {
        bathroomStation.occupiedByWorkerId = null;
      }
      worker.currentTask = 'protocol';
    }
    worker.currentStation = null;
    worker.taskProgress = 0;
    return true;
  }

  if (worker.currentTask === 'clean_bathroom') {
    const bathroom = STATION_CONFIGS.bathroom;
    const dx = worker.x - (bathroom.x + bathroom.width / 2);
    const dy = worker.y - (bathroom.y + bathroom.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < 50 || dt === undefined) {
      const stepDt = dt ?? CLEAN_BATHROOM_DURATION_SECONDS;
      worker.taskProgress += stepDt / CLEAN_BATHROOM_DURATION_SECONDS;
      if (worker.taskProgress >= 1.0) {
        const bathroomStation = state.stations.find((s) => s.id === 'bathroom');
        if (bathroomStation) {
          bathroomStation.isOutOfOrder = false;
          bathroomStation.brokenElapsedSeconds = 0;
        }
        worker.taskProgress = 0;
      }
    } else {
      worker.taskProgress = 0;
    }
    worker.currentStation = null;
    return true;
  }

  if (worker.currentTask === 'clean_mess') {
    if (!state.messes || state.messes.length === 0) {
      worker.taskProgress = 0;
      worker.currentStation = null;
      return true;
    }
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < state.messes.length; i++) {
      const m = state.messes[i];
      const dx = worker.x - m.x;
      const dy = worker.y - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    if (minDist < 50 || dt === undefined) {
      const stepDt = dt ?? CLEAN_MESS_DURATION_SECONDS;
      worker.taskProgress += stepDt / CLEAN_MESS_DURATION_SECONDS;
      if (worker.taskProgress >= 1.0) {
        state.messes.splice(nearestIdx, 1);
        worker.taskProgress = 0;
      }
    } else {
      worker.taskProgress = 0;
    }
    worker.currentStation = null;
    return true;
  }

  if (worker.currentTask === 'discharge_meal') {
    const dx = worker.x - (STAFF_AREA.x + STAFF_AREA.width / 2);
    const dy = worker.y - (STAFF_AREA.y + STAFF_AREA.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < 45 || dt === undefined) {
      dischargeStaffMeal(state);
    }
    worker.currentStation = null;
    worker.taskProgress = 0;
    return true;
  }

  return false;
}
