/**
 * Seeded PRNG utilities — the canonical home for mulberry32 and
 * hashStringToSeed in the studio's shared non-rendering logic layer.
 *
 * Moved here from ts/src/engine/artGen/seededRandom.ts (where it was
 * originally extracted from SlimeVisual's procedural art code). artGen
 * re-exports these functions so all existing artGen consumers keep
 * working unchanged. New non-rendering consumers should import from
 * here directly.
 *
 * Do not change the algorithm without a compelling reason and a
 * corresponding test that proves identical behavior is preserved.
 * The output sequence for any fixed seed must be byte-identical across
 * all copies (artGen, SlimeVisual, Planet of Greed's aiDecisions).
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
