# Planet of Greed — Roadmap

Studio-wide roadmap: [`/ROADMAP.md`](../../../../ROADMAP.md)
Changelog: [`./CHANGELOG.md`](./CHANGELOG.md)
Direction: [`/docs/demos/planetofgreed/DIRECTION.md`](../../../../docs/demos/planetofgreed/DIRECTION.md)

Identity (Robert, 2026-10-05): the free browser World Conquest game, Risk-style, turn-based, 5-15 minute sessions vs AI.

Milestone style is PROPOSED (playable slices; each is something a stranger can play in a browser). Robert has not confirmed it. Nothing here is queued.

---

## Completed

- [x] **Culture stat asymmetry** (`houseStats.ts`) and **wheel-aware Expand targeting** (`aiDecisions.ts`)
- [x] **Per-House chrome theme** (FactionTheme style split, 2026-09-26)
- [x] **Tier A polish** (d0c37314): CorpWorld dossier text, save-key guard test
- [x] **Ending screen** with summary, Play again and Continue to Facility Escape (71008fbb, dd2028f5)

---

## Proposed milestones

- **M0 Measured and structured (game stays playable throughout).** Extract the turn engine from App.tsx (annual logic exists twice); headless seeded AI-vs-AI soak test printing weeks-to-finish and asserting no softlock or negative resource; measure session length against the 5-15 minute target; clean the stale ending comment. Gate for every later milestone: `cd ts && npx vitest run tests/test_planetofgreed` green.
- **M1 Short session.** Based on the M0 measurement and Robert's call (campaign cap in weeks, or a 1-year quick mode beside the full campaign). A stranger finishes a game in 5-15 minutes.
- **M2 Phone pass.** 390x844 pass of GuidedWalkthrough and the map, a measured first-minute hint chain; zoom/pan clamping only if the pass shows a problem.
- **M3 Smarter AI (gated).** Kingmaker-style hostility/threat-weighted scoring, built new as a small module, only if the soak shows a passive or dominant AI. Re-run the soak to compare.
- **M4 Catch-up (gated, medium risk).** Loyalty/publicOpinion erosion with regional revolt (and the civic unrest focus stub) only if the soak shows runaway leaders. An optional once-per-region monument Fortify sink only if resources pile up.
- **M5 Keepsake.** Ending content per Robert's choice; cabinet/itch presentation as World Conquest.

Not promised: dates, support, accounts, multiplayer, content updates.

## Not doing (scope creep)

Kingmaker shop/deploy/squads/units, chess movement, tactical combat, crown/king second win condition; PlanetForge soil/tier ratchet, ring topology, idle sim; SlimeWorld region locks, belief/fealty/missions/economy, dispatch; SlimeGarden; procedural districts and larger maps.
