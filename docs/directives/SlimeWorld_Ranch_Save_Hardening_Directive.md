# SlimeWorld ranch: harden `isRanchState` against malformed `sales`/`nextId`/`actionCount`

## Why this exists

`ts/src/games/slimeworld/ranch/save/ranchSave.ts` `isRanchState` checks `Array.isArray(v.sales)` but not each entry's shape — a foreign save with `sales: [null]` passes the guard, then `market.recentSales` throws on `s.speciesId`. `nextId`/`actionCount` accept `typeof === 'number'` so `NaN`/`Infinity`/negatives also pass.

## Scope

In `isRanchState`:

- `v.sales.every(s => isRecord(s) && typeof s.speciesId === 'string' && typeof s.atAction === 'number')` (match the `SaleRecord` shape used by `ts/src/games/slimeworld/ranch/model/market.ts`).
- `Number.isFinite(v.nextId) && v.nextId >= 0` and `Number.isFinite(v.actionCount) && v.actionCount >= 0`.

Nothing else — this is a guard fix, not a schema change.

## Tests

In `ts/tests/test_slimeworld_ranch_save.ts` (or wherever the ranch save guard is covered):

- `sales: [null]` → `isRanchState` false, `loadRanch` falls back to fresh state.
- `sales` with an entry missing `speciesId`/`atAction` → false.
- `nextId: NaN` / `actionCount: -1` / `actionCount: Infinity` → false.
- A valid state still passes (existing tests unchanged).

## Verification

```
cd ts && npx vitest run test_slimeworld_ranch
cd ts && npx vitest run test_slimeworld
cd ts && npx tsc --noEmit
```

## Sandbox needs

- Exec(cd ts && npx vitest run test_slimeworld_ranch)
- Exec(cd ts && npx vitest run test_slimeworld)
- Exec(cd ts && npx tsc --noEmit)

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin-laptop |
| Branch | directive/rfdgamestudio-slimeworld-ranch-save-hardening-d-6922e0 |
| Base branch | - |
| Base commit | 56354b80f34c12e76d56d2762ac435320fa446bd |
| Head commit | dbfcd5bbe1735739939b0b1b742a34eb1f6a29c3 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-06 01:28 · devin-overseer (delegated) · none → Queued — authored from PR 224 review follow-up (robert-claude-laptop #1932 item 1); queued, not approved
- 2026-10-06 01:29 · devin-overseer (delegated) · Queued → Approved
- 2026-10-06 01:30 · dispatcher · Approved → In progress — dispatched devin-laptop on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimeworld-ranch-save-hardening-d-6922e0; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-06 01:31 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimeworld-ranch-save-hardening-d-6922e0; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-06 01:36 · devin · In progress → Review — isRanchState now checks each sales entry against SaleRecord shape and requires Number.isFinite + >= 0 on nextId/actionCount; 3 new tests in test_slimeworld_ranch_save.ts. Verified: npx vitest run test_slimeworld_ranch (35 passed), npx vitest run test_slimeworld (185 passed), npx tsc --noEmit (clean). Committed dbfcd5bb, pushed to origin. [origin] spent: devin 4 min est. n/a
<!-- queue:end -->
