# VoidDrift Core Loop Tier A: a text Restart that returns to the title, and a build script

**Depends on:** none.
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/voiddrift_redux/DIRECTION.md`, Phase 1).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voiddrift_redux/DIRECTION.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, A3 and A7),
`ts/src/games/voiddrift_redux/App.tsx`, `ts/src/games/voiddrift_redux/components/SimulationControlsPanel.tsx`,
`ts/src/standalone/succession/entry.tsx`, `ts/src/standalone/succession/index.html`, `ts/vite.succession.config.ts`, `ts/package.json` (lines 9-21),
`ts/tests/test_voiddrift_redux_chrome.ts`.

## 1. Why this exists

VoidDrift Core Loop (`voiddrift_redux`, status `dev`) is the studio's TS-native idle-mining game: scout, mining and hauler drones, orbital fragments, a smelter.
The 2026-10-03 audit (`docs/state/demo-audit-batch2-2026-10-03.md`, row `voiddrift_redux`) failed A3: "no restart label (PAUSE, 1x/2x/4x)".
The reset control exists but is an icon with no words: `ts/src/games/voiddrift_redux/components/SimulationControlsPanel.tsx` lines 48-55 render `<button id="sim-reset-btn" ... title="Reset World"><RotateCcw className="w-3.5 h-3.5" /></button>`, and `App.tsx` `handleResetSimulation` (line 71) rebuilds the world but stays on the sim screen.
A7 also fails: `grep -n "build:" ts/package.json` lists 13 per-game scripts (lines 9-21, `build:dissonance` through `build:choke_point`) and none is `build:voiddrift_redux`.
This run fixes exactly those two: a text "Restart" that resets the world and returns to the title screen (A3), and `build:voiddrift_redux` (A7).

## 2. Scope

Copied from `docs/demos/voiddrift_redux/DIRECTION.md` Phase 1: "CUT: the icon-only reset (unclear to players). ADD: a text 'Restart' returning to the title screen, and `build:voiddrift_redux`."

1. `ts/src/games/voiddrift_redux/App.tsx`: a `handleRestart` and the prop wiring.
2. `ts/src/games/voiddrift_redux/components/SimulationControlsPanel.tsx`: the reset button gets the word "Restart".
3. New files `<!-- new: ts/vite.voiddrift_redux.config.ts -->`, `<!-- new: ts/src/standalone/voiddrift_redux/entry.tsx -->`, `<!-- new: ts/src/standalone/voiddrift_redux/index.html -->`, and one line in `ts/package.json`.
4. New test `<!-- new: ts/tests/test_voiddrift_redux_restart.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1: `App.tsx`.** Directly above the existing line `  const handleUpdateConfig = (newConfig: Partial<SimulationConfig>) => {` insert:
```
  const handleRestart = () => {
    handleResetSimulation();
    setScreen('title');
  };

```
(`handleResetSimulation` and `setScreen` already exist: lines 71-77 and `const [screen, setScreen] = useState<'title' | 'sim'>('title');`.) Then change the prop on `<SimulationControlsPanel ... />` from
`onResetSimulation={handleResetSimulation}` to `onResetSimulation={handleRestart}`. Do not change `handleResetSimulation` itself.

**Step 2: `SimulationControlsPanel.tsx`.** Replace the button at lines 48-55 with:
```
          <button
            id="sim-reset-btn"
            onClick={onResetSimulation}
            className="px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 text-slate-300 hover:text-slate-100 bg-slate-950 border border-slate-800 rounded transition"
            title="Restart from the title screen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
```

**Step 3: build script.** Mirror `succession` exactly (this was built and checked once before this directive was written: `vite v6`, `built in 4.80s`, exit 0, `assets/index-BrowwY6G.js 297.32 kB`).
- `ts/vite.voiddrift_redux.config.ts`:
```
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig('voiddrift_redux');
```
- `ts/src/standalone/voiddrift_redux/entry.tsx`:
```
import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/voiddrift_redux/App';
import type { GameSession } from '../../engine/types';

const session: GameSession = {
  gameId: 'voiddrift_redux',
  files: {
    gameId: 'voiddrift_redux',
    data: {},
    ui: {},
    logic: '',
    engineSource: '',
  },
  executor: {
    call: () => [],
  },
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
```
- `ts/src/standalone/voiddrift_redux/index.html`:
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidDrift Redux</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./entry.tsx"></script>
  </body>
</html>
```
- `ts/package.json`: add this line directly after the existing `"build:choke_point": ...` line (line 21), keeping the trailing comma:
```
    "build:voiddrift_redux": "vite build --config vite.voiddrift_redux.config.ts",
```
The build writes `ts/dist-voiddrift_redux/`, which is gitignored (`dist*/`): do not commit it. Do not add a deploy entry anywhere.

**Step 4: test.** Create `ts/tests/test_voiddrift_redux_restart.ts` with exactly:
```
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * test_voiddrift_redux_restart
 *
 * Tier A (A3, A7) for VoidDrift Core Loop: a text Restart control that returns
 * to the title screen, and a standalone build script. Asserted at source level
 * per suite convention (see test_voiddrift_redux_chrome).
 */

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const appSource = read('src/games/voiddrift_redux/App.tsx');
const panelSource = read('src/games/voiddrift_redux/components/SimulationControlsPanel.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

describe('VoidDrift Core Loop restart', () => {
  it('shows a text Restart button on the reset control', () => {
    expect(panelSource).toContain('id="sim-reset-btn"');
    expect(panelSource).toMatch(/<RotateCcw[^>]*\/>\s*Restart\s*<\/button>/);
  });

  it('restart resets the world and returns to the title screen', () => {
    expect(appSource).toContain('const handleRestart = () => {');
    expect(appSource).toMatch(/handleRestart = \(\) => \{\s*handleResetSimulation\(\);\s*setScreen\('title'\);/);
    expect(appSource).toContain('onResetSimulation={handleRestart}');
  });
});

describe('VoidDrift Core Loop standalone build', () => {
  it('has the three standalone files', () => {
    expect(existsSync(resolve(root, 'vite.voiddrift_redux.config.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voiddrift_redux/entry.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voiddrift_redux/index.html'))).toBe(true);
  });

  it('points the entry at the game App and the config at the factory', () => {
    expect(read('src/standalone/voiddrift_redux/entry.tsx')).toContain("'../../games/voiddrift_redux/App'");
    expect(read('vite.voiddrift_redux.config.ts')).toContain("makeStandaloneConfig('voiddrift_redux')");
  });

  it('registers the build:voiddrift_redux script', () => {
    expect(packageJson.scripts['build:voiddrift_redux']).toBe('vite build --config vite.voiddrift_redux.config.ts');
  });
});
```

## 4. What NOT to do

- No change to the simulation (`simulation/engine.ts`), the orbital canvas, the other panels, the title screen or the primer.
- No saves, no Details toggle, no goal (those are the two directives that follow this one).
- No rename of labels or ids (a separate naming directive owns that).
- No Lua, no engine changes, no edits to shared components under `ts/src/ui/components/` or to `ts/vite.standalone.factory.ts`.
- No deploys, no protected repos, no player-layer or cloud saves.
- Do not edit `ts/tests/test_voiddrift_redux_chrome.ts` or `ts/tests/test_voiddrift_redux_engine.ts`; they must keep passing unchanged.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (no Python is changed; standing interpreter check). Verified on this machine: `Python 3.12.12`.

Baseline, before editing (verified on origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts
```
Real tail: `Test Files  2 passed (2)` / `Tests  20 passed (20)`.

After editing:
```
cd ts && npx vitest run test_voiddrift_redux_restart.ts test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts
```
Expected: `Test Files  3 passed (3)` / `Tests  25 passed (25)` (5 new). Real prototype tail for the first two files: `Test Files  2 passed (2)` / `Tests  15 passed (15)`.

Regression (same form), baseline `Test Files  3 passed (3)` / `Tests  11 passed (11)`, and the same after:
```
cd ts && npx vitest run test_standalone_factory.ts test_registry_export.ts test_collect_configs.ts
```
Type check, prints nothing when clean (verified with the change applied):
```
cd ts && npx tsc --noEmit
```
If it reports only `Cannot find module '../games/game-metadata.json'`, the worktree lacks that gitignored file: write that in the Status row and do not hunt for it.

Source check (Grep tool, one call each): `ts/package.json` contains `"build:voiddrift_redux"` once; `ts/src/games/voiddrift_redux/App.tsx` contains `onResetSimulation={handleRestart}` once.

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

- [ ] The reset control reads "Restart", and restarting resets the world and shows the title screen.
- [ ] `ts/vite.voiddrift_redux.config.ts`, `ts/src/standalone/voiddrift_redux/entry.tsx` and `index.html` exist; `ts/package.json` has `build:voiddrift_redux`.
- [ ] `cd ts && npx vitest run test_voiddrift_redux_restart.ts test_voiddrift_redux_chrome.ts test_voiddrift_redux_engine.ts` passes (real tail pasted).
- [ ] The regression command passes (real tail pasted) and `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the Scope list changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files changed and the real test counts. Evidence second: the real tails of `uv run python --version`, the vitest commands and `tsc`.
**Controller finish (after merge, not this run):** `cd ts && npm run build:voiddrift_redux` must exit 0 (the sandbox refuses `npm run build:*`), then screenshots of the title screen and the sim with the Restart button at 1280 and 390 wide.
Recommended action: review, merge, then run the voiddrift_redux save directive (`VoidDrift_Redux_Save_Restore_Directive.md`).

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
| Status | In progress |
| Assigned to | devin-any |
| Branch | directive/rfdgamestudio-polish-voiddrift-redux-tiera-directive |
| Base branch | - |
| Base commit | d6102b3218ee3f3c84ab2ad16622ded90c52a9cc |

**Status log**
- 2026-10-04 13:26 · robert-claude-laptop · none → Queued
- 2026-10-08 18:46 · robert-claude-laptop · Queued → Approved
- 2026-10-08 19:00 · dispatcher · Approved → In progress — dispatched devin-any on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-voiddrift-redux-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4EVY8M0AXZGC8XCN2E2536T
<!-- queue:end -->
