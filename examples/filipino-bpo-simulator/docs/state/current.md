# Filipino BPO Simulator / Call Center Tycoon — Current Status

*Phase 2: Dashboard / Floor / After-Hours UI restructure*

## Verified Floor

- `npx tsc --noEmit` — 0 errors
- `npx vite build` — success
- `npm run test` — **22 passed, 0 failed, 0 skipped** (3 test files)
  - `src/systems/listSystem.test.ts` — 8/8 passed
  - `src/systems/dialerSystem.test.ts` — 8/8 passed
  - `src/systems/quotaSystem.test.ts` — 6/6 passed

## What changed in Phase 2

- Added `dialerUpgradeCost()` and `applyDialerUpgrade()` to `src/systems/dialerSystem.ts` with tests.
- Created `src/components/DashboardView.tsx` — quota tracker, list-health bars, dialer-pace slider, floor readouts, and Floor toggle.
- Created `src/components/FloorView.tsx` — thin wrapper around the existing `IsometricOfficeCanvas` with a back button.
- Created `src/components/AfterHoursView.tsx` — day verdict, dialer upgrade purchase, request-new-list action, and "Start Next Day" button.
- Updated `src/App.tsx`:
  - Added `activeScreen` state (`dashboard` | `floor` | `afterhours`).
  - Gave `dialerConfig` a setter and wired it through `DashboardView`.
  - Conditional rendering of the three views in the center pane.
  - Day-end wraps to `activeScreen === 'afterhours'` after capturing `lastVerdict`.
  - Replaced cosmetic employee multiplier (`agents.length * 10 + 2`) with real `agents.length`.
  - Replaced `totalDesks * 10 + 20` with real `totalDesks`.
  - Replaced hardcoded starting state (`Day 68`, `₱458,720`, etc.) with Day 1 / `₱50,000` / 08:00.
  - Reset-game handler updated to the same Day 1 values.

## Scope discipline

- No existing logic in `listSystem.ts` or `quotaSystem.ts` modified.
- `dialerSystem.ts` modified only by adding `dialerUpgradeCost` and `applyDialerUpgrade` — existing functions untouched.
- No read-only components (`BuildModal`, `RecruitingModal`, `WageModal`, `HRModal`, `ITSupportModal`, `TrainingModal`, `FacilitiesModal`, `StaffModal`, `ReportsModal`, `ScriptModal`, `SettingsModal`, `AgentModal`, `EventModal`, `HelpModal`, `IsometricOfficeCanvas`, `gameData.ts`, `audio.ts`, `names.ts`) modified.
- Phase 1's 20 tests still pass unchanged; the 22-test count is 20 + 2 new dialer-upgrade tests.

## Screenshots

Not captured this phase per explicit user instruction.

## Source of truth

`../../Design.md` (one directory up, in `intake/filipino-bpo-simulator/`)
