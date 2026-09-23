import { FigureState, ClaimantId, FigureId, Claim, PlayerOriginId, IndictmentTriad } from '../engine/types';
import { VerdictResult } from '../engine/verdict';
import { EvidenceItem } from '../data/evidence';

export type GamePhase = 'segment' | 'verdict';
export type PlayerMoveType = 'whisper' | 'appeal' | 'evidence' | 'scout' | 'slander' | 'indictment' | 'discredit';

export interface FactionRipple {
  targetFigureId: FigureId;
  penalty: number;
  reason: string;
}

export interface TickerEntry {
  segment: number;
  claimantId: ClaimantId;
  figureId: FigureId | null; // null only for Scout, which targets no figure
  moveType: PlayerMoveType;
  exposed?: boolean;
  favorGain?: number;
  ripple?: FactionRipple;
  indictment?: {
    triad: IndictmentTriad;
    isCorrect: boolean;
  };
}

export interface GameState {
  segment: number;          // 1–8 during play
  phase: GamePhase;
  playerOrigin: PlayerOriginId; // Selected background origin
  figures: FigureState[];   // 3, from engine/types
  claimants: ClaimantId[];  // ['player', 'aldric', 'vivienne']
  playerEvidence: EvidenceItem[]; // currently held, unspent
  scoutedCount: number;     // drives the fixed rotating Scout order
  allClaims: Claim[];       // every Whisper the player has made to any figure
  ticker: TickerEntry[];
  verdict: VerdictResult | null; // set only once phase === 'verdict'
}

