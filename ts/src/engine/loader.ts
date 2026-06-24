import yaml from 'js-yaml';
import { GameFiles, ValidationError } from './types';

import dataRaw from '../../../games/horse_racing/data.yaml?raw';
import uiRaw from '../../../games/horse_racing/ui.yaml?raw';
import logicRaw from '../../../games/horse_racing/logic.lua?raw';

export function loadGameFiles(gameId: string): GameFiles {
  const data = yaml.load(dataRaw) as Record<string, unknown>;
  const ui = yaml.load(uiRaw) as Record<string, unknown>;
  validateData(data, gameId);
  return { gameId, data, ui, logic: logicRaw };
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
