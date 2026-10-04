# slimeworld scope analysis (2026-10-03, Sonnet scope agent, registry status: stable)
Direction: TS-native creature-collector: breed slimes by color/shape/pattern, dispatch to planet regions, unlock regions by matching composite locks (ts/src/games/slimeworld/config.ts:8-12; tutorial.ts:15-22). Absorbs SlimeGarden + SlimeBreeder (both configs: supersededBy 'slimeworld'; docs/RFDGameStudio_DemoPortingRoadmap.md:39-40).
Working:
- Real game loop, 679-line App + 5 tabs, persisted via writeSave('slimeworld_save') (App.tsx:110-120) with a confirmed Hard Reset (App.tsx:358-362; OptionsMenu.tsx:19).
- 27 slime-related test files in ts/tests (ls ts/tests | grep -i slime); `build:slimeworld` exists (ts/package.json:12) and local ts/dist-slimeworld has <title>SlimeWorld</title> (read from live checkout).
- Onboarding: opening beat then 3 tutorial beats (App.tsx:601-618; tutorial.ts:3-22).
Rough:
- LIVE PAGE IS THE ORIGIN BUILD, not SlimeWorld: https://games.rfditservices.com/arcade/slimeworld/ serves <title>SlimeGarden...</title> and assets/index-DOvLH266.js, the same JS hash as /arcade/slimegarden/ (curl, 2026-10-03). Cause (read): config.ts:6 declares source {kind:'example', slug:'slimeworld'}, so studio_deploy_arcade copies examples/slimeworld/dist AFTER the dist-slimeworld standalone copy and overwrites it (studio_mcp/tools.py:805-830). examples/slimeworld exists only as an untracked copy of the SlimeGarden app (gitignored, .gitignore:193; live checkout examples/slimeworld/dist/index.html title SlimeGarden, built 2026-08-04).
- Phone overflow (390px, scrollWidth 476 vs 368, audit batch2 line 43) was measured on that origin build; the TS source's own phone layout is NOT verified (not read).
- Oversized files: MissionsTab.tsx 2117 lines, SlimeDexTab.tsx 953, EconomyTab.tsx 782 (wc -l).
Class: refine. The game is finished enough; the fault is the delivery path plus unverified phone layout.
Top 3 changes: 1. Fix deploy so /arcade/slimeworld/ serves ts/dist-slimeworld: change config.ts:6 source off kind 'example' (update ts/tests/test_registry_export.ts:11), then redeploy; 2. Re-run the phone audit (A4) against the real build and fix any overflow; 3. Add a headless balance/softlock test (B4) and a labelled in-game Restart/New Campaign entry (Hard Reset lives only inside Options, OptionsMenu.tsx).
Out of scope: new mechanics (roster caps, Legacy Slimes, Regents: ROADMAP.md:180-196), splitting MissionsTab, shared-UI migration, itch publishing, touching slimegarden/slimebreeder.
Dependencies / risks: removing the stray examples/slimeworld is a live-checkout change (Claude/Robert, not the directive); the site repo's static/arcade/slimeworld must be redeployed (outward-facing); docs/gdd/SlimeWorld_PublishPush_Directive.md:20-30 says `npm run build:slimeworld` failed silently with a workaround (npx vite build --config ...), not re-verified.
Effort: M
Open question for Robert: none
