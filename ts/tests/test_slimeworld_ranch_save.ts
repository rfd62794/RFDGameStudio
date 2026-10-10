// new: ts/tests/test_slimeworld_ranch_save.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import { RANCH_SAVE_KEY, RANCH_SAVE_VERSION } from '../src/games/slimeworld/ranch/data/constants';
import { addFruit, newRanchState } from '../src/games/slimeworld/ranch/model/state';
import { catchSlime } from '../src/games/slimeworld/ranch/model/slimes';
import { isRanchState, loadRanch, resetRanch, saveRanch } from '../src/games/slimeworld/ranch/save/ranchSave';

beforeEach(() => {
  localStorage.clear();
});

function playedState() {
  const caught = catchSlime(newRanchState(), 'pip', mulberry32(2));
  if (!caught.ok) throw new Error(caught.reason);
  return addFruit(caught.state, 'sunfruit', 3);
}

describe('ranch save (localStorage)', () => {
  it('uses its own key, never the old game save key', () => {
    expect(RANCH_SAVE_KEY).toBe('slimeworld_ranch_save');
    saveRanch(playedState());
    expect(localStorage.getItem('slimeworld_ranch_save')).not.toBeNull();
    expect(localStorage.getItem('slimeworld_save')).toBeNull();
  });

  it('round-trips a played state exactly', () => {
    const state = playedState();
    saveRanch(state);
    expect(loadRanch()).toEqual(state);
  });

  it('returns a fresh ranch when there is no save', () => {
    expect(loadRanch()).toEqual(newRanchState());
  });

  it('returns a fresh ranch for malformed JSON, a wrong version, or a wrong shape', () => {
    localStorage.setItem(RANCH_SAVE_KEY, '{not json');
    expect(loadRanch()).toEqual(newRanchState());
    localStorage.setItem(RANCH_SAVE_KEY, JSON.stringify({ v: 99, data: playedState() }));
    expect(loadRanch()).toEqual(newRanchState());
    localStorage.setItem(RANCH_SAVE_KEY, JSON.stringify({ v: 1, data: { pen: 'x' } }));
    expect(loadRanch()).toEqual(newRanchState());
  });

  it('isRanchState rejects negative or non-numeric counts', () => {
    expect(isRanchState(newRanchState())).toBe(true);
    expect(isRanchState({ ...newRanchState(), plorts: { pip: -1 } })).toBe(false);
    expect(isRanchState({ ...newRanchState(), fruit: { berry: 'many' } })).toBe(false);
    expect(isRanchState({ ...newRanchState(), plortCredit: -5 })).toBe(false);
    expect(isRanchState(null)).toBe(false);
  });

  it('isRanchState rejects malformed sales entries', () => {
    const good = playedState();
    expect(isRanchState({ ...good, sales: [null] })).toBe(false);
    expect(isRanchState({ ...good, sales: [{ speciesId: 'pip' }] })).toBe(false);
    expect(isRanchState({ ...good, sales: [{ atAction: 4 }] })).toBe(false);
    expect(isRanchState({ ...good, sales: [{ speciesId: 'pip', atAction: 4 }] })).toBe(true);
  });

  it('loadRanch falls back to a fresh ranch for a save with malformed sales', () => {
    const bad = { ...playedState(), sales: [null] };
    localStorage.setItem(RANCH_SAVE_KEY, JSON.stringify({ v: RANCH_SAVE_VERSION, data: bad }));
    expect(loadRanch()).toEqual(newRanchState());
  });

  it('isRanchState rejects non-finite or negative counters', () => {
    const good = playedState();
    expect(isRanchState({ ...good, nextId: NaN })).toBe(false);
    expect(isRanchState({ ...good, nextId: Infinity })).toBe(false);
    expect(isRanchState({ ...good, nextId: -1 })).toBe(false);
    expect(isRanchState({ ...good, actionCount: NaN })).toBe(false);
    expect(isRanchState({ ...good, actionCount: -1 })).toBe(false);
    expect(isRanchState({ ...good, actionCount: Infinity })).toBe(false);
  });

  it('resetRanch clears the save and returns a fresh ranch', () => {
    saveRanch(playedState());
    expect(resetRanch()).toEqual(newRanchState());
    expect(localStorage.getItem(RANCH_SAVE_KEY)).toBeNull();
  });

  it('does not throw when localStorage is unavailable', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      expect(() => saveRanch(playedState())).not.toThrow();
      expect(loadRanch()).toEqual(newRanchState());
      expect(() => resetRanch()).not.toThrow();
    } finally {
      Object.defineProperty(window, 'localStorage', real);
    }
  });
});
