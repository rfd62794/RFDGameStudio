/**
 * Seeded PRNG utilities.
 *
 * Extracted verbatim from the existing procedural SVG component because it
 * is already proven, tested in production, and exactly what other
 * procedural art consumers in this studio need. Do not change the algorithm
 * without a compelling reason and a corresponding test that proves
 * identical behavior is preserved.
 */

/**
 * Standard mulberry32 PRNG.
 * Deterministic: the same seed always produces the same sequence.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive a deterministic integer seed from an arbitrary string.
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
