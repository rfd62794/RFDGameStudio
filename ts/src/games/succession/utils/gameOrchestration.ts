import { FigureId, ClaimantId, Claim, PlayerOriginId, IndictmentTriad } from '../engine/types';
import { applyFavorGain, applyPlayerWhisper } from '../engine/favor';
import { chooseRivalMoves } from '../engine/rivalAI';
import { resolveVerdict } from '../engine/verdict';
import { checkContradictionAgainstKnown } from '../engine/gossip';
import { validateIndictmentForFigure } from '../engine/deduction';
import { GameState, TickerEntry } from '../types/gameState';
import { SCOUTABLE_EVIDENCE } from '../data/evidence';
import { CLAIM_THEMES } from '../data/claimThemes';
import {
  TOTAL_SEGMENTS,
  WHISPER_FAVOR_GAIN,
  APPEAL_FAVOR_GAIN,
  EVIDENCE_FAVOR_GAIN,
  INDICTMENT_FAVOR_GAIN,
  RIVAL_WHISPER_FAVOR_GAIN,
  RIVAL_SLANDER_PENALTY,
  DOMAIN_RIPPLE_CONFLICTS,
} from '../data/gameConstants';
import { getOriginModifiers } from '../data/origins';

const RIVALS: ClaimantId[] = ['aldric', 'vivienne'];

export function createInitialGameState(originId?: PlayerOriginId): GameState {
  const modifiers = originId ? getOriginModifiers(originId) : {};
  const figureIds: FigureId[] = ['chancellor', 'archbishop', 'commander'];
  const figures = figureIds.map((id) => ({
    id,
    favor: {
      player: modifiers.startingFavor?.[id] ?? 0,
      aldric: 0,
      vivienne: 0,
    },
    mostRecentClaim: null,
    exposedAgainst: [],
  }));

  const initialEvidence = (modifiers.startingEvidenceIndices ?? []).map(
    (i) => SCOUTABLE_EVIDENCE[i]
  );
  const initialScoutedCount = initialEvidence.length;

  return {
    segment: 1,
    phase: 'segment',
    playerOrigin: originId || 'bastard_scion',
    figures,
    claimants: ['player', 'aldric', 'vivienne'],
    playerEvidence: initialEvidence,
    scoutedCount: initialScoutedCount,
    allClaims: [],
    ticker: [],
    verdict: null,
  };
}

/**
 * Runs both rivals' moves against the CURRENT state (i.e., after the
 * player's move has already been applied this segment) and returns the
 * updated figures + ticker entries. Called at the end of every player
 * move function below — never called standalone.
 */
function resolveRivalMoves(state: GameState): { figures: typeof state.figures; entries: TickerEntry[] } {
  const assignments = chooseRivalMoves(state.figures, RIVALS, state.ticker);
  let figures = state.figures;
  const entries: TickerEntry[] = [];

  const modifiers = getOriginModifiers(state.playerOrigin);
  const slanderPenalty = RIVAL_SLANDER_PENALTY * (modifiers.slanderPenaltyMultiplier ?? 1);

  assignments.forEach(({ rivalId, targetFigureId, moveType }) => {
    if (moveType === 'slander') {
      figures = figures.map((f) =>
        f.id === targetFigureId
          ? {
              ...f,
              favor: {
                ...f.favor,
                player: Math.max(0, f.favor.player - slanderPenalty),
              },
            }
          : f
      );
      entries.push({
        segment: state.segment,
        claimantId: rivalId,
        figureId: targetFigureId,
        moveType: 'slander',
        favorGain: -slanderPenalty,
      });
    } else {
      // Check if this is the rival's first whisper move in the game
      const hasPriorWhisper = state.ticker.some(
        (t) => t.claimantId === rivalId && t.moveType === 'whisper'
      );
      let rivalGain = RIVAL_WHISPER_FAVOR_GAIN;
      if (modifiers.rivalFirstWhisperBonus && !hasPriorWhisper) {
        rivalGain += modifiers.rivalFirstWhisperBonus;
      }

      figures = figures.map((f) =>
        f.id === targetFigureId ? applyFavorGain(f, rivalId, rivalGain) : f
      );
      entries.push({
        segment: state.segment,
        claimantId: rivalId,
        figureId: targetFigureId,
        moveType: 'whisper',
        favorGain: rivalGain,
      });
    }
  });
  return { figures, entries };
}

/**
 * Advances the segment counter. If segment 8 just completed, transitions
 * to the verdict phase and runs resolveVerdict — no further moves accepted.
 */
function advanceSegment(state: GameState): GameState {
  const nextSegment = state.segment + 1;
  if (nextSegment > TOTAL_SEGMENTS) {
    const verdict = resolveVerdict(state.figures, state.claimants);
    return { ...state, segment: TOTAL_SEGMENTS, phase: 'verdict', verdict };
  }
  return { ...state, segment: nextSegment };
}

export function whisperTo(state: GameState, figureId: FigureId, themeId: string): GameState {
  if (state.phase === 'verdict') return state;

  const whisperModifiers = getOriginModifiers(state.playerOrigin);
  if (whisperModifiers.appealRequiredBeforeWhisper?.includes(figureId)) {
    const hasAppealedFigure = state.ticker.some(
      (t) => t.claimantId === 'player' && t.figureId === figureId && t.moveType === 'appeal'
    );
    if (!hasAppealedFigure) {
      return state;
    }
  }

  const figure = state.figures.find((f) => f.id === figureId)!;
  const claim: Claim = { figureId, themeId, segment: state.segment };

  // Direct, same-figure check — unchanged, existing function, existing tests.
  const { figure: figureAfterDirect, exposed: directExposed } =
    applyPlayerWhisper(figure, claim, WHISPER_FAVOR_GAIN, CLAIM_THEMES);

  // Cross-figure check against the full claim history (not yet including
  // this new claim — it hasn't been recorded yet).
  const crossFigureExposed =
    !directExposed && checkContradictionAgainstKnown(state.allClaims, themeId, CLAIM_THEMES);

  let updatedFigure = figureAfterDirect;
  let exposed = directExposed;
  if (crossFigureExposed) {
    exposed = true;
    updatedFigure = {
      ...updatedFigure,
      favor: { ...updatedFigure.favor, player: figure.favor.player }, // retract any gain applyPlayerWhisper granted
      exposedAgainst: updatedFigure.exposedAgainst.includes('player')
        ? updatedFigure.exposedAgainst
        : [...updatedFigure.exposedAgainst, 'player'],
    };
  }

  let figures = state.figures.map((f) => (f.id === figureId ? updatedFigure : f));
  const allClaims = [...state.allClaims, claim];

  // Zero-sum domain ripple friction: large claim to one domain creates slight friction on opposing domain
  let rippleData = undefined;
  if (!exposed) {
    const conflict = DOMAIN_RIPPLE_CONFLICTS[figureId];
    if (conflict) {
      const opposingFigure = figures.find((f) => f.id === conflict.targetFigureId);
      if (opposingFigure && opposingFigure.favor.player > 0) {
        const actualDeduction = Math.min(opposingFigure.favor.player, conflict.penalty);
        figures = figures.map((f) =>
          f.id === conflict.targetFigureId
            ? {
                ...f,
                favor: {
                  ...f.favor,
                  player: Math.max(0, f.favor.player - conflict.penalty),
                },
              }
            : f
        );
        rippleData = {
          targetFigureId: conflict.targetFigureId,
          penalty: actualDeduction,
          reason: conflict.reason,
        };
      }
    }
  }

  const playerEntry: TickerEntry = {
    segment: state.segment,
    claimantId: 'player',
    figureId,
    moveType: 'whisper',
    exposed,
    favorGain: exposed ? 0 : WHISPER_FAVOR_GAIN,
    ripple: rippleData,
  };
  const stateWithPlayer = { ...state, figures, allClaims, ticker: [...state.ticker, playerEntry] };
  const { figures: figuresAfterRivals, entries: rivalEntries } = resolveRivalMoves(stateWithPlayer);
  const next = {
    ...stateWithPlayer,
    figures: figuresAfterRivals,
    ticker: [...stateWithPlayer.ticker, ...rivalEntries],
  };
  return advanceSegment(next);
}

export function appealTo(state: GameState, figureId: FigureId): GameState {
  if (state.phase === 'verdict') return state;

  const appealModifiers = getOriginModifiers(state.playerOrigin);
  const appealGain = appealModifiers.appealFavorGainOverride?.[figureId] ?? APPEAL_FAVOR_GAIN;

  const figures = state.figures.map((f) =>
    f.id === figureId ? applyFavorGain(f, 'player', appealGain) : f
  );
  const playerEntry: TickerEntry = {
    segment: state.segment,
    claimantId: 'player',
    figureId,
    moveType: 'appeal',
    favorGain: appealGain,
  };
  const stateWithPlayer = { ...state, figures, ticker: [...state.ticker, playerEntry] };
  const { figures: figuresAfterRivals, entries: rivalEntries } = resolveRivalMoves(stateWithPlayer);
  const next = {
    ...stateWithPlayer,
    figures: figuresAfterRivals,
    ticker: [...stateWithPlayer.ticker, ...rivalEntries],
  };
  return advanceSegment(next);
}

export function presentEvidenceTo(state: GameState, figureId: FigureId, evidenceId: string): GameState {
  if (state.phase === 'verdict') return state;
  const evidence = state.playerEvidence.find((e) => e.id === evidenceId);
  if (!evidence || evidence.relevantFigureId !== figureId) return state; // no-op on mismatch or not held
  let figures = state.figures.map((f) =>
    f.id === figureId ? applyFavorGain(f, 'player', EVIDENCE_FAVOR_GAIN) : f
  );

  // Zero-sum domain ripple friction for evidence presentation
  let rippleData = undefined;
  const conflict = DOMAIN_RIPPLE_CONFLICTS[figureId];
  if (conflict) {
    const opposingFigure = figures.find((f) => f.id === conflict.targetFigureId);
    if (opposingFigure && opposingFigure.favor.player > 0) {
      const actualDeduction = Math.min(opposingFigure.favor.player, conflict.penalty);
      figures = figures.map((f) =>
        f.id === conflict.targetFigureId
          ? {
              ...f,
              favor: {
                ...f.favor,
                player: Math.max(0, f.favor.player - conflict.penalty),
              },
            }
          : f
      );
      rippleData = {
        targetFigureId: conflict.targetFigureId,
        penalty: actualDeduction,
        reason: conflict.reason,
      };
    }
  }

  const playerEvidence = state.playerEvidence.filter((e) => e.id !== evidenceId);
  const playerEntry: TickerEntry = {
    segment: state.segment,
    claimantId: 'player',
    figureId,
    moveType: 'evidence',
    favorGain: EVIDENCE_FAVOR_GAIN,
    ripple: rippleData,
  };
  const stateWithPlayer = {
    ...state,
    figures,
    playerEvidence,
    ticker: [...state.ticker, playerEntry],
  };
  const { figures: figuresAfterRivals, entries: rivalEntries } = resolveRivalMoves(stateWithPlayer);
  const next = {
    ...stateWithPlayer,
    figures: figuresAfterRivals,
    ticker: [...stateWithPlayer.ticker, ...rivalEntries],
  };
  return advanceSegment(next);
}

export function scoutForEvidence(state: GameState): GameState {
  if (state.phase === 'verdict') return state;
  const found = SCOUTABLE_EVIDENCE[state.scoutedCount % SCOUTABLE_EVIDENCE.length];
  const playerEvidence = [...state.playerEvidence, found];
  const playerEntry: TickerEntry = {
    segment: state.segment,
    claimantId: 'player',
    figureId: null,
    moveType: 'scout',
  };
  const stateWithPlayer = {
    ...state,
    playerEvidence,
    scoutedCount: state.scoutedCount + 1,
    ticker: [...state.ticker, playerEntry],
  };
  const { figures: figuresAfterRivals, entries: rivalEntries } = resolveRivalMoves(stateWithPlayer);
  const next = {
    ...stateWithPlayer,
    figures: figuresAfterRivals,
    ticker: [...stateWithPlayer.ticker, ...rivalEntries],
  };
  return advanceSegment(next);
}

export function deliverIndictmentTo(
  state: GameState,
  figureId: FigureId,
  triad: IndictmentTriad
): GameState {
  if (state.phase === 'verdict') return state;

  const validation = validateIndictmentForFigure(figureId, triad);
  const isCorrect = validation.isCorrect;

  let figures = state.figures;
  if (isCorrect) {
    // Validated indictment provides decisive proof: grants massive favor gain and un-exposes player if previously tainted
    figures = figures.map((f) =>
      f.id === figureId
        ? {
            ...applyFavorGain(f, 'player', INDICTMENT_FAVOR_GAIN),
            exposedAgainst: f.exposedAgainst.filter((c) => c !== 'player'),
          }
        : f
    );
  } else {
    // False indictment / Malicious fabrication: exposed for perjury
    figures = figures.map((f) =>
      f.id === figureId
        ? {
            ...f,
            exposedAgainst: f.exposedAgainst.includes('player')
              ? f.exposedAgainst
              : [...f.exposedAgainst, 'player'],
          }
        : f
    );
  }

  const playerEntry: TickerEntry = {
    segment: state.segment,
    claimantId: 'player',
    figureId,
    moveType: 'indictment',
    exposed: !isCorrect,
    favorGain: isCorrect ? INDICTMENT_FAVOR_GAIN : 0,
    indictment: {
      triad,
      isCorrect,
    },
  };

  const stateWithPlayer = {
    ...state,
    figures,
    ticker: [...state.ticker, playerEntry],
  };

  const { figures: figuresAfterRivals, entries: rivalEntries } = resolveRivalMoves(stateWithPlayer);
  const next = {
    ...stateWithPlayer,
    figures: figuresAfterRivals,
    ticker: [...stateWithPlayer.ticker, ...rivalEntries],
  };

  return advanceSegment(next);
}

