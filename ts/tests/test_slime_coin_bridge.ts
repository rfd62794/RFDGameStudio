/**
 * test_slime_coin_bridge.ts — Slime Coin Lua/TS bridge tests.
 *
 * Exercises the real Lua (games/slime_coin/logic.lua, via fengari) through
 * the same `call` (`src/engine/runtime.ts`) that the game's `useLuaCall`
 * hook wraps. `call` returns an ARRAY of Lua return values; the first
 * element is the result table. Each test loads a FRESH session and re-runs
 * `init_game` — the Lua state is global per session.
 *
 * `exchange()` is covered in ts/tests/test_slime_coin_exchange.ts (and the UI cost
 * helper in ts/tests/test_slime_coin_exchange_cost.ts), not here.
 *
 * <!-- new: ts/tests/test_slime_coin_bridge.ts -->
 */

import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';

const INPUT = { fire: false, side: 'right' };

function freshSession(): GameSession {
  const session = loadGame('slime_coin', 42);
  const [init] = call(session, 'init_game', {}) as Array<Record<string, unknown>>;
  expect(init.success).toBe(true);
  return session;
}

function summary(session: GameSession): Record<string, unknown> {
  const [s] = call(session, 'get_state_summary') as Array<Record<string, unknown>>;
  return s;
}

describe('Slime Coin Lua/TS bridge', () => {
  it('a. init_game + get_state_summary on a fresh session', () => {
    const session = freshSession();
    const s = summary(session);
    expect(s.phase).toBe('playing');
    expect(s.round).toBe(1);
    expect(s.total_rounds).toBe(15);
    expect(s.score).toBe(0);
    expect(s.target_score).toBe(100);
    expect(s.score_rate).toBe(1);
    expect(s.hand_in).toBe(10);
    expect(s.shelf_coin_count).toBe(80);
    expect(s.floor_coin_count).toBe(0);
    expect(s.owned_chips).toEqual([]);
    expect(s.combo_count).toBe(0);
  });

  it('b. end_round offers 3 cards and parks in card_select', () => {
    const session = freshSession();
    const [result] = call(session, 'end_round') as Array<Record<string, unknown>>;
    expect(result.round).toBe(1);
    expect(result.score).toBe(0);
    expect(result.target).toBe(100);
    expect(result.target_met).toBe(false);
    const offered = result.offered_cards as Array<Record<string, unknown>>;
    expect(offered).toHaveLength(3);
    for (const card of offered) {
      expect(typeof card.id).toBe('string');
    }
    expect(summary(session).phase).toBe('card_select');
  });

  it('c. tick_game stays parked while in card_select', () => {
    const session = freshSession();
    call(session, 'end_round');
    const [tick] = call(session, 'tick_game', 0.016, INPUT) as Array<Record<string, unknown>>;
    expect(tick.phase).toBe('card_select');
  });

  it('d. select_card advances to round 2 with the chip owned', () => {
    const session = freshSession();
    call(session, 'end_round');
    const [sel] = call(session, 'select_card', 'heavy_impact') as Array<Record<string, unknown>>;
    expect(sel.card_id).toBe('heavy_impact');
    expect(sel.next_round).toBe(2);
    const s = summary(session);
    expect(s.phase).toBe('playing');
    expect(s.round).toBe(2);
    expect(s.target_score).toBe(150);
    expect(s.owned_chips).toEqual(['heavy_impact']);
    expect(s.shelf_coin_count).toBe(0);
  });

  it('e. target score grows x1.5 per round', () => {
    const session = freshSession();
    call(session, 'end_round');
    call(session, 'select_card', 'heavy_impact');
    call(session, 'end_round');
    call(session, 'select_card', 'heavy_impact');
    const s = summary(session);
    expect(s.round).toBe(3);
    expect(s.target_score).toBe(225);
  });

  it('f. 15 end_round/select_card cycles reach run_end', () => {
    const session = freshSession();
    for (let i = 0; i < 15; i++) {
      call(session, 'end_round');
      call(session, 'select_card', 'heavy_impact');
    }
    const s = summary(session);
    expect(s.phase).toBe('run_end');
    expect(s.round).toBe(15);
    expect(s.owned_chips as unknown[]).toHaveLength(15);
    const [tick] = call(session, 'tick_game', 0.016, INPUT) as Array<Record<string, unknown>>;
    expect(tick.phase).toBe('run_end');
  });

  it('g. playing tick returns render state for round 1', () => {
    const session = freshSession();
    const [tick] = call(session, 'tick_game', 0.016, INPUT) as Array<Record<string, unknown>>;
    expect(tick.phase).toBe('playing');
    expect(tick.round).toBe(1);
    expect(tick.hand_in).toBe(10);
  });

  it('h. shop_purchase error paths', () => {
    const session = freshSession();
    const [insufficient] = call(session, 'shop_purchase', 'hand_upgrade') as Array<Record<string, unknown>>;
    expect(insufficient.error).toBe('Insufficient tokens');
    const [unknown] = call(session, 'shop_purchase', 'nonsense') as Array<Record<string, unknown>>;
    expect(unknown.error).toBe('Unknown item type');
  });
});
