# slither_rogue scope analysis (2026-10-03, Sonnet scope agent, registry status: beta)
Direction: snake-roguelike arena: steal segments, evolution cards on level-up, timed runs, high scores (ts/src/games/slither_rogue/config.ts:6-11; App.tsx:22-45,56-60). Source: examples/slither-rogue_-evolution (AI Studio export, README.md:5-9).
Working:
- Complete run loop menu -> primer -> game -> game over (App.tsx:31,70-100,251), 8 evolution types (App.tsx:41-44), persisted high scores (App.tsx:56-58).
- Restart already exists: HUD icon button title="Restart" (components/GameHUD.tsx:113) and "New Run" on game over (components/GameOverModal.tsx:106-108).
- Sound engine has a unit test (ts/tests/test_slither_rogue_sound.ts); audit: loads, 0 errors (batch2 line 25).
Rough:
- The audit's "no restart seen" is a labelling gap, not a missing control: the in-run Restart is icon-only with only a title attribute (GameHUD.tsx:113-115).
- No test of run logic or balance; only sound is tested (one slither file in ts/tests).
- components/GameCanvas.phase2g.tsx (791 lines) is not imported by App.tsx (which imports GameCanvas, App.tsx:13); a grep of ts/src and ts/tests found no other reference. No build:slither_rogue script, and ROADMAP.md:251-254 says its global build has pre-existing TS errors.
Class: refine. The loop is complete; gaps are labelling, tests and build hygiene.
Top 3 changes: 1. Give Restart a visible text label (A3) and add build:slither_rogue, fixing the TS errors it hits (A7); 2. Headless run-logic/balance test (A6, B4); 3. Delete or document GameCanvas.phase2g.tsx.
Out of scope: new evolution cards, multiplayer/io features, art pass, physics changes in games/slither_rogue/*.lua.
Dependencies / risks: the TS errors at ROADMAP.md:251-254 may be wider than this demo; deleting phase2g needs confirmation it is dead (reference check was grep only).
Effort: M
Open question for Robert: none
