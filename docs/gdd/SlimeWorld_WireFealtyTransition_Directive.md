# SlimeWorld -- Directive: Wire Fealty Transition + Achievement Moment

*August 3 2026 | Read fully before executing anything. This directive was
reframed after real investigation, same as the naming-correction directive
before it -- the premise ("Fealty + Culture Favors is a new system, zero
code") was checked against real source and found false. Read Section 0
before assuming this is greenfield work; it is not.*

---

> STOP: Confirm the real, current test floor before touching anything.

---

## Section 0 -- Context: what's already real, and the one precise gap

Fealty and Culture Favors are substantially already built. Confirmed via
full direct read of games/slimeworld/favors.lua: generate_favors,
find_favor_for_node, fulfill_favor_via_mediation, resolve_disposal, and
check_fealty_transition all exist, are complete, and match Rev 2's design
exactly -- including the specific increment values (+5 Mediation, +15
Disposal, 100% threshold) already implemented as named constants.
codex.lua's pressure-simulation correctly excludes fealty_locked nodes.
The TS side already has real Favor state (luaFavorToTs,
handleDisposeSlime, pendingDisposalFavorId) wired into MissionsTab, and
per the prior naming-correction directive's own completion report,
MissionsTab.tsx already has real Favor display. This directive does NOT
rebuild any of that.

The real, confirmed gap: check_fealty_transition -- the function that
actually checks whether a color has crossed the 100% threshold and, if
so, locks the node permanently -- is never called anywhere on the TS
side. Confirmed via grep: zero matches for check_fealty_transition or
even the word "fealty" anywhere in App.tsx. This means a player could
reach 100% relationship with a culture right now and nothing would
happen -- the mechanical payoff of the entire design thesis is
unreachable, not because it's unbuilt, but because it's unwired.

Also confirmed missing, per Rev 2's own explicit design requirement: zero
narrative/Echo text anywhere tied to Fealty. Every real hit for "fealty"
across the whole codebase is pure mechanical logic -- pressure exclusion,
threshold math, node locking. Rev 2 explicitly called for "real Echo
content, specifically at the moment of a first Fealty, distinct from a
Conquest win, acknowledging that this is the real answer to what she's
been asking the whole game." This has never been written.

A real, ready-made surface already exists for this: the Alert Box
directive shipped earlier today with an explicit extensibility note --
"a future directive can wire additional trigger conditions (Favor
completions, Fealty achieved) onto the same component without a
rewrite." This is that directive. AlertBox.tsx should not need to
change; only a new trigger condition needs adding.

Not in scope, explicitly deferred:
- Any change to favors.lua's real mechanical logic -- confirmed correct,
  not touched.
- Any change to MissionsTab.tsx's existing Favor display/disposal UI --
  confirmed real and working per the prior directive's report; verify it
  still works, don't rebuild it.
- Building a new alert component -- AlertBox.tsx already exists and is
  generic; this directive adds a trigger, not a component.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| ts/src/games/slimeworld/App.tsx | Modify (narrow) | Call check_fealty_transition in the real per-cycle update flow (likely alongside where Stray/Refugee alert filtering already happens in handleAdvanceCycle -- confirm the real location via source read); on any real transition returned, surface it via the existing AlertBox |
| games/slimeworld/logic.lua or wherever real narrative log entries get constructed (confirm the real pattern used for the Stray/Refugee message) | Modify (narrow) | Add real, distinct Echo narrative text for the Fealty-achieved moment -- must read as tonally different from a Conquest win, per Rev 2's own explicit requirement |

Read-only -- do not touch: favors.lua's real mechanical functions;
AlertBox.tsx itself (already generic, no changes needed); MissionsTab.tsx's
existing Favor UI (verify working, don't modify unless a real test proves
it's broken).

---

## Section 2 -- Implementation

RULE: Confirm exactly how check_fealty_transition's return value (an
array of {color, node_id, node_name} transitions) should map onto the
existing AlertBox/LogEntry shape before writing any code -- read the real
LogEntry type and the real Stray/Refugee alert-wiring code from this
morning's directive first, match that pattern, do not invent a different
one.

RULE: The narrative text for this moment needs to be genuinely distinct
from a Conquest win -- not just a different color of the same "you
claimed a node" message. Per Rev 2: this is the moment the game's central
uncertainty gets a real answer. Write text that reflects permanence and
quiet payoff, not the loud/immediate tone appropriate to Force or Bribe
claims. If you're not confident writing this narrative beat yourself,
draft it and flag it explicitly for Robert's review rather than shipping
placeholder text as if it were final -- this is a real creative decision,
not a mechanical one.

RULE: Confirm check_fealty_transition gets called AFTER the same cycle's
pressure/supply simulation and Favor generation, not before -- a
transition should reflect the just-updated state, matching how the
function's own design comment already describes Favor generation timing.
Get the real call order right, do not just insert the call anywhere
convenient.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_fealty_transition_triggers_alert_real_bridge | Real, mandatory bridge test: drive color_relationships to 100% for a real color through the actual stateToLua->executor->state-sync path, confirm check_fealty_transition fires and the AlertBox actually appears -- not a mock |
| test_fealty_alert_text_distinct_from_stray_alert | Confirm the real narrative text differs meaningfully from the Stray/Refugee alert text -- proves this isn't a copy-pasted generic message |
| test_fealty_node_locked_permanently_after_transition | Confirm fealty_locked/player_aligned are actually set on the real node post-transition, and that a subsequent pressure-sim cycle correctly excludes it (regression check against codex.lua's existing exclusion logic) |
| test_no_transition_below_threshold | A color at 99% does not incorrectly trigger -- proves the threshold check itself wasn't broken by the wiring |
| test_existing_favor_ui_unaffected | MissionsTab's existing Favor display/disposal flow still works unchanged after this directive |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] check_fealty_transition confirmed actually called from App.tsx, at
      the correct point in the real per-cycle flow
- [ ] Real Fealty-achieved narrative text written, explicitly flagged for
      Robert's review if the agent isn't confident in it -- not shipped
      silently as final
- [ ] Real bridge test confirms a Fealty transition actually surfaces via
      AlertBox in the live game -- this is the one thing that matters
      most, since the whole point of this directive is closing the gap
      between "mechanically correct" and "actually reachable by a player"
- [ ] Existing Favor UI (MissionsTab) confirmed still working, unchanged
- [ ] git diff --stat confirms only the files in Section 1 touched -- no
      drift into favors.lua's mechanics or AlertBox.tsx's component code
- [ ] Report explicitly: the real, current state of Fealty end-to-end
      after this directive -- can a player actually reach and see a real
      Fealty achievement in the live game now, yes or no, demonstrated,
      not assumed

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Original premise | False -- Fealty + Favors mechanics are already substantially real and correct |
| Real, confirmed gap | check_fealty_transition exists, is correct, is never called from TS -- the payoff is currently unreachable |
| Also missing | Any real narrative/Echo text for the Fealty moment, per Rev 2's own explicit requirement |
| Surface to use | The existing AlertBox component -- built this morning, explicitly designed for exactly this extension |
| This directive builds | A trigger wiring + narrative text, not a component and not new mechanics |
| The one thing that must be demonstrated, not assumed | A player can actually reach and see a real Fealty achievement in the live game after this ships |
