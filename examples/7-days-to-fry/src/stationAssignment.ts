/**
 * @file src/stationAssignment.ts
 * Station Choice Utility Scoring (Fixes Herding Bug)
 * Evaluates station work magnitude and primary station ownership bonus via argmax.
 */

import { PRIMARY_STATION_OWNERSHIP_BONUS, STATION_NUDGE_BOOST_MULTIPLIER } from './data';
import { Station, StationId, Worker } from './types';

/**
 * Calculates utility score for a worker targeting a station.
 * Based on station buffer load ratio and primary station ownership bonus.
 */
export function scoreStationNeed(station: Station, worker: Worker): number {
  if (station.orders.length <= 0) return 0;
  const workMagnitude = station.orders.length / station.bufferCapacity;
  const boostActive = (worker.stationNudgeBoostRemaining || 0) > 0;
  const ownershipMultiplier =
    station.id === worker.primaryStation
      ? PRIMARY_STATION_OWNERSHIP_BONUS * (boostActive ? STATION_NUDGE_BOOST_MULTIPLIER : 1.0)
      : 1.0;
  return workMagnitude * ownershipMultiplier;
}

/**
 * Chooses the best station for a worker using argmax selection over unoccupied, unreserved, or self-claimed stations.
 */
export function chooseStation(
  worker: Worker,
  stations: Station[],
  reservedThisTick: Set<StationId> = new Set()
): StationId | null {
  const availableStations = stations.filter(
    (s) =>
      (s.occupiedBy === null || s.occupiedBy === worker.id) &&
      (!reservedThisTick.has(s.id) || worker.claimedResource === s.id)
  );

  const candidates = availableStations
    .map((s) => ({ stationId: s.id, score: scoreStationNeed(s, worker) }))
    .filter((c) => c.score > 0);

  if (candidates.length === 0) return null;

  const winner = candidates.reduce((best, c) => (c.score > best.score ? c : best));
  return winner.stationId;
}
