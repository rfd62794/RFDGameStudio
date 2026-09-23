/**
 * @file src/liveStats.ts
 * Continuous calculation of live kitchen performance statistics (throughput, violation rate, grade).
 */

import { KitchenState, LiveStats } from './types';

/**
 * Computes live performance statistics continuously during the simulation.
 */
export function getLiveStats(state: KitchenState): LiveStats {
  const elapsedMinutes = Math.max(0.01, state.elapsedSeconds / 60);
  const throughputPerMinute = Math.round((state.ordersServed / elapsedMinutes) * 10) / 10;
  
  const violationRate =
    state.totalCornerCutsTaken > 0
      ? Math.round((state.totalViolationsCaught / state.totalCornerCutsTaken) * 100) / 100
      : 0;

  let currentGrade: LiveStats['currentGrade'] = 'C';
  let liveSummary = 'Shift in progress.';

  if (state.brandEquity <= 0) {
    currentGrade = 'F';
    liveSummary = 'Critical Failure: Brand equity depleted from safety violations.';
  } else if (state.brandEquity >= 85 && state.totalViolationsCaught <= 1) {
    currentGrade = 'S';
    liveSummary = 'Pristine operations! Excellent protocol adherence and high throughput.';
  } else if (state.brandEquity >= 70 && state.totalViolationsCaught <= 3) {
    currentGrade = 'A';
    liveSummary = 'Solid performance. Minor corner-cutting contained effectively.';
  } else if (state.brandEquity >= 50) {
    currentGrade = 'B';
    liveSummary = 'Moderate pressure leading to visible protocol drift.';
  } else {
    currentGrade = 'C';
    liveSummary = 'High risk: Multiple violations caught under heavy queue backpressure.';
  }

  return {
    throughputPerMinute,
    violationRate,
    currentGrade,
    liveSummary,
  };
}
