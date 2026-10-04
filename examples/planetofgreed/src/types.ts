export type UnitType = 'circle' | 'square' | 'triangle';

export interface Point {
  x: number;
  y: number;
}

// The six Cultures, in real hue-order wheel sequence (OperatorGame_Vision.docx
// §8.3): Ember -> Marsh -> Gale -> Tundra -> Crystal -> Tide -> (back to Ember).
// Ember/Tundra are wheel-opposite -- the confirmed "Fault Line" rival pair.
export type CultureId = 'ember' | 'marsh' | 'gale' | 'tundra' | 'crystal' | 'tide';

export interface Corporation {
  id: string;
  name: string;
  color: string; // Hex color for maps
  borderColor: string; // Hex border color
  bgClass: string; // Tailwind bg class
  textClass: string; // Tailwind text class
  isPlayer: boolean;
  cultureId: CultureId;
  treasury: number;
  scoutedCells: { [cellId: number]: boolean };
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

export interface UnitGroup {
  circle: number;
  square: number;
  triangle: number;
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
  neighbors: number[]; // Adjacent cell IDs
  ownerId: string | null; // Corp ID or null
  units: UnitGroup;
  fortification: number; // 0 to 3
  recruitmentQueue: RecruitmentItem[];
  preferredProduction: UnitType;
  productionProgress: number; // 0 to 2 weeks
  // Population Balance, 0-100, defaults to 50 (neutral). Optional at the
  // type level ONLY because mapGenerator.ts is read-only this phase (Phase
  // 2 scope) and does not construct this field on its cell literals.
  // App.tsx's initializeNewGame normalizes every real cell to a concrete
  // 50 immediately after map generation, before any game state exists --
  // treat as a real, always-present number in all consuming code; read via
  // `cell.publicOpinion ?? 50` only as defensive belt-and-suspenders.
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

export type OrderType = 'hold' | 'expand' | 'reinforce' | 'fortify' | 'scan' | 'civic';

export type WeeklyOrder =
  | { type: 'hold' }
  | { type: 'expand'; targetCellId: number; unitsSent: UnitGroup }
  | { type: 'reinforce'; reinforceType: UnitType }
  | { type: 'fortify' }
  | { type: 'scan'; targetCellId: number }
  | { type: 'civic'; focus: 'production' | 'defense' | 'unrest' };

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  targetCellId: number;
  choices: {
    text: string;
    cost: number;
    unitsCost?: UnitGroup;
    effectText: string;
    action: (state: any, cellId: number) => { log: string; stateUpdates: any };
  }[];
}

export interface CombatLogEntry {
  round: number;
  message: string;
  survivingUnits: { [corpId: string]: UnitGroup };
}

export interface CellCombatState {
  cellId: number;
  cellName: string;
  initialUnits: { [corpId: string]: UnitGroup };
  roundsLog: CombatLogEntry[];
  victorId: string | null;
  finalUnits: { [corpId: string]: UnitGroup };
  fortificationsLost: number;
}

export interface GameDate {
  year: number;
  month: number;
  week: number;
  day: number;
}

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
