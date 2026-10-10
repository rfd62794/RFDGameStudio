// new: ts/src/games/scrapcrawl/utils/simulateRun.ts
import { loadGame, call } from '../../../engine/runtime';
import { newRun, applyFight, applyMove } from './runEnd';
import type { RunOutcome } from './runEnd';

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
export function simulateRun(seed: number, useCraft: boolean): { outcome: RunOutcome; hp: number; steps: number } {
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
  let step = 0;
  for (; step < 400 && run.outcome === 'playing'; step++) {
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
  return { outcome: run.outcome, hp: run.hp, steps: step };
}
