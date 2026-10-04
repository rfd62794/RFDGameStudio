# Facility Escape Tier A polish: remove the production self-test and rewrite the blurb

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/facility_escape/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, items A1-A8),
`ts/src/games/facility_escape/config.ts`, `examples/facility-escape/src/utils/roomGenerator.ts` (lines 984-992 only).

## 1. Why this exists

Facility Escape is a turn-based stealth puzzle: guards decide their next action before you move, across 8 generated
rooms, with a real guard AI and an A* solver. It is live in the arcade as an `external` embed
(`ts/src/games/facility_escape/config.ts`, `embedUrl: '/arcade/facility_escape/'`). The 2026-10-03 audit
(`docs/state/demo-audit-batch1-2026-10-03.md`, row `facility_escape`) found that the production bundle runs a
self-test at import time and writes 5 `[LOG]` lines to the console (A1 hygiene), and the blurb is a dev note, not a
player-facing line (A5). The game itself is built and works. This run is a Tier A refine pass on those two items.
Robert's direction is in `docs/demos/facility_escape/SCOPE.md` (class: refine, effort S, open question: none).

## 2. Scope

Copied from `docs/demos/facility_escape/SCOPE.md`.

Top 3 changes, in order:
1. Remove the module-load test call (roomGenerator.ts:990-991) and rebuild the embed.
2. Rewrite the blurb as a player-facing line.
3. Add a screenshot and a phone check. (TS-native rewrite is Wave 2 in the polish spec section 4 and is not proposed here.)

Out of scope: TS-native rewrite, new rooms/mechanics, solver changes, art, anything above Tier A.

Tier A boundary: this run does changes 1 and 2 in source. "Rebuild the embed" in change 1 is Robert's step:
`examples/facility-escape/` has no `node_modules` and the embed is deployed from outside this repo's run, so this run
cannot build or deploy it. Change 3 (a screenshot and a phone check) needs a browser and the rebuilt embed, and the arcade
registry has no screenshot field to hold one, so it is the reviewer's step after Robert rebuilds the embed, not this run's.

## 3. The work

Note: the files edited below use CRLF line endings in the worktree. Keep them (the Edit tool preserves them); do not convert.

**Step 1: remove the module-load self-test call (change 1).** Edit
`examples/facility-escape/src/utils/roomGenerator.ts` (992 lines, already over 600: this is a pure deletion of two
lines, nothing else). Current lines 984-992:
```
  } else {
    console.log(`[Test Rejection] FAILURE: Room with no dead zone was NOT rejected.`);
  }
  console.log("================================================");
}

// Execute test on module load to confirm integration
runExplicitDeadZoneRejectionTest();

```
Delete lines 990-991 (the comment `// Execute test on module load to confirm integration` and the call
`runExplicitDeadZoneRejectionTest();`) and the blank line before them, so the file ends with the closing `}` of
`runExplicitDeadZoneRejectionTest` followed by a single newline. Keep the exported function
`runExplicitDeadZoneRejectionTest` (line 922) itself: it is not called anywhere else, and removing it is not part of this
run. Touch nothing else in this file (the solver code and the generator are out of scope).

**Step 2: blurb (change 2).** Edit `ts/src/games/facility_escape/config.ts`, line 7 only. Current line 7:
```
  description: 'A turn-based puzzle prototype testing property-based physical interaction rules and telecasted guard sightlines.',
```
Replace with (29 words; it describes what the game is, from `examples/facility-escape/src/App.tsx` lines 613-617: 8 generated
rooms and guards that decide before you act):
```
  description: 'Sneak through 8 generated rooms in a turn-based stealth puzzle. Guards telegraph their next move before you act: read their sightlines, use items and hazards, and reach the exit.',
```
Change nothing else in the file.

Create `<!-- new: ts/tests/test_facility_escape_blurb.ts -->` (A5 check, small): import the default export from
`../src/games/facility_escape/config` (proven to resolve under vitest) and assert: the description has 60 words or fewer
(`description.trim().split(/\s+/).length`), it does not contain `prototype`, `property-based`, `telecasted`, `TODO` or `TBD`,
and `gameId` is `facility_escape`. Name the numbers in the test names.

## 4. What NOT to do

- Do not touch anything in `roomGenerator.ts` other than the two-line deletion in step 1 (no solver, generator or dead-zone logic).
- Do not edit `levelSolver.ts`, `guardAI.ts`, `physicsEngine.ts`, `turnEngine.ts`, `App.tsx`, the components, or any other file under `examples/facility-escape/`.
- Do not add rooms, mechanics, art, a TS-native rewrite, or a `build:facility_escape` script (the SCOPE does not list A7 as a gap for this embed).
- Do not edit `examples/facility-escape/metadata.json` (it is the AI Studio original) or the `_check/` folder.
- Do not rebuild or deploy the embed: `/arcade/facility_escape/` is rebuilt and deployed by Robert, never by this run.
- Do not edit any other demo or the live checkout. Do not touch protected repos.

## 5. Verification

Python version check (no Python is changed; this is the repo standard):
```
uv run python --version
```
Expected: `Python 3.12.x`.

Test (the single sanctioned compound line, run from the worktree root):
```
cd ts && npx vitest run test_facility_escape_blurb.ts
```
Expected: 1 file, at least 3 tests passed. For reference, the same command form on existing files
(`npx vitest run test_arcade_manifest.ts test_choke_point_ui.ts`) gave: `Test Files  2 passed (2)`, `Tests  6 passed (6)`.

Regression sanity (same form): `cd ts && npx vitest run test_arcade_manifest.ts test_registry_export.ts`
Expected: all passed.

Source checks (use the Grep tool, one call each, no shell):
- `runExplicitDeadZoneRejectionTest` appears exactly once in `examples/facility-escape/src/utils/roomGenerator.ts` (the `export function` line only; no call remains).
- `Execute test on module load` no longer appears in that file.
- `property-based` no longer appears in `ts/src/games/facility_escape/config.ts`.

Not runnable in this run: building `examples/facility-escape/` (no `node_modules`) and confirming the console is clean in a
browser. Say so in the report; do not try to install anything to make them run.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests).
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write
  why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there.
  Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- New logic goes in small new modules (SRP/KISS): this run adds no logic, only one small test file. `roomGenerator.ts`
  is over 600 lines and gets only the two-line deletion.
- Do not run `agentflow lint` or any agentflow command.
- Free models only where model config is touched; this run touches no model config.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `roomGenerator.ts` no longer calls `runExplicitDeadZoneRejectionTest()` at module load (the function definition remains; nothing else in the file changed).
- [ ] `ts/src/games/facility_escape/config.ts` description is the new blurb (60 words or fewer, no dev-note wording).
- [ ] `ts/tests/test_facility_escape_blurb.ts` exists and `cd ts && npx vitest run test_facility_escape_blurb.ts` passes (real tail pasted).
- [ ] No file outside the three named above changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: what changed per file, and whether any quoted line differed from the file. Evidence second: the real tails of
`uv run python --version` and the vitest commands. Then state plainly what was not run (embed build, browser console check,
screenshot, phone check) and that rebuilding and deploying the `/arcade/facility_escape/` embed is Robert's step.
Recommended action per item: review, then Robert rebuilds the embed and a reviewer confirms zero `[LOG]` lines from the
bundle and runs the phone check at 390x844.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding the embed; installing or fetching anything; reading outside the worktree; touching protected repos; editing solver, AI or physics code.

## Required from User

none. Deploying the rebuilt embed is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-facility-escape-tiera-directive |
| Base branch | - |
| Base commit | a3607ee7795e3d7d196774fc66aa459bb4476b3e |

**Status log**
- 2026-10-03 23:59 · claude · none → Queued — wave 1 Tier A directive from docs/demos/facility_escape/SCOPE.md
- 2026-10-04 00:04 · robert-claude-laptop · Queued → Approved — lint override: errors are the file the run creates (test_facility_escape_blurb.ts), marked with a new-file marker; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 03:24 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-facility-escape-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 03:25 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-facility-escape-tiera-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
