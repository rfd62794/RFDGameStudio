# planetofgreed direction (2026-10-04, rewritten 2026-10-05)

> Rewritten 2026-10-05 with Robert's decision: Planet of Greed (PoG) is THE dedicated "World Conquest" game. The 2026-10-04 text (verdict POLISH, "Open question: None") is superseded; its still-true facts are carried forward below and its stale facts are corrected in "Corrections to the 2026-10-04 text".

## Identity (one sentence)
Planet of Greed is the free browser World Conquest game: a Risk-style, turn-based land grab where you play one of six culture Houses against AI Houses in a short session (5-15 minutes).

## Settled decisions (Robert)
- 2026-10-05: PoG is THE World Conquest game: Risk-style, turn-based, short sessions (5-15 min) vs AI, free browser game, split out of SlimeWorld (SlimeWorld keeps its own identity; it no longer carries the conquest layer).
- 2026-10-05: Refine the direction by pulling in aspects and components of the predecessors (CorpWorld, Kingmaker Squads, PlanetForge, SlimeWorld territory layer, SlimeGarden). Verdicts are in "Lineage and port matrix"; the default is to NOT port.
- 2026-10-05: Free game like every RFDGameStudio demo. Solo entrepreneur with a day job: no support, no platform promises, no vendor-scale expectations, no accounts, no multiplayer.
- 2026-10-05: Archive, never delete, the predecessor code (corpworld, planetforge, slimegarden, slimeworld). Marking the corpworld README "superseded by Planet of Greed" is a RECOMMENDATION only; not done in this branch.
- 2026-10-04 (carried forward): PoG's ending hands off to Chapter 2, Facility Escape (docs/gdd/PlanetOfGreed_Design_v0.2.md:127-131); the chapter link already ships.

## What exists today (verified 2026-10-05 against origin/main e1c7a4d5)
- Playable loop: title, New Campaign, opening sequence, culture pick, guided per-region weekly orders with pre-filled defaults (GuidedWalkthrough.tsx, 503 lines per the matrix; not re-counted), combat replay, alert queue, Annual Report, Rank-1 ending check. Loads clean per audit batch2:18 (I have not played it).
- Campaign is CAPPED at 3 years: App.tsx:1027 `if (newDate.year >= 4)` sets campaign over; that is 156 weeks. Rank 1 at any Annual Report can end it earlier (endingSystem.ts). The 2026-10-04 "no cap found" note was wrong.
- The ending screen is REAL, not a placeholder: 71008fbb (2026-10-04) and dd2028f5 added the ending summary, "Play again" and "Continue to Facility Escape" (App.tsx ~1835-1870, endingView.ts, gameLinks.ts, ts/tests/test_planetofgreed_ending_view.ts). The comment block in endingSystem.ts:12-15 still says "placeholder" and is stale. What remains thin is narration (flavorText.ts ENDING_TEXT is two short paragraphs), and an AI House reaching Rank 1 triggers nothing (endingSystem.ts comment).
- Size: ts/src/games/planetofgreed with App.tsx at 1,947 lines holding the whole turn engine; aiDecisions.ts 91 lines; endingSystem.ts 43. 12 test files `ts/tests/test_planetofgreed_*.ts`; the matrix reports 174 passing tests via `cd ts && npx vitest run tests/test_planetofgreed` (I re-ran it 2026-10-05: 12 files, 174 passed, matches the matrix).
- Engine randomness: App.tsx uses `Math.random` directly (for example lines 727, 775, 895, 899 and transit ids); only aiDecisions.ts takes an injectable `rng`. A seeded headless run needs the engine extracted first (or Math.random stubbed).
- AI: weighted-random. Only the Expand target is wheel-weighted (aiDecisions.ts); the action roll (about 40/20/20/20) is untouched.
- Shared combat resolver already lives in ts/src/engine/shared/combat/resolveCellCombat.ts.
- Shared chrome (BoardroomHeader, PlanetMap, FactionTheme) is used by other games: touch carefully.
- Saves use the legacy key `corpworld_state`; a guard test pins it (d0c37314). Do not rename without a read fallback.

## Corrections to the 2026-10-04 text
- "App.tsx 1,928 lines" is now 1,947; the annual logic is still duplicated (advanceDay ~1109-1150 and a second copy ~1417-1440).
- "Ending is a placeholder / no way to continue or go back": stale; the ending screen shipped. Old Replan item 2 is DONE except narration content.
- "Unverified: how long a campaign takes (no cap found)": there is a 3-year cap; the duration in minutes is still UNMEASURED.
- Old first-three order (soak test, ending, extraction depends-on soak) is reordered below: extraction goes first because the soak test needs injectable randomness.

## Player experience today vs the target
First 60 s: New Campaign, opening sequence, then a House pick and one-click confirmed default orders per region ("confirm, confirm, authorize"); the best moment in this group. Target: a Risk-like session of 5-15 minutes that ends with a clear result and a reason to play again. Gap: whether a 156-week campaign fits 5-15 minutes is unmeasured; a Rank-1 early end may make it shorter, a full campaign may make it much longer. Phone: no measured 390x844 pass; onboarding is good but needs a measured first-minute hint chain.

## Verdict
BUILD toward the World Conquest identity, in small measured steps. 1) The game is shipped, tested and honest; most of the "port" work was already done in the CorpWorld fork. 2) The real gaps are measurement (session length, AI-vs-AI balance), structure (monolithic App.tsx, a hard-rule SRP item), AI depth and ending content. 3) Almost everything else in the predecessors would be scope creep for a short Risk-style session.

## Lineage and port matrix
Evidence: "verified" = I read it in this worktree on 2026-10-05; "matrix" = reported by the 2026-10-05 read-only matrix agent, not re-checked by me; "unverified" = could not check.

### Already ported (do not port again)
| From | What | Where in PoG | Evidence |
|---|---|---|---|
| CorpWorld | mapGenerator (Voronoi map) | ts/src/games/planetofgreed/utils/ | matrix |
| CorpWorld | shared combat resolver (round-scaled damage fix; R3 survival unchecked) | ts/src/engine/shared/combat/resolveCellCombat.ts | file verified; behaviour matrix |
| CorpWorld | weekly orders panel, alert queue, annual report, opening sequence | components/ plus test_planetofgreed_shell_opening.ts | matrix; test file verified |
| Kingmaker Squads | wheel/hostility ideas | wheelTopology.ts, aiDecisions.ts (91 lines) | files verified; Expand-only weighting matrix |
| Kingmaker Squads | public opinion per cell | App.tsx | matrix |

### PORT NOW (M0)
| Item | Size | Note |
|---|---|---|
| Extract the turn engine from App.tsx (annual logic duplicated at ~1109 and ~1417) | M | Hard-rule SRP item; first, because the soak test and every later change need it. |
| Headless AI-vs-AI soak test printing weeks-to-finish, asserting no softlock and no negative resource. Templates: ts/tests/test_kingmaker_combat_soak.ts, ts/tests/test_slimeworld_headless_balance.tsx (both verified to exist) | S | Needs injectable randomness: depends on the extraction, or a Math.random stub. |
| Real ending | ALREADY DONE | Screen shipped in 71008fbb; only narration content and the stale endingSystem.ts comment remain (S, a content call for Robert). The matrix listed this as port-now; it is not. |

### PORT LATER (each gated on an M0 measurement)
| Item | Size | Gate / risk |
|---|---|---|
| Kingmaker hostility/threat-weighted AI scoring, as a PATTERN built new (not a code copy) | S-M | Soak shows AI passive or one House dominating. |
| Loyalty / publicOpinion erosion with regional revolt as catch-up | M, medium risk | Soak shows runaway leaders. Adds a system to a short game; only if measured. |
| Zoom/pan clamping | M | Only if the 390x844 phone pass shows a problem. |
| CorpWorld civic "unrest" focus stub | S | Only if loyalty/revolt lands. |
| PlanetForge monuments as a once-per-region Fortify sink | S, low priority | Only if resources pile up unused in soak data. |

### SKIP (scope creep for a 5-15 minute Risk-style game)
- Kingmaker Squads: shop, deploy, squads, individual units; chess movement; tactical combat; crown/king (a second win condition). Kingmaker stays a separate origin game.
- PlanetForge: soil/tier ratchet, ring topology, idle sim.
- SlimeWorld (the "split out" is a separation, not a transplant): region locks, belief/fealty/missions/economy, dispatch, planetRegion geometry.
- SlimeGarden: config only; nothing to port.
- Procedural districts and larger maps: longer sessions, against the 5-15 minute identity.

### Predecessor disposition (recommendations)
Archive, never delete: corpworld, planetforge, slimegarden, slimeworld code. Recommendation only (not done here): mark the corpworld README "superseded by Planet of Greed". SlimeWorld docs could note that the conquest layer moved to PoG; Robert decides the wording.

## Scope-creep NOT list
No second win condition (crown/king); no individual units, squads, shop or deploy; no chess movement or tactical combat; no region locks, belief, fealty, missions or economy layer; no soil/tier ratchet, ring topology or idle sim; no procedural districts or larger maps; no accounts, multiplayer, leaderboards, dispatch or support promises; no new Houses; no combat rule changes (Circle/Square/Triangle stays); no renaming the `corpworld_state` save key without a read fallback. Every PORT LATER item needs a measurement that justifies it first.

## Open questions for Robert
1. Campaign length: the 3-year (156-week) cap may be well past 15 minutes. After M0 measures it: a campaign cap in weeks, or a 1-year "quick mode" beside the full campaign? Your design call; not assumed.
2. Ending content: is the current two-paragraph ENDING_TEXT enough, or do you want a longer or per-House/per-fragment ending? Should an AI House reaching Rank 1 end the game with a defeat screen? Today nothing happens.
3. Is the "Continue to Facility Escape" link still wanted now that PoG is a standalone World Conquest game, or should the ending offer only Play again?
4. Is "5-15 minutes" judged by the soak test's weeks-to-finish at normal play speed, or by a real playthrough you do?
5. Predecessor housekeeping: OK to add "superseded by Planet of Greed" to the corpworld README and a "conquest moved to PoG" note to SlimeWorld docs (docs-only)?
6. Review model and milestone style (accept the PROPOSED playable slices?): TBD, ask Robert.

## Review model
TBD, ask Robert. His time per demo varies, so no review cadence is assumed.

## Solo-entrepreneur framing
One person with a day job. PoG is a free browser game; no support capacity, no accounts, no platform, no promised dates or updates.

## SOLID/SRP/KISS (hard rule)
New behaviour goes in small new modules under ts/src/games/planetofgreed/ (for example turnEngine.ts, campaignState.ts, and later separate AI-scoring and revolt modules), not into App.tsx (1,947 lines). Extracting the turn engine is itself an M0 item. Pure functions with injectable rng so headless tests can run. Shared chrome (BoardroomHeader, PlanetMap, FactionTheme) is touched only with a check against the other games that use it.

## Roadmap
PROPOSED playable-slice milestones are in ts/src/games/planetofgreed/ROADMAP.md (same pattern as Shoal's). Nothing is queued.

## Proposed first three directives (NOT queued)
1. Extract the turn engine from App.tsx. M. depends-on: none. Pure `turnEngine.ts` (advance day/week, annual logic once, ending check) and `campaignState.ts`, injectable rng (default Math.random), no behaviour change; App.tsx keeps rendering.
   Verification: `cd ts && npx vitest run tests/test_planetofgreed` (same pass count as the pre-change baseline; record it first, matrix says 174) and `cd ts && npx tsc --noEmit`.
2. Headless AI-vs-AI soak test. S. depends-on: 1. New `ts/tests/test_planetofgreed_soak.ts` with a seeded rng; plays full 3-year campaigns for several seeds with all Houses AI; asserts no negative resource/units, no softlock (campaign over within a step bound), prints weeks-to-finish per seed. Templates: test_kingmaker_combat_soak.ts, test_slimeworld_headless_balance.tsx.
   Verification: `cd ts && npx vitest run tests/test_planetofgreed_soak.ts` (output shows weeks-to-finish per seed) and `cd ts && npx vitest run tests/test_planetofgreed`.
3. Ending content and cleanup. S. depends-on: Robert's answer to open question 2 (the screen itself already shipped). Remove the stale "placeholder" comment in endingSystem.ts and extend ENDING_TEXT per Robert's choice; keep Play again.
   Verification: `cd ts && npx vitest run tests/test_planetofgreed_endingSystem.ts tests/test_planetofgreed_ending_view.ts`.
(The matrix listed "real ending screen" as directive 2; it already landed, so directive 3 is the leftover content and cleanup. A 390x844 phone pass is a controller browser step, not a directive.)
