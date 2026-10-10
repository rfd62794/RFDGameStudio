// new: examples/factory-idle-precision-armory-phase2/src/engine/appReducer.ts
import type { GameAction, GameState } from '../types';
import { gameReducer, getInitialGameState } from './gameReducer';

/** The game's own actions plus the one app-level action: start a brand-new factory. */
export type AppAction = GameAction | { type: 'RESET_FACTORY' };

export function appReducer(state: GameState, action: AppAction): GameState {
  if (action.type === 'RESET_FACTORY') return getInitialGameState();
  return gameReducer(state, action);
}
