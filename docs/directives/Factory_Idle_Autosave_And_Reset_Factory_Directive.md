# Factory Idle: autosave to localStorage and a labelled two-step Reset factory

**Depends on:** Polish_Factory_Idle_TierA_Directive.md (adds the `Clear Floor` label this run builds beside; merge it first)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/factory_idle/DIRECTION.md` (Replan item 2), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (B2, A3),
`examples/factory-idle-precision-armory-phase2/src/App.tsx` (lines 1-20 and 120-135 only), `examples/factory-idle-precision-armory-phase2/src/components/Header.tsx` (lines 1-50 and 270-290 only),
`ts/src/games/gladiator_arena/utils/useArmedConfirm.ts` (the pattern), `ts/tests/test_ledger_utils.ts` (a test that imports from an example folder).

## 1. Why this exists

Factory Idle loses everything on reload: there is no `localStorage`, `sessionStorage` or `indexedDB` use anywhere in
`examples/factory-idle-precision-armory-phase2/src` (Grep for `localStorage` returns nothing; the Tier A directive checks the same). A player who builds
a line, earns research and closes the tab starts over with $350. The only reset control is the floor-clear button (`CLEAR_ALL_TILES`), which does not touch
funds or research and, in the Tier A directive, becomes the labelled `Clear Floor`. Robert's decision (2026-10-04, all recommendations approved): add autosave and a
labelled "Reset factory" with a two-step confirm (polish standard B2 and A3). Measured on origin/main `afb1cefe`.

Facts you need (verified by reading the files; do not re-derive):
- `App.tsx` line 15: `const [state, dispatch] = useReducer(gameReducer, undefined, getInitialGameState);`
- `getInitialGameState()` (`examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts`) starts with `funds: 350`, `isRunning: true` and a starter layout already placed on sector A.
- `state.grid` and `state.items` are the live copy of the ACTIVE sector; `state.sectors[activeSectorId].grid` is stale until a sector switch (`SWITCH_SECTOR`, reducer line 185). So saving must fold `grid`/`items` back into `sectors` first.
- Three declarations in `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts` are unused (`TechUpgrade` import, `playConveyorTick` import, `const isFastBelts = ...`). Because the new test imports this file, `cd ts && npx tsc --noEmit` would otherwise gain 3 new errors. Baseline `tsc` on origin/main shows 4 errors, all `Cannot find module '.../game-metadata.json'` (a generated file, not part of this run). Step 1 removes the three unused declarations.

## 2. Scope

1. `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts`: delete the three unused declarations (step 1).
2. New `<!-- new: examples/factory-idle-precision-armory-phase2/src/engine/persistence.ts -->`, `<!-- new: examples/factory-idle-precision-armory-phase2/src/engine/appReducer.ts -->`, `<!-- new: examples/factory-idle-precision-armory-phase2/src/engine/useArmedConfirm.ts -->`.
3. `examples/factory-idle-precision-armory-phase2/src/App.tsx`: load on start, autosave, wire `onResetFactory`.
4. `examples/factory-idle-precision-armory-phase2/src/components/Header.tsx`: the "Reset factory" button.
5. New test `<!-- new: ts/tests/test_factory_idle_persistence.ts -->`.

## 3. The work

New files may use LF or CRLF; the existing files are CRLF, so use CRLF for the new ones too.

**Step 1: remove the unused declarations in `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts`.** In the first import, delete the line `  TechUpgrade,` (between `  CustomerOrder,` and `  SectorData`). In the audio import, delete the line `  playConveyorTick, `. Delete the line
`      const isFastBelts = state.upgrades.some(u => u.id === 'tech_fast_belts' && u.purchased);` (in `case 'TICK'`, directly after the `isPowerMk2` line). Change nothing else.

**Step 2: `examples/factory-idle-precision-armory-phase2/src/engine/persistence.ts`.** Create with exactly:

```ts
// new: examples/factory-idle-precision-armory-phase2/src/engine/persistence.ts
import type { GameState } from '../types';

export const SAVE_KEY = 'factory_idle_save_v1';
export const SAVE_VERSION = 1;

/** The slice of the Storage API this module needs, so tests can pass a plain object. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** `state.grid` and `state.items` are the live copy of the active sector; fold them back into `sectors` before saving. */
export function serializeState(state: GameState): string {
  const sectors = {
    ...state.sectors,
    [state.activeSectorId]: { ...state.sectors[state.activeSectorId], grid: state.grid, items: state.items },
  };
  return JSON.stringify({ v: SAVE_VERSION, state: { ...state, sectors } });
}

function looksValid(s: any): boolean {
  return !!s
    && typeof s.funds === 'number' && Number.isFinite(s.funds)
    && typeof s.tick === 'number'
    && typeof s.activeSectorId === 'string'
    && !!s.sectors && !!s.sectors[s.activeSectorId]
    && Array.isArray(s.sectors[s.activeSectorId].grid)
    && !!s.hopperStock && !!s.shelfStock && Array.isArray(s.upgrades) && !!s.metrics;
}

/** Returns `fallback` for anything missing, unreadable, from another version, or the wrong shape. Never throws. */
export function restoreState(raw: string | null, fallback: GameState): GameState {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SAVE_VERSION || !looksValid(parsed.state)) return fallback;
    const saved = parsed.state;
    const active = saved.sectors[saved.activeSectorId];
    return {
      ...fallback,
      ...saved,
      grid: active.grid,
      items: active.items ?? [],
      gridWidth: active.gridWidth,
      gridHeight: active.gridHeight,
    } as GameState;
  } catch {
    return fallback;
  }
}

export function loadState(storage: StorageLike | null, fallback: GameState): GameState {
  if (!storage) return fallback;
  try {
    return restoreState(storage.getItem(SAVE_KEY), fallback);
  } catch {
    return fallback;
  }
}

/** True when the save was written. Storage can be missing, full or blocked: that is not an error for the player. */
export function saveState(storage: StorageLike | null, state: GameState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, serializeState(state));
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

**Step 3: `examples/factory-idle-precision-armory-phase2/src/engine/appReducer.ts`.** Create with exactly:

```ts
// new: examples/factory-idle-precision-armory-phase2/src/engine/appReducer.ts
import type { GameAction, GameState } from '../types';
import { gameReducer, getInitialGameState } from './gameReducer';

/** The game's own actions plus the one app-level action: start a brand-new factory. */
export type AppAction = GameAction | { type: 'RESET_FACTORY' };

export function appReducer(state: GameState, action: AppAction): GameState {
  if (action.type === 'RESET_FACTORY') return getInitialGameState();
  return gameReducer(state, action);
}
```

**Step 4: `examples/factory-idle-precision-armory-phase2/src/engine/useArmedConfirm.ts`.** Create with exactly (a copy of the pattern in `ts/src/games/gladiator_arena/utils/useArmedConfirm.ts`):

```ts
// new: examples/factory-idle-precision-armory-phase2/src/engine/useArmedConfirm.ts
import { useCallback, useEffect, useRef, useState } from 'react';

/** Two-step confirm: the first call arms (for `ms`), the second call inside that window runs `onConfirm`. */
export function useArmedConfirm(onConfirm: () => void, ms = 3000) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    []
  );

  const trigger = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (armed) {
      setArmed(false);
      onConfirmRef.current();
    } else {
      setArmed(true);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setArmed(false);
      }, ms);
    }
  }, [armed, ms]);

  return { armed, trigger };
}
```

**Step 5: `App.tsx`.** Four edits:
1. Line 1: `import React, { useReducer, useEffect, useState, useCallback } from 'react';` becomes `import React, { useReducer, useEffect, useRef, useState, useCallback } from 'react';`.
2. Replace the line `import { gameReducer, getInitialGameState } from './engine/gameReducer';` with:
```
import { getInitialGameState } from './engine/gameReducer';
import { appReducer } from './engine/appReducer';
import { loadState, saveState, clearSave, type StorageLike } from './engine/persistence';
```
3. Replace the two lines `export default function App() {` and `  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialGameState);` with:
```
function browserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, () => loadState(browserStorage(), getInitialGameState()));
  const stateRef = useRef(state);
  stateRef.current = state;

  // Autosave every 5 s and when the tab is hidden or closed.
  useEffect(() => {
    const save = () => { saveState(browserStorage(), stateRef.current); };
    const id = setInterval(save, 5000);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', save);
    };
  }, []);
```
4. In the `<Header ... />` props, directly after `        onReset={() => dispatch({ type: 'CLEAR_ALL_TILES' })}` add the line
`        onResetFactory={() => { clearSave(browserStorage()); dispatch({ type: 'RESET_FACTORY' }); }}`.

**Step 6: `examples/factory-idle-precision-armory-phase2/src/components/Header.tsx`.** Four edits:
1. After the line `import { PRESET_FACTORIES } from '../engine/recipes';` add `import { useArmedConfirm } from '../engine/useArmedConfirm';`.
2. In `interface HeaderProps`, after `  onReset: () => void;` add `  onResetFactory: () => void;`.
3. In the destructured props, after `  onReset,` add `  onResetFactory,`, and as the first line inside the component body (directly after `}) => {`) add `  const resetFactory = useArmedConfirm(onResetFactory);`.
4. Directly after the closing `</button>` of the `{/* Reset Floor */}` button (the last button before `</div>` and `</header>`; after the Tier A directive it contains `<span>Clear Floor</span>`), add:
```
        {/* Reset factory: a brand-new start, two-step confirm */}
        <button
          onClick={resetFactory.trigger}
          className={`px-2 py-1 rounded-md text-xs border transition-all ${
            resetFactory.armed
              ? 'bg-rose-900 text-rose-100 border-rose-600'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-400'
          }`}
          title="Start over with a new factory (your saved progress is erased)"
        >
          {resetFactory.armed ? 'Click again to erase and restart' : 'Reset factory'}
        </button>
```

**Step 7: the test.** Create `ts/tests/test_factory_idle_persistence.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_factory_idle_persistence.ts

import { describe, it, expect } from 'vitest';
import { getInitialGameState } from '../../examples/factory-idle-precision-armory-phase2/src/engine/gameReducer';
import { appReducer } from '../../examples/factory-idle-precision-armory-phase2/src/engine/appReducer';
import {
  SAVE_KEY, serializeState, restoreState, loadState, saveState, clearSave, type StorageLike,
} from '../../examples/factory-idle-precision-armory-phase2/src/engine/persistence';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

describe('test_factory_idle_persistence', () => {
  it('round-trips funds, upgrades and the active grid', () => {
    const base = getInitialGameState();
    const played = { ...base, funds: 777, tick: 123, researchPoints: 9 };
    played.grid = played.grid.map((row, y) => row.map((t, x) => (x === 0 && y === 0 ? { ...t, type: 'conveyor' as const } : t)));
    const back = restoreState(serializeState(played), getInitialGameState());
    expect(back.funds).toBe(777);
    expect(back.tick).toBe(123);
    expect(back.researchPoints).toBe(9);
    expect(back.grid[0][0].type).toBe('conveyor');
    expect(back.sectors[back.activeSectorId].grid).toEqual(back.grid);
    expect(back.upgrades.length).toBe(base.upgrades.length);
  });

  it('returns the fallback for null, garbage, another version and the wrong shape', () => {
    const fallback = getInitialGameState();
    expect(restoreState(null, fallback)).toBe(fallback);
    expect(restoreState('{not json', fallback)).toBe(fallback);
    expect(restoreState(JSON.stringify({ v: 99, state: {} }), fallback)).toBe(fallback);
    expect(restoreState(JSON.stringify({ v: 1, state: { funds: 'lots' } }), fallback)).toBe(fallback);
  });

  it('saves and loads through a storage object, and clears it', () => {
    const storage = memoryStorage();
    const state = { ...getInitialGameState(), funds: 4242 };
    expect(saveState(storage, state)).toBe(true);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(loadState(storage, getInitialGameState()).funds).toBe(4242);
    clearSave(storage);
    expect(loadState(storage, getInitialGameState()).funds).toBe(350);
  });

  it('never throws when storage is missing or blocked', () => {
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const state = getInitialGameState();
    expect(saveState(null, state)).toBe(false);
    expect(saveState(blocked, state)).toBe(false);
    expect(loadState(null, state)).toBe(state);
    expect(loadState(blocked, state)).toBe(state);
    expect(() => clearSave(blocked)).not.toThrow();
  });

  it('RESET_FACTORY returns a brand-new starter factory', () => {
    const played = { ...getInitialGameState(), funds: 9999 };
    expect(appReducer(played, { type: 'RESET_FACTORY' }).funds).toBe(350);
  });
});
```

## 4. What NOT to do

- Do not add a `RESET_FACTORY` case or any other edit to `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts` beyond the three deletions in step 1 (it is already over 600 lines); `appReducer.ts` handles the new action.
- No change to game balance, tick logic, recipes, labels (the reskin directive owns them), the Toolbar, `SvgWorkshopGrid.tsx` or `StorefrontPanel.tsx`.
- Do not save more often than every 5 s, do not use `sessionStorage`/`indexedDB`/cookies, and do not send saves anywhere: this is one `localStorage` key, `factory_idle_save_v1`. No cloud saves, no accounts, no player layer.
- Do not add Lua, change `ts/src/engine/`, deploy, rebuild, or touch protected repos. Do not touch `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

Baseline, before editing (real, origin/main `afb1cefe`): `cd ts && npx tsc --noEmit` prints 4 errors, all `error TS2307: Cannot find module ... game-metadata.json`.

After editing:
```
cd ts && npx vitest run test_factory_idle_persistence.ts
```
Real tail from the prototype of these exact files: `Test Files  1 passed (1)` / `Tests  5 passed (5)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: still exactly the same 4 `game-metadata.json` errors and no error that mentions `factory-idle`, `persistence`, `appReducer` or `test_factory_idle`. (Without step 1 the same command gave 7 errors: the 3 unused-declaration errors in `gameReducer.ts`.)

Source checks (Grep tool, one call each): `App.tsx` contains `appReducer` and `onResetFactory`; `Header.tsx` contains `Reset factory` once; `gameReducer.ts` contains no `isFastBelts` and no `playConveyorTick`.

Controller step, not this run: the example's own type check (`tsc --noEmit` inside the example folder needs its `node_modules`, which a worktree does not have). The prototype passed it with 0 errors.

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

- [ ] The three new engine files and the test exist with the exact content above; `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts` lost exactly the three unused declarations and nothing else.
- [ ] `App.tsx` loads through `loadState`, autosaves, and passes `onResetFactory`; `Header.tsx` has the two-step "Reset factory" button.
- [ ] `cd ts && npx vitest run test_factory_idle_persistence.ts` passes (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows only the 4 pre-existing `game-metadata.json` errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed, whether any quoted line differed from the file. Evidence second: the real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then state plainly what was not run (the example's own type check, a browser smoke: reload keeps the factory, "Reset factory" needs two clicks) so the controller does it after merge; rebuilding and deploying the embed is Robert's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
<!-- queue:end -->
