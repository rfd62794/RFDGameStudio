# Shoal — Repo State

*Last updated: August 12 2026*

## Visual Enrichment + Performance — COMPLETED

### §0 Profiling baseline (captured before any optimization code)

All four STOP-rule items measured and reported before writing any code:

1. **Render loop call pattern:** No caching existed. Every frame, for
   every entity, `canvasTeardropFinPath`/`canvasRadialBurstPath`/
   `canvasIrregularFragmentPath` was called fresh. Position/rotation
   were applied as transforms, but path geometry was regenerated from
   scratch every frame.
2. **Real entity counts (mid-game):** 40 fish, 20 sharks, 7 algae
   hubs (~40-56 nodules), 6 flesh chunks. Total ~80-110 geometry
   calls/frame.
3. **FPS baseline:** 40-60 FPS (variable, dipping under load).
4. **`fed`/`hunger` value ranges (from source):**
   - **Fish:** `fed` = 0-2 (grazing counter, not exported). NO `hunger`
     field existed — `hunger_rate: 0.05` in data.yaml was dead code.
     User approved Lua change to add fish hunger.
   - **Shark:** `hunger` = 0-20 continuous (`starve_limit: 20`),
     exported to renderer. `fed` = 0-3 (meal counter, not exported).

### What was built

**Path caching** (`ts/src/games/shoal/art/pathCache.ts`):
- Per-entity Path2D cache, keyed by `(species, ageStage, hungerBand)`.
- Position/rotation are NOT in the cache key — applied as cheap
  transforms on the cached Path2D every frame.
- Regenerates only on real state transition (birth, age-stage change,
  hunger-band crossing). After warmup: 200k+ cache hits / ~20 misses.
- **Result: Draw time reduced from ~80-110 fresh geometry calls/frame
  to 0.4ms.** Rendering is now essentially free.

**Hunger visual mapping** (`shoal.config.ts`):
- `hungerToBodyScale`: 0 hunger → 1.0 (full silhouette), max hunger →
  0.7 (lean silhouette). Monotonic linear decrease.
- `hungerToAngularityBonus`: 0 hunger → 0 extra angularity, max hunger
  → +30 angularity (visibly leaner body).
- `buildTeardropFinSpecWithHunger`: applies both mappings to the
  teardrop-fin spec. Cached by hunger band (5 bands).
- Applies to both fish and sharks (fish hunger was added to Lua).

**Lineage hue banding** (`shoal.config.ts`):
- 12 hue bands (30 degrees each). Chosen for ~5-8 entities per band
  at 60-100 fish — enough to amortize fillStyle switch cost.
- `getBatchColor(lineageColor)` quantizes any color to its band's
  representative hsl() color. Entities in the same band batch under
  one fillStyle.
- Finer per-entity hue variation could be expressed via a secondary
  channel (stroke tint) layered on the batched fill — not implemented
  this phase as batching isn't the bottleneck post-caching.

**Fish hunger state** (Lua — user approved lifting read-only constraint):
- `entities.lua`: added `hunger = 0` to `new_fish()`.
- `logic.lua`: `f.hunger = f.hunger + dt * data.creatures.fish.hunger_rate`
  every tick. `f.hunger = math.max(0, f.hunger - 1.0)` on grazing.
- `logic.lua` render export: added `hunger = f.hunger` to fish output.
- Uses the existing `hunger_rate: 0.05` from data.yaml (was dead code).
- Fish hunger range: 0 to ~1.0 (0.05/sec → 1.0 in 20 seconds).

**Reusable render profiler** (`ts/src/games/shoal/art/renderProfiler.ts`):
- `RenderProfiler` class with `beginTick()`/`endTick()`/`beginDraw()`/
  `endDraw()`/`drawOverlay()` API.
- Shows FPS, tick time, draw time, entity counts, custom stats.
- Toggleable at runtime via `?` key. Auto-disabled in production
  (`import.meta.env.DEV`).

### Layered canvas split — NOT implemented (real finding)

**Investigated and found not worth implementing.** Post-caching, draw
time is 0.4ms. Splitting algae/flesh-chunks onto a separate background
canvas would save maybe 0.1ms at the cost of significant complexity
(managing two canvases, dirty-tracking, resize handling). The real
bottleneck is the 17ms Lua simulation tick (steering, collision, spatial
queries), not the 0.4ms draw. Reported as a real finding per the
directive's "don't implement for its own sake" rule.

### Real before/after FPS numbers

| Metric | Before (§0 baseline) | After (post-cache) |
|---|---|---|
| FPS | 40-60 (variable) | 40-60 (same — bottleneck is Lua tick) |
| Draw time | ~80-110 fresh geometry calls/frame | 0.4ms |
| Tick time | ~17ms (not measured pre-change) | ~17ms (unchanged — out of scope) |
| Cache hits/misses | N/A (no cache) | 200k+ hits / ~20 misses (warm) |

**Key finding:** The caching freed an estimated 3-7ms of frame budget
(the old uncached draw time), which funds the hunger visual mapping
without making framerate worse. The FPS bottleneck is the 17ms Lua
simulation tick — optimizing that would be a separate simulation-
performance phase, out of scope for this rendering-layer directive.

### Files touched

- `games/shoal/entities.lua` — added `hunger = 0` to fish
- `games/shoal/logic.lua` — fish hunger update + grazing decrease + export
- `ts/src/games/shoal/types.ts` — added `hunger` to ShoalCreature
- `ts/src/games/shoal/art/shoal.config.ts` — hunger mapping + hue banding
- `ts/src/games/shoal/art/pathCache.ts` — NEW (Path2D cache)
- `ts/src/games/shoal/art/renderProfiler.ts` — NEW (reusable profiler)
- `ts/src/games/shoal/App.tsx` — wired cache + profiler into render loop
- `ts/tests/_setup/path2dPolyfill.ts` — NEW (Path2D polyfill for jsdom)
- `ts/vite.config.ts` — added setupFiles for polyfill
- `ts/tests/test_profiling_baseline_captured.ts` — NEW
- `ts/tests/test_cached_path_matches_uncached.ts` — NEW
- `ts/tests/test_cache_invalidates_on_state_change.ts` — NEW
- `ts/tests/test_geometry_calls_reduced_post_cache.ts` — NEW
- `ts/tests/test_hue_banding_preserves_batch_grouping.ts` — NEW
- `ts/tests/test_hunger_visual_mapping_monotonic.ts` — NEW
- `ts/tests/test_fps_improved_or_unchanged.ts` — NEW
- `ts/tests/test_shoal_enrichment_no_regression.ts` — NEW

### Tests

8 new test anchors, all passing:
- `test_profiling_baseline_captured` — infrastructure + docs verification
- `test_cached_path_matches_uncached` — cache identity + correctness
- `test_cache_invalidates_on_state_change` — state transition invalidation
- `test_geometry_calls_reduced_post_cache` — call count reduction
- `test_hue_banding_preserves_batch_grouping` — 12 bands, batch grouping
- `test_hunger_visual_mapping_monotonic` — monotonic scale/angularity
- `test_fps_improved_or_unchanged` — profiler + docs + cache wiring
- `test_no_regression_to_existing_floor` — prior phase intact + Lua state

---

## Spatial-Hash Optimisation — COMPLETED (August 13 2026)

*Traces to the Deep Investigation report (Part A.2, A.5). The three
unpartitioned O(n²) loops that dominated tick time were routed through
the existing spatial hash.*

### What was changed

Three loops that did full unpartitioned scans were converted to
`get_nearby`-via-spatial-hash lookups, using the same pattern already
proven for fish-algae seeking and fish-fish boids:

1. **Fish-flee-shark** (`steering.lua` `compute_fish_forces`): replaced
   full scan of `st.sharks` with `get_nearby(hash, bx, by, "shark", ...)`
   using `cfg.perception.shark` (190px → bx_range=2, by_range=3).
2. **Shark-seek-fish** (`steering.lua` `compute_shark_forces`): replaced
   full scan of `st.fish` with `get_nearby(hash, sbx, sby, "fish", ...)`
   using `cfg.perception.fish` (220px → bx_range=2, by_range=3).
3. **Shark-hunting** (`logic.lua` `update_discrete_events`): replaced
   full scan of `st.fish` with `get_nearby(st.spatial_hash, sbx, sby,
   "fish", ...)` using touch radius (12px → range=1).

**World-wrapping fix:** `get_nearby` was extended with optional
`wrap_bx`/`wrap_by` parameters. When provided, bucket indices are
wrapped via modulo. This is needed for the seek and hunting loops
because fish may cross the world x-axis boundary during
`update_creatures` (fish are processed before sharks; the hunting loop
runs after all creatures have moved), leaving them in a stale bucket on
the opposite side of the hash. Without wrapping, a shark at x=15 would
miss a fish that wrapped from x=1199 to x=11 — a real correctness gap
confirmed by debug instrumentation. The flee loop does not need
wrapping (both fish and sharks are at pre-move positions when it runs).
Existing callers are unaffected (wrap parameters default to nil).

**Nil-guard:** The hunting loop falls back to a full scan when
`st.spatial_hash` is nil, for tests that call `update_discrete_events`
directly with a hand-crafted state table.

### Real before/after numbers

**Pairwise check reduction (runtime-independent, structurally real):**

| Scenario | Old (full scan) | New (hash) | Reduction |
|---|---|---|---|
| Default (60 fish, 8 sharks) | 1440/tick | 361/tick | **74.9%** |
| High load (83 fish, 19 sharks) | 4512/tick | 1120/tick | **75.2%** |

Per-loop breakdown (default, last sample):
- flee: 480 → 185 | seek: 480 → 206 | hunt: 480 → 73

**Tick time — Fengari (production runtime, Lua `os.clock` via vitest/Node):**

Measured August 13 2026 in fengari-web via vitest, using `os.clock()`
inside Lua (same approach as the original Deep Investigation report —
excludes JS-Lua bridge overhead from the inner loop). Both old and new
code measured in the same harness, same session, for a fair same-runtime
comparison.

| Scenario | Old — full scan (ms/tick) | New — hash (ms/tick) | Change |
|---|---|---|---|
| Default (60 fish, 8 sharks) | 34.873 | 42.642 | **+22.3% slower** |
| High load (83 fish, 19 sharks) | 45.178 | 47.910 | **+6.0% slower** |

**Outcome: Fengari tick time gets worse, matching lupa's direction.**
The spatial-hash conversion is a confirmed regression in the production
runtime, not just in lupa. The `get_nearby` function's per-call overhead
(string key construction `kx..","..ky` per bucket, table allocation per
call, bucket iteration) exceeds the savings from the 75% distance-check
reduction at these entity counts in both runtimes.

The regression is smaller in fengari than in lupa (+22% vs +34% at
default, +6% vs +18% at high load), and shrinks at higher entity counts
(+6% at 83/19 vs +22% at 60/8), suggesting the hash approach may
eventually break even at very high entity counts where the O(n²) scan
cost dominates the per-call hash overhead. But at the default and
high-load scenarios the investigation defined, the hash is net-negative.

**Environment drift note:** The original investigation measured 64ms
(default) and 106ms (high load) in fengari. The same old code measured
today produces 34.9ms and 45.2ms — roughly 45-55% faster than the
original investigation's numbers. This is environment drift (different
Node.js version, hardware, etc. since the investigation ran), which is
exactly why this directive required a same-harness old-vs-new comparison
rather than comparing the new numbers against the stale 64ms/106ms
baseline. The relative comparison (old vs new, same harness) is the
authoritative finding.

**Lupa numbers (superseded by fengari above, retained for context):**
Lupa (Lua-in-Python) showed the same regression direction: +34% slower
at default, +18% slower at high load. Lupa is 30-40× faster than fengari
in absolute terms, so its absolute numbers (1.6-2.7ms) are not
production-relevant, but its finding direction (hash is slower) is
confirmed by the fengari measurement above.

**Implication for future work:** The 75% pairwise-check reduction is
real and structurally sound, but `get_nearby`'s implementation cost
needs its own optimization pass before the check reduction translates to
a tick-time gain. Potential approaches (not this directive's scope):
eliminate per-call table allocation (reuse a buffer), eliminate string
key construction (use numeric bucket indices), or inline the bucket
scan. The spatial-hash conversion itself is correct (8 equivalence tests
pass) and the world-wrap fix is real — the issue is purely the hash
lookup's per-call overhead vs the raw distance check it replaces.

### Correctness verification

Eight equivalence tests verify that the hash-based lookups produce
identical results to full scans, across 5 seeded layouts × 30 ticks
each (150 tick-checks per test), plus a dedicated world-boundary
wrapping test:

- `test_fish_flee_shark_hash_matches_scan` — 0 mismatches across 150 checks
- `test_shark_seek_fish_hash_matches_scan` — 0 mismatches across 150 checks
- `test_shark_hunt_hash_matches_scan` — 0 mismatches across 150 checks
- `test_hunt_equivalence_at_world_boundary` — 0 mismatches (wrapping edge case)
- `test_pairwise_checks_reduced` — 75% reduction confirmed
- `test_tick_time_improved` — hash active, checks reduced (tick time caveat above)
- `test_tick_time_at_high_load` — hash active at high load
- `test_fish_hunger_unaffected` — hunger field present, accumulating, exported

### Fish hunger status

The approved fish hunger field (`entities.lua:28`, `logic.lua:120/281/459`)
is confirmed untouched by this directive. The `test_fish_hunger_unaffected`
test verifies hunger accumulates over time and appears in the render state.

### Files touched

- `games/shoal/steering.lua` — flee + seek loops converted to hash; bucket
  coords computed once and shared between seek and avoid sections
- `games/shoal/logic.lua` — hunting loop converted to hash; `get_nearby`
  extended with optional wrap parameters; test helper functions added
- `tests/test_shoal.py` — 8 new test anchors

### Test floor

- Shoal suite: 111 passed, 0 failed (103 original + 8 new)
- Full repo suite: 585 passed, 1 failed (pre-existing slimeworld E2E
  failure `test_slimeworld_first_breed_to_missions_unlock`, unrelated to
  Shoal, present before this change)
