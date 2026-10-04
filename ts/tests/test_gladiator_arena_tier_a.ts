// @vitest-environment node
// new: ts/tests/test_gladiator_arena_tier_a.ts
//
// Gladiator Arena — Tier A anchors
//
// (a) A7: asserts the standalone build wiring statically so the reviewer's
//     `npm run build:gladiator_arena` run is the only remaining proof.
// (b) A3/A4 source anchors: New Game control + phone tab-bar fit classes.
// (c) A6: real headless runs of the balance harness. The career run executes
//     under a seeded Math.random stub (the harness has no seed option) so its
//     assertions are deterministic; the balance run stays unseeded and
//     asserts only seed-independent invariants.

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runBalanceSimulation,
  runCareerProgressionSimulation,
  type BalanceReport,
  type CareerProgressionReport,
} from '../src/games/gladiator_arena/simulation/balanceHarness';

// mulberry32 PRNG used to stub Math.random for deterministic career runs.
// runCareerProgressionSimulation has no seed option; its randomness is
// Math.random() in the harness, combatEngine.ts, championLadder.ts and
// forgeEconomy.ts, so stubbing it here drives all of them.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
    // Stub Math.random with the seeded PRNG so the career run is
    // deterministic; restore before the unseeded balance run, which keeps
    // running as it did before this tighten pass.
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(1));
    career = runCareerProgressionSimulation(20);
    vi.restoreAllMocks();
    balance = runBalanceSimulation({ boutsPerOpponent: 3, shopSamplesPerTier: 5 });
  }, 30000); // a 20-career run measured ~1.5 s; 30 s bounds the no-softlock check

  it('runCareerProgressionSimulation(20) returns without throwing and careersSimulated === 20', () => {
    expect(career.careersSimulated).toBe(20);
  });

  it('career run is deterministic under a seeded Math.random stub', () => {
    // A second run under a fresh mulberry32(1) stub must reproduce the seeded
    // report. timestamp is excluded: it is Date.now(), not simulation output.
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(1));
    const repeat = runCareerProgressionSimulation(20);
    vi.restoreAllMocks();
    expect(repeat.tierClearRates).toEqual(career.tierClearRates);
    expect(repeat.completionRatePercent).toBe(career.completionRatePercent);
    expect(repeat.medianBoutsToClear).toBe(career.medianBoutsToClear);
    expect(repeat.avgGoldEarned).toBe(career.avgGoldEarned);
  });

  it('economy aggregates are finite and non-negative, avgGoldEarned > 0', () => {
    // Per-career gold is internal to the harness — guarded by construction
    // (repairs pay Math.min(gold, ...), scar removal needs gold > 100 and pays
    // at most gold - 60, a shop upgrade needs part.cost <= gold) and never
    // exposed on the report, so "no negative gold" is asserted through these
    // non-negative aggregates, the only observable proxy.
    for (const value of [
      career.avgGoldEarned,
      career.avgGoldSpentOnRepairs,
      career.avgGoldSpentOnUpgrades,
      career.avgScarsPerCareer,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
    expect(career.avgGoldEarned).toBeGreaterThan(0);
  });

  it('tier 5 is reachable and medianBoutsToClear respects the 65-bout ceiling', () => {
    // tierClearRates[5] and completionRatePercent both count a defeated tier
    // 5 champion (tierClearCounts[currentTierId]++ and completedCampaign,
    // balanceHarness.ts lines 525 and 617), so they must agree.
    expect(career.tierClearRates[5]).toBeGreaterThan(0);
    expect(career.completionRatePercent).toBe(career.tierClearRates[5]);
    // A clear needs at least one bout per tier (>= 5) and at most
    // maxCareerBouts = 65 (line 473), the documented softlock ceiling.
    expect(career.medianBoutsToClear).toBeGreaterThanOrEqual(5);
    expect(career.medianBoutsToClear).toBeLessThanOrEqual(65);
  });

  it('tierClearRates form a non-increasing 0-100 funnel with tier 1 above the difficulty bar', () => {
    // A career can only defeat tier t+1's champion after tier t's, so the
    // clear counts are non-increasing by construction.
    for (let t = 1; t <= 5; t++) {
      expect(career.tierClearRates[t]).toBeGreaterThanOrEqual(0);
      expect(career.tierClearRates[t]).toBeLessThanOrEqual(100);
    }
    for (let t = 1; t <= 4; t++) {
      expect(career.tierClearRates[t + 1]).toBeLessThanOrEqual(
        career.tierClearRates[t]
      );
    }
    // 70 is the harness's own bar: below it the diagnostic reports
    // TOO_DIFFICULT (balanceHarness.ts line 679).
    expect(career.tierClearRates[1]).toBeGreaterThanOrEqual(70);
  });

  it('progressionCurve has 5 entries, each avgBoutsRequired finite and <= 65', () => {
    // ARENA_TIERS has 5 tiers; per-tier bout counts are bounded by
    // maxCareerBouts = 65 (line 473), the harness's softlock guard.
    expect(career.progressionCurve.length).toBe(5);
    for (const entry of career.progressionCurve) {
      expect(Number.isFinite(entry.avgBoutsRequired)).toBe(true);
      expect(entry.avgBoutsRequired).toBeLessThanOrEqual(65);
    }
  });

  it('balanceDiagnostic is well-formed (status enum + recommendations)', () => {
    // Seeds 1-3 measured ECONOMIC_SPIRAL on origin/main (repairs > 1.4x
    // upgrades): a real balance finding, not a test failure, so no specific
    // status is asserted — only that the diagnostic is well-formed.
    expect([
      'HEALTHY',
      'TOO_DIFFICULT',
      'TOO_EASY',
      'ECONOMIC_SPIRAL',
    ]).toContain(career.balanceDiagnostic.status);
    expect(
      career.balanceDiagnostic.recommendations.length
    ).toBeGreaterThan(0);
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
