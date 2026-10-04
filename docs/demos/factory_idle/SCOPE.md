# factory_idle scope analysis (2026-10-03, Sonnet scope agent, registry status: external, NOT PUBLISHED: 404)
Direction: tile-based factory automation sim (conveyors, power, research) with an armory storefront and customers (ts/src/games/factory_idle/config.ts:6; examples/factory-idle-precision-armory-phase2/src/types.ts:135,209 StorefrontStock/shelfStock; engine/gameReducer.ts:658 TICK). Roadmap calls it one project across 5 phases, originally "Armory: Storefront & Spindle" (docs/RFDGameStudio_DemoPortingRoadmap.md:65).
Working:
- Large reducer-driven sim engine, 1205 lines, tick loop at 400 ms (gameReducer.ts:146; src/App.tsx:35-45).
- Phase 2 dropped the Gemini/express dependencies phase 1 had (diff of the two package.json files).
- Source is a plain Vite app (examples/factory-idle-precision-armory-phase2/package.json).
Rough:
- 404 at /games/factory-idle/ and /arcade/factory_idle/ (audit batch1:36,69); Tier A items A1/A3/A4/A8 fail.
- Config has no `source` field (config.ts:1-14) and no build:factory_idle script exists (audit batch1:36), so which phase should ship is not recorded.
- No persistence, goal/win state or tests found (grep of App.tsx, engine, components for localStorage; types.ts for victory/goal: none). Roadmap says phases 2-5 are byte-identical, but only phase1 and phase2 dirs exist and they differ (diff -rq).
Class: refine - nothing playable is reachable; the first job is publishing what exists, not changing it.
Top 3 changes, in order: 1. Publish: choose the phase dir, add source mapping, build script and embed so the page stops 404ing. 2. Restart control and Tier A basics once it loads. 3. Phone-width layout check of the 812-line SvgWorkshopGrid.tsx.
Out of scope: new machines/recipes, offline progress, prestige, balance, Gemini features, phases 3-5.
Dependencies / risks: phase dir choice (1 vs 2); STANDALONE_BUILD_GAMES omits it; the site export may exclude it on purpose (audit batch1:69, unconfirmed).
Effort: M
Open question for Robert: Is Precision Armory meant to be published at all, and from which phase (phase2 dir)? Nothing past Tier A is proposed until answered.
