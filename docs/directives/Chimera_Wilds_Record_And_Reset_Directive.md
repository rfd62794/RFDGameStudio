# Chimera Wilds: keep your win-loss record between visits, with a Reset button

**Depends on:** `Chimera_Wilds_Fix_Unwinnable_Balance_Directive.md` merged first (both edit `ts/src/games/chimera_wilds/App.tsx`, on different lines; running in order avoids a conflict).

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/chimera_wilds/App.tsx`, `ts/src/games/chimera_wilds/types.ts` (`EncounterResult`), `ts/src/engine/shared/persistence.ts` (`loadSave`, `writeSave`, `clearSave`),
`docs/demos/chimera_wilds/SCOPE.md` (Rough: "state is in-memory only"), `docs/demos/chimera_wilds/DIRECTION.md` (Phase 1: "a persisted record, and a visible Reset").

## 1. Why this exists

The win/loss record lives only in memory: the only `writeSave` call is the tutorial flag (`TUTORIAL_SEEN_KEY`). Reload the page and the "Record 3W - 2L" chip and the History list are gone,
and there is no way to start fresh except reloading. The polish standard asks for a visible Restart (A3). Once the fight is winnable (previous directive) a record is worth keeping.

The shared persistence helper already exists and is used the same way by other games: `loadSave<T>(key, { version })` never throws and returns null for missing or malformed data;
`writeSave(key, value, { version })` and `clearSave(key)` swallow storage errors.

## 2. Scope

1. New module `<!-- new: ts/src/games/chimera_wilds/utils/record.ts -->` (load, save, clear the record).
2. `ts/src/games/chimera_wilds/App.tsx`: load the record into the initial state, save it whenever state changes, and a two-step "Reset record" button.
3. New test `<!-- new: ts/tests/test_chimera_wilds_record.ts -->`.

## 3. The work

**Step 1.** Create `<!-- new: ts/src/games/chimera_wilds/utils/record.ts -->` with exactly:

```ts
import { clearSave, loadSave, writeSave } from '../../../engine/shared/persistence';
import type { EncounterResult } from '../types';

export const RECORD_KEY = 'chimera_wilds_record';
export const RECORD_LIMIT = 50;

function isEncounter(value: unknown): value is EncounterResult {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Partial<EncounterResult>;
  return typeof e.won === 'boolean' && typeof e.score === 'number'
    && typeof e.chimera_score === 'number' && typeof e.roll === 'number';
}

/** Saved encounters, newest first. Anything malformed is dropped, never thrown. */
export function loadRecord(): EncounterResult[] {
  const saved = loadSave<unknown>(RECORD_KEY, { version: 1 });
  if (!Array.isArray(saved)) return [];
  return saved.filter(isEncounter).slice(0, RECORD_LIMIT);
}

export function saveRecord(history: EncounterResult[]): void {
  writeSave(RECORD_KEY, history.slice(0, RECORD_LIMIT), { version: 1 });
}

export function clearRecord(): void {
  clearSave(RECORD_KEY);
}
```

**Step 2.** Apply exactly this diff to `ts/src/games/chimera_wilds/App.tsx` (the context lines are real; if one differs, STOP and say so in the Status row):

```diff
diff --git a/ts/src/games/chimera_wilds/App.tsx b/ts/src/games/chimera_wilds/App.tsx
index f7853865..d213889e 100644
--- a/ts/src/games/chimera_wilds/App.tsx
+++ b/ts/src/games/chimera_wilds/App.tsx
@@ -1,4 +1,4 @@
-import { useCallback, useState } from 'react';
+import { useCallback, useEffect, useState } from 'react';
 import { Volume2, VolumeX } from 'lucide-react';
 import { GameShell } from '../../components';
 import { useLuaCall, useGameState } from '../../hooks';
@@ -9,6 +9,7 @@ import { STANDALONE_BUILD_GAMES } from '../../games/registry';
 import { PaperDoll } from '../../engine/paperDoll';
 import { loadSave, writeSave } from '../../engine/shared/persistence';
 import { sound } from './utils/sound';
+import { clearRecord, loadRecord, saveRecord } from './utils/record';
 import type { GameRendererProps, GameSession } from '../../engine/types';
 import type { Part, Chimera, EncounterResult, ChimeraWildsGameState } from './types';
 import './styles.css';
@@ -23,7 +24,7 @@ function buildInitialState(session: GameSession): ChimeraWildsGameState {
     player: baseline,
     currentChimera: null,
     lastResult: null,
-    history: [],
+    history: loadRecord(),
   };
 }
 
@@ -49,6 +50,17 @@ export default function App({ session }: GameRendererProps) {
   const { shouldShow: showTutorial, handleComplete: completeTutorial, trigger: triggerTutorial } =
     useOnboardingGate({ mode: 'boolean', initialShow: false });
   const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());
+  const [confirmingReset, setConfirmingReset] = useState(false);
+
+  useEffect(() => {
+    if (state) saveRecord(state.history);
+  }, [state]);
+
+  const handleResetRecord = useCallback(() => {
+    clearRecord();
+    setState(prev => prev ? { ...prev, currentChimera: null, lastResult: null, history: [] } : prev);
+    setConfirmingReset(false);
+  }, []);
 
   const handleNewGame = useCallback(() => {
     setShowTitle(false);
@@ -226,6 +238,17 @@ export default function App({ session }: GameRendererProps) {
         <div className="cw-panel">
           <h2>Encounter</h2>
           <button className="cw-button" onClick={handleEncounter}>Face the Wilds</button>
+          {state.history.length > 0 && (
+            confirmingReset ? (
+              <div className="cw-reset-confirm">
+                <span>Erase your record and start fresh?</span>
+                <button className="cw-button" onClick={handleResetRecord}>Yes, start fresh</button>
+                <button className="cw-button" onClick={() => setConfirmingReset(false)}>Keep playing</button>
+              </div>
+            ) : (
+              <button className="cw-button cw-reset" onClick={() => setConfirmingReset(true)}>Reset record</button>
+            )
+          )}
           {state.lastResult && (
             <div className="cw-result">
               <span className={`cw-badge ${state.lastResult.won ? 'cw-win' : 'cw-loss'}`}>
```

The Reset button asks "Erase your record and start fresh?" and only wipes after "Yes, start fresh"; "Keep playing" cancels. It is hidden until there is something to reset. The chimera on screen and the last result are cleared with the record.

**Step 3.** Create `<!-- new: ts/tests/test_chimera_wilds_record.ts -->` with exactly:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RECORD_KEY, RECORD_LIMIT, clearRecord, loadRecord, saveRecord } from '../src/games/chimera_wilds/utils/record';
import type { EncounterResult } from '../src/games/chimera_wilds/types';

const appSource = readFileSync(resolve(import.meta.dirname, '../src/games/chimera_wilds/App.tsx'), 'utf8');

function entry(won: boolean, roll = 10): EncounterResult {
  return { won, score: 185, chimera_score: 180, roll, chimera: { parts: {}, part_ids: {}, total_power: 100, total_endurance: 80 } };
}

describe('chimera_wilds persisted record', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a saved record, newest first', () => {
    saveRecord([entry(true, 20), entry(false, 3)]);
    const loaded = loadRecord();
    expect(loaded.map(e => e.roll)).toEqual([20, 3]);
    expect(loaded.map(e => e.won)).toEqual([true, false]);
  });

  it('keeps at most RECORD_LIMIT entries', () => {
    saveRecord(Array.from({ length: RECORD_LIMIT + 10 }, (_, i) => entry(i % 2 === 0, (i % 20) + 1)));
    expect(loadRecord()).toHaveLength(RECORD_LIMIT);
  });

  it('returns an empty record for missing or malformed data', () => {
    expect(loadRecord()).toEqual([]);
    localStorage.setItem(RECORD_KEY, '{not json');
    expect(loadRecord()).toEqual([]);
    localStorage.setItem(RECORD_KEY, JSON.stringify({ v: 1, data: [{ nope: 1 }, entry(true)] }));
    expect(loadRecord()).toHaveLength(1);
  });

  it('clearRecord removes the saved record', () => {
    saveRecord([entry(true)]);
    clearRecord();
    expect(localStorage.getItem(RECORD_KEY)).toBeNull();
    expect(loadRecord()).toEqual([]);
  });

  it('App wires load, save and a two-step Reset record button', () => {
    expect(appSource).toContain('history: loadRecord()');
    expect(appSource).toContain('saveRecord(state.history)');
    expect(appSource).toContain('Reset record');
    expect(appSource).toContain('Yes, start fresh');
    expect(appSource).toContain('Keep playing');
  });
});
```

## 4. What NOT to do

- Do not change `logic.lua`, `data.yaml`, the balance numbers, `ts/src/engine/`, or the shared persistence module.
- Do not change the tutorial flag key (`chimera_wilds_tutorial_seen`) or the title screen.
- Do not add new CSS classes in `styles.css` (the new `cw-reset` and `cw-reset-confirm` classes may be unstyled for now; the existing `cw-button` styles apply).
- Do not save the current chimera or last result (only the history list is the record).

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_chimera_paper_doll_port.ts
```
Real tail: `Tests  40 passed (40)`.

After editing (verified on a prototype of exactly this change):
```
cd ts && npx vitest run test_chimera_wilds_record.ts test_chimera_paper_doll_port.ts
```
Real tail: `Test Files  2 passed (2)` / `Tests  45 passed (45)`.

Type check:
```
cd ts && npx tsc --noEmit
```
Real baseline and prototype result are identical: 4 errors, all `Cannot find module '../games/game-metadata.json'` (a generated file absent from a fresh worktree). Any error mentioning `chimera_wilds` is yours: fix it.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Allowed commands are only: `uv run pytest ...`, `cd ts && npx vitest run <bare filename>`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`, `git add`, `git commit`.
  Do NOT run `npm run build:*`, `vite-node`, `agentflow lint` or any agentflow command, `git merge`, or `uv run python -m studio.demos index` (the sandbox refuses them).
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files edited use CRLF line endings where the file already has them; keep them (the Edit tool preserves them). Do not convert.
- New logic goes in small new modules; no file over 600 lines.
- Player-facing text (blurbs, buttons, messages) is plain, welcoming and free of developer jargon.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/src/games/chimera_wilds/utils/record.ts` and the test file exist with the content above; `App.tsx` matches the diff and nothing else changed in it.
- [ ] `cd ts && npx vitest run test_chimera_wilds_record.ts test_chimera_paper_doll_port.ts` shows 2 files, 45 tests passed (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new error (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the three files. Evidence second: real tails of `uv run python --version`, vitest and tsc.
Then say plainly: clicking through (play, reload, record still there, Reset record, confirm) needs a browser. Controller finish: Robert or Claude rebuilds with `npm run build:chimera_wilds` and checks it by hand.
Recommended action: review, merge, then the controller's hand check.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-chimera-wilds-record-and-reset-directive |
| Base branch | - |
| Base commit | 658d4f71d39a3b5c381d8729d34eba8e5cf28fa4 |

**Status log**
- 2026-10-04 13:22 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified TS build (record.ts, App.tsx diff, test); dispatch only after Chimera_Wilds_Fix_Unwinnable_Balance merges.
- 2026-10-08 03:26 · robert-claude-laptop · Queued → Approved
- 2026-10-08 03:27 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-chimera-wilds-record-and-reset-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4D6HY2GV5PC2XFBNDZHH6NG
- 2026-10-08 03:27 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-chimera-wilds-record-and-reset-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
