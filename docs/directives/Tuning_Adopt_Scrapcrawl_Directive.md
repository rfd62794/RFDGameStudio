# Adopt tuning in scrapcrawl: 2 TS-const knobs, simulate, two scenarios (S)

**Depends on:** `Tuning_Knob_Store_Directive` and `Tuning_Sweep_Tool_Directive` merged. If `ts/src/engine/tuning/store.ts` or `ts/src/games/tuning-registry.ts` is missing, STOP and write that in the Status row. Dispatch after `Tuning_Adopt_Chimera_Wilds_Directive` has merged (both add a line to `ts/src/games/tuning-registry.ts`).
**Read first:** `docs/superpowers/specs/2026-10-04-tuning-tools.md`, `ts/src/engine/tuning/types.ts`, `ts/src/engine/tuning/store.ts`, `ts/src/games/tuning-registry.ts`, `ts/src/games/scrapcrawl/utils/runEnd.ts`, `ts/tests/test_scrapcrawl_sim_runs.ts`, `ts/tests/test_scrapcrawl_run_end.ts`.

## 1. Why this exists

scrapcrawl is the TS-constant example: `ts/src/games/scrapcrawl/utils/runEnd.ts` has `export const PLAYER_MAX_HP = 10;` and `export const LOSS_DAMAGE = 2;` (lines 12-13), used by `newRun()` and `applyFight()`. The win odds are pinned by `ts/tests/test_scrapcrawl_sim_runs.ts`, which holds the whole headless simulation inline. Measured on origin/main `1f52374a` (scratch worktree, 2026-10-04): `cd ts && npx vitest run test_scrapcrawl_sim_runs.ts` prints `SIM unarmed=0.350 crafted=0.750` and `Tests  3 passed (3)` in about 15 s. To sweep these odds the simulation must live in a module both the test and `tuning.ts` can import, and the two consts must be read through the knob store.

## 2. Scope

1. New `ts/src/games/scrapcrawl/utils/simulateRun.ts`: the simulation moved out of the test.
2. Edit `ts/tests/test_scrapcrawl_sim_runs.ts`: import it instead of defining it.
3. Edit `ts/src/games/scrapcrawl/utils/runEnd.ts`: read the two numbers through the store.
4. New `ts/src/games/scrapcrawl/tuning.ts`.
5. New `ts/src/games/scrapcrawl/knobs.ts` (the two knob definitions, Step 3).
6. Edit `ts/src/games/tuning-registry.ts`: add `scrapcrawl`.
7. New test `ts/tests/test_scrapcrawl_tuning.ts`.

## 3. The work

**Step 1: `simulateRun.ts`** (first line `// new: ts/src/games/scrapcrawl/utils/simulateRun.ts`). Move, verbatim, from `test_scrapcrawl_sim_runs.ts`: the `Rooms` and `Player` types, `seeded`, `CHAIN`, and the `simulate(seed, useCraft)` function, with these changes only: export `simulateRun(seed: number, useCraft: boolean): { outcome: RunOutcome; hp: number; steps: number }` (return `run.outcome`, `run.hp` and the final `step` count instead of just the outcome), fix the import paths (`../../../engine/runtime`, `./runEnd`), and keep the `0x6d2b79f5` generator unchanged. Do not alter the game logic inside the loop.

**Step 2: test.** In `test_scrapcrawl_sim_runs.ts` delete the moved definitions, import `simulateRun`, and add `const simulate = (seed: number, useCraft: boolean): RunOutcome => simulateRun(seed, useCraft).outcome;` so `winRate` and the other tests are untouched. All three existing tests keep their names and expectations.

**Step 3: `runEnd.ts`.** Keep `export const PLAYER_MAX_HP = 10;` and `export const LOSS_DAMAGE = 2;` (tests import them). Add `import { tuned } from '../../../engine/tuning';` and, in `newRun()` and `applyFight()`, replace the uses with `tuned('scrapcrawl.player_max_hp')` and `tuned('scrapcrawl.loss_damage')`. The knobs are registered in `tuning.ts`, so `runEnd.ts` must import that module for its side effect: `import '../tuning';` would create a cycle with `simulateRun.ts`, so instead create the two knobs in a tiny new module `ts/src/games/scrapcrawl/knobs.ts` (first line `// new: ts/src/games/scrapcrawl/knobs.ts`) that calls `defineKnob` for both and exports the array `SCRAPCRAWL_KNOBS`; `runEnd.ts` does `import './knobs';` and `tuning.ts` re-uses `SCRAPCRAWL_KNOBS`. Defaults 10 and 2. Behaviour with no overrides must be byte-for-byte the same.

**Step 4: knobs and `tuning.ts`.** In `knobs.ts`: `scrapcrawl.player_max_hp` (label `Player hit points`, group `Run`, min 4, max 20, step 1, default 10, affects `How many mistakes a run survives.`, source `{ kind: 'const', file: 'ts/src/games/scrapcrawl/utils/runEnd.ts', name: 'PLAYER_MAX_HP' }`) and `scrapcrawl.loss_damage` (label `Damage per lost fight`, group `Run`, min 1, max 5, step 1, default 2, affects `How punishing a lost fight is; the main lever on the win rate.`, name `LOSS_DAMAGE`). `tuning.ts` (first line `// new: ts/src/games/scrapcrawl/tuning.ts`) default-exports `{ gameId: 'scrapcrawl', knobs: SCRAPCRAWL_KNOBS, scenarios: ['unarmed', 'crafted'], targets: [...], simulate }` with `simulate({ seed, scenario })` returning `{ won: outcome === 'won' ? 1 : 0, hp: hp, steps }` from `simulateRun(seed, scenario === 'crafted')`. Targets pin today's bands, not new intent: `{ id: 'unarmed_win_rate', scenario: 'unarmed', metric: 'won', min: 0.20, max: 0.50, note: 'Unarmed is hard but winnable (35.0% measured).' }` and `{ id: 'crafted_win_rate', scenario: 'crafted', metric: 'won', min: 0.60, max: 0.90, note: 'Crafting a Beat Stick clearly helps (75.0% measured).' }`.

**Step 5: registry** line `import scrapcrawl from './scrapcrawl/tuning';` and entry `scrapcrawl`.

**Step 6: `test_scrapcrawl_tuning.ts`**: (1) knob defaults equal the exported consts `PLAYER_MAX_HP` and `LOSS_DAMAGE`; (2) with no overrides `tuned('scrapcrawl.loss_damage')` is 2 and `newRun().hp` is 10; (3) `withOverrides({'scrapcrawl.loss_damage': 4}, ...)`: `applyFight` on a lost fight takes 4 HP; `withOverrides({'scrapcrawl.player_max_hp': 14}, ...)`: `newRun().maxHp` is 14; (4) `runRows(tuning, null, [], 200)` passes `checkTargets` (log the rates; expect about 0.35 and 0.75); (5) `withOverrides({'scrapcrawl.loss_damage': 4}, ...)` lowers the unarmed win rate over seeds 5000..5099 below the default's.

## 4. What NOT to do

- No change to `games/scrapcrawl/logic.lua` or data, to any number, or to `test_scrapcrawl_run_end.ts` expectations. Do not rename the exports. Do not touch the panel or sweep files.
- Do not widen knobs beyond the two named. Do not change the simulation's logic while moving it.

## 5. Verification

`cd ts && npx vitest run test_scrapcrawl_sim_runs.ts` still `Tests  3 passed (3)` with `SIM unarmed=0.350 crafted=0.750`; `cd ts && npx vitest run test_scrapcrawl_run_end.ts` unchanged and green; `cd ts && npx vitest run test_scrapcrawl_tuning.ts` all passed; `cd ts && npx vitest run test_tuning_targets.ts` passes with `scrapcrawl targets hold at defaults`; `cd ts && npx tsc --noEmit` no new errors. Paste real tails.
**Controller finish (after merge):** `cd ts && npx vite-node tools/tune-sweep.ts -- --game scrapcrawl --knob scrapcrawl.loss_damage --from 1 --to 4 --step 1 --runs 200 --report`.

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
- Do NOT run `npm run build:*`, `vite-node`, `vite build` or any `uv run python -m studio...` module (the sandbox refuses them; the controller
  runs the sweep tool and builds). The only commands you run are `cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`
  (errors that mention only `game-metadata.json` are pre-existing in a fresh worktree: ignore those, fix any other), `git status`, `git diff`, and git add/commit on your branch.
- Do not run `git merge origin/main`. Use `git fetch origin` then `git rev-list --count HEAD..origin/main` to see whether main moved.
- Files you edit keep their existing line endings; new files use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.
- Overrides must never reach players: nothing you write may read localStorage or apply an override unless the URL has `?dev=1` (or an in-process `withOverrides` scope in tests and tools).

## 7. Completion criteria

- [ ] `simulateRun.ts`, `knobs.ts`, `tuning.ts`, the registry entry and `test_scrapcrawl_tuning.ts` exist; `runEnd.ts` reads the two numbers via `tuned(...)` with the consts still exported.
- [ ] `test_scrapcrawl_sim_runs.ts` still `Tests  3 passed (3)` with `SIM unarmed=0.350 crafted=0.750`; `test_scrapcrawl_run_end.ts` green; `test_scrapcrawl_tuning.ts` and `test_tuning_targets.ts` pass (real tails pasted).
- [ ] No game logic or number changed; `npx tsc --noEmit` shows no new errors.
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the unchanged sim numbers (proof the move was faithful), the 5 new test results, and the lines changed in `runEnd.ts`. Recommended action: review, merge, then the controller runs the loss-damage sweep.

## Sandbox needs

none (`cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`, git status/diff only)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing Lua files, `games/*/logic.lua`, `ts/src/engine/executor.ts`; editing `docs/children.json`; changing any shipped game number (defaults must equal today's values); adding a runtime or build dependency.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-tuning-adopt-scrapcrawl-directive |
| Base branch | - |
| Base commit | a654ec08d1a3c3f68f8945755f6db1f767d7415d |

**Status log**
- 2026-10-04 17:26 · robert-claude-laptop · none → Queued
- 2026-10-04 20:25 · robert-claude-laptop · Queued → Approved — lint override: path hits are 'do not edit' mentions, a gitignored generated file, or new files this directive creates; verified in earlier directives of the same family
- 2026-10-04 20:25 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-tuning-adopt-scrapcrawl-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 20:26 · dispatcher · In progress → Blocked — setup failed before spawn: setup command 'uv sync --frozen' exited 1: supports. (os error 1142)
- 2026-10-06 18:33 · robert-claude-laptop · Blocked → Queued — Requeue: uv sync os error 1142 (hard-link cap) at worktree setup, transient; .worktrees now reaped (2 left). Laptop overseer 2026-10-06.
<!-- queue:end -->
