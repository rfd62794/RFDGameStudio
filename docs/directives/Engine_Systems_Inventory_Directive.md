# Engine shared systems: one owner table, checked by a test (roadmap M7.1, Size S)

**Depends on:** none. This is documentation plus one test; it changes no source file under `ts/src`.

**Read first:** `docs/ROADMAP.md` (milestone M7, step M7.1), `docs/superpowers/specs/2026-09-23-engine-shared-modules.md`, `ts/src/engine/shared/index.ts` (the header comment lists the extractions), `docs/CREATURE_SYSTEM.md` (the table layout this run copies), and `ts/tests/test_character_viewer.ts` (the pattern for a test that reads a repo file).

## 1. Why this exists

`ts/src/engine/shared/` holds the cross-game systems (ADR-014): `aiBehavior`, `anatomy`, `combat`, `components`, `firestoreBackend`, `personGenerator`, `portalAdapter`, `sfx`, `sportsSim`, `voiceRecognition`, plus single files `componentTypes.ts`, `math.ts`, `partSlots.ts`, `persistence.ts`, `saveMigrations.ts`, `saveNamespace.ts`, `seededRandom.ts` and `wheelRelation.ts`. Each feeds several demos and none states its contract, who consumes it, or whether it is seeded. Roadmap M7.1 (approved 2026-09-22) asks for one table. Without a test the table goes stale the first time a system is added, so the test is part of the deliverable.

## 2. Scope

1. New `docs/ENGINE_SYSTEMS.md` <!-- new: docs/ENGINE_SYSTEMS.md --> with one table, one row per entry directly inside `ts/src/engine/shared/` (excluding `index.ts`, `.d.ts` files and `__tests__` folders). Columns, in this order: `System` (the folder or file name, backticked, for example `` `seededRandom.ts` ``), `Entry point` (repo-relative path of the file a consumer imports), `Consumers` (comma-separated demo folder names under `ts/src/games/` or `examples/`, found with Grep on imports of that system; write `none yet` when there are none), `Test` (repo-relative path of the contract test file under `ts/tests/`, or `none yet`), `Seeded` (`yes`, `no` or `n/a`).
2. Under the table, three short paragraphs: how to read it; "A second implementation of a shared system is a defect" (the rule M7.2 enforces); and "Adding a system means adding its row in the same commit".
3. New test `ts/tests/test_engine_systems_doc.ts` <!-- new: ts/tests/test_engine_systems_doc.ts -->.

## 3. The work

Write the test first and watch it fail (the doc does not exist). The test reads `docs/ENGINE_SYSTEMS.md` with `readFileSync` (resolve the repo root the way `ts/tests/test_character_viewer.ts` does), parses the table rows, and asserts:
- every entry directly inside `ts/src/engine/shared/` (except `index.ts` and `.d.ts` files) has exactly one row, and no row names an entry that does not exist (read the folder with `readdirSync`);
- every `Entry point` path exists;
- every `Test` value is `none yet` or an existing file;
- every `Consumers` value is `none yet` or a list of names that each exist as a folder under `ts/src/games/` or `examples/`;
- every `Seeded` value is one of `yes`, `no`, `n/a`.

Then write the doc until the test passes. Fill `Consumers` and `Test` from evidence only: Grep for the import path, do not guess. If a column cannot be filled from evidence, write `none yet`; that honest gap is the point of the table.

## 4. What NOT to do

- Do not change any file under `ts/src/`, `examples/` or `games/`. Do not move, rename or "fix" a system you find duplicated; list it in the report and in the doc paragraph instead (M7.2 handles seeded-random duplicates).
- Do not edit `docs/ROADMAP.md`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.
- Do not run builds, servers or deploy scripts.

## 5. Verification

Record the baseline first: `cd ts && npx vitest run` once (report pass and fail counts and the names of any failing files; pre-existing failures are baseline, not yours). Then:

```text
cd ts && npx vitest run test_engine_systems_doc.ts
cd ts && npx tsc --noEmit
cd ts && npx vitest run
```

The new test must pass, `tsc` must print no new errors compared with its baseline, and the full run must have the same failing set as the baseline or a smaller one.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_engine_systems_doc.ts)
- Exec(cd ts && npx tsc --noEmit)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

## Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename> [<bare-filename> ...]` and `cd ts && npx tsc --noEmit`. Use Read, Glob and Grep, not `ls`/`cat`. Use the bare test filename as the filter.
- Do not install, download or fetch anything. Do not read outside this worktree. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`. Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one. Deleting files is not permitted.
- No absolute paths inside this repo in any file you write; use repo-relative paths. New files use CRLF to match the repo.
- New logic goes in small new modules (SOLID/SRP/KISS), one responsibility per file.
- When every Completion criteria box is checked and the verification tails are in the log line, set the Status row to **Review**. Never set it to Done. If you stop partway, set it to Blocked and write why.

## Completion criteria

- [ ] `docs/ENGINE_SYSTEMS.md` exists with one row per shared entry and the three paragraphs.
- [ ] `ts/tests/test_engine_systems_doc.ts` exists, failed before the doc, and passes after it (real tails pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new errors; the full vitest failing set equals or is smaller than the baseline.
- [ ] `git diff --stat` shows only the two new files.
- [ ] Status row set to Review with a one-line log entry.

## Report

Findings first: the number of rows, and every system with `none yet` consumers or tests (that is the useful output). Evidence second: real tails of the vitest and tsc commands. Recommended action: review, merge.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-12 · robert-claude-laptop · none → Draft — roadmap M7.1 (approved 2026-09-22) had no directive; documentation plus a guard test, no source changes
- 2026-10-12 07:03 · robert-claude-laptop · Draft → Queued
- 2026-10-12 07:07 · robert-claude-laptop · Queued → Approved — lint override: boilerplate fixture citation (demo_lists_snapshot.json) is template text, not a real dependency; Robert approved all 2026-10-12
<!-- queue:end -->
