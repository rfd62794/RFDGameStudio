export const H3_GOAL_TARGET = 100;

export interface GoalProgress {
  current: number;
  target: number;
  percent: number;
  reached: boolean;
}

/** H3 Gas is only ever added to the stockpile (drilling), so the stock is the running total. */
export function h3GoalProgress(h3Gas: number, target: number = H3_GOAL_TARGET): GoalProgress {
  const safe = Number.isFinite(h3Gas) && h3Gas > 0 ? h3Gas : 0;
  const current = Math.min(safe, target);
  return { current, target, percent: Math.round((current / target) * 100), reached: safe >= target };
}
