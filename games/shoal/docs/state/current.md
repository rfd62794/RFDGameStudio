# Shoal — Repo State

*Last updated: August 12 2026*

## Visual Re-Haul: New Consumer of Shared artGen Module — COMPLETED

Shoal is now a consumer of the shared `ts/src/engine/artGen/` module.
Previously, Shoal rendered all entities (fish, sharks, algae, flesh
chunks) via hardcoded Canvas 2D primitives (`ctx.arc`, `ctx.beginPath`,
`ctx.lineTo`). This phase wired Shoal's rendering to use the shared
artGen canvas-path generators.

### What changed

- **`ts/src/games/shoal/art/shoal.config.ts`** (new): species shape
  config (fish/shark/algae/fleshChunk), lineage color inheritance
  (`inheritHue` — parent hue + seeded mutation drift, same convention as
  SlimeWorld/TurboShells), age curve (young/mature/old →
  saturation/scale). Builder functions: `buildTeardropFinSpec`,
  `buildAlgaeSpec`, `buildFleshChunkSpec`.
- **`ts/src/games/shoal/App.tsx`**: `drawFish` and `drawSharksBatched`
  now use `canvasTeardropFinPath` from artGen (via
  `buildTeardropFinSpec`). Algae rendering uses `canvasRadialBurstPath`
  (via `buildAlgaeSpec`). Flesh chunks use `canvasIrregularFragmentPath`
  (via `buildFleshChunkSpec`).

### Hunger/energy visual axis — CONFIRMED PRESENT

Shoal's Lua game logic (`entities.lua`) tracks `fed` and `hunger` for
both fish and sharks. `data.yaml` has `hunger_rate`, `starve_limit`,
`breed_fed_threshold`, `starvation_seconds`, `hunger_refund`. The state
is real and tracked — only the visual mapping (lean vs. full silhouette)
is missing. This is a real, easy Phase 2 addition.

### What did NOT change

- Shoal's game logic (Lua) — untouched. This was a rendering-layer
  extraction only.
- Shoal's canvas-based rendering paradigm — preserved. Shoal uses the
  canvas-path generators (not the SVG-to-canvas bridge), which are more
  efficient for per-frame rendering than SVG-to-image conversion.
- No new Shoal screens were built beyond wiring the existing
  fish/shark/algae/flesh-chunk renderers to the shared primitives.

### Tests

- `test_shoal_config.ts`: 16 tests covering distinct species shapes,
  lineage color inheritance (100 trials, deterministic, hue wrapping),
  age curve monotonicity. All passing.
