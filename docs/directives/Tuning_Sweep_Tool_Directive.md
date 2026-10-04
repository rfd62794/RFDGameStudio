# Tuning sweep tool, simulate contract and targets test (M)

**Depends on:** `Tuning_Knob_Store_Directive` merged (this run needs `ts/src/engine/tuning/*` and the 3-argument `loadGame`). If `ts/src/engine/tuning/store.ts` does not exist, STOP and write that in the Status row.
**Read first:** `docs/superpowers/specs/2026-10-04-tuning-tools.md` (sections b4, b5), `ts/src/engine/tuning/types.ts`, `ts/src/engine/tuning/store.ts`, `ts/tools/succession-balance-sim.ts` (the existing tool shape), `ts/src/engine/shared/seededRandom.ts`.

## 1. Why this exists

Tuning is steep and today you only learn by editing a file and running a suite. Measured on origin/main `1f52374a` with the same 1000 seeds, chimera_wilds baseline 90/85 wins 52.8%, 80/75 wins 14.8%, 70/70 wins 1.2%; scrapcrawl's 400-run sim (`ts/tests/test_scrapcrawl_sim_runs.ts`) takes about 9 s and prints `SIM unarmed=0.350 crafted=0.750`. A headless sweep that varies one knob across a range and prints win rate per value turns tuning into reading a table. The intended bands (targets) must be data a test checks, so a retune cannot silently break intent. Robert reads results on his phone, so the tool can also write a short markdown report.

## 2. Scope

1. New `ts/src/engine/tuning/sweep.ts` (pure functions, unit-tested).
2. New `ts/src/engine/tuning/report.ts` (pure markdown rendering).
3. New `ts/src/games/tuning-registry.ts` (empty registry, `getTuning`).
4. New `ts/tools/tune-sweep.ts` (thin CLI; the controller runs it, not you).
5. New `ts/tests/test_tuning_sweep.ts` (pure-function tests plus a fixture game).
6. New `ts/tests/test_tuning_targets.ts` (iterates the registry; empty today).
7. Edit `ts/package.json`: add script `"tune": "vite-node tools/tune-sweep.ts --"`.

## 3. The work

First line of each new `.ts` file: `// new: <path>`.

**`ts/src/engine/tuning/sweep.ts`** exports (all pure, no I/O, no console):

```ts
export interface SweepArgs { game: string; knob?: string; from?: number; to?: number; step?: number; runs: number; check: boolean; report: boolean }
export function parseArgs(argv: string[]): SweepArgs          // flags --game --knob --from --to --step --runs (default 200) --check --report; throws Error with a usage line on a missing --game, on --knob without --from/--to/--step, or a non-finite number
export function sweepValues(from: number, to: number, step: number): number[]   // inclusive, rounds to 6 decimals, [] if step <= 0 or from > to
export function seedFor(i: number): number                    // 5000 + i (same base the headless tests use)
export function aggregate(runs: Metrics[]): Record<string, number>   // mean of each metric across runs; {} for no runs
export interface Row { value: number | null; scenario: string; runs: number; metrics: Record<string, number> }   // value null = defaults, no override
export function runRows(tuning: GameTuning, knob: string | null, values: number[], runs: number): Row[]
export interface TargetResult { target: Target; value: number | undefined; pass: boolean }
export function checkTargets(tuning: GameTuning, rows: Row[]): TargetResult[]   // only rows with value === null (defaults); a target with no matching row/metric fails with value undefined
export function renderTable(rows: Row[], metricNames: string[]): string          // fixed-width text table: knob value, scenario, runs, one column per metric (3 decimals)
```
`runRows` throws if `tuning.simulate` is missing or `knob` is not in `tuning.knobs`. For each scenario in `tuning.scenarios ?? ['default']` and each value (or one `null` row when `knob` is null) it runs `runs` seeds inside `withOverrides({ [knob]: value }, ...)` (empty overrides for `null`), calling `tuning.simulate({ seed: seedFor(i), scenario })`, then `aggregate`.

**`ts/src/engine/tuning/report.ts`** exports `renderReport(tuning: GameTuning, rows: Row[], results: TargetResult[], knob: string | null, dateISO: string): string`: markdown under 60 lines with: title `# Balance report: <gameId> (<dateISO>)`, a `## Targets` table (id, scenario, band, measured, PASS/FAIL, note), a `## Sweep` table when `knob` is set (from `renderTable` in a code block) plus the knob's `affects` sentence and its default, and a closing line `Seeds 5000..5000+runs-1; bot strategy, not human play.` No timestamps other than the date passed in.

**`ts/src/games/tuning-registry.ts`**:
```ts
// new: ts/src/games/tuning-registry.ts
import type { GameTuning } from '../engine/tuning/types';
// One import line plus one map entry per game that adopts tuning (added by the Tuning_Adopt_* directives).
export const TUNING_REGISTRY: Record<string, GameTuning> = {};
export function getTuning(gameId: string): GameTuning | undefined { return TUNING_REGISTRY[gameId]; }
```

**`ts/tools/tune-sweep.ts`**: reads `process.argv.slice(2)`, calls `parseArgs`, looks up `getTuning(game)` (exit 2 with `no tuning declared for <game>` if absent), builds `values` with `sweepValues` when `--knob` is given, calls `runRows` (plus a defaults row when `--check`), prints `renderTable`, and with `--check` prints each `TargetResult` and sets `process.exitCode = 1` when any fails. With `--report` writes `docs/state/balance-<game>-<YYYY-MM-DD>.md` via `renderReport` (`fs.mkdirSync` recursive, `fs.writeFileSync`; resolve the path from `import.meta.dirname` as `../../docs/state`). Keep it under 80 lines; all logic stays in `sweep.ts` and `report.ts`. Do NOT run it.

**`ts/tests/test_tuning_sweep.ts`**: cases: `parseArgs` defaults and its three error cases; `sweepValues(1, 3, 1)` is `[1,2,3]`, `sweepValues(0, 1, 0.25)` has 5 entries, `sweepValues(1, 3, 0)` is `[]`; `aggregate` mean and empty; a fixture `GameTuning` defined in the test (one const knob `fx.k` default 2 via `defineKnob`, scenarios `['a','b']`, `simulate` returning `{ won: tuned('fx.k') >= 3 ? 1 : 0, steps: tuned('fx.k') }`): `runRows` with values `[2,3]` gives 4 rows, metrics `won` 0 then 1; `checkTargets` with a defaults row passes a target `{metric:'won', min:0, max:0.5}` and fails `{metric:'won', min:0.6, max:1}` and a target for an absent metric (value undefined); `renderReport` output contains the game id, `PASS` and `FAIL`, and has fewer than 60 lines.

**`ts/tests/test_tuning_targets.ts`**: loops `Object.values(TUNING_REGISTRY)`; for each game with `simulate`, `it(\`${gameId} targets hold at defaults\`, ...)` runs `runRows(tuning, null, [], 200)`, then `checkTargets`, and expects every `pass` with a failure message naming the target id, band and measured value; timeout 60000. Also, for every registered game and every knob: `it` that `min <= default <= max`, `step > 0`, `affects` is non-empty, and keys are unique and start with `gameId + '.'`. With the registry empty the file must still pass: add one plain `it('registry is an object', ...)`.

## 4. What NOT to do

- Do not adopt any game here (no `tuning.ts` under `ts/src/games/<id>/`): that is the two Tuning_Adopt_* directives.
- Do not run the tool, `vite-node`, or any build. Do not add a dependency. Do not touch the Store files except to import from them. No React.
- Do not put logic in `tune-sweep.ts`; if it grows past 80 lines, move code into `sweep.ts`.

## 5. Verification

`cd ts && npx vitest run test_tuning_sweep.ts` expects all tests passed; `cd ts && npx vitest run test_tuning_targets.ts` expects `Tests  1 passed (1)`; `cd ts && npx vitest run test_tuning_store.ts` still passes; `cd ts && npx tsc --noEmit` no new errors (baseline: clean apart from `game-metadata.json` messages in a fresh worktree). Paste the real tails. `git status` shows only the 7 files in Scope.
**Controller finish (after merge, not this run):** `cd ts && npx vite-node tools/tune-sweep.ts -- --game chimera_wilds --check` once an adopting directive has merged, then paste the table into `docs/state/`.

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

- [ ] The 7 files in Scope exist and `tune-sweep.ts` is under 80 lines with no logic of its own.
- [ ] `test_tuning_sweep.ts` and `test_tuning_targets.ts` pass (real tails pasted); `test_tuning_store.ts` still passes.
- [ ] `npx tsc --noEmit` shows no new errors; the tool was NOT run.
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the exported function list, test counts, and anything in `parseArgs` that differs from the spec. Say plainly that the CLI was not run (controller step). Recommended action: review, merge, then the controller runs the CLI once an adopting directive lands.

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
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 17:26 · robert-claude-laptop · none → Queued
<!-- queue:end -->
