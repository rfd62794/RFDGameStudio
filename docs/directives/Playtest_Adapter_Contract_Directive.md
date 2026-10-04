# Playtest adapter contract, policies, invariants, runner and report (S/M)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open): `docs/superpowers/specs/2026-10-04-automated-playtesting.md` (section c1), `ts/src/engine/shared/seededRandom.ts` (exports `mulberry32(seed: number): () => number`), `ts/tests/test_dissonance_bot_run.ts` (the loop this generalises; do not edit it).

## 1. Why this exists

Robert 2026-10-04 17:28: "I also want to work on a framework for automated play testing of the demos where possible." Every headless bot test hand-rolls the same loop and re-asserts the same invariants differently: `ts/tests/test_dissonance_bot_run.ts` (real Lua session, seeds 1-4, per-step sanity, 500-step cap), `ts/tests/test_scrapcrawl_sim_runs.ts` (200 seeded runs), `test_chimera_wilds_balance.ts`, `test_horse_racing_headless_balance.ts`, `test_shoal_headless.ts`, `test_slither_rogue_run_loop.ts` (found the NaN timer bug class). This directive builds the shared, game-agnostic part only: the adapter contract, policies, invariant checks, a runner that never throws, and a markdown report plus a one-line finding. Adopting games are separate directives that depend on this one.

Measured on origin/main `0fa83acc` (scratch worktree, 2026-10-04): `uv run python --version` is `Python 3.12.12`. `cd ts && npx vitest run test_dissonance_bot_run.ts test_scrapcrawl_sim_runs.ts` gives `Test Files  2 passed (2)`, `Tests  8 passed (8)` (Dissonance seeds 1-4 end victory 29 steps, victory 23, game_over 20, game_over 20; scrapcrawl prints `SIM unarmed=0.350 crafted=0.750`). `cd ts && npx tsc --noEmit` prints nothing (clean).

## 2. Scope

1. New `ts/src/engine/playtest/types.ts`.
2. New `ts/src/engine/playtest/policies.ts`.
3. New `ts/src/engine/playtest/invariants.ts`.
4. New `ts/src/engine/playtest/runner.ts`.
5. New `ts/src/engine/playtest/report.ts`.
6. New `ts/src/engine/playtest/index.ts` (re-exports).
7. New test `ts/tests/test_playtest_contract.ts`.

## 3. The work

New-file markers: first line of every new `.ts` file is `// new: <path>`. All modules are pure: no React, no DOM, no `window`, no `Date.now()`, no `Math.random()`, no file access.

**Step 1: `types.ts`.** Exactly these exports:

```ts
// new: ts/src/engine/playtest/types.ts
export interface PlaytestAdapter<S = unknown, A = unknown> {
  readonly gameId: string;
  init(seed: number): void;             // fresh session, deterministic for a seed
  observe(): S;                         // what a player could see
  legalActions(): A[];                  // empty while not terminal = a dead end
  act(a: A): void;                      // may throw; the runner records it
  isTerminal(): boolean;
  outcome(): string;                    // the game's own word: 'victory', 'game_over', 'playing', ...
  metrics(): Record<string, number>;    // flat numbers (hp, gold, ...); every value must be finite
  fingerprint(): string;                // cheap stable string of the state, for stall detection
}
export type Policy<S = unknown, A = unknown> = (obs: S, legal: A[], rng: () => number) => A;
export interface Violation { check: string; seed: number; step: number; message: string }
export interface RunResult {
  seed: number; steps: number; outcome: string; terminal: boolean;
  violations: Violation[]; metrics: Record<string, number>;
}
export type ExtraCheck = { name: string; check: (adapter: PlaytestAdapter, step: number) => string | null };
export interface RunOptions { maxSteps?: number; stallWindow?: number; extraChecks?: ExtraCheck[] } // defaults 500 and 25
```
Check names used by the runner (exact strings): `no-throw`, `policy`, `finite-metrics`, `dead-end`, `stall`, `terminal-reached`, plus an extra check's own `name`.

**Step 2: `policies.ts`.** Exports: `randomPolicy(): Policy` (picks `legal[Math.floor(rng() * legal.length)]`), `firstLegalPolicy(): Policy` (returns `legal[0]`), `greedyPolicy(score: (a: unknown, obs: unknown) => number): Policy` (highest score, ties go to the earliest), `scriptedPolicy(actions: unknown[]): Policy` (returns `actions[i]` then advances `i`; when out of actions it THROWS `new Error('script exhausted')`; call the factory once per run so `i` starts at 0).

**Step 3: `invariants.ts`.** Exports:
- `findNonFinite(metrics: Record<string, number>): string | null`: the first key whose value is not a finite number (`NaN`, `Infinity`, `-Infinity`, or not a number type), as `` `${key}=${String(value)}` ``; null when all are finite.
- `createStallTracker(window: number): (fingerprint: string) => boolean`: call it once per action with the state's fingerprint after the action; it returns true when the same fingerprint has now been seen `window` consecutive times (so with window 25, true on the 25th identical call, not before). A different fingerprint resets the count.

**Step 4: `runner.ts`.** Exports `playRun` and `playMany`:

```ts
export function playRun(adapter: PlaytestAdapter, policy: Policy, seed: number, opts: RunOptions = {}): RunResult
export function playMany(makeAdapter: () => PlaytestAdapter, makePolicy: () => Policy, seeds: number[], opts: RunOptions = {}): RunResult[]
```
`playRun` NEVER throws. Algorithm, in order:
1. `try { adapter.init(seed) } catch (e)` returns a result with one `no-throw` violation (step 0, message = the error message), `steps: 0`, `terminal: false`, `outcome: 'error'`, `metrics: {}`.
2. `rng = mulberry32(seed)`; `stalled = createStallTracker(opts.stallWindow ?? 25)`; `max = opts.maxSteps ?? 500`; `steps = 0`.
3. Loop while `steps < max`: if `adapter.isTerminal()` break. `legal = adapter.legalActions()`; if empty, record `dead-end` (message `no legal action at step N`) and break. `action = policy(adapter.observe(), legal, rng)` inside try/catch (a throw records `policy` and breaks). `adapter.act(action)` inside try/catch (a throw records `no-throw` and breaks). `steps++`. Then `findNonFinite(adapter.metrics())`: if non-null record `finite-metrics` (message the returned string) and break. Then `stalled(adapter.fingerprint())`: if true record `stall` and break. Then each `extraChecks` entry: a non-null string records a violation named by the check and breaks.
4. After the loop: if no violation was recorded and `!adapter.isTerminal()` (cap reached), record `terminal-reached` (message `not terminal after N steps`).
5. Result: `terminal = adapter.isTerminal()`, `outcome = adapter.outcome()` (inside try; on a throw `'error'`), `metrics = adapter.metrics()` (inside try; on a throw `{}`). Every violation carries `seed` and the `steps` value when it was recorded.

`playMany` returns `seeds.map(seed => playRun(makeAdapter(), makePolicy(), seed, opts))` (a fresh adapter and policy per seed).

**Step 5: `report.ts`.** Exports:
- `interface PlaytestSummary { runs: number; outcomes: Record<string, number>; rates: Record<string, number>; length: { min: number; median: number; p95: number; max: number }; outlierSeeds: number[]; violations: Violation[]; byCheck: Record<string, number> }`.
- `summarise(results: RunResult[]): PlaytestSummary`: `outcomes` counts `outcome` per run (runs with violations still count by their outcome); `rates` = count / runs; `length` over `steps` with `median = sorted[Math.floor((n-1)/2)]` and `p95 = sorted[Math.ceil(0.95 * n) - 1]` (zeros for `n = 0`); `outlierSeeds` = seeds whose `steps` is greater than `3 * median` (only when `median > 0`), in seed order; `violations` flattened in run order; `byCheck` counts violations by `check`.
- `renderPlaytestReport(gameId: string, policyName: string, summary: PlaytestSummary): string`: markdown, short enough for a phone. First line `# Playtest bots: <gameId> (<policyName>)`. Then one line `Runs: N | <outcome> X% | <outcome> Y% | length median M, p95 P, max X`. If there are violations, a `## Violations` list comes BEFORE the runs line (one bullet each: `check`, `seed`, `step`, `message`); otherwise the line `No violations.` follows the runs line. Then `Outliers: seeds a, b` only when there are some.
- `formatFinding(layer: 'L1' | 'L2' | 'L3' | 'L4', gameId: string, check: string, seed: number | string, step: number, message: string, repro: string): string`: exactly `` `FINDING ${gameId} ${layer}/${check} seed=${seed} step=${step} :: ${message} :: repro: ${repro}` `` where `message` is the input with every run of whitespace (including newlines) collapsed to one space, trimmed, and cut to 160 characters. The browser tools (layers 2 and 3) reuse it.
- `renderFinding(v: Violation, gameId: string, repro: string): string` is `formatFinding('L1', gameId, v.check, v.seed, v.step, v.message, repro)`; i.e. exactly `` `FINDING ${gameId} L1/${v.check} seed=${v.seed} step=${v.step} :: ${message} :: repro: ${repro}` `` where `message` is `v.message` with every run of whitespace (including newlines) collapsed to one space, trimmed, and cut to 160 characters.

**Step 6: `index.ts`.** `export * from './types'; export * from './policies'; export * from './invariants'; export * from './runner'; export * from './report';`

**Step 7: `ts/tests/test_playtest_contract.ts`.** Define a toy adapter in the test file: a counter starting at 0 with actions `'inc'` and `'dec'`, terminal `victory` at 5 and `game_over` at -3, `metrics()` returns `{ n }`, `fingerprint()` returns `String(n)`, `outcome()` returns `'playing'` until terminal. Exactly these 12 `it` cases:

1. `randomPolicy` with `mulberry32(7)` gives the same sequence of 10 picks on two fresh policies and uses every action of `['a','b','c']` over 60 picks.
2. `firstLegalPolicy` returns `legal[0]`; `greedyPolicy` picks the highest score and the earliest on a tie.
3. `scriptedPolicy(['inc','inc'])` returns them in order, then throws `script exhausted`.
4. `playRun(toy, scriptedPolicy of 5 'inc')` ends `terminal: true`, `outcome: 'victory'`, `steps: 5`, `violations: []`.
5. `playRun` with the same seed twice returns deeply equal results (use `randomPolicy` and the toy).
6. An adapter whose `act` throws: `playRun` does not throw and returns one `no-throw` violation with the error message and the step; the same for a throwing `init` (`steps: 0`, `outcome: 'error'`).
7. `metrics()` returning `{ n: NaN }` gives a `finite-metrics` violation mentioning `n=NaN`; `Infinity` also; `findNonFinite({a:1,b:2})` is null.
8. `legalActions()` returning `[]` while not terminal gives a `dead-end` violation.
9. A constant `fingerprint()` with window 25 gives a `stall` violation at step 25; a changing fingerprint with a policy that alternates `inc`/`dec` never stalls within 60 steps; `createStallTracker(3)` returns false, false, true for three identical values.
10. A toy that never terminates (always legal, `isTerminal()` false) with `maxSteps: 50` gives `terminal-reached` and `steps: 50`; an `ExtraCheck` returning `'bad'` at step 3 gives a violation named after the check at step 3.
11. `summarise` of hand-built results: counts, rates, `length` min/median/p95/max, `outlierSeeds` (a run of 100 steps among runs of 10) and `byCheck`.
12. `renderPlaytestReport` contains the game id, `victory`, and lists a violation before the runs line when present; `renderFinding` yields exactly `FINDING toy L1/stall seed=3 step=25 :: a b :: repro: cd ts && npx vitest run test_x.ts` for a violation message `'a\n  b'`, and cuts a 300-character message to 160; `formatFinding('L2', 'toy', 'clipped', 'script', 2, 'm', 'r')` is exactly `FINDING toy L2/clipped seed=script step=2 :: m :: repro: r`.

## 4. What NOT to do

- No game code: do not import any `ts/src/games/*` module, do not touch any existing test, Lua file or number. No browser code, no Playwright, no `fast-check`, no new dependency.
- Do not build a sweep tool or a replay system (the tuning spec and the engine roadmap own those); do not write outcome-rate assertions (this layer pins invariants, not balance).
- No `Math.random`, `Date.now`, `performance.now` or `window` anywhere in the new modules.

## 5. Verification

`cd ts && npx vitest run test_playtest_contract.ts` expects `Tests  12 passed (12)`; paste the real tail.
Then regression: `cd ts && npx vitest run test_dissonance_bot_run.ts` expects `Tests  5 passed (5)` and `cd ts && npx vitest run test_scrapcrawl_sim_runs.ts` expects `Tests  3 passed (3)` (baseline today: the same).
Then `cd ts && npx tsc --noEmit`: no new errors (baseline: no output).
Then `git status`: only the 7 files in Scope appear.

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

- [ ] The 7 files in Scope exist and `playRun` never throws (cases 6-10 prove it).
- [ ] `cd ts && npx vitest run test_playtest_contract.ts` shows 12 passed (real tail pasted); the Dissonance and scrapcrawl regressions are unchanged and green.
- [ ] No game module, existing test or YAML changed; `cd ts && npx tsc --noEmit` shows no new errors.
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the exported API as built (function names), the 12 test results, confirmation that `playRun` never throws. Recommended action: review, merge, then dispatch the two adopt directives (Dissonance, scrapcrawl).

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
| Status | Blocked |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-playtest-adapter-contract-directive |
| Base branch | - |
| Base commit | 8d0dd6bf4af5c252c5daaaba327e168ba73c988d |

**Status log**
- 2026-10-04 17:46 · robert-claude-laptop · none → Queued
- 2026-10-04 17:47 · robert-claude-laptop · Queued → Approved — lint override: cited ts/src/engine/playtest paths are new files this directive creates
- 2026-10-04 18:04 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-playtest-adapter-contract-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 18:05 · dispatcher · In progress → Blocked — setup failed before spawn: setup command 'uv sync --frozen' exited 1: 10054)
<!-- queue:end -->
