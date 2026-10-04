# slime_coin scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: real-time coin pusher run: 15 rounds, rising target score (x1.5), chip-card synergies, tokens, shop (games/slime_coin/data.yaml:212-218; logic.lua end_round :256, shop_purchase :341, pairwise synergies :773). Config text: shooter, two-layer board, chip synergies (ts/src/games/slime_coin/config.ts:9). A roguelite round loop.
Working:
- Lua logic (920 lines) drives the whole run; TS renders it via useLuaCall (ts/src/games/slime_coin/App.tsx:3,60; games/slime_coin/logic.lua).
- Run-end screen with win/lose headline (App.tsx:394-404) and a first-run primer gated by OnboardingGate (App.tsx:71-76).
- Live: loads, "New Game" present, 0 console errors (audit batch2:21).
Rough:
- No dedicated tests: no slime_coin file in ts/tests (the slime tests there are SlimeWorld's).
- Only tutorial-seen is persisted (App.tsx:74,223); no run save or best score found.
- No `genre`: config comment reports a taxonomy gap (config.ts:12-14).
Class: refine - the loop is complete and passes Tier A; the gaps are tests and meta polish.
Top 3 changes, in order: 1. Add tests for the Lua/TS bridge (round end, card select, run_end). 2. Persist best score / rounds reached via shared persistence. 3. Phone-width playtest of BoardCanvas (screenshot "n/v", audit batch2:21).
Out of scope: new chip cards/coin types, balance changes, cross-run meta-progression, multiplayer, the archived Coin Pusher Arcade project (roadmap:76), a new genre value.
Dependencies / risks: Lua modular layer and shared components (GameShell, EndStateScreen); sound.ts duplication is the subject of docs/directives/Polish_Shared_Sfx_Directive.md (not read in full).
Effort: S
Open question for Robert: none
Update 2026-10-04: the math.pow Exchange bug is fixed and bridge tests plus a persisted best score landed. Queued: Slime_Coin_Lua_Entry_Point_Sweep_Directive, Slime_Coin_Blurb_Directive, Slime_Coin_Shop_Purchase_Fix_Directive. Not queued: the round recap panel (its "which chips fired" half needs a Lua addition, so decide that first).
Phone layout: not yet measured; framed until the first 390x844 pass.
