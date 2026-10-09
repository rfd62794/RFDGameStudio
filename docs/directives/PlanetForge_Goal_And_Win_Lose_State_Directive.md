# PlanetForge: a goal with a win and lose state, in a new pure module

**Depends on:** PlanetForge_Trim_Dead_Code_And_Dev_UI_Directive.md (this run edits `App.tsx` as the Trim run leaves it)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/planetforge/DIRECTION.md` (Replan item 2), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (B2, B6),
`examples/planetforge/src/types.ts` (lines 1-100), `examples/planetforge/src/engine/slimeEngine.ts` (lines 267-375 only), `examples/planetforge/src/App.tsx` (lines 28-40 and 195-215)

## 1. Why this exists

PlanetForge has no objective: the ring just ticks and Monuments are a one-way button (`docs/demos/planetforge/DIRECTION.md`: "no goal, no win, no save"; biggest turn-off: "no objective ... it reads as an engine demo"). Robert approved the direction (2026-10-04, all recommendations): give it a goal with a win and a lose state in a new pure module, plus a finish screen with a restart (polish standard B2, B6).
The direction note proposed "win = Monument in all 8 sectors with none unstable; lose = N perturbation ticks with all tiles at tier 0". Measured on origin/main `afb1cefe` with the real engine (a temporary test, removed): left alone, with a Monument built as soon as one is affordable, the world has Monuments in all 8 sectors by tick 14 (`BUILT_AT [1,2,3,4,5,6,10,14]`),
and every tile is stable by tick 20, because the only things that reset tile stability are the player's own actions (`handleInfuseElement`, `handlePerturbTile` in `examples/planetforge/src/App.tsx`; `resolve_tick` never perturbs by itself). So:
- WIN = a Monument in every sector AND every sector settled (all four of its tiles at `ticks_stable >= SOIL_STABILITY_TICKS`). It is a short first win (about 20 ticks), made longer only by perturbing tiles. That is honest about this toy; balance and a harder second goal are out of scope.
- LOSE = every one of the 32 tiles drained to tier 0 in all four elements (nothing left to grow). Only deliberate play reaches it, so the lose screen is kind and short ("it happens to every world builder"). The direction note's "N ticks" timer is dropped: nothing in the sim threatens the player over time.

Facts you need (verified; do not re-derive):
- `WorldState` has `tiles` (32, each `tiers: [W,E,F,A]` 0-3 and `ticks_stable`) and `sectors` (8, each `structure: {type:'None'} | {type:'Monument'} | ...` and `tile_indices`); `NUM_SECTORS` (8) and `SOIL_STABILITY_TICKS` (20) are exported from `examples/planetforge/src/types.ts`.
- `handleResetWorld` in `App.tsx` already stops play, rebuilds the world and resets the selection; the finish screen's button reuses it.
- A ts test that imports `examples/planetforge/src/engine/slimeEngine.ts` makes `cd ts && npx tsc --noEmit` type-check it, and it has one unused local (`const sectorId = Math.floor(i / TILES_PER_SECTOR);`, line 273) that would add a new error. Step 1 removes that one line (no behaviour change; the variable is never read).
- Baseline, real: `cd ts && npx tsc --noEmit` prints 4 errors, all `Cannot find module '.../game-metadata.json'` (generated file, not this run's concern).

## 2. Scope

1. `examples/planetforge/src/engine/slimeEngine.ts`: delete one unused line (step 1).
2. New `<!-- new: examples/planetforge/src/goal.ts -->` and `<!-- new: examples/planetforge/src/components/GoalBanner.tsx -->`.
3. `examples/planetforge/src/App.tsx`: evaluate the goal, stop the clock when finished, render the banner.
4. New test `<!-- new: ts/tests/test_planetforge_goal.ts -->`.

## 3. The work

All existing files are CRLF; keep their endings. New files use CRLF too. This run edits `App.tsx` as left by the PlanetForge Trim directive (it adds `debugToolsEnabled`); if `examples/planetforge/src/debugTools.ts` <!-- new: examples/planetforge/src/debugTools.ts --> does not exist, STOP and write why in the Status row.

**Step 1: `slimeEngine.ts`.** Delete the line `    const sectorId = Math.floor(i / TILES_PER_SECTOR);` and the whitespace-only line directly after it (inside `create_initial_world`'s `for (let i = 0; i < RING_SIZE; i++)` loop). Prototype diff:

```diff
--- a/examples/planetforge/src/engine/slimeEngine.ts
+++ b/examples/planetforge/src/engine/slimeEngine.ts
@@ -270,8 +270,6 @@ export function create_initial_world(): WorldState {
 
   // Initialize 32 tiles
   for (let i = 0; i < RING_SIZE; i++) {
-    const sectorId = Math.floor(i / TILES_PER_SECTOR);
-    
     // Preset some thematic aspect distributions for rich gameplay
     let aspects: [AspectId | null, AspectId | null, AspectId | null, AspectId | null] = [
       null,
```

**Step 2: `goal.ts`.** Create with exactly:

```ts
// new: examples/planetforge/src/goal.ts
import { NUM_SECTORS, SOIL_STABILITY_TICKS, type WorldState } from './types';

export type GoalStatus = 'playing' | 'won' | 'lost';

export interface GoalProgress {
  status: GoalStatus;
  /** Sectors holding a Monument. */
  monuments: number;
  /** Sectors whose four tiles have all held steady for the full stability time. */
  settledSectors: number;
  sectors: number;
}

/**
 * The goal: raise a Monument in every sector and let the whole ring settle.
 * Lost only if every tile has been drained to tier 0 in every element (nothing left to grow).
 * Pure: reads tiles and sectors only.
 */
export function evaluate_goal(world: Pick<WorldState, 'tiles' | 'sectors'>): GoalProgress {
  const monuments = world.sectors.filter((s) => s.structure.type === 'Monument').length;
  const settledSectors = world.sectors.filter((s) =>
    s.tile_indices.every((idx) => (world.tiles[idx]?.ticks_stable ?? 0) >= SOIL_STABILITY_TICKS),
  ).length;
  const sectors = NUM_SECTORS;

  let status: GoalStatus = 'playing';
  if (monuments >= sectors && settledSectors >= sectors) {
    status = 'won';
  } else if (world.tiles.length > 0 && world.tiles.every((t) => t.tiers.every((v) => v === 0))) {
    status = 'lost';
  }
  return { status, monuments, settledSectors, sectors };
}

/** The one line under the header. Plain player language. */
export function goalLine(p: GoalProgress): string {
  return `Goal: raise a Monument in every sector and let the ring settle. Monuments ${p.monuments} of ${p.sectors}, settled sectors ${p.settledSectors} of ${p.sectors}.`;
}

export const WIN_TITLE = 'Your ring is in balance';
export const WIN_BODY = 'Every sector holds a Monument and the whole ring has settled. Well done. Want to try again with a fresh world?';
export const LOSE_TITLE = 'The ring has gone quiet';
export const LOSE_BODY = 'Every tile has been drained, so nothing is left to grow. It happens to every world builder. Start fresh and try again.';
```

**Step 3: `examples/planetforge/src/components/GoalBanner.tsx`.** Create with exactly:

```tsx
// new: examples/planetforge/src/components/GoalBanner.tsx
import React from 'react';
import { goalLine, WIN_TITLE, WIN_BODY, LOSE_TITLE, LOSE_BODY, type GoalProgress } from '../goal';

interface GoalBannerProps {
  goal: GoalProgress;
  onRestart: () => void;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({ goal, onRestart }) => {
  const finished = goal.status !== 'playing';
  return (
    <>
      <div role="status" className="w-full px-4 lg:px-8 py-2 text-xs bg-indigo-950/60 border-b border-indigo-800/60 text-indigo-100">
        {goalLine(goal)}
      </div>
      {finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4" data-testid="pf-goal-finished">
          <div className="max-w-md w-full rounded-2xl border border-indigo-700/60 bg-slate-900 p-6 text-center shadow-2xl">
            <h2 className="text-xl font-extrabold text-white">{goal.status === 'won' ? WIN_TITLE : LOSE_TITLE}</h2>
            <p className="mt-2 text-sm text-slate-300">{goal.status === 'won' ? WIN_BODY : LOSE_BODY}</p>
            <button
              onClick={onRestart}
              className="mt-5 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-bold text-white"
              data-testid="pf-goal-restart"
            >
              {goal.status === 'won' ? 'Play again' : 'Start over'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
```

**Step 4: `App.tsx`.** Apply this prototype diff (context lines are unchanged):

```diff
--- a/examples/planetforge/src/App.tsx
+++ b/examples/planetforge/src/App.tsx
@@ -25,6 +25,8 @@ import { InspectorPanel } from './components/InspectorPanel';
 import { EventLog } from './components/EventLog';
 import { TestRunnerModal } from './components/TestRunnerModal';
 import { debugToolsEnabled } from './debugTools';
+import { evaluate_goal } from './goal';
+import { GoalBanner } from './components/GoalBanner';
 
 export default function App() {
   const showDebugTools = debugToolsEnabled(window.location.search);
@@ -34,6 +36,12 @@ export default function App() {
   const [isPlaying, setIsPlaying] = useState<boolean>(false);
   const [speed, setSpeed] = useState<number>(1);
   const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
+  const goal = evaluate_goal(world);
+
+  // A finished world stops ticking; the finish screen offers a fresh start.
+  useEffect(() => {
+    if (goal.status !== 'playing') setIsPlaying(false);
+  }, [goal.status]);
 
   // Keep selected sector synced when tile selection changes
   const handleSelectTile = (idx: number) => {
@@ -228,6 +236,8 @@ export default function App() {
         showTestRunner={showDebugTools}
       />
 
+      <GoalBanner goal={goal} onRestart={handleResetWorld} />
+
       {/* Main God-Game Canvas Area */}
       <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
         {/* Left Column: 32-Tile Ring Visualizer & Event Stream (7 Cols) */}
```

**Step 5: the test.** Create `ts/tests/test_planetforge_goal.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_planetforge_goal.ts
import { describe, it, expect } from 'vitest';
import { evaluate_goal, goalLine, WIN_TITLE } from '../../examples/planetforge/src/goal';
import { create_initial_world, resolve_tick, attempt_construct_monument } from '../../examples/planetforge/src/engine/slimeEngine';
import { NUM_SECTORS, SOIL_STABILITY_TICKS } from '../../examples/planetforge/src/types';

describe('test_planetforge_goal', () => {
  it('a fresh world is still playing with no monuments', () => {
    const g = evaluate_goal(create_initial_world());
    expect(g.status).toBe('playing');
    expect(g.monuments).toBe(0);
    expect(g.sectors).toBe(NUM_SECTORS);
  });

  it('monuments alone are not a win until every sector has settled', () => {
    const w = create_initial_world();
    w.sectors.forEach((s) => { s.structure = { type: 'Monument', bonus_focus: 5 }; });
    w.tiles.forEach((t) => { t.ticks_stable = 0; });
    const g = evaluate_goal(w);
    expect(g.monuments).toBe(NUM_SECTORS);
    expect(g.settledSectors).toBe(0);
    expect(g.status).toBe('playing');
  });

  it('wins when all eight sectors hold a Monument and every tile has held steady', () => {
    const w = create_initial_world();
    w.sectors.forEach((s) => { s.structure = { type: 'Monument', bonus_focus: 5 }; });
    w.tiles.forEach((t) => { t.ticks_stable = SOIL_STABILITY_TICKS; });
    expect(evaluate_goal(w)).toEqual({ status: 'won', monuments: NUM_SECTORS, settledSectors: NUM_SECTORS, sectors: NUM_SECTORS });
  });

  it('one perturbed tile keeps the win away', () => {
    const w = create_initial_world();
    w.sectors.forEach((s) => { s.structure = { type: 'Monument', bonus_focus: 5 }; });
    w.tiles.forEach((t) => { t.ticks_stable = SOIL_STABILITY_TICKS; });
    w.tiles[7].ticks_stable = 0;
    const g = evaluate_goal(w);
    expect(g.status).toBe('playing');
    expect(g.settledSectors).toBe(NUM_SECTORS - 1);
  });

  it('loses only when every tile is drained to tier 0', () => {
    const w = create_initial_world();
    w.tiles.forEach((t) => { t.tiers = [0, 0, 0, 0]; });
    expect(evaluate_goal(w).status).toBe('lost');
    w.tiles[3].tiers = [0, 0, 1, 0];
    expect(evaluate_goal(w).status).toBe('playing');
  });

  it('real engine: passive play, building a Monument as soon as one is affordable, reaches the win', () => {
    let w = create_initial_world();
    let ticks = 0;
    while (evaluate_goal(w).status === 'playing' && ticks < 200) {
      w = resolve_tick(w);
      ticks++;
      for (const s of w.sectors) {
        if (s.structure.type === 'None' && attempt_construct_monument(s, w.settlement_ledger)) break;
      }
    }
    expect(evaluate_goal(w).status).toBe('won');
    expect(ticks).toBeLessThan(100);
  });

  it('player copy is plain', () => {
    expect(goalLine({ status: 'playing', monuments: 3, settledSectors: 5, sectors: 8 })).toBe(
      'Goal: raise a Monument in every sector and let the ring settle. Monuments 3 of 8, settled sectors 5 of 8.',
    );
    expect(WIN_TITLE).toBe('Your ring is in balance');
  });
});
```

(The first line, `// @vitest-environment node`, matters for tests that import from `examples/`.)

## 4. What NOT to do

- Do not change `resolve_tick`, the harvest or soil rules, monument cost, tile tiers or any balance number. The goal only READS `tiles` and `sectors`.
- Do not add a timer, score, leaderboard, saves (the next directive adds autosave) or a second goal. Do not edit `SimulationHeader.tsx`, the visualizer, the inspector, or the Test Runner.
- Keep the player copy as written: inviting, no dev-speak (no "ADR", no "Phase").
- No Lua, no engine changes outside the one deleted line, no deploys or rebuilds, no protected repos, no player layer or cloud saves. Do not touch `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_planetforge_goal.ts
```
Real tail from the prototype of exactly these edits (on top of the Trim directive): `Test Files  1 passed (1)` / `Tests  7 passed (7)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; none mentions `planetforge` (without step 1 the same command printed a 5th error: `slimeEngine.ts(273,11): error TS6133: 'sectorId' is declared but its value is never read`).

Controller step, not this run: the example's own type check (the prototype passed with 0 errors), rebuilding the embed, a screenshot of the banner and of the finish screen at 1280x720 and 390x844.

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

- [ ] `goal.ts`, `examples/planetforge/src/components/GoalBanner.tsx` and the test exist with the exact content above; the one line is gone from `slimeEngine.ts`; `App.tsx` matches the prototype diff.
- [ ] `cd ts && npx vitest run test_planetforge_goal.ts` passes: 7 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether `debugTools.ts` (from the Trim directive) was present. Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then say plainly what was not run (example type check, rebuild, screenshots) and that the win comes within about 20 ticks of passive play (so it is a short first goal, by design of this pass).

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Blocked |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-planetforge-goal-and-win-lose-sta-c6ffab |
| Base branch | - |
| Base commit | 4d076e3453b1939e3d39dbcc5a65b23308c74289 |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
- 2026-10-08 17:41 · robert-claude-laptop · Queued → Approved
- 2026-10-08 17:42 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetforge-goal-and-win-lose-sta-c6ffab; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4EQEY0XN1MJE88A4A2V9XFF
- 2026-10-08 17:42 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetforge-goal-and-win-lose-sta-c6ffab; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-08 17:47 · devin · In progress → Blocked — STOP condition met: examples/planetforge/src/debugTools.ts does not exist - dependency PlanetForge_Trim_Dead_Code_And_Dev_UI_Directive.md is still Queued (2026-10-05 dispatch died at uv sync setup, requeued, never ran); App.tsx lacks debugToolsEnabled/showTestRunner so the prototype diff cannot apply.
- 2026-10-09 07:24 · robert-claude-laptop · Blocked → Queued — Dependency PlanetForge_Trim merged (PR #250, 595e2f72), debugTools.ts now on main. Branch had no commits; nothing lost.
- 2026-10-09 07:26 · robert-claude-laptop · Queued → Approved
- 2026-10-09 07:27 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetforge-goal-and-win-lose-sta-c6ffab; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4G6NDMH87A9RRTAWRWK4KBA
- 2026-10-09 07:27 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetforge-goal-and-win-lose-sta-c6ffab; resynced: merged main into directive/rfdgamestudio-planetforge-goal-and-win-lose-sta-c6ffab (128 commit(s), clean); provisioned: uv sync --frozen
- 2026-10-09 07:36 · devin · In progress → Blocked — All directive work done, verified, committed at 49bcaab8 (goal.ts, GoalBanner.tsx, App.tsx, slimeEngine line removed, test_planetforge_goal.ts; vitest 7/7 pass; tsc --noEmit exit 0 - provisioned game-metadata.json means even the 4 baseline errors are absent; debugTools.ts present). Push refused by pre-push hook: tests/test_children_fresh.py::test_children_index_is_fresh fails - committed docs/children.json is stale at base commit (grainworks ordering); pre-existing, unrelated to this change, and the directive forbids editing docs/children.json and running `uv run python -m studio.demos index`. Needs children.json regenerated on main (or a directive that names the file), then re-push.
<!-- queue:end -->
