// new: ts/tests/test_scrapcrawl_carry_over.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PROFICIENCY_KEY, BEST_RUN_KEY, savedProficiency, saveProficiency,
  withSavedProficiency, bestWinHp, recordWin, clearCarryOver,
} from '../src/games/scrapcrawl/utils/carryOver';
import type { PlayerState } from '../src/games/scrapcrawl/types';

const basePlayer = (): PlayerState => ({
  currentRoomId: 'home_base', scrap: 0, tier2Unlocked: false, equipped: {},
  proficiencyXp: { weapon: 0, shield: 0, armor: 0 }, roster: [], sculptedCache: {},
});

describe('scrapcrawl carry-over', () => {
  beforeEach(() => { localStorage.clear(); });

  it('starts empty', () => {
    expect(savedProficiency()).toEqual({ weapon: 0, shield: 0, armor: 0 });
    expect(bestWinHp()).toBeNull();
  });

  it('proficiency survives a restart (save, then a fresh player picks it up)', () => {
    saveProficiency({ weapon: 45, shield: 0, armor: 15 });
    expect(withSavedProficiency(basePlayer()).proficiencyXp).toEqual({ weapon: 45, shield: 0, armor: 15 });
  });

  it('ignores corrupt saves', () => {
    localStorage.setItem(PROFICIENCY_KEY, '{not json');
    expect(savedProficiency()).toEqual({ weapon: 0, shield: 0, armor: 0 });
    localStorage.setItem(PROFICIENCY_KEY, JSON.stringify({ weapon: -5, shield: 'x', armor: 7 }));
    expect(savedProficiency()).toEqual({ weapon: 0, shield: 0, armor: 7 });
  });

  it('keeps the best win and only improves upward', () => {
    expect(recordWin(4)).toEqual({ best: 4, improved: true });
    expect(recordWin(2)).toEqual({ best: 4, improved: false });
    expect(recordWin(8)).toEqual({ best: 8, improved: true });
    expect(bestWinHp()).toBe(8);
  });

  it('clearCarryOver forgets both', () => {
    saveProficiency({ weapon: 15, shield: 0, armor: 0 });
    recordWin(6);
    clearCarryOver();
    expect(localStorage.getItem(PROFICIENCY_KEY)).toBeNull();
    expect(localStorage.getItem(BEST_RUN_KEY)).toBeNull();
  });
});

describe('scrapcrawl carry-over wiring', () => {
  const read = (rel: string) => readFileSync(resolve(import.meta.dirname, '../src/games/scrapcrawl', rel), 'utf8');
  it('App seeds new runs from saved proficiency, saves after a win and records the best win', () => {
    const app = read('App.tsx');
    expect(app).toContain('withSavedProficiency(session.executor.call');
    expect(app).toContain('saveProficiency(result.player.proficiencyXp)');
    expect(app).toContain('recordWin(nextRun.hp)');
    expect(app).toContain('Reset saved progress');
  });
  it('the end screen shows the best win', () => {
    expect(read('components/RunEndScreen.tsx')).toContain('Best win (HP left)');
  });
});
