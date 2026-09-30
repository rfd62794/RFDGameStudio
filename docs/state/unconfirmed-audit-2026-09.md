# Unconfirmed-Games Audit — September 2026

*Generated: 2026-09-29 · branch `directive/rfdgamestudio-audit-unconfirmed-games-directive`*
*Method: direct file read of each game's real source, its own `docs/state/`
file, and `git log` recency. Where the StatusBoard disagrees with what the
files show, the files win (per the board's own rule).*

**Verdicts (one line each):**

- **SlimeGarden → retire** (ADR-023 already resolved it: origin project, merged with SlimeBreeder into live SlimeWorld; board row was stale).
- **7 Days to Fry → hold** (complete, tested external demo — it IS registered in `GAME_REGISTRY`; the directive's "not in registry.ts" premise is stale).
- **TurboShells → hold / blocked** (no game code exists in this repo at all; needs Robert's ADR-013 path decision before anything else).
- **VoidDrift → polish-in-place** (shipped on itch.io, `cargo test` 48/48 green re-verified today; the flagged `OpeningCompleteEvent` bug is closed).

---

## 1. SlimeGarden — **Retire** (board row stale; classification already resolved)

**What exists.** `ts/src/games/slimegarden/config.ts` — a config-only entry
(no App/logic in `ts/`), `status: 'external'`, `supersededBy: 'slimeworld'`,
explicitly labeled an ADR-023 origin project. The real source is
`examples/slimegarden/` — a full AI-Studio React app (~3,545 lines in
`src/gameLogic.ts`, `App.tsx`, `types.ts` alone, plus 6 components and 9
action hooks). Last real code commit on the source: `2195f41f`
(2026-07-18); the source was tracked into the repo `0ecf80f4`
(2026-08-30). It does not build standalone in-repo (no `node_modules` in
`examples/`, no test suite of its own) — it is a preserved prototype, not
a runnable studio game.

**How far along.** The board's "SlimeDex, Life Stages, partial Color Tree"
claim is real but understated: the example contains SlimeDex
(`components/SlimeDexTab.tsx`), life stages (`stageFromLevel` in
`gameLogic.ts`, consumed by Lab/Specimen components), color genetics
(`COLOR_SPECS`, `COLOR_TARGETS`, `breedColors`, `getInterpolatedSpecs`),
plus dispatch/mediation/exploration/garrison/economy/upgrade hooks and a
15-node planet grid. `docs/slimegarden_recovery_manifest.md` (2026-07-18)
cross-referenced all 48 top-level exports against SlimeWorld: **22
RECOVERED** into SlimeWorld's `logic.lua`/TS, 26 flagged
NEEDS_HUMAN_REVIEW.

**What blocks it.** Nothing — it was never unconfirmed in substance.
ADR-023 (2026-08-23) already classified it as a Legacy/Origin project and
re-registered it in `GAME_REGISTRY` with `(Origin)` lineage; the repo's
own `docs/status.md` (Sep 3) lists it under "Retired (source preserved)".
Only the StatusBoard row still says `status_unconfirmed` — that is the
staleness this audit exists to clear.

**Recommendation: retire**, with SlimeWorld as the recorded successor —
matching exactly how its merge-sibling SlimeBreeder and the
CorpWorld/KingMaker rows are already presented (registered as origin
history, listed Retired on the board). No revive: its substance lives on
in the shipped SlimeWorld.

## 2. 7 Days to Fry — **Hold** (live external demo, not a stalled import)

**What exists.** `ts/src/games/7_days_to_fry/config.ts` — a config-only
entry, `status: 'external'`, `source: { kind: 'example', slug:
'7-days-to-fry' }`. **It IS in `GAME_REGISTRY`** (demos block,
`registry.ts` line ~70) — the directive's premise "not in registry.ts" is
stale. Real source: `examples/7-days-to-fry/` — ~2,855 lines of TS across
`sessionLoop.ts`, `steering.ts`, `economy.ts`, `demandCurve.ts`,
`stockEconomy.ts`, `wasteEconomy.ts`, `stationAssignment.ts`,
`taskExecution.ts`, `utilityScoring.ts`, `nightShop.ts`, `physics.ts`,
plus 10 React components (IntroScreen, NewGameScreen, KitchenCanvas,
NightScreen, VictoryScreen, GameOverScreen, etc.), `execution/` and
`scoring/` subdirs, a `tests/lineSimulation.test.ts` suite, and its own
`docs/` with 3 ADRs + `state/current.md`. Committed to the repo
`c203df7e` (2026-08-30); intake zip v0.1.0R1 dated 2026-08-04; present in
`website_collection` (built 2026-08-30 per PipelineAuditReport).
`vite.config.ts` has `base: '/arcade/7_days_to_fry/'` — the intake-era
404 warning is fixed.

**How far along.** Far further than "imported, no status since." Its own
`docs/state/current.md` (August 2026) records directive-driven work
through test anchor 241: a complete cooking-survival sim — 7-day session
arc with win/lose screens, worker utility scoring (needs, breaks, manager
autonomous repair), station degradation, bathroom queue/occupancy,
economy/demand/waste systems, deterministic seeded test harness
(241/241 green, `tsc --noEmit` clean, per its own state doc). That floor
is self-reported: `examples/` has no `node_modules` and the studio vitest
run doesn't cover it, so it can't be re-verified here without installing
deps (out of scope). Its studio-side registration compiles inside the
arcade's own suite.

**What blocks it.** Nothing structural — it is complete at v0.1.0R1 and
deployed as an external demo. The only open question is a promotion one:
whether it stays an external embed or gets a real TS-native port
(`ts/src/games/` has only its config stub; a port would be new work, not
a conversion). Its `config.ts` deliberately carries no `genre` — a
documented taxonomy gap ("cooking survival" fits none of the 11 curated
values).

**Recommendation: hold.** Keep it registered as the external arcade demo
it is — it's the only cooking-survival title on the board and costs
nothing to keep. If revived later, the single next step is a promotion
decision (TS-native port vs. permanent external status) plus wiring its
241-anchor vitest suite into a runner the studio actually executes.

## 3. TurboShells — **Hold/Blocked** (no in-repo code; needs Robert's ADR-013 decision)

**What exists.** Almost nothing in this repo. No `games/turboshells`, no
`ts/src/games/turboshells`, no `intake/turboshells`, no registry entry,
no sibling repo on disk (`C:\GitHub` has a `VoidDrift` repo but no
TurboShells one). What exists in-repo is documentation and derivatives:
`archive/rpgCore/archive/legacy_docs_2026/TURBOSHELLS_AUDIT_REPORT.md`
(2026-02-13) — a full audit of a legacy Python/pygame repo (81 files:
genetics, breeding/roster/shop panels, a 30-TPS race engine, terrain
friction tables) written to extract "constants of the soul" for a DGT
platform migration that never completed; `archive/rpgCore` task entries
(T024/T025 breeding + race sim, QUEUED Feb 2026, never worked);
`archive/rpgCore/demos.json` listing `turbo_shells` as status `"stub"`
pointing at `src/apps.turbo_shells` — a module that does not exist in the
tree; and adapted concepts (`src/shared/racing/race_engine.py` — "Adapted
from TurboShells"; `turbo_scout_demo.py` — "TurboShells concepts absorbed
into the DGT SDK"), all inside the archived rpgCore tree (archived
2026-09-13).

**How far along.** The original pygame game was real and substantial
(breeding + genetics + racing management, ~81 files per the audit). The
studio-side port is at zero: a stub registry entry in an archived tree,
two queued tasks, no entry point, nothing to build or boot. ADR-010 named
it a genuine cross-language-origin Lua exception "mid-port"; ADR-013
(August 2026) then confirmed that port **lapsed** and retired the
carve-out entirely.

**What blocks it.** Two things, concretely. (1) Its next step is a
decision, not code: ADR-013 says "whether their eventual build-out
continues toward a Rust core at all, or whether they too move toward
TS-native... worth a direct decision, not an inferred one." (2) The
original source repo isn't on this machine — only the audit doc of it is
in-repo. Any revive starts by locating the legacy repo, then choosing
TS-native vs. the abandoned Rust/Python path.

**Recommendation: hold** (board status `blocked`). Do not retire — the
design is still referenced by live docs (`EngineExpansionMap` cites its
terrain-affinity and data-driven-visual-expression patterns for future
templates). Do not schedule a revive until Robert makes the ADR-013 path
call; if revived, treat it as a TS-native rebuild from the audit doc, not
a continuation of the lapsed port.

## 4. VoidDrift (native) — **Polish-in-place** (shipped; flagged bug closed)

**What exists.** A real sibling repo at `C:\GitHub\VoidDrift` —
Rust/Bevy/Android + WASM, `Cargo.toml`, `src/` (Layer 1/2/3 architecture:
components/, systems/{game_loop,narrative,ui,visuals,...}, scenes/),
`android/` gradle wrapper, `web/` pilot, `pkg/` WASM artifacts,
`docs/state/current.md` (May 2026, v3.1.0-sprint5-visual-overhaul). Clean
git status on `main`. Note: `ts/src/games/voiddrift/` in this repo is the
*same project's* itch.io embed (label "VoidRift", `externalUrl`
rdug627.itch.io/voidrift) — the arcade already embeds the shipped WASM
build; `voiddrift_redux` is a separate web reimagining. **Build check
re-verified 2026-09-29: `cargo test` compiles clean and runs 48/48 green**
(unit + integration: drone dispatch, fleet invariants, FSM, economy,
scout systems). Committed build artifacts corroborate (debug APK +
`pkg/voidrift_bg.wasm` on disk). Last real `src/` code commit 2026-05-17;
docs/CI/roadmap churn through 2026-09-28 (roadmap approved Sep 22).

**How far along.** Shipped, not mid-build: README (updated Sep 14)
declares "Phase 4a Complete — v2.8.7-tutorial-4a — Live on itch.io";
`docs/state/current.md` documents a deep system inventory (4-ore economy
→ ingots → components → drone assembly, autonomous drone FSM, station
repair, quest chain, 30+ signal triggers, tutorial T-101–T-106, save/load,
main menu). Phase 4b (narrative drops) is the recorded next phase;
Google Play launch blockers are its own tracked pending items.

**What blocks it.** The flagged `OpeningCompleteEvent` blocking bug is
**closed**. The event is defined (`components/events.rs:36`), registered
(`lib.rs:154`), emitted by `opening_sequence.rs` (line ~104, "Opening
complete. Firing OpeningCompleteEvent."), and consumed by
`narrative_events.rs` + `content_router.rs` — wired as part of the
completed Phase 3b event-bus refactor (ADR-011). The stall era is visible
in history (May 16–17: scout dispatch conflict fix, "simplify opening
sequence completion by despawning ship," added stall diagnostics), after
which the game shipped publicly and its own Known Technical Issues table
lists only tech debt (god classes, hardcoding) — no open opening/event
bug. A blocking opening bug is also incompatible with a shipped, playable
itch build. Real blockers remaining are its own: audio pass, store
assets, tutorial refinement (issues #5, #9, #13).

**Recommendation: polish-in-place.** It is live and green; continue its
own roadmap rather than re-classifying it. Single next step: Robert picks
between Phase 4b narrative drops and the Google Play launch-blocker sweep
(store assets, audio pass, production-tree zoom) already tracked in
`VoidDrift/docs/state/current.md`.

---

## Board changes applied

`ts/src/status/board.data.ts` updated to match findings, and
`docs/state/StatusBoard.md` updated to the identical output
`generateMarkdown` would emit (row order preserves `board.data.ts` array
order per category: TurboShells appends to §2, SlimeGarden leads §4).
Note: `npx vite-node ts/tools/generate-status-board.ts` is outside this
run's permitted commands, so the regeneration was applied by hand-edit —
re-running the generator later will produce the same file.

| Game | Was | Now |
|---|---|---|
| SlimeGarden | `status_unconfirmed` (ai_studio_track) | `retired` (retired), supersededBy SlimeWorld |
| 7 Days to Fry | `status_unconfirmed` | `shipped_mature` — complete external demo, in registry + website collection |
| TurboShells | `status_unconfirmed` (ai_studio_track) | `blocked` (separate_infrastructure) — decision needed per ADR-013, no in-repo code |
| VoidDrift | `status_unconfirmed` | `shipped_mature` — live on itch.io, `OpeningCompleteEvent` closed, 48/48 `cargo test` green |
