/**
 * @file src/execution/stationExecution.ts
 * Station physical work completion and order transfer down the line.
 */

import { activateCustomerAtWindow } from '../customers';
import {
  ADDON_PRICE_FRIES,
  BASE_PRICE_BURGER,
  BATCH_QUALITY_GAIN_PER_PROTOCOL,
  BATCH_QUALITY_LOSS_PER_CORNER_CUT,
  BATCH_QUALITY_MAX,
  BATCH_QUALITY_MIN,
  BRAND_EQUITY_GAIN_PER_CLEAN_ORDER,
  BRAND_EQUITY_VIOLATION_PENALTY,
  CASH_PER_CLEAN_ORDER,
  CORNER_CUT_VIOLATION_CATCH_CHANCE,
  EQUIPMENT_DEGRADATION_CHANCE,
  StationConfig,
  STOCK_UNITS_PER_ORDER,
  TIP_MAX_PER_ORDER,
} from '../data';
import { KitchenState, LogEvent, Station, Worker } from '../types';

/**
 * Handles station output transfer, corner-cut risk rolls, and customer spawning upon task completion.
 */
export function executeStationTaskCompletion(
  worker: Worker,
  station: Station,
  state: KitchenState,
  config: StationConfig
): void {
  const isCornerCut = worker.currentTask === 'corner_cut';

  if (!worker.stationStats) {
    worker.stationStats = {} as any;
  }
  worker.stationStats[station.id] = worker.stationStats[station.id] || { protocols: 0, cornerCuts: 0 };
  worker.stationStats[station.id][isCornerCut ? 'cornerCuts' : 'protocols']++;

  // Initialize batchQuality if not present
  if (station.batchQuality === undefined) {
    station.batchQuality = 100;
  }

  if (isCornerCut) {
    state.totalCornerCutsTaken++;
    worker.totalCornerCuts++;

    // Corner-cut damages station batch quality directly (clamped to BATCH_QUALITY_MIN)
    station.batchQuality = Math.max(BATCH_QUALITY_MIN, station.batchQuality - BATCH_QUALITY_LOSS_PER_CORNER_CUT);

    // Safety Catch Probability Check (Consequence roll after action was taken)
    if (Math.random() < CORNER_CUT_VIOLATION_CATCH_CHANCE) {
      state.totalViolationsCaught++;
      state.brandEquity = Math.max(0, state.brandEquity - BRAND_EQUITY_VIOLATION_PENALTY);
      if (station.orders[0]) {
        station.orders[0].hadViolation = true;
      }

      const log: LogEvent = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Math.floor(state.elapsedSeconds),
        message: `VIOLATION CAUGHT at ${config.name}! (${worker.name} rushed) -${BRAND_EQUITY_VIOLATION_PENALTY} Brand Equity`,
        type: 'violation',
      };
      state.logEvents.unshift(log);
      if (state.logEvents.length > 50) state.logEvents.pop();
    }
  } else {
    state.totalProtocolTasks++;
    worker.totalProtocols++;

    // Protocol completion restores station batch quality (clamped to BATCH_QUALITY_MAX)
    station.batchQuality = Math.min(BATCH_QUALITY_MAX, station.batchQuality + BATCH_QUALITY_GAIN_PER_PROTOCOL);
  }

  // Update order quality from station's live batchQuality (as 0..1 fraction)
  if (station.orders[0]) {
    station.orders[0].quality = Math.max(0, Math.min(1, station.batchQuality / 100));
  }

  // Equipment degradation roll on station usage
  if (config.hasEquipmentWear && Math.random() < EQUIPMENT_DEGRADATION_CHANCE) {
    const prevStage = station.degradationStage || 0;
    if (prevStage < 3) {
      const newStage = prevStage + 1;
      station.degradationStage = newStage;

      if (!state.situationQueue) {
        state.situationQueue = [];
      }

      const existingSit = state.situationQueue.find((s) => s.stationId === station.id);
      if (existingSit) {
        existingSit.stage = Math.max(existingSit.stage, newStage);
      } else {
        state.situationQueue.push({
          id: `sit-${station.id}-${Math.random().toString(36).substring(2, 7)}`,
          stationId: station.id,
          stage: newStage,
          initialStage: newStage,
          createdTime: state.elapsedSeconds,
          elapsedSeconds: 0,
        });
      }
    }
  }

  // Transfer item down the line
  if (station.id === 'window') {
    const order = station.orders[0];
    if (order && order.burgerComplete && order.friesComplete) {
      if (state.stockUnits <= 0) {
        // Out of stock block: order remains at Window, not completed
        return;
      }
      station.orders.shift();
      state.stockUnits -= STOCK_UNITS_PER_ORDER;
      state.brandEquity = Math.min(100, state.brandEquity + BRAND_EQUITY_GAIN_PER_CLEAN_ORDER * order.quality);
      const basePrice = BASE_PRICE_BURGER + (order.wantsFries ? ADDON_PRICE_FRIES : 0);
      const tip = TIP_MAX_PER_ORDER * order.quality;
      const earned = basePrice + tip;
      state.cash += earned;
      state.cashEarnedToday = (state.cashEarnedToday || 0) + earned;
      state.tipsEarnedToday = (state.tipsEarnedToday || 0) + tip;
      state.ordersServed++;
      activateCustomerAtWindow(state, order.id, order.quality);
    }
  } else {
    const order = station.orders.shift();
    if (!order) return;

    if (station.id === 'queue') {
      const grill = state.stations.find((s) => s.id === 'grill');
      if (grill && grill.orders.length < grill.bufferCapacity) {
        grill.orders.push(order);
      }
    } else if (station.id === 'grill') {
      const assembly = state.stations.find((s) => s.id === 'assembly');
      if (assembly && assembly.orders.length < assembly.bufferCapacity) {
        assembly.orders.push(order);
      }
    } else if (station.id === 'assembly') {
      order.burgerComplete = true;
      const window = state.stations.find((s) => s.id === 'window');
      if (window && window.orders.length < window.bufferCapacity) {
        window.orders.push(order);
      }
    } else if (station.id === 'fryer') {
      order.friesComplete = true;
    }
  }
}
