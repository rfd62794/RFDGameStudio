// new: ts/tests/test_scrapcrawl_sim_runs.ts
//
// Simulated runs through the REAL games/scrapcrawl/logic.lua with a seeded D20
// (resolve_fight's 4th arg) and a fixed scrap reward (5th arg), so every number
// below is reproducible. Rules come from utils/runEnd.ts (10 HP, 2 per lost fight).
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { newRun, applyFight, applyMove, PLAYER_MAX_HP, LOSS_DAMAGE } from '../src/games/scrapcrawl/utils/runEnd';
import type { RunOutcome } from '../src/games/scrapcrawl/utils/runEnd';

type Rooms = Record<string, { id: string; interaction_types?: string[]; difficulty?: number }>;
type Player = Record<string, any>;

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHAIN = ['home_base', 'scrap_pit', 'vent_stack', 'chemical_leak', 'furnace_core'];

/** One run. useCraft: buy a Beat Stick at Home Base whenever scrap allows and the weapon is missing or broken. */
function simulate(seed: number, useCraft: boolean): RunOutcome {
  const session = loadGame('scrapcrawl');
  const data = session.files.data as { rooms: Rooms };
  const rooms = data.rooms;
  const rnd = seeded(seed);
  let player = call(session, 'init_player')[0] as Player;
  let run = newRun();
  const move = (id: string) => {
    player = call(session, 'move_player', data, player, id)[0] as Player;
    run = applyMove(run, rooms, id);
  };
  const walkHome = () => {
    while (player.currentRoomId !== 'home_base') {
      const i = CHAIN.indexOf(player.currentRoomId);
      move(i === CHAIN.length - 1 ? 'home_base' : CHAIN[i - 1]);
    }
  };
  for (let step = 0; step < 400 && run.outcome === 'playing'; step++) {
    const target = CHAIN.find(id => id !== 'home_base' && !run.clearedRoomIds.includes(id))!;
    const weapon = player.equipped.weapon;
    const noWeapon = !weapon || weapon.life === 0;
    if (useCraft && player.currentRoomId === 'home_base' && noWeapon && player.scrap >= 10) {
      player = call(session, 'craft', data, player, rooms.home_base, 'beatStick', 1)[0] as Player;
    }
    const here = CHAIN.indexOf(player.currentRoomId);
    if (here < CHAIN.indexOf(target)) { move(CHAIN[here + 1]); continue; }
    if (useCraft && run.hp <= 4 && noWeapon && player.scrap >= 10) { walkHome(); continue; }
    const roll = Math.floor(rnd() * 20) + 1;
    const reward = 3 + Math.floor(rnd() * 6);
    const res = call(session, 'resolve_fight', data, player, rooms[player.currentRoomId], roll, reward)[0] as { won: boolean; player: Player };
    player = res.player;
    run = applyFight(run, rooms, player.currentRoomId, res.won);
  }
  return run.outcome;
}

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
