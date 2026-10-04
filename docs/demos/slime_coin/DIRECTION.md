# slime_coin direction (2026-10-04)
## What it tried to be
A roguelite coin pusher: shoot slime coins onto a two-layer board, hand in coins to hit a rising target over 15 rounds (target_growth 1.5), build with 12 chip cards, 4 pocket coins and a spin wheel (games/slime_coin/data.yaml round_config, chip cards; 3f23f60f, 2026-06-27). Logic is Lua (920 lines); TS renders it through useLuaCall. Drift: config text still sells "shooter, two-layer board, chip synergies" (config.ts:9), but the real product is the 15-round run with shop and synergies; the Lua bridge had no tests until 10-04.
## Where it is now
- Playable loop: yes. Round end, shop, card select, run end with win/lose headline, first-run primer, New Run (App.tsx:266,394-423).
- 10-04 fixes (0cfd6da6, ab4896dd, 1ee8cbb3): Lua `exchange()` used `math.pow`, nil under Lua 5.3, so the Exchange button was broken in a live demo; also bridge tests and a persisted best score (App.tsx:82-85; 4 test_slime_coin_* files).
- Size: 1,148 TS lines, 920 Lua lines; build:slime_coin exists.
- Missing: mid-run save (only tutorial flag and best score persist); no genre in config (documented taxonomy gap, config.ts:12-14); phone-width board not verified (audit batch2:21 "n/v").
- Duplication: sound.ts is copied per game (Polish_Shared_Sfx_Directive).
- Overlap: coin_pusher_arcade (ported 10-04, 7a1fd77f) has pocket coins, a reward wheel and levels, the same concepts as this game's pocket coins and spin wheel.
## Player experience today vs the target
First 60 s: Start game, New Game, primer, shoot a coin; target shown in the HUD. Feedback: score, best score, run-end headline. Progress: the 15-round arc is real. Way back: New Run and the shell.
Best moment: a chip synergy chain (for example crystal prism splitting value) paying out in one drop.
Biggest turn-off: a loss is not legible (why did round 6 fail?), and the Exchange bug shows how thin the verification was.
## Verdict
POLISH.
1. It is further along than its twin: build script, tests, best score, 15-round arc with shop; coin_pusher_arcade should wait on it.
2. The remaining gaps (blurb, run save, phone, legibility) are small and testable.
3. Its Lua fails silently on runtime differences (math.pow), so more tests beat more features.
## Replan
1. Lua entry-point sweep (S): ADD a test that calls every Lua entry point once under the shipped runtime (math.pow-class errors). Verify: `cd ts && npx vitest run tests/test_slime_coin_*.ts`.
2. Honest copy and phone (S): ADD a blurb of 60 words or fewer that sells the run arc; CUT "shooter, two-layer board" (inside baseball). Verify: 390x844 screenshot, board fits the frame.
3. Round recap (M): ADD an end-of-round panel (target vs score, which chips fired). Verify: unit test on state after end_round, plus a screenshot.
4. Between-round save (S): persist run state at round boundaries (not mid-drop) with Continue. Verify: act, reload, same round.
Do not do: new chips or coins, cross-run meta, merging coin_pusher_arcade mechanics.
## First three directives
1. SlimeCoin Lua entry-point sweep test - S - none.
2. SlimeCoin blurb + 390 px board check - S - none.
3. SlimeCoin round recap panel - M - directive 1.
## Open question for Robert
None.
