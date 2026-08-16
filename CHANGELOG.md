# Changelog

All notable changes to RFDGameStudio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **This file is a studio-wide summary.** Each entry is a concise one-line
> summary pointing to the per-project changelog for full detail (test
> counts, file lists, root causes, design decisions). For future plans see
> [ROADMAP.md](./ROADMAP.md). For architectural decisions see
> [docs/adr/](./docs/adr/). For current status see [docs/status.md](./docs/status.md).

---

## MBB sportsSim Ball Integration — COMPLETED

**Date:** August 15, 2026
**Directive:** Wire MBB's ball-possession data model to the real
`sportsSim/BallSystem.ts` API ported in the previous phase. Replace
`Agent.hasBall: boolean` with the real `Ball` entity (`held`/`loose`/
`in_flight` states, `carrierId`, `pos`, `velocity`). Fix the confirmed
both-down soft-lock bug structurally — the ball transitions to `'loose'`
via `BallSystem.looseBall()` when both receiving-team agents are down at
score-reset, and is recovered naturally via continuous proximity-based
pickup. No discrete assignment step that can fail.

### STOP rule satisfied

**Bug confirmed before fix:** A reproduction test
(`test_mbb_sports_sim_ball_integration.ts`) directly manipulated game
state to create the both-down scenario — player carrier deep in the end
zone, both opponent agents `'down'`, then ticked the match. The score
fired, possession switched to opponent, but no opponent agent had the
ball (`hasBallAgents.length === 0`), and the ball was frozen at center
(50, 30) with no carrier. The match would soft-lock from this point.

**Bug confirmed fixed:** The same scenario post-fix shows the ball
transitioning to `'loose'` state (`ball.state === 'loose'`,
`ball.carrierId === null`). After reviving one opponent agent at the
ball's position and ticking once, the ball is picked up
(`ball.state === 'held'`, `ball.carrierId !== null`). No soft-lock.

### What changed

Only `ts/src/games/mutant_battle_ball/simulation/mbbSimulation.ts`:

- **`Agent` interface:** Removed `hasBall: boolean` field. Possession
  is now tracked solely via `Ball.carrierId` + `Ball.state === 'held'`.
- **`MbbState` interface:** Replaced `ballX: number` / `ballY: number`
  with `ball: Ball` (from `sportsSim/types.ts`).
- **`getCarrier(agents, ball)`:** Now looks up `ball.carrierId` instead
  of scanning for `ag.hasBall`.
- **`assignRoles(agents, possession, ball)`:** Now checks
  `ball.state === 'held' && ball.carrierId === ag.id` instead of
  `ag.hasBall`.
- **Score-reset block:** If a valid receiver exists, the ball is
  assigned directly (preserving gameplay feel). If BOTH receiving-team
  agents are down, `BallSystem.looseBall(st.ball, null, { x: 0, y: 0 })`
  is called — the ball goes loose at center and is recovered naturally.
- **Continuous loose-ball pickup:** Added to the tick loop. Any active
  agent within 5.0 units of a loose ball picks it up. This is the
  structural replacement for the discrete assignment that could fail.
- **Tackle possession change:** `carrier.hasBall = false; ag.hasBall = true`
  replaced with `st.ball.carrierId = ag.id` (Ball state machine).
- **`buildMatchRenderState`:** `hasBall` is now a derived field
  (`st.ball.state === 'held' && st.ball.carrierId === ag.id`), preserving
  the public `MatchState` API. `ballX`/`ballY` derived from
  `st.ball.pos.x`/`st.ball.pos.y`.
- **`makeSubstitution`:** Uses `ball.carrierId` instead of `ag.hasBall`.

### What did NOT change (verified via git diff)

- **Steering functions:** `forceSeek`, `forceArrive`, `forceFlee`,
  `forceInterpose` — byte-identical
- **`computeAgentForces`:** byte-identical (only `getCarrier` calls
  updated to pass `st.ball`)
- **`moveAgent`:** byte-identical
- **Combat resolution:** `resolveTackle`, `resolveBlock`, `applyWound`
  — byte-identical
- **Stat system:** `calculateStats`, `getEffectivePartStats`,
  `rollMalfunctioningFailure` — byte-identical
- **Config constants:** All steering/combat/match config values
  unchanged
- **`MatchState`/`MatchAgent` public API:** Unchanged — `hasBall`,
  `ballX`, `ballY` still present as derived fields

### Real sportsSim API used

- `import type { Ball } from '../../../engine/shared/sportsSim'`
- `import { BallSystem } from '../../../engine/shared/sportsSim'`
- `BallSystem.looseBall(st.ball, null, { x: 0, y: 0 })` — the real
  exported function, confirmed by reading `BallSystem.ts` line 121

### Explicitly NOT in scope (real, separate, deferred future work)

- **`UniversalDecisionSystem`** — MBB's own steering (seek/flee/
  interpose) stays exactly as it is. Swapping positioning logic is a
  real, much bigger change to MBB's actual feel and deserves its own
  directive and tuning pass.
- **`DisposalSystem`** — MBB currently has no disposal system at all
  (carriers only run); adding one is real new content, not a bug fix.
- **`CombatSystem`** — MBB's own `applyWound`/`resolveTackle`/
  `resolveBlock` stay exactly as they are. They are real, tuned,
  Lua-parity-verified, and not broken.
- **Tiered goal scoring** — MBB's scoring stays exactly as it is.

### Verification

- **Bug reproduction test:** 7/7 tests pass
  (`test_mbb_sports_sim_ball_integration.ts`) — confirms both the fix
  and that steering/combat/stats are unchanged
- **Full vitest:** 1241/1243 passing (2 pre-existing
  `test_dual_target_deploy.ts` git-state failures, unrelated)
- **tsc --noEmit:** 0 new errors in `mbbSimulation.ts` (4 pre-existing
  errors unchanged: unused `MatchAgent` import, unused `normalize`/
  `maxForce` locals, `PartsBySlot` conversion — all present before this
  change)
- **Git diff:** Confirms only ball-possession code changed; steering,
  combat, and stats functions appear only as context lines, never as
  added/removed lines

### Test anchors

7 tests in `test_mbb_sports_sim_ball_integration.ts`:
- `test_both_down_softlock_fixed` (2): both-down scenario → ball goes
  loose, recovered after revive; normal match flow still works
- `test_steering_combat_stats_unchanged` (4): steering config, combat
  config, `calculateStats`, match config — all unchanged
- `test_real_sports_sim_api_used` (1): source file imports `Ball` type
  and `BallSystem` from `sportsSim`, uses `BallSystem.looseBall()`,
  `Agent` interface has no `hasBall`, `MbbState` has `ball: Ball`

Also updated `test_sports_sim_engine_port.ts` anchor 5: renamed from
`test_mbb_untouched` to `test_mbb_sports_sim_wiring` — now verifies MBB
imports `Ball`/`BallSystem` from sportsSim while `DisposalSystem` and
`UniversalDecisionSystem` remain deferred.

---

## Sports Sim Engine Port — COMPLETED

**Date:** August 15, 2026
**Directive:** Port a complete, working generic sports-sim engine
(physical ball entity, foot/hand disposal, four-tier violence severity
ladder, Universal Decision System) from an AI-Studio prototype into
`ts/src/engine/shared/sportsSim/`, matching the real `combat/` barrel-
export convention exactly. MBB is the first intended consumer but is
explicitly not wired this phase — that's a deliberate separate next
phase.

### STOP rule satisfied

**Real source confirmed:** Zip extracted from
`C:\Users\cheat\Downloads\generic-sports-sim-engine-(foot_hand-+-lethal-combat) (2).zip`.
All 7 required engine files confirmed present with real byte counts:
`types.ts` (7135), `constants.ts` (5437), `BallSystem.ts` (7164),
`CombatSystem.ts` (8224), `DisposalSystem.ts` (13680),
`UniversalDecisionSystem.ts` (22107), `GameEngine.ts` (20027).

### What was ported

7 engine logic files into `ts/src/engine/shared/sportsSim/`:
- **types.ts** — Ball (held/loose/in_flight states), Player (with
  jumpReach stat), SportEngineConfig, SimEvent, all type definitions
- **constants.ts** — 3 preset configs (MBB Arena, AFL Cyber Deathball,
  Blood Bowl Blitz Grid) + 6 default player archetypes
- **BallSystem.ts** — Physical ball entity with flight arcs, ground
  friction, wall bounces, continuous pickup. The structural fix for
  MBB's possession-reset dead-lock bug: `looseBall()` never requires a
  successor carrier
- **CombatSystem.ts** — Four-tier violence severity ladder (stunned/
  down/casualty/fatal) with Blood Bowl failed-violence turnover rule
- **DisposalSystem.ts** — Kick/handball/touch_bounce disposal methods,
  AFL 15m anti-camping rule, real in-flight interception with two-axis
  proximity+height check using `jumpReach` stat
- **UniversalDecisionSystem.ts** — One scored-utility function every
  player runs through; role/situation determine weights, not code
  branches. 6 utility factors, dynamic man-mark assignments
- **GameEngine.ts** — Core simulation loop, 6v6 default roster, tiered
  goal scoring (3pts carried, 1pt otherwise), center bounce reset

### Barrel export convention

`sportsSim/index.ts` matches `combat/index.ts`'s exact pattern:
`export * from './<module>'` for each file. Top-level `shared/index.ts`
updated with `export * from './sportsSim'` and a real, cited
justification comment matching the existing style — citing the
confirmed MBB possession-reset bug, the structural fix (physical ball
object), and that MBB is not yet wired.

### Scenarios.ts disposition

**Excluded.** `Scenarios.ts` is AI-Studio demo content, not reusable
engine logic. It defines `ScenarioDefinition` with UI-display fields
(category, description, explanation) and setup functions that directly
manipulate `engine.players`/`engine.events`/`engine.ball` for the
visualizer demo. It's coupled to the AI-Studio `ScenarioSelector`
component. The `GameEngine` class itself is the reusable part; these
are demo presets. Not ported, not silently dropped — explicitly
excluded with stated reasoning.

### Strict-mode cleanup

The source tsconfig was lenient (no `strict`, `noUnusedLocals`,
`noUnusedParameters`). The studio's tsconfig has all three. 9
strict-mode errors were fixed with minimal changes that preserve logic
and API signatures:
- Removed unused imports (`TeamSide`, `InjurySeverity`)
- Prefixed unused parameters with `_` (`_rules`, `_ball`) to preserve
  public API signatures
- Fixed null-safety: `Map.get()` returns `T | undefined`, coalesced to
  `T | null` with `?? null`
- Removed unused local variable (`attackDir`) and unused private method
  (`getNearestOpponent`)

No engine logic was changed.

### Verification

- `tsc --noEmit`: 0 errors in `sportsSim/` (confirmed via grep for
  "sportsSim" in compiler output → 0 matches)
- Full vitest: 1233/1236 passing (3 pre-existing
  `test_dual_target_deploy.ts` failures, unrelated)
- MBB confirmed untouched: `git status` on
  `games/mutant_battle_ball/` and `ts/src/games/mutant_battle_ball/`
  → zero changes
- No AI-Studio demo scaffolding leaked: directory listing confirms only
  `.ts` engine logic files present (no `.tsx`, no `components/`, no
  `App.tsx`, no `Scenarios.ts`)

### Test anchors

22 tests in `test_sports_sim_engine_port.ts`, all passing:
- `test_real_source_confirmed` (3): all 7 files present, no demo
  scaffolding leaked, barrel export present
- `test_verbatim_port_confirmed` (7): each file's key logic confirmed
  present verbatim (physical ball entity, four-tier severity, in-flight
  interception with jumpReach, Universal Decision System, tiered
  scoring, three preset configs)
- `test_barrel_export_convention` (4): export pattern matches combat/,
  all 7 modules exported, shared/index.ts exports sportsSim, cited
  justification present
- `test_scenarios_ts_disposition` (2): Scenarios.ts excluded with
  explicit justification
- `test_mbb_untouched` (2): no sportsSim imports in MBB simulation or
  App.tsx
- `test_engine_functional_smoke` (4): GameEngine runs 100 ticks with
  events, physical ball eliminates dead-lock bug, combat severity
  ladder works, Universal Decision System produces role-specific weights

### Next phase

Wiring MBB to consume this engine is the real, deliberate next phase —
not implied as done. The engine is proven, isolated, shared code; MBB's
consumption of it is separate work.

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
