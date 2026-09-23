import yaml from 'js-yaml';
import { LuaExecutor } from './executor';
import { GameSession, GameFiles, ValidationError } from './types';

const PRIMITIVE_ORDER = [
  'action.lua',
  'entity.lua',
  'resolution.lua',
  'consequence.lua',
  'movement.lua',
  'physics.lua',
  'lifecycle.lua',
];

export interface StandaloneLoaderInputs {
  dataRaw: string;
  uiRaw: string;
  systemsRaw: string;
  gameLuaFiles: Record<string, string>;
  engineLuaFiles: Record<string, string>;
  gameId: string;
}

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

export function buildStandaloneSession({
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles,
  engineLuaFiles,
  gameId,
}: StandaloneLoaderInputs): GameSession {
  const data = yaml.load(dataRaw) as Record<string, unknown>;
  const ui = yaml.load(uiRaw) as Record<string, unknown>;
  validateData(data, gameId);

  const systems = (yaml.load(systemsRaw) ?? {}) as Record<string, unknown>;
  const luaFileList = systems['lua_files'] as string[] | undefined;
  const engineSystems = systems['engine_systems'] as string[] | undefined;

  function getGameLua(fileName: string): string {
    const content = gameLuaFiles[fileName];
    if (content === undefined) {
      console.warn(`[standaloneLoader] Game Lua file not found: ${fileName}`);
      return '';
    }
    return content;
  }

  function getEngineLua(subdir: string, fileName: string): string {
    const key = `${subdir}/${fileName}`;
    const content = engineLuaFiles[key];
    if (content === undefined) {
      console.warn(`[standaloneLoader] Engine Lua file not found: ${key}`);
      return '';
    }
    return content;
  }

  const parts: string[] = [];
  for (const fileName of PRIMITIVE_ORDER) {
    const src = getEngineLua('primitives', fileName);
    if (src) parts.push(src);
  }
  for (const systemId of engineSystems ?? []) {
    const src = getEngineLua('systems', `${systemId}.lua`);
    if (src) parts.push(src);
  }

  const engineSource = parts.join('\n\n');

  const logicSource =
    luaFileList && luaFileList.length > 0
      ? luaFileList.map((f) => getGameLua(f)).join('\n\n')
      : getGameLua('logic.lua');

  const files: GameFiles = { gameId, data, ui, logic: logicSource, engineSource };
  const executor = new LuaExecutor(files.logic, 42, files.engineSource);
  return { gameId, files, executor };
}
