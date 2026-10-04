# facility_escape scope analysis (2026-10-03, Sonnet scope agent, status `external`)
Direction: turn-based stealth puzzle where guards decide their next action before you move, over 8 generated rooms (examples/facility-escape/src/App.tsx:613-617; config.ts:7). Roadmap rates it real BFS guard AI plus an A* solver (docs/RFDGameStudio_DemoPortingRoadmap.md:63; guardAI.ts 271 lines, levelSolver.ts 701).
Working:
- Real systems: physics engine 654 lines, room generator 992, solver 701 (wc -l).
- Reset controls exist: "REGENERATE LEVEL RUN" and "RESET PROTOTYPE ATTEMPT" (src/App.tsx:704,774).
- Audit: loads, start button "INITIATE INFILTRATION", 0 errors (batch1 row facility_escape).
Rough:
- Prod bundle runs a test at import: `runExplicitDeadZoneRejectionTest()` logs 5 lines (src/utils/roomGenerator.ts:990-991; audit batch1 line 18).
- Blurb is a dev note ("property-based physical interaction rules and telecasted guard sightlines", ts/src/games/facility_escape/config.ts:7); no screenshot; no tests dir (ls examples/facility-escape).
- Embed of an AI Studio export, no TS-native port (config.ts:9,12). Phone layout only covered by the audit "pass".
Class: refine. Direction is clear and already built; the immediate work is shipping it cleanly as an embed.
Top 3 changes, in order: 1. Remove the module-load test call (roomGenerator.ts:990-991) and rebuild the embed. 2. Rewrite the blurb as a player-facing line. 3. Add a screenshot and a phone check. (TS-native rewrite is Wave 2 in the polish spec section 4 and is not proposed here.)
Out of scope: TS-native rewrite, new rooms/mechanics, solver changes, art, anything above Tier A.
Dependencies / risks: edit lives in examples/; the arcade embed rebuild path was not traced; touch roomGenerator only for that one call.
Effort: S
Open question for Robert: none
