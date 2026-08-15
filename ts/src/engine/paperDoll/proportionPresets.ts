/**
 * Body Proportion Presets (ported from ChimeraLab's proportion_presets.py)
 *
 * 12 float multipliers (1.0 = normal) + 8 named presets. Each preset
 * scales per-region attachment offsets at composition time.
 *
 * Ported as patterns/data — the real numbers from ChimeraLab, not
 * re-derived from scratch.
 */

import type { BodyProportions } from '../types';

const DEFAULT: BodyProportions = {
  headSize: 1.0,
  neckWidth: 1.0,
  shoulderWidth: 1.0,
  chestWidth: 1.0,
  waistWidth: 1.0,
  hipWidth: 1.0,
  upperArmWidth: 1.0,
  forearmWidth: 1.0,
  handSize: 1.0,
  thighWidth: 1.0,
  calfWidth: 1.0,
  footSize: 1.0,
  muscleBulge: 1.0,
  name: 'Normal',
};

export const PROPORTION_PRESETS: Record<string, BodyProportions> = {
  normal: { ...DEFAULT, name: 'Normal' },

  baby_hands: {
    ...DEFAULT,
    headSize: 1.1,
    handSize: 0.4,
    footSize: 0.5,
    muscleBulge: 0.7,
    name: 'Baby Hands',
  },

  big_head: {
    ...DEFAULT,
    headSize: 1.8,
    neckWidth: 0.8,
    name: 'Big Head',
  },

  tiny_head: {
    ...DEFAULT,
    headSize: 0.5,
    neckWidth: 0.6,
    name: 'Tiny Head',
  },

  long_legs: {
    ...DEFAULT,
    thighWidth: 0.8,
    calfWidth: 0.7,
    hipWidth: 0.9,
    name: 'Long Legs',
  },

  buff: {
    ...DEFAULT,
    shoulderWidth: 1.4,
    chestWidth: 1.3,
    upperArmWidth: 1.4,
    thighWidth: 1.3,
    muscleBulge: 1.5,
    name: 'Buff',
  },

  slim: {
    ...DEFAULT,
    shoulderWidth: 0.8,
    chestWidth: 0.85,
    waistWidth: 0.7,
    hipWidth: 0.8,
    upperArmWidth: 0.75,
    forearmWidth: 0.7,
    thighWidth: 0.8,
    calfWidth: 0.75,
    muscleBulge: 0.5,
    name: 'Slim',
  },

  gorilla: {
    ...DEFAULT,
    headSize: 0.85,
    shoulderWidth: 1.5,
    chestWidth: 1.4,
    upperArmWidth: 1.6,
    forearmWidth: 1.4,
    handSize: 1.5,
    thighWidth: 0.9,
    calfWidth: 0.85,
    muscleBulge: 1.3,
    name: 'Gorilla',
  },

  chibi: {
    ...DEFAULT,
    headSize: 2.0,
    neckWidth: 0.6,
    shoulderWidth: 0.7,
    chestWidth: 0.7,
    waistWidth: 0.6,
    upperArmWidth: 0.6,
    forearmWidth: 0.5,
    handSize: 0.7,
    thighWidth: 0.6,
    calfWidth: 0.5,
    footSize: 0.7,
    muscleBulge: 0.3,
    name: 'Chibi',
  },
};

export const PROPORTION_PRESET_ORDER = [
  'normal', 'baby_hands', 'big_head', 'buff', 'slim', 'gorilla', 'chibi',
];

export function getProportionPreset(name: string): BodyProportions {
  return PROPORTION_PRESETS[name.toLowerCase()] ?? PROPORTION_PRESETS.normal;
}

export function getNextProportionPreset(current: string): string {
  const idx = PROPORTION_PRESET_ORDER.indexOf(current.toLowerCase());
  if (idx === -1) return PROPORTION_PRESET_ORDER[0];
  return PROPORTION_PRESET_ORDER[(idx + 1) % PROPORTION_PRESET_ORDER.length];
}

export { DEFAULT as NORMAL_PROPORTIONS };
