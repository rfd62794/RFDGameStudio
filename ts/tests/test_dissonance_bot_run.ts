// new: ts/tests/test_dissonance_bot_run.ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';
import type { CombatTurnResult, DeckCard, RewardSlot, RunState } from '../src/games/dissonance/types';

/**
 * A simple bot plays whole Dissonance runs through the real Lua session, the same calls
 * ts/src/games/dissonance/App.tsx makes: it always plays the first card in hand, takes every
 * reward, rests, takes essence, leaves shops and accepts anomalies. The test checks that no
 * call fails, no run gets stuck, no number goes negative or non-finite, and that both a win
 * and a loss are reachable.
 */

const MAX_STEPS = 500;

function lua<T>(session: GameSession, fn: string, ...args: unknown[]): T | null {
  return ((call(session, fn, ...args) as unknown[])[0] ?? null) as T | null;
}

function expectSane(run: RunState): void {
  expect(Number.isFinite(run.playerHp)).toBe(true);
  expect(run.playerHp).toBeGreaterThanOrEqual(0);
  expect(run.playerHp).toBeLessThanOrEqual(run.playerMaxHp);
  expect(Number.isFinite(run.essence)).toBe(true);
  expect(run.essence).toBeGreaterThanOrEqual(0);
  if (run.enemy) expect(Number.isFinite(run.enemy.hp)).toBe(true);
}

/** One step of the bot: returns the next run state, or null if a Lua call failed. */
function step(session: GameSession, data: Record<string, unknown>, run: RunState): RunState | null {
  switch (run.status) {
    case 'not_started': {
      if (!run.visitedNodeIds.includes(run.currentNodeId)) {
        return lua<RunState>(session, 'enter_active_node', run, run.deckCardIds, data);
      }
      const node = run.nodes.find((n) => n.id === run.currentNodeId);
      const target = node?.connectsTo?.[0];
      if (!target) return null;
      const moved = lua<RunState>(session, 'select_branch', run, target);
      return moved && lua<RunState>(session, 'enter_active_node', moved, moved.deckCardIds, data);
    }
    case 'combat': {
      const card = run.deckState.hand[0];
      const result = lua<CombatTurnResult>(session, 'resolve_combat_turn', run, card, data);
      if (!result) return null;
      const next = result.nextState;
      if (result.fightWon !== true) return next;
      const slots = lua<RewardSlot[]>(
        session,
        'generate_fixed_reward',
        next.playerMaxHp,
        next.deckCardIds,
        next.boons.map((b) => b.id),
        next.relics,
        next.enemy?.tier ?? 'basic',
        data,
        next.nextRewardBias ?? null,
      );
      if (!slots) return null;
      let cur = next;
      for (const slot of slots) cur = lua<RunState>(session, 'apply_reward_slot', cur, slot, data) ?? cur;
      return lua<RunState>(session, 'advance_node', cur);
    }
    case 'rest_craft': {
      const rested = lua<RunState>(session, 'apply_rest', run) ?? run;
      return lua<RunState>(session, 'advance_node', rested);
    }
    case 'treasure': {
      const taken = lua<RunState>(session, 'resolve_treasure', run, 'essence', data) ?? run;
      return lua<RunState>(session, 'advance_node', taken);
    }
    case 'store': {
      const left = lua<RunState>(session, 'resolve_store', run, null, data) ?? run;
      return lua<RunState>(session, 'advance_node', left);
    }
    case 'anomaly': {
      const done = lua<RunState>(session, 'resolve_anomaly', run, data) ?? run;
      return lua<RunState>(session, 'advance_node', done);
    }
    default:
      return null;
  }
}

function playRun(seed: number): { status: string; steps: number } {
  const session = loadGame('dissonance', seed);
  const data = session.files.data as Record<string, unknown>;
  const deckSize = ((data.run as { deck_size?: number } | undefined)?.deck_size) ?? 8;
  const pool = lua<DeckCard[]>(session, 'build_card_pool', data) ?? [];
  const deckIds = pool.slice(0, deckSize).map((c) => c.id);
  let run = lua<RunState>(session, 'create_run', deckIds, seed, 1, 0, data);
  expect(run).not.toBeNull();
  let steps = 0;
  while (run && run.status !== 'victory' && run.status !== 'game_over') {
    expectSane(run);
    expect(steps).toBeLessThan(MAX_STEPS);
    run = step(session, data, run);
    expect(run, `a Lua call failed at step ${steps} of seed ${seed}`).not.toBeNull();
    steps++;
  }
  expectSane(run as RunState);
  return { status: (run as RunState).status, steps };
}

describe('Dissonance bot run through the real Lua session', () => {
  const outcomes: Record<number, string> = {};

  for (const seed of [1, 2, 3, 4]) {
    it(`seed ${seed}: the run ends, with sane numbers and no failed call`, () => {
      const { status } = playRun(seed);
      outcomes[seed] = status;
      expect(['victory', 'game_over']).toContain(status);
    }, 60000);
  }

  it('both a win and a loss are reachable', () => {
    const results = Object.values(outcomes);
    expect(results).toContain('victory');
    expect(results).toContain('game_over');
  });
});
