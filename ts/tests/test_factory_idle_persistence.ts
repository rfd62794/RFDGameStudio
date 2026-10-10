// @vitest-environment node
// new: ts/tests/test_factory_idle_persistence.ts

import { describe, it, expect } from 'vitest';
import { getInitialGameState } from '../../examples/factory-idle-precision-armory-phase2/src/engine/gameReducer';
import { appReducer } from '../../examples/factory-idle-precision-armory-phase2/src/engine/appReducer';
import {
  SAVE_KEY, serializeState, restoreState, loadState, saveState, clearSave, type StorageLike,
} from '../../examples/factory-idle-precision-armory-phase2/src/engine/persistence';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

describe('test_factory_idle_persistence', () => {
  it('round-trips funds, upgrades and the active grid', () => {
    const base = getInitialGameState();
    const played = { ...base, funds: 777, tick: 123, researchPoints: 9 };
    played.grid = played.grid.map((row, y) => row.map((t, x) => (x === 0 && y === 0 ? { ...t, type: 'conveyor' as const } : t)));
    const back = restoreState(serializeState(played), getInitialGameState());
    expect(back.funds).toBe(777);
    expect(back.tick).toBe(123);
    expect(back.researchPoints).toBe(9);
    expect(back.grid[0][0].type).toBe('conveyor');
    expect(back.sectors[back.activeSectorId].grid).toEqual(back.grid);
    expect(back.upgrades.length).toBe(base.upgrades.length);
  });

  it('returns the fallback for null, garbage, another version and the wrong shape', () => {
    const fallback = getInitialGameState();
    expect(restoreState(null, fallback)).toBe(fallback);
    expect(restoreState('{not json', fallback)).toBe(fallback);
    expect(restoreState(JSON.stringify({ v: 99, state: {} }), fallback)).toBe(fallback);
    expect(restoreState(JSON.stringify({ v: 1, state: { funds: 'lots' } }), fallback)).toBe(fallback);
  });

  it('saves and loads through a storage object, and clears it', () => {
    const storage = memoryStorage();
    const state = { ...getInitialGameState(), funds: 4242 };
    expect(saveState(storage, state)).toBe(true);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(loadState(storage, getInitialGameState()).funds).toBe(4242);
    clearSave(storage);
    expect(loadState(storage, getInitialGameState()).funds).toBe(350);
  });

  it('never throws when storage is missing or blocked', () => {
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const state = getInitialGameState();
    expect(saveState(null, state)).toBe(false);
    expect(saveState(blocked, state)).toBe(false);
    expect(loadState(null, state)).toBe(state);
    expect(loadState(blocked, state)).toBe(state);
    expect(() => clearSave(blocked)).not.toThrow();
  });

  it('RESET_FACTORY returns a brand-new starter factory', () => {
    const played = { ...getInitialGameState(), funds: 9999 };
    expect(appReducer(played, { type: 'RESET_FACTORY' }).funds).toBe(350);
  });
});
