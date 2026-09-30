// @vitest-environment node
//
// Mutant Battle Ball — Body Part Synergy (Neo Battlopolis overhaul)
// Test Anchors
//
// Verifies the two cross-part synergy mechanics:
//   1. Brand Trinity — 3+ parts of the same Brand re-apply that Brand's
//      signature at mutant level (the signature doubles).
//   2. Cyber-Organic lean compatibility — uniform lean across the body
//      resonates (bonus); mixed lean pays dissonance. Math consumed
//      from engine/shared/anatomy (calculateLeanCompatibility) — the
//      ADR-014 shared extraction with Gladiator Arena as first consumer.
//   3. Wiring: getMutantSynergy feeds calculateStats (single pipeline)
//      and is surfaced in WorkshopTab where equip decisions are made.
//

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parse } from 'js-yaml';

import { calculateStats } from '../src/games/mutant_battle_ball/simulation/mbbSimulation';
import { makeAgent } from '../src/games/mutant_battle_ball/simulation/mbbAgent';
import type { Mutant } from '../src/games/mutant_battle_ball/types';
import {
  getMutantSynergy,
  mbbLeanToAnatomyScale,
  TRINITY_THRESHOLD,
  COMPATIBILITY_TIER_LABELS,
} from '../src/games/mutant_battle_ball/bodyPartSynergy';
import { getEffectivePartStats } from '../src/games/mutant_battle_ball/brandModifiers';
import { calculateCompatibility, calculateLeanCompatibility } from '../src/engine/shared/anatomy';
import type { BodyPart, BodySlot } from '../src/engine/shared/anatomy';
import type { Part, PartsBySlot } from '../src/engine/shared/partSlots';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const dataPath = resolve(repoRoot, 'games', 'mutant_battle_ball', 'data.yaml');
const data = parse(readFileSync(dataPath, 'utf-8')) as Record<string, unknown>;

// ── Helpers ──────────────────────────────────────────────────────────

function makePart(overrides: Partial<Part> & { id: string; slot: Part['slot'] }): Part {
  return {
    name: 'Test Part',
    accuracy: 40,
    endurance: 40,
    power: 40,
    speed: 40,
    price: 50,
    ...overrides,
  };
}

function mutantFrom(parts: Part[]): { parts: PartsBySlot } {
  return {
    parts: {
      head: parts[0] ?? null,
      chest: parts[1] ?? null,
      left_arm: parts[2] ?? null,
      right_arm: parts[3] ?? null,
      left_leg: parts[4] ?? null,
      right_leg: parts[5] ?? null,
    },
  };
}

function partsFromData(): Record<string, Part> {
  const partsData = data['parts'] as Array<Record<string, unknown>>;
  const map: Record<string, Part> = {};
  for (const p of partsData) map[p['id'] as string] = p as unknown as Part;
  return map;
}

function mutantFromData(mutantId: string): { parts: PartsBySlot } {
  const map = partsFromData();
  const starters = data['starter_mutants'] as Array<Record<string, unknown>>;
  const m = starters.find(s => s['id'] === mutantId)!;
  const rawParts = m['parts'] as Record<string, string>;
  const parts: Partial<PartsBySlot> = {};
  for (const [slot, partId] of Object.entries(rawParts)) {
    parts[slot as keyof PartsBySlot] = map[partId] ?? null;
  }
  return { parts: parts as PartsBySlot };
}

// ─────────────────────────────────────────────────────────────────────
// Anchor 1: Brand Trinity set bonus is real
// ─────────────────────────────────────────────────────────────────────

describe('test_brand_trinity_set_bonus', () => {
  it('3+ parts of the same Brand activates Trinity; 2 does not', () => {
    const two = mutantFrom([
      makePart({ id: 'a', slot: 'head', brand: 'trueflame' }),
      makePart({ id: 'b', slot: 'chest', brand: 'trueflame' }),
      makePart({ id: 'c', slot: 'left_arm' }),
      makePart({ id: 'd', slot: 'right_arm' }),
      makePart({ id: 'e', slot: 'left_leg' }),
      makePart({ id: 'f', slot: 'right_leg' }),
    ]);
    expect(getMutantSynergy(two.parts).trinityBrands).toHaveLength(0);

    const three = mutantFrom([
      makePart({ id: 'a', slot: 'head', brand: 'trueflame' }),
      makePart({ id: 'b', slot: 'chest', brand: 'trueflame' }),
      makePart({ id: 'c', slot: 'left_arm', brand: 'trueflame' }),
      makePart({ id: 'd', slot: 'right_arm' }),
      makePart({ id: 'e', slot: 'left_leg' }),
      makePart({ id: 'f', slot: 'right_leg' }),
    ]);
    const report = getMutantSynergy(three.parts);
    expect(report.trinityBrands).toContain('trueflame');
    expect(report.brandCounts.trueflame).toBe(TRINITY_THRESHOLD);
  });

  it('Trinity re-applies the Brand signature at mutant level (doubles it)', () => {
    // 3 Trueflame (+15% power each per-part, +15% power again at mutant level)
    // + 3 unbranded parts. Base power 40 everywhere, no lean.
    const trinity = mutantFrom([
      makePart({ id: 'a', slot: 'head', brand: 'trueflame' }),
      makePart({ id: 'b', slot: 'chest', brand: 'trueflame' }),
      makePart({ id: 'c', slot: 'left_arm', brand: 'trueflame' }),
      makePart({ id: 'd', slot: 'right_arm' }),
      makePart({ id: 'e', slot: 'left_leg' }),
      makePart({ id: 'f', slot: 'right_leg' }),
    ]);
    const stats = calculateStats(trinity);
    // Per-part effective power: 40 * 1.15 = 46. Sum: 46*3 + 40*3 = 258.
    // Trinity multiplier: 258 * 1.15 = 296.7
    expect(stats.power).toBeCloseTo(296.7, 1);
    // Non-signature stats get no Trinity multiplier
    expect(stats.accuracy).toBeCloseTo(240, 1);

    // Same base stats, mixed brands (no Trinity) — lower power
    const mixed = mutantFrom([
      makePart({ id: 'a', slot: 'head', brand: 'trueflame' }),
      makePart({ id: 'b', slot: 'chest', brand: 'icevault' }),
      makePart({ id: 'c', slot: 'left_arm', brand: 'quicksilver' }),
      makePart({ id: 'd', slot: 'right_arm' }),
      makePart({ id: 'e', slot: 'left_leg' }),
      makePart({ id: 'f', slot: 'right_leg' }),
    ]);
    const mixedStats = calculateStats(mixed);
    expect(stats.power).toBeGreaterThan(mixedStats.power);
  });

  it('6 slots can hold two Trinities (3+3)', () => {
    const dual = mutantFrom([
      makePart({ id: 'a', slot: 'head', brand: 'trueflame' }),
      makePart({ id: 'b', slot: 'chest', brand: 'trueflame' }),
      makePart({ id: 'c', slot: 'left_arm', brand: 'trueflame' }),
      makePart({ id: 'd', slot: 'right_arm', brand: 'icevault' }),
      makePart({ id: 'e', slot: 'left_leg', brand: 'icevault' }),
      makePart({ id: 'f', slot: 'right_leg', brand: 'icevault' }),
    ]);
    const report = getMutantSynergy(dual.parts);
    expect(report.trinityBrands).toContain('trueflame');
    expect(report.trinityBrands).toContain('icevault');
    // Trueflame trinity → power ×1.15; Icevault trinity → endurance ×1.15
    expect(report.statMultipliers.power).toBeCloseTo(1.15, 5);
    expect(report.statMultipliers.endurance).toBeCloseTo(1.15, 5);
  });

  it('Brand counts only count branded parts', () => {
    const report = getMutantSynergy(mutantFrom([
      makePart({ id: 'a', slot: 'head' }),
      makePart({ id: 'b', slot: 'chest' }),
      makePart({ id: 'c', slot: 'left_arm' }),
      makePart({ id: 'd', slot: 'right_arm' }),
      makePart({ id: 'e', slot: 'left_leg' }),
      makePart({ id: 'f', slot: 'right_leg' }),
    ]).parts);
    expect(Object.values(report.brandCounts).every(c => c === 0)).toBe(true);
    expect(report.trinityBrands).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 2: Cyber-Organic lean compatibility is real
// ─────────────────────────────────────────────────────────────────────

describe('test_lean_compatibility_synergy', () => {
  it('MBB 0-100 lean converts to anatomy -1..+1 scale', () => {
    expect(mbbLeanToAnatomyScale(0)).toBe(-1);
    expect(mbbLeanToAnatomyScale(50)).toBe(0);
    expect(mbbLeanToAnatomyScale(100)).toBe(1);
  });

  it('uniform organic lean → pure_synergy (bio resonance)', () => {
    const organic = mutantFrom(
      Array.from({ length: 6 }, (_, i) =>
        makePart({ id: `o${i}`, slot: 'head', cyberOrganicLean: 20 })
      ),
    );
    const report = getMutantSynergy(organic.parts);
    expect(report.compatibility?.compatibilityTier).toBe('pure_synergy');
    expect(report.compatibility?.synergyBonus.speedPercent).toBe(15);
    expect(report.compatibility?.synergyBonus.powerPercent).toBe(10);
  });

  it('uniform cyber lean → pure_synergy (cyber overclock)', () => {
    const cyber = mutantFrom(
      Array.from({ length: 6 }, (_, i) =>
        makePart({ id: `c${i}`, slot: 'head', cyberOrganicLean: 90 })
      ),
    );
    const report = getMutantSynergy(cyber.parts);
    expect(report.compatibility?.compatibilityTier).toBe('pure_synergy');
    expect(report.compatibility?.synergyBonus.powerPercent).toBe(15);
    expect(report.compatibility?.synergyBonus.speedPercent).toBe(10);
  });

  it('extreme mixed lean → critical_rejection penalty', () => {
    const mixed = mutantFrom([
      makePart({ id: 'a', slot: 'head', cyberOrganicLean: 0 }),
      makePart({ id: 'b', slot: 'chest', cyberOrganicLean: 0 }),
      makePart({ id: 'c', slot: 'left_arm', cyberOrganicLean: 0 }),
      makePart({ id: 'd', slot: 'right_arm', cyberOrganicLean: 100 }),
      makePart({ id: 'e', slot: 'left_leg', cyberOrganicLean: 100 }),
      makePart({ id: 'f', slot: 'right_leg', cyberOrganicLean: 100 }),
    ]);
    const report = getMutantSynergy(mixed.parts);
    expect(report.compatibility?.compatibilityTier).toBe('critical_rejection');
    expect(report.compatibility?.synergyBonus.speedPercent).toBe(-15);
    expect(report.compatibility?.synergyBonus.powerPercent).toBe(-10);
    expect(report.compatibility?.malfunctionRiskPercent).toBe(22);
  });

  it('lean synergy flows through calculateStats into real stats', () => {
    // Same base parts; only lean distribution differs.
    // Per-part lean multiplier: 20 → 0.91, 0 → 0.85, 100 → 1.15.
    const uniform = mutantFrom(
      Array.from({ length: 6 }, (_, i) =>
        makePart({ id: `u${i}`, slot: 'head', cyberOrganicLean: 20 })
      ),
    );
    const mixed = mutantFrom([
      makePart({ id: 'a', slot: 'head', cyberOrganicLean: 0 }),
      makePart({ id: 'b', slot: 'chest', cyberOrganicLean: 0 }),
      makePart({ id: 'c', slot: 'left_arm', cyberOrganicLean: 0 }),
      makePart({ id: 'd', slot: 'right_arm', cyberOrganicLean: 100 }),
      makePart({ id: 'e', slot: 'left_leg', cyberOrganicLean: 100 }),
      makePart({ id: 'f', slot: 'right_leg', cyberOrganicLean: 100 }),
    ]);

    const uniformStats = calculateStats(uniform);
    const mixedStats = calculateStats(mixed);

    // Uniform: 40 * 0.91 * 6 = 218.4 speed, then +15% → 251.16
    expect(uniformStats.speed).toBeCloseTo(251.16, 1);
    // Mixed: (3*40*0.85 + 3*40*1.15) = 240 speed, then -15% → 204
    expect(mixedStats.speed).toBeCloseTo(204, 1);
    expect(uniformStats.speed).toBeGreaterThan(mixedStats.speed);
    expect(uniformStats.power).toBeGreaterThan(mixedStats.power);
  });

  it('parts without lean produce no compatibility (neutral, no bonus)', () => {
    const report = getMutantSynergy(mutantFrom([
      makePart({ id: 'a', slot: 'head' }),
      makePart({ id: 'b', slot: 'chest' }),
      makePart({ id: 'c', slot: 'left_arm' }),
      makePart({ id: 'd', slot: 'right_arm' }),
      makePart({ id: 'e', slot: 'left_leg' }),
      makePart({ id: 'f', slot: 'right_leg' }),
    ]).parts);
    expect(report.compatibility).toBeNull();
    expect(report.statMultipliers).toEqual({ accuracy: 1, endurance: 1, power: 1, speed: 1 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 3: Shared extraction (ADR-014) — anatomy module serves both games
// ─────────────────────────────────────────────────────────────────────

describe('test_shared_anatomy_extraction', () => {
  it('calculateLeanCompatibility is exported from the shared anatomy module', () => {
    expect(typeof calculateLeanCompatibility).toBe('function');
    // Lean-list API: no AnatomySubject fabrication needed
    const report = calculateLeanCompatibility([-0.5, -0.5, -0.5, -0.5, -0.5, -0.5]);
    expect(report.compatibilityTier).toBe('pure_synergy');
    expect(report.synergyBonus.speedPercent).toBe(15); // bio
  });

  it('empty lean list yields a neutral stable report (no NaN)', () => {
    const report = calculateLeanCompatibility([]);
    expect(report.compatibilityTier).toBe('stable');
    expect(report.synergyBonus.speedPercent).toBe(0);
    expect(report.synergyBonus.powerPercent).toBe(0);
    expect(Number.isFinite(report.averageLean)).toBe(true);
    expect(Number.isFinite(report.variance)).toBe(true);
  });

  it('Gladiator Arena path intact: calculateCompatibility still returns full report', () => {
    const gaPart = (slot: BodySlot): BodyPart => ({
      id: `ga_${slot}`, name: `GA ${slot}`, slot,
      origin: 'organic', cyberOrganicLean: -0.6,
      maxHp: 50, currentHp: 50, scarHpPenalty: 0,
      power: 10, speed: 10, armor: 5, accuracy: 10, critChance: 5,
      rarity: 'common', cost: 100, description: 'test',
    });
    const subject = {
      parts: {
        head: gaPart('head'), torso: gaPart('torso'),
        left_arm: gaPart('left_arm'), right_arm: gaPart('right_arm'),
        left_leg: gaPart('left_leg'), right_leg: gaPart('right_leg'),
      },
    };
    const report = calculateCompatibility(subject);
    expect(report.compatibilityTier).toBe('pure_synergy');
    expect(report.partMismatches).toHaveLength(6);
    expect(report.partMismatches[0].partName).toContain('GA');
  });

  it('MBB consumes the shared module (not a private copy)', () => {
    const src = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'bodyPartSynergy.ts'),
      'utf-8',
    );
    expect(src).toContain('engine/shared/anatomy');
    expect(src).toContain('calculateLeanCompatibility');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 4: Real data — shipped mutants produce real synergy reports
// ─────────────────────────────────────────────────────────────────────

describe('test_real_data_synergy', () => {
  it('Starter Alpha: uniform organic lean cluster → pure_synergy', () => {
    const alpha = mutantFromData('mutant_alpha');
    const report = getMutantSynergy(alpha.parts);
    expect(report.compatibility).not.toBeNull();
    expect(report.compatibility!.compatibilityTier).toBe('pure_synergy');
    // Alpha has 2 mirefaith / 2 trueflame / 2 quicksilver — no Trinity
    expect(report.trinityBrands).toHaveLength(0);
  });

  it('Starter Beta: quicksilver Trinity is active on shipped data', () => {
    const beta = mutantFromData('mutant_beta');
    const report = getMutantSynergy(beta.parts);
    // Beta: chest_light + leg_sprint + leg_basic = 3 quicksilver parts
    expect(report.brandCounts.quicksilver).toBe(3);
    expect(report.trinityBrands).toContain('quicksilver');
    // Quicksilver trinity → speed multiplier 1.15
    expect(report.statMultipliers.speed).toBeGreaterThan(1);
  });

  it('mixed-lean mutant pays a real stat cost vs uniform-lean build', () => {
    const alpha = mutantFromData('mutant_alpha');
    const beta = mutantFromData('mutant_beta');
    const alphaReport = getMutantSynergy(alpha.parts);
    const betaReport = getMutantSynergy(beta.parts);
    // Alpha's tight organic cluster out-resonates Beta's mixed frame
    expect(alphaReport.compatibility!.variance).toBeLessThan(betaReport.compatibility!.variance);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 5: Wiring — single pipeline + Workshop surface
// ─────────────────────────────────────────────────────────────────────

describe('test_synergy_wiring', () => {
  it('calculateStats consumes getMutantSynergy (single stat pipeline)', () => {
    const agentSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbAgent.ts'),
      'utf-8',
    );
    expect(agentSrc).toContain('getMutantSynergy');
    expect(agentSrc).toContain('statMultipliers');
  });

  it('applyBrandSignature is the single signature-routing source', () => {
    const modSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'brandModifiers.ts'),
      'utf-8',
    );
    expect(modSrc).toContain('export function applyBrandSignature');
    const synSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'bodyPartSynergy.ts'),
      'utf-8',
    );
    expect(synSrc).toContain('applyBrandSignature');
    // Per-part path still produces identical stats post-refactor
    const part = makePart({ id: 'x', slot: 'head', brand: 'trueflame' });
    expect(getEffectivePartStats(part).power).toBeCloseTo(46, 5);
  });

  it('WorkshopTab surfaces the synergy report where equip decisions happen', () => {
    const wsSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'WorkshopTab.tsx'),
      'utf-8',
    );
    expect(wsSrc).toContain('getMutantSynergy');
    expect(wsSrc).toContain('COMPATIBILITY_TIER_LABELS');
    expect(wsSrc).toContain('TRINITY');
    expect(wsSrc).toContain('synergy-panel');
  });

  it('COMPATIBILITY_TIER_LABELS covers all four tiers', () => {
    expect(COMPATIBILITY_TIER_LABELS.pure_synergy).toBe('Pure Synergy');
    expect(COMPATIBILITY_TIER_LABELS.stable).toBe('Stable');
    expect(COMPATIBILITY_TIER_LABELS.dissonant).toBe('Dissonant');
    expect(COMPATIBILITY_TIER_LABELS.critical_rejection).toBe('Critical Rejection');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 6: Dissonance malfunction risk is rolled at match start
// ─────────────────────────────────────────────────────────────────────

describe('test_dissonance_malfunction_roll', () => {
  const dissonantMutant = (): Mutant => ({
    id: 'diss', name: 'Diss', color: '#fff',
    parts: {
      head: makePart({ id: 'a', slot: 'head', cyberOrganicLean: 0 }),
      chest: makePart({ id: 'b', slot: 'chest', cyberOrganicLean: 0 }),
      left_arm: makePart({ id: 'c', slot: 'left_arm', cyberOrganicLean: 0 }),
      right_arm: makePart({ id: 'd', slot: 'right_arm', cyberOrganicLean: 100 }),
      left_leg: makePart({ id: 'e', slot: 'left_leg', cyberOrganicLean: 100 }),
      right_leg: makePart({ id: 'f', slot: 'right_leg', cyberOrganicLean: 100 }),
    },
    status: 'healthy', matchesPlayed: 0,
  });

  it('failed dissonance roll cuts all stats by 25% for the match', () => {
    // critical_rejection risk is 22%; prng()=0 always fails the roll.
    const clean = makeAgent(dissonantMutant(), 'player', 0, 50, () => 0.99);
    const malfunctioned = makeAgent(dissonantMutant(), 'player', 0, 50, () => 0);
    expect(malfunctioned.power).toBeCloseTo(clean.power * 0.75, 5);
    expect(malfunctioned.speed).toBeCloseTo(clean.speed * 0.75, 5);
    expect(malfunctioned.maxHealth).toBeCloseTo(clean.maxHealth * 0.75, 5);
  });

  it('resonant mutants carry no dissonance risk — roll never fires', () => {
    const resonant: Mutant = {
      id: 'res', name: 'Res', color: '#fff',
      parts: {
        head: makePart({ id: 'a', slot: 'head', cyberOrganicLean: 20 }),
        chest: makePart({ id: 'b', slot: 'chest', cyberOrganicLean: 20 }),
        left_arm: makePart({ id: 'c', slot: 'left_arm', cyberOrganicLean: 20 }),
        right_arm: makePart({ id: 'd', slot: 'right_arm', cyberOrganicLean: 20 }),
        left_leg: makePart({ id: 'e', slot: 'left_leg', cyberOrganicLean: 20 }),
        right_leg: makePart({ id: 'f', slot: 'right_leg', cyberOrganicLean: 20 }),
      },
      status: 'healthy', matchesPlayed: 0,
    };
    // prng()=0 would fail any positive-risk roll; pure_synergy risk is 0.
    const agent = makeAgent(resonant, 'player', 0, 50, () => 0);
    expect(agent.power).toBeCloseTo(calculateStats({ parts: resonant.parts }).power, 5);
  });

  it('the displayed risk equals the rolled risk (UI is not decorative)', () => {
    const report = getMutantSynergy(dissonantMutant().parts);
    expect(report.compatibility?.malfunctionRiskPercent).toBe(22);
    // Roll boundary: 0.21 fires (<22%), 0.23 does not.
    const fired = makeAgent(dissonantMutant(), 'player', 0, 50, () => 0.21);
    const safe = makeAgent(dissonantMutant(), 'player', 0, 50, () => 0.23);
    expect(fired.power).toBeCloseTo(safe.power * 0.75, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 7: No regression — unbranded/leanless parts unchanged
// ─────────────────────────────────────────────────────────────────────

describe('test_no_regression', () => {
  it('parts without brand/lean get identical stats as before', () => {
    const plain = mutantFrom(
      Array.from({ length: 6 }, (_, i) => makePart({ id: `p${i}`, slot: 'head' })),
    );
    const stats = calculateStats(plain);
    expect(stats.accuracy).toBeCloseTo(240, 0);
    expect(stats.endurance).toBeCloseTo(240, 0);
    expect(stats.power).toBeCloseTo(240, 0);
    expect(stats.speed).toBeCloseTo(240, 0);
    expect(stats.maxHealth).toBe(240);
  });

  it('flat-stat path (no parts) unaffected', () => {
    const stats = calculateStats({});
    expect(stats.accuracy).toBe(0);
    expect(stats.maxHealth).toBe(20);
  });

  it('null slots in a partial assembly are handled', () => {
    const partial: { parts: PartsBySlot } = {
      parts: {
        head: makePart({ id: 'h', slot: 'head', brand: 'trueflame' }),
        chest: null, left_arm: null, right_arm: null, left_leg: null, right_leg: null,
      },
    };
    const report = getMutantSynergy(partial.parts);
    expect(report.brandCounts.trueflame).toBe(1);
    expect(report.trinityBrands).toHaveLength(0);
    const stats = calculateStats(partial);
    expect(stats.power).toBeCloseTo(46, 1); // per-part brand only, no trinity
  });
});
