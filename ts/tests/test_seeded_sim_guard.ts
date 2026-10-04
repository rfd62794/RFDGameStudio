// NEW: seeded-sim guard, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const TS_ROOT = resolve(__dirname, '..');
const BASELINE_PATH = join(__dirname, 'seeded_sim_guard.baseline.json');
const SKIP_DIRS = new Set(['sfx', 'components', 'node_modules']);
const BARE_USE = /\bMath\.random\b|\bDate\.now\b|\bperformance\.now\b/g;
const FIX_HINT = 'use mulberry32 from engine/shared/seededRandom (inject rng) or pass the clock in';

function loadBaseline(): Record<string, number> {
  const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as Record<string, unknown>;
  const baseline: Record<string, number> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key !== '_note') baseline[key] = value as number;
  }
  return baseline;
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

function scopedFiles(): string[] {
  const files: string[] = [];
  const sharedDir = join(TS_ROOT, 'src', 'engine', 'shared');
  if (existsSync(sharedDir)) files.push(...walk(sharedDir));
  const gamesDir = join(TS_ROOT, 'src', 'games');
  if (existsSync(gamesDir)) {
    for (const entry of readdirSync(gamesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const simDir = join(gamesDir, entry.name, 'simulation');
      if (existsSync(simDir) && statSync(simDir).isDirectory()) files.push(...walk(simDir));
    }
  }
  return files;
}

function countUses(file: string): number {
  const stripped = readFileSync(file, 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  return (stripped.match(BARE_USE) ?? []).length;
}

function rel(file: string): string {
  return relative(TS_ROOT, file).split(sep).join('/');
}

describe('seeded sim guard', () => {
  const baseline = loadBaseline();
  const counts = new Map<string, number>();
  for (const file of scopedFiles()) counts.set(rel(file), countUses(file));

  it('no new violations', () => {
    const failures: string[] = [];
    for (const [file, count] of counts) {
      if (count === 0) continue;
      const allowed = baseline[file];
      if (allowed === undefined || count > allowed) {
        const note = allowed === undefined ? 'not in baseline' : `baseline allows ${allowed}`;
        failures.push(`${file}: ${count} bare use(s), ${note}`);
      }
    }
    expect(failures, `${failures.join('; ')} — ${FIX_HINT}`).toEqual([]);
  });

  it('baseline can only shrink', () => {
    const failures: string[] = [];
    for (const [file, allowed] of Object.entries(baseline)) {
      const abs = join(TS_ROOT, file);
      if (!existsSync(abs)) {
        failures.push(`${file}: listed in baseline but the file is gone`);
        continue;
      }
      const count = counts.get(file) ?? countUses(abs);
      if (count < allowed) {
        failures.push(`${file}: lower ts/tests/seeded_sim_guard.baseline.json to ${count}`);
      } else if (count > allowed) {
        failures.push(`${file}: ${count} bare use(s), baseline allows ${allowed} — ${FIX_HINT}`);
      }
    }
    expect(failures, failures.join('; ')).toEqual([]);
  });

  it('baseline is real', () => {
    const bad: string[] = [];
    for (const [file, allowed] of Object.entries(baseline)) {
      if (!Number.isInteger(allowed) || allowed <= 0) {
        bad.push(`${file}: baseline count ${allowed} — remove the entry`);
      } else if (!existsSync(join(TS_ROOT, file))) {
        bad.push(`${file}: file missing — remove the entry`);
      }
    }
    expect(bad, bad.join('; ')).toEqual([]);
  });
});
