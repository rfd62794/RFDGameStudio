# Gladiator Arena Tier A: New Game control, build script, phone fit, headless career test

## Read first

`docs/demos/gladiator_arena/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, A1-A8),
`ts/src/games/gladiator_arena/App.tsx` (lines 45-70, 90-125, 170-196 and 240-285), `ts/src/games/gladiator_arena/context/GameContext.tsx`
(lines 403-415), `ts/src/games/gladiator_arena/simulation/balanceHarness.ts` (lines 392-450 and the export at line 434),
`ts/package.json` (lines 6-20), `ts/vite.planetofgreed.config.ts`, `ts/src/standalone/planetofgreed/entry.tsx`,
`ts/src/standalone/planetofgreed/index.html`, `ts/tests/test_dual_target_deploy.ts` (lines 118-155, the pattern for
asserting a build script). Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

Gladiator Arena is a `dev` demo with a real economy, ladder and combat engine; for Tier A it fails three baseline
items found by the 2026-10-03 audit (`docs/state/demo-audit-batch1-2026-10-03.md`, gladiator_arena row) and the scope
analysis: no Restart / New Game at the start screen and only a hidden icon reset in play (A3), a phone tab bar that scrolls
inside a 210 px frame (A4), no `build:gladiator_arena` script (A7). Its one test file only asserts source text, so A6
("at least one test file for the demo's logic") is met only nominally.

Current code, quoted from `ts/src/games/gladiator_arena/App.tsx`. Title menu (lines 109-121):

```tsx
          menuItems={[
            {
              id: 'ga-enter-arena',
              label: hasSave ? 'Return to the Stable' : 'Enter the Arena',
              icon: <Swords className="w-4 h-4" />,
              variant: 'primary',
              onClick: handleEnterArena,
            },
            {
              id: 'ga-primer',
              label: "Manager's Primer",
              icon: <ScrollText className="w-4 h-4" />,
              variant: 'secondary',
              onClick: handleShowPrimer,
            },
          ]}
```

the entry handler (lines 70-73) and the existing 2-click reset in the desktop-only status area (lines 244-270):

```tsx
  const handleEnterArena = () => {
    setShowTitleScreen(false);
    if (!hasSave) triggerPrimer();
  };
```
```tsx
        statusArea={
          <div className="hidden md:flex items-center gap-3">
          ...
            <button
              id="reset-game-btn"
              onClick={() => {
                if (showResetConfirm) {
                  resetGame();
                  setShowResetConfirm(false);
                } else {
                  setShowResetConfirm(true);
                  setTimeout(() => setShowResetConfirm(false), 3000);
                }
              }}
              title="Reset Game State"
```

so the in-game reset is an icon inside `hidden md:flex`: it does not exist at phone width. `resetGame` (from
`useGame()`, `GameContext.tsx` line 403) clears the save and resets gold, roster, tier and record in place, no reload.

Phone header (lines 181-184), whose `nav` has no width limit:

```tsx
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-lg ... shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <nav className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 text-sm font-medium overflow-x-auto">
```
and each tab is `<button id="tab-<name>-btn" ... className={tabCls(...)}><Icon className="w-4 h-4" /><span>Label</span></button>`
with `tabCls` giving `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap`.

`ts/package.json` lines 9-10 (the existing `build:` script format to follow):

```json
    "build:dissonance": "vite build --config vite.dissonance.config.ts",
    "build:shoal": "vite build --config vite.shoal.config.ts",
```

`ts/vite.planetofgreed.config.ts` (whole file) is the template for a TS-native standalone with no Lua:

```ts
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig('planetofgreed');
```

`ts/src/standalone/planetofgreed/index.html` is the template for the page (title `Planet of Greed`, a `<div id="root">`
and one module script tag whose src is the entry file in the same folder), and `ts/src/standalone/planetofgreed/entry.tsx` (whole file) is the
template for the entry: it renders `App` with a minimal `GameSession` (`gameId`, `files: { gameId, data: {}, ui: {},
logic: '', engineSource: '' }`, `executor: { call: () => [] }`). Gladiator Arena's `App` is also self-contained: it ends with
`void session; // destructured per contract; game is self-contained` (`App.tsx` line 323). `STANDALONE_BUILD_GAMES` in
`ts/src/games/registry.ts` already lists `{ id: 'gladiator_arena', label: 'Gladiator Arena' }`.

Harness for the headless test, `ts/src/games/gladiator_arena/simulation/balanceHarness.ts` line 434:

```ts
export function runCareerProgressionSimulation(
  careersCount = 40,
  playerPersonality: Gladiator['personality'] = 'brawler'
): CareerProgressionReport {
```
whose `CareerProgressionReport` has `careersSimulated`, `completionRatePercent`, `tierClearRates: Record<number, number>`,
`avgGoldEarned`, `medianBoutsToClear` and `balanceDiagnostic.status`.

## 2. Scope

Copied from `docs/demos/gladiator_arena/SCOPE.md`.

Top 3 changes, in order: 1. Tier A: Restart/New Game on title, `build:gladiator_arena`, phone tab-bar fit. 2. Headless vitest bout/ladder run (no softlock, no negative gold, tier 5 reachable) using the existing balanceHarness. 3. Clear feedback and win/loss next action in ArenaCombatView (B3, B6; not read in depth).

Out of scope: new parts/tiers, new combat rules, art overhaul, multiplayer, itch/devlog.

This directive targets Tier A. It executes change 1 (A3, A4, A7) and change 2, because the headless test is what makes
A6 real for this demo. Change 3 is Tier B and waits for a later directive: do not start it, do not edit
`ArenaCombatView.tsx` or `BalanceReportView.tsx`.

## 3. The work

1. NEW `ts/src/games/gladiator_arena/utils/useArmedConfirm.ts` <!-- new: ts/src/games/gladiator_arena/utils/useArmedConfirm.ts -->:
   a hook `useArmedConfirm(onConfirm, ms = 3000)` returning `{ armed, trigger }`: the first `trigger()` sets `armed`,
   auto-disarms after `ms` (timer cleared on unmount), the second `trigger()` while armed calls `onConfirm` and disarms.
2. NEW `ts/src/games/gladiator_arena/components/NewGameButton.tsx` <!-- new: ts/src/games/gladiator_arena/components/NewGameButton.tsx -->:
   `NewGameButton({ onConfirm })` using the hook; visible text "New Game" (armed: "Confirm: wipe stable?"),
   `id="ga-new-game-btn"`, a plain `<button>` styled like the existing reset button (`bg-stone-800`, `text-stone-300`,
   armed `bg-red-600 text-white font-bold`), always visible (no `hidden` / `md:` gate). `App.tsx` places it in the
   phone gold-counter row (the `md:hidden` block that renders `{gold}g`) and, for desktop, beside the existing reset
   icon; do not remove the existing `reset-game-btn`.
3. `ts/src/games/gladiator_arena/App.tsx` title: add a third `menuItems` entry `id: 'ga-new-game'`, label `New Game`,
   `variant: 'secondary'`, only when `hasSave`; its `onClick` uses `useArmedConfirm` (label becomes `Confirm: wipe stable?`
   while armed) and on confirm calls `resetGame()`, then `setShowTitleScreen(false)` and `triggerPrimer()`. Keep
   `ga-enter-arena` and `ga-primer` unchanged.
4. Phone tab-bar fit, `App.tsx` only (do NOT edit the shared `GameShell`): give the `nav` `min-w-0 max-w-full`, and give each
   tab's label `<span>` the classes `hidden sm:inline` while adding `aria-label` and `title` with the label text to each
   tab button, so six tabs fit at 390 px as icons (the Frames count stays visible via `Frames ({roster.length})` on
   `sm` and up; on phone keep `roster.length` as a small badge next to the icon). `overflow-x-auto` stays as a fallback.
5. A7: NEW `ts/vite.gladiator_arena.config.ts` <!-- new: ts/vite.gladiator_arena.config.ts --> (same two lines as the
   planetofgreed config, id `gladiator_arena`), NEW `ts/src/standalone/gladiator_arena/index.html`
   <!-- new: ts/src/standalone/gladiator_arena/index.html --> and NEW `ts/src/standalone/gladiator_arena/entry.tsx`
   <!-- new: ts/src/standalone/gladiator_arena/entry.tsx --> (planetofgreed templates with ids and the title `Gladiator
   Arena`; import `App` from `../../games/gladiator_arena/App`), and one line in `ts/package.json` placed after the
   `build:planetofgreed` line: `"build:gladiator_arena": "vite build --config vite.gladiator_arena.config.ts",`. Do not
   run the build (see Verification).
6. NEW `ts/tests/test_gladiator_arena_tier_a.ts` <!-- new: ts/tests/test_gladiator_arena_tier_a.ts -->:
   - build wiring, same style as `test_dual_target_deploy.ts` lines 128-155: `package.json` contains `build:gladiator_arena`
     and `vite.gladiator_arena.config.ts`; the config contains `makeStandaloneConfig('gladiator_arena')`; the entry
     imports `../../games/gladiator_arena/App`; the html has `<div id="root">`.
   - source text: `App.tsx` contains `ga-new-game`, `NewGameButton`, `useArmedConfirm` and `sm:inline`.
   - logic, using the real harness: `runCareerProgressionSimulation(5)` returns `careersSimulated === 5`, every of
     `avgGoldEarned`, `completionRatePercent`, `medianBoutsToClear` is finite and `>= 0`, and `tierClearRates[1]` is
     finite and `>= 0`; and `runBalanceSimulation({ boutsPerOpponent: 3, shopSamplesPerTier: 5 })` returns without
     throwing and its numeric fields are not NaN. Name the numbers checked in the test titles. The harness uses
     randomness: assert only invariants that hold for any seed (finite, non-negative, counts match). If you cannot
     make "tier 5 reachable" a stable assertion, leave it out and say so in the report; do not weaken or skip a test
     to get green.

## 4. What NOT to do

- Do not change combat rules, parts, tiers, balance constants, the ladder, the forge economy, art, or any file under
  `ts/src/games/gladiator_arena/simulation/` (the test only calls the harness).
- Do not edit `ArenaCombatView.tsx`, `BalanceReportView.tsx` (Tier B, not read in full), or the shared `GameShell`.
- Do not run `npm run build:gladiator_arena` or any build, do not create `dist-gladiator_arena`, do not deploy.
- Do not add itch or devlog work. Do not change the registry status or `ts/src/games/gladiator_arena/config.ts`.
- Do not remove the existing 2-click `reset-game-btn`. Keep touched files under 600 lines (App.tsx is 329 now).
- No new dependencies.

## 5. Verification

Run each as its own tool call, from the worktree root, and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_gladiator_arena_tier_a.ts test_gladiator_shell_opening.ts
```

`cd ts && npm run build:gladiator_arena` (A7), the full suite (`cd ts && npm test`) and the A1-A4 browser smoke with
390x844 screenshots are the reviewer's step after Review (the rules allow only the one `cd ts &&` line). The new test
asserts the build wiring statically so the reviewer's build run is the only thing left to prove.

Reference, run on main (f3208bc1) when this directive was written: `uv run python --version` gave
`Python 3.12.12`. The same form on main with `test_gladiator_shell_opening.ts` gave `Test Files  1 passed (1)` and
`Tests  20 passed (20)`.
The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; full-path filters such as `ts/tests/<name>.ts`
find none. Record any failure that also fails on a clean main as pre-existing, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry another
  way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&` or `||` chains, no pipes, no redirects. The one allowed
  exception is the fixed verification line `cd ts && npx vitest run test_gladiator_arena_tier_a.ts test_gladiator_shell_opening.ts`. Do not use `ls`, `Get-ChildItem` or `cat`: use
  Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not search or hunt for files
  that are not named in this directive: every path you need is quoted above. If something named here is
  missing or different from the quote, STOP and write exactly what is missing in the Status row.
- Work only on branch `directive/rfdgamestudio-polish-gladiator-arena-tiera-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with a `<!-- new: ... -->` marker in your report, and a `// new:` header comment in new code files.
- New logic goes in the small new modules named in The work (SOLID/SRP/KISS). Keep every file you touch under
  600 lines where it already is; where a file is already over 600 lines, its net line count must not grow by more
  than 10.
- Free models only wherever any model config is touched (none is expected in this directive).
- Do not run `agentflow lint` or any other `agentflow` CLI. Never use `git -C`, `git -c`, `git --git-dir` or
  `git --work-tree`.
- Update this directive's Status row when you finish or stop partway. Done for the Status row means: the files in
  The work are changed or created, the verification commands in section 5 were run and their real tails are in
  the report, and the work is committed on the directive branch (not pushed). Move the row to `Review`, never to
  Done.

## 7. Completion criteria

Done means all of: (a) the title offers "New Game" when a save exists, and a visible always-on "New Game" control with
2-click confirm exists in play at every width; (b) the tab bar is structured to fit 390 px (labels hidden below `sm`,
labelled for accessibility); (c) `build:gladiator_arena` plus its config and standalone entry exist and are asserted by the
new test; (d) the headless career test passes with real harness calls; (e) the verification line passes and
`test_gladiator_shell_opening.ts` is unchanged and green; (f) the work is committed on the directive branch, not pushed.
Status row: `Review`, with one line giving the pass counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: what changed, in which files. Then evidence: the real output tails of the commands in section 5.
Then one recommended action per open item. List every created file with a `<!-- new: ... -->` marker. State that
nothing was deployed and that nothing was pushed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching the site repo; touching protected repos
  (TeleseroAdminSuite2026, DialerListPulse); editing `.gitignore`, `examples/` (unless this directive names a
  file there), any `dist` or `dist-*` directory, or any other demo's files; installing or fetching anything.

## Required from User

none for the run. After Review and merge, Robert's separate steps: run `npm run build:gladiator_arena` if the reviewer has not, then deploy.
A standalone the `dist-gladiator_arena` build folder under ts changes what the deploy copies for this game, so the deploy is his call. Deploying
is not part of this run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-gladiator-arena-tiera-directive |
| Base branch | - |

**Status log**
- 2026-10-03 · robert-claude-laptop · none → Queued — demo polish wave 1, Tier A only; Scope and Out of scope copied from the demo's SCOPE.md
- 2026-10-04 00:01 · robert-claude-laptop · Queued → Approved — lint override: all 6 errors are files the run creates (useArmedConfirm.ts, NewGameButton.tsx, vite.gladiator_arena.config.ts, standalone index.html and entry.tsx, test_gladiator_arena_tier_a.ts), each marked with a new-file marker; the author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
<!-- queue:end -->
