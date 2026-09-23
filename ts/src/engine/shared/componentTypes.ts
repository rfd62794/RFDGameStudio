/**
 * Shared types used by the shared CorpWorld/Planet of Greed components.
 *
 * These types define the interface that the shared components (AlertQueue,
 * BoardroomHeader, CombatResolutionView, DailyEventModal, PlanetMap) expect
 * from any consuming game. Each game's own types.ts should be structurally
 * compatible with these (or re-export them).
 *
 * Combat-specific types (UnitType, UnitGroup, CellCombatState,
 * CombatLogEntry) live in shared/combat/types.ts and are re-exported here
 * for convenience.
 */

import type { UnitType, UnitGroup } from './combat/types';

// Re-export combat types so consumers can import everything from one place
export type { UnitType, UnitGroup, CellCombatState, CombatLogEntry } from './combat/types';

export interface Point {
  x: number;
  y: number;
}

export interface GameDate {
  year: number;
  month: number;
  week: number;
  day: number;
}

/**
 * Minimal Corporation shape used by the shared components.
 * Consuming games may extend this with additional fields (Planet of Greed
 * adds cultureId, rank, fragments, etc.).
 */
export interface Corporation {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  bgClass: string;
  textClass: string;
  isPlayer: boolean;
  treasury: number;
  scoutedCells: { [cellId: number]: boolean };
  // Optional fields used by games that extend the base Corporation
  // (Planet of Greed adds rank, fragments, cultureId).
  rank?: number;
  fragments?: string[];
  cultureId?: string;
}

export interface RecruitmentItem {
  type: UnitType;
  weeksLeft: number;
}

export interface MapCell {
  id: number;
  name: string;
  seed: Point;
  polygon: Point[];
  neighbors: number[];
  ownerId: string | null;
  units: UnitGroup;
  fortification: number;
  recruitmentQueue: RecruitmentItem[];
  preferredProduction: UnitType;
  productionProgress: number;
  publicOpinion?: number;
}

export interface UnitTransit {
  id: string;
  corpId: string;
  originCellId: number;
  targetCellId: number;
  units: UnitGroup;
  totalDays: number;
  daysLeft: number;
}

export interface GameEventChoice {
  text: string;
  cost: number;
  unitsCost?: UnitGroup;
  effectText: string;
  action: (state: any, cellId: number) => { log: string; stateUpdates: any };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  targetCellId: number;
  choices: GameEventChoice[];
}
