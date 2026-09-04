import type { LeadList } from '../types';

export const FRESHNESS_FAILURE_THRESHOLD = 10;
export const IDLE_FRESHNESS_DECAY = 2; // freshness lost per idle tick
export const WORK_FRESHNESS_DECAY = 0.5; // freshness lost per call worked

export function createList(
  id: string,
  source: string,
  purity: number,
  freshness: number,
  volume: number,
): LeadList {
  return {
    id,
    source,
    purity: Math.max(0, Math.min(100, purity)),
    freshness: Math.max(0, Math.min(100, freshness)),
    volume: Math.max(0, volume),
  };
}

/**
 * Apply work to a list: reduce volume by the number of calls actually worked,
 * clamping at zero, and apply a small freshness decay from dialing.
 */
export function processListWork(list: LeadList, callsWorked: number): LeadList {
  const clampedCalls = Math.max(0, callsWorked);
  return {
    ...list,
    volume: Math.max(0, list.volume - clampedCalls),
    freshness: Math.max(0, list.freshness - clampedCalls * WORK_FRESHNESS_DECAY),
  };
}

/**
 * Age a list that is not being worked. Freshness decays by a fixed amount
 * per idle tick; this is deterministic and testable without real time.
 */
export function decayFreshness(list: LeadList, idleTicks: number): LeadList {
  const clampedTicks = Math.max(0, idleTicks);
  return {
    ...list,
    freshness: Math.max(0, list.freshness - clampedTicks * IDLE_FRESHNESS_DECAY),
  };
}

/**
 * A list needs swapping when it is empty or its freshness has fallen below
 * the failure threshold.
 */
export function needsSwap(list: LeadList): boolean {
  return list.volume <= 0 || list.freshness < FRESHNESS_FAILURE_THRESHOLD;
}
