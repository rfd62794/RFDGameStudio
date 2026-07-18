import { describe, it, expect } from 'vitest';
import { LuaExecutor } from '../src/engine/executor';

describe('Multi-Return Stack Arithmetic Proof', () => {
  it('test_three_value_return', () => {
    const luaSource = `
      function _test_multi()
        return 1, 2, 3
      end
    `;
    const executor = new LuaExecutor(luaSource, 42);
    const result = executor.call('_test_multi');
    expect(result).toEqual([1, 2, 3]);
  });

  it('test_two_value_return_with_error_string', () => {
    const luaSource = `
      function _test_error()
        return nil, "something went wrong"
      end
    `;
    const executor = new LuaExecutor(luaSource, 42);
    const result = executor.call('_test_error');
    expect(result).toEqual([null, 'something went wrong']);
  });

  it('test_single_value_return', () => {
    const luaSource = `
      function _test_single()
        return 42
      end
    `;
    const executor = new LuaExecutor(luaSource, 42);
    const result = executor.call('_test_single');
    expect(result).toEqual([42]);
  });

  it('test_zero_value_return', () => {
    const luaSource = `
      function _test_zero()
        return
      end
    `;
    const executor = new LuaExecutor(luaSource, 42);
    const result = executor.call('_test_zero');
    expect(result).toEqual([]);
  });

  it('test_multi_return_with_args', () => {
    const luaSource = `
      function _test_with_args(a, b)
        return a + b, a * b, a - b
      end
    `;
    const executor = new LuaExecutor(luaSource, 42);
    const result = executor.call('_test_with_args', 3, 5);
    expect(result).toEqual([8, 15, -2]);
  });
});
