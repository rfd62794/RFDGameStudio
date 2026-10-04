# VoidDrift family docs corrections: TurboShells reference-only, web renderer and station sim parked

**Depends on:** none (the web-renderer paragraph links to `docs/directives/VoidDrift_Redux_Save_Restore_Directive.md`, a sibling directive file in the same batch; it need not be merged to write the link).
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations: PARK verdicts mean the row is parked and `SCOPE.md` gets an N/A line, never a deletion (`docs/demos/turboshells/DIRECTION.md`, `docs/demos/voidrift_web_renderer/DIRECTION.md`, `docs/demos/voidrift_station_sim/DIRECTION.md`).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/turboshells/DIRECTION.md`, `docs/demos/voidrift_web_renderer/DIRECTION.md`, `docs/demos/voidrift_web_renderer/EVALUATION.md` (the "Redundancy" section), `docs/demos/voidrift_station_sim/DIRECTION.md`,
`docs/RFDGameStudio_DemoPortingRoadmap.md` (lines 80-106), `ts/src/status/board.data.ts` (the `turboshells` entry, about lines 132-139).

## 1. Why this exists

Three demos in the VoidDrift group are PARK verdicts, and the docs still say otherwise or say nothing:
- `docs/RFDGameStudio_DemoPortingRoadmap.md` (the TurboShells paragraph, under "Tier 3") describes a "React/TS frontend", a "live Supabase database" and an open "anon key gets full CRUD" security gap as "real, confirmed". `docs/demos/turboshells/SCOPE.md` searched ChimeraLab, the only TurboShells source found (a pygame desktop game, last commit 2025-12-25), and found "Any Supabase reference (grep of .py/.md/.json/.toml/.txt: none), any React/TS frontend (no package.json to depth 3)". An unfounded claim steers future work wrongly, so the claims go and a reference-only line replaces them.
- The VoidDrift web renderer paragraph (same file, "VoidDrift (native + real TS web renderer)") ends "Real next step, not yet done: a dedicated look at ...". That look has been done (`EVALUATION.md`) and the verdict is PARK (agree with the settled decision): `voiddrift_redux` already holds the same drone FSM as a superset; the one unique piece, autosave, becomes `voiddrift_redux` save work.
- The Sandustry-family table in the same file says "none registered yet", but `particle_void` is registered as `voidrift_particle_sandbox` and `space_mining_sandustry` (`examples/voidrift-redux-station-sim/`) is parked.
- The status board's `turboshells` row asks Robert to decide "TS-native rebuild or drop" (`ts/src/status/board.data.ts`, `nextAction`); the decision is made (parked, reference only).
- The three parked demos' `SCOPE.md` files carry no N/A line.
This run is documentation and one board text row only. It deletes no code and no folder.

## 2. Scope

1. `docs/RFDGameStudio_DemoPortingRoadmap.md`: three edits.
2. `ts/src/status/board.data.ts`: the `turboshells` entry's `currentState`, `nextAction` and `lastUpdated` text only. Its `status` stays `'blocked'` (the board has no `parked` value, and adding one is a type change outside this run).
3. `docs/demos/voidrift_station_sim/SCOPE.md`, `docs/demos/voidrift_web_renderer/SCOPE.md`, `docs/demos/turboshells/SCOPE.md`: one appended status line each.

## 3. The work

Files under `docs/` and `ts/` use CRLF line endings; keep them (the Edit tool preserves them). Use the Edit tool with the exact old text; if an old text is not found exactly, STOP and write why in the Status row.

**Edit 1: roadmap, TurboShells.** Replace this old text (two paragraphs, under `### TurboShells`):
```
**Real, confirmed architecture:** Rust core (PyO3 bindings) → Python game logic (real files: 24KB `main.py`, 26KB `game_state_interface.py`, 20KB `save_protection.py`) → React/TS frontend → **live Supabase database** (real, active schema: `game_state`, `turtles` with full genome/breeding lineage, `race_results`). RLS enabled but currently **no auth — anon key gets full CRUD**, a real, live security gap worth knowing about independent of any porting decision.

**Why it's Tier 3, not Tier 1:** a standard external-embed import genuinely does not work here — the game depends on a live external database and a Python backend service, not just a static bundle. Real porting path, when picked up, needs its own dedicated investigation into how much of the Rust/Python stack gets kept vs. re-implemented, not a simple registry entry.
```
with:
```
**Reference only, not ported, dormant (decided 2026-10-04).** The only TurboShells source found is the ChimeraLab repo ("Turbo Shells", a pygame-ce turtle breeding and racing game with a Rust genetics core, last commit 2025-12-25; local copy at `C:\Github\reference-repos\ChimeraLab`, remote `rfd62794/ChimeraLab`). It is a desktop game, not a browser build. An earlier version of this paragraph described a React/TS frontend and a live Supabase database with open row-level access; no code or configuration for either was found in ChimeraLab or in this repo, so those claims were removed rather than carried forward. If a Supabase or React repo for TurboShells exists elsewhere, it has not been located.

**Why it stays Tier 3:** a browser version would replace the whole stack (pygame UI, Python logic, Rust core). If breeding is ever wanted in the arcade, start from a one-page TypeScript genetics design note based on ChimeraLab's gene model (20 genes, Mendelian inheritance, mutation), not a port.
```
**Edit 2: roadmap, web renderer.** Replace this single sentence (the last sentence of the first VoidDrift paragraph's second block):
```
Real next step, not yet done: a dedicated look at whether `web/` is a real, standalone-portable candidate or still genuinely coupled to the Rust core's data.
```
with:
```
**Decision (2026-10-04): parked.** `docs/demos/voidrift_web_renderer/EVALUATION.md` found it is a 1,195-line iron-only MVP slice with no tests, hand-copied constants that already drift from `balance.toml`, and a lockfile that cannot install off Replit. `voiddrift_redux` already holds the same drone FSM as a superset, so the one unique piece, a 5-second autosave, is tracked as `voiddrift_redux` save/restore work (`docs/directives/VoidDrift_Redux_Save_Restore_Directive.md`). Un-park only if Robert wants a no-WASM idle game; then follow the copy gate in EVALUATION.md.
```
**Edit 3: roadmap, Sandustry family.** Replace this single line:
```
Update (intake/demo-sources-1): `voiddrift_redux_1` is already ported and registered as `voiddrift_redux`; its source is now tracked under `examples/voiddrift-redux-core-loop/`.
```
with these two lines (the first is the old line unchanged, then a new line):
```
Update (intake/demo-sources-1): `voiddrift_redux_1` is already ported and registered as `voiddrift_redux`; its source is now tracked under `examples/voiddrift-redux-core-loop/`.
Update (2026-10-04): `particle_void` is now ported and registered as `voidrift_particle_sandbox` (status `dev`). `space_mining_sandustry` (`examples/voidrift-redux-station-sim/`) is parked: it is not registered and not ported, and it stays parked until `voiddrift_redux` and `voidrift_particle_sandbox` each have a title screen, a Restart control and a save. Direction: `docs/demos/voidrift_station_sim/DIRECTION.md`.
```
**Edit 4: board row.** In `ts/src/status/board.data.ts`, the entry with `id: 'turboshells'` only:
- Replace the whole `currentState: '...'` line (keep its leading indentation) with:
```
currentState: 'Parked, reference only (decided 2026-10-04). The only source found is the ChimeraLab pygame game (dormant since 2025-12-25); no game code in this repo, only the Feb 2026 audit doc (archive/rpgCore TURBOSHELLS_AUDIT_REPORT) and archived rpgCore racing/genetics modules adapted from it. The Lua carve-out protecting its port was retired by ADR-013 after the port lapsed.',
```
- Replace the whole `nextAction: '...'` line with the line below (keep the leading indentation and the escaped apostrophe exactly):
```
    nextAction: 'None. If breeding is ever wanted in the arcade, write a one-page TS genetics design note from ChimeraLab\'s gene model rather than a port.',
```
- In that same entry change `lastUpdated: '2026-09-29'` to `lastUpdated: '2026-10-04'`. Do not change the `status`, `category`, `verificationMethod` or `capabilities` lines, and touch no other entry.

**Edit 5: SCOPE.md N/A lines.** Append to the end of each file (after a blank line):
- `docs/demos/voidrift_station_sim/SCOPE.md`:
```

Status (2026-10-04): PARKED. Tier A, polish and port work are N/A until voiddrift_redux and voidrift_particle_sandbox each have a title screen, a Restart control and a save. Source and tests stay where they are; nothing is deleted. See DIRECTION.md.
```
- `docs/demos/voidrift_web_renderer/SCOPE.md`:
```

Status (2026-10-04): PARKED. Tier A, polish and port work are N/A. Its autosave idea is tracked as voiddrift_redux save/restore. Un-park only on Robert's word; see DIRECTION.md and EVALUATION.md.
```
- `docs/demos/turboshells/SCOPE.md`:
```

Status (2026-10-04): PARKED, reference only. Tier A, polish and port work are N/A. ChimeraLab stays outside the cabinet. See DIRECTION.md.
```

## 4. What NOT to do

- Do not delete or move any game code, example folder, `ChimeraLab` reference or document. Parking never deletes.
- Do not add a `parked` status to `ts/src/status/types.ts`, and do not edit any other board entry, `docs/state/StatusBoard.md` by hand (the controller regenerates it), or any registry/config file.
- Do not un-park anything, register `voidrift_station_sim` or `voidrift_web_renderer`, or write the optional TurboShells genetics note.
- Do not edit the `DIRECTION.md`, `EVALUATION.md` files or the other roadmap sections. No Lua, no engine changes, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline, before editing (origin/main `d3084de0`), and the same after (the board edit changes text only):
```
cd ts && npx vitest run test_status_board.ts test_site_status_pages.ts
```
Real tail: `Test Files  2 passed (2)` / `Tests  29 passed (29)`.
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source checks (Grep tool, one call each): `docs/RFDGameStudio_DemoPortingRoadmap.md` has zero matches for `anon key` and for `Rust core (PyO3 bindings)`; it contains `Reference only, not ported` once, `Decision (2026-10-04): parked` once and `is parked: it is not registered` once; each of the three `SCOPE.md` files contains `Status (2026-10-04): PARKED`; `ts/src/status/board.data.ts` contains `Parked, reference only (decided 2026-10-04)` once.

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

- [ ] The three roadmap edits and the board-row text edit are made exactly as above; the three `SCOPE.md` files carry their N/A line.
- [ ] The vitest command passes with 29 tests (real tail pasted); `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the five in Scope changed; nothing deleted; the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the five files and what changed. Evidence second: the real tails and the Grep results.
**Controller finish (after merge):** regenerate the board and the site status pages from the edited data (`cd ts && npx vite-node tools/generate-status-board.ts`, then `cd ts && npx vite-node tools/generate-site-status-pages.ts` if the usual step includes it; the sandbox refuses `vite-node`), and commit `docs/state/StatusBoard.md`.
Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.
