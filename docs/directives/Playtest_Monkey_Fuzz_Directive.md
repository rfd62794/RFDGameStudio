# Monkey fuzz: seeded action generator, replayable log, detectors, runner (M)

**Depends on:** `Playtest_Adapter_Contract_Directive` merged (reuses `formatFinding` and `createStallTracker` from `ts/src/engine/playtest/`) and `Playtest_Browser_Smoke_Manifest_Directive` merged (reuses `ts/tools/playtest/manifest.ts` <!-- new: ts/tools/playtest/manifest.ts --> `urlFor`/`SMOKE_ENTRIES`/`Target`, and `isAllowedConsole` from `ts/tools/playtest/verdict.ts` <!-- new: ts/tools/playtest/verdict.ts -->). If any of those files does not exist, STOP and write which in the Status row.
**Read first:** `docs/superpowers/specs/2026-10-04-automated-playtesting.md` (section c3), `ts/tools/playtest/manifest.ts`, `ts/tools/playtest/verdict.ts`, `ts/tools/playtest/args.ts` <!-- new: ts/tools/playtest/args.ts --> (the argument-parser shape to copy), `ts/tools/playtest-smoke.ts` <!-- new: ts/tools/playtest-smoke.ts --> (the runner shape to copy: dynamic library load, contexts, console/pageerror hooks), `ts/src/engine/shared/seededRandom.ts` (`mulberry32(seed: number): () => number`).

## 1. Why this exists

Scripted smoke only visits the path someone wrote down. Two bug classes need random play: a state nobody scripted (slither_rogue's "Time NaN" and black canvas showed up only after the shell drove the loop) and a control that breaks under unplanned input. Android's Monkey is the model: `monkey -s <seed> --throttle <ms> <count>` produces the identical event sequence for a seed and stops on a crash or ANR (https://developer.android.com/studio/test/other-testing-tools/monkey, accessed 2026-10-04); gremlins.js does the same for web UIs with a seeded randomizer, species (clicker, toucher, typer, scroller) and an FPS monitor, and stops after 10 errors (https://github.com/marmelab/gremlins.js, accessed 2026-10-04). We write our own small generator so the action log is ours, written before each action (a hang still leaves the repro) and replayable. This directive builds pure, unit-tested pieces (generator, log, detectors, report, argument parsing) plus a thin runner the controller runs; Devin cannot run a browser.

Measured on origin/main `0fa83acc` (2026-10-04): `uv run python --version` is `Python 3.12.12`; `cd ts && npx tsc --noEmit` prints nothing. The npm package `playwright` is not installed in `ts/node_modules` until the controller installs it (see the smoke directive); the runner loads it with a dynamic import of a variable name so `tsc` passes without it.

## 2. Scope

1. New `ts/tools/playtest/monkey.ts` (`MonkeyAction`, `nextAction`, log format and parse).
2. New `ts/tools/playtest/detectors.ts` (pure detectors and finding builder).
3. New `ts/tools/playtest/monkeyReport.ts` (`renderMonkeyReport`).
4. New `ts/tools/playtest/monkeyArgs.ts` (`parseMonkeyArgs`).
5. New `ts/tools/playtest/monkeyProbes.ts` (in-page code; not unit-tested).
6. New `ts/tools/playtest-monkey.ts` (the runner; not run by you).
7. New test `ts/tests/test_playtest_monkey.ts` <!-- new: ts/tests/test_playtest_monkey.ts -->.

## 3. The work

First line of every new `.ts` file: `// new: <path>`. Files 1-4 are pure (no DOM, no Playwright, no file access, no `Date.now()`, no `Math.random()`).

**Step 1: `monkey.ts`.**
```ts
export type MonkeyKind = 'tap' | 'key' | 'drag' | 'scroll';
export interface MonkeyAction { i: number; kind: MonkeyKind; x?: number; y?: number; x2?: number; y2?: number; key?: string; dy?: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface Mix { tap: number; key: number; drag: number; scroll: number }   // weights summing to 1
export const DEFAULT_MIX: Mix = { tap: 0.6, key: 0.25, drag: 0.1, scroll: 0.05 };
export const KEY_SET: string[] = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Escape','Tab','w','a','s','d','1','2','3'];
export const TARGET_BIAS = 0.7;
export function nextAction(rng: () => number, i: number, viewport: { w: number; h: number }, targets: Rect[], mix?: Mix): MonkeyAction
export function formatLogLine(a: MonkeyAction): string      // JSON.stringify(a), no trailing newline
export function parseLog(text: string): { actions: MonkeyAction[]; partial: boolean }
```
`nextAction`, in this exact order of `rng()` calls so a seed is stable: (1) `r = rng()` picks the kind by cumulative mix in the order tap, key, drag, scroll; (2) for `tap` and `drag` a point: `rng()` decides target-biased (`< TARGET_BIAS` and `targets.length > 0`) or uniform; biased picks the target by `Math.floor(rng() * targets.length)` then `x = t.x + rng() * t.w`, `y = t.y + rng() * t.h`; uniform is `x = rng() * viewport.w`, `y = rng() * viewport.h`; round x and y to integers and clamp to `[0, viewport.w - 1]` / `[0, viewport.h - 1]`; (3) `drag` also draws a second uniform point (`x2`, `y2`, rounded and clamped); (4) `key` picks `KEY_SET[Math.floor(rng() * KEY_SET.length)]`; (5) `scroll` has `dy = Math.round((rng() - 0.5) * 800)`. When the biased branch is not taken because there are no targets, still consume the same `rng()` calls (draw the bias value first, always). `parseLog` splits on newlines, ignores blank lines, JSON-parses each line; if the LAST non-blank line fails to parse (a write cut off by a hang or crash) it is dropped and `partial` is true; an unparseable line anywhere else throws `new Error('bad log line N')`.

**Step 2: `detectors.ts`.**
```ts
import type { MonkeyAction } from './monkey';
export type MonkeyCheck = 'exception' | 'console-error' | 'hang' | 'crash' | 'blank-canvas' | 'bad-text' | 'stall' | 'low-fps';
export interface MonkeyFinding { check: MonkeyCheck; message: string; seed: number; actionIndex: number; lastActions: MonkeyAction[] }
export function severityOf(check: MonkeyCheck): 'hard' | 'soft'    // stall and low-fps are soft, everything else hard
export function findBadText(text: string): string | null           // snippet (up to 40 chars around the hit) or null
export function canvasSignature(rgba: number[]): 'blank' | 'varied' // rgba = sampled pixels flattened [r,g,b,a,r,g,b,a,...]; 'blank' when every sampled pixel equals the first, or the list is empty
export function blankStreak(signatures: ('blank' | 'varied')[], n?: number): boolean   // last n (default 3) all 'blank' and at least n entries
export function isHang(lastFrameAgeMs: number, actionPendingMs: number): boolean       // true when frame age > 5000 or pending > 10000
export function lowFps(frameTimesMs: number[]): boolean                                  // average fps over the list < 20; false for an empty list
export function makeFinding(check: MonkeyCheck, message: string, seed: number, actionIndex: number, actions: MonkeyAction[]): MonkeyFinding  // lastActions = the last 5 of `actions`
export function shouldStop(findings: MonkeyFinding[], max?: number): boolean            // findings.length >= max (default 10)
```
`findBadText` matches the case-sensitive words `NaN` and `undefined` on word boundaries and the literal `[object Object]` (so `banana`, `Nan` and `Pandemic` do not match); the snippet is the matched word with up to 20 characters either side, whitespace collapsed.

**Step 3: `monkeyReport.ts`.** `renderMonkeyReport(date: string, results: { demo: string; seed: number; seconds: number; actionCount: number; findings: MonkeyFinding[]; longTasks: number; logPath: string; repro: string }[]): string`. Line 1 `# Playtest monkey <date>`; line 2 exactly `CLEAN a | NEEDS-LOOK b | UNSAFE c` (a demo is UNSAFE when any finding is `hard`, NEEDS-LOOK when it has only soft findings, CLEAN with none); then one block per non-clean demo (UNSAFE first, then NEEDS-LOOK, alphabetical): `## <demo>: <verdict> (seed <seed>, <actionCount> actions, <longTasks> long tasks)`, one bullet per finding (`<check> at action <i>: <message>`), the last actions of the first finding as a compact line, `log: <logPath>` and `repro: <repro>`; then `CLEAN: id, id` (alphabetical, `CLEAN: none` when empty).

**Step 4: `monkeyArgs.ts`.** `parseMonkeyArgs(argv: string[]): { ok: true; value: MonkeyArgs } | { ok: false; errors: string[] }` with `MonkeyArgs = { base: string; target: Target; demos: string[] | 'all'; seconds: number; seed: number | 'random'; throttleMs: number; viewport: 'phone' | 'desktop'; out: string; replay: string | null; readonly: boolean }`. Flags: `--base` (default `http://127.0.0.1:5199`), `--target local|live` (default `local`; `live` forces `readonly: true`), `--demos all|id,id` (default `all`), `--seconds <n>` (default 60, integer 1-600), `--seed <n>|random` (default `random`), `--throttle <ms>` (default 150, 0-2000), `--viewport phone|desktop` (default `phone`), `--out <dir>` (default `docs/state`), `--replay <file>` (default none; needs exactly one demo in `--demos`, else an error), `--readonly`. Unknown flags, missing values, out-of-range numbers and a bad `--target`/`--viewport` value each add an error; collect them all. Import `Target` from `./manifest`.

**Step 5: `monkeyProbes.ts`.** Self-contained functions Playwright serialises into the page (no imports, no outer variables): `installFrameProbes(): void` (defines `window.__mk = { frames: 0, lastFrame: performance.now(), frameTimes: [], longTasks: 0 }`, a `requestAnimationFrame` loop that updates it and keeps the last 120 frame deltas, and a `PerformanceObserver` for `longtask` (50 ms threshold, https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming, accessed 2026-10-04) wrapped in try/catch because it is not available in every browser), `readTargets(): { x: number; y: number; w: number; h: number }[]` (visible rects, width and height at least 4, of `button, a[href], [role="button"], input, select, canvas, [onclick]` that are inside the viewport), `readState(): { text: string; frameAge: number; frameTimes: number[]; longTasks: number; canvasSample: number[] }` (`document.body.innerText`, `performance.now() - __mk.lastFrame`, the frame deltas, the long-task count, and for the largest `<canvas>` a 2D-context `getImageData` sample of an 8x8 grid of pixels flattened to `[r,g,b,a,...]` inside try/catch, `[]` when it cannot be read, for example a WebGL canvas).

**Step 6: `ts/tools/playtest-monkey.ts`** <!-- new: ts/tools/playtest-monkey.ts --> <!-- new: tools/playtest-monkey.ts --> (the runner; you write it, you do NOT run it). Header comment with the usage line cd ts && npx vite-node tools/playtest-monkey.ts -- --demos scrapcrawl --seconds 60 --seed 4242, and `... --demos scrapcrawl --replay <the .jsonl file the first run wrote under docs/state/playtest-monkey>`. Behaviour:
1. `parseMonkeyArgs`, errors exit 2. Load the library as in `playtest-smoke.ts` (variable-name dynamic import, exit 3 with the same install hint when missing). Everything inside an `async function main()`.
2. Per demo: context for the viewport (phone: 390x844 `isMobile`, `hasTouch`, `deviceScaleFactor: 2`; desktop 1280x720); `context.addInitScript(installFrameProbes)`; origin guard `context.route('**/*', r => same origin or `data:`/`blob:` ? r.continue() : r.abort())`; close any popup page (`context.on('page')`); hooks for `pageerror` (finding `exception`), `console` of type `error` not allowed by `isAllowedConsole` (finding `console-error`), page `close` or `crash` events (finding `crash`).
3. `seed = args.seed === 'random' ? (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0 : args.seed`; print `seed=<n>` at the start. `rng = mulberry32(seed)`. Navigate to `urlFor(entry, args.target, args.base)` (find the entry by id in `SMOKE_ENTRIES`; a demo id with no entry is skipped with a printed note).
4. Loop until `seconds` elapsed or `shouldStop(findings)`: every 10 actions refresh `targets` through `readTargets`; `a = nextAction(rng, i, viewport, targets)` (or the next logged action in `--replay` mode, with the generator not used); BEFORE executing, append `formatLogLine(a) + '\n'` to `<out>/playtest-monkey/<id>-<seed>.jsonl` with `appendFileSync` (so a hang leaves the action that caused it); execute: `tap` is `page.touchscreen.tap(x, y)` on phone and `page.mouse.click(x, y)` on desktop, `key` is `page.keyboard.press(key)`, `drag` is mouse down at (x, y), move to (x2, y2) in 5 steps, up, `scroll` is `page.mouse.wheel(0, dy)`; wrap each action in a 10 s race: a timeout is finding `hang`. Then `readState`: `findBadText(text)` non-null is `bad-text`; every 10 actions push `canvasSignature(canvasSample)` and `blankStreak(...)` after at least 3 signatures AND at least 10 actions is `blank-canvas` (skip when `canvasSample` is empty); `isHang(frameAge, 0)` is `hang`; `lowFps(frameTimes)` is `low-fps` (once per demo); a stall tracker from the contract (`createStallTracker(40)`) fed with `text + signature` after each action reports `stall` once. Wait `throttleMs` between actions. Each check records at most one finding per kind per demo, through `makeFinding`.
5. At the end take one screenshot `<out>/playtest-<date>/monkey-<id>-<seed>.png`, close the context, write `<out>/playtest-monkey-<date>.md` with `renderMonkeyReport`, and append `formatFinding('L3', id, check, seed, actionIndex, message, repro)` lines to `<out>/playtest-findings.md`, where `repro` is `cd ts && npx vite-node tools/playtest-monkey.ts -- --demos <id> --replay <logPath>`. Exit code 0 except 2 and 3.
`date` is `new Date().toISOString().slice(0, 10)`. Never navigate off the origin; in `--readonly` (always on for `--target live`) additionally abort every request whose method is not GET or HEAD.

**Step 7: `ts/tests/test_playtest_monkey.ts`.** Exactly these 12 `it` cases:
1. `nextAction` is deterministic: 50 actions from `mulberry32(5)` twice are deeply equal; seeds 5 and 6 differ.
2. Mix: 2000 actions (seed 1, no targets, viewport 390x844) have kind shares within 5 percentage points of `DEFAULT_MIX`; every tap/drag point is an integer inside the viewport; every key is in `KEY_SET`; every scroll `dy` is within -400..400.
3. Target bias: with one target `{ x: 100, y: 100, w: 40, h: 40 }` and 3000 actions, between 60% and 80% of the taps land inside that rect.
4. `formatLogLine` then `parseLog` round-trips 10 actions; a text whose last line is cut off (`{"i":3,"ki`) returns the first actions with `partial: true`; a bad line in the middle throws; blank lines are ignored.
5. `findBadText('Time NaN')` is a snippet containing `NaN`; `'undefined:undefined'` and `'[object Object]'` are flagged; `'banana'`, `'Nan'`, `'Pandemic'` and `''` are null.
6. `canvasSignature` of 16 identical pixels is `'blank'`, of two different pixels `'varied'`, of `[]` `'blank'`; `blankStreak(['varied','blank','blank','blank'])` is true, `['blank','blank']` is false, `['blank','varied','blank']` is false.
7. `isHang(6000, 0)` true, `isHang(100, 11000)` true, `isHang(100, 100)` false.
8. `lowFps` of sixty 16 ms frames false, of sixty 80 ms frames true, of `[]` false.
9. `makeFinding` keeps only the last 5 of 8 actions; `shouldStop` is false at 9 findings and true at 10; `severityOf('stall')` and `severityOf('low-fps')` are `'soft'`, `severityOf('blank-canvas')` is `'hard'`.
10. `parseMonkeyArgs([])` gives the defaults; `['--target','live']` has `readonly: true`; `['--seed','42','--seconds','30']` parses; `['--seconds','0']`, `['--seconds','601']`, `['--nope']`, `['--viewport','tv']` and `['--replay','x.jsonl']` (no single demo) each return `ok: false`.
11. `renderMonkeyReport` for three demos (clean, soft-only, hard) has the exact second line `CLEAN 1 | NEEDS-LOOK 1 | UNSAFE 1`, lists the UNSAFE block first, includes each non-clean `log:` and `repro:` line and a `CLEAN: <id>` line.
12. Reuse check: `formatFinding('L3', 'scrapcrawl', 'blank-canvas', 4242, 212, 'canvas stayed one colour', 'r')` equals `FINDING scrapcrawl L3/blank-canvas seed=4242 step=212 :: canvas stayed one colour :: repro: r`.

## 4. What NOT to do

- Do not add `playwright`, `gremlins.js`, `fast-check` or any dependency; do not edit `package.json`, the lockfile, `scripts/check.ps1`, `.githooks/*`, any game or the arcade shell. The runner is not added to any npm script or hook.
- Do not run the runner, a browser or `vite-node` (the sandbox refuses them). No literal `import ... from 'playwright'`: `cd ts && npx tsc --noEmit` must stay clean without the package.
- Do not edit the contract modules or the smoke modules; if one is missing something, STOP and write what in the Status row.
- No navigation off the origin, no non-GET requests in readonly mode, no form submission.

## 5. Verification

`cd ts && npx vitest run test_playtest_monkey.ts` expects `Tests  12 passed (12)`; paste the real tail.
Then `cd ts && npx tsc --noEmit`: no new errors (baseline: no output); this also type-checks `ts/tools/playtest-monkey.ts`.
Then regression: `cd ts && npx vitest run test_playtest_smoke_manifest.ts` expects `Tests  10 passed (10)` and `cd ts && npx vitest run test_playtest_contract.ts` expects `Tests  12 passed (12)`.
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

- [ ] The 7 files in Scope exist; no literal `from 'playwright'` import anywhere; no dependency, script or hook changed.
- [ ] `cd ts && npx vitest run test_playtest_monkey.ts` shows 12 passed (real tail pasted); the smoke (10) and contract (12) suites are still green.
- [ ] `cd ts && npx tsc --noEmit` shows no new errors (it compiles `ts/tools/playtest-monkey.ts`).
- [ ] `nextAction` consumes `rng()` in the documented order (case 1 and 3 prove stability); the log line is written before each action in the runner.
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the 12 test results and the exports as built; anything in the runner you could not make match Step 6 and why. Then **Controller finish (after merge, not this run):** with `playwright` installed and the demos staged as in the smoke directive, the controller then runs, from the ts folder, cd ts && npx vite-node tools/playtest-monkey.ts -- --demos all --seconds 60, then reads `docs/state/playtest-monkey-<date>.md`, and for each UNSAFE demo replay its log (`--replay`) to confirm the finding reproduces before writing a fix directive; paste the report into `docs/state/`. Recommended action: review and merge.

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
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 17:47 · robert-claude-laptop · none → Queued
- 2026-10-09 23:34 · robert-claude-laptop · Queued → Approved
<!-- queue:end -->
