# RFDGameStudio — Roadmap

> **Format:** Now / Next / Later. No invented dates — items are ordered by
> priority and dependency, not by estimated completion. Items move from
> Later → Next → Now as they become actionable. Completed items are
> removed and recorded in [CHANGELOG.md](./CHANGELOG.md).
>
> **Source:** Extracted from the retired `docs/state/current.md` files'
> "Next step", "Deferred", "Still open", and "Future" sections. Each item
> traces to the directive that last touched it.

---

## Now

Active or immediately actionable items.

### Graphics & Styles

One plan joins every graphics thread: [`docs/superpowers/specs/2026-09-24-graphics-and-styles-plan.md`](docs/superpowers/specs/2026-09-24-graphics-and-styles-plan.md). It covers vector and pixel styles, raster,
sprite sheets and shading, and it is swarm-facing as `docs/ROADMAP.md` M6 and M8.

- **Robert picks a technique winner from the 10-technique comparison POC.**
  All 10 techniques rendered side by side at `http://localhost:5200/`.
  No winner declared by the POC. Robert's call which direction(s) to
  pursue. The plan's reading: the 32x32 pixel grid (technique 9) is a
  *style* over the same art, not a separate art set. (From: Full
  Technique Comparison POC)
- **Robert judges Bézier curve POC.** Open `http://localhost:5199/` and
  decide whether genuine Bézier curves look organic enough to pursue as
  a real artGen primitive. If yes, a directive to build it into artGen.
  If no, throw it away. (From: Bézier Curve POC)
- **Robert decides on shading.** ChimeraLab's shade factor / edge light
  was never ported, so every technique is flat colour (technique 10's
  finding). Yes means `shaded` becomes a style parameter (M6.8). (From:
  Full Technique Comparison POC)
- **Robert picks the pixel look and the first creature adopter.** The
  16-colour palette, 32 or 48 px, the pixel font (the archived
  `PublicPixel` has no licence file; confirm it or use an OFL font),
  and Chimera Wilds *or* Mutant Battle Ball as the second adopter after
  Dissonance. (From: Studio foundation spec §8-9)
- **Write `docs/GRAPHICS.md` (M6.1).** The source/style model, the
  vector / raster / canvas rule, and a size and load budget per side.
  (From: graphics plan)
- **Foundation overlay, juice and events (M8, foundation steps 2-4).**
  Only step 1 (the glossary) is built, and the spec's promised
  milestone never reached a roadmap. Dissonance's Brewfield residues
  stay invisible until the overlay lands. (From: Studio foundation spec)

### Planet of Greed

- **Culture stat asymmetry.** Six symmetric Houses under-sell a real
  choice. Resolving this means real balance work with real risk of
  introducing exploits. Deserves its own dedicated pass. Stat values
  have not been touched through any phase. (Deferred since Phase 1,
  restated through Merge & Polish Op v2)
- **AI decision-logic upgrade.** `generateAIWeeklyOrders` remains
  pure-random, zero rival-awareness. Explicitly named as a real,
  separate, unresolved design question. (Deferred since Phase 2)

### Mutant Battle Ball

- **Data-balance issue: parts-summing vs flat stats.** Parts-summing
  approach (`calculateStats` sums stats across 6 part slots) produces
  stats 2-3x higher than flat stats for the same "speed" input value.
  This is the first item to address before deeper design work can
  produce non-degenerate match outcomes. (Still deferred, confirmed by
  Balanced-Speed Zero-Score Investigation)

### Shoal

- **Simulation tick optimization.** Even after the 21.5-23.5% spatial-
  hash improvement, the post-fix tick time (27.4ms default, 34.6ms high
  load) is still ~1.6-2.1x over a 16.67ms/60fps budget. The TS-native
  migration (151.7x speedup) has closed this gap in production. The
  remaining Lua-side optimization headroom is presumably smaller marginal
  now. (From: Spatial-Hash Optimisation — closed by TS-native migration)

---

## Next

Actionable after "Now" items are resolved, or pending a design decision.

### Graphics & Styles

In plan order ([`docs/superpowers/specs/2026-09-24-graphics-and-styles-plan.md`](docs/superpowers/specs/2026-09-24-graphics-and-styles-plan.md)). Each step merges on its own, and games that don't adopt it are unchanged.

- **Tone roles resolve per style and theme (M6.4).** Move the Dissonance
  generators' hard-coded `ELEMENT_COLORS` onto roles and re-bless the
  byte-identical baseline. This covers **inline SVG for Dissonance
  theme reactivity**, since the static SVG files use baked hex colours.
  (Deferred; from graphics plan)
- **Deterministic rasteriser (M6.5).** Extends `svgToCanvas`: target
  size, quantise to the palette, 1px outline, integer upscale. Golden
  PNG hashes sit next to the M5.2 SVG goldens. (From: graphics plan)
- **Pixel style as a renderer option (M6.3, foundation step 5).**
  `ui.yaml` `style:`/`style_toggle:`, the pixel overlay look, and
  creatures through the rasteriser. Dissonance plus one creature game.
  (From: Studio foundation spec §8)
- **Sprite sheets: seeded export (M6.2), then a small Aseprite-JSON
  loader and player (M6.6).** This closes the tooling catalog's
  sprite-pipeline gap. (From: External Tooling Catalog §1)
- **First adopters (M6.7).**
  - Rewire Shoal's `drawFish`/`drawSharksBatched` to consume generated
    sprites instead of raw Canvas primitives. (Deferred from Shared Art
    Generation Module)
  - Rewire SlimeWorld's `SlimeVisual` to use the shared seeded-RNG and
    polygon utilities instead of its local copies. (Deferred from
    Shared Art Generation Module)
  - Give `creatureArt` its first real consumer, with `fallbackPathFor`
    falling back to a generated sprite. (From: anyCreature creatureArt
    seam)
- **Shading as a style parameter (M6.8).** Only if Robert says yes to
  shading. (From: Full Technique Comparison POC, technique 10)
- **Art on remaining Dissonance screens.** Codex/Roster gallery, Store,
  Treasure and Anomaly screens are still text-only. Draw them through
  the same generator in both styles. (Deferred from Dissonance
  Placeholder Art Generation)

### Paper Doll / Character Rendering

- **Brand/Cyber-Organic/Quality styling system.** `PartVisualState`
  (brand, lean, quality tier), semantic key resolution, wear/tear
  rendering. Waits for its own Design.md and directive. Per the
  graphics plan it builds on tone roles (M6.4) and the shading
  parameter (M6.8) rather than on new palettes. The hierarchical
  color resolution pattern from ChimeraLab (`resolveColor` + 13-part
  hierarchy) is already ported as the concrete system this has been
  waiting on. (Deferred since Paper Doll module creation)
- **Animation.** The Paper Doll module is static composition (a "current
  state" render), not a rigged/animated character system. (Deferred)
  The graphics plan's sprite-sheet export (M6.2) renders frames from
  `calculatePose`, which is the first step toward animation.
- **Body plans beyond the two real consumers.** Quadruped, insectoid,
  etc. are explicitly future data entries, not new engine code. The 6
  creature presets (Insectoid, Mammalian, Reptilian, Avian, Behemoth,
  Wraith) provide starting configurations. (Deferred)
- **Replacing placeholder art with hand-authored assets.** (Deferred)

### Planet of Greed

- **itch.io visibility toggle.** Both Shoal and Planet of Greed builds
  are live on itch.io via butler push. The Draft→Public visibility toggle
  on each project page is Robert's final call. (From: Dual-Target
  Deployment)
- **Dissonance Depths itch.io dashboard.** Build is live on Butler
  channel `html5` (build #1873500). User handles dashboard metadata
  (Release status, screenshots, AI disclosure, Public visibility flip).
  (From: Dissonance Live Deployment HANDOFF)

### Mutant Battle Ball

- **RosterTab squad selection.** `activeSquad` is still hardcoded to
  `[roster[0], roster[1]]`. Letting the player choose which two mutants
  to field is a natural next step. (Deferred from Minimal Real Game Loop)
- **InfirmaryTab.** Still inert. Injury management (repairing damaged
  parts, recovering downed mutants) is a separate future directive.
  (Deferred)
- **Brand Sets / OEM tiers / Gravekeeper system.** The full synergy
  system, deliberately deferred to its own directive once a Design.md
  exists. (Deferred)
- **Match Simulation depth.** Can build on the TS-native steering
  foundation, adding complexity to the movement/role system. (From:
  Match Engine Investigation)
- **Fight-Team GM Sim.** Can build on the confirmed-working substitution
  trigger and the TS-native simulation API. (From: Match Engine
  Investigation)
- **Parts Assembly sharing with Chimera Wilds.** The shared
  `Part`/`PartSlot`/`PartsBySlot` types are already in
  `engine/shared/partSlots.ts`; the TS simulation uses them directly.
  (From: Match Engine Investigation)

### Shoal

- **Moved to Graphics & Styles above (M6.7):** the `drawFish` /
  `drawSharksBatched` rewire to generated sprites, and SlimeWorld's
  `SlimeVisual` onto the shared seeded-RNG and polygon utilities.

### SlimeWorld

- **Per-role roster caps.** (Deferred from Worker Income directive)
- **Legacy Slimes.** (Deferred from Worker Income directive)
- **Squad-swap cooldowns.** (Deferred from Worker Income directive)
- **Permanent-ownership/contestable-upgrade question.** (Deferred from
  Worker Income directive)
- **Full Slimeworld UI migration to shared components.** First slice
  done (Button, StatBar). Full migration and migrations for other games
  remain future work. (Deferred from Shared UI migration)
- **Tier 3-4 color names.** SlimeWorld's current colors can reach tiers
  1-2 only. The asymmetry with the shape tier range (1-4) is expected.
  (Deferred from Tier Economics)
- **Regent system design.** The SlimeBreeder Regent system remains a
  separate, unresolved design question. (Deferred)
- **Full Culture-sourced Requisitions/Petitions board.** The complete
  Requisitions/Petitions system for Culture-sourced requests remains
  future work. (Deferred)

### SlimeGarden

- **Remaining SlimeGarden port slices.** Corporate, dispatch, mediation,
  economy, planet/territory, and full studio runtime/Arcade wiring
  remain future work. SVG polygon-clipping geometry remains in
  TypeScript permanently. SlimeBreeder receives its own port directive
  later. (Deferred from SlimeGarden Genetics Core)
- **Redundant `games/slimegarden/` cleanup.** (Deferred)

### AntSim Redux

- **Visual Combat & Food Feedback.** Render visual indicators for
  engage/flee actions, combat damage sparks, or ground food stars in
  `src/render.ts`. (From: Phase 4g roadmap)
- **Tunnel Degradation.** Physical wear and structural maintenance logic
  (deferred until Chambers/Tunnels proven). (From: Phase 4g roadmap)
- **Dynamic Surface Exit Puncture Points.** Determine a colony's surface
  entrance point by where its own dug tunnel naturally breaks the
  surface rather than a fixed `(width/2, groundLevelY)` target. (From:
  Phase 4g roadmap)
- **Season / Day-Night Cycle.** Environmental state transitions. (From:
  Phase 4g roadmap)
- **Night Player Agent Layer.** Sleep, Repair, and Planning phases.
  (From: Phase 4g roadmap)
- **Contact-Based Knowledge Propagation.** Ant-to-ant direct
  communication. (From: Phase 4g roadmap)
- **Larva Death From Neglect.** Mortality for completely un-fed larvae.
  (From: Phase 4g roadmap)

---

## Later

Long-term or speculative items, pending foundational work.

### Graphics & Styles

- **Themes beyond vector and pixel.** Light and dark, and
  colour-blind-safe palettes, all through tone roles. (From: graphics
  plan)
- **Painted raster backdrops,** within the `docs/GRAPHICS.md` budget.
  (From: graphics plan)
- **Sheet-driven Paper Doll animation loops** (idle, attack), after
  pose frames (M6.2). (From: graphics plan)
- **Animations / hover states on Dissonance art itself,** through the
  juice primitives (M8.2). (Deferred from Placeholder Art Generation)

### Studio-Wide

- **Cross-game settings system.** SlimeWorld's Options Menu is
  SlimeWorld-only. A cross-game settings system is real, separate,
  future work. (Deferred from Options Menu directive)
- **Full `npm run build` (global arcade).** Still fails due to
  pre-existing TypeScript errors in `horse_racing`,
  `mutant_battle_ball`, and `slither_rogue`. Each game has its own
  standalone build path as a workaround. (From: Dissonance BrewField
  Migration)
- **Interface Segregation for AntSim Redux `Colony` interface.** The
  `Colony` interface carries multiple concerns (nest state, queen state,
  chamber list, tunnel list, ant population, egg collection, pheromone
  grid). Candidate for future splitting into `NestState`,
  `UndergroundTopology`, `PopulationState`. (Deferred from AntSim Phase 5)

### Paper Doll

- **Posture-blend interpolation between body plans.** The LERP-between-
  two-extremes concept is ported but needs real consumer wiring beyond
  the Character Viewer. (From: ChimeraLab Pattern Port)
- **Normalized coordinates for attachment offsets.** Sockets in -1..1
  range, scaled by a render `scale` factor at draw time. The Paper Doll
  module currently uses pixel-space attachment offsets. (From:
  ChimeraLab investigation)

### Shoal

- **Layered canvas split.** Investigated and found not worth
  implementing post-caching (draw time is 0.4ms, bottleneck is Lua tick).
  May be revisited if simulation complexity increases. (From: Visual
  Enrichment + Performance)


---

## Completed Threads (closed, recorded in CHANGELOG.md)

These investigation/design threads are fully closed. Listed here for
traceability — see CHANGELOG.md for full details.

- **Shoal performance investigation** — 6-stage arc complete. TS-native
  migration delivered 151.7x speedup. Wasmoon VM swap closed (loses to
  fengari). Spatial-hash optimization delivered 21.5-23.5% improvement.
- **Planet of Greed conversion** — Phase 0 (fork) through standalone
  itch.io build complete. CorpWorld/KingMaker retired (source preserved).
- **Paper Doll ChimeraLab port** — All 8 ranked portable patterns ported.
  Investigation-only clone at `C:\Github\reference-repos\ChimeraLab\`.
- **Dissonance Depths** — BrewField migration, stub phase buildout, art
  generation, live deployment all complete.
- **Status Board** — Arcade page + Hugo site pages complete. ADR-015
  and ADR-016 written.
- **AntSim Redux Phase 4g** — Delivery relevance pre-checks and
  persistent wander heading commitment complete. 120 test anchors
  passing.
