# Creature system: who owns what

Three engine modules produce creature art. They are separate on purpose. Facts measured 2026-10-04.

| Module | Path | Owns | Public entry point | Used by |
|---|---|---|---|---|
| artGen | `ts/src/engine/artGen/` | Shape primitives, a seeded random generator, SVG shapes | `index.ts` re-exports `types`, `seededRandom`, `shapes` | Dissonance, Shoal, Planet of Greed, SlimeWorld (`SlimeVisual`) |
| paperDoll | `ts/src/engine/paperDoll/` | Body plans, bone schema, proportion presets, colour resolution, the chimera SVG renderer, animation | `PaperDoll` component (and `composeFigure`, `renderFigureSvg`) from `index.ts` | Chimera Wilds, Mutant Battle Ball |
| creatureArt | `ts/src/engine/creatureArt/` | A thin seam: resolve an entity to a pre-generated PNG path | `resolveCreatureArt(entity, config)` from `index.ts` | Nothing yet; only its own test (`ts/tests/test_creatureArt.ts`) |

## Which one a demo should use

A demo that draws a creature composed from parts, recoloured or scaled per player uses `paperDoll` (vector; this is the studio rule in `docs/ROADMAP.md`). `artGen` is for shapes and generated sprites. `creatureArt` is for finished raster art.

## creatureArt is parked

The seam and its fixture (`fixtures/wolf.png`, 347,341 bytes) stay in place and cost nothing, but nothing is built on it. Reasons: no game consumes it; the one candidate (Chimera Wilds) is a vector Paper Doll showcase; every attempt to run the offline generator died on infrastructure outside a worktree; the cost, quality and licence of the generator were never measured. It is parked, not deleted: it is the only raster path. Revisit only if a creature game is chosen and a real consumer is specified, with a fallback to a generated sprite when the PNG is missing.

## Golden snapshots

`ts/tests/test_creature_golden_snapshots.ts` renders a fixed set of 15 configurations — the six `CREATURE_PRESETS` archetypes at seeds 42 and 1337, plus `humanoidBilateral` at the first, middle and last `PROPORTION_PRESET_ORDER` entries at seed 42 — through the public `renderFigureSvg` at 200×200, and compares each output byte-for-byte with a committed `.svg` under `ts/tests/golden/creature/` (roadmap M5.2). Any diff is either an intended change — re-bless with `UPDATE_GOLDEN=1` (`npx vitest run test_creature_golden_snapshots.ts` from `ts/`) in the same commit and say why in the commit message — or a regression. A missing golden is a failure, never auto-created. The M6 pixel-art work extends the same folder with rasterised goldens.
