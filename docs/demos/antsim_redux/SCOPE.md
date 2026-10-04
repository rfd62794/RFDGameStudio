# antsim_redux scope analysis (2026-10-03, Sonnet scope agent, registry status: external)
Direction: ant-colony simulation lab: pheromone trails, direct food sensing, multi-colony Lanchester combat, tunnel pathfinding (ts/src/games/antsim_redux/config.ts:7; examples/antsim-redux/docs/state/current.md:1-9; docs/RFDGameStudio_DemoPortingRoadmap.md:62,110-112 "genuine TS-native port ... real, substantial future work"). The player only places food and watches (examples/antsim-redux/src/App.tsx:242).
Working:
- Deep, modular sim: simulation.ts 928, tunnel_network.ts 590, combat.ts 196, colony_lifecycle.ts 195, pheromones.ts 135; tests/simulation.test.ts exists.
- Embed loads clean, Reset/Pause/1x-2x-5x controls in frame (docs/state/demo-audit-batch1-2026-10-03.md:28; App.tsx:254-261).
- Same-origin embed at /arcade/antsim_redux/ built from examples (config.ts:5,12).
Rough:
- Phone: frame content 394 px in a 374 px frame, horizontal scroll inside the game (audit batch1:28,71). Candidate contributors: main `p-6`, fixed 540 px canvas row, tab header (App.tsx:227,236,203-221); cause NOT verified in a browser.
- Stale labels: badge "Phase 2c" / "Trophallaxis" (App.tsx:195-196) vs "Phase 4g Complete" (current.md:1); tab says "Test Anchors (1-21)" (App.tsx:221) while the list includes id 28 (App.tsx:55).
- The in-app anchors "run" does not run tests: it sets status 'running' then, after a setTimeout, writes hard-coded 'passed' results (App.tsx:156-161); real tests are only in tests/simulation.test.ts.
Class: refine at Tier A. A TS-native rewrite is on the roadmap but not chosen, so none is proposed here.
Top 3 changes, in order: 1. Fix the 394 vs 374 px phone overflow (A4), confirm with a 390 px screenshot; 2. Make the anchors tab honest: run real checks or label it a static summary, and update the phase badge and tab count; 3. Label the card "embed" and add the screenshot (A5, A8).
Out of scope: TS-native port into ts/src/games, new sim mechanics, seeding the RNG (18 Math.random calls in src), player goals/objectives, splitting simulation.ts.
Dependencies / risks: examples/antsim-redux is edited in place, so an AI Studio re-import would overwrite it (cf. examples/systemic-extract/README.md "Improvement workflow"); redeploy is outward-facing.
Effort: S
Open question for Robert: yes. Keep antsim_redux as an embed of the examples/ app, or choose the TS-native rewrite (roadmap:110-112)? Scorecard rule 3 caps an external embed at Tier A until the rewrite is chosen. Nothing past Tier A is proposed.
