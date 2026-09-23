/**
 * @file src/taskExecution.ts
 * Layer 2 Task Execution & Physical Work Processing (60Hz).
 * Modularized wrapper delegating to breakExecution and stationExecution modules.
 */

import { STATION_CONFIGS, STAMINA_DRAIN_CORNER_CUT, STAMINA_DRAIN_PROTOCOL } from './data';
import { processWorkerBreakExecution } from './execution/breakExecution';
import { executeStationTaskCompletion } from './execution/stationExecution';
import { KitchenState, Worker } from './types';

export { executeStationTaskCompletion } from './execution/stationExecution';
export { processWorkerBreakExecution } from './execution/breakExecution';

/**
 * Executes Layer 2 physics, task progression, stamina/morale adjustments, and work completion.
 */
export function processWorkerExecution(worker: Worker, state: KitchenState, dt: number): void {
  // First process break area activities if applicable
  if (processWorkerBreakExecution(worker, state, dt)) {
    return;
  }

  // Work at claimed station
  if (worker.claimedResource) {
    const station = state.stations.find((s) => s.id === worker.claimedResource);
    if (station) {
      const stationCenterX = station.x + station.width / 2;
      const stationCenterY = station.y + station.height / 2 + 15;
      const dist = Math.sqrt((worker.x - stationCenterX) ** 2 + (worker.y - stationCenterY) ** 2);

      if (dist < 45) {
        // Worker is at station -> Claim station occupancy!
        station.occupiedBy = worker.id;
        worker.currentStation = station.id;

        // Check if station has input buffer to process
        if (station.orders.length > 0) {
          const config = STATION_CONFIGS[station.id];
          const workTime =
            worker.currentTask === 'corner_cut'
              ? config.cornerCutWorkTime
              : config.protocolWorkTime;

          worker.taskProgress += dt / workTime;

          // Stamina consumption
          const drainRate =
            worker.currentTask === 'corner_cut'
              ? STAMINA_DRAIN_CORNER_CUT
              : STAMINA_DRAIN_PROTOCOL;
          worker.stamina = Math.max(0.01, worker.stamina - drainRate * dt);

          // Task Completion
          if (worker.taskProgress >= 1.0) {
            worker.taskProgress = 0;
            executeStationTaskCompletion(worker, station, state, config);
          }
        }
      } else {
        worker.currentStation = null;
        worker.taskProgress = 0;
      }
    }
  }
}
