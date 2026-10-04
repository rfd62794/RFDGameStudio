# voiddrift_redux scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: TS-native "core loop" of VoidDrift: FSM Scout/Mining/Hauler drones, orbital fragments, Aluminum/H3Gas chain, tap-to-dispatch (ts/src/games/voiddrift_redux/config.ts:7; docs/RFDGameStudio_DemoPortingRoadmap.md:86). Already ported and polished (title screen, DriftPrimer, sfx: docs/directives/Revamp_VoidDriftRedux_Continue_Directive.md Status Done; ts/tests/test_voiddrift_redux_chrome.ts:1-17).
Working:
- Real simulation: 1218-line engine with manual dispatch, tier toggle, smelting (engine.ts; API per Port_Voiddrift_Redux_Core_Loop_Directive.md section 2); App.tsx 361 lines, loads clean in the audit (docs/state/demo-audit-batch2-2026-10-03.md:30).
- First-run primer persisted via a tutorial-seen flag (App.tsx:116-127).
- Phone layout passes (audit batch2:30).
Rough:
- "No visible restart" is an icon-only button: Reset World is a RotateCcw icon with title="Reset World" (components/SimulationControlsPanel.tsx:48-55; handler App.tsx:71-77), so A3 reads as failed.
- No persistence: only the tutorial flag is saved (App.tsx:125); world state is rebuilt on load; engine uses unseeded Math.random (engine.ts:216-222).
- Chrome test is source-grep only; no engine test (Port directive section 1) - already queued, do not duplicate.
Class: refine. Core loop exists; remaining gaps are labels, persistence, and tests.
Top 3 changes, in order: 1. Land the queued Port_Voiddrift_Redux_Core_Loop_Directive (adds `source` to config.ts and test_voiddrift_redux_engine.ts); 2. Give Reset a text label ("Restart") that returns to the first screen (A3); 3. Save/restore the world on reload or state "session only" in the UI (B2).
Out of scope: whatever the reconcile directive covers (source link, engine tests, roadmap note); splitting engine.ts or OrbitalCanvas.tsx (1033 lines); registering space_mining_sandustry or particle_void (roadmap:87-90); changing the sim's goals.
Dependencies / risks: item 1 touches config.ts and the roadmap, so item 2/3 directives should run after it merges; seeding the RNG would change the engine and is not proposed.
Effort: S
Open question for Robert: none
