export type SlimeColor = 'Red' | 'Blue' | 'Yellow' | 'Purple' | 'Orange' | 'Green' | 'Gray';

export type SlimePattern = 'Solid' | 'Stripe' | 'Polka' | 'Glow' | 'Crown' | 'Ringed' | 'Nebula' | 'Obsidian';

export type LifeStage = 'Hatchling' | 'Juvenile' | 'Young' | 'Prime' | 'Veteran' | 'Elder';

export interface SlimeStats {
  hp: number;
  atk: number;
  def: number;
  agi: number;
  int: number;
  chm: number;
}

export interface Slime {
  id: string;
  name: string;
  color: SlimeColor;
  pattern: SlimePattern;
  level: number;
  xp: number;
  stats: SlimeStats;
  role: 'idle' | 'dispatch' | 'corporate';
  generation: number;
  colorSaturation?: number;
  hue?: number;
  saturation?: number;
  vertexCount?: number;   // 3.0 - 22.0+
  irregularity?: number;  // 0-100%
  parentA?: string;
  parentB?: string;
  createdAt: number;
  lockedRole?: 'dispatch' | 'mediation' | 'worker' | 'exploration' | 'garrison' | null;
  garrisonedAt?: string | null;
  stage?: LifeStage; // Computed live/dynamically across the system to prevent synchronization issues
}

export interface CorporateContract {
  id: string;
  title: string;
  requiredColor: SlimeColor;
  requiredPattern: SlimePattern;
  creditsReward: number;
  cyclesRemaining: number;
  totalCycles: number;
  flavorText: string;
}

export interface CombatZone {
  id: string;
  name: string;
  requiredColor: SlimeColor;
  recommendedLevel: number;
  difficulty: number; // 1 to 5
  creditsReward: number;
  xpReward: number;
  isUnlocked: boolean;
  isFirstClearCompleted: boolean;
  flavorText: string;
}

export interface ActiveDispatch {
  id: string;
  zoneId: string;
  slimeIds: string[];
  cyclesRemaining: number; // typically 1 cycle for simple MVPs, but can have real-time ticks
  totalDurationMs: number;
  startedAt: number;
  status: 'active' | 'completed' | 'failed';
}

export interface LogEntry {
  id: string;
  cycle: number;
  timestamp: string;
  text: string;
  type: 'system' | 'corporate' | 'breeding' | 'combat' | 'melancholy';
}

export interface MarketSaleRecord {
  color: SlimeColor;
  cycle: number;
}

export interface PlanetNode {
  id: string;
  name: string;
  cellShape: string; // SVG arc path data
  labelX: number; // X coordinate for text label
  labelY: number; // Y coordinate for text label
  neighbors: string[]; // adjacency via shared borders
  ownerColor: SlimeColor | null; // null = unclaimed
  pressure: Partial<Record<SlimeColor, number>>; // pressure exerted by different colors
  strength: number; // 0-1, how firmly held
  isCapitol: boolean;
  isSupplied: boolean;
  distanceFromCenter: number; // real value, determines ring band
  discovered: boolean; // capitols are always true; fog only applies to future territory
  garrisonSlimeId?: string | null;
}

export interface PlanetRegion {
  nodes: PlanetNode[];
  generatedAt: number;
  geometryVersion?: number;
}

export interface MediationMission {
  id: string;
  targetNodeId: string;
  slimeIds: string[];
  cyclesRemaining: number;
  totalDurationMs: number;
  startedAt: number;
  status: 'active' | 'completed' | 'failed';
}

export interface ExplorationMission {
  id: string;
  targetNodeId: string;
  slimeIds: string[];
  cyclesRemaining: number;
  totalDurationMs: number;
  startedAt: number;
  status: 'active' | 'completed' | 'failed';
}

export interface CodexEntry {
  discovered: boolean;
  discoveredAt?: number;
  hintRevealed: boolean; // true once the player owns one of the two ingredients for a known recipe
}

export interface LabState {
  cycle: number;
  credits: number;
  slimes: Slime[];
  contracts: CorporateContract[];
  zones: CombatZone[];
  activeDispatch: ActiveDispatch | null;
  logs: LogEntry[];
  rosterCap: number;
  breedingSuccessRateModifier: number; // Upgradable stabilizer
  recentMarketSales?: MarketSaleRecord[]; // Optional for backwards compatibility, handled in code
  planetRegion?: PlanetRegion | null;
  wildsRegion?: PlanetRegion | null;
  wildsUnlocked?: boolean;
  activeMediation?: MediationMission | null;
  activeExploration?: ExplorationMission | null;
  colorCodex?: Record<SlimeColor, CodexEntry>;
  patternCodex?: Record<SlimePattern, CodexEntry>;
  regentInventory?: Partial<Record<SlimePattern, number>>; // count of unspent Regents, per pattern
  colorRegentInventory?: Partial<Record<SlimeColor, number>>; // count of unspent Regents, per color
  hasAutoFeeder?: boolean;
  cultureRelationships?: Record<SlimeColor, number>;
  lastBredHues?: { hue1: number; hue2: number; streak: number };
  colorTargetCodex?: Record<string, boolean>;
  targetRegentInventory?: Record<string, number>;
  shapeTargetCodex?: Record<string, boolean>;
  shapeTargetRegentInventory?: Record<string, number>;
}
