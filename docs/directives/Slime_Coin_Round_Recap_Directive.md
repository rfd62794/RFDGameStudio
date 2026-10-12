# Slime Coin: an end-of-round recap, so a lost round says why (Size M)

**Depends on:** none. `Slime_Coin_Lua_Entry_Point_Sweep_Directive.md` (the `test_slime_coin_lua_sweep.ts` it added) is already on main and is one of the regression files below. The sibling `Slime_Coin_Between_Round_Save_Directive.md` depends on THIS run; do not combine them.

**Read first:** `docs/demos/slime_coin/DIRECTION.md` (Replan item 3 and "First three directives" item 3), `games/slime_coin/logic.lua` (lines 227-290 `start_round`/`end_round`/`select_card`, lines 750-822 the synergy functions), `ts/src/games/slime_coin/App.tsx` (lines 120-145 the phase transition, lines 380-405 the `card_select` modal), `ts/src/games/slime_coin/components/ShopModal.tsx`, `ts/src/games/slime_coin/types.ts`, `ts/tests/test_slime_coin_shop.ts` (lines 1-30: loading the real Lua with a test helper appended) and `ts/tests/test_slime_coin_lua_sweep.ts`.

## 1. Why this exists

`docs/demos/slime_coin/DIRECTION.md` names "a loss is not legible (why did round 6 fail?)" as the game's biggest turn-off, and its Replan item 3 asks for an end-of-round panel: target against score, and which chips fired. Today `end_round()` in `logic.lua` returns `round`, `score`, `target`, `target_met` and `offered_cards`, and the player goes straight into the chip shop with no summary. The 15-round arc, shop and synergies are real and tested; only this feedback is missing. Robert settled that demos stay free, no deploys.

## 2. Scope

1. `games/slime_coin/logic.lua`: record which synergies fired during the round. Add `synergy_fired = {}` (a table of counts keyed by id) to `GAME_STATE`; reset it to `{}` in `init_game` and in `start_round`; increment `GAME_STATE.synergy_fired[effect_id]` inside `trigger_synergy_effect(effect_id, ...)` (the pairwise synergies) and `GAME_STATE.synergy_fired[card_id]` in the three branches of `trigger_chip_synergy` that actually fire (`zombie_slime`, `crystal_burst`, `bubble_chain` when `chain_count >= 5`). `end_round()` returns the table as `synergy_fired` and also `shortfall` (target minus score, floored at 0) and `surplus` (score minus target, floored at 0). Keep every existing returned field unchanged. Use only constructs valid in the shipped Lua 5.3 runtime (the `math.pow` bug is why the sweep test exists).
2. New pure module `ts/src/games/slime_coin/utils/roundRecap.ts` <!-- new: ts/src/games/slime_coin/utils/roundRecap.ts -->: `buildRoundRecap(endRoundResult): RoundRecap` where `RoundRecap` has `round`, `score`, `target`, `targetMet`, `margin` (signed, score minus target), `headline` (a short plain sentence: cleared with how much to spare, or short by how much), and `fired: { label: string; count: number }[]` sorted by count descending then label. A `SYNERGY_LABELS` map turns the ids into player words: `convert_basic_to_zombie` "Zombie spreads", `double_crystal_tokens` "Mirror and crystal double tokens", `clear_area` "Void clears an area", `launch_to_shelf` "Spark launches a coin back", `zombie_slime` "Zombie Slime chip", `crystal_burst` "Crystal Burst chip", `bubble_chain` "Bubble Chain chip". An unknown id is shown as the raw id, never dropped. No React, no Lua, no I/O in this file.
3. New component `ts/src/games/slime_coin/components/RoundRecap.tsx` <!-- new: ts/src/games/slime_coin/components/RoundRecap.tsx -->: renders a `RoundRecap` (headline, "Score X of target Y", the fired list or the line "No synergies fired this round"). Use the existing `sc-` class naming and add its few rules at the end of `ts/src/games/slime_coin/styles.css`. It must fit a 390 px wide screen without horizontal scroll (single column, no fixed widths over 100 percent).
4. `ts/src/games/slime_coin/App.tsx`: keep the `end_round` result when the phase becomes `card_select` (store it in state next to `offered_cards`; extend `SlimeCoinGameState` in `types.ts` with an optional `last_recap` field) and render `<RoundRecap />` above `<ShopModal />` in the `card_select` block. Change nothing else in `App.tsx`. Keep the line count growth under 25.
5. Tests (write them first and watch them fail): new `ts/tests/test_slime_coin_round_recap.ts` <!-- new: ts/tests/test_slime_coin_round_recap.ts --> covering (a) `buildRoundRecap` for a cleared round, a missed round, an exact tie (target met, margin 0, headline says "exactly"), empty `synergy_fired`, and an unknown id; (b) the real Lua through `loadGame('slime_coin', 42)` and `call(...)`: after `init_game`, `end_round` returns `synergy_fired` as an empty table, `shortfall` equal to the target with score 0, `surplus` 0; and with a helper appended at load time as in `test_slime_coin_shop.ts` that bumps `GAME_STATE.synergy_fired` and `GAME_STATE.score`, `end_round` echoes them; and `start_round` clears `synergy_fired`; (c) a render test of `RoundRecap` with `renderToStaticMarkup` (see `ts/tests/test_house_of_kings_how_it_works.tsx` for the pattern) asserting the headline and both the fired-list and empty-list wording.

## 3. What NOT to do

- Do not change balance: no change to targets, growth, coin values, chip effects or physics, and no new chips or coins.
- Do not change `select_card`, `shop_purchase`, `exchange` or any signature already used by the existing tests.
- Do not touch `blurb.ts`, `config.ts`, the run-end screen or the sound module.
- Do not run builds or servers. The 390x844 screenshot is a controller step after merge, not yours.

## 4. Verification

Baseline first: `cd ts && npx vitest run` once; record pass and fail counts and failing file names. Then:

```text
cd ts && npx vitest run test_slime_coin_round_recap.ts
cd ts && npx vitest run test_slime_coin_lua_sweep.ts test_slime_coin_bridge.ts test_slime_coin_shop.ts test_slime_coin_exchange.ts test_slime_coin_exchange_cost.ts test_slime_coin_best_score.ts test_slime_coin_blurb.tsx
cd ts && npx tsc --noEmit
cd ts && npx vitest run
```

Expected: the new file passes (at least 8 tests); the seven existing slime_coin files stay green; full failing set equals the baseline or is smaller; `tsc` has no new errors. The Lua tests are slow (about 0.15 s per physics tick); the new Lua tests must not run physics ticks.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_slime_coin_round_recap.ts)
- Exec(cd ts && npx vitest run test_slime_coin_lua_sweep.ts test_slime_coin_bridge.ts test_slime_coin_shop.ts test_slime_coin_exchange.ts test_slime_coin_exchange_cost.ts test_slime_coin_best_score.ts test_slime_coin_blurb.tsx)
- Exec(cd ts && npx tsc --noEmit)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none. (Controller after merge: Playwright screenshot at 390x844 of the recap above the shop, then `npm run build:slime_coin`.)

## Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename> [<bare-filename> ...]` and `cd ts && npx tsc --noEmit`. Use Read, Glob and Grep, not `ls`/`cat`. Use the bare test filename as the filter.
- Do not install, download or fetch anything. Do not read outside this worktree. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`. Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one. Deleting files is not permitted.
- No absolute paths inside this repo in any file you write; use repo-relative paths. Files already CRLF keep CRLF; new files use CRLF to match.
- New logic goes in small new modules (SOLID/SRP/KISS): the data is `roundRecap.ts`, the view is `RoundRecap.tsx`, `App.tsx` only mounts it.
- When every Completion criteria box is checked and the verification tails are in the log line, set the Status row to **Review**. Never set it to Done. If you stop partway, set it to Blocked and write why.

## Completion criteria

- [ ] Lua records and returns `synergy_fired`, `shortfall`, `surplus`; all previously returned fields unchanged.
- [ ] `roundRecap.ts`, `RoundRecap.tsx`, the styles and the `App.tsx` mount exist as described; `App.tsx` growth under 25 lines.
- [ ] The new test file passes and was red before the change; the seven existing slime_coin files stay green; full failing set equals or is smaller than baseline; `tsc` clean of new errors (real tails pasted).
- [ ] `git diff --stat` shows only: `logic.lua`, the three new source files, `styles.css`, `types.ts`, `App.tsx`, the new test.
- [ ] Status row set to Review with a one-line log entry.

## Report

Findings first: files changed, new test count, and anything surprising in how `call(...)` returns the `synergy_fired` table. Evidence second: real tails of the vitest and tsc commands. Controller finish after merge: the screenshot and build above. Recommended action: review, merge.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-slime-coin-round-recap-directive |
| Base branch | - |
| Base commit | ce96bc980905adccc9485a8d6793c5a7d6b24a29 |

**Status log**
- 2026-10-12 · robert-claude-laptop · none → Draft — slime_coin DIRECTION.md Replan item 3 / first-three directive 3 ("round recap panel"); no directive existed
- 2026-10-12 07:03 · robert-claude-laptop · Draft → Queued
- 2026-10-12 07:44 · robert-claude-laptop · Queued → Approved — lint override: boilerplate fixture citation (demo_lists_snapshot.json) is template text, not a real dependency; Robert approved all 2026-10-12
- 2026-10-12 07:44 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slime-coin-round-recap-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4QYTX8CRSTDA265CGY9DZER
<!-- queue:end -->
