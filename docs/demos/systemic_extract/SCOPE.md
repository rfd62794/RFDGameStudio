# systemic_extract scope analysis (2026-10-03, Sonnet scope agent, registry status: external)
Direction: top-down extraction roguelite plus base-builder on one 200x200 megamap: deploy from a sanctuary into 4 dungeon sectors, survive hazards/hives, extract salvage (ts/src/games/systemic_extract/config.ts:7,11; examples/systemic-extract/README.md:1-5; src/App.tsx:2-5 "ADR 011 megamap"). Source is about 13.5k lines of ts/tsx (wc, examples/systemic-extract/src).
Working:
- Headless fixed-rate ECS simulation with one file per system, canvas renderer, IndexedDB saves (README Architecture table, Stack line); Deploy buttons and gate popup in components/RaidView.tsx:175-193,250-272.
- Loads clean on desktop and phone; canvas renders (docs/state/demo-audit-batch2-2026-10-03.md:27).
- Own commands exist: test/lint/build (examples/systemic-extract/package.json:8-12); 1 test file (src/game/simulation/simulation.test.ts).
Rough:
- Hideout meta loop is orphaned: grep finds no importer of HideoutView or useHideoutState outside their own files; README backlog 1 says players collect scrap "with nowhere to spend it" and "Decide how these reach the megamap".
- No visible restart / new-raid label (audit batch2:27, "no restart seen"); index tag reads "Prototype", not "embed" (audit batch2:27).
- Nondeterministic sim (26 Math.random), 19 `any`, missing ADR 002-011 docs, favicon 404 (README backlog 2-5).
Class: refine. The game plays; only baseline items are safe to specify until the hideout question is answered.
Top 3 changes, in order: 1. Add a visible Restart / New Run control returning to the sanctuary without reload (A3); 2. Label the card honestly as an embed and add the screenshot (A5, A8); 3. Add a favicon to clear the console warning (README backlog 5; A1).
Out of scope: wiring HideoutView into the megamap, seeded RNG, typing cleanup, recovering ADRs, any TS-native rewrite, new sectors or enemies.
Dependencies / risks: examples/ edits are overwritten by an AI Studio re-promotion (README "Improvement workflow"); ts/package.json has no build:systemic_extract (lines 9-19), so A7 would rest on the example's own build; the ts game dir holds only config.ts.
Effort: S
Open question for Robert: yes. README backlog 1 leaves open how (or whether) the orphaned hideout loop (Deconstructor, Research Bench, Fabricator, Deployment Bay) reaches the megamap, e.g. via the corner specialist buildings. Nothing past Tier A is proposed until answered.
Tier: A only, hideout loop parked (2026-10-04, Robert's approval of the PARK verdict): no Tier B/C work until the hideout decision in HIDEOUT_DECISION.md is answered.
