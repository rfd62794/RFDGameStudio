# slimegarden direction (2026-10-04)
## What it tried to be
An AI Studio (Gemini) export of a multi-tank slime breeding sandbox with dispatch, mediation, exploration, territory claims and garrison risk over a 15-node hex planet (examples/slimegarden/README.md:5-9). Intake as "v0.1.0R1" from a zip (`2beb19c6`, 2026-07-13), extracted scaffold `dbfd428e` (07-14), removed from the registry when SlimeWorld became the lead game (`d222dbe2`, 07-22), then re-registered as a labelled Origin (`d53a0d15`, 08-23, ADR-023; `supersededBy: 'slimeworld'`). Source tracked after a loss scare (`0ecf80f4`, 08-30). It never had its own design; the studio's SlimeWorld is the TS-native rewrite of this loop, so its job today is history.
## Where it is now
- Loads at /arcade/slimegarden/ with 0 console errors (audit batch2 row 23); labelled "Reset" (App.tsx:707-712); saves to localStorage.
- Size: 1,299-line App.tsx, 9,848 lines under src; no tests; no TS port (and none planned).
- Dead weight: `examples/slimeworld/` (28 tracked files, src/ identical to this one per `diff -rq`; only package.json and vite.config.ts differ; tracked by `0c416b4f`) is a copy no longer used since `d9f45518` dropped the example source; `intake/slimegarden/` (29 files, 539K) is a third copy.
- Phone overflow: iframe scrollWidth 476 vs 368 at 390 px (batch2 line 43); cause unverified.
- README is AI Studio boilerplate asking for a GEMINI_API_KEY that is not needed (README.md:14-16).
- No screenshot in the arcade manifest (audit "n/v").
## Player experience today vs the target
First 60 s: a "MVP // PHASE_E" lab terminal, dense and dev-flavoured; the first action is findable but nothing teaches it. Best moment: sending a 3-slime party on a timed dispatch and reading the completion report. Biggest turn-off: the terminal tone and the phone overflow, on the one demo that exists only to be visited. Way back: shell back control; it does not point to SlimeWorld in-game.
## Verdict
TRIM (then Tier A).
1. Two of the three copies on disk are duplicates; trimming costs nothing a player sees.
2. Origin entries get Tier A only (polish standard section 2), so the remaining work is phone fit and honesty.
3. SlimeWorld already absorbs every mechanic worth keeping; more polish here splits the player base.
## Replan
- Phase 1 (S): CUT `examples/slimeworld/` (verified duplicate; the deploy no longer reads it) and keep `intake/` as the only raw archive. ADD nothing. Verify: `diff -rq examples/slimegarden/src examples/slimeworld/src` is empty before deletion (it is today); `python -m pytest tests/test_deploy_arcade_copy_order.py` and `cd ts && npx vitest run test_registry_export.ts` stay green.
- Phase 2 (S): Tier A. CUT the GEMINI README text. ADD a 390 px fix (test the decorative `w-[500px]` blob at App.tsx:652 first), a "Play the successor: SlimeWorld" link in the header, a cover. Verify: Playwright 390x844 scrollWidth <= viewport; screenshot yes/no.
## First three directives
1. Slimegarden_Remove_Duplicate_SlimeWorld_Example - delete examples/slimeworld, keep tests green; S; none (touches tracked tree and a test map, so worktree-only is fine).
2. Slimegarden_Tier_A_Phone_Fit - fix 390 px overflow, rewrite README, add SlimeWorld link; S; after 1.
3. Slimegarden_Cover_And_Manifest - screenshot + manifest reference; S; after 2.
## Open question for Robert
None.
