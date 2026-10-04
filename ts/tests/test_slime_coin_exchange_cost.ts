/**
 * test_slime_coin_exchange_cost.ts — Slime Coin UI exchange-cost pin tests.
 *
 * Guards ts/src/games/slime_coin/utils/exchangeCost.ts, the pure helper the
 * Exchange button label uses to show the next exchange's cost. The Lua
 * exchange() (games/slime_coin/logic.lua) does not expose the next cost —
 * get_state_summary() carries exchanges_used only — so the UI computes it
 * with the same formula (floor(5 * 1.5^n)). These tests prove the helper
 * equals the cost the real Lua charges, so a change to either side fails
 * here instead of drifting silently.
 *
 * `sessionWithTokens` is copied verbatim from test_slime_coin_exchange.ts:
 * tokens start at 0, so a `test_set_tokens` Lua function is appended to the
 * game source at load time. `call` returns an ARRAY of Lua return values;
 * the first element is the result table.
 *
 * <!-- new: ts/tests/test_slime_coin_exchange_cost.ts -->
 */

import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { LuaExecutor } from '../src/engine/executor';
import type { GameSession } from '../src/engine/types';
import {
  exchangeCost,
  EXCHANGE_BASE_COST,
  EXCHANGE_COST_GROWTH,
} from '../src/games/slime_coin/utils/exchangeCost';

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

describe('Slime Coin exchangeCost helper', () => {
  it('a. helper equals the Lua cost for each of exchanges 0..2 (5, 7, 11)', () => {
    const session = sessionWithTokens(100);
    const luaCosts: number[] = [];
    for (let n = 0; n <= 2; n++) {
      const [result] = call(session, 'exchange') as Array<Record<string, unknown>>;
      expect(result.success).toBe(true);
      expect(exchangeCost(n)).toBe(result.cost);
      luaCosts.push(result.cost as number);
    }
    expect(luaCosts).toEqual([5, 7, 11]);
  });

  it('b. pure helper: exchangeCost(0..2) is 5, 7, 11; constants are 5 and 1.5', () => {
    expect(exchangeCost(0)).toBe(5);
    expect(exchangeCost(1)).toBe(7);
    expect(exchangeCost(2)).toBe(11);
    expect(EXCHANGE_BASE_COST).toBe(5);
    expect(EXCHANGE_COST_GROWTH).toBe(1.5);
  });
});
