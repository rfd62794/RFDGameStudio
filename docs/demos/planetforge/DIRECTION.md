# planetforge direction (2026-10-04)

## What it tried to be
A ring-world god-game: 32 tiles in 8 four-tile sectors, elemental tiers per tile, soil stability that ratchets sectors up, harvesting, and one-shot Monuments that add "Focus" to planetary balance (examples/planetforge/src/App.tsx:1-4, engine/slimeEngine.ts:76-101). It is a translation of an abandoned Rust spec (ADR-002): Phase 2 directive says slimeEngine "appears to be a near-direct translation of the abandoned Rust ADR-002 spec" built without authorization (docs/directives/PlanetForge_Phase2_Correction_Directive.md:17-20). Registered 2026-08-22 (907f2509). 2026-09-24/27: Phase 1 TS model (62a3d8cf), Phase 2 correction (clamp tiers to [0,3], throw on unhandled soil, PR #45), source link for deploy (3ccc415c, 2026-10-04).

## Where it is now
- Built and tracked: 3,275 ts/tsx lines, App 271, RingVisualizer 564, InspectorPanel 458, slimeEngine 488; vite base `/arcade/planetforge/`.
- Two engines: the live `slimeEngine.ts` and a dead `gameLogic.ts` (266 lines in ts/src/games/planetforge plus a duplicate at examples/planetforge/src/planetforge/gameLogic.ts), with `ts/tests/test_planetforge_gameLogic.ts` testing the dead one.
- `PlanetForge_Phase2b_Correction_Directive.md` is Approved but is a byte-for-byte copy of the Done Phase 2 directive except the Status/Branch rows (verified with diff): dispatching it re-does finished work.
- Config now has `source` (3ccc415c), so the next deploy should publish it; still unpublished in the last audit (batch2:17). Tier A directive Done.
- No goal, no win, no save: Monuments are a one-way button; the sim just ticks. The engine header says "SlimeWorld God-Game" (slimeEngine.ts:2), a name clash with the shipped slimeworld.
- In-app "Test Runner" modal (App.tsx:26,265) and an icon-only reset (SimulationHeader.tsx:171-175) are player-visible dev tooling.

## Player experience today vs the target
First 60 s: a ring of tiles, paused (`isPlaying` starts false), an inspector, and a Test Runner button; nothing says what to do. Best moment: pushing a tile's element tier and watching a sector stabilize and upgrade, then raising a Monument; it is a toy with real cause and effect. Biggest turn-off: no objective and a dev "Test Runner" in the header, so it reads as an engine demo.

## Verdict
TRIM. 1) Two engines plus a duplicate directive is accumulated noise; cut it before building. 2) Dev UI (Test Runner) is on the player surface. 3) Once trimmed, a small goal turns a toy into a game, so POLISH follows.

## Replan
1. Trim. CUT: dead `gameLogic.ts` (both copies) and its test (reason: unused, Phase 2 left the decision to Robert); hide Test Runner behind `?debug=1`; close the Phase2b queue row as Superseded (controller). ADD: label on Reset. Size S. Verify: `cd ts && npx vitest run` and example `npx tsc --noEmit` pass.
2. A goal. CUT: nothing. ADD: win = Monument in all 8 sectors with none unstable, lose = N perturbation ticks with all tiles at tier 0, a restart screen, autosave (B2, B6). Size M. Verify: pure-function vitest on `evaluate_goal(world)`.
3. First step. ADD: auto-start paused hint "Pick a tile, raise an element"; rename engine header to PlanetForge. Size S. Verify: screenshot 1280 and 390.

## First three directives
1. PlanetForge trim: delete dead gameLogic, hide Test Runner, label Reset. S. depends-on: none.
2. PlanetForge goal and win/lose state in a new pure module. M. depends-on: 1.
3. PlanetForge autosave + first-step hint. S. depends-on: 2.

## Open question for Robert
Delete the dead `gameLogic.ts` (the Phase 2 directive deferred this to you)? Recommended default: yes, it is unused and its tests assert behaviour the game does not run.
