/**
 * Pure, deterministic role-symbol generation.
 *
 * Reuses the studio's existing seededRandom.ts (mulberry32) — no second
 * randomness primitive. Same archetype + same seed always produces a
 * byte-identical ArchetypeSymbolSpec.
 *
 * v1 variation is deliberately constrained: the base shape + charge per
 * archetype are fixed (so each archetype stays visually recognizable and
 * distinct), and the seed drives a small, deterministic palette shift +
 * optional charge rotation. This keeps the symbol readable while making
 * same-archetype symbols distinguishable across different people.
 */
import { mulberry32 } from '../seededRandom';
import {
  ARCHETYPE_BASE_SPECS,
  ArchetypeSymbolSpec,
  PersonArchetype,
  SymbolShape,
} from './archetypes';

/** Default seed when none is supplied — stable so unspecced calls are reproducible. */
export const DEFAULT_ROLE_SYMBOL_SEED = 1;

/**
 * Deterministically shift a hex color by a seeded amount in HSL lightness.
 * Keeps hue/saturation roughly intact so the archetype's token identity
 * remains recognizable. Pure: same (color, seed) → same output.
 */
function shiftPalette(baseHex: string, rng: () => number): string {
  const hex = baseHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  // Seeded shift in [-0.12, +0.12] — small enough to preserve identity.
  const delta = (rng() - 0.5) * 0.24;
  const newL = Math.min(0.92, Math.max(0.18, l + delta));
  // Convert back to RGB (constant hue/sat approximation via channel scaling).
  const scale = newL / (l || 1);
  const clamp = (v: number) => Math.round(Math.min(255, Math.max(0, v * 255)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r * scale)}${toHex(g * scale)}${toHex(b * scale)}`;
}

/**
 * Deterministically rotate the charge by a seeded multiple of 90°. Pure.
 * Returns the rotation in degrees (0/90/180/270) — applied by the renderer.
 */
function seededChargeRotation(rng: () => number): number {
  const steps = Math.floor(rng() * 4) % 4;
  return steps * 90;
}

/**
 * Pure function. Given an archetype and an optional seed, returns a real,
 * deterministic symbol spec — same archetype + same seed always produces
 * the same output.
 *
 * The base shape and charge come from ARCHETYPE_BASE_SPECS (fixed per
 * archetype, so archetypes stay visually distinct). The seed drives a
 * deterministic palette lightness shift and an optional 90°-step charge
 * rotation, encoded into the returned spec via `paletteShift` and
 * `chargeRotation` fields.
 */
export function generateRoleSymbol(
  archetype: PersonArchetype,
  seed: number = DEFAULT_ROLE_SYMBOL_SEED,
): ArchetypeSymbolSpec & { paletteShift: number; chargeRotation: number } {
  const base = ARCHETYPE_BASE_SPECS[archetype];
  const rng = mulberry32(seed >>> 0);
  const palette = shiftPalette(base.defaultPalette, rng);
  const chargeRotation = seededChargeRotation(rng);
  return {
    ...base,
    defaultPalette: palette,
    paletteShift: seed,
    chargeRotation,
  };
}

/**
 * Pure helper: the base shape silhouette for an archetype (no seed needed).
 * Useful for callers that want only the silhouette, e.g. layout planning.
 */
export function archetypeShape(archetype: PersonArchetype): SymbolShape {
  return ARCHETYPE_BASE_SPECS[archetype].shape;
}

/**
 * Pure helper: the base (unshifted) palette for an archetype, straight from
 * the design-token-sourced constant. Useful for legends / accessibility.
 */
export function archetypePalette(archetype: PersonArchetype): string {
  return ARCHETYPE_BASE_SPECS[archetype].defaultPalette;
}
