import { describe, it, expect } from 'vitest';
import { createQuota, updateProgress, getDayVerdict, resetDay } from './quotaSystem';

describe('quotaSystem', () => {
  it('progress updates by the correct amount per completed call', () => {
    const quota = createQuota(100, 120);
    const after = updateProgress(quota, 7);
    expect(after.progress).toBe(7);
    expect(after.target).toBe(100);
    expect(after.payoutPerCall).toBe(120);
  });

  it('ignores negative completed call counts', () => {
    const quota = createQuota(100, 120);
    const after = updateProgress(quota, -5);
    expect(after.progress).toBe(0);
  });

  it('returns met when progress equals or exceeds target', () => {
    expect(getDayVerdict(createQuota(50, 100))).toBe('missed');
    expect(getDayVerdict(updateProgress(createQuota(50, 100), 50))).toBe('met');
    expect(getDayVerdict(updateProgress(createQuota(50, 100), 77))).toBe('met');
  });

  it('returns partial when progress is positive but below target', () => {
    const quota = updateProgress(createQuota(50, 100), 30);
    expect(getDayVerdict(quota)).toBe('partial');
  });

  it('returns missed when progress is zero', () => {
    const quota = createQuota(50, 100);
    expect(getDayVerdict(quota)).toBe('missed');
  });

  it('resets day progress without changing target or payout', () => {
    const quota = updateProgress(createQuota(100, 120), 80);
    const reset = resetDay(quota);
    expect(reset.progress).toBe(0);
    expect(reset.target).toBe(100);
    expect(reset.payoutPerCall).toBe(120);
  });
});
