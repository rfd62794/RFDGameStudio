# Shoal — Repo State

*Last updated: August 14 2026*

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
excludes JS-Lua bridge overhead from the inner loop). All three
configurations measured in the same harness, same session, for fair
same-runtime comparison.

| Scenario | Old — full scan (ms/tick) | Hash — pre-optimization (ms/tick) | Hash — post-optimization (ms/tick) | Post-fix vs old-scan |
|---|---|---|---|---|
| Default (60 fish, 8 sharks) | 34.873 | 42.642 | **27.379** | **-21.5% faster** |
| High load (83 fish, 19 sharks) | 45.178 | 47.910 | **34.560** | **-23.5% faster** |

**Outcome: Optimized hash now beats full-scan in fengari.** The
spatial-hash conversion, after optimizing `get_nearby`'s per-call
overhead, is a confirmed real win in the production runtime — a
21.5-23.5% tick-time improvement over the original full-scan code at
both default and high-load scenarios.

**Profiling breakdown (get_nearby overhead optimization directive):**

Before fixing, `get_nearby`'s per-call cost was profiled via
`os.clock()` instrumentation across 200 ticks (~210 calls/tick at
default, ~272 at high load):

| Phase | Default (ms/call) | % of total | High load (ms/call) | % of total |
|---|---|---|---|---|
| Table allocation (`list = {}`) | 0.0015 | 1.0% | 0.0015 | 1.0% |
| String key construction (`kx..","..ky`) | 0.0722 | 48.3% | 0.0697 | 47.3% |
| Bucket iteration + `table.insert` | 0.0759 | 50.7% | 0.0755 | 51.7% |
| **Total** | **0.1496** | 100% | **0.1472** | 100% |

**Fixes implemented (matching profiling findings):**

1. **Integer bucket keys** (eliminates 48% cost): Replaced string key
   construction `kx .. "," .. ky` with integer-encoded key
   `kx * 100000 + ky` — one arithmetic operation instead of string
   concatenation, and Lua handles integer table keys more efficiently
   than string keys (no interning/hashing). Applied to both
   `rebuild_spatial_hash` (key construction) and `get_nearby` (key
   lookup). `100000` is safely larger than any possible `by` value
   (max `by = ceil(world_height/bd)-1 = 9`).
2. **Direct list append** (eliminates part of 51% cost): Replaced
   `table.insert(list, ent)` with `list[#list + 1] = ent` in both
   `rebuild_spatial_hash` and `get_nearby` — eliminates the function
   call overhead of `table.insert` per entity.
3. **Localised `buckets` table** (minor): `local buckets = hash[type]`
   hoisted out of the dx/dy loop in `get_nearby` — one table lookup
   instead of one per bucket.

**Not fixed (confirmed negligible by profiling):** Table allocation
(`list = {}`) was only 1% of per-call cost — not worth the complexity of
a reused/cleared-in-place scratch table.

**Environment drift note:** The original investigation measured 64ms
(default) and 106ms (high load) in fengari. The same old code measured
today produces 34.9ms and 45.2ms — roughly 45-55% faster than the
original investigation's numbers. This is environment drift (different
Node.js version, hardware, etc. since the investigation ran), which is
exactly why the verification directive required a same-harness old-vs-
new comparison rather than comparing against the stale 64ms/106ms
baseline. The relative comparison (old vs new, same harness) is the
authoritative finding.

**Lupa numbers (superseded by fengari above, retained for context):**
Lupa (Lua-in-Python) showed the same regression direction pre-fix: +34%
slower at default, +18% slower at high load. Lupa is 30-40× faster than
fengari in absolute terms, so its absolute numbers (1.6-2.7ms) are not
production-relevant. The fengari measurement above is authoritative.

**Remaining gap:** Even with the 21.5-23.5% improvement, the post-fix
tick time (27.4ms default, 34.6ms high load) is still ~1.6-2.1× over a
16.67ms/60fps budget. This directive answered "can hashing win" — yes,
it can. Closing the remaining gap to 60fps is a separate, larger
effort. The wasmoon VM-swap branch (see below) has been definitively
closed — it loses to fengari by 1.25-1.93x across all cells. The
TS-typed-array migration remains the real path to sub-16.67ms ticks if
that target is required; the Lua-side hash optimization has now
delivered what it can.

### Wasmoon Runtime Swap-Test + Portable Randomness Fix (August 2026)

**Directive:** Isolated benchmark to determine whether swapping
fengari (Lua 5.3, JS reimplementation) for wasmoon (Lua 5.4, WASM-
compiled official Lua C source) would deliver a cheaper performance
win than a TS-typed-array migration — benefiting all ten Lua games,
not just Shoal. Conducted in two phases: (1) correctness gate +
initial benchmark, (2) portable randomness fix + clean re-benchmark
with methodology correction.

**Package identified:** `wasmoon` v1.16.0 (ceifa/wasmoon, 691 GitHub
stars, MIT, Lua 5.4 via WebAssembly). The canonical, most-downloaded
package. A `wasmoon-lua5.1` fork exists (X3ZvaWQ, 137 weekly downloads)
but no 5.3-specific package was found. Fengari implements Lua 5.3
("port of PUC-Rio Lua 5.3 implementation to ES6", 32-bit integers).

#### Phase 1: Correctness gate — FAILED (math.random divergence)

Shoal's real Lua source was loaded through both VMs with the same seed
(42), same spawn counts (60 fish / 8 sharks), and 20 ticks. The render
states diverge:
- Fish positions completely different (e.g. fish_55: fengari x=460.9,
  wasmoon x=762.8)
- Algae nodule counts differ (fengari=43, wasmoon=41)
- Hunger values differ (fengari=0.1, wasmoon=0.025 after 20 ticks)

**Root cause — `math.random` PRNG algorithm change (Lua 5.3 → 5.4):**
- **Lua 5.3** (fengari): `math.random` uses C `rand()`, seeded by
  `srand(seed)`. Platform-dependent.
- **Lua 5.4** (wasmoon): `math.random` uses **xoshiro256\*\***, a
  completely different 256-bit PRNG.

**Complete `math.random` call-site audit (6 sites, not 3):**

| # | File | Line | Call | Purpose |
|---|---|---|---|---|
| 1 | `logic.lua` | 302 | `math.random()` | Fish breeding probability |
| 2 | `logic.lua` | 371 | `math.random()` | Fish escape chance |
| 3 | `logic.lua` | 417 | `math.random()` | Shark breeding probability |
| 4 | `entities.lua` | 164 | `math.random(min,max)` | Flesh chunk spawn count |
| 5 | `utils.lua` | 51 | `math.random()` | `random_float` helper (steering wander, entity spawn velocities, chunk positions) |
| 6 | `utils.lua` | 55 | `math.random(1,#list)` | `random_choice` helper (dead code — never called) |

#### Phase 2: Portable randomness fix

**Fix:** All 6 `math.random` call sites routed through the existing
custom LCG (`make_prng` in `state.lua`), which is version-independent.
The LCG is stored on `st.prng` during `spawn_initial_entities` and
accessed via `GAME_STATE.prng` in `utils.lua`. Fallback to
`math.random` when `st.prng` is nil (for tests that call functions
directly without `init_game`).

**LCG period and distribution verified:**
- Full period: 2^31 = 2,147,483,648 draws (multiplier 1103515245 is
  1 mod 4, increment 12345 is odd/coprime with 2^31)
- Session draw volume: ~56M draws/hour at 60fps → period lasts ~38
  hours of continuous gameplay
- Distribution: mean 0.4999, variance 0.0833 (both match uniform[0,1)
  expectations), 2D clustering max/min cell ratio 1.24 (no significant
  clustering)

**Critical LCG precision bug found and fixed during this phase:** The
original LCG `s = (s * 1103515245 + 12345) % 2147483648` produces
intermediate values exceeding 2^53 (~9×10^15), causing silent precision
loss in fengari (JavaScript doubles) while wasmoon (native 64-bit
integers) remains exact. This means the LCG was **never actually
version-independent** — the previous session's claim that "the `% 2^31`
masks off the high bits, so 32-bit vs 64-bit integer width doesn't
matter" was wrong. The multiplication happens *before* the modulo, and
the multiplication itself exceeds 2^53.

**Fix:** Split-multiplication to keep all intermediates < 2^47:
`s = ((s * MULT_HI % MOD) * 65536 + s * MULT_LO + INC) % MOD` where
`MULT_HI = 16838`, `MULT_LO = 20077`. Verified: all 20 LCG outputs
match bit-for-bit between fengari and wasmoon after this fix.

**Correctness gate re-run: PASSED.** Fengari and wasmoon now produce
field-identical render state (fish positions, shark positions, algae
nodule counts, chunks) under fixed seed 42, 20 ticks, with the
portable randomness fix applied to both VMs.

#### Phase 2: Clean benchmark — methodology correction

**Why the initial benchmark was untrustworthy:** The first benchmark
(both the previous session's 5.797ms claim and the first re-run in
this session) produced a physical impossibility — interop time was
*faster* than Lua-only time in 3 of 4 cells. Root cause: the Lua-only
and interop measurements ran separate 500-tick trajectories from
different starting states. The `wander_targets` upvalue in
`steering.lua` persists across `init_game` re-init calls (it's a
module-level table, not reset), so the second measurement started with
stale wander targets keyed by reused entity IDs, causing different
movement patterns and different population trajectories. The two
measurements weren't measuring the same computation.

**The "5.797ms wasmoon" number from the previous session:** Traced to
message 122 of the previous session's history. It was wasmoon's real
interop time (`performance.now()` around 200 `tickFn(0.1, {})` calls),
compared against fengari's **Lua-only** time (`os.clock()` inside a Lua
loop, no boundary crossing) — a mismatched comparison. The 5.797ms
number is not reproducible with clean methodology.

**Clean benchmark methodology:** Each measurement uses a fresh VM
instance. Fengari Lua-only uses the exact same `_test_measure_tick_time`
helper (os.clock inside Lua) that produced the validated 27.379/34.560ms
baseline. Wasmoon Lua-only uses the same helper. Real interop uses
`performance.now()` around per-tick JS→Lua calls with render-state pull.
No measurement reuses a VM that has already run a trajectory.

**Fengari baseline reconciliation:** Using the same methodology as the
validated baseline:

| Scenario | Validated baseline | This run | Delta |
|---|---|---|---|
| Default (60 fish, 8 sharks) | 27.379 ms | 28.654 ms | +4.7% (normal variance) |
| High load (83 fish, 19 sharks) | 34.560 ms | 33.688 ms | -2.5% (normal variance) |

Nothing regressed. The `get_nearby` optimization is intact.

#### Final benchmark results (authoritative)

| Measurement | Fengari | Wasmoon | Wasmoon/Fengari |
|---|---|---|---|
| **Lua-only (os.clock), default** | 28.654 ms | 35.760 ms | 1.25x slower |
| **Lua-only (os.clock), high load** | 33.688 ms | 46.600 ms | 1.38x slower |
| **Real interop (perf.now), default** | 28.685 ms | 50.673 ms | 1.77x slower |
| **Real interop (perf.now), high load** | 50.822 ms | 97.930 ms | 1.93x slower |

All 4 cells are internally coherent: interop ≥ Lua-only in every cell.
No physical impossibilities.

#### Verdict: Wasmoon loses, clearly

**Wasmoon is 1.25-1.93x slower than fengari across every cell**, worse
specifically under real interop where you'd most want the win — nearly
2x at high load. The async Promise-per-call overhead of wasmoon's
WASM interop layer roughly doubles real interop time vs Lua-only
(35.8→50.7ms default, 46.6→97.9ms high load), while fengari's
synchronous C-style interop adds negligible overhead at default load
(28.65→28.69ms) and moderate overhead at high load (33.7→50.8ms).

**The VM-swap branch is now definitively closed** — not inconclusive,
closed. This was the cheap branch, and it lost. That leaves exactly
two real paths from here:
1. **Keep squeezing fengari** — `get_nearby`'s fix already bought a
   real 21-24%, more may be possible but with presumably smaller
   marginal gains now.
2. **TS-typed-array migration** — the structural answer to the
   boundary-crossing cost this whole thread keeps running into. Given
   wasmoon's real interop overhead came in *worse* than fengari's
   specifically because of async-boundary cost, that's a strong
   indirect argument for removing the boundary entirely rather than
   continuing to shop for a faster VM to sit behind it.

**This directive was not wasted despite the negative answer.** It
closed a real, previously-open question with a trustworthy number
instead of a guess, and it fixed a genuine cross-version correctness
bug in the LCG (the 2^53 precision overflow) that would have mattered
regardless of which VM won — any future cross-runtime comparison or
determinism requirement would have hit the same silent divergence.

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
  extended with optional wrap parameters; integer bucket keys
  (`bx*100000+by`) replacing string concatenation; direct list append
  (`list[#list+1]`) replacing `table.insert`; localised `buckets` table;
  test helper functions added; `math.random()` calls at lines 302/371/419
  replaced with `st.prng()` (portable randomness fix)
- `games/shoal/state.lua` — `make_prng` made global; split-multiplication
  LCG fix (keeps intermediates < 2^53 for cross-VM bit-identical output);
  `st.prng` stored during `spawn_initial_entities`; `_seed_counter` for
  unique seeds when no explicit seed given
- `games/shoal/entities.lua` — flesh chunk spawn count routed through
  `st.prng` with `math.random` fallback
- `games/shoal/utils.lua` — `random_float`/`random_choice` routed through
  `GAME_STATE.prng` with `math.random` fallback
- `tests/test_shoal.py` — 8 new test anchors; 3 existing `get_nearby`
  tests updated for integer key format; 10 tests updated for portable
  randomness (explicit seeds, adjusted timing thresholds for new PRNG
  sequence)

### Test floor

- Shoal suite: 111 passed, 0 failed (103 original + 8 new)
- Full repo suite: 585 passed, 1 failed (pre-existing slimeworld E2E
  failure `test_slimeworld_first_breed_to_missions_unlock`, unrelated to
  Shoal, present before this change)
