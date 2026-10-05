/** Star rating for a held defence, from the core hit points left. */
export const MAX_STARS = 3;

export function starsForCoreHp(coreHp: number, startCoreHp: number): number {
  if (coreHp <= 0 || startCoreHp <= 0) return 0;
  const share = coreHp / startCoreHp;
  if (share >= 0.8) return 3;
  if (share >= 0.5) return 2;
  return 1;
}

/** "Wave 2 of 6" for the status line; never past the last wave. */
export function waveLabel(wave: number, totalWaves: number): string {
  const shown = Math.min(Math.max(1, Math.round(wave)), Math.max(1, totalWaves));
  return `Wave ${shown} of ${Math.max(1, totalWaves)}`;
}
