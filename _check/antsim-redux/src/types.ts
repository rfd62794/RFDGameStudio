import { PheromoneGrid } from './pheromones';

export interface FoodItem {
  id: number;
  x: number;
  y: number;
  amount: number; // fixed at 1 for now, matching the existing unit convention
  carrierAntId?: number; // undefined only becomes meaningful once Phase 4f adds drops
  ownerColonyId: number; // whose Storage this is ultimately bound for
}

export interface Colony {
  id: number;
  surfaceY: number;
  direction: 1 | -1; // +1 = chambers are at greater y than surfaceY (dig upward to reach it); -1 = chambers are at lesser y (dig downward)
  nest: Nest;
  queen: Queen;
  chambers: Chamber[];
  tunnels: Tunnel[];
  ants: Ant[];
  eggs: Egg[];
  foodItems: FoodItem[];
  pheromones: PheromoneGrid;
}

export type AntAction = 'forage_direct' | 'follow_trail' | 'return_to_nest' | 'transport_egg' | 'idle' | 'dig_tunnel' | 'awaiting_dig_slot' | 'infiltrate' | 'smuggle_home';

export interface WayPoint {
  x: number;
  y: number;
}

export interface Ant {
  id: number;
  colonyId?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number; // 0.0 - 1.0
  health: number; // 0.0 - 1.0, matches normalized convention
  age: number; // ticks since spawn
  zeroEnergyTicks?: number;
  carryingFood: boolean;
  carryingEgg?: boolean;
  currentAction: AntAction;
  targetX?: number;
  targetY?: number;
  targetChamberId?: number;
  waypointPath?: WayPoint[];
  waypointIndex?: number;
  combatAction?: 'engage' | 'flee'; // this tick's Agency decision, undefined when no encounter is active
  combatAllyCount?: number;
  combatEnemyCount?: number;
  lastDamageSource?: 'combat' | 'other'; // set whenever damageAnt is called, read by death-cleanup
  wanderTicksRemaining?: number;
}

export type EggState = 'queen_chamber' | 'carried' | 'nursery';

export interface Egg {
  id: number;
  x: number;
  y: number;
  incubationSeconds: number;
  state: EggState;
  carrierAntId?: number;
  careLevel: number; // 0.0 - 1.0
  isRoyalCandidate?: boolean;
}

export interface Nest {
  x: number;
  y: number;
  radius: number;
  foodStore: number;
  population: number;
  spawnProgress: number;
  isQueenless?: boolean;
  tunnelDug?: boolean;
  tunnelDugProgress?: number;
}

export type ChamberType = 'storage' | 'nursery' | 'queen';

export interface Chamber {
  id: number;
  name: string;
  chamberType: ChamberType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tunnel {
  id: number;
  chamberAId: number; // 0 for surface entrance
  chamberBId: number;
  waypoints: WayPoint[];
}

export interface FoodNode {
  id: number;
  x: number;
  y: number;
  quantity: number;
  maxQuantity: number;
  respawnRate: number; // units per tick
}

export interface Queen {
  x: number;
  y: number;
  radius: number;
  queenHealth: number; // 0.0 - 1.0
  isDead?: boolean;
  zeroHealthElapsedSeconds?: number;
}

export interface PheromoneGridConfig {
  width: number;
  height: number;
  cellSize: number;
  emitStrength: number;
  decayRate: number;
  followThreshold: number;
  maxCellStrength: number;
}

export interface SimConfig {
  width: number;
  height: number;
  groundLevelY: number;
  directSensingRange: number;
  nestReachRadius: number;
  foodReachRadius: number;
  antSpeed: number;
  initialPopulation: number;
  foodCostPerAntSpawn: number;
  explorationChance: number;
  eggIncubationSeconds?: number;
  eggLayChance?: number;
  tunnelDigTarget?: number;
  tunnelDigRatePerAnt?: number;
  maxConcurrentDiggers?: number;
  workerMaxAge?: number;
  encounterRadius?: number;
  baseRequiredRatio?: number;
  baseCombatDamage?: number;
  theftChance?: number;
  theftAmount?: number;
  pheromone: PheromoneGridConfig;
}
