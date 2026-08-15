# Changelog

All notable changes to RFDGameStudio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **This file is a studio-wide summary.** Each entry is a concise one-line
> summary pointing to the per-project changelog for full detail (test
> counts, file lists, root causes, design decisions). For future plans see
> [ROADMAP.md](./ROADMAP.md). For architectural decisions see
> [docs/adr/](./docs/adr/). For current status see [docs/status.md](./docs/status.md).

---

## Paper Doll / Character Rendering

Full detail: [`ts/src/engine/paperDoll/CHANGELOG.md`](./ts/src/engine/paperDoll/CHANGELOG.md)

### August 14 2026
- **Full Technique Comparison POC** — 10 techniques rendered side by side at `http://localhost:5200/`. No winner declared; Robert picks. 19 test anchors. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#paper-doll--full-technique-comparison-side-by-side-poc-batch--completed-poc)
- **Bezier Curve POC** — Cubic Bezier paths via Catmull-Rom conversion at `http://localhost:5199/`. 11 test anchors. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#paper-doll--bezier-curve-primitive-isolated-proof-of-concept--completed-poc)
- **Recognizable Primitives** — Sigmoid limbs + real head ellipse. New `renderEllipse` primitive. 13 test anchors, 1025/1025 floor. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#paper-doll--recognizable-primitives-sigmoid-limbs--real-head-ellipse--completed)
- **Recognizability Investigation + Humanoid Grounding** — Fixed inert biological scaling (3/10 constants referenced). Kleiner's Law for limbs. Proportion corrections. 14 test anchors, 1012/1012 floor. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#paper-doll--recognizability-investigation--humanoid-grounding--completed)
- **Full ChimeraLab Pattern Port** — All 8 ranked portable patterns ported (FK rotation, biological scaling, hierarchical color, painter's algorithm, sigmoid bulge, posture-blend, BodyProportions, SkeletonManifest). 36 test anchors, 966/970 floor. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#paper-doll--full-chimeralab-pattern-port--completed)
- **Technique Study + Original Style Reference Pass** — DiceBear + boring-avatars study (MIT, code patterns only). 6 original creature presets. 28 test anchors, 994/998 floor. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#paper-doll--technique-study--original-style-reference-pass--completed)
- **Composite Character Rendering Module** — New `ts/src/engine/paperDoll/` module. Attachment graph, composer, 2 body plans. Wired into MBB + Chimera Wilds. 27 test anchors, 897/901 floor. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#paper-doll--composite-character-rendering-module--completed)
- **ChimeraLab Investigation** — Local clone at `C:\Github\reference-repos\ChimeraLab\`. 6 flagged files + 6 broader-pass files read. 8 portable patterns ranked. Zero changes to RFDGameStudio. [Full detail](./ts/src/engine/paperDoll/CHANGELOG.md#chimeralab-investigation--local-clone-investigation-only)

---

## Character Viewer

Full detail: [`ts/src/games/character_viewer/CHANGELOG.md`](./ts/src/games/character_viewer/CHANGELOG.md)

### August 14 2026
- **Real Arcade Entry** — Promoted from dev-only to arcade entry. New `'tool'` status category. 22 test anchors, 935/939 floor. [Full detail](./ts/src/games/character_viewer/CHANGELOG.md#character-viewer--real-arcade-entry--completed)
- **Page Scroll Fix (Bug 2)** — Fixed `overflow: hidden` clipping in arcade GameLoader. 5 test anchors, 998/998 floor. [Full detail](./ts/src/games/character_viewer/CHANGELOG.md#character-viewer--page-scroll-fix-bug-2--completed)
- **Paper Doll Shape Iteration Tool** — Dev-only standalone surface with live controls, side-by-side comparison, 3 reference presets. 16 test anchors, 913/917 floor. [Full detail](./ts/src/games/character_viewer/CHANGELOG.md#character-viewer-paper-doll-shape-iteration-tool--completed)

---

## Planet of Greed

Full detail: [`ts/src/games/planetofgreed/CHANGELOG.md`](./ts/src/games/planetofgreed/CHANGELOG.md)

### August 14 2026
- **Standalone Build for itch.io** — First standalone build (578KB). Fixed generator gap for zero-Lua games. Pushed to itch.io. 833/833 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planet-of-greed--standalone-build-for-itchio--completed)
- **Dual-Target Deployment** (with Shoal) — Website arcade rebuilt + deployed. Shoal standalone rebuilt fresh. Stale build caught. 833/833 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#shoal--planet-of-greed--dual-target-deployment--completed)
- **Boardroom Event Softlock Fix** — Fixed double-charging treasuryOffsets + $0-cost affordability check. 26 test anchors, 776/776 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planet-of-greed-boardroom-event-softlock-investigation--completed)
- **Attack Capability Fix + Aggressive Default Redesign** — Fixed UI-only attack bug. 9-rule aggressive heuristic. 33 test anchors, 750/750 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planet-of-greed-attack-capability-fix--aggressive-default-redesign--completed)
- **Shell Compliance + Opening Sequence** — GameShell wrap on all screens. TitleScreen added. 4-beat new-game-only opening. 33 test anchors + 6 E2E, 717/717 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planet-of-greed-shell-compliance--opening-sequence--completed)
- **Merge & Polish Op v2** — Guided per-Region walkthrough. Flavor text pass. Dark corporate visual identity. 9 Population Balance triggers. 42 test anchors + 6 E2E, 684/684 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planet-of-greed-merge--polish-op-v2--completed)
- **Merge & Polish** — Fixed CORPWORLD branding, RANK /5 -> /6, added Fragment counter. 12 test anchors + 4 E2E, 642/642 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planet-of-greed-merge--polish--completed)
- **Conversion + CorpWorld/KingMaker Retirement** — Converted from `examples/` to `ts/src/games/`. Extracted shared combat resolver + 5 components. Retired CorpWorld + KingMaker. 630/630 floor. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planet-of-greed-conversion--corpworldkingmaker-retirement--completed)
- **Phase 2: Rank, Population Balance & Displacement** — Rank = territory x 10 + avg opinion. Civic Unrest focus. Targeted displacement. 5 anchors. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planetofgreed--phase-2-rank-population-balance--displacement--completed)
- **Phase 1: Culture Corporations & Wheel Placement** — Six culture-tagged corps. Wheel-cyclic placement. Ember/Tundra max distance guaranteed (200/200). [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planetofgreed--phase-1-culture-corporations--wheel-placement--completed)
- **Phase 0: Fork & Scaffold** — Forked from CorpWorld. Byte-identical copy confirmed. Build succeeded. [Full detail](./ts/src/games/planetofgreed/CHANGELOG.md#planetofgreed--phase-0-fork--scaffold--completed)

---

## Shoal

Full detail: [`games/shoal/CHANGELOG.md`](./games/shoal/CHANGELOG.md)

### August 14 2026
- **Production TS-Native Migration** — Replaced fengari Lua executor with direct TS simulation. 151.7x speedup (0.230ms/tick vs 34.873ms). 807/807 floor. [Full detail](./games/shoal/CHANGELOG.md#shoal-production-ts-native-migration--completed)
- **Visual Enrichment + Performance** — Path2D caching (0.4ms draw time). Hunger visual mapping. Lineage hue banding. Fish hunger state (Lua). Render profiler. 8 test anchors. [Full detail](./games/shoal/CHANGELOG.md#shoal-visual-enrichment--performance--completed)
- **Spatial-Hash Optimisation** — 3 O(n^2) loops converted to spatial hash. 74.9% check reduction. 21.5-23.5% tick-time improvement. World-wrapping fix. [Full detail](./games/shoal/CHANGELOG.md#spatial-hash-optimisation--completed-august-13-2026)
- **Wasmoon Runtime Swap-Test** — Closed: wasmoon 1.25-1.93x slower than fengari. Fixed LCG 2^53 precision bug. Portable randomness fix. [Full detail](./games/shoal/CHANGELOG.md#wasmoon-runtime-swap-test--portable-randomness-fix-august-2026)
- **TS-Native Synthetic Benchmark** — 0.22-0.28ms/tick, 130-183x faster than fengari. 60-76x headroom. Closes investigation thread. [Full detail](./games/shoal/CHANGELOG.md#ts-native-synthetic-benchmark-august-2026--closes-the-investigation-thread)
- **Dual-Target Deployment** (with Planet of Greed) — Website arcade rebuilt. Shoal standalone rebuilt fresh post-migration. [Full detail](./games/shoal/CHANGELOG.md#shoal--planet-of-greed--dual-target-deployment--completed)

### Earlier
- **Performance Optimization + Shark Population Bounding** (v2.25.0)
- **Caching Optimizations Round 2** (v2.26.0)
- **Reef Decomposition Loop & Depth Band Markers** (v2.26.0 -> v2.27.0)
- **Reef Tuning & Chunk Avoidance** (v2.27.0 -> v2.28.0)
- **Grazing Loop Hash Query & Render Batching** (v2.28.0 -> v2.29.0)
- **Mechanics Popup & Depth Units** (v2.29.0 -> v2.30.0)
- **General Obstacle Avoidance** (v2.30.0 -> v2.31.0)
- **Flaky Test Fix, Daily Seed, Depth Tick Redesign** (v2.31.0)
- **Shared Menu Components & Shoal Title Screen** (v2.31.0)
- **Live Polish: Arcade Link Fix & Entry Point Glob Retrofit**

---

## Dissonance Depths

Full detail: [`games/dissonance/CHANGELOG.md`](./games/dissonance/CHANGELOG.md)

### August 14 2026
- **Live Deployment** — Arcade bundle rebuilt + deployed. itch.io standalone build pushed (build #1873500). HANDOFF: user handles dashboard visibility. [Full detail](./games/dissonance/CHANGELOG.md#dissonance-depths--live-deployment--completed-handoff)
- **BrewField Migration + Stub Phase Buildout** — Residue Field mechanic. Treasure/Store/Anomaly phases built. BrewField delisted. Dissonance standalone build path. 326/326 TS, 577/578 Python. [Full detail](./games/dissonance/CHANGELOG.md#dissonance-depths--brewfield-migration--stub-phase-buildout--completed)
- **Unmake Rebalance + Enemy Tier Classification** — Fixed DoT duration porting inconsistency (3 -> 2). Rebalanced 56-card power table. Enemy tier reclassification. [Full detail](./games/dissonance/CHANGELOG.md#dissonance-depths--unmake-rebalance--enemy-tier-classification--completed)
- **Placeholder Art Generation + Wiring** — 106 deterministic SVG assets (56 cards, 12 relics, 38 enemies). Wired into DeckBuild, Combat, Reward screens. [Full detail](./games/dissonance/CHANGELOG.md#dissonance-depths--placeholder-art-generation--wiring--completed)
- **Initial Lua Port & Anchor Tests** — Ported from examples/ to games/dissonance/. 55/55 Lua tests. [Full detail](./games/dissonance/CHANGELOG.md#dissonance-depths--initial-lua-port--anchor-tests--completed)

---

## SlimeWorld

Full detail: [`games/slimeworld/CHANGELOG.md`](./games/slimeworld/CHANGELOG.md)

### August 14 2026
- **Random Starting Color Foundation** — Replaced static Red start with runtime random pick from {Red, Blue, Yellow}. Real place-name resolution from `naming_reference.lua`. 6 test anchors, 307/307 floor. [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-random-starting-color-foundation--completed)
- **Options Menu + Hard Reset (Pre-Publish)** — Two-step confirm Hard Reset. `OptionsMenu.tsx` in header statusArea. 5 test anchors, 301/301 floor. [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-options-menu--hard-reset-pre-publish--completed)
- **Gate Missions/Economy Tabs Behind First Region Unlock** — `visibleTabs` gated by `state.regionUnlocks`. 5 test anchors, 296/296 floor. [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-gate-missionseconomy-tabs-behind-first-region-unlock--completed)
- **Wire Fealty Transition + Achievement Moment** — Fealty log entries now trigger AlertBox. 5 test anchors, 291/291 floor. [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-wire-fealty-transition--achievement-moment--completed)
- **Color/Culture/Strain Naming Correction** — Renamed `favor.culture` -> `favor.owner_color`, `state.culture_relationships` -> `color_relationships`. Pure rename, no behavior change. [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-colorculturestrain-naming-correction--completed)
- **Alert Box for Real-Time Notifications** — `AlertBox.tsx` for combat + stray detection alerts. [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-alert-box-for-real-time-notifications--completed)
- **Identity Alignment** — [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-identity-alignment--completed)
- **Demo Scope & Onboarding (Ember Path)** — [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-demo-scope--onboarding-ember-path--completed)
- **Region Lock-Down** — [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-region-lock-down--completed)
- **Fealty & Culture Favors (Rev 2)** — [Full detail](./games/slimeworld/CHANGELOG.md#slimeworld-fealty--culture-favors-rev-2--completed)

### Earlier
- **Fix Missing Level-Up Logic & Advance Cycle Button**
- **Fix Hardcoded Offspring ID** — breeding produced duplicate IDs
- **Implement Seed Purchase** — Lua + TS wiring
- **Fix handleAdvanceCycle** — missing mediation/dispatch/zone read-back
- **Fix Dispatch Resolution** — third instance of mission lifecycle bug
- **Fix Mediation Launch** — discarded Lua result
- **Split logic.lua into Multi-File Modules**
- **Onboarding Economy Corrections**
- **Wire Starter Slime Creation to Real Lua Stats**
- **Real Slime Shape Rendering (Phase 1: Geometry)**
- **Splicing Roster Bloat + SlimeDex Discovery**
- **Lifecycle Completeness Detector**
- **Compounding Breeding Tax by Generation**
- **Mission Serialization Fix + End-to-End Test Coverage**
- **Recovery Manifest Tool** — const-usage detection fix
- **Mediation Resolution Fix**
- **Color-Stat Data Deduplication**
- **Real Color + Shape Stat Computation**
- **Multi-Return Truncation Fix** — Phase 1
- **Framework Generation Layer, Module 1: Pure-Data Extraction**
- **Wanderer Petition Wiring**
- **Shared Data Layer + Lua->TS Field Safety Alarm**
- **Exploration Tests + Codex Wiring Fix**
- **Shape Codex Target Detection**
- **Color Codex Target Detection**
- **World Map Fix** (planetRegion never generated, v2: 20-Node replacement)
- **UI Real Tab Extraction**
- **Tier Economics + Richer Wanderer Petitions** — CERTIFIED
- **Worker Income + Garden Refugee Default** — CERTIFIED
- **Shape Naming, Breeding Cost, Wanderer Petitions** — CERTIFIED

---

## Mutant Battle Ball

Full detail: [`ts/src/games/mutant_battle_ball/CHANGELOG.md`](./ts/src/games/mutant_battle_ball/CHANGELOG.md)

### August 14 2026
- **Balanced-Speed Zero-Score Investigation** — FALSE ALARM: test fixture was not balanced (player had 2.8x power). Simulation confirmed symmetric with symmetric inputs. 10 test anchors, 862/865 floor. [Full detail](./ts/src/games/mutant_battle_ball/CHANGELOG.md#mutant-battle-ball--balanced-speed-zero-score-investigation--completed-false-alarm)
- **Production TS-Native Migration + Steering Movement** — Replaced fengari with direct TS simulation. Steering-based movement. [Full detail](./ts/src/games/mutant_battle_ball/CHANGELOG.md#mutant-battle-ball--production-ts-native-migration--steering-movement--completed)
- **Match Engine Investigation** — Diagnosed one-sided matches. Data-balance issue identified (parts-summing vs flat stats). [Full detail](./ts/src/games/mutant_battle_ball/CHANGELOG.md#mutant-battle-ball--match-engine-investigation--completed)
- **Minimal Real Game Loop** — Match -> earn iron -> buy parts -> equip -> next match. Workshop + Shop made real. 9 test anchors, 870/874 floor. [Full detail](./ts/src/games/mutant_battle_ball/CHANGELOG.md#mutant-battle-ball--minimal-real-game-loop--completed)

---

## AntSim Redux

Full detail: [`_check/antsim-redux/CHANGELOG.md`](./_check/antsim-redux/CHANGELOG.md)

### August 2026
- **Phase 4g Complete** — Delivery relevance pre-checks + persistent wander heading commitment. 120 test anchors passing. Phases 1-5 all complete: colony signaling, population dynamics, underground chambers, food lifecycle, trophallaxis, queen feeding, egg lifecycle, larval care, queen mortality + succession, tunnel digging, multi-colony system, per-colony pheromones, hard boundaries, lane boundaries, worker health, hunger + aging, combat + agency (Lanchester square-law), food as real object, infiltration/smuggling, defense scoping. [Full detail](./_check/antsim-redux/CHANGELOG.md)

---

## Shared Engine Modules

### August 14 2026
- **Shared Art Generation Module (`ts/src/engine/artGen/`)** — Extracted reusable parts of Dissonance's SVG generator + SlimeWorld's seeded polygon generator. `seededRandom.ts`, `types.ts`, `shapes.ts`, `index.ts`. Verified byte-identical to originals. 584/584 tests.
- **Shared Module Foundations** — `ts/src/engine/shared/` with 3 extractions: `seededRandom.ts` (mulberry32), `wheelRelation.ts` (from Brewfield), `partSlots.ts` (from Chimera Wilds + MBB). 18 new test anchors, 608/608 floor.
- **Visual Re-Haul: Reusable SVG Generator Module** — [Full detail in Dissonance changelog]

---

## Arcade / Registry / Infrastructure

### August 15 2026
- **ADR-014 Verification + Status Board as Arcade Page (ADR-015 + ADR-016)** — Verified 4 files. Status Board: 18 entries, arcade page (`?page=status`), Hugo site pages. ADR-015 + ADR-016 written. 1042/1042 floor (+10). [Full detail](#adr-014-verification--status-board-as-arcade-page-adr-015--adr-016)
- **Interactive Status Board — Site Pages (Hugo)** — 5 project detail pages + hub page on rfditservices.com. `sync_status_pages.py` sync script. 17 test anchors, 1060/1083 floor.

### Earlier
- **Test Suite Classification + Selective Scoping**
- **Arcade Registry — Reorder, Add Dissonance, Delist SlimeBreeder/Slimegarden**
- **Studio-Wide GameShell + TitleScreen Compliance Audit** (August 2026)
- **Shared UI Layer Compliance (ADR-008)** — CERTIFIED
- **Shared Logic Layer Compliance (ADR-007)** — Audit
- **Per-Game Builds & Itch Publishing**
- **Stage 3 Scaffolding Tool** — `studio_scaffold_game` (ADR-012)
- **Shared Marquee Identity** — CERTIFIED
- **Arcade Core System Hardening** — CERTIFIED
- **External Game Entries (VoidDrift)** — CERTIFIED
- **ADR-009 Shared Lua Utilities** — CERTIFIED
- **SlimeGarden Genetics Core, First Lua Port Slice** — CERTIFIED
- **Shared UI, First Real Migration (Slimeworld)** — CERTIFIED
- **ScrapCrawl Phase A** — Core Loop Port — CERTIFIED
- **ScrapCrawl Phase A.1** — Combat + Craft Gating Fix + UI Design Pass — CERTIFIED
- **Chimera Wilds Phase 1** — Minimal Encounter Loop — CERTIFIED

---

## ADRs

### August 15 2026
- **ADR-015** — Status Board as an Arcade Page
- **ADR-016** — Verification-Dated Staleness Claims

### Earlier
- **ADR-001** — Three-File Format Is the Canonical Game Definition
- **ADR-002** — Lua Is the Logic Layer
- **ADR-003** — Python Is the Phase 1 Runtime
- **ADR-004** — Claude Is a First-Class Participant
- **ADR-005** — Component Systems Are Named Patterns, Not Shared Binaries (superseded by ADR-009, ADR-014)
- **ADR-006** — Procedural Art Generation Is a Named Pattern with a Shared Engine Helper
- **ADR-007** — Primitive Registry — Naming Conventions and Lua Contracts
- **ADR-008** — UI Component Vocabulary
- **ADR-009** — Shared Lua Utility Primitives (supersedes ADR-005 for generic utilities)
- **ADR-010** — TypeScript-Native Origin Is Permitted
- **ADR-011** — Logic-Layer Modularization by Size, SoC, and SRP
- **ADR-012** — Port-Then-Conversion Pipeline
- **ADR-013** — Retire the Lua Cross-Runtime-Portability Carve-Out
- **ADR-014** — Shared Engine Modules Are the Default, Not the Exception (supersedes ADR-005 for game-system patterns)
