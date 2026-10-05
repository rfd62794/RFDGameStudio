# Succession: Restart and Back to title during a run (Size S)

**Depends on:** none (the earlier Revamp directive is already merged). **Why Succession:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `succession` (Replan item 1).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/succession/DIRECTION.md` (Replan 1), `ts/src/games/succession/App.tsx` (whole file, 259 lines), `ts/src/games/dissonance/components/AbandonRunButton.tsx` (the two-click pattern this copies), `ts/src/components/GameShell.tsx` (the `headerExtra` prop).

## 1. Why this exists

An eight-segment run of Succession has no way out. "Play Again" appears only on the verdict screen (`App.tsx` `handlePlayAgain`, passed to `VerdictScreen`); in play, the only header control is the shell's back-to-arcade link, so a player who wants to start over, or pick a different origin, must close the tab.
`docs/demos/succession/DIRECTION.md` calls this the biggest turn-off. Dissonance already solved the same problem with a two-click "Abandon run" button (`ts/src/games/dissonance/components/AbandonRunButton.tsx`); this run gives Succession the same safety: two-click so a stray tap cannot throw a run away.

## 2. Scope

1. New component `<!-- new: ts/src/games/succession/components/ConfirmButton.tsx -->`: a generic two-click button.
2. New component `<!-- new: ts/src/games/succession/components/RunControls.tsx -->`: "Restart run" and "Back to title", both two-click.
3. `ts/src/games/succession/App.tsx`: import `RunControls`, add `handleRestartRun` and `handleBackToTitle`, pass `headerExtra` to the in-play `GameShell` only.
4. New test `<!-- new: ts/tests/test_succession_run_controls.tsx -->`.

## 3. The work

**Step 1: create `ts/src/games/succession/components/ConfirmButton.tsx`:**

```tsx
// new: ts/src/games/succession/components/ConfirmButton.tsx
import { useEffect, useState } from 'react';
import { Button } from '../../../ui/components';

interface ConfirmButtonProps {
  id: string;
  label: string;
  /** Shown after the first click; a second click within 3 seconds confirms. */
  confirmLabel: string;
  onConfirm: () => void;
}

/** Two-click button: the first click arms it, the second confirms, and it disarms itself after 3 seconds. */
export default function ConfirmButton({ id, label, confirmLabel, onConfirm }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  const handleClick = () => {
    if (armed) {
      setArmed(false);
      onConfirm();
    } else {
      setArmed(true);
    }
  };

  return (
    <Button
      id={id}
      label={armed ? confirmLabel : label}
      onClick={handleClick}
      variant={armed ? 'danger' : 'neutral'}
      size="sm"
    />
  );
}
```

**Step 2: create `ts/src/games/succession/components/RunControls.tsx`:**

```tsx
// new: ts/src/games/succession/components/RunControls.tsx
import ConfirmButton from './ConfirmButton';

interface RunControlsProps {
  onRestart: () => void;
  onBackToTitle: () => void;
}

/** In-play controls: start the same origin again, or leave the run for the title screen. */
export default function RunControls({ onRestart, onBackToTitle }: RunControlsProps) {
  return (
    <>
      <ConfirmButton
        id="succession-restart-run"
        label="Restart run"
        confirmLabel="Restart this run?"
        onConfirm={onRestart}
      />
      <ConfirmButton
        id="succession-back-to-title"
        label="Back to title"
        confirmLabel="Leave this run?"
        onConfirm={onBackToTitle}
      />
    </>
  );
}
```

**Step 3: edit `ts/src/games/succession/App.tsx`** (CRLF; the Edit tool keeps it). Apply exactly this diff and nothing else. `handleRestartRun` reuses the existing `handlePlayAgain` (same origin, fresh run):

```diff
diff --git a/ts/src/games/succession/App.tsx b/ts/src/games/succession/App.tsx
index adced5ba..17f72d8a 100644
--- a/ts/src/games/succession/App.tsx
+++ b/ts/src/games/succession/App.tsx
@@ -24,2 +24,3 @@ import { OnboardingTip } from './components/OnboardingTip';
 import CourtPrimer from './components/CourtPrimer';
+import RunControls from './components/RunControls';
 import { ONBOARDING_TIPS, OnboardingTipId } from './content/onboardingTips';
@@ -116,2 +117,14 @@ export default function App({ session }: GameRendererProps) {
 
+  const handleRestartRun = () => {
+    setActiveTip(null);
+    handlePlayAgain();
+  };
+
+  const handleBackToTitle = () => {
+    setActiveTip(null);
+    setGameState(null);
+    setPlayStage('chamber');
+    setView('title');
+  };
+
   const handleProceedFromInterlude = () => {
@@ -200,2 +213,3 @@ export default function App({ session }: GameRendererProps) {
       statusArea={<SegmentHeader segment={gameState.segment} />}
+      headerExtra={<RunControls onRestart={handleRestartRun} onBackToTitle={handleBackToTitle} />}
       mode={mode}
```

**Step 4: create `ts/tests/test_succession_run_controls.tsx`:**

```tsx
// new: ts/tests/test_succession_run_controls.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/succession/App';
import ConfirmButton from '../src/games/succession/components/ConfirmButton';

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

function byId(container: HTMLElement, id: string): HTMLButtonElement | null {
  return container.querySelector(`#${id}`);
}

async function click(el: HTMLElement | null) {
  if (!el) throw new Error('element not found');
  await act(async () => {
    el.click();
  });
}

function beginButton(container: HTMLElement): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes('Begin Your Claim'),
  );
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('ConfirmButton', () => {
  it('needs two clicks to confirm', async () => {
    const onConfirm = vi.fn();
    const { container, root } = await mount(
      <ConfirmButton id="cb" label="Do it" confirmLabel="Really?" onConfirm={onConfirm} />,
    );
    await click(byId(container, 'cb'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(byId(container, 'cb')?.textContent).toContain('Really?');
    await click(byId(container, 'cb'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it('disarms itself after 3 seconds', async () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    const { container, root } = await mount(
      <ConfirmButton id="cb" label="Do it" confirmLabel="Really?" onConfirm={onConfirm} />,
    );
    await click(byId(container, 'cb'));
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    expect(byId(container, 'cb')?.textContent).toContain('Do it');
    await click(byId(container, 'cb'));
    expect(onConfirm).not.toHaveBeenCalled();
    root.unmount();
  });
});

describe('Succession in-play run controls', () => {
  it('are absent on the title screen and present once a run begins', async () => {
    const { container, root } = await mount(<App session={undefined as never} />);
    expect(byId(container, 'succession-restart-run')).toBeNull();
    await click(beginButton(container) ?? null);
    expect(byId(container, 'succession-restart-run')).not.toBeNull();
    expect(byId(container, 'succession-back-to-title')).not.toBeNull();
    root.unmount();
  });

  it('Restart run keeps the player in play, Back to title returns to the title screen', async () => {
    const { container, root } = await mount(<App session={undefined as never} />);
    await click(beginButton(container) ?? null);

    await click(byId(container, 'succession-restart-run'));
    await click(byId(container, 'succession-restart-run'));
    expect(byId(container, 'succession-restart-run')).not.toBeNull();
    expect(beginButton(container)).toBeUndefined();

    await click(byId(container, 'succession-back-to-title'));
    await click(byId(container, 'succession-back-to-title'));
    expect(byId(container, 'succession-restart-run')).toBeNull();
    expect(beginButton(container)).toBeDefined();
    root.unmount();
  });
});
```

## 4. What NOT to do

- Do not change the title screen or verdict screen `GameShell` blocks (an existing test, `test_succession_gameshell_and_disclosure.ts`, counts exactly three `GameShell` blocks and checks `mainClassName` on each).
- No saving or restoring of runs (that is the next directive, `Succession_Run_Save_Continue_Directive`).
- No change to the engine (`ts/src/games/succession/engine/`), to balance, or to `gameOrchestration.ts`.
- No new dependencies, no Lua, no deploys, no protected repos. Player-facing text stays as given (short, plain).

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`; no Python is changed).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_succession
```
Real tail: `Test Files  17 passed (17)` / `Tests  168 passed (168)` (the filter matches every `test_succession_*` file).

After editing, same command. Expected (verified on the prototype): `Test Files  18 passed (18)` / `Tests  172 passed (172)` (4 new). React `act(...)` warnings in stderr are expected.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the changes in place; needs the gitignored `ts/src/games/game-metadata.json`, which the dispatcher copies).

The visual check at 390 px (do the two buttons fit in the header without pushing the title off screen?) needs a browser: it is the controller's step after merge. Say so under Controller finish in your report.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`) and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files marked CRLF keep CRLF (the Edit tool preserves it). New files may use either; use CRLF to match.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The three new files and the `App.tsx` edit exist exactly as specified.
- [ ] `cd ts && npx vitest run test_succession` passes with 18 files / 172 tests (real tail pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git status` shows only the four files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the four files and the vitest counts. Evidence second: real tails. Controller finish: Playwright at 390x844 and 1280x720 to confirm the header fits and the buttons work (start a run, Restart run twice, Back to title twice). Recommended action: review, merge; then the save-and-continue directive can start.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-succession-run-controls-directive |
| Base branch | - |
| Base commit | 046dba20a1beefb0d73bb8c3bf589ef46f4d9109 |
| Head commit | cb4589769710d97fe55ed654a8a3bb02558bf43a |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 13:40 · robert-claude-laptop · none → Queued
- 2026-10-04 19:03 · robert-claude-laptop · Queued → Approved — lint override: path hits are 'do not edit' mentions and a gitignored generated file (game-metadata.json), verified by hand
- 2026-10-05 00:40 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-succession-run-controls-directive; base origin/main (local main differs); lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 00:40 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-succession-run-controls-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-05 00:54 · devin · In progress → Review — devin · In progress -> Review — ConfirmButton + RunControls + App.tsx headerExtra + test file as specified; npx vitest run test_succession: 18 files / 172 passed; npx tsc --noEmit clean; pushed cb458976 (pre-push full suite green, 532s). Controller finish: Playwright header-fit check at 390x844 and 1280x720. [origin] spent: devin 12 min est. n/a
- 2026-10-05 00:58 · robert-claude-laptop · Review → Done
<!-- queue:end -->
