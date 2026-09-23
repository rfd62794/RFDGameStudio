/**
 * @file src/stockEconomy.ts
 * Manages Stock Units inventory economy and truck restock actions.
 */

import { AUTO_RESTOCK_DELAY_SECONDS, STOCK_UNITS_CAPACITY, UNLOAD_TRUCK_COST, UNLOAD_TRUCK_REFILL_AMOUNT } from './data';
import { KitchenState, LogEvent } from './types';

/**
 * Direct player action to restock Stock Units using Cash.
 */
export function unloadTruck(state: KitchenState): boolean {
  if (state.cash < UNLOAD_TRUCK_COST) return false;

  state.cash -= UNLOAD_TRUCK_COST;
  state.cashSpentToday = (state.cashSpentToday || 0) + UNLOAD_TRUCK_COST;
  const totalCap = STOCK_UNITS_CAPACITY + (state.stockCapacityBonus || 0);
  state.stockUnits = Math.min(totalCap, state.stockUnits + UNLOAD_TRUCK_REFILL_AMOUNT);

  const log: LogEvent = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Math.floor(state.elapsedSeconds),
    message: `Truck Unloaded (-$${UNLOAD_TRUCK_COST.toFixed(2)}): Restocked ${UNLOAD_TRUCK_REFILL_AMOUNT} Stock Units!`,
    type: 'success',
  };
  state.logEvents.unshift(log);
  if (state.logEvents.length > 50) state.logEvents.pop();

  return true;
}

/**
 * Trigger check for automatic restocking.
 * Delays restocking until stock has been depleted for AUTO_RESTOCK_DELAY_SECONDS (4s).
 */
export function checkAutoRestock(state: KitchenState, dt: number = AUTO_RESTOCK_DELAY_SECONDS): void {
  if (state.stockUnits > 0) {
    state.stockDepletedSeconds = 0;
    return;
  }
  state.stockDepletedSeconds = (state.stockDepletedSeconds || 0) + dt;
  if (state.stockDepletedSeconds < AUTO_RESTOCK_DELAY_SECONDS) return;
  if (state.cash < UNLOAD_TRUCK_COST) return;

  if (unloadTruck(state)) {
    state.stockDepletedSeconds = 0;
  }
}
