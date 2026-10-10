import { CultureId } from './types';

export const PLAYER_CORP_ID = 'player-vanguard';

// Six Cultures, real hue-order wheel (OperatorGame_Vision.docx §8.3):
// Ember -> Marsh -> Gale -> Tundra -> Crystal -> Tide -> (back to Ember).
// This array's order IS the wheel order -- mapGenerator.ts's capital
// placement depends on the corps array it receives being in this exact
// cyclic sequence, so wheel-adjacency maps to map-adjacency.
export const CULTURE_WHEEL = ['ember', 'marsh', 'gale', 'tundra', 'crystal', 'tide'] as const;

export interface CultureDefinition {
  corpName: string;
  color: string;
  borderColor: string;
  bgClass: string;
  textClass: string;
}

// Naming/flavor only (per Phase 1's ⚠️ RULE) -- no stat or gameplay
// modifier is derived from culture identity anywhere in this phase.
// Colors follow a real, evenly-spaced hue wheel (0/60/120/180/240/300deg)
// in the same cyclic order as CULTURE_WHEEL.
export const CULTURE_DEFINITIONS: Record<CultureId, CultureDefinition> = {
  ember: {
    corpName: 'Ember Ironworks',
    color: '#ef4444', // red — aggressive/industrial
    borderColor: '#dc2626',
    bgClass: 'bg-red-950/20',
    textClass: 'text-red-400'
  },
  marsh: {
    corpName: 'Marshveil Biotech',
    color: '#eab308', // amber/olive — tough, beloved wetlands
    borderColor: '#a16207',
    bgClass: 'bg-yellow-950/20',
    textClass: 'text-yellow-400'
  },
  gale: {
    corpName: 'Gale Vector Logistics',
    color: '#22c55e', // green — swift, elusive
    borderColor: '#15803d',
    bgClass: 'bg-green-950/20',
    textClass: 'text-green-400'
  },
  tundra: {
    corpName: 'Tundra Bastion Holdings',
    color: '#06b6d4', // cyan — immovable wall
    borderColor: '#0e7490',
    bgClass: 'bg-cyan-950/20',
    textClass: 'text-cyan-400'
  },
  crystal: {
    corpName: 'Crystal Lattice Consortium',
    color: '#6366f1', // indigo — wise defender
    borderColor: '#4338ca',
    bgClass: 'bg-indigo-950/20',
    textClass: 'text-indigo-400'
  },
  tide: {
    corpName: 'Tidewell Capital',
    color: '#d946ef', // fuchsia — charismatic/financial
    borderColor: '#a21caf',
    bgClass: 'bg-fuchsia-950/20',
    textClass: 'text-fuchsia-400'
  }
};
