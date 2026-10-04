// @vitest-environment node
// new: ts/tests/test_ledger_utils.ts

import { describe, it, expect } from 'vitest';
import { generateInitialMarket, generateLot, generateGood, calculateSellValue, formatCurrency } from '../../examples/ledger/src/utils';
import { Category } from '../../examples/ledger/src/types';

describe('test_ledger_utils', () => {
  it('formatCurrency(1000) contains 1,000', () => {
    expect(formatCurrency(1000)).toContain('1,000');
  });

  it('generateInitialMarket() returns exactly 5 entries (Object.values(Category).length) and every currentPriceMultiplier > 0', () => {
    const market = generateInitialMarket();
    const entries = Object.values(market);
    expect(entries.length).toBe(Object.values(Category).length);
    expect(Object.values(Category).length).toBe(5);
    for (const state of entries) {
      expect(state.currentPriceMultiplier).toBeGreaterThan(0);
    }
  });

  it("generateLot(1, 1, 'walk_in').type is 'walk_in' and generateLot(1, 1, 'dutch_auction').type is 'dutch_auction'", () => {
    expect(generateLot(1, 1, 'walk_in').type).toBe('walk_in');
    expect(generateLot(1, 1, 'dutch_auction').type).toBe('dutch_auction');
  });

  it('calculateSellValue on an authentic good returns isFakeRevealed === false and value >= 0', () => {
    const good = { ...generateGood(Category.FINE_ART), authenticity: 'authentic' as const };
    const market = generateInitialMarket();
    const result = calculateSellValue(good, market[Category.FINE_ART]);
    expect(result.isFakeRevealed).toBe(false);
    expect(result.value).toBeGreaterThanOrEqual(0);
  });

  it('calculateSellValue on a counterfeit good returns isFakeRevealed === true and value <= 60', () => {
    const good = { ...generateGood(Category.FINE_ART), authenticity: 'counterfeit' as const };
    const market = generateInitialMarket();
    const result = calculateSellValue(good, market[Category.FINE_ART]);
    expect(result.isFakeRevealed).toBe(true);
    expect(result.value).toBeLessThanOrEqual(60);
  });
});
