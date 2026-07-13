export type UnitType = 'circle' | 'square' | 'triangle';

export interface Point {
  x: number;
  y: number;
}

export interface Corporation {
  id: string;
  name: string;
  color: string; // Hex color for maps
  borderColor: string; // Hex border color
  bgClass: string; // Tailwind bg class
  textClass: string; // Tailwind text class
  isPlayer: boolean;
  treasury: number;
  scoutedCells: { [cellId: number]: boolean };
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

export type OrderType = 'idle' | 'expand' | 'reinforce' | 'fortify' | 'scan';

export interface WeeklyOrder {
  cellId: number;
  type: OrderType;
  targetCellId?: number; // For expand / scan
  unitsSent?: UnitGroup; // For expand
  reinforceType?: UnitType; // For reinforce
}

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

export interface GameState {
  date: GameDate;
  cells: MapCell[];
  corporations: Corporation[];
  transits: UnitTransit[];
  playerOrders: { [cellId: number]: WeeklyOrder };
  isSimulating: boolean;
  simulationSpeed: number; // 1 = normal, 2 = fast, 4 = turbo
  currentActiveEvent: GameEvent | null;
  eventHistory: { date: GameDate; title: string; resolution: string }[];
  combatHistory: { date: GameDate; cellId: number; cellName: string; victorId: string | null; log: CellCombatState }[];
  activeCombatsToResolve: number[]; // Cell IDs with conflicts at month-end
  currentCombatInView: CellCombatState | null;
  campaignOver: boolean;
  logs: { date: GameDate; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
}
