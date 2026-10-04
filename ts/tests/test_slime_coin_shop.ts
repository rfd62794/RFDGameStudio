// new: ts/tests/test_slime_coin_shop.ts
/**
 * Slime Coin shop. The screen's buttons are named pocket_boom / pocket_pull / pocket_echo /
 * hand_upgrade, but the Lua takes shop_purchase(item_type, item_id). Before this fix the pocket
 * buttons sent the button name as the type, so Lua answered "Unknown item type" every time and
 * the screen then wrote an undefined token count. These tests run the real Lua with tokens
 * granted through a `test_set_tokens` helper appended at load time (same trick as
 * test_slime_coin_exchange.ts).
 */
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { LuaExecutor } from '../src/engine/executor';
import type { GameSession } from '../src/engine/types';
import { SHOP_ITEMS, buyShopItem } from '../src/games/slime_coin/shopItems';

function sessionWithTokens(tokens: number): GameSession {
  const base = loadGame('slime_coin', 42);
  const executor = new LuaExecutor(
    base.files.logic + '\nfunction test_set_tokens(n) GAME_STATE.tokens = n end',
    42,
    base.files.engineSource,
  );
  const session: GameSession = { ...base, executor };
  call(session, 'init_game', {});
  call(session, 'test_set_tokens', tokens);
  return session;
}

const bound = (session: GameSession) => (fn: string, ...args: unknown[]) => call(session, fn, ...args)[0];

describe('buyShopItem with a stubbed Lua', () => {
  it('sends pocket coins as (pocket_coin, coin id) and hand upgrades as (hand_upgrade)', () => {
    const calls: unknown[][] = [];
    const stub = (fn: string, ...args: unknown[]) => {
      calls.push([fn, ...args]);
      return { success: true, tokens: 5 };
    };
    buyShopItem(stub, 'pocket_pull');
    buyShopItem(stub, 'hand_upgrade');
    expect(calls).toEqual([
      ['shop_purchase', 'pocket_coin', 'pull'],
      ['shop_purchase', 'hand_upgrade'],
    ]);
  });

  it('reports success only when Lua says so, and passes the new numbers through', () => {
    const ok = buyShopItem(() => ({ success: true, tokens: 7, pocket_coins: { boom: 2 }, max_hand_in: 12 }), 'pocket_boom');
    expect(ok).toEqual({ ok: true, tokens: 7, pocketCoins: { boom: 2 }, maxHandIn: 12 });
    expect(buyShopItem(() => ({ error: 'Insufficient tokens' }), 'pocket_boom')).toEqual({ ok: false, error: 'Insufficient tokens' });
    expect(buyShopItem(() => null, 'pocket_boom')).toEqual({ ok: false, error: 'Purchase failed' });
    expect(buyShopItem(() => ({ success: true }), 'pocket_boom').ok).toBe(false);
    expect(buyShopItem(() => ({ success: true, tokens: 1 }), 'nope')).toEqual({ ok: false, error: 'Unknown item' });
  });
});

describe('the shop against the real Lua', () => {
  it('no shop button is answered with "Unknown item type"', () => {
    const session = sessionWithTokens(0);
    for (const item of SHOP_ITEMS) {
      expect(buyShopItem(bound(session), item.id)).toEqual({ ok: false, error: 'Insufficient tokens' });
    }
  });

  it('each button costs what its label says: refused one token short, bought at the exact price', () => {
    for (const item of SHOP_ITEMS) {
      const short = sessionWithTokens(item.cost - 1);
      expect(buyShopItem(bound(short), item.id).ok, `${item.id} one short`).toBe(false);
      const exact = sessionWithTokens(item.cost);
      const result = buyShopItem(bound(exact), item.id);
      expect(result.ok, `${item.id} exact`).toBe(true);
      if (result.ok) expect(result.tokens).toBe(0);
    }
  });

  it('a pocket coin purchase adds one coin of that type', () => {
    const session = sessionWithTokens(30);
    const result = buyShopItem(bound(session), 'pocket_boom');
    expect(result.ok && result.pocketCoins?.boom).toBe(2);
    expect(result.ok && result.tokens).toBe(20);
  });
});
