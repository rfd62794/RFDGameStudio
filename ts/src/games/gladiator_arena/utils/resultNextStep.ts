export interface BoutOutcomeSummary {
  isVictory: boolean;
  anyDamaged: boolean;
  anyScarred: boolean;
}

/** One plain sentence telling the player what to do after a bout. */
export function nextStepAfterBout({ isVictory, anyDamaged, anyScarred }: BoutOutcomeSummary): string {
  if (anyScarred) {
    return 'Next: visit the Medbay to repair your frames. Scars are permanent, but the rest can be mended.';
  }
  if (anyDamaged) {
    return 'Next: repair your frames in the Medbay, then pick your next bout.';
  }
  return isVictory
    ? 'Next: your frames are fit to fight. Pick your next bout on the ladder.'
    : 'Next: try again, or visit the Forge to strengthen your frames first.';
}
