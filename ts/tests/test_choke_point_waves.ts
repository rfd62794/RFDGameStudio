// new: ts/tests/test_choke_point_waves.ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { isVictory } from '../src/games/choke_point/outcome';
import type { ChokePointGameState } from '../src/games/choke_point/types';

type S = ChokePointGameState;
const MAX_TURNS = 80;

function newGame() {
  const session = loadGame('choke_point');
  const data = session.files.data as Record<string, unknown>;
  const state = call(session, 'init_game', data)[0] as S;
  return { session, data, state };
}

/** Plays until victory, core breach or MAX_TURNS. `strategy` may place towers before each commit. */
function playOut(strategy: (s: S, place: (type: string, x: number, y: number) => void) => void) {
  const g = newGame();
  let state = g.state;
  const seenWaves = new Set<number>([state.wave]);
  const log: string[] = [];
  let turns = 0;
  const place = (type: string, x: number, y: number) => {
    state = call(g.session, 'place_tower', g.data, state, type, x, y)[0] as S;
  };
  while (turns < MAX_TURNS && state.core_hp > 0 && !isVictory(state)) {
    strategy(state, place);
    state = call(g.session, 'commit_turn', g.data, state)[0] as S;
    seenWaves.add(state.wave);
    log.push(...(state.history ?? []));
    turns++;
  }
  return { state, turns, seenWaves, log };
}

describe('choke_point waves are solvable', () => {
  it('a baseline strategy (one Autocannon at x=2 in every enemy row) wins and passes through every wave', () => {
    const r = playOut((s, place) => {
      for (const y of new Set(s.enemies.map(e => e.y))) {
        const covered = s.towers.some(t => t.type === 'turret' && t.y === y);
        if (!covered && s.energy >= 5) place('turret', 2, y);
      }
    });
    expect(isVictory(r.state)).toBe(true);
    expect(r.state.core_hp).toBeGreaterThan(0);
    expect(r.turns).toBeLessThan(MAX_TURNS);
    expect([...r.seenWaves].sort()).toEqual([1, 2]);
  });

  it('a loss is reachable: doing nothing lets the core fall', () => {
    const r = playOut(() => {});
    expect(r.state.core_hp).toBe(0);
    expect(r.turns).toBeLessThan(MAX_TURNS);
  });

  it('a wave that is not shot down cannot stall the game: leakers hurt the core', () => {
    const r = playOut(() => {});
    expect(r.log.some(l => l.includes('slipped past'))).toBe(true);
    expect(r.state.enemies.every(e => e.x >= 1)).toBe(true);
  });

  it('wave-clear log lines show whole numbers', () => {
    const r = playOut(() => {});
    const cleared = r.log.filter(l => l.includes('cleared!'));
    expect(cleared.length).toBeGreaterThan(0);
    expect(cleared.join(' ')).toBe('Wave 1 cleared! Incoming Wave 2!');
  });
});
