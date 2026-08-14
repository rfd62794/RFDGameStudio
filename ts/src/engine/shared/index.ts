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
 *   - resolveCellCombat               (RPS combat resolver, 254 lines)
 *   - Shared components               (AlertQueue, BoardroomHeader, etc.)
 */
export * from './seededRandom';
export * from './wheelRelation';
export * from './partSlots';
export * from './combat';
export * from './componentTypes';
