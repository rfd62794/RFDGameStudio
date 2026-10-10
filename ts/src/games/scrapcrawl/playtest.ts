// new: ts/src/games/scrapcrawl/playtest.ts
import { loadGame, call } from '../../engine/runtime';
import type { GameSession } from '../../engine/types';
import type { PlaytestAdapter, Policy } from '../../engine/playtest';
import { newRun, applyFight, applyMove } from '../scrapcrawl/utils/runEnd';
import type { RunOutcome, RunProgress } from '../scrapcrawl/utils/runEnd';

export type ScrapAction = { kind: 'move'; to: string } | { kind: 'fight' } | { kind: 'craft' };
export interface ScrapObs { room: string; hp: number; scrap: number; hasWeapon: boolean; cleared: string[] }

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

export function createScrapcrawlAdapter(): PlaytestAdapter<ScrapObs, ScrapAction> {
  let session: GameSession;
  let data: { rooms: Rooms };
  let rooms: Rooms;
  let rnd: () => number;
  let player: Player;
  let run: RunProgress;
  return {
    gameId: 'scrapcrawl',
    init(seed: number): void {
      session = loadGame('scrapcrawl');
      data = session.files.data as { rooms: Rooms };
      rooms = data.rooms;
      rnd = seeded(seed);
      player = call(session, 'init_player')[0] as Player;
      run = newRun();
    },
    isTerminal(): boolean {
      return run.outcome !== 'playing';
    },
    outcome(): RunOutcome {
      return run.outcome;
    },
    legalActions(): ScrapAction[] {
      if (run.outcome !== 'playing') return [];
      const actions: ScrapAction[] = [{ kind: 'fight' }];
      const i = CHAIN.indexOf(player.currentRoomId);
      if (CHAIN[i + 1] !== undefined) actions.push({ kind: 'move', to: CHAIN[i + 1] });
      if (i > 0) actions.push({ kind: 'move', to: CHAIN[i - 1] });
      if (player.currentRoomId === CHAIN[CHAIN.length - 1]) actions.push({ kind: 'move', to: 'home_base' });
      if (player.currentRoomId === 'home_base' && player.scrap >= 10) actions.push({ kind: 'craft' });
      return actions;
    },
    act(a: ScrapAction): void {
      if (a.kind === 'move') {
        player = call(session, 'move_player', data, player, a.to)[0] as Player;
        run = applyMove(run, rooms, a.to);
        return;
      }
      if (a.kind === 'craft') {
        player = call(session, 'craft', data, player, rooms.home_base, 'beatStick', 1)[0] as Player;
        return;
      }
      const roll = Math.floor(rnd() * 20) + 1;
      const reward = 3 + Math.floor(rnd() * 6);
      const res = call(session, 'resolve_fight', data, player, rooms[player.currentRoomId], roll, reward)[0] as { won: boolean; player: Player };
      player = res.player;
      run = applyFight(run, rooms, player.currentRoomId, res.won);
    },
    observe(): ScrapObs {
      const weapon = player.equipped.weapon;
      return { room: player.currentRoomId, hp: run.hp, scrap: player.scrap, hasWeapon: !!weapon && weapon.life !== 0, cleared: run.clearedRoomIds };
    },
    metrics(): Record<string, number> {
      return { hp: run.hp, scrap: player.scrap, cleared: run.clearedRoomIds.length };
    },
    fingerprint(): string {
      return JSON.stringify([player.currentRoomId, run.hp, player.scrap, run.clearedRoomIds.length, run.outcome]);
    },
  };
}

export function scrapcrawlPolicy(useCraft: boolean): Policy<ScrapObs, ScrapAction> {
  return (obs) => {
    const target = CHAIN.find(id => id !== 'home_base' && !obs.cleared.includes(id));
    const here = CHAIN.indexOf(obs.room);
    if (useCraft && obs.room === 'home_base' && !obs.hasWeapon && obs.scrap >= 10) {
      return { kind: 'craft' };
    }
    if (target !== undefined && here < CHAIN.indexOf(target)) {
      return { kind: 'move', to: CHAIN[here + 1] };
    }
    if (useCraft && obs.hp <= 4 && !obs.hasWeapon && obs.scrap >= 10) {
      const to = here === CHAIN.length - 1 ? 'home_base' : CHAIN[here - 1];
      return { kind: 'move', to };
    }
    return { kind: 'fight' };
  };
}
