# Filipino BPO Simulator / Call Center Tycoon — Current Status

*Phase 1: List, Dialer, Quota core systems*

## Verified Floor

- `npx tsc --noEmit` — 0 errors (baseline and post-change)
- `npx vite build` — success (baseline and post-change)
- `npm run test` — **20 passed, 0 failed, 0 skipped** (3 test files)
  - `src/systems/listSystem.test.ts` — 8/8 passed
  - `src/systems/dialerSystem.test.ts` — 6/6 passed
  - `src/systems/quotaSystem.test.ts` — 6/6 passed

## What changed in Phase 1

- Added Vitest as a dev dependency and a `test`/`test:watch` script.
- Added `LeadList`, `DialerConfig`, `QuotaState`, and `DayVerdict` types to `src/types.ts`.
- Implemented pure logic modules:
  - `src/systems/listSystem.ts` — volume depletion, freshness decay, swap detection
  - `src/systems/dialerSystem.ts` — safe-pace ceiling, call-generation rate with purity/freshness/volume/over-pace penalties
  - `src/systems/quotaSystem.ts` — progress tracking and day-end verdict (met/missed/partial)
- Replaced the flat `Math.random() < 0.75` call generator in `src/App.tsx` with output driven by `activeList` + `dialerConfig` state.
- Wired `quota` state into the existing call-completion flow and day-wrap reset.

## Scope discipline

- No `src/components/*.tsx` files modified.
- No `src/utils/*.ts` files modified.
- No UI controls for List/Dialer/Quota added in this phase.
- Cosmetic `displayEmployees` / hardcoded starting-state values left untouched, per Phase 1 scope.

## Source of truth

`../../Design.md` (one directory up, in `intake/filipino-bpo-simulator/`)
