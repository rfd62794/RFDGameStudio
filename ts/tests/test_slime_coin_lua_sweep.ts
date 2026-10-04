// new: ts/tests/test_slime_coin_lua_sweep.ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';

/**
 * Sweep: every Lua entry point the game uses, called at least once under the shipped
 * (fengari, Lua 5.3) runtime. This is the check that would have caught the `math.pow` bug
 * (nil in Lua 5.3) in exchange(). Physics runs are short on purpose: one tick costs about
 * 0.15 seconds in this runtime.
 */

type Row = Record<string, unknown>;

function lua(session: GameSession, fn: string, ...args: unknown[]): Row {
  return (call(session, fn, ...args) as Row[])[0];
}

function finiteNumbers(row: Row): void {
  for (const key of ['score', 'target_score', 'tokens', 'hand_in']) {
    if (typeof row[key] === 'number') expect(Number.isFinite(row[key])).toBe(true);
  }
}

describe('Slime Coin Lua entry-point sweep', () => {
  it('firing and physics: basic coins, then each pocket coin, then the round ends', () => {
    const session = loadGame('slime_coin', 11);
    expect(lua(session, 'init_game', {}).success).toBe(true);
    let last: Row = {};
    for (let i = 0; i < 40; i++) {
      last = lua(session, 'tick_game', 0.016, { fire: i % 4 === 0, side: i % 8 === 0 ? 'left' : 'right' });
      expect(last.phase).toBe('playing');
      finiteNumbers(last);
    }
    for (const pocket of ['boom', 'pull', 'echo', 'giga']) {
      last = lua(session, 'tick_game', 0.016, { fire: true, side: 'right', pocket_coin_type: pocket });
      finiteNumbers(last);
    }
    for (let i = 0; i < 20; i++) {
      last = lua(session, 'tick_game', 0.016, {});
      finiteNumbers(last);
    }
    expect(last.score as number).toBeGreaterThanOrEqual(0);
    const ended = lua(session, 'end_round');
    expect((ended.offered_cards as unknown[]).length).toBe(3);
    expect(lua(session, 'get_state_summary').phase).toBe('card_select');
  }, 120000);

  it('every chip card can be selected, and the run reaches its end', () => {
    const session = loadGame('slime_coin', 12);
    lua(session, 'init_game', {});
    const cards = ['zombie_slime', 'crystal_burst', 'heavy_impact', 'bubble_chain', 'tar_cluster', 'iron_path'];
    for (const id of cards) {
      lua(session, 'end_round');
      expect(lua(session, 'select_card', id).card_id).toBe(id);
    }
    expect(lua(session, 'get_state_summary').owned_chips).toEqual(cards);
  });

  it('exchange and shop_purchase answer in every branch without a Lua error', () => {
    const session = loadGame('slime_coin', 13);
    lua(session, 'init_game', {});
    expect(lua(session, 'exchange').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'hand_upgrade').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'pocket_coin', 'boom').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'card', 'heavy_impact').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'nonsense').error).toBe('Unknown item type');
  });
});
