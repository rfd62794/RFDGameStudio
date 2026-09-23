import {
  RESERVED_DAILY_BUDGET,
  MIN_PER_PLAYER,
  MAX_PER_PLAYER,
  AGGREGATE_WARNING_THRESHOLD,
  PERSONAL_WARNING_THRESHOLD,
} from '../types';

export {
  RESERVED_DAILY_BUDGET,
  MIN_PER_PLAYER,
  MAX_PER_PLAYER,
  AGGREGATE_WARNING_THRESHOLD,
  PERSONAL_WARNING_THRESHOLD,
};

/**
 * Calculates per-player actions allowance based on totalPlayerCount.
 * Formula: floor(RESERVED_DAILY_BUDGET / totalPlayerCount), clamped between [MIN_PER_PLAYER, MAX_PER_PLAYER]
 */
export function computePlayerActionsAllowance(totalPlayerCount: number): number {
  const count = Math.max(1, Number(totalPlayerCount) || 1);
  const rawShare = Math.floor(RESERVED_DAILY_BUDGET / count);
  return Math.min(MAX_PER_PLAYER, Math.max(MIN_PER_PLAYER, rawShare));
}

/**
 * Derived warning helper: checks if Kingdom-wide aggregate actions consumed reaches 80%+ of budget.
 */
export function isAggregateWarningActive(dailyActionsConsumed: number): boolean {
  const consumed = Math.max(0, Number(dailyActionsConsumed) || 0);
  return (consumed / RESERVED_DAILY_BUDGET) >= AGGREGATE_WARNING_THRESHOLD;
}

/**
 * Derived warning helper: checks if player's personal remaining actions reaches <= 20% of their allowance.
 */
export function isPersonalWarningActive(actionsRemaining: number, actionsAllowance: number): boolean {
  const allowance = Math.max(1, Number(actionsAllowance) || MAX_PER_PLAYER);
  const remaining = Number(actionsRemaining) ?? allowance;
  return (remaining / allowance) <= PERSONAL_WARNING_THRESHOLD;
}

/**
 * Resolves Kingdom aggregate actions state, applying visit-triggered 24h reset if elapsed.
 */
export function resolveKingdomAggregateActionsState(kingdomData: any): {
  dailyActionsConsumed: number;
  needsReset: boolean;
} {
  let lastResetMs = 0;
  if (kingdomData?.dailyActionsResetAt) {
    if (typeof kingdomData.dailyActionsResetAt.toMillis === 'function') {
      lastResetMs = kingdomData.dailyActionsResetAt.toMillis();
    } else if (typeof kingdomData.dailyActionsResetAt === 'number') {
      lastResetMs = kingdomData.dailyActionsResetAt;
    } else if (typeof kingdomData.dailyActionsResetAt === 'string') {
      lastResetMs = new Date(kingdomData.dailyActionsResetAt).getTime() || 0;
    }
  }

  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const elapsedMs = lastResetMs > 0 ? Date.now() - lastResetMs : TWENTY_FOUR_HOURS_MS + 1;

  if (elapsedMs >= TWENTY_FOUR_HOURS_MS) {
    return { dailyActionsConsumed: 0, needsReset: true };
  }

  return {
    dailyActionsConsumed: Math.max(0, Number(kingdomData?.dailyActionsConsumed) || 0),
    needsReset: false,
  };
}
