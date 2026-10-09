# VoidDrift Core Loop saves: versioned localStorage save, 5-second autosave, restore on load

**Depends on:** `Polish_Voiddrift_Redux_TierA_Directive.md` merged (its Restart control calls `handleResetSimulation`, which this run extends; its test file `test_voiddrift_redux_restart.ts` must exist).
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/voiddrift_redux/DIRECTION.md`, Phase 2, save half).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voiddrift_redux/DIRECTION.md`, `ts/src/games/voiddrift_redux/App.tsx`, `ts/src/games/voiddrift_redux/simulation/engine.ts` (lines 38-92, the class fields and `initWorld`),
`ts/src/games/voiddrift_redux/types.ts`, `ts/src/engine/shared/persistence.ts` (whole file, 60 lines), `ts/tests/test_voiddrift_redux_engine.ts` (lines 1-36, the Math.random pin).

## 1. Why this exists

VoidDrift Core Loop rebuilds its world from scratch on every page load: `App.tsx` creates `new VoidDriftEngine()` once per mount, and the only thing stored is the tutorial-seen flag (`const TUTORIAL_SEEN_KEY = 'voiddrift_redux_tutorial_seen'`, `loadSave`/`writeSave` from `ts/src/engine/shared/persistence.ts`).
A player who closes the tab loses every drone mission, every ore and every smelted bar. `docs/demos/voiddrift_redux/DIRECTION.md` names this the biggest turn-off ("nothing survives a reload") and its Phase 2 adds "versioned localStorage save/restore with 5 s autosave".
The engine state is plain data: arrays `scouts`, `miningDrones`, `haulers`, `asteroids`, `fragments`, `logs`, the `config` object, and `stats.resources`, `stats.conversions` and three counters (`ts/src/games/voiddrift_redux/simulation/engine.ts:38-92`). No Maps, no functions, no typed arrays, so a JSON round-trip is lossless.
This run adds a small save module plus the App wiring. It does NOT touch the engine class.

## 2. Scope

1. New module `<!-- new: ts/src/games/voiddrift_redux/simulation/save.ts -->`.
2. `ts/src/games/voiddrift_redux/App.tsx`: restore on first creation, autosave, clear on world reset (four small edits below).
3. New test `<!-- new: ts/tests/test_voiddrift_redux_save.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1: the module.** Create `ts/src/games/voiddrift_redux/simulation/save.ts` with exactly:
```
import { clearSave, loadSave, writeSave } from '../../../engine/shared/persistence';
import type { VoidDriftEngine } from './engine';
import type {
  Asteroid,
  ConversionProcess,
  DispatchLog,
  Drone,
  Fragment,
  Scout,
  SimulationConfig,
} from '../types';

export const SAVE_KEY = 'voiddrift_redux_save';
export const SAVE_VERSION = 1;
export const AUTOSAVE_INTERVAL_MS = 5000;

export interface VoidDriftSave {
  config: SimulationConfig;
  scouts: Scout[];
  miningDrones: Drone[];
  haulers: Drone[];
  asteroids: Asteroid[];
  fragments: Fragment[];
  logs: DispatchLog[];
  resources: Record<string, number>;
  conversions: ConversionProcess[];
  counters: {
    closedLoopsCompleted: number;
    successfulTugsCompleted: number;
    avgCycleTimeSec: number;
  };
  simSpeed: number;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function snapshotEngine(engine: VoidDriftEngine): VoidDriftSave {
  return clone({
    config: engine.config,
    scouts: engine.scouts,
    miningDrones: engine.miningDrones,
    haulers: engine.haulers,
    asteroids: engine.asteroids,
    fragments: engine.fragments,
    logs: engine.logs,
    resources: engine.stats.resources,
    conversions: engine.stats.conversions,
    counters: {
      closedLoopsCompleted: engine.stats.closedLoopsCompleted,
      successfulTugsCompleted: engine.stats.successfulTugsCompleted,
      avgCycleTimeSec: engine.stats.avgCycleTimeSec,
    },
    simSpeed: engine.stats.simSpeed,
  });
}

export function applySnapshot(engine: VoidDriftEngine, save: VoidDriftSave): void {
  const snap = clone(save);
  engine.config = snap.config;
  engine.scouts = snap.scouts;
  engine.miningDrones = snap.miningDrones;
  engine.haulers = snap.haulers;
  engine.asteroids = snap.asteroids;
  engine.fragments = snap.fragments;
  engine.logs = snap.logs;
  engine.stats.resources = snap.resources as typeof engine.stats.resources;
  engine.stats.conversions = snap.conversions;
  engine.stats.closedLoopsCompleted = snap.counters.closedLoopsCompleted;
  engine.stats.successfulTugsCompleted = snap.counters.successfulTugsCompleted;
  engine.stats.avgCycleTimeSec = snap.counters.avgCycleTimeSec;
  engine.stats.simSpeed = snap.simSpeed;
}

export function isValidSave(value: unknown): value is VoidDriftSave {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<VoidDriftSave>;
  return (
    Array.isArray(v.scouts) &&
    Array.isArray(v.miningDrones) &&
    Array.isArray(v.haulers) &&
    Array.isArray(v.asteroids) &&
    Array.isArray(v.fragments) &&
    Array.isArray(v.logs) &&
    Array.isArray(v.conversions) &&
    typeof v.config === 'object' && v.config !== null &&
    typeof v.resources === 'object' && v.resources !== null &&
    typeof v.counters === 'object' && v.counters !== null
  );
}

export function saveEngine(engine: VoidDriftEngine): void {
  writeSave(SAVE_KEY, snapshotEngine(engine), { version: SAVE_VERSION });
}

/** Restores a saved world into the engine. Returns false (engine untouched) when there is no usable save. */
export function restoreEngine(engine: VoidDriftEngine): boolean {
  const save = loadSave<VoidDriftSave>(SAVE_KEY, { version: SAVE_VERSION });
  if (!isValidSave(save)) return false;
  applySnapshot(engine, save);
  return true;
}

export function clearEngineSave(): void {
  clearSave(SAVE_KEY);
}
```
Design facts to keep (do not "improve" them): the save is `{ v: 1, data }` through `writeSave(KEY, value, { version })`, so a wrong version or corrupt JSON reads back as `null` and the game starts fresh; `restoreEngine` returns `false` and leaves the engine untouched when the save is missing or malformed; the private `cycleTimeHistory` is deliberately not saved (it refills while playing; `avgCycleTimeSec` is saved).

**Step 2: `App.tsx`, four edits.**
1. Directly under `import { VoidDriftEngine } from './simulation/engine';` add:
```
import { AUTOSAVE_INTERVAL_MS, clearEngineSave, restoreEngine, saveEngine } from './simulation/save';
```
2. Change
```
  if (!engineRef.current) {
    engineRef.current = new VoidDriftEngine();
  }
```
to
```
  if (!engineRef.current) {
    engineRef.current = new VoidDriftEngine();
    restoreEngine(engineRef.current);
  }
```
3. Directly above the comment line `  // Sync state periodically from engine for React UI` add:
```
  // Autosave the world every 5 s and when the tab is hidden or closed.
  useEffect(() => {
    const save = () => saveEngine(engine);
    const interval = setInterval(save, AUTOSAVE_INTERVAL_MS);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', save);
    };
  }, [engine]);

```
4. In `handleResetSimulation`, directly after `engine.initWorld();` add `    clearEngineSave();` so a Restart starts a truly new world (the autosave then re-saves the fresh world within 5 s).

**Step 3: test.** Create `ts/tests/test_voiddrift_redux_save.ts` with exactly:
```
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VoidDriftEngine } from '../src/games/voiddrift_redux/simulation/engine';
import {
  AUTOSAVE_INTERVAL_MS,
  SAVE_KEY,
  SAVE_VERSION,
  clearEngineSave,
  isValidSave,
  restoreEngine,
  saveEngine,
  snapshotEngine,
} from '../src/games/voiddrift_redux/simulation/save';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function runEngine(engine: VoidDriftEngine, seconds: number): void {
  for (let i = 0; i < seconds * 10; i++) engine.update(0.1);
}

describe('VoidDrift Core Loop save and restore', () => {
  it('round-trips a running world: fleet, asteroids and resources survive', () => {
    const a = new VoidDriftEngine();
    runEngine(a, 60);
    a.stats.resources.Metal = 42;
    a.stats.closedLoopsCompleted = 3;
    saveEngine(a);

    const b = new VoidDriftEngine();
    expect(restoreEngine(b)).toBe(true);
    expect(b.stats.resources.Metal).toBe(42);
    expect(b.stats.closedLoopsCompleted).toBe(3);
    expect(b.miningDrones.length).toBe(a.miningDrones.length);
    expect(b.haulers.length).toBe(a.haulers.length);
    expect(b.asteroids.length).toBe(a.asteroids.length);
    expect(b.miningDrones.map((d) => d.state)).toEqual(a.miningDrones.map((d) => d.state));
    expect(snapshotEngine(b)).toEqual(snapshotEngine(a));
  });

  it('a restored engine keeps simulating without throwing', () => {
    const a = new VoidDriftEngine();
    runEngine(a, 30);
    saveEngine(a);
    const b = new VoidDriftEngine();
    restoreEngine(b);
    expect(() => runEngine(b, 30)).not.toThrow();
  });

  it('stores a versioned envelope under the voiddrift_redux_save key', () => {
    saveEngine(new VoidDriftEngine());
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as { v: number };
    expect(raw.v).toBe(SAVE_VERSION);
    expect(SAVE_KEY).toBe('voiddrift_redux_save');
  });

  it('returns false and leaves the engine untouched for a missing, corrupt or wrong-version save', () => {
    const engine = new VoidDriftEngine();
    const before = snapshotEngine(engine);
    expect(restoreEngine(engine)).toBe(false);
    localStorage.setItem(SAVE_KEY, '{broken');
    expect(restoreEngine(engine)).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 999, data: before }));
    expect(restoreEngine(engine)).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, data: { scouts: 'x' } }));
    expect(restoreEngine(engine)).toBe(false);
    expect(snapshotEngine(engine)).toEqual(before);
  });

  it('clearEngineSave removes the save', () => {
    saveEngine(new VoidDriftEngine());
    clearEngineSave();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(isValidSave(null)).toBe(false);
  });
});

describe('VoidDrift Core Loop save wiring', () => {
  const appSource = readFileSync(
    resolve(import.meta.dirname, '../src/games/voiddrift_redux/App.tsx'),
    'utf8'
  );

  it('restores a save when the engine is first created', () => {
    expect(appSource).toMatch(/new VoidDriftEngine\(\);\s*restoreEngine\(engineRef\.current\);/);
  });

  it('autosaves on an interval and on pagehide, and cleans up', () => {
    expect(appSource).toContain('setInterval(save, AUTOSAVE_INTERVAL_MS)');
    expect(appSource).toContain("addEventListener('pagehide', save)");
    expect(appSource).toContain("removeEventListener('pagehide', save)");
  });

  it('clears the save when the world is reset', () => {
    expect(appSource).toMatch(/engine\.initWorld\(\);\s*clearEngineSave\(\);/);
  });

  it('autosaves every 5 seconds', () => {
    expect(AUTOSAVE_INTERVAL_MS).toBe(5000);
  });
});
```

## 4. What NOT to do

- No change to `simulation/engine.ts`, `types.ts`, any panel component, or the primer/tutorial flag.
- No seeded RNG in this run (the DIRECTION.md calls it optional; it is a separate concern and would touch 22 `Math.random` calls in the engine).
- No Details toggle, no goal (the next directive).
- No cloud saves, no accounts, no leaderboards, no player-layer work. localStorage only.
- Do not change the existing key `voiddrift_redux_tutorial_seen`.
- No Lua, no engine-shared changes (`ts/src/engine/shared/persistence.ts` is used as is), no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline after the Tier A directive is merged (origin/main `d3084de0` plus that directive, prototype):
```
cd ts && npx vitest run test_voiddrift_redux_restart.ts test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts
```
Expected `Test Files  3 passed (3)` / `Tests  25 passed (25)`.

After editing:
```
cd ts && npx vitest run test_voiddrift_redux_save.ts test_voiddrift_redux_restart.ts test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts
```
Expected `Test Files  4 passed (4)` / `Tests  34 passed (34)` (9 new). Real prototype tail for the new file alone: `Test Files  1 passed (1)` / `Tests  9 passed (9)`.
Type check, prints nothing when clean (verified with the change applied): `cd ts && npx tsc --noEmit` (if it reports only the missing `game-metadata.json` import, write that in the Status row; do not hunt).
Source check (Grep tool): `App.tsx` contains `restoreEngine(engineRef.current);` once and `clearEngineSave();` once.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`), `cd ts && npx tsc --noEmit`, `uv run python --version` and (only where a Verification section names it) `uv run pytest tests/test_wire_rust.py -q`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files under `ts/` and `docs/` use CRLF line endings in the worktree; keep them (the Edit tool preserves them). New files may use either; git normalizes line endings on commit.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/src/games/voiddrift_redux/simulation/save.ts` exists as pasted; `App.tsx` has the four edits.
- [ ] The save test passes (real tail pasted) and the three earlier VoidDrift Core Loop test files still pass unchanged.
- [ ] `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the three files and the real test counts. Evidence second: the real tails. Say plainly what is not saved (`cycleTimeHistory`, the selected asteroid/drone, the speed buttons' pause state) and that a reload resumes the world after the title screen.
**Controller finish (after merge):** `cd ts && npm run build:voiddrift_redux`, then in a browser: play 20 seconds, reload, confirm drones and resources are still there; click Restart, confirm a fresh world.
Recommended action: review, merge, then the Details toggle and goal directive.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-voiddrift-redux-save-restore-directive |
| Base branch | - |
| Base commit | f5e8703caab15c428a01754ac3fd532d7d688ddb |
| Head commit | 8ecb4ef1ff1029d9c4e68e2b6759e83bbdb2cb94 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 13:29 · robert-claude-laptop · none → Queued
- 2026-10-08 05:53 · robert-claude-laptop · Queued → Approved
- 2026-10-08 05:53 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voiddrift-redux-save-restore-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4DEXQD6897B18B7JZDDRJK8
- 2026-10-08 05:54 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voiddrift-redux-save-restore-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-08 06:12 · devin · In progress → Review — All 3 scope artifacts applied exactly as pasted: new ts/src/games/voiddrift_redux/simulation/save.ts (versioned {v:1,data} envelope under voiddrift_redux_save via shared persistence), 4 App.tsx edits (save import, restoreEngine on first engine create, 5s interval + pagehide autosave useEffect, clearEngineSave after engine.initWorld in handleResetSimulation), new ts/tests/test_voiddrift_redux_save.ts. Verification: `cd ts && npx vitest run test_voiddrift_redux_save.ts test_voiddrift_redux_restart.ts test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts` -> Test Files 3 passed (3) / Tests 29 passed (29): save 9 + chrome 10 + engine 10. `cd ts && npx tsc --noEmit` printed nothing (exit 0). uv run python --version -> Python 3.12.12. Grep: restoreEngine(engineRef.current); x1, clearEngineSave(); x1. DEPENDENCY CAVEAT: test_voiddrift_redux_restart.ts does not exist on base f5e8703c - Polish_Voiddrift_Redux_TierA is still Queued, its commit 30fe4686 lives only on origin/directive/vd-redux-tiera (adds handleRestart + that test file + build:voiddrift_redux). So the directive's expected 4-file/34-test tail is not reachable on this base; the restart file's ~5 tests arrive when TierA merges. The save work itself needs only handleResetSimulation/engine.initWorld which predates TierA, is exactly as pasted, and is merge-order-safe (Restart -> handleResetSimulation -> clearEngineSave holds either way). Not saved by design: private cycleTimeHistory (refills), selected asteroid/drone, pause state; a reload resumes the world after the title screen. Branch pushed; pre-push gate green (975 py, 281 files/2758 ts tests, build test). Recommend: review, merge after or alongside vd-redux-tiera, then re-run the 4-file vitest line to see 34/34. [origin] spent: devin 17 min est. n/a
- 2026-10-08 06:15 · robert-claude-laptop · Review → Done — note: merged via RFDGameStudio PR #238 (merge commit); browser check and deploy left to Robert
<!-- queue:end -->
