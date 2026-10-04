# Browser smoke: declarative manifest, pure helpers, runner script (M)

**Depends on:** `Playtest_Adapter_Contract_Directive` merged (this run reuses `formatFinding` from `ts/src/engine/playtest/report.ts`). If that file does not exist, STOP and write that in the Status row.
**Read first:** `docs/superpowers/specs/2026-10-04-automated-playtesting.md` (section c2), `docs/state/local-safe-check-2026-10-04.md` (the hand-run pass this automates), `ts/tools/succession-balance-sim.ts` (the shape of an existing tool), `ts/src/arcade/routing.ts` (`?game=`, `?embed=1`).

## 1. Why this exists

The real-browser "local safe check" (`docs/state/local-safe-check-2026-10-04.md`) found two bugs unit tests missed and is run by an agent clicking by hand each time. (a) slither_rogue showed "Time NaN" / "NaN:NaN" and a black canvas. (b) systemic_extract's NEW RUN button sat at x=571..637 inside an `overflow: hidden` top bar 12..378 wide at 390 px, so `document.documentElement.scrollWidth` was 390 (no overflow detected) yet the control could not be reached. A scrollWidth check alone is blind to that class; the check must walk the control's ancestor chain. This directive makes the pass a script: a per-demo declarative manifest, pure and unit-tested helpers (verdict, clipped-ancestor test, tap-target test, console allowlist, report, argument parsing), and a thin Playwright runner that the controller runs. Devin writes all of it but can run only the unit tests.

Measured on origin/main `0fa83acc` (2026-10-04): `uv run python --version` is `Python 3.12.12`; `cd ts && npx tsc --noEmit` prints nothing. The npm package `playwright` is NOT in `ts/package.json` or `ts/node_modules` (Python Playwright `>=1.61.0` is in `pyproject.toml`). So the runner must compile without it: it loads the library with a dynamic import of a variable name (below), never a literal `import ... from 'playwright'`.

## 2. Scope

1. New `ts/tools/playtest/manifest.ts` (types, `validateEntries`, `urlFor`).
2. New `ts/tools/playtest/verdict.ts` (`isAllowedConsole`, `isClipped`, `tapTargetOk`, `classifyVerdict`).
3. New `ts/tools/playtest/smokeReport.ts` (`renderSmokeReport`).
4. New `ts/tools/playtest/args.ts` (`parseArgs`).
5. New `ts/tools/playtest/pageProbes.ts` (in-page collectors; not unit-tested).
6. New `ts/tools/playtest/entries.ts` (the 5 manifest entries).
7. New `ts/tools/playtest-smoke.ts` (the runner; not run by you).
8. New test `ts/tests/test_playtest_smoke_manifest.ts`.

## 3. The work

First line of every new `.ts` file: `// new: <path>`. Modules 1-4 are pure (no DOM, no `window`, no Playwright, no file access, no `Date.now()`).

**Step 1: `manifest.ts`.**
```ts
export type Locator = { text: string } | { role: string; name: string };
export type SmokeStep =
  | { do: 'click'; target: Locator; expect?: string[]; expectGone?: string[] }   // text visible / not visible after the click
  | { do: 'key'; key: string; expect?: string[] }
  | { do: 'wait'; ms: number }
  | { do: 'see'; text: string[] };                                               // all of these texts are visible now
export interface SmokeEntry {
  id: string;                                                                    // the registry gameId
  start: { kind: 'arcade'; gameId: string } | { kind: 'embed'; slug: string };   // TS-native game via the arcade app, or an example embed
  firstMinute: SmokeStep[];                                                      // the LAST step is the first meaningful action
  changeChecks: SmokeStep[][];                                                   // each inner list is one check, e.g. the restart two-step
  controls: string[];                                                            // visible names of primary controls: must be on screen and >= 44 px at 390
  notes?: string;
}
export type Target = 'local' | 'live';
export function validateEntries(entries: SmokeEntry[]): string[]   // list of problems, [] when valid
export function urlFor(entry: SmokeEntry, target: Target, base: string): string
```
`validateEntries` returns one string per problem: empty `id`; duplicate `id`; a `start` without its `gameId`/`slug`; a `click` step with an empty `text`/`name`; a `see` step with no texts; a `wait` with `ms <= 0` or `ms > 10000`; an unknown `do`. `urlFor` trims trailing `/` from `base` and uses this routing table (local: the staged `local-arcade-preview` that the local safe check served; live routes are UNVERIFIED, the controller confirms them on the first live run):
- local arcade: `${base}/arcade/rfdgamestudio/?game=${gameId}`; local embed: `${base}/arcade/${slug}/`.
- live arcade: `${base}/games/${gameId}/`; live embed: `${base}/games/${slug}/`.

**Step 2: `verdict.ts`.**
```ts
export interface Rect { x: number; y: number; w: number; h: number }
export interface ChainLink { tag: string; rect: Rect; overflowX: string; overflowY: string }   // chain[0] is the control itself, then each parentElement up to <html>
export function isAllowedConsole(type: string, text: string): boolean
export function isClipped(chain: ChainLink[], viewport: { w: number; h: number }): boolean
export function tapTargetOk(rect: Rect, min?: number): boolean            // min defaults to 44
export type Severity = 'hard' | 'soft';
export interface SmokeFinding { demo: string; viewport: string; check: string; severity: Severity; message: string; step: number }
export type Verdict = 'SAFE' | 'UNSAFE' | 'NEEDS-LOOK';
export function classifyVerdict(findings: SmokeFinding[]): Verdict
```
- `isAllowedConsole`: true for any text containing `favicon.ico`, and for a `warning`-type message containing `AudioContext` (autoplay, benign: BPO Sim logs six). Everything else false.
- `isClipped(chain, viewport)`: true when ANY of: (a) for some ancestor `chain[i]`, `i >= 1`, whose `overflowX` is `hidden` or `clip`, the control rect `chain[0].rect` is not within the ancestor rect horizontally (`ctrl.x < anc.x - 1` or `ctrl.x + ctrl.w > anc.x + anc.w + 1`); (b) the same on the vertical axis with `overflowY` (`hidden` or `clip` only); (c) the control is outside the viewport horizontally (`ctrl.x < -1` or `ctrl.x + ctrl.w > viewport.w + 1`). `auto` and `scroll` ancestors are NOT clipping (the control is reachable by scrolling), and a control below the fold vertically is NOT clipped by itself. Returns false for an empty chain.
- `tapTargetOk(rect, min = 44)`: `rect.w >= min && rect.h >= min`.
- `classifyVerdict`: any `hard` finding gives `UNSAFE`; else any `soft` gives `NEEDS-LOOK`; else `SAFE`.

**Step 3: `smokeReport.ts`.** `renderSmokeReport(date: string, results: { demo: string; verdict: Verdict; findings: SmokeFinding[]; firstActionMs: number | null; screenshots: string[]; repro: string }[]): string`. Markdown for a phone: line 1 `# Playtest smoke <date>`; line 2 exactly `SAFE a | NEEDS-LOOK b | UNSAFE c` (counts); then one block per non-SAFE demo (UNSAFE first, then NEEDS-LOOK, each alphabetical): `## <demo>: <verdict>`, one bullet per finding (`<viewport> <check>: <message>`), the screenshot paths, and a line `repro: <repro>`; then one line `SAFE: id, id, id` (alphabetical; `SAFE: none` when empty). A demo's first-action time appears as `first action <n> s` in its block or, for SAFE demos, is omitted.

**Step 4: `args.ts`.** `parseArgs(argv: string[]): { ok: true; value: Args } | { ok: false; errors: string[] }` where `Args = { base: string; target: Target; demos: string[] | 'all'; out: string; readonly: boolean; viewports: ('desktop' | 'phone')[] }`. Flags: `--base <url>` (default `http://127.0.0.1:5199`), `--target local|live` (default `local`), `--demos all|id,id` (default `all`), `--out <dir>` (default `docs/state`), `--readonly` (boolean), `--viewports desktop,phone` (default both). `--target live` implies `readonly: true` and cannot be overridden. An unknown flag, a missing value or an unknown `--target` value adds an error string; all errors are collected.

**Step 5: `pageProbes.ts`.** Self-contained functions that Playwright serialises into the page (they must not reference any import or outer variable): `collectClipChain(el: Element): ChainLink[]` (walk `el` then `parentElement` to the root, per node `getBoundingClientRect()` as `{x: left, y: top, w: width, h: height}` and `getComputedStyle(node).overflowX/overflowY`, `tag` lower-case), `readPageFacts(): { scrollWidth: number; innerWidth: number; bodyText: string }` (`document.documentElement.scrollWidth`, `window.innerWidth`, `document.body.innerText`). Import only the `ChainLink` type.

**Step 6: `entries.ts`.** Export `SMOKE_ENTRIES: SmokeEntry[]` with exactly these five (texts come from the hand-run pass; the controller extends `firstMinute` after the first real run, and these start minimal on purpose; do not invent selectors or texts that are not listed here):

| id | start | firstMinute | changeChecks | controls | notes |
|---|---|---|---|---|---|
| `systemic_extract` | embed slug `systemic_extract` | `[]` | `[[click text 'NEW RUN' expect ['CONFIRM NEW RUN?']]]` | `['NEW RUN']` | `top bar clipped NEW RUN off screen at 390 (local safe check 2026-10-04)` |
| `slither_rogue` | arcade `slither_rogue` | `[]` | `[]` | `['Restart this run']` | `Time NaN and a black canvas at the same check; bodyText must never contain NaN` |
| `scrapcrawl` | arcade `scrapcrawl` | `[]` | `[]` | `[]` | `lose path shows RUN OVER and a Restart button; win path needs a human once` |
| `slimeworld` | arcade `slimeworld` | `[]` | `[[click text 'New Campaign' expect ['CONFIRM HARD RESET', 'CANCEL']]]` | `['New Campaign']` | `two-step hard reset` |
| `kingmaker_squads` | embed slug `kingmaker_squads` | `[]` | `[[click text 'Restart' expect ['Confirm restart?']]]` | `['Restart']` | `no native confirm dialog` |

**Step 7: `ts/tools/playtest-smoke.ts`** (the runner; you write it, you do NOT run it). Header comment with the usage lines `cd ts && npx vite-node tools/playtest-smoke.ts -- --base http://127.0.0.1:5199 --demos all` and `... --target live --base https://games.rfditservices.com --demos shoal`. Behaviour:
1. Parse args (`parseArgs`); on errors print them and `process.exit(2)`. Validate `SMOKE_ENTRIES` (`validateEntries`); a problem exits 2. Filter by `--demos`.
2. Load the library WITHOUT a literal import: `const lib = 'playwright'; const pw: any = await import(lib).catch(() => null);` and if it is null print `playwright is not installed: run "cd ts && npm install -D playwright" once, then "npx playwright install chromium"` and exit 3.
3. One Chromium launch. For each demo and each viewport create a context: desktop `{ viewport: { width: 1280, height: 720 } }`, phone `{ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }`. Attach `page.on('console')` (record errors always; warnings unless `isAllowedConsole(type, text)`), `page.on('pageerror')` (hard `uncaught-exception`), `page.on('requestfailed')` and `page.on('response')` with status >= 400 (hard `failed-request`, ignore `favicon.ico`). Start tracing with `context.tracing.start({ screenshots: true, snapshots: true })`; keep the trace zip (`<out>/playtest-<date>/<id>-<viewport>.zip`) only when that demo/viewport has a finding, else `tracing.stop()` without a path.
4. `t0 = Date.now()`; `page.goto(urlFor(entry, args.target, args.base), { waitUntil: 'load' })`; a goto failure is a hard `load` finding. Soft `slow-load` when load took over 5000 ms.
5. `page.evaluate(readPageFacts)`: hard `horizontal-overflow` when `scrollWidth > innerWidth + 1`; hard `nan-text` when `bodyText` matches `/\bNaN\b|\[object Object\]/`.
6. Run `firstMinute` steps: locate by text with `page.getByText(text, { exact: false }).first()` or by role with `page.getByRole(role, { name })`; `click`, `keyboard.press`, `waitForTimeout`; every `expect` text must become visible within 3000 ms else hard `step-failed` (message names the step index and text); `expectGone` likewise. After the last step set `firstActionMs = Date.now() - t0`; soft `slow-first-action` when over 60000 ms. In `--readonly` mode do the same (clicking the game's own buttons changes only local state) but never fill or submit a form, never follow a link that leaves the origin.
7. For each name in `controls`: locate (text first); not found within 3000 ms is hard `control-missing`. Else take `boundingBox()` and `locator.evaluate(collectClipChain)`; `isClipped(chain, viewport)` is hard `control-clipped` (message: the control name and its rect); at the phone viewport `tapTargetOk(box)` false is soft `tap-target-small` (message with the size).
8. Run each `changeChecks` list as steps in a fresh page load of the same URL.
9. Screenshots with stable names: `<out>/playtest-<date>/<id>-<w>-load.png` after load and `<id>-<w>-after.png` at the end (`w` = 1280 or 390), `page.screenshot({ path })`.
10. Findings go through `classifyVerdict`; write `<out>/playtest-<date>.md` with `renderSmokeReport`; append one `formatFinding('L2', id, check, 'script', stepIndex, message, repro)` line per finding to `<out>/playtest-findings.md`, where `repro` is the exact command line for that demo (`cd ts && npx vite-node tools/playtest-smoke.ts -- --base <base> --demos <id>` plus `--target live` when live). Print the report's first two lines to the console. Exit code 0 always (the report is the result), except exit 2 and 3 above.
`date` is `new Date().toISOString().slice(0, 10)`. Use only `node:fs` and `node:path` besides the library. Put the whole flow in an `async function main()` called at the bottom (no top-level await).

**Step 8: `ts/tests/test_playtest_smoke_manifest.ts`.** Exactly these 10 `it` cases (import from `../tools/playtest/*` and `../src/engine/playtest`):
1. `validateEntries(SMOKE_ENTRIES)` is `[]`; there are exactly 5 entries; ids are unique.
2. `validateEntries` reports: an empty id, a duplicate id, an arcade start with no gameId, a click with empty text, a `wait` of 0 and of 20000 ms.
3. `urlFor` gives `http://x/arcade/rfdgamestudio/?game=slimeworld` (local arcade), `http://x/arcade/systemic_extract/` (local embed), `http://x/games/slimeworld/` and `http://x/games/systemic_extract/` (live), with and without a trailing `/` on the base.
4. `isAllowedConsole('error', 'Failed to load resource: ... /favicon.ico')` true; `('warning', 'The AudioContext was not allowed to start')` true; `('error', 'AudioContext boom')` false; `('error', 'TypeError: x is undefined')` false.
5. `isClipped` with the real systemic_extract numbers: chain `[{tag:'button', rect:{x:571,y:20,w:66,h:30}, overflowX:'visible', overflowY:'visible'}, {tag:'div', rect:{x:12,y:10,w:366,h:50}, overflowX:'hidden', overflowY:'hidden'}, {tag:'html', rect:{x:0,y:0,w:390,h:844}, overflowX:'visible', overflowY:'visible'}]` at viewport 390x844 is true; a control at x=300 w=60 inside the same ancestor is false; an `auto` ancestor that does not contain the control is false; a control below the fold (y=2000) inside visible ancestors is false; a control at x=380 w=60 with all-visible ancestors is true (outside the viewport horizontally); an empty chain is false.
6. `tapTargetOk({x:0,y:0,w:44,h:44})` true; `w:40` false; `h:43` false; `tapTargetOk(rect, 24)` with 30x30 true.
7. `classifyVerdict`: `[]` is SAFE; one soft is NEEDS-LOOK; a soft plus a hard is UNSAFE.
8. `renderSmokeReport` for three demos (one SAFE, one NEEDS-LOOK, one UNSAFE) has the exact second line `SAFE 1 | NEEDS-LOOK 1 | UNSAFE 1`, lists the UNSAFE block before the NEEDS-LOOK block, includes each non-SAFE `repro:` line and a `SAFE: <id>` line, and does not print findings for the SAFE demo.
9. `parseArgs([])` gives the defaults; `['--target','live']` has `readonly: true`; `['--demos','a,b','--viewports','phone']` parses; `['--nope']` and `['--base']` both return `ok: false` with errors; `['--target','x']` is an error.
10. `formatFinding('L2', 'systemic_extract', 'control-clipped', 'script', 0, 'NEW RUN at x=571 w=66', 'cd ts && npx vite-node tools/playtest-smoke.ts -- --demos systemic_extract')` equals `FINDING systemic_extract L2/control-clipped seed=script step=0 :: NEW RUN at x=571 w=66 :: repro: cd ts && npx vite-node tools/playtest-smoke.ts -- --demos systemic_extract`.

## 4. What NOT to do

- Do not add `playwright`, `@playwright/test` or any dependency; do not edit `package.json`, the lockfile, `scripts/check.ps1`, `.githooks/*`, the arcade shell or any game. The runner is NOT added to the pre-push hook or to any npm script.
- Do not run the runner, a browser or `vite-node` (the sandbox refuses them). Do not write a literal `import ... from 'playwright'`: `cd ts && npx tsc --noEmit` must stay clean without the package.
- No selectors or texts beyond those in Step 6; no clicks that leave the origin; no form submission; nothing that writes to a live site.
- Do not edit the contract modules in `ts/src/engine/playtest/`.

## 5. Verification

`cd ts && npx vitest run test_playtest_smoke_manifest.ts` expects `Tests  10 passed (10)`; paste the real tail.
Then `cd ts && npx tsc --noEmit`: no new errors (baseline: no output); this also type-checks `ts/tools/playtest-smoke.ts`.
Then regression: `cd ts && npx vitest run test_playtest_contract.ts` expects `Tests  12 passed (12)`.
Then `git status`: only the 8 files in Scope appear.

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

- [ ] The 8 files in Scope exist; no literal `from 'playwright'` import anywhere; no dependency, script or hook changed.
- [ ] `cd ts && npx vitest run test_playtest_smoke_manifest.ts` shows 10 passed (real tail pasted); the contract suite is still 12 passed.
- [ ] `cd ts && npx tsc --noEmit` shows no new errors (it compiles `ts/tools/playtest-smoke.ts`).
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the 10 test results and the exports as built; anything in the runner you could not make match Step 7 and why. Then **Controller finish (after merge, not this run):** (1) `cd ts && npm install -D playwright` once, then `npx playwright install chromium` (skip if the browser is already cached); (2) build and stage the demos as the local safe check did (`npm run build:demo -- <id>`, copy to `local-arcade-preview/arcade/<id>/`, `vite dev` on 127.0.0.1:5199); (3) `cd ts && npx vite-node tools/playtest-smoke.ts -- --base http://127.0.0.1:5199 --demos all`; (4) expect systemic_extract UNSAFE (`control-clipped`) and slither_rogue UNSAFE (`nan-text`) if those bugs are still open on that build; read the report, confirm the live routes in `urlFor` before the first `--target live` run, extend the entries' `firstMinute`, then paste the report into `docs/state/`. Recommended action: review and merge.

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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 17:47 · robert-claude-laptop · none → Queued
<!-- queue:end -->
