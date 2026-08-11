import type { GameConfig } from '../engine/types';
import dissonanceConfig from './dissonance/config';
import { slimeworldConfig } from './slimeworld/config';
import shoalConfig from './shoal/config';
import voiddriftConfig from './voiddrift/config';
import corpworldConfig from './corpworld/config';
import { horseRacingConfig } from './horse_racing/config';
import { slitherRogueConfig } from './slither_rogue/config';
import { mutantBattleBallConfig } from './mutant_battle_ball/config';
import { slimeCoinConfig } from './slime_coin/config';
import { chimeraWildsConfig } from './chimera_wilds/config';
import { scrapcrawlConfig } from './scrapcrawl/config';
import ledgerConfig from './ledger/config';
import trinitySiegeConfig from './trinity_siege/config';
import sevenDaysToFryConfig from './7_days_to_fry/config';
import kingmakerSquadsConfig from './kingmaker_squads/config';
import antsimReduxConfig from './antsim_redux/config';
import facilityEscapeConfig from './facility_escape/config';

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
  horseRacingConfig,
  slitherRogueConfig,
  mutantBattleBallConfig,
  slimeCoinConfig,
  chimeraWildsConfig,
  scrapcrawlConfig,
  ledgerConfig,
  trinitySiegeConfig,
  sevenDaysToFryConfig,
  kingmakerSquadsConfig,
  antsimReduxConfig,
  facilityEscapeConfig,
];

/**
 * Look up a game config by ID. Returns undefined if not found.
 */
export function findGame(gameId: string): GameConfig | undefined {
  return GAME_REGISTRY.find(g => g.gameId === gameId);
}

export const STANDALONE_BUILD_GAMES = [
  { id: 'shoal', label: 'Shoal' },
  { id: 'slimeworld', label: 'SlimeWorld' },
  { id: 'chimera_wilds', label: 'Chimera Wilds' },
  { id: 'mutant_battle_ball', label: 'Mutant Battle Ball' },
  { id: 'scrapcrawl', label: 'ScrapCrawl' },
  { id: 'slime_coin', label: 'Slime Coin' },
];
