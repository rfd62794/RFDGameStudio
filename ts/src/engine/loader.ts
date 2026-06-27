import yaml from 'js-yaml';
import { GameFiles, ValidationError } from './types';

// Static YAML imports (still needed for data/ui/systems)
import hrDataRaw from '../../../games/horse_racing/data.yaml?raw';
import hrUiRaw from '../../../games/horse_racing/ui.yaml?raw';

import srDataRaw from '../../../games/slither_rogue/data.yaml?raw';
import srUiRaw from '../../../games/slither_rogue/ui.yaml?raw';
import srSystemsRaw from '../../../games/slither_rogue/systems.yaml?raw';

const GAME_ASSETS: Record<string, { data: string; ui: string; systems?: string }> = {
  horse_racing: { data: hrDataRaw, ui: hrUiRaw },
  slither_rogue: { data: srDataRaw, ui: srUiRaw, systems: srSystemsRaw },
};

// Auto-discover all game Lua files at build time
// Key format: '../../games/{game_id}/{file}.lua'
const GAME_LUA_FILES = import.meta.glob(
  '../../games/**/*.lua',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

// Auto-discover all engine Lua files at build time
// Key format: '../../engine/{subdir}/{file}.lua'
const ENGINE_LUA_FILES = import.meta.glob(
  '../../engine/**/*.lua',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

/**
 * Create a loader function with injectable glob results (for testing).
 * In production, use the default export which uses actual import.meta.glob.
 */
export function createLoader(
  gameLuaFiles: Record<string, string>,
  engineLuaFiles: Record<string, string>
) {
  /**
   * Get the content of a game-specific Lua file.
   * gameId: directory name under games/ (e.g. 'horse_racing')
   * fileName: file name with extension (e.g. 'logic.lua', 'utils.lua')
   */
  function getGameLua(gameId: string, fileName: string): string {
    const key = `../../games/${gameId}/${fileName}`;
    const content = gameLuaFiles[key];
    if (content === undefined) {
      console.warn(`[loader] Lua file not found: ${key}`);
      return '';
    }
    return content;
  }

  /**
   * Get the content of an engine Lua file.
   * subdir: 'primitives' or 'systems'
   * fileName: file name with extension (e.g. 'action.lua')
   */
  function getEngineLua(subdir: string, fileName: string): string {
    const key = `../../engine/${subdir}/${fileName}`;
    const content = engineLuaFiles[key];
    if (content === undefined) {
      console.warn(`[loader] Engine Lua file not found: ${key}`);
      return '';
    }
    return content;
  }

  const PRIMITIVE_ORDER = [
    'action.lua',
    'entity.lua',
    'resolution.lua',
    'consequence.lua',
    'movement.lua',
    'physics.lua',
    'lifecycle.lua',
  ];

  function buildEngineSource(engineSystems: string[]): string {
    const parts: string[] = [];

    // Load primitives in dependency order
    for (const fileName of PRIMITIVE_ORDER) {
      const src = getEngineLua('primitives', fileName);
      if (src) parts.push(src);
    }

    // Load declared engine systems
    for (const systemId of (engineSystems ?? [])) {
      const src = getEngineLua('systems', `${systemId}.lua`);
      if (src) parts.push(src);
    }

    return parts.join('\n\n');
  }

  return function loadGameFiles(gameId: string): GameFiles {
    const assets = GAME_ASSETS[gameId];
    if (!assets) throw new ValidationError(`Unknown game: ${gameId}`);
    const data = yaml.load(assets.data) as Record<string, unknown>;
    const ui = yaml.load(assets.ui) as Record<string, unknown>;
    validateData(data, gameId);

    const systemsData = (assets.systems
      ? yaml.load(assets.systems) as Record<string, unknown>
      : {}) as Record<string, unknown> ?? {};
    const luaFileList = systemsData['lua_files'] as string[] | undefined;
    const engineSystems = systemsData['engine_systems'] as string[] | undefined;

    // Build engine source
    const engineSource = buildEngineSource(engineSystems ?? []);

    // Build game logic source
    let logicSource: string;
    if (luaFileList && luaFileList.length > 0) {
      // Multi-file game: load in declared order
      logicSource = luaFileList
        .map(f => getGameLua(gameId, f))
        .join('\n\n');
    } else {
      // Single-file game (horse_racing backward compat)
      logicSource = getGameLua(gameId, 'logic.lua');
    }

    return {
      gameId,
      data,
      ui,
      logic: logicSource,
      engineSource,
    };
  };
}

// Default loader using actual import.meta.glob results
export const loadGameFiles = createLoader(GAME_LUA_FILES, ENGINE_LUA_FILES);

function validateData(data: Record<string, unknown>, gameId: string): void {
  const game = data['game'] as Record<string, unknown> | undefined;
  if (!game) throw new ValidationError('Missing required key: game');
  if (!game['id']) throw new ValidationError('Missing required key: game.id');
  if (!game['name']) throw new ValidationError('Missing required key: game.name');
  if (!game['version']) throw new ValidationError('Missing required key: game.version');
  if (!game['studio']) throw new ValidationError('Missing required key: game.studio');
  if (game['id'] !== gameId) {
    throw new ValidationError(
      `game.id mismatch: expected "${gameId}", got "${String(game['id'])}"`
    );
  }
}
