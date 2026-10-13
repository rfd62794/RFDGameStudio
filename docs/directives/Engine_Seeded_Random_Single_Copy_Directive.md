# Engine: one mulberry32, three private copies removed, and a guard so it stays that way (roadmap M7.2, Size S)

**Depends on:** `Engine_Systems_Inventory_Directive.md` merged first (it creates `docs/ENGINE_SYSTEMS.md`, where this run adds its one rule sentence). If that file does not exist when you start, STOP and write why in the Status row.

**Read first:** `ts/src/engine/shared/seededRandom.ts` (the canonical `mulberry32`), `ts/src/engine/artGen/seededRandom.ts` (the correct re-export shape), `ts/tests/test_artgen_seeded_random.ts` (the existing sequence test), `ts/src/games/gladiator_arena/simulation/championLadder.ts` (lines 1-25 and the `ARENA_TIERS` export at line 85), `ts/src/games/scrapcrawl/playtest.ts` (lines 1-24) and `ts/src/games/scrapcrawl/utils/simulateRun.ts` (lines 1-20).

## 1. Why this exists

Roadmap M7.2 (approved 2026-09-22): finish the seeded-random consolidation and make "one canonical implementation" the rule. Measured on main (Grep for the constant `0x6d2b79f5`): three private copies of the same algorithm remain in game code, besides the canonical one.
- `championLadder.ts` lines 14-20: `ladderRandom()` is `mulberry32(0x1adde4)` written inline with module-level state.
- `scrapcrawl/playtest.ts` lines 14-22 and `scrapcrawl/utils/simulateRun.ts` lines 9-17: a function `seeded(seed)` that is `mulberry32(seed)` written out again.

The inline form differs from the shared one only in how the last two lines are grouped (`(t + imul(...)) ^ t` against `t ^= t + imul(...)`); both compute the same value, which the characterization tests below prove rather than assume. The other hits are deliberate and stay: `engine/paperDoll/techniqueUtils.ts` (a documented stateless single-step variant), `standalone/bezier_poc/bezier_blob.ts` and `standalone/technique_comparison/shared.ts` (standalone proof-of-concept folders), `ts/src/tests/helpers/seededRandom.ts` (a test helper), and the two example-folder files (`examples/planetofgreed/src/aiDecisions.ts`, `examples/7-days-to-fry/tests/lineSimulation.test.ts`), which are not part of the TS build.

## 2. Scope

1. New characterization test `ts/tests/test_seeded_random_single_copy.ts` <!-- new: ts/tests/test_seeded_random_single_copy.ts -->, written and run BEFORE any source change, in two parts:
   - Gladiator: compute `JSON.stringify(ARENA_TIERS)` (import from `../src/games/gladiator_arena/simulation/championLadder`), hash it with `node:crypto` sha256, and assert it equals a constant digest. Obtain the digest by running the test once against the unchanged source, paste the printed value into the test, and keep the test green through the whole change.
   - Scrapcrawl: call `simulateRun(seed, useCraft)` (exported by `simulateRun.ts`) for seeds 1, 2 and 3 with `useCraft` both true and false, and drive `createScrapcrawlAdapter()` plus `scrapcrawlPolicy(...)` from `playtest.ts` through one fixed-seed run using the adapter contract in `ts/src/engine/playtest/` (read `runner.ts` and the existing `ts/tests/test_playtest_scrapcrawl.ts` for the call shape). Assert each result equals a recorded constant (a digest of the JSON result, same method). Same rule: record against unchanged source first.
   - Guard: a source scan. Read every `.ts` and `.tsx` file under `ts/src` (recursive `readdirSync`, skip `node_modules`), and assert the literal `0x6d2b79f5` (case-insensitive) appears only in this allowed list, written as a constant in the test with one comment per entry: `ts/src/engine/shared/seededRandom.ts`, `ts/src/engine/paperDoll/techniqueUtils.ts`, `ts/src/standalone/bezier_poc/bezier_blob.ts`, `ts/src/standalone/technique_comparison/shared.ts`, `ts/src/tests/helpers/seededRandom.ts`. The guard fails first (three extra files), which is the red step.
2. Source changes, only after step 1 is green except for the guard:
   - `championLadder.ts`: delete the inline `ladderState` and `ladderRandom` body; add `import { mulberry32 } from '../../../engine/shared/seededRandom';` and `const ladderRandom = mulberry32(LADDER_SEED);`. Keep `LADDER_SEED` and `ladderIdCounter` as they are. Keep the explanatory comment above it, updated to say it uses the shared mulberry32.
   - `scrapcrawl/playtest.ts` and `scrapcrawl/utils/simulateRun.ts`: replace the private `seeded` body with `import { mulberry32 } from '<relative path to engine/shared/seededRandom>';` and `const seeded = mulberry32;` (keep the name `seeded` so no call site changes).
3. `docs/ENGINE_SYSTEMS.md`: add one sentence under the table paragraphs: "The one allowed seeded generator is `mulberry32` in `seededRandom.ts`; `test_seeded_random_single_copy.ts` lists the only other files allowed to hold the algorithm and why." Update the `Test` cell of the `seededRandom.ts` row to `ts/tests/test_seeded_random_single_copy.ts`.

## 3. What NOT to do

- Do not change the canonical `ts/src/engine/shared/seededRandom.ts` algorithm or its output.
- Do not touch the allow-listed files, the example-folder files, any Lua file, or any game balance, data or art.
- If a characterization digest changes after the refactor, the copies were NOT equivalent: revert that file, keep the copy, add it to the allow-list with a comment saying why, and report it. Do not adjust the recorded digest to make a test pass.

## 4. Verification

Baseline first: `cd ts && npx vitest run` once; record pass and fail counts and failing file names. Then:

```text
cd ts && npx vitest run test_seeded_random_single_copy.ts
cd ts && npx vitest run test_artgen_seeded_random.ts test_scrapcrawl_sim_runs.ts test_playtest_scrapcrawl.ts
cd ts && npx tsc --noEmit
cd ts && npx vitest run
```

Expected: the new test fails only on the guard before step 2 and passes fully after; the other listed files pass unchanged; the full failing set equals the baseline or is smaller; `tsc` has no new errors.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_seeded_random_single_copy.ts)
- Exec(cd ts && npx vitest run test_artgen_seeded_random.ts test_scrapcrawl_sim_runs.ts test_playtest_scrapcrawl.ts)
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
- No absolute paths inside this repo in any file you write; use repo-relative paths. Files already CRLF keep CRLF; new files use CRLF to match.
- New logic goes in small new modules (SOLID/SRP/KISS), one responsibility per file.
- When every Completion criteria box is checked and the verification tails are in the log line, set the Status row to **Review**. Never set it to Done. If you stop partway, set it to Blocked and write why.

## Completion criteria

- [ ] The characterization digests were recorded against unchanged source and are unchanged after the refactor.
- [ ] The three private copies are gone; the guard test passes with exactly the five allowed files.
- [ ] The four verification commands pass as described (real tails pasted).
- [ ] `docs/ENGINE_SYSTEMS.md` has the one sentence and the updated `Test` cell.
- [ ] `git diff --stat` shows only: the new test, `championLadder.ts`, the two scrapcrawl files, `docs/ENGINE_SYSTEMS.md`.
- [ ] Status row set to Review with a one-line log entry.

## Report

Findings first: which copies were removed and whether any had to stay (with the reason). Evidence second: the recorded digests, and real tails of the vitest and tsc commands. Recommended action: review, merge.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-engine-seeded-random-single-copy--9f6854 |
| Base branch | - |
| Base commit | c34e1ad106235d66fed00d9a469211541745779a |

**Status log**
- 2026-10-12 · robert-claude-laptop · none → Draft — roadmap M7.2 (approved 2026-09-22) had no directive; three verified private copies of mulberry32 remain; needs Engine_Systems_Inventory merged first
- 2026-10-12 07:53 · robert-claude-laptop · Draft → Queued
- 2026-10-12 07:53 · robert-claude-laptop · Queued → Approved — lint override: boilerplate fixture citation (demo_lists_snapshot.json) is template text, not a real dependency; Robert approved all 2026-10-12
- 2026-10-12 07:53 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-engine-seeded-random-single-copy--9f6854; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4QZCNN39ZGWTWEVPSH8JAK4
- 2026-10-12 07:54 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-engine-seeded-random-single-copy--9f6854; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-12 21:09 · devin (delegated) · In progress → Blocked — Laptop dispatch is dead: no local worktree, no dispatch log/process, no directive branch on origin; wip ref a06cb2a8 is queue bookkeeping only and already ancestor of origin/main.; under delegate.envelope
- 2026-10-12 21:09 · devin (delegated) · Blocked → Queued — Requeue the dead laptop run instead of waiting on a missing worktree; wip@a06cb2a8 has no implementation content, so dispatch fresh on the directive branch.; under delegate.requeue
<!-- queue:end -->
