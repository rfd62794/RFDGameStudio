# Call Center Tycoon — Phase 2b Directive: Permanent Floor, Popup HUD (RollerCoaster Tycoon Pattern)

*September 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run `npm run test` before touching any file. Must report
> `22 passed, 0 failed, 0 skipped` — the certified Phase 2 floor. This
> phase changes composition/layout only, not simulation logic — if the
> floor moves at all after this phase, that's a stop-and-report
> condition, not something to explain away. Then run `npx tsc --noEmit` 
> (0 errors) and `npx vite build` (success), raw output both.

---

## §0 Context

**Phase 2 built the right components with the wrong composition.**
It rendered Dashboard and Floor as two separate full-screen views
behind a tab toggle, defaulting to Dashboard. That was a genuine
misread of `Design.md`'s intent, confirmed directly against a
screenshot of the original Google AI Studio demo (referenced by
Robert, attached earlier in this conversation) and against the
explicit reference point Robert gave for the corrected feel:
**RollerCoaster Tycoon.**

**The RCT pattern, concretely, since this is the actual spec for this
phase:** the park (here: the office floor) is full-screen, always
visible, and never replaced by anything. A thin stat bar sits along
one edge for at-a-glance numbers. Clicking a toolbar icon opens a
small **popup window layered over the park** — never a screen swap —
and closing it returns to the same permanently-visible park
underneath, unchanged.

**The good news: this repo already implements that exact pattern for
the original toolbar.** `BuildModal.tsx`, `WageModal.tsx`,
`HRModal.tsx`, and the rest are already popups over a permanently
visible floor, not screen replacements. Phase 2 invented a
*different*, inconsistent pattern specifically for the new
Dashboard content. This phase does not introduce a new concept — it
makes the Dashboard content consistent with the popup pattern that
already exists and already works, in the same file, right next to it.

**What this phase delivers:**
1. The `activeScreen` dashboard/floor toggle is removed. The floor
   (`IsometricOfficeCanvas`) renders full-screen, permanently, exactly
   as it did before Phase 2 — no toggle, no tab, no navigating away
   from it during normal play.
2. The existing bottom status bar (₱ / Day / Time / Employees /
   Happiness / Productivity / Calls Queue — confirmed still present
   per Phase 2's own report) is rebuilt to show real data: quota
   progress, list health, and dialer pace, replacing whatever
   currently renders there.
3. Dialer pace adjustment and the list-swap action move into a new
   popup modal, styled and structured to match the existing modal
   pattern exactly (same props shape, same visual chrome as
   `BuildModal.tsx`), opened via a toolbar button, closing to reveal
   the still-visible, still-running floor underneath.

**Explicitly NOT in scope:**
- After-Hours stays a distinct full-screen state. This is a genuine
  exception to "floor is always visible" — it's a day-boundary
  transition, closer to RCT's scenario-complete screen than to a
  stat popup. This is Claude's assumption, not confirmed by Robert
  directly — flag it back if it's wrong, but proceed on this
  assumption rather than blocking the directive on it.
- No changes to `listSystem.ts`, `dialerSystem.ts`, or
  `quotaSystem.ts` logic. This phase is composition only. The
  pre-flight floor (22/0/0) should be identical after this phase,
  not just close.
- No changes to the existing modals' own content or behavior —
  they're the reference pattern to match, not something to modify.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `src/App.tsx` | Modify | Remove the `activeScreen` dashboard/floor toggle; render `IsometricOfficeCanvas` permanently in normal play; rebuild the bottom status bar with real quota/list/dialer data; add open/close state for the new dialer popup modal |
| `src/components/DashboardView.tsx` | Delete | Its content is redistributed: always-visible readouts move into `App.tsx`'s status bar; interactive controls (pace adjustment, list-swap trigger) move into the new modal below |
| `src/components/FloorView.tsx` | Delete | No longer needed — the canvas renders directly in `App.tsx` again, matching the pre-Phase-2 structure |
| `src/components/DialerControlModal.tsx` | New | Popup modal matching the existing modal pattern (reference `BuildModal.tsx` for structure/styling). Contains the dialer pace throttle and the list-swap action that were in `DashboardView.tsx` |
| `src/components/AfterHoursView.tsx` | Unchanged | Stays exactly as Phase 2 built it — still the one legitimate full-screen exception |

**Read-only — do not touch:**
`src/components/BuildModal.tsx`, `RecruitingModal.tsx`,
`WageModal.tsx`, `HRModal.tsx`, `ITSupportModal.tsx`,
`TrainingModal.tsx`, `FacilitiesModal.tsx`, `StaffModal.tsx`,
`ReportsModal.tsx`, `ScriptModal.tsx`, `SettingsModal.tsx`,
`AgentModal.tsx`, `EventModal.tsx`, `HelpModal.tsx`,
`src/components/IsometricOfficeCanvas.tsx`, `src/utils/gameData.ts`,
`src/utils/audio.ts`, `src/utils/names.ts`, `src/systems/listSystem.ts`,
`src/systems/quotaSystem.ts`, `src/systems/dialerSystem.ts`. These
files are the reference pattern for §2 — read them for structure,
don't modify them.

> ⚠️ RULE: If matching the existing modal pattern requires a shared
> prop shape or wrapper that doesn't currently exist, report that
> finding before inventing a new modal architecture. The goal is
> consistency with what's already there, not a third pattern.

---

## §2 Implementation

### `src/App.tsx` 

- Remove `activeScreen: 'dashboard' | 'floor' | 'afterhours'`.
  Replace with a simpler `isAfterHours: boolean` (or equivalent) —
  the only screen-level state now needed is whether the day-end
  screen is showing.
- `IsometricOfficeCanvas` renders unconditionally during normal play,
  same as before Phase 2 — full-screen, permanent, with the existing
  side toolbar (BUILD, RECRUITING, etc.) rendered alongside it exactly
  as it is in the current build and in the reference screenshot.
- Rebuild the bottom status bar: replace whatever currently displays
  there with real values from `quota` (progress/target), `activeList` 
  (purity/freshness/volume, at-a-glance form — this is a thin bar,
  not the full panel `DashboardView` had), and `dialerConfig` (current
  pace, at a glance).
- Add a toolbar button (matching the visual style of the existing
  BUILD/RECRUITING buttons) that opens `DialerControlModal`. Add the
  open/close state for it, same pattern as however the existing
  modals are toggled.

### `src/components/DialerControlModal.tsx` 

Pull the interactive content out of the old `DashboardView.tsx` —
the pace throttle control and the request-new-list action — into a
modal matching the existing modal component pattern exactly. Look at
`BuildModal.tsx` first for the actual prop shape, styling approach,
and open/close convention, and replicate it, not reinvent it. The
floor stays visible and running behind this modal when it's open,
same as every other modal in this codebase already does.

### Deletions

Remove `DashboardView.tsx` and `FloorView.tsx` once their content is
fully redistributed per above. Confirm no remaining imports reference
either file before considering this complete.

---

## §3 Test Anchors

Given this phase is composition-only, the primary proof is visual,
not new unit tests. Still required:

| Check | Method |
|---|---|
| Phase 2 floor unaffected | `npm run test` — must still read exactly `22 passed, 0 failed, 0 skipped` |
| No orphaned imports | Grep for `DashboardView` and `FloorView` across the codebase — must return zero matches outside their own now-deleted files |
| Floor renders permanently, no toggle | Screenshot of normal play — floor and side toolbar visible together, matching the reference screenshot's composition |
| Status bar shows real data | Screenshot showing quota/list/dialer values in the bottom bar, not placeholder or old values |
| Dialer modal opens over the floor | Screenshot with the modal open — floor visibly still rendered and running behind it |
| Dialer modal matches existing modal style | Side-by-side screenshot or direct visual comparison against `BuildModal` when open |
| After-Hours still triggers correctly at day-end | Screenshot of the After-Hours screen appearing at day transition |

> ⚠️ RULE: Screenshots are required for this phase, no exceptions,
> regardless of anything said in an earlier phase about skipping them.
> This phase is entirely about visual composition — a report without
> screenshots proves nothing here.

---

## §4 Completion Criteria

- [ ] Pre-flight confirmed: Phase 2's `22/0/0` floor verified before
      any file was touched
- [ ] Post-change floor is still exactly `22/0/0` — identical, not
      just "still passing"
- [ ] `DashboardView.tsx` and `FloorView.tsx` deleted, no orphaned
      imports remain (grep evidence shown)
- [ ] `DialerControlModal.tsx` created, matches the existing modal
      pattern (cite which existing modal was used as the reference
      and how the structure matches)
- [ ] Floor renders permanently during normal play — screenshot
      evidence, composition matches the reference screenshot
      (persistent floor + side toolbar, no tab/screen-swap)
- [ ] Bottom status bar shows real quota/list/dialer data — screenshot
      evidence
- [ ] Dialer modal opens over the still-visible floor and closes
      cleanly — screenshot evidence, both states
- [ ] After-Hours still functions as the one full-screen exception —
      screenshot evidence
- [ ] `tsc --noEmit` and `vite build` both pass, raw output shown
- [ ] `docs/state/current.md` updated

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Pre-flight floor | 22/0/0 (Phase 2, certified) — must be identical after, not just passing |
| Reference pattern | RollerCoaster Tycoon: permanent world view + popup windows over it, never screen swaps |
| Reference files for modal pattern | `BuildModal.tsx` and siblings — match their structure, don't invent a new one |
| Deleted this phase | `DashboardView.tsx`, `FloorView.tsx` |
| Added this phase | `DialerControlModal.tsx` |
| Unchanged this phase | All simulation logic in `systems/`; `AfterHoursView.tsx` |
| Screenshots | Mandatory, no exceptions this phase |
