# Engine anatomy: a contract test at the public entry point (roadmap M7.3, first system, Size S)

**Depends on:** `Engine_Systems_Inventory_Directive.md` merged first (this run updates the `Test` cell of the `anatomy` row in `docs/ENGINE_SYSTEMS.md`). If that file does not exist when you start, STOP and write why in the Status row. No other overlap: this run adds one test file and one table cell.

**Read first:** `ts/src/engine/shared/anatomy/anatomyModule.ts` (all 357 lines), `ts/src/engine/shared/anatomy/types.ts`, `ts/src/engine/shared/anatomy/index.ts`, and `ts/tests/test_mbb_body_part_synergy.ts` (lines 1-60: the existing indirect coverage, which tests Mutant Battle Ball's use of `calculateLeanCompatibility` and `calculateCompatibility`, not the module's own contract).

## 1. Why this exists

Roadmap M7.3 (approved 2026-09-22): the systems the arcade meta layer will lean on get a contract test at the public entry point, so a change that breaks a demo fails in the engine first. `ts/src/engine/shared/anatomy/` is imported by Gladiator Arena (`App.tsx`, `ArenaCombatView.tsx`, `MedbayView.tsx`, `CompatibilityInspector.tsx` and others) and by Mutant Battle Ball, yet Grep over `ts/tests` finds only the one MBB test that touches it. Nothing pins `applyDamageToSlot`, `calculatePartEfficiency`, `rollHitSlot`, `rollMalfunction` or `getGladiatorAnatomySummary`. Gladiator Arena's combat timing and Medbay scarring both depend on them. `combat`, `personGenerator` and `portalAdapter` already have their own test files, so anatomy is the first gap; the others are separate runs.

## 2. Scope

New test `ts/tests/test_engine_anatomy_contract.ts` <!-- new: ts/tests/test_engine_anatomy_contract.ts -->, importing only from `../src/engine/shared/anatomy` (the public entry point). A local `makePart(slot, overrides)` helper builds a `BodyPart` (fill every field of the interface in `types.ts`). Tests, each asserting behaviour read from the source above:

1. `BODY_SLOTS` has six unique slots and `SLOT_WEIGHTS` has an entry for each; the six `hitProbability` values sum to 1 (tolerance 1e-9); `head` and `torso` are the only `vital: true` slots.
2. `calculatePartEfficiency`: full HP gives 1; 0 HP gives 0; a part with `scarHpPenalty` uses `maxHp - scarHpPenalty` as the denominator (for example maxHp 10, scar 2, currentHp 4 gives 0.5); the result is always within 0 to 1, including when `currentHp` exceeds the effective max or is negative.
3. `applyDamageToSlot` severity ladder, one case each, with `armor: 0` and `Math.random` stubbed to a fixed value above 0.35 so scarring is deterministic: damage ratio below 0.2 gives `normal`; 0.2 to below 0.45 gives `bruised`; at or above 0.45 gives `stunned`; damage that takes HP to 0 with ratio at or below 0.7 gives `crippled`; to 0 with ratio above 0.7, or any crit that reaches 0, gives `dismembered`. Assert `actualDamage` is at least 1 even with armor far above the damage, and that armor never removes more than 70 percent of raw damage.
4. `applyDamageToSlot` MUTATES its input part (it writes `currentHp` and `scarHpPenalty`). The doc comment above it calls it "pure"; the contract is that it is not. Assert the mutation explicitly with a comment saying why, and that `scarHpPenalty` never exceeds `maxHp - 2` after repeated calls.
5. `rollHitSlot`: with no targeted slot and `Math.random` stubbed to 0.99 it returns `right_leg` (the cumulative weights in `BODY_SLOTS` order are 0.15, 0.5, 0.625, 0.75, 0.875, 1.0; confirm by running it, and a stub of 0.1 returns `head`, 0.4 returns `torso`). With a targeted slot and a stub below 0.65 it returns the targeted slot. Over 1,000 draws with a seeded stub (use `mulberry32` from `../src/engine/shared/seededRandom`) every returned value is one of `BODY_SLOTS`.
6. `rollMalfunction`: a subject whose `calculateCompatibility` report has `malfunctionRiskPercent` of 0 always returns `{ triggered: false, effect: null }` without calling `Math.random` (spy and assert zero calls); a subject with risk above 0 and `Math.random` stubbed to 0 returns `triggered: true`, a non-null `effect` string and a `slotAffected` that is a member of `BODY_SLOTS`.
7. `getGladiatorAnatomySummary`: totals equal the sums over `BODY_SLOTS`, and the efficiencies it reports equal `calculatePartEfficiency` per slot (read the rest of the function, lines 60-95, for the exact returned keys and assert those).

Restore any stubbed `Math.random` in `afterEach` (`vi.restoreAllMocks()`).

Then in `docs/ENGINE_SYSTEMS.md`, set the `Test` cell of the `anatomy` row to `ts/tests/test_engine_anatomy_contract.ts`.

## 3. What NOT to do

- Do not change `anatomyModule.ts`, `types.ts` or any game file. If a test reveals a defect, write the test to the current behaviour with a `// KNOWN:` comment, and describe the defect in the report; do not fix it here.
- Do not weaken a test to make it pass: if your reading of the source and the result disagree, the source wins and the test expectation changes, with the reason in a comment.
- Do not touch the Gladiator or MBB tests.

## 4. Verification

Baseline first: `cd ts && npx vitest run` once; record pass and fail counts and failing file names. Then:

```text
cd ts && npx vitest run test_engine_anatomy_contract.ts
cd ts && npx vitest run test_engine_systems_doc.ts test_mbb_body_part_synergy.ts
cd ts && npx tsc --noEmit
cd ts && npx vitest run
```

The new file must show at least 7 passing tests. The other listed files must stay green. The full failing set must equal the baseline or be smaller; `tsc` must show no new errors.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_engine_anatomy_contract.ts)
- Exec(cd ts && npx vitest run test_engine_systems_doc.ts test_mbb_body_part_synergy.ts)
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

- [ ] `ts/tests/test_engine_anatomy_contract.ts` exists with at least 7 passing tests covering items 1 to 7.
- [ ] The `anatomy` row of `docs/ENGINE_SYSTEMS.md` names the new test.
- [ ] Verification commands pass as described (real tails pasted); full failing set equals or is smaller than baseline.
- [ ] `git diff --stat` shows only the new test and `docs/ENGINE_SYSTEMS.md`.
- [ ] Status row set to Review with a one-line log entry.

## Report

Findings first: the test count, and any behaviour that contradicts a doc comment (item 4 is the known one). Evidence second: real tails of the vitest and tsc commands. Recommended action: review, merge.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Blocked |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-engine-anatomy-contract-test-directive |
| Base branch | - |
| Base commit | 1400b1a005f50f323b421c95fd008c76d7c6c63d |

**Status log**
- 2026-10-12 · robert-claude-laptop · none → Draft — roadmap M7.3 (approved 2026-09-22), first system; anatomy has only indirect MBB coverage; needs Engine_Systems_Inventory merged first
- 2026-10-12 07:53 · robert-claude-laptop · Draft → Queued
- 2026-10-12 07:56 · robert-claude-laptop · Queued → Approved — lint override: boilerplate fixture citation (demo_lists_snapshot.json) is template text, not a real dependency; Robert approved all 2026-10-12
- 2026-10-12 07:56 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-engine-anatomy-contract-test-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4QZHBR3RWZK9G9ZY34YM2RA
- 2026-10-12 07:57 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-engine-anatomy-contract-test-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-12 21:09 · devin (delegated) · In progress → Blocked — Laptop dispatch is dead: no local worktree, no dispatch log/process, no directive branch on origin; wip ref 6b6253fe is queue bookkeeping only and already ancestor of origin/main.; under delegate.envelope
<!-- queue:end -->
