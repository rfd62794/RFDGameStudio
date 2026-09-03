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
import { wire_rustConfig } from './wire_rust/config';
import ledgerConfig from './ledger/config';
import trinitySiegeConfig from './trinity_siege/config';
import sevenDaysToFryConfig from './7_days_to_fry/config';
import antsimReduxConfig from './antsim_redux/config';
import facilityEscapeConfig from './facility_escape/config';
import factoryIdleConfig from './factory_idle/config';
import { planetofgreedConfig } from './planetofgreed/config';
import planetforgeConfig from './planetforge/config';
import { gladiatorArenaConfig } from './gladiator_arena/config';
import voiddriftReduxConfig from './voiddrift_redux/config';
import successionConfig from './succession/config';
import houseOfKingsCollabConfig from './house_of_kings_collab/config';
import { characterViewerConfig } from './character_viewer/config';
import { techniqueShowcaseConfig } from './technique_showcase/config';
import { roleSymbolViewerConfig } from './role_symbol_viewer/config';
import dissonancePrototypeConfig from './dissonance_prototype/config';
import slimegardenConfig from './slimegarden/config';
import slimebreederConfig from './slimebreeder/config';
import corpworldConfig from './corpworld/config';
import kingmakerSquadsConfig from './kingmaker_squads/config';

// Legacy/Origin Projects (ADR-023, Aug 23 2026): real material that
// predates and became a currently-live game, registered here as real
// origin history — not as new games competing with what they became.
//   - dissonance_prototype: original AI Studio source → Dissonance Depths
//   - slimegarden + slimebreeder: merged → SlimeWorld
//   - corpworld + kingmaker_squads: superseded → Planet of Greed
// Reuses status: 'external' with honest "(Origin)" labeling in both the
// label and description — no new GameStatus value; see the ADR for why.

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
  wire_rustConfig,
  ledgerConfig,
  trinitySiegeConfig,
  sevenDaysToFryConfig,
  antsimReduxConfig,
  facilityEscapeConfig,
  factoryIdleConfig,
  planetofgreedConfig,
  planetforgeConfig,
  gladiatorArenaConfig,
  voiddriftReduxConfig,
  successionConfig,
  houseOfKingsCollabConfig,
  characterViewerConfig,
  techniqueShowcaseConfig,
  roleSymbolViewerConfig,
  dissonancePrototypeConfig,
  slimegardenConfig,
  slimebreederConfig,
  corpworldConfig,
  kingmakerSquadsConfig,
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
  { id: 'wire_rust', label: 'Wire & Rust' },
  { id: 'slime_coin', label: 'Slime Coin' },
  { id: 'planetofgreed', label: 'Planet of Greed' },
  { id: 'gladiator_arena', label: 'Gladiator Arena' },
  { id: 'voiddrift_redux', label: 'VoidDrift Redux' },
  { id: 'succession', label: 'Succession' },
  { id: 'house_of_kings_collab', label: 'House of Kings Collab' },
];
