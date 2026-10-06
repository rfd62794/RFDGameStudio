# Shoal M0: "turn your phone sideways" hint, and the Aquarium-stays-shippable gate (Size S)

**Depends on:** none. This run adds one import line and one JSX line to `ts/src/games/shoal/App.tsx`. The queued `Shoal_Reef_Report_And_Session_Note_Directive` also edits `App.tsx` (different lines); if it merged first and the Edit anchors below no longer match exactly, STOP and write why in the Status row. **Why Shoal:** Robert's 2026-10-05 settled decision that Shoal Mode A "Aquarium" is Milestone 0 and must always stay shippable (`docs/demos/shoal/DIRECTION.md`, "Settled decisions 2026-10-05"), and Replan item 4 (phone layout, `rotate-hint`).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/shoal/DIRECTION.md` (Replan 4), `ts/src/games/shoal/App.tsx` (the import block at the top, and the `<div className="shoal-app">` line), `ts/src/games/shoal/styles.css` (end of file), `ts/tests/test_shoal_title_render.tsx` (the render-with-act pattern this run copies).

## 1. Why this exists

M0 of Shoal (Aquarium) has three leftover items from the 2026-10-04 replan. Two are already covered elsewhere: the headless 2,000-tick test landed (`ts/tests/test_shoal_headless.ts`, 6 tests) and the reef report plus "not saved" note is the queued `Shoal_Reef_Report_And_Session_Note_Directive` (do NOT redo it). The third is the phone layout:

- `docs/demos/shoal/SCOPE.md` line 18 already says `Phone layout: rotate-hint` (the reef canvas needs width; the 2026-10-04 redesign spec section c3 names Shoal).
- Nothing in `ts/src` implements a rotate hint (a search for `rotate-hint` in `ts/src` finds nothing). The site-shell mode that would provide one for every game is a separate, large directive in another repo (redesign spec D2.1), so Shoal gets a tiny self-contained card of its own.

This run adds a small pure decision function, a small component, a few lines of CSS and a test. It changes nothing on desktop or in landscape: the card only shows on a portrait viewport narrower than 600 px, can be dismissed, and never blocks the reef.

It also pins the "Aquarium stays shippable" gate: the Verification section below lists the exact test files that must stay green for every later Shoal milestone.

## 2. Scope

1. New module `<!-- new: ts/src/games/shoal/utils/rotateHint.ts -->`: `shouldShowRotateHint`.
2. New component `<!-- new: ts/src/games/shoal/components/RotateHint.tsx -->`.
3. `ts/src/games/shoal/App.tsx`: one import, one `<RotateHint />` element.
4. `ts/src/games/shoal/styles.css`: append the card styles.
5. New test `<!-- new: ts/tests/test_shoal_rotate_hint.tsx -->`.

## 3. The work

**Step 1: create `ts/src/games/shoal/utils/rotateHint.ts`** with exactly this content:

```ts
// new: ts/src/games/shoal/utils/rotateHint.ts
/** Decides whether the "turn your phone sideways" card shows. Pure: no DOM access. */
export interface Viewport {
  width: number;
  height: number;
}

/** Portrait viewports narrower than this need the hint (the reef canvas wants width). */
export const ROTATE_HINT_MAX_WIDTH = 600;

export function shouldShowRotateHint(viewport: Viewport, dismissed: boolean): boolean {
  if (dismissed) return false;
  return viewport.height > viewport.width && viewport.width < ROTATE_HINT_MAX_WIDTH;
}
```

**Step 2: create `ts/src/games/shoal/components/RotateHint.tsx`** with exactly this content:

```tsx
// new: ts/src/games/shoal/components/RotateHint.tsx
import { useEffect, useState } from 'react';
import { shouldShowRotateHint } from '../utils/rotateHint';

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/** A small dismissible card shown only on portrait phones. Never blocks the reef. */
export default function RotateHint() {
  const [viewport, setViewport] = useState(readViewport);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!shouldShowRotateHint(viewport, dismissed)) return null;
  return (
    <div className="shoal-rotate-hint" data-testid="shoal-rotate-hint" role="status">
      <span>Turn your phone sideways for a wider reef.</span>
      <button type="button" className="shoal-rotate-hint-dismiss" onClick={() => setDismissed(true)}>
        Got it
      </button>
    </div>
  );
}
```

**Step 3: edit `ts/src/games/shoal/App.tsx`** (CRLF file; use the Edit tool, which keeps CRLF). Two edits, nothing else:

1. Add this line directly after the existing line `import { SHOAL_Y8_CONFIG } from './y8Config';` (a different spot from the reef-report directive's import):
```tsx
import RotateHint from './components/RotateHint';
```
2. Replace the two lines
```tsx
      <div className="shoal-app">
        <div className="shoal-toolbar">
```
with
```tsx
      <div className="shoal-app">
        <RotateHint />
        <div className="shoal-toolbar">
```
Use the Edit tool with that two-line `old_string` (it is unique: `shoal-toolbar` appears once as a className).

**Step 4: append to the end of `ts/src/games/shoal/styles.css`** (CRLF file; keep one blank line before the block):

```css
.shoal-rotate-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  background: rgba(20, 60, 90, 0.85);
  color: #e8f6ff;
  font-size: 0.9rem;
}

.shoal-rotate-hint-dismiss {
  min-height: 44px;
  padding: 0 0.9rem;
  border: 1px solid rgba(232, 246, 255, 0.5);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
```

**Step 5: create `ts/tests/test_shoal_rotate_hint.tsx`** with exactly this content:

```tsx
// new: ts/tests/test_shoal_rotate_hint.tsx
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { shouldShowRotateHint } from '../src/games/shoal/utils/rotateHint';
import RotateHint from '../src/games/shoal/components/RotateHint';

describe('shouldShowRotateHint', () => {
  it('shows on a portrait phone', () => {
    expect(shouldShowRotateHint({ width: 390, height: 844 }, false)).toBe(true);
  });
  it('hides on a landscape phone', () => {
    expect(shouldShowRotateHint({ width: 844, height: 390 }, false)).toBe(false);
  });
  it('hides on a wide portrait screen such as a tablet', () => {
    expect(shouldShowRotateHint({ width: 820, height: 1180 }, false)).toBe(false);
  });
  it('hides once dismissed', () => {
    expect(shouldShowRotateHint({ width: 390, height: 844 }, true)).toBe(false);
  });
});

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

describe('RotateHint component', () => {
  it('renders in portrait, dismisses on click, and follows rotation', async () => {
    setViewport(390, 844);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<RotateHint />);
    });
    expect(container.querySelector('[data-testid="shoal-rotate-hint"]')).not.toBeNull();

    await act(async () => {
      setViewport(844, 390);
      window.dispatchEvent(new Event('resize'));
    });
    expect(container.querySelector('[data-testid="shoal-rotate-hint"]')).toBeNull();

    await act(async () => {
      setViewport(390, 844);
      window.dispatchEvent(new Event('resize'));
    });
    const button = container.querySelector('button');
    expect(button?.textContent).toContain('Got it');
    await act(async () => {
      button?.click();
    });
    expect(container.querySelector('[data-testid="shoal-rotate-hint"]')).toBeNull();
    root.unmount();
  });
});
```

## 4. What NOT to do

- Do not touch `shoalSimulation.ts`, `types.ts`, the sim's `Stats`, `config.ts`, `y8Config.ts`, or any existing `test_shoal_*` file.
- Do not add the reef report, the "not saved" line, or any title-screen change: that is the other queued directive.
- Do not add a `phone` field to any config, and do not build the site-shell modes (another repo, another directive).
- No Evolve work of any kind (M1 and later are not started). No new entities, buttons or mechanics.
- Player-facing text stays plain: the card says exactly "Turn your phone sideways for a wider reef." and "Got it".
- Do not run `npm run build:*`, `vite-node`, `agentflow` commands, or the y8 integration test (`test_shoal_y8_integration.ts` runs builds and takes about a minute; the controller runs it and `npm run build:shoal` after merge).
- No file over 600 lines; no scratch or debug files in the repo.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified `Python 3.12.12`; no Python file is changed).

Baseline before editing (origin/main `cb252a5c`, 2026-10-05). These five files ARE the Aquarium gate:
```
cd ts && npx vitest run test_shoal_headless.ts test_shoal_title_render.tsx test_shoal_config.ts test_shoal_new_reef_control.ts test_shoal_chrome_polish.ts
```
Real tail: `Test Files  5 passed (5)` / `Tests  49 passed (49)`.

After editing (verified on a prototype of exactly the files above: 4 + 1 new tests):
```
cd ts && npx vitest run test_shoal_rotate_hint.tsx test_shoal_headless.ts test_shoal_title_render.tsx test_shoal_config.ts test_shoal_new_reef_control.ts test_shoal_chrome_polish.ts
```
Expected: `Test Files  6 passed (6)` / `Tests  54 passed (54)`. If the reef-report directive merged first the total is higher: compare "all passed", not the number.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the changes in place; needs the gitignored `ts/src/games/game-metadata.json`, copied by the dispatcher).

The phone screenshot (390x844 shows the card, 844x390 does not, desktop does not) needs a browser, so it is the controller's step after merge: say so under Controller finish in your report. Do not try to run a browser.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename> [<bare-filename> ...]` and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files marked CRLF keep CRLF (the Edit tool preserves it). New files use CRLF to match.
- New logic goes in small new modules (SOLID/SRP/KISS): the decision is `rotateHint.ts`, the view is `RotateHint.tsx`, `App.tsx` only mounts it.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge. If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The three new files exist as above; `App.tsx` has exactly the import and the `<RotateHint />` line; `styles.css` ends with the two new rules.
- [ ] The five-file baseline command and the six-file after command pass (real tails pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git diff --stat` shows only the five files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files changed and the new test count. Evidence second: real tails of the vitest and tsc commands. Controller finish: Playwright screenshots at 390x844 (card visible), 844x390 (no card) and 1280x800 (no card), then `npm run build:shoal` and the y8 integration test, all after merge. Recommended action: review, merge.

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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-05 22:02 · robert-claude-laptop · none → Queued — authored from DIRECTION.md (2026-10-05); queued only, not approved
<!-- queue:end -->
