// new: ts/src/games/dissonance/utils/soundPrefs.ts
import { loadSave, writeSave } from '../../../engine/shared/persistence';

/** localStorage key for the player's choice to mute Dissonance's sound. Default: sound on. */
export const SOUND_MUTED_KEY = 'dissonance_sound_muted';

export function isSoundMuted(): boolean {
  return loadSave<boolean>(SOUND_MUTED_KEY) === true;
}

export function setSoundMuted(muted: boolean): void {
  writeSave(SOUND_MUTED_KEY, muted);
}
