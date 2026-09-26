// MBB Math helpers — pure math utilities and LCG PRNG.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All values are byte-identical to the original monolith.
// Implementations moved to ts/src/engine/shared/math.ts (ADR-014 shared-math
// extraction); re-exported here so existing MBB consumers keep working
// unchanged.

export { clamp, dist2, distance, normalize, limitVector, makePrng, prngFloat, prngInt } from '../../../engine/shared';
