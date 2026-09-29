import { FigureId, PersuasionMethod } from './types';
import { COURT_FIGURES } from '../data/courtFigures';

/**
 * Figure-locked persuasion methods (ADR-007, implementing the design
 * doc's "Persuasion Methods — Locked to Each Figure" section).
 *
 * Each councilor values one persuasion method uniquely — the locked
 * method earns full favor value. Non-locked methods still function at
 * meaningfully reduced value — never zero, never disabled — the "No
 * Mathematical Dead End" safeguard the design doc locked: a player
 * whose origin bonuses don't match a figure's locked method has a
 * genuinely worse path, not a wall.
 *
 * The non-locked ratio is 0.25 — deliberately the same scale as the
 * REPEAT_DECAY_FLOOR_RATIO precedent in engine/favor.ts. It is the
 * largest uniform ratio at which the locked method is strictly the
 * most effective option at every figure given the real base values
 * (whisper 20 / appeal 8 / evidence 30): at the appeal-locked
 * commander, evidence must stay below the appeal value, so non-locked
 * gains cannot exceed ~26% of base.
 *
 * The locked premium is 2× — the second knob the design doc
 * prescribes ("locked method is the strongest option"). Balance-sim
 * evidence: at flat locked value + 0.25 off-rate, every scripted
 * strategy loses every origin run (0/18 player wins) because rivals
 * still earn full whisper value each segment — a mathematically
 * hopeless lane, exactly the outcome the design doc forbids. The
 * premium must clear the rival whisper economy (RIVAL_WHISPER_FAVOR_GAIN
 * = 15/segment): at 1.5× the appeal-locked commander's own favored
 * method still pays 12 < 15 — structurally hopeless. At 2× every
 * favored lane out-earns a rival whisper (whisper 40 / appeal 16 /
 * evidence 60) while off-method approaches remain a real-but-reduced
 * fallback.
 */

export const NON_LOCKED_METHOD_RATIO = 0.25;
export const LOCKED_METHOD_BONUS_RATIO = 2;
export const MIN_NON_LOCKED_METHOD_GAIN = 1;

export const PERSUASION_METHOD_LABELS: Record<PersuasionMethod, string> = {
  whisper: 'Whispered Claims',
  appeal: 'Formal Appeal',
  evidence: 'Archival Evidence',
};

export function lockedMethodFor(figureId: FigureId): PersuasionMethod {
  return COURT_FIGURES[figureId].lockedMethod;
}

export function isLockedMethod(figureId: FigureId, method: PersuasionMethod): boolean {
  return lockedMethodFor(figureId) === method;
}

/**
 * The favor value a persuasion method actually earns at a figure:
 * 2× base for the figure's locked method, a quarter (floored,
 * never below 1) for every other method.
 */
export function persuasionMethodGain(
  figureId: FigureId,
  method: PersuasionMethod,
  baseGain: number
): number {
  if (isLockedMethod(figureId, method)) return Math.floor(baseGain * LOCKED_METHOD_BONUS_RATIO);
  return Math.max(MIN_NON_LOCKED_METHOD_GAIN, Math.floor(baseGain * NON_LOCKED_METHOD_RATIO));
}
