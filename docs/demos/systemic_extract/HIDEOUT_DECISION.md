# systemic_extract: what to do with the orphaned hideout (decision page)

Date: 2026-10-04. For Robert. Status: waiting on one answer. Nothing here is built.

## The question

Systemic Extract's raid loop plays and restarts (NEW RUN landed, PR #119). The second loop, the hideout where salvage is spent, is unreachable: after the 200x200 megamap rewrite (ADR 011) nothing imports it, so a successful run ends with scrap that cannot be spent. How should salvage be spent, if at all?

## What exists today (measured on origin/main 889dd21e)

- `examples/systemic-extract/src/components/HideoutView.tsx` (194 lines) and `src/hooks/useHideoutState.ts` (307 lines) are imported only by each other.
- Seven panels sit under `src/components/hideout/`: DeploymentBayPanel 487, ResearchBenchPanel 277, DeconstructorPanel 228, HideoutHeader 164, FabricatorPanel 136, FaradayShieldBanner 89, HideoutFooter 41 (1,422 lines).
- `src/backend/hideout-service.ts` (856 lines) is NOT orphaned: the raid already calls `hideoutBackend.postRaidExtract` (`src/hooks/useRaidSimulation.ts` line 570) and `EcsInspector.tsx` reads `hideoutBackend`. Only `postHideoutDeconstruct`, `postResearchBrainstorm` and `postHideoutCraft` are never called.
- The example is a 13,610-line AI Studio app; edits there are overwritten by an AI Studio re-promotion (its README, "Improvement workflow").

## Option A: wire it in, smallest version (recommended if it should ship as a game)

One "Stash and upgrade" modal opened from the sanctuary, reusing `HideoutView` and `useHideoutState` as they are. No megamap corner buildings, no new art.
- Files touched: the sanctuary view that renders the Deploy button (`src/components/RaidView.tsx`, Deploy buttons near lines 175 to 193 and 250 to 272) plus one new small modal wrapper; no change to `hideout-service.ts`.
- Size: M (one directive, one Devin run), plus a browser check that salvage collected in a raid shows in the modal.
- Risk: the hideout panels were built for a different root view; expect layout work at phone width.

## Option B: cut it (smallest spend)

Delete `HideoutView.tsx`, `hooks/useHideoutState.ts` and `components/hideout/*` (1,923 lines in all). Keep `hideout-service.ts` (the raid uses it). Reword the "Inert Scrap Matter ... for Faraday deconstruction" text so salvage reads as a score, not a currency.
- Size: S. Verify afterwards: a Grep for `HideoutView` under `examples/systemic-extract/src` finds nothing, and the example still builds.
- Cost: the research and crafting design is gone from the tree (it stays in git history).

## Option C: leave it parked (the default today)

Keep the honest embed (the card already says the hideout is not open yet) and spend nothing. Nothing changes for players.

## Recommendation

Keep it parked (Option C). If you want it shipped as a game, choose Option A, not the megamap corner buildings. Pick B only if you are sure you will never want the hideout.

## Open question for Robert

A, B or C? (A directive for A or B is written only after you answer.)
