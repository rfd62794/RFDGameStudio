/**
 * Dissonance Depths — art generation configuration.
 *
 * Extracted from scripts/generate_dissonance_art.py (the original Python
 * generator that produced the 106 committed SVGs). All Dissonance-specific
 * vocabulary — element colors, component→shape mapping, relation→border
 * mapping, relic category→color/shape, tier→visual scale — lives here as
 * data, not in the shared artGen module.
 *
 * The generator (dissonanceGenerator.ts) reads this config and calls the
 * shared artGen primitives. Zero hardcoded meaning in the generator itself.
 */

import type { BorderStyle, ShapeId } from '../../../engine/artGen/types';

// --- Elements ---

export const ELEMENT_COLORS: Record<string, string> = {
  ember: '#f97316',  // warm orange-red
  ash: '#94a3b8',    // dusty grey
  spark: '#22d3ee',  // electric cyan
  cinder: '#991b1b', // deep maroon-red
};

export const SURFACE = '#0f172a';

// --- Card component → shape mapping ---

export const COMPONENT_TO_SHAPE: Record<string, ShapeId> = {
  sever: 'blade',
  mend: 'cross',
  guard: 'shield',
  unmake: 'spiral',
};

// Component-specific scale overrides (matches the Python generator's
// inline scale logic in _card_shape).
export const COMPONENT_SCALE: Record<string, number> = {
  sever: 1.2,
  guard: 0.9,
  // mend, unmake: default 1.0 (no scale transform)
};

// --- Card relation → border mapping ---

export const RELATION_TO_BORDER: Record<string, BorderStyle> = {
  single: 'solid',
  adjacent: 'thick',
  same: 'glow',
  opposed: 'dashed',
};

// --- Card canvas dimensions ---

export const CARD_WIDTH = 120;
export const CARD_HEIGHT = 160;

// --- Relic category → color ---

export const RELIC_COLORS: Record<string, string> = {
  economy: '#facc15',      // gold
  'safety-net': '#34d399', // emerald
  info: '#38bdf8',         // sky
  utility: '#a78bfa',      // violet
  risk: '#fb7185',         // rose
  synergy: '#f59e0b',      // amber
};

// --- Relic canvas dimensions ---

export const RELIC_SIZE = 100;

// --- Enemy tier → visual scale ---

export interface TierVisual {
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const TIER_VISUALS: Record<string, TierVisual> = {
  basic: { radius: 30, fill: '#64748b', stroke: '#94a3b8', strokeWidth: 3 },
  advanced: { radius: 40, fill: '#f59e0b', stroke: '#fbbf24', strokeWidth: 3 },
  elite: { radius: 50, fill: '#ea580c', stroke: '#fdba74', strokeWidth: 4 },
  master: { radius: 60, fill: '#7c3aed', stroke: '#fbbf24', strokeWidth: 5 },
};

// --- Enemy canvas dimensions ---

export const ENEMY_SIZE = 120;
export const ENEMY_CENTER = 60;
export const ENEMY_STAR_POINTS = 8;

// --- Enemy sections in data.yaml (order matters for generation) ---

export const ENEMY_SECTIONS = ['basic', 'behavior_roster', 'legacy_named', 'bosses'] as const;
