# succession direction (2026-10-04)
## What it tried to be
A persuasion game: win three court figures to your claim to the throne; everything else serves that loop (ts/src/games/succession/docs/Succession_Design_and_Identity.md "The Core Loop, Locked"). It was built in one burst on 2026-08-15 (16035391 AudienceStage, ba39fabc App.tsx), then hardened by seven ADRs (contradiction risk, diminishing returns, value-aware rival, origin rebalance, onboarding, GameShell, locked methods; ADR-007 on 09-29, merged as PR #59, 77f8f1bb). Drift: the design doc's "next phase" is a murder inquiry (hints, wrong-accusation penalty, seeded murderer, Design_and_Identity.md:106-111), i.e. more systems, while the shell around the loop (restart, save, publish) is still thin.
## Where it is now
- Playable loop: yes. Title with 3 origins, 8 segments, chamber/audience/interlude/verdict flow, CourtPrimer, locked methods (2x for the locked method, 1/4 otherwise, engine/methodLock.ts).
- Engine is real and tested: 767 lines in engine/, 17 test_succession_* files incl. a balance sim requiring a win per origin (CHANGELOG 2026-09-29).
- UI is the bulk: 3,131 lines of components, 5,739 TS lines in total; build:succession exists.
- Gaps: "Play Again" only on the verdict screen (App.tsx:110-115, VerdictScreen.tsx:331); no restart or title in play; no run save, only the primer flag (App.tsx:57,77); 8 segments are lost on reload.
- Live: /games/succession/ loads, but /arcade/succession/ is 404 (audit 10-04 s5.4), and succession is one of 8 cards without a cover (audit line 67).
- Regicide scaffolding exists in engine/deduction.ts (4 refs); how much of the four open design items is coded was not verified.
## Player experience today vs the target
First 60 s: pick origin, "Begin Your Claim", primer, then whisper to a figure; cards are dense (SegmentHeader, gossip ticker, 3 figures x 4 approaches). Feedback: favor tiers and rival reactions exist. Progress: segment counter. Way back: shell back only.
Best moment: finding the one method a figure respects (Vane wants evidence) and watching favor jump 2x.
Biggest turn-off: an 8-segment run with no save and no quit/restart; a phone user who closes the tab loses everything.
## Verdict
POLISH (Tier C showcase, settled pick). First action: restart + save, before any new system.
1. Engine and balance are the deepest in the studio; the loss is at the edges.
2. New design scope (murder inquiry) would add the 5th mechanic to a loop designed around three.
3. Fixing restart/save is cheap and unlocks Tier B.
## Replan
1. Run lifecycle (S): ADD Restart/Abandon (two-click, as dissonance's run controls, ts/src/games/dissonance/utils/runControls.ts) and Back to Title in play. Verify: Playwright start, move, restart, title; `cd ts && npx vitest run tests/test_succession_*.ts`.
2. Save per segment (M): ADD persist gameState at segment boundaries via engine/shared/persistence + Continue on title + "reset save". CUT nothing. Verify: act, reload, same segment (smoke).
3. Publish + phone (S/M): fix /arcade/succession/ 404 (publish or drop the embed path from the shell; redesign D2), add a cover, test 390 px (overflow unverified). CUT: stack the figure cards into a tabbed view on narrow width, one reason: the frame is about 374x210 px (redesign spec b).
4. Inquiry (L, gated): FREEZE until Robert answers the four open questions; recommended default is "ship Tier B first, then cap the inquiry at 3 hints".
## First three directives
1. Succession in-play Restart/Abandon + Back to Title - S - none (Revamp already merged).
2. Succession per-segment save + Continue + reset - M - directive 1.
3. Succession arcade embed 404 + cover + 390 px check - S - redesign D2.
## Open question for Robert
Should the murder inquiry stay on the roadmap after Tier B? Default: yes but capped at hint count 3, wrong accusation costs one segment of favor.
