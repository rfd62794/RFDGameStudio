export type CompoundState = 'gas' | 'liquid' | 'solid';

export interface Compound {
  id: string;
  name: string;
  state: CompoundState;
  color: string;
  description: string;
  tier: 1 | 2 | 3;
  baseVolatility?: number; // Gas volatility
  corrosiveness?: number; // Liquid flask degradation rate
  mass?: number; // Solid weight
}

export interface ContainerSlot {
  id: string;
  stateType: CompoundState | 'dust';
  compoundId: string | null; // which compound is inside, or null if empty
  amount: number;
  capacity: number;
  integrity: number; // 0-100%
  isBreached: boolean;
  moduleId?: string; // linked to station module
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
  containerState?: 'gas' | 'liquid' | 'solid' | 'dust';
  unlockedByDefault: boolean;
  requiredKeyId?: string;
}

export interface StationModule {
  id: string;
  type: ModuleType;
  x: number; // Grid coordinates (-10 to 10)
  y: number;
  level: number;
  health: number; // 0-100%
  maxHealth: number;
  activeRecipeId?: string | null;
  processingProgress?: number; // 0-100%
  assignedDroneCount?: number;
  isPowered: boolean;
  efficiency: number; // calculated from adjacency and power
  warning?: string | null;
  containerSlotId?: string; // if it is a containment module
}

export interface Asteroid {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  x: number; // world space coordinates
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  totalOre: number;
  currentOre: number;
  dustYield: number;
  compoundYields: { compoundId: string; amount: number }[];
  color: string;
  shapePoints: number[]; // random polygon offsets
  targetedByDrones: number;
  trajectoryTowardsStation: boolean;
  collisionWarning?: boolean;
}

export interface Drone {
  id: string;
  bayId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'idle' | 'flying_to_target' | 'mining' | 'returning' | 'repairing';
  targetAsteroidId: string | null;
  targetModuleId?: string | null;
  cargo: {
    dust: number;
    compounds: { [compoundId: string]: number };
  };
  cargoCapacity: number;
  laserAngle?: number;
  miningTimer?: number;
  energy: number;
}

export interface SynthesisRecipe {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  inputs: { compoundId: string; amount: number }[];
  dustCost?: number;
  powerCost: number;
  outputProduct: {
    type: 'compound_product' | 'power_product' | 'reconstruction_input';
    id: string;
    name: string;
    amount: number;
  };
  durationSeconds: number;
  unlockedByDefault: boolean;
  requiredKeyId?: string;
}

export interface CompoundProductItem {
  id: string;
  name: string;
  description: string;
  count: number;
  effectDescription: string;
  iconName: string;
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
  decodingProgress: number; // 0 to 100
  decodingDuration: number; // seconds
  rewardType: 'signal_key' | 'coordinates' | 'lore';
  rewardKeyId?: string;
  rewardCoordinates?: {
    name: string;
    description: string;
    distance: number;
    estimatedYield: string;
    tier: 2 | 3;
  };
  rewardLoreId?: string;
}

export interface SignalKey {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  category: 'recipe' | 'blueprint' | 'tier' | 'reconstruction';
}

export interface LoreEntry {
  id: string;
  title: string;
  timestamp: string;
  author: string;
  content: string;
  discovered: boolean;
}

export interface ReconstructionItem {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  type: 'Entity' | 'Phenomenon' | 'Structure' | 'Planet' | 'Star';
  description: string;
  loreBackstory: string;
  requiredInputs: { inputId: string; amount: number }[];
  dustCost: number;
  reconstructionDuration: number; // seconds
  progress: number; // 0 to 100
  isReconstructing: boolean;
  isCompleted: boolean;
  completedAt?: number;
  iconType: string;
  visualDetails?: {
    color: string;
    glow: string;
    symbol: string;
  };
}

export interface ExpeditionShip {
  id: string;
  name: string;
  state: 'docked' | 'traveling' | 'harvesting' | 'returning';
  destinationName?: string;
  targetTier?: 2 | 3;
  totalDuration: number;
  elapsedTime: number;
  cargoReward?: {
    dust: number;
    compounds: { compoundId: string; amount: number }[];
    signalBottle?: SignalBottle;
  };
  health: number;
}

export interface CollisionEventLog {
  id: string;
  timestamp: number;
  moduleName: string;
  modulePos: { x: number; y: number };
  damage: number;
  compoundLoss?: { name: string; amount: number };
  dustRepaired: number;
  resolved: boolean;
}

export interface StationStats {
  totalDustMined: number;
  totalCompoundsProcessed: number;
  totalAsteroidsMined: number;
  totalBottlesDecoded: number;
  totalEntitiesReconstructed: number;
  totalCollisionsDefended: number;
  starsReconstructed: number;
  prestigeMultiplier: number;
  startTime: number;
}
