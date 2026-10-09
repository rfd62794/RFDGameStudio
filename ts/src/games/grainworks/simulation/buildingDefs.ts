import {
  BuildingCategory,
  BuildingDef,
  BuildingFilter,
  ContainerType,
  MaterialState,
  MaterialType,
  MATERIAL_DEFS,
  ProcessorType,
} from '../types';

export const BUILDING_TILE = 8;

export const FRAME_COLORS: Record<string, string> = {
  collector_dust: '#38bdf8',
  collector_gas: '#38bdf8',
  collector_liquid: '#38bdf8',
  collector_universal: '#9c88ff',
  container_gas: '#7ab8d4',
  container_liquid: '#3a7abf',
  container_solid: '#6b7c6b',
  container_dust: '#c8b89a',
  pipe: '#aaaaaa',
  processor_compressor: '#f59e0b',
  processor_condenser: '#60a5fa',
  processor_separator: '#a78bfa',
  processor_plasma_forge: '#ff6a00',
  processor_catalyst_chamber: '#ffe080',
  wall: '#9ab09a',
};

export const SOCKET_STATE_COLORS: Record<MaterialState, string> = {
  gas: '#7ab8d4',
  liquid: '#3a7abf',
  solid: '#6b7c6b',
  dust: '#c8b89a',
};

export function getMaterialState(mat: MaterialType): MaterialState {
  if (mat === MaterialType.DUST) return 'dust';
  const def = MATERIAL_DEFS[mat];
  if (!def) return 'solid';
  if (def.isGas) return 'gas';
  if (def.isLiquid) return 'liquid';
  if (def.isSolid) return 'solid';
  return 'solid';
}

export function createDefaultFilter(def: BuildingDef, buildingId: string = ''): BuildingFilter {
  const allowed: Record<string, Set<MaterialType>> = {};
  const allMaterials = [
    MaterialType.DUST,
    MaterialType.GAS,
    MaterialType.LIQUID,
    MaterialType.SOLID,
    MaterialType.PLASMA,
    MaterialType.VOID_CRYSTAL,
    MaterialType.MINERAL_SLURRY,
    MaterialType.REACTIVE_VAPOR,
    MaterialType.CONDENSATE,
    MaterialType.LUMINITE,
    MaterialType.STRUCTURAL_SOLID,
  ];

  for (const socket of def.sockets) {
    allowed[socket.id] = new Set(
      allMaterials.filter((m) => socket.acceptedStates.includes(getMaterialState(m)))
    );
  }

  return { buildingId, allowed };
}

export const BUILDING_DEFS: BuildingDef[] = [
  // Collectors (2x2 tiles = 16x16 CA cells)
  {
    id: 'collector_dust',
    name: 'Dust Collector',
    shortLabel: 'DST-COL',
    category: BuildingCategory.COLLECTOR,
    tileW: 2,
    tileH: 2,
    width: 2 * BUILDING_TILE,
    height: 2 * BUILDING_TILE,
    cost: 3,
    unlockedAtTier: 1,
    description: '2×2 tile funnel that catches falling Dust particles. Sits in asteroid zone.',
    acceptedMaterials: [MaterialType.DUST],
    sockets: [
      { id: 'out_1', dtx: 1, dty: 2, side: 'bottom', kind: 'output', acceptedStates: ['dust'] },
    ],
  },
  {
    id: 'collector_gas',
    name: 'Gas Collector',
    shortLabel: 'GAS-COL',
    category: BuildingCategory.COLLECTOR,
    tileW: 2,
    tileH: 2,
    width: 2 * BUILDING_TILE,
    height: 2 * BUILDING_TILE,
    cost: 3,
    unlockedAtTier: 1,
    description: '2×2 tile intake hood that gathers ambient and rising Gas in asteroid zone.',
    acceptedMaterials: [MaterialType.GAS],
    sockets: [
      { id: 'out_1', dtx: 1, dty: 2, side: 'bottom', kind: 'output', acceptedStates: ['gas'] },
    ],
  },
  {
    id: 'collector_liquid',
    name: 'Liquid Collector',
    shortLabel: 'LIQ-COL',
    category: BuildingCategory.COLLECTOR,
    tileW: 2,
    tileH: 2,
    width: 2 * BUILDING_TILE,
    height: 2 * BUILDING_TILE,
    cost: 3,
    unlockedAtTier: 1,
    description: '2×2 tile basin that captures cascading Liquid droplets.',
    acceptedMaterials: [MaterialType.LIQUID],
    sockets: [
      { id: 'out_1', dtx: 1, dty: 2, side: 'bottom', kind: 'output', acceptedStates: ['liquid'] },
    ],
  },
  {
    id: 'collector_universal',
    name: 'Universal Collector',
    shortLabel: 'UNI-COL',
    category: BuildingCategory.COLLECTOR,
    tileW: 2,
    tileH: 2,
    width: 2 * BUILDING_TILE,
    height: 2 * BUILDING_TILE,
    cost: 5,
    unlockedAtTier: 2,
    description: '2×2 tile magnetic intake that gathers all physical materials.',
    acceptedMaterials: [
      MaterialType.DUST,
      MaterialType.GAS,
      MaterialType.LIQUID,
      MaterialType.PLASMA,
      MaterialType.VOID_CRYSTAL,
      MaterialType.MINERAL_SLURRY,
      MaterialType.REACTIVE_VAPOR,
      MaterialType.CONDENSATE,
      MaterialType.LUMINITE,
    ],
    sockets: [
      {
        id: 'out_1',
        dtx: 1,
        dty: 2,
        side: 'bottom',
        kind: 'output',
        acceptedStates: ['dust', 'gas', 'liquid', 'solid'],
      },
    ],
  },

  // Containers (2x3 tiles = 16x24 CA cells)
  {
    id: 'container_dust',
    name: 'Dust Hopper',
    shortLabel: 'DST-HOP',
    category: BuildingCategory.CONTAINER,
    containerType: ContainerType.DUST_HOPPER,
    tileW: 2,
    tileH: 3,
    width: 2 * BUILDING_TILE,
    height: 3 * BUILDING_TILE,
    cost: 2,
    unlockedAtTier: 1,
    description: '2×3 tile reinforced silo. Stores up to 500 Dust units with top intake & bottom discharge.',
    acceptedMaterials: [MaterialType.DUST],
    sockets: [
      { id: 'in_1', dtx: 1, dty: 0, side: 'top', kind: 'input', acceptedStates: ['dust'] },
      { id: 'out_1', dtx: 1, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['dust'] },
    ],
  },
  {
    id: 'container_solid',
    name: 'Solid Bin',
    shortLabel: 'SLD-BIN',
    category: BuildingCategory.CONTAINER,
    containerType: ContainerType.SOLID_BIN,
    tileW: 2,
    tileH: 3,
    width: 2 * BUILDING_TILE,
    height: 3 * BUILDING_TILE,
    cost: 2,
    unlockedAtTier: 1,
    description: '2×3 tile heavy bin. Stores up to 500 Solid, Structural Solid, Void Crystals, or Luminite.',
    acceptedMaterials: [
      MaterialType.SOLID,
      MaterialType.STRUCTURAL_SOLID,
      MaterialType.VOID_CRYSTAL,
      MaterialType.LUMINITE,
    ],
    sockets: [
      { id: 'in_1', dtx: 1, dty: 0, side: 'top', kind: 'input', acceptedStates: ['solid'] },
      { id: 'out_1', dtx: 1, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['solid'] },
    ],
  },
  {
    id: 'container_liquid',
    name: 'Liquid Flask',
    shortLabel: 'LIQ-FLK',
    category: BuildingCategory.CONTAINER,
    containerType: ContainerType.LIQUID_FLASK,
    tileW: 2,
    tileH: 3,
    width: 2 * BUILDING_TILE,
    height: 3 * BUILDING_TILE,
    cost: 2,
    unlockedAtTier: 1,
    description: '2×3 tile pressurized tank. Stores up to 500 Liquid, Mineral Slurry, or Condensate.',
    acceptedMaterials: [
      MaterialType.LIQUID,
      MaterialType.MINERAL_SLURRY,
      MaterialType.CONDENSATE,
    ],
    sockets: [
      { id: 'in_1', dtx: 1, dty: 0, side: 'top', kind: 'input', acceptedStates: ['liquid'] },
      { id: 'out_1', dtx: 1, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['liquid'] },
    ],
  },
  {
    id: 'container_gas',
    name: 'Gas Tank',
    shortLabel: 'GAS-TNK',
    category: BuildingCategory.CONTAINER,
    containerType: ContainerType.GAS_TANK,
    tileW: 2,
    tileH: 3,
    width: 2 * BUILDING_TILE,
    height: 3 * BUILDING_TILE,
    cost: 2,
    unlockedAtTier: 1,
    description: '2×3 tile hermetic chamber. Stores up to 500 Gas or Reactive Vapor.',
    acceptedMaterials: [MaterialType.GAS, MaterialType.REACTIVE_VAPOR],
    sockets: [
      { id: 'in_1', dtx: 1, dty: 0, side: 'top', kind: 'input', acceptedStates: ['gas'] },
      { id: 'out_1', dtx: 1, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['gas'] },
    ],
  },

  // Processors
  {
    id: 'processor_compressor',
    name: 'Compressor',
    shortLabel: 'COMP',
    category: BuildingCategory.PROCESSOR,
    processorType: ProcessorType.COMPRESSOR,
    tileW: 3,
    tileH: 3,
    width: 3 * BUILDING_TILE,
    height: 3 * BUILDING_TILE,
    cost: 5,
    unlockedAtTier: 1,
    description: '3×3 tile press. Compresses 5 Dust into 1 Structural Solid every 2 seconds.',
    sockets: [
      { id: 'in_1', dtx: 0, dty: 1.5, side: 'left', kind: 'input', acceptedStates: ['dust'] },
      { id: 'out_1', dtx: 1.5, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['solid'] },
    ],
  },
  {
    id: 'processor_condenser',
    name: 'Condenser',
    shortLabel: 'COND',
    category: BuildingCategory.PROCESSOR,
    processorType: ProcessorType.CONDENSER,
    tileW: 3,
    tileH: 3,
    width: 3 * BUILDING_TILE,
    height: 3 * BUILDING_TILE,
    cost: 5,
    unlockedAtTier: 2,
    description: '3×3 tile cryo-exchanger. Chills 2 Gas into 1 Condensate every 3 seconds.',
    sockets: [
      { id: 'in_1', dtx: 0, dty: 1.5, side: 'left', kind: 'input', acceptedStates: ['gas'] },
      { id: 'out_1', dtx: 1.5, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['liquid'] },
    ],
  },
  {
    id: 'processor_separator',
    name: 'Separator',
    shortLabel: 'SEPR',
    category: BuildingCategory.PROCESSOR,
    processorType: ProcessorType.SEPARATOR,
    tileW: 3,
    tileH: 3,
    width: 3 * BUILDING_TILE,
    height: 3 * BUILDING_TILE,
    cost: 5,
    unlockedAtTier: 2,
    description: '3×3 tile centrifuge. Separates 2 Mineral Slurry into 1 Dust + 1 Liquid every 4 seconds.',
    sockets: [
      { id: 'in_1', dtx: 1.5, dty: 0, side: 'top', kind: 'input', acceptedStates: ['liquid'] },
      { id: 'out_solid', dtx: 0.5, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['solid', 'dust'] },
      { id: 'out_liquid', dtx: 2.5, dty: 3, side: 'bottom', kind: 'output', acceptedStates: ['liquid'] },
    ],
  },
  {
    id: 'processor_plasma_forge',
    name: 'Plasma Forge',
    shortLabel: 'PLAS',
    category: BuildingCategory.PROCESSOR,
    processorType: ProcessorType.PLASMA_FORGE,
    tileW: 4,
    tileH: 4,
    width: 4 * BUILDING_TILE,
    height: 4 * BUILDING_TILE,
    cost: 6,
    unlockedAtTier: 3,
    description: '4×4 tile fusion furnace. Combines 1 Void Crystal + 2 Gas to forge 1 Plasma every 6s.',
    sockets: [
      { id: 'in_crystal', dtx: 0, dty: 2, side: 'left', kind: 'input', acceptedStates: ['solid'] },
      { id: 'in_gas', dtx: 2, dty: 0, side: 'top', kind: 'input', acceptedStates: ['gas'] },
      { id: 'out_1', dtx: 2, dty: 4, side: 'bottom', kind: 'output', acceptedStates: ['gas'] },
    ],
  },
  {
    id: 'processor_catalyst_chamber',
    name: 'Catalyst Chamber',
    shortLabel: 'CATL',
    category: BuildingCategory.PROCESSOR,
    processorType: ProcessorType.CATALYST_CHAMBER,
    tileW: 4,
    tileH: 4,
    width: 4 * BUILDING_TILE,
    height: 4 * BUILDING_TILE,
    cost: 8,
    unlockedAtTier: 3,
    description: '4×4 tile transmutation vault. Synthesizes 2 Reactive Vapor into Luminite every 8s (uses Condensate catalyst).',
    sockets: [
      { id: 'in_gas', dtx: 0, dty: 2, side: 'left', kind: 'input', acceptedStates: ['gas'] },
      { id: 'in_catalyst', dtx: 2, dty: 0, side: 'top', kind: 'input', acceptedStates: ['liquid'] },
      { id: 'out_solid', dtx: 2, dty: 4, side: 'bottom', kind: 'output', acceptedStates: ['solid'] },
    ],
  },

  // Wall & Pipe
  {
    id: 'pipe',
    name: 'Pipe Segment',
    shortLabel: 'PIPE',
    category: BuildingCategory.PIPE,
    tileW: 1,
    tileH: 1,
    width: 1 * BUILDING_TILE,
    height: 1 * BUILDING_TILE,
    cost: 1,
    unlockedAtTier: 1,
    description: '1×1 tile directional transport channel. Moves 5 units/sec. Auto-locks to adjacent sockets.',
    sockets: [
      {
        id: 'io_1',
        dtx: 0.5,
        dty: 0.5,
        side: 'bottom',
        kind: 'output',
        acceptedStates: ['dust', 'gas', 'liquid', 'solid'],
      },
    ],
  },
  {
    id: 'wall',
    name: 'Structural Wall',
    shortLabel: 'WALL',
    category: BuildingCategory.WALL,
    tileW: 1,
    tileH: 1,
    width: 1 * BUILDING_TILE,
    height: 1 * BUILDING_TILE,
    cost: 1,
    unlockedAtTier: 1,
    description: '1×1 tile sturdy solid frame to funnel materials and shield machinery.',
    sockets: [],
  },
];
