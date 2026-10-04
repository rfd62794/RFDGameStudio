# Trinity Siege Tier A polish: player-facing blurb and phone overflow

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/trinity_siege/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, items A1-A8),
`ts/src/games/trinity_siege/config.ts`, `examples/trinity-siege/src/App.tsx` (lines 445-480 and 520-585 only),
`examples/trinity-siege/metadata.json`.

## 1. Why this exists

Trinity Siege is a hex-ring wave-defense game (5 waves, 15 lives) live in the arcade as an `external` embed
(`ts/src/games/trinity_siege/config.ts`, `embedUrl: '/arcade/trinity_siege/'`). The 2026-10-03 audit
(`docs/state/demo-audit-batch2-2026-10-03.md`, row `trinity_siege`) found two Tier A problems: the public blurb
carries an internal "LEAST-VERIFIED ... fabricated combat logic" note (A5), and the embedded app overflows
horizontally at phone width (iframe scrollWidth 370 vs 358; A4). The game loop works end to end. This run is a
Tier A refine pass on those two items. It makes no claim about combat correctness either way. Robert's direction is
in `docs/demos/trinity_siege/SCOPE.md` (class: refine, effort S, open question: none).

## 2. Scope

Copied from `docs/demos/trinity_siege/SCOPE.md`.

Top 3 changes, in order:
1. Replace the blurb with a player-facing one under 60 words matching metadata.json.
2. Fix phone overflow in the embedded app.
3. Review combat.ts against SHAPE_MATRIX/RACE_LEAN intent and add a unit test (only if Robert wants it vouched for).

Out of scope: TS-native rewrite, new factions, art, balance, anything above Tier A.

Tier A boundary: this run does changes 1 and 2 only. Change 3 is conditional in the SCOPE ("only if Robert wants it
vouched for") and Robert has not asked for it; do NOT open `examples/trinity-siege/src/combat.ts` for review and do
NOT add a combat test. The browser checks (phone screenshot, no horizontal scroll) need a rebuilt embed and a
browser: they are the reviewer's step after Robert rebuilds the embed, not this run's.

## 3. The work

Note: the files edited below use CRLF line endings in the worktree. Keep them (the Edit tool preserves them); do not convert.

**Step 1: blurb (change 1).** Edit `ts/src/games/trinity_siege/config.ts`, line 7 only. Current line 7:
```
  description: 'Three-faction siege combat — deploy units, breach walls, resolve encounters. LEAST-VERIFIED: prior sessions found fabricated combat logic and misattributed bugs; playable but not vouched for correctness.',
```
Replace with this player-facing blurb (22 words, matches the game as described in `examples/trinity-siege/metadata.json`:
"A tactical wave defense game featuring hex ring geometry, shape counters, and persistent defensive fortifications."):
```
  description: 'A tactical wave-defense game on a hex ring: match shape counters to incoming waves and build lasting fortifications to survive five waves.',
```
Change nothing else in the file.

Create `<!-- new: ts/tests/test_trinity_siege_blurb.ts -->` (A5 check, small): import the default export from
`../src/games/trinity_siege/config` (proven to resolve under vitest) and assert: the description has 60 words or fewer
(`description.trim().split(/\s+/).length`), it does not contain `LEAST-VERIFIED`, `fabricated`, `TODO` or `TBD`, and
`gameId` is `trinity_siege`. Name the numbers in the test names.

**Step 2: phone overflow (change 2).** Edit `examples/trinity-siege/src/App.tsx` (687 lines, already over 600: touch
only the lines below; add no new logic). The likely cause is the non-wrapping header (title block plus two buttons in one
`flex justify-between` row with `px-6`). Current lines 447-449:
```
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between" id="app-header">
```
Edit them to:
- root `div` (line 447): append the class `overflow-x-clip` (use `clip`, not `hidden`: `hidden` would break the sticky header).
- `header` (line 449): replace `px-6 py-4 flex items-center justify-between` with `px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3`.
Then add `min-w-0` to the three column wrappers so a wide child cannot stretch the grid. Current lines 524, 555, 582:
```
        <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="lg:col-span-3">
        <div className="lg:col-span-4">
```
become `<div className="min-w-0 lg:col-span-5 flex flex-col gap-4">`, `<div className="min-w-0 lg:col-span-3">`,
`<div className="min-w-0 lg:col-span-4">`. Do not change anything else (the hex board, `HexRingBoard.tsx`, the combat
code, the game-over overlay and the "Force Reset" button stay exactly as they are).

## 4. What NOT to do

- Do not review, edit, or test `examples/trinity-siege/src/combat.ts`; do not claim anything about combat correctness.
- Do not change gameplay, balance, factions, waves, lives, art, or `HexRingBoard.tsx`, `ControlPanel.tsx`, `WaveLog.tsx`.
- Do not touch `examples/trinity-siege/metadata.json`, `package.json`, `vite.config.ts`, or `README.md`.
- Do not add a TS-native rewrite, a registry change beyond the one description line, or a `build:trinity_siege` script
  (the SCOPE does not list A7 as a gap for this embed).
- Do not rebuild or deploy the embed: `/arcade/trinity_siege/` is rebuilt and deployed by Robert, never by this run.
- Do not edit any other demo or the live checkout. Do not touch protected repos.

## 5. Verification

Python version check (no Python is changed; this is the repo standard):
```
uv run python --version
```
Expected: `Python 3.12.x`.

Test (the single sanctioned compound line, run from the worktree root):
```
cd ts && npx vitest run test_trinity_siege_blurb.ts
```
Expected: 1 file, at least 3 tests passed. For reference, the same command form on existing files
(`npx vitest run test_arcade_manifest.ts test_choke_point_ui.ts`) gave: `Test Files  2 passed (2)`, `Tests  6 passed (6)`.

Regression sanity (same form): `cd ts && npx vitest run test_arcade_manifest.ts test_registry_export.ts`
Expected: all passed.

Source checks (use the Grep tool, one call each, no shell):
- `LEAST-VERIFIED` no longer appears in `ts/src/games/trinity_siege/config.ts`.
- `overflow-x-clip` appears once in `examples/trinity-siege/src/App.tsx`; `flex-wrap items-center justify-between gap-3` appears once.
- `min-w-0 lg:col-span` appears exactly 3 times in `examples/trinity-siege/src/App.tsx`.

Not runnable in this run: building `examples/trinity-siege/` (it has no `node_modules`) and the phone browser check.
Say so in the report; do not try to install anything to make them run.

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
- New logic goes in small new modules (SRP/KISS): this run adds no logic, only the one small test file. `App.tsx`
  is over 600 lines and gets only the class-string edits above.
- Do not run `agentflow lint` or any agentflow command.
- Free models only where model config is touched; this run touches no model config.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/src/games/trinity_siege/config.ts` description is the new blurb (60 words or fewer, no "LEAST-VERIFIED").
- [ ] `ts/tests/test_trinity_siege_blurb.ts` exists and `cd ts && npx vitest run test_trinity_siege_blurb.ts` passes (real tail pasted).
- [ ] `examples/trinity-siege/src/App.tsx` has the header, root and three column edits from step 2, and nothing else changed.
- [ ] `combat.ts` untouched.
- [ ] No file outside the three named above changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: what changed per file, and whether any quoted line differed from the file. Evidence second: the real tails of
`uv run python --version` and the vitest commands. Then state plainly what was not run (embed build, phone browser check)
and that rebuilding and deploying the `/arcade/trinity_siege/` embed is Robert's step. State that combat correctness
was neither reviewed nor vouched for. Recommended action per item: review, then Robert rebuilds the embed and a
reviewer checks no horizontal scroll at 390x844.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding the embed; installing or fetching anything; reading outside the worktree; touching protected repos; opening or editing `examples/trinity-siege/src/combat.ts`.

## Required from User

none. Deploying the rebuilt embed is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-03 23:59 · claude · none → Queued — wave 1 Tier A directive from docs/demos/trinity_siege/SCOPE.md
- 2026-10-04 00:04 · robert-claude-laptop · Queued → Approved — lint override: errors are the file the run creates (test_trinity_siege_blurb.ts), marked with a new-file marker; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
<!-- queue:end -->
