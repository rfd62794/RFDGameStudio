# systemic_extract scope analysis (2026-10-03, Sonnet scope agent, registry status: external)
Direction: 2D top-down extraction sandbox: deploy from a sanctuary into four dungeon sectors, survive spreading hazards, extract with salvage, with a hideout meta loop (ts/src/games/systemic_extract/config.ts:7,11; examples/systemic-extract/README.md:3-5). The README's own audit says the meta loop is orphaned and "Decide how these reach the megamap" (README.md:57-63).
Working:
- Raid loop ends in extracted or KIA (src/hooks/useRaidSimulation.ts:96,227); ECS simulation with headless tests (src/game/simulation/simulation.test.ts; README.md:19 "npm test").
- Saves go to IndexedDB (README.md:11-12; src/backend/storage.ts:4,50).
- Live: 0 console errors, canvas renders, "DEPLOY" present (docs/state/demo-audit-batch2-2026-10-03.md:27).
Rough:
- Hideout panels (Deconstructor, Research Bench, Fabricator, Deployment Bay) are unreachable: HideoutView.tsx is imported nowhere (README.md:57-63); only postRaidExtract runs, so scrap has nowhere to spend.
- No restart label seen in-game, A3 fails (batch2:27); index tag says "Prototype", not "embed" (batch2:27).
- Nondeterministic simulation (26 Math.random calls, README.md:65-67); no favicon, 404 on every load (README.md:72-73); missing ADRs (README.md:68-70).
Class: improve - the hideout loop already exists in code and only needs a place in the game; where it goes is a design decision, so only Tier A is proposed.
Top 3 changes, in order: 1. Add a visible restart/new-raid control after extraction or KIA (A3). 2. Add the favicon and drop the unused Gemini capability from metadata.json (README.md:72-76). 3. Fix the card label so it reads "embed" honestly (A8; batch2:27).
Out of scope: wiring the hideout into the megamap, seeded RNG, new sectors/enemies/items, recovering ADRs, TS-native rewrite, typing cleanup (19 `any`, README.md:71).
Dependencies / risks: examples/systemic-extract is whitelisted at .gitignore:206 and promotion from AI Studio overwrites src/ (README.md:44-52); deploy is a separate confirmed step (README.md:24-26).
Effort: S
Open question for Robert: how should the hideout (deconstruct, research, craft, deploy) reach the one-world megamap, or should it be cut? The README leaves this open (README.md:57-63); nothing past Tier A is proposed until answered.
