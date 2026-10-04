# succession scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: persuasion and court-intrigue sim: whisper rumors, present evidence, deliver indictments; a rival AI counters; figures have locked persuasion methods (ts/src/games/succession/config.ts:5-8; ts/src/games/succession/CHANGELOG.md:1-8). The design doc names the next phase: murder-inquiry work (ts/src/games/succession/docs/Succession_Design_and_Identity.md:128-130).
Working:
- Title, playing, verdict views with Play Again (App.tsx:30,110,176-186); 5,738 lines of TS; engine split into small modules (engine/verdict.ts, rivalAI.ts, methodLock.ts, and others).
- 17 test files named test_succession_*.ts, including a balance sim and a no-dead-lane regression (ts/tests/test_succession_balance_sim.ts; harness bar described in ts/src/games/succession/docs/Succession_Design_and_Identity.md:126-127).
- Live: 0 console errors; build:succession exists (docs/state/demo-audit-batch2-2026-10-03.md:26).
Rough:
- No Restart during play; Play Again exists only on the verdict screen (App.tsx:110,186; batch2:26 A3 fail).
- First-run primer shipped (CHANGELOG.md:1-6); blurb is 30 words, within the 60-word limit (batch2:26).
- Murder-inquiry design still lists four open questions: hint count/cadence, wrong-accusation penalty, win-condition math, murderer seeding (design doc :106-111).
Class: refine - polish now (restart, phone, screenshot); the named next phase is an improve and needs its own spec first.
Top 3 changes, in order: 1. Add an in-run Restart/New Game that reuses handlePlayAgain (App.tsx:110). 2. Verify A5 manifest screenshot and phone fit of the 576-line AudienceStage.tsx at 390 px (not exercised in the audit). 3. Write a spec for the murder-inquiry phase from the design doc; build only after its open questions are answered.
Out of scope: murder-inquiry implementation, new figures/origins, rival-AI changes, balance edits, art.
Dependencies / risks: the balance harness and regression bar (design doc :126-127) must stay green; GameShell progressive disclosure (ADR-006); murder seeding must stay deterministic for the harness (design doc :111).
Effort: S
Open question for Robert: none (for polish; the four murder-inquiry questions in the design doc belong to its own spec)
