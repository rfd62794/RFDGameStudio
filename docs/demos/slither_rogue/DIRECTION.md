# slither_rogue direction (2026-10-04)
## What it tried to be
"Slither.io meets roguelike": steal segments, collect evolution cards on level-up, survive a timed arena run, chase a high score. Built 2026-06-26 as a Lua-driven port alongside horse_racing (`a5fd236d`, Phase 2g) (`76623568` data/logic, `24f8e21d` App with menu/game/game-over, `f76e05f4` canvas), then moved physics, collision and AI out of TS into Lua in "Phase 2h" (`8b0d73d7`, `945de2e1`, 06-27) and rebalanced in Phase 2s (`9c9ff3af`: magnet radius cut 60 to 25 px, shield regen). Since then only chrome: GameShell migration (`3be74824`), svh fix (`c4fcbfd4`), first-run primer, HUD mute, SFX, canvas contrast (`3e35ef1e`, 09-29). Intent is unchanged; the game stopped growing at balance.
## Where it is now
- Complete run loop: menu, primer, game, evolution modal, game over, persisted high scores; 8 evolution types (`App.tsx`, 258 lines).
- Restart exists but is icon-only (`components/GameHUD.tsx:113`, `title="Restart"`); the audit's "no restart seen" is a labelling gap. "New Run" on the game-over modal.
- Dead code: `components/GameCanvas.phase2g.tsx` (791 lines, 2.5x the live `GameCanvas.tsx` at 319) has no importer in `ts/src` or `ts/tests` (grep returned nothing).
- Sim is Lua: `games/slither_rogue/*.lua` (collision 164, physics 215, state 131, logic 119) called through `engine/runtime` `call` each frame.
- Tests: one file, `test_slither_rogue_sound.ts`; run logic and balance untested. No `build:slither_rogue` (`ts/package.json:9-21`); `ROADMAP.md:251-254` notes pre-existing TS errors in its build.
- Status `beta`, no cover on the site (among the 8 missing).
## Player experience today vs the target
First 60 s: menu, primer card, steer a snake with mouse, eat fruit, first evolution card at level-up. Best moment: the evolution card pick, which is the roguelike hook and lands within the first minute. Biggest turn-off: dying with no sense of what to do differently, and a restart control that is an unlabelled icon. Progress: high score list is the only way back to a goal. Way back: shell control.
## Verdict
**TRIM.**
1. 791 lines of dead canvas code sit beside the live one; deleting it is the cheapest cut and removes the main source of build confusion.
2. Gaps after that are one label, one script and one test, all small, so no rethink is warranted.
3. Beta status is earned only after the build script and a run-logic test exist (polish standard A6, A7).
## Replan
1. TRIM (S). CUT: `GameCanvas.phase2g.tsx` (dead, no importer); the icon-only Restart (replace with a text label). ADD: `build:slither_rogue` and fix the TS errors it hits. Verify: `cd ts && npm run build:slither_rogue` exit 0; `grep -rn phase2g ts` empty.
2. Prove (S-M). ADD: headless run test (init, N ticks, evolution trigger fires, game_over on timeout; fixtures already exist under `tests/fixtures/slither_rogue`). CUT: nothing. Verify: `cd ts && npx vitest run tests/test_slither_rogue_*`.
3. Make deaths teach (M). ADD: game-over card shows cause of death and the next card choice hint; cover image. CUT: new evolution cards (out of scope until the loop retains players). Verify: screenshot of game-over card; Playwright start-to-game-over smoke.
## First three directives
1. slither_rogue: delete `GameCanvas.phase2g.tsx`, label Restart, add `build:slither_rogue` and fix its TS errors. S. Depends: none.
2. slither_rogue: headless run-logic test via the Lua fixtures. M. Depends: none.
3. slither_rogue: game-over cause-of-death line and cover screenshot. S. Depends: 1.
## Open question for Robert
None. Default: keep the Lua sim as is (ADR-013 retired Lua as a portability carve-out, not a reason to rewrite working code); revisit conversion to TS only if a rule change is wanted.

## Corrections (2026-10-04, measured while writing the directives)
- Run logic is not untested: `tests/test_slither_rogue.py` already runs the real Lua headless (14 tests). Replan step 2 became whole-run checks (`Slither_Rogue_Run_Tests_Directive`).
- There are no 'pre-existing TS errors': `tsc --noEmit` reports nothing in any `slither_rogue` file and a prototype `vite build:slither_rogue` succeeded (661.89 kB JS). The build script is `Slither_Rogue_Hygiene_Build_Directive`.
- Nobody dies in this game: the only `game_over` is the timer, and rivals steal tail segments (a Shield card blocks it). Replan step 3's 'cause of death' became a 'try this next' tip on the end card (`Slither_Rogue_Run_Tip_Directive`).
