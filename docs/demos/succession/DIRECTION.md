# succession direction (2026-10-05, supersedes the 2026-10-04 draft)
Overseer judgement, Robert may overrule. Robert delegated the call on 2026-10-05 ("review and make your best judgement"). Everything marked PROPOSED waits for his yes.
## What it tried to be
Robert's intent: Clue with the added pressure of vying for a Crown. What got built is a persuasion game: win three court figures (Chancellor Vane, Archbishop Valerius, General Brand) by Whisper, Formal Appeal or Archival Evidence, before two rivals (Aldric, Vivienne) do (ts/src/games/succession/docs/Succession_Design_and_Identity.md "The Core Loop, Locked"). Built in one burst on 2026-08-15, hardened by seven ADRs (ADR-007 locked methods, 09-29, PR #59). The Clue half is only partly there: engine/deduction.ts holds a Suspect/Method/Motive triad and an Indictment move, but each councilor is the culprit of his own fixed case (COUNCIL_CASE_SOLUTIONS, deduction.ts:121), so there is no single "who killed the old ruler". Drift: the design doc's "next phase" is more inquiry systems while the core loop has never been tested with a player.
## Where it is now (verified against source, 2026-10-05)
- Real source: ts/src/games/succession/ (tracked, built by build:succession, 5,739 TS lines, 17-20 test_succession_* files). The `wt-cpw` path in the earlier inventory is NOT a second source: C:\Github\RFDGameStudio\wt-cpw is an untracked nested worktree of the live checkout (detached HEAD b77b025b, a choke_point commit) that holds a stale copy; ignore it for this game.
- Playable: title with 3 origins, 8 segments, one move per segment, then verdict and epilogue. The player picks from 3 persuasion methods + Scout + Indictment + Discredit per turn (AudienceStage.tsx:486-497), against 3 figures: the menu is the load.
- Engine is small and tested: contradiction.ts 11 lines, gossip.ts 17, favor.ts 61, methodLock.ts 61, verdict.ts 39, rivalAI.ts 207, deduction.ts 246. Balance harness (ts/tools/succession-balance-sim.ts) requires a win per origin.
- Harness gap: it plays whisper/appeal/evidence/scout/discredit but never Indictment, so the inquiry layer is outside the balance guarantee.
- Gaps already queued (SCOPE.md 10-04): in-play restart, per-segment save (Succession_Run_Controls_Directive, Succession_Run_Save_Continue_Directive); /arcade/succession/ 404 and no cover.
- Players: published on itch.io with visits but no comments or reviews. There is zero evidence it works or does not.
## Player experience today vs the target
First 60 s: pick an origin, primer, then choose among 3 figures x 4 approaches plus two more actions while a gossip ticker and telegraphed rival intel compete for attention. Target (Robert): a 5-10 minute solo session, you vs an AI court, with a murder to solve and a Crown to lose. An 8-segment run with one move each is plausibly already in that time budget, but nobody has timed it, so the 5-10 minute claim is unmeasured.
Best moment: finding the one method a figure respects (Vane wants evidence) and watching favor double.
Biggest turn-off (hypothesis, unmeasured): too many action choices before the player knows the one that matters.
## Verdict
TRIM, then MEASURE, then add a mode. (Replaces the 10-04 "POLISH, freeze the inquiry".)
One-sentence core: win three figures, each respects one method, before the rival does.
1. The loop is complete and balanced; the open question is whether a stranger finds it fun, which only a playtest answers. Do not build the Clue mode on an unproven base.
2. Clue ("Inquest") reuses the persuasion engine as its vote phase: same pattern as a two-mode game (a second mode that shares the engine, not a rewrite). The earlier brief cited Shoal for this pattern, but docs/demos/shoal/DIRECTION.md on origin has no two-mode content (scenario picker only), so this doc stands on its own and does not claim Shoal precedent.
3. Nothing is deleted. Parked code stays, with tests, behind a feature flag.
## Keep / park (each with file and reason)
KEEP in the M0 core:
- Three methods, locked per figure: engine/methodLock.ts, data/courtFigures.ts (the core insight; ADR-007).
- Contradiction and gossip memory: engine/contradiction.ts + gossip.ts (28 lines total, ADR-001/002 tuned, and the risk that makes the Crown pressure bite; cost is small).
- Rival AI whisper + slander and the telegraphed intel: engine/rivalAI.ts, utils/telegraphedRumors.ts (this IS the Crown pressure; keep one feed, GossipTicker.tsx, not two).
- Scout + evidence: data/evidence.ts, EvidencePanel.tsx (the evidence method needs a source; also feeds the later mystery).
- Origins, epilogues, CourtPrimer, verdict: data/origins.ts (72 lines, ADR-004 tuned), data/epilogues.ts, CourtPrimer.tsx.
PARK in M0 (hidden behind a `PARKED_FEATURES` flag, code and tests kept, listed in Later):
- Discredit: utils/gameOrchestration.ts:414 discreditFigure, AudienceStage.tsx:495-497 panel. Reason: it is not a persuasion method, it mirrors rival slander, and it is the sixth choice on the menu; harness DiscreditHeavy shows it is a viable but optional line, so hiding it does not break the win-per-origin bar (to be proven by M0 ablation).
- Indictment UI: IndictmentPanel.tsx (329 lines), deduction.ts, deliverIndictmentTo (gameOrchestration.ts:350). Reason: three independent fixed cases, not one mystery; a wrong accusation permanently exposes the player at that figure (a heavy punishment for a mechanic the harness never exercises). It is the seed of Inquest, so it is parked, not cut.
- Domain ripple friction (DOMAIN_RIPPLE_CONFLICTS, gameConstants.ts:25-39): park only if the ablation shows balance holds without it; otherwise keep. Decision by harness, not argument.
Not touched: ADR-001..007 stay as written; any parked item revives by flipping the flag.
## Replan (milestones are PROPOSED)
M0 Trim and measure (S/M). ADD `parkedFeatures.ts` (one small module, flag read in AudienceStage); ADD the one-sentence core to the title; ADD harness ablation (all strategies x 3 origins with parked features off) and a timed solo run. CUT nothing. Verify: `cd ts && npx vitest run tests/test_succession_*.ts` plus the balance sim (ts/tools/succession-balance-sim.ts); every origin still wins at least once.
M1 Run shell (S+M, already queued). Restart/Abandon, per-segment save + Continue, arcade embed 404, cover, 390 px check (SCOPE.md 10-04 and the two queued directives).
M2 Feedback receipt (S). PROPOSED, outward posting is Robert's call: a one-line end-of-game prompt on the verdict screen ("Did this feel like a Crown race? Tell me in one line", linking to the itch page comments, no telemetry, no account); an itch devlog post asking the same two questions. Read what comes back, then decide M3.
M3 Inquest spike (M, gated on M2 and Robert). New module `engine/inquest/`: one seeded case with a single culprit from the existing 5-person cast, clues surfaced by Scout/Evidence, votes by the persuasion engine as the vote phase, rival AI as the Crown race. Verify with a seeded headless run.
M4 Inquest ship (L). 3 cases, mode picker on the title, balance harness extended with the Inquest strategies, cabinet presentation. Not started without M2 evidence.
## First three directives
1. Succession M0: parkedFeatures flag + title core line + harness ablation + timed run - S/M - none (queue directives touch App.tsx: sequence after them or rebase).
2. Succession in-play Restart/Abandon + Back to Title - S - already written (Succession_Run_Controls_Directive).
3. Succession per-segment save + Continue + reset - M - after 2 (Succession_Run_Save_Continue_Directive).
## Review model
TBD, ask Robert.
## Open questions for Robert
1. Approve the overseer judgement (trim first, Inquest later)? Default: yes.
2. Mystery cast and clues: reuse the existing five suspects, three methods and motives (deduction.ts) or write a new cast?
3. How many cases for Inquest (one seeded, or three)? Default: one in M3, three in M4.
4. Balance harness: extend it for the vote phase (default, reuses succession-balance-sim.ts) or a separate harness?
5. Cabinet presentation: Inquest as a second cabinet card or a mode inside the one Succession card?
6. May the M2 feedback prompt and devlog ask go out, and who posts them?
No support or vendor-scale promises: this is a solo-built demo; feedback is read when read, nothing is guaranteed back.
