# scrapcrawl scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: a "core loop port": room navigation, Scrap-to-Craft-to-Equipment economy with durability, D20 combat, win-only weapon proficiency (games/scrapcrawl/data.yaml:6-8, version "Phase A" at :4; ts/src/games/scrapcrawl/config.ts:7). Header still reads "PHASE A.1" (App.tsx:189). Nothing in the files read says what comes after the loop.
Working:
- Loop is wired through Lua: move_player, craft, resolve_fight (App.tsx:112,137,151; games/scrapcrawl/logic.lua:60,119,171); fight log WIN/LOSS (App.tsx:116-118).
- Python logic tests exist (tests/test_scrapcrawl.py, 31 test functions); standalone build exists (ts/package.json:15).
- Live: 0 console errors, "New Game" label found (docs/state/demo-audit-batch2-2026-10-03.md:19); first-run primer (App.tsx:95-98,173).
Rough:
- No win, loss, or run-end state found (grep of App.tsx and logic.lua for victory/game over/win: only the per-fight win and proficiency XP, logic.lua:207).
- No dedicated TS test; only generic arcade tests mention it (batch2:19 "mention only"; ts/tests/test_arcade.ts:9,106).
- Restart is only the title "New Game" (App.tsx:207); A3 passes by label only (batch2:19).
Class: improve - extends an existing, working Phase A loop; the direction past Phase A is not stated, so only Tier A is proposed.
Top 3 changes, in order: 1. Confirm A3 for real (New Game from a mid-run returns to the first screen, no reload) and fix if not. 2. Add a TS smoke test (title, New Game, move, fight). 3. Verify the A5 manifest screenshot and phone fit.
Out of scope: any end state, new rooms/items/enemies, balance, art, Lua-to-TS rewrite.
Dependencies / risks: shared Lua session and GameShell; the Python tests run under uv, not vitest.
Effort: S
Open question for Robert: what should a ScrapCrawl run end with (a goal, a boss, or stay an open scavenging loop)? No evidence in data.yaml or App.tsx; nothing past Tier A is proposed until answered.
