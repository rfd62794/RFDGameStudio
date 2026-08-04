# SlimeWorld -- Directive: Options Menu + Hard Reset (Pre-Publish)

*August 3 2026 | Read fully before executing anything. Scoped
deliberately small and SlimeWorld-only -- a cross-game settings system
belongs in GameShell eventually, confirmed via source read this session
that no such affordance exists there yet, but that's real, separate,
future work, not tonight's.*

---

> STOP: Confirm the real, current test floor before touching anything.

---

## Section 0 -- Context

Robert is publishing SlimeWorld to itch.io as-is tonight, with one real
gap first: no way for a player to reset their save. Confirmed via source
read: SlimeWorld has real saveState/loadState localStorage persistence
already, but nothing to clear it. This directive adds the minimal real
thing needed before publish -- a small Options Menu whose only content,
for now, is a confirmation-gated Hard Reset.

Real existing pattern to reuse, don't invent a new one: SlimeWorld
already has a real, working destructive-confirmation flow --
pendingDisposalFavorId/disposalConfirmSlimeId, used for the (also
destructive, also irreversible) Favor Disposal action. Match that same
two-step confirm pattern for Hard Reset rather than building a different
confirmation mechanism.

Not in scope, explicitly deferred:
- Any promotion of this to GameShell or any other game -- SlimeWorld-only
  for tonight.
- Any actual settings beyond Hard Reset (volume, display options, etc.) --
  the menu should be built to hold more later, but nothing else ships in
  it tonight.
- Any change to saveState/loadState's own real logic -- this directive
  adds a way to clear the save, not changes to how saving/loading works.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| New: ts/src/games/slimeworld/components/OptionsMenu.tsx (confirm real component-location convention first, matching where AlertBox.tsx lives) | New | Minimal menu/modal, one real action: Hard Reset, confirmation-gated |
| ts/src/games/slimeworld/App.tsx | Modify (narrow) | A button to open the Options Menu (likely in the header/statusArea area, alongside the existing Cycle counter and Advance Cycle button -- confirm the real current layout before placing it); the real reset action itself (clear persisted save, return to genuinely fresh state) |

Read-only -- do not touch: saveState/loadState's own logic; the existing
disposal-confirmation flow itself (reuse the pattern, don't modify the
original).

---

## Section 2 -- Implementation

RULE: Hard Reset must be a real two-step confirm, matching the disposal
pattern exactly -- a single click must never trigger the reset. This is
destructive and irreversible; treat it with the same care already shown
for sacrificing a slime via Disposal.

RULE: A real reset must return the player to the exact same state a
brand-new player reaches -- gamePhase: 'opening' (the Ember Station
beat), empty regionUnlocks (so this morning's tab-gating directive
correctly shows only Roster + Lab again), cleared shownTutorials (so
T1/T2/T3 fire again naturally). Confirm this matches the real, current
definition of a fresh game's initial state -- don't hand-construct a
possibly-incomplete reset object, find and reuse whatever the game's
real "new game" initial state already is.

RULE: Confirm the reset actually clears the real persisted localStorage
key, not just in-memory React state -- a page refresh after reset must
still show a fresh game, not silently restore the old save.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_options_menu_opens_and_closes | Basic UI: menu opens on click, closes on dismiss |
| test_hard_reset_requires_two_step_confirm | Single click does not reset; confirm step is required |
| test_hard_reset_clears_persisted_save | Real check: after reset, the real localStorage key is actually empty/cleared, not just React state |
| test_hard_reset_returns_to_fresh_game_state | Post-reset state matches genuine new-game initial state exactly -- gamePhase: 'opening', empty regionUnlocks, cleared shownTutorials |
| test_hard_reset_reflects_in_tab_gating | Real integration check: post-reset, only Roster + Lab tabs are visible -- proves this directive and this morning's Gate Tabs directive compose correctly together |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] Two-step confirm confirmed real, matching the disposal pattern
- [ ] Real localStorage clearing confirmed, not just in-memory reset
- [ ] Post-reset state confirmed to exactly match genuine new-game state
      (Section 3's integration test with tab-gating specifically)
- [ ] git diff --stat confirms only the files in Section 1 touched -- no
      drift into GameShell, other games, or saveState/loadState's own logic
- [ ] Report explicitly: where the Options Menu button was placed, and
      why that location was chosen

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Why now | Publishing to itch.io tonight; no way to reset a save is a real, practical gap for players (and Robert himself) |
| Scope | SlimeWorld only -- a shared, cross-game settings system is real, separate, future work |
| Confirmation pattern to reuse | The existing Favor Disposal two-step confirm -- don't invent a new one |
| Post-reset state must match | Genuine new-game state exactly, composing correctly with this morning's Gate Tabs directive |
| Ships in the menu tonight | Hard Reset only -- built to hold more later, nothing else added now |
