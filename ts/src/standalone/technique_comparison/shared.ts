/**
 * Shared utilities for technique comparison POC.
 * Seeded RNG (same algorithm as artGen's mulberry32).
 * Nothing imported from artGen or paperDoll — fully isolated.
 */

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple 1D value-noise (not Perlin, but smooth and deterministic). */
export function valueNoise1D(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const rng1 = mulberry32(seed + i);
  const rng2 = mulberry32(seed + i + 1);
  const a = rng1();
  const b = rng2();
  // Smoothstep interpolation
  const t = f * f * (3 - 2 * f);
  return a * (1 - t) + b * t;
}

/** Fractal noise — sum of octaves of value noise. */
export function fractalNoise1D(x: number, seed: number, octaves: number): number {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise1D(x * freq, seed + i * 1000) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / max;
}

export const FILL = '#3b82f6';
export const STROKE = '#1e3a8a';
export const STROKE_WIDTH = 2;
export const CANVAS_SIZE = 200;
export const CENTER = 100;
