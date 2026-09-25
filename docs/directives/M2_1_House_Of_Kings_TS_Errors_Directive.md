# ROADMAP M2.1: fix the three pre-existing TS errors in house_of_kings_collab so the global build compiles

**Read first:** `docs/ROADMAP.md` lines 84-100 (step `M2.1`, under milestone `M2`, "The
global arcade build compiles clean"), and the two files this directive edits:
`ts/src/games/house_of_kings_collab/server/routes/houseRoutes.ts` and
`ts/src/games/house_of_kings_collab/server/routes/taskRoutes.ts`.

## 1. Why this exists

Measured 2026-09-24 on `main` (commit `baddaa33`), `cd ts && npm run build` fails at the
`tsc` step with exit code 2 and exactly these three errors:

```
> rfdgamestudio-ts@0.2.0 build
> tsc && vite build

src/games/house_of_kings_collab/server/routes/houseRoutes.ts(21,10): error TS6133: 'evaluateHouseFestival' is declared but its value is never read.
src/games/house_of_kings_collab/server/routes/taskRoutes.ts(471,15): error TS6133: 'dailyActionsConsumed' is declared but its value is never read.
src/games/house_of_kings_collab/server/routes/taskRoutes.ts(499,7): error TS2783: 'success' is specified more than once, so this usage will be overwritten.
```

These are the only three errors; the build reaches `tsc` and stops there (never reaches
`vite build`). ROADMAP step `M2.1` ("Fix the three pre-existing TS errors in
house_of_kings_collab") is this work. When your run completes (whatever the outcome), edit
`docs/ROADMAP.md` and set step `M2.1`'s `directive:` field (currently `''`) to
`M2_1_House_Of_Kings_TS_Errors_Directive.md`. Leave `status: pending` as-is — Robert sets it
to `done` himself after he reviews and merges; that is not yours to change.

## 2. Scope

Only these two files, only the three lines named above:

- `ts/src/games/house_of_kings_collab/server/routes/houseRoutes.ts` (line 21)
- `ts/src/games/house_of_kings_collab/server/routes/taskRoutes.ts` (lines 471 and 499)
- `docs/ROADMAP.md` (the one `directive:` field for step `M2.1`, described above)

## 3. The work

### 3.1 `houseRoutes.ts` line 21 — TS6133 unused import

Current (lines 16-26):

```ts
  resolveActionsState,
  specializationDiscount,
  HouseSpecialization,
} from '../../types';
import { resolveKingdomAggregateActionsState } from '../../lib/actionsAllocation';
import { evaluateHouseFestival, checkAndEvaluateHouseFestivalIfNeeded } from '../functions/evaluateHouseFestival';

export const houseRouter = Router();

function parseResources(rawResources: any, rawDoc?: any): { food: number; wood: number; stone: number } {
  let food = 0;
```

`evaluateHouseFestival` does not appear anywhere else in this file (confirmed with
`grep -n "evaluateHouseFestival" houseRoutes.ts` — the only hit is this import line);
`checkAndEvaluateHouseFestivalIfNeeded` is used elsewhere in the file and must stay. Remove
just `evaluateHouseFestival` from the import list, keeping the other name:

```ts
import { checkAndEvaluateHouseFestivalIfNeeded } from '../functions/evaluateHouseFestival';
```

### 3.2 `taskRoutes.ts` line 471 — TS6133 unused local

Current (lines 468-481):

```ts
      transaction.set(playerRef, playerUpdates, { merge: true });

      // Kingdom aggregate actions counter update
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);
      if (needsKingdomActionsReset) {
        transaction.set(kingdomRef, {
          dailyActionsConsumed: 1,
          dailyActionsResetAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        transaction.set(kingdomRef, {
          dailyActionsConsumed: FieldValue.increment(1),
        }, { merge: true });
      }
```

The destructured local `dailyActionsConsumed` is never referenced in this block — the two
branches write a literal `1` or use `FieldValue.increment(1)`, neither of which needs the
current count. Contrast this with the *other* call site of the same helper at line 102 of
this file, where the destructured `dailyActionsConsumed` local **is** used (`const
newAggregateConsumed = dailyActionsConsumed + 1;`), so `resolveKingdomAggregateActionsState`
legitimately returns both fields for that caller. At line 471 only `needsReset` drives the
branch. This is not an accidentally-orphaned computation (there is no missing follow-up use
to restore) — it is a value this call site never needed. Remove the unused binding from the
destructure, keep `needsReset`:

```ts
      const { needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);
```

Do not change `resolveKingdomAggregateActionsState` itself and do not touch the line-102 call
site — it already uses its `dailyActionsConsumed`.

### 3.3 `taskRoutes.ts` line 499 — TS2783 duplicate `success`

Current (lines 483-503, the transaction's return value and the response built from it):

```ts
      return {
        success: true,
        retiredDescendant: retiredRecord,
        newHeir: {
          generation: nextGen,
          name: newName,
          title: newTitle,
        },
        dynastyLineageCount: (Array.isArray(playerData.dynastyLineage) ? playerData.dynastyLineage.length : 0) + 1,
        actionsRemainingToday: remaining - 1,
        legacyRelicsPreserved: existingRelics.length,
        inauguralExpeditionBonus: true,
      };
    });

    return res.json({
      success: true,
      verifiedUserId: userId,
      ...resultData,
      message: `Royal succession complete! Generation ${resultData.newHeir.generation} begins under ${resultData.newHeir.name}.`,
    });
```

`resultData` is the transaction's return value above, which already has `success: true`
(line 484). At line 498-503, the object literal sets `success: true` explicitly and then
spreads `...resultData` after it — since a later spread wins over an earlier explicit
property with the same key, TS2783 is telling you the explicit `success: true` on line 499
is dead: it gets silently overwritten by `resultData.success` from the spread. Both values
are `true`, so there is no behavior difference either way, but keep the one TypeScript says
wins (the spread) and delete the now-redundant explicit line:

```ts
    return res.json({
      verifiedUserId: userId,
      ...resultData,
      message: `Royal succession complete! Generation ${resultData.newHeir.generation} begins under ${resultData.newHeir.name}.`,
    });
```

`res.json(...)` still resolves `success: true` — it now comes from `resultData` via the
spread instead of being written twice.

## 4. What NOT to do

- No behavior change to any server route. `success` stays `true` in the response; the
  Kingdom aggregate counter update logic (the `if (needsKingdomActionsReset)` branch) is
  unchanged.
- No test deletions or test edits.
- No changes outside `ts/src/games/house_of_kings_collab/server/routes/` except the single
  `docs/ROADMAP.md` `directive:` field described in §1.
- Do not touch `houseRoutes.ts` or `taskRoutes.ts` line 102 or any other line not named in
  §3.
- Do not set `status: done` on ROADMAP step `M2.1` — that is Robert's, after he merges.

## 5. Verification

Run from the repo root unless noted.

- `uv run python --version` — confirm `3.12.x` before running any Python command (informational
  only; this directive has no Python changes).
- `cd ts && npm run build` — expected: `tsc` runs silent (no output, exit 0), then `vite
  build` runs and its output ends in a line containing `built in` (e.g. `✓ built in
  NNs`). Any `tsc` error means the fix is incomplete.
- `cd ts && npx vitest run --retry=2 --exclude tests/test_shoal_y8_integration.ts` — this is
  the exact command `scripts/check.ps1` runs for "TypeScript tests" (confirmed by reading
  that script; it is what `.githooks/pre-push` invokes). Measured on `main` today before
  this change: 158 test files, 1900 tests, all passed, 0 skipped, vitest v2.1.9. No new
  failures.
- `cd ts && npx vitest run --retry=2 tests/test_shoal_y8_integration.ts` — this file is run
  alone (it rebuilds `dist-shoal` and races with parallel tests) — this is
  `scripts/check.ps1`'s separate "TypeScript build test" step. Measured on `main` today: 16
  tests, all passed. No new failures.
- `cd ts && npx vitest run tests/test_house_of_kings_server_prod.ts` — the targeted check for
  this game's server routes (22 tests). All must pass.

## 6. Rules for this run

- NON-INTERACTIVE: any tool call that requires confirmation ends the run. No installs,
  downloads, or fetches. No reads outside the worktree.
- Never use `git -C` / `git -c` / `git --git-dir` / `git --work-tree` — flag forms are
  denied by dispatch policy and a denial ends the run. Run git with the worktree as your
  working directory.
- Free models only where the work touches model configuration (not applicable here — no
  model config in scope).
- Create no scratch or debug files. If one is genuinely needed, put it under
  `.devin-scratch/` and leave it there (deleting is denied in the sandbox).
- Branch `directive/rfdgamestudio-m2-1-house-of-kings-ts-errors` from `main`. Never commit
  to `main`, never push, never merge, never deploy.
- Do not search, glob, or hunt for anything beyond the two files and lines named in §3. If
  something expected is missing or does not match what is pasted above, stop and write why
  in the Status row rather than trying another way around it.
- If a tool call is genuinely blocked, stop and write why in the Status row.

## 7. Completion criteria

- [ ] `houseRoutes.ts` line 21 no longer imports `evaluateHouseFestival`;
      `checkAndEvaluateHouseFestivalIfNeeded` import is unchanged.
- [ ] `taskRoutes.ts` line 471's destructure only binds `needsReset: needsKingdomActionsReset`
      (no `dailyActionsConsumed`); the line-102 call site is untouched.
- [ ] `taskRoutes.ts`'s `res.json(...)` block (was lines 498-503) no longer has an explicit
      `success: true` before `...resultData`; `resultData` (still `success: true` at line
      484) supplies it via the spread.
- [ ] `cd ts && npm run build` exits 0: `tsc` silent, `vite build` output ends in `built in`.
- [ ] `cd ts && npx vitest run --retry=2 --exclude tests/test_shoal_y8_integration.ts` — 0
      failed.
- [ ] `cd ts && npx vitest run --retry=2 tests/test_shoal_y8_integration.ts` — 0 failed.
- [ ] `cd ts && npx vitest run tests/test_house_of_kings_server_prod.ts` — 22 tests, 0 failed.
- [ ] `docs/ROADMAP.md` step `M2.1`'s `directive:` field is set to this filename.

## Sandbox needs

- Exec(npm run build)
- Exec(npx vitest)

## 8. Report

In the Status row: the diff summary (3 one-line edits across 2 files), the `npm run build`
tail (the `built in` line), the three vitest tails (files/tests/passed/failed counts for
each of the three commands in §5), and confirmation that the `M2.1` `directive:` field was
set. State plainly whether all three original `tsc` errors are gone and no new ones appeared.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-m2-1-house-of-kings-ts-errors-directive |
| Base branch | - |
| Base commit | 25b51c9532a2aa884262e36db70c514996f2e978 |

**Status log**
- 2026-09-24 12:59 · robert-claude-laptop · none → Queued — ROADMAP M2.1; the real global-build failure (3 tsc errors in house_of_kings_collab), measured 2026-09-24
- 2026-09-24 13:06 · robert-claude-laptop · Queued → Approved
- 2026-09-24 13:08 · dispatcher · Approved → In progress — dispatched devin-laptop on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-m2-1-house-of-kings-ts-errors-directive; base origin/main (local main differs); copied ts/src/games/game-metadata.json; lane=strong; model=default
- 2026-09-24 13:34 · agentflow-tick · In progress → Blocked — process gone while the directive still reads In progress; resume cap reached (2/2)
- 2026-09-24 20:03 · robert-claude-laptop · Blocked → Queued
- 2026-09-24 20:03 · robert-claude-laptop · Queued → Approved
<!-- queue:end -->
