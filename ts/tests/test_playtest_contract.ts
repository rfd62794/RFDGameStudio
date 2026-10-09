// new: ts/tests/test_playtest_contract.ts
import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import {
  createStallTracker,
  findNonFinite,
  firstLegalPolicy,
  formatFinding,
  greedyPolicy,
  playRun,
  randomPolicy,
  renderFinding,
  renderPlaytestReport,
  scriptedPolicy,
  summarise,
} from '../src/engine/playtest';
import type { ExtraCheck, PlaytestAdapter, RunResult } from '../src/engine/playtest';

/** A counter: 'inc'/'dec', victory at 5, game_over at -3. */
class ToyAdapter implements PlaytestAdapter<number, string> {
  n = 0;
  readonly gameId = 'toy';
  init(): void { this.n = 0; }
  observe(): number { return this.n; }
  legalActions(): string[] { return ['inc', 'dec']; }
  act(a: string): void { this.n += a === 'inc' ? 1 : -1; }
  isTerminal(): boolean { return this.n >= 5 || this.n <= -3; }
  outcome(): string {
    return this.n >= 5 ? 'victory' : this.n <= -3 ? 'game_over' : 'playing';
  }
  metrics(): Record<string, number> { return { n: this.n }; }
  fingerprint(): string { return String(this.n); }
}

/** Always legal, never terminal, never stalls (fingerprint ticks). */
class ForeverAdapter implements PlaytestAdapter<number, string> {
  private fp = 0;
  readonly gameId = 'toy';
  init(): void { this.fp = 0; }
  observe(): number { return 0; }
  legalActions(): string[] { return ['wait']; }
  act(): void { /* nothing changes */ }
  isTerminal(): boolean { return false; }
  outcome(): string { return 'playing'; }
  metrics(): Record<string, number> { return { n: 0 }; }
  fingerprint(): string { return String(this.fp++); }
}

describe('playtest contract', () => {
  it('randomPolicy is deterministic per seed and uses every action', () => {
    const legal = ['a', 'b', 'c'];
    const p1 = randomPolicy();
    const p2 = randomPolicy();
    const r1 = mulberry32(7);
    const r2 = mulberry32(7);
    const s1 = Array.from({ length: 10 }, () => p1(0, legal, r1));
    const s2 = Array.from({ length: 10 }, () => p2(0, legal, r2));
    expect(s1).toEqual(s2);
    const r3 = mulberry32(7);
    const p3 = randomPolicy();
    const seen = new Set(Array.from({ length: 60 }, () => p3(0, legal, r3)));
    expect(seen).toEqual(new Set(['a', 'b', 'c']));
  });

  it('firstLegalPolicy takes legal[0]; greedyPolicy scores max, ties earliest', () => {
    const rng = mulberry32(1);
    expect(firstLegalPolicy()(0, ['x', 'y'], rng)).toBe('x');
    const scores: Record<string, number> = { x: 1, y: 3, z: 3 };
    const g = greedyPolicy((a) => scores[a as string]);
    expect(g(0, ['x', 'y', 'z'], rng)).toBe('y');
  });

  it('scriptedPolicy returns actions in order then throws script exhausted', () => {
    const p = scriptedPolicy(['inc', 'inc']);
    expect(p(0, ['inc'], mulberry32(1))).toBe('inc');
    expect(p(0, ['inc'], mulberry32(1))).toBe('inc');
    expect(() => p(0, ['inc'], mulberry32(1))).toThrow('script exhausted');
  });

  it('a scripted victory plays to terminal with no violations', () => {
    const r = playRun(new ToyAdapter(), scriptedPolicy(Array(5).fill('inc')), 1);
    expect(r.terminal).toBe(true);
    expect(r.outcome).toBe('victory');
    expect(r.steps).toBe(5);
    expect(r.violations).toEqual([]);
  });

  it('the same seed twice returns deeply equal results', () => {
    const a = playRun(new ToyAdapter(), randomPolicy(), 42);
    const b = playRun(new ToyAdapter(), randomPolicy(), 42);
    expect(a).toEqual(b);
  });

  it('a throwing act or init is a no-throw violation, never a crash', () => {
    class ThrowAct extends ToyAdapter {
      act(): void { throw new Error('act boom'); }
    }
    const r = playRun(new ThrowAct(), firstLegalPolicy(), 1);
    expect(r.violations).toHaveLength(1);
    expect(r.violations[0].check).toBe('no-throw');
    expect(r.violations[0].message).toBe('act boom');
    expect(r.violations[0].step).toBe(0);
    class ThrowInit extends ToyAdapter {
      init(): void { throw new Error('init boom'); }
    }
    const r2 = playRun(new ThrowInit(), firstLegalPolicy(), 1);
    expect(r2.steps).toBe(0);
    expect(r2.outcome).toBe('error');
    expect(r2.violations[0].check).toBe('no-throw');
    expect(r2.violations[0].message).toBe('init boom');
  });

  it('non-finite metrics record finite-metrics; all-finite does not', () => {
    class NanAdapter extends ToyAdapter {
      metrics(): Record<string, number> { return { n: NaN }; }
    }
    const r = playRun(new NanAdapter(), firstLegalPolicy(), 1);
    expect(r.violations[0].check).toBe('finite-metrics');
    expect(r.violations[0].message).toContain('n=NaN');
    class InfAdapter extends ToyAdapter {
      metrics(): Record<string, number> { return { n: Infinity }; }
    }
    const r2 = playRun(new InfAdapter(), firstLegalPolicy(), 1);
    expect(r2.violations[0].check).toBe('finite-metrics');
    expect(r2.violations[0].message).toContain('n=Infinity');
    expect(findNonFinite({ a: 1, b: 2 })).toBeNull();
  });

  it('empty legal actions while not terminal is a dead-end', () => {
    class DeadEnd extends ToyAdapter {
      legalActions(): string[] { return []; }
    }
    const r = playRun(new DeadEnd(), firstLegalPolicy(), 1);
    expect(r.violations[0].check).toBe('dead-end');
    expect(r.violations[0].message).toBe('no legal action at step 0');
  });

  it('a constant fingerprint stalls at the window; alternating never does', () => {
    class ConstFp extends ForeverAdapter {
      fingerprint(): string { return 'same'; }
    }
    const r = playRun(new ConstFp(), firstLegalPolicy(), 1);
    expect(r.violations[0].check).toBe('stall');
    expect(r.violations[0].step).toBe(25);
    const alternating = scriptedPolicy(
      Array.from({ length: 60 }, (_, i) => (i % 2 ? 'dec' : 'inc')));
    const r2 = playRun(new ToyAdapter(), alternating, 1, { maxSteps: 60 });
    expect(r2.violations.some((v) => v.check === 'stall')).toBe(false);
    const track = createStallTracker(3);
    expect(track('x')).toBe(false);
    expect(track('x')).toBe(false);
    expect(track('x')).toBe(true);
  });

  it('the cap records terminal-reached; an ExtraCheck names its own check', () => {
    const r = playRun(new ForeverAdapter(), firstLegalPolicy(), 1, { maxSteps: 50 });
    expect(r.violations[0].check).toBe('terminal-reached');
    expect(r.steps).toBe(50);
    const check: ExtraCheck = {
      name: 'saw-three',
      check: (_a, step) => (step === 3 ? 'bad' : null),
    };
    const r2 = playRun(new ForeverAdapter(), firstLegalPolicy(), 1,
      { extraChecks: [check] });
    expect(r2.violations[0].check).toBe('saw-three');
    expect(r2.violations[0].step).toBe(3);
  });

  it('a throwing ExtraCheck lands as a violation, never a crash', () => {
    const check: ExtraCheck = {
      name: 'fragile',
      check: () => { throw new Error('check boom'); },
    };
    const r = playRun(new ToyAdapter(), scriptedPolicy(Array(5).fill('inc')), 1,
      { extraChecks: [check] });
    expect(r.violations).toHaveLength(1);
    expect(r.violations[0].check).toBe('fragile');
    expect(r.violations[0].message).toBe('check boom');
    expect(r.violations[0].step).toBe(1);
  });

  it('summarise counts outcomes, rates, length, outliers and byCheck', () => {
    const results: RunResult[] = [
      { seed: 1, steps: 10, outcome: 'victory', terminal: true, violations: [], metrics: {} },
      { seed: 2, steps: 10, outcome: 'game_over', terminal: true,
        violations: [{ check: 'stall', seed: 2, step: 10, message: 'm' }], metrics: {} },
      { seed: 3, steps: 100, outcome: 'victory', terminal: true, violations: [], metrics: {} },
    ];
    const s = summarise(results);
    expect(s.runs).toBe(3);
    expect(s.outcomes).toEqual({ victory: 2, game_over: 1 });
    expect(s.rates.victory).toBeCloseTo(2 / 3);
    expect(s.length).toEqual({ min: 10, median: 10, p95: 100, max: 100 });
    expect(s.outlierSeeds).toEqual([3]);
    expect(s.violations).toHaveLength(1);
    expect(s.byCheck).toEqual({ stall: 1 });
  });

  it('report and findings render the spec format exactly', () => {
    const results: RunResult[] = [
      { seed: 1, steps: 10, outcome: 'victory', terminal: true,
        violations: [{ check: 'stall', seed: 1, step: 5, message: 'm' }], metrics: {} },
    ];
    const report = renderPlaytestReport('toy', 'random', summarise(results));
    expect(report).toContain('toy');
    expect(report).toContain('victory');
    const vIdx = report.indexOf('## Violations');
    expect(vIdx).toBeGreaterThanOrEqual(0);
    expect(vIdx).toBeLessThan(report.indexOf('Runs:'));
    const finding = renderFinding(
      { check: 'stall', seed: 3, step: 25, message: 'a\n  b' },
      'toy', 'cd ts && npx vitest run test_x.ts');
    expect(finding).toBe(
      'FINDING toy L1/stall seed=3 step=25 :: a b :: repro: cd ts && npx vitest run test_x.ts');
    const long = renderFinding(
      { check: 'x', seed: 1, step: 1, message: 'm'.repeat(300) }, 'toy', 'r');
    expect(long).toContain('m'.repeat(160));
    expect(long).not.toContain('m'.repeat(161));
    expect(formatFinding('L2', 'toy', 'clipped', 'script', 2, 'm', 'r')).toBe(
      'FINDING toy L2/clipped seed=script step=2 :: m :: repro: r');
  });
});
