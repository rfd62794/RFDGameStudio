# shoal scope analysis (2026-10-03, Sonnet scope agent, registry status: stable)
Direction: a watch-not-manage reef ecosystem: fish graze, sharks hunt, algae rises and sinks with grazing pressure; the run ends when the reef goes silent (ts/src/games/shoal/config.ts:7,11-14; App.tsx:305-315). Next ideas are written down as research, "not a directive" (docs/OceanEcosystemExpansion_Research.md:3).
Working:
- Complete loop: title, primer, simulate, extinction end screen with stats and "Seed a New Reef" (App.tsx:204-218,305-315).
- Live: 0 console errors, 0 failed requests (docs/state/demo-audit-batch2-2026-10-03.md:20); build:shoal exists; six test files (ts/tests/test_shoal_*.ts).
- Ships to arcade, itch and Y8 from one source (CHANGELOG.md:5-8; y8Config.ts).
Rough:
- No Restart seen while the reef is alive: handleReplay (App.tsx:218) is passed only to the extinction EndStateScreen (App.tsx:314); the live in-run controls were not read; A3 fails (batch2:20 "no restart seen").
- The only stable demo has a manifest screenshot that is not verified (batch2 caveats: "n/v").
- Phone: A4 passes but the frame is about 374x210 px, so the judgment is generous (docs/state/demo-audit-batch1-2026-10-03.md:73 finding 5).
Class: refine - the demo is finished and stable; the audit failure is one missing control.
Top 3 changes, in order: 1. Add an in-run "New Reef" control that calls the existing handleReplay (App.tsx:218). 2. Verify the A5 manifest screenshot and reference it. 3. Check that the canvas HUD reads at 390x844 portrait.
Out of scope: new habitats, orca/whale role-fill, kelp/seagrass/vents (all in the research doc, not approved), Y8 integration changes, sim tuning, new art.
Dependencies / risks: three build targets share App.tsx and shoalSimulation.ts (CHANGELOG.md:5-8); any control added must not break the Y8 start signal (App.tsx:205-209); six existing tests guard it.
Effort: S
Open question for Robert: none
