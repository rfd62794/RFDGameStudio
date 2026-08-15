import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateStats } from '../src/games/mutant_battle_ball/simulation/mbbSimulation';
import {
  getEffectivePartStats,
  BRAND_SIGNATURES,
  QUALITY_MULTIPLIERS,
  cyberOrganicStatMultiplier,
  malfunctioningFailureChance,
  rollMalfunctioningFailure,
  repairPart,
  repairOemLossWarning,
} from '../src/games/mutant_battle_ball/brandModifiers';
import type { Part, BrandId, QualityTier } from '../src/engine/shared/partSlots';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

// Helper: build a part with all fields
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

// Helper: build a full mutant from 6 parts (all identical for comparison)
function makeMutantFromParts(parts: Part[]) {
  const partsBySlot = {
    head: parts[0],
    chest: parts[1],
    left_arm: parts[2],
    right_arm: parts[3],
    left_leg: parts[4],
    right_leg: parts[5],
  };
  return { parts: partsBySlot };
}

// ─────────────────────────────────────────────────────────────────────
// Anchor 1: Brand modifiers affect real stats
// ─────────────────────────────────────────────────────────────────────

describe('test_brand_modifiers_affect_real_stats', () => {
  it('Trueflame brand increases power stat vs unbranded part', () => {
    const unbranded = makePart({ id: 'p1', slot: 'head' });
    const trueflame = makePart({ id: 'p2', slot: 'head', brand: 'trueflame' });

    const unbrandedEff = getEffectivePartStats(unbranded);
    const trueflameEff = getEffectivePartStats(trueflame);

    // Trueflame should have +15% power
    expect(trueflameEff.power).toBeGreaterThan(unbrandedEff.power);
    const powerDiff = trueflameEff.power - unbrandedEff.power;
    expect(powerDiff).toBeCloseTo(40 * 0.15, 1);
  });

  it('different Brands produce measurably different stats for identical base parts', () => {
    const brands: BrandId[] = ['trueflame', 'icevault', 'quicksilver', 'prismworks', 'mirefaith', 'tidalcapital'];
    const results: Record<string, ReturnType<typeof getEffectivePartStats>> = {};

    for (const brand of brands) {
      const part = makePart({ id: `p_${brand}`, slot: 'head', brand });
      results[brand] = getEffectivePartStats(part);
    }

    // Trueflame has highest power
    expect(results.trueflame.power).toBeGreaterThan(results.icevault.power);
    // Icevault has highest endurance
    expect(results.icevault.endurance).toBeGreaterThan(results.trueflame.endurance);
    // Quicksilver has highest speed
    expect(results.quicksilver.speed).toBeGreaterThan(results.trueflame.speed);
    // Prismworks has highest accuracy
    expect(results.prismworks.accuracy).toBeGreaterThan(results.trueflame.accuracy);
  });

  it('brand modifiers flow through calculateStats into real mutant combat stats', () => {
    // Two mutants: one with Trueflame parts (power brand), one with Icevault (endurance brand)
    const trueflameParts = Array.from({ length: 6 }, (_, i) =>
      makePart({ id: `tf_${i}`, slot: 'head', brand: 'trueflame' })
    );
    const icevaultParts = Array.from({ length: 6 }, (_, i) =>
      makePart({ id: `iv_${i}`, slot: 'head', brand: 'icevault' })
    );

    const tfStats = calculateStats(makeMutantFromParts(trueflameParts));
    const ivStats = calculateStats(makeMutantFromParts(icevaultParts));

    // Trueflame mutant should have more power, Icevault more endurance
    expect(tfStats.power).toBeGreaterThan(ivStats.power);
    expect(ivStats.endurance).toBeGreaterThan(tfStats.endurance);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 2: Quality Tier penalty is real
// ─────────────────────────────────────────────────────────────────────

describe('test_quality_tier_penalty_real', () => {
  it('Brand New > Refurbished > Malfunctioning in effective stats', () => {
    const baseStats = { accuracy: 50, endurance: 50, power: 50, speed: 50 };

    const bn = makePart({ id: 'bn', slot: 'head', qualityTier: 'brand_new', ...baseStats });
    const rf = makePart({ id: 'rf', slot: 'head', qualityTier: 'refurbished', ...baseStats });
    const mf = makePart({ id: 'mf', slot: 'head', qualityTier: 'malfunctioning', ...baseStats });

    const bnEff = getEffectivePartStats(bn);
    const rfEff = getEffectivePartStats(rf);
    const mfEff = getEffectivePartStats(mf);

    // Brand New = 100%, Refurbished = 85%, Malfunctioning = 70%
    expect(bnEff.power).toBeGreaterThan(rfEff.power);
    expect(rfEff.power).toBeGreaterThan(mfEff.power);
    expect(bnEff.power).toBeCloseTo(50, 1);
    expect(rfEff.power).toBeCloseTo(50 * 0.85, 1);
    expect(mfEff.power).toBeCloseTo(50 * 0.70, 1);
  });

  it('quality tier penalty flows through calculateStats', () => {
    const bnParts = Array.from({ length: 6 }, (_, i) =>
      makePart({ id: `bn_${i}`, slot: 'head', qualityTier: 'brand_new' })
    );
    const mfParts = Array.from({ length: 6 }, (_, i) =>
      makePart({ id: `mf_${i}`, slot: 'head', qualityTier: 'malfunctioning' })
    );

    const bnStats = calculateStats(makeMutantFromParts(bnParts));
    const mfStats = calculateStats(makeMutantFromParts(mfParts));

    expect(bnStats.power).toBeGreaterThan(mfStats.power);
    expect(bnStats.speed).toBeGreaterThan(mfStats.speed);
  });

  it('Malfunctioning failure roll can trigger (live-risk state)', () => {
    const part = makePart({ id: 'mf1', slot: 'head', qualityTier: 'malfunctioning', cyberOrganicLean: 100 });
    // With lean=100 (max cyber), failure chance = 0.10 + 0.10 = 0.20
    expect(malfunctioningFailureChance(100)).toBeCloseTo(0.20, 2);

    // Roll with a deterministic PRNG that always returns 0 (always fails)
    const alwaysFail = () => 0;
    expect(rollMalfunctioningFailure(part, alwaysFail)).toBe(true);

    // Roll with a PRNG that always returns 0.99 (never fails)
    const neverFail = () => 0.99;
    expect(rollMalfunctioningFailure(part, neverFail)).toBe(false);
  });

  it('non-malfunctioning parts never trigger failure roll', () => {
    const bnPart = makePart({ id: 'bn1', slot: 'head', qualityTier: 'brand_new' });
    const rfPart = makePart({ id: 'rf1', slot: 'head', qualityTier: 'refurbished' });
    const alwaysFail = () => 0;
    expect(rollMalfunctioningFailure(bnPart, alwaysFail)).toBe(false);
    expect(rollMalfunctioningFailure(rfPart, alwaysFail)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 3: Cyber/Organic trade-off is real
// ─────────────────────────────────────────────────────────────────────

describe('test_cyber_organic_tradeoff_real', () => {
  it('cyber lean increases stats, organic lean decreases stats', () => {
    const neutral = makePart({ id: 'n', slot: 'head', cyberOrganicLean: 50 });
    const cyber = makePart({ id: 'c', slot: 'head', cyberOrganicLean: 100 });
    const organic = makePart({ id: 'o', slot: 'head', cyberOrganicLean: 0 });

    const nEff = getEffectivePartStats(neutral);
    const cEff = getEffectivePartStats(cyber);
    const oEff = getEffectivePartStats(organic);

    // Cyber > neutral > organic in stats
    expect(cEff.power).toBeGreaterThan(nEff.power);
    expect(nEff.power).toBeGreaterThan(oEff.power);
  });

  it('cyber lean increases malfunctioning failure risk, organic decreases it', () => {
    // At lean=0 (organic): failure chance = 0.10 - 0.10 = 0.00
    expect(malfunctioningFailureChance(0)).toBeCloseTo(0.00, 2);
    // At lean=50 (neutral): failure chance = 0.10
    expect(malfunctioningFailureChance(50)).toBeCloseTo(0.10, 2);
    // At lean=100 (cyber): failure chance = 0.10 + 0.10 = 0.20
    expect(malfunctioningFailureChance(100)).toBeCloseTo(0.20, 2);
  });

  it('cyber/organic trade-off flows through calculateStats', () => {
    const cyberParts = Array.from({ length: 6 }, (_, i) =>
      makePart({ id: `c_${i}`, slot: 'head', cyberOrganicLean: 100 })
    );
    const organicParts = Array.from({ length: 6 }, (_, i) =>
      makePart({ id: `o_${i}`, slot: 'head', cyberOrganicLean: 0 })
    );

    const cyberStats = calculateStats(makeMutantFromParts(cyberParts));
    const organicStats = calculateStats(makeMutantFromParts(organicParts));

    expect(cyberStats.power).toBeGreaterThan(organicStats.power);
    expect(cyberStats.speed).toBeGreaterThan(organicStats.speed);
  });

  it('undefined lean defaults to neutral (50)', () => {
    const noLean = makePart({ id: 'nl', slot: 'head' });
    const neutral = makePart({ id: 'n', slot: 'head', cyberOrganicLean: 50 });
    const noLeanEff = getEffectivePartStats(noLean);
    const neutralEff = getEffectivePartStats(neutral);
    expect(noLeanEff.power).toBeCloseTo(neutralEff.power, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 4: Shop shows real Brand identity per part
// ─────────────────────────────────────────────────────────────────────

describe('test_shop_shows_real_brand_identity', () => {
  it('ShopTab source extracts brand/qualityTier/cyberOrganicLean from data', () => {
    const shopSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'ShopTab.tsx'),
      'utf-8',
    );
    // The extract function must pull the new fields
    expect(shopSource).toContain('brand');
    expect(shopSource).toContain('qualityTier');
    expect(shopSource).toContain('cyberOrganicLean');
  });

  it('ShopTab renders Brand signature label per part', () => {
    const shopSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'ShopTab.tsx'),
      'utf-8',
    );
    // Must reference BRAND_SIGNATURES for the real mechanical signature
    expect(shopSource).toContain('BRAND_SIGNATURES');
    expect(shopSource).toContain('signature');
  });

  it('ShopTab shows effective stats (not just base stats) when brand/quality present', () => {
    const shopSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'ShopTab.tsx'),
      'utf-8',
    );
    expect(shopSource).toContain('getEffectivePartStats');
  });

  it('data.yaml has real Brand assignments for parts', () => {
    const data = readFileSync(
      resolve(repoRoot, 'games', 'mutant_battle_ball', 'data.yaml'),
      'utf-8',
    );
    // All six brands should appear in the data
    expect(data).toContain('trueflame');
    expect(data).toContain('icevault');
    expect(data).toContain('quicksilver');
    expect(data).toContain('prismworks');
    expect(data).toContain('mirefaith');
    expect(data).toContain('tidalcapital');
    // Quality tiers
    expect(data).toContain('brand_new');
    expect(data).toContain('refurbished');
    expect(data).toContain('malfunctioning');
    // Cyber/Organic lean
    expect(data).toContain('cyberOrganicLean');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 5: Workshop shows real OEM consequence before repair
// ─────────────────────────────────────────────────────────────────────

describe('test_workshop_shows_real_oem_consequence', () => {
  it('repairPart permanently strips Brand New → Refurbished', () => {
    const bnPart = makePart({ id: 'bn', slot: 'head', qualityTier: 'brand_new' });
    const repaired = repairPart(bnPart);
    expect(repaired.qualityTier).toBe('refurbished');
    // Original is not mutated
    expect(bnPart.qualityTier).toBe('brand_new');
  });

  it('repairPart fixes Malfunctioning → Refurbished', () => {
    const mfPart = makePart({ id: 'mf', slot: 'head', qualityTier: 'malfunctioning' });
    const repaired = repairPart(mfPart);
    expect(repaired.qualityTier).toBe('refurbished');
  });

  it('repairPart does nothing to already-Refurbished parts', () => {
    const rfPart = makePart({ id: 'rf', slot: 'head', qualityTier: 'refurbished' });
    const repaired = repairPart(rfPart);
    expect(repaired.qualityTier).toBe('refurbished');
  });

  it('repairOemLossWarning shows real warning for Brand New parts', () => {
    const bnPart = makePart({ id: 'bn', slot: 'head', qualityTier: 'brand_new' });
    const warning = repairOemLossWarning(bnPart);
    expect(warning).not.toBeNull();
    expect(warning).toContain('permanently');
    expect(warning).toContain('OEM');
  });

  it('repairOemLossWarning shows warning for Malfunctioning parts', () => {
    const mfPart = makePart({ id: 'mf', slot: 'head', qualityTier: 'malfunctioning' });
    const warning = repairOemLossWarning(mfPart);
    expect(warning).not.toBeNull();
    expect(warning).toContain('Refurbished');
  });

  it('repairOemLossWarning returns null for already-Refurbished parts', () => {
    const rfPart = makePart({ id: 'rf', slot: 'head', qualityTier: 'refurbished' });
    const warning = repairOemLossWarning(rfPart);
    expect(warning).toBeNull();
  });

  it('WorkshopTab source has repair confirmation with OEM warning', () => {
    const wsSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'WorkshopTab.tsx'),
      'utf-8',
    );
    expect(wsSource).toContain('repairPart');
    expect(wsSource).toContain('repairOemLossWarning');
    expect(wsSource).toContain('repair-confirm');
    expect(wsSource).toContain('Confirm Repair');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 6: No regression — current real floor holds
// ─────────────────────────────────────────────────────────────────────

describe('test_no_regression', () => {
  it('calculateStats still works for parts without brand/quality/lean (backward compat)', () => {
    const plainParts = Array.from({ length: 6 }, (_, i) =>
      makePart({ id: `plain_${i}`, slot: 'head' })
    );
    const stats = calculateStats(makeMutantFromParts(plainParts));
    // Base stats: 40 each * 6 = 240, maxHealth = max(20, 240) = 240
    expect(stats.accuracy).toBeCloseTo(240, 0);
    expect(stats.endurance).toBeCloseTo(240, 0);
    expect(stats.power).toBeCloseTo(240, 0);
    expect(stats.speed).toBeCloseTo(240, 0);
    expect(stats.maxHealth).toBe(240);
  });

  it('calculateStats still works for flat-stat opponents (no parts)', () => {
    const opponent = { accuracy: 40, endurance: 50, power: 30, speed: 35, max_health: 50 };
    // Opponents with flat stats bypass calculateStats entirely in makeAgent,
    // but calculateStats with no parts should return zeros
    const stats = calculateStats({});
    expect(stats.accuracy).toBe(0);
    expect(stats.maxHealth).toBe(20); // floor
  });

  it('Part type still has all original required fields', () => {
    const part: Part = {
      id: 'test',
      name: 'Test',
      slot: 'head',
      accuracy: 10,
      endurance: 10,
      power: 10,
      speed: 10,
      price: 20,
    };
    expect(part.id).toBe('test');
    expect(part.brand).toBeUndefined();
    expect(part.qualityTier).toBeUndefined();
    expect(part.cyberOrganicLean).toBeUndefined();
  });

  it('brandModifiers module exports all expected functions', () => {
    expect(typeof getEffectivePartStats).toBe('function');
    expect(typeof repairPart).toBe('function');
    expect(typeof repairOemLossWarning).toBe('function');
    expect(typeof rollMalfunctioningFailure).toBe('function');
    expect(typeof cyberOrganicStatMultiplier).toBe('function');
    expect(typeof malfunctioningFailureChance).toBe('function');
    expect(BRAND_SIGNATURES.trueflame.signature).toBe('Power');
    expect(QUALITY_MULTIPLIERS.brand_new).toBe(1.0);
  });
});
