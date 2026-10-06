import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';
import type { CardId, WireRustGameState } from '../src/games/wire_rust/types';
import {
  GATE_ROOM,
  GOAL_ROOM,
  applyMove,
  applyPlayCard,
  canEnterRoom,
  newRun,
  rollD20,
  runStatus,
} from '../src/games/wire_rust/run';

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const COMBAT_MOD: Record<string, number> = { copper_rod: 2, zinc_plate: 1, iron_block: 3, lead_solder: 0 };
const MAX_STEPS = 400;
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

/** best: strongest card, takes the exit once the gate is won. grinder: weakest card, never leaves the Reactor Core. */
type Strategy = 'best' | 'grinder';

function pickCard(hand: string[], strategy: Strategy): CardId {
  const sorted = [...hand].sort((a, b) => COMBAT_MOD[b] - COMBAT_MOD[a]);
  return (strategy === 'best' ? sorted[0] : sorted[sorted.length - 1]) as CardId;
}

/** Plays one seeded run to the end and returns the final state plus the number of steps taken. */
function playRun(seed: number, strategy: Strategy): { state: WireRustGameState; steps: number } {
  const session: GameSession = loadGame('wire_rust', seed);
  let state = newRun(session, seed);
  let steps = 0;
  while (runStatus(state) === 'playing' && steps < MAX_STEPS) {
    steps++;
    const here = state.currentRoom.id;
    const gateCleared = state.cleared.includes(GATE_ROOM);
    if (gateCleared && strategy === 'best') {
      state = applyMove(session, state, GOAL_ROOM);
      continue;
    }
    if (here === 'junk_heap') {
      state = applyMove(session, state, 'rust_pit');
    } else if (here === 'rust_pit') {
      state = applyMove(session, state, GATE_ROOM);
    } else if (here === GATE_ROOM) {
      if (state.player.hand.length === 0) {
        state = applyMove(session, state, 'rust_pit');
      } else {
        state = applyPlayCard(session, state, pickCard(state.player.hand, strategy)).state;
      }
    }
  }
  return { state, steps };
}

describe('Wire & Rust seeded D20', () => {
  it('same seed and turn give the same roll, always 1 to 20', () => {
    expect(rollD20(7, 3)).toBe(rollD20(7, 3));
    for (let t = 0; t < 200; t++) {
      const r = rollD20(99, t);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    }
    const distinct = new Set(Array.from({ length: 50 }, (_, t) => rollD20(5, t)));
    expect(distinct.size).toBeGreaterThan(5);
  });
});

describe('Wire & Rust run rules', () => {
  it('locks the Control Room until the Reactor Core is won', () => {
    expect(canEnterRoom([], GOAL_ROOM)).toBe(false);
    expect(canEnterRoom(['rust_pit'], GOAL_ROOM)).toBe(false);
    expect(canEnterRoom([GATE_ROOM], GOAL_ROOM)).toBe(true);
    expect(canEnterRoom([], 'rust_pit')).toBe(true);
  });

  it('applyMove refuses a locked room and returns the same state', () => {
    const session = loadGame('wire_rust', 1);
    const state = newRun(session, 1);
    expect(applyMove(session, state, GOAL_ROOM)).toBe(state);
  });

  it('reports won in the Control Room and lost at 0 HP', () => {
    const session = loadGame('wire_rust', 1);
    const state = newRun(session, 1);
    expect(runStatus(state)).toBe('playing');
    expect(runStatus({ player: { ...state.player, current_room_id: GOAL_ROOM } })).toBe('won');
    expect(runStatus({ player: { ...state.player, hp: 0 } })).toBe('lost');
  });
});

describe('Wire & Rust headless runs (40 seeds)', () => {
  it('every run ends, never goes negative, and both a win and a loss are reachable', () => {
    let wins = 0;
    let losses = 0;
    for (const seed of SEEDS) {
      for (const strategy of ['best', 'grinder'] as Strategy[]) {
        const { state, steps } = playRun(seed, strategy);
        expect(steps, `seed ${seed} ${strategy} did not end`).toBeLessThan(MAX_STEPS);
        expect(state.player.hp).toBeGreaterThanOrEqual(0);
        expect(state.player.scrap).toBeGreaterThanOrEqual(0);
        const status = runStatus(state);
        expect(status).not.toBe('playing');
        if (strategy === 'best') expect(status, `seed ${seed} best`).toBe('won');
        else expect(status, `seed ${seed} grinder`).toBe('lost');
        if (status === 'won') wins++;
        else losses++;
      }
    }
    expect(wins).toBe(SEEDS.length);
    expect(losses).toBe(SEEDS.length);
  });

  it('the same seed and strategy replays identically', () => {
    const a = playRun(11, 'best');
    const b = playRun(11, 'best');
    expect(b.state.combatHistory).toEqual(a.state.combatHistory);
    expect(b.state.player.hp).toBe(a.state.player.hp);
  });
});

describe('Wire & Rust Tier A wiring', () => {
  const app = read('src/games/wire_rust/App.tsx');

  it('has a Restart button that returns to the title, and a win screen', () => {
    expect(app).toContain('label="Restart"');
    expect(app).toMatch(/handleRestart = useCallback\(\(\) => \{\s*handleReset\(\);\s*setShowTitle\(true\);/);
    expect(app).toContain('SYSTEM ONLINE');
    expect(app).toContain('label="Play Again"');
  });

  it('no longer rolls with Math.random in the app', () => {
    expect(app).not.toContain('Math.random');
  });

  it('has the standalone files and the build script', () => {
    expect(existsSync(resolve(root, 'vite.wire_rust.config.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/wire_rust/entry.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/wire_rust/index.html'))).toBe(true);
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    expect(scripts['build:wire_rust']).toBe('vite build --config vite.wire_rust.config.ts');
  });
});
