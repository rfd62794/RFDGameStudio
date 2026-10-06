# Dissonance: a "Where Dissonance began" link on the title screen (Size S)

**Depends on:** none to merge; the link only works for players once the prototype is published at `/arcade/dissonance_prototype/` (a controller step, see the Report). **Why Dissonance:** Robert's 2026-10-04 approval of the DIRECTION.md verdict for `dissonance_prototype` (FOLD-INTO `dissonance`; replan 2: "Where Dissonance began" link).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/dissonance_prototype/DIRECTION.md` (Replan 2), `ts/src/games/dissonance/phases/TitlePhase.tsx` (whole file), `ts/src/games/dissonance/App.tsx` (lines 1-12, 34-40, 250-262), `ts/src/ui/components/TitleScreen.tsx` (lines 14-32: it accepts `children`), `ts/src/arcade/routing.ts` (lines 1-9: `navigateTo`).

## 1. Why this exists

The Dissonance Loop Prototype is the origin of Dissonance Depths and is registered as an Origin exhibit (`supersededBy: 'dissonance'`). `DIRECTION.md` folds it into Dissonance: the prototype's only value is history, so it should be reachable from the game it became rather than compete with it as a tile.
`navigateTo(gameId)` in `ts/src/arcade/routing.ts` opens another arcade game page (`?game=<id>`). A standalone build (`VITE_STANDALONE=true`, used for itch and the per-game site builds) has no arcade to open it in, so the link is hidden there; other games read that flag the same way (for example `ts/src/games/shoal/App.tsx`).

## 2. Scope

1. `ts/src/games/dissonance/phases/TitlePhase.tsx`: optional `onOpenOrigin` prop and a small button.
2. `ts/src/games/dissonance/App.tsx`: pass the handler unless the build is standalone.
3. New test `<!-- new: ts/tests/test_dissonance_origin_link.tsx -->`.

## 3. The work

**Step 1 and 2: apply this diff** (the Edit tool keeps line endings; change nothing else):

```diff
diff --git a/ts/src/games/dissonance/App.tsx b/ts/src/games/dissonance/App.tsx
index e689b2df..2b39b2b0 100644
--- a/ts/src/games/dissonance/App.tsx
+++ b/ts/src/games/dissonance/App.tsx
@@ -4,2 +4,3 @@ import { useLuaCall } from '../../hooks';
 import type { GameRendererProps } from '../../engine/types';
+import { navigateTo } from '../../arcade/routing';
 import { clearSave, loadSave, writeSave } from '../../engine/shared/persistence';
@@ -35,2 +36,4 @@ export default function App({ session }: GameRendererProps) {
   const data = session.files.data as Record<string, unknown>;
+  // The prototype lives in the arcade; a standalone build has no arcade to open it in.
+  const isStandalone = (import.meta.env as Record<string, string | undefined>).VITE_STANDALONE === 'true';
   const { call } = useLuaCall(session);
@@ -250,3 +253,8 @@ export default function App({ session }: GameRendererProps) {
         {appPhase === 'title' && (
-          <TitlePhase hasSave={savedRun !== null} onNewRun={handleNewRun} onContinue={handleContinue} />
+          <TitlePhase
+            hasSave={savedRun !== null}
+            onNewRun={handleNewRun}
+            onContinue={handleContinue}
+            onOpenOrigin={isStandalone ? undefined : () => navigateTo('dissonance_prototype')}
+          />
         )}
diff --git a/ts/src/games/dissonance/phases/TitlePhase.tsx b/ts/src/games/dissonance/phases/TitlePhase.tsx
index e04ae1a0..c8fd0812 100644
--- a/ts/src/games/dissonance/phases/TitlePhase.tsx
+++ b/ts/src/games/dissonance/phases/TitlePhase.tsx
@@ -1,3 +1,3 @@
 import { Sparkles, Play, RotateCcw } from 'lucide-react';
-import { TitleScreen } from '../../../ui/components';
+import { Button, TitleScreen } from '../../../ui/components';
 
@@ -7,5 +7,7 @@ interface TitlePhaseProps {
   onContinue: () => void;
+  /** Opens the original prototype this game grew from. Omit to hide the link. */
+  onOpenOrigin?: () => void;
 }
 
-export default function TitlePhase({ hasSave, onNewRun, onContinue }: TitlePhaseProps) {
+export default function TitlePhase({ hasSave, onNewRun, onContinue, onOpenOrigin }: TitlePhaseProps) {
   return (
@@ -42,3 +44,7 @@ export default function TitlePhase({ hasSave, onNewRun, onContinue }: TitlePhase
       ]}
-    />
+    >
+      {onOpenOrigin && (
+        <Button id="dissonance-origin-link" label="Where Dissonance began" onClick={onOpenOrigin} variant="neutral" size="sm" />
+      )}
+    </TitleScreen>
   );
```

**Step 3: create `ts/tests/test_dissonance_origin_link.tsx`:**

```tsx
// new: ts/tests/test_dissonance_origin_link.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

vi.mock('../src/arcade/routing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/arcade/routing')>();
  return { ...actual, navigateTo: vi.fn() };
});

import { navigateTo } from '../src/arcade/routing';
import TitlePhase from '../src/games/dissonance/phases/TitlePhase';
import App from '../src/games/dissonance/App';
import { loadGame } from '../src/engine/runtime';

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('Dissonance "Where Dissonance began" link', () => {
  it('is hidden when no origin handler is given', async () => {
    const { container, root } = await mount(<TitlePhase hasSave={false} onNewRun={() => {}} onContinue={() => {}} />);
    expect(container.querySelector('#dissonance-origin-link')).toBeNull();
    root.unmount();
  });

  it('is shown when a handler is given and calls it on click', async () => {
    const onOpenOrigin = vi.fn();
    const { container, root } = await mount(
      <TitlePhase hasSave={false} onNewRun={() => {}} onContinue={() => {}} onOpenOrigin={onOpenOrigin} />,
    );
    const link = container.querySelector('#dissonance-origin-link') as HTMLElement;
    expect(link.textContent).toContain('Where Dissonance began');
    await act(async () => {
      link.click();
    });
    expect(onOpenOrigin).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it('in the arcade app, the link opens the prototype page', async () => {
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    await act(async () => {
      (container.querySelector('#dissonance-origin-link') as HTMLElement).click();
    });
    expect(navigateTo).toHaveBeenCalledWith('dissonance_prototype');
    root.unmount();
  });
});
```

## 4. What NOT to do

- No change to any registry file (`ts/src/games/dissonance_prototype/config.ts`, `registry.ts`): hiding or relabelling the prototype's card is a site and arcade-grid decision, not this run.
- No change to Lua, to other phases, or to the title text and menu items.
- No new dependencies, no deploys, no builds, no protected repos. Player-facing text is exactly "Where Dissonance began".

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_dissonance
```
Real tail: `Test Files  3 passed | 1 skipped (4)` / `Tests  122 passed | 2 skipped (124)`.

After editing, same command. Expected (verified on the prototype): `Test Files  4 passed | 1 skipped (5)` / `Tests  125 passed | 2 skipped (127)` (3 new). If other Dissonance directives merged first, add their new tests; nothing may fail.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the changes in place; needs the gitignored `ts/src/games/game-metadata.json`, copied by the dispatcher).

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

- [ ] The diff is applied and `test_dissonance_origin_link.tsx` exists; `cd ts && npx vitest run test_dissonance` shows 3 new passing tests and nothing newly failing (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git status` shows only the three files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the three files and the vitest counts. Evidence second: real tails. Controller finish: after the prototype embed is published, click the link in the arcade and confirm the prototype loads (and that the way back to Dissonance works). Recommended action: review, merge.

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
| Status | Superseded |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-dissonance-origin-link-directive |
| Base branch | - |
| Base commit | 9d754122b1ae19a33ae375e9b25215e24b838bf1 |
| Head commit | 274d0d3c7301ad56b17964a56dd05d87d7b9a620 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 13:39 · robert-claude-laptop · none → Queued
- 2026-10-05 00:39 · robert-claude-laptop · Queued → Approved — lint override: path hits follow the verified false-positive classes in this directive family: 'do not edit' mentions (demo_lists_snapshot.json), a gitignored generated file (game-metadata.json) and app-relative paths
- 2026-10-05 00:40 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-dissonance-origin-link-directive; base origin/main (local main differs); lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 00:40 · dispatcher · In progress → Blocked — setup failed before spawn: setup command 'uv sync --frozen' exited 1: on `itch-publisher`
- 2026-10-05 00:40 · robert-claude-laptop · Blocked → Queued — requeue: setup died at uv sync (os error 1142 hard-link) in the laptop's STALE queue MCP process, which predates PR 558 copy mode; the tick-launched dispatcher has the fix
- 2026-10-05 05:28 · robert-claude-laptop · Queued → Approved — lint override: dispatch-path-missing false positives, verified 2026-10-05: ts/src/games/game-metadata.json is gitignored but copied into every worktree via .agentflow/worktree-files; tests/fixtures/demo_lists_snapshot.json is a stale do-not-edit mention (deleted in c7231fd2), not a read dependency
- 2026-10-05 20:53 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-dissonance-origin-link-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 20:54 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-dissonance-origin-link-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-05 21:00 · devin · In progress → Review — Work already present in base via e38c432a (committed to main by Robert 2026-10-04 16:20, predating this dispatch): TitlePhase onOpenOrigin + Button, App.tsx navigateTo/isStandalone wiring, ts/tests/test_dissonance_origin_link.tsx all match directive verbatim. Branch carries empty marker commit 274d0d3c since it had no commits beyond main. Verified: vitest run test_dissonance = 8 files passed | 1 skipped (9), 142 tests passed | 2 skipped (144) incl. 3 origin-link tests; npx tsc --noEmit clean exit 0; Python 3.12.12; git status clean. [origin] spent: devin 4 min est. n/a
- 2026-10-05 22:02 · robert-claude-laptop · Review → Superseded — superseded_by: commit:e38c432a - note: work already on main e38c432a; branch is a no-op marker; Sonnet review re-ran test_dissonance_origin_link (3 passed)
<!-- queue:end -->
