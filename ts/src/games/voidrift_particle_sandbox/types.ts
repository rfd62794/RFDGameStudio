export enum MaterialType {
  VACUUM = 0,
  DUST = 1,
  GAS = 2,
  LIQUID = 3,
  SOLID = 4,
  PLASMA = 5,
  VOID_CRYSTAL = 6,
  MINERAL_SLURRY = 7,
  REACTIVE_VAPOR = 8,
  CONDENSATE = 9,
  LUMINITE = 10,
  STRUCTURAL_SOLID = 11,
}

export interface MaterialDef {
  id: MaterialType;
  name: string;
  color: string; // Hex code
  rgb: [number, number, number];
  description: string;
  isSolid: boolean;
  isLiquid: boolean;
  isGas: boolean;
  isEmissive: boolean;
  glowColor?: string;
  glowRadius?: number;
  unlockedAtTier: number;
}

export const MATERIAL_DEFS: Record<MaterialType, MaterialDef> = {
  [MaterialType.VACUUM]: {
    id: MaterialType.VACUUM,
    name: 'Vacuum',
    color: '#0a0a1a',
    rgb: [10, 10, 26],
    description: 'Empty space. Materials move freely through it.',
    isSolid: false,
    isLiquid: false,
    isGas: false,
    isEmissive: false,
    unlockedAtTier: 1,
  },
  [MaterialType.DUST]: {
    id: MaterialType.DUST,
    name: 'Dust',
    color: '#c8b89a',
    rgb: [200, 184, 154],
    description: 'Falls downward and piles up with natural angle of repose. Compressible.',
    isSolid: false,
    isLiquid: false,
    isGas: false,
    isEmissive: false,
    unlockedAtTier: 1,
  },
  [MaterialType.GAS]: {
    id: MaterialType.GAS,
    name: 'Gas',
    color: '#7ab8d4',
    rgb: [122, 184, 212],
    description: 'Rises upward, disperses sideways, slowly dissipates in deep vacuum.',
    isSolid: false,
    isLiquid: false,
    isGas: true,
    isEmissive: false,
    unlockedAtTier: 1,
  },
  [MaterialType.LIQUID]: {
    id: MaterialType.LIQUID,
    name: 'Liquid',
    color: '#3a7abf',
    rgb: [58, 122, 191],
    description: 'Falls downward and flows horizontally to equalize. Spreads to lowest space.',
    isSolid: false,
    isLiquid: true,
    isGas: false,
    isEmissive: false,
    unlockedAtTier: 1,
  },
  [MaterialType.SOLID]: {
    id: MaterialType.SOLID,
    name: 'Natural Solid',
    color: '#6b7c6b',
    rgb: [107, 124, 107],
    description: 'Immovable bedrock from asteroid impacts. Indestructible.',
    isSolid: true,
    isLiquid: false,
    isGas: false,
    isEmissive: false,
    unlockedAtTier: 1,
  },
  [MaterialType.STRUCTURAL_SOLID]: {
    id: MaterialType.STRUCTURAL_SOLID,
    name: 'Structural Solid',
    color: '#9ab09a',
    rgb: [154, 176, 154],
    description: 'Player-crafted structural frame. Building block for machinery and channels.',
    isSolid: true,
    isLiquid: false,
    isGas: false,
    isEmissive: false,
    unlockedAtTier: 1,
  },
  [MaterialType.PLASMA]: {
    id: MaterialType.PLASMA,
    name: 'Plasma',
    color: '#ff6a00',
    rgb: [255, 106, 0],
    description: 'Rises fast (3 cells/tick). Highly reactive and short-lived. Emits heat.',
    isSolid: false,
    isLiquid: false,
    isGas: true,
    isEmissive: true,
    glowColor: '#ff6a00',
    glowRadius: 4,
    unlockedAtTier: 1,
  },
  [MaterialType.VOID_CRYSTAL]: {
    id: MaterialType.VOID_CRYSTAL,
    name: 'Void Crystal',
    color: '#b8a0ff',
    rgb: [184, 160, 255],
    description: 'Crystalline solid formed by Gas + Plasma. Stable and slowly pulsing.',
    isSolid: true,
    isLiquid: false,
    isGas: false,
    isEmissive: true,
    glowColor: '#b8a0ff',
    glowRadius: 4,
    unlockedAtTier: 2,
  },
  [MaterialType.MINERAL_SLURRY]: {
    id: MaterialType.MINERAL_SLURRY,
    name: 'Mineral Slurry',
    color: '#c8a04a',
    rgb: [200, 160, 74],
    description: 'Heavy, slow-flowing liquid formed from Liquid + Dust. Rich in mineral sediment.',
    isSolid: false,
    isLiquid: true,
    isGas: false,
    isEmissive: false,
    unlockedAtTier: 2,
  },
  [MaterialType.REACTIVE_VAPOR]: {
    id: MaterialType.REACTIVE_VAPOR,
    name: 'Reactive Vapor',
    color: '#ff4488',
    rgb: [255, 68, 136],
    description: 'Unstable, hyper-volatile gas. Rises 2x faster than normal gas.',
    isSolid: false,
    isLiquid: false,
    isGas: true,
    isEmissive: true,
    glowColor: '#ff4488',
    glowRadius: 3,
    unlockedAtTier: 3,
  },
  [MaterialType.CONDENSATE]: {
    id: MaterialType.CONDENSATE,
    name: 'Condensate',
    color: '#88aacc',
    rgb: [136, 170, 204],
    description: 'Dense cool liquid formed by cooling Gas with Liquid. Vital catalyst.',
    isSolid: false,
    isLiquid: true,
    isGas: false,
    isEmissive: false,
    unlockedAtTier: 2,
  },
  [MaterialType.LUMINITE]: {
    id: MaterialType.LUMINITE,
    name: 'Luminite',
    color: '#ffe080',
    rgb: [255, 224, 128],
    description: 'Rare radiant solid formed by Reactive Vapor + Void Crystal. Highly emissive.',
    isSolid: true,
    isLiquid: false,
    isGas: false,
    isEmissive: true,
    glowColor: '#ffe080',
    glowRadius: 8,
    unlockedAtTier: 3,
  },
};

export interface MaterialReaction {
  inputA: MaterialType;
  inputB: MaterialType;
  output: MaterialType;
  probability: number;
  description: string;
}

export const MATERIAL_REACTIONS: MaterialReaction[] = [
  {
    inputA: MaterialType.GAS,
    inputB: MaterialType.PLASMA,
    output: MaterialType.VOID_CRYSTAL,
    probability: 0.08,
    description: 'Gas + Plasma condense into Void Crystal',
  },
  {
    inputA: MaterialType.LIQUID,
    inputB: MaterialType.DUST,
    output: MaterialType.MINERAL_SLURRY,
    probability: 0.15,
    description: 'Liquid + Dust mix into Mineral Slurry',
  },
  {
    inputA: MaterialType.PLASMA,
    inputB: MaterialType.LIQUID,
    output: MaterialType.REACTIVE_VAPOR,
    probability: 0.12,
    description: 'Plasma boiling Liquid creates Reactive Vapor',
  },
  {
    inputA: MaterialType.GAS,
    inputB: MaterialType.LIQUID,
    output: MaterialType.CONDENSATE,
    probability: 0.05,
    description: 'Gas + Liquid cool into Condensate',
  },
  {
    inputA: MaterialType.REACTIVE_VAPOR,
    inputB: MaterialType.VOID_CRYSTAL,
    output: MaterialType.LUMINITE,
    probability: 0.06,
    description: 'Reactive Vapor crystallizing on Void Crystal yields Luminite',
  },
];

export enum BuildingCategory {
  COLLECTOR = 'COLLECTOR',
  CONTAINER = 'CONTAINER',
  PIPE = 'PIPE',
  PROCESSOR = 'PROCESSOR',
  WALL = 'WALL',
}

export enum ContainerType {
  GAS_TANK = 'GAS_TANK',
  LIQUID_FLASK = 'LIQUID_FLASK',
  SOLID_BIN = 'SOLID_BIN',
  DUST_HOPPER = 'DUST_HOPPER',
}

export enum ProcessorType {
  COMPRESSOR = 'COMPRESSOR',
  CONDENSER = 'CONDENSER',
  SEPARATOR = 'SEPARATOR',
  PLASMA_FORGE = 'PLASMA_FORGE',
  CATALYST_CHAMBER = 'CATALYST_CHAMBER',
}

export type MaterialState = 'gas' | 'liquid' | 'solid' | 'dust';

// Building tile coordinate (in building grid units: 40x25 grid, 1 tile = 8x8 CA cells)
export interface TilePos {
  tx: number;
  ty: number;
}

// Socket — connection point on a building edge
export interface SocketDef {
  id: string;
  // Position relative to building origin in tile units
  dtx: number; // e.g. 0 = left edge, tileW = right edge
  dty: number;
  side: 'top' | 'bottom' | 'left' | 'right';
  kind: 'input' | 'output';
  acceptedStates: MaterialState[]; // material states this socket handles
}

// Per-building filter state: which materials are allowed through each socket
export interface BuildingFilter {
  buildingId: string;
  // socketId -> set of allowed MaterialType values
  allowed: Record<string, Set<MaterialType>>;
}

export interface BuildingDef {
  id: string;
  name: string;
  shortLabel: string;
  category: BuildingCategory;
  tileW: number; // width in building tiles
  tileH: number; // height in building tiles
  width: number; // in CA cells (tileW * 8)
  height: number; // in CA cells (tileH * 8)
  cost: number; // In Structural Solid
  unlockedAtTier: number;
  description: string;
  containerType?: ContainerType;
  processorType?: ProcessorType;
  acceptedMaterials?: MaterialType[];
  sockets: SocketDef[];
}

export interface BuildingInstance {
  id: number;
  buildingId: string;
  category: BuildingCategory;
  tileX: number; // Position in building grid (0..39)
  tileY: number; // Position in building grid (0..24)
  tileW: number;
  tileH: number;
  x: number; // Top-left CA cell (tileX * 8)
  y: number; // Top-left CA cell (tileY * 8)
  width: number; // in CA cells
  height: number; // in CA cells

  // Sockets & Filters
  sockets: SocketDef[];
  filter: BuildingFilter;
  connected: Record<string, string | null>; // socketId -> connected pipe/building key

  // Storage properties
  targetMaterial?: MaterialType; // For selective collectors / containers
  universal?: boolean; // For Universal Collector
  buffer: Record<number, number>; // MaterialType -> quantity
  capacity: number;

  // Container specifics
  containerType?: ContainerType;

  // Processor specifics
  processorType?: ProcessorType;
  progress: number; // 0 to 1
  cooldownMax: number; // in seconds
  cooldownRemaining: number;
  catalystCount?: number;
  catalystRunsRemaining?: number;
  lastRunSuccess?: boolean;
}

export type PipeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface FlowParticle {
  // Position within the pipe's 8×8 CA cell footprint (0.0 to 1.0)
  localX: number;
  localY: number;
  // Progress along flow direction (0.0 = entry, 1.0 = exit)
  progress: number;
  // Speed scalar (1.0 = normal, <1.0 = backpressure slow)
  speed: number;
  material: MaterialType;
  opacity: number;
  size: number; // radius in screen pixels at 1× zoom, scales with zoom
}

export type PipeRouteState =
  | { mode: 'idle' }
  | {
      mode: 'drawing';
      startTile: TilePos;
      currentTile: TilePos;
      route: TilePos[];
      horizontalFirst: boolean;
      valid: boolean;
    };

export interface PipeNode {
  tileX: number;
  tileY: number;
  x: number; // CA cell
  y: number; // CA cell
  direction: PipeDirection;
  buffer: { material: MaterialType; amount: number }[];
  maxBuffer: number;
  connected: Record<'top' | 'bottom' | 'left' | 'right', string | null>;
  hasWarning?: boolean;
  flowParticles: FlowParticle[];
}

export interface ReconstructionEntity {
  id: string;
  name: string;
  description: string;
  color: string;
  requirements: Partial<Record<MaterialType, number>>;
  reconstructed: boolean;
  reconstructedAt?: number;
}

export const RECONSTRUCTION_ENTITIES: ReconstructionEntity[] = [
  {
    id: 'void_bloom',
    name: 'Void Bloom',
    description: 'An organic crystalline blossom unfurling in zero gravity, absorbing stray vacuum radiation.',
    color: '#b8a0ff',
    requirements: {
      [MaterialType.VOID_CRYSTAL]: 50,
      [MaterialType.CONDENSATE]: 30,
    },
    reconstructed: false,
  },
  {
    id: 'memory_beacon',
    name: 'Memory Beacon',
    description: 'A stellar transmitter pulsing navigational harmonics back to forgotten solar systems.',
    color: '#ffe080',
    requirements: {
      [MaterialType.LUMINITE]: 40,
      [MaterialType.STRUCTURAL_SOLID]: 20,
    },
    reconstructed: false,
  },
  {
    id: 'silicon_nautilus',
    name: 'Silicon Nautilus',
    description: 'A bio-mechanical shell housing recursive automata equations from the first cosmic epoch.',
    color: '#c8a04a',
    requirements: {
      [MaterialType.MINERAL_SLURRY]: 60,
      [MaterialType.VOID_CRYSTAL]: 30,
    },
    reconstructed: false,
  },
  {
    id: 'auroral_filament',
    name: 'Auroral Filament',
    description: 'A dancing ribbon of synchronized luminescence binding volatile plasma streams into pure light.',
    color: '#ff4488',
    requirements: {
      [MaterialType.REACTIVE_VAPOR]: 50,
      [MaterialType.LUMINITE]: 20,
    },
    reconstructed: false,
  },
  {
    id: 'harmonic_monolith',
    name: 'Harmonic Monolith',
    description: 'The keystone of cosmic restoration. Resonates at the fundamental frequency of existence.',
    color: '#9ab09a',
    requirements: {
      [MaterialType.STRUCTURAL_SOLID]: 80,
      [MaterialType.LUMINITE]: 40,
    },
    reconstructed: false,
  },
];
