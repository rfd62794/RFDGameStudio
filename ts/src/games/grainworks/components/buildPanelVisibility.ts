import type { BuildingDef } from '../types';

/** A tool is shown only once the player has reached the tier that unlocks it. */
export function isUnlocked(def: Pick<BuildingDef, 'unlockedAtTier'>, currentTier: number): boolean {
  return def.unlockedAtTier <= currentTier;
}

export function unlockedDefs<T extends Pick<BuildingDef, 'unlockedAtTier'>>(
  defs: readonly T[],
  currentTier: number
): T[] {
  return defs.filter((d) => isUnlocked(d, currentTier));
}
