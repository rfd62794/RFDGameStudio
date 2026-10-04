// @vitest-environment node
// new: ts/tests/test_gladiator_arena_tier_a.ts
//
// Gladiator Arena — Tier A anchors
//
// (a) A7: asserts the standalone build wiring statically so the reviewer's
//     `npm run build:gladiator_arena` run is the only remaining proof.
// (b) A3/A4 source anchors: New Game control + phone tab-bar fit classes.
// (c) A6: real headless runs of the balance harness. The harness uses
//     randomness, so only seed-independent invariants are asserted
//     (counts match, all numerics finite and non-negative).

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runBalanceSimulation,
  runCareerProgressionSimulation,
  type BalanceReport,
  type CareerProgressionReport,
} from '../src/games/gladiator_arena/simulation/balanceHarness';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const tsRoot = resolve(repoRoot, 'ts');

describe('test_gladiator_arena_build_wiring', () => {
  it('package.json has build:gladiator_arena script referencing vite.gladiator_arena.config.ts', () => {
    const pkg = readFileSync(resolve(tsRoot, 'package.json'), 'utf-8');
    expect(pkg).toContain('build:gladiator_arena');
    expect(pkg).toContain('vite.gladiator_arena.config.ts');
  });

  it('vite.gladiator_arena.config.ts calls makeStandaloneConfig(gladiator_arena)', () => {
    const configPath = resolve(tsRoot, 'vite.gladiator_arena.config.ts');
    expect(existsSync(configPath)).toBe(true);
    const config = readFileSync(configPath, 'utf-8');
    expect(config).toContain("makeStandaloneConfig('gladiator_arena')");
  });

  it('standalone entry imports ../../games/gladiator_arena/App', () => {
    const entryPath = resolve(tsRoot, 'src/standalone/gladiator_arena/entry.tsx');
    expect(existsSync(entryPath)).toBe(true);
    const entry = readFileSync(entryPath, 'utf-8');
    expect(entry).toContain("import App from '../../games/gladiator_arena/App'");
  });

  it('standalone index.html has <div id="root">', () => {
    const htmlPath = resolve(tsRoot, 'src/standalone/gladiator_arena/index.html');
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('<div id="root">');
  });
});

describe('test_gladiator_arena_tier_a_source', () => {
  it('App.tsx contains ga-new-game, NewGameButton, useArmedConfirm and sm:inline', () => {
    const app = readFileSync(
      resolve(tsRoot, 'src/games/gladiator_arena/App.tsx'),
      'utf-8'
    );
    expect(app).toContain('ga-new-game');
    expect(app).toContain('NewGameButton');
    expect(app).toContain('useArmedConfirm');
    expect(app).toContain('sm:inline');
  });
});

describe('test_gladiator_arena_career_logic', () => {
  let career: CareerProgressionReport;
  let balance: BalanceReport;

  beforeAll(() => {
    career = runCareerProgressionSimulation(5);
    balance = runBalanceSimulation({ boutsPerOpponent: 3, shopSamplesPerTier: 5 });
  });

  it('runCareerProgressionSimulation(5) returns without throwing and careersSimulated === 5', () => {
    expect(career.careersSimulated).toBe(5);
  });

  it('career report: avgGoldEarned, completionRatePercent and medianBoutsToClear are finite and >= 0', () => {
    for (const value of [
      career.avgGoldEarned,
      career.completionRatePercent,
      career.medianBoutsToClear,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('career report: tierClearRates[1] (and all five tiers) finite and >= 0', () => {
    for (let t = 1; t <= 5; t++) {
      expect(Number.isFinite(career.tierClearRates[t])).toBe(true);
      expect(career.tierClearRates[t]).toBeGreaterThanOrEqual(0);
    }
  });

  it('runBalanceSimulation({boutsPerOpponent:3, shopSamplesPerTier:5}) returns without throwing; sampleSizePerOpponent === 3', () => {
    expect(balance.sampleSizePerOpponent).toBe(3);
  });

  it('balance report: overallWinRate, overallAvgRounds and actionDiversityScore are not NaN', () => {
    for (const value of [
      balance.overallWinRate,
      balance.overallAvgRounds,
      balance.actionDiversityScore,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('balance report: every tierSummary winRatePercent and avgRoundsToResolve is not NaN', () => {
    expect(balance.tierSummaries.length).toBeGreaterThan(0);
    for (const tier of balance.tierSummaries) {
      expect(Number.isFinite(tier.winRatePercent)).toBe(true);
      expect(Number.isFinite(tier.avgRoundsToResolve)).toBe(true);
    }
  });
});
