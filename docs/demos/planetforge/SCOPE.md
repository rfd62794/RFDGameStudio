# planetforge scope analysis (2026-10-03, Sonnet scope agent, registry status: external)
Direction: planetary god-game sandbox on a 32-tile ring world: sector soil tiers and monument construction, play/step/speed controls; no win condition found (ts/src/games/planetforge/config.ts:6; examples/planetforge/src/App.tsx:1-4,34-37; grep of gameLogic.ts and App.tsx for win/goal/victory: none). Points at an open-ended simulation toy.
Working:
- Live engine is src/engine/slimeEngine.ts (App.tsx:16-21); real tests: engine/slimeEngine.test.ts, planetforge/gameLogic.test.ts, in-app TestRunnerModal.tsx.
- Reset World control exists (components/SimulationHeader.tsx:171-175; App.tsx:206).
- Monument cost/bonus rules implemented (planetforge/gameLogic.ts:244-264, flat bonus "LOCKED" at :248).
Rough:
- Not deployed: 404 at /games/planetforge/ and /arcade/planetforge/ (docs/state/demo-audit-batch2-2026-10-03.md:17, finding 1).
- Dead code: src/planetforge/gameLogic.ts is not imported by App.tsx (docs/directives/PlanetForge_Phase2b_Correction_Directive.md:3-7).
- A1/A3/A4 fail only because no page exists; blurb 19 words (batch2:17).
Class: refine - the sim exists and is tested; it is just not published.
Top 3 changes, in order: 1. Build and publish to /arcade/planetforge/ (embedUrl, config.ts:11). 2. Add a visible Start/intro and a one-line "what to do" (no goal exists). 3. Confirm phone fit of RingVisualizer.tsx (564 lines).
Out of scope: a win condition/goals, new soil/monument types, deleting gameLogic.ts, TS-native rewrite (wave 2 candidate), Gemini features (metadata.json lists a Gemini capability).
Dependencies / risks: PlanetForge_Phase2_Correction is Done (Phase2_Correction:166); Phase2b is byte-identical per its log and sits Approved (Phase2b:166), so a duplicate run could start; examples/planetforge is whitelisted at .gitignore:197.
Effort: S
Open question for Robert: none
