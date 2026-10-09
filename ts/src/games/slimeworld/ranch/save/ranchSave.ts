// new: ts/src/games/slimeworld/ranch/save/ranchSave.ts
import { clearSave, loadSave, writeSave } from '../../../../engine/shared/persistence';
import { RANCH_SAVE_KEY, RANCH_SAVE_VERSION } from '../data/constants';
import { newRanchState } from '../model/state';
import type { RanchState } from '../model/types';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNumberRecord(v: unknown): v is Record<string, number> {
  return isRecord(v) && Object.values(v).every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0);
}

/** Shape check for a loaded save. Anything that fails it is treated as no save, never repaired by guessing. */
export function isRanchState(v: unknown): v is RanchState {
  if (!isRecord(v)) return false;
  return (
    Array.isArray(v.pen) &&
    v.pen.every(
      (s) =>
        isRecord(s) &&
        typeof s.id === 'string' &&
        typeof s.speciesId === 'string' &&
        isRecord(s.traits) &&
        isRecord(s.lean)
    ) &&
    isNumberRecord(v.fruit) &&
    isNumberRecord(v.plorts) &&
    Array.isArray(v.collection) &&
    v.collection.every((c) => typeof c === 'string') &&
    typeof v.plortCredit === 'number' &&
    v.plortCredit >= 0 &&
    typeof v.actionCount === 'number' &&
    Number.isFinite(v.actionCount) &&
    v.actionCount >= 0 &&
    Array.isArray(v.sales) &&
    v.sales.every(
      (s) => isRecord(s) && typeof s.speciesId === 'string' && typeof s.atAction === 'number'
    ) &&
    typeof v.nextId === 'number' &&
    Number.isFinite(v.nextId) &&
    v.nextId >= 0
  );
}

export function saveRanch(state: RanchState): void {
  writeSave(RANCH_SAVE_KEY, state, { version: RANCH_SAVE_VERSION });
}

/** The saved ranch, or a fresh one when there is no save, it is malformed, or its version is stale. Never throws. */
export function loadRanch(): RanchState {
  const saved = loadSave<unknown>(RANCH_SAVE_KEY, { version: RANCH_SAVE_VERSION });
  return isRanchState(saved) ? saved : newRanchState();
}

/** The labelled Reset: forget the ranch save and return a fresh state. */
export function resetRanch(): RanchState {
  clearSave(RANCH_SAVE_KEY);
  return newRanchState();
}
