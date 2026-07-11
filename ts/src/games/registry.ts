import type { GameConfig } from '../engine/types';
import { horseRacingConfig } from './horse_racing/config';
import { slitherRogueConfig } from './slither_rogue/config';
import { mutantBattleBallConfig } from './mutant_battle_ball/config';
import { slimeCoinConfig } from './slime_coin/config';
import { chimeraWildsConfig } from './chimera_wilds/config';
import { scrapcrawlConfig } from './scrapcrawl/config';
import voiddriftConfig from './voiddrift/config';

/**
 * Formal game registry. Add new games here.
 * Order determines display order in any future game selector UI.
 */
export const GAME_REGISTRY: GameConfig[] = [
  horseRacingConfig,
  slitherRogueConfig,
  mutantBattleBallConfig,
  slimeCoinConfig,
  chimeraWildsConfig,
  scrapcrawlConfig,
  voiddriftConfig,
];

/**
 * Look up a game config by ID. Returns undefined if not found.
 */
export function findGame(gameId: string): GameConfig | undefined {
  return GAME_REGISTRY.find(g => g.gameId === gameId);
}

