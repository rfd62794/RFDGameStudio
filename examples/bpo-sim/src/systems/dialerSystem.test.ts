import { describe, it, expect } from 'vitest';
import {
  computeSafePace,
  computeCallGenerationRate,
  dialerUpgradeCost,
  applyDialerUpgrade,
} from './dialerSystem';
import { createList } from './listSystem';

describe('dialerSystem', () => {
  it('safe pace scales with available agent count', () => {
    expect(computeSafePace(0)).toBe(0);
    expect(computeSafePace(5)).toBe(10);
    expect(computeSafePace(12)).toBe(24);
    expect(computeSafePace(-3)).toBe(0);
  });

  it('produces zero calls when no agents are available', () => {
    const list = createList('l', 'ACBS', 100, 100, 100);
    const dialer = { pace: 10, tier: 1 };
    expect(computeCallGenerationRate(dialer, list, 0)).toBe(0);
  });

  it('produces zero calls when the list is empty', () => {
    const list = createList('l', 'ACBS', 100, 100, 0);
    const dialer = { pace: 10, tier: 1 };
    expect(computeCallGenerationRate(dialer, list, 10)).toBe(0);
  });

  it('stays within safe pace and uses list purity', () => {
    const highPurity = createList('l1', 'ACBS', 100, 100, 100);
    const lowPurity = createList('l2', 'ACBS', 50, 100, 100);
    const dialer = { pace: 6, tier: 1 };
    const available = 10; // safePace = 20, pace 6 is under

    const high = computeCallGenerationRate(dialer, highPurity, available);
    const low = computeCallGenerationRate(dialer, lowPurity, available);

    expect(high).toBeGreaterThan(low);
    expect(high).toBe(6); // 6 * 1.0 * 1.0 = 6
  });

  it('caps generated calls at the list volume', () => {
    const list = createList('l', 'ACBS', 100, 100, 3);
    const dialer = { pace: 20, tier: 1 };
    expect(computeCallGenerationRate(dialer, list, 20)).toBe(3);
  });

  it('produces measurably worse results when pace exceeds safe pace', () => {
    const list = createList('l', 'ACBS', 100, 100, 100);
    const available = 5; // safePace = 10

    const underPace = { pace: 8, tier: 1 };
    const overPace = { pace: 20, tier: 1 };

    const under = computeCallGenerationRate(underPace, list, available);
    const over = computeCallGenerationRate(overPace, list, available);

    expect(under).toBeGreaterThan(0);
    expect(over).toBeGreaterThan(0);
    expect(over).toBeLessThan(under);
  });

  it('upgrade cost scales predictably with current tier', () => {
    expect(dialerUpgradeCost(1)).toBe(5000);
    expect(dialerUpgradeCost(2)).toBe(10000);
    expect(dialerUpgradeCost(5)).toBe(25000);
    expect(dialerUpgradeCost(0)).toBe(0);
  });

  it('applying an upgrade increases tier and leaves pace unchanged', () => {
    const upgraded = applyDialerUpgrade({ pace: 6, tier: 1 });
    expect(upgraded.tier).toBe(2);
    expect(upgraded.pace).toBe(6);
  });
});
