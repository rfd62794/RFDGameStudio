/**
 * test_slime_coin_best_score.ts — Slime Coin best-score persistence tests.
 *
 * jsdom localStorage, cleared per test — same pattern as
 * tests/test_shared_persistence.ts. Covers loadBestScore / recordRunScore
 * against the raw-number `slime_coin_best_score` key.
 *
 * <!-- new: ts/tests/test_slime_coin_best_score.ts -->
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadBestScore, recordRunScore, BEST_SCORE_SLOT } from '../src/games/slime_coin/utils/bestScore';

describe('slime_coin best score', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns 0 on empty storage', () => {
    expect(loadBestScore()).toBe(0);
  });

  it('records a new best and persists it as a raw number', () => {
    expect(recordRunScore(120)).toEqual({ best: 120, isNewBest: true });
    expect(JSON.parse(localStorage.getItem(BEST_SCORE_SLOT) as string)).toBe(120);
  });

  it('keeps the stored best when a lower score arrives', () => {
    recordRunScore(120);
    expect(recordRunScore(80)).toEqual({ best: 120, isNewBest: false });
    expect(JSON.parse(localStorage.getItem(BEST_SCORE_SLOT) as string)).toBe(120);
  });

  it('records a higher score as a new best', () => {
    recordRunScore(120);
    expect(recordRunScore(200)).toEqual({ best: 200, isNewBest: true });
    expect(JSON.parse(localStorage.getItem(BEST_SCORE_SLOT) as string)).toBe(200);
  });

  it('returns 0 for a corrupt stored value', () => {
    localStorage.setItem(BEST_SCORE_SLOT, '{broken');
    expect(loadBestScore()).toBe(0);
  });

  it('returns 0 for a stored non-number', () => {
    localStorage.setItem(BEST_SCORE_SLOT, '"abc"');
    expect(loadBestScore()).toBe(0);
  });

  it('does not persist zero or NaN scores', () => {
    expect(recordRunScore(0)).toEqual({ best: 0, isNewBest: false });
    expect(recordRunScore(NaN)).toEqual({ best: 0, isNewBest: false });
    expect(localStorage.getItem(BEST_SCORE_SLOT)).toBeNull();
  });
});
