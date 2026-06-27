import type { GameConfig } from '../engine/types';
import { horseRacingConfig } from './horse_racing/config';
import { slitherRogueConfig } from './slither_rogue/config';

/**
 * Formal game registry. Add new games here.
 * Order determines display order in any future game selector UI.
 */
export const GAME_REGISTRY: GameConfig[] = [
  horseRacingConfig,
  slitherRogueConfig,
];

/**
 * Look up a game config by ID. Returns undefined if not found.
 */
export function findGame(gameId: string): GameConfig | undefined {
  return GAME_REGISTRY.find(g => g.gameId === gameId);
}

/**
 * Look up a game config by ID. Returns the first registered game as fallback.
 */
export function findGameOrDefault(gameId: string): GameConfig {
  return findGame(gameId) ?? GAME_REGISTRY[0];
}
