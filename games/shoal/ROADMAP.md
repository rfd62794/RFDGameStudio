# Shoal — Roadmap

Studio-wide roadmap: [`/ROADMAP.md`](../../ROADMAP.md)
Changelog: [`./CHANGELOG.md`](./CHANGELOG.md)

---

## Completed

- [x] **Pheromone signaling & foraging baseline** (Phase 1)
- [x] **Spatial-hash optimization** — three O(n^2) loops converted to
  hash lookups (74.9% check reduction, 21.5-23.5% tick time improvement)
- [x] **get_nearby overhead optimization** — integer bucket keys, direct
  list append, localized buckets table
- [x] **Wasmoon runtime swap-test** — closed (1.25-1.93x slower than
  fengari, not viable)
- [x] **Portable randomness fix** — all `math.random` call sites routed
  through custom LCG; split-multiplication precision bug fixed
- [x] **TS-native synthetic benchmark** — 0.22-0.28ms/tick, 130-183x
  faster than fengari, exact entity-count match
- [x] **Production TS-native migration** — fengari executor replaced
  with direct TS simulation (151.7x speedup in production)
- [x] **Visual enrichment** — Path2D caching (draw time 0.4ms), hunger
  visual mapping, lineage hue banding, fish hunger state (Lua)
- [x] **Render profiler** — reusable, toggleable via `?` key
- [x] **Standalone build for itch.io** — deployed via butler
- [x] **Dual-target deployment** — website arcade + itch.io

---

## Active Backlog

- [ ] **Typed-array data layout** — The TS-native port uses plain
  TypeScript objects (V8 shape-optimized), not Float32Array-backed
  typed arrays. A typed-array implementation would be faster than the
  already-0.22ms/tick number. The conclusion doesn't change either way,
  but this remains a real optimization path if needed.
- [ ] **Layered canvas split** — Investigigated and found not worth
  implementing post-caching (draw time 0.4ms, bottleneck is elsewhere).
  Revisit only if draw time becomes a bottleneck again.
- [ ] **Rewire Shoal's `drawFish`/`drawSharksBatched` to consume
  generated sprites** instead of raw Canvas primitives (deferred from
  artGen extraction).
