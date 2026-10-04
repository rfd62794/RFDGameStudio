# facility_escape direction (2026-10-04)
## What it tried to be
A turn-based stealth puzzle where guards commit to their next action before you move, so every turn is a read-the-sightlines decision. Imported as AI Studio export v0.1.0R1 (intake manifest `ae4d0f9b`, 2026-08-06; source tracked `3f47e61d`, 08-30; genre `puzzle-stealth` `d17e85fa`, 08-23). The code self-describes as a "MECHANICS PROTOTYPE" (`examples/facility-escape/src/App.tsx:543`), and the porting roadmap rates it "real BFS guard pathfinding, real A* level solver" (`docs/RFDGameStudio_DemoPortingRoadmap.md:63`). Intent was a rules test; the drift is that it now ships as a card.
## Where it is now
- Embed of `examples/facility-escape` at `/arcade/facility_escape/`; status `external`; no TS-native port.
- 4,403 lines of ts/tsx in src (room generator 992, solver 701, physics 654, guard AI 271); no tests in the example dir, one blurb test in `ts/tests/test_facility_escape_blurb.ts`.
- Tier A landed in `18339ffa` (module-load self-test removed, blurb rewritten). Audit's 5 prod `[LOG]` lines should be gone; not re-run.
- Player-visible dev-speak remains: "MECHANICS PROTOTYPE" (`App.tsx:543`), "RESET PROTOTYPE ATTEMPT" (`:774`), "PROTOTYPE VALIDATION SUCCESSFUL" on the win card (`:810`).
- Content: 8 generated rooms; the solver exists to prove each is solvable.
- No persistence, no best-run record, no tutorial found in the files read.
## Player experience today vs the target
First 60 s: "INITIATE INFILTRATION", then a grid with guard sightlines; whether a newcomer understands that sightlines are the whole game is unverified (no browser run). Best moment: seeing a guard's telegraphed move and slipping past it. Biggest turn-off: lab language ("prototype validation") instead of a win moment, and no hint on turn one. Progress: 8 rooms is a built-in ladder but nothing shows room N of 8 or a result. Way back: shell control (audit pass).
## Verdict
**POLISH.**
1. It has the strongest unused asset in the group: a solver-validated puzzle generator, so content is effectively unlimited without new design.
2. Gaps are copy and onboarding, not systems; one embed edit pass fixes them.
3. Settled rule: embed stays an embed (no TS-native rewrite), so polish must stay inside `examples/facility-escape`.
## Replan
1. TRIM dev-speak (S). CUT: "MECHANICS PROTOTYPE", "PROTOTYPE" in button and win text (it tells players they are testing, not playing). ADD: plain labels (STEALTH, RETRY ROOM, ROOM CLEARED). Verify: `grep -ci prototype examples/facility-escape/src/App.tsx` = 0; screenshot of win card.
2. First minute (S-M). ADD: one-time 3-line hint on turn one ("guards show their next move; stay out of the cone"), a "Room 3 of 8" indicator, a final 8/8 result card with turn count. CUT: nothing more; do not touch solver or generator. Verify: Playwright cold load reaches first move in 60 s; room counter visible in screenshot.
3. Phone (S). Verify 390x844 primary action reachable; if the grid cannot fit, label `framed` per the redesign spec c3.
## First three directives
1. facility_escape: replace prototype wording with player wording in `examples/facility-escape/src/App.tsx`; add a grep test. S. Depends: none.
2. facility_escape: room counter, turn-one hint, and a final result card. M. Depends: 1.
3. facility_escape: 390x844 phone check and screenshot for A4/A5. S. Depends: 1.
## Open question for Robert
None. Research agrees with the settled embed-only stance; no direction change proposed.
