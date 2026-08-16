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
 *
 * Fourth real extraction, added August 15 2026: sportsSim — a generic
 * possession/violence sports engine (foot/hand disposal, physical ball
 * entity with held/loose/in_flight states, four-tier violence severity
 * ladder, Universal Decision System with one scored-utility function
 * every player runs through). Built to fix a confirmed, real bug in
 * Mutant Battle Ball's possession-reset logic (no fallback when both
 * receiving-team agents are simultaneously down — silently dead-locking
 * that possession) — solved structurally via a physical ball object
 * rather than a special-cased fallback rule. MBB is the first intended
 * consumer, not yet wired; consuming it is a deliberate separate phase.
 */
export * from './seededRandom';
export * from './wheelRelation';
export * from './partSlots';
export * from './combat';
export * from './componentTypes';
export * from './sportsSim';
