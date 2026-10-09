// new: ts/src/engine/playtest/report.ts
import type { RunResult, Violation } from './types';

export interface PlaytestSummary {
  runs: number;
  outcomes: Record<string, number>;
  rates: Record<string, number>;
  length: { min: number; median: number; p95: number; max: number };
  outlierSeeds: number[];
  violations: Violation[];
  byCheck: Record<string, number>;
}

export function summarise(results: RunResult[]): PlaytestSummary {
  const runs = results.length;
  const outcomes: Record<string, number> = {};
  const rates: Record<string, number> = {};
  const byCheck: Record<string, number> = {};
  const violations: Violation[] = [];
  const stepsSeen: number[] = [];
  for (const r of results) {
    outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;
    stepsSeen.push(r.steps);
    for (const v of r.violations) {
      violations.push(v);
      byCheck[v.check] = (byCheck[v.check] ?? 0) + 1;
    }
  }
  for (const key of Object.keys(outcomes)) rates[key] = outcomes[key] / runs;
  const sorted = [...stepsSeen].sort((a, b) => a - b);
  const n = sorted.length;
  const length = n === 0
    ? { min: 0, median: 0, p95: 0, max: 0 }
    : {
        min: sorted[0],
        median: sorted[Math.floor((n - 1) / 2)],
        p95: sorted[Math.ceil(0.95 * n) - 1],
        max: sorted[n - 1],
      };
  const outlierSeeds = length.median > 0
    ? results.filter((r) => r.steps > 3 * length.median).map((r) => r.seed)
    : [];
  return { runs, outcomes, rates, length, outlierSeeds, violations, byCheck };
}

export function renderPlaytestReport(
  gameId: string,
  policyName: string,
  summary: PlaytestSummary,
): string {
  const outcomes = Object.keys(summary.outcomes)
    .map((k) => `${k} ${Math.round((summary.rates[k] ?? 0) * 100)}%`)
    .join(' | ');
  const runsLine =
    `Runs: ${summary.runs} | ${outcomes} | length median ${summary.length.median}` +
    `, p95 ${summary.length.p95}, max ${summary.length.max}`;
  const lines = [`# Playtest bots: ${gameId} (${policyName})`];
  if (summary.violations.length > 0) {
    lines.push('## Violations');
    for (const v of summary.violations) {
      lines.push(`- ${v.check} seed=${v.seed} step=${v.step}: ${v.message}`);
    }
    lines.push(runsLine);
  } else {
    lines.push(runsLine);
    lines.push('No violations.');
  }
  if (summary.outlierSeeds.length > 0) {
    lines.push(`Outliers: seeds ${summary.outlierSeeds.join(', ')}`);
  }
  return lines.join('\n');
}

const clip = (message: string): string =>
  message.replace(/\s+/g, ' ').trim().slice(0, 160);

export function formatFinding(
  layer: 'L1' | 'L2' | 'L3' | 'L4',
  gameId: string,
  check: string,
  seed: number | string,
  step: number,
  message: string,
  repro: string,
): string {
  return `FINDING ${gameId} ${layer}/${check} seed=${seed} step=${step}` +
    ` :: ${clip(message)} :: repro: ${repro}`;
}

export function renderFinding(v: Violation, gameId: string, repro: string): string {
  return formatFinding('L1', gameId, v.check, v.seed, v.step, v.message, repro);
}
