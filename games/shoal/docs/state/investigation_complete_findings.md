# Shoal Performance Investigation — Complete Findings

*August 2026 | RFDGameStudio | This document is the authoritative record
of the full investigation arc, from initial framerate concern through
closed verdict. Supersedes scattered partial numbers across individual
directive reports — this is the consolidated, reconciled record.*

---

## The original question

Shoal's tick time was measured at ~17ms in browser (fengari), against a
16.67ms/60fps budget — close enough to matter, not confirmed as to
cause. Rather than guess at a fix, the investigation ran in stages,
each one either confirming or overturning the previous stage's working
assumption. Every number below was directly measured, not estimated,
and every reversal in this document is real — nothing was smoothed over
to produce a cleaner narrative.

---

## Stage 1 — Deep Investigation (diagnosis, no fixes)

Read-and-report only. Found:

- **`update_creatures` dominates tick time at 83-87%**, scaling with
  entity count (confirming an interaction-loop cause, not fixed VM
  overhead).
- **Three unpartitioned O(n²) loops** were the real cost: fish-flee-shark,
  shark-seek-fish, shark-hunt-fish — each doing full scans instead of
  using the spatial hash already proven correct elsewhere in the same
  file (fish-fish boids, fish-algae seeking).
- **Lua VM architecture confirmed healthy**: single persistent VM, no
  per-tick reload, bytecode compiled once at load. Not the cause.
- **Cross-game Lua duplication audit**: only 2 of 11 flagged functions
  were real promotion candidates (`distance`, `lerp` — trivial math).
  `tick_game` itself was confirmed NOT a promotion candidate — Shoal's
  real complexity (predation, grazing, hunger, cold exposure, breeding,
  starvation) is genuinely unique among the studio's games. ADR-005's
  "named patterns, not shared binaries" held up under real scrutiny.

**Baseline established: ~64ms (default: 60 fish/8 sharks), ~106ms
(high load: 83 fish/19 sharks), fengari/browser.**

Full Stage 1 report: `investigation_lua_runtime_tick_perf_shared_logic.md`

## Stage 2 — Spatial-Hash Optimization (the fix)

Converted all three unpartitioned loops to hash-based lookups, matching
the pattern already proven elsewhere in the file.

- **Real bug found and fixed during implementation**: world-wrap hash-miss
  — a fish crossing the x=1199→11 boundary sat in a stale bucket a
  shark's search radius didn't reach. Fixed by adding wrap-aware bucket
  lookup to `get_nearby`.
- **Check-count reduction confirmed**: 74.9-75.2%, runtime-independent.
- **First tick-time measurement was in lupa** (Lua-via-Python), not
  fengari — showed the hash-based version *slower* than full-scan
  (+18-34%). Correctly reported as-is, not adjusted to look better.

## Stage 3 — Fengari Verification (same-runtime re-measurement)

Lupa's overhead characteristics don't predict fengari's. Re-measured
both old and new code in the actual production runtime, same harness.

- **Result: hash-based version confirmed slower in fengari too**
  (+22.3% default, +6.0% high load) — not a lupa artifact, a real
  finding.
- **Environment drift caught**: the original 64ms/106ms baseline,
  re-measured in this pass on the same unmodified old code, came back
  at 34.9ms/45.2ms — a ~45-55% difference from Node.js/hardware changes
  since the original investigation. This is why same-session,
  same-harness comparison matters more than trusting a stale number.

## Stage 4 — get_nearby Overhead Optimization (the real fix)

Profiled `get_nearby`'s per-call cost directly rather than guessing:
**48.3% string-key construction, 50.7% bucket iteration/insert
overhead, 1.0% table allocation** (correctly left unoptimized — not
worth the complexity for 1% of the cost).

- Fixed: integer bucket keys (replacing string concatenation), direct
  list append (replacing `table.insert`).
- **Confirmed real win**: 27.379ms (default), 34.560ms (high load) —
  21.5-23.5% faster than the original full-scan baseline, same runtime,
  same harness. **This became the validated baseline for everything
  after.**
- Honest ceiling stated at the time: even this win leaves Shoal
  ~1.6-2.1x over a 16.67ms/60fps budget.

## Stage 5 — Wasmoon Runtime Swap-Test (closed, loses)

Tested whether a WASM-compiled Lua VM (wasmoon) could beat fengari,
given vendor-documented raw-compute advantages.

- **Version mismatch found and fixed first**: fengari is Lua 5.3,
  wasmoon defaults to 5.4 — different `math.random` algorithms (C
  `rand()` vs. xoshiro256**) caused real simulation divergence under a
  fixed seed. Not a wasmoon bug — a real Lua-version semantic
  difference.
- **Fix**: routed all 6 real `math.random` call sites (found via full
  audit, not the 3 originally assumed) through the existing `make_prng` 
  LCG, already confirmed version-independent. Also fixed a real LCG
  precision bug in the process (`s * 1103515245` silently overflowing
  JS's float53 precision in fengari while staying exact in wasmoon's
  native 64-bit ints — fixed via split-multiplication).
- **First benchmark was internally incoherent**: interop measured faster
  than Lua-only in 3 of 4 cells — a physical impossibility. Root cause:
  a `wander_targets` upvalue in `steering.lua` persisting across
  re-init between the two measurements, silently coupling two runs that
  were supposed to be independent trajectories.
- **Clean, reconciled result**: wasmoon loses in all 4 cells, 1.25-1.93x
  slower than fengari, worst specifically under real interop (where
  wasmoon's async Promise-per-call bridge cost compounds).

**Final wasmoon numbers**: Lua-only 35.760ms/46.600ms; real interop
50.673ms/97.930ms (default/high load). **Branch closed.**

## Stage 6 — TS-Native Synthetic Benchmark (closed, wins definitively)

Faithful TS-typed-array port of the current (post-optimization) Lua
algorithm — same spatial hash, same world-wrap fix, same hunger state,
same LCG.

- **Two real concerns raised and resolved before accepting the result**:
  (1) entity-count drift between the TS and Lua runs could mean
  different workloads were measured — resolved by running both to 50
  warmup + 200 ticks under identical seed/config and confirming **exact
  entity-count matches** (50 fish/17 sharks/25 algae/13 chunks default;
  62 fish/17 sharks/32 algae/16 chunks high load — identical in both
  runtimes). (2) JIT-warmup ordering artifact (high-load measuring
  faster than default) — caught twice, fixed both times by ensuring
  full JIT warmup precedes the measured run.
- **Final, confirmed numbers**: TS-native 0.220ms (default) / 0.278ms
  (high load).

---

## The complete comparison, final and authoritative

| Approach | Default (60/8) | High load (83/19) |
|---|---|---|
| Fengari, original (unoptimized, browser) | ~64ms | ~106ms |
| Fengari, optimized (`get_nearby` fix) | 27.379ms | 34.560ms |
| Fengari, optimized, real interop | 28.685ms | 50.822ms |
| Wasmoon, Lua-only | 35.760ms | 46.600ms |
| Wasmoon, real interop | 50.673ms | 97.930ms |
| **TS-native** | **0.220ms** | **0.278ms** |

**Speedup, TS-native vs. fengari real interop: 130.4x (default), 182.7x
(high load). Headroom vs. 16.67ms/60fps budget: 75.8x (default), 60.0x
(high load).**

## Verdict

The spatial-hash and `get_nearby` work were real, correct, worthwhile
fixes — 21.5-23.5% genuine improvement, several real bugs caught and
fixed along the way (world-wrap, LCG precision, PRNG portability). But
they were optimizing within a ceiling that was never going to reach
60fps, because **the dominant cost was never the algorithm — it was
running that algorithm through an interpreted or WASM-bridged VM at
all.** The same logic in native V8 isn't a modest win, it's a different
category of number entirely.

**This closes the Lua-vs-alternatives investigation for Shoal
specifically**, and materially strengthens the case (already decided in
ADR-013, on different grounds — VoidDrift/TurboShells' Rust ports
lapsing) that TS-native is the studio's correct default. ADR-013 was
decided on portability and development-speed grounds; this investigation
adds a real, measured performance argument that wasn't available when
that ADR was written.

## Real, honest caveats — not everything this implies is proven

- This is Shoal's specific workload (steering/interaction math, moderate
  entity counts). It is not proof every Lua-ported game would see a
  similar ratio — a game dominated by branchy discrete-event logic
  rather than tight per-entity numeric loops could see a smaller gap.
- This was a synthetic, isolated benchmark, not a production migration.
  Real integration work (rendering hookup, save-state compatibility,
  UI wiring) was explicitly out of scope and unmeasured.
- No decision has been made to actually migrate Shoal's production code.
  This document establishes the real ceiling; it does not itself
  authorize the migration.

## What this opens up next

A TS-native cross-game duplication audit — same investigation-only
method that correctly found only 2 of 11 Lua functions were real
promotion candidates — applied to the TS-native game catalog, now with
a much stronger practical case: if TS-native is where new work is
heading and potentially where existing Lua games migrate to, knowing
which systems are genuinely shared (not just similarly named) matters
more than it did before this investigation closed.

---

*RFDGameStudio | Shoal Performance Investigation — Complete Findings |
August 2026 | Six stages, three real bugs found and fixed, one
definitive answer: the boundary was the bottleneck, not the algorithm.*
