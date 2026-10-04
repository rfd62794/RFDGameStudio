# planetforge scope analysis (2026-10-03, Sonnet scope agent, registry status: external)
Direction: ring-world god-game: 32-tile ring, sector soil stability, harvesting, monument construction (ts/src/games/planetforge/config.ts:6; examples/planetforge/src/App.tsx:1-4 "SectorZone Soil Upgrade Pass + Monument Construction"). Roadmap lists it as a real, registered external demo with a test suite (docs/RFDGameStudio_DemoPortingRoadmap.md:66).
Working:
- Complete app exists: App.tsx 271 lines, RingVisualizer 564, InspectorPanel 458, slimeEngine.ts 488; vite base is /arcade/planetforge/ (examples/planetforge/vite.config.ts:8); built dist present in the live checkout.
- Reset control present but icon-only, title="Reset Simulation World" (components/SimulationHeader.tsx:171-175); in-app Test Runner modal (App.tsx:26,265).
- ts/tests/test_planetforge_gameLogic.ts exists; Phase1 directive Status Done (docs/directives/PlanetForge_Phase1_TS_Directive.md:462).
Rough:
- NOT PUBLISHED: /games/planetforge/ and /arcade/planetforge/ both 404 (docs/state/demo-audit-batch2-2026-10-03.md:7,17). Cause read: config.ts has no `source` field, and the deploy only copies demos whose config has source kind example/sibling (studio_mcp/demos/registry.py:41-42; studio_mcp/tools.py:648-649,779-791). Compare antsim_redux/config.ts:5.
- The tested module ts/src/games/planetforge/gameLogic.ts (266 lines) is not what the game runs: App.tsx:21 imports ./engine/slimeEngine; the Phase2 directive calls gameLogic.ts dead code.
- Engine header says "SlimeWorld God-Game" (examples/planetforge/src/engine/slimeEngine.ts:2), a name clash with the shipped slimeworld demo.
Class: refine. The game is built; it lacks the registry source link and a deploy.
Top 3 changes, in order: 1. Add source {kind:'example', slug:'planetforge'} to config.ts (update ts/tests/test_registry_export.ts:26-27, which asserts the exact set of demos carrying source), rebuild examples/planetforge, then Claude/Robert redeploys; 2. Re-run the A1-A4, A8 audit on the live page (phone layout unverified, no page existed; A3: Reset is an icon, may need a text label); 3. Label the card honestly and add the screenshot (A5, A8).
Out of scope: deciding gameLogic.ts vs slimeEngine.ts (Phase2/2b directives; Phase2b is Approved), new mechanics, a TS-native rewrite, renaming the "SlimeWorld" text.
Dependencies / risks: deploy is outward-facing (site repo static/arcade/planetforge) and not part of the directive; examples/ dist is untracked so the build must be regenerated; overlap with queued Phase2b on the same example files.
Effort: S
Open question for Robert: none
