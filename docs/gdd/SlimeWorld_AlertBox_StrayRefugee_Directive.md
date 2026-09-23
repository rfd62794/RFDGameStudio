# SlimeWorld -- Directive: Alert Box for Real-Time Notifications (Refugee/Stray First)

*August 3 2026 | Read fully before executing anything. Written under real
time constraint -- scoped deliberately small and precise. Breeding-cost
redesign was raised in the same conversation and is explicitly DEFERRED,
not part of this directive -- it's a real, separate, bigger design question
that needs actual design time, not a rushed addition here.*

---

> STOP: Confirm the real, current test floor before touching anything --
> do not trust a stored number, confirm it live.

---

## Section 0 -- Context

Confirmed via direct source read this session: when a stray flees a
conflict zone and joins the roster (logic.lua, the "STRAY DETECTION"
path), it already constructs a real message and pushes it into
state.logs:
```lua
table.insert(state.logs, { id = "log_stray_flip_" .. os.time() .. "_" ..
  math.random(1000), cycle = state.cycle, text = "STRAY DETECTION: A stray
  " .. new_color .. " refugee fled the conflict zone and arrived at
  containment. lockedRole assigned to WORKER.", type = "combat" })
```
Confirmed via grep of App.tsx: nothing renders this as an immediate
alert. Zero matches for "notification"/"toast"/"alert" anywhere in the
file. The message exists, is typed (LogEntry, already imported), and is
presumably visible only if a player manually checks a log/history panel
-- not surfaced in the moment it happens. This is the real gap driving the
"huge roster just from Refugees, and you should be alerted when that
happens" complaint -- the game already knows this happened, it just never
tells you.

Real design goal, small and precise: a lightweight, reusable Alert Box
component that surfaces NEW log entries as an immediate, dismissable UI
element -- in addition to, not replacing, the existing state.logs array
(which presumably still backs a scrollable history somewhere; do not
remove or alter that, confirm its real current rendering before touching
it).

Not in scope, explicitly deferred:
- Breeding cost redesign -- real, separate, bigger design question, needs
  its own dedicated design conversation with real time to think it
  through, not a rushed addition to a directive written under time
  pressure. Do not attempt to design or implement any breeding-cost
  change as part of this directive.
- Any change to the Stray/Refugee game logic itself -- this directive adds
  a UI surface for an event that already fires correctly, it does not
  change when or how strays arrive.
- Alerts for anything beyond Stray/Refugee arrivals in this first pass --
  see Section 2's extensibility note for how future alert types (Favor
  completions, Fealty achieved, etc.) should hook in later, but do not
  build those triggers now.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| A new component (e.g. ts/src/games/slimeworld/AlertBox.tsx -- confirm the project's real component-location convention first) | New | Reusable, dismissable alert UI, takes a LogEntry-shaped prop |
| ts/src/games/slimeworld/App.tsx | Modify (narrow) | Detect new entries in state.logs where type === "combat" and text starts with "STRAY DETECTION"; surface each via the new Alert Box; do not alter the existing logs array itself |

Read-only -- do not touch: logic.lua's Stray/Refugee logic itself;
whatever currently renders the full state.logs history (confirm it
exists and still works after this change, don't assume).

---

## Section 2 -- Implementation

RULE: Confirm HOW new log entries are actually detected on the TS side
before writing trigger logic -- likely a diff between the previous and
current state.logs array length/contents after each real state update
from the Lua bridge, matching whatever pattern this codebase already uses
elsewhere for detecting "new" events from a full-state sync. Don't invent
a different detection mechanism than what's already idiomatic here --
check for one first.

RULE: Filter specifically on type === "combat" AND the text prefix
"STRAY DETECTION" for this first pass -- type: "combat" alone would also
catch unrelated real combat log entries this directive isn't meant to
alert on. Confirm via a real grep of logic.lua whether any OTHER log
entries also use type = "combat" before finalizing the filter, so the
alert doesn't accidentally fire on something unrelated.

RULE, extensibility for later -- do not build this now, just don't design
against it: structure the Alert Box component to accept any LogEntry, not
just Stray-shaped ones, so a future directive can wire additional trigger
conditions (Favor completions, Fealty achieved) onto the same component
without a rewrite. The component itself should be generic; only the
Stray/Refugee trigger condition is in scope today.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_alert_box_renders_given_log_entry | Component-level: given a real LogEntry-shaped prop, renders the expected text |
| test_alert_box_dismissable | User can dismiss it; dismissed state doesn't reappear on next render |
| test_stray_arrival_triggers_alert_real_bridge | Real, mandatory, matches this project's own standard: through the actual stateToLua->executor->luaSlimeToTs/state-sync path (not a Lua-only or component-only mock), trigger a real stray arrival, confirm the Alert Box actually appears |
| test_non_stray_combat_logs_do_not_trigger_alert | A type: "combat" entry that is NOT a Stray/Refugee message does not incorrectly fire the alert -- proves the filter is precise, not just type === "combat" alone |
| test_existing_log_history_still_renders | Whatever currently displays the full state.logs history still works unchanged after this directive |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] Alert Box component real, confirmed via source read to be generic
      (accepts any LogEntry), not hardcoded to Stray-only text
- [ ] Stray/Refugee trigger wired, confirmed via real bridge test, not a
      mock
- [ ] Existing state.logs history display confirmed still working,
      unchanged
- [ ] git diff --stat confirms only the files in Section 1 touched -- no
      drift into logic.lua, no breeding-cost changes of any kind
- [ ] Report explicitly: how new log entries are detected (per Section 2's
      first rule), and what the real component-location convention turned
      out to be

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| The real gap | Stray/Refugee message already built and logged, never surfaced as an alert |
| Confirmed via | Direct grep -- message exists in logic.lua, zero alert/toast/notification anywhere in App.tsx |
| Filter for this pass | type === "combat" AND text starts with "STRAY DETECTION" -- not type === "combat" alone |
| Explicitly deferred | Breeding cost redesign -- real, separate, needs its own design time |
| Explicitly deferred | Additional alert trigger types beyond Stray/Refugee -- component should be generic, triggers stay narrow for now |
