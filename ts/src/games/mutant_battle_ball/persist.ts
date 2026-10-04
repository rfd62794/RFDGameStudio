// new: ts/src/games/mutant_battle_ball/persist.ts
// Save and restore the player's progress (iron, roster, parts, opponent, history) through the
// shared persistence module (ADR-014). Reads never throw; a save that does not look right is ignored.
import { loadSave, writeSave, clearSave } from '../../engine/shared/persistence';
import type { MBBGameState } from './types';

export const MBB_SAVE_KEY = 'mbb_save';
export const MBB_SAVE_VERSION = 1;

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');

/** Returns the state when `raw` is a usable save, else null. */
export function parseSave(raw: unknown): MBBGameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<MBBGameState>;
  if (typeof s.iron !== 'number' || !Number.isFinite(s.iron) || s.iron < 0) return null;
  if (!Array.isArray(s.roster) || s.roster.length === 0) return null;
  const ids = new Set<string>();
  for (const m of s.roster) {
    if (typeof m !== 'object' || m === null || typeof m.id !== 'string' || typeof m.parts !== 'object' || m.parts === null) return null;
    ids.add(m.id);
  }
  if (!isStringArray(s.partsInventory) || !isStringArray(s.bench)) return null;
  if (!Array.isArray(s.activeSquad) || s.activeSquad.length !== 2 || !s.activeSquad.every(id => ids.has(id))) return null;
  if (!Array.isArray(s.matchHistory)) return null;
  if (!Number.isInteger(s.currentOpponentIdx) || (s.currentOpponentIdx as number) < 0) return null;
  return s as MBBGameState;
}

export function loadMbbSave(): MBBGameState | null {
  return parseSave(loadSave<unknown>(MBB_SAVE_KEY, { version: MBB_SAVE_VERSION }));
}

export function writeMbbSave(state: MBBGameState): void {
  writeSave(MBB_SAVE_KEY, state, { version: MBB_SAVE_VERSION });
}

export function clearMbbSave(): void {
  clearSave(MBB_SAVE_KEY);
}
