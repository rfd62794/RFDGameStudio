// new: ts/tests/test_playtest_dissonance.ts
import { describe, it, expect } from 'vitest';
import {
  firstLegalPolicy,
  playMany,
  playRun,
  randomPolicy,
  renderPlaytestReport,
  summarise,
} from '../src/engine/playtest';
import type { RunResult } from '../src/engine/playtest';
import { createDissonanceAdapter, dissonanceSanity } from '../src/games/dissonance/playtest';

/**
 * Dissonance through the shared PlaytestAdapter contract: the same Lua calls the old
 * bot test made, wrapped so the runner, the invariants and the markdown report come
 * from ts/src/engine/playtest. The first-card bot is firstLegalPolicy().
 */

describe('Dissonance through the PlaytestAdapter contract', () => {
  const results: Record<number, RunResult> = {};

  for (const seed of [1, 2, 3, 4]) {
    it(`seed ${seed}`, () => {
      const result = playRun(createDissonanceAdapter(), firstLegalPolicy(), seed, {
        extraChecks: [dissonanceSanity],
      });
      results[seed] = result;
      expect(result.violations).toEqual([]);
      expect(result.terminal).toBe(true);
      expect(result.steps).toBeLessThan(500);
      expect(['victory', 'game_over']).toContain(result.outcome);
    }, 60000);
  }

  it('both a win and a loss are reachable', () => {
    const outcomes = Object.values(results).map((r) => r.outcome);
    expect(outcomes).toContain('victory');
    expect(outcomes).toContain('game_over');
  });

  it('seed 2 is deterministic', () => {
    const first = playRun(createDissonanceAdapter(), firstLegalPolicy(), 2, {
      extraChecks: [dissonanceSanity],
    });
    const second = playRun(createDissonanceAdapter(), firstLegalPolicy(), 2, {
      extraChecks: [dissonanceSanity],
    });
    expect(first).toEqual(second);
  }, 120000);

  it('random policy report over seeds 1-20', () => {
    const seeds = Array.from({ length: 20 }, (_, i) => i + 1);
    const many = playMany(createDissonanceAdapter, randomPolicy, seeds, {
      extraChecks: [dissonanceSanity],
    });
    expect(many).toHaveLength(20);
    for (const r of many) {
      for (const v of r.violations) {
        expect(typeof v.seed).toBe('number');
        expect(typeof v.step).toBe('number');
      }
    }
    console.log(renderPlaytestReport('dissonance', 'random', summarise(many)));
  }, 300000);
});
