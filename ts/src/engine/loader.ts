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

/**
 * Create a loader function with injectable glob results (for testing).
 * In production, uses runtime fetch for Lua files.
 */
export function createLoader(
  gameLuaFiles: Record<string, string> | null = null,
  engineLuaFiles: Record<string, string> | null = null
) {
  const useRuntimeFetch = gameLuaFiles === null && engineLuaFiles === null;

  /**
   * Get the content of a game-specific Lua file.
   * gameId: directory name under games/ (e.g. 'horse_racing')
   * fileName: file name with extension (e.g. 'logic.lua', 'utils.lua')
   */
  async function getGameLua(gameId: string, fileName: string): Promise<string> {
    if (useRuntimeFetch) {
      try {
        const response = await fetch(`./games/${gameId}/${fileName}`);
        if (!response.ok) {
          console.warn(`[loader] Lua file not found: ./games/${gameId}/${fileName}`);
          return '';
        }
        return await response.text();
      } catch (e) {
        console.warn(`[loader] Failed to fetch ./games/${gameId}/${fileName}:`, e);
        return '';
      }
    }

    const key = `../../games/${gameId}/${fileName}`;
    const content = gameLuaFiles![key];
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
  async function getEngineLua(subdir: string, fileName: string): Promise<string> {
    if (useRuntimeFetch) {
      try {
        const response = await fetch(`./engine/${subdir}/${fileName}`);
        if (!response.ok) {
          console.warn(`[loader] Engine Lua file not found: ./engine/${subdir}/${fileName}`);
          return '';
        }
        return await response.text();
      } catch (e) {
        console.warn(`[loader] Failed to fetch ./engine/${subdir}/${fileName}:`, e);
        return '';
      }
    }

    const key = `../../engine/${subdir}/${fileName}`;
    const content = engineLuaFiles![key];
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

  async function buildEngineSource(engineSystems: string[]): Promise<string> {
    const parts: string[] = [];

    // Load primitives in dependency order
    for (const fileName of PRIMITIVE_ORDER) {
      const src = await getEngineLua('primitives', fileName);
      if (src) parts.push(src);
    }

    // Load declared engine systems
    for (const systemId of (engineSystems ?? [])) {
      const src = await getEngineLua('systems', `${systemId}.lua`);
      if (src) parts.push(src);
    }

    return parts.join('\n\n');
  }

  return async function loadGameFiles(gameId: string): Promise<GameFiles> {
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
    const engineSource = await buildEngineSource(engineSystems ?? []);

    // Build game logic source
    let logicSource: string;
    if (luaFileList && luaFileList.length > 0) {
      // Multi-file game: load in declared order
      const sources = await Promise.all(luaFileList.map(f => getGameLua(gameId, f)));
      logicSource = sources.join('\n\n');
    } else {
      // Single-file game (horse_racing backward compat)
      logicSource = await getGameLua(gameId, 'logic.lua');
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

// Default loader using runtime fetch
export const loadGameFiles = createLoader(null, null);

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
