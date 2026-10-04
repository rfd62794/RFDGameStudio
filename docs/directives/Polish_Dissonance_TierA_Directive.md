# Dissonance Tier A: run-end New Run and an abandon-run control

## Read first

`docs/demos/dissonance/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, A1-A8),
`ts/src/games/dissonance/App.tsx` (lines 15-75, 218-226 and 284-290), `ts/src/games/dissonance/phases/RunEndPhase.tsx`
(whole file, 31 lines), `ts/src/games/dissonance/phases/TitlePhase.tsx` (whole file), `ts/src/ui/components/EndStateScreen.tsx`
(lines 1-35), `ts/tests/test_dissonance_shared_ui.tsx` (lines 1-20). Everything you need is quoted below; do not search
for anything else.

## 1. Why this exists

Dissonance Depths is a `dev` demo whose loop, Lua chemistry and saves are built; what is missing for Tier A is a
Restart / New Game that is reachable at the end of a run and during one (A3). The scope analysis
(`docs/demos/dissonance/SCOPE.md`) found that the run-end screen offers only "Return to Title", and there is no abandon
control during a run. A New Run button already exists on the title (`TitlePhase.tsx`).

Current code, quoted from `ts/src/games/dissonance/phases/RunEndPhase.tsx`:

```tsx
interface RunEndPhaseProps {
  run: RunState;
  onReturnToTitle: () => void;
}
...
      onRestart={onReturnToTitle}
      restartLabel="Return to Title"
    />
```

`ts/src/games/dissonance/App.tsx` (lines 38, 56-70, 220-224 and 286-288):

```tsx
  const [savedRun] = useState<RunState | null>(loadSavedRun);
```
```tsx
  const returnToTitle = useCallback(() => {
    setRun(null);
    setAppPhase('title');
  }, []);

  const handleNewRun = useCallback(() => {
    if (unlockedCardIds.length === 0) {
      const pack = call('generate_opening_pack', data) as OpeningPackItem[] | null;
      if (!pack) return;
      setOpeningPack(pack);
      setAppPhase('opening');
    } else {
      setAppPhase('floorChoice');
    }
  }, [unlockedCardIds, call, data]);
```
```tsx
  const statusArea = run ? (
    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
      Floor {run.currentFloor} · Turn {run.turnCount}
    </span>
  ) : undefined;
```
```tsx
        {appPhase === 'run' && run && (run.status === 'victory' || run.status === 'game_over') && (
          <RunEndPhase run={run} onReturnToTitle={returnToTitle} />
        )}
```

The save is cleared by an effect when a run reaches `victory` or `game_over` (a `clearSave` call on the constant
`SAVED_RUN_KEY`, defined near the top of the file). Note `savedRun` is read once at mount and never updated, so after a
run ends or is abandoned the title would still show "Continue" with the stale mount-time save. The new abandon path
must therefore clear the save and update that state, and `returnToTitle` must refresh it.

`EndStateScreen` (shared) has one action: props `onRestart` and `restartLabel`.

Run status values used by `App.tsx`: `not_started`, `combat`, `reward`, `rest_craft`, `treasure`, `store`, `anomaly`,
`victory`, `game_over`.

## 2. Scope

Copied from `docs/demos/dissonance/SCOPE.md`.

Top 3 changes, in order: 1. Run-end "New Run" plus an abandon/restart control during a run (A3, B6). 2. Headless bot run through the Lua session: N floors, no softlock or negative HP/gold, win and loss reachable (B4). 3. Mute + SFX via engine/shared/sfx, as succession and wire_rust do (B3, B5).

Out of scope: new cards, cultures, floors or Brewfield features; moving logic into TS; merging the prototype; art regeneration.

This directive targets Tier A only. It executes change 1 (A3). Changes 2 and 3 are Tier B (B4, B3, B5) and wait for a
later directive: do not start them.

## 3. The work

1. NEW `ts/src/games/dissonance/utils/runControls.ts` <!-- new: ts/src/games/dissonance/utils/runControls.ts -->: pure
   `isRunInProgress(status: string): boolean`, true for `not_started`, `combat`, `reward`, `rest_craft`, `treasure`,
   `store`, `anomaly`, false for `victory`, `game_over` and anything else.
2. NEW `ts/src/games/dissonance/components/AbandonRunButton.tsx` <!-- new: ts/src/games/dissonance/components/AbandonRunButton.tsx -->:
   a small button `AbandonRunButton({ onAbandon })` with `id="dissonance-abandon-run"`. First click arms it (label
   changes to "Confirm abandon?", auto-disarms after 3 seconds via `setTimeout` with cleanup); second click calls
   `onAbandon`. Visible text label "Abandon run" (not icon-only), compact so it fits beside the status text at 390 px.
3. `ts/src/games/dissonance/phases/RunEndPhase.tsx`: add prop `onNewRun: () => void`. Pass `onRestart={onNewRun}` and
   `restartLabel="New Run"` to `EndStateScreen` (id `viewport-run-end-phase` stays), and render the shared `Button`
   (import from `../../../ui/components`, as `TitlePhase.tsx` imports `TitleScreen`) labelled "Return to Title" with
   `id="dissonance-return-title"` below it, calling `onReturnToTitle`. Wrap both in a fragment.
4. `ts/src/games/dissonance/App.tsx`:
   - `const [savedRun, setSavedRun] = useState<RunState | null>(loadSavedRun);`
   - `returnToTitle` additionally calls `setSavedRun(loadSavedRun())` and `setRewardSlots(null)`.
   - add `handleAbandon`: `clearSave(SAVED_RUN_KEY); setSavedRun(null); setRewardSlots(null); setRun(null); setAppPhase('title');`.
   - add `handleNewRunFromEnd`: `setRun(null); setRewardSlots(null); handleNewRun();` (it must be defined after `handleNewRun`).
   - `statusArea`: when `run && isRunInProgress(run.status)` also render `<AbandonRunButton onAbandon={handleAbandon} />`
     next to the existing span (wrap both in a fragment); keep the existing text unchanged.
   - pass `onNewRun={handleNewRunFromEnd}` to `RunEndPhase`.
5. NEW `ts/tests/test_dissonance_run_controls.ts` <!-- new: ts/tests/test_dissonance_run_controls.ts -->: unit tests of
   `isRunInProgress` for all nine status values above and one unknown string; source-text assertions (read files with
   `readFileSync(resolve(import.meta.dirname, '../src/games/dissonance/...'))`, same convention as the other
   dissonance tests): `RunEndPhase.tsx` contains `restartLabel="New Run"` and `Return to Title`; `App.tsx` contains
   `AbandonRunButton`, `handleAbandon`, `handleNewRunFromEnd` and `setSavedRun`; `AbandonRunButton.tsx` contains
   `dissonance-abandon-run`.

## 4. What NOT to do

- Do not touch any Lua file, `games/dissonance/`, YAML data, or the zero-regression expectations: if
  `test_dissonance_zero_regression.ts` fails, your change is wrong, not the test.
- Do not add sound, mute, SFX, a bot or balance test (changes 2 and 3, Tier B). Do not change cards, cultures, floors,
  Brewfield content, art, or the title screen's existing items.
- Do not move game logic into TS; the new code only wires UI state (`App.tsx` is the existing owner of that state).
- Do not change `ts/src/games/dissonance/config.ts` or the registry status.
- Keep touched files under 600 lines (App.tsx is 292 now).

## 5. Verification

Run each as its own tool call, from the worktree root, and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_dissonance_run_controls.ts test_dissonance_zero_regression.ts test_dissonance_shared_ui.tsx
```

`build:dissonance` already exists (`ts/package.json` line 9) and A6 test files for the demo already exist; the full
suite (`cd ts && npm test`), `cd ts && npm run build:dissonance` and the A1-A4 browser smoke with 390x844
screenshots are the reviewer's step after Review, not part of this run (the rules allow only the one `cd ts &&` line).

Reference, run on main (f3208bc1) when this directive was written: `uv run python --version` gave
`Python 3.12.12`. The same form on main with `test_dissonance_zero_regression.ts test_dissonance_shared_ui.tsx` gave
`Test Files  2 passed (2)` and `Tests  109 passed (109)`.
The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; full-path filters such as `ts/tests/<name>.ts`
find none. Record any failure that also fails on a clean main as pre-existing, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry another
  way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&` or `||` chains, no pipes, no redirects. The one allowed
  exception is the fixed verification line `cd ts && npx vitest run test_dissonance_run_controls.ts test_dissonance_zero_regression.ts test_dissonance_shared_ui.tsx`. Do not use `ls`, `Get-ChildItem` or `cat`: use
  Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not search or hunt for files
  that are not named in this directive: every path you need is quoted above. If something named here is
  missing or different from the quote, STOP and write exactly what is missing in the Status row.
- Work only on branch `directive/rfdgamestudio-polish-dissonance-tiera-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with a `<!-- new: ... -->` marker in your report, and a `// new:` header comment in new code files.
- New logic goes in the small new modules named in The work (SOLID/SRP/KISS). Keep every file you touch under
  600 lines where it already is; where a file is already over 600 lines, its net line count must not grow by more
  than 10.
- Free models only wherever any model config is touched (none is expected in this directive).
- Do not run `agentflow lint` or any other `agentflow` CLI. Never use `git -C`, `git -c`, `git --git-dir` or
  `git --work-tree`.
- Update this directive's Status row when you finish or stop partway. Done for the Status row means: the files in
  The work are changed or created, the verification commands in section 5 were run and their real tails are in
  the report, and the work is committed on the directive branch (not pushed). Move the row to `Review`, never to
  Done.

## 7. Completion criteria

Done means all of: (a) the run-end screen offers "New Run" (primary) and "Return to Title"; (b) a visible
"Abandon run" control with a two-click confirm exists during an in-progress run and returns to the title with the save
cleared and no stale "Continue"; (c) the verification line passes, new test file included, with the zero-regression
test unchanged and green; (d) the work is committed on the directive branch, not pushed. Status row: `Review`, with one
line giving the pass counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: what changed, in which files. Then evidence: the real output tails of the commands in section 5.
Then one recommended action per open item. List every created file with a `<!-- new: ... -->` marker. State that
nothing was deployed and that nothing was pushed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching the site repo; touching protected repos
  (TeleseroAdminSuite2026, DialerListPulse); editing `.gitignore`, `examples/` (unless this directive names a
  file there), any `dist` or `dist-*` directory, or any other demo's files; installing or fetching anything.

## Required from User

none for the run. After Review and merge, deploying is Robert's separate step. Deploying is not part of this run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-dissonance-tiera-directive |
| Base branch | - |
| Base commit | 8fc4723ebb35e8a5b6612159c8b3680223d41807 |
| Head commit | 17b68b1454117702964cc02fad07f25a22e856f3 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-03 · robert-claude-laptop · none → Queued — demo polish wave 1, Tier A only; Scope and Out of scope copied from the demo's SCOPE.md
- 2026-10-04 00:00 · robert-claude-laptop · Queued → Approved — lint override: all 3 errors are files the run creates (runControls.ts, AbandonRunButton.tsx, test_dissonance_run_controls.ts), each marked with a new-file marker; the author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 00:59 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-dissonance-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 00:59 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-dissonance-tiera-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-04 01:07 · devin-overseer (delegated) · In progress → Review — vitest 3 files / 122 tests passed (13 new run-controls + 107 zero-regression + 2 shared-ui); uv run python --version = 3.12.12; committed 17b68b14 and pushed; pre-push hook green (pytest + full vitest 2124 tests + build test) [origin] spent: devin 2 min est. n/a
- 2026-10-04 01:11 · robert-claude-laptop · Review → Done
<!-- queue:end -->
