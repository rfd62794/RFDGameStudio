# PlanetForge: autosave, a first-step hint, and the PlanetForge name in the header

**Depends on:** PlanetForge_Goal_And_Win_Lose_State_Directive.md (it creates `goal.ts` and `GoalBanner.tsx` this run extends)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/planetforge/DIRECTION.md` (Replan item 3), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (B1, B2),
`docs/directives/PlanetForge_Goal_And_Win_Lose_State_Directive.md` (the files this run builds on), `examples/planetforge/src/App.tsx` (lines 28-45 and 195-225), `examples/planetforge/src/components/SimulationHeader.tsx` (lines 44-65).

## 1. Why this exists

After the Goal directive PlanetForge has an objective, but a reload throws the whole world away (no `localStorage` anywhere in `examples/planetforge/src/`; `docs/demos/planetforge/DIRECTION.md` item 3: "autosave + first-step hint"), the first screen says nothing about what to do (the sim starts paused, `isPlaying` is `false`, and the only text is the goal line), and the header still
talks like an engine report: the title reads "SlimeWorld" (a name clash with the shipped slimeworld demo), the badge "Phase: Soil Upgrade + Monument" and the subtitle "32-Tile Ring Engine • ADR 002 Deterministic Simulation" (`examples/planetforge/src/components/SimulationHeader.tsx` lines 54-61).
Robert's decision (2026-10-04, all recommendations approved): autosave (polish standard B2), a one-line first-step hint (B1), and the engine header renamed to PlanetForge. Measured on origin/main `afb1cefe`.

## 2. Scope

1. New `<!-- new: examples/planetforge/src/persistence.ts -->` and `<!-- new: examples/planetforge/src/hint.ts -->` (pure modules).
2. `examples/planetforge/src/App.tsx`, `examples/planetforge/src/components/GoalBanner.tsx`, `examples/planetforge/src/components/SimulationHeader.tsx`: wire them in and rename the player-facing header copy.
3. Rename comments and the metadata title: `examples/planetforge/src/engine/slimeEngine.ts` line 2, `examples/planetforge/src/types.ts` line 2, `examples/planetforge/src/App.tsx` line 2 (comment headers), `examples/planetforge/metadata.json` `name`.
4. New test `<!-- new: ts/tests/test_planetforge_persistence.ts -->`.

## 3. The work

All existing files are CRLF (`metadata.json` is LF-or-CRLF: keep what it has). New files use CRLF. This run edits files as the Goal directive leaves them: if `examples/planetforge/src/goal.ts` does not exist, STOP and write why in the Status row.

**Step 1: `persistence.ts`.** Create with exactly:

```ts
// new: examples/planetforge/src/persistence.ts
import { NUM_SECTORS, RING_SIZE, type WorldState } from './types';

export const SAVE_KEY = 'planetforge_save_v1';
export const SAVE_VERSION = 1;

/** The slice of the Storage API this module needs, so tests can pass a plain object. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serializeWorld(world: WorldState): string {
  return JSON.stringify({ v: SAVE_VERSION, world });
}

function isNumberArray(v: unknown, length: number): boolean {
  return Array.isArray(v) && v.length === length && v.every((n) => typeof n === 'number' && Number.isFinite(n));
}

function looksValid(w: any): boolean {
  return !!w
    && typeof w.current_tick === 'number'
    && Array.isArray(w.tiles) && w.tiles.length === RING_SIZE
    && w.tiles.every((t: any) => !!t && isNumberArray(t.tiers, 4) && typeof t.ticks_stable === 'number')
    && Array.isArray(w.sectors) && w.sectors.length === NUM_SECTORS
    && w.sectors.every((s: any) => !!s && !!s.structure && typeof s.structure.type === 'string' && Array.isArray(s.tile_indices))
    && !!w.settlement_ledger && typeof w.settlement_ledger.food === 'number'
    && typeof w.settlement_ledger.energy === 'number' && typeof w.settlement_ledger.material === 'number'
    && !!w.settlement && Array.isArray(w.logs);
}

/** Returns `fallback` for anything missing, unreadable, from another version, or the wrong shape. Never throws. */
export function restoreWorld(raw: string | null, fallback: WorldState): WorldState {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SAVE_VERSION || !looksValid(parsed.world)) return fallback;
    return parsed.world as WorldState;
  } catch {
    return fallback;
  }
}

export function loadWorld(storage: StorageLike | null, fallback: WorldState): WorldState {
  if (!storage) return fallback;
  try {
    return restoreWorld(storage.getItem(SAVE_KEY), fallback);
  } catch {
    return fallback;
  }
}

/** True when the save was written. Storage can be missing, full or blocked: that is not an error for the player. */
export function saveWorld(storage: StorageLike | null, world: WorldState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, serializeWorld(world));
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
```

**Step 2: `hint.ts`.** Create with exactly:

```ts
// new: examples/planetforge/src/hint.ts

/**
 * The one first-step line, shown only before the ring has started ticking.
 * Returns null once the world is running or has moved, so it never nags.
 */
export function firstStepHint(currentTick: number, isPlaying: boolean): string | null {
  if (currentTick > 0 || isPlaying) return null;
  return 'Press Play to start the ring, then pick a tile and raise an element to see what it does.';
}
```

**Step 3: App.tsx.** Apply this prototype diff (context lines are unchanged):

```diff
--- a/examples/planetforge/src/App.tsx
+++ b/examples/planetforge/src/App.tsx
@@ -1,5 +1,5 @@
 /**
- * SlimeWorld (God-Game) - Main Application
+ * PlanetForge (God-Game) - Main Application
  * Phase: SectorZone Soil Upgrade Pass + Monument Construction (ADR 002 Engine)
  */
 
@@ -27,10 +27,22 @@ import { TestRunnerModal } from './components/TestRunnerModal';
 import { debugToolsEnabled } from './debugTools';
 import { evaluate_goal } from './goal';
 import { GoalBanner } from './components/GoalBanner';
+import { loadWorld, saveWorld, clearSave, type StorageLike } from './persistence';
+import { firstStepHint } from './hint';
+
+function browserStorage(): StorageLike | null {
+  try {
+    return typeof window !== 'undefined' ? window.localStorage : null;
+  } catch {
+    return null;
+  }
+}
 
 export default function App() {
   const showDebugTools = debugToolsEnabled(window.location.search);
-  const [world, setWorld] = useState<WorldState>(() => create_initial_world());
+  const [world, setWorld] = useState<WorldState>(() => loadWorld(browserStorage(), create_initial_world()));
+  const worldRef = useRef(world);
+  worldRef.current = world;
   const [selectedTileIdx, setSelectedTileIdx] = useState<number>(0);
   const [selectedSectorId, setSelectedSectorId] = useState<number>(0);
   const [isPlaying, setIsPlaying] = useState<boolean>(false);
@@ -65,6 +77,19 @@ export default function App() {
     });
   };
 
+  // Autosave every 5 s and when the tab is hidden or closed.
+  useEffect(() => {
+    const save = () => { saveWorld(browserStorage(), worldRef.current); };
+    const id = setInterval(save, 5000);
+    window.addEventListener('beforeunload', save);
+    document.addEventListener('visibilitychange', save);
+    return () => {
+      clearInterval(id);
+      window.removeEventListener('beforeunload', save);
+      document.removeEventListener('visibilitychange', save);
+    };
+  }, []);
+
   // Simulation Loop
   useEffect(() => {
     if (!isPlaying) return;
@@ -214,6 +239,7 @@ export default function App() {
   };
 
   const handleResetWorld = () => {
+    clearSave(browserStorage());
     setIsPlaying(false);
     setWorld(create_initial_world());
     setSelectedTileIdx(0);
@@ -236,7 +262,7 @@ export default function App() {
         showTestRunner={showDebugTools}
       />
 
-      <GoalBanner goal={goal} onRestart={handleResetWorld} />
+      <GoalBanner goal={goal} hint={firstStepHint(world.current_tick, isPlaying)} onRestart={handleResetWorld} />
 
       {/* Main God-Game Canvas Area */}
       <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
```

**Step 4: GoalBanner.tsx.**

```diff
--- a/examples/planetforge/src/components/GoalBanner.tsx
+++ b/examples/planetforge/src/components/GoalBanner.tsx
@@ -4,15 +4,18 @@ import { goalLine, WIN_TITLE, WIN_BODY, LOSE_TITLE, LOSE_BODY, type GoalProgress
 
 interface GoalBannerProps {
   goal: GoalProgress;
+  /** Optional first-step line shown under the goal (null once the player is under way). */
+  hint?: string | null;
   onRestart: () => void;
 }
 
-export const GoalBanner: React.FC<GoalBannerProps> = ({ goal, onRestart }) => {
+export const GoalBanner: React.FC<GoalBannerProps> = ({ goal, hint = null, onRestart }) => {
   const finished = goal.status !== 'playing';
   return (
     <>
       <div role="status" className="w-full px-4 lg:px-8 py-2 text-xs bg-indigo-950/60 border-b border-indigo-800/60 text-indigo-100">
         {goalLine(goal)}
+        {hint && <span className="block mt-0.5 text-indigo-300" data-testid="pf-first-step-hint">{hint}</span>}
       </div>
       {finished && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4" data-testid="pf-goal-finished">
```

**Step 5: SimulationHeader.tsx** (player-facing copy only):

```diff
--- a/examples/planetforge/src/components/SimulationHeader.tsx
+++ b/examples/planetforge/src/components/SimulationHeader.tsx
@@ -51,14 +51,14 @@ export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
           <div>
             <div className="flex items-center gap-2">
               <h1 className="text-base font-extrabold tracking-tight text-white">
-                SlimeWorld
+                PlanetForge
               </h1>
               <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">
-                Phase: Soil Upgrade + Monument
+                Ring World
               </span>
             </div>
             <p className="text-xs text-slate-400">
-              32-Tile Ring Engine • ADR 002 Deterministic Simulation
+              Nurture a 32-tile ring world, one sector at a time
             </p>
           </div>
         </div>
```

**Step 6: the remaining renames (comments and the metadata title).**
- `examples/planetforge/src/engine/slimeEngine.ts` line 2: ` * SlimeWorld God-Game Engine` -> ` * PlanetForge God-Game Engine`.
- `examples/planetforge/src/types.ts` line 2: ` * SlimeWorld (God-Game) - Core Type Definitions` -> ` * PlanetForge (God-Game) - Core Type Definitions`.
- `examples/planetforge/metadata.json`: `"name": "SlimeWorld: Ring God-Game"` -> `"name": "PlanetForge: Ring God-Game"`.
(Leave every other "ADR 002" mention: they sit in engine comments and in the Test Runner modal, which is hidden unless `?debug=1`.)

**Step 7: the test.** Create `ts/tests/test_planetforge_persistence.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_planetforge_persistence.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { create_initial_world, resolve_tick } from '../../examples/planetforge/src/engine/slimeEngine';
import {
  SAVE_KEY, serializeWorld, restoreWorld, loadWorld, saveWorld, clearSave, type StorageLike,
} from '../../examples/planetforge/src/persistence';
import { firstStepHint } from '../../examples/planetforge/src/hint';

const read = (rel: string) => readFileSync(new URL(`../../examples/planetforge/src/${rel}`, import.meta.url), 'utf8');

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

describe('test_planetforge_persistence', () => {
  it('round-trips a world that has been played', () => {
    let w = create_initial_world();
    for (let i = 0; i < 12; i++) w = resolve_tick(w);
    w.sectors[1].structure = { type: 'Monument', bonus_focus: 5 };
    const back = restoreWorld(serializeWorld(w), create_initial_world());
    expect(back.current_tick).toBe(12);
    expect(back.sectors[1].structure.type).toBe('Monument');
    expect(back.tiles.length).toBe(32);
    expect(back.settlement_ledger).toEqual(w.settlement_ledger);
  });

  it('returns the fallback for null, garbage, another version and the wrong shape', () => {
    const fallback = create_initial_world();
    expect(restoreWorld(null, fallback)).toBe(fallback);
    expect(restoreWorld('{oops', fallback)).toBe(fallback);
    expect(restoreWorld(JSON.stringify({ v: 2, world: {} }), fallback)).toBe(fallback);
    expect(restoreWorld(JSON.stringify({ v: 1, world: { current_tick: 3, tiles: [] } }), fallback)).toBe(fallback);
  });

  it('saves, loads and clears through a storage object', () => {
    const storage = memoryStorage();
    const w = { ...create_initial_world(), current_tick: 77 };
    expect(saveWorld(storage, w)).toBe(true);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(loadWorld(storage, create_initial_world()).current_tick).toBe(77);
    clearSave(storage);
    expect(loadWorld(storage, create_initial_world()).current_tick).toBe(0);
  });

  it('never throws when storage is missing or blocked', () => {
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const w = create_initial_world();
    expect(saveWorld(null, w)).toBe(false);
    expect(saveWorld(blocked, w)).toBe(false);
    expect(loadWorld(null, w)).toBe(w);
    expect(loadWorld(blocked, w)).toBe(w);
    expect(() => clearSave(blocked)).not.toThrow();
  });

  it('shows the first-step hint only before the ring has started', () => {
    expect(firstStepHint(0, false)).toContain('Press Play');
    expect(firstStepHint(0, true)).toBeNull();
    expect(firstStepHint(5, false)).toBeNull();
  });

  it('the header uses the PlanetForge name and no engineering jargon', () => {
    const header = read('components/SimulationHeader.tsx');
    expect(header).toContain('PlanetForge');
    expect(header).not.toContain('SlimeWorld');
    expect(header).not.toContain('ADR 002');
    expect(header).not.toContain('Phase: ');
  });

  it('the app loads the saved world and autosaves', () => {
    const app = read('App.tsx');
    expect(app).toContain('loadWorld(browserStorage(), create_initial_world())');
    expect(app).toContain('saveWorld(browserStorage(), worldRef.current)');
    expect(app).toContain('clearSave(browserStorage())');
  });
});
```

## 4. What NOT to do

- Do not change `resolve_tick`, any rule or balance number, `goal.ts` or the trim files. Saves are one `localStorage` key, `planetforge_save_v1`, written at most every 5 s plus on hide/close; no `sessionStorage`, no `indexedDB`, no network, no cloud saves, no accounts, no player layer.
- Do not add a tutorial overlay, a modal or a second hint: the hint is one sentence under the goal line, shown only before the first tick.
- Do not edit `TestRunnerModal.tsx` (hidden by the Trim directive) or `ts/src/games/planetforge/config.ts` (its label is already "PlanetForge").
- No Lua, no engine changes, no deploys or rebuilds, no protected repos. Do not touch `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_planetforge_persistence.ts
```
Real tail from the prototype of exactly these edits on top of the Trim and Goal directives: `Test Files  1 passed (1)` / `Tests  7 passed (7)`.
```
cd ts && npx vitest run test_planetforge_persistence.ts test_planetforge_goal.ts test_planetforge_trim.ts
```
Real tail from the prototype: `Test Files  3 passed (3)` / `Tests  17 passed (17)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; none mentions `planetforge`.
Source check (Grep tool): pattern `SlimeWorld|ADR 002` in `examples/planetforge/src/components/SimulationHeader.tsx` has no match.

Controller step, not this run: the example's own type check (the prototype passed with 0 errors), rebuilding the embed, a screenshot of the first screen at 1280x720 and 390x844, and a reload check (play a few ticks, reload, the tick count survives).

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

- [ ] `persistence.ts`, `hint.ts` and the test exist with the exact content above; `App.tsx`, `GoalBanner.tsx` and `SimulationHeader.tsx` match the prototype diffs; the three rename edits are done.
- [ ] `cd ts && npx vitest run test_planetforge_persistence.ts test_planetforge_goal.ts test_planetforge_trim.ts` passes: 3 files, 17 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether `goal.ts` was present. Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then say plainly what was not run (example type check, rebuild, screenshots, reload check) for the controller; deploying is Robert's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.
