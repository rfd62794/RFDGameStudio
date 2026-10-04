# wire_rust direction (2026-10-04)
## What it tried to be
Chapter 2 of the "five-chapter demo canon" (`docs/gdd/WireAndRust_Design.md:1-2`): a deck-builder where "your deck IS your salvage pile", Brewfield chemistry reskinned as scrap synergies, 5-8 rooms, D20 checks, and a deck that evolves (salvage adds cards, failed checks destroy them; GDD Core Loop 5 and Pillars). Built in one overnight run (f4f6816e, 2026-09-03; `docs/overnight_prototypes_status.md:45-56`), made to build in 24ead23b, SFX added 2026-09-29. Drift: the build kept the room/D20/synergy skeleton and dropped "the deck is the inventory", which was the point.
## Where it is now
- Playable loop: yes. Start run, pick a card per room, roll D20 + mod + chemistry vs difficulty, repeat until hp <= 0 (`App.tsx:83-97,119`).
- Content: 4 cards, 5 rooms (`games/wire_rust/data.yaml:17-73`), hand size 4.
- Stubbed: scrap is earned (`logic.lua:144-146`) and shown (`App.tsx:172-173`) but never spent; cards are never added or lost, contradicting the GDD; no win state (Control Room is a "rest" room, `data.yaml:68-73`); no in-play restart (only game-over "Reboot Core", `App.tsx:132-135`).
- Size: 367 TS lines plus 173 Lua lines run through the shared executor (`useLuaCall`); 2 UI tests, a Python test (`tests/test_wire_rust.py`); no `build:wire_rust`; unseeded `math.random`.
- Audit batch2: loads clean, A3 FAIL (no restart).
- The only run outcome is death.
## Player experience today vs the target
First 60 seconds: title with pitch, a hand of four scrap cards, a room. Best moment: a chemistry bonus line making a hand feel clever. Biggest turn-off: no real choice and no ending; the same four cards return, scrap goes nowhere, and you can only die.
## Verdict
RETHINK.
1. It is a stub of its own GDD: the deck-evolution pillar is absent, so polishing it yields a nicer coin flip.
2. At 367 lines, rethinking is cheap, far cheaper than rescuing a showcase-size demo.
3. Showcase picks are already Shoal, Dissonance, Succession, so this earns one short fenced attempt, then a keep-or-retire call.
## Replan
- Phase 1 (S): complete the loop. CUT: nothing. ADD: in-play Restart, a win at the Control Room, a result screen, `build:wire_rust`, seeded RNG via a seed in game state. Verify: build exits 0; a headless test of N seeded runs reaches both a win and a loss.
- Phase 2 (M): the missing pillar. CUT: the endless redraw of the same four cards (no stakes). ADD: scrap spent in salvage rooms to add a card; a failed check destroys the played card. Verify: unit test that deck size changes on salvage and on fail; headless runs still terminate.
- Phase 3 (S): decide. Play five runs; if one is not fun inside 5 minutes, retire to Origin (Tier A only), as with slimebreeder. Verify: Robert's call.
## First three directives
1. wire_rust Tier A, win condition, seeded headless test. M. Depends on: none.
2. wire_rust scrap shop and card loss (deck evolution). M. Depends on: 1.
3. wire_rust five-run keep-or-retire review note. S. Depends on: 2.
## Open question for Robert
Short fenced attempt, or retire now? Default: attempt Phases 1-2 (about two Devin runs), then decide. Note: `logic.lua` is the shared Lua runtime from the overnight build; I propose no new Lua, and moving its logic to TS is a studio-level call outside this plan.
