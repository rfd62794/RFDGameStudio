import type { DialerConfig, LeadList } from '../types';

/**
 * Safe pace is the number of calls per tick the dialer can push before
 * the floor starts to degrade. It scales linearly with available idle agents:
 *
 *   safePace = availableAgents * 2
 *
 * This gives each idle agent room to handle up to two call attempts per tick
 * before queue pressure builds.
 */
export function computeSafePace(availableAgents: number): number {
  const agents = Math.max(0, availableAgents);
  return agents * 2;
}

/**
 * Compute how many calls actually enter the queue this tick.
 *
 * Inputs:
 * - dialer.pace: target calls to push this tick
 * - list.purity / list.freshness: lead quality, 0-100
 * - list.volume: remaining leads; cannot generate more calls than this
 * - availableAgents: idle agents that can take calls; sets the safe pace ceiling
 *
 * Behavior:
 * - At or below safe pace, generated calls = dialer.pace * quality factor.
 * - Above safe pace, each excess call attempt degrades output by 0.5 calls,
 *   modeling queue pressure and dropped/abandoned attempts.
 * - Result is capped by list.volume and never negative.
 */
export function computeCallGenerationRate(
  dialer: DialerConfig,
  list: LeadList,
  availableAgents: number,
): number {
  const safePace = computeSafePace(availableAgents);
  const excess = Math.max(0, dialer.pace - safePace);

  const effectivePace =
    dialer.pace <= safePace ? dialer.pace : Math.max(0, safePace - excess * 0.5);

  const qualityFactor = (list.purity / 100) * (list.freshness / 100);
  const rawCalls = effectivePace * qualityFactor * (1 + (dialer.tier - 1) * 0.1);

  return Math.max(0, Math.floor(Math.min(list.volume, rawCalls)));
}
