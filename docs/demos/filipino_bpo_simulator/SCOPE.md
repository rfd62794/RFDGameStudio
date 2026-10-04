# filipino_bpo_simulator scope analysis (2026-10-03, Sonnet scope agent, registry status: dev, NOT PUBLISHED: 404)
Direction: "Call Center Tycoon": remote dialer operator tuning list purity/freshness and dialer pace against a daily quota, floor watched not commanded (intake/filipino-bpo-simulator/Design.md:6-27). Design.md is the stated source of truth (extracted/docs/state/current.md:41-43).
Working:
- List, dialer and quota systems with tests; current.md:9-12 reports 22 passing (not re-run by me).
- Vite base is set to /arcade/filipino_bpo_simulator/ (extracted/vite.config.ts:8); the MANIFEST.md:11 warning is for R1/R2 zips.
- Registry copy is complete (ts/src/games/filipino_bpo_simulator/config.ts:6-8, genre management-sim).
Rough:
- 404 at /games/filipino-bpo-simulator/ and /arcade/... (audit batch1:37); listed in STANDALONE_BUILD_GAMES (registry.ts:107) but no package.json script (audit batch1:37).
- ts/src/games/filipino_bpo_simulator/ holds only config.ts; playable source exists only under intake/.../extracted. current.md:16-18 lists DashboardView/FloorView, which are absent from extracted/src/components and App.tsx has no activeScreen.
- Design.md:27 replaces a screen-based UI with a permanent floor + bottom bar + popups, while current.md:3,16-26 describes screens. Which state is current is unverified.
Class: rework - the port is incomplete and the documented UI (Design.md:27-36) differs from the stated Phase 2 build.
Top 3 changes, in order: 1. Tier A: port extracted/ into ts/src/games, add build script and embed so it stops 404ing. 2. Reconcile extracted source with current.md, then build the Design.md UI architecture. 3. Replace the flat incoming-call coin-flip per Design.md:67 if it is still present (grep for 0.75 in extracted/src/App.tsx found none).
Out of scope: the five consumer verticals, Script system, agent-management menus, campaign arc (all deferred, Design.md:50-54), persistence redesign (Design.md:68).
Dependencies / risks: intake zips R1/R2 (MANIFEST.md); localStorage keys bpo_grid/bpo_agents (extracted/src/App.tsx:72-80); unverified that extracted/ matches R2.
Effort: L
Open question for Robert: none (Design.md settles direction); rebuild should wait on the item 2 reconciliation.
