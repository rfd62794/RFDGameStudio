// new: examples/7-days-to-fry/src/saveGame.ts
import type { KitchenState } from './types';

export const SAVE_KEY = 'seven_days_to_fry_save_v1';
export const SAVE_VERSION = 1;

/** The slice of the Storage API this module needs, so tests can pass a plain object. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serializeKitchen(state: KitchenState): string {
  return JSON.stringify({ v: SAVE_VERSION, state });
}

/**
 * Returns the saved Night state, or null for anything missing, unreadable, from another version,
 * not a Night, or the wrong shape. Never throws.
 */
export function restoreKitchen(raw: string | null): KitchenState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const s = parsed?.state;
    if (!parsed || parsed.v !== SAVE_VERSION || !s) return null;
    if (s.gamePhase !== 'night') return null;
    if (typeof s.dayNumber !== 'number' || typeof s.cash !== 'number' || !Number.isFinite(s.cash)) return null;
    if (!Array.isArray(s.stations) || !Array.isArray(s.workers)) return null;
    return s as KitchenState;
  } catch {
    return null;
  }
}

export function loadSave(storage: StorageLike | null): KitchenState | null {
  if (!storage) return null;
  try {
    return restoreKitchen(storage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

/**
 * Saves at Night only (between days the sim is paused and the state is tidy). Returns true when written.
 * Storage can be missing, full or blocked: that is not an error for the player.
 */
export function saveNight(storage: StorageLike | null, state: KitchenState): boolean {
  if (!storage || state.gamePhase !== 'night') return false;
  try {
    storage.setItem(SAVE_KEY, serializeKitchen(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* nothing to do */
  }
}

/** The line shown on the start screen's Continue button. */
export function describeSave(state: Pick<KitchenState, 'dayNumber' | 'cash'>): string {
  return `Continue your week: Night before Day ${state.dayNumber}, $${state.cash.toFixed(2)} in the till`;
}
