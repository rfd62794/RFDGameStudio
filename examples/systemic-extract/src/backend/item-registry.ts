/**
 * ADR 002: Item and Research Blueprint Registry
 * Schema-aligned registry for Tag-Based Research (Abiotic Factor)
 * and Deconstruction Yields (SS13 Idle)
 */

import { ItemDefinition, ResearchBlueprint, ITEM_DEFINITIONS, BiomeProfile, SectorId } from '../types';

export const ITEM_REGISTRY: Record<string, ItemDefinition> = ITEM_DEFINITIONS;

export const BIOME_PROFILES: Record<SectorId, BiomeProfile> = {
  sector_01: {
    id: 'sector_01',
    name: 'Sector 01: Logistics & Synthesis Bay',
    code: 'SEC-01 // LOGISTICS',
    subTitle: 'Quarantined 198X Supply Depot & Chemical Synthesizers',
    description: 'Heavy concentration of organic resin partitions, chemical barrels, and hive clusters. Ideal for harvesting [Volatile], [Biomass], and Inert Matter.',
    dangerLevel: 'MODERATE',
    guaranteedTags: ['[Volatile]', '[Biomass]', '[Metallic]'],
    primaryLootPool: [
      { itemId: 'scrap_metal_salvage', weight: 40 },
      { itemId: 'chemical_canister', weight: 30 },
      { itemId: 'radio_transceiver', weight: 20 },
      { itemId: 'biomass_cluster', weight: 10 },
    ],
    palette: {
      wallColor: '#334155',
      partitionColor: '#92400e', // Amber organic resin
      groundGrid: '#1e293b',
      accentGlow: '#f59e0b',
    },
    hazardProfile: {
      ambientHazardType: 'none',
      dps: 0,
      mitigatedByRig: false,
      description: 'Atmospheric seals intact. No persistent environmental corrosion.',
    },
  },
  sector_02: {
    id: 'sector_02',
    name: 'Sector 02: Quantum Sub-Cores',
    code: 'SEC-02 // SUB-CORES',
    subTitle: 'Deep Mainframe Vault & Superconducting Memory Arrays',
    description: 'Directly surrounds the fractured Singularity. High yield of [Digital], [Silicon], and [Encrypted] data. Corrosive ionized atmosphere requires Lead-Shielded Rig.',
    dangerLevel: 'LETHAL',
    guaranteedTags: ['[Digital]', '[Silicon]', '[Encrypted]'],
    primaryLootPool: [
      { itemId: 'corp_server_drive', weight: 30 },
      { itemId: 'biometric_terminal', weight: 25 },
      { itemId: 'subcore_memory_array', weight: 25 },
      { itemId: 'quantum_flux_conduit', weight: 20 },
    ],
    palette: {
      wallColor: '#1e293b',
      partitionColor: '#0e7490', // Cyan-blue crystalline sub-core barrier
      groundGrid: '#0f172a',
      accentGlow: '#06b6d4',
    },
    hazardProfile: {
      ambientHazardType: 'toxic_atmosphere',
      dps: 3,
      mitigatedByRig: true,
      description: 'Corrosive sub-space ionized atmosphere. Inflicts 3 HP/s continuous damage without Lead-Shielded Rig.',
    },
    requiredRelicId: 'relic_ontological_core',
  },
};

export const INITIAL_BLUEPRINTS: ResearchBlueprint[] = [
  {
    blueprint_id: 'kinetic_scattergun_t1',
    name: 'Kinetic Scattergun Hardpoint',
    description: 'Autonomous shoulder hardpoint with 360° LOS auto-targeting. Fires high-velocity kinetic slugs with heavy knockback. Shreds unarmored organic swarms.',
    unlocked: true, // Baseline starter hardpoint
    requirements_to_unlock: { metallic: 6, volatile: 4 },
    contributed_tags: { metallic: 6, volatile: 4 },
    requirements_to_craft: { scrap: 25, copper: 6 },
    craftDurationSeconds: 15,
    outputItem: 'KineticScattergun',
    category: 'Ballistics',
  },
  {
    blueprint_id: 'plasma_pulse_array_t1',
    name: 'Plasma Pulse Array Hardpoint',
    description: 'Sub-space ionization array. Fires piercing plasma bolts that penetrate multiple targets and melt armored Echo guards and the Apex Echo.',
    unlocked: false,
    requirements_to_unlock: { digital: 8, silicon: 8, encrypted: 4 },
    contributed_tags: {},
    requirements_to_craft: { silicon: 14, plasma: 6, scrap: 20 },
    craftDurationSeconds: 30,
    outputItem: 'PlasmaPulseArray',
    category: 'Ballistics',
  },
  {
    blueprint_id: 'breaching_charge_t1',
    name: 'Spacial Disruptor',
    description: 'Timed dimensional resonance charge that erases matter and biomass partitions in a 2-tile radius.',
    unlocked: true, // Baseline starter schematic
    requirements_to_unlock: { volatile: 5, metallic: 5 },
    contributed_tags: { volatile: 5, metallic: 5 },
    requirements_to_craft: { scrap: 15, copper: 2 }, // scrap = Inert Matter
    craftDurationSeconds: 15,
    outputItem: 'BreachingCharge',
    category: 'Demolition',
  },
  {
    blueprint_id: 'dimensional_lure_t1',
    name: 'Dimensional Resonant Lure',
    description: 'High-frequency tachyon beacon. Deploy in-raid with [T] to immediately rupture reality and summon the Apex Echo for rapid relic extraction.',
    unlocked: true, // Available as tactical speed-farm ordnance
    requirements_to_unlock: { volatile: 4, digital: 4 },
    contributed_tags: { volatile: 4, digital: 4 },
    requirements_to_craft: { scrap: 20, silicon: 6, plasma: 2 },
    craftDurationSeconds: 15,
    outputItem: 'DimensionalLure',
    category: 'Tactical',
  },
  {
    blueprint_id: 'emp_device_t1',
    name: 'Echo Disrupter Device',
    description: 'High-frequency pulse grenade that desynchronizes time-looped Echo patrols for 8s.',
    unlocked: false,
    requirements_to_unlock: { digital: 15, volatile: 5 },
    contributed_tags: {},
    requirements_to_craft: { silicon: 8, copper: 6 },
    craftDurationSeconds: 20,
    outputItem: 'EmpGrenade',
    category: 'Disruption',
  },
  {
    blueprint_id: 'thermite_flare_t1',
    name: 'Thermal Incineration Flare',
    description: 'Pressurized incendiary flare. Ignites anomalous biomass partitions in a 3x3 firestorm for 12 seconds.',
    unlocked: false,
    requirements_to_unlock: { chemical: 6, volatile: 6 },
    contributed_tags: {},
    requirements_to_craft: { copper: 4, plasma: 2 },
    craftDurationSeconds: 12,
    outputItem: 'ThermiteFlare',
    category: 'Hazard',
  },
  {
    blueprint_id: 'hazmat_rig_t1',
    name: 'Lead-Shielded Quarantine Rig',
    description: 'Faraday-reinforced operative body vest granting 50% thermal and sub-space radiation reduction.',
    unlocked: false,
    requirements_to_unlock: { chemical: 8, metallic: 10 },
    contributed_tags: {},
    requirements_to_craft: { scrap: 30, silicon: 6 }, // scrap = Inert Matter
    craftDurationSeconds: 25,
    outputItem: 'HazmatSuit',
    category: 'Tactical',
  },
  {
    blueprint_id: 'biomass_overcharger_t1',
    name: 'Resonance Kinetic Overcharger',
    description: 'Biomechanical chassis conduit synthesized from harvested Hive Nodes. Enhances Operative Rig kinetic strike power and Overclock resonance duration.',
    unlocked: false,
    requirements_to_unlock: { biomass: 10, volatile: 6 },
    contributed_tags: {},
    requirements_to_craft: { plasma: 8, silicon: 10, scrap: 20 },
    craftDurationSeconds: 30,
    outputItem: 'ResonanceOvercharger',
    category: 'Tactical',
  },
  {
    blueprint_id: 'singularity_anchor_t1',
    name: 'Singularity Reality Anchor',
    description: 'Masterwork dimensional anchor reverse-engineered from the Apex Ontological Core. Fortifies Faraday Bunker shielding against reality collapse.',
    unlocked: false,
    requirements_to_unlock: { biomass: 10, digital: 10, encrypted: 10 },
    contributed_tags: {},
    requirements_to_craft: { scrap: 50, plasma: 15, copper: 15 },
    craftDurationSeconds: 45,
    outputItem: 'SingularityAnchor',
    category: 'Tactical',
  },
];
