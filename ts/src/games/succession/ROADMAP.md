# Succession - Roadmap

Direction (overseer judgement 2026-10-05, Robert may overrule): [`/docs/demos/succession/DIRECTION.md`](../../../../docs/demos/succession/DIRECTION.md)
Changelog: [`./CHANGELOG.md`](./CHANGELOG.md) | Design: [`./docs/Succession_Design_and_Identity.md`](./docs/Succession_Design_and_Identity.md)

Core sentence: win three figures, each respects one method, before the rival does.
Rules: new behavior goes in small new modules (SOLID/SRP/KISS); nothing is deleted, extras are parked behind a flag; balance harness stays green (every origin wins at least once). Solo-built demo, no support or vendor-scale promises. All milestones below are PROPOSED.

## Completed
- [x] Persuasion core, 3 origins, rival AI, contradictions, epilogues (2026-08)
- [x] ADR-001..006: rival contradiction, repeat decay, value-aware rival, origin rebalance, onboarding, GameShell
- [x] ADR-007: figure-locked methods + CourtPrimer (2026-09-29, PR #59)

## Playable-slice milestones (PROPOSED)
- [ ] **M0 Trim and measure** - `parkedFeatures` flag module hides Discredit and the Indictment UI; title shows the one-sentence core; harness ablation with parked features off (all origins still win); one timed solo run (target 5-10 minutes).
- [ ] **M1 Run shell** - in-play Restart/Abandon, per-segment save + Continue (queued directives); fix /arcade/succession/ 404, add cover, check 390 px.
- [ ] **M2 Feedback receipt** - one-line end-of-game prompt + itch devlog ask. PROPOSED only: outward posting is Robert's call.
- [ ] **M3 Inquest spike** (gated on M2 and Robert) - new `engine/inquest/` module: one seeded case, single culprit from the existing 5-person cast, clues from Scout/Evidence, persuasion engine reused as the vote phase, rival AI as the Crown race.
- [ ] **M4 Inquest ship** - 3 cases, mode picker, harness extended, cabinet presentation.

## Later (parked, nothing deleted)
- Discredit move: utils/gameOrchestration.ts `discreditFigure`, AudienceStage.tsx discredit panel; harness DiscreditHeavy keeps it covered.
- Indictment panel + triad deduction: components/IndictmentPanel.tsx, engine/deduction.ts, `deliverIndictmentTo`; becomes the Inquest accusation step.
- Domain ripple friction: data/gameConstants.ts DOMAIN_RIPPLE_CONFLICTS (parked only if ablation shows balance holds).
- Design-doc open items (hint count/cadence, wrong-accusation cost, murderer seeding): fold into M3.

## Open questions
Review model: TBD, ask Robert. Mystery cast and clues; how many cases; balance harness reuse for the vote phase; cabinet presentation (second card or a mode); whether the feedback ask goes out and who posts it. See DIRECTION.md.
