// new: ts/tests/test_mbb_persistence.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadMbbSave, writeMbbSave, clearMbbSave, parseSave, MBB_SAVE_KEY } from '../src/games/mutant_battle_ball/persist';
import type { MBBGameState } from '../src/games/mutant_battle_ball/types';

const state = (over: Partial<MBBGameState> = {}): MBBGameState => ({
  iron: 180,
  roster: [
    { id: 'a', name: 'Alpha', color: '#3b82f6', parts: { head: null, chest: null, left_arm: null, right_arm: null, left_leg: null, right_leg: null }, status: 'healthy', matchesPlayed: 2 },
    { id: 'b', name: 'Beta', color: '#ef4444', parts: { head: null, chest: null, left_arm: null, right_arm: null, left_leg: null, right_leg: null }, status: 'healthy', matchesPlayed: 0 },
  ],
  partsInventory: ['head_basic'],
  activeSquad: ['a', 'b'],
  bench: [],
  matchHistory: [{ result: 'win', scorePlayer: 3, scoreOpponent: 1, ironEarned: 90 }],
  currentOpponentIdx: 1,
  ...over,
});

describe('mutant_battle_ball persistence', () => {
  beforeEach(() => { localStorage.clear(); });

  it('there is no save at first', () => {
    expect(loadMbbSave()).toBeNull();
  });
  it('a written game comes back exactly (reload restores iron, roster, parts, opponent, history)', () => {
    writeMbbSave(state());
    expect(loadMbbSave()).toEqual(state());
  });
  it('clearMbbSave forgets it', () => {
    writeMbbSave(state());
    clearMbbSave();
    expect(loadMbbSave()).toBeNull();
  });
  it('ignores a corrupt, wrong-version or malformed save instead of crashing', () => {
    localStorage.setItem(MBB_SAVE_KEY, '{not json');
    expect(loadMbbSave()).toBeNull();
    localStorage.setItem(MBB_SAVE_KEY, JSON.stringify({ v: 99, data: state() }));
    expect(loadMbbSave()).toBeNull();
    expect(parseSave(state({ iron: -5 }))).toBeNull();
    expect(parseSave(state({ roster: [] }))).toBeNull();
    expect(parseSave(state({ activeSquad: ['a', 'zzz'] }))).toBeNull();
    expect(parseSave(state({ currentOpponentIdx: 1.5 }))).toBeNull();
    expect(parseSave(null)).toBeNull();
  });
  it('App.tsx resumes a save, saves on change, and offers Continue and New Game', () => {
    const app = readFileSync(resolve(import.meta.dirname, '../src/games/mutant_battle_ball/App.tsx'), 'utf8');
    expect(app).toContain('loadMbbSave() ?? buildFreshState(session)');
    expect(app).toContain('writeMbbSave(state)');
    expect(app).toContain("id: 'continue'");
    expect(app).toContain('clearMbbSave()');
  });
});
