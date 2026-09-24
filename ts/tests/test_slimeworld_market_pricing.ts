import { describe, it, expect } from 'vitest';
import {
  calculateMarketPrice,
  calculateTierValue,
  getColorTier,
  getShapeTier,
  snapToShapeName,
  slimeValueVariance,
  MARKET_DEFAULTS,
} from '../src/games/slimeworld/gameLogic';
import type { Slime } from '../src/games/slimeworld/types';

/**
 * Tier-scaled market sale pricing — SlimeBreeder absorption step 2.3.
 *
 * price = calculateTierValue(color, snapped shape, seeded variance)
 *         x (1 + (level - 1) * level_value_step)
 *         x max(flood_multiplier_floor, 1 - recent_sales * flood_decay_per_sale)
 *
 * Tuning numbers live in games/slimeworld/data.yaml `market:`; MARKET_DEFAULTS
 * in gameLogic.ts mirrors it. The golden cases below pin the exact integers
 * produced by the Lua implementation (games/slimeworld/economy.lua) for the
 * same fixture slimes — the two runtimes must agree.
 */

const slime = (overrides: Partial<Slime>): Slime => ({
  id: 'slime_mkt_a',
  name: 'Test',
  color: 'Red',
  pattern: 'Solid',
  level: 1,
  xp: 0,
  stats: { hp: 0, atk: 0, def: 0, agi: 0, int: 0, chm: 0 },
  role: 'idle',
  generation: 1,
  createdAt: 0,
  vertexCount: 3,
  irregularity: 5,
  ...overrides,
});

describe('tier tables + shape snapping (ports of breeding.lua)', () => {
  it('getColorTier / getShapeTier match the Lua tables', () => {
    expect(getColorTier('Red')).toBe(1);
    expect(getColorTier('Purple')).toBe(2);
    expect(getColorTier('Gray')).toBe(1);
    expect(getColorTier('Nope')).toBe(1);
    expect(getShapeTier('Triangle')).toBe(1);
    expect(getShapeTier('Pentagon')).toBe(3);
    expect(getShapeTier('Crown')).toBe(4);
    expect(getShapeTier('Nope')).toBe(1);
  });

  it('snapToShapeName matches the Lua anchors', () => {
    expect(snapToShapeName(3, 5)).toBe('Triangle');
    expect(snapToShapeName(5, 55)).toBe('Star');
    expect(snapToShapeName(8, 85)).toBe('Crown');
    expect(snapToShapeName(4, 10)).toBe('Pentagon');
  });

  it('calculateTierValue matches the archive formula', () => {
    expect(calculateTierValue('Red', 'Triangle')).toBe(10);
    expect(calculateTierValue('Orange', 'Star')).toBe(44);
    expect(calculateTierValue('Purple', 'Crown')).toBe(322);
    expect(calculateTierValue('Orange', 'Crown', 0.25)).toBe(403);
  });
});

describe('slimeValueVariance', () => {
  it('is deterministic, bounded, and matches the Lua-seeded values', () => {
    expect(slimeValueVariance('slime_mkt_a')).toBeCloseTo(-0.05, 10);
    expect(slimeValueVariance('slime_mkt_b')).toBeCloseTo(-0.04, 10);
    expect(slimeValueVariance('slime_mkt_c')).toBeCloseTo(-0.03, 10);
    expect(slimeValueVariance('slime_mkt_d')).toBeCloseTo(-0.02, 10);
  });

  it('spans both signs and stays within +/-range', () => {
    const values = new Set<number>();
    for (let i = 0; i < 80; i++) values.add(slimeValueVariance(`slime_${i}`));
    expect(Math.min(...values)).toBeLessThan(0);
    expect(Math.max(...values)).toBeGreaterThan(0);
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(-0.10 - 1e-9);
      expect(v).toBeLessThanOrEqual(0.10 + 1e-9);
    }
    expect(values.size).toBeGreaterThan(10);
  });

  it('respects a range override', () => {
    expect(slimeValueVariance('slime_mkt_a', 0.25)).toBeCloseTo(-0.125, 10);
  });
});

describe('calculateMarketPrice', () => {
  it('matches the Lua golden values exactly', () => {
    // Prices computed by games/slimeworld/economy.lua calculate_market_price
    // for the same slimes (verified by tests/test_slimeworld_market_pricing.py).
    expect(calculateMarketPrice(slime({}), 0)).toBe(10);
    expect(calculateMarketPrice(slime({ id: 'slime_mkt_b', color: 'Purple', level: 7, vertexCount: 8, irregularity: 85 }), 0)).toBe(540);
    expect(calculateMarketPrice(slime({ id: 'slime_mkt_c', color: 'Green', level: 3, vertexCount: 5, irregularity: 60 }), 2)).toBe(40);
    expect(calculateMarketPrice(slime({ id: 'slime_mkt_d', color: 'Gray', level: 12, vertexCount: 4, irregularity: 10 }), 6)).toBe(69);
    expect(calculateMarketPrice(slime({ variance: 0 }), 0)).toBe(10);
  });

  it('scales with tier', () => {
    const low = calculateMarketPrice(slime({}), 0);
    const high = calculateMarketPrice(slime({ color: 'Purple', vertexCount: 8, irregularity: 85 }), 0);
    expect(high).toBeGreaterThan(low * 10);
  });

  it('scales with level', () => {
    const level1 = calculateMarketPrice(slime({}), 0);
    const level5 = calculateMarketPrice(slime({ level: 5 }), 0);
    expect(Math.abs(level5 - level1 * 1.5)).toBeLessThanOrEqual(1);
  });

  it('decays with flood and respects the floor', () => {
    const s = slime({});
    const noSales = calculateMarketPrice(s, 0);
    const fiveSales = calculateMarketPrice(s, 5);
    const fiftySales = calculateMarketPrice(s, 50);
    expect(fiveSales).toBeLessThan(noSales);
    expect(fiftySales).toBeLessThanOrEqual(Math.ceil(noSales * 0.3) + 1);
  });

  it('honors an explicit slime.variance over the seeded value', () => {
    expect(calculateMarketPrice(slime({ variance: 0.10 }), 0)).toBe(11);
    expect(calculateMarketPrice(slime({ variance: -0.10 }), 0)).toBe(9);
  });

  it('honors market config overrides from data.yaml', () => {
    const s = slime({});
    expect(calculateMarketPrice(s, 9, { flood_decay_per_sale: 0 })).toBe(calculateMarketPrice(s, 0));
    expect(calculateMarketPrice(slime({ level: 9 }), 0, { level_value_step: 0 })).toBe(calculateMarketPrice(s, 0));
  });

  it('is deterministic across calls', () => {
    const s = slime({ color: 'Orange', vertexCount: 6, irregularity: 50, level: 4 });
    expect(calculateMarketPrice(s, 3)).toBe(calculateMarketPrice(s, 3));
  });
});
