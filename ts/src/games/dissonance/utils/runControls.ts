// new: ts/src/games/dissonance/utils/runControls.ts
const RUN_IN_PROGRESS_STATUSES = new Set([
  'not_started',
  'combat',
  'reward',
  'rest_craft',
  'treasure',
  'store',
  'anomaly',
]);

export function isRunInProgress(status: string): boolean {
  return RUN_IN_PROGRESS_STATUSES.has(status);
}
