# Automated playtesting: bots, browser smoke, monkey fuzz and first-minute checks

Date: 2026-10-04. Status: draft for Robert. Authority: Robert 2026-10-04 17:28, "I also want to work on a framework for automated play testing of the demos where possible."
Inputs read at origin/main `0fa83acc`: the headless tests named in section a, `docs/state/local-safe-check-2026-10-04.md`, `docs/superpowers/specs/2026-10-04-tuning-tools.md` (on main), `2026-10-04-engine-tooling-roadmap.md` (branch `docs/engine-tooling-roadmap`, not on main yet), `2026-10-03-demo-polish-standard.md`, `tests/e2e/*`, `scripts/check.ps1`, `.githooks/pre-push`, `ts/tools/build-demo.ts`, `ts/src/arcade/routing.ts` (`?game=`, `?embed=1`).
Constraints that stand: TS-native, solo-owner scale, Robert is the high-level designer and agents build, phone-first, inviting for players, SOLID/SRP (new behaviour in small new modules), no backend, Devin cannot run `vite-node`, `npm run build:*` or a browser (the controller or a Claude agent does).

## a. Why: what is done by hand today, and what it found

| Today | Where | Cost |
|---|---|---|
| Headless bot or sim per game, each hand-rolls its own loop | `test_dissonance_bot_run.ts` (real Lua session, seeds 1-4, per-step sanity, 500-step cap; measured today: seed 1 victory 29 steps, 2 victory 23, 3 game_over 20, 4 game_over 20), `test_scrapcrawl_sim_runs.ts` (200 seeded runs, `SIM unarmed=0.350 crafted=0.750`), `test_chimera_wilds_balance.ts`, `test_horse_racing_headless_balance.ts`, `test_slimeworld_headless_balance.tsx`, `test_shoal_headless.ts`, `test_slither_rogue_run_loop.ts`, `succession-balance-sim.ts` | every new game copies 80 lines; invariants (finite, no NaN, terminal reachable) are re-asserted differently each time |
| Real-browser "local safe check" by an agent with the Playwright MCP | `docs/state/local-safe-check-2026-10-04.md`: 13 demos x (load, 1280 and 390 screenshots, console, scrollWidth, one change check) | about one agent session; not repeatable on demand; not written down as a script |
| Python Playwright e2e | `tests/e2e/` (planetofgreed x3, dissonance new-run-to-map, slimeworld first breed), marked `slow`+`e2e`, excluded from `scripts/check.ps1` | 5 files, one flow each, each starts its own vite server |

Two real bugs that unit tests missed were found only by the browser pass: slither_rogue "Time NaN" and a black canvas (`LuaExecutor.call` returns arrays since 2026-07-18; the unit tests never drove the loop through the shell), and systemic_extract NEW RUN clipped off screen at 390 although `scrollWidth` was 390 (so a scrollWidth check alone is blind to it: the control sat at x=571..637 inside an `overflow:hidden` ancestor). A browser pass also judged first impressions (coin_pusher mid-run first screen, tiny ~373x210 cabinet iframe) that no assert would catch. The framework must make the first kind automatic and the second kind cheap to look at.

## b. Research (accessed 2026-10-04; [V] fetched, [U] unverified/general knowledge)

- Bots drive the real game and report: Ubisoft Reflections' "Client Bots" for The Division mimic human input, play missions with generated reports, and collect performance data [V] https://gdcvault.com/play/1026382/Automated-Testing-Using-AI-Controlled (only the abstract was readable; the slides are paywalled). Overnight soak bots over deterministic sims find softlocks, unreachable branches and degenerate strategies [V, search snippet, secondary] https://theneuralbase.com/ai-for-gaming/learn/intermediate/automated-bot-playthroughs/. Generic oracles run on every state transition and failures keep the exact action sequence [V, snippet] https://github.com/kevinnie2003/playtest-agent.
- Softlock detection: model checking exists for fixed levels [V, snippet] https://dl.acm.org/doi/fullHtml/10.1145/3472538.3472542; for us the cheap form is two runtime oracles: no legal action while not terminal (dead end), and the state fingerprint unchanged for K consecutive actions (stall) [U: our design, standard practice].
- Monkey/gremlin fuzzing: gremlins.js has species (clicker, toucher, typer, scroller, formFiller), mogwais (FPS monitor), a seeded randomizer so the same seed replays the same attack, and stops after 10 errors [V] https://github.com/marmelab/gremlins.js. Android Monkey: `-s <seed>`, event count, `--throttle`, stops on crash and ANR, identical sequence per seed [V] https://developer.android.com/studio/test/other-testing-tools/monkey. We write our own 100-line generator (section c3) so the action log is ours and replayable; gremlins.js is a fallback, not a dependency.
- Playwright features worth reusing: `toHaveScreenshot` with `maxDiffPixels`, `stylePath` to hide dynamic bits, baselines per OS/browser, `--update-snapshots`, "run in the same environment where baselines were generated" [V] https://playwright.dev/docs/test-snapshots; device registry, `isMobile`, `hasTouch` [V] https://playwright.dev/docs/emulation; trace viewer (DOM snapshots, console, network per action) [V] https://playwright.dev/docs/trace-viewer-intro (whether `context.tracing` works from the plain library: the page excerpt did not say; [U], believed yes); aria snapshots as YAML of the accessibility tree [V] https://playwright.dev/docs/aria-snapshots. fixtures need `@playwright/test`; we use the plain `playwright` library (section c2) and keep trace, `page.screenshot`, device descriptors, `locator`.
- Property and model-based testing: fast-check has shrinking, seed and path replay, and `fc.commands`/`modelRun` for stateful systems [V] https://fast-check.dev/docs/introduction/. Not in `package.json` today; adopting it needs a controller `npm install` (open question 3). Layer 1 stays dependency-free first (a seeded policy plus invariants is a poor man's model run).
- Budgets: Long Tasks API threshold is 50 ms, `PerformanceObserver` type `longtask`, not Baseline [V] https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming. Target size: WCAG 2.5.8 minimum is 24x24 CSS px [V] https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html; the 44 px figure is the enhanced criterion 2.5.5 and Apple's guideline [U, number not on the fetched page]; the polish standard already uses 44 px for the primary pill.
- Small studios: the repeated advice is a short golden-path script for every build, a monkey run overnight, and human playtests for feel only [U, synthesis of the snippets above]. That is this spec's shape.

## c. Design: four layers, each independently useful

### c1. Layer 1 Bot playtest (headless, Devin-runnable): `ts/src/engine/playtest/`
```ts
// types.ts
export interface PlaytestAdapter<S = unknown, A = unknown> {
  readonly gameId: string;
  init(seed: number): void;            // fresh session; deterministic for a seed
  observe(): S;                        // what a player could see
  legalActions(): A[];                 // empty + not terminal = dead end
  act(a: A): void;                     // may throw: the runner records it
  isTerminal(): boolean;
  outcome(): string;                   // 'victory' | 'game_over' | 'playing' ... game's own words
  metrics(): Record<string, number>;   // flat numbers (hp, gold, ...), all must be finite
  fingerprint(): string;               // cheap stable state string, for stall detection
}
export type Policy<S, A> = (obs: S, legal: A[], rng: () => number) => A;   // rng = mulberry32(seed)
export interface Violation { check: string; seed: number; step: number; message: string }
export interface RunResult { seed: number; steps: number; outcome: string; terminal: boolean; violations: Violation[]; metrics: Record<string, number> }
```
- `policies.ts`: `randomPolicy`, `firstLegalPolicy` (what the Dissonance bot does today), `greedyPolicy(score)`, `scriptedPolicy(actions[])` (golden path; fails the run when the script runs out before a terminal state).
- `invariants.ts` (pure): `noThrow`, `finiteMetrics`, `progress` (fingerprint changes within K=25 actions), `noDeadEnd`, `terminalReached` (within maxSteps, default 500), plus per-game extra checks `(adapter) => string | null`.
- `runner.ts` (pure, no DOM): `playRun(adapter, policy, {seed, maxSteps})` and `playMany(adapterFactory, policy, seeds, opts)`; never throws, every failure becomes a `Violation` with seed and step.
- `report.ts` (pure): `summarise(results)` gives outcome counts and rates, run length min/median/p95/max, outliers (length over 3x median), stalls, dead ends; `renderPlaytestReport(game, summary)` gives markdown short enough for a phone; `renderFinding(v, repro)` gives the one-line finding of section f.
- Per game: `ts/src/games/<id>/playtest.ts` default-exports an adapter factory, about 60 lines, wrapping what the headless test already does; one generic test `ts/tests/test_playtest_<id>.ts` per adopted game pins invariants over a fixed seed set. Outcome rates stay in the existing balance tests and the tuning targets (`engine/tuning`): this layer tests that the game CAN be played, not that it is balanced.
- Reuse: `mulberry32` from `engine/shared/seededRandom.ts`. The adapter's `metrics()` is shape-compatible with the tuning spec's `Metrics`, so a later one-liner turns any adapter plus policy into a `GameTuning.simulate` (the sweep tool then reuses these runs; do not build a second sweep). The engine roadmap's replay (E1, `seed + input log`) and golden-master hash reuse `RunResult` and the action log of c3; do not build either here.

### c2. Layer 2 Browser smoke (Playwright, controller-run): `ts/tools/playtest/` and `ts/tools/playtest-smoke.ts`
- Manifest, one entry per demo, pure TS data in `ts/tools/playtest/entries.ts`, type in `manifest.ts`:
```ts
export interface SmokeEntry {
  id: string;
  start: { kind: 'arcade'; gameId: string } | { kind: 'embed'; path: string };   // `/?game=<id>` or `/arcade/<id>/`, add `embed=1` for the cabinet case
  firstMinute: SmokeStep[];     // { do: 'click'|'key'|'wait', target: text or role+name, expect?: visible text }; last step is the first meaningful action
  changeChecks: SmokeStep[][];  // e.g. restart two-step: click 'NEW RUN', expect 'CONFIRM NEW RUN?', click again, expect first screen
  controls: string[];           // visible names of primary controls that must be reachable and >= 44 px at 390
  blocklistExtra?: string[];
}
```
- Runner `ts/tools/playtest-smoke.ts` (plain `playwright` library, NOT `@playwright/test`, no new test runner): `npx vite-node tools/playtest-smoke.ts -- --base http://127.0.0.1:5199 --demos all|id,id --out docs/state`. For each demo at 1280x720 and 390x844 (`isMobile`, `hasTouch`): load time, console errors and warnings (allowlist `favicon.ico`, AudioContext autoplay), failed requests, `scrollWidth` vs viewport, clipped-ancestor check per named control (walk `offsetParent`/`parentElement` chain: an ancestor with `overflow` other than `visible` whose rect does not contain the control rect, or the rect outside the viewport, is `CLIPPED`; this is the systemic_extract class), tap-target size of `controls` (>= 44 px at 390), time to first meaningful action (target <= 60 s; the clock is script time from load to the last `firstMinute` step), stable-named screenshots `docs/state/playtest-<date>/<id>-<w>-<step>.png`, Playwright trace zip kept only for failing demos. Verdict per demo: SAFE, UNSAFE (a hard check failed: console error, failed request, NaN text, clipped control, step missing) or NEEDS-LOOK (soft: time over 60 s, tap target small, warning). Report `docs/state/playtest-<date>.md`, same table as the local safe check so Robert reads the shape he already knows.
- Pure helpers (unit-tested by Devin): `entries` validation, `classifyVerdict`, `isAllowedConsole`, `isClipped(chain, viewport)`, `renderSmokeReport`, `parseArgs`. The Playwright calls are thin glue the controller runs.
- Same runner, two targets: `--base` a local staged build (`local-arcade-preview`, as the local safe check does) or the live site after a deploy (`--readonly`: navigation and clicks only, no form submit, nothing written; clicking the game's own buttons mutates only local state).
- Setup the controller does once: `cd ts && npm install -D playwright` (the npm package is not in `ts/package.json`; Python Playwright >= 1.61 is in `pyproject.toml`, browsers may already be cached, [U] whether versions match). Existing `tests/e2e/*` stay as they are; they are the model for flows, not rewritten.

### c3. Layer 3 Monkey fuzz (real browser): `ts/tools/playtest/monkey.ts` + `ts/tools/playtest-monkey.ts`
- Pure `generateActions(seed, n, viewport, mix)` yields `{ t, kind: 'tap'|'key'|'drag'|'scroll', x?, y?, key? }` from `mulberry32` (mix default 60% tap, 25% key from a game-safe set, 10% drag, 5% scroll; coordinates biased 70% toward visible interactive elements' rects, 30% uniform, so it reaches past the title). Android Monkey's contract: same seed, same sequence.
- Runner plays N seconds (default 60) per demo with a throttle (default 150 ms), writing a JSONL action log `docs/state/playtest-monkey/<id>-<seed>.jsonl` BEFORE each action, so a hang still leaves the repro. `--replay <log>` plays a log back.
- Detectors (pure, unit-tested): `uncaught exception or console.error`, `hang` (no frame via rAF counter for 5 s, or an action promise over 10 s), `crash` (page closed), `blank canvas` (a canvas whose sampled pixels are one colour for 3 consecutive samples after the first action), `NaN or undefined text` (`/\bNaN\b|undefined|\[object Object\]/` in `document.body.innerText`), `stall` (DOM text hash and canvas hash unchanged for 40 actions while buttons exist is a NEEDS-LOOK, not UNSAFE: some screens are idle), long tasks over 50 ms counted, FPS under 20 for 5 s.
- Stops after 10 findings (gremlins' gizmo). Each finding keeps the seed, action index and last 5 actions.

### c4. Layer 4 Visual and first-minute checks: `ts/tools/playtest/firstMinute.ts`
- Screenshot baselines for 3 screens per adopted demo (title, first play, end card), compared with a tolerance. `toHaveScreenshot` belongs to `@playwright/test`, which the plain-library runner does not use, so the comparison would be a pure `compareImages(a, b, maxDiffRatio)` over PNG buffers (a new image-decoding dependency, open question 3; default: skip baselines and keep the screenshots for the human eye until two demos are stable). Baselines are per machine (Playwright's own caveat: fonts and rendering differ by OS), stored under `docs/state/playtest-baselines/` only for the laptop.
- Automated "inviting first minute" checklist from the polish standard, all from one DOM read: a visible title and a Start or Continue affordance on the first screen (no scrolling, in the 390x844 viewport), no dev-speak from `ts/tools/playtest/blocklist.ts` (`localhost`, `TODO`, `lorem`, `undefined`, `NaN`, `[object`, `debug`, `console`, `My Google AI Studio App`, `seed:`), no raw ids in headers (a header text equal to the registry `gameId`, or matching `/^[a-z]+(_[a-z]+)+$/`), a way back visible (shell back button or in-game menu) unless `embed=1`, a first meaningful action within 60 s. Output is checklist rows in the same report; the human judgement ("does it feel inviting") stays Robert's, on the screenshots.

## d. What runs where

| Where | What | Why |
|---|---|---|
| pre-push hook (`scripts/check.ps1`, vitest) | Layer 1 `test_playtest_<id>.ts` only: fixed seeds, small step caps, each file under about 10 s; plus the pure-helper tests of layers 2-4 | fast, deterministic, Devin can run them, no browser |
| local weekly job (laptop scheduled task, CI-free, controller/Claude agent) | Layer 2 against a staged build, Layer 3 for 60 s per demo with a fresh random seed (seed printed), report to `docs/state/playtest-<date>.md` | needs a browser, takes minutes, never in a hook |
| before any publish (controller) | Layer 2 + 4 on the changed demos at 1280 and 390 | replaces the hand-run local safe check |
| post-deploy (controller) | Layer 2 `--readonly` against games.rfditservices.com, SAFE/UNSAFE per demo; pairs with the roadmap's read-only `probe_live.ps1` (404 sweep) | catches a bad deploy within one command |
Nothing here deploys, merges or edits the queue. Never `--no-verify`.

## e. Reports for Robert's phone
One file per run: `docs/state/playtest-<date>.md`. Top: one line, `SAFE 9 | NEEDS-LOOK 2 | UNSAFE 1`. Then only the non-SAFE demos, one block each: verdict, the failing check in a sentence, the screenshot path, the repro command. SAFE demos are a single comma-separated line. Layer 1 writes `docs/state/playtest-bots-<date>.md` the same way (outcome mix and run lengths per game, violations first). The controller pastes the top line plus the non-SAFE blocks into the morning summary.

## f. Failures become fix directives
Every failed check emits one line (pure `renderFinding`), appended to `docs/state/playtest-findings.md`:
`FINDING <game> <layer>/<check> seed=<n|script> step=<k> :: <what failed> :: repro: <exact command>`
for example `FINDING slither_rogue L2/nan-text seed=script step=3 :: HUD shows "Time NaN" at 390 :: repro: cd ts && npx vite-node tools/playtest-smoke.ts -- --base http://127.0.0.1:5199 --demos slither_rogue`, or `... L3/blank-canvas seed=48121 step=212 :: ... :: repro: ... --replay docs/state/playtest-monkey/<id>-48121.jsonl`, or `... L1/stall seed=3 ... :: repro: cd ts && npx vitest run test_playtest_dissonance.ts -t "seed 3"`. Rule (fix-bugs-on-discovery): the controller turns each new finding into a fix directive from the line alone (the line carries game, seed or script, step and the repro command, so the directive's "Why this exists" is pasted evidence, not a description), and a finding is closed when its repro line passes. Later, only if findings pile up: a pure `findingToDirective(finding)` template in `ts/tools/playtest/`.

## g. Migration order and directives

| Order | Directive | Size | Depends on |
|---|---|---|---|
| 1 | `Playtest_Adapter_Contract_Directive`: types, policies, invariants, runner, report, finding line, tests | S/M | none |
| 2 | `Playtest_Adopt_Dissonance_Directive`: wrap the existing bot run (seeds 1-4) | S | 1 |
| 3 | `Playtest_Adopt_Scrapcrawl_Directive`: wrap the 200-run sim (35% / 75% stays in the old test) | S | 1 |
| 4 | `Playtest_Browser_Smoke_Manifest_Directive`: manifest schema, pure helpers, entries for 5 demos, `playtest-smoke.ts` | M | 1 (reuses `formatFinding`); the controller installs `playwright` before the controller run, not before Devin |
| 5 | `Playtest_Monkey_Fuzz_Directive`: action generator, JSONL log, detectors, `playtest-monkey.ts` | M | 1 and 4 (reuses `formatFinding`, `createStallTracker`, `urlFor`, `isAllowedConsole`) |
Then, not written yet: a third adopter (slime_coin or horse_racing, the `call(session, ...)` shape is the same), the Layer 4 first-minute checks (after 4 has run once and its report shape is judged), baselines (only if wanted), weekly scheduled task, `findingToDirective`. Controller after each merge: run the browser tools once and paste the real report into `docs/state/`.

## h. Open questions for Robert (recommended defaults)
1. Runner language: TS (needs `npm install -D playwright`, shares types with the manifest) or Python (`playwright` already a dependency, matches `tests/e2e`)? Default: TS.
2. Weekly Layers 2-3 as a scheduled task on the laptop, or only on demand before a publish? Default: on demand first; schedule after two clean runs.
3. Add `fast-check` and an image-diff dependency? Default: no for now; Layer 1 stays dependency-free and baselines wait.
4. Should NEEDS-LOOK (soft failures) ever block a publish? Default: no, only UNSAFE blocks; Robert reads the rest.

## i. Risks
- Flaky browser checks make Robert stop reading the report: hard checks only on deterministic signals (console error, NaN text, clipped control), everything timing-based is NEEDS-LOOK.
- Monkey on a game with real purchases or external links: allowlist origins, never follow links off the origin, readonly mode on live.
- Bots drift from the real UI (Layer 1 drives Lua, not React): that is exactly why Layer 2 exists; do not try to make Layer 1 click.
