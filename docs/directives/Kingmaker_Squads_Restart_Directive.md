# Kingmaker Squads: in-frame Restart / New Campaign control with two-step confirm

## Read first

`docs/demos/kingmaker_squads/SCOPE.md`, `docs/directives/Polish_Kingmaker_Squads_TierA_Directive.md`,
`docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, item A3),
`examples/kingmaker-squads/src/App.tsx` (lines 61-78 and 214-227 only),
`examples/kingmaker-squads/src/components/HeaderBar.tsx` (lines 1-10 and 195-222 only),
`examples/kingmaker-squads/src/screens/NewGameScreen.tsx`,
`ts/src/games/gladiator_arena/utils/useArmedConfirm.ts` (the pattern to mirror),
`ts/tests/test_ledger_utils.ts` (the shape of a pure-helper test on an example folder),
`ts/src/games/kingmaker_squads/README.md` (lines 17-30 only).
Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

Kingmaker Squads is a preserved Origin project (registry status `external`). The Tier A directive
(`docs/directives/Polish_Kingmaker_Squads_TierA_Directive.md`, Done) recorded "start-screen Restart is blocked on
intake". Robert approved the intake (2026-10-04): `examples/kingmaker-squads/` is now tracked (force-added past
`.gitignore` line 193 `examples/*`), so this run can edit it. Polish standard A3 wants a visible Restart / New Game
control that works in the frame, with the same two-step confirm the other demos use (first click arms, second click
confirms, the arm lapses after 3 s).

Current behaviour, quoted:

1. The in-game Restart is an unlabelled icon-only button that fires immediately and does NOT reset anything; it just
   shows the start screen (`examples/kingmaker-squads/src/components/HeaderBar.tsx`, lines 212-218):

```tsx
        <button
          onClick={onRestartGame}
          className="p-2 rounded-md bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 transition"
          title="Restart Campaign"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
```

   wired in `examples/kingmaker-squads/src/App.tsx` line 226:

```tsx
        onRestartGame={() => setShowNewGameScreen(true)}
```

2. On the start screen the "New Campaign" button (shown when a save exists) wipes the save in one click
   (`examples/kingmaker-squads/src/screens/NewGameScreen.tsx`, lines 49-56):

```tsx
          <button
            onClick={onNewGame}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition duration-200 ${
              hasSaveData
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/10'
            }`}
          >
```

3. `ts/src/games/kingmaker_squads/README.md` lines 17-22 still say the folder is NOT tracked, and lines 24-30 still
   say the Restart is BLOCKED on intake. Both are stale after the intake commit.

The existing pattern to mirror, `ts/src/games/gladiator_arena/utils/useArmedConfirm.ts`: a hook returning
`{ armed, trigger }` with a 3000 ms disarm timer. Do not import it (the example is a separate Vite app and must not
reach into `ts/`); write the example's own small version.

## 2. Scope

In scope, exactly these files:

- <!-- new: examples/kingmaker-squads/src/utils/armedConfirm.ts --> `examples/kingmaker-squads/src/utils/armedConfirm.ts`
- <!-- new: examples/kingmaker-squads/src/hooks/useArmedConfirm.ts --> `examples/kingmaker-squads/src/hooks/useArmedConfirm.ts`
- <!-- new: examples/kingmaker-squads/src/components/RestartButton.tsx --> `examples/kingmaker-squads/src/components/RestartButton.tsx`
- <!-- new: ts/tests/test_kingmaker_armed_confirm.ts --> `ts/tests/test_kingmaker_armed_confirm.ts`
- `examples/kingmaker-squads/src/components/HeaderBar.tsx` (replace the button, add one import)
- `examples/kingmaker-squads/src/App.tsx` (one new handler, one changed prop)
- `examples/kingmaker-squads/src/screens/NewGameScreen.tsx` (arm the New Campaign button when a save exists)
- `ts/src/games/kingmaker_squads/README.md` (two paragraphs)

Out of scope: gameplay, balance, art, any other screen, `vite.config.ts` (the missing `base` is a known rebuild risk,
leave it), `package.json`, lockfiles, `.gitignore`, `intake/`, `ts/src/games/kingmaker_squads/config.ts`,
`ts/src/games/registry.ts`, any other demo, and the Victory/Game Over "Start New Campaign" buttons (nothing to lose
there, they stay one-click).

## 3. The work

1. <!-- new: examples/kingmaker-squads/src/utils/armedConfirm.ts --> Create `examples/kingmaker-squads/src/utils/armedConfirm.ts`,
   pure, no React import, no side effects:

```ts
// new: examples/kingmaker-squads/src/utils/armedConfirm.ts
export const ARM_WINDOW_MS = 3000;

export interface ArmedStep {
  armed: boolean;
  confirmed: boolean;
}

/** One press: disarmed -> armed (not confirmed); armed -> disarmed and confirmed. */
export function pressArmed(armed: boolean): ArmedStep {
  return armed ? { armed: false, confirmed: true } : { armed: true, confirmed: false };
}

export function armedLabel(armed: boolean, idle: string, confirm: string): string {
  return armed ? confirm : idle;
}
```

2. <!-- new: examples/kingmaker-squads/src/hooks/useArmedConfirm.ts --> Create `examples/kingmaker-squads/src/hooks/useArmedConfirm.ts`:
   a hook `useArmedConfirm(onConfirm: () => void, ms = ARM_WINDOW_MS)` returning `{ armed, trigger }`. It uses
   `pressArmed` for the transition, starts a `setTimeout` of `ms` that sets `armed` back to false when it arms, clears
   any timer on every press and on unmount, and keeps `onConfirm` in a ref (mirror the structure of
   `ts/src/games/gladiator_arena/utils/useArmedConfirm.ts`, same behaviour). First line of the file:
   `// new: examples/kingmaker-squads/src/hooks/useArmedConfirm.ts`. No `localStorage`, no network.
3. <!-- new: examples/kingmaker-squads/src/components/RestartButton.tsx --> Create `examples/kingmaker-squads/src/components/RestartButton.tsx`:
   `export function RestartButton({ onConfirm }: { onConfirm: () => void })`. Uses `useArmedConfirm(onConfirm)`,
   renders one visible text button (icon plus words, not icon-only): idle label "Restart", armed label
   "Confirm restart?" via `armedLabel`. Keep the existing look: idle classes
   `bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800`, armed classes
   `bg-rose-950/60 text-rose-200 border border-rose-500/60`, both with `flex items-center gap-1.5 px-2.5 py-1.5
   rounded-md text-xs font-medium transition`. Set `title="Restart Campaign"` and `aria-label` to the current label.
   Use `RotateCcw` from `lucide-react` (already imported by HeaderBar, so it resolves in the example's own build).
   First line: `// new: examples/kingmaker-squads/src/components/RestartButton.tsx`.
4. `examples/kingmaker-squads/src/components/HeaderBar.tsx`: replace the whole `<button ...> ... </button>` quoted in
   section 1 item 1 (lines 212-218) with `<RestartButton onConfirm={onRestartGame} />`, add
   `import { RestartButton } from './RestartButton';` after line 6 (`import { ChessIcon } from './ChessIcon';`), and drop
   `RotateCcw` from the lucide import on line 8 only if nothing else in the file uses it (check with Grep first;
   if used elsewhere leave the import alone).
5. `examples/kingmaker-squads/src/App.tsx`: after `handleContinueCampaign` (ends line 78 with `  };`) add

```tsx
  const handleRestartCampaign = () => {
    setGameState(createInitialGameState());
    setShowNewGameScreen(true);
  };
```

   (`createInitialGameState` is a function declaration later in the component and is already called from
   `handleStartNewCampaign` the same way.) Change line 226 to `onRestartGame={handleRestartCampaign}`. Result: the
   confirmed restart really resets the campaign and returns to the start screen, so "Continue Campaign" then loads
   the fresh state instead of the abandoned one.
6. `examples/kingmaker-squads/src/screens/NewGameScreen.tsx`: add `import { useArmedConfirm } from '../hooks/useArmedConfirm';`
   and `import { armedLabel } from '../utils/armedConfirm';`; at the top of `NewGameScreen` (before `return`) add
   `const armedNew = useArmedConfirm(onNewGame);`. On the New Campaign button change `onClick={onNewGame}` to
   `onClick={hasSaveData ? armedNew.trigger : onNewGame}` (no save means nothing to lose, so "Start New Campaign"
   stays one-click). In the `hasSaveData` branch, replace the text `New Campaign` with
   `{armedLabel(armedNew.armed, 'New Campaign', 'Confirm new campaign?')}`. Keep the "Start New Campaign" branch and
   all classes as they are.
7. <!-- new: ts/tests/test_kingmaker_armed_confirm.ts --> Create `ts/tests/test_kingmaker_armed_confirm.ts`. The example app cannot be rendered under
   `ts/` vitest (it imports `lucide-react` and Tailwind classes that do not resolve there), so test the pure helper
   only, like `ts/tests/test_ledger_utils.ts`. Header:

```ts
// @vitest-environment node
// new: ts/tests/test_kingmaker_armed_confirm.ts
import { describe, it, expect } from 'vitest';
import { ARM_WINDOW_MS, pressArmed, armedLabel } from '../../examples/kingmaker-squads/src/utils/armedConfirm';
```

   Tests (describe name `test_kingmaker_armed_confirm`): `ARM_WINDOW_MS` is 3000; `pressArmed(false)` equals
   `{ armed: true, confirmed: false }`; `pressArmed(true)` equals `{ armed: false, confirmed: true }`; two presses in a
   row from disarmed end confirmed; `armedLabel(false, 'Restart', 'Confirm restart?')` is `'Restart'` and
   `armedLabel(true, ...)` is `'Confirm restart?'`.
8. `ts/src/games/kingmaker_squads/README.md`: replace the paragraph on lines 17-22 (starts `**Where the game source
   lives:**`) with:

```
**Where the game source lives:** `examples/kingmaker-squads/` (50+ source
files: combat engine, city generation, AI opponent, tests). It is tracked
(force-added past `.gitignore` line 193 `examples/*`, intake 2026-10-04), so
a fresh clone or worktree sees it. Known rebuild risk from intake 0.1.0R1:
`vite.config.ts` lacks `base`, so assets 404 under `/arcade/kingmaker_squads/`
if rebuilt as is.
```

   and the paragraph on lines 24-30 (starts `**Polish standard, item A3 (Start and Restart):**`) with:

```
**Polish standard, item A3 (Start and Restart):** the embedded game opens on
a start screen whose in-frame control is "Start New Campaign" (or "New
Campaign" when a save exists, which asks for a second click to confirm). Once
a campaign is running the header shows a labelled "Restart" button: first
click arms it ("Confirm restart?"), second click resets the campaign and
returns to the start screen, and the arm lapses after 3 seconds. Rebuilding
and redeploying the embed is the owner's step.
```

## 4. What NOT to do

- Do not run `npm install`, `bun install` or any install; `examples/kingmaker-squads/` has no `node_modules` and
  installs are banned, so the example's own build and tests are NOT run by this run.
- Do not rebuild or deploy the embed (`/arcade/kingmaker_squads/` or `dist*`): that is Robert's step.
- Do not touch gameplay, `vite.config.ts`, `package.json`, lockfiles, `.gitignore`, `intake/`, `config.ts`,
  `registry.ts` or any other demo.
- No new network, `eval`, `new Function`, `<script>`, cookie, `window.open` or storage use (the existing
  `localStorage` use in `App.tsx` lines 34, 66 and 81 stays exactly as it is).
- Do not import anything from `ts/` into the example, or from the example into `ts/src/`; the only cross-reference is
  the new test importing the pure helper.
- Do not add or remove comments in existing code except where this directive says so.

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_kingmaker_armed_confirm.ts
cd ts && npx vitest run test_ledger_utils.ts
```

References when this directive was written (against the intake commit): `uv run python --version` gave
`Python 3.12.12`; `cd ts && npx vitest run test_ledger_utils.ts` gave `Test Files  1 passed (1)` and
`Tests  5 passed (5)`. The new test should give `Test Files  1 passed (1)` with your test count. The
`cd ts && npx vitest run <bare-filename>.ts` form is the only form that finds tests here; a path starting `ts/tests/` finds none.
Use Grep to confirm after your edits: `onRestartGame={handleRestartCampaign}` in `App.tsx`,
`<RestartButton onConfirm={onRestartGame} />` in `HeaderBar.tsx`, and no remaining `title="Restart Campaign"` in
`HeaderBar.tsx`. The example's own `npm run lint` / `vitest` / build are not run (no `node_modules`, installs banned);
say so in the report. A failure that also fails on a clean main is pre-existing: record it, do not fix it.

Reviewer-side (not this run): rebuild the embed, then A3 in the browser at `/games/kingmaker_squads/`: header
"Restart" arms on first click, resets on second, lapses after 3 s; start screen with a save shows the armed
"New Campaign".

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry another way
  around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects (the one allowed exception is
  the fixed `cd ts && npx vitest run ...` lines in section 5). Do not use `ls`, `Get-ChildItem` or `cat`: use Read,
  Glob and Grep. No live process probing.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not hunt: everything you need is
  quoted in this directive; if a quoted line or a cited path is not where it says, STOP and write why in the Status row.
- Work only on branch `directive/rfdgamestudio-kingmaker-squads-restart-directive`. Never commit to main, never push,
  never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with `<!-- new: path -->` in your report and with a `// new: path` header comment in the
  file (already specified above).
- The run does not run `agentflow lint` or any other `agentflow` CLI, and does NOT run
  `uv run python -m studio.demos index`.
- No new network/eval/script/cookie/storage use. New logic goes in small new modules (one job per file); no file
  over 600 lines (`HeaderBar.tsx` is 222, `App.tsx` 334, `NewGameScreen.tsx` 78: edit in place).
- Free models only wherever any model configuration is touched (none is expected).
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`; run git with the worktree as the working directory.
- Done means (the Status row): you stopped at `Review` after committing on the directive branch, with one line in the
  log giving the new test's pass count. You do not mark Done and you do not merge.

## 7. Completion criteria

- [ ] The three new example files exist as specified (`armedConfirm.ts` pure, hook, `RestartButton.tsx`), each with
      its `// new:` header.
- [ ] `HeaderBar.tsx` renders `<RestartButton onConfirm={onRestartGame} />` instead of the icon-only button; `App.tsx`
      passes `handleRestartCampaign`, which resets state and shows the start screen; `NewGameScreen.tsx` arms the
      "New Campaign" button only when `hasSaveData`.
- [ ] `ts/tests/test_kingmaker_armed_confirm.ts` passes and `test_ledger_utils.ts` still gives 5 passed.
- [ ] The README paragraphs match section 3 item 8 (no "NOT tracked", no "BLOCKED on intake").
- [ ] `git status` shows only the files listed in section 2; nothing outside them changed.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass count.

## 8. Report

Findings first: what changed per file, and whether any quoted line differed from the file. Evidence second: the real
tails of the three commands in section 5. Then state plainly what was not run (the example's own lint, tests and
build, browser smoke) and that nothing was deployed. Recommended action: review, then Robert rebuilds and redeploys
the embed (also needs the `vite.config.ts` `base` fix noted in the README, a separate item) and a reviewer runs the A3
browser steps.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding the embed; installing or fetching anything;
  reading outside the worktree; touching protected repos; editing `.gitignore`, `vite.config.ts`, `package.json`,
  lockfiles, `intake/` or any `dist`/`dist-*` directory; changing gameplay, rules, balance or art; touching any demo
  other than `examples/kingmaker-squads/`.

## Required from User

none. Rebuilding the embed and deploying it to games.rfditservices.com is Robert's separate step after review and
merge; it is not part of this run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-kingmaker-squads-restart-directive |
| Base branch | - |
| Base commit | 3fba11421b20e2979ed5c01d0d7b67f78d20b445 |
| Head commit | 8db5a24114d8caa46679bd85248f322b811cb4d6 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 · robert-claude-laptop · none → Queued — add in-frame Restart / New Campaign two-step confirm to examples/kingmaker-squads (tracked by the intake commit on PR intake/kingmaker-squads); pure helper test only; embed rebuild and deploy are Robert's
- 2026-10-04 08:39 · robert-claude-laptop · Queued → Approved — lint override: any errors are files the run creates (armedConfirm.ts, useArmedConfirm.ts, RestartButton.tsx, test_kingmaker_armed_confirm.ts), marked new, and the intake files now on main; author's dispatch lint (with the intake merged) gave 0 errors
- 2026-10-04 12:04 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-kingmaker-squads-restart-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 12:05 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-kingmaker-squads-restart-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-04 12:16 · devin · In progress → Review — test_kingmaker_armed_confirm.ts: 6 passed; test_ledger_utils.ts: 5 passed. Committed 8db5a241 on directive branch. Example's own lint/tests/build not run (no node_modules, installs banned); nothing deployed. [origin] spent: devin 9 min est. n/a
<!-- queue:end -->
