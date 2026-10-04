# chimera_wilds direction (2026-10-04)
## What it tried to be
A deliberately minimal "Phase 1": one D20 roll against a random six-part chimera, plus the first consumer of the shared Paper Doll renderer. Born 2026-07-08 (`c7c87d1c`: 13 parts "copied per ADR-005" from Mutant Battle Ball, `generate_chimera`/`resolve_encounter` in Lua, 8 Python tests). Then it became an engine testbed: GameShell (`3be74824`), shared part-slot types with MBB (`bf8f743b`), Paper Doll adoption (`635130a9`, `f068960f` archetype="quadruped"), title screen (`35fc337b`), tutorial/HUD/sfx (`38958e16`, 09-28). ROADMAP names it a candidate pixel/vector style adopter (ROADMAP.md:314) and a creatureArt consumer (:366). Every commit after day one polished chrome; none touched the rules. The Polish directive calls it "done mechanically".
## Where it is now
- Loop: Title -> tutorial -> "Face the Wilds" -> Paper Doll chimera -> win/loss panel -> history list, Record chip (App.tsx:160-172). No choices: the player presses one button.
- BUG, found by arithmetic on `games/chimera_wilds/data.yaml`: player score is 20+20+d20 = 41..60; the 36 possible chimeras score 156..230 (head 13-25, chest 35-77, arms 35-45 + 55, legs 10-20 + 8). Win chance is exactly 0%. The record can only ever read "0W - nL". Tests use synthetic numbers (tests/test_chimera_wilds.py:81-106) so nothing caught it.
- Parts carry accuracy, speed and price (data.yaml:15-130) that nothing reads; only power and endurance count.
- State is in memory; only the tutorial flag persists (App.tsx:54-62). No reset except reload.
- Size: 582 lines TS/CSS + 67 lines Lua + 133 YAML; tests cover the paper-doll port only (test_chimera_paper_doll_port.ts) plus the Python Lua tests.
- Lua takes `opts[1]` per slot while TS picks the random parts first (logic.lua:32; App.tsx:34-43): works, easy to misread.
## Player experience today vs the target
First 60 s: a clear title, a 3-line tutorial, one big button; the first action is instant. Best moment: the first chimera appearing as a procedurally assembled Paper Doll figure, plus the dice sfx. Biggest turn-off: you cannot win, and with no decision to make you cannot even lose "by choice"; after three presses a player sees the whole game. No progress, no way to improve.
## Verdict
RETHINK (first action: a bug fix).
1. Unwinnable at 0% is a defect, not a design; the polish layers sit on a game that cannot be won.
2. One button with no decision is a screensaver; the part prices and unused stats already point at the real game: choose what you fight with.
3. It must stay small: its value is as the Paper Doll / creatureArt showcase, not as another combat sim next to gladiator_arena.
## Replan
- Phase 1 (S): make it winnable. CUT the Lua-picks-first/TS-picks-random split (make Lua accept the already-chosen parts, one contract; reason: two owners of selection invite a wrong test). ADD a balance change so win rate lands near 50% (arithmetic: baseline 170 gives about 41%, 180 about 58%; tune by test), a persisted record, and a visible Reset. Verify: new vitest runs 1,000 encounters and asserts win rate 35-65%; `uv run pytest tests/test_chimera_wilds.py`.
- Phase 2 (M): one decision. CUT random player stats (fixed baseline). ADD "build your fighter": pick one part per slot from a small starter set under a price budget (uses the existing price field), then fight; wins pay credits to unlock more parts. Verify: headless test that every budget-legal build is playable and the best build beats the median chimera.
- Phase 3 (S): showcase only if Phase 2 lands: ADD creatureArt/pixel-style toggle as the first adopter. CUT nothing. Verify: screenshot pair vector vs pixel.
## First three directives
1. Chimera_Wilds_Fix_Unwinnable_Balance - rebalance baseline, 1,000-run win-rate test, persist record, Reset button; S; none.
2. Chimera_Wilds_Single_Lua_Contract - generate_chimera takes chosen parts; Python and TS tests updated; S; after 1.
3. Chimera_Wilds_Build_Your_Fighter_Spec - spec only, budget rules and starter set; S; after 1 (Robert approves the rule change).
## Open question for Robert
The fix changes the rules (SCOPE.md called rules changes his call). Recommended default: yes, set baseline so a fresh player wins about half the time, then build Phase 2.
