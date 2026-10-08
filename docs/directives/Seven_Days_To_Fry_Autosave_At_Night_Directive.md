# 7 Days to Fry: autosave at every Night, a Continue button, and a Delete saved week control

**Depends on:** Seven_Days_To_Fry_Coffee_And_Soda_Unlocks_Directive.md (edits `App.tsx` as that run leaves it), and through it the Tier A directive (adds `RestartButton.tsx`)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/7_days_to_fry/DIRECTION.md` (Replan item 3), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (B2),
`examples/7-days-to-fry/src/App.tsx` (lines 1-60 and 85-125), `examples/7-days-to-fry/src/components/NewGameScreen.tsx` (lines 1-20 and 50-70), `examples/7-days-to-fry/src/components/RestartButton.tsx` <!-- new: examples/7-days-to-fry/src/components/RestartButton.tsx -->.

## 1. Why this exists

7 Days to Fry is a seven-day arc, but nothing is saved: there is no `localStorage` use anywhere in `examples/7-days-to-fry/src/` (Grep for `localStorage` returns nothing) and the only restarts are in-session. A player who closes the tab on Day 4 starts the week over (`docs/demos/7_days_to_fry/DIRECTION.md`, item 3: "autosave day/money/unlocks, Reset save"; polish standard B2). Robert approved all recommendations (2026-10-04). Measured on origin/main `afb1cefe`.

Design (verified by prototype): save at each NIGHT only. Between days the simulation is paused and the state is tidy, and a Night is exactly where the week's progress (day, cash, unlocks, upgrades, brand equity) lives. The whole `KitchenState` round-trips through JSON cleanly: a real probe of a state after 3,000 simulated ticks gave 9,774 bytes, no Maps, Sets or functions, `JSON.parse(JSON.stringify(state))` deep-equal and stable on a second round trip, and a restored state kept ticking. So the save is the whole state, not a hand-picked subset: no field can be forgotten (including the derived station buffer sizes that upgrades change).
Mid-day progress is not saved (the day restarts from its Night); the start-screen button says so by naming the Night.

Facts you need (verified; do not re-derive):
- `App.tsx` keeps `screen: 'new_game' | 'playing'` and `kitchenState: KitchenState | null`; the start screen is `NewGameScreen` (props today: `onStartGame`); `handleRestartGame` returns to it; `GameOverScreen`/`VictoryScreen` call `handleRestartGame`.
- The Tier A directive added `examples/7-days-to-fry/src/components/RestartButton.tsx` (two-step confirm); this run gives it three optional text props and reuses it for "Delete saved week".
- This run edits files as the Coffee and Soda directive leaves them (it changes the `NightScreen` and `nightShop` import lines in `App.tsx` and adds `ShopUpgradeType`); merge the two earlier 7 Days to Fry directives first.
- Baseline, real: `cd ts && npx tsc --noEmit` prints 4 errors, all `Cannot find module '.../game-metadata.json'`.

## 2. Scope

1. New `<!-- new: examples/7-days-to-fry/src/saveGame.ts -->` (pure functions).
2. `examples/7-days-to-fry/src/components/RestartButton.tsx` (optional text props), `examples/7-days-to-fry/src/components/NewGameScreen.tsx` (Continue and Delete saved week), `examples/7-days-to-fry/src/App.tsx` (load, autosave, wiring).
3. New test `<!-- new: ts/tests/test_seven_days_save.ts -->`.

## 3. The work

All existing files are CRLF; keep their endings. New files use CRLF too. If `examples/7-days-to-fry/src/components/RestartButton.tsx` does not exist, STOP and write why in the Status row.

**Step 1: `saveGame.ts`.** Create with exactly:

```ts
// new: examples/7-days-to-fry/src/saveGame.ts
import type { KitchenState } from './types';

export const SAVE_KEY = 'seven_days_to_fry_save_v1';
export const SAVE_VERSION = 1;

/** The slice of the Storage API this module needs, so tests can pass a plain object. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serializeKitchen(state: KitchenState): string {
  return JSON.stringify({ v: SAVE_VERSION, state });
}

/**
 * Returns the saved Night state, or null for anything missing, unreadable, from another version,
 * not a Night, or the wrong shape. Never throws.
 */
export function restoreKitchen(raw: string | null): KitchenState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const s = parsed?.state;
    if (!parsed || parsed.v !== SAVE_VERSION || !s) return null;
    if (s.gamePhase !== 'night') return null;
    if (typeof s.dayNumber !== 'number' || typeof s.cash !== 'number' || !Number.isFinite(s.cash)) return null;
    if (!Array.isArray(s.stations) || !Array.isArray(s.workers)) return null;
    return s as KitchenState;
  } catch {
    return null;
  }
}

export function loadSave(storage: StorageLike | null): KitchenState | null {
  if (!storage) return null;
  try {
    return restoreKitchen(storage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

/**
 * Saves at Night only (between days the sim is paused and the state is tidy). Returns true when written.
 * Storage can be missing, full or blocked: that is not an error for the player.
 */
export function saveNight(storage: StorageLike | null, state: KitchenState): boolean {
  if (!storage || state.gamePhase !== 'night') return false;
  try {
    storage.setItem(SAVE_KEY, serializeKitchen(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* nothing to do */
  }
}

/** The line shown on the start screen's Continue button. */
export function describeSave(state: Pick<KitchenState, 'dayNumber' | 'cash'>): string {
  return `Continue your week: Night before Day ${state.dayNumber}, $${state.cash.toFixed(2)} in the till`;
}
```

**Step 2: `RestartButton.tsx`** (text props, defaults unchanged so the three existing uses are untouched):

```diff
--- a/examples/7-days-to-fry/src/components/RestartButton.tsx
+++ b/examples/7-days-to-fry/src/components/RestartButton.tsx
@@ -5,10 +5,19 @@ import { RotateCcw } from 'lucide-react';
 interface RestartButtonProps {
   onRestart: () => void;
   className?: string;
+  label?: string;
+  armedLabel?: string;
+  title?: string;
 }
 
 /** Two-step confirm: the first click arms for 3 seconds, a second click inside that window restarts the week. */
-export const RestartButton: React.FC<RestartButtonProps> = ({ onRestart, className = '' }) => {
+export const RestartButton: React.FC<RestartButtonProps> = ({
+  onRestart,
+  className = '',
+  label = 'Restart week',
+  armedLabel = 'Click again to restart the week',
+  title = 'Start the week over from the first screen',
+}) => {
   const [armed, setArmed] = useState(false);
   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const onRestartRef = useRef(onRestart);
@@ -47,10 +56,10 @@ export const RestartButton: React.FC<RestartButtonProps> = ({ onRestart, classNa
           ? 'bg-rose-900 border-rose-600 text-rose-100'
           : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
       } ${className}`}
-      title="Start the week over from the first screen"
+      title={title}
     >
       <RotateCcw className="w-3.5 h-3.5" />
-      {armed ? 'Click again to restart the week' : 'Restart week'}
+      {armed ? armedLabel : label}
     </button>
   );
 };
```

**Step 3: `NewGameScreen.tsx`:**

```diff
--- a/examples/7-days-to-fry/src/components/NewGameScreen.tsx
+++ b/examples/7-days-to-fry/src/components/NewGameScreen.tsx
@@ -5,12 +5,17 @@
 
 import React from 'react';
 import { Play, Utensils, ShieldAlert, Award, ArrowRight } from 'lucide-react';
+import { RestartButton } from './RestartButton';
 
 interface NewGameScreenProps {
   onStartGame: () => void;
+  /** A saved Night to resume, if any. */
+  continueLabel?: string;
+  onContinue?: () => void;
+  onDeleteSave?: () => void;
 }
 
-export const NewGameScreen: React.FC<NewGameScreenProps> = ({ onStartGame }) => {
+export const NewGameScreen: React.FC<NewGameScreenProps> = ({ onStartGame, continueLabel, onContinue, onDeleteSave }) => {
   return (
     <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950">
       <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8 text-center relative overflow-hidden">
@@ -51,6 +56,26 @@ export const NewGameScreen: React.FC<NewGameScreenProps> = ({ onStartGame }) =>
           </div>
         </div>
 
+        {onContinue && continueLabel && (
+          <div className="space-y-2">
+            <button
+              onClick={onContinue}
+              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-base shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
+              data-testid="continue-saved-week"
+            >
+              <span>{continueLabel}</span>
+            </button>
+            {onDeleteSave && (
+              <RestartButton
+                onRestart={onDeleteSave}
+                label="Delete saved week"
+                armedLabel="Click again to delete your saved week"
+                title="Erase the saved week and start fresh"
+              />
+            )}
+          </div>
+        )}
+
         {/* Start Button */}
         <button
           onClick={onStartGame}
```

**Step 4: `App.tsx`:**

```diff
--- a/examples/7-days-to-fry/src/App.tsx
+++ b/examples/7-days-to-fry/src/App.tsx
@@ -19,14 +19,24 @@ import { CONTAGION_EPSILON_FLOOR } from './data';
 import { getLiveStats } from './liveStats';
 import { createInitialKitchenState, startNextDay, tickKitchenState } from './sessionLoop';
 import { KitchenState } from './types';
+import { clearSave, describeSave, loadSave, saveNight, type StorageLike } from './saveGame';
 import { dischargeStaffMeal } from './wasteEconomy';
 import { unloadTruck } from './stockEconomy';
 import { purchaseBrandRecovery, purchaseBufferCapacity, purchaseCoffeeSales, purchaseDayDuration, purchaseFriesUnlock, purchaseSodaUnlock, purchaseStockCapacity } from './nightShop';
 import { Award, Clock, DollarSign, Info, Shield, ShoppingBag, Trash2, Zap } from 'lucide-react';
 
+function browserStorage(): StorageLike | null {
+  try {
+    return typeof window !== 'undefined' ? window.localStorage : null;
+  } catch {
+    return null;
+  }
+}
+
 export default function App() {
   const [screen, setScreen] = useState<'new_game' | 'playing'>('new_game');
   const [kitchenState, setKitchenState] = useState<KitchenState | null>(null);
+  const [savedGame, setSavedGame] = useState<KitchenState | null>(() => loadSave(browserStorage()));
   const [showSpecInfo, setShowSpecInfo] = useState(false);
   const lastTimeRef = useRef<number>(performance.now());
 
@@ -54,6 +64,17 @@ export default function App() {
     return () => cancelAnimationFrame(animId);
   }, [screen, kitchenState?.gamePhase, kitchenState?.isPaused]);
 
+  // Autosave at every Night (between days); a finished run clears the save.
+  useEffect(() => {
+    if (!kitchenState) return;
+    if (kitchenState.gamePhase === 'night') {
+      saveNight(browserStorage(), kitchenState);
+    } else if (kitchenState.gamePhase === 'game_over' || kitchenState.gamePhase === 'victory') {
+      clearSave(browserStorage());
+      setSavedGame(null);
+    }
+  }, [kitchenState]);
+
   // Phase & Screen Action Handlers
   const handleStartGame = () => {
     const state = createInitialKitchenState();
@@ -90,10 +111,23 @@ export default function App() {
   };
 
   const handleRestartGame = () => {
+    clearSave(browserStorage());
+    setSavedGame(null);
     setKitchenState(null);
     setScreen('new_game');
   };
 
+  const handleContinueSavedGame = () => {
+    if (!savedGame) return;
+    setKitchenState(savedGame);
+    setScreen('playing');
+  };
+
+  const handleDeleteSave = () => {
+    clearSave(browserStorage());
+    setSavedGame(null);
+  };
+
   const handleDischargeStaffMeal = () => {
     setKitchenState((prev) => {
       if (!prev) return null;
@@ -145,7 +179,14 @@ export default function App() {
 
   // Render Screen Gating
   if (screen === 'new_game' || !kitchenState) {
-    return <NewGameScreen onStartGame={handleStartGame} />;
+    return (
+      <NewGameScreen
+        onStartGame={handleStartGame}
+        continueLabel={savedGame ? describeSave(savedGame) : undefined}
+        onContinue={savedGame ? handleContinueSavedGame : undefined}
+        onDeleteSave={savedGame ? handleDeleteSave : undefined}
+      />
+    );
   }
 
   if (kitchenState.gamePhase === 'intro') {
```

**Step 5: the test.** Create `ts/tests/test_seven_days_save.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_seven_days_save.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialKitchenState, tickKitchenState, startNextDay } from '../../examples/7-days-to-fry/src/sessionLoop';
import {
  SAVE_KEY, serializeKitchen, restoreKitchen, loadSave, saveNight, clearSave, describeSave, type StorageLike,
} from '../../examples/7-days-to-fry/src/saveGame';
import { UPGRADE_FRIES_UNLOCK_COST } from '../../examples/7-days-to-fry/src/data';
import { purchaseFriesUnlock } from '../../examples/7-days-to-fry/src/nightShop';

const read = (rel: string) => readFileSync(new URL(`../../examples/7-days-to-fry/src/${rel}`, import.meta.url), 'utf8');

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

function nightState(day: number, cash: number) {
  const k = createInitialKitchenState();
  k.gamePhase = 'night';
  k.dayNumber = day;
  k.cash = cash;
  return k;
}

describe('test_seven_days_save', () => {
  it('round-trips a Night: day, cash, unlocks and the rest of the state', () => {
    const k = nightState(3, 80);
    k.cash = 80;
    expect(purchaseFriesUnlock(k)).toBe(true);
    const back = restoreKitchen(serializeKitchen(k));
    expect(back).not.toBeNull();
    expect(back!.dayNumber).toBe(3);
    expect(back!.cash).toBe(80 - UPGRADE_FRIES_UNLOCK_COST);
    expect(back!.unlockedStations.fryer).toBe(true);
    expect(back!.gamePhase).toBe('night');
    expect(back!.workers.length).toBe(k.workers.length);
  });

  it('a restored Night can start the next day and keep ticking', () => {
    const back = restoreKitchen(serializeKitchen(nightState(2, 50)))!;
    startNextDay(back);
    expect(back.gamePhase).toBe('day');
    for (let i = 0; i < 600; i++) tickKitchenState(back, 1 / 60);
    expect(back.elapsedSeconds).toBeGreaterThan(0);
  });

  it('only a Night is ever saved or restored', () => {
    const storage = memoryStorage();
    const day = createInitialKitchenState();
    day.gamePhase = 'day';
    expect(saveNight(storage, day)).toBe(false);
    expect(storage.data.has(SAVE_KEY)).toBe(false);
    expect(restoreKitchen(serializeKitchen(day))).toBeNull();
    expect(saveNight(storage, nightState(4, 10))).toBe(true);
    expect(loadSave(storage)!.dayNumber).toBe(4);
  });

  it('returns null for null, garbage, another version and the wrong shape', () => {
    expect(restoreKitchen(null)).toBeNull();
    expect(restoreKitchen('{oops')).toBeNull();
    expect(restoreKitchen(JSON.stringify({ v: 9, state: nightState(2, 1) }))).toBeNull();
    expect(restoreKitchen(JSON.stringify({ v: 1, state: { gamePhase: 'night', dayNumber: 2, cash: 'lots' } }))).toBeNull();
    expect(restoreKitchen(JSON.stringify({ v: 1, state: { gamePhase: 'night', dayNumber: 2, cash: 5 } }))).toBeNull();
  });

  it('clears the save and never throws when storage is missing or blocked', () => {
    const storage = memoryStorage();
    saveNight(storage, nightState(2, 5));
    clearSave(storage);
    expect(loadSave(storage)).toBeNull();
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(saveNight(null, nightState(2, 5))).toBe(false);
    expect(saveNight(blocked, nightState(2, 5))).toBe(false);
    expect(loadSave(null)).toBeNull();
    expect(loadSave(blocked)).toBeNull();
    expect(() => clearSave(blocked)).not.toThrow();
  });

  it('describes the save in plain words', () => {
    expect(describeSave({ dayNumber: 3, cash: 42.5 })).toBe('Continue your week: Night before Day 3, $42.50 in the till');
  });

  it('the app wires load, autosave, continue and delete', () => {
    const app = read('App.tsx');
    expect(app).toContain('loadSave(browserStorage())');
    expect(app).toContain('saveNight(browserStorage(), kitchenState)');
    expect(app).toContain('onContinue={savedGame ? handleContinueSavedGame : undefined}');
    expect(app).toContain('onDeleteSave={savedGame ? handleDeleteSave : undefined}');
    expect(read('components/NewGameScreen.tsx')).toContain('Delete saved week');
  });
});
```

## 4. What NOT to do

- Do not save during a day, do not save more than once per Night state change, and do not use `sessionStorage`, `indexedDB`, cookies or the network. One `localStorage` key, `seven_days_to_fry_save_v1`. No cloud saves, no accounts, no player layer.
- Do not change the simulation, `sessionLoop.ts`, the shop, balance, or the Design.md week. Do not change the existing `RestartButton` default texts or its three existing uses.
- Do not edit `lineSimulation.test.ts` or the other directives' files beyond the three diffs above. Do not run the example's own test runner (a worktree has no `node_modules` for it).
- No Lua, no engine changes, no deploys or rebuilds, no protected repos. Do not touch `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_seven_days_save.ts
```
Real tail from the prototype of exactly these edits (on top of the earlier two directives): `Test Files  1 passed (1)` / `Tests  7 passed (7)`.
```
cd ts && npx vitest run test_seven_days_save.ts test_seven_days_shop.ts test_7_days_to_fry_tier_a.ts
```
Real tail from the prototype: `Test Files  3 passed (3)` / `Tests  18 passed (18)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors.

Controller step, not this run: the example's own suite with a temporary `node_modules` junction (real result on the prototype: `Tests  241 passed (241)`, unchanged), its own type check (only the pre-existing `KitchenCanvas` prop error), a rebuild, and a play-through: finish Day 1, reload the page, "Continue your week" resumes at the Night before Day 2; "Delete saved week" needs two clicks.

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

- [ ] `saveGame.ts` and the test exist with the exact content above; the three diffs are applied.
- [ ] `cd ts && npx vitest run test_seven_days_save.ts test_seven_days_shop.ts test_7_days_to_fry_tier_a.ts` passes: 3 files, 18 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether `RestartButton.tsx` was present. Evidence second: real tails of `uv run python --version`, the vitest commands and `tsc --noEmit`.
Then say plainly what was not run (the example's own suite and type check, a reload play-through) for the controller; and that a day in progress is not saved by design.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 14:36 · robert-claude-laptop · none → Queued
- 2026-10-08 04:01 · robert-claude-laptop · Queued → Approved
<!-- queue:end -->
