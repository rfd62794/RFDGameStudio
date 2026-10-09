import type { CultureId, GameState } from './types';
import { PLAYER_CORP_ID } from './campaignConstants';
import { makeContext } from './rng';
import { createInitialCampaign } from './campaignState';
import { advanceDay } from './turnEngine';
import { resolvePendingCombats, concludeCombats } from './combatForces';
import { generateAIWeeklyOrders } from './aiWeeklyOrders';

// Headless campaign driver: plays one campaign with every House on AI and
// reports how it ended. All randomness and clock inputs come from
// makeContext(seed), so a run replays identically from its seed. The soak
// test (ts/tests/test_planetofgreed_soak.ts) is the first consumer; later
// balance work can reuse this for longer or instrumented runs.

export type EndedBy = 'year-cap' | 'player-house-eliminated' | 'ending' | 'step-bound';

export interface HeadlessResult {
  seed: number;
  culture: CultureId;
  finished: boolean;
  endedBy: EndedBy;
  daysRun: number;
  /** ((year - 1) * 12 + (month - 1)) * 4 + (week - 1) at the final date. */
  weeksElapsed: number;
  combatsResolved: number;
  /** House id -> number of cells owned at the end. */
  cellsByHouse: Record<string, number>;
  /** Empty when every check held on every day. Each entry names the day and the broken rule. */
  violations: string[];
  finalState: GameState;
}

export const MAX_HEADLESS_DAYS = 1100;

// Collects the path of every non-finite number reachable under `value`.
function nonFinitePaths(value: unknown, path: string, out: string[]): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(path);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      nonFinitePaths(value[i], `${path}[${i}]`, out);
    }
    return;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    nonFinitePaths((value as Record<string, unknown>)[key], `${path}.${key}`, out);
  }
}

// Per-day soundness checks. A violation is a finding: it is recorded with
// the day and the broken rule, never silently repaired.
function checkInvariants(state: GameState, daysRun: number, violations: string[]): void {
  const at = `day ${daysRun} (y${state.date.year} m${state.date.month} w${state.date.week} d${state.date.day})`;

  const badPaths: string[] = [];
  nonFinitePaths(state.cells, 'cells', badPaths);
  nonFinitePaths(state.corporations, 'corporations', badPaths);
  nonFinitePaths(state.transits, 'transits', badPaths);
  if (badPaths.length > 0) {
    const shown = badPaths.slice(0, 5).join(', ');
    const extra = badPaths.length > 5 ? ` (+${badPaths.length - 5} more)` : '';
    violations.push(`${at}: non-finite number(s) at ${shown}${extra}`);
  }

  for (const corp of state.corporations) {
    if (corp.treasury < 0) {
      violations.push(`${at}: corporation ${corp.id} treasury ${corp.treasury} < 0`);
    }
  }

  const corpIds = new Set(state.corporations.map(c => c.id));
  const cellIds = new Set(state.cells.map(c => c.id));

  for (const cell of state.cells) {
    if (cell.units.circle < 0 || cell.units.square < 0 || cell.units.triangle < 0) {
      violations.push(`${at}: cell ${cell.id} negative unit count ${JSON.stringify(cell.units)}`);
    }
    if (cell.fortification < 0) {
      violations.push(`${at}: cell ${cell.id} fortification ${cell.fortification} < 0`);
    }
    if (cell.publicOpinion !== undefined && (cell.publicOpinion < 0 || cell.publicOpinion > 100)) {
      violations.push(`${at}: cell ${cell.id} publicOpinion ${cell.publicOpinion} outside 0-100`);
    }
    if (cell.ownerId !== null && !corpIds.has(cell.ownerId)) {
      violations.push(`${at}: cell ${cell.id} ownerId ${cell.ownerId} is not an existing corporation`);
    }
  }

  for (const transit of state.transits) {
    if (transit.daysLeft < 0) {
      violations.push(`${at}: transit ${transit.id} daysLeft ${transit.daysLeft} < 0`);
    }
    if (!cellIds.has(transit.originCellId) || !cellIds.has(transit.targetCellId)) {
      violations.push(`${at}: transit ${transit.id} references missing cell(s) origin=${transit.originCellId} target=${transit.targetCellId}`);
    }
    if (transit.units.circle < 0 || transit.units.square < 0 || transit.units.triangle < 0) {
      violations.push(`${at}: transit ${transit.id} negative unit count ${JSON.stringify(transit.units)}`);
    }
  }
}

export function runHeadlessCampaign(seed: number, culture: CultureId, maxDays: number = MAX_HEADLESS_DAYS): HeadlessResult {
  const ctx = makeContext(seed);
  let state = createInitialCampaign(culture, ctx);

  // Weekly planning, the headless equivalent of the player confirming the
  // week's orders: every House acts (empty humanCorpIds).
  // generateAIWeeklyOrders mutates what it is handed, so it gets clones
  // that are then written back into state.
  const planWeek = (): void => {
    const cells = structuredClone(state.cells);
    const corporations = structuredClone(state.corporations);
    const transits = structuredClone(state.transits);
    generateAIWeeklyOrders(cells, corporations, transits, ctx, []);
    state = { ...state, cells, corporations, transits };
  };

  planWeek(); // opening planning for week 1

  let daysRun = 0;
  let combatsResolved = 0;
  const violations: string[] = [];

  while (!state.campaignOver && daysRun < maxDays) {
    const out = advanceDay(state, ctx);
    state = out.state;
    daysRun += 1;

    if (state.activeCombatsToResolve.length > 0) {
      combatsResolved += state.activeCombatsToResolve.length;
      state = concludeCombats(state, resolvePendingCombats(state)).state;
    }

    if (out.enterPlanning && !state.campaignOver) {
      planWeek();
    }

    checkInvariants(state, daysRun, violations);
  }

  const endedBy: EndedBy = !state.campaignOver
    ? 'step-bound'
    : state.endingEvent
      ? 'ending'
      : state.cells.every(c => c.ownerId !== PLAYER_CORP_ID)
        ? 'player-house-eliminated'
        : 'year-cap';

  const { year, month, week } = state.date;
  const weeksElapsed = ((year - 1) * 12 + (month - 1)) * 4 + (week - 1);

  const cellsByHouse: Record<string, number> = {};
  for (const corp of state.corporations) cellsByHouse[corp.id] = 0;
  for (const cell of state.cells) {
    if (cell.ownerId !== null) {
      cellsByHouse[cell.ownerId] = (cellsByHouse[cell.ownerId] ?? 0) + 1;
    }
  }

  return {
    seed,
    culture,
    finished: state.campaignOver,
    endedBy,
    daysRun,
    weeksElapsed,
    combatsResolved,
    cellsByHouse,
    violations,
    finalState: state
  };
}
