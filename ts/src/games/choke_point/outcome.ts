import type { ChokePointGameState } from './types';

// Exact line the Lua commit_turn writes when the last wave is cleared (games/choke_point/logic.lua).
export const VICTORY_LOG = 'Victory! All waves cleared!';

export function isVictory(state: ChokePointGameState): boolean {
  return state.core_hp > 0 && (state.history ?? []).includes(VICTORY_LOG);
}
