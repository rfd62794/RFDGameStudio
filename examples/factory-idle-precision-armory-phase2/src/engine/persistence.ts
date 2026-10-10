// new: examples/factory-idle-precision-armory-phase2/src/engine/persistence.ts
import type { GameState } from '../types';

export const SAVE_KEY = 'factory_idle_save_v1';
export const SAVE_VERSION = 1;

/** The slice of the Storage API this module needs, so tests can pass a plain object. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** `state.grid` and `state.items` are the live copy of the active sector; fold them back into `sectors` before saving. */
export function serializeState(state: GameState): string {
  const sectors = {
    ...state.sectors,
    [state.activeSectorId]: { ...state.sectors[state.activeSectorId], grid: state.grid, items: state.items },
  };
  return JSON.stringify({ v: SAVE_VERSION, state: { ...state, sectors } });
}

function looksValid(s: any): boolean {
  return !!s
    && typeof s.funds === 'number' && Number.isFinite(s.funds)
    && typeof s.tick === 'number'
    && typeof s.activeSectorId === 'string'
    && !!s.sectors && !!s.sectors[s.activeSectorId]
    && Array.isArray(s.sectors[s.activeSectorId].grid)
    && !!s.hopperStock && !!s.shelfStock && Array.isArray(s.upgrades) && !!s.metrics;
}

/** Returns `fallback` for anything missing, unreadable, from another version, or the wrong shape. Never throws. */
export function restoreState(raw: string | null, fallback: GameState): GameState {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SAVE_VERSION || !looksValid(parsed.state)) return fallback;
    const saved = parsed.state;
    const active = saved.sectors[saved.activeSectorId];
    return {
      ...fallback,
      ...saved,
      grid: active.grid,
      items: active.items ?? [],
      gridWidth: active.gridWidth,
      gridHeight: active.gridHeight,
    } as GameState;
  } catch {
    return fallback;
  }
}

export function loadState(storage: StorageLike | null, fallback: GameState): GameState {
  if (!storage) return fallback;
  try {
    return restoreState(storage.getItem(SAVE_KEY), fallback);
  } catch {
    return fallback;
  }
}

/** True when the save was written. Storage can be missing, full or blocked: that is not an error for the player. */
export function saveState(storage: StorageLike | null, state: GameState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, serializeState(state));
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
