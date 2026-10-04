/**
 * KingMaker Squads - Types Definition
 */

export type UnitArchetype = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen';

export type RankTier = 'recruit' | 'veteran' | 'elite';

export type Zodiac =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export interface UnitStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  range: number; // 1 = melee, 2+ = ranged
}

export interface UnitState {
  id: string;
  name: string;
  archetype: UnitArchetype;
  rank: RankTier;
  zodiac: Zodiac;
  isPermanent: boolean; // True for Veteran & Elite (cannot be sold or rerolled)
  isKing: boolean; // True if unit holds the crown
  hasHonorScar: boolean; // True if unit survived being Dethroned
  survivalFights: number; // Fights survived toward next Rank
  stats: UnitStats;
  cost: number;
  squadSlot?: number | null; // 0..maxSquadSize-1 or null if on bench
  squadId?: string | null; // 'forward' | 'defense_cell_id' | null
  isEscort?: boolean; // Assigned Knight escort for King
}

export type SynergyType =
  | 'bishop_pair'
  | 'knight_outpost'
  | 'battery'
  | 'royal_guard'
  | 'pawn_phalanx'
  | 'iron_vanguard'
  | 'shadow_flankers'
  | 'holy_sanctum'
  | 'celestial_alignment';

export interface SynergyBonus {
  type: SynergyType;
  name: string;
  countNeeded: number;
  currentCount: number;
  description: string;
  isActive: boolean;
}

export type HouseId = 'ember' | 'marsh' | 'gale' | 'tundra' | 'crystal' | 'tide';

export type FactionId = 'player' | 'marsh' | 'gale' | 'tundra' | 'crystal' | 'tide';

export interface Faction {
  id: FactionId;
  name: string;
  color: string;
  bannerBg: string;
  borderColor: string;
  description: string;
}

export type CellType = 'capital' | 'fortress' | 'pass' | 'outpost' | 'plains';

export type WardSubType =
  | 'slum'
  | 'patriciate'
  | 'merchant'
  | 'craftsmen'
  | 'military'
  | 'administration'
  | 'common'
  | 'fortress'
  | 'outpost';

export interface WardPlot {
  polygonPoints: [number, number][];
  buildingType?: string;
}

export interface TerritoryCell {
  id: string;
  name: string;
  x: number;
  y: number;
  polygonPoints: [number, number][]; // SVG polygon coordinates
  neighborIds: string[]; // Computed shared-edge neighbor cell IDs
  owner: FactionId;
  houseId?: HouseId; // House identity on District
  isCapitalCell?: boolean;
  type: CellType;
  wardSubType?: WardSubType;
  density?: number;
  plots?: WardPlot[];
  threatLevel: number;
  troopCount: number;
  scouted: boolean; // Fog of War state
  autoGenLeaderId?: string; // Permanent AutoGen leader ID
  autoGenLeaderUnit?: UnitState; // Permanent AutoGen leader unit state
  enemyUnits?: UnitState[];
  hasKing?: boolean; // Enemy or Player King cell
  settlingTurnsLeft?: number; // 1-2 turns settling period after coronation when location is visible
  defenseBonus?: number;
  isExposed?: boolean;
  assignedDefenseForceId?: string | null;
  publicOpinion?: number; // 0-100 scale, district sentiment toward holding faction
  isoGridAnchor?: { x: number; y: number }; // Top-left anchor point in cell SVG coordinate space
  isoGridCols?: number; // Sub-grid width in tiles
  isoGridRows?: number; // Sub-grid height in tiles
  isoBuildingLayout?: string[][]; // Isometric building tile keys per position, e.g. [['keep', 'wall'], ['wall', 'gate']]
}

export interface DefenseForce {
  id: string;
  cellId: string;
  name: string;
  units: UnitState[];
  autoGenLeaderId?: string; // Permanent, never null, never regenerated
  stewardUnitId?: string | null; // Roster unit assigned as Steward to this district
  kingUnitId?: string | null; // Backwards compatibility for single leader role
  settlingTurnsLeft?: number; // Settling window
  loyalty?: number; // 0-100 scale, Force unit allegiance/waver metric
}

export interface CombatUnit extends UnitState {
  currentHp: number;
  position: { x: number; y: number };
  team: 'player' | 'enemy';
  initiative: number;
  targetId?: string | null;
}

export interface CombatAction {
  turn: number;
  actorId: string;
  actorName: string;
  actorTeam: 'player' | 'enemy';
  actionType: 'move' | 'attack' | 'heal' | 'shield' | 'ability' | 'escort_save' | 'defeat';
  targetId?: string;
  targetName?: string;
  value?: number;
  isCritical?: boolean;
  gridFrom?: { x: number; y: number };
  gridTo?: { x: number; y: number };
  description: string;
}

export interface CombatFrame {
  step: number;
  units: CombatUnit[];
  log: CombatAction;
}

export interface CombatResult {
  winner: 'player' | 'enemy';
  frames: CombatFrame[];
  playerSurvivors: UnitState[];
  playerCasualties: UnitState[];
  enemySurvivors: UnitState[];
  enemyCasualties: UnitState[];
  kingAction?: 'killed' | 'escaped_dethroned' | 'victorious' | 'none';
  dethronedUnit?: UnitState;
  newKingUnit?: UnitState;
}

export interface BattleLog {
  id: string;
  turn: number;
  cellId: string;
  cellName: string;
  winner: FactionId;
  summary: string;
  kingInvolved: boolean;
  kingOutcome?: string;
  playerCasualtyNames: string[];
  playerSurvivorNames: string[];
}

export type ActionIntent = 'attack' | 'reinforce' | 'withdraw';

export interface DeclaredAction {
  id: string;
  factionId: FactionId;
  actionIntent: ActionIntent;
  targetCellId: string;
  originCellId?: string;
  assignedUnits: UnitState[];
  isResponse?: boolean;
  reinforcementPenaltyPaid?: boolean;
}

export interface GameState {
  turn: number;
  gold: number;
  shopLevel: number;
  shopUpgradeCost: number;
  rerollCost: number;
  maxSquadSize: number;
  units: UnitState[]; // Player's units (bench + squad)
  shopPool: UnitState[];
  cells: TerritoryCell[];
  kingUnitId: string | null; // The CAPITAL's King only. Defense Force Kings live on DefenseForce.kingUnitId. Forward Vanguard has no King.
  commanderUnitId: string | null; // Forward Vanguard's leader. NOT a King. No coronation/settling/stakes.
  kingSettlingTurns: number; // Settlement vulnerability
  hasEscortAssigned: boolean;
  battleLogs: BattleLog[];
  selectedCellId: string | null;
  selectedSquadId?: string;
  gamePhase: 'shop' | 'pre_turn_declaration' | 'pre_turn_response' | 'placement' | 'map' | 'combat' | 'game_over' | 'victory';
  combatResult: CombatResult | null;
  activeCombatCellId: string | null;
  declaredActions: DeclaredAction[];
  turnOrder: FactionId[];
  reinforcementPenaltyGold: number;
  defenseForces: DefenseForce[];
  squadOutflowThisTurn: Record<string, number>; // squadId -> number of units transferred out this turn
  proposedDefenseRelocation?: {
    fromDefenseForceId: string;
    toCellId: string;
    status: 'proposed' | 'accepted' | 'rejected';
  } | null;
  lastCoronationEvent?: {
    unitName: string;
    archetype: UnitArchetype;
    reason: string;
  } | null;
  marshOutline?: [number, number][]; // Region outline polygon for Marsh silhouette
  lastBrokenForceEvent?: {
    forceName: string;
    cellName: string;
    occupyingFaction: FactionId;
  } | null;
}
