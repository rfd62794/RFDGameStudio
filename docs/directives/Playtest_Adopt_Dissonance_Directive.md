# Adopt the playtest contract in Dissonance (S)

**Depends on:** `Playtest_Adapter_Contract_Directive` merged (this run needs `ts/src/engine/playtest/*`). If `ts/src/engine/playtest/runner.ts` does not exist, STOP and write that in the Status row.
**Read first:** `docs/superpowers/specs/2026-10-04-automated-playtesting.md` (section c1), `ts/src/engine/playtest/types.ts`, `ts/src/engine/playtest/runner.ts`, `ts/tests/test_dissonance_bot_run.ts` (the whole file: the loop to wrap; do NOT edit it), `ts/src/games/dissonance/types.ts`.

## 1. Why this exists

`ts/tests/test_dissonance_bot_run.ts` already plays whole Dissonance runs through the real Lua session with a first-card bot: seeds 1-4, per-step sanity asserts, 500-step cap. Measured on origin/main `0fa83acc` (2026-10-04): `cd ts && npx vitest run test_dissonance_bot_run.ts` gives `Tests  5 passed (5)`; the four seeds end victory in 29 steps, victory in 23, game_over in 20, game_over in 20. That loop lives inside one test file, so no other tool (report, sweep, monkey comparison) can reuse it. This directive wraps the same behaviour in the shared `PlaytestAdapter` so Dissonance gets the runner, the invariants and the markdown report for free, and so it is the first adopter proving the contract.

## 2. Scope

1. New `ts/src/games/dissonance/playtest.ts`: `createDissonanceAdapter()` and `dissonanceSanity` (an `ExtraCheck`).
2. New test `ts/tests/test_playtest_dissonance.ts` <!-- new: ts/tests/test_playtest_dissonance.ts -->.

## 3. The work

**Step 1: `ts/src/games/dissonance/playtest.ts`** <!-- new: ts/src/games/dissonance/playtest.ts --> (first line `// new: ts/src/games/dissonance/playtest.ts`). Copy, do not import, from `test_dissonance_bot_run.ts`: the `lua` helper and the `step` function (the `switch (run.status)` over `not_started`, `combat`, `rest_craft`, `treasure`, `store`, `anomaly`), changing only `step`'s signature so the combat card comes from the action: `step(session, data, run, card)` and `resolve_combat_turn` is called with `card` instead of `run.deckState.hand[0]`. Everything else in `step` stays byte-for-byte the same Lua calls in the same order.

```ts
export type DissonanceAction = { kind: 'play'; card: DeckCard } | { kind: 'advance' };
export function createDissonanceAdapter(): PlaytestAdapter<RunState, DissonanceAction>
export const dissonanceSanity: ExtraCheck   // name 'dissonance-sane'
```
The adapter holds `session`, `data` and `run`. Behaviour:
- `gameId`: `'dissonance'`.
- `init(seed)`: exactly what `playRun` in the old test does before its loop: `loadGame('dissonance', seed)`, `data = session.files.data`, `deckSize = data.run?.deck_size ?? 8`, `pool = lua(session, 'build_card_pool', data) ?? []`, `deckIds = pool.slice(0, deckSize).map(c => c.id)`, `run = lua(session, 'create_run', deckIds, seed, 1, 0, data)`; if `run` is null throw `new Error('create_run failed')`.
- `observe()`: the current `RunState`.
- `isTerminal()`: `run.status === 'victory' || run.status === 'game_over'`. `outcome()`: `run.status` (so `'victory'`, `'game_over'`, or the in-progress status).
- `legalActions()`: `[]` when terminal; in `combat` one `{ kind: 'play', card }` per card in `run.deckState.hand` (so an empty hand is an empty list: the runner reports a dead end); in every other status `[{ kind: 'advance' }]`.
- `act(a)`: `next = step(session, data, run, a.kind === 'play' ? a.card : undefined as never)`; if `next` is null throw `new Error('a Lua call failed at status ' + run.status)`; else `run = next`.
- `metrics()`: `{ playerHp, playerMaxHp, essence, enemyHp (only when run.enemy), visitedNodes: run.visitedNodeIds.length, deckSize: run.deckCardIds.length }`.
- `fingerprint()`: `JSON.stringify([run.status, run.currentNodeId, run.playerHp, run.essence, run.enemy?.hp ?? null, run.deckState.hand.length, run.visitedNodeIds.length])`.
- `dissonanceSanity`: `check(adapter)` reads `adapter.observe() as RunState` and returns a message string for the first failing rule, else null: `playerHp` not finite, `playerHp < 0`, `playerHp > playerMaxHp`, `essence` not finite or negative, `enemy` present with non-finite `hp`. These are the old `expectSane` rules.
The first-card bot of the old test is `firstLegalPolicy()` from the contract (the first legal action is the first card in hand, or `advance`).

**Step 2: `ts/tests/test_playtest_dissonance.ts`.** Import from `../src/engine/playtest` and the new module. Exactly these 7 `it` cases:
1-4. For each seed in `[1, 2, 3, 4]`: `playRun(createDissonanceAdapter(), firstLegalPolicy(), seed, { extraChecks: [dissonanceSanity] })` has `violations: []`, `terminal: true`, `steps < 500`, and `outcome` is `'victory'` or `'game_over'`. Name the cases `seed 1` ... `seed 4`.
5. Across seeds 1-4 both `'victory'` and `'game_over'` appear (same as the old test; it is a reachability check, not a rate).
6. Determinism: `playRun` on seed 2 twice gives deeply equal results.
7. Report smoke: `playMany` with `randomPolicy()` over seeds 1-20 returns 20 results; every violation (if any) has a numeric `seed` and `step`; `console.log(renderPlaytestReport('dissonance', 'random', summarise(results)))` so the controller can read the mix. This case pins NOTHING about the game's outcomes: it must not assert win rates or that there are no violations. If it shows violations, copy the first one, rendered with `renderFinding(v, 'dissonance', 'cd ts && npx vitest run test_playtest_dissonance.ts')`, into your report; do not weaken the game or the check.

## 4. What NOT to do

- Do not edit `ts/tests/test_dissonance_bot_run.ts`, any Lua file, any file under `ts/src/games/dissonance/` other than the one new file, or any game number. The old test stays until Robert or the controller retires it after both suites have been green together.
- Do not change the contract modules in `ts/src/engine/playtest/`; if the contract is missing something, STOP and write what in the Status row.
- No React, no browser, no new dependency.

## 5. Verification

`cd ts && npx vitest run test_playtest_dissonance.ts` expects `Tests  7 passed (7)`; paste the real tail, including the printed report.
Then regression: `cd ts && npx vitest run test_dissonance_bot_run.ts` expects `Tests  5 passed (5)` (baseline today: the same).
Then `cd ts && npx tsc --noEmit`: no new errors (baseline: no output).
Then `git status`: only the 2 files in Scope appear.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do NOT run `npm run build:*`, `vite-node`, `vite build`, any browser or Playwright command, or any `uv run python -m studio...` module (the sandbox refuses them; the
  controller runs the browser tools and builds). The only commands you run are `cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`
  (errors that mention only `game-metadata.json` are pre-existing in a fresh worktree: ignore those, fix any other), `git status`, `git diff`, and git add/commit on your branch.
- Do not run `git merge origin/main`. Use `git fetch origin` then `git rev-list --count HEAD..origin/main` to see whether main moved.
- Files you edit keep their existing line endings; new files use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.
- Free models only where the work touches model configuration (it does not here). Nothing you write may touch a shipped game's behaviour or numbers.

## 7. Completion criteria

- [ ] The 2 files in Scope exist; `ts/tests/test_dissonance_bot_run.ts` is untouched.
- [ ] `cd ts && npx vitest run test_playtest_dissonance.ts` shows 7 passed (real tail and printed report pasted); the old Dissonance suite is unchanged and green.
- [ ] The adapter makes the same Lua calls in the same order as the old test (the four seeds still end victory, victory, game_over, game_over; say so from the real output if the new test's cases show it).
- [ ] `cd ts && npx tsc --noEmit` shows no new errors; no file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the 4 seed outcomes and step counts from the new runner, the printed random-policy report (outcome mix and run lengths), any violation line. Recommended action: review and merge; the controller decides when to retire the old bot test.

## Sandbox needs

none (`cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`, git status/diff only)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing Lua files, `games/*/logic.lua`, `ts/src/engine/executor.ts`, `docs/children.json`; changing any shipped game number; adding a runtime or build dependency; editing `package.json` or the lockfile; running a browser.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-playtest-adopt-dissonance-directive |
| Base branch | - |
| Base commit | 9597bdfe6b0b3cb81bf8b1722c25694fe9bbf21c |

**Status log**
- 2026-10-04 17:47 · robert-claude-laptop · none → Queued
- 2026-10-09 23:12 · robert-claude-laptop · Queued → Approved
- 2026-10-09 23:13 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-playtest-adopt-dissonance-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4HWSEJ3PK9ZC9TEQFN17D1T
<!-- queue:end -->
