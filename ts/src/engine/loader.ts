import yaml from 'js-yaml';
import { GameFiles, ValidationError } from './types';

import hrDataRaw from '../../../games/horse_racing/data.yaml?raw';
import hrUiRaw from '../../../games/horse_racing/ui.yaml?raw';
import hrLogicRaw from '../../../games/horse_racing/logic.lua?raw';

import srDataRaw     from '../../../games/slither_rogue/data.yaml?raw';
import srUiRaw      from '../../../games/slither_rogue/ui.yaml?raw';
import srSystemsRaw from '../../../games/slither_rogue/systems.yaml?raw';
import srUtilsRaw     from '../../../games/slither_rogue/utils.lua?raw';
import srStateRaw     from '../../../games/slither_rogue/state.lua?raw';
import srPhysicsRaw   from '../../../games/slither_rogue/physics.lua?raw';
import srCollisionRaw from '../../../games/slither_rogue/collision.lua?raw';
import srRenderRaw    from '../../../games/slither_rogue/render.lua?raw';
import srLogicRaw     from '../../../games/slither_rogue/logic.lua?raw';

import actionLua from '../../../engine/primitives/action.lua?raw';
import entityLua from '../../../engine/primitives/entity.lua?raw';
import resolutionLua from '../../../engine/primitives/resolution.lua?raw';
import consequenceLua from '../../../engine/primitives/consequence.lua?raw';
import movementLua from '../../../engine/primitives/movement.lua?raw';
import physicsLua from '../../../engine/primitives/physics.lua?raw';
import lifecycleLua from '../../../engine/primitives/lifecycle.lua?raw';
import geneticsLua from '../../../engine/systems/genetics.lua?raw';
import oddsLua from '../../../engine/systems/odds.lua?raw';
import marketLua from '../../../engine/systems/market.lua?raw';

const ENGINE_SOURCE = [
  actionLua, entityLua, resolutionLua, consequenceLua,
  movementLua, physicsLua, lifecycleLua,
  geneticsLua, oddsLua, marketLua,
].join('\n\n');

const SR_LUA_FILE_MAP: Record<string, string> = {
  'utils.lua':     srUtilsRaw,
  'state.lua':     srStateRaw,
  'physics.lua':   srPhysicsRaw,
  'collision.lua': srCollisionRaw,
  'render.lua':    srRenderRaw,
  'logic.lua':     srLogicRaw,
};

const GAME_ASSETS: Record<string, { data: string; ui: string; logic: string; systems?: string }> = {
  horse_racing: { data: hrDataRaw, ui: hrUiRaw, logic: hrLogicRaw },
  slither_rogue: { data: srDataRaw, ui: srUiRaw, logic: srLogicRaw, systems: srSystemsRaw },
};

export function loadGameFiles(gameId: string): GameFiles {
  const assets = GAME_ASSETS[gameId];
  if (!assets) throw new ValidationError(`Unknown game: ${gameId}`);
  const data = yaml.load(assets.data) as Record<string, unknown>;
  const ui = yaml.load(assets.ui) as Record<string, unknown>;
  validateData(data, gameId);
  const systemsData = (assets.systems
    ? yaml.load(assets.systems) as Record<string, unknown>
    : {}) as Record<string, unknown> ?? {};
  const luaFiles = systemsData['lua_files'] as string[] | undefined;
  const logicSource = (luaFiles && luaFiles.length > 0)
    ? luaFiles.map(f => SR_LUA_FILE_MAP[f] ?? '').join('\n\n')
    : assets.logic;
  return { gameId, data, ui, logic: logicSource, engineSource: ENGINE_SOURCE };
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
