/**
 * Succession Balance Simulation Harness
 *
 * Runs 5+ named strategies × 3 origins through the real deterministic
 * game orchestration code. No randomness — the engine is fully
 * deterministic, so the variable being explored is player strategy,
 * not seed space.
 *
 * Usage: npx tsx tools/succession-balance-sim.ts
 */

import {
  createInitialGameState,
  whisperTo,
  appealTo,
  presentEvidenceTo,
  scoutForEvidence,
} from '../src/games/succession/utils/gameOrchestration';
import { GameState } from '../src/games/succession/types/gameState';
import { FigureId, PlayerOriginId, ClaimantId } from '../src/games/succession/engine/types';
import { CLAIM_THEMES } from '../src/games/succession/data/claimThemes';
import { checkContradictionAgainstKnown } from '../src/games/succession/engine/gossip';
import { VerdictResult } from '../src/games/succession/engine/verdict';

// ─── Types ───────────────────────────────────────────────────────────

type Move = 'whisper' | 'appeal' | 'evidence' | 'scout';

interface StrategyResult {
  move: Move;
  figureId?: FigureId;
  themeId?: string;
  evidenceId?: string;
}

type Strategy = (state: GameState, turnIndex: number) => StrategyResult;

interface RunResult {
  strategyName: string;
  origin: PlayerOriginId;
  winner: ClaimantId | null;
  isMajority: boolean;
  perFigureWinner: Record<string, ClaimantId | null>;
  finalFavor: Record<FigureId, Record<ClaimantId, number>>;
  margin: number;
  exposureCount: number;
  exposureSegment: number | null;
  decidedSegment: number | null;
  playerMoves: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

const ALL_FIGURES: FigureId[] = ['chancellor', 'archbishop', 'commander'];
const ALL_ORIGINS: PlayerOriginId[] = ['bastard_scion', 'disgraced_knight', 'merchant_banker'];

function getFigure(state: GameState, id: FigureId) {
  return state.figures.find((f) => f.id === id)!;
}

function playerFavor(state: GameState, id: FigureId): number {
  return getFigure(state, id).favor.player;
}

function rivalFavor(state: GameState, id: FigureId): number {
  const f = getFigure(state, id);
  return Math.max(f.favor.aldric, f.favor.vivienne);
}

function hasMatchingEvidence(state: GameState, figureId: FigureId): string | null {
  const match = state.playerEvidence.find((e) => e.relevantFigureId === figureId);
  return match ? match.id : null;
}

function figureWherePlayerIsFurthestBehind(state: GameState): FigureId {
  const gaps = ALL_FIGURES.map((id) => ({
    id,
    gap: rivalFavor(state, id) - playerFavor(state, id),
  }));
  gaps.sort((a, b) => b.gap - a.gap);
  return gaps[0].id;
}

function countExposures(state: GameState): number {
  return state.figures.filter((f) => f.exposedAgainst.includes('player')).length;
}

function firstExposureSegment(state: GameState): number | null {
  const entry = state.ticker.find((t) => t.exposed && t.claimantId === 'player');
  return entry ? entry.segment : null;
}

function findDecidedSegment(state: GameState): number | null {
  if (state.phase !== 'verdict' || !state.verdict) return null;
  const winners = Object.values(state.verdict.perFigureWinner);
  const playerWins = winners.filter((w) => w === 'player').length;
  const rivalWins = winners.filter((w) => w === 'aldric' || w === 'vivienne').length;

  if (playerWins >= 2 || rivalWins >= 2) {
    return state.segment;
  }
  return null;
}

function computeMargin(_state: GameState, verdict: VerdictResult): number {
  const playerWins = Object.values(verdict.perFigureWinner).filter((w) => w === 'player').length;
  const rivalWins = Object.values(verdict.perFigureWinner).filter(
    (w) => w === 'aldric' || w === 'vivienne'
  ).length;
  return playerWins - rivalWins;
}

// ─── Strategies ──────────────────────────────────────────────────────

const RushOneFigure: Strategy = (state) => {
  const target = figureWherePlayerIsFurthestBehind(state);

  const themes = CLAIM_THEMES.filter((t) => t.figureId === target);
  const safeTheme = themes.find(
    (t) => !checkContradictionAgainstKnown(state.allClaims, t.id, CLAIM_THEMES)
  );

  if (safeTheme) {
    return { move: 'whisper', figureId: target, themeId: safeTheme.id };
  }

  return { move: 'appeal', figureId: target };
};

const SpreadEvenly: Strategy = (state, turnIndex) => {
  const target = ALL_FIGURES[turnIndex % 3];
  const themes = CLAIM_THEMES.filter((t) => t.figureId === target);
  const safeTheme = themes.find(
    (t) => !checkContradictionAgainstKnown(state.allClaims, t.id, CLAIM_THEMES)
  );

  if (safeTheme) {
    return { move: 'whisper', figureId: target, themeId: safeTheme.id };
  }

  return { move: 'appeal', figureId: target };
};

const SafeAppealsOnly: Strategy = (state) => {
  const target = figureWherePlayerIsFurthestBehind(state);
  return { move: 'appeal', figureId: target };
};

const ScoutThenEvidence: Strategy = (state, turnIndex) => {
  if (turnIndex < 3) {
    return { move: 'scout' };
  }

  for (const figureId of ALL_FIGURES) {
    const evId = hasMatchingEvidence(state, figureId);
    if (evId) {
      return { move: 'evidence', figureId, evidenceId: evId };
    }
  }

  const target = figureWherePlayerIsFurthestBehind(state);
  return { move: 'appeal', figureId: target };
};

const WhisperHeavy: Strategy = (state) => {
  const scored = ALL_FIGURES.map((id) => {
    const themes = CLAIM_THEMES.filter((t) => t.figureId === id);
    const safeThemes = themes.filter(
      (t) => !checkContradictionAgainstKnown(state.allClaims, t.id, CLAIM_THEMES)
    );
    return {
      id,
      safeCount: safeThemes.length,
      playerFav: playerFavor(state, id),
    };
  });

  scored.sort((a, b) => {
    if (b.safeCount !== a.safeCount) return b.safeCount - a.safeCount;
    return a.playerFav - b.playerFav;
  });

  const target = scored[0];
  if (target.safeCount > 0) {
    const themes = CLAIM_THEMES.filter(
      (t) => t.figureId === target.id &&
      !checkContradictionAgainstKnown(state.allClaims, t.id, CLAIM_THEMES)
    );
    return { move: 'whisper', figureId: target.id, themeId: themes[0].id };
  }

  return { move: 'appeal', figureId: target.id };
};

// ─── Simulation Loop ────────────────────────────────────────────────

function applyMove(state: GameState, result: StrategyResult): GameState {
  switch (result.move) {
    case 'whisper':
      if (result.figureId && result.themeId) {
        return whisperTo(state, result.figureId, result.themeId);
      }
      return state;
    case 'appeal':
      if (result.figureId) {
        return appealTo(state, result.figureId);
      }
      return state;
    case 'evidence':
      if (result.figureId && result.evidenceId) {
        return presentEvidenceTo(state, result.figureId, result.evidenceId);
      }
      return state;
    case 'scout':
      return scoutForEvidence(state);
  }
}

function runSimulation(
  strategy: Strategy,
  strategyName: string,
  origin: PlayerOriginId
): RunResult {
  let state = createInitialGameState(origin);
  const playerMoves: string[] = [];
  let turnIndex = 0;
  const MAX_TURNS = 20;

  while (state.phase === 'segment' && turnIndex < MAX_TURNS) {
    const result = strategy(state, turnIndex);
    const moveDesc = result.move === 'scout'
      ? 'scout'
      : `${result.move}→${result.figureId}${result.themeId ? `(${result.themeId})` : ''}`;
    playerMoves.push(`S${state.segment}:${moveDesc}`);

    const newState = applyMove(state, result);
    if (newState === state) {
      playerMoves.push('NO-OP→fallback:appeal');
      const target = figureWherePlayerIsFurthestBehind(state);
      state = appealTo(state, target);
    } else {
      state = newState;
    }
    turnIndex++;
  }

  if (state.phase !== 'verdict' || !state.verdict) {
    const finalFavorStuck = {} as Record<FigureId, Record<ClaimantId, number>>;
    for (const f of state.figures) {
      finalFavorStuck[f.id] = { ...f.favor };
    }
    return {
      strategyName,
      origin,
      winner: null,
      isMajority: false,
      perFigureWinner: {},
      finalFavor: finalFavorStuck,
      margin: 0,
      exposureCount: countExposures(state),
      exposureSegment: firstExposureSegment(state),
      decidedSegment: null,
      playerMoves,
    };
  }

  const verdict = state.verdict;
  const margin = computeMargin(state, verdict);

  const finalFavor = {} as Record<FigureId, Record<ClaimantId, number>>;
  for (const f of state.figures) {
    finalFavor[f.id] = { ...f.favor };
  }

  return {
    strategyName,
    origin,
    winner: verdict.overallWinner,
    isMajority: verdict.isMajority,
    perFigureWinner: verdict.perFigureWinner,
    finalFavor,
    margin,
    exposureCount: countExposures(state),
    exposureSegment: firstExposureSegment(state),
    decidedSegment: findDecidedSegment(state),
    playerMoves,
  };
}

// ─── Output ──────────────────────────────────────────────────────────

const BLOWOUT_THRESHOLD = 2;

function formatFavor(favor: Record<ClaimantId, number>): string {
  return `P:${favor.player} A:${favor.aldric} V:${favor.vivienne}`;
}

function runAll(): void {
  const strategies: { name: string; fn: Strategy }[] = [
    { name: 'RushOneFigure', fn: RushOneFigure },
    { name: 'SpreadEvenly', fn: SpreadEvenly },
    { name: 'SafeAppealsOnly', fn: SafeAppealsOnly },
    { name: 'ScoutThenEvidence', fn: ScoutThenEvidence },
    { name: 'WhisperHeavy', fn: WhisperHeavy },
  ];

  const results: RunResult[] = [];

  console.log('═'.repeat(120));
  console.log('  SUCCESSION BALANCE SIMULATION — RAW FINDINGS');
  console.log('  5 strategies × 3 origins = 15 runs');
  console.log('═'.repeat(120));
  console.log();

  for (const strat of strategies) {
    for (const origin of ALL_ORIGINS) {
      const result = runSimulation(strat.fn, strat.name, origin);
      results.push(result);
    }
  }

  // ── Per-run table ──
  console.log('─'.repeat(120));
  console.log('  PER-RUN RESULTS');
  console.log('─'.repeat(120));
  console.log();

  const header = [
    'Strategy'.padEnd(20),
    'Origin'.padEnd(18),
    'Winner'.padEnd(10),
    'Type'.padEnd(10),
    'Margin'.padEnd(8),
    'Exp'.padEnd(5),
    'ExpSeg'.padEnd(7),
    'Chancellor'.padEnd(22),
    'Archbishop'.padEnd(22),
    'Commander'.padEnd(22),
  ].join(' | ');
  console.log(header);
  console.log('─'.repeat(header.length));

  for (const r of results) {
    const winnerStr = r.winner ?? 'DRAW';
    const typeStr = r.isMajority ? 'Majority' : 'Deadlock';
    const expStr = r.exposureCount.toString();
    const expSegStr = r.exposureSegment ? `S${r.exposureSegment}` : '-';

    const row = [
      r.strategyName.padEnd(20),
      r.origin.padEnd(18),
      winnerStr.padEnd(10),
      typeStr.padEnd(10),
      (r.margin >= 0 ? '+' : '') + r.margin.toString().padEnd(7),
      expStr.padEnd(5),
      expSegStr.padEnd(7),
      formatFavor(r.finalFavor.chancellor).padEnd(22),
      formatFavor(r.finalFavor.archbishop).padEnd(22),
      formatFavor(r.finalFavor.commander).padEnd(22),
    ].join(' | ');
    console.log(row);
  }

  console.log();

  // ── Per-figure winners ──
  console.log('─'.repeat(120));
  console.log('  PER-FIGURE WINNERS');
  console.log('─'.repeat(120));
  console.log();

  const figHeader = [
    'Strategy'.padEnd(20),
    'Origin'.padEnd(18),
    'Chancellor'.padEnd(14),
    'Archbishop'.padEnd(14),
    'Commander'.padEnd(14),
  ].join(' | ');
  console.log(figHeader);
  console.log('─'.repeat(figHeader.length));

  for (const r of results) {
    const row = [
      r.strategyName.padEnd(20),
      r.origin.padEnd(18),
      (r.perFigureWinner.chancellor ?? '-').padEnd(14),
      (r.perFigureWinner.archbishop ?? '-').padEnd(14),
      (r.perFigureWinner.commander ?? '-').padEnd(14),
    ].join(' | ');
    console.log(row);
  }

  console.log();

  // ── Aggregate stats ──
  console.log('─'.repeat(120));
  console.log('  AGGREGATE STATISTICS');
  console.log('─'.repeat(120));
  console.log();

  // Win rate per strategy
  console.log('  Win Rate Per Strategy:');
  for (const strat of strategies) {
    const stratResults = results.filter((r) => r.strategyName === strat.name);
    const wins = stratResults.filter((r) => r.winner === 'player').length;
    const losses = stratResults.filter((r) => r.winner === 'aldric' || r.winner === 'vivienne').length;
    const draws = stratResults.filter((r) => r.winner === null).length;
    const blowouts = stratResults.filter((r) => Math.abs(r.margin) >= BLOWOUT_THRESHOLD).length;
    const contested = stratResults.filter((r) => Math.abs(r.margin) < BLOWOUT_THRESHOLD).length;
    console.log(
      `    ${strat.name.padEnd(20)} W:${wins} L:${losses} D:${draws} | Blowout:${blowouts} Contested:${contested} | AvgMargin:${(stratResults.reduce((s, r) => s + r.margin, 0) / stratResults.length).toFixed(2)}`
    );
  }
  console.log();

  // Win rate per origin
  console.log('  Win Rate Per Origin:');
  for (const origin of ALL_ORIGINS) {
    const originResults = results.filter((r) => r.origin === origin);
    const wins = originResults.filter((r) => r.winner === 'player').length;
    const losses = originResults.filter((r) => r.winner === 'aldric' || r.winner === 'vivienne').length;
    const draws = originResults.filter((r) => r.winner === null).length;
    console.log(
      `    ${origin.padEnd(20)} W:${wins} L:${losses} D:${draws}`
    );
  }
  console.log();

  // Exposure stats
  console.log('  Exposure Statistics:');
  const totalExposures = results.reduce((s, r) => s + r.exposureCount, 0);
  const runsWithExposure = results.filter((r) => r.exposureCount > 0).length;
  console.log(`    Total exposures across all runs: ${totalExposures}`);
  console.log(`    Runs with at least 1 exposure: ${runsWithExposure}/15`);
  console.log();

  // Dominance check
  console.log('  Strategy Dominance Check:');
  const strategyWinCounts: Record<string, number> = {};
  for (const r of results) {
    if (r.winner === 'player') {
      strategyWinCounts[r.strategyName] = (strategyWinCounts[r.strategyName] || 0) + 1;
    }
  }
  const maxWins = Math.max(...Object.values(strategyWinCounts), 0);
  const dominantStrategies = Object.entries(strategyWinCounts)
    .filter(([, w]) => w === maxWins)
    .map(([s]) => s);
  console.log(`    Best win count: ${maxWins}/3 by ${dominantStrategies.join(', ')}`);
  console.log();

  // Move logs
  console.log('─'.repeat(120));
  console.log('  PLAYER MOVE LOGS');
  console.log('─'.repeat(120));
  console.log();
  for (const r of results) {
    console.log(`  ${r.strategyName} / ${r.origin}:`);
    console.log(`    ${r.playerMoves.join('  →  ')}`);
    console.log();
  }

  console.log('═'.repeat(120));
  console.log('  END OF RAW FINDINGS');
  console.log('═'.repeat(120));
}

runAll();
