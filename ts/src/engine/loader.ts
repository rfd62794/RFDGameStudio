import yaml from 'js-yaml';
import { GameFiles, ValidationError } from './types';

// ── Static YAML imports (all games) ──────────────────────────────────────────
// YAML is always statically imported — small, safe, no glob needed.

import hrDataRaw    from '../../../games/horse_racing/data.yaml?raw';
import hrUiRaw     from '../../../games/horse_racing/ui.yaml?raw';
import hrSystemsRaw from '../../../games/horse_racing/systems.yaml?raw';

import srDataRaw    from '../../../games/slither_rogue/data.yaml?raw';
import srUiRaw     from '../../../games/slither_rogue/ui.yaml?raw';
import srSystemsRaw from '../../../games/slither_rogue/systems.yaml?raw';

import mbbDataRaw    from '../../../games/mutant_battle_ball/data.yaml?raw';
import mbbUiRaw     from '../../../games/mutant_battle_ball/ui.yaml?raw';
import mbbSystemsRaw from '../../../games/mutant_battle_ball/systems.yaml?raw';

import scDataRaw    from '../../../games/slime_coin/data.yaml?raw';
import scUiRaw     from '../../../games/slime_coin/ui.yaml?raw';
import scSystemsRaw from '../../../games/slime_coin/systems.yaml?raw';

import cwDataRaw    from '../../../games/chimera_wilds/data.yaml?raw';
import cwUiRaw     from '../../../games/chimera_wilds/ui.yaml?raw';
import cwSystemsRaw from '../../../games/chimera_wilds/systems.yaml?raw';

import scrDataRaw    from '../../../games/scrapcrawl/data.yaml?raw';
import scrUiRaw     from '../../../games/scrapcrawl/ui.yaml?raw';
import scrSystemsRaw from '../../../games/scrapcrawl/systems.yaml?raw';

const GAME_ASSETS: Record<string, { data: string; ui: string; systems: string }> = {
  horse_racing: { data: hrDataRaw, ui: hrUiRaw, systems: hrSystemsRaw },
  slither_rogue: { data: srDataRaw, ui: srUiRaw, systems: srSystemsRaw },
  mutant_battle_ball: { data: mbbDataRaw, ui: mbbUiRaw, systems: mbbSystemsRaw },
  slime_coin: { data: scDataRaw, ui: scUiRaw, systems: scSystemsRaw },
  chimera_wilds: { data: cwDataRaw, ui: cwUiRaw, systems: cwSystemsRaw },
  scrapcrawl: { data: scrDataRaw, ui: scrUiRaw, systems: scrSystemsRaw },
};

// ── Lua files — bundled at build time via import.meta.glob ───────────────────
// Paths are relative to THIS file (ts/src/engine/loader.ts).
// ../../../ resolves to RFDGameStudio/ (the repo root).
// eager: true → all Lua files are embedded as string constants in the bundle.
// No runtime fetch. Works identically in dev and production.

const GAME_LUA_FILES = import.meta.glob(
  '../../../games/**/*.lua',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

const ENGINE_LUA_FILES = import.meta.glob(
  '../../../engine/**/*.lua',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

// ── Loader factory (injectable for testing) ──────────────────────────────────

/**
 * Create a loader with injectable glob maps.
 * Production: pass null to use the real import.meta.glob results above.
 * Tests:      pass mock maps via createLoader(mockGame, mockEngine).
 */
export function createLoader(
  gameLuaFiles: Record<string, string> | null = null,
  engineLuaFiles: Record<string, string> | null = null
) {
  const gameLua    = gameLuaFiles    ?? GAME_LUA_FILES;
  const engineLua  = engineLuaFiles  ?? ENGINE_LUA_FILES;

  function getGameLua(gameId: string, fileName: string): string {
    const key = `../../../games/${gameId}/${fileName}`;
    const content = gameLua[key];
    if (content === undefined) {
      console.warn(`[loader] Lua file not found in bundle: ${key}`);
      return '';
    }
    return content;
  }

  function getEngineLua(subdir: string, fileName: string): string {
    const key = `../../../engine/${subdir}/${fileName}`;
    const content = engineLua[key];
    if (content === undefined) {
      console.warn(`[loader] Engine Lua file not found in bundle: ${key}`);
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
    for (const fileName of PRIMITIVE_ORDER) {
      const src = getEngineLua('primitives', fileName);
      if (src) parts.push(src);
    }
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
    const ui   = yaml.load(assets.ui)   as Record<string, unknown>;
    validateData(data, gameId);

    const systemsData = (yaml.load(assets.systems) ?? {}) as Record<string, unknown>;
    const luaFileList  = systemsData['lua_files']     as string[] | undefined;
    const engineSystems = systemsData['engine_systems'] as string[] | undefined;

    const engineSource = buildEngineSource(engineSystems ?? []);

    let logicSource: string;
    if (luaFileList && luaFileList.length > 0) {
      logicSource = luaFileList.map(f => getGameLua(gameId, f)).join('\n\n');
    } else {
      logicSource = getGameLua(gameId, 'logic.lua');
    }

    return { gameId, data, ui, logic: logicSource, engineSource };
  };
}

// Default loader — uses real bundled glob maps
export const loadGameFiles = createLoader(null, null);

// ── Validation ───────────────────────────────────────────────────────────────

function validateData(data: Record<string, unknown>, gameId: string): void {
  const game = data['game'] as Record<string, unknown> | undefined;
  if (!game)          throw new ValidationError('Missing required key: game');
  if (!game['id'])    throw new ValidationError('Missing required key: game.id');
  if (!game['name'])  throw new ValidationError('Missing required key: game.name');
  if (!game['version']) throw new ValidationError('Missing required key: game.version');
  if (!game['studio'])  throw new ValidationError('Missing required key: game.studio');
  if (game['id'] !== gameId) {
    throw new ValidationError(
      `game.id mismatch: expected "${gameId}", got "${String(game['id'])}"`
    );
  }
}
