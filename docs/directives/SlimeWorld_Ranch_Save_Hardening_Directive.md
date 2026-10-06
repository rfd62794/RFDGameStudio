# SlimeWorld ranch: harden `isRanchState` against malformed `sales`/`nextId`/`actionCount`

## Why this exists

`ts/src/games/slimeworld/ranch/save/ranchSave.ts` `isRanchState` checks `Array.isArray(v.sales)` but not each entry's shape — a foreign save with `sales: [null]` passes the guard, then `market.recentSales` throws on `s.speciesId`. `nextId`/`actionCount` accept `typeof === 'number'` so `NaN`/`Infinity`/negatives also pass.

## Scope

In `isRanchState`:

- `v.sales.every(s => isRecord(s) && typeof s.speciesId === 'string' && typeof s.atAction === 'number')` (match the `SaleRecord` shape used by `model/market.ts`).
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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-06 01:28 · devin-overseer (delegated) · none → Queued — authored from PR 224 review follow-up (robert-claude-laptop #1932 item 1); queued, not approved
<!-- queue:end -->
