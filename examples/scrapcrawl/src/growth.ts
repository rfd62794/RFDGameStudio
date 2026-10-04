export const PROFICIENCY_XP_CEILING = 500;

export function growthFactor(xp: number): number {
  const ratio = xp / PROFICIENCY_XP_CEILING;
  return Math.max(0.8, Math.min(1.5, 0.8 + ratio * 0.7));
}
