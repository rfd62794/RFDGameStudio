import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeContext, defaultContext } from '../src/games/planetofgreed/rng';
import type { EngineContext } from '../src/games/planetofgreed/rng';
import { computeRank } from '../src/games/planetofgreed/campaignState';
import { finalizeAnnualReport, isCampaignOverDate } from '../src/games/planetofgreed/annualReport';
import { generateAIWeeklyOrders } from '../src/games/planetofgreed/aiWeeklyOrders';
import { buildCombatForces, resolvePendingCombats, concludeCombats } from '../src/games/planetofgreed/combatForces';
import { advanceDay } from '../src/games/planetofgreed/turnEngine';
import { PLAYER_CORP_ID } from '../src/games/planetofgreed/campaignConstants';
import type {
  Corporation, MapCell, GameState, UnitTransit, CellCombatState, CultureId,
} from '../src/games/planetofgreed/types';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

// ─── Fixtures ───
function makeCell(overrides: Partial<MapCell> & { id: number }): MapCell {
  return {
    id: overrides.id,
    name: overrides.name ?? `Cell-${overrides.id}`,
    seed: { x: 0, y: 0 },
    polygon: [],
    neighbors: overrides.neighbors ?? [],
    ownerId: overrides.ownerId !== undefined ? overrides.ownerId : null,
    units: overrides.units ?? { circle: 0, square: 0, triangle: 0 },
    fortification: overrides.fortification ?? 0,
    recruitmentQueue: overrides.recruitmentQueue ?? [],
    preferredProduction: overrides.preferredProduction ?? 'circle',
    productionProgress: overrides.productionProgress ?? 0,
    publicOpinion: overrides.publicOpinion ?? 50,
  };
}

function makeCorp(id: string, cultureId: CultureId, overrides: Partial<Corporation> = {}): Corporation {
  return {
    id,
    name: overrides.name ?? id,
    color: '#000',
    borderColor: '#000',
    bgClass: '',
    textClass: '',
    isPlayer: id === PLAYER_CORP_ID,
    cultureId,
    treasury: overrides.treasury ?? 100000,
    scoutedCells: overrides.scoutedCells ?? {},
    rank: overrides.rank ?? 1,
    fragments: overrides.fragments ?? [cultureId],
  };
}

function makeTransit(overrides: Partial<UnitTransit> = {}): UnitTransit {
  return {
    id: overrides.id ?? 't-1',
    corpId: overrides.corpId ?? PLAYER_CORP_ID,
    originCellId: overrides.originCellId ?? 1,
    targetCellId: overrides.targetCellId ?? 2,
    units: overrides.units ?? { circle: 1, square: 0, triangle: 0 },
    totalDays: overrides.totalDays ?? 4,
    daysLeft: overrides.daysLeft ?? 1,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    date: overrides.date ?? { year: 1, month: 1, week: 1, day: 3 },
    cells: overrides.cells ?? [],
    corporations: overrides.corporations ?? [],
    transits: overrides.transits ?? [],
    playerOrders: overrides.playerOrders ?? {},
    isSimulating: overrides.isSimulating ?? true,
    simulationSpeed: 1,
    currentActiveEvent: null,
    eventHistory: [],
    combatHistory: [],
    activeCombatsToResolve: [],
    currentCombatInView: null,
    campaignOver: false,
    endingEvent: null,
    logs: [],
    ...overrides,
  };
}

/** rng that yields a fixed sequence then repeats the last value. */
function scriptedCtx(values: number[]): EngineContext {
  let i = 0;
  let counter = 1_000_000;
  return {
    rng: () => (i < values.length ? values[i++] : values[values.length - 1]),
    now: () => counter++,
  };
}

// ─── EngineContext determinism ───
describe('rng / EngineContext', () => {
  it('makeContext: same seed produces identical rng sequences', () => {
    const a = makeContext(42);
    const b = makeContext(42);
    const seqA = Array.from({ length: 10 }, () => a.rng());
    const seqB = Array.from({ length: 10 }, () => b.rng());
    expect(seqA).toEqual(seqB);
  });

  it('makeContext: now() starts at 1_000_000 and increments by 1', () => {
    const ctx = makeContext(1);
    expect(ctx.now()).toBe(1_000_000);
    expect(ctx.now()).toBe(1_000_001);
    expect(ctx.now()).toBe(1_000_002);
  });

  it('makeContext: different seeds diverge', () => {
    const a = makeContext(1);
    const b = makeContext(2);
    const seqA = Array.from({ length: 10 }, () => a.rng());
    const seqB = Array.from({ length: 10 }, () => b.rng());
    expect(seqA).not.toEqual(seqB);
  });

  it('defaultContext exposes rng and now functions', () => {
    expect(typeof defaultContext.rng).toBe('function');
    expect(typeof defaultContext.now).toBe('function');
  });
});

// ─── advanceDay ───
describe('turnEngine.advanceDay', () => {
  it('advances the day and decrements transit daysLeft', () => {
    const transit = makeTransit({ daysLeft: 3 });
    const out = advanceDay(makeState({ transits: [transit] }), makeContext(7));
    expect(out.state.date.day).toBe(4);
    expect(out.state.transits[0].daysLeft).toBe(2);
    expect(out.enterPlanning).toBe(false);
  });

  it('merges an arrived same-owner transit into the garrison and consumes it', () => {
    const cell = makeCell({ id: 2, ownerId: 'ai-ember', units: { circle: 1, square: 0, triangle: 0 } });
    const transit = makeTransit({ corpId: 'ai-ember', targetCellId: 2, daysLeft: 1, units: { circle: 2, square: 1, triangle: 0 } });
    const out = advanceDay(makeState({ cells: [cell], transits: [transit] }), makeContext(7));
    const updated = out.state.cells.find(c => c.id === 2)!;
    expect(updated.units).toEqual({ circle: 3, square: 1, triangle: 0 });
    expect(out.state.transits).toHaveLength(0);
  });

  it('uncontested neutral claim captures the cell instantly', () => {
    const corp = makeCorp('ai-marsh', 'marsh');
    const cell = makeCell({ id: 5, ownerId: null, neighbors: [6] });
    const transit = makeTransit({ corpId: 'ai-marsh', targetCellId: 5, daysLeft: 1 });
    const out = advanceDay(makeState({ cells: [cell], corporations: [corp], transits: [transit] }), makeContext(7));
    const updated = out.state.cells.find(c => c.id === 5)!;
    expect(updated.ownerId).toBe('ai-marsh');
    expect(out.state.transits).toHaveLength(0);
    const updatedCorp = out.state.corporations.find(c => c.id === 'ai-marsh')!;
    expect(updatedCorp.scoutedCells[5]).toBe(true);
    expect(updatedCorp.scoutedCells[6]).toBe(true);
    expect(out.state.logs[0].message).toContain('SEC-OP');
  });

  it('week rollover: day 7 -> day 1 of next week, planning pause, orders reset', () => {
    const out = advanceDay(
      makeState({
        date: { year: 1, month: 1, week: 2, day: 7 },
        cells: [makeCell({ id: 9, ownerId: PLAYER_CORP_ID })],
        playerOrders: { 1: [{ type: 'hold' }] },
      }),
      makeContext(7)
    );
    expect(out.state.date).toEqual({ year: 1, month: 1, week: 3, day: 1 });
    expect(out.enterPlanning).toBe(true);
    expect(out.state.isSimulating).toBe(false);
    expect(out.state.playerOrders).toEqual({});
  });

  it('week rollover: processes recruitment queue, production, and income', () => {
    const corp = makeCorp('ai-ember', 'ember', { treasury: 100000 });
    const cell = makeCell({
      id: 1, ownerId: 'ai-ember',
      units: { circle: 0, square: 0, triangle: 0 },
      recruitmentQueue: [{ type: 'circle', weeksLeft: 1 }],
      productionProgress: 1,
    });
    const out = advanceDay(
      makeState({ date: { year: 1, month: 1, week: 1, day: 7 }, cells: [cell], corporations: [corp] }),
      makeContext(7)
    );
    const updatedCell = out.state.cells[0];
    // recruit arrived (+1) plus passive production tick to 2 (+1 preferred)
    expect(updatedCell.recruitmentQueue).toHaveLength(0);
    expect(updatedCell.units.circle).toBe(2);
    expect(updatedCell.productionProgress).toBe(0);
    // Ember incomePerCell = 10000
    expect(out.state.corporations[0].treasury).toBe(110000);
  });

  it('month rollover: week 4 day 7 -> month + 1', () => {
    const out = advanceDay(
      makeState({
        date: { year: 1, month: 3, week: 4, day: 7 },
        cells: [makeCell({ id: 9, ownerId: PLAYER_CORP_ID })],
      }),
      makeContext(7)
    );
    expect(out.state.date).toEqual({ year: 1, month: 4, week: 1, day: 1 });
  });

  it('year rollover: month 12 -> year + 1 and annual report shown', () => {
    const out = advanceDay(
      makeState({
        date: { year: 1, month: 12, week: 4, day: 7 },
        cells: [makeCell({ id: 9, ownerId: PLAYER_CORP_ID })],
      }),
      makeContext(7)
    );
    expect(out.state.date).toEqual({ year: 2, month: 1, week: 1, day: 1 });
    expect(out.showAnnualReport).toBe(true);
    expect(out.state.isSimulating).toBe(false);
  });

  it('campaign ends when the date reaches year 4', () => {
    const out = advanceDay(
      makeState({
        date: { year: 3, month: 12, week: 4, day: 7 },
        cells: [makeCell({ id: 9, ownerId: PLAYER_CORP_ID })],
      }),
      makeContext(7)
    );
    expect(out.state.date.year).toBe(4);
    expect(out.state.campaignOver).toBe(true);
    expect(out.state.isSimulating).toBe(false);
    expect(out.enterPlanning).toBe(false);
  });

  it('player elimination (0 cells) ends the campaign and shows the report', () => {
    const corp = makeCorp(PLAYER_CORP_ID, 'ember');
    const cell = makeCell({ id: 1, ownerId: 'ai-tide' });
    const out = advanceDay(makeState({ cells: [cell], corporations: [corp] }), makeContext(7));
    expect(out.state.campaignOver).toBe(true);
    expect(out.showAnnualReport).toBe(true);
    expect(out.state.isSimulating).toBe(false);
  });

  it('is deterministic under a seeded context', () => {
    const cells = [makeCell({ id: 1, ownerId: PLAYER_CORP_ID, units: { circle: 5, square: 5, triangle: 5 } })];
    const corps = [makeCorp(PLAYER_CORP_ID, 'ember'), makeCorp('ai-tide', 'tide')];
    const transits = [makeTransit({ corpId: 'ai-tide', targetCellId: 1, daysLeft: 2 })];
    const run = () => advanceDay(makeState({ cells, corporations: corps, transits }), makeContext(99));
    expect(JSON.stringify(run())).toEqual(JSON.stringify(run()));
  });

  it('does not mutate the previous state', () => {
    const cells = [
      makeCell({ id: 1, ownerId: PLAYER_CORP_ID, units: { circle: 1, square: 0, triangle: 0 }, recruitmentQueue: [{ type: 'circle', weeksLeft: 2 }] }),
      makeCell({ id: 2, ownerId: null, neighbors: [1] }),
    ];
    const corps = [makeCorp(PLAYER_CORP_ID, 'ember'), makeCorp('ai-tide', 'tide')];
    const transits = [makeTransit({ corpId: 'ai-tide', targetCellId: 2, daysLeft: 1 })];
    const prev = makeState({ cells, corporations: corps, transits, date: { year: 1, month: 1, week: 4, day: 7 } });
    const snapshot = JSON.stringify(prev);
    advanceDay(prev, makeContext(5));
    expect(JSON.stringify(prev)).toEqual(snapshot);
  });

  it('fires a daily boardroom event via ctx.rng and ids it via ctx.now', () => {
    const cell = makeCell({ id: 3, ownerId: PLAYER_CORP_ID, name: 'Anchor Sector' });
    const corps = [makeCorp(PLAYER_CORP_ID, 'ember')];
    const templates = [{
      title: 'Test Dilemma',
      description: 'Trouble in local sector.',
      choices: [{
        text: 'Do it', cost: 0, effectText: 'Nothing',
        action: () => ({ log: 'done', stateUpdates: {} }),
      }],
    }];
    // rng 0.05 < 0.12 triggers the event roll
    const out = advanceDay(
      makeState({ date: { year: 1, month: 1, week: 1, day: 2 }, cells: [cell], corporations: corps }),
      scriptedCtx([0.05, 0.0, 0.0]),
      templates
    );
    const evt = out.state.currentActiveEvent;
    expect(evt).not.toBeNull();
    expect(evt!.id).toBe('event-1000000');
    expect(evt!.title).toBe('Test Dilemma');
    expect(evt!.description).toContain('Anchor Sector');
    expect(out.state.logs[0].message).toContain('URGENT BOARDROOM ALERT');
  });
});

// ─── annual report ───
describe('annualReport', () => {
  it('isCampaignOverDate fires at year > 3', () => {
    expect(isCampaignOverDate({ year: 3, month: 12, week: 4, day: 7 })).toBe(false);
    expect(isCampaignOverDate({ year: 4, month: 1, week: 1, day: 1 })).toBe(true);
  });

  it('finalizeAnnualReport recomputes rank from territory + opinion', () => {
    const player = makeCorp(PLAYER_CORP_ID, 'ember', { rank: 6 });
    const rival = makeCorp('ai-tide', 'tide', { rank: 5 });
    const cells = [
      makeCell({ id: 1, ownerId: PLAYER_CORP_ID }),
      makeCell({ id: 2, ownerId: PLAYER_CORP_ID }),
      makeCell({ id: 3, ownerId: 'ai-tide' }),
    ];
    finalizeAnnualReport([player, rival], cells);
    expect(player.rank).toBe(1);
    expect(rival.rank).toBe(2);
  });

  it('finalizeAnnualReport grants Crystal +1 unit per owned cell', () => {
    const crystal = makeCorp('ai-crystal', 'crystal');
    const cell = makeCell({ id: 1, ownerId: 'ai-crystal', units: { circle: 2, square: 0, triangle: 0 }, preferredProduction: 'circle' });
    finalizeAnnualReport([crystal], [cell]);
    expect(cell.units.circle).toBe(3);
  });

  it('finalizeAnnualReport returns the ending only when the player is Rank 1', () => {
    const player = makeCorp(PLAYER_CORP_ID, 'ember');
    const rival = makeCorp('ai-tide', 'tide');
    const cells = [makeCell({ id: 1, ownerId: PLAYER_CORP_ID })];
    const ending = finalizeAnnualReport([player, rival], cells);
    expect(ending).not.toBeNull();
    expect(ending!.type).toBe('ENDING_TRIGGERED');
    expect(ending!.fragmentCount).toBe(1);
    expect(ending!.total).toBe(6);

    // AI at rank 1 does not fire the player ending
    const rivalCells = [makeCell({ id: 1, ownerId: 'ai-tide' })];
    expect(finalizeAnnualReport([makeCorp(PLAYER_CORP_ID, 'ember'), rival], rivalCells)).toBeNull();
  });
});

// ─── combat forces ───
describe('combatForces.buildCombatForces', () => {
  it('aggregates owner garrison plus arrived invader units only', () => {
    const cell = makeCell({ id: 1, ownerId: 'corp-a', units: { circle: 2, square: 1, triangle: 0 } });
    const transits = [
      makeTransit({ id: 't-inv', corpId: 'corp-b', targetCellId: 1, daysLeft: 0, units: { circle: 1, square: 0, triangle: 1 } }),
      makeTransit({ id: 't-inflight', corpId: 'corp-c', targetCellId: 1, daysLeft: 3, units: { circle: 9, square: 9, triangle: 9 } }),
      makeTransit({ id: 't-elsewhere', corpId: 'corp-b', targetCellId: 2, daysLeft: 0, units: { circle: 9, square: 9, triangle: 9 } }),
    ];
    const forces = buildCombatForces(cell, transits);
    expect(forces['corp-a']).toEqual({ circle: 2, square: 1, triangle: 0 });
    expect(forces['corp-b']).toEqual({ circle: 1, square: 0, triangle: 1 });
    expect(forces['corp-c']).toBeUndefined();
  });
});

describe('combatForces.resolvePendingCombats', () => {
  it('resolves every id in activeCombatsToResolve into a keyed map', () => {
    const cell = makeCell({ id: 4, ownerId: 'corp-a', units: { circle: 3, square: 0, triangle: 0 } });
    const state = makeState({
      cells: [cell],
      corporations: [makeCorp('corp-a', 'ember'), makeCorp('corp-b', 'tide')],
      activeCombatsToResolve: [4],
    });
    const results = resolvePendingCombats(state);
    expect(Object.keys(results)).toEqual(['4']);
    expect(results[4].cellId).toBe(4);
    expect(results[4].victorId).not.toBeUndefined();
  });
});

// ─── AI weekly orders ───
describe('aiWeeklyOrders.generateAIWeeklyOrders', () => {
  it('skips the player corp by default', () => {
    const cell = makeCell({ id: 1, ownerId: PLAYER_CORP_ID, units: { circle: 5, square: 5, triangle: 5 }, neighbors: [2] });
    const corps = [makeCorp(PLAYER_CORP_ID, 'ember', { treasury: 200000 })];
    const transits: UnitTransit[] = [];
    generateAIWeeklyOrders([cell, makeCell({ id: 2, neighbors: [1] })], corps, transits, scriptedCtx([0.0]));
    expect(transits).toHaveLength(0);
    expect(cell.recruitmentQueue).toHaveLength(0);
  });

  it('reinforce branch: treasury -30000 and a queued recruit (roll in [0.4, 0.6))', () => {
    const corp = makeCorp('ai-marsh', 'marsh', { treasury: 100000 });
    const cell = makeCell({ id: 1, ownerId: 'ai-marsh' });
    const transits: UnitTransit[] = [];
    // roll 0.5 -> Reinforce; next rng picks the unit type
    generateAIWeeklyOrders([cell], [corp], transits, scriptedCtx([0.5, 0.0]));
    expect(corp.treasury).toBe(70000);
    expect(cell.recruitmentQueue).toHaveLength(1);
    expect(cell.recruitmentQueue[0].weeksLeft).toBe(1);
  });

  it('expand branch: pushes a transit with a ctx.now id and scouts the target', () => {
    const corp = makeCorp('ai-gale', 'gale', { treasury: 0 });
    const cell = makeCell({ id: 1, ownerId: 'ai-gale', units: { circle: 3, square: 0, triangle: 0 }, neighbors: [2] });
    const target = makeCell({ id: 2, ownerId: null, neighbors: [1] });
    const transits: UnitTransit[] = [];
    // roll 0.1 -> Expand; subsequent rolls drive selectWeightedNeighbor
    generateAIWeeklyOrders([cell, target], [corp], transits, scriptedCtx([0.1, 0.0]));
    expect(transits).toHaveLength(1);
    expect(transits[0].corpId).toBe('ai-gale');
    expect(transits[0].targetCellId).toBe(2);
    expect(transits[0].id).toContain('ai-gale');
    expect(corp.scoutedCells[2]).toBe(true);
  });

  it('fortify branch: treasury cost paid and fortification incremented (roll in [0.6, 0.8))', () => {
    const corp = makeCorp('ai-tundra', 'tundra', { treasury: 100000 });
    const cell = makeCell({ id: 1, ownerId: 'ai-tundra', fortification: 0 });
    generateAIWeeklyOrders([cell], [corp], [], scriptedCtx([0.7]));
    // Tundra fortifyCost = 10000
    expect(corp.treasury).toBe(90000);
    expect(cell.fortification).toBe(1);
  });

  it('idle branch: nothing changes (roll >= 0.8)', () => {
    const corp = makeCorp('ai-tide', 'tide', { treasury: 100000 });
    const cell = makeCell({ id: 1, ownerId: 'ai-tide', units: { circle: 3, square: 0, triangle: 0 } });
    const transits: UnitTransit[] = [];
    generateAIWeeklyOrders([cell], [corp], transits, scriptedCtx([0.9]));
    expect(transits).toHaveLength(0);
    expect(corp.treasury).toBe(100000);
    expect(cell.fortification).toBe(0);
  });

  it('empty humanCorpIds lets every House act (headless soak-test path)', () => {
    const cell = makeCell({ id: 1, ownerId: PLAYER_CORP_ID });
    const corp = makeCorp(PLAYER_CORP_ID, 'ember', { treasury: 100000 });
    generateAIWeeklyOrders([cell], [corp], [], scriptedCtx([0.5, 0.0]), []);
    expect(corp.treasury).toBe(70000);
  });
});

// ─── concludeCombats ───
describe('turnEngine.concludeCombats', () => {
  function makeBattle(cellId: number, victorId: string | null, fortificationsLost = 1): CellCombatState {
    return {
      cellId,
      cellName: `Cell-${cellId}`,
      initialUnits: {},
      roundsLog: [],
      victorId,
      finalUnits: victorId ? { [victorId]: { circle: 2, square: 1, triangle: 0 } } : {},
      fortificationsLost,
    };
  }

  it('victor takes the cell: owner, units, fortification, scouts, transit cleanup', () => {
    const victor = makeCorp('ai-tide', 'tide');
    const loser = makeCorp('corp-a', 'ember');
    const cell = makeCell({ id: 1, ownerId: 'corp-a', fortification: 2, units: { circle: 1, square: 0, triangle: 0 }, neighbors: [2], publicOpinion: 60 });
    const loserOtherCell = makeCell({ id: 9, ownerId: 'corp-a' });
    const arrived = makeTransit({ corpId: 'ai-tide', targetCellId: 1, daysLeft: 0 });
    const state = makeState({
      cells: [cell, loserOtherCell],
      corporations: [victor, loser],
      transits: [arrived],
      activeCombatsToResolve: [1],
      currentCombatInView: makeBattle(1, 'ai-tide'),
    });
    const out = concludeCombats(state, { 1: makeBattle(1, 'ai-tide', 1) });
    const updated = out.state.cells[0];
    expect(updated.ownerId).toBe('ai-tide');
    expect(updated.units).toEqual({ circle: 2, square: 1, triangle: 0 });
    expect(updated.fortification).toBe(1);
    expect(updated.publicOpinion).toBe(55); // -5 combat damage
    expect(out.state.transits).toHaveLength(0);
    expect(out.state.corporations.find(c => c.id === 'ai-tide')!.scoutedCells[1]).toBe(true);
    expect(out.state.currentCombatInView).toBeNull();
    expect(out.state.activeCombatsToResolve).toEqual([]);
    expect(out.state.combatHistory).toHaveLength(1);
    expect(out.state.logs[0].message).toContain('secures control');
    expect(out.eliminationCount).toBe(0);
    expect(out.showAnnualReport).toBe(false);
  });

  it('mutual destruction: cell reverts to neutral with zeroed garrison', () => {
    const cell = makeCell({ id: 1, ownerId: 'corp-a', fortification: 2, units: { circle: 1, square: 0, triangle: 0 } });
    const survivorCell = makeCell({ id: 9, ownerId: 'corp-a' });
    const out = concludeCombats(
      makeState({ cells: [cell, survivorCell], corporations: [makeCorp('corp-a', 'ember')] }),
      { 1: makeBattle(1, null) }
    );
    const updated = out.state.cells[0];
    expect(updated.ownerId).toBeNull();
    expect(updated.units).toEqual({ circle: 0, square: 0, triangle: 0 });
    expect(updated.fortification).toBe(0);
    expect(out.state.logs[0].message).toContain('annihilation');
  });

  it('elimination: fragments transfer to the eliminator, eliminationCount reported', () => {
    const victor = makeCorp('ai-tide', 'tide');
    const loser = makeCorp('corp-a', 'ember', { fragments: ['ember', 'gale'] });
    // corp-a's only cell is cell 1
    const cell = makeCell({ id: 1, ownerId: 'corp-a' });
    const out = concludeCombats(
      makeState({ cells: [cell], corporations: [victor, loser] }),
      { 1: makeBattle(1, 'ai-tide') }
    );
    expect(out.eliminationCount).toBe(1);
    const updatedVictor = out.state.corporations.find(c => c.id === 'ai-tide')!;
    const updatedLoser = out.state.corporations.find(c => c.id === 'corp-a')!;
    expect(updatedLoser.fragments).toEqual([]);
    expect(updatedVictor.fragments).toContain('ember');
    expect(updatedVictor.fragments).toContain('gale');
    expect(out.state.logs.some(l => l.message.includes('eliminated'))).toBe(true);
  });

  it('displacement recompute: taking a cell from the corp ranked directly above fires a rank recompute', () => {
    // victor rank 2, loser rank 1 -> displacement
    const victor = makeCorp('ai-tide', 'tide', { rank: 2, name: 'Tide' });
    const loser = makeCorp('corp-a', 'ember', { rank: 1, name: 'Ember' });
    // loser keeps a second cell so it is not eliminated
    const cells = [
      makeCell({ id: 1, ownerId: 'corp-a' }),
      makeCell({ id: 2, ownerId: 'corp-a' }),
    ];
    const out = concludeCombats(
      makeState({ cells, corporations: [victor, loser] }),
      { 1: makeBattle(1, 'ai-tide') }
    );
    expect(out.state.logs.some(l => l.message.includes('displaces'))).toBe(true);
  });

  it('campaignOver: shows the annual report and fires the ending when the player is Rank 1', () => {
    const player = makeCorp(PLAYER_CORP_ID, 'ember');
    const cell = makeCell({ id: 1, ownerId: PLAYER_CORP_ID });
    const out = concludeCombats(
      makeState({ cells: [cell], corporations: [player], campaignOver: true }),
      { 1: makeBattle(1, PLAYER_CORP_ID) }
    );
    expect(out.showAnnualReport).toBe(true);
    expect(out.endingFired).toBe(true);
    expect(out.state.endingEvent).not.toBeNull();
    expect(out.state.endingEvent!.type).toBe('ENDING_TRIGGERED');
  });

  it('does not mutate the previous state', () => {
    const victor = makeCorp('ai-tide', 'tide');
    const loser = makeCorp('corp-a', 'ember', { fragments: ['ember'] });
    const cell = makeCell({ id: 1, ownerId: 'corp-a', fortification: 2, units: { circle: 1, square: 0, triangle: 0 }, neighbors: [2] });
    const arrived = makeTransit({ corpId: 'ai-tide', targetCellId: 1, daysLeft: 0 });
    const prev = makeState({ cells: [cell], corporations: [victor, loser], transits: [arrived], activeCombatsToResolve: [1] });
    const snapshot = JSON.stringify(prev);
    concludeCombats(prev, { 1: makeBattle(1, 'ai-tide') });
    expect(JSON.stringify(prev)).toEqual(snapshot);
  });
});

// ─── guard: extracted modules are free of bare random/clock use ───
describe('extracted engine module guard', () => {
  const BARE_USE = /\bMath\.random\b|\bDate\.now\b|\bperformance\.now\b/;
  const modulePaths = [
    'ts/src/games/planetofgreed/turnEngine.ts',
    'ts/src/games/planetofgreed/aiWeeklyOrders.ts',
    'ts/src/games/planetofgreed/combatForces.ts',
    'ts/src/games/planetofgreed/annualReport.ts',
    'ts/src/games/planetofgreed/campaignState.ts',
    'ts/src/games/planetofgreed/campaignConstants.ts',
  ];

  it('new engine modules contain no Math.random / Date.now / performance.now', () => {
    for (const rel of modulePaths) {
      const source = readFileSync(resolve(repoRoot, rel), 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      expect(BARE_USE.test(source), `${rel} uses a bare random/clock`).toBe(false);
    }
  });

  it('App.tsx contains no Math.random / Date.now / performance.now', () => {
    const source = readFileSync(resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    expect(BARE_USE.test(source)).toBe(false);
  });

  it('App.tsx delegates to the extracted engine modules', () => {
    const source = readFileSync(resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'), 'utf-8');
    expect(source).toContain("from './turnEngine'");
    expect(source).toContain("from './aiWeeklyOrders'");
    expect(source).toContain("from './combatForces'");
    expect(source).toContain("from './campaignState'");
    expect(source).toContain("from './rng'");
    expect(source).not.toContain('annualBonusUnits');
  });

  it('computeRank stays exported from campaignState for App annual flows', () => {
    const cells = [makeCell({ id: 1, ownerId: 'a' })];
    const corps = [makeCorp('a', 'ember', { rank: 6 })];
    computeRank(corps, cells);
    expect(corps[0].rank).toBe(1);
  });
});
