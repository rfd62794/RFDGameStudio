# corpworld direction (2026-10-04)

## What it tried to be
A cold-corporate land-grab 4X: Voronoi map, fog of war, weekly orders, Circle/Square/Triangle combat. Built in AI Studio as CorpWorld v0.1.0R1..R5 (intake d54bcb1f R2, 4c568563 R3, 831151d5 R4, all 2026-07-12; Polish_Corpworld_TierA_Directive.md:44 records R5). On 2026-08-13 Planet of Greed forked it and 7 duplicate files were promoted to shared engine code (5e7d12fc: combat resolver, BoardroomHeader, PlanetMap, DailyEventModal...). On 2026-08-23 ADR-023 re-registered it as an Origin entry (d53a0d15, a4fecf54). Intent never drifted: it was a prototype, then an ancestor. Planet of Greed has since added the wheel, fragments, ending, AI decisions (docs/analysis/planetofgreed_merge_audit.md).

## Where it is now
- Loads, "AUTHORIZE PLANNING PHASE" and RESET present, 0 console errors (audit batch1:32). Tier A directive is Done.
- 4,221 ts/tsx lines in `examples/corpworld`, 0 tests; tracked only since 0c416b4f (2026-10-04).
- AI is pure-random (merge audit section 1), no ending, no win condition beyond conquest; all of that is superseded in Planet of Greed.
- Config blurb is clean now (no repo path), `supersededBy: 'planetofgreed'`, status `external`, order 350 (config.ts:9-17).
- `ts/src/games/corpworld/README.md` still says `examples/*` is gitignored and the folder untracked: stale since 0c416b4f.
- Unverified: that the deployed /arcade/corpworld/ build equals the tracked R5 source.

## Player experience today vs the target
First 60 s: a title and a Start button, then a dense boardroom UI with no walkthrough (the guided per-region flow exists only in Planet of Greed: GuidedWalkthrough.tsx 503 lines). Best moment: the first combat resolution replay, which is the same one Planet of Greed ships. Biggest turn-off: it is a worse copy of a game one card away; a player who tries it first sees the weaker AI and no way to win.

## Verdict
FOLD-INTO planetofgreed. 1) Every mechanic it has lives in Planet of Greed, better (shared combat code, wheel AI, ending). 2) Zero tests and no ending: it can never reach Tier B without becoming Planet of Greed. 3) The redesign spec's default for Q2 is "hide origin embeds"; a card that competes with its successor dilutes the "Start here" home and the published count.

## Replan
1. Keep the URL, drop the card. Goal: /arcade/corpworld/ and /games/corpworld/ still load; the arcade grid shows one colony-4x card. CUT: the standalone grid card (reason: duplicate of Planet of Greed). ADD: an "Origins" line on Planet of Greed's title screen linking to it, and an `origin`/hidden flag honoured by the redesign's home. Size S. Verify: `cd ts && npx vitest run tests/test_arcade_registry_directive.ts` still green; curl of both URLs unchanged after deploy.
2. Fix provenance. CUT: stale README paragraphs. ADD: one line "source: examples/corpworld, tracked 0c416b4f; deployed build = R5 (verified by build hash compare)". Size S. Verify: grep README for "gitignored" is empty.
No further phases: frozen exhibit, no polish beyond labels.

## First three directives
1. Fix corpworld and kingmaker_squads READMEs (examples now tracked, base now set). S. depends-on: none.
2. Planet of Greed title screen "Origins" link row (corpworld, kingmaker_squads). S. depends-on: none.
3. Origin entries excluded from the published count and Start-here list (config flag + test). S. depends-on: studio-redesign D0.3.

## Open question for Robert
None. (Contradicts nothing settled; slimebreeder's frozen-exhibit decision is the model.)
