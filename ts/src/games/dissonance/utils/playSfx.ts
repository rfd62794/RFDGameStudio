// new: ts/src/games/dissonance/utils/playSfx.ts
import { sfx } from '../../../engine/shared/sfx';
import { isSoundMuted } from './soundPrefs';

/** Plays a shared sound effect unless the player has muted Dissonance. */
export function playSfx(name: string): void {
  if (isSoundMuted()) return;
  sfx.play(name);
}
