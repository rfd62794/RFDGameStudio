/**
 * @file src/nightShop.ts
 * Manages Night Phase Shop upgrades and Brand Equity recovery purchases.
 */

import {
  BASIC_UPGRADES_MIN_DAY,
  BRAND_RECOVERY_AMOUNT,
  BUFFER_CAPACITY_INCREASE,
  DAY_DURATION_INCREASE_SECONDS,
  FRIES_UNLOCK_MIN_DAY,
  STOCK_CAPACITY_INCREASE,
  STOCK_UNITS_CAPACITY,
  UPGRADE_BRAND_RECOVERY_COST,
  UPGRADE_BUFFER_CAPACITY_COST,
  UPGRADE_DAY_DURATION_COST,
  UPGRADE_FRIES_UNLOCK_COST,
  UPGRADE_STOCK_CAPACITY_COST,
} from './data';
import { KitchenState, StationId } from './types';

export function purchaseBufferCapacity(state: KitchenState): boolean {
  if (state.dayNumber < BASIC_UPGRADES_MIN_DAY) return false;
  if (state.purchasedUpgrades?.buffer_capacity) return false;
  if (state.cash < UPGRADE_BUFFER_CAPACITY_COST) return false;

  state.cash -= UPGRADE_BUFFER_CAPACITY_COST;
  state.purchasedUpgrades = { ...state.purchasedUpgrades, buffer_capacity: true };

  state.stations = state.stations.map((s) => {
    if (s.id === 'grill' || s.id === 'assembly' || s.id === 'fryer') {
      return { ...s, bufferCapacity: s.bufferCapacity + BUFFER_CAPACITY_INCREASE };
    }
    return s;
  });
  return true;
}

export function purchaseStockCapacity(state: KitchenState): boolean {
  if (state.dayNumber < BASIC_UPGRADES_MIN_DAY) return false;
  if (state.purchasedUpgrades?.stock_capacity) return false;
  if (state.cash < UPGRADE_STOCK_CAPACITY_COST) return false;

  state.cash -= UPGRADE_STOCK_CAPACITY_COST;
  state.purchasedUpgrades = { ...state.purchasedUpgrades, stock_capacity: true };
  state.stockCapacityBonus = (state.stockCapacityBonus || 0) + STOCK_CAPACITY_INCREASE;
  const newCap = STOCK_UNITS_CAPACITY + state.stockCapacityBonus;
  state.stockUnits = Math.min(newCap, state.stockUnits + STOCK_CAPACITY_INCREASE);
  return true;
}

export function purchaseDayDuration(state: KitchenState): boolean {
  if (state.dayNumber < BASIC_UPGRADES_MIN_DAY) return false;
  if (state.purchasedUpgrades?.day_duration) return false;
  if (state.cash < UPGRADE_DAY_DURATION_COST) return false;

  state.cash -= UPGRADE_DAY_DURATION_COST;
  state.purchasedUpgrades = { ...state.purchasedUpgrades, day_duration: true };
  state.dayDurationSeconds += DAY_DURATION_INCREASE_SECONDS;
  return true;
}

export function purchaseBrandRecovery(state: KitchenState): boolean {
  if (state.cash < UPGRADE_BRAND_RECOVERY_COST) return false;

  state.cash -= UPGRADE_BRAND_RECOVERY_COST;
  state.brandEquity = Math.min(100, state.brandEquity + BRAND_RECOVERY_AMOUNT);
  return true;
}

export function purchaseFriesUnlock(state: KitchenState): boolean {
  if (state.dayNumber < FRIES_UNLOCK_MIN_DAY) return false;
  if (state.unlockedStations?.fryer) return false;
  if (state.cash < UPGRADE_FRIES_UNLOCK_COST) return false;

  state.cash -= UPGRADE_FRIES_UNLOCK_COST;
  state.unlockedStations = { ...state.unlockedStations, fryer: true };
  return true;
}
