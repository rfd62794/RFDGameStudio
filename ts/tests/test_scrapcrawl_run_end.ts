/**
 * test_scrapcrawl_run_end.ts — ScrapCrawl run-end rules tests.
 *
 * Guards the run-level end state added in
 * ts/src/games/scrapcrawl/utils/runEnd.ts: the run is WON after at
 * least one fight win in every room whose interaction_types include
 * 'fight' (scrap_pit, vent_stack, chemical_leak, furnace_core — Home
 * Base is the safe room and has nothing to clear), and LOST when the
 * run HP reaches 0 at LOSS_DAMAGE per lost fight. The Lua player has
 * no HP (init_player, logic.lua:224-239) and a lost fight costs only
 * weapon wear, so HP lives in this TS run layer; logic.lua itself is
 * untouched. Fights are played through the REAL games/scrapcrawl/
 * logic.lua with an injected roll (resolve_fight's 4th arg), so the
 * win and loss paths are proven through the actual fight code.
 * `call` returns an ARRAY of Lua return values; the first element is
 * the result table.
 *
 * <!-- new: ts/tests/test_scrapcrawl_run_end.ts -->
 */

import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';
import {
  newRun,
  applyFight,
  applyMove,
  fightRoomIds,
  PLAYER_MAX_HP,
  LOSS_DAMAGE,
} from '../src/games/scrapcrawl/utils/runEnd';

type TestRoom = { id: string; interaction_types?: string[]; difficulty?: number };
type TestData = { rooms: Record<string, TestRoom> };
type LuaPlayer = Record<string, unknown>;

interface TestFightResult {
  won: boolean;
  player: LuaPlayer;
}

function fight(session: GameSession, data: TestData, player: LuaPlayer, roomId: string, roll: number): TestFightResult {
  const [result] = call(session, 'resolve_fight', data, player, data.rooms[roomId], roll) as TestFightResult[];
  return result;
}

describe('ScrapCrawl run end', () => {
  it('a. winning once in every fight room wins the run', () => {
    const session = loadGame('scrapcrawl', 42);
    const data = session.files.data as TestData;
    let player = call(session, 'init_player')[0] as LuaPlayer;

    const ids = fightRoomIds(data.rooms);
    expect(ids).toEqual(['scrap_pit', 'vent_stack', 'chemical_leak', 'furnace_core']);

    let run = newRun();
    ids.forEach((roomId, i) => {
      const result = fight(session, data, player, roomId, 20);
      expect(result.won).toBe(true);
      player = result.player;
      run = applyFight(run, data.rooms, roomId, result.won);
      expect(run.outcome).toBe(i < ids.length - 1 ? 'playing' : 'won');
    });
    expect(run.hp).toBe(PLAYER_MAX_HP);
    expect(run.clearedRoomIds).toHaveLength(4);
  });

  it('b. five lost fights at 2 damage each end the run at 0 hp', () => {
    const session = loadGame('scrapcrawl', 42);
    const data = session.files.data as TestData;
    let player = call(session, 'init_player')[0] as LuaPlayer;

    let run = newRun();
    for (let i = 0; i < 4; i++) {
      const result = fight(session, data, player, 'scrap_pit', 1);
      expect(result.won).toBe(false);
      player = result.player;
      run = applyFight(run, data.rooms, 'scrap_pit', result.won);
    }
    expect(run.hp).toBe(PLAYER_MAX_HP - 4 * LOSS_DAMAGE);
    expect(run.outcome).toBe('playing');

    const last = fight(session, data, player, 'scrap_pit', 1);
    expect(last.won).toBe(false);
    run = applyFight(run, data.rooms, 'scrap_pit', last.won);
    expect(run.hp).toBe(0);
    expect(run.outcome).toBe('lost');
  });

  it('c. an ended run is terminal — applyFight and applyMove return the same object', () => {
    const data = loadGame('scrapcrawl', 42).files.data as TestData;
    const wonRun = { ...newRun(), outcome: 'won' as const };
    expect(applyFight(wonRun, data.rooms, 'scrap_pit', true)).toBe(wonRun);
    expect(applyMove(wonRun, data.rooms, 'home_base')).toBe(wonRun);
    const lostRun = { ...newRun(), hp: 0, outcome: 'lost' as const };
    expect(applyFight(lostRun, data.rooms, 'scrap_pit', false)).toBe(lostRun);
    expect(applyMove(lostRun, data.rooms, 'home_base')).toBe(lostRun);
  });

  it('d. newRun() after a lost run is a fresh run', () => {
    const lost = applyFight(applyFight(newRun(), {}, 'x', false), {}, 'x', false);
    const fresh = newRun();
    expect(fresh).not.toBe(lost);
    expect(fresh.hp).toBe(PLAYER_MAX_HP);
    expect(fresh.maxHp).toBe(PLAYER_MAX_HP);
    expect(fresh.clearedRoomIds).toEqual([]);
    expect(fresh.outcome).toBe('playing');
  });

  it('e. a repeated win in one room does not double count; a win in home_base is never recorded', () => {
    const data = loadGame('scrapcrawl', 42).files.data as TestData;
    let run = newRun();
    run = applyFight(run, data.rooms, 'scrap_pit', true);
    run = applyFight(run, data.rooms, 'scrap_pit', true);
    expect(run.clearedRoomIds).toEqual(['scrap_pit']);
    run = applyFight(run, data.rooms, 'home_base', true);
    expect(run.clearedRoomIds).toEqual(['scrap_pit']);
    expect(run.outcome).toBe('playing');
  });

  it('f. moving to a rest room restores hp; a fight room does not', () => {
    const data = loadGame('scrapcrawl', 42).files.data as TestData;
    let run = applyFight(newRun(), data.rooms, 'scrap_pit', false);
    expect(run.hp).toBe(8);
    run = applyMove(run, data.rooms, 'scrap_pit');
    expect(run.hp).toBe(8);
    run = applyMove(run, data.rooms, 'home_base');
    expect(run.hp).toBe(PLAYER_MAX_HP);
  });
});
