import type { GameConfig } from '../engine/types';
import { collectConfigs } from './collectConfigs';

/**
 * Formal game registry, collected from every ./<id>/config.ts (default export).
 * Add a game by adding its config.ts; display order is the config's `order`.
 * The negative patterns are configs that exist but are deliberately not listed (see UNREGISTERED in
 * tests/test_arcade_registry_directive.ts).
 */
export const GAME_REGISTRY: GameConfig[] = collectConfigs(
  import.meta.glob<{ default: GameConfig }>(
    ['./*/config.ts', '!./brewfield/config.ts', '!./early_learning_buddy/config.ts'],
    { eager: true },
  ),
);

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
  { id: 'choke_point', label: 'Choke Point' },
  { id: 'filipino_bpo_simulator', label: 'Call Center Tycoon' },
  { id: 'slime_coin', label: 'Slime Coin' },
  { id: 'planetofgreed', label: 'Planet of Greed' },
  { id: 'gladiator_arena', label: 'Gladiator Arena' },
  { id: 'voiddrift_redux', label: 'VoidDrift Redux' },
  { id: 'succession', label: 'Succession' },
  { id: 'house_of_kings_collab', label: 'House of Kings Collab' },
];
