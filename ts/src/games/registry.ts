import type { GameConfig } from '../engine/types';
import dissonanceConfig from './dissonance/config';
import { slimeworldConfig } from './slimeworld/config';
import shoalConfig from './shoal/config';
import voiddriftConfig from './voiddrift/config';
import { horseRacingConfig } from './horse_racing/config';
import { slitherRogueConfig } from './slither_rogue/config';
import { mutantBattleBallConfig } from './mutant_battle_ball/config';
import { slimeCoinConfig } from './slime_coin/config';
import { chimeraWildsConfig } from './chimera_wilds/config';
import { scrapcrawlConfig } from './scrapcrawl/config';
import ledgerConfig from './ledger/config';
import trinitySiegeConfig from './trinity_siege/config';
import sevenDaysToFryConfig from './7_days_to_fry/config';
import antsimReduxConfig from './antsim_redux/config';
import facilityEscapeConfig from './facility_escape/config';
import { planetofgreedConfig } from './planetofgreed/config';

// Retired games (matching SlimeBreeder precedent): config.ts preserved in
// their ts/src/games/{slug}/ directories, but NOT imported here. Source
// in examples/ preserved untouched. Explicit absence confirmed by
// test_arcade_registry_directive.ts.
//   - corpworld:        Planet of Greed's fork ancestor. Retired Aug 2026.
//   - kingmaker_squads: Wheel/culture-identity design source. Retired Aug 2026.

/**
 * Formal game registry. Add new games here.
 * Order determines display order in any future game selector UI.
 */
export const GAME_REGISTRY: GameConfig[] = [
  dissonanceConfig,
  slimeworldConfig,
  shoalConfig,
  voiddriftConfig,
  horseRacingConfig,
  slitherRogueConfig,
  mutantBattleBallConfig,
  slimeCoinConfig,
  chimeraWildsConfig,
  scrapcrawlConfig,
  ledgerConfig,
  trinitySiegeConfig,
  sevenDaysToFryConfig,
  antsimReduxConfig,
  facilityEscapeConfig,
  planetofgreedConfig,
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
  { id: 'planetofgreed', label: 'Planet of Greed' },
];
