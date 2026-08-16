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

export function applyPlayerWhisper(
  figure: FigureState,
  newClaim: Claim,
  favorGain: number,
  themes: ClaimTheme[]
): WhisperResult {
  const exposed = checkContradiction(figure.mostRecentClaim, newClaim.themeId, themes);
  let updated = figure;
  if (exposed) {
    const nextExposedAgainst = updated.exposedAgainst.includes('player')
      ? updated.exposedAgainst
      : [...updated.exposedAgainst, 'player' as ClaimantId];
    updated = { ...updated, exposedAgainst: nextExposedAgainst };
    // No favor gain on a caught contradiction — the lie failed, full stop.
  } else {
    updated = applyFavorGain(updated, 'player', favorGain);
  }
  updated = { ...updated, mostRecentClaim: newClaim };
  return { figure: updated, exposed };
}
