/**
 * Shoal — art generation configuration.
 *
 * Maps Shoal's species (fish, shark, algae, fleshChunk) to the shared
 * artGen shape primitives. Includes lineage-color-inheritance (baseHue
 * inherited from parent + seeded mutation drift) and age-curve rendering
 * (young/mature/old → saturation/scale).
 *
 * Hunger/energy as a visual axis (lean vs. full silhouette) is CONFIRMED
 * as real tracked state in Shoal's Lua game logic (entities.lua: `fed`,
 * `hunger`, `hunger_rate`, `starve_limit`, `breed_fed_threshold`). However,
 * per the directive, it is explicitly OUT of scope this phase. It is a
 * real, easy Phase 2 addition — the state already exists, only the
 * visual mapping needs to be added.
 */

import { mulberry32, hashStringToSeed } from '../../engine/artGen/seededRandom';
import type {
  TeardropFinSpec,
  RadialBurstSpec,
  IrregularFragmentSpec,
} from '../../engine/artGen/types';

// --- Species shape families ---

export type ShoalSpecies = 'fish' | 'shark' | 'algae' | 'fleshChunk';

export interface ShoalShapeConfig {
  species: ShoalSpecies;
  /** Base scale multiplier (1 = standard fish, 1.4 = shark). */
  scale: number;
  /** 0-100, higher = more angular/predatory. */
  angularity: number;
  /** Add a dorsal fin (shark trait). */
  dorsalFin: boolean;
}

export const SPECIES_SHAPES: Record<ShoalSpecies, ShoalShapeConfig> = {
  fish: {
    species: 'fish',
    scale: 1.0,
    angularity: 20,
    dorsalFin: false,
  },
  shark: {
    species: 'shark',
    scale: 1.4,
    angularity: 70,
    dorsalFin: true,
  },
  algae: {
    species: 'algae',
    scale: 1.0,
    angularity: 0,
    dorsalFin: false,
  },
  fleshChunk: {
    species: 'fleshChunk',
    scale: 0.6,
    angularity: 0,
    dorsalFin: false,
  },
};

/**
 * Build a TeardropFinSpec for a fish or shark, applying age-curve scale.
 * Algae and fleshChunk use different shape families (see below).
 */
export function buildTeardropFinSpec(
  species: 'fish' | 'shark',
  ageStage: AgeStage = 'mature',
  seed: number = 0
): TeardropFinSpec {
  const base = SPECIES_SHAPES[species];
  const ageScale = AGE_CURVE[ageStage].scaleMultiplier;
  return {
    scale: base.scale * ageScale,
    angularity: base.angularity,
    dorsalFin: base.dorsalFin,
    seed,
  };
}

/**
 * Build a RadialBurstSpec for algae. Arm count varies by growth stage:
 * young = fewer arms, mature = full, old = same as mature (post-growth).
 */
export function buildAlgaeSpec(
  growthStage: number, // 0 = just spawned, higher = more developed
  color: string,
  seed: number = 0
): RadialBurstSpec {
  const armCount = Math.max(3, Math.min(12, 3 + Math.floor(growthStage * 2)));
  return {
    armCount,
    radius: 8 + growthStage * 2,
    innerRadius: 3,
    fill: color,
    stroke: color,
    strokeWidth: 1,
    center: 0,
    seed,
  };
}

/**
 * Build an IrregularFragmentSpec for flesh chunks (debris).
 */
export function buildFleshChunkSpec(
  color: string,
  seed: number = 0
): IrregularFragmentSpec {
  return {
    seed,
    vertexCount: 7,
    irregularity: 60,
    radius: 8,
    fill: color,
    stroke: color,
    strokeWidth: 1,
  };
}

// --- Age curve ---

export type AgeStage = 'young' | 'mature' | 'old';

export interface AgeVisual {
  /** Saturation multiplier (0-1). Young/old = reduced, mature = full. */
  saturationMultiplier: number;
  /** Scale multiplier. Young = reduced, mature/old = full (post-growth). */
  scaleMultiplier: number;
}

export const AGE_CURVE: Record<AgeStage, AgeVisual> = {
  young: { saturationMultiplier: 0.6, scaleMultiplier: 0.75 },
  mature: { saturationMultiplier: 1.0, scaleMultiplier: 1.0 },
  old: { saturationMultiplier: 0.6, scaleMultiplier: 1.0 },
};

/**
 * Determine the age stage from a creature's maturity and age.
 * Shoal creatures have a `mature: boolean` flag. We approximate:
 *   - not mature → young
 *   - mature → mature (or old if age exceeds a threshold, but Shoal
 *     doesn't currently track post-mature age, so we default to mature)
 */
export function ageStageFromCreature(mature: boolean): AgeStage {
  return mature ? 'mature' : 'young';
}

// --- Lineage color inheritance ---

/**
 * Inherit a base hue from a parent, with small seeded mutation drift.
 * Same convention as SlimeWorld/TurboShells genetics — not a new pattern.
 *
 * @param parentHue - parent's base hue (0-360)
 * @param offspringId - unique id for the offspring (seeded mutation)
 * @param driftRange - max drift in degrees (default ±15)
 * @returns offspring's base hue (0-360, wrapped)
 */
export function inheritHue(
  parentHue: number,
  offspringId: string,
  driftRange: number = 15
): number {
  const rng = mulberry32(hashStringToSeed(offspringId));
  const drift = (rng() - 0.5) * 2 * driftRange;
  return ((parentHue + drift) % 360 + 360) % 360;
}

/**
 * Convert a hue (0-360) + saturation (0-1) + lightness (0-1) to an hsl() color string.
 */
export function hslColor(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue.toFixed(0)}, ${(saturation * 100).toFixed(0)}%, ${(lightness * 100).toFixed(0)}%)`;
}

/**
 * Apply age-curve saturation to a hue-based color.
 * Returns a new hsl() string with reduced saturation for young/old.
 */
export function applyAgeSaturation(
  hue: number,
  baseSaturation: number,
  ageStage: AgeStage,
  lightness: number = 0.55
): string {
  const sat = baseSaturation * AGE_CURVE[ageStage].saturationMultiplier;
  return hslColor(hue, sat, lightness);
}

// --- Mutation drift range (for testing) ---

export const DEFAULT_DRIFT_RANGE = 15;
