import { Compound } from '../types';

export const COMPOUNDS: Compound[] = [
  // Tier 1
  {
    id: 'nitrogen_vapor',
    name: 'Nitrogen Vapor',
    state: 'gas',
    color: '#38bdf8',
    description: 'Volatile inert carrier gas trapped in asteroid pores.',
    tier: 1,
    baseVolatility: 0.15,
  },
  {
    id: 'mineral_slurry',
    name: 'Mineral Slurry',
    state: 'liquid',
    color: '#34d399',
    description: 'Dense colloidal fluid extracted from crushed silicates.',
    tier: 1,
    corrosiveness: 0.1,
  },
  {
    id: 'silicate_shard',
    name: 'Silicate Shard',
    state: 'solid',
    color: '#fbbf24',
    description: 'Stable crystalline fragments with micro-lattice structure.',
    tier: 1,
    mass: 1.0,
  },

  // Tier 2
  {
    id: 'dark_ion_mist',
    name: 'Dark Ion Mist',
    state: 'gas',
    color: '#818cf8',
    description: 'Charged dark-matter vapor recovered from anomaly fields.',
    tier: 2,
    baseVolatility: 0.35,
  },
  {
    id: 'primordial_brine',
    name: 'Primordial Brine',
    state: 'liquid',
    color: '#2dd4bf',
    description: 'Complex organic-rich saline liquid containing pre-biotic precursors.',
    tier: 2,
    corrosiveness: 0.25,
  },
  {
    id: 'dense_ferrite',
    name: 'Dense Ferrite',
    state: 'solid',
    color: '#f87171',
    description: 'Heavy magnetic metallic compound condensed during planetary cores.',
    tier: 2,
    mass: 2.8,
  },

  // Tier 3
  {
    id: 'chrono_vapor',
    name: 'Chrono-Vapor',
    state: 'gas',
    color: '#c084fc',
    description: 'Temporal distortion gas hovering near the event horizon.',
    tier: 3,
    baseVolatility: 0.6,
  },
  {
    id: 'acidic_ether',
    name: 'Acidic Ether',
    state: 'liquid',
    color: '#f472b6',
    description: 'Extreme supercritical fluid capable of dissolving atomic bonds.',
    tier: 3,
    corrosiveness: 0.55,
  },
  {
    id: 'quark_ore',
    name: 'Quark Ore',
    state: 'solid',
    color: '#a78bfa',
    description: 'Ultra-dense singularity matter formed under black hole gravity.',
    tier: 3,
    mass: 5.0,
  },
];

export const COMPOUNDS_BY_ID: Record<string, Compound> = COMPOUNDS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, Compound>
);
