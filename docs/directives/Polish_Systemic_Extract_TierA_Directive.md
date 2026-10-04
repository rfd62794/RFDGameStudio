# Systemic Extract Tier A: a visible Restart / New Run control (hideout loop stays parked)

## Read first

Inside this worktree only, and only these:
`docs/demos/systemic_extract/SCOPE.md` (16 lines), `examples/systemic-extract/src/components/GameViewport.tsx` (lines 9-17 and 36-60),
`examples/systemic-extract/src/components/RaidView.tsx` (lines 16-64 and 336-379), `examples/systemic-extract/src/components/raid/RaidHUD.tsx`
(lines 11-66 and 296-329), `examples/systemic-extract/src/components/raid/RaidResolutionModal.tsx` (lines 97-115),
`examples/systemic-extract/src/hooks/useRaidSimulation.ts` (lines 96-106, 222-266 and 566-582), `ts/tests/test_slime_coin_exchange.ts`
(lines 1-30: the vitest import and header style to mirror). Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

Robert decided (2026-10-04): systemic_extract gets the visible Restart / New Run control now (Tier A); the orphaned hideout loop stays
PARKED and out of scope (he has not decided the megamap design). `docs/demos/systemic_extract/SCOPE.md` line 9 records the gap:
"No visible restart / new-raid label (audit batch2:27, "no restart seen")", and line 12 ranks the fix first: "1. Add a visible Restart /
New Run control returning to the sanctuary without reload (A3)".

The embed source is tracked (`git ls-files examples/systemic-extract` lists 63 files, including every file named in this directive), so
nothing is blocked on intake. The code explains why the player is stuck after a raid. The only "end" button calls `onEndRaid`, and the
parent hands it an empty function. `examples/systemic-extract/src/components/GameViewport.tsx` lines 38-40:

```tsx
  const handleEndRaid = () => {
    // In the contiguous megamap, extraction brings the operative safely back to the Sanctuary Core.
  };
```

It is passed down at line 53 (`        onEndRaid={handleEndRaid}`). The game loop stops itself when a raid ends
(`examples/systemic-extract/src/hooks/useRaidSimulation.ts` lines 236 and 248, `            running = false;`) and the simulation is only
rebuilt when the effect's dependencies change (line 266, `  }, [initialCharges, initialMedkits, initialFlares, initialLures, sectorId, hasHazmatSuit]);`),
which never change here. The modal button (`examples/systemic-extract/src/components/raid/RaidResolutionModal.tsx` lines 101-111) reads:

```tsx
        <button
          id="btn-return-hideout"
          onClick={onConfirmEndRaid}
```
```tsx
          RETURN TO HIDEOUT &amp; INJECT LOOT
```

and `handleConfirmEndRaid` (`useRaidSimulation.ts` lines 567-582) posts the result to the in-browser backend and then calls
`    onEndRaid();` (line 581). So after extracting or dying the frozen canvas and the modal stay up and the button does nothing visible; the
only way out is a page reload. During a raid there is no restart control at all.

The fix needs no change to the simulation: remount `RaidView` with a new React `key`. Unmounting runs the effect cleanup
(`useRaidSimulation.ts` lines 261-265: `running = false; cancelAnimationFrame(...)`), and mounting builds a fresh `World`, `Simulation`
and renderer (lines 108-122), starting in the sanctuary overworld (`examples/systemic-extract/src/game/simulation/simulation.test.ts`
line 22: "boots into the overworld sanctuary").

## 2. Scope

Only under `examples/systemic-extract/src/` plus one new test in `ts/tests/`:

- `examples/systemic-extract/src/components/GameViewport.tsx`: a `runId` state and one `startNewRun` handler.
- `examples/systemic-extract/src/components/RaidView.tsx`: one new prop, `onNewRun`, passed to the HUD.
- `examples/systemic-extract/src/components/raid/RaidHUD.tsx`: one new optional prop and one mounted control.
- `examples/systemic-extract/src/components/raid/RaidResolutionModal.tsx`: the one button label.
- New: `examples/systemic-extract/src/game/restart-confirm.ts` <!-- new: examples/systemic-extract/src/game/restart-confirm.ts -->,
  `examples/systemic-extract/src/components/raid/RaidRestartButton.tsx` <!-- new: examples/systemic-extract/src/components/raid/RaidRestartButton.tsx -->,
  `ts/tests/test_systemic_extract_restart.ts` <!-- new: ts/tests/test_systemic_extract_restart.ts -->.

## 3. The work

1. `restart-confirm.ts` (pure, no imports, under 40 lines): a two-press guard so an accidental click does not throw away a raid.
   `export type RestartPrompt = 'idle' | 'armed';`
   `export type RestartEvent = 'press' | 'timeout';`
   `export function nextRestartPrompt(state: RestartPrompt, event: RestartEvent): { state: RestartPrompt; restart: boolean }`.
   `press` from `idle` gives `{ state: 'armed', restart: false }`; `press` from `armed` gives `{ state: 'idle', restart: true }`;
   `timeout` from either state gives `{ state: 'idle', restart: false }`.
2. `RaidRestartButton.tsx`: `export const RaidRestartButton: React.FC<{ onRestart: () => void }>`. Local `useState<RestartPrompt>('idle')`.
   Button `id="btn-new-run"`, same classes as the `btn-ecs-inspector` button in `RaidHUD.tsx` (lines 300-304). Label `NEW RUN` while idle and
   `CONFIRM NEW RUN?` while armed; `title="Abandon this run and start over at the sanctuary"`. On click run `nextRestartPrompt` with the current state and `press`,
   store the new state and call `onRestart()` when `restart` is true. While armed, a `useEffect` with `setTimeout(..., 3000)` applies the
   `timeout` event and clears the timer in its cleanup. Use the `RotateCcw` icon from `lucide-react` (already a dependency; see `RaidView.tsx` lines 19-29, which already imports `RotateCcw`
   for the import style).
3. `RaidHUD.tsx`: add `onNewRun?: () => void;` to `RaidHUDProps` (after `onOpenHelp: () => void;`, line 38), destructure it, and inside the
   `{/* TOP RIGHT CONTROLS */}` div render `{onNewRun && <RaidRestartButton onRestart={onNewRun} />}` as the first child (before the
   `btn-ecs-inspector` button at line 300). Import the new component.
4. `RaidView.tsx`: add `onNewRun: () => void;` to `RaidViewProps` (after `onEndRaid: () => void;`, line 48), destructure it in the component props,
   and pass `onNewRun={onNewRun}` to the `<RaidHUD` element (it starts at line 149).
5. `GameViewport.tsx`: `const [runId, setRunId] = useState(0);` and replace the body of `handleEndRaid` (keep the comment, it still says why)
   with a real handler: define `const startNewRun = () => setRunId(n => n + 1);` and use it for both: `onEndRaid={startNewRun}` and
   `onNewRun={startNewRun}`; add `key={runId}` to `<RaidView` (line 44). Delete the now-unused `handleEndRaid` rather than leaving it empty.
6. `RaidResolutionModal.tsx` line 110: change the button text `RETURN TO HIDEOUT &amp; INJECT LOOT` to `START NEW RUN`. Keep `id="btn-return-hideout"` and
   every other line (the surrounding copy about the Hideout stays; the hideout loop is parked, not edited).
7. `ts/tests/test_systemic_extract_restart.ts`: header comment in the style of `test_slime_coin_exchange.ts` lines 1-19, ending with the
   new-file marker for this path. Two groups of tests:
   a. Behaviour of `nextRestartPrompt`, imported with a relative path (`../../examples/systemic-extract/src/game/restart-confirm`; the
      module has no imports so it resolves without the example's own `node_modules`): press from idle arms without restarting; a second press
      restarts and returns to idle; timeout disarms; a press after a timeout arms again (does not restart).
   b. A wiring guard that reads the three source files with `readFileSync` from `node:fs` and `resolve(import.meta.dirname, '../../examples/systemic-extract/src/...')`
      (the pattern in `ts/tests/test_per_game_builds.ts` lines 2-6) and asserts with `toMatch` / `not.toMatch`: `GameViewport.tsx` contains
      `key={runId}` and `onNewRun={startNewRun}` and `onEndRaid={startNewRun}` and no `handleEndRaid`; `RaidHUD.tsx` contains `RaidRestartButton`;
      `RaidResolutionModal.tsx` contains `START NEW RUN` and not `RETURN TO HIDEOUT`. The header comment must say this half is a source-text guard
      because the example's React 19 build cannot be rendered under the studio's React 18 vitest.

## 4. What NOT to do

- Do not wire `HideoutView` or `useHideoutState` into the game, touch `examples/systemic-extract/src/backend/`, or decide how banked scrap or
  upgrades carry across runs (a new run starts from a fresh `Simulation`, so `bankedScrap` returns to its initial 25; that is accepted and goes in the report).
  The hideout loop is PARKED.
- Do not change `useRaidSimulation.ts`, `simulation.ts`, any system under `game/systems/`, maps, balance, RNG, `any` typing, the favicon, `INTAKE_VERSION`,
  `metadata.json`, `index.html` or the README. Do not add the card screenshot or the "embed" label (SCOPE.md top changes 2 and 3 are not this directive).
- Do not edit `ts/src/games/systemic_extract/config.ts` or add a `build:systemic_extract` script.
- Do not run `npm install`, `npm test` or `npm run lint` inside `examples/systemic-extract` (its `node_modules` is not in the worktree and installing
  is forbidden). Do not run the example's build and do not deploy.
- Do not leave the empty `handleEndRaid` in place; do not add a confirm dialog via `window.confirm`.

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_arcade_manifest.ts test_voiddrift_redux_chrome.ts
cd ts && npx vitest run test_systemic_extract_restart.ts test_arcade_manifest.ts test_voiddrift_redux_chrome.ts
```

Reference, run when this directive was written, on main at `42d0a68c`: `uv run python --version` gave `Python 3.12.12`, and the second
line gave `Test Files  2 passed (2)` and `Tests  14 passed (14)`. Run that second line once BEFORE you change anything and paste its tail, to
confirm the form works in your worktree. After the work the third line must show 3 files passed and 14 plus your new tests. The
`cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; `ts/tests/...` paths find none. Then use Grep to show:
`GameViewport.tsx` has exactly one `key={runId}`, `RaidHUD.tsx` has `onNewRun`, `RaidResolutionModal.tsx` has `START NEW RUN`.

The example's own `npm run lint` (`tsc --noEmit`) and `npm test` (`examples/systemic-extract/package.json` lines 11-12) cannot run in this
worktree; say so in the report. A reviewer runs them, plus a manual check: finish a raid (extract or die), press START NEW RUN and see the
sanctuary again with no reload; press NEW RUN mid-raid twice and see the same; check the HUD at phone width.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects. The only allowed exceptions are the fixed
  `cd ts && npx vitest run ...` lines in section 5. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. No live process probing.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not use a search, memory or web tool beyond the Read, Glob and Grep
  tools inside the worktree. Do not hunt: if a quoted line or a cited path is not where it says, STOP and write why in the Status row.
- Work only on branch `directive/rfdgamestudio-polish-systemic-extract-tiera-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with `<!-- new: path -->` in your report (and, where the file type allows, in a header comment).
- New logic goes in small new modules (one job per file, SOLID/SRP/KISS); no file you create or grow may pass 600 lines; edit files that are
  already over 600 lines in place, same line count (`useRaidSimulation.ts` is 648 lines and is not edited here).
- Free models only wherever any model configuration is touched (none is expected).
- Do not run `agentflow lint` or any other `agentflow` CLI. Do NOT run `uv run python -m studio.demos index` (the sandbox refuses it, and none of
  the work here changes the demo registry).
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`; run git with the worktree as the working directory.
- If the pre-push hook (or any hook) fails on a test unrelated to your change, stop and write `ready for controller finish` in the Status row;
  do not bypass the hook.
- Done means (the Status row): you stopped at `Review` after committing on the directive branch, with one line in the log giving the test pass
  counts. You do not mark Done and you do not merge.

## 7. Completion criteria

- [ ] `restart-confirm.ts`, `RaidRestartButton.tsx` and `test_systemic_extract_restart.ts` exist, each marked new, each under 600 lines.
- [ ] `GameViewport.tsx` remounts `RaidView` through `key={runId}`; `handleEndRaid` is gone; `onEndRaid` and `onNewRun` both call `startNewRun`.
- [ ] `RaidHUD.tsx` renders the `btn-new-run` control in the top-right group; the modal button reads `START NEW RUN`.
- [ ] `git status` shows exactly: the three new files and four edited files (`GameViewport.tsx`, `RaidView.tsx`, `RaidHUD.tsx`, `RaidResolutionModal.tsx`).
- [ ] The third vitest line in section 5 passes with 3 files.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, one line giving the pass counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: what the player could not do before (stuck after a raid, no mid-raid restart) and what the control now does. Then evidence: the real
output tails of the before-change and after-change vitest runs and the Grep results. Then one recommended action per open item: the reviewer-side
`npm run lint`, `npm test` and manual click-through in `examples/systemic-extract` (section 5); that `examples/` edits are overwritten by an AI Studio
re-promotion (`examples/systemic-extract/README.md`, "Improvement workflow"), so this change is local-only until the README records it; that `bankedScrap`
resets on a new run (the parked hideout question). List every created file with `<!-- new: path -->`. State that nothing was deployed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching protected repos; installing or fetching anything; editing `.gitignore` or any
  `dist`/`dist-*` directory; changing gameplay, rules, balance or art beyond what this directive names; wiring or editing the hideout loop; touching any
  demo other than systemic_extract; running `agentflow` commands or `uv run python -m studio.demos index`.

## Required from User

none. Deploying is Robert's.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-systemic-extract-tiera-directive |
| Base branch | - |
| Base commit | bb0488316d0127e1446fddf8d01701d19e07e9f1 |

**Status log**
- 2026-10-04 · claude · none → Queued — Robert 2026-10-04: add the Restart / New Run control (Tier A) now; hideout loop stays parked
- 2026-10-04 08:37 · robert-claude-laptop · Queued → Approved — lint override: any errors are files the run creates (restart-confirm.ts, RaidRestartButton.tsx, test_systemic_extract_restart.ts), marked new; author's dispatch lint gave 0 errors; this queue MCP process may still run pre-fix lint
- 2026-10-04 10:23 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-systemic-extract-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
