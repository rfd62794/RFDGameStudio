import { SignalKey, LoreEntry, SignalBottle } from '../types';

export const INITIAL_SIGNAL_KEYS: SignalKey[] = [
  {
    id: 'key_fracture_expansion',
    name: 'Fracture Solvation Protocol',
    category: 'recipe',
    description: 'Refines chemical synthesis efficiency for drone laser extraction.',
    unlocked: true,
  },
  {
    id: 'key_void_containment',
    name: 'Astroneer Container Field',
    category: 'blueprint',
    description: 'Enables construction of specialized gas, liquid, and solid containment pods.',
    unlocked: true,
  },
  {
    id: 'key_resonance_primer',
    name: 'Harmonic Anomaly Detection',
    category: 'detection',
    description: 'Unlocks scanning coordinates for Tier 2 Void-Touched Asteroids.',
    unlocked: false,
  },
  {
    id: 'key_biomass_synthesis',
    name: 'Biomass Synthesis Protocol',
    category: 'recipe',
    description: 'Enables processing chamber recipe for Biomass Matrices.',
    unlocked: false,
  },
  {
    id: 'key_geolithic_synthesis',
    name: 'Geo-Lithic Core Matrix',
    category: 'recipe',
    description: 'Enables processing chamber recipe for Geo-Lithic Cores.',
    unlocked: false,
  },
  {
    id: 'key_collapse_catalyst',
    name: 'Event Horizon Stabilizer',
    category: 'special',
    description: 'Unlocks safe extraction of Tier 3 Collapsed Asteroid fragments.',
    unlocked: false,
  },
  {
    id: 'key_stellar_ignition',
    name: 'Stellar Fusion Blueprint',
    category: 'recipe',
    description: 'Enables processing chamber recipe for Stellar Ignition Cores.',
    unlocked: false,
  },
  {
    id: 'key_ship_hangar',
    name: 'Exploration Hangar Blueprint',
    category: 'blueprint',
    description: 'Unlocks construction of the Station Ship Hangar module.',
    unlocked: false,
  },
];

export const INITIAL_LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'lore_01_the_last_beacon',
    title: 'The Final Broadcast of Cygnus-9',
    timestamp: 'Cycles Post-Void: 0.12',
    author: 'Chief Navigator Vaelen',
    content:
      'The horizon crossed our orbital boundary at 04:00 hours. The continents shattered into fine particulate dust, yet in this capsule I encode our atmospheric nitrogen signatures and crystalline silicates. If you find this: we were here, and we built wonders.',
    discovered: true,
  },
  {
    id: 'lore_02_containment_protocols',
    title: 'Astra Containment Directives',
    timestamp: 'Cycles Post-Void: 14.8',
    author: 'Engineering Core Unit-7',
    content:
      'Warning: Never mix compressed gas vectors directly with reactive liquids in shared containment. Separate the pods with ablative hull buffers, or gravitational shear will breach the chamber seals.',
    discovered: false,
  },
  {
    id: 'lore_03_chemical_harmony',
    title: 'SS-13 Synthesis Log',
    timestamp: 'Cycles Post-Void: 42.1',
    author: 'Dr. Evelyn Thorne',
    content:
      'When Fracture Solvent is circulated through the drone coolant lines, the mining lasers resonate at the exact harmonic frequency of compressed silicates. Asteroids cleave cleanly without losing volatile compounds.',
    discovered: false,
  },
  {
    id: 'lore_04_the_first_flower',
    title: 'Void Bloom Specimen Log',
    timestamp: 'Cycles Post-Void: 99.4',
    author: 'Botanical Archivist Lyra',
    content:
      'The Void Bloom does not need soil or sunlight. It draws sustenance directly from Hawking radiation. Reconstructing it was the first proof that life can bloom again in the post-void cosmos.',
    discovered: false,
  },
  {
    id: 'lore_05_the_stars_return',
    title: 'The Great Ignition Cascade',
    timestamp: 'Cycles Post-Void: 180.9',
    author: 'Archivist Directive Omega',
    content:
      'When a star is born from the synthesis cores, the gravitational shockwave ripples across all matter. Every drone moves faster; every reaction ignites with doubled vigor. The reconstructed stars will light the way for the civilization that comes next.',
    discovered: false,
  },
];

export const INITIAL_BOTTLES: SignalBottle[] = [
  {
    id: 'bottle_initial_1',
    name: 'Encrypted Capsule #01',
    tier: 1,
    worldX: 180,
    worldY: -120,
    vx: -3,
    vy: 2,
    status: 'drifting',
    decodingProgress: 0,
    decodingDuration: 10,
    payload: {
      keyId: 'key_resonance_primer',
      loreId: 'lore_02_containment_protocols',
      dustBonus: 40,
    },
  },
  {
    id: 'bottle_initial_2',
    name: 'Encrypted Capsule #02',
    tier: 1,
    worldX: -220,
    worldY: 150,
    vx: 4,
    vy: -1,
    status: 'drifting',
    decodingProgress: 0,
    decodingDuration: 15,
    payload: {
      keyId: 'key_biomass_synthesis',
      loreId: 'lore_03_chemical_harmony',
      dustBonus: 60,
    },
  },
  {
    id: 'bottle_initial_3',
    name: 'Encrypted Capsule #03',
    tier: 1,
    worldX: 120,
    worldY: 260,
    vx: -2,
    vy: -3,
    status: 'drifting',
    decodingProgress: 0,
    decodingDuration: 20,
    payload: {
      keyId: 'key_geolithic_synthesis',
      loreId: 'lore_04_the_first_flower',
      dustBonus: 80,
    },
  },
];
