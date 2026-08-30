/**
 * @file src/wasteEconomy.ts
 * Manages spoilage accumulation into the waste buffer and manual Staff Meal discharge.
 */

import { MAX_STAFF_MEAL_MORALE_BOOST, MORALE_PER_WASTE_UNIT } from './data';
import { KitchenState, LogEvent } from './types';

/**
 * Accumulates waste into the kitchen buffer passively (e.g., from station overflows or spoilage).
 */
export function accumulateWaste(k: KitchenState, amount: number, reason?: string): void {
  if (amount <= 0) return;
  k.wasteBuffer += amount;

  if (reason) {
    const log: LogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: k.elapsedSeconds,
      message: `Waste Accumulated (+${amount.toFixed(1)} units): ${reason}`,
      type: 'warning',
    };
    k.logEvents.unshift(log);
    if (k.logEvents.length > 50) k.logEvents.pop();
  }
}

/**
 * Discharges the waste buffer to serve staff meals in the MEAL_AREA.
 * Button action triggered by player when waste buffer > 0.
 */
export function dischargeStaffMeal(k: KitchenState): boolean {
  if (k.wasteBuffer <= 0) return false; // button does nothing if buffer is empty

  const unitsDischarged = k.wasteBuffer;
  k.mealAvailable = true;
  k.mealUnits = (k.mealUnits || 0) + unitsDischarged * 10.0; // Food portions available

  // Clear waste buffer
  k.wasteBuffer = 0;

  // Add event log
  const log: LogEvent = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Math.floor(k.elapsedSeconds),
    message: `Staff Meal Served! Discharged ${unitsDischarged.toFixed(1)} waste units to Staff Meal Area.`,
    type: 'success',
  };
  k.logEvents.unshift(log);
  if (k.logEvents.length > 50) k.logEvents.pop();

  return true;
}

/**
 * Automatically discharges the waste buffer to serve staff meals whenever wasteBuffer > 0.
 */
export function autoDischargeWaste(k: KitchenState): void {
  if (k.wasteBuffer <= 0) return;
  dischargeStaffMeal(k);
}
