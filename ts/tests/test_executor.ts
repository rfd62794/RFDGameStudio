import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LuaError } from '../src/engine/types';

vi.mock('fengari-web', () => {
  const state = {};
  const mod = {
    lua: {
      LUA_OK: 0, LUA_TNIL: 0, LUA_TBOOLEAN: 1, LUA_TNUMBER: 3,
      LUA_TSTRING: 4, LUA_TTABLE: 5, LUA_TFUNCTION: 6,
      lua_type: vi.fn(),
      lua_gettop: vi.fn(() => 1),
      lua_pop: vi.fn(),
      lua_pushnil: vi.fn(),
      lua_pushboolean: vi.fn(),
      lua_pushnumber: vi.fn(),
      lua_pushstring: vi.fn(),
      lua_newtable: vi.fn(),
      lua_settable: vi.fn(),
      lua_getglobal: vi.fn(),
      lua_pcall: vi.fn(() => 0),
      lua_next: vi.fn(() => 0),
      lua_toboolean: vi.fn(() => 0),
      lua_tonumber: vi.fn(() => 5),
      lua_tostring: vi.fn(() => 'mocked'),
      lua_tojsstring: vi.fn(() => 'mocked'),
    },
    lauxlib: {
      luaL_newstate: vi.fn(() => state),
      luaL_dostring: vi.fn(() => 0),
    },
    lualib: { luaL_openlibs: vi.fn() },
  };
  return { ...mod, default: mod };
});

import { lua } from 'fengari-web';
import { LuaExecutor } from '../src/engine/executor';

describe('executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (lua.lua_type as ReturnType<typeof vi.fn>).mockReturnValue(lua.LUA_TFUNCTION);
    (lua.lua_pcall as ReturnType<typeof vi.fn>).mockReturnValue(lua.LUA_OK);
    (lua.lua_tonumber as ReturnType<typeof vi.fn>).mockReturnValue(5);
  });

  it('test_executor_call_returns_value', () => {
    (lua.lua_type as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(lua.LUA_TFUNCTION)
      .mockReturnValueOnce(lua.LUA_TNUMBER);
    (lua.lua_tonumber as ReturnType<typeof vi.fn>).mockReturnValue(5);

    const executor = new LuaExecutor('-- lua', 42);
    const result = executor.call('clamp', 5, 0, 10);
    expect(result).toBe(5);
  });

  it('test_executor_missing_function_throws', () => {
    (lua.lua_type as ReturnType<typeof vi.fn>).mockReturnValue(lua.LUA_TNIL);

    const executor = new LuaExecutor('-- lua', 42);
    expect(() => executor.call('nonexistent_fn')).toThrow(LuaError);
    expect(() => executor.call('nonexistent_fn')).toThrow('Lua function not found');
  });

  it('test_executor_lua_error_throws', () => {
    (lua.lua_type as ReturnType<typeof vi.fn>).mockReturnValue(lua.LUA_TFUNCTION);
    (lua.lua_pcall as ReturnType<typeof vi.fn>).mockReturnValue(1);
    (lua.lua_tojsstring as ReturnType<typeof vi.fn>).mockReturnValue('attempt to call nil');

    const executor = new LuaExecutor('-- lua', 42);
    expect(() => executor.call('bad_fn')).toThrow(LuaError);
    expect(() => executor.call('bad_fn')).toThrow('Lua error in bad_fn');
  });

  it('test_executor_pulls_boolean_false', () => {
    (lua.lua_type as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(lua.LUA_TFUNCTION)
      .mockReturnValueOnce(lua.LUA_TBOOLEAN);
    (lua.lua_toboolean as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const executor = new LuaExecutor('-- lua', 42);
    const result = executor.call('return_false');
    expect(result).toBe(false);
  });

  it('test_executor_pulls_table_with_booleans', () => {
    (lua.lua_type as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(lua.LUA_TFUNCTION)
      .mockReturnValueOnce(lua.LUA_TTABLE);
    // Simulate a single table iteration returning key='z', value=false, then done.
    let iteration = 0;
    (lua.lua_next as ReturnType<typeof vi.fn>).mockImplementation(() => {
      iteration += 1;
      if (iteration === 1) {
        // key
        (lua.lua_type as ReturnType<typeof vi.fn>).mockReturnValueOnce(lua.LUA_TSTRING);
        // value
        (lua.lua_type as ReturnType<typeof vi.fn>).mockReturnValueOnce(lua.LUA_TBOOLEAN);
        (lua.lua_tostring as ReturnType<typeof vi.fn>).mockReturnValue('z');
        (lua.lua_toboolean as ReturnType<typeof vi.fn>).mockReturnValue(false);
        return 1;
      }
      return 0;
    });

    const executor = new LuaExecutor('-- lua', 42);
    const result = executor.call('return_table');
    expect(result).toEqual({ z: false });
  });
});
