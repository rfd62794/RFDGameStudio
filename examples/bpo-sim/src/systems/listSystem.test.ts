import { describe, it, expect } from 'vitest';
import {
  createList,
  processListWork,
  decayFreshness,
  needsSwap,
  FRESHNESS_FAILURE_THRESHOLD,
} from './listSystem';

describe('listSystem', () => {
  it('depletes volume by the correct amount and never goes negative', () => {
    const list = createList('l1', 'ACBS', 80, 90, 20);
    const worked = processListWork(list, 7);
    expect(worked.volume).toBe(13);
    expect(worked.purity).toBe(80);
    expect(worked.freshness).toBe(90 - 7 * 0.5);
  });

  it('clamps volume at zero when worked more than remaining', () => {
    const list = createList('l2', 'ACBS', 50, 50, 3);
    const worked = processListWork(list, 10);
    expect(worked.volume).toBe(0);
  });

  it('clamps negative callsWorked to zero', () => {
    const list = createList('l3', 'ACBS', 50, 50, 10);
    const worked = processListWork(list, -5);
    expect(worked.volume).toBe(10);
  });

  it('decays freshness deterministically over idle ticks', () => {
    const list = createList('l4', 'ACBS', 70, 50, 100);
    const aged = decayFreshness(list, 5);
    expect(aged.freshness).toBe(50 - 5 * 2);
    expect(aged.volume).toBe(100);
  });

  it('clamps freshness at zero and ignores negative idle ticks', () => {
    const list = createList('l5', 'ACBS', 70, 5, 100);
    const aged = decayFreshness(list, 10);
    expect(aged.freshness).toBe(0);
    expect(decayFreshness(list, -3).freshness).toBe(5);
  });

  it('flags a list needing swap at zero volume', () => {
    const list = createList('l6', 'ACBS', 80, 80, 0);
    expect(needsSwap(list)).toBe(true);
  });

  it('flags a list needing swap when freshness falls below threshold', () => {
    const list = createList('l7', 'ACBS', 80, FRESHNESS_FAILURE_THRESHOLD - 1, 50);
    expect(needsSwap(list)).toBe(true);
  });

  it('does not flag a fresh, non-empty list', () => {
    const list = createList('l8', 'ACBS', 80, FRESHNESS_FAILURE_THRESHOLD + 1, 10);
    expect(needsSwap(list)).toBe(false);
  });
});
