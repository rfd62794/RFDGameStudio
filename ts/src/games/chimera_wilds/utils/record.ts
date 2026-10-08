import { clearSave, loadSave, writeSave } from '../../../engine/shared/persistence';
import type { EncounterResult } from '../types';

export const RECORD_KEY = 'chimera_wilds_record';
export const RECORD_LIMIT = 50;

function isEncounter(value: unknown): value is EncounterResult {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Partial<EncounterResult>;
  return typeof e.won === 'boolean' && typeof e.score === 'number'
    && typeof e.chimera_score === 'number' && typeof e.roll === 'number';
}

/** Saved encounters, newest first. Anything malformed is dropped, never thrown. */
export function loadRecord(): EncounterResult[] {
  const saved = loadSave<unknown>(RECORD_KEY, { version: 1 });
  if (!Array.isArray(saved)) return [];
  return saved.filter(isEncounter).slice(0, RECORD_LIMIT);
}

export function saveRecord(history: EncounterResult[]): void {
  writeSave(RECORD_KEY, history.slice(0, RECORD_LIMIT), { version: 1 });
}

export function clearRecord(): void {
  clearSave(RECORD_KEY);
}
