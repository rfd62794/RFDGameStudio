# mutant_battle_ball scope analysis (2026-10-03, Sonnet scope agent, status `dev`)
Direction: parts-built 2v2 mutant sports-combat with brand synergies, shop and infirmary (ts/src/games/mutant_battle_ball/config.ts:7; CHANGELOG.md "Body Part Synergy ... Brand Trinity"; ROADMAP.md:152-158 names squad pick, Infirmary, Brand Sets as next).
Working:
- Real sim split into mbb* modules (simulation/ listing) with a standalone build script (ts/package.json:14).
- Most test coverage in this batch: 11 test_mbb_*.ts files in ts/tests (ls).
- Title + New Game, tabs Roster/Workshop/Match/Shop/Infirmary (App.tsx:185-207,264-290).
Rough:
- Squad is hardcoded to the first two mutants (App.tsx:70; ROADMAP.md:152-155).
- InfirmaryTab is a stub: heading and one sentence (components/InfirmaryTab.tsx:9-13).
- Parts-summing gives stats 2-3x flat stats, flagged as first item to address (ROADMAP.md:61-66). No save/persist found in App.tsx (grep for save/persist/STORAGE: no hits). Flaky MBB balance-symmetry tests recorded in docs/directives/RFDGameStudio_PipelineAudit_Phase1_Directive.md:259.
Class: improve. The roadmap already queues squad selection and Infirmary; the demo adds to its own direction.
Top 3 changes, in order: 1. Squad selection in RosterTab (roadmap item; RosterTab.tsx:34 only starts the match). 2. Functional Infirmary (repair/recover downed mutants). 3. Balance pass on parts-summing plus de-flake the two symmetry tests.
Out of scope: Gravekeeper/OEM tiers, new brands, new art, simulation rewrite, itch release.
Dependencies / risks: shared ui/components and engine/paperDoll (RosterTab.tsx:1-2); MatchCanvas (499 lines) not read in full; the game also ships a Lua copy in games/mutant_battle_ball/ whose role vs the TS sim I did not trace.
Effort: M
Open question for Robert: none
