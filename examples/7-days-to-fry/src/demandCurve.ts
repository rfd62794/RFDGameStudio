/**
 * @file src/demandCurve.ts
 * Manages open-ended escalating customer demand tiers and randomized escalation intervals.
 */

import {
  BASE_ARRIVAL_INTERVAL_MAX,
  DEMAND_ESCALATION_MAX_SECONDS,
  DEMAND_ESCALATION_MIN_SECONDS,
  FRIES_DEMAND_PROBABILITY,
} from './data';
import { KitchenState, LogEvent, Order } from './types';

/**
 * Creates a new Order entity with a unique ID and rolled wantsFries property.
 */
export function createOrder(wantsFries?: boolean): Order {
  const rollWantsFries = wantsFries ?? Math.random() < FRIES_DEMAND_PROBABILITY;
  return {
    id: `order_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
    wantsFries: rollWantsFries,
    burgerComplete: false,
    friesComplete: !rollWantsFries,
    quality: 1.0,
  };
}

/**
 * Returns a randomized duration in seconds for the next demand tier escalation.
 */
export function getEscalationInterval(): number {
  return (
    DEMAND_ESCALATION_MIN_SECONDS +
    Math.random() * (DEMAND_ESCALATION_MAX_SECONDS - DEMAND_ESCALATION_MIN_SECONDS)
  );
}

/**
 * Calculates current customer arrival interval (seconds per order) based on demand tier.
 */
export function getArrivalInterval(demandTier: number): number {
  const tier = Math.max(1, demandTier);
  const interval = BASE_ARRIVAL_INTERVAL_MAX / (1 + (tier - 1) * 0.4);
  return Math.max(0.6, interval);
}

/**
 * Updates the demand escalation timer and increments demand tier when triggered.
 */
export function updateDemandCurve(state: KitchenState, dt: number): void {
  if (state.nextEscalationTimer === undefined || state.nextEscalationTimer <= 0) {
    state.nextEscalationTimer = getEscalationInterval();
  }

  state.nextEscalationTimer -= dt;

  if (state.nextEscalationTimer <= 0) {
    state.demandTier = (state.demandTier || 1) + 1;
    state.nextEscalationTimer = getEscalationInterval();

    const log: LogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Math.floor(state.elapsedSeconds),
      message: `DEMAND ESCALATED! Reached Tier ${state.demandTier} — Customer arrival rate increased!`,
      type: 'warning',
    };
    state.logEvents.unshift(log);
    if (state.logEvents.length > 50) state.logEvents.pop();
  }
}
