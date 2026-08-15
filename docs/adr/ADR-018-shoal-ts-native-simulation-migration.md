# ADR-018: Shoal TS-Native Simulation Migration

**Status:** Accepted
**Date:** August 2026
**Related:** ADR-010 (TS-native origin permitted), ADR-013 (retire Lua
cross-runtime portability carve-out), ADR-014 (shared engine modules
default).

## Context

Shoal was the studio's most Lua-intensive game — a real-time ecosystem
simulation with fish, sharks, algae, and flesh chunks, all driven by
Lua logic executed through fengari (a JavaScript reimplementation of
Lua 5.3). A six-stage performance investigation traced the root cause
of framerate issues to the JS<->Lua boundary-crossing cost:

1. **Diagnosis**: O(n^2) full scans, 51-106ms tick time
2. **Spatial-hash fix**: 21.5-23.5% improvement, but still 1.6-2.1x over
   the 16.67ms/60fps budget
3. **Fengari verification**: confirmed real interop cost
4. **get_nearby optimization**: 74.9% check reduction
5. **Wasmoon swap-test**: closed — wasmoon is 1.25-1.93x slower than
   fengari (async Promise-per-call overhead)
6. **TS-native synthetic benchmark**: 0.22-0.28ms/tick, 130-183x faster
   than fengari, exact entity-count match

The benchmark proved the ceiling. The production migration made it real.

## Decision

Replace Shoal's fengari Lua executor call path with direct TypeScript
simulation functions. The execution path changed from
`call(session, 'tick_game', dt, input)` (crosses fengari boundary every
frame) to `shoalSim.tickGame(dt, input)` (direct TS function call, no
boundary crossing).

### What was preserved

- **Lua source preserved**: `games/shoal/*.lua` and `games/shoal/data.yaml`
  remain in the repo, untouched, per studio precedent (retired, never
  deleted).
- **RenderState shape unchanged**: the TS `buildRenderState` produces the
  exact same shape as the Lua `build_render_state`. The rendering layer
  consumes it unchanged.
- **Deterministic correctness**: same seed produces identical state
  across runs. Entity counts match exactly between TS port and fengari
  Lua (verified over 250 ticks at both default and high load).

### What was not preserved

- **The fengari executor path** is no longer used by Shoal. Other Lua
  games still use it. This is a Shoal-specific migration, not a studio-
  wide Lua retirement.
- **The `call` import** was removed from Shoal's `App.tsx` and
  `ReefPreview.tsx`. No other game was affected.

## Consequences

- **151.7x speedup in production** (0.230ms/tick vs 34.873ms/tick).
  The framerate issue is resolved — not optimized around, but
  structurally eliminated by removing the boundary crossing.
- **Shoal is now TS-native** per ADR-013's default posture. Lua is no
  longer in Shoal's hot path.
- **The Lua source remains as reference** — any future cross-runtime
  comparison or determinism requirement can still consult it.
- **The wasmoon branch is definitively closed** — the investigation
  proved that shopping for a faster Lua VM is not the answer. The
  answer is removing the boundary entirely.
- **Other Lua games are unaffected** — this is not a studio-wide
  migration. Each game's TS-native-vs-Lua decision remains per-ADR-013.
