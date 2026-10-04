# dissonance scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: turn-based deckbuilding roguelike, Culture card combos, 5-floor descent (config.ts:7); phases opening, floorChoice, deckBuild, map, combat, reward, rest, treasure, store, anomaly (ts/src/games/dissonance/App.tsx:229-278). Logic is Lua+YAML, TS is UI only (docs/directives/Brewfield_Into_Dissonance_Directive.md:31-36); Brewfield chemistry already merged, directive Done (games/dissonance/CHANGELOG.md:7-24).
Working:
- Persistent runs: Continue/New Run on title (phases/TitlePhase.tsx:26; App.tsx:28-54,61-76), unlocked cards persisted (App.tsx:21,45), save cleared on victory/game over (App.tsx:48-53).
- `build:dissonance` exists (ts/package.json:9); 5 dissonance test files incl. zero-regression and shared-UI.
- Audit batch1:33: "▶ Start game", New Run, "← Arcade", 0 errors.
Rough:
- No sound/mute or tutorial hook found (grep of App.tsx and phases/ for sound/sfx/mute/tutorial hits nothing); first-minute clarity (B1) rests on the opening phase, which I did not play.
- No headless balance test: tests cover recovery, regression, art equivalence, not a bot run (ts/tests/test_dissonance_*.ts); run_state.lua is 1,494 lines (B4 risk).
- Run end offers only "Return to Title" (phases/RunEndPhase.tsx:27-28); no one-click new run, and no abandon-run control found in play.
Class: refine - loop, chemistry and saves are built; remaining work is chrome and verification.
Top 3 changes, in order: 1. Run-end "New Run" plus an abandon/restart control during a run (A3, B6). 2. Headless bot run through the Lua session: N floors, no softlock or negative HP/gold, win and loss reachable (B4). 3. Mute + SFX via engine/shared/sfx, as succession and wire_rust do (B3, B5).
Out of scope: new cards, cultures, floors or Brewfield features; moving logic into TS; merging the prototype; art regeneration.
Dependencies / risks: shared Lua runtime hooks (useLuaCall); any Lua change needs ts/tests/test_dissonance_zero_regression.ts green.
Effort: M
Open question for Robert: none
Update 2026-10-04: run-end New Run and two-click Abandon landed (PR #86, commit 17b68b14), so the "Return to Title only" finding above is stale. Queued: Lua_Executor_Stack_Reserve_Directive, Dissonance_Bot_Run_Test_Directive, Dissonance_First_Fight_Hint_And_Plain_Captions_Directive, Dissonance_Mute_And_Sound_Effects_Directive.
Phone layout: not yet measured; framed until the first 390x844 pass.
