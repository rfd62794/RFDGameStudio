// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { runHeadlessCampaign } from '../src/games/planetofgreed/headlessCampaign';
import type { HeadlessResult } from '../src/games/planetofgreed/headlessCampaign';
import { CULTURE_WHEEL } from '../src/games/planetofgreed/campaignConstants';

// Headless AI-vs-AI soak: 12 seeded full campaigns, one per (seed, culture)
// pair. Prints one SOAK line per run plus a SOAK SUMMARY line — the weeks
// figure is the measurement Robert needs for the campaign-length call
// (DIRECTION.md open question 1). Assertions cover soundness only: the run
// must always terminate inside MAX_HEADLESS_DAYS with no invariant
// violations; nothing here asserts on real-time minutes.

const RUN_COUNT = 12;

describe('Planet of Greed headless AI-vs-AI soak (12 seeded campaigns)', () => {
  const results: HeadlessResult[] = [];
  for (let i = 0; i < RUN_COUNT; i += 1) {
    const culture = CULTURE_WHEEL[i % CULTURE_WHEEL.length];
    const seed = i + 1;
    const r = runHeadlessCampaign(seed, culture);
    results.push(r);
    console.info(
      `SOAK seed=${seed} culture=${culture} endedBy=${r.endedBy} weeks=${r.weeksElapsed} days=${r.daysRun} combats=${r.combatsResolved} cells=${JSON.stringify(r.cellsByHouse)}`
    );
  }

  const weeksSorted = results.map(r => r.weeksElapsed).sort((a, b) => a - b);
  const median = (weeksSorted[RUN_COUNT / 2 - 1] + weeksSorted[RUN_COUNT / 2]) / 2;
  const endedByCounts: Record<string, number> = {};
  for (const r of results) {
    endedByCounts[r.endedBy] = (endedByCounts[r.endedBy] ?? 0) + 1;
  }
  console.info(
    `SOAK SUMMARY weeks min=${weeksSorted[0]} median=${median} max=${weeksSorted[weeksSorted.length - 1]} over ${RUN_COUNT} runs; endedBy counts=${JSON.stringify(endedByCounts)}`
  );

  it('every campaign finishes inside MAX_HEADLESS_DAYS with no softlock and no violations', () => {
    for (const r of results) {
      const tag = `seed=${r.seed} culture=${r.culture}`;
      expect(r.finished, tag).toBe(true);
      expect(r.endedBy, tag).not.toBe('step-bound');
      expect(r.violations, `${tag} first violations: ${r.violations.slice(0, 5).join(' || ')}`).toEqual([]);
      expect(r.weeksElapsed, tag).toBeGreaterThan(0);
      // Calendar: 7 days/week, 4 weeks/month, 12 months/year; the campaign
      // ends when the date reaches year 4, i.e. at most 3*12*4*7 = 1008
      // advanceDay calls from {y1 m1 w1 d1}.
      expect(r.daysRun, tag).toBeLessThanOrEqual(1008);
    }
  });

  it('is deterministic: a seed replays to an identical final state', () => {
    const a = runHeadlessCampaign(1, 'ember');
    const b = runHeadlessCampaign(1, 'ember');
    expect(b.weeksElapsed).toBe(a.weeksElapsed);
    expect(b.daysRun).toBe(a.daysRun);
    expect(b.endedBy).toBe(a.endedBy);
    expect(JSON.stringify(b.finalState)).toBe(JSON.stringify(a.finalState));
  });

  it('different seeds produce different end states (rng is not stuck)', () => {
    const outcomes = new Set(results.map(r => JSON.stringify(r.cellsByHouse)));
    expect(outcomes.size).toBeGreaterThan(1);
  });
});
