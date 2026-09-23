import type { QuotaState, DayVerdict } from '../types';

export function createQuota(target: number, payoutPerCall: number): QuotaState {
  return {
    target: Math.max(0, target),
    progress: 0,
    payoutPerCall: Math.max(0, payoutPerCall),
  };
}

/**
 * Add completed calls to the quota and return a new state.
 */
export function updateProgress(quota: QuotaState, completedCalls: number): QuotaState {
  const clamped = Math.max(0, completedCalls);
  return {
    ...quota,
    progress: quota.progress + clamped,
  };
}

/**
 * Determine the day-end verdict for a quota.
 *
 * - 'met'    : progress >= target
 * - 'partial' : 0 < progress < target
 * - 'missed'  : progress <= 0
 */
export function getDayVerdict(quota: QuotaState): DayVerdict {
  if (quota.progress >= quota.target) return 'met';
  if (quota.progress > 0) return 'partial';
  return 'missed';
}

/**
 * Reset progress for a new day while keeping target and payout.
 */
export function resetDay(quota: QuotaState): QuotaState {
  return {
    ...quota,
    progress: 0,
  };
}
