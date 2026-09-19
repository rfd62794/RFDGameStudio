import { StructureBlueprint, ResidentId } from '../types';

export const STRUCTURE_BLUEPRINTS: Record<string, StructureBlueprint> = {
  munitions_forge: {
    id: 'munitions_forge',
    name: 'Munitions Forge',
    description: 'Heavy thermal foundry calibrating hyper-velocity munitions and explosive ordnance.',
    cost: 40,
    residentRequired: 'engineer',
    color: '#f97316',
    accentColor: '#fbbf24',
    width: 3,
    height: 3,
    buffType: 'damage',
    buffValue: 0.25,
    icon: 'Hammer',
  },
  hydroponic_biolab: {
    id: 'hydroponic_biolab',
    name: 'Hydroponic Biolab',
    description: 'Bio-filtration vat cluster culturing restorative cellular nano-coagulants.',
    cost: 50,
    residentRequired: 'biologist',
    color: '#10b981',
    accentColor: '#34d399',
    width: 3,
    height: 3,
    buffType: 'regen',
    buffValue: 4.0,
    icon: 'Leaf',
  },
  armory_depot: {
    id: 'armory_depot',
    name: 'Armory Depot',
    description: 'Sub-space plating facility forging ablative ballistic composite armor tiles.',
    cost: 60,
    residentRequired: 'armorer',
    color: '#06b6d4',
    accentColor: '#38bdf8',
    width: 3,
    height: 3,
    buffType: 'armor',
    buffValue: 15.0,
    icon: 'Shield',
  },
  dimensional_relay: {
    id: 'dimensional_relay',
    name: 'Dimensional Relay',
    description: 'Stabilization pylon radiating gravitational slipstreams for enhanced mobility and salvage magnetic pull.',
    cost: 80,
    residentRequired: 'architect',
    color: '#a855f7',
    accentColor: '#c084fc',
    width: 3,
    height: 3,
    buffType: 'speed',
    buffValue: 0.25,
    icon: 'Radio',
  },
};

export interface ResidentDefinition {
  id: ResidentId;
  name: string;
  title: string;
  roleDescription: string;
  color: string;
  quadrant: 'NW' | 'NE' | 'SW' | 'SE';
  quadrantName: string;
  unlockedStructureId: string;
  homeX: number;
  homeY: number;
}

export const RESIDENT_DEFINITIONS: Record<ResidentId, ResidentDefinition> = {
  engineer: {
    id: 'engineer',
    name: 'Dr. Frank Vance',
    title: 'Chief Munitions Engineer',
    roleDescription: 'Master of kinetic ballistics and industrial weapon fabrication.',
    color: '#f97316',
    quadrant: 'NW',
    quadrantName: 'Logistics & Assembly Sector',
    unlockedStructureId: 'munitions_forge',
    homeX: 82,
    homeY: 82,
  },
  biologist: {
    id: 'biologist',
    name: 'Dr. Elena Rostova',
    title: 'Sub-Space Xenobiologist',
    roleDescription: 'Specialist in mutagenic bio-containment and cellular regenerators.',
    color: '#10b981',
    quadrant: 'NE',
    quadrantName: 'Bio-Containment & Mutated Labs',
    unlockedStructureId: 'hydroponic_biolab',
    homeX: 118,
    homeY: 82,
  },
  armorer: {
    id: 'armorer',
    name: 'Sgt. Marcus Kane',
    title: 'Tactical Armorer & Sentry',
    roleDescription: 'Expert in ablative composite shielding and defensive perimeter construction.',
    color: '#06b6d4',
    quadrant: 'SW',
    quadrantName: 'Volatile Foundry & Sub-Space Armory',
    unlockedStructureId: 'armory_depot',
    homeX: 82,
    homeY: 118,
  },
  architect: {
    id: 'architect',
    name: 'Dr. Aris Thorne',
    title: 'Ontological Void Architect',
    roleDescription: 'Theoretical physicist specializing in reality anchors and dimensional relays.',
    color: '#a855f7',
    quadrant: 'SE',
    quadrantName: 'The Reality Tear & Apex Lair',
    unlockedStructureId: 'dimensional_relay',
    homeX: 118,
    homeY: 118,
  },
};
