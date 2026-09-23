import { FigureState, ClaimantId, FigureId, ClaimTheme } from './types';
import { SLANDER_LEAD_THRESHOLD } from '../data/gameConstants';
import { checkContradiction } from './contradiction';
import { applyRepeatDecay } from './favor';

export type RivalMoveType = 'whisper' | 'slander';

export interface RivalMoveAssignment {
  rivalId: ClaimantId;
  targetFigureId: FigureId;
  moveType: RivalMoveType;
}

export interface PlayerActionRecord {
  figureId?: FigureId | null;
  segment: number;
  claimantId?: string;
}

/**
 * Calculates the neglect score for each figure based on the last segment
 * the player targeted that figure. Figures never targeted by the player
 * receive the highest neglect rank (segment 0).
 */
export function rankFiguresByPlayerNeglect(
  figures: FigureState[],
  history: PlayerActionRecord[] = []
): FigureState[] {
  const lastTargetedSegment = new Map<FigureId, number>();
  figures.forEach((f) => lastTargetedSegment.set(f.id, 0));

  history.forEach((record) => {
    // If claimantId is specified, only consider player actions
    if (record.claimantId && record.claimantId !== 'player') return;
    if (record.figureId) {
      const current = lastTargetedSegment.get(record.figureId) ?? 0;
      if (record.segment > current) {
        lastTargetedSegment.set(record.figureId, record.segment);
      }
    }
  });

  return [...figures].sort((a, b) => {
    const lastA = lastTargetedSegment.get(a.id) ?? 0;
    const lastB = lastTargetedSegment.get(b.id) ?? 0;
    if (lastA !== lastB) {
      // Lower segment number means neglected longer
      return lastA - lastB;
    }
    // Tie-breaker 1: lowest player favor (least player investment)
    if (a.favor.player !== b.favor.player) {
      return a.favor.player - b.favor.player;
    }
    // Tie-breaker 2: highest Aldric favor (best opportunistic foothold)
    if (a.favor.aldric !== b.favor.aldric) {
      return b.favor.aldric - a.favor.aldric;
    }
    // Tie-breaker 3: deterministic id order
    return a.id.localeCompare(b.id);
  });
}

/**
 * Evaluates figures for Vivienne (The Disruptor), prioritizing figures where
 * the player holds the narrowest positive lead over Vivienne.
 */
export function rankFiguresByDisruption(
  figures: FigureState[],
  rivalId: ClaimantId = 'vivienne'
): { contested: FigureState[]; uncontested: FigureState[] } {
  const withPositiveLead: { figure: FigureState; lead: number }[] = [];
  const withoutLead: { figure: FigureState; standing: number }[] = [];

  figures.forEach((f) => {
    const lead = f.favor.player - f.favor[rivalId];
    if (lead > 0) {
      withPositiveLead.push({ figure: f, lead });
    } else {
      withoutLead.push({ figure: f, standing: f.favor[rivalId] });
    }
  });

  // Sort positive leads by SMALLEST lead first (narrowest lead to disrupt)
  withPositiveLead.sort((a, b) => {
    if (a.lead !== b.lead) {
      return a.lead - b.lead;
    }
    // Tie-breaker: higher overall player favor (higher stakes)
    if (a.figure.favor.player !== b.figure.favor.player) {
      return b.figure.favor.player - a.figure.favor.player;
    }
    return a.figure.id.localeCompare(b.figure.id);
  });

  // Fallback figures: sort by highest rival standing (consolidation)
  withoutLead.sort((a, b) => {
    if (b.standing !== a.standing) {
      return b.standing - a.standing;
    }
    return a.figure.id.localeCompare(b.figure.id);
  });

  return {
    contested: withPositiveLead.map((w) => w.figure),
    uncontested: withoutLead.map((w) => w.figure),
  };
}

/**
 * Computes rivals' target figures using behavioral archetypes:
 * - Lord Aldric (The Opportunist): targets the figure the player neglected longest.
 * - Lady Vivienne (The Disruptor): targets the figure where the player has the narrowest lead.
 * - Deconfliction: ensures rivals diversify targets when viable alternatives exist.
 *
 * Pure and deterministic.
 */
export function chooseRivalMoves(
  figures: FigureState[],
  rivalIds: ClaimantId[],
  history: PlayerActionRecord[] = []
): RivalMoveAssignment[] {
  if (rivalIds.length === 0 || figures.length === 0) return [];

  const assignments: RivalMoveAssignment[] = [];
  const claimedFigures = new Set<FigureId>();

  rivalIds.forEach((rivalId) => {
    let chosenFigureId: FigureId;

    if (rivalId === 'aldric') {
      // Aldric: The Opportunist
      const neglectedRanked = rankFiguresByPlayerNeglect(figures, history);
      const unclaimed = neglectedRanked.filter((f) => !claimedFigures.has(f.id));

      if (unclaimed.length > 0) {
        chosenFigureId = unclaimed[0].id;
      } else {
        chosenFigureId = neglectedRanked[0].id;
      }
    } else if (rivalId === 'vivienne') {
      // Vivienne: The Disruptor
      const { contested, uncontested } = rankFiguresByDisruption(figures, rivalId);
      const allRanked = [...contested, ...uncontested];

      // Prefer unclaimed contested figures first (narrowest positive lead)
      const unclaimedContested = contested.filter((f) => !claimedFigures.has(f.id));
      if (unclaimedContested.length > 0) {
        chosenFigureId = unclaimedContested[0].id;
      } else if (contested.length > 0 && !claimedFigures.has(contested[0].id)) {
        chosenFigureId = contested[0].id;
      } else {
        // Look at unclaimed in general (consolidation)
        const unclaimedGeneral = allRanked.filter((f) => !claimedFigures.has(f.id));
        if (unclaimedGeneral.length > 0) {
          chosenFigureId = unclaimedGeneral[0].id;
        } else {
          // Fallback to top ranked (may overlap if no live alternatives)
          chosenFigureId = allRanked[0]?.id ?? figures[0].id;
        }
      }
    } else {
      // Generic fallback: sort by player favor gap or rival standing
      const sorted = [...figures].sort(
        (a, b) => (b.favor.player - b.favor[rivalId]) - (a.favor.player - a.favor[rivalId])
      );
      const unclaimed = sorted.filter((f) => !claimedFigures.has(f.id));
      chosenFigureId = (unclaimed[0] || sorted[0]).id;
    }

    const targetFigure = figures.find((f) => f.id === chosenFigureId);
    const playerLead = targetFigure ? targetFigure.favor.player - targetFigure.favor[rivalId] : 0;
    const moveType: RivalMoveType = playerLead >= SLANDER_LEAD_THRESHOLD ? 'slander' : 'whisper';

    assignments.push({ rivalId, targetFigureId: chosenFigureId, moveType });
    claimedFigures.add(chosenFigureId);
  });

  return assignments;
}

/**
 * Value-aware rival theme selection (ADR-003).
 *
 * When this claimant has a prior claim of their own at this figure
 * (tracked via figure.repeatTracker, keyed per-claimant), compare the
 * real, known expected value of two options rather than blindly
 * repeating:
 *
 * - Repeat the current theme: decayed value per applyRepeatDecay,
 *   using this claimant's own consecutive-repeat count. Zero if the
 *   figure's actual current mostRecentClaim (shared across all
 *   claimants — see ADR-001) means repeating would itself now be a
 *   contradiction (e.g. another claimant flipped the figure's public
 *   claim to the opposing theme since this claimant last spoke).
 * - Switch to the figure's other theme: full base value, discounted to
 *   zero if checkContradiction against the figure's actual current
 *   mostRecentClaim says the switch would be caught. This is not a
 *   probabilistic risk estimate — the game has perfect information at
 *   decision time, so exposure is computed exactly.
 *
 * Whichever option has the higher computed value is chosen; repeating
 * wins ties (stability, no reason to switch without a real edge). If
 * this claimant has no prior claim at this figure at all, there is
 * nothing to compare against — fall back to the first theme, as before.
 */
export function chooseRivalWhisperTheme(
  figure: FigureState,
  claimantId: ClaimantId,
  baseGain: number,
  themes: ClaimTheme[]
): string {
  const figureThemes = themes.filter((t) => t.figureId === figure.id);
  const ownRepeat = figure.repeatTracker?.[claimantId];

  if (!ownRepeat) {
    return figureThemes[0].id;
  }

  const currentTheme = ownRepeat.themeId;
  const currentThemeDef = figureThemes.find((t) => t.id === currentTheme);
  const switchTheme =
    currentThemeDef?.opposesThemeId ??
    figureThemes.find((t) => t.id !== currentTheme)?.id ??
    currentTheme;

  const repeatExposed = checkContradiction(figure.mostRecentClaim, currentTheme, themes);
  const switchExposed = checkContradiction(figure.mostRecentClaim, switchTheme, themes);

  const repeatValue = repeatExposed ? 0 : applyRepeatDecay(baseGain, ownRepeat.count);
  const switchValue = switchExposed ? 0 : baseGain;

  return switchValue > repeatValue ? switchTheme : currentTheme;
}
