// bestScore.ts — Slime Coin best-score persistence (shared persistence, raw number).
// <!-- new: ts/src/games/slime_coin/utils/bestScore.ts -->
import { loadSave, writeSave } from '../../../engine/shared/persistence';

export const BEST_SCORE_SLOT = 'slime_coin_best_score';

/** Stored best score, or 0 when missing, corrupt or not a positive finite number. */
export function loadBestScore(): number {
  const stored = loadSave<unknown>(BEST_SCORE_SLOT);
  return typeof stored === 'number' && Number.isFinite(stored) && stored > 0 ? stored : 0;
}

/** Records a finished run's score; persists it only when it beats the stored best. */
export function recordRunScore(score: number): { best: number; isNewBest: boolean } {
  const previous = loadBestScore();
  if (!Number.isFinite(score) || score <= previous) return { best: previous, isNewBest: false };
  writeSave(BEST_SCORE_SLOT, score);
  return { best: score, isNewBest: true };
}
