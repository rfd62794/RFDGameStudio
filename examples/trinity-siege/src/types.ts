/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UnitShape {
  CIRCLE = "Circle",
  SQUARE = "Square",
  TRIANGLE = "Triangle",
}

export enum Race {
  PLAYER = "Player",
  ORC = "Orc",
}

export interface Unit {
  id: string;
  shape: UnitShape;
  race: Race;
  baseStrength: number;
  currentStrength: number;
  lane: number;      // 0 to 5
  segment: number;   // 1 to 3
}

export interface TileState {
  lane: number;
  segment: number;
  units: Unit[];
  hasWall: boolean;
}

export interface LaneState {
  id: number;        // 0 to 5
  name: string;      // e.g., "North", "North-East", etc.
  frontierSegment: number; // 1, 2, or 3 (active boundary)
}

export enum GamePhase {
  FORECAST = "Forecast",
  ALLOCATE = "Allocate",
  RESOLVE = "Resolve",
  AFTERMATH = "Aftermath",
}

export interface OrcUnit {
  id: string;
  shape: UnitShape;
  baseStrength: number;
}

export interface Attack {
  lane: number;
  units: OrcUnit[];
}

export interface DuelLog {
  id: string;
  attackerShape: UnitShape;
  attackerInitialStrength: number;
  defenderShape: UnitShape;
  defenderInitialStrength: number;
  defenderHasWall: boolean;
  attackerEffectiveStrength: number;
  defenderEffectiveStrength: number;
  outcome: "defender_wins" | "attacker_wins" | "both_die";
  attackerRemainingStrength: number;
  defenderRemainingStrength: number;
}

export interface BattleResult {
  lane: number;
  duels: DuelLog[];
  victory: boolean;
  attackerInitialCount: number;
  defenderInitialCount: number;
  breached: boolean;
  survivingDefenders?: Unit[];
  isCoreDefense?: boolean;
  attackerRemainingStrength?: number;
  survivingAttackers?: OrcUnit[];
  isBreach?: boolean;
  livesLost?: number;
}

export type SegmentStatus = "unclaimed" | "claiming" | "owned";

// Game Settings & Constants
export const STARTING_GOLD = 30;
export const COST_UNIT = 5;
export const COST_WALL = 8;
export const INCOME_BASE = 10;
export const INCOME_PER_TERRITORY = 2; // per segment beyond starting segment 1
export const MAX_LANE_DEPTH = 5;
export const MAX_WAVES = 5;
export const WEIGHT_FLOOR_BASELINE = 3;
export const LIVES_STARTING = 15;

export const LANE_NAMES = [
  "North",
  "North-East",
  "South-East",
  "South",
  "South-West",
  "North-West"
];

// SHAPE_MATRIX[Attacker][Defender]
// Circle beats Square, Square beats Triangle, Triangle beats Circle
export const SHAPE_MATRIX: Record<UnitShape, Record<UnitShape, number>> = {
  [UnitShape.CIRCLE]: {
    [UnitShape.CIRCLE]: 1.0,
    [UnitShape.SQUARE]: 1.5,
    [UnitShape.TRIANGLE]: 0.5,
  },
  [UnitShape.SQUARE]: {
    [UnitShape.CIRCLE]: 0.5,
    [UnitShape.SQUARE]: 1.0,
    [UnitShape.TRIANGLE]: 1.5,
  },
  [UnitShape.TRIANGLE]: {
    [UnitShape.CIRCLE]: 1.5,
    [UnitShape.SQUARE]: 0.5,
    [UnitShape.TRIANGLE]: 1.0,
  }
};

export const RACE_LEAN = {
  PLAYER: 1.0,
  ORC: 1.0,
};
