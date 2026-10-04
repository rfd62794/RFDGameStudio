# Succession: save at each segment, Continue on the title screen, forget-save control (Size M)

**Depends on:** `Succession_Run_Controls_Directive` (must be merged first: this run edits the same `App.tsx` and uses its `ConfirmButton`, `handleBackToTitle` and the `RunControls` header). **Why Succession:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `succession` (Replan item 2).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/succession/DIRECTION.md` (Replan 2), `ts/src/games/succession/App.tsx`, `ts/src/games/succession/components/TitleScreen.tsx` (lines 1-12 and 128-190), `ts/src/engine/shared/persistence.ts` (whole file, 53 lines), `ts/src/games/succession/types/gameState.ts`.

Precondition check, first thing: `ts/src/games/succession/components/ConfirmButton.tsx` and `ts/src/games/succession/components/RunControls.tsx` must exist. If either is missing, the dependency has not merged: STOP and write that in the Status row.

## 1. Why this exists

An eight-segment run lives only in React state. `App.tsx` persists one thing, the first-run primer flag (`succession_tutorial_seen`), so a phone user who switches apps or closes the tab loses the whole run (`docs/demos/succession/DIRECTION.md`, "Biggest turn-off"). The polish standard (Tier B, item B2) asks that a reload mid-run restores state or the game says it is session-only. Succession is a showcase pick, so it restores state.

`GameState` (`ts/src/games/succession/types/gameState.ts`) is plain JSON data (numbers, strings, arrays, records; no Map, Set or functions), so it can be stored as is. Shared persistence (`loadSave`, `writeSave`, `clearSave` in `ts/src/engine/shared/persistence.ts`) never throws and supports a versioned envelope `{ v, data }`: a wrong version reads back as `null`.

## 2. Scope

1. New module `<!-- new: ts/src/games/succession/utils/runSave.ts -->`: save, load, validate, clear.
2. `ts/src/games/succession/App.tsx`: save while playing, clear on the verdict, Continue and forget handlers.
3. `ts/src/games/succession/components/TitleScreen.tsx`: optional Continue button and "Forget this saved run" two-click control.
4. New test `<!-- new: ts/tests/test_succession_run_save.tsx -->`.

## 3. The work

**Step 1: create `ts/src/games/succession/utils/runSave.ts`:**

```ts
// new: ts/src/games/succession/utils/runSave.ts
import { clearSave, loadSave, writeSave } from '../../../engine/shared/persistence';
import { PLAYER_ORIGINS } from '../data/origins';
import { TOTAL_SEGMENTS } from '../data/gameConstants';
import type { PlayerOriginId } from '../engine/types';
import type { GameState } from '../types/gameState';

/** localStorage key for the in-progress run. Bump RUN_SAVE_VERSION if the GameState shape changes. */
export const RUN_SAVE_KEY = 'succession_run';
export const RUN_SAVE_VERSION = 1;

export interface SavedRun {
  originId: PlayerOriginId;
  gameState: GameState;
}

/** A saved run is only trusted when its basic shape is right; anything else is treated as no save. */
export function isValidSavedRun(value: unknown): value is SavedRun {
  if (typeof value !== 'object' || value === null) return false;
  const run = value as Partial<SavedRun>;
  if (!PLAYER_ORIGINS.some((o) => o.id === run.originId)) return false;
  const s = run.gameState;
  if (typeof s !== 'object' || s === null) return false;
  return (
    s.phase === 'segment' &&
    Number.isInteger(s.segment) &&
    s.segment >= 1 &&
    s.segment <= TOTAL_SEGMENTS &&
    Array.isArray(s.figures) &&
    s.figures.length === 3 &&
    Array.isArray(s.claimants) &&
    Array.isArray(s.playerEvidence) &&
    Array.isArray(s.allClaims) &&
    Array.isArray(s.ticker)
  );
}

/** Saves a run that is mid-play. A finished run (verdict phase) is never saved. */
export function saveRun(run: SavedRun): void {
  if (!isValidSavedRun(run)) return;
  writeSave(RUN_SAVE_KEY, run, { version: RUN_SAVE_VERSION });
}

export function loadRun(): SavedRun | null {
  const run = loadSave<unknown>(RUN_SAVE_KEY, { version: RUN_SAVE_VERSION });
  return isValidSavedRun(run) ? run : null;
}

export function clearRun(): void {
  clearSave(RUN_SAVE_KEY);
}
```

**Step 2: edit `ts/src/games/succession/components/TitleScreen.tsx`** (CRLF; the Edit tool keeps it). Apply exactly this diff:

```diff
diff --git a/ts/src/games/succession/components/TitleScreen.tsx b/ts/src/games/succession/components/TitleScreen.tsx
index 623d3dce..dd373a6c 100644
--- a/ts/src/games/succession/components/TitleScreen.tsx
+++ b/ts/src/games/succession/components/TitleScreen.tsx
@@ -4,2 +4,4 @@ import { PlayerOriginId } from '../engine/types';
 import { PLAYER_ORIGINS } from '../data/origins';
+import { TOTAL_SEGMENTS } from '../data/gameConstants';
+import ConfirmButton from './ConfirmButton';
 
@@ -7,5 +9,9 @@ interface TitleScreenProps {
   onBegin: (originId: PlayerOriginId) => void;
+  /** A run saved at a segment boundary, if any. */
+  savedRun?: { segment: number; originName: string } | null;
+  onContinue?: () => void;
+  onResetSave?: () => void;
 }
 
-export const TitleScreen: React.FC<TitleScreenProps> = ({ onBegin }) => {
+export const TitleScreen: React.FC<TitleScreenProps> = ({ onBegin, savedRun, onContinue, onResetSave }) => {
   const [selectedOriginId, setSelectedOriginId] = useState<PlayerOriginId>('bastard_scion');
@@ -162,2 +168,24 @@ export const TitleScreen: React.FC<TitleScreenProps> = ({ onBegin }) => {
 
+        {/* Continue a saved run */}
+        {savedRun && onContinue && (
+          <div className="pt-2 flex flex-col items-center gap-2">
+            <button
+              id="continue-claim-btn"
+              type="button"
+              onClick={onContinue}
+              className="w-full sm:w-auto px-8 py-3.5 border border-amber-500/80 text-amber-200 font-serif font-bold text-base rounded-xl hover:bg-amber-950/40 transition-all duration-200 cursor-pointer"
+            >
+              Continue your claim as {savedRun.originName} (segment {savedRun.segment} of {TOTAL_SEGMENTS})
+            </button>
+            {onResetSave && (
+              <ConfirmButton
+                id="succession-reset-save"
+                label="Forget this saved run"
+                confirmLabel="Forget it for good?"
+                onConfirm={onResetSave}
+              />
+            )}
+          </div>
+        )}
+
         {/* Begin Button */}
```

**Step 3: edit `ts/src/games/succession/App.tsx`.** This diff is written against the file as it will be after the run-controls directive merged (it already has `RunControls`, `handleRestartRun` and `handleBackToTitle`). Apply exactly this diff; if a context line does not match, STOP and write why in the Status row:

```diff
--- a/ts/src/games/succession/App.tsx
+++ b/ts/src/games/succession/App.tsx
@@ -25,2 +25,4 @@
 import RunControls from './components/RunControls';
+import { loadRun, saveRun, clearRun } from './utils/runSave';
+import { PLAYER_ORIGINS } from './data/origins';
 import { ONBOARDING_TIPS, OnboardingTipId } from './content/onboardingTips';
@@ -52,2 +54,4 @@
   const [activeTip, setActiveTip] = useState<OnboardingTipId | null>(null);
+  // A run saved at a segment boundary; shown as "Continue" on the title screen.
+  const [savedRun, setSavedRun] = useState(() => loadRun());
 
@@ -62,2 +66,12 @@
 
+  // Save at every segment boundary while a run is in play; a finished run clears the save.
+  useEffect(() => {
+    if (view !== 'playing' || !gameState) return;
+    if (gameState.phase === 'verdict') {
+      clearRun();
+    } else {
+      saveRun({ originId: chosenOriginId, gameState });
+    }
+  }, [view, gameState, chosenOriginId]);
+
   // Shared SFX: muted until the first user gesture (autoplay-safe).
@@ -126,2 +140,3 @@
     setPlayStage('chamber');
+    setSavedRun(loadRun());
     setView('title');
@@ -129,2 +144,22 @@
 
+  const handleContinue = () => {
+    const run = loadRun();
+    if (!run) {
+      setSavedRun(null);
+      return;
+    }
+    setChosenOriginId(run.originId);
+    setGameState(run.gameState);
+    setSelectedFigureId('chancellor');
+    setPlayStage('chamber');
+    setActiveTip(null);
+    setView('playing');
+    sfx.play('confirm');
+  };
+
+  const handleResetSave = () => {
+    clearRun();
+    setSavedRun(null);
+  };
+
   const handleProceedFromInterlude = () => {
@@ -182,3 +217,15 @@
       >
-        <TitleScreen onBegin={handleBegin} />
+        <TitleScreen
+          onBegin={handleBegin}
+          savedRun={
+            savedRun
+              ? {
+                  segment: savedRun.gameState.segment,
+                  originName: PLAYER_ORIGINS.find((o) => o.id === savedRun.originId)?.name ?? 'your origin',
+                }
+              : null
+          }
+          onContinue={handleContinue}
+          onResetSave={handleResetSave}
+        />
       </GameShell>
```

How it behaves: every time `gameState` changes during play, the run is saved (so a restart or a new run overwrites the save); when the game reaches the verdict the save is cleared; "Back to title" keeps the save and shows Continue; Continue re-enters the chamber at the saved segment (the interlude summary of the last move is not replayed: that is intended); "Forget this saved run" needs two clicks.

**Step 3b: create `ts/tests/test_succession_run_save.tsx`:**

```tsx
// new: ts/tests/test_succession_run_save.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/succession/App';
import { createInitialGameState, appealTo } from '../src/games/succession/utils/gameOrchestration';
import {
  RUN_SAVE_KEY,
  isValidSavedRun,
  saveRun,
  loadRun,
  clearRun,
} from '../src/games/succession/utils/runSave';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('runSave', () => {
  it('round-trips a run saved after a move', () => {
    const state = appealTo(createInitialGameState('merchant_banker'), 'chancellor');
    expect(state.segment).toBe(2);
    saveRun({ originId: 'merchant_banker', gameState: state });
    const loaded = loadRun();
    expect(loaded?.originId).toBe('merchant_banker');
    expect(loaded?.gameState.segment).toBe(2);
    expect(loaded?.gameState).toEqual(state);
  });

  it('clearRun removes the save', () => {
    saveRun({ originId: 'bastard_scion', gameState: createInitialGameState('bastard_scion') });
    expect(loadRun()).not.toBeNull();
    clearRun();
    expect(loadRun()).toBeNull();
    expect(localStorage.getItem(RUN_SAVE_KEY)).toBeNull();
  });

  it('never saves a finished run', () => {
    const done = { ...createInitialGameState('bastard_scion'), phase: 'verdict' as const };
    saveRun({ originId: 'bastard_scion', gameState: done });
    expect(loadRun()).toBeNull();
  });

  it('treats damaged saves as no save', () => {
    localStorage.setItem(RUN_SAVE_KEY, '{not json');
    expect(loadRun()).toBeNull();
    localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ v: 99, data: {} }));
    expect(loadRun()).toBeNull();
    const good = createInitialGameState('bastard_scion');
    expect(isValidSavedRun({ originId: 'nobody', gameState: good })).toBe(false);
    expect(isValidSavedRun({ originId: 'bastard_scion', gameState: { ...good, segment: 9 } })).toBe(false);
    expect(isValidSavedRun({ originId: 'bastard_scion', gameState: { ...good, figures: [] } })).toBe(false);
    expect(isValidSavedRun(null)).toBe(false);
  });
});

async function mountApp() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<App session={undefined as never} />);
  });
  return { container, root };
}

async function click(el: Element | null) {
  if (!el) throw new Error('element not found');
  await act(async () => {
    (el as HTMLElement).click();
  });
}

describe('Succession Continue and reset save', () => {
  it('a begun run survives a reload and can be continued, then forgotten', async () => {
    let { container, root } = await mountApp();
    expect(container.querySelector('#continue-claim-btn')).toBeNull();

    await click(container.querySelector('#begin-claim-btn'));
    expect(loadRun()?.gameState.segment).toBe(1);

    // "Reload": throw the page away and mount a fresh App on the same storage.
    root.unmount();
    document.body.innerHTML = '';
    ({ container, root } = await mountApp());

    const cont = container.querySelector('#continue-claim-btn');
    expect(cont?.textContent).toContain('segment 1 of 8');
    await click(cont);
    expect(container.querySelector('#succession-restart-run')).not.toBeNull();

    // Back to the title keeps the save.
    await click(container.querySelector('#succession-back-to-title'));
    await click(container.querySelector('#succession-back-to-title'));
    expect(container.querySelector('#continue-claim-btn')).not.toBeNull();

    // Forgetting it needs two clicks and removes both the button and the save.
    await click(container.querySelector('#succession-reset-save'));
    expect(container.querySelector('#continue-claim-btn')).not.toBeNull();
    await click(container.querySelector('#succession-reset-save'));
    expect(container.querySelector('#continue-claim-btn')).toBeNull();
    expect(loadRun()).toBeNull();
    root.unmount();
  });
});
```

## 4. What NOT to do

- No cloud saves, no accounts, no leaderboards, no player layer: browser `localStorage` only, via the shared persistence module.
- Do not change `GameState`, the engine, balance, or `gameOrchestration.ts`. If a saved shape needs a change, bump `RUN_SAVE_VERSION` in a later directive, not here.
- Do not change the verdict screen, the primer logic, or the `GameShell` blocks other than the title block's `TitleScreen` props (an existing test counts exactly three `GameShell` blocks).
- No new dependencies, no Lua, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (prototype stacked on the run-controls change, origin/main `d3084de0`): the run-controls directive's final state is 18 files / 172 tests for `cd ts && npx vitest run test_succession`.
After editing, same command. Expected (verified on the prototype with both directives applied): `Test Files  19 passed (19)` / `Tests  177 passed (177)` (5 new in `test_succession_run_save.tsx`). If the run-controls directive's numbers differ in your base, the new file must add exactly 5 tests and nothing else may fail.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with both changes in place).

The reload check in a real browser (act, reload, same segment) and 390 px layout of the Continue button are the controller's steps after merge. Say so under Controller finish.

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

- [ ] `runSave.ts` and `test_succession_run_save.tsx` exist as specified; `App.tsx` and `TitleScreen.tsx` carry the diffs.
- [ ] `cd ts && npx vitest run test_succession` passes with the new 5 tests (real tail pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git status` shows only the four files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the four files and the vitest counts. Evidence second: real tails. Controller finish: Playwright act-reload-continue smoke at 1280 and 390 px. Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.
