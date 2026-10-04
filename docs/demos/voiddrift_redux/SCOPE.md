# voiddrift_redux scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: TS-native reimagining of VoidDrift as an idle mining sim: Mining/Hauler FSM drones, Aluminum/H3Gas chain, tap-to-dispatch, fragment-drift orbits (ts/src/games/voiddrift_redux/config.ts:6-9). It is the VoidDrift Core Loop demo of the roadmap's Tier 2 (docs/RFDGameStudio_DemoPortingRoadmap.md:86; docs/directives/Port_Voiddrift_Redux_Core_Loop_Directive.md:1-10).
Working:
- Real simulation: VoidDriftEngine, 1,218 lines (simulation/engine.ts), orbital canvas 1,033 lines (components/OrbitalCanvas.tsx); FSM inspector, radar and smelter panels.
- Live: 0 console errors, PAUSE and 1x/2x/4x controls (docs/state/demo-audit-batch2-2026-10-03.md:30); first-run primer (App.tsx:116-125).
- A reset control exists: id sim-reset-btn with a RotateCcw icon (components/SimulationControlsPanel.tsx:3,49-50; App.tsx:71,312).
Rough:
- A3 fails only because the reset is icon-only, no label found (batch2:30).
- Only a source-level chrome test exists (ts/tests/test_voiddrift_redux_chrome.ts); an approved directive adds engine tests (Port_Voiddrift_Redux_Core_Loop_Directive.md:16,159).
- No build script: registry.ts:111 lists it in STANDALONE_BUILD_GAMES but ts/package.json has no build:voiddrift_redux (grep: none). A7 fails; no explicit goal/end state (idle, as the original: "No win condition", voiddrift/config.ts:6).
Class: refine - the loop works; the gaps are a label, a script and tests.
Top 3 changes, in order: 1. Give the reset control a text label ("Reset" / "New Run"). 2. Add build:voiddrift_redux (A7), after the engine-test directive lands. 3. Phone check of the 1,033-line canvas and panels.
Out of scope: Scout drones/new FSM roles, station building (that is the separate station-sim demo), narrative, balance, replacing the VoidDrift embed.
Dependencies / risks: the Core Loop directive (Approved) edits config.ts and adds tests, so sequence after it; shares the "VoidRift Redux" family name with voidrift_station_sim and voidrift_particle_sandbox: do not reuse ids.
Effort: S
Open question for Robert: none
