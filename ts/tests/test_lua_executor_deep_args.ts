// new: ts/tests/test_lua_executor_deep_args.ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';

/**
 * Regression test: a Lua call with several arguments, one of them the whole game data table
 * (nested 7 levels deep for Dissonance), used to throw "Error: false" from lua_pushnumber
 * because the executor never reserved Lua stack space. In the game, that call is the one that
 * builds the reward screen after a won fight.
 */
describe('LuaExecutor with deeply nested arguments', () => {
  it('generate_fixed_reward accepts the real Dissonance data table as its sixth argument', () => {
    const session = loadGame('dissonance', 1);
    const data = session.files.data as Record<string, unknown>;
    const [slots] = call(session, 'generate_fixed_reward', 40, ['spark_none_sever'], [], [], 'basic', data, null) as Array<
      Array<{ kind: string }>
    >;
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(['heal', 'card', 'benefit', 'relic']).toContain(slot.kind);
    }
  });
});
