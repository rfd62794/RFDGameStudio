# horse_racing scope analysis (2026-10-03, Sonnet scope agent, registry status: stable)
Direction: horse breeding + Win/Place/Show betting + career sim (ts/src/games/horse_racing/config.ts:6-11; games/horse_racing/logic.lua:3-12 uses genetics, odds, market systems). Source: examples/horse-racing-&-breeding (AI Studio export); config.ts has no `source` field.
Working:
- Full systems: Stable, Breeder, Betting, Calendar tabs, SVG racers and race track (ts/src/games/horse_racing/components/, 3310 lines total with App).
- Persistence of funds, horses, history, slots (App.tsx:173-197); tutorial, mute toggle, bankruptcy end-state (App.tsx:200-210,509,588-595).
- A polish test covers tutorial, HUD, sound, bet rules (ts/tests/test_horse_racing_polish.ts:21-91); audit: loads, 0 errors (batch1 line 39).
Rough:
- Status mismatch: registered `stable` (config.ts:10) while the polish standard says only shoal is stable (docs/superpowers/specs/2026-10-03-demo-polish-standard.md:9; audit batch1 line 75). No build:horse_racing script (ts/package.json) and ROADMAP.md:251-254 lists pre-existing TS errors in this demo.
- "New Game" only dismisses the title (handleNewGame, App.tsx:200-205) and never clears the save; the other "restart" just dismisses the bankruptcy grant (App.tsx:212-215,595). There is no real reset (A3, B2).
- The polish test mostly reads App.tsx/RaceTrack.tsx source text (test_horse_racing_polish.ts:8-18), not behaviour.
Class: refine. Systems and loop are done; status, reset, build and test depth lag.
Top 3 changes: 1. Add a real Reset-save control and separate New Game from Continue (A3, B2); 2. Add build:horse_racing, fix its TS errors, and set status to `beta` until Tier B is met (A7); 3. Headless balance test: N races with a baseline bet strategy, no negative funds, bankruptcy reachable (B4).
Out of scope: new genetics/odds features, art pass, changes to logic.lua or engine systems, other demos.
Dependencies / risks: genetics/odds/market are shared Lua (engine/systems); a status downgrade changes the public arcade badge (Robert's call).
Effort: M
Open question for Robert: none
