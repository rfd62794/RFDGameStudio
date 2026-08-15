# AntSim Redux — Roadmap

Source: extracted from `docs/state/current.md` §2 (Explicit Roadmap &
Future Phase Confirmation). Completed items are marked; remaining items
are the active backlog.

Studio-wide roadmap: [`/ROADMAP.md`](../../ROADMAP.md)
Changelog: [`./CHANGELOG.md`](./CHANGELOG.md)

---

## Completed

- [x] **Phase 3b-1** Colony/Faction Architecture Refactor
- [x] **Phase 3b-2** Second Colony / Faction Emergence
- [x] **Phase 3b-3** Per-Colony Pheromone Recognition
- [x] **Phase 3b-4 Correction** Cargo exemption for repulsion
- [x] **Phase 3b-5** Hard Underground Boundary
- [x] **Phase 3b-6** Absolute Lane Boundary
- [x] **Phase 3b-6 Correction** Digging-phase boundary investigation
- [x] **Phase 4a** Worker Health Foundation
- [x] **Phase 4b** Anchor Hardening + Hunger & Worker Aging
- [x] **Phase 4c** Worker Max Age Tuning + Anchor 69 Hardening
- [x] **Phase 4d** Max Age Retune + Combat & Agency (`CombatSystem`)
- [x] **Phase 4e** Food as a Real Object
- [x] **Phase 4f** Infiltration / Theft / Defense & Food Drops
- [x] **Phase 4g** Delivery Relevance & Persistent Wander
- [x] **Phase 4h** Defense Location Scoping Correction
- [x] **Phase 5** SRP Extraction & Open/Closed Pathfinding

---

## Active Backlog

- [ ] **Visual Combat & Food Feedback** — Render visual indicators for
  engage/flee actions, combat damage sparks, or ground food stars in
  `src/render.ts`.
- [ ] **Tunnel Degradation** — Physical wear and structural maintenance
  logic (deferred until Chambers/Tunnels proven).
- [ ] **Phase 4 Idea — Dynamic Surface Exit Puncture Points** —
  Determine a colony's surface entrance point by where its own dug
  tunnel naturally breaks the surface (random/natural puncture point)
  rather than a fixed `(width/2, groundLevelY)` target.
- [ ] **Season / Day-Night Cycle** — Environmental state transitions.
- [ ] **Night Player Agent Layer** — Sleep, Repair, and Planning phases.
- [ ] **Contact-Based Knowledge Propagation** — Ant-to-ant direct
  communication.
- [ ] **Larva Death From Neglect** — Mortality for completely un-fed
  larvae.
- [ ] **Queen Max Age** — Target Queen-to-worker lifespan ratio: 5x
  (30,000 ticks), 10x fallback. Explicitly deferred from Phase 4b.
- [ ] **Linear-Law Combat** — Lanchester's linear law (chokepoint case)
  has nowhere to occur due to Hard Boundary system. Would require
  shared tunnel/chamber space or chokepoint geometry.
- [ ] **Interface Segregation** — `Colony` interface carries multiple
  concerns (nest state, queen state, chamber list, tunnel list, ant
  population, egg collection, pheromone grid). Candidate for splitting
  into `NestState`, `UndergroundTopology`, `PopulationState`. Deferred
  from Phase 5 to avoid scope creep.
