import { clearSave, loadSave } from '../../../engine/shared/persistence';

export const SAVE_KEY = 'derby_sim_state_v1';

/** True when a usable career is saved (at least one horse). */
export function hasSavedCareer(): boolean {
  const saved = loadSave<{ horses?: unknown }>(SAVE_KEY);
  return saved !== null && Array.isArray(saved.horses) && saved.horses.length > 0;
}

/** Erase the saved career. The tutorial-seen flag is a separate key and is kept. */
export function wipeSavedCareer(): void {
  clearSave(SAVE_KEY);
}
