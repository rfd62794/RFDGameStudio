// types.ts — horse_racing game types
// Re-exported from engine/types for consistency with other games

export type {
  Horse,
  RaceParticipant,
  Bet,
  RaceResult,
  CurrentRace,
  RaceHistoryEntry,
} from '../../engine/types';

// GameState is used by multiple games, use alias for horse_racing
export type { GameState as HorseRacingState } from '../../engine/types';
