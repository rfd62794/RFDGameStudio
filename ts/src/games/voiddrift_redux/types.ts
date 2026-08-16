export type MiningFSMState = 'Holding' | 'Dispatched' | 'Traveling' | 'Mining' | 'Returning';

export type HaulerFSMState = 'Docked' | 'Dispatched' | 'Traveling' | 'Latched' | 'Tugging' | 'Released' | 'Returning';

export type FSMState = MiningFSMState | HaulerFSMState;

export type DroneRole = 'Scout' | 'Mining' | 'Hauler';

export type ResourceType = 'Metal' | 'RawAluminum' | 'Aluminum' | 'H3Gas';

export interface Fragment {
  id: string;
  x: number;
  y: number;
  ring: 2;
  resourceType: ResourceType;
  amount: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  vx: number;
  vy: number;
  isTargeted: boolean;
  targetedByDroneId?: string;
  size: number;
}

export interface ConversionProcess {
  id: string;
  inputResource: ResourceType;
  inputAmount: number;
  outputResource: ResourceType;
  outputAmount: number;
  durationSec: number;
  elapsedSec: number;
  status: 'pending' | 'processing' | 'complete';
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  ring: 1 | 2;
  isMedium: boolean;
  gasAmount: number; // 0 = no gas, >0 = gas-bearing medium asteroid
  isDrilledInPlace?: boolean;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number; // radians per second
  metalAmount: number;
  maxMetal: number;
  resourceType: ResourceType;
  isDetected: boolean;
  detectedByScoutId?: string;
  isTargeted: boolean; // currently claimed by a mining drone or hauler
  targetedByDroneId?: string;
  isTuggedByHaulerId?: string | null;
  isDepleted: boolean;
  size: number;
  rotation: number;
  rotationSpeed: number;
  spawnTime?: number; // timestamp when materialized
}

export interface Scout {
  id: string;
  name: string;
  x: number;
  y: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  scanRadius: number;
  scanAngle: number; // radar sweep angle
  targetsInProximityCount: number;
  color: string;
}

export interface Drone {
  id: string;
  name: string;
  role: DroneRole;
  tier?: 1 | 2; // Tier 1 Standard, Tier 2 Mk II Breakers
  state: FSMState;
  x: number;
  y: number;
  targetAsteroidId: string | null;
  targetFragmentId?: string | null;
  targetPos: Vector2D | null;
  cargo: number;
  maxCargo: number;
  cargoType?: ResourceType;
  miningProgress: number; // 0 to 1
  miningDuration: number; // seconds required
  miningTimeElapsed: number; // seconds
  tugProgress?: number; // 0 to 1 while tugging
  speed: number;
  color: string;
  completedMissions: number;
  totalMetalCollected?: number;
  totalResourcesCollected?: number;
  totalAsteroidsTugged?: number;
  dispatchTime?: number;
  lastCycleDurationSec?: number;
  trail: Vector2D[];
}

export interface DispatchLog {
  id: string;
  timestamp: string;
  droneName: string;
  targetId: string;
  action: 'INITIALIZE' | 'DETECTED' | 'DISPATCHED' | 'ARRIVED' | 'MINING_COMPLETE' | 'DEPOSITED' | 'LATCHED' | 'TUGGING' | 'RELEASED' | 'DOCKED' | 'DRILLING' | 'BURST' | 'FRAGMENT_RETRIEVED' | 'CONVERSION_START';
  details: string;
}

export interface BoundaryTelemetry {
  totalAsteroids: number;
  ring1AsteroidsCount: number;
  ring2AsteroidsCount: number;
  gasAsteroidsCount: number;
  fragmentsCount: number;
  asteroidsInScanRange: number;
  asteroidsOutsideScanRange: number;
  correctlyDetectedCount: number;
  correctlyIgnoredCount: number;
  detectionAccuracyPct: number;
  spawnCeilingRadius: number;
  scoutCeilingRadius: number;
  isBoundaryValid: boolean;
  ring2GatedMiningValid: boolean; // Confirms Mining Drones CANNOT mine Ring 2 directly
  totalSuccessfulTugs: number;
}

export interface SimulationStats {
  resources: Record<ResourceType, number>;
  conversions: ConversionProcess[];
  closedLoopsCompleted: number;
  successfulTugsCompleted: number;
  activeDispatches: number;
  detectedQueueLength: number;
  ring2QueueLength: number;
  avgCycleTimeSec: number;
  miningRatePerMin: number;
  boundaryTelemetry: BoundaryTelemetry;
  isRunning: boolean;
  simSpeed: number; // 1x, 2x, 5x, etc.
}

export interface SimulationConfig {
  scoutCount: number;
  miningDroneCount: number;
  haulerCount: number;
  scoutScanRadius: number;
  scoutSpeed: number;
  miningSpeed: number;
  haulerSpeed: number;
  miningCapacity: number;
  miningDurationSec: number;
  tugDurationSec: number;
  ring1InnerRadius: number;
  ring1OuterRadius: number;
  ring2InnerRadius: number;
  ring2OuterRadius: number;
  ring1AsteroidCount: number;
  ring2AsteroidCount: number;
  autoDispatch: boolean;
  showRadarBeams: boolean;
  showBoundaryRadii: boolean;
  showStateLabels: boolean;
  showTrails: boolean;
}
