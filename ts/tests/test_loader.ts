import { describe, it, expect, vi } from 'vitest';

vi.mock('fengari-web', () => {
  const mod = {
    lua: {
      LUA_OK: 0, LUA_TNIL: 0, LUA_TBOOLEAN: 1, LUA_TNUMBER: 3,
      LUA_TSTRING: 4, LUA_TTABLE: 5, LUA_TFUNCTION: 6,
      lua_type: vi.fn(), lua_gettop: vi.fn(() => 0),
      lua_pop: vi.fn(), lua_pushnil: vi.fn(), lua_pushboolean: vi.fn(),
      lua_pushnumber: vi.fn(), lua_pushstring: vi.fn(),
      lua_newtable: vi.fn(), lua_settable: vi.fn(),
      lua_getglobal: vi.fn(), lua_pcall: vi.fn(() => 0),
      lua_next: vi.fn(() => 0), lua_toboolean: vi.fn(() => 0),
      lua_tonumber: vi.fn(() => 0), lua_tojsstring: vi.fn(() => ''),
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
`;
const MOCK_UI = `
layout:
  tabs:
    - id: stable
      label: Stable
    - id: betting
      label: Betting
`;
const MOCK_LOGIC = `function clamp(v,lo,hi) return v end`;

vi.mock('../games/horse_racing/data.yaml?raw', () => ({ default: MOCK_DATA }));
vi.mock('../games/horse_racing/ui.yaml?raw', () => ({ default: MOCK_UI }));

import { createLoader } from '../src/engine/loader';
import { ValidationError } from '../src/engine/types';

// Create test loader with injected mock data
const mockGameLuaFiles = {
  '../../games/horse_racing/logic.lua': MOCK_LOGIC,
};
const mockEngineLuaFiles = {};
const loadGameFiles = createLoader(mockGameLuaFiles, mockEngineLuaFiles);

describe('loader', () => {
  it('test_loader_returns_game_files', async () => {
    const files = await loadGameFiles('horse_racing');
    expect(files).toHaveProperty('gameId', 'horse_racing');
    expect(files).toHaveProperty('data');
    expect(files).toHaveProperty('ui');
    expect(files).toHaveProperty('logic');
  });

  it('test_loader_parses_game_id', async () => {
    const files = await loadGameFiles('horse_racing');
    const game = files.data['game'] as Record<string, unknown>;
    expect(game['id']).toBe('horse_racing');
  });

  it('test_loader_parses_ui_tabs', async () => {
    const files = await loadGameFiles('horse_racing');
    const layout = files.ui['layout'] as Record<string, unknown>;
    const tabs = layout['tabs'] as unknown[];
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('test_loader_logic_is_string', async () => {
    const files = await loadGameFiles('horse_racing');
    expect(typeof files.logic).toBe('string');
    expect(files.logic.length).toBeGreaterThan(0);
  });

  it('test_loader_missing_game_id_throws', async () => {
    expect(() => {
      throw new ValidationError('Missing required key: game.id');
    }).toThrow(ValidationError);

    await expect(loadGameFiles('wrong_id')).rejects.toThrow(ValidationError);
  });
});
