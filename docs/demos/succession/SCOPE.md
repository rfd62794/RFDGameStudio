# succession scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: persuasion/court-intrigue sim, 8 segments, three figures with locked persuasion methods, rival AI, regicide inquiry (config.ts:7,9; data/gameConstants.ts:4; docs/Succession_Design_and_Identity.md:14-18). Design doc names the next phase: murder-inquiry work (hint count/cadence, wrong-accusation consequences, deterministic murderer seeding) (Design_and_Identity.md:106-111,128-130; ADR-007:230-232).
Working:
- Deep, tested engine: contradiction, deduction, favor, rivalAI, methodLock, verdict (engine/); 20 test_succession_*.ts files incl. balance sim; `build:succession` exists (ts/package.json:18).
- Locked methods + CourtPrimer via shared OnboardingGate (App.tsx:35,57,77; CHANGELOG.md:7). Directive Revamp_Succession_Continue is in Review (head cd37e66; 7 strategies x 3 origins, each origin winnable).
- Audit batch2:26: loads, 0 errors.
Rough:
- Audit "no restart seen" verified in part: "Play Again" exists only on the verdict screen (components/VerdictScreen.tsx:331-339; App.tsx:110-115); no title or restart control found in the playing view (App.tsx:195-259 passes only SegmentHeader as statusArea).
- No run persistence: only the primer flag is saved (App.tsx:35,77); an 8-segment run is lost on reload.
- Status `dev` but I did not read engine/deduction.ts logic, so how much of the four open design items is already coded is unverified.
Class: improve - the design corpus points at a next feature, but chrome gaps come first.
Top 3 changes, in order: 1. Restart/back-to-title in play (A3). 2. Save and restore gameState per segment with a reset control (B2). 3. Murder-inquiry items from Design_and_Identity.md:106-111, only after Robert supplies the decisions (hint count, wrong-accusation penalty).
Out of scope: anything the Review directive shipped (ADR-007 locked methods, CourtPrimer); re-opening ADR-001..007; new origins/figures; art pass.
Dependencies / risks: the Review directive's branch must merge first (same folder, App.tsx conflicts); balance harness must stay green (ts/tests/test_succession_balance_sim.ts).
Effort: M
Open question for Robert: none (direction documented; change 3 waits on his answers to the four open items)
Update 2026-10-04: Revamp_Succession_Continue is merged (PR #59). In-play restart and per-segment save are queued as Succession_Run_Controls_Directive and Succession_Run_Save_Continue_Directive.
Phone layout: framed until a 390x844 pass says otherwise (the figure cards are dense; DIRECTION.md replan 3 proposes stacking them on narrow widths). The live /arcade/succession/ 404 and the missing cover are controller and site tasks (redesign D2).
