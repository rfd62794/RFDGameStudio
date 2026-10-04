import { FactionId, HouseId } from '../types';

/** The House holding the Crown. Set to null for a flat six-peer model. */
export const CROWN_HOUSE: HouseId | null = 'tundra';

/** The player's House. Owner value remains 'player'. */
export const PLAYER_HOUSE: HouseId = 'ember';

export const AI_FACTION_IDS: FactionId[] = ['marsh', 'gale', 'tundra', 'crystal', 'tide'];

export const DEFAULT_TURN_ORDER: FactionId[] = ['player', ...AI_FACTION_IDS];

/**
 * Additive target-selection weight applied by faction pairing.
 * Positive = more likely to be attacked by that faction.
 */
export const FACTION_HOSTILITY: Record<string, number> = {
  // The Crown treats the Rebellion as the primary threat.
  'tundra->player': 40,
  // Marsh are river-folk sympathetic to the crossing — least hostile.
  'marsh->player': 5,
  'gale->player': 15,
  'crystal->player': 20,
  'tide->player': 15,
  // Houses under the Crown do not freely attack the Crown.
  'marsh->tundra': -20,
  'gale->tundra': -20,
  'crystal->tundra': -20,
  'tide->tundra': -20,
};

export function hostilityWeight(from: FactionId, to: FactionId): number {
  return FACTION_HOSTILITY[`${from}->${to}`] ?? 0;
}
