# scrapcrawl direction (2026-10-04)
## What it tried to be
A tiny crafting dungeon-crawl: move between rooms, collect scrap, craft disposable gear, fight on D20 rolls, with win-only proficiency as the hook. It began as a four-file Lua port of a "67-test original", with "real tier costs" (`4e862bb8`, 2026-07-08), then a UI rewrite (`476a0f7c`), then chrome (title screen `35fc337b`, primer and SFX `cbfcd49a`, 09-29). `examples/scrapcrawl` (tracked `0c416b4f`, 10-04) is the AI Studio original: "Headless room/interaction skeleton, scrap economy, tiered crafting, and proficiency" (`metadata.json`) with a companion and Gemini content layer. Intent drifted from "headless economy skeleton" to a playable but goal-less slice; "Phase A" is still in `data.yaml`.
## Where it is now
- Playable end to end: 5 rooms, 3 equipment entries, fights on injected D20 (`App.tsx:114`), crafting gated to craft rooms; logic in `games/scrapcrawl/logic.lua` (245 lines).
- Run end landed in `563ae4ad` (PR #117): TS `utils/runEnd.ts` makes it a win on clearing all fight rooms, a loss at 0 HP; player HP 10, loss costs 2, rest room heals fully. Those HP numbers are placeholders (settled).
- 543-line `App.tsx`, `build:scrapcrawl` exists; tests: `test_scrapcrawl_run_end.ts` only. No test covers resolve_fight/craft in Lua.
- Persistence: shared `loadSave/writeSave` imported (`App.tsx:22`); only the tutorial flag verified.
- Fights are a D20 roll against room `difficulty` (8, 12, 15 in `data.yaml:20-35`) with gear tier modifying stats (`baseStats` hp 15/30, `data.yaml:87-95`); with 10 player HP and 2 per loss, the odds were never checked end to end.
- `examples/scrapcrawl` is a separate, unwired app (1,637 lines of src); not a second game.
## Player experience today vs the target
First 60 s: title, primer, a room map, a fight button. Best moment (by design, not browser-verified): the first craft-then-win, since disposable gear and win-only proficiency make a fight feel earned. Biggest turn-off: a run is five rooms with no stakes tuning, so the first loss or win arrives without the player knowing why. Progress: proficiency is the only carry-over and it is not shown as a goal. Way back: shell control and Restart on the end screen.
## Verdict
**POLISH.**
1. The one real hook (win-only proficiency plus disposable gear) exists and has an end state now.
2. What it lacks is tuning and a reason to run twice, both data and small TS, no rewrite.
3. It is cheap to verify: the roll is injected, so the run is testable without a browser.
## Replan
1. Prove and tune (S-M). ADD: simulated-run test over `data.yaml` with fixed rolls: a winning path exists, losing is reachable, win odds per room are sensible at 10 HP; set real numbers replacing the placeholders. CUT: nothing. Verify: `cd ts && npx vitest run tests/test_scrapcrawl_*`.
2. Replay hook (M). ADD: show proficiency as the visible carry-over ("Sword 3/5"), keep it across runs via the shared persistence, add best-run (fewest rooms or HP left). CUT: `examples/scrapcrawl` stays untouched and unwired (reason: it is the preserved origin, and its Gemini layer needs a server). Verify: restart keeps proficiency; test with a mocked store.
3. Frame (S). ADD: cover, "Room 2 of 5" cue. Verify: Playwright cold load plus one run.
## First three directives
1. scrapcrawl: fixed-roll simulated-run tests (winnable, losable) and replace placeholder HP/damage numbers. M. Depends: none.
2. scrapcrawl: persist and display proficiency across runs plus best-run line. M. Depends: 1.
3. scrapcrawl: cover screenshot and room-progress cue. S. Depends: 1.
## Open question for Robert
None. Default: keep the Lua logic frozen; any new rule goes in TS beside `runEnd.ts`.

## Corrections (2026-10-04, measured while writing the directives)
- The crawl has FOUR fight rooms (difficulty 8, 12, 15, 18) plus Home Base, not five rooms with three difficulties, and the HUD already shows `Cleared n/4`; the separate `Room 2 of 5` cue in directive 3 is not needed and was dropped.
- Run odds, measured through the real Lua over 200 seeded runs: no crafting wins 35.0 percent, buying a Beat Stick when affordable wins 75.0 percent. The placeholder numbers (10 HP, 2 per lost fight) are kept and pinned by `Scrapcrawl_Sim_Runs_Directive`. The carry-over work is `Scrapcrawl_Carry_Over_Directive`.
