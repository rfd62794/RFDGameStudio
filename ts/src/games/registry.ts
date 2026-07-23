import type { GameConfig } from '../engine/types';
import dissonanceConfig from './dissonance/config';
import { slimeworldConfig } from './slimeworld/config';
import shoalConfig from './shoal/config';
import voiddriftConfig from './voiddrift/config';
import corpworldConfig from './corpworld/config';
import brewfieldConfig from './brewfield/config';
import { horseRacingConfig } from './horse_racing/config';
import { slitherRogueConfig } from './slither_rogue/config';
import { mutantBattleBallConfig } from './mutant_battle_ball/config';
import { slimeCoinConfig } from './slime_coin/config';
import { chimeraWildsConfig } from './chimera_wilds/config';
import { scrapcrawlConfig } from './scrapcrawl/config';
import ledgerConfig from './ledger/config';
import trinitySiegeConfig from './trinity_siege/config';

/**
 * Formal game registry. Add new games here.
 * Order determines display order in any future game selector UI.
 */
export const GAME_REGISTRY: GameConfig[] = [
  dissonanceConfig,
  slimeworldConfig,
  shoalConfig,
  voiddriftConfig,
  corpworldConfig,
  brewfieldConfig,
  horseRacingConfig,
  slitherRogueConfig,
  mutantBattleBallConfig,
  slimeCoinConfig,
  chimeraWildsConfig,
  scrapcrawlConfig,
  ledgerConfig,
  trinitySiegeConfig,
];

/**
 * Look up a game config by ID. Returns undefined if not found.
 */
export function findGame(gameId: string): GameConfig | undefined {
  return GAME_REGISTRY.find(g => g.gameId === gameId);
}
