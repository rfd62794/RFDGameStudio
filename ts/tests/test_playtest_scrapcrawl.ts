// new: ts/tests/test_playtest_scrapcrawl.ts
import { describe, it, expect } from 'vitest';
import { playMany, playRun, renderPlaytestReport, summarise } from '../src/engine/playtest';
import type { Policy, RunResult } from '../src/engine/playtest';
import { createScrapcrawlAdapter, scrapcrawlPolicy } from '../src/games/scrapcrawl/playtest';

const SEEDS = Array.from({ length: 200 }, (_, i) => 5000 + i);
const OPTS = { maxSteps: 800 };
const policy = scrapcrawlPolicy as (useCraft: boolean) => Policy;

const runSet = (useCraft: boolean): RunResult[] =>
  playMany(() => createScrapcrawlAdapter(), () => policy(useCraft), SEEDS, OPTS);

const memo = <T>(f: () => T): (() => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};
const unarmed = memo(() => runSet(false));
const crafting = memo(() => runSet(true));

describe('playtest adapter: scrapcrawl', () => {
  it('unarmed policy: no violations, every run terminal, outcomes won or lost', () => {
    for (const r of unarmed()) {
      expect(r.violations).toEqual([]);
      expect(r.terminal).toBe(true);
      expect(['won', 'lost']).toContain(r.outcome);
    }
  });

  it('crafting policy: no violations, every run terminal, outcomes won or lost', () => {
    for (const r of crafting()) {
      expect(r.violations).toEqual([]);
      expect(r.terminal).toBe(true);
      expect(['won', 'lost']).toContain(r.outcome);
    }
  });

  it('matches the old sim exactly: 35% unarmed, 75% crafting', () => {
    expect(summarise(unarmed()).rates.won).toBeCloseTo(0.35, 3);
    expect(summarise(crafting()).rates.won).toBeCloseTo(0.75, 3);
  });

  it('both won and lost occur over the 200 unarmed seeds', () => {
    const outcomes = new Set(unarmed().map(r => r.outcome));
    expect(outcomes.has('won')).toBe(true);
    expect(outcomes.has('lost')).toBe(true);
  });

  it('seed 5003 run twice gives deeply equal results', () => {
    const a = playRun(createScrapcrawlAdapter(), policy(true), 5003, OPTS);
    const b = playRun(createScrapcrawlAdapter(), policy(true), 5003, OPTS);
    expect(a).toEqual(b);
  });

  it('the report renders both result sets with Runs: 200', () => {
    const unarmedReport = renderPlaytestReport('scrapcrawl', 'unarmed', summarise(unarmed()));
    const craftingReport = renderPlaytestReport('scrapcrawl', 'crafting', summarise(crafting()));
    console.log(unarmedReport);
    console.log(craftingReport);
    expect(unarmedReport).toContain('Runs: 200');
    expect(craftingReport).toContain('Runs: 200');
  });
});
