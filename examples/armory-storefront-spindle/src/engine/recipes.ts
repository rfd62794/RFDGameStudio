import { PartDefinition, WeaponRecipe, TechUpgrade, RawPartId, WeaponId, GridTile } from '../types';

export const RAW_PARTS: Record<RawPartId, PartDefinition> = {
  chassis: {
    id: 'chassis',
    name: 'Chassis (FCU)',
    shortName: 'FCU',
    cost: 20,
    color: '#38bdf8', // Light sky blue
    accentColor: '#0284c7',
    icon: 'Cpu',
    description: 'Serialized Fire Control Unit and central firing mechanism.',
    unlockedByDefault: true,
  },
  barrel: {
    id: 'barrel',
    name: 'Rifled Barrel',
    shortName: 'BRL',
    cost: 10,
    color: '#f59e0b', // Amber
    accentColor: '#d97706',
    icon: 'Wrench',
    description: 'Precision ported steel pressure barrel.',
    unlockedByDefault: true,
  },
  magazine: {
    id: 'magazine',
    name: 'Feed Magazine',
    shortName: 'MAG',
    cost: 10,
    color: '#10b981', // Emerald
    accentColor: '#059669',
    icon: 'Layers',
    description: 'Standard double-stack spring-fed ammunition magazine.',
    unlockedByDefault: true,
  },
  stock: {
    id: 'stock',
    name: 'Recoil Stock',
    shortName: 'STK',
    cost: 15,
    color: '#a855f7', // Purple
    accentColor: '#7e22ce',
    icon: 'Shield',
    description: 'Tactical shoulder buffer assembly for recoil stabilization.',
    unlockedByDefault: false,
  },
  optic: {
    id: 'optic',
    name: 'Tactical Optic',
    shortName: 'OPT',
    cost: 20,
    color: '#ec4899', // Pink
    accentColor: '#db2777',
    icon: 'Crosshair',
    description: 'Mil-spec illuminated reflex sighting system.',
    unlockedByDefault: false,
  },
};

export const WEAPON_RECIPES: Record<WeaponId, WeaponRecipe> = {
  pistol: {
    id: 'pistol',
    name: 'Duty Pistol',
    category: 'Handgun',
    requiredParts: {
      chassis: 1,
      magazine: 1,
      barrel: 0,
      stock: 0,
      optic: 0,
    },
    baseCost: 30, // 20 + 10
    salePrice: 55,
    margin: 25,
    color: '#38bdf8',
    icon: 'Crosshair',
    description: 'Compact sidearm with high civilian & law-enforcement demand.',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Tactical Shotgun',
    category: 'Scatter',
    requiredParts: {
      chassis: 1,
      barrel: 1,
      magazine: 0,
      stock: 0,
      optic: 0,
    },
    baseCost: 30, // 20 + 10
    salePrice: 65,
    margin: 35,
    color: '#f59e0b',
    icon: 'Zap',
    description: 'Close-quarters smoothbore with high stopping power.',
  },
  rifle: {
    id: 'rifle',
    name: 'Service Rifle',
    category: 'Rifle',
    requiredParts: {
      chassis: 1,
      barrel: 1,
      magazine: 1,
      stock: 0,
      optic: 0,
    },
    baseCost: 40, // 20 + 10 + 10
    salePrice: 95,
    margin: 55,
    color: '#10b981',
    icon: 'Target',
    description: 'Standard infantry modular rifle with dependable margins.',
  },
  smg: {
    id: 'smg',
    name: 'Tactical SMG',
    category: 'Special Ops',
    requiredParts: {
      chassis: 1,
      barrel: 1,
      magazine: 1,
      stock: 1,
      optic: 0,
    },
    baseCost: 55, // 20 + 10 + 10 + 15
    salePrice: 145,
    margin: 90,
    color: '#a855f7',
    icon: 'Radio',
    description: 'High-rate-of-fire personal defense platform with stabilized stock.',
    requiredTechId: 'tech_specops',
  },
  dmr: {
    id: 'dmr',
    name: 'Marksman DMR',
    category: 'Precision',
    requiredParts: {
      chassis: 1,
      barrel: 1,
      magazine: 1,
      stock: 1,
      optic: 1,
    },
    baseCost: 75, // 20 + 10 + 10 + 15 + 20
    salePrice: 210,
    margin: 135,
    color: '#ec4899',
    icon: 'Crosshair',
    description: 'Precision match rifle with mil-spec optic and buffer chassis.',
    requiredTechId: 'tech_precision',
  },
};

export const DEFAULT_UPGRADES: TechUpgrade[] = [
  {
    id: 'tech_fast_belts',
    name: 'High-Speed Belts',
    tier: 1,
    cost: 150,
    purchased: false,
    description: 'Industrial ball bearings accelerate conveyor item transport tick speed by 25%.',
    icon: 'FastForward',
  },
  {
    id: 'tech_expanded_shelf',
    name: 'Warehouse Shelf Racks',
    tier: 1,
    cost: 250,
    purchased: false,
    description: 'Doubles Storefront Shelf holding capacity from 5 to 10 units per firearm class.',
    icon: 'Layers',
  },
  {
    id: 'tech_auto_supplier',
    name: 'Logistics Auto-Restock',
    tier: 2,
    cost: 350,
    purchased: false,
    description: 'Automatically orders raw parts batch whenever hopper stock reaches zero (if funds allow).',
    icon: 'Truck',
    prerequisiteId: 'tech_fast_belts',
  },
  {
    id: 'tech_specops',
    name: 'Tactical SMG License',
    tier: 2,
    cost: 300,
    purchased: false,
    description: 'Unlocks Recoil Stock ($15) and Tactical SMG recipe ($145 sale, +$90 margin).',
    icon: 'Award',
  },
  {
    id: 'tech_precision',
    name: 'Mil-Spec DMR License',
    tier: 3,
    cost: 450,
    purchased: false,
    description: 'Unlocks Tactical Optic ($20) and Marksman DMR recipe ($210 sale, +$135 margin).',
    icon: 'Crosshair',
    prerequisiteId: 'tech_specops',
  },
  {
    id: 'tech_expanded_floor',
    name: 'Floor Expansion (8x8)',
    tier: 3,
    cost: 500,
    purchased: false,
    description: 'Expands the workshop assembly floor from a 6x6 matrix to an 8x8 matrix.',
    icon: 'Maximize2',
  },
];

export const CUSTOMER_NAMES = [
  'Officer Vance',
  'Captain Miller',
  'Agent Reynolds',
  'Security Dir. Chen',
  'Marshal Brody',
  'Det. Kowalski',
  'Operator Thorne',
  'Ranger Diaz',
  'Chief Mercer',
  'Specialist Sterling',
];

export const CUSTOMER_ROLES = [
  'City Metro Precinct',
  'Private Security Firm',
  'Tactical Response Unit',
  'Border Patrol Detail',
  'Armored Transit Corp',
  'Federal Contractor',
  'Shooting Academy',
  'Defense Logistics',
];

export function createEmptyGrid(width: number, height: number): GridTile[][] {
  const grid: GridTile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: GridTile[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x,
        y,
        type: 'empty',
        direction: 'E',
        fitterBuffer: [],
        totalPassed: 0,
        totalAssembled: 0,
        totalPacked: 0,
      });
    }
    grid.push(row);
  }
  return grid;
}

export interface PresetFactory {
  id: string;
  name: string;
  description: string;
  tiles: Array<{ x: number; y: number; type: GridTile['type']; direction: GridTile['direction']; spawnerPart?: RawPartId }>;
}

export const PRESET_FACTORIES: PresetFactory[] = [
  {
    id: 'starter_pistol_line',
    name: 'Starter Pistol Line',
    description: 'Clean parallel line spawning Chassis + Mag into a Fitter and packing Pistols.',
    tiles: [
      { x: 0, y: 1, type: 'spawner', direction: 'E', spawnerPart: 'chassis' },
      { x: 1, y: 1, type: 'conveyor', direction: 'E' },
      { x: 2, y: 1, type: 'conveyor', direction: 'S' },
      
      { x: 0, y: 3, type: 'spawner', direction: 'E', spawnerPart: 'magazine' },
      { x: 1, y: 3, type: 'conveyor', direction: 'E' },
      { x: 2, y: 3, type: 'conveyor', direction: 'N' },
      
      { x: 2, y: 2, type: 'fitter', direction: 'E' },
      { x: 3, y: 2, type: 'conveyor', direction: 'E' },
      { x: 4, y: 2, type: 'conveyor', direction: 'E' },
      { x: 5, y: 2, type: 'packer', direction: 'E' },
    ],
  },
  {
    id: 'dual_line_rifle_pistol',
    name: 'Dual Assembly (Rifle & Pistol)',
    description: '3 Spawners feeding two dedicated Fitters for high throughput.',
    tiles: [
      // Chassis Spawner top left
      { x: 0, y: 0, type: 'spawner', direction: 'E', spawnerPart: 'chassis' },
      { x: 1, y: 0, type: 'conveyor', direction: 'E' },
      { x: 2, y: 0, type: 'conveyor', direction: 'S' },

      // Barrel Spawner mid left
      { x: 0, y: 2, type: 'spawner', direction: 'E', spawnerPart: 'barrel' },
      { x: 1, y: 2, type: 'conveyor', direction: 'E' },
      
      // Mag Spawner bottom left
      { x: 0, y: 4, type: 'spawner', direction: 'E', spawnerPart: 'magazine' },
      { x: 1, y: 4, type: 'conveyor', direction: 'E' },
      { x: 2, y: 4, type: 'conveyor', direction: 'N' },

      // Fitter at (2, 2) combines Chassis + Barrel + Mag into Rifle!
      { x: 2, y: 2, type: 'fitter', direction: 'E' },
      { x: 3, y: 2, type: 'conveyor', direction: 'E' },
      { x: 4, y: 2, type: 'conveyor', direction: 'E' },
      { x: 5, y: 2, type: 'packer', direction: 'E' },

      // Bottom auxiliary line for Pistols
      { x: 1, y: 5, type: 'spawner', direction: 'E', spawnerPart: 'chassis' },
      { x: 2, y: 5, type: 'spawner', direction: 'E', spawnerPart: 'magazine' },
      { x: 3, y: 5, type: 'fitter', direction: 'E' },
      { x: 4, y: 5, type: 'conveyor', direction: 'E' },
      { x: 5, y: 5, type: 'packer', direction: 'E' },
    ],
  },
  {
    id: 'shotgun_tactical_hub',
    name: 'Shotgun & Heavy Works',
    description: 'Chassis + Barrel feed line with compact loop routing.',
    tiles: [
      { x: 1, y: 1, type: 'spawner', direction: 'S', spawnerPart: 'chassis' },
      { x: 3, y: 1, type: 'spawner', direction: 'S', spawnerPart: 'barrel' },
      { x: 1, y: 2, type: 'conveyor', direction: 'E' },
      { x: 3, y: 2, type: 'conveyor', direction: 'W' },
      { x: 2, y: 2, type: 'fitter', direction: 'S' },
      { x: 2, y: 3, type: 'conveyor', direction: 'S' },
      { x: 2, y: 4, type: 'packer', direction: 'S' },
    ],
  },
];
