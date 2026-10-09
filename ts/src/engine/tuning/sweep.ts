// new: ts/src/engine/tuning/sweep.ts
import type { GameTuning, Metrics, Target } from './types';
import { withOverrides } from './store';

export interface SweepArgs {
  game: string;
  knob?: string;
  from?: number;
  to?: number;
  step?: number;
  runs: number;
  check: boolean;
  report: boolean;
}

const USAGE =
  'usage: tune-sweep --game <id> [--knob <key> --from <n> --to <n> --step <n>] [--runs <n>] [--check] [--report]';

export function parseArgs(argv: string[]): SweepArgs {
  const out: SweepArgs = { game: '', runs: 200, check: false, report: false };
  const takeValue = (i: number): string => {
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(USAGE);
    return value;
  };
  const takeNumber = (i: number): number => {
    const n = Number(takeValue(i));
    if (!Number.isFinite(n)) throw new Error(USAGE);
    return n;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--') continue;
    if (flag === '--check') {
      out.check = true;
    } else if (flag === '--report') {
      out.report = true;
    } else if (flag === '--game' || flag === '--knob') {
      const value = takeValue(i);
      if (flag === '--game') out.game = value;
      else out.knob = value;
      i += 1;
    } else if (flag === '--from' || flag === '--to' || flag === '--step' || flag === '--runs') {
      const n = takeNumber(i);
      if (flag === '--from') out.from = n;
      else if (flag === '--to') out.to = n;
      else if (flag === '--step') out.step = n;
      else out.runs = n;
      i += 1;
    } else {
      throw new Error(USAGE);
    }
  }
  if (out.game === '') throw new Error(USAGE);
  if (
    out.knob !== undefined &&
    (out.from === undefined || out.to === undefined || out.step === undefined)
  ) {
    throw new Error(USAGE);
  }
  return out;
}

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;

export function sweepValues(from: number, to: number, step: number): number[] {
  if (!Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(step)) return [];
  if (step <= 0 || from > to) return [];
  const out: number[] = [];
  for (let i = 0; i < 10000; i += 1) {
    const value = round6(from + i * step);
    if (value > to) break;
    out.push(value);
  }
  return out;
}

export function seedFor(i: number): number {
  return 5000 + i;
}

export function aggregate(runs: Metrics[]): Record<string, number> {
  const sums = new Map<string, { sum: number; count: number }>();
  for (const run of runs) {
    for (const [key, value] of Object.entries(run)) {
      const entry = sums.get(key) ?? { sum: 0, count: 0 };
      entry.sum += value;
      entry.count += 1;
      sums.set(key, entry);
    }
  }
  const out: Record<string, number> = {};
  for (const [key, { sum, count }] of sums) out[key] = sum / count;
  return out;
}

export interface Row {
  value: number | null; // null = defaults, no override
  scenario: string;
  runs: number;
  metrics: Record<string, number>;
}

export function runRows(
  tuning: GameTuning,
  knob: string | null,
  values: number[],
  runs: number
): Row[] {
  const simulate = tuning.simulate;
  if (!simulate) throw new Error(`${tuning.gameId} has no simulate`);
  if (knob !== null && !tuning.knobs.some(k => k.key === knob)) {
    throw new Error(`${tuning.gameId} has no knob ${knob}`);
  }
  const scenarios = tuning.scenarios ?? ['default'];
  const column: (number | null)[] = knob === null ? [null] : values;
  const rows: Row[] = [];
  for (const scenario of scenarios) {
    for (const value of column) {
      const overrides = value === null ? {} : { [knob as string]: value };
      const results = withOverrides(overrides, () => {
        const out: Metrics[] = [];
        for (let i = 0; i < runs; i += 1) {
          out.push(simulate({ seed: seedFor(i), scenario }));
        }
        return out;
      });
      rows.push({ value, scenario, runs, metrics: aggregate(results) });
    }
  }
  return rows;
}

export interface TargetResult {
  target: Target;
  value: number | undefined;
  pass: boolean;
}

export function checkTargets(tuning: GameTuning, rows: Row[]): TargetResult[] {
  const defaults = rows.filter(r => r.value === null);
  return tuning.targets.map(target => {
    const scenario = target.scenario ?? 'default';
    const row = defaults.find(r => r.scenario === scenario);
    const value = row?.metrics[target.metric];
    return { target, value, pass: value !== undefined && value >= target.min && value <= target.max };
  });
}

export function renderTable(rows: Row[], metricNames: string[]): string {
  const headers = ['value', 'scenario', 'runs', ...metricNames];
  const body = rows.map(row => [
    row.value === null ? 'default' : String(row.value),
    row.scenario,
    String(row.runs),
    ...metricNames.map(name => (row.metrics[name] ?? Number.NaN).toFixed(3)),
  ]);
  const widths = headers.map((h, i) => Math.max(h.length, ...body.map(cols => cols[i].length)));
  const line = (cols: string[]): string =>
    cols.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd();
  const rule = widths.map(w => '-'.repeat(w)).join('  ');
  return [line(headers), rule, ...body.map(line)].join('\n');
}
