// new: ts/src/engine/playtest/runner.ts
import { mulberry32 } from '../shared/seededRandom';
import { createStallTracker, findNonFinite } from './invariants';
import type { PlaytestAdapter, Policy, RunOptions, RunResult, Violation } from './types';

/** One seeded run. NEVER throws: every adapter and policy call is wrapped,
 * a throw lands as a `no-throw`/`policy` violation instead. */
export function playRun(
  adapter: PlaytestAdapter,
  policy: Policy,
  seed: number,
  opts: RunOptions = {},
): RunResult {
  const violations: Violation[] = [];
  const record = (check: string, step: number, message: string): void => {
    violations.push({ check, seed, step, message });
  };
  const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

  try {
    adapter.init(seed);
  } catch (e) {
    record('no-throw', 0, msg(e));
    return { seed, steps: 0, outcome: 'error', terminal: false, violations, metrics: {} };
  }

  const rng = mulberry32(seed);
  const stalled = createStallTracker(opts.stallWindow ?? 25);
  const max = opts.maxSteps ?? 500;
  const extra = opts.extraChecks ?? [];
  let steps = 0;

  while (steps < max) {
    let terminalNow = false;
    try {
      terminalNow = adapter.isTerminal();
    } catch (e) {
      record('no-throw', steps, msg(e));
      break;
    }
    if (terminalNow) break;

    let legal: unknown[] = [];
    try {
      legal = adapter.legalActions();
    } catch (e) {
      record('no-throw', steps, msg(e));
      break;
    }
    if (legal.length === 0) {
      record('dead-end', steps, `no legal action at step ${steps}`);
      break;
    }

    let action: unknown;
    try {
      action = policy(adapter.observe(), legal, rng);
    } catch (e) {
      record('policy', steps, msg(e));
      break;
    }

    try {
      adapter.act(action);
    } catch (e) {
      record('no-throw', steps, msg(e));
      break;
    }
    steps++;

    let bad: string | null = null;
    try {
      bad = findNonFinite(adapter.metrics());
    } catch (e) {
      record('no-throw', steps, msg(e));
      break;
    }
    if (bad !== null) {
      record('finite-metrics', steps, bad);
      break;
    }

    let isStalled = false;
    try {
      isStalled = stalled(adapter.fingerprint());
    } catch (e) {
      record('no-throw', steps, msg(e));
      break;
    }
    if (isStalled) {
      record('stall', steps,
        `same fingerprint for ${opts.stallWindow ?? 25} consecutive steps`);
      break;
    }

    let extraHit = false;
    for (const check of extra) {
      const message = check.check(adapter, steps);
      if (message !== null) {
        record(check.name, steps, message);
        extraHit = true;
        break;
      }
    }
    if (extraHit) break;
  }

  let endedTerminal = false;
  try {
    endedTerminal = adapter.isTerminal();
  } catch {
    endedTerminal = false;
  }
  if (violations.length === 0 && !endedTerminal) {
    record('terminal-reached', steps, `not terminal after ${steps} steps`);
  }

  let outcome = 'error';
  try {
    outcome = adapter.outcome();
  } catch {
    outcome = 'error';
  }
  let metrics: Record<string, number> = {};
  try {
    metrics = adapter.metrics();
  } catch {
    metrics = {};
  }
  return { seed, steps, outcome, terminal: endedTerminal, violations, metrics };
}

export function playMany(
  makeAdapter: () => PlaytestAdapter,
  makePolicy: () => Policy,
  seeds: number[],
  opts: RunOptions = {},
): RunResult[] {
  return seeds.map((seed) => playRun(makeAdapter(), makePolicy(), seed, opts));
}
