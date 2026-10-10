# 7 Days to Fry: an honest card, a real genre, and a Restart week control on every screen

**Depends on:** none

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/7_days_to_fry/DIRECTION.md` (Replan item 1), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (A3, A5),
`ts/src/games/7_days_to_fry/config.ts`, `examples/7-days-to-fry/src/App.tsx` (lines 85-100 and 140-180), `examples/7-days-to-fry/src/components/ControlPanel.tsx` (lines 1-30 and 55-70), `ts/tests/test_trinity_siege_blurb.ts`.

## 1. Why this exists

7 Days to Fry is the deepest sim in this group, but its arcade card and start flow are wrong (`docs/demos/7_days_to_fry/DIRECTION.md`, verdict POLISH, directive 1; Robert approved all recommendations, 2026-10-04). Measured on origin/main `afb1cefe`:
- The card says `'7 Days to Fry - a cooking survival game'` (`ts/src/games/7_days_to_fry/config.ts` line 7). The game is a kitchen-management sim: you set policy for an autonomous crew over seven escalating days (`examples/7-days-to-fry/docs/Design.md`), and there is no survival mechanic. The genre is empty, with a comment that calls it a "taxonomy gap"; `management-sim` is in the genre list (`PrimaryGenre` in `ts/src/engine/types.ts`), so the gap is stale.
- Polish standard A3 wants a visible Restart that returns to the first screen without a reload. The only restarts are on the game-over and victory screens, and the day screen has an icon-only "Reset Shift" button (`examples/7-days-to-fry/src/components/ControlPanel.tsx` lines 59-65) that does not return to the first screen: `handleResetSession` (`examples/7-days-to-fry/src/App.tsx` lines 144-149) jumps straight into a fresh Day 1.
- The audit flagged A3 at the start screen (`docs/state/demo-audit-batch1-2026-10-03.md`).

Facts you need (verified; do not re-derive):
- `handleRestartGame` (`examples/7-days-to-fry/src/App.tsx` line 92) already does `setKitchenState(null); setScreen('new_game');`, the first screen. It is used by `GameOverScreen` and `VictoryScreen`.
- `ControlPanel`, `NightScreen` and `IntroScreen` live in `examples/7-days-to-fry/src/components/`. `KitchenCanvas` has an existing type error at `App.tsx` line 375 (`onUpdatePolicy` is not a prop of `KitchenCanvasProps`); it is unrelated, pre-existing, and must not be touched.
- Registry copy rule: a description of 60 words or fewer with no placeholder text (A5); `ts/tests/test_trinity_siege_blurb.ts` is the pattern. Changing `description`, `genre` or `tags` does not touch `docs/children.json` (it holds only id, path and label); `label` stays `7 Days To Fry`.
- Baseline, real: `cd ts && npx vitest run test_registry_export.ts test_arcade_manifest.ts` gives `Test Files  2 passed (2)` / `Tests  7 passed (7)`.

## 2. Scope

1. `ts/src/games/7_days_to_fry/config.ts`: honest description, genre, tags.
2. New `<!-- new: examples/7-days-to-fry/src/components/RestartButton.tsx -->`; edit `examples/7-days-to-fry/src/components/ControlPanel.tsx`, `NightScreen.tsx`, `IntroScreen.tsx` and `examples/7-days-to-fry/src/App.tsx` to use it.
3. New test `<!-- new: ts/tests/test_7_days_to_fry_tier_a.ts -->`.

## 3. The work

All existing files are CRLF; keep their endings. New files use CRLF too.

**Step 1: `config.ts`.** Apply this diff (note `\'` escapes are gone: the new text has no apostrophe):

```diff
--- a/ts/src/games/7_days_to_fry/config.ts
+++ b/ts/src/games/7_days_to_fry/config.ts
@@ -5,13 +5,11 @@ const config: GameConfig = {
   order: 160,
   source: { kind: 'example', slug: '7-days-to-fry' },
   label: '7 Days To Fry',
-  description: '7 Days to Fry - a cooking survival game',
+  description: 'Run a burger stand for seven days. Set the pace and the policy while an autonomous crew works the line, then spend your earnings each night on new menu items and upgrades. Survive Day 7 to open a bigger, busier stand.',
   color: '#6c8ef7',
   status: 'external',
-  // No `genre` — genuinely doesn't fit the curated 11-value taxonomy.
-  // "Cooking survival" has no honest match among the existing values.
-  // Reported as a real taxonomy gap.
-  tags: ['cooking', 'survival'],
+  genre: 'management-sim',
+  tags: ['kitchen', 'crew-management'],
   embedUrl: '/arcade/7_days_to_fry/',
 };
 
```

**Step 2: `examples/7-days-to-fry/src/components/RestartButton.tsx`.** Create with exactly:

```tsx
// new: examples/7-days-to-fry/src/components/RestartButton.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface RestartButtonProps {
  onRestart: () => void;
  className?: string;
}

/** Two-step confirm: the first click arms for 3 seconds, a second click inside that window restarts the week. */
export const RestartButton: React.FC<RestartButtonProps> = ({ onRestart, className = '' }) => {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRestartRef = useRef(onRestart);
  onRestartRef.current = onRestart;

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    []
  );

  const handleClick = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (armed) {
      setArmed(false);
      onRestartRef.current();
      return;
    }
    setArmed(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setArmed(false);
    }, 3000);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
        armed
          ? 'bg-rose-900 border-rose-600 text-rose-100'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
      } ${className}`}
      title="Start the week over from the first screen"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      {armed ? 'Click again to restart the week' : 'Restart week'}
    </button>
  );
};
```

**Step 3: the screens and `App.tsx`.** Apply these diffs (context lines are unchanged):

```diff
--- a/examples/7-days-to-fry/src/components/ControlPanel.tsx
+++ b/examples/7-days-to-fry/src/components/ControlPanel.tsx
@@ -6,8 +6,9 @@
 
 import React from 'react';
 import { KitchenState } from '../types';
-import { Coffee, Shield, Pause, Play, RotateCcw, Truck } from 'lucide-react';
+import { Coffee, Shield, Pause, Play, Truck } from 'lucide-react';
 import { STOCK_UNITS_CAPACITY, UNLOAD_TRUCK_COST } from '../data';
+import { RestartButton } from './RestartButton';
 
 interface ControlPanelProps {
   state: KitchenState;
@@ -56,13 +57,7 @@ export const ControlPanel: React.FC<ControlPanelProps> = ({
             ))}
           </div>
 
-          <button
-            onClick={onResetSession}
-            className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 transition cursor-pointer"
-            title="Reset Shift"
-          >
-            <RotateCcw className="w-4 h-4" />
-          </button>
+          <RestartButton onRestart={onResetSession} />
         </div>
       </div>
 
```

```diff
--- a/examples/7-days-to-fry/src/components/NightScreen.tsx
+++ b/examples/7-days-to-fry/src/components/NightScreen.tsx
@@ -28,6 +28,7 @@ import {
   purchaseFriesUnlock,
   purchaseStockCapacity,
 } from '../nightShop';
+import { RestartButton } from './RestartButton';
 
 export function getTierUpMessage(storeTier: number): string {
   return storeTier === 2
@@ -49,6 +50,7 @@ interface NightScreenProps {
   state: KitchenState;
   onUpdatePolicy: (policy: number) => void;
   onStartNextDay: () => void;
+  onRestart?: () => void;
   onPurchaseUpgrade?: (upgradeType: 'buffer_capacity' | 'stock_capacity' | 'day_duration' | 'brand_recovery' | 'fries_unlock') => void;
 }
 
@@ -56,6 +58,7 @@ export const NightScreen: React.FC<NightScreenProps> = ({
   state,
   onUpdatePolicy,
   onStartNextDay,
+  onRestart,
   onPurchaseUpgrade,
 }) => {
   const policyPercent = Math.round(state.policyDial * 100);
@@ -447,6 +450,12 @@ export const NightScreen: React.FC<NightScreenProps> = ({
           <Play className="w-5 h-5 fill-slate-950" />
           <span>Start Day {state.dayNumber}</span>
         </button>
+
+        {onRestart && (
+          <div className="flex justify-center pt-2">
+            <RestartButton onRestart={onRestart} />
+          </div>
+        )}
       </div>
     </div>
   );
```

```diff
--- a/examples/7-days-to-fry/src/components/IntroScreen.tsx
+++ b/examples/7-days-to-fry/src/components/IntroScreen.tsx
@@ -5,12 +5,14 @@
 
 import React from 'react';
 import { ArrowRight, Sparkles, Building2 } from 'lucide-react';
+import { RestartButton } from './RestartButton';
 
 interface IntroScreenProps {
   onContinue: () => void;
+  onRestart?: () => void;
 }
 
-export const IntroScreen: React.FC<IntroScreenProps> = ({ onContinue }) => {
+export const IntroScreen: React.FC<IntroScreenProps> = ({ onContinue, onRestart }) => {
   return (
     <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950">
       <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
@@ -50,6 +52,8 @@ export const IntroScreen: React.FC<IntroScreenProps> = ({ onContinue }) => {
           <span>Continue to Night Setup</span>
           <ArrowRight className="w-4 h-4" />
         </button>
+
+        {onRestart && <RestartButton onRestart={onRestart} />}
       </div>
     </div>
   );
```

```diff
--- a/examples/7-days-to-fry/src/App.tsx
+++ b/examples/7-days-to-fry/src/App.tsx
@@ -141,20 +141,13 @@ export default function App() {
     });
   };
 
-  const handleResetSession = () => {
-    const state = createInitialKitchenState();
-    state.gamePhase = 'day';
-    state.dayNumber = 1;
-    setKitchenState(state);
-  };
-
   // Render Screen Gating
   if (screen === 'new_game' || !kitchenState) {
     return <NewGameScreen onStartGame={handleStartGame} />;
   }
 
   if (kitchenState.gamePhase === 'intro') {
-    return <IntroScreen onContinue={handleContinueFromIntro} />;
+    return <IntroScreen onContinue={handleContinueFromIntro} onRestart={handleRestartGame} />;
   }
 
   if (kitchenState.gamePhase === 'night') {
@@ -163,6 +156,7 @@ export default function App() {
         state={kitchenState}
         onUpdatePolicy={handleUpdatePolicy}
         onStartNextDay={handleStartNextDay}
+        onRestart={handleRestartGame}
         onPurchaseUpgrade={handlePurchaseUpgrade}
       />
     );
@@ -383,7 +377,7 @@ export default function App() {
                 onChangeSpeed={(spd) =>
                   setKitchenState((prev) => (prev ? { ...prev, speedMultiplier: spd } : null))
                 }
-                onResetSession={handleResetSession}
+                onResetSession={handleRestartGame}
               />
             </div>
 
```

(`handleResetSession` is deleted because nothing else uses it once `ControlPanel` receives `handleRestartGame`; Grep for `handleResetSession` afterwards must find nothing.)

**Step 4: the test.** Create `ts/tests/test_7_days_to_fry_tier_a.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_7_days_to_fry_tier_a.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import config from '../src/games/7_days_to_fry/config';

const read = (rel: string) => readFileSync(new URL(`../../examples/7-days-to-fry/src/${rel}`, import.meta.url), 'utf8');

describe('test_7_days_to_fry_tier_a', () => {
  it('has gameId 7_days_to_fry and a genre from the curated list', () => {
    expect(config.gameId).toBe('7_days_to_fry');
    expect(config.genre).toBe('management-sim');
  });

  it('has an honest description of 60 words or fewer', () => {
    const description = config.description ?? '';
    expect(description.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    for (const marker of ['LEAST-VERIFIED', 'fabricated', 'TODO', 'TBD']) {
      expect(description).not.toContain(marker);
    }
    expect(description.toLowerCase()).not.toContain('survival game');
    expect(description).toContain('seven days');
  });

  it('tags describe the game, not the old survival label', () => {
    expect(config.tags).toEqual(['kitchen', 'crew-management']);
  });

  it('a labelled Restart week control is reachable on the intro, night and day screens', () => {
    const button = read('components/RestartButton.tsx');
    expect(button).toContain('Restart week');
    expect(button).toContain('Click again to restart the week');
    expect(read('components/IntroScreen.tsx')).toContain('<RestartButton onRestart={onRestart} />');
    expect(read('components/NightScreen.tsx')).toContain('<RestartButton onRestart={onRestart} />');
    expect(read('components/ControlPanel.tsx')).toContain('<RestartButton onRestart={onResetSession} />');
  });

  it('Restart week returns to the first screen', () => {
    const app = read('App.tsx');
    expect(app).toContain('onRestart={handleRestartGame}');
    expect(app).toContain('onResetSession={handleRestartGame}');
    expect(app).toContain("setScreen('new_game');");
  });
});
```

## 4. What NOT to do

- Do not change the sim (`sessionLoop.ts`, steering, scoring, economy, the night shop), balance, the Design.md week, or `KitchenCanvas` (leave its pre-existing type error). Do not add Coffee or Soda (a separate directive) or saving (another).
- Do not change `label`, `gameId`, `status`, `embedUrl` or `source` in `config.ts`; do not touch `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.
- Do not add network, `eval` or storage use to the example. Do not run the example's own test runner (a worktree has no `node_modules` for it).
- No Lua, no engine changes, no deploys or rebuilds, no protected repos, no player layer or cloud saves.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_7_days_to_fry_tier_a.ts test_registry_export.ts test_arcade_manifest.ts
```
Real tail from the prototype of exactly these edits: `Test Files  3 passed (3)` / `Tests  12 passed (12)` (baseline 7 plus the 5 new). With the new test file but the old `config.ts`, 3 of its 5 tests fail (genre, description, tags), as intended.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors.
Source check (Grep tool): `handleResetSession` has no match in `examples/7-days-to-fry/src/App.tsx`; `RestartButton` matches in `ControlPanel.tsx`, `NightScreen.tsx` and `IntroScreen.tsx`.

Controller step, not this run: the example's own type check (baseline and prototype both print exactly one error, the pre-existing `KitchenCanvas` prop error at `App.tsx` line 375/369; the prototype adds none), rebuilding the embed, and a click-through: Start Shift, Continue, then "Restart week" twice returns to the first screen.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts [<bare-filename>.ts]` (and `uv run pytest ...` where named below). Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use bare test filenames as filters (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index`, any `npm run build:*`, `vite-node`, or `git merge origin/main` (the sandbox refuses them).
- Match each file's existing line endings (the Edit tool preserves them); do not convert.
- `examples/` folders are AI Studio exports (untrusted code). New logic goes in small new modules; no file over 600 lines unless it already is (then do not grow it by more than the lines named here).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `config.ts` has the new description, `genre: 'management-sim'` and the new tags, with the old comment block removed; `label`, `source`, `status` and `embedUrl` unchanged.
- [ ] `RestartButton.tsx` exists with the exact content above; the intro, night and day screens use it; `handleResetSession` is gone.
- [ ] `cd ts && npx vitest run test_7_days_to_fry_tier_a.ts test_registry_export.ts test_arcade_manifest.ts` passes: 3 files, 12 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether any quoted line differed from the file. Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then say plainly what was not run (the example's own type check, a browser click-through) for the controller; deploying is Robert's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-seven-days-to-fry-tier-a-honest-c-991b72 |
| Base branch | - |
| Base commit | 345d16e9ffb7adfabd116560d9e50c150f1b2d33 |
| Head commit | 59c80a09f6d8caefabbcc07b91a2cabf2d1e29a6 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 14:36 · robert-claude-laptop · none → Queued
- 2026-10-05 00:37 · robert-claude-laptop · Queued → Approved — lint override: path hits follow the verified false-positive classes in this directive family: 'do not edit' mentions (demo_lists_snapshot.json), a gitignored generated file (game-metadata.json) and app-relative paths
- 2026-10-05 00:38 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-seven-days-to-fry-tier-a-honest-c-991b72; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 00:38 · dispatcher · In progress → Blocked — setup failed before spawn: setup command 'uv sync --frozen' exited 1: on `itch-publisher`
- 2026-10-05 00:40 · robert-claude-laptop · Blocked → Queued — requeue: setup died at uv sync (os error 1142 hard-link) in the laptop's STALE queue MCP process, which predates PR 558 copy mode; the tick-launched dispatcher has the fix
- 2026-10-08 02:39 · robert-claude-laptop · Queued → Approved
- 2026-10-08 02:39 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-seven-days-to-fry-tier-a-honest-c-991b72; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4D3SYT4WGP6YNFAEP3S7JAX
- 2026-10-08 02:39 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-seven-days-to-fry-tier-a-honest-c-991b72; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-08 02:49 · devin-overseer (delegated) · In progress → Review — Done: honest card (management-sim, kitchen/crew-management tags), RestartButton on intro/night/day screens via handleRestartGame, handleResetSession removed. vitest: 3 files / 13 tests passed (baseline now 8, not 7). tsc --noEmit: 0 errors (game-metadata.json present in worktree). New files CRLF. Committed 59c80a09, pushed.; under delegate.envelope [origin] spent: devin 4 min est. n/a
- 2026-10-08 03:03 · robert-claude-laptop · Review → Done — note: merged via RFDGameStudio PR #226 (merge commit); Fry tier-A tests 34/34 on merged tree; deploy not done
<!-- queue:end -->
