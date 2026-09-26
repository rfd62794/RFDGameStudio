import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, slimeToLua, type LabState, type Slime } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const constants = data['constants'] as Record<string, number>;

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);
const rosterSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/RosterTab.tsx'),
  'utf8'
);

function makeSlime(overrides: Partial<Slime> = {}): Slime {
  return {
    id: 'w1', name: 'Worker', color: 'Red', pattern: 'Solid', level: 1, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, hue: 0, saturation: 100,
    vertexCount: 5, irregularity: 10, lockedRole: 'worker', createdAt: 1,
    ...overrides,
  };
}

function makeState(slimes: Slime[], overrides: Partial<LabState> = {}): LabState {
  return {
    cycle: 1, credits: 100, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes, contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null,
    planetRegion: null, wildsUnlocked: false, hasAutoFeeder: false,
    colorRelationships: {}, recentMarketSales: [], petitions: [],
    ...overrides,
  };
}

function income(slime: Slime, hasFeeder = false, nodes: unknown[] = [], cons: unknown = constants): number {
  const [raw] = call(session, 'calculate_worker_income', slimeToLua(slime), hasFeeder, nodes, cons) as [number];
  return raw;
}

describe('SlimeWorld tier-scaled worker income', () => {
  it('data.yaml constants carries WORKER_TIER_YIELD_RATE', () => {
    expect(constants['WORKER_TIER_YIELD_RATE']).toBe(0.1);
    expect(constants['WORKER_BASE_INCOME']).toBe(5);
  });

  it('floors at WORKER_BASE_INCOME and scales with snapped tier above it', () => {
    expect(income(makeSlime({ vertexCount: 4, irregularity: 5 }))).toBe(5); // T1+T1 -> floor
    expect(income(makeSlime())).toBe(10); // Red + Pentagon snap (5,10) -> tv 100 -> 10
    expect(income(makeSlime({ color: 'Purple' }))).toBe(12); // tv 117 -> 12
    expect(income(makeSlime({ vertexCount: 8, irregularity: 85 }))).toBe(31); // Crown T4 -> tv 305 -> 31
    expect(income(makeSlime({ color: 'Purple', vertexCount: 8, irregularity: 85 }))).toBe(32);
  });

  it('keeps autofeeder and culture multipliers on the scaled base', () => {
    const slime = makeSlime({ color: 'Purple' });
    expect(income(slime, true)).toBe(24);
    expect(income(slime, false, [{ id: 'n1', owner_color: 'Purple' }])).toBe(24);
    expect(income(slime, true, [{ id: 'n1', owner_color: 'Purple' }])).toBe(48);
  });

  it('falls back to flat 5 when constants are not passed', () => {
    expect(income(makeSlime({ color: 'Purple', vertexCount: 8, irregularity: 85 }), false, [], null)).toBe(5);
  });

  it('advance_cycle credits the tier-scaled income when constants are passed', () => {
    const state = makeState([makeSlime({ color: 'Purple' })]);
    const [raw] = call(session, 'advance_cycle', stateToLua(state), null, null, constants);
    const result = raw as Record<string, unknown>;
    expect(result['credits']).toBe(112);
  });

  it('advance_cycle keeps flat 5 for legacy callers without constants', () => {
    const state = makeState([makeSlime({ color: 'Purple', vertexCount: 8, irregularity: 85 })]);
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    expect(result['credits']).toBe(105);
  });

  it('App.tsx wires data.yaml constants into advance_cycle', () => {
    expect(appSource).toContain("data['constants']");
    expect(appSource).toContain("'advance_cycle', stateToLua(state), colorSpecs, data['petition'], data['constants']");
  });

  it('RosterTab asks Lua for the real income instead of a hardcoded 5', () => {
    expect(rosterSource).toContain("'calculate_worker_income'");
    expect(rosterSource).not.toContain('const base = 5');
  });
});
