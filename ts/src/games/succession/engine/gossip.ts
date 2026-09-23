import { Claim, ClaimTheme } from './types';
import { checkContradiction } from './contradiction';

/**
 * Checks a proposed claim against EVERY claim ever made to ANY figure —
 * not just the target figure's own memory. The Court shares one
 * collective memory: once you've told anyone something, everyone
 * effectively knows it immediately. Reuses the existing, ADR-001-locked
 * pairwise opposition rule unchanged — only the set being compared
 * against has grown from one value to the full history.
 */
export function checkContradictionAgainstKnown(
  allClaims: Claim[],
  newThemeId: string,
  themes: ClaimTheme[]
): boolean {
  return allClaims.some((claim) => checkContradiction(claim, newThemeId, themes));
}
