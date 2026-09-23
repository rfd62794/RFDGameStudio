/**
 * Seeded PRNG utilities — re-exported from the canonical shared module.
 *
 * The canonical implementation now lives in ts/src/engine/shared/
 * (the studio's shared non-rendering logic layer). This re-export
 * preserves the existing artGen import surface so all current artGen
 * consumers (Shoal, SlimeVisual, dissonanceGenerator, tests) keep
 * working unchanged.
 *
 * New non-rendering consumers should import from
 * ts/src/engine/shared/seededRandom directly.
 */
export { mulberry32, hashStringToSeed } from '../shared/seededRandom';
