export type { Part, PartSlot } from '../../engine/shared/partSlots';
import type { PartsBySlot } from '../../engine/shared/partSlots';

/** Alias for the shared PartsBySlot, preserving MBB's existing API name. */
export type MutantParts = PartsBySlot;

export interface Mutant {
  id: string;
  name: string;
  color: string;
  parts: MutantParts;
  status: 'healthy' | 'injured' | 'infirmary' | 'dead';
  matchesPlayed: number;
  infirmaryMatchesLeft?: number;
}

export interface ComputedStats {
  accuracy: number;
  endurance: number;
  power: number;
  speed: number;
  maxHealth: number;
}

export interface MatchAgent {
  id: string;
  name: string;
  team: 'player' | 'opponent';
  color: string;
  x: number;
  y: number;
  role: 'carrier' | 'escort' | 'tackler' | 'inactive';
  status: 'active' | 'stunned' | 'down' | 'subbed';
  hasBall: boolean;
  health: number;
  maxHealth: number;
}

export interface MatchState {
  agents: MatchAgent[];
  ballX: number;
  ballY: number;
  ballState: 'held' | 'loose' | 'in_flight';
  ballHeight: number;
  ballVelocityX: number;
  ballVelocityY: number;
  possession: 'player' | 'opponent';
  scorePlayer: number;
  scoreOpponent: number;
  timeRemaining: number;
  timeoutsLeft: number;
  state: 'playing' | 'paused_sub' | 'timeout' | 'scored' | 'ended';
  events: Array<Record<string, unknown>>;
}

export interface MBBGameState {
  iron: number;
  roster: Mutant[];
  partsInventory: string[];
  activeSquad: [string, string];
  bench: string[];
  matchHistory: Array<{
    result: 'win' | 'loss';
    scorePlayer: number;
    scoreOpponent: number;
    ironEarned: number;
  }>;
  currentOpponentIdx: number;
}
