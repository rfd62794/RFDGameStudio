// new: ts/tests/test_tuning_sweep.ts
import { describe, it, expect } from 'vitest';
import { defineKnob, tuned } from '../src/engine/tuning';
import type { GameTuning, KnobDef } from '../src/engine/tuning/types';
import {
  parseArgs,
  sweepValues,
  seedFor,
  aggregate,
  runRows,
  checkTargets,
} from '../src/engine/tuning/sweep';
import { renderReport } from '../src/engine/tuning/report';

const FX_KNOB: KnobDef = {
  key: 'fx.k',
  label: 'Fixture knob',
  group: 'Test',
  min: 0,
  max: 10,
  step: 1,
  default: 2,
  affects: 'fixture',
  source: { kind: 'const', file: 'test', name: 'K' },
};
defineKnob(FX_KNOB);

const fxTuning: GameTuning = {
  gameId: 'fx',
  knobs: [FX_KNOB],
  targets: [],
  scenarios: ['a', 'b'],
  simulate: () => ({ won: tuned('fx.k') >= 3 ? 1 : 0, steps: tuned('fx.k') }),
};

describe('parseArgs', () => {
  it('defaults runs to 200 with flags off', () => {
    expect(parseArgs(['--game', 'g'])).toEqual({
      game: 'g',
      runs: 200,
      check: false,
      report: false,
    });
  });
  it('parses a full sweep invocation', () => {
    expect(
      parseArgs(['--game', 'g', '--knob', 'g.x', '--from', '1', '--to', '4', '--step', '0.5', '--runs', '50', '--check', '--report'])
    ).toEqual({ game: 'g', knob: 'g.x', from: 1, to: 4, step: 0.5, runs: 50, check: true, report: true });
  });
  it('throws a usage error when --game is missing', () => {
    expect(() => parseArgs([])).toThrow(/usage/);
  });
  it('throws a usage error when --knob lacks --from/--to/--step', () => {
    expect(() => parseArgs(['--game', 'g', '--knob', 'g.x'])).toThrow(/usage/);
    expect(() => parseArgs(['--game', 'g', '--knob', 'g.x', '--from', '1'])).toThrow(/usage/);
  });
  it('throws a usage error on a non-finite number', () => {
    expect(() =>
      parseArgs(['--game', 'g', '--knob', 'g.x', '--from', 'x', '--to', '2', '--step', '1'])
    ).toThrow(/usage/);
    expect(() => parseArgs(['--game', 'g', '--runs', 'abc'])).toThrow(/usage/);
  });
});

describe('sweepValues', () => {
  it('is inclusive and rounds to 6 decimals', () => {
    expect(sweepValues(1, 3, 1)).toEqual([1, 2, 3]);
    expect(sweepValues(0, 1, 0.25)).toHaveLength(5);
    expect(sweepValues(0, 0.3, 0.1)).toEqual([0, 0.1, 0.2, 0.3]);
    expect(sweepValues(1, 3, 0)).toEqual([]);
    expect(sweepValues(3, 1, 1)).toEqual([]);
  });
});

describe('seedFor', () => {
  it('starts at the headless-test base seed', () => {
    expect(seedFor(0)).toBe(5000);
    expect(seedFor(199)).toBe(5199);
  });
});

describe('aggregate', () => {
  it('means each metric and is empty for no runs', () => {
    expect(aggregate([{ won: 1, steps: 2 }, { won: 0, steps: 4 }])).toEqual({ won: 0.5, steps: 3 });
    expect(aggregate([])).toEqual({});
  });
});

describe('runRows', () => {
  it('sweeps one knob across values and scenarios', () => {
    const rows = runRows(fxTuning, 'fx.k', [2, 3], 5);
    expect(rows).toHaveLength(4);
    expect(rows.map(r => [r.value, r.scenario])).toEqual([
      [2, 'a'],
      [3, 'a'],
      [2, 'b'],
      [3, 'b'],
    ]);
    expect(rows.map(r => r.metrics['won'])).toEqual([0, 1, 0, 1]);
    expect(rows.map(r => r.metrics['steps'])).toEqual([2, 3, 2, 3]);
  });
  it('emits one defaults row per scenario when knob is null', () => {
    const rows = runRows(fxTuning, null, [], 5);
    expect(rows).toHaveLength(2);
    expect(rows.every(r => r.value === null && r.metrics['won'] === 0)).toBe(true);
  });
  it('throws when simulate is missing or the knob is unknown', () => {
    expect(() => runRows({ ...fxTuning, simulate: undefined }, null, [], 1)).toThrow(/simulate/);
    expect(() => runRows(fxTuning, 'fx.nope', [1], 1)).toThrow(/fx\.nope/);
  });
});

describe('checkTargets', () => {
  it('passes and fails targets against the defaults rows', () => {
    const tuning: GameTuning = {
      ...fxTuning,
      targets: [
        { id: 'won-ok', metric: 'won', scenario: 'a', min: 0, max: 0.5, note: 'x' },
        { id: 'won-high', metric: 'won', scenario: 'a', min: 0.6, max: 1, note: 'x' },
        { id: 'missing', metric: 'nope', scenario: 'a', min: 0, max: 1, note: 'x' },
      ],
    };
    const rows = runRows(tuning, null, [], 5);
    const results = checkTargets(tuning, rows);
    expect(results.map(r => r.pass)).toEqual([true, false, false]);
    expect(results[0].value).toBe(0);
    expect(results[2].value).toBeUndefined();
  });
});

describe('renderReport', () => {
  it('renders a short markdown report with PASS and FAIL', () => {
    const tuning: GameTuning = {
      ...fxTuning,
      targets: [
        { id: 'won-ok', metric: 'won', scenario: 'a', min: 0, max: 0.5, note: 'n' },
        { id: 'won-bad', metric: 'won', scenario: 'a', min: 0.6, max: 1, note: 'n' },
      ],
    };
    const rows = [...runRows(tuning, 'fx.k', [2, 3], 5), ...runRows(tuning, null, [], 5)];
    const md = renderReport(tuning, rows, checkTargets(tuning, rows), 'fx.k', '2026-10-04');
    expect(md).toContain('Balance report: fx');
    expect(md).toContain('PASS');
    expect(md).toContain('FAIL');
    expect(md).toContain('Seeds 5000..5004');
    expect(md.trimEnd().split('\n').length).toBeLessThan(60);
  });
});
