/**
 * @file src/types.ts
 * Type declarations for The Line simulation.
 */

export type TaskType = 'protocol' | 'corner_cut' | 'rest' | 'eat_meal' | 'drink_coffee' | 'drink_water' | 'use_bathroom' | 'clean_bathroom' | 'discharge_meal' | 'clean_mess';
export type StationId = 'queue' | 'grill' | 'assembly' | 'window' | 'fryer' | 'coffee' | 'bathroom';
export type WorkerType = 'line_cook' | 'csr' | 'janitor_mechanic';

export interface Mess {
  id: string;
  x: number;
  y: number;
  source: 'worker_accident' | 'customer_food';
  createdTime: number;
}

export interface Customer {
  id: string;
  orderId?: string;
  orderQuality?: number;
  spawnTime: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifespanRemaining: number;
  state: 'waiting' | 'receiving' | 'leaving';
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  type: WorkerType;
  preferredStation?: StationId;
  primaryStation: StationId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stamina: number; // 0 to 1, depletes under load
  morale: number; // 0 to 1, restored by eating Staff Meal
  thirst: number; // 0 to 1, depletes over time
  bladderPressure: number; // 0 to 1, rises as worker eats/drinks
  currentTask: TaskType | null;
  currentStation: StationId | null; // station worker is currently working on
  claimedResource: StationId | null; // station worker is targeted towards or occupying
  taskProgress: number; // 0 to 1 progress on current station task
  color: string;
  coffeeBoostRemaining: number; // real decaying bonus applied to effective stamina
  stationNudgeBoostRemaining: number; // temporary ownership boost countdown
  stationStats: Record<StationId, { protocols: number; cornerCuts: number }>; // per-station stat tracking
  currentMeal?: { unitsRemaining: number } | null;
  // Stats for live stats
  totalCornerCuts: number;
  totalProtocols: number;
  totalRestTicks: number;
  totalMealTicks: number;
  breakTaskLockedSeconds: number;
  bladderCriticalElapsedSeconds?: number;
}

export interface Order {
  id: string;
  customerId?: string;
  wantsFries: boolean;
  burgerComplete: boolean;
  friesComplete: boolean;
  hadViolation?: boolean;
  quality: number; // REQUIRED, not optional — used directly in reward multiplication
}

export interface Station {
  id: StationId;
  name: string;
  occupiedBy: string | null; // Worker id, or null — this IS the Claimed state
  occupiedByWorkerId?: string | null;
  orders: Order[]; // Orders waiting in station buffer
  bufferCapacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  degradationStage?: number; // 0 = Healthy, 1 = Worn, 2 = Struggling, 3 = Broken
  batchQuality: number; // 0 to 100, station batch quality
  isOutOfOrder?: boolean;
  brokenElapsedSeconds?: number;
}

export interface Situation {
  id: string;
  stationId: StationId;
  stage: number; // 1 | 2 | 3
  initialStage: number;
  createdTime: number;
  elapsedSeconds: number;
}

export interface LogEvent {
  id: string;
  timestamp: number; // formatted string or elapsed seconds
  message: string;
  type: 'info' | 'warning' | 'violation' | 'success';
}

export type ManagerTaskType = 'supervise' | 'patrol' | 'rest' | 'drink_coffee' | 'repair' | 'clean_mess';

export interface ManagerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stamina: number; // 0 to 1
  coffeeBoostRemaining: number;
  currentTask: ManagerTaskType;
  taskProgress: number; // 0 to 1 task progress
  currentSuperviseTargetId: string | null;
  currentSuperviseTargetLockedSeconds: number;
}

export type GamePhase = 'intro' | 'day' | 'night' | 'game_over' | 'victory';

export interface KitchenState {
  workers: Worker[];
  stations: Station[];
  messes: Mess[];
  purchasedUpgrades: Record<string, boolean>; // 'buffer_capacity' | 'stock_capacity' | 'day_duration'
  stockCapacityBonus: number;
  unlockedStations: Record<StationId, boolean>;
  coffeeSalesUnlocked: boolean;
  brandEquity: number; // 0-100, the win/loss meter
  peerCorrCutNorm: number; // 0-1, contagion state, floor applied at read time only
  wasteBuffer: number; // accumulates automatically, discharged manually via Staff Meal
  mealAvailable: boolean; // unlocked when Staff Meal is discharged
  mealUnits: number; // remaining meal units in STAFF_AREA
  coffeePotUnits: number; // shared coffee pot units in STAFF_AREA
  stockUnits: number; // global ingredient stock units
  stockDepletedSeconds: number; // real, continuous — resets the instant stock is above 0
  autoRestockEnabled: boolean; // default false, player opt-in auto-restock
  demandTier: number; // current effective demand tier
  storeTier: number; // store tier baseline, increments upon surviving wave day
  nextEscalationTimer: number; // seconds until next demand escalation
  customers: Customer[]; // active visual customers
  policyDial: number; // 0 (Strict Protocol) to 1 (Max Throughput)
  gamePhase: GamePhase;
  dayNumber: number;
  cash: number;
  cashEarnedToday: number;
  tipsEarnedToday: number;
  cashSpentToday: number;
  elapsedSeconds: number;
  dayElapsedSeconds: number;
  dayDurationSeconds: number;
  manager: ManagerState;
  emergencyCallActive: boolean;
  
  // Rush state counters
  ordersServed: number;
  totalViolationsCaught: number;
  totalAbandonedOrders: number;
  totalCornerCutsTaken: number;
  totalProtocolTasks: number;

  logEvents: LogEvent[];
  isPaused: boolean;
  speedMultiplier: number;
  shopItemsEverAvailable: Record<string, boolean>;
  hasSeenCautionHint: boolean;

  // Equipment Degradation & Situation Queue
  committedRepairTask?: {
    stationId: StationId;
    stage: number;
    remainingSeconds: number;
    totalDuration: number;
  } | null;
  situationQueue?: Situation[];
  bathroomQueue?: string[];
}

export interface ActionCandidate {
  name: TaskType | ManagerTaskType;
  score: number;
}

export interface LiveStats {
  throughputPerMinute: number;
  violationRate: number;
  currentGrade: 'S' | 'A' | 'B' | 'C' | 'F';
  liveSummary: string;
}
