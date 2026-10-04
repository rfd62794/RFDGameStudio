/**
 * test_slime_coin_exchange.ts — Slime Coin exchange() tests.
 *
 * Guards the mid-round Exchange action in games/slime_coin/logic.lua:
 * spending tokens buys 5 more shots, the cost grows x1.5 per use
 * (5, 7, 11), a fourth exchange is refused, and an exchange the player
 * cannot afford is refused. Regression coverage for the math.pow -> ^
 * fix on logic.lua line 319 (math.pow is nil under Lua 5.3, which made
 * exchange() raise and the in-game button silently do nothing).
 *
 * Tokens start at 0 and init_game resets them (GAME_STATE.tokens = 0),
 * and earning tokens by playing coins into the vat is not deterministic
 * enough for a unit test. So each session is built with a `test_set_tokens`
 * Lua function appended to the game source at load time, granting tokens
 * after init_game. `call` returns an ARRAY of Lua return values; the
 * first element is the result table.
 *
 * <!-- new: ts/tests/test_slime_coin_exchange.ts -->
 */

import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { LuaExecutor } from '../src/engine/executor';
import type { GameSession } from '../src/engine/types';

function sessionWithTokens(tokens: number): GameSession {
  const base = loadGame('slime_coin', 42);
  const executor = new LuaExecutor(
    base.files.logic + '\nfunction test_set_tokens(n) GAME_STATE.tokens = n end',
    42,
    base.files.engineSource,
  );
  const session: GameSession = { ...base, executor };
  const [init] = call(session, 'init_game', {}) as Array<Record<string, unknown>>;
  expect(init.success).toBe(true);
  call(session, 'test_set_tokens', tokens);
  return session;
}

function summary(session: GameSession): Record<string, unknown> {
  const [s] = call(session, 'get_state_summary') as Array<Record<string, unknown>>;
  return s;
}

describe('Slime Coin exchange', () => {
  it('a. three exchanges succeed with costs 5, 7, 11 and tokens 95, 88, 77', () => {
    const session = sessionWithTokens(100);
    const expected = [
      { cost: 5, exchanges_used: 1, tokens: 95 },
      { cost: 7, exchanges_used: 2, tokens: 88 },
      { cost: 11, exchanges_used: 3, tokens: 77 },
    ];
    for (const exp of expected) {
      const [result] = call(session, 'exchange') as Array<Record<string, unknown>>;
      expect(result.success).toBe(true);
      expect(result.cost).toBe(exp.cost);
      expect(result.shots_added).toBe(5);
      expect(result.exchanges_used).toBe(exp.exchanges_used);
      expect(result.tokens).toBe(exp.tokens);
    }
  });

  it('b. each exchange adds 5 to hand_in (10 -> 15 -> 20 -> 25)', () => {
    const session = sessionWithTokens(100);
    expect(summary(session).hand_in).toBe(10);
    for (const expected of [15, 20, 25]) {
      const [result] = call(session, 'exchange') as Array<Record<string, unknown>>;
      expect(result.hand_in).toBe(expected);
    }
  });

  it('c. a fourth exchange is refused and changes nothing', () => {
    const session = sessionWithTokens(100);
    call(session, 'exchange');
    call(session, 'exchange');
    call(session, 'exchange');
    const before = summary(session);
    const [fourth] = call(session, 'exchange') as Array<Record<string, unknown>>;
    expect(fourth.error).toBe('Max exchanges reached this round');
    expect(summary(session).hand_in).toBe(before.hand_in);
  });

  it('d. insufficient tokens are refused; exact cost succeeds', () => {
    const poor = sessionWithTokens(4);
    const [denied] = call(poor, 'exchange') as Array<Record<string, unknown>>;
    expect(denied.error).toBe('Insufficient tokens');
    call(poor, 'test_set_tokens', 100);
    const [next] = call(poor, 'exchange') as Array<Record<string, unknown>>;
    expect(next.success).toBe(true);
    expect(next.exchanges_used).toBe(1);

    const exact = sessionWithTokens(5);
    const [result] = call(exact, 'exchange') as Array<Record<string, unknown>>;
    expect(result.success).toBe(true);
    expect(result.tokens).toBe(0);
  });

  it('e. reported cost matches floor(5 * 1.5^n) for n = 0..2', () => {
    const session = sessionWithTokens(100);
    for (let n = 0; n <= 2; n++) {
      const [result] = call(session, 'exchange') as Array<Record<string, unknown>>;
      expect(result.cost).toBe(Math.floor(5 * Math.pow(1.5, n)));
    }
  });
});
