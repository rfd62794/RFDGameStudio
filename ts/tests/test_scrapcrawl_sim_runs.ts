// new: ts/tests/test_scrapcrawl_sim_runs.ts
//
// Simulated runs through the REAL games/scrapcrawl/logic.lua with a seeded D20
// (resolve_fight's 4th arg) and a fixed scrap reward (5th arg), so every number
// below is reproducible. Rules come from utils/runEnd.ts (10 HP, 2 per lost fight).
import { describe, it, expect } from 'vitest';
import { simulateRun } from '../src/games/scrapcrawl/utils/simulateRun';
import { PLAYER_MAX_HP, LOSS_DAMAGE } from '../src/games/scrapcrawl/utils/runEnd';
import type { RunOutcome } from '../src/games/scrapcrawl/utils/runEnd';

const simulate = (seed: number, useCraft: boolean): RunOutcome => simulateRun(seed, useCraft).outcome;

function winRate(useCraft: boolean, n = 200): number {
  let wins = 0;
  for (let i = 0; i < n; i++) if (simulate(5000 + i, useCraft) === 'won') wins++;
  return wins / n;
}

describe('scrapcrawl simulated runs', () => {
  it('keeps the tuned run numbers: 10 HP, 2 per lost fight', () => {
    expect(PLAYER_MAX_HP).toBe(10);
    expect(LOSS_DAMAGE).toBe(2);
  });

  it('a run is winnable and losable with fixed seeds', () => {
    const outcomes = new Set<RunOutcome>();
    for (let i = 0; i < 40; i++) outcomes.add(simulate(5000 + i, false));
    expect(outcomes.has('won')).toBe(true);
    expect(outcomes.has('lost')).toBe(true);
    expect(outcomes.has('playing')).toBe(false);
  });

  it('crafting a Beat Stick clearly helps: unarmed wins 20-50%, crafting wins 60-90%', () => {
    const unarmed = winRate(false);
    const crafted = winRate(true);
    console.log('SIM unarmed=' + unarmed.toFixed(3) + ' crafted=' + crafted.toFixed(3));
    expect(unarmed).toBeGreaterThanOrEqual(0.2);
    expect(unarmed).toBeLessThanOrEqual(0.5);
    expect(crafted).toBeGreaterThanOrEqual(0.6);
    expect(crafted).toBeLessThanOrEqual(0.9);
    expect(crafted).toBeGreaterThan(unarmed);
  });
});
