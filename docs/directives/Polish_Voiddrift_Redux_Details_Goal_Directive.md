# VoidDrift Core Loop: developer panels behind a Details toggle, plus one visible goal

**Depends on:** `Polish_Voiddrift_Redux_TierA_Directive.md` and `VoidDrift_Redux_Save_Restore_Directive.md` merged (both edit `App.tsx`; this run assumes their final text).
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/voiddrift_redux/DIRECTION.md`, Phase 2 CUT half and Phase 3).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voiddrift_redux/DIRECTION.md`, `ts/src/games/voiddrift_redux/App.tsx`, `ts/src/games/voiddrift_redux/components/FSMInspector.tsx` (just the export line),
`ts/src/games/voiddrift_redux/components/PassFailDiagnosticsModal.tsx` (just the props), `ts/tests/test_voiddrift_redux_chrome.ts` (the "sim preserved" test).

## 1. Why this exists

First time in, VoidDrift Core Loop reads like a debugger. `DIRECTION.md`: "Dev-tool surfaces (FSMInspector 204, PassFailDiagnosticsModal 148 lines) are shown to players", and "the screen reads like a debugger, so there is no reason to come back".
It also has no goal: the parent Rust game has no win condition, so the fix is one visible target with progress and no win screen ("smelt 100 H3Gas" in the direction file).
Fact that shapes the goal: `H3Gas` is only ever added to the stockpile, by gas drilling (`ts/src/games/voiddrift_redux/simulation/engine.ts:473`: `this.stats.resources.H3Gas = (this.stats.resources.H3Gas || 0) + extractedGas;`); nothing spends it. So the stockpile is the running total, and the goal reads honestly as "collect 100 H3 Gas" (the smelter works on Raw Aluminum, not gas).
This run (a) puts the FSM inspector and the Pass/Fail telemetry button behind a "Details" toggle that starts closed, and (b) adds a goal strip with a progress bar.

## 2. Scope

1. New modules `<!-- new: ts/src/games/voiddrift_redux/simulation/goal.ts -->` and `<!-- new: ts/src/games/voiddrift_redux/components/GoalStrip.tsx -->`.
2. `ts/src/games/voiddrift_redux/App.tsx`: the toggle and the strip (five small edits below).
3. New test `<!-- new: ts/tests/test_voiddrift_redux_goal.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1: `goal.ts`**, exactly:
```
export const H3_GOAL_TARGET = 100;

export interface GoalProgress {
  current: number;
  target: number;
  percent: number;
  reached: boolean;
}

/** H3 Gas is only ever added to the stockpile (drilling), so the stock is the running total. */
export function h3GoalProgress(h3Gas: number, target: number = H3_GOAL_TARGET): GoalProgress {
  const safe = Number.isFinite(h3Gas) && h3Gas > 0 ? h3Gas : 0;
  const current = Math.min(safe, target);
  return { current, target, percent: Math.round((current / target) * 100), reached: safe >= target };
}
```
**Step 2: `GoalStrip.tsx`**, exactly:
```
import React from 'react';
import { h3GoalProgress } from '../simulation/goal';

interface GoalStripProps {
  h3Gas: number;
}

export const GoalStrip: React.FC<GoalStripProps> = ({ h3Gas }) => {
  const goal = h3GoalProgress(h3Gas);
  return (
    <div id="voiddrift-goal-strip" className="bg-slate-900 border border-pink-900/50 rounded-xl px-4 py-3 font-mono text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-pink-300 font-bold uppercase tracking-wider">Goal: collect 100 H3 Gas</span>
        <span className="text-slate-200">{goal.current} / {goal.target}</span>
      </div>
      <div className="mt-2 h-1.5 rounded bg-slate-800 overflow-hidden">
        <div className="h-full bg-pink-400" style={{ width: `${goal.percent}%` }} />
      </div>
      {goal.reached && (
        <p className="mt-2 text-emerald-300">Goal reached. The drift has no end, so keep mining as long as you like.</p>
      )}
    </div>
  );
};
```
**Step 3: `App.tsx`, five edits.**
1. Under `import { SignalStrip } from './components/SignalStrip';` add `import { GoalStrip } from './components/GoalStrip';`.
2. Under `  const [soundMuted, setSoundMuted] = useState<boolean>(false);` add `  const [showDetails, setShowDetails] = useState<boolean>(false);`.
3. In the `headerExtra` block, replace the whole `<button id="open-diagnostics-btn" ...> ... Pass/Fail Telemetry </button>` element (the one with the `ShieldCheck` icon) with:
```
            <button
              id="voiddrift-details-btn"
              onClick={() => setShowDetails((v) => !v)}
              aria-pressed={showDetails}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono font-bold text-xs text-slate-400 hover:text-slate-100 hover:border-slate-600 transition shrink-0"
            >
              {showDetails ? 'Hide details' : 'Details'}
            </button>
            {showDetails && (
              <button
                id="open-diagnostics-btn"
                onClick={() => setIsModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-2 transition shrink-0 ${
                  stats.boundaryTelemetry.isBoundaryValid && stats.boundaryTelemetry.ring2GatedMiningValid
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/50'
                    : 'bg-rose-950/50 border-rose-500/60 text-rose-300 hover:bg-rose-900/50 animate-pulse'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Pass/Fail Telemetry
              </button>
            )}
```
(the button body is unchanged apart from the extra indent and the wrapper.)
4. Directly above `            <SimulationControlsPanel` (inside the left `<section id="canvas-section">`) add `            <GoalStrip h3Gas={stats.resources?.H3Gas || 0} />` followed by a blank line. Then replace the `<FSMInspector ... />` element in the right column with the same element wrapped in `{showDetails && ( ... )}`:
```
            {showDetails && (
              <FSMInspector
                miningDrones={engine.miningDrones}
                haulers={engine.haulers}
                selectedDroneId={selectedDroneId}
                onSelectDrone={setSelectedDroneId}
                onToggleDroneTier={handleToggleMiningDroneTier}
              />
            )}
```
5. Change `isOpen={isModalOpen}` on `<PassFailDiagnosticsModal` to `isOpen={isModalOpen && showDetails}`.

**Step 4: test**, exactly `ts/tests/test_voiddrift_redux_goal.ts`:
```
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { H3_GOAL_TARGET, h3GoalProgress } from '../src/games/voiddrift_redux/simulation/goal';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/voiddrift_redux/App.tsx'),
  'utf8'
);

describe('VoidDrift Core Loop soft goal', () => {
  it('targets 100 H3 Gas', () => {
    expect(H3_GOAL_TARGET).toBe(100);
  });

  it('reports progress, capped at the target', () => {
    expect(h3GoalProgress(0)).toEqual({ current: 0, target: 100, percent: 0, reached: false });
    expect(h3GoalProgress(37)).toEqual({ current: 37, target: 100, percent: 37, reached: false });
    expect(h3GoalProgress(100)).toEqual({ current: 100, target: 100, percent: 100, reached: true });
    expect(h3GoalProgress(250)).toEqual({ current: 100, target: 100, percent: 100, reached: true });
  });

  it('treats negative and non-finite input as zero', () => {
    expect(h3GoalProgress(-5).current).toBe(0);
    expect(h3GoalProgress(Number.NaN).current).toBe(0);
  });
});

describe('VoidDrift Core Loop details toggle', () => {
  it('hides the FSM inspector and diagnostics behind a Details toggle that starts closed', () => {
    expect(appSource).toContain('const [showDetails, setShowDetails] = useState<boolean>(false);');
    expect(appSource).toContain('id="voiddrift-details-btn"');
    expect(appSource).toMatch(/\{showDetails && \(\s*<FSMInspector/);
    expect(appSource).toMatch(/\{showDetails && \(\s*<button\s+id="open-diagnostics-btn"/);
    expect(appSource).toContain('isOpen={isModalOpen && showDetails}');
  });

  it('shows the goal strip in the default view', () => {
    expect(appSource).toContain('<GoalStrip h3Gas={stats.resources?.H3Gas || 0} />');
  });
});
```

## 4. What NOT to do

- No win screen, no ending, no "victory" text: the goal is a progress bar that stays full once reached (the parent game has no win condition).
- Do not delete `FSMInspector` or `PassFailDiagnosticsModal` or change their files; they stay mounted-on-demand. The existing "sim preserved" test only checks that `App.tsx` still mentions them, and it must keep passing unchanged.
- No changes to the engine, the smelter, the radar, the canvas, saves or the title/primer flow.
- No new resources, no balance changes, no seeded RNG.
- No Lua, no shared-engine changes, no deploys, no protected repos, no player-layer work.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline with the two earlier directives merged (prototype state): `cd ts && npx vitest run test_voiddrift_redux_save.ts test_voiddrift_redux_restart.ts test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts` gives `Test Files  4 passed (4)` / `Tests  34 passed (34)`.

After editing:
```
cd ts && npx vitest run test_voiddrift_redux_goal.ts test_voiddrift_redux_save.ts test_voiddrift_redux_restart.ts test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts
```
Expected `Test Files  5 passed (5)` / `Tests  39 passed (39)` (5 new; real prototype tail for all five: `Test Files  5 passed (5)` / `Tests  39 passed (39)`).
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool): `App.tsx` contains `isOpen={isModalOpen && showDetails}` once and `<GoalStrip h3Gas=` once.

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

- [ ] `goal.ts` and `GoalStrip.tsx` exist as pasted; `App.tsx` has the five edits.
- [ ] A fresh load shows the goal strip and a "Details" button, and no FSM inspector or Pass/Fail button until Details is pressed.
- [ ] The five-file test command passes (real tail pasted) and `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the Scope list changed; the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files and the real test counts. Evidence second: the real tails.
**Controller finish (after merge):** `cd ts && npm run build:voiddrift_redux`, then phone and desktop screenshots with Details closed and open.
Recommended action: review, merge.

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
| Branch | directive/rfdgamestudio-polish-voiddrift-redux-details-go-d5e193 |
| Base branch | - |
| Base commit | b3807777d3f96c14a0a576c7e920f89ffa2e026d |
| Head commit | 0a9fe79311c64ba9de8206a36beaae9415b6e7c4 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 13:26 · robert-claude-laptop · none → Queued
- 2026-10-09 01:11 · devin (delegated) · Queued → Approved — under delegate.band-normal, delegate.rate-limit
- 2026-10-09 01:11 · dispatcher · Approved → In progress — dispatched devin on hometower in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-voiddrift-redux-details-go-d5e193; lane=strong; model=default; persona=steady-builder; agent_id=01M4FH6D49G9K8VKN2YEDSFA5G
- 2026-10-09 01:12 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-voiddrift-redux-details-go-d5e193; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-09 01:15 · devin (delegated) · In progress → Review — devin · vitest 5 files/39 tests passed; tsc --noEmit clean; goal.ts + GoalStrip.tsx + goal test added; App.tsx five edits applied; under delegate.envelope [origin]
- 2026-10-09 23:46 · robert-claude-laptop · Review → Done — note: PR #255 merged 2026-10-10 after Sonnet review (Test Files 5 passed, Tests 39 passed; tsc clean apart from pre-existing game-metadata.json).
<!-- queue:end -->
