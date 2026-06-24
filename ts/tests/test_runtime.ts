import { describe, it, expect, vi } from 'vitest';
import { RuntimeError } from '../src/engine/types';

vi.mock('fengari-web', () => {
  const mod = {
    lua: {
      LUA_OK: 0, LUA_TNIL: 0, LUA_TBOOLEAN: 1, LUA_TNUMBER: 3,
      LUA_TSTRING: 4, LUA_TTABLE: 5, LUA_TFUNCTION: 6,
      lua_type: vi.fn(() => 6),
      lua_gettop: vi.fn(() => 1),
      lua_pop: vi.fn(),
      lua_pushnil: vi.fn(), lua_pushboolean: vi.fn(),
      lua_pushnumber: vi.fn(), lua_pushstring: vi.fn(),
      lua_newtable: vi.fn(), lua_settable: vi.fn(),
      lua_getglobal: vi.fn(),
      lua_pcall: vi.fn(() => 0),
      lua_next: vi.fn(() => 0),
      lua_toboolean: vi.fn(() => 0),
      lua_tonumber: vi.fn(() => 5),
      lua_tojsstring: vi.fn(() => ''),
    },
    lauxlib: {
      luaL_newstate: vi.fn(() => ({})),
      luaL_dostring: vi.fn(() => 0),
    },
    lualib: { luaL_openlibs: vi.fn() },
  };
  return { ...mod, default: mod };
});

const MOCK_DATA = `
game:
  id: horse_racing
  name: Derby Sim
  version: "1.2"
  studio: RFDGameStudio
horse:
  fields:
    stats:
      speed: {min: 0, max: 100}
    name: string
`;
const MOCK_UI = `
layout:
  tabs:
    - id: stable
      label: Stable
`;
const MOCK_LOGIC = `function clamp(v,lo,hi) return v end`;

vi.mock('../games/horse_racing/data.yaml?raw', () => ({ default: MOCK_DATA }));
vi.mock('../games/horse_racing/ui.yaml?raw', () => ({ default: MOCK_UI }));
vi.mock('../games/horse_racing/logic.lua?raw', () => ({ default: MOCK_LOGIC }));

import { loadGame, call, getSchema } from '../src/engine/runtime';
import { lua } from 'fengari-web';

describe('runtime', () => {
  it('test_runtime_load_game_returns_session', () => {
    const session = loadGame('horse_racing', 42);
    expect(session).toHaveProperty('gameId', 'horse_racing');
    expect(session).toHaveProperty('files');
    expect(session.files).toHaveProperty('data');
    expect(session.files).toHaveProperty('ui');
    expect(session.files).toHaveProperty('logic');
  });

  it('test_runtime_call_delegates_to_executor', () => {
    (lua.lua_type as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(lua.LUA_TFUNCTION)
      .mockReturnValueOnce(lua.LUA_TNUMBER);
    (lua.lua_tonumber as ReturnType<typeof vi.fn>).mockReturnValue(5);

    const session = loadGame('horse_racing', 42);
    const callSpy = vi.spyOn(session.executor, 'call').mockReturnValue(5);
    const result = call(session, 'clamp', 5, 0, 10);
    expect(callSpy).toHaveBeenCalledWith('clamp', 5, 0, 10);
    expect(result).toBe(5);
  });

  it('test_runtime_get_schema_returns_fields', () => {
    const session = loadGame('horse_racing', 42);
    const schema = getSchema(session, 'horse');
    expect(schema).toHaveProperty('stats');
  });

  it('test_runtime_get_schema_missing_throws', () => {
    const session = loadGame('horse_racing', 42);
    expect(() => getSchema(session, 'nonexistent_entity')).toThrow(RuntimeError);
  });
});
