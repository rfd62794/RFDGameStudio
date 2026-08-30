/**
 * @file src/scoring/facialExpressions.ts
 * Facial expression rules for Workers, Manager, and Customers.
 */

import {
  MANAGER_REST_URGENCY_THRESHOLD,
  MEAL_CRITICAL_THRESHOLD,
  MEAL_URGENCY_THRESHOLD,
  QUALITY_TIER_DELIGHTED,
  QUALITY_TIER_DISAPPOINTED,
  QUALITY_TIER_NEUTRAL,
  QUALITY_TIER_SATISFIED,
  REST_CRITICAL_THRESHOLD,
  REST_URGENCY_THRESHOLD,
} from '../data';
import { KitchenState, ManagerState, Order, Worker } from '../types';

/**
 * Returns worker facial expression string based on current state & priority rules.
 */
export function getWorkerFacialExpression(w: Worker): string {
  if (w.currentTask === 'rest') return '😌';
  if (w.currentTask === 'eat_meal') return '😋';
  if (w.stamina < REST_CRITICAL_THRESHOLD) return '🥵';
  if (w.stamina < REST_URGENCY_THRESHOLD) return '😫';
  if (w.morale < MEAL_CRITICAL_THRESHOLD) return '😞';
  if (w.morale < MEAL_URGENCY_THRESHOLD) return '😔';
  if (w.currentTask === 'corner_cut') return '😰';
  return '🙂';
}

/**
 * Returns manager facial expression string based on current task & state.
 */
export function getManagerFacialExpression(m: ManagerState, k: KitchenState): string {
  if (m.currentTask === 'rest') return '😌';
  if (m.stamina < MANAGER_REST_URGENCY_THRESHOLD * 0.5) return '🥵';
  if (m.stamina < MANAGER_REST_URGENCY_THRESHOLD) return '😫';
  if (m.currentTask === 'supervise' && k.emergencyCallActive) return '🚨';
  if (m.currentTask === 'supervise') return '👀';
  if (m.currentTask === 'patrol') return '🧭';
  return '🙂';
}

/**
 * Returns customer facial expression string based on order quality.
 */
export function getCustomerFacialExpression(order: Order): string {
  if (order.quality >= QUALITY_TIER_DELIGHTED) return '😄';
  if (order.quality >= QUALITY_TIER_SATISFIED) return '🙂';
  if (order.quality >= QUALITY_TIER_NEUTRAL) return '😐';
  if (order.quality >= QUALITY_TIER_DISAPPOINTED) return '😕';
  return '😠';
}
