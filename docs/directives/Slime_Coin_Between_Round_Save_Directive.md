# Slime Coin: save at round boundaries, Continue from the title (Size M)

**Depends on:** `Slime_Coin_Round_Recap_Directive.md` merged first. Both edit `ts/src/games/slime_coin/App.tsx` and `games/slime_coin/logic.lua`; running in order avoids a conflict, and this run reuses the `end_round`/`start_round` changes the recap makes. If `ts/src/games/slime_coin/utils/roundRecap.ts` does not exist when you start, STOP and write why in the Status row.

**Read first:** `docs/demos/slime_coin/DIRECTION.md` (Replan item 4: "persist run state at round boundaries, not mid-drop, with Continue"), `games/slime_coin/logic.lua` (lines 1-225 `GAME_STATE` and `init_game`, lines 227-290 round management), `ts/src/games/slime_coin/App.tsx` (the whole file, 440 lines), `ts/src/games/slime_coin/utils/bestScore.ts` (the persistence pattern to copy), `ts/src/engine/shared/persistence.ts` (`loadSave`, `writeSave`, `clearSave`, versioned envelope), `ts/tests/test_slime_coin_best_score.ts` (how persistence is tested) and `ts/tests/test_slime_coin_shop.ts` (lines 1-30: real Lua with a helper appended).

## 1. Why this exists

The 15-round run is the game, but only the tutorial flag and best score survive a reload (`docs/demos/slime_coin/DIRECTION.md`, "Where it is now": "Missing: mid-run save"). A player who closes the tab at round 9 starts over. Direction item 4 settles the shape: save at round boundaries only, never mid-drop, with Continue. Robert settled that demos stay free and local: browser storage only, no accounts.

## 2. Scope

0. Precondition to check before anything else. In `App.tsx` the effect near line 76, `useEffect(() => { if (isInitialized && state) call('init_game', {}) }, [isInitialized, state, call])`, lists `state` in its dependencies. Read `useGameLoop` and the `tick` callback and decide whether a state update re-runs `init_game` while a run is in progress (which would reset the Lua state and make any restore useless). If it does, STOP: set the Status row to Blocked and report the exact lines; fixing that is its own directive, not part of this one.
1. `games/slime_coin/logic.lua`: two new functions. `export_run()` returns a plain table `{ round, score, tokens, hand_in, max_hand_in, owned_chips, pocket_coins }` (copies, not references; use the existing `copy_entity` helper). `import_run(snapshot)` validates the snapshot (round an integer from 1 to `total_rounds`; score, tokens, hand_in, max_hand_in non-negative numbers; `owned_chips` an array of strings; `pocket_coins` a table of non-negative numbers), returns `{ success = false, reason = '<what failed>' }` without changing state when invalid, and otherwise: calls `init_game({})`, assigns the saved run-level fields, then calls `start_round(snapshot.round)` and returns `{ success = true, round = GAME_STATE.round }`. The shelf and floor are rebuilt by `init_game`/`start_round` and are NOT saved; say so in the code comment and in the title-screen wording below. Valid Lua 5.3 only.
2. New pure module `ts/src/games/slime_coin/utils/runSave.ts` <!-- new: ts/src/games/slime_coin/utils/runSave.ts -->: `RUN_SAVE_SLOT = 'slime_coin_run_save'`, `RUN_SAVE_VERSION = 1`, `type RunSnapshot` (the shape above), `isRunSnapshot(value): value is RunSnapshot` (same validation as the Lua, in TS), `loadRunSave(): RunSnapshot | null`, `writeRunSave(snapshot)`, `clearRunSave()`. Use `loadSave`/`writeSave`/`clearSave` with `{ version: RUN_SAVE_VERSION }`; a missing, corrupt, stale-version or invalid save yields `null`, never throws.
3. `App.tsx` wiring, kept small:
   - After `handleSelectCard` has called `select_card` and the phase is not `run_end`, call `export_run` and `writeRunSave(...)`. This is the only write point (a round boundary).
   - When the phase becomes `run_end`, or in `handleRestart`, call `clearRunSave()`.
   - On the title screen add a second menu item `Continue (round N)` before `New Game`, shown only when `loadRunSave()` returns a snapshot. `handleContinue` calls `import_run`, syncs React state from `get_state_summary` the way `handleSelectCard` does, hides the title, and skips the first-run primer. If `import_run` answers `success = false`, call `clearRunSave()` and fall back to the title with no Continue item.
   - Add one honest line under the title blurb only when a save exists: "Continue restarts the round with an empty shelf; your chips, tokens and score carry over." Keep `blurb.ts` unchanged.
   - The `New Game` item starts fresh and does not clear a save until the new run reaches its first boundary.
4. Tests, written first and watched failing: new `ts/tests/test_slime_coin_run_save.ts` <!-- new: ts/tests/test_slime_coin_run_save.ts --> covering (a) `runSave.ts` round trip, corrupt JSON, wrong version, wrong shape, out-of-range round (all `null`); (b) real Lua through `loadGame('slime_coin', 42)`: `export_run` after `init_game` and two `select_card` calls returns round 3 with two chips; `import_run` of that snapshot into a fresh session reproduces round, score, tokens, chips and pocket coins as seen by `get_state_summary`; invalid snapshots (round 0, round 99, negative tokens, chips not strings) return `success = false` and leave `get_state_summary` unchanged; (c) `import_run` then `end_round` still returns the offered cards (the restored game is playable) without running physics ticks.

## 3. What NOT to do

- No mid-round or mid-drop save, no cloud, accounts or server. No change to balance, targets or chips. No change to `blurb.ts`, `config.ts`, the sound module or the best-score logic.
- Do not save shelf or floor coins; do not add a "load any slot" feature.
- Do not run builds or servers. The act-reload-same-round Playwright check is a controller step after merge.

## 4. Verification

Baseline first: `cd ts && npx vitest run` once; record pass and fail counts and failing file names. Then:

```text
cd ts && npx vitest run test_slime_coin_run_save.ts
cd ts && npx vitest run test_slime_coin_round_recap.ts test_slime_coin_lua_sweep.ts test_slime_coin_bridge.ts test_slime_coin_shop.ts test_slime_coin_exchange.ts test_slime_coin_exchange_cost.ts test_slime_coin_best_score.ts test_slime_coin_blurb.tsx
cd ts && npx tsc --noEmit
cd ts && npx vitest run
```

Expected: the new file passes (at least 9 tests); the eight existing slime_coin files stay green; full failing set equals the baseline or is smaller; `tsc` has no new errors. The new Lua tests run no physics ticks.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_slime_coin_run_save.ts)
- Exec(cd ts && npx vitest run test_slime_coin_round_recap.ts test_slime_coin_lua_sweep.ts test_slime_coin_bridge.ts test_slime_coin_shop.ts test_slime_coin_exchange.ts test_slime_coin_exchange_cost.ts test_slime_coin_best_score.ts test_slime_coin_blurb.tsx)
- Exec(cd ts && npx tsc --noEmit)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none. (Controller after merge: Playwright act-reload check at 390x844 showing Continue returns to the same round, then `npm run build:slime_coin`.)

## Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename> [<bare-filename> ...]` and `cd ts && npx tsc --noEmit`. Use Read, Glob and Grep, not `ls`/`cat`. Use the bare test filename as the filter.
- Do not install, download or fetch anything. Do not read outside this worktree. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`. Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one. Deleting files is not permitted.
- No absolute paths inside this repo in any file you write; use repo-relative paths. Files already CRLF keep CRLF; new files use CRLF to match.
- New logic goes in small new modules (SOLID/SRP/KISS): the save format is `runSave.ts`; `App.tsx` only calls it.
- When every Completion criteria box is checked and the verification tails are in the log line, set the Status row to **Review**. Never set it to Done. If you stop partway, set it to Blocked and write why.

## Completion criteria

- [ ] The Scope item 0 precondition was checked and its answer is in the Status log line.
- [ ] `export_run` and `import_run` exist; `runSave.ts` exists; `App.tsx` writes only at round boundaries, clears on run end and restart, and shows Continue only when a valid save exists.
- [ ] The new test file passes and was red before the change; the eight existing slime_coin files stay green; full failing set equals or is smaller than baseline; `tsc` clean of new errors (real tails pasted).
- [ ] `git diff --stat` shows only: `logic.lua`, `runSave.ts`, `App.tsx`, the new test.
- [ ] Status row set to Review with a one-line log entry.

## Report

Findings first: the precondition answer, files changed, new test count. Evidence second: real tails of the vitest and tsc commands. Controller finish after merge: the reload check and build above. Recommended action: review, merge.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-12 · robert-claude-laptop · none → Draft — slime_coin DIRECTION.md Replan item 4 (between-round save); no directive existed; needs Slime_Coin_Round_Recap merged first
<!-- queue:end -->
