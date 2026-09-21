# Demo importer, Task 4: replace the hand-kept lists with the derived functions

## 1. Why this exists

The demo importer plan was written on 2026-09-19 and is being executed task by task. Tasks
1, 2 and 3 are done and committed on `feature/demo-importer`; this directive is Task 4.

Delete `_EXAMPLE_DEMOS`, `_DEMO_STATIC_NAME`, `_DEMO_EXTERNAL_PATHS`, `GAME_PATHS`
and `_EXTERNAL_REPOS`, and route every caller through the derived functions added
in Task 3.

The plan is unusually complete: exact code per step, TDD ordering, and every assumption
about the repo verified before work began. It is the specification. This directive is the
wrapper that says which part is yours and what must not move.

## 2. Scope

Modify `studio_mcp/game_metadata.py`, `studio_mcp/tools.py`, and three test files.

**Read first:** `docs/superpowers/plans/2026-09-19-demo-importer.md`, **Task 4**. Follow its steps exactly and
in order - it carries the exact code, the TDD ordering (write the failing test, confirm the
failure, then implement), and the Global Constraints at the top of the file. This directive
does not restate them; where the two differ, the plan wins.

**Step 1 is already done, and the file is present in this worktree.** `.superpowers/metadata-before.json` was captured on
2026-09-20 from the pre-change code (35 games). Do NOT regenerate it: it is the
baseline Step 6 diffs against, and recapturing it after editing would compare the
new code against itself and always show no change.

Step 6 asks for a behaviour diff. **Report it; do not fix it.** Expected differences
are `brewfield` disappearing and some games gaining dates from newly included
example/intake paths. Anything else is a real finding for Robert to rule on.

### Before you start: one fact you would otherwise go looking for

`ts/src/games/registry-export.json` does **not** exist in this worktree - it is gitignored,
and it is generated. `demo_registry.load_registry()` regenerates it by running
`npx vite-node tools/export-registry.ts` in `ts/`, and `ts/node_modules` is present here, so
that works offline and needs no install. You do not need to fetch, install or look anything
up to make it appear; just let `load_registry()` run, or run that command yourself from `ts/`.

Its shape, generated 2026-09-20: `{"generatedAt": "<iso>", "games": [...]}` with 34 games,
11 of which carry a `source` key.

### Do not go looking for files

Everything you need is in this worktree. **Do not search, glob, or read outside it, and do
not use a memory or web tool** - every one of those is a confirmation prompt that ends the
run, which is how the two previous attempts at this directive died. If a file you expect is
genuinely absent, stop and say so in the Status row rather than hunting for it.

## 3. The work

Work through the plan's Task 4 steps in order, top to bottom. Each step states what to
write and what to run. Do not reorder them, and do not skip the "run and confirm failure"
steps - a test that was never seen to fail has not been shown to test anything.

## 4. What NOT to do

- **Do not regenerate `.superpowers/metadata-before.json`.**
- **Do not change the derivation rules** in `studio_mcp/demos/registry.py`; Task 3's
  parity tests pin them.
- **Do not silence a parity failure by editing `tests/fixtures/demo_lists_snapshot.json`.**
  If parity breaks, that is a real behaviour change: stop and report the exact difference.
- **Do not start another task** in the plan, even if it looks small.
- **Do not edit the plan file itself.**

## 5. Verification

```bash
uv run pytest -q -p pytest_rerunfailures tests/test_game_metadata.py tests/test_studio_mcp.py tests/test_cross_pipeline_version_tracking.py tests/test_prepare_site_arcade.py tests/test_demos_registry.py tests/test_demos_registry_parity.py
```

Then confirm the old names are gone; the plan's Step 5 gives the exact grep.
Expected: tests PASS, and the only surviving hits are the test-local
`GAME_PATHS = game_paths()` alias and its uses in `tests/test_game_metadata.py`.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected
  outright and the run ends mid-task. Do not install, download or fetch anything - the
  dependencies are already present in this worktree. Do not read outside this working
  directory, and do not use a memory or search tool to look something up; if you find
  yourself needing a fact that is not here or in the repo, stop and say so in the Status row.
- Test commands for this repo, exactly: `uv run pytest -q -p pytest_rerunfailures <file>`
  for Python, `cd ts && npx vitest run <file>` for TypeScript. Do not guess another runner.
- Follow the plan's Global Constraints section as written. In particular, verification is
  deterministic only: `zip_verify` via `ZipVerifier(...).analyze()`, never `verify()` or
  `write_report()`, which call OpenRouter and cost real money.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never
  deploy.** Only Robert merges.
- Update this directive's Status row when you finish or stop partway - DirectiveQueueMCP
  reads it across every repo.
- If a tool call is genuinely blocked, stop and write why in the Status row instead of
  trying another way around it.

## 7. Completion criteria

- [ ] Every step of the plan's Task 4 is done, in order.
- [ ] Each new test was seen to fail before its implementation existed.
- [ ] The verification commands above pass.
- [ ] Nothing outside this task's stated files changed.
- [ ] The Status row is updated.

## 8. Report

State which steps you completed, the verification output, and anything the plan assumed
that turned out not to be true in the repo. If you had to deviate, say where and why - a
silent deviation is worse than a reported one.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-demo-importer-t4-derived-lists-directive |
| Base branch | feature/demo-importer |

**Status log**
- 2026-09-20 21:23 · robert-claude · none → Queued — Task 4 of 8; builds on feature/demo-importer where Tasks 1-3 are committed
- 2026-09-20 21:23 · robert-claude · Queued → Approved
- 2026-09-20 21:23 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-demo-importer-t4-derived-lists-directive
- 2026-09-20 21:38 · robert-claude · In progress → Blocked — run died on a confirmation prompt after reading the full context; retrying
- 2026-09-20 21:38 · robert-claude · Blocked → Queued — added the registry-export.json fact (gitignored, generated by npx vite-node, node_modules present) so nothing needs looking up
- 2026-09-20 21:38 · robert-claude · Queued → Approved
- 2026-09-20 21:38 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-demo-importer-t4-derived-lists-directive
- 2026-09-20 21:41 · robert-claude · In progress → Blocked — root cause: .superpowers/metadata-before.json is gitignored so the worktree never had it; agent died reaching for a file that was not there
- 2026-09-20 21:41 · robert-claude · Blocked → Queued — baseline copied into the worktree; directive now forbids searching and says to stop rather than hunt
- 2026-09-20 21:41 · robert-claude · Queued → Approved
- 2026-09-20 21:41 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-demo-importer-t4-derived-lists-directive
- 2026-09-20 22:00 · robert-claude · In progress → Review — Hand-kept lists removed, 49 tests pass, parity holds. Commit 1bdbea1d. OPEN FINDING: Step 6's metadata diff showed slimebreeder changing completely and corpworld losing a BOM; the run died mid-investigation, so whether those are real or worktree-environmental is unresolved and needs a look before merge.
<!-- queue:end -->
