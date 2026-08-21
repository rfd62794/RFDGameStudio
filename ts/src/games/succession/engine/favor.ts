import { FigureState, ClaimantId, Claim, ClaimTheme } from './types';
import { checkContradiction } from './contradiction';

export function applyFavorGain(
  figure: FigureState,
  claimantId: ClaimantId,
  amount: number
): FigureState {
  return {
    ...figure,
    favor: { ...figure.favor, [claimantId]: figure.favor[claimantId] + amount },
  };
}

export interface WhisperResult {
  figure: FigureState;
  exposed: boolean;
}

export function applyWhisper(
  figure: FigureState,
  claimantId: ClaimantId,
  newClaim: Claim,
  favorGain: number,
  themes: ClaimTheme[]
): WhisperResult {
  const exposed = checkContradiction(figure.mostRecentClaim, newClaim.themeId, themes);
  let updated = figure;
  if (exposed) {
    const nextExposedAgainst = updated.exposedAgainst.includes(claimantId)
      ? updated.exposedAgainst
      : [...updated.exposedAgainst, claimantId];
    updated = { ...updated, exposedAgainst: nextExposedAgainst };
  } else {
    updated = applyFavorGain(updated, claimantId, favorGain);
  }
  updated = { ...updated, mostRecentClaim: newClaim };
  return { figure: updated, exposed };
}
