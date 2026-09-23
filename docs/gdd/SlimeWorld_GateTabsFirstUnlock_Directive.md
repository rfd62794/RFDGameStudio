# SlimeWorld -- Directive: Gate Missions/Economy Tabs Behind First Region Unlock

*August 3 2026 | Read fully before executing anything. This directive
targets the real, confirmed mechanical cause of "the game feels like too
much" -- not a content or lore fix, a real exposure-staging fix.*

---

> STOP: Confirm the real, current test floor before touching anything.

---

## Section 0 -- Context

Confirmed via direct source read this session: all four tabs -- roster,
missions, economy, lab -- render simultaneously from the very first hub
screen, with zero staging:

tabs={[{ id: 'roster', label: 'ROSTER' }, { id: 'missions', label: 'MISSIONS' }, { id: 'economy', label: 'ECONOMY' }, { id: 'lab', label: 'LAB' }]}

regionLockNodeIds gates individual NODES on the map (greyed out, lock
icon) -- but the Missions tab itself, the full six-culture map, all of
it, is visible and reachable on turn one, before a player has bred a
single slime. This is the real, mechanical shape of "too much": four
equally-weighted systems handed to the player at once, none of them
earned yet.

Rev 2's original design intended a staged reveal (Act 1 = Lab-only) that
was never actually enforced at the tab level. This directive enforces
it, using signal the game already computes rather than building anything
new: T3_REGION_UNLOCK's trigger logic (shouldFireTutorial checked
against newKeys.length > 0 in App.tsx) already detects "at least one
region has been unlocked for the first time." That's the real, canonical
signal to gate tab visibility on.

Not in scope, explicitly deferred:
- Any world-building/narrative content -- a real, separate, confirmed gap
  (the opening beat text, zero Dissonance/Echo connection anywhere in the
  game), not what this directive fixes. Named and deferred deliberately,
  not forgotten.
- Any change to how individual map nodes get locked/unlocked -- confirmed
  working, not touched.
- Any change to T1/T2/T3 tutorial content or trigger logic itself -- this
  directive reads the same signal, doesn't modify it.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| ts/src/games/slimeworld/App.tsx | Modify (narrow) | Filter the tabs array: show only roster + lab until the real first-region-unlock signal is true; show all four once it is |

Read-only -- do not touch: MissionsTab.tsx's node-locking logic
(regionLockNodeIds, isNodeLocked); tutorial.ts; any T1/T2/T3 content or
trigger code.

---

## Section 2 -- Implementation

RULE: Confirm the real, correct source of truth for "has at least one
region ever been unlocked" before writing the filter -- do not assume
shownTutorials[T3_REGION_UNLOCK] is the right signal just because it's
convenient. That flag means "the tutorial popup was shown," which is
close to but not necessarily identical to "a region is actually
unlocked." Read how T3's own trigger condition (newKeys.length > 0)
actually derives that fact and gate tab visibility on the same
underlying real state, not on a proxy that could drift from it.

RULE: Handle the returning-player case correctly. A player loading a
saved game that already has real, persisted unlocked regions must see
all four tabs immediately -- this is a first-session-only gate, not a
permanent restriction. Verify against real loaded state, not
session-only memory.

RULE: Confirm primaryTab's default/initial value is roster or lab, not
missions or economy -- if a fresh game somehow defaults to a tab that's
about to be hidden, fix the default alongside the filter, don't ship a
state where the active tab silently disappears.

RULE: This is a visibility gate, not a data gate -- do not add any new
restriction on what a player can DO once they reach the Missions/Economy
tabs. The only change is when the tab itself becomes visible in the tab
bar.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_fresh_game_shows_only_roster_and_lab_tabs | New game, zero regions unlocked -> tabs array contains exactly roster and lab |
| test_missions_economy_tabs_appear_after_first_unlock | Real bridge test: breed toward a real region's lock requirement, confirm successful unlock, confirm all four tabs now present |
| test_returning_player_with_existing_progress_sees_all_tabs | Load a real saved state with a region already unlocked -> all four tabs visible immediately, no re-gating |
| test_default_active_tab_never_hidden | Confirm the default primaryTab value is always among the currently-visible tab set, pre- and post-unlock |
| test_node_locking_unaffected | MissionsTab's own node-level locking (isNodeLocked, regionLockNodeIds) behaves identically before and after this change |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] Real source of truth for "region unlocked" confirmed and used --
      not a convenient proxy, the actual underlying signal
- [ ] Returning-player case confirmed working via a real loaded-state test
- [ ] git diff --stat confirms only App.tsx (+ new test file) touched
- [ ] Report explicitly: what a brand-new player's first screen now
      contains (should be exactly Roster + Lab, nothing else) and what
      real action causes Missions/Economy to appear

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| The real, confirmed problem | All 4 tabs + full (fogged) map visible turn one, zero staging enforced |
| Real signal to gate on | T3's own "region unlocked" detection -- already computed, not new |
| This directive builds | A visibility filter, reusing existing signal -- no new systems |
| Explicitly deferred | World-building/narrative content -- real, separate, already named |
| Must handle correctly | Returning players with real existing progress see all 4 tabs immediately |
