# mutant_battle_ball direction (2026-10-04)
## What it tried to be
A parts-built 2v2 mutant sports-combat game: assemble mutants from body parts, field a squad, carry the ball to the end zone, salvage the fallen, buy and equip in a shop. Certified as a Lua 2v2 sport in "Phase 2v" (`4fab1373`, 2026-06-27), migrated to production TS-native with steering movement in `178c006b` (08-14; the Lua source is deliberately preserved and a test asserts it, `ts/tests/test_mbb_ts_native_migration.ts`). Match degeneracy fixes followed (`cb86bf79`, 08-14), then Brand/Quality/Cyber-Organic mechanics (`8198f66c`, 08-15) and "Neo Battlopolis" Body Part Synergy with a six-Brand Trinity (`42cbc78e`, 09-29). Intent drifted from "a sport game" toward "a creature-collector systems playground": mechanics depth keeps growing while the player-facing loop stays small.
## Where it is now
- Most developed demo in the group: 3,242 lines of ts/tsx in `ts/src/games/mutant_battle_ball`, simulation split into `mbb*` modules, 52 commits touching the dir, 11 `test_mbb_*.ts` files, `build:mutant_battle_ball` exists.
- Loop works: title, tabs Roster / Workshop / Match / Shop / Infirmary (`App.tsx`).
- Squad is hardcoded to the first two mutants: `activeSquad: [roster[0], roster[1]]` (`App.tsx:70`).
- `InfirmaryTab.tsx` is a stub: a heading and "Manage injured mutants." (13 lines, props unused).
- Balance debt: parts-summing gives stats 2-3x flat stats, "first item to address" (`ROADMAP.md:61-66`, `docs/DIRECTION.md:55`); flaky symmetry tests recorded (`docs/directives/RFDGameStudio_PipelineAudit_Phase1_Directive.md:259`).
- No save/persist in `App.tsx` (grep found none); a Lua copy of the sim sits in `games/mutant_battle_ball/`.
## Player experience today vs the target
First 60 s: title, New Game, a roster of mutants, then Match. Best moment: watching two parts-built mutants play out a match with ball arcs and tackles (MatchCanvas, 499 lines). Biggest turn-off: three of five tabs are either a stub (Infirmary) or build-then-lose-everything (no save), and you cannot choose who plays. Progress: shop and workshop exist but nothing persists. Way back: shell control and "Arcade" link.
## Verdict
**TRIM.**
1. A visible stub tab (Infirmary) and a deferred overhaul (OEM, Gravekeeper tiers) make the game look finished-in-name only; cutting what is empty comes before adding more.
2. The sim is the asset and is well tested; the player-facing surface needs three real fixes (squad pick, balance, persistence), not new systems.
3. Roadmap already queues these in order; this adopts that order and stops mechanics growth until they land.
## Replan
1. TRIM (S). CUT: the Infirmary tab from navigation (stub, nothing behind it; restore when built); the Gravekeeper/OEM/new-brand wish list from near-term scope (reason: depth without a persisted loop). ADD: nothing. Verify: tab list in a screenshot; `npx vitest run tests/test_mbb_*` still green.
2. Fix numbers (M). ADD: stat normalization so parts sum to the flat-stat range; de-flake the two symmetry tests (seed them). CUT: nothing. Verify: `cd ts && npx vitest run tests/test_mbb_*` three times green; balanced-speed match scores nonzero.
3. Make it a game (M-L). ADD: squad selection in RosterTab, persist roster/credits via the shared persistence module (ADR-014), then build the Infirmary for real (repair downed mutants). Verify: pick a different pair, reload, state restored; Playwright cold-load smoke to first match in 60 s.
## First three directives
1. mutant_battle_ball: hide the Infirmary stub tab and add a test that nav lists only built tabs. S. Depends: none.
2. mutant_battle_ball: normalize parts-summing stats; seed the two flaky symmetry tests. M. Depends: none.
3. mutant_battle_ball: squad selection plus persistence of roster and credits. M. Depends: 2.
## Open question for Robert
None. Default: keep the preserved Lua copy as is (the migration test requires it); no new brands until phase 3 lands.
