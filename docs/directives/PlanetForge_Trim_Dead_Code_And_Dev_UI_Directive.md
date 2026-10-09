# PlanetForge trim: delete dead gameLogic, hide the Test Runner, label Reset

**Depends on:** none

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/planetforge/DIRECTION.md`, `examples/planetforge/src/App.tsx` (lines 1-35 and 215-271), `examples/planetforge/src/components/SimulationHeader.tsx` (lines 15-40 and 165-195),
`docs/directives/PlanetForge_Phase2_Correction_Directive.md` (lines 10-25: why gameLogic.ts is dead code)

## 1. Why this exists

PlanetForge (`examples/planetforge`, a 32-tile ring-world god-game) carries clutter that a player or the next developer trips over (`docs/demos/planetforge/DIRECTION.md`, verdict TRIM; Robert approved the verdict and the answer to its open question, 2026-10-04: delete the dead `gameLogic.ts`).
Measured on origin/main `afb1cefe`:
- Two copies of a module the game never runs: `ts/src/games/planetforge/gameLogic.ts` (266 lines) and `examples/planetforge/src/planetforge/gameLogic.ts`, plus tests that exercise only the dead code: `ts/tests/test_planetforge_gameLogic.ts` and `examples/planetforge/src/planetforge/gameLogic.test.ts`. The live game imports `./engine/slimeEngine` (`examples/planetforge/src/App.tsx` line 21). Grep for imports of the dead module finds only its own tests.
- A dev-only "Test Suite (3/3)" button and modal are on the player surface (`examples/planetforge/src/components/SimulationHeader.tsx` lines 181-187, `examples/planetforge/src/App.tsx` lines 26 and 265).
- The reset control is an icon-only button titled "Reset Simulation World" (`SimulationHeader.tsx` lines 171-176): destructive and unlabelled (polish standard A3).

## 2. Scope

1. Delete the four dead-code files above.
2. New `<!-- new: examples/planetforge/src/debugTools.ts -->`; edit `examples/planetforge/src/App.tsx` and `examples/planetforge/src/components/SimulationHeader.tsx` so the Test Runner shows only with `?debug=1`, and the reset control says "Reset world".
3. New test `<!-- new: ts/tests/test_planetforge_trim.ts -->`.

## 3. The work

`App.tsx` and `SimulationHeader.tsx` are CRLF files; keep their endings. New files use CRLF too.

**Step 1: delete the dead code.** One command per call, in this order:
`git rm ts/tests/test_planetforge_gameLogic.ts`, `git rm ts/src/games/planetforge/gameLogic.ts`, `git rm examples/planetforge/src/planetforge/gameLogic.test.ts`, `git rm examples/planetforge/src/planetforge/gameLogic.ts`.
Before deleting, run the Grep tool once for the pattern `gameLogic` over `examples/planetforge/src/` and over `ts/src/games/planetforge`: the only hits must be inside the files being deleted. If any other file imports them, STOP and write which in the Status row. If the sandbox refuses `git rm` (deleting can be denied), do not try another way: leave all four files in place, finish the other steps, and put the exact phrase `ready for controller finish: delete the four dead gameLogic files` in the log line.

**Step 2: `debugTools.ts`.** Create with exactly:

```ts
// new: examples/planetforge/src/debugTools.ts

/** Developer tools (the in-app Test Runner) show only when the page address carries `?debug=1`. */
export function debugToolsEnabled(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1';
}
```

**Step 3: App.tsx and SimulationHeader.tsx.** Apply these prototype diffs (context lines are unchanged):

```diff
--- a/examples/planetforge/src/App.tsx
+++ b/examples/planetforge/src/App.tsx
@@ -24,8 +24,10 @@ import { RingVisualizer } from './components/RingVisualizer';
 import { InspectorPanel } from './components/InspectorPanel';
 import { EventLog } from './components/EventLog';
 import { TestRunnerModal } from './components/TestRunnerModal';
+import { debugToolsEnabled } from './debugTools';
 
 export default function App() {
+  const showDebugTools = debugToolsEnabled(window.location.search);
   const [world, setWorld] = useState<WorldState>(() => create_initial_world());
   const [selectedTileIdx, setSelectedTileIdx] = useState<number>(0);
   const [selectedSectorId, setSelectedSectorId] = useState<number>(0);
@@ -223,6 +225,7 @@ export default function App() {
         onSetSpeed={setSpeed}
         onResetWorld={handleResetWorld}
         onOpenTests={() => setIsTestModalOpen(true)}
+        showTestRunner={showDebugTools}
       />
 
       {/* Main God-Game Canvas Area */}
@@ -262,10 +265,12 @@ export default function App() {
       </main>
 
       {/* Verification & Test Suite Modal */}
-      <TestRunnerModal
-        isOpen={isTestModalOpen}
-        onClose={() => setIsTestModalOpen(false)}
-      />
+      {showDebugTools && (
+        <TestRunnerModal
+          isOpen={isTestModalOpen}
+          onClose={() => setIsTestModalOpen(false)}
+        />
+      )}
     </div>
   );
 }
```

```diff
--- a/examples/planetforge/src/components/SimulationHeader.tsx
+++ b/examples/planetforge/src/components/SimulationHeader.tsx
@@ -24,6 +24,8 @@ interface SimulationHeaderProps {
   onSetSpeed: (speed: number) => void;
   onResetWorld: () => void;
   onOpenTests: () => void;
+  /** Developer tools only: the Test Runner button shows when true (page opened with ?debug=1). */
+  showTestRunner?: boolean;
 }
 
 export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
@@ -36,6 +38,7 @@ export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
   onSetSpeed,
   onResetWorld,
   onOpenTests,
+  showTestRunner = false,
 }) => {
   return (
     <header className="w-full bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md px-4 lg:px-8 py-3.5 shadow-xl">
@@ -171,20 +174,23 @@ export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
           {/* Reset World */}
           <button
             onClick={onResetWorld}
-            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
+            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-bold flex items-center gap-1.5"
             title="Reset Simulation World"
           >
             <RotateCcw className="w-4 h-4" />
+            Reset world
           </button>
 
-          {/* Test Suite Runner Button */}
-          <button
-            onClick={onOpenTests}
-            className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
-          >
-            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
-            Test Suite (3/3)
-          </button>
+          {/* Test Suite Runner Button (developer tool, hidden unless ?debug=1) */}
+          {showTestRunner && (
+            <button
+              onClick={onOpenTests}
+              className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
+            >
+              <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
+              Test Suite (3/3)
+            </button>
+          )}
         </div>
       </div>
     </header>
```

**Step 4: the test.** Create `ts/tests/test_planetforge_trim.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_planetforge_trim.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { debugToolsEnabled } from '../../examples/planetforge/src/debugTools';

const read = (rel: string) => readFileSync(new URL(`../../examples/planetforge/src/${rel}`, import.meta.url), 'utf8');

describe('test_planetforge_trim', () => {
  it('developer tools show only with ?debug=1', () => {
    expect(debugToolsEnabled('')).toBe(false);
    expect(debugToolsEnabled('?game=planetforge')).toBe(false);
    expect(debugToolsEnabled('?debug=0')).toBe(false);
    expect(debugToolsEnabled('?debug=1')).toBe(true);
    expect(debugToolsEnabled('?embed=1&debug=1')).toBe(true);
  });

  it('the app gates the Test Runner button and modal on the debug flag', () => {
    const app = read('App.tsx');
    expect(app).toContain('debugToolsEnabled(window.location.search)');
    expect(app).toContain('showTestRunner={showDebugTools}');
    expect(app).toContain('{showDebugTools && (');
    const header = read('components/SimulationHeader.tsx');
    expect(header).toContain('{showTestRunner && (');
    expect(header).toContain('showTestRunner = false');
  });

  it('the reset control carries a visible label', () => {
    expect(read('components/SimulationHeader.tsx')).toContain('Reset world');
  });
});
```

(The first line, `// @vitest-environment node`, matters: without it `import.meta.url` is not a file URL and the file reads fail.)

## 4. What NOT to do

- Do not touch `examples/planetforge/src/engine/slimeEngine.ts`, `examples/planetforge/src/engine/slimeEngine.test.ts`, `examples/planetforge/src/engine/tests.ts`, `TestRunnerModal.tsx` (the modal stays, it is only hidden), the ring visualizer or the inspector. No gameplay change, no goal or win state (a separate directive), no rename of the "SlimeWorld" title (the first-step directive owns player copy).
- Do not edit `PlanetForge_Phase2b_Correction_Directive.md` or any queue row; the controller closes the Phase 2b row as Superseded.
- Do not edit `ts/src/games/planetforge/config.ts`, `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.
- No Lua, no engine changes, no deploys or rebuilds, no protected repos, no player layer or cloud saves.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_planetforge_trim.ts
```
Real tail from the prototype of exactly these edits: `Test Files  1 passed (1)` / `Tests  3 passed (3)`.
```
cd ts && npx vitest run test_registry_export.ts
```
Real tail from the prototype: `Tests  3 passed (3)` (planetforge still carries its `source`).
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; none mentions `planetforge`.
Source check (Grep tool): pattern `gameLogic` over `ts/src/games/planetforge` and over `examples/planetforge/src/` has no match (once the four files are deleted).

Controller steps, not this run: the example's own type check (the prototype passed with 0 errors), rebuilding the embed, a screenshot at 1280x720 and 390x844, and closing the queue row of `PlanetForge_Phase2b_Correction_Directive.md` as Superseded (it is a byte-for-byte copy of the finished Phase 2 directive; dispatching it would redo finished work).

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

- [ ] The four dead-code files are deleted (Glob finds none), or the log line carries `ready for controller finish: delete the four dead gameLogic files`.
- [ ] `debugTools.ts` and the test exist as above; `App.tsx` and `SimulationHeader.tsx` match the prototype diffs.
- [ ] `cd ts && npx vitest run test_planetforge_trim.ts` and `test_registry_export.ts` pass (real tails pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: which files were deleted or left for the controller, and whether the `gameLogic` Grep found any importer. Evidence second: real tails of `uv run python --version`, the vitest commands and `tsc --noEmit`.
Then say plainly what was not run (example type check, rebuild, screenshots) and that closing the Phase 2b queue row is the controller's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-planetforge-trim-dead-code-and-de-34bafa |
| Base branch | - |
| Base commit | 5be826567c74d430ac227147371a4e24ad4c3070 |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
- 2026-10-05 00:38 · robert-claude-laptop · Queued → Approved — lint override: path hits follow the verified false-positive classes in this directive family: 'do not edit' mentions (demo_lists_snapshot.json), a gitignored generated file (game-metadata.json) and app-relative paths
- 2026-10-05 00:39 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetforge-trim-dead-code-and-de-34bafa; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 00:39 · dispatcher · In progress → Blocked — setup failed before spawn: setup command 'uv sync --frozen' exited 1: supports. (os error 1142)
- 2026-10-05 00:40 · robert-claude-laptop · Blocked → Queued — requeue: setup died at uv sync (os error 1142 hard-link) in the laptop's STALE queue MCP process, which predates PR 558 copy mode; the tick-launched dispatcher has the fix
- 2026-10-09 06:48 · robert-claude-laptop · Queued → Approved
- 2026-10-09 07:05 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetforge-trim-dead-code-and-de-34bafa; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4G5DTWEE43R29N1HCAHB09C
<!-- queue:end -->
