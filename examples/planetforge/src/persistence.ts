// new: examples/planetforge/src/persistence.ts
import { NUM_SECTORS, RING_SIZE, type WorldState } from './types';

export const SAVE_KEY = 'planetforge_save_v1';
export const SAVE_VERSION = 1;

/** The slice of the Storage API this module needs, so tests can pass a plain object. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serializeWorld(world: WorldState): string {
  return JSON.stringify({ v: SAVE_VERSION, world });
}

function isNumberArray(v: unknown, length: number): boolean {
  return Array.isArray(v) && v.length === length && v.every((n) => typeof n === 'number' && Number.isFinite(n));
}

function looksValid(w: any): boolean {
  return !!w
    && typeof w.current_tick === 'number'
    && Array.isArray(w.tiles) && w.tiles.length === RING_SIZE
    && w.tiles.every((t: any) => !!t && isNumberArray(t.tiers, 4) && typeof t.ticks_stable === 'number')
    && Array.isArray(w.sectors) && w.sectors.length === NUM_SECTORS
    && w.sectors.every((s: any) => !!s && !!s.structure && typeof s.structure.type === 'string' && Array.isArray(s.tile_indices))
    && !!w.settlement_ledger && typeof w.settlement_ledger.food === 'number'
    && typeof w.settlement_ledger.energy === 'number' && typeof w.settlement_ledger.material === 'number'
    && !!w.settlement && Array.isArray(w.logs);
}

/** Returns `fallback` for anything missing, unreadable, from another version, or the wrong shape. Never throws. */
export function restoreWorld(raw: string | null, fallback: WorldState): WorldState {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SAVE_VERSION || !looksValid(parsed.world)) return fallback;
    return parsed.world as WorldState;
  } catch {
    return fallback;
  }
}

export function loadWorld(storage: StorageLike | null, fallback: WorldState): WorldState {
  if (!storage) return fallback;
  try {
    return restoreWorld(storage.getItem(SAVE_KEY), fallback);
  } catch {
    return fallback;
  }
}

/** True when the save was written. Storage can be missing, full or blocked: that is not an error for the player. */
export function saveWorld(storage: StorageLike | null, world: WorldState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, serializeWorld(world));
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
