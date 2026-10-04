# Docs corrections for the sim, business and idle demos (stale READMEs, PARK and BPO decisions)

**Depends on:** none

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/corpworld/README.md`, `ts/src/games/kingmaker_squads/README.md`, `docs/demos/house_of_kings_collab/SCOPE.md` (last 3 lines only),
`docs/demos/filipino_bpo_simulator/DIRECTION.md` (last 5 lines only), `docs/demos/factory_idle/DIRECTION.md` (last 3 lines only).

## 1. Why this exists

Several notes in this group say things the repository no longer does. Measured on origin/main `afb1cefe`:
- `ts/src/games/corpworld/README.md` says `examples/*` is gitignored and `examples/corpworld/` is NOT tracked. False since commit `0c416b4f` (2026-10-04, "track all of examples/"): `git ls-files examples/corpworld` lists its files, and `examples/corpworld/vite.config.ts` line 8 sets `base: '/arcade/corpworld/'`.
- `ts/src/games/kingmaker_squads/README.md` says the same about `examples/kingmaker-squads/` (tracked since `fa3f359c`) and says `vite.config.ts` lacks `base`; `examples/kingmaker-squads/vite.config.ts` line 8 sets `base: '/arcade/kingmaker_squads/'`. It also says a start-screen Restart is "BLOCKED on intake"; the intake is done and the Restart is specified in `docs/directives/Kingmaker_Squads_Restart_Directive.md`.
- `docs/demos/house_of_kings_collab/SCOPE.md` has no line saying which later polish tiers do not apply to a parked showcase; Robert approved the PARK verdict (2026-10-04, "I approve all recommendations").
- `docs/demos/filipino_bpo_simulator/DIRECTION.md` still lists the NCA compliance check as a precondition to publishing and keeps the old name. Robert decided on 2026-10-04: the check is not a blocker, and the demo becomes a country-agnostic "BPO Sim".
- `docs/demos/factory_idle/DIRECTION.md` says the player lands on "an empty grid"; `getInitialGameState()` places a starter line from `PRESET_FACTORIES[0]` (reducer lines 73-85) and the factory runs from the first second.

This is the bundled doc-correction directive for the sim, business and idle group. Documentation only: no code, no tests.

## 2. Scope

1. `ts/src/games/corpworld/README.md`: rewrite (full content below).
2. `ts/src/games/kingmaker_squads/README.md`: rewrite (full content below).
3. `docs/demos/house_of_kings_collab/SCOPE.md`: append two lines.
4. `docs/demos/filipino_bpo_simulator/DIRECTION.md`: append one section.
5. `docs/demos/factory_idle/DIRECTION.md`: append one line.

## 3. The work

All five files use CRLF line endings; write the new text with CRLF.

**Step 1: `ts/src/games/corpworld/README.md`.** Replace the whole file with:

```
# CorpWorld — Origin project (preserved)

**Status:** Origin project, registered in the live game registry as an
`external` embed with `supersededBy: 'planetofgreed'` (ADR-023, see
`docs/adr/ADR-023-legacy-origin-projects-type.md`). Presented as history,
not as a game competing with Planet of Greed.

**Why it exists:** CorpWorld is the fork ancestor of Planet of Greed.
Planet of Greed forked from CorpWorld's scaffold and has since diverged
(wheel topology, fragment system, ending system, AI decisions). Planet of
Greed is the live, TS-native game in `ts/src/games/planetofgreed/`.

**What is tracked here:**
- Registry entry: `ts/src/games/corpworld/config.ts` (imported by
  `ts/src/games/registry.ts`; its `source` points at the example below).
- Source: `examples/corpworld/`, a tracked AI Studio export (tracked since
  commit `0c416b4f`, 2026-10-04). Its `vite.config.ts` sets
  `base: '/arcade/corpworld/'`.
- Intake history: `intake/corpworld/MANIFEST.md` (latest recorded version
  0.1.0R5, source file `corpworld_v0.1.0R5.zip`).

**Which build is live:** the embed is served at `/arcade/corpworld/`. The
tracked source is intake 0.1.0R5. Not verified: that the build currently
served there was built from it. A build-hash comparison by the controller
would settle it; record the answer here when done.
```

**Step 2: `ts/src/games/kingmaker_squads/README.md`.** Replace the whole file with:

```
# Kingmaker Squads — Origin project (preserved)

**Status:** Origin project, registered in the live game registry as an
`external` embed with `supersededBy: 'planetofgreed'` (ADR-023, see
`docs/adr/ADR-023-legacy-origin-projects-type.md`). Presented as history,
not as a game competing with Planet of Greed. It is a finished tactical
squad campaign and stays visible; the arcade does not hide it.

**Why it exists:** Kingmaker Squads was the wheel/culture-identity design
source that informed Planet of Greed's six-culture wheel topology. Planet
of Greed is the live, TS-native game that carries the design forward; the
individually tracked unit combat of Kingmaker Squads lives only here.

**What is tracked here:**
- Registry entry: `ts/src/games/kingmaker_squads/config.ts` (imported by
  `ts/src/games/registry.ts`; its `source` points at the example below).
- Source: `examples/kingmaker-squads/` (combat engine, city generation, AI
  opponent, tests), tracked since commit `fa3f359c`. Its `vite.config.ts`
  sets `base: '/arcade/kingmaker_squads/'`.
- Intake history: `intake/kingmaker-squads/MANIFEST.md`.

**Polish standard, item A3 (Start and Restart):** the embedded game opens on
a start screen whose in-frame control is "Start New Campaign"; once a
campaign is running the header offers "Restart Campaign". A start-screen
Restart with a two-step confirm is specified in
`docs/directives/Kingmaker_Squads_Restart_Directive.md`.
```

**Step 3: `docs/demos/house_of_kings_collab/SCOPE.md`.** Append at the end of the file (after the last line, which ends `...until you answer.`):
```
Decision 2026-10-04 (Robert approved the PARK verdict in docs/demos/house_of_kings_collab/DIRECTION.md): architecture showcase, no public hosting, no further polish.
Tier B, Tier C, phone-layout and first-60-seconds checks: N/A (parked showcase). Only Tier A honesty items apply; the URL stays.
```

**Step 4: `docs/demos/filipino_bpo_simulator/DIRECTION.md`.** Append at the end of the file:
```

## Decision update 2026-10-04 (Robert; overrides the Open question above)
- The NCA compliance check is NOT a blocker (Robert: "actually safe"). It is dropped as a precondition for building or publishing.
- The demo becomes "BPO Sim": country-agnostic, not Filipino-specific. The player picks a BPO-heavy country from a data list (Philippines, India, Malaysia, Vietnam, Poland, Romania, Egypt, South Africa, Kenya, Colombia, Mexico, Costa Rica). Countries differ ONLY by neutral business attributes (labor cost, time-zone overlap with the client, talent-pool size, connectivity risk, attrition, regulatory overhead). No accent or language jokes, no caricature, no national stereotyping in copy, characters or events; the cast is diverse and neutral.
- Directives: BPO_Sim_Country_Data_Directive, BPO_Sim_Repromote_And_Rename_Directive, BPO_Sim_Country_Selector_Directive, BPO_Sim_Neutral_Copy_Check_Directive (docs/directives/).
- Publishing is not part of those directives: Robert approves the deploy after the local safe check.
```

**Step 5: `docs/demos/factory_idle/DIRECTION.md`.** Append at the end of the file one line:
```
Correction 2026-10-04: the player does not land on an empty grid. getInitialGameState() applies PRESET_FACTORIES[0] (a starter line: power, two spawners, conveyors, a fitter, a packer) and the factory runs from the first second with one customer waiting; the first-step hint therefore says "your line is running, serve customers" (docs/directives/Factory_Idle_Starter_Goal_Hint_Directive.md).
```

## 4. What NOT to do

- Documentation only: no code, no config, no test edits, no `docs/children.json`, no `tests/fixtures/demo_lists_snapshot.json`.
- Do not "verify" the live deployed build or fetch anything; the README states that this is unverified and that is correct.
- Do not edit any other README, DIRECTION.md or SCOPE.md; do not rewrite the existing text of the two DIRECTION.md files (append only).
- No Lua, no engine changes, no deploys, no protected repos, no player-layer or cloud-save material.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

Baseline (real, origin/main `afb1cefe`): Grep count of `gitignored|NOT tracked|BLOCKED on intake` is 1 in `ts/src/games/corpworld/README.md` and 2 in `ts/src/games/kingmaker_squads/README.md`.
After editing, Grep tool, one call each:
- pattern `gitignored|NOT tracked|BLOCKED on intake` over both README files: no matches.
- pattern `0c416b4f` in `ts/src/games/corpworld/README.md`: 1 match; pattern `fa3f359c` in `ts/src/games/kingmaker_squads/README.md`: 1 match.
- pattern `Decision update 2026-10-04` in `docs/demos/filipino_bpo_simulator/DIRECTION.md`: 1 match; pattern `Decision 2026-10-04` in `docs/demos/house_of_kings_collab/SCOPE.md`: 1 match; pattern `Correction 2026-10-04` in `docs/demos/factory_idle/DIRECTION.md`: 1 match.
Then the existing tests that read these folders must be unaffected:
```
cd ts && npx vitest run test_registry_export.ts
```
Expected: `Test Files  1 passed (1)` / `Tests  3 passed (3)` (real baseline on origin/main).

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

- [ ] Both READMEs are replaced with the exact text above; the Grep for `gitignored|NOT tracked|BLOCKED on intake` over them is empty (real result pasted).
- [ ] The three append edits are in place (three Grep matches pasted) and nothing else in those files changed.
- [ ] `cd ts && npx vitest run test_registry_export.ts` passes (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the five files changed and whether any quoted line differed from the file. Evidence second: the Grep results and the real tail of the vitest command. Then say plainly that the live `/arcade/corpworld/` build was not compared with `examples/corpworld/` (the README says so), and that the controller does that comparison.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.
