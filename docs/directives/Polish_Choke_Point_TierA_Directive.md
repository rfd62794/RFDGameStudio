# Choke Point Tier A polish: in-play Restart, victory screen, build script, phone fit

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/choke_point/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, items A1-A8),
`ts/src/games/choke_point/App.tsx`, `ts/src/games/choke_point/types.ts`, `ts/src/games/choke_point/styles.css`,
`ts/tests/test_choke_point_ui.ts`, `ts/vite.slime_coin.config.ts`, `ts/src/standalone/slime_coin/entry.tsx`,
`ts/src/standalone/slime_coin/index.html`.

## 1. Why this exists

Choke Point is a small Lua-driven turn-based grid defense (2 waves, 2 enemy types, 2 tower types), a `dev` game at
`ts/src/games/choke_point/`, hosted through the arcade. The loop is complete: place towers, commit the turn, waves advance,
and the Lua logic writes `Victory! All waves cleared!` or the core is breached. The 2026-10-03 audit
(`docs/state/demo-audit-batch1-2026-10-03.md`, row `choke_point`) found Restart is not available during play (A3), the
React app has no victory screen (only the loss card has a next action), and there is no `build:choke_point` script
(A7). This run is a Tier A refine pass on exactly those, plus a phone-width fit (A4). Robert's direction is in
`docs/demos/choke_point/SCOPE.md` (class: refine, effort S, open question: none).

## 2. Scope

Copied from `docs/demos/choke_point/SCOPE.md`.

Top 3 changes, in order:
1. Tier A: in-play Restart, victory screen with next action, `build:choke_point`, phone check.
2. Headless Lua-state test over all waves (no softlock, win reachable).
3. More waves/enemy variety in data.yaml only (data, not logic).

Out of scope: new tower classes needing new Lua mechanics, larger grid, meta-progression, art overhaul.

Tier A boundary: this run does change 1 only, in full. Changes 2 and 3 are Tier B and content work and are NOT in this run:
do not add a headless wave test and do not edit `games/choke_point/data.yaml` or `games/choke_point/logic.lua`. The phone
check (A4) here is a CSS fix; the two phone screenshots are the reviewer's step, not this run's (no browser available).

## 3. The work

Note: the files under `ts/` use CRLF line endings in the worktree. Keep them (the Edit tool preserves them); do not convert.

**Step 1: victory detection, a small new module.** Create `<!-- new: ts/src/games/choke_point/outcome.ts -->`:
```
import type { ChokePointGameState } from './types';

// Exact line the Lua commit_turn writes when the last wave is cleared (games/choke_point/logic.lua).
export const VICTORY_LOG = 'Victory! All waves cleared!';

export function isVictory(state: ChokePointGameState): boolean {
  return state.core_hp > 0 && (state.history ?? []).includes(VICTORY_LOG);
}
```
(`ChokePointGameState` in `ts/src/games/choke_point/types.ts` has `core_hp: number` and `history: string[]`. The Lua sets
`next_state.history = log_entries` on every commit, so the victory line is present in `history` right after the winning turn.)

**Step 2: App wiring.** Edit `ts/src/games/choke_point/App.tsx` (265 lines; must stay under 600). Current facts:

- Imports, current lines 15-17:
```
import type { GameRendererProps, GameSession } from '../../engine/types';
import type { ChokePointGameState, TowerType } from './types';
import './styles.css';
```
  Add `import { isVictory } from './outcome';` after the `./types` import.
- The existing reset handler, current lines 58-60 (leave it as it is; the loss card's "Reset Grid" keeps using it):
```
  const handleReset = useCallback(() => {
    setState(buildInitialState(session));
  }, [session, setState]);
```
  Directly after it add a restart that also returns to the title (A3: Restart returns to the first screen without a page reload):
```
  const handleRestart = useCallback(() => {
    handleReset();
    setShowTitle(true);
  }, [handleReset]);
```
  (`showTitle` / `setShowTitle` already exist: `const [showTitle, setShowTitle] = useState(true);`, current line 32.)
- Current lines 90-98 (after the title early-return):
```
  const isGameOver = state.core_hp <= 0;

  return (
    <GameShell
      gameId="choke_point"
      gameLabel="Choke Point"
      className="choke-point-container font-mono bg-slate-950 text-slate-100 min-h-screen p-4"
    >
      {isGameOver ? (
```
  Add `const isWon = isVictory(state);` after the `isGameOver` line, and change `{isGameOver ? (` to
  `{isWon ? (` followed by a victory card and then `) : isGameOver ? (` so the existing loss card is unchanged:
```
      {isWon ? (
        <Card className="max-w-md mx-auto mt-12 p-6 border-emerald-500 bg-emerald-950/20 text-center">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4 font-mono">DEFENSE HELD</h2>
          <p className="text-slate-300 mb-6 font-mono">All waves cleared. The core is intact.</p>
          <Button onClick={handleRestart} variant="primary" className="w-full justify-center" label="Play Again" />
        </Card>
      ) : isGameOver ? (
```
- The commit bar, current lines 183-196. Add `flex-wrap` to its first line, and a Restart button immediately before the
  Commit Turn button (so Restart is visible throughout play):
```
            <div className="flex justify-between items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Preview Vector Simulation</h3>
                <p className="text-xs text-slate-400">Threats announce their targets. Block their vectors or destroy them.</p>
              </div>
              <Button
                onClick={handleCommit}
```
  becomes: first line gains `flex-wrap` (`flex flex-wrap justify-between items-center gap-4 ...`), and the line
  `              <Button onClick={handleRestart} variant="secondary" size="lg" label="Restart" />` is inserted between the
  closing `</div>` of the text block and `<Button onClick={handleCommit}`. Do not change the Commit Turn button.

**Step 3: phone fit (A4).** `ts/src/games/choke_point/styles.css` (46 lines) currently lays out `.choke-point-grid` as
`grid-template-columns: 2fr 1fr;` and `.defense-grid` as `grid-template-columns: repeat(6, 1fr);`, which cannot fit 390 px.
Append this block at the end of the file (leave the existing rules alone):
```
@media (max-width: 640px) {
  .choke-point-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    padding: 0.5rem;
  }

  .defense-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 2px;
    padding: 4px;
  }
}
```

**Step 4: tests.** Create `<!-- new: ts/tests/test_choke_point_restart.ts -->`. It reuses the exact render pattern of
`ts/tests/test_choke_point_ui.ts` (same imports: `describe, it, expect` from `vitest`, `React`, `createRoot` from
`react-dom/client`, `act` from `react-dom/test-utils`, `loadGame` from `../src/engine/runtime`, `App` from
`../src/games/choke_point/App`) plus `isVictory, VICTORY_LOG` from `../src/games/choke_point/outcome`. Two tests, with the
numbers in the names:
- `test_isVictory_true_only_with_victory_log_and_core_alive`: a state `{ wave: 2, round: 3, energy: 5, core_hp: 4, towers: [], enemies: [], history: [VICTORY_LOG] }`
  gives `true`; the same with `core_hp: 0` gives `false`; the same with `history: ['Wave 1 cleared!']` gives `false`.
- `test_restart_returns_to_title`: render `App` with `loadGame('choke_point')`, click the button whose text includes
  `Establish Connection`, assert a button whose text includes `Restart` exists, click it, assert the container text again
  contains `Establish Connection`. Unmount the root at the end.

**Step 5: `build:choke_point` (A7).** Mirror `slime_coin` exactly; this was built and checked once before this directive
was written (`vite v6.4.3`, `1710 modules transformed`, `built in 10.27s`, exit 0). Create three files:

- `<!-- new: ts/vite.choke_point.config.ts -->` with exactly:
```
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig('choke_point');
```
- `<!-- new: ts/src/standalone/choke_point/entry.tsx -->`: a copy of `ts/src/standalone/slime_coin/entry.tsx` (read it, 65
  lines) with every occurrence of `slime_coin` replaced by `choke_point` (the `App` import path, the three `?raw` yaml
  imports, the three `import.meta.glob` patterns stay as in the original apart from the id, and `const gameId = 'choke_point';`).
- `<!-- new: ts/src/standalone/choke_point/index.html -->`: a copy of `ts/src/standalone/slime_coin/index.html` with
  `<title>SlimeCoin</title>` replaced by `<title>Choke Point</title>`.

Then add the script to `ts/package.json`, next to the other `build:` scripts. Current lines 17-19 (the existing style to copy;
add the new line after line 19, keeping the trailing comma):
```
    "build:planetofgreed": "vite build --config vite.planetofgreed.config.ts",
    "build:succession": "vite build --config vite.succession.config.ts",
    "build:house_of_kings_collab": "vite build --config vite.house_of_kings_collab.config.ts",
```
New line:
```
    "build:choke_point": "vite build --config vite.choke_point.config.ts",
```
The build writes `ts/dist-choke_point/`, which is gitignored (`dist*/`): do not commit it. Do not add a deploy entry to
`publishing/games.yaml`.

## 4. What NOT to do

- Do not edit `games/choke_point/logic.lua`, `data.yaml`, `systems.yaml` or `ui.yaml` (no gameplay, balance, waves or enemies).
- Do not add a headless Lua wave test (SCOPE change 2) or more waves/enemies (SCOPE change 3): they are not Tier A.
- Do not add tower classes, a bigger grid, meta-progression or new art.
- Do not change `handleReset` or the loss card (its "Reset Grid" button stays).
- Do not edit any other demo, any shared component under `ts/src/ui/components/`, `ts/vite.standalone.factory.ts`, or the live checkout.
- Do not deploy, and do not touch protected repos.

## 5. Verification

Python version check (no Python is changed; this is the repo standard):
```
uv run python --version
```
Expected: `Python 3.12.x`.

The two sanctioned compound lines, run from the worktree root, one per tool call:
```
cd ts && npx vitest run test_choke_point_restart.ts test_choke_point_ui.ts
```
Expected: 2 files passed (the existing UI file has 2 tests, the new file 2). For reference, the same command form on existing
files (`npx vitest run test_arcade_manifest.ts test_choke_point_ui.ts`) gave: `Test Files  2 passed (2)`, `Tests  6 passed (6)`.
```
cd ts && npm run build:choke_point
```
Expected: exits 0 and ends with `built in` and a `[copy-game-assets] copied runtime assets for choke_point` line.

Regression sanity (same form as the first): `cd ts && npx vitest run test_arcade_manifest.ts test_registry_export.ts test_standalone_factory.ts`
Expected: all passed.

Source checks (use the Grep tool, one call each, no shell):
- `build:choke_point` appears once in `ts/package.json`.
- `handleRestart` appears in `ts/src/games/choke_point/App.tsx` (definition and two uses); `isVictory` is imported once.
- `max-width: 640px` appears once in `ts/src/games/choke_point/styles.css`.

Not runnable in this run: the browser smoke and the 390x844 / 1280x720 screenshots (no browser). Say so in the report.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the two sanctioned verification
  lines in section 5 (`cd ts && npx vitest run <bare-filenames>` and `cd ts && npm run build:choke_point`). Do not use
  `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use bare test filenames as the filter (a path filter finds no tests).
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write
  why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there.
  Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one. Do not commit `ts/dist-choke_point/`.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- New logic goes in small new modules (SRP/KISS): victory detection lives in `outcome.ts`; `App.tsx` gets only the wiring above and
  must stay under 600 lines.
- Do not run `agentflow lint` or any agentflow command.
- Free models only where model config is touched; this run touches no model config.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/src/games/choke_point/outcome.ts` exists and `App.tsx` shows the victory card when `isVictory(state)` is true.
- [ ] A visible `Restart` button is present throughout play and returns to the title screen without a reload.
- [ ] `styles.css` has the `max-width: 640px` block; the commit bar wraps.
- [ ] `ts/package.json` has `build:choke_point`, the three new `choke_point` standalone/config files exist, and `cd ts && npm run build:choke_point` exits 0 (real tail pasted).
- [ ] `cd ts && npx vitest run test_choke_point_restart.ts test_choke_point_ui.ts` passes (real tail pasted).
- [ ] `games/choke_point/` (Lua and yaml) is untouched; no file outside this directive's list changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

- Exec(npm run build:choke_point)
- Exec(npx vitest)

## 8. Report

Findings first: what changed per file, and whether any quoted line differed from the file. Evidence second: the real tails of
`uv run python --version`, the vitest command and the build command. Then state plainly what was not run (browser smoke,
phone and desktop screenshots). Recommended action per item: review, then a reviewer takes the two screenshots and answers
A1-A4 in a browser. Deploying is Robert's step.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing Lua or yaml game data.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-choke-point-tiera-directive |
| Base branch | - |
| Base commit | 3f74117bb012aefb30bb4ae6a341c3353f343d1e |

**Status log**
- 2026-10-04 00:05 · claude · none → Queued — wave 1 Tier A directive from docs/demos/choke_point/SCOPE.md
- 2026-10-04 00:04 · robert-claude-laptop · Queued → Approved — lint override: errors are files the run creates (outcome.ts, test_choke_point_restart.ts, vite.choke_point.config.ts, standalone entry.tsx and index.html), marked with new-file markers; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 02:53 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-choke-point-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
