// new: ts/tests/helpers/seededRandom.ts
// Seeded PRNG using Mulberry32 algorithm for deterministic test runs

/**
 * Mulberry32: fast, simple seeded PRNG
 * @param seed Initial seed value
 * @returns Function that returns a random number in [0, 1)
 */
export function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
