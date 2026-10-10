// new: examples/factory-idle-precision-armory-phase2/src/engine/starterGoal.ts
import type { GameMetrics } from '../types';
import type { StorageLike } from './persistence';

/** The first goal: serve this many customers. */
export const STARTER_GOAL_TARGET = 5;
export const HINT_DISMISSED_KEY = 'factory_idle_hint_dismissed';

export interface StarterGoalProgress {
  served: number;
  target: number;
  done: boolean;
}

export function starterGoalProgress(metrics: Pick<GameMetrics, 'fulfilledOrders'>): StarterGoalProgress {
  const served = Math.max(0, Math.floor(metrics.fulfilledOrders));
  return { served: Math.min(served, STARTER_GOAL_TARGET), target: STARTER_GOAL_TARGET, done: served >= STARTER_GOAL_TARGET };
}

/** The one line shown to a new player. Friendly and specific; names no controls the player has not seen. */
export function starterHint(progress: StarterGoalProgress): string {
  if (progress.done) {
    return `Nice work! You served ${progress.target} customers. Keep your line running, and spend your research points on the next unlock.`;
  }
  return `Your starter line is already running and stocking the shelf. Serve ${progress.target} customers to meet your first goal (${progress.served} so far).`;
}

export function isHintDismissed(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(HINT_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissHint(storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(HINT_DISMISSED_KEY, '1');
  } catch {
    /* the hint just shows again next visit */
  }
}
