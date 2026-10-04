# Ledger Tier A polish: Restart control, phone-fit intro guide, logic test

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/ledger/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, items A1-A8),
`examples/ledger/src/components/Header.tsx`, `examples/ledger/src/components/GameDialogs.tsx`,
`examples/ledger/src/App.tsx` (lines 610-665 only), `examples/ledger/src/utils.ts`, `examples/ledger/src/types.ts`.

## 1. Why this exists

Ledger is a finished 10-day Dutch-auction appraisal run against compounding debt, live in the arcade as an
`external` embed (`ts/src/games/ledger/config.ts`, `embedUrl: '/arcade/ledger/'`). The 2026-10-03 audit
(`docs/state/demo-audit-batch1-2026-10-03.md`, row `ledger`) found two Tier A failures: no Restart control (A3)
and the intro guide cropped in the 210 px phone frame (A4). The win/lose loop already works and a restart
handler already exists. This run is a Tier A refine pass: expose the existing handler, fix the dialog fit, add one
logic test. Tier B and C are not in this run. Robert's direction for the game is in `docs/demos/ledger/SCOPE.md`
(class: refine, effort S, open question: none).

## 2. Scope

Copied from `docs/demos/ledger/SCOPE.md`.

Top 3 changes, in order:
1. Add a visible Restart/New Run control reachable from start and in-run (handler exists, App.tsx:615).
2. Fix the intro guide at phone width.
3. Add a smoke test (start, end day, defeat, restart).

Out of scope: new goods/categories, more than 10 days, Gemini/AI features (metadata lists a Gemini capability, examples/ledger/metadata.json), save/leaderboard, new art.

Tier A boundary: this run does all three changes at Tier A depth. Change 3 is done as a logic-level vitest file
(see section 3, step 3), because the example app cannot be rendered from the `ts/` vitest run (its `react` and
`lucide-react` imports do not resolve from outside `ts/`; verified). The UI smoke steps (A1-A4 in a browser,
screenshots) need a rebuilt embed and a browser: they are the reviewer's step after Robert rebuilds the embed,
not this run's.

## 3. The work

Note: the files edited below use CRLF line endings in the worktree. Keep them (the Edit tool preserves them); do not convert.

All edits are in the tracked source `examples/ledger/` (21 tracked files; confirmed with `git ls-files`).
`examples/ledger/` has no `node_modules`: you cannot build or run it. Make the edits exactly as specified and verify by
re-reading and by the greps in section 5.

**Step 1: Restart control (change 1).**

1a. Create `<!-- new: examples/ledger/src/components/RestartButton.tsx -->`: a small component, SRP, under 50 lines.
Props: `{ onRestart: () => void }`. Two-step to avoid an accidental click next to End Day: the first click arms it
(label changes from `Restart` to `Confirm?`), the second click within 3 seconds calls `onRestart()` and disarms;
after 3 seconds without a second click it disarms (use `useEffect` with `setTimeout` and clean it up). The button
must have `id="btn-restart-run"`, visible text `Restart` when not armed, and the same Tailwind look as the End Day
button below (`px-2 py-1 text-xs font-mono font-bold border ... rounded uppercase transition-colors shadow-sm`).
Import `React`, `useState`, `useEffect` from `react`. No other dependencies.

1b. Edit `examples/ledger/src/components/Header.tsx` (196 lines; keep it under 600). Add the import
`import { RestartButton } from './RestartButton';` under the existing `formatCurrency` import (line 8). In
`HeaderProps` (current lines 18-20):
```
  onTogglePause: () => void;
  onAdvanceDay: () => void;
  onOpenTutorial: () => void;
```
add `  onRestart: () => void;` after `onOpenTutorial`, and add `onRestart,` to the destructured parameter list after
`onOpenTutorial,` (current line 33). Then render `<RestartButton onRestart={onRestart} />` directly after the
End Day button, i.e. between its closing `</button>` and the `</div>` that closes the time-controls group. Current
lines 122-129:
```
            <button
              onClick={onAdvanceDay}
              className="px-2 py-1 text-xs font-mono font-bold border border-slate-800 hover:bg-slate-800 hover:text-white rounded uppercase transition-colors shadow-sm"
              id="btn-close-day"
            >
              End Day
            </button>
          </div>
```

1c. Edit `examples/ledger/src/App.tsx` (773 lines, already over 600: touch ONE line only). The existing handler is
`const handleRestartRun = () => {` (line 615) and already resets all state. In the `<Header` block (lines 651-662),
current lines 660-661:
```
        onAdvanceDay={handleAdvanceDayEarly}
        onOpenTutorial={() => setShowTutorial(true)}
```
add one line `        onRestart={handleRestartRun}` after the `onOpenTutorial` line. Do not change `handleRestartRun`.

The Restart button lives in the header, which is visible from the first frame of the page; while the intro guide
overlay is open it sits behind the overlay and is reachable the moment the guide is dismissed ("Open Shop & Trade").
Do not add a Restart to the intro guide.

**Step 2: Intro guide fits the phone frame (change 2).**
In `examples/ledger/src/components/GameDialogs.tsx` (385 lines; keep under 600) the shared `Overlay` wrapper is
(current lines 15-21):
```
const Overlay: React.FC<OverlayProps> = ({ children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="w-full max-w-xl bg-white border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
      {children}
    </div>
  </div>
);
```
The cause of the crop is `items-center` on a scrolling flex container: a panel taller than the viewport is clipped
at the top and cannot be scrolled to. Fix with safe centering: on the outer div replace
`flex items-center justify-center p-4 z-50` with `flex justify-center p-2 sm:p-4 z-50`, and on the inner div replace
`my-8` with `my-auto`. Change nothing else in the file. The same wrapper serves all four dialogs, so all benefit.

**Step 3: Logic test (change 3).**
Create `<!-- new: ts/tests/test_ledger_utils.ts -->`. It imports the pure helpers from the example source by relative
path (proven to resolve under vitest, because `examples/ledger/src/utils.ts` imports only `./types`):
```
import { describe, it, expect } from 'vitest';
import { generateInitialMarket, generateLot, generateGood, calculateSellValue, formatCurrency } from '../../examples/ledger/src/utils';
import { Category } from '../../examples/ledger/src/types';
```
Write these tests (name the numbers they check in the test names):
- `formatCurrency(1000)` contains `1,000`.
- `generateInitialMarket()` has exactly `Object.values(Category).length` (5) entries and every entry has `currentPriceMultiplier` > 0.
- `generateLot(1, 1, 'walk_in').type` is `'walk_in'` and `generateLot(1, 1, 'dutch_auction').type` is `'dutch_auction'`.
- `calculateSellValue` on an authentic good (`{ ...generateGood(Category.FINE_ART), authenticity: 'authentic' }`) with
  `generateInitialMarket()[Category.FINE_ART]` returns `isFakeRevealed === false` and `value >= 0`.
- `calculateSellValue` on a counterfeit good (`authenticity: 'counterfeit'`) returns `isFakeRevealed === true` and `value <= 60`.
Do not import `App.tsx` or any component into the test (it will fail to resolve `lucide-react`).

## 4. What NOT to do

- Do not change gameplay, balance, the 10-day length, goods, categories, or the lockout rules.
- Do not touch the Gemini/AI metadata (`examples/ledger/metadata.json`), `examples/ledger/vite.config.ts` or `examples/ledger/package.json`.
- Do not add persistence, save, leaderboard, or new art. Do not add a `build:ledger` script (the SCOPE does not list A7 as a gap for this embed).
- Do not edit `ts/src/games/ledger/config.ts` or the registry; the blurb is outside this run.
- Do not edit any other demo, `examples/` folder, or the live checkout. Do not touch protected repos.
- Do not rebuild or deploy the embed: `/arcade/ledger/` is rebuilt and deployed by Robert, never by this run.
- Do not add new behaviour to `App.tsx` (already over 600 lines): the one line in step 1c only.

## 5. Verification

Python version check (no Python is changed; this is the repo standard):
```
uv run python --version
```
Expected: `Python 3.12.x`.

Test (the single sanctioned compound line, run from the worktree root):
```
cd ts && npx vitest run test_ledger_utils.ts
```
Expected: 1 file, 5 or more tests passed. For reference, the same command form on existing files
(`npx vitest run test_arcade_manifest.ts test_choke_point_ui.ts`) gave: `Test Files  2 passed (2)`, `Tests  6 passed (6)`.

Regression sanity (same form): `cd ts && npx vitest run test_arcade_manifest.ts test_registry_export.ts`
Expected: all passed (the registry is untouched).

Source checks (use the Grep tool, one call each, no shell):
- `btn-restart-run` appears in `examples/ledger/src/components/RestartButton.tsx`.
- `onRestart={handleRestartRun}` appears once in `examples/ledger/src/App.tsx`.
- `my-8` no longer appears in `examples/ledger/src/components/GameDialogs.tsx`; `my-auto` appears once.
- `onRestart` appears in `examples/ledger/src/components/Header.tsx` (props, destructure, render).

Not runnable in this run: building `examples/ledger/` and the browser smoke (A1-A4 screenshots). Say so in the report;
do not try to install anything to make them run.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests).
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write
  why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there.
  Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- New logic goes in small new modules (SRP/KISS): `RestartButton.tsx` is the only new component. `App.tsx` is over 600 lines
  and gets the single line from step 1c; `Header.tsx` and `GameDialogs.tsx` must stay under 600 lines.
- Do not run `agentflow lint` or any agentflow command.
- Free models only where model config is touched; this run touches no model config.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `examples/ledger/src/components/RestartButton.tsx` exists, has `id="btn-restart-run"`, visible text `Restart`, and the two-step confirm.
- [ ] `Header.tsx` takes and renders `onRestart`; `App.tsx` passes `onRestart={handleRestartRun}` (one line added, nothing else changed).
- [ ] `GameDialogs.tsx` `Overlay` uses safe centering (`my-auto`, no `items-center`, no `my-8`).
- [ ] `ts/tests/test_ledger_utils.ts` exists and `cd ts && npx vitest run test_ledger_utils.ts` passes (real tail pasted).
- [ ] No file outside the five named above changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: what changed per file, and whether any quoted line differed from the file. Evidence second: the real tails of
`uv run python --version` and the vitest commands. Then state plainly what was not run (embed build, browser smoke,
screenshots) and that rebuilding and deploying the `/arcade/ledger/` embed is Robert's step. Recommended action per item:
review, then Robert rebuilds the embed and a reviewer runs the A1-A4 browser steps.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding the embed; installing or fetching anything; reading outside the worktree; touching protected repos; editing any `examples/` folder other than `examples/ledger/src/` as listed.

## Required from User

none. Deploying the rebuilt embed is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-ledger-tiera-directive |
| Base branch | - |
| Base commit | 1b42dc63307bfe17c8836e0a4cf9fc830aa14c7e |

**Status log**
- 2026-10-03 23:58 · claude · none → Queued — wave 1 Tier A directive from docs/demos/ledger/SCOPE.md
- 2026-10-04 00:03 · robert-claude-laptop · Queued → Approved — lint override: errors are files the run creates (RestartButton.tsx, test_ledger_utils.ts), marked with new-file markers; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 03:55 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-ledger-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 03:56 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-ledger-tiera-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
