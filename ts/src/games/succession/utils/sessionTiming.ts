// new: ts/src/games/succession/utils/sessionTiming.ts
import { TOTAL_SEGMENTS } from '../data/gameConstants';

/**
 * A first-order ESTIMATE of how long a solo run takes. The engine is headless and
 * deterministic, so it cannot measure human reading time: these seconds are stated
 * assumptions, not measurements. A real stopwatch run replaces them.
 */
export interface TimingAssumptions {
  /** Title, origin pick and primer, once per run. */
  setupSeconds: number;
  /** Time per segment (one move each): choosing a figure and approach, reading the ticker. */
  secondsPerMove: { fast: number; typical: number; slow: number };
  /** Verdict screen plus epilogue, once per run. */
  endSeconds: number;
}

export const TIMING_ASSUMPTIONS: TimingAssumptions = {
  setupSeconds: 60,
  secondsPerMove: { fast: 20, typical: 45, slow: 90 },
  endSeconds: 90,
};

export interface SessionEstimate {
  segments: number;
  fastMinutes: number;
  typicalMinutes: number;
  slowMinutes: number;
}

function toMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 10) / 10;
}

export function estimateSessionMinutes(
  segments: number = TOTAL_SEGMENTS,
  assumptions: TimingAssumptions = TIMING_ASSUMPTIONS
): SessionEstimate {
  const fixed = assumptions.setupSeconds + assumptions.endSeconds;
  return {
    segments,
    fastMinutes: toMinutes(fixed + segments * assumptions.secondsPerMove.fast),
    typicalMinutes: toMinutes(fixed + segments * assumptions.secondsPerMove.typical),
    slowMinutes: toMinutes(fixed + segments * assumptions.secondsPerMove.slow),
  };
}
