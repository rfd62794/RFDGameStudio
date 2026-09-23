import { Claim, ClaimTheme } from './types';

export function checkContradiction(
  previousClaim: Claim | null,
  newThemeId: string,
  themes: ClaimTheme[]
): boolean {
  if (!previousClaim) return false;
  const prevTheme = themes.find((t) => t.id === previousClaim.themeId);
  if (!prevTheme) return false;
  return prevTheme.opposesThemeId === newThemeId;
}
