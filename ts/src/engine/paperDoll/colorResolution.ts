/**
 * Hierarchical Color Resolution (ported from ChimeraLab's color_utils.py)
 *
 * Walks a priority-ordered key list to find the first defined color,
 * falling back to a base color. This is the real Brand/Cyber-Organic/
 * Quality-tier styling system — the concrete resolver, not a parallel
 * one sitting next to the existing flat color lookup.
 *
 * Ported as patterns/logic — the real 13-part hierarchy table from
 * ChimeraLab, not re-derived from scratch.
 */

import type { ColorGenetics } from './types';

/**
 * Resolve a color by walking a priority-ordered key list.
 * Returns the first defined color, or the default if none found.
 *
 * Ported from ChimeraLab's resolve_color(genetics, *keys, default).
 */
export function resolveColor(
  genetics: ColorGenetics,
  keys: string[],
  fallback: string = '#b4967a', // tan/beige — ChimeraLab's default
): string {
  for (const key of keys) {
    const value = genetics[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return fallback;
}

/**
 * The real 13-part hierarchy table from ChimeraLab's
 * get_color_for_part(genetics, part_name).
 *
 * Each part name maps to a priority-ordered list of color keys —
 * most specific first, falling back to body_base_color.
 */
const COLOR_HIERARCHIES: Record<string, string[]> = {
  head: ['head_color', 'body_base_color'],
  torso: ['torso_color', 'body_base_color'],
  chest: ['torso_color', 'body_base_color'],
  arm_upper: ['arm_upper_color', 'arm_color', 'body_base_color'],
  arm_lower: ['arm_lower_color', 'arm_color', 'body_base_color'],
  left_arm: ['arm_upper_color', 'arm_color', 'body_base_color'],
  right_arm: ['arm_upper_color', 'arm_color', 'body_base_color'],
  leg_upper: ['leg_upper_color', 'leg_color', 'body_base_color'],
  leg_lower: ['leg_lower_color', 'leg_color', 'body_base_color'],
  left_leg: ['leg_upper_color', 'leg_color', 'body_base_color'],
  right_leg: ['leg_upper_color', 'leg_color', 'body_base_color'],
  hand: ['extremity_color', 'arm_color', 'body_base_color'],
  foot: ['extremity_color', 'leg_color', 'body_base_color'],
};

/**
 * Default color hierarchy fallbacks (from ChimeraLab's DEFAULT_COLORS).
 */
export const DEFAULT_COLOR_GENETICS: ColorGenetics = {
  body_base_color: '#b4967a', // tan/beige
  eye_white_color: '#ffffff',
  eye_iris_color: '#503c28', // brown
  mouth_color: '#783c3c', // dark red
  nail_color: '#c8b4a0', // off-white
};

/**
 * Get the resolved color for a named body part using the hierarchy table.
 *
 * Ported from ChimeraLab's get_color_for_part(genetics, part_name).
 * Maps the Paper Doll module's slot names to ChimeraLab's part names.
 */
export function getColorForPart(
  genetics: ColorGenetics,
  slot: string,
): string {
  const keys = COLOR_HIERARCHIES[slot] ?? ['body_base_color'];
  const fallback = DEFAULT_COLOR_GENETICS[keys[keys.length - 1]] ?? '#b4967a';
  return resolveColor(genetics, keys, fallback);
}

// ── Color blending utilities (from color_utils.py) ─────────────────

/**
 * Linearly interpolate between two hex colors.
 * Ported from ChimeraLab's blend_colors(c1, c2, t).
 */
export function blendColors(c1: string, c2: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * clamped);
  const g = Math.round(g1 + (g2 - g1) * clamped);
  const b = Math.round(b1 + (b2 - b1) * clamped);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a color towards white.
 * Ported from ChimeraLab's lighten_color(color, factor).
 */
export function lightenColor(color: string, factor: number): string {
  return blendColors(color, '#ffffff', factor);
}

/**
 * Darken a color towards black.
 * Ported from ChimeraLab's darken_color(color, factor).
 */
export function darkenColor(color: string, factor: number): string {
  return blendColors(color, '#000000', factor);
}
