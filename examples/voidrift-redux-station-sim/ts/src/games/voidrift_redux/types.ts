export type CompoundState = 'gas' | 'liquid' | 'solid';

export interface Compound {
  id: string;
  name: string;
  state: CompoundState;
  color: string;
  description: string;
  tier: 1 | 2 | 3;
  baseVolatility?: number; // Gas volatility factor
  corrosiveness?: number; // Liquid corrosiveness / degradation
  mass?: number; // Solid mass
}

export interface ContainerSlot {
  id: string;
  stateType: CompoundState | 'dust';
  compoundId: string | null;
  amount: number;
  capacity: number;
  integrity: number; // 0-100%
  isBreached: boolean;
  moduleId?: string;
}

export type ModuleType =
  | 'drone_bay'
  | 'processing_chamber'
  | 'containment_gas'
  | 'containment_liquid'
  | 'containment_solid'
  | 'containment_dust'
  | 'power_cell'
  | 'signal_array'
  | 'hull_plating'
  | 'ship_hangar';

export interface ModuleBlueprint {
  type: ModuleType;
  name: string;
  category: 'drone' | 'synthesis' | 'storage' | 'power' | 'defense' | 'signal';
  dustCost: number;
  description: string;
  icon: string;
  powerCost: number; // positive = consumes, negative = generates
  maxHealth: number;
  containerState?: CompoundState | 'dust';
  unlockedByDefault: boolean;
  requiredKeyId?: string;
}

export interface StationModule {
  id: string;
  type: ModuleType;
  x: number;
  y: number;
  level: number;
  health: number;
  maxHealth: number;
  isPowered: boolean;
  efficiency: number;
  containerSlotId?: string;
  activeRecipeId?: string | null;
  processingProgress?: number;
  warning?: string | null;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  tier: 1 | 2 | 3;
  mineralType: string;
  composition: {
    dust: number;
    compoundId: string;
    compoundAmount: number;
  };
  color?: string;
  rotation?: number;
  rotationSpeed?: number;
  isTargeted?: boolean;
}

export interface Drone {
  id: string;
  name: string;
  state: 'idle' | 'seeking' | 'mining' | 'returning';
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetAsteroidId?: string | null;
  laserActive?: boolean;
  laserTarget?: { x: number; y: number } | null;
  cargo: {
    dust: number;
    compounds: Record<string, number>;
  };
  maxCargo: number;
  miningSpeed: number;
  assignedBayId?: string;
}

export interface SynthesisRecipe {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  inputs: Array<{
    compoundId: string;
    amount: number;
  }>;
  powerCost: number;
  durationSeconds: number;
  outputProduct: {
    type: 'compound_product' | 'key' | 'special';
    productId: string;
    amount: number;
  };
  unlockedByDefault: boolean;
  requiredKeyId?: string;
}

export interface CompoundProductItem {
  id: string;
  name: string;
  count: number;
  effectDescription: string;
  iconName: string;
}

export interface ReconstructionItem {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  type: 'Entity' | 'Planet' | 'Star';
  description: string;
  loreBackstory: string;
  requiredInputs: Array<{
    inputId: string;
    amount: number;
  }>;
  dustCost: number;
  reconstructionDuration: number;
  progress: number;
  isReconstructing: boolean;
  isCompleted: boolean;
  iconType: string;
  visualDetails?: {
    color: string;
    glow: string;
    symbol: string;
  };
}

export interface SignalBottle {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  worldX: number;
  worldY: number;
  vx: number;
  vy: number;
  status: 'drifting' | 'retrieved' | 'decoding' | 'decoded';
  decodingProgress: number;
  decodingDuration: number;
  payload: {
    keyId?: string;
    loreId?: string;
    dustBonus?: number;
  };
}

export interface SignalKey {
  id: string;
  name: string;
  category: 'recipe' | 'detection' | 'blueprint' | 'special';
  description: string;
  unlocked: boolean;
}

export interface LoreEntry {
  id: string;
  title: string;
  timestamp: string;
  author: string;
  content: string;
  discovered: boolean;
}

export interface CollisionEventLog {
  id: string;
  timestamp: number;
  moduleName: string;
  modulePos: { x: number; y: number };
  damage: number;
  compoundLoss?: {
    compoundId: string;
    name: string;
    amount: number;
  };
  debrisDustAwarded: number;
  resolved?: boolean;
}

export interface StationStats {
  totalDustMined: number;
  totalCompoundsHarvested: number;
  totalSynthesisRuns: number;
  totalBottlesDecoded: number;
  totalReconstructedEntities: number;
  collisionsDeflected: number;
}

export interface ExpeditionShip {
  id: string;
  name: string;
  status: 'docked' | 'exploring' | 'returning';
  fuel: number;
  maxFuel: number;
}

export interface GameState {
  dust: number;
  maxDust: number;
  powerGenerated: number;
  powerConsumed: number;
  modules: StationModule[];
  containerSlots: ContainerSlot[];
  drones: Drone[];
  asteroids: Asteroid[];
  signalBottles: SignalBottle[];
  signalKeys: SignalKey[];
  loreEntries: LoreEntry[];
  products: Record<string, CompoundProductItem>;
  reconstructionItems: ReconstructionItem[];
  collisionLogs: CollisionEventLog[];
  stats: StationStats;
  selectedModuleId: string | null;
  buildingTypeToPlace: ModuleType | null;
  isPaused: boolean;
  gameSpeed: number;
  prestigeMultiplier: number;
  nextBottleSpawnTimer: number;
  nextAsteroidSpawnTimer: number;
  notification: {
    message: string;
    type: 'info' | 'success' | 'warn' | 'danger';
    timestamp: number;
  } | null;
}
