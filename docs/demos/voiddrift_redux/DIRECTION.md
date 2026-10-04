# voiddrift_redux direction (2026-10-04)
## What it tried to be
A TS-native "core loop" of VoidDrift: Scout/Mining/Hauler drone FSMs, orbital fragments, Aluminum/H3Gas chain, tap-to-dispatch (`config.ts:9`; roadmap `docs/RFDGameStudio_DemoPortingRoadmap.md:84-91`, originally `voiddrift_redux_1`). Landed as bb04d872 (2026-08-15: App, FSM inspector, radar, smelter, dispatch log), got GameShell in 39c0c1a9 (2026-09-20), TitleScreen + OnboardingGate primer + sfx in 99bd76a2 (2026-09-29), engine tests in 8971cbd8 (2026-10-04). Drift: a faithful port of an AI Studio sandbox that became a developer-style dashboard (FSM inspector, pass/fail diagnostics modal, radar queues) rather than the quiet idle game its Rust parent is.
## Where it is now
- Playable loop: yes. Real sim: `simulation/engine.ts` 1,218 lines; tests `ts/tests/test_voiddrift_redux_engine.ts` (153 lines) plus a chrome grep test.
- 4,015 lines in `ts/src/games/voiddrift_redux/`; `OrbitalCanvas.tsx` is 1,033 lines.
- No persistence: only the tutorial-seen flag is stored (`App.tsx:44-46`); the world is rebuilt with unseeded Math.random on every load.
- Restart exists but is icon-only: `handleResetSimulation` (`App.tsx:71`) behind a RotateCcw icon (`SimulationControlsPanel.tsx:48-55`); audit batch2 marks A3 FAIL.
- Dev-tool surfaces (FSMInspector 204, PassFailDiagnosticsModal 148 lines) are shown to players.
- Phone layout passes (audit batch2); no `build:voiddrift_redux` script (grep of `ts/package.json`).
## Player experience today vs the target
First 60 seconds: title screen, a short DriftPrimer, then a dense panel layout with 1x/2x/4x speed. Best moment: tapping a fragment to dispatch a hauler and watching ore become aluminum. Biggest turn-off: nothing survives a reload, and the screen reads like a debugger, so there is no reason to come back.
## Verdict
POLISH.
1. The simulation is the studio's best VoidDrift-family asset and already duplicates the web renderer (EVALUATION.md "Redundancy").
2. The gaps are a label, saves and over-exposed dev panels, all small.
3. It is the right single home for the family's persistence and tutorial work.
## Replan
- Phase 1 (S): Tier A. CUT: the icon-only reset (unclear to players). ADD: a text "Restart" returning to the title screen, and `build:voiddrift_redux`. Verify: the audit A3 row passes; `cd ts && npm run build:voiddrift_redux` exits 0.
- Phase 2 (M): keep your base. CUT: FSMInspector and the diagnostics modal from the default view (dev tooling; move behind a "Details" toggle). ADD: versioned localStorage save/restore with 5 s autosave (the one thing the web slice has, `VD:web/src/save.ts:9,33`) and an optional seeded RNG. Verify: a new engine test round-trips a save; a reload keeps drones.
- Phase 3 (S): a goal. ADD: one visible target ("smelt 100 H3Gas") with progress, no win screen (the parent has no win condition). Verify: unit test on the goal counter.
## First three directives
1. Redux Tier A: Restart label and build script. S. Depends on: none.
2. Redux save/restore, versioned key, with test. M. Depends on: 1.
3. Redux Details toggle for dev panels plus soft goal. S. Depends on: 1.
## Open question for Robert
Should the family be named apart so the cabinet reads as one story: "VoidDrift" (itch), "VoidDrift: Core Loop" (this), "VoidRift: Sandbox"? Default: yes, labels only, ids unchanged.
