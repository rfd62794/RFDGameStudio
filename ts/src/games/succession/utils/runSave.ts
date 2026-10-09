// new: ts/src/games/succession/utils/runSave.ts
import { clearSave, loadSave, writeSave } from '../../../engine/shared/persistence';
import { PLAYER_ORIGINS } from '../data/origins';
import { TOTAL_SEGMENTS } from '../data/gameConstants';
import type { PlayerOriginId } from '../engine/types';
import type { GameState } from '../types/gameState';

/** localStorage key for the in-progress run. Bump RUN_SAVE_VERSION if the GameState shape changes. */
export const RUN_SAVE_KEY = 'succession_run';
export const RUN_SAVE_VERSION = 1;

export interface SavedRun {
  originId: PlayerOriginId;
  gameState: GameState;
}

/** A saved run is only trusted when its basic shape is right; anything else is treated as no save. */
export function isValidSavedRun(value: unknown): value is SavedRun {
  if (typeof value !== 'object' || value === null) return false;
  const run = value as Partial<SavedRun>;
  if (!PLAYER_ORIGINS.some((o) => o.id === run.originId)) return false;
  const s = run.gameState;
  if (typeof s !== 'object' || s === null) return false;
  return (
    s.phase === 'segment' &&
    Number.isInteger(s.segment) &&
    s.segment >= 1 &&
    s.segment <= TOTAL_SEGMENTS &&
    Array.isArray(s.figures) &&
    s.figures.length === 3 &&
    Array.isArray(s.claimants) &&
    Array.isArray(s.playerEvidence) &&
    Array.isArray(s.allClaims) &&
    Array.isArray(s.ticker)
  );
}

/** Saves a run that is mid-play. A finished run (verdict phase) is never saved. */
export function saveRun(run: SavedRun): void {
  if (!isValidSavedRun(run)) return;
  writeSave(RUN_SAVE_KEY, run, { version: RUN_SAVE_VERSION });
}

export function loadRun(): SavedRun | null {
  const run = loadSave<unknown>(RUN_SAVE_KEY, { version: RUN_SAVE_VERSION });
  return isValidSavedRun(run) ? run : null;
}

export function clearRun(): void {
  clearSave(RUN_SAVE_KEY);
}
