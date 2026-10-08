// @vitest-environment node
// new: ts/tests/test_seven_days_save.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialKitchenState, tickKitchenState, startNextDay } from '../../examples/7-days-to-fry/src/sessionLoop';
import {
  SAVE_KEY, serializeKitchen, restoreKitchen, loadSave, saveNight, clearSave, describeSave, type StorageLike,
} from '../../examples/7-days-to-fry/src/saveGame';
import { UPGRADE_FRIES_UNLOCK_COST } from '../../examples/7-days-to-fry/src/data';
import { purchaseFriesUnlock } from '../../examples/7-days-to-fry/src/nightShop';

const read = (rel: string) => readFileSync(new URL(`../../examples/7-days-to-fry/src/${rel}`, import.meta.url), 'utf8');

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

function nightState(day: number, cash: number) {
  const k = createInitialKitchenState();
  k.gamePhase = 'night';
  k.dayNumber = day;
  k.cash = cash;
  return k;
}

describe('test_seven_days_save', () => {
  it('round-trips a Night: day, cash, unlocks and the rest of the state', () => {
    const k = nightState(3, 80);
    k.cash = 80;
    expect(purchaseFriesUnlock(k)).toBe(true);
    const back = restoreKitchen(serializeKitchen(k));
    expect(back).not.toBeNull();
    expect(back!.dayNumber).toBe(3);
    expect(back!.cash).toBe(80 - UPGRADE_FRIES_UNLOCK_COST);
    expect(back!.unlockedStations.fryer).toBe(true);
    expect(back!.gamePhase).toBe('night');
    expect(back!.workers.length).toBe(k.workers.length);
  });

  it('a restored Night can start the next day and keep ticking', () => {
    const back = restoreKitchen(serializeKitchen(nightState(2, 50)))!;
    startNextDay(back);
    expect(back.gamePhase).toBe('day');
    for (let i = 0; i < 600; i++) tickKitchenState(back, 1 / 60);
    expect(back.elapsedSeconds).toBeGreaterThan(0);
  });

  it('only a Night is ever saved or restored', () => {
    const storage = memoryStorage();
    const day = createInitialKitchenState();
    day.gamePhase = 'day';
    expect(saveNight(storage, day)).toBe(false);
    expect(storage.data.has(SAVE_KEY)).toBe(false);
    expect(restoreKitchen(serializeKitchen(day))).toBeNull();
    expect(saveNight(storage, nightState(4, 10))).toBe(true);
    expect(loadSave(storage)!.dayNumber).toBe(4);
  });

  it('returns null for null, garbage, another version and the wrong shape', () => {
    expect(restoreKitchen(null)).toBeNull();
    expect(restoreKitchen('{oops')).toBeNull();
    expect(restoreKitchen(JSON.stringify({ v: 9, state: nightState(2, 1) }))).toBeNull();
    expect(restoreKitchen(JSON.stringify({ v: 1, state: { gamePhase: 'night', dayNumber: 2, cash: 'lots' } }))).toBeNull();
    expect(restoreKitchen(JSON.stringify({ v: 1, state: { gamePhase: 'night', dayNumber: 2, cash: 5 } }))).toBeNull();
  });

  it('clears the save and never throws when storage is missing or blocked', () => {
    const storage = memoryStorage();
    saveNight(storage, nightState(2, 5));
    clearSave(storage);
    expect(loadSave(storage)).toBeNull();
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(saveNight(null, nightState(2, 5))).toBe(false);
    expect(saveNight(blocked, nightState(2, 5))).toBe(false);
    expect(loadSave(null)).toBeNull();
    expect(loadSave(blocked)).toBeNull();
    expect(() => clearSave(blocked)).not.toThrow();
  });

  it('describes the save in plain words', () => {
    expect(describeSave({ dayNumber: 3, cash: 42.5 })).toBe('Continue your week: Night before Day 3, $42.50 in the till');
  });

  it('the app wires load, autosave, continue and delete', () => {
    const app = read('App.tsx');
    expect(app).toContain('loadSave(browserStorage())');
    expect(app).toContain('saveNight(browserStorage(), kitchenState)');
    expect(app).toContain('onContinue={savedGame ? handleContinueSavedGame : undefined}');
    expect(app).toContain('onDeleteSave={savedGame ? handleDeleteSave : undefined}');
    expect(read('components/NewGameScreen.tsx')).toContain('Delete saved week');
  });
});
