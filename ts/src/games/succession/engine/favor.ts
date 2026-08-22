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

// Diminishing returns on consecutive same-theme repeats (ADR-002).
// consecutiveRepeats = 0 means this is the first claim of this theme by
// this claimant at this figure (or the first claim after switching away
// from it) — full value. Each additional consecutive repeat halves the
// gain, down to a 25% floor so repeating is never worthless, just
// increasingly inferior to switching (which restores full value).
// Applies identically regardless of claimantId — no player/rival split.
const REPEAT_DECAY_FLOOR_RATIO = 0.25;

export function applyRepeatDecay(baseGain: number, consecutiveRepeats: number): number {
  const ratio = Math.max(REPEAT_DECAY_FLOOR_RATIO, Math.pow(0.5, consecutiveRepeats));
  return Math.round(baseGain * ratio);
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

  const tracker = figure.repeatTracker ?? {};
  const priorRepeat = tracker[claimantId];
  const isRepeat = !!priorRepeat && priorRepeat.themeId === newClaim.themeId;
  const consecutiveRepeats = isRepeat ? priorRepeat!.count : 0;
  const nextCount = isRepeat ? priorRepeat!.count + 1 : 1;

  if (exposed) {
    const nextExposedAgainst = updated.exposedAgainst.includes(claimantId)
      ? updated.exposedAgainst
      : [...updated.exposedAgainst, claimantId];
    updated = { ...updated, exposedAgainst: nextExposedAgainst };
  } else {
    const decayedGain = applyRepeatDecay(favorGain, consecutiveRepeats);
    updated = applyFavorGain(updated, claimantId, decayedGain);
  }

  updated = {
    ...updated,
    mostRecentClaim: newClaim,
    repeatTracker: {
      ...tracker,
      [claimantId]: { themeId: newClaim.themeId, count: nextCount },
    },
  };
  return { figure: updated, exposed };
}
