# 7_days_to_fry scope analysis (2026-10-03, Sonnet scope agent, status `external`)
Direction: restaurant-management sim on an autonomous-worker core; player sets policy, crew acts, 7 escalating days with a night shop (examples/7-days-to-fry/docs/Design.md "Vision" and "The Real Week" table; metadata.json:3). Phases night, game_over, victory (src/App.tsx:162-176).
Working:
- Deepest AI of the batch: utility scoring 314 lines, steering 522, session loop 705 (wc -l; roadmap line 64).
- Largest test file here: tests/lineSimulation.test.ts, 4899 lines; docs/state/current.md reports 241/241 green (self-reported, not run by me).
- Audit: loads, 0 errors, "Start Shift" in frame (batch1 row 7_days_to_fry).
Rough:
- Blurb is "7 Days to Fry - a cooking survival game" (ts/src/games/7_days_to_fry/config.ts:7) while Design.md describes a kitchen management sim; no genre (config.ts:10-12).
- No Restart at the start screen (audit batch1); restart only on game-over/victory (src/App.tsx:172,176). Design.md header says floor 130/130, current.md says 241/241: notes disagree.
- Embed, no TS-native port; its tests live in examples/, so `cd ts && npm test` does not cover them (A6 exempts external).
Class: improve. A designed 7-day arc exists; finishing it follows its own Design.md.
Top 3 changes, in order: 1. Tier A: honest blurb (kitchen sim, not survival), genre decision, in-play Restart if absent in the iframe. 2. Confirm the Design.md week (Day 1-7 unlocks) is fully implemented (not verified: sessionLoop.ts not read in full). 3. Screenshot plus phone check.
Out of scope: TS-native rewrite (Wave 2 candidate, polish spec section 4), new stations, art, balance, anything above Tier A beyond item 2.
Dependencies / risks: embed from examples/7-days-to-fry; a rewrite would need the `aiBehavior` adapter work (roadmap line 64); taxonomy gap (config.ts:10-12).
Effort: S
Open question for Robert: none
