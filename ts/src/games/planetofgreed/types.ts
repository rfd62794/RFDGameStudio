// Planet of Greed types — re-exports shared types and adds game-specific
// extensions (CultureId, Corporation rank/fragments, EndingEvent, etc.).
//
// The shared component types (Point, GameDate, Corporation, MapCell,
// UnitTransit, GameEvent, UnitType, UnitGroup, CellCombatState,
// CombatLogEntry) are re-exported from engine/shared/componentTypes.
// Planet of Greed extends Corporation with cultureId, rank, and fragments
// (Phase 2/3 mechanics not present in the base CorpWorld types).

import type {
  Corporation as BaseCorporation,
  MapCell as BaseMapCell,
  UnitGroup,
  UnitType,
  GameDate,
  UnitTransit,
  GameEvent,
  CellCombatState,
} from '../../engine/shared/componentTypes';

// Re-export shared types so existing imports from './types' keep working
export type { UnitType, UnitGroup, CellCombatState, CombatLogEntry } from '../../engine/shared/componentTypes';
export type { Point, GameDate, RecruitmentItem, GameEventChoice, GameEvent } from '../../engine/shared/componentTypes';
export type { UnitTransit, MapCell as BaseMapCell } from '../../engine/shared/componentTypes';

// The six Cultures, in real hue-order wheel sequence (OperatorGame_Vision.docx
// §8.3): Ember -> Marsh -> Gale -> Tundra -> Crystal -> Tide -> (back to Ember).
// Ember/Tundra are wheel-opposite -- the confirmed "Fault Line" rival pair.
export type CultureId = 'ember' | 'marsh' | 'gale' | 'tundra' | 'crystal' | 'tide';

export interface Corporation extends BaseCorporation {
  cultureId: CultureId;
  // Territory + Population Balance standing, 1 = best. Only App.tsx
  // constructs/recomputes Corporation objects, so this is real and required
  // (set by buildInitialCorporations/computeRank), never left undefined.
  rank: number;
  // AI Fragments (Phase 3): each House starts holding exactly one Fragment
  // -- its own cultureId. On elimination (reduced to 0 cells), ALL
  // Fragments a House currently holds transfer to the eliminating House.
  // Pure tracked count; not spendable. Set by fragmentSystem.initializeFragments
  // at game start, mutated only by fragmentSystem.onHouseEliminated.
  fragments: string[];
}

export type OrderType = 'hold' | 'expand' | 'reinforce' | 'fortify' | 'scan' | 'civic';

export type WeeklyOrder =
  | { type: 'hold' }
  | { type: 'expand'; targetCellId: number; unitsSent: UnitGroup }
  | { type: 'reinforce'; reinforceType: UnitType }
  | { type: 'fortify' }
  | { type: 'scan'; targetCellId: number }
  | { type: 'civic'; focus: 'production' | 'defense' | 'unrest' };

// Phase 3 ending: fired when the player's House reaches Rank 1 at any
// Annual Report. The payload is the full extent of this phase's ending
// implementation -- no cutscene/narration, just the Fragment-count readout
// that proves the trigger fired and that Chapter 3 will read.
export interface EndingEvent {
  type: 'ENDING_TRIGGERED';
  fragmentCount: number;
  total: number;
}

export interface GameState {
  date: GameDate;
  cells: MapCell[];
  corporations: Corporation[];
  transits: UnitTransit[];
  playerOrders: { [cellId: number]: WeeklyOrder[] };
  isSimulating: boolean;
  simulationSpeed: number; // 1 = normal, 2 = fast, 4 = turbo
  currentActiveEvent: GameEvent | null;
  eventHistory: { date: GameDate; title: string; resolution: string }[];
  combatHistory: { date: GameDate; cellId: number; cellName: string; victorId: string | null; log: CellCombatState }[];
  activeCombatsToResolve: number[]; // Cell IDs with conflicts at month-end
  currentCombatInView: CellCombatState | null;
  campaignOver: boolean;
  // Phase 3: set when the player reaches Rank 1 at an Annual Report. Halts
  // further weekly/monthly/annual cycling (campaignOver is set alongside
  // it). null until/unless the ending fires.
  endingEvent: EndingEvent | null;
  logs: { date: GameDate; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
}

// MapCell re-exported with Planet of Greed's extension (currently identical
// to base, but reserved for future fields).
export type MapCell = BaseMapCell;
