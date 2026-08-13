/**
 * Shoal — path geometry cache.
 *
 * Caches Path2D objects for fish/shark/algae/flesh-chunk shapes, keyed by
 * the state that actually determines geometry: species, age stage, and
 * hunger band. Position and rotation are NOT part of the cache key —
 * they're applied as cheap transforms (translate/rotate/scale) on the
 * cached Path2D every frame.
 *
 * The cache is a simple Map. On a real state transition (birth, age-stage
 * change, hunger band crossing), a new Path2D is generated and cached.
 * Otherwise the cached path is reused — zero geometry generation per frame
 * for stable entities.
 *
 * Path2D is the browser-native cached path object for Canvas 2D. Using
 * ctx.fill(path2d) instead of rebuilding the path from beginPath/moveTo/
 * lineTo/bezierCurveTo is the standard canvas optimization.
 */

import { canvasTeardropFinPath } from '../../engine/artGen/shapes';
import {
  buildTeardropFinSpec,
  buildAlgaeSpec,
  buildFleshChunkSpec,
  ageStageFromCreature,
  type AgeStage,
  type ShoalSpecies,
} from './shoal.config';

// --- Cache key types ---

export interface CreatureCacheKey {
  species: 'fish' | 'shark';
  ageStage: AgeStage;
  hungerBand: number; // quantized 0-N
}

export interface AlgaeCacheKey {
  growthStage: number; // quantized
}

export interface FleshChunkCacheKey {
  decayBucket: number; // quantized 0-5
}

function creatureKey(k: CreatureCacheKey): string {
  return `${k.species}:${k.ageStage}:${k.hungerBand}`;
}

function algaeKey(k: AlgaeCacheKey): string {
  return `algae:${k.growthStage}`;
}

function fleshChunkKey(k: FleshChunkCacheKey): string {
  return `chunk:${k.decayBucket}`;
}

// --- Hunger banding ---

/**
 * Quantize a continuous hunger value into a small number of bands.
 * Fish hunger: 0 to ~1.0 (hunger_rate 0.05/sec → 1.0 in 20s, grazing -1.0)
 * Shark hunger: 0 to 20 (starve_limit)
 * We normalize both to a 0-1 range, then quantize to HUNGER_BANDS steps.
 */
export const HUNGER_BANDS = 5; // 0=full, 1=slight, 2=moderate, 3=lean, 4=starving

export function hungerToBand(hunger: number, maxHunger: number): number {
  const normalized = Math.max(0, Math.min(1, hunger / maxHunger));
  return Math.min(HUNGER_BANDS - 1, Math.floor(normalized * HUNGER_BANDS));
}

export function hungerBandToScale(band: number): number {
  // band 0 (full) = 1.0 body width, band 4 (starving) = 0.7 body width
  // Linear interpolation between full and lean
  const t = band / (HUNGER_BANDS - 1); // 0 to 1
  return 1.0 - t * 0.3; // 1.0 → 0.7
}

// --- Max hunger values (from data.yaml, hardcoded for the cache key) ---

export const FISH_MAX_HUNGER = 1.0; // hunger_rate 0.05 * 20s = 1.0
export const SHARK_MAX_HUNGER = 20; // starve_limit

// --- Cache ---

const creatureCache = new Map<string, Path2D>();
const algaeCache = new Map<string, Path2D>();
const fleshChunkCache = new Map<string, Path2D>();

// Stats for verification
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheStats() {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetCacheStats() {
  cacheHits = 0;
  cacheMisses = 0;
}

export function clearCache() {
  creatureCache.clear();
  algaeCache.clear();
  fleshChunkCache.clear();
}

// --- Cached path getters ---

/**
 * Get a cached Path2D for a fish or shark, generating it if needed.
 * The path is drawn at origin (0,0) pointing right (+x). The caller
 * applies translate/rotate/scale transforms before calling ctx.fill(path2d).
 */
export function getCachedCreaturePath(key: CreatureCacheKey): Path2D {
  const ck = creatureKey(key);
  const cached = creatureCache.get(ck);
  if (cached) {
    cacheHits++;
    return cached;
  }
  cacheMisses++;

  const path = new Path2D();
  // Build the spec with hunger-band scale applied to body width
  const hungerScale = hungerBandToScale(key.hungerBand);
  const baseSpec = buildTeardropFinSpec(key.species, key.ageStage, 0);
  // Apply hunger scale as a multiplier on the base scale
  const spec = {
    ...baseSpec,
    scale: baseSpec.scale,
    // Hunger reduces body width (angularity increase = narrower body)
    angularity: baseSpec.angularity + (1.0 - hungerScale) * 50,
  };

  // Use a dummy context to trace the path into Path2D.
  // canvasTeardropFinPath draws into a ctx; we need a Path2D version.
  // We use a temporary canvas context to trace, or we can build the
  // Path2D directly by calling the path-building commands.
  // Path2D has the same API as CanvasRenderingContext2D for path building:
  // moveTo, lineTo, bezierCurveTo, closePath, beginPath, etc.
  // However, canvasTeardropFinPath takes a ctx. We need to adapt.
  // The cleanest approach: build the Path2D directly here, mirroring the
  // canvasTeardropFinPath logic but using Path2D's methods.
  buildTeardropFinIntoPath2D(path, spec);

  creatureCache.set(ck, path);
  return path;
}

/**
 * Get a cached Path2D for an algae radial burst.
 */
export function getCachedAlgaePath(key: AlgaeCacheKey, radius: number, color: string): Path2D {
  const ck = `${algaeKey(key)}:${Math.round(radius)}`;
  const cached = algaeCache.get(ck);
  if (cached) {
    cacheHits++;
    return cached;
  }
  cacheMisses++;

  const path = new Path2D();
  const spec = buildAlgaeSpec(key.growthStage, color, 0);
  buildRadialBurstIntoPath2D(path, { ...spec, radius });

  algaeCache.set(ck, path);
  return path;
}

/**
 * Get a cached Path2D for a flesh chunk irregular fragment.
 */
export function getCachedFleshChunkPath(key: FleshChunkCacheKey, radius: number, color: string): Path2D {
  const ck = `${fleshChunkKey(key)}:${Math.round(radius)}`;
  const cached = fleshChunkCache.get(ck);
  if (cached) {
    cacheHits++;
    return cached;
  }
  cacheMisses++;

  const path = new Path2D();
  const spec = buildFleshChunkSpec(color, 0);
  buildIrregularFragmentIntoPath2D(path, { ...spec, radius });

  fleshChunkCache.set(ck, path);
  return path;
}

// --- Path2D builders (mirror the canvas path generators but write to Path2D) ---

import { mulberry32 } from '../../engine/artGen/seededRandom';
import type { TeardropFinSpec, RadialBurstSpec, IrregularFragmentSpec, PolygonSpec } from '../../engine/artGen/types';

function buildTeardropFinIntoPath2D(path: Path2D, spec: TeardropFinSpec): void {
  const { scale, angularity, dorsalFin, seed = 0 } = spec;
  const rng = mulberry32(seed);
  const ang = angularity / 100;
  const jitter = (range: number) => (rng() - 0.5) * range;

  const bodyLen = 40 * scale;
  const bodyHeight = 25 * scale * (1 - ang * 0.3);
  const tailLen = 20 * scale * (1 + ang * 0.2);
  const tailSpread = 12 * scale * (1 + ang * 0.3);
  const jx = jitter(2 * scale);
  const jy = jitter(2 * scale);

  // Body
  path.moveTo(bodyLen + jx, 0);
  path.bezierCurveTo(
    bodyLen * 0.5, bodyHeight,
    -bodyLen * 0.2, bodyHeight * 0.8,
    -bodyLen * 0.3, jy
  );
  path.bezierCurveTo(
    -bodyLen * 0.2, -bodyHeight * 0.8,
    bodyLen * 0.5, -bodyHeight,
    bodyLen + jx, 0
  );
  path.closePath();

  // Tail
  path.moveTo(-bodyLen * 0.3, jy);
  path.lineTo(-bodyLen * 0.3 - tailLen, tailSpread);
  path.lineTo(-bodyLen * 0.3 - tailLen, -tailSpread);
  path.closePath();

  if (dorsalFin) {
    const finHeight = 18 * scale * (1 + ang * 0.3);
    const finBase = bodyLen * 0.15;
    path.moveTo(finBase - 5, -bodyHeight * 0.5);
    path.lineTo(finBase + 5, -bodyHeight * 0.5 - finHeight);
    path.lineTo(finBase + 15, -bodyHeight * 0.5);
    path.closePath();
  }
}

function polygonPointsIntoPath2D(path: Path2D, spec: PolygonSpec): void {
  const { vertexCount, irregularity, seed, radius = 40, center = 50 } = spec;
  const angleStep = (2 * Math.PI) / vertexCount;
  const rng = mulberry32(seed);
  const irrFactor = irregularity / 100;

  for (let i = 0; i < vertexCount; i++) {
    const baseAngle = i * angleStep;
    const angleJitter = (rng() - 0.5) * irrFactor * angleStep * 0.5;
    const radiusJitter = 1 + (rng() - 0.5) * irrFactor * 0.6;
    const angle = baseAngle + angleJitter;
    const r = radius * radiusJitter;
    const x = center + r * Math.cos(angle) - center;
    const y = center + r * Math.sin(angle) - center;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
}

function buildRadialBurstIntoPath2D(path: Path2D, spec: RadialBurstSpec): void {
  const {
    armCount,
    radius,
    innerRadius = radius * 0.3,
    seed = 0,
  } = spec;
  const rng = mulberry32(seed);
  const total = armCount * 2;

  for (let i = 0; i < total; i++) {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const baseRad = isOuter ? radius : innerRadius;
    const rad = isOuter ? baseRad * (0.85 + rng() * 0.3) : baseRad;
    const x = rad * Math.cos(angle);
    const y = rad * Math.sin(angle);
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
}

function buildIrregularFragmentIntoPath2D(path: Path2D, spec: IrregularFragmentSpec): void {
  const {
    seed,
    vertexCount = 7,
    irregularity = 60,
    radius = 30,
  } = spec;
  polygonPointsIntoPath2D(path, { vertexCount, irregularity, seed, radius, center: 0 });
}
