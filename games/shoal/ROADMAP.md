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

---

## Direction 2026-10-05 (PROPOSED milestones; see docs/demos/shoal/DIRECTION.md)

One engine, one page, two modes: Aquarium (ambient, nobody in control) and
Evolve (inspired by Flow, Spore, Everything Is Crab: visual, optional, branching paths; never gates the Aquarium; click a fish to become it; eat, grow, evolve cosmetic traits and
abilities; gentle stakes; world runs on normally around you; progress in
browser local storage only). Milestone style is PROPOSED (playable
slices); review model TBD, ask Robert.

- [ ] **M0 Aquarium** - exists; must always stay shippable. Finish the
  10-04 replan items (session-only label, reef report, rotate-hint).
- [ ] **M1 Be a fish** - click a fish, steer it, eat algae. New small
  modules under ts/src/games/shoal/evolve/.
- [ ] **M2 Grow** - growth stages from `fed`; eaten sets back one stage.
- [ ] **M3 Evolve** - cosmetic traits (color, fins, patterns) and
  abilities (speed, glow, camouflage); mode switch both ways.
- [ ] **M4 Keepsake** - local-storage save, summary, cabinet/itch
  presentation of both modes.

Constraint: new behaviour in small new modules (SOLID/SRP/KISS); no
vendor-scale promises.
