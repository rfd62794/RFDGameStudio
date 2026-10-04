# gladiator_arena direction (2026-10-04)
## What it tried to be
A manager sim: "you never swing the sword, you decide what it's attached to" (App.tsx:104). Assemble cyber-organic frames in the Forge, keep a roster, climb a 5-tier champion ladder through auto-played turn-based bouts with per-part anatomy damage (RimWorld-style efficiency, Blood Bowl recoil) and an agent decision engine. First commits are one large drop on 2026-08-15 (`d5f10559` anatomy + decision engine; `1109b50a` App.tsx plus a fix for "200+ typos" such as rrom/rlex in BalanceReportView, i.e. generated code mangled in transit). Then chrome only: GameShell (`f7a34aa8`, 09-20), title + first-run Manager's Primer (`34031d23`, 09-29), Tier A on 2026-10-04 (`75a90e01`: New Game with 2-click confirm, phone tab-bar fit, `build:gladiator_arena`, career-simulation test). Drift: intent is unchanged, but build tooling (Balance Lab, harness) became a player-facing tab.
## Where it is now
- Loop complete: Roster/Forge/Medbay/Ladder/Balance tabs, combat view with play/pause/step and speed (ArenaCombatView.tsx:302-328), save plus reset, 5 tiers, tier 5 reachable in the career test.
- Size: 7,855 lines TS/TSX; combatEngine 538, championLadder 361, forgeEconomy 184, balanceHarness 747, ArenaCombatView 851, BalanceReportView 744, StickFighter 559.
- Tests: `test_gladiator_arena_tier_a.ts` (build wiring, source anchors, seeded career run, no NaN) and a shell test; Gladiator_Career_Test_Tighten_Directive exists to tighten them. SCOPE.md is stale: it still lists Tier A as open.
- Standalone build now exists (`ts/package.json:18`); registered `dev`; no cover (arcade-and-site-status lines 67-68).
- Phone tab-bar fix landed but this research did not re-measure it at 390x844.
- Player-facing dev-speak: tab "Balance Lab", blurb "Blood Bowl recoil, agent-driven decision AI" (config.ts:12).
## Player experience today vs the target
First 60 s: title menu, Manager's Primer on first run, then a roster with a starter fighter; the first action (send to a bout) is reachable. Best moment: the first bout played out as a stick-fighter animation with wound chips and a turn-order HUD. Biggest turn-off: a wall of management concepts (compatibility inspector, efficiency, malfunctions, medbay) and a "Balance Lab" tab that tells the player they are looking at a simulator, not a game. Way back: shell control; progress persists.
## Verdict
TRIM, then POLISH.
1. The one clear player-facing defect is shipped dev tooling and jargon; hiding it is cheaper than any feature.
2. Core systems are real and tested enough; no rewrite or redesign is justified.
3. Tier A is done, so the next work is feedback and next actions (Tier B).
## Replan
- Phase 1 TRIM (S): CUT the Balance tab from the player nav (reason: dev tooling; keep the files, the career test uses the harness) behind `?dev=1`, and the jargon in the blurb. ADD a plain blurb of 60 words or fewer. Verify: Playwright tab list has 4 tabs without the flag, 5 with it; `git grep -n "Balance Lab\|Blood Bowl" ts/src/games/gladiator_arena/config.ts` is empty.
- Phase 2 POLISH (M): CUT nothing. ADD a win/loss result card in ArenaCombatView with one next action (B3, B6), a re-measure at 390x844 after the tab-bar fix (A4), and a cover. Verify: screenshot pair of result cards; scrollWidth <= viewport; cover in manifest.
- Phase 3 (S): finish line. ADD an end screen when tier 5 is cleared (new season / keep playing). CUT nothing. Verify: the career test already reaches tier 5; add a vitest asserting the end-state flag renders the screen.
## First three directives
1. Gladiator_Hide_Balance_Lab_And_Blurb - dev flag for the Balance tab, plain blurb, test; S; none.
2. Gladiator_Bout_Result_Card_And_Phone_Check - result card plus next action, 390 px audit; M; after 1 (ArenaCombatView is 851 lines: touch only the result path).
3. Gladiator_Tier5_End_Screen_And_Cover - end-of-ladder screen, cover; S; after 2.
## Open question for Robert
None.
