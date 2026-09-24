# Demo importer: salvage Tasks 1-3 from feature/demo-importer onto a fresh branch

**Read first:** `docs/superpowers/plans/2026-09-19-demo-importer.md` (this plan exists on
`main` already, but `main`'s copy has every checkbox unchecked and no status banner — step
1 of §2 below replaces it with the branch's updated copy, pasted into this directive
verbatim so you never need to read the branch), and
`docs/superpowers/specs/2026-09-19-demo-importer-design.md` if it exists in your worktree
(read it only if present; do not search for it if it is not — the plan file above is
sufficient context for Tasks 1-3).

## 1. Why this exists

Branch `feature/demo-importer` (16 commits, last dated 2026-09-22) cannot merge to `main`:
5 conflicts in `docs/directives/*.md` queue tables, where `main` has since moved those
rows to `Done`, plus unrelated commits mixed into the branch. Only three of its sixteen
commits carry Tasks 1-3 of the plan and touch only `ts/` and `studio_mcp/demos/`:

```
7c4a7196 registry: GameConfig.source and a configs-only registry export for Python tooling
a6fdf35b registry: demos markers; invariants replace the pinned order and count
ead5478d demos: derive demo lists and GAME_PATHS from the registry export (with parity snapshot)
```

Confirmed file lists (`git show --stat <hash>`, run 2026-09-24):

`7c4a7196` — 17 files changed, 106 insertions(+), 5 deletions(-):
```
.gitignore
ts/src/arcade-manifest/registryExport.ts
ts/src/engine/types.ts
ts/src/games/7_days_to_fry/config.ts
ts/src/games/antsim_redux/config.ts
ts/src/games/corpworld/config.ts
ts/src/games/facility_escape/config.ts
ts/src/games/kingmaker_squads/config.ts
ts/src/games/ledger/config.ts
ts/src/games/slimebreeder/config.ts
ts/src/games/slimegarden/config.ts
ts/src/games/slimeworld/config.ts
ts/src/games/systemic_extract/config.ts
ts/src/games/trinity_siege/config.ts
ts/tests/test_registry_export.ts
ts/tools/export-arcade-manifest.ts
ts/tools/export-registry.ts
```

`a6fdf35b` — 2 files changed, 49 insertions(+), 48 deletions(-):
```
ts/src/games/registry.ts
ts/tests/test_arcade_registry_directive.ts
```

`ead5478d` — 7 files changed, 370 insertions(+):
```
studio_mcp/demos/__init__.py
studio_mcp/demos/registry.py
studio_mcp/demos/result.py
tests/fixtures/demo_lists_snapshot.json
tests/fixtures/registry_export_sample.json
tests/test_demos_registry.py
tests/test_demos_registry_parity.py
```

All three are confirmed not yet on `main` (`git merge-base --is-ancestor 7c4a7196 main`
returned false, checked 2026-09-24). All three touch only `ts/` and `studio_mcp/demos/` /
`tests/` — nothing under `docs/directives/`.

## 2. Scope

1. The plan file `docs/superpowers/plans/2026-09-19-demo-importer.md`, replaced as described
   below.
2. Cherry-picking exactly the three commits above, in that order, onto a fresh branch.
3. Nothing else. Do not touch any other file, commit, or branch.

## 3. The work

### 3.1 Create the branch

From `main`, create and switch to `directive/rfdgamestudio-demo-importer-t1-t3-salvage`.

### 3.2 Cherry-pick

Run, in this exact order:

```
git cherry-pick 7c4a7196
git cherry-pick a6fdf35b
git cherry-pick ead5478d
```

If **any** of the three conflicts: run `git cherry-pick --abort` immediately, stop all
further work on this directive, and write the conflicting file paths (from the conflict
output) into the Status row. Do not resolve conflicts by hand, do not skip the offending
commit, do not try a different order.

### 3.3 Update the plan file's status banner

`docs/superpowers/plans/2026-09-19-demo-importer.md` already exists on `main` (and now on
your branch, unchanged by the cherry-picks above — none of the three commits touch it). Its
current copy has every step under Tasks 1-3 as an unchecked `- [ ]` box and no status
banner; the checkboxes for Tasks 1-3 should now read `- [x]` to match the work you just
cherry-picked, and a status banner should mark where the plan stands. Rather than editing
~30 individual checkboxes by hand, replace the whole file with the version below (this is
the branch's own copy of the file as it stood after Tasks 1-3, with only the status banner
text changed to describe this salvage — everything else, including every `- [x]` on Tasks
1-3 and every `- [ ]` still open under Task 4 onward, is unchanged from that copy). Fetch it
with:

```
git show feature/demo-importer:docs/superpowers/plans/2026-09-19-demo-importer.md > docs/superpowers/plans/2026-09-19-demo-importer.md
```

Then open the file and replace this banner (it is the first blockquote after the initial
line, right after the first `---`, near the top of the file, immediately before
`## Task 1: `GameConfig.source`, the registry export, optional metadata`):

```
> **STATUS 2026-09-20: Tasks 1, 2 and 3 are DONE** on branch `feature/demo-importer`
> (commits `7c4a7196`, `a6fdf35b`). Verified: 26 targeted tests pass; the full TS suite
> is 1674 passed / 1 failed, and that one failure
> (`test_game_loader_back_button_returns_clean_url`) also fails on `main`, so it is
> pre-existing. Task 3 adds studio_mcp/demos (8 tests, parity holds). Resume at Task 4.
```

with exactly this text:

```
> **STATUS 2026-09-24: Tasks 1, 2 and 3 salvaged onto branch
> `directive/rfdgamestudio-demo-importer-t1-t3-salvage`** via cherry-pick of `7c4a7196`,
> `a6fdf35b`, `ead5478d` from the abandoned `feature/demo-importer` branch, which could not
> merge to `main` (conflicts in `docs/directives/*.md` queue tables plus unrelated commits
> mixed into its other 13 commits). Tasks 4-8 are pending as separate future directives —
> do not resume them on this branch.
```

Everything else in the file (all Task 1-3 `- [x]` boxes, all Task 4-8 `- [ ]` boxes, all
other content) stays exactly as the branch had it — do not hand-edit anything beyond that
one banner.

### 3.4 Verify

Run the confirmed test commands (see §5) and record both tails.

## 4. What NOT to do

- Do not merge or rebase `feature/demo-importer` into anything.
- Do not delete `feature/demo-importer` or any of its remote copies.
- Do not touch any file under `docs/directives/*.md` (the status-table conflicts that
  blocked the original branch are exactly what you must not go near).
- Do not start Task 4 or any later task from the plan.
- Do not cherry-pick, merge, or otherwise pull in any of the branch's other 13 commits.
- Never push, never merge to `main`, never commit to `main`.

## 5. Verification

Run from the repo root unless noted. Both must show 0 failed; compare against the baselines
below, measured 2026-09-24 on `main` before this branch existed.

- `uv run python --version` — confirm `3.12.x`.
- Python (this is the exact command `scripts/check.ps1` runs for "Python tests (slow and
  e2e excluded)", which is what `.githooks/pre-push` invokes. Do NOT run `uv sync` (it is a
  package mutation the sandbox refuses; the worktree's `.venv` is already synced). Regenerate
  the metadata first, same as the script does):
  ```
  uv run --no-sync python -m studio_mcp.game_metadata
  PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 uv run --no-sync python -m pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2
  ```
  Baseline measured on `main` today: **828 passed, 31 deselected**.
- TypeScript (this is the exact command `scripts/check.ps1` runs for "TypeScript tests" and
  its separate "TypeScript build test" step, from `cd ts`):
  ```
  cd ts && npx vitest run --retry=2 --exclude tests/test_shoal_y8_integration.ts
  cd ts && npx vitest run --retry=2 tests/test_shoal_y8_integration.ts
  ```
  Baseline measured on `main` today: **1900 passed** (158 files, first command) plus
  **16 passed** (1 file, second command) — 1916 total, 0 skipped, vitest v2.1.9.

## 6. Rules for this run

- NON-INTERACTIVE: any tool call that requires confirmation ends the run. No installs,
  downloads, or fetches beyond what §5 names. No reads outside the worktree.
- Never use `git -C` / `git -c` / `git --git-dir` / `git --work-tree` — flag forms are
  denied by dispatch policy and a denial ends the run. Run git with the worktree as your
  working directory.
- Free models only where the work touches model configuration (not applicable — no model
  config in scope).
- Create no scratch or debug files. If one is genuinely needed, put it under
  `.devin-scratch/` and leave it there (deleting is denied in the sandbox).
- Branch `directive/rfdgamestudio-demo-importer-t1-t3-salvage` from `main`. Never commit to
  `main`, never push, never merge, never deploy.
- Do not search, glob, or hunt for anything beyond what this directive names. If something
  expected is missing or a cherry-pick conflicts, stop and write it in the Status row
  rather than trying another way around it.
- If a tool call is genuinely blocked, stop and write why in the Status row.

## 7. Completion criteria

- [ ] Branch `directive/rfdgamestudio-demo-importer-t1-t3-salvage` created from `main`.
- [ ] `7c4a7196`, `a6fdf35b`, `ead5478d` cherry-picked in that order with no conflicts (or,
      if any conflicted, the run stopped, aborted, and reported the conflicting paths —
      that also counts as complete).
- [ ] `docs/superpowers/plans/2026-09-19-demo-importer.md` replaced with the branch's
      version and the status banner updated to the exact text in §3.3.
- [ ] Python: `828 passed, 31 deselected` or better (no new failures).
- [ ] TypeScript: `1900 passed` (main run) + `16 passed` (shoal file) or better (no new
      failures).

## Sandbox needs

- Exec(npm run build)
- Exec(npx vitest)
- Exec(npm test)
- Exec(uv run pytest)

## 8. Report

In the Status row: the three cherry-picked commit hashes as they now exist on the new
branch (they get new hashes after cherry-pick — report the new ones), both test tails (the
Python pass/deselect line and both vitest pass/fail summaries), and whether the plan file
was carried and its banner updated. If a cherry-pick conflicted, report only the aborted
state and the conflicting paths — no further steps.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin-laptop |
| Branch | directive/rfdgamestudio-demo-importer-salvage-t1-t3-directive |
| Base branch | - |
| Base commit | 761f737a09e2a777e51676e51cc9ab7e4ef574e5 |

**Status log**
- 2026-09-24 13:01 · robert-claude-laptop · none → Queued — salvage of feature/demo-importer Tasks 1-3 (3 clean commits) onto a fresh branch; the old branch has 5 queue-table conflicts vs main
- 2026-09-24 13:08 · robert-claude-laptop · Queued → Approved
- 2026-09-24 13:20 · dispatcher · Approved → In progress — dispatched devin-laptop on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-demo-importer-salvage-t1-t3-directive; base origin/main (local main differs); copied ts/src/games/game-metadata.json; lane=strong; model=default
<!-- queue:end -->
