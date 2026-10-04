import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { buildColorSpecs, initialState } from '../src/games/slimeworld/App';
import { luaSlimeToTs, stateToLua, type LabState } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const CYCLES = 200;

function runBaseline(): { state: LabState; minCredits: number; cyclesRun: number } {
  let state = initialState(session);
  // Baseline strategy: put every starter slime to work, then only advance cycles.
  for (const slime of state.slimes) {
    const id = slime.id;
    if (call(session, 'toggle_worker_role', stateToLua(state), id)[0] === true) {
      state = { ...state, slimes: state.slimes.map(s => (s.id === id ? { ...s, lockedRole: 'worker' } : s)) };
    }
  }
  let minCredits = state.credits;
  let cyclesRun = 0;
  for (let i = 0; i < CYCLES; i += 1) {
    const [raw] = call(session, 'advance_cycle', stateToLua(state), buildColorSpecs(data), data['petition'], data['constants']);
    const result = raw as Record<string, unknown>;
    state = {
      ...state,
      cycle: Number(result['cycle'] ?? state.cycle + 1),
      credits: Number(result['credits'] ?? state.credits),
      slimes: Array.isArray(result['slimes']) ? (result['slimes'] as Array<Record<string, unknown>>).map(luaSlimeToTs) : state.slimes,
    };
    minCredits = Math.min(minCredits, state.credits);
    cyclesRun += 1;
  }
  return { state, minCredits, cyclesRun };
}

describe('SlimeWorld headless baseline run (200 cycles, advance only)', () => {
  const run = runBaseline();

  it('advances every cycle without an error', () => {
    expect(run.cyclesRun).toBe(CYCLES);
    expect(run.state.cycle).toBeGreaterThanOrEqual(CYCLES);
  });

  it('pays steady worker income: Biomass grows, but stays in a sane range', () => {
    expect(run.state.credits).toBeGreaterThan(100);
    expect(run.state.credits).toBeLessThan(100000);
  });

  it('never lets Biomass go negative or become NaN', () => {
    expect(run.minCredits).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(run.state.credits)).toBe(true);
  });

  it('keeps every slime stat finite and the roster inside its cap', () => {
    expect(run.state.slimes.length).toBeLessThanOrEqual(run.state.rosterCap);
    for (const slime of run.state.slimes) {
      for (const value of Object.values(slime.stats)) expect(Number.isFinite(value)).toBe(true);
    }
  });
});
