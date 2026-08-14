/**
 * Shared non-rendering TS logic — the studio's convention for
 * cross-game reusable code that isn't rendering primitives.
 *
 * Parallel to ts/src/engine/artGen/ (which holds shared rendering
 * primitives: gradients, borders, shapes, SVG paths). This module
 * holds non-rendering logic: PRNGs, type systems, classification
 * functions.
 *
 * Established August 2026 with three real, proven extractions from the
 * TS-Native Cross-Game Duplication Audit:
 *   - mulberry32 / hashStringToSeed  (seeded PRNG)
 *   - getRelation                     (element-wheel classification)
 *   - PartSlot / Part / PartsBySlot   (6-slot body-part type system)
 */
export * from './seededRandom';
export * from './wheelRelation';
export * from './partSlots';
