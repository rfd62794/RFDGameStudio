# trinity_siege scope analysis (2026-10-03, Sonnet scope agent, status `external`)
Direction: hex-ring wave defense with shape counters and persistent fortifications (examples/trinity-siege/metadata.json:3), 5 waves, 15 lives (src/types.ts:96,98). Registry text calls it three-faction siege (ts/src/games/trinity_siege/config.ts:7); the two descriptions differ.
Working:
- Playable end to end: won/lost states and a restart that resets gold, lives, wave (examples/trinity-siege/src/App.tsx:72,404-410,599-603).
- Audit: loads in the shell, 0 errors, "Force Reset" present (demo-audit-batch2 row trinity_siege).
- Combat is a shape-matrix lookup (src/combat.ts:17-27), 353 lines.
Rough:
- Public blurb shows an internal "LEAST-VERIFIED ... fabricated combat logic" note (config.ts:7; GENRE_TRACKER.md:27).
- Phone: iframe scrollWidth 370 > 358 (audit batch2 row, "FAIL minor").
- No tests, and the "fabricated combat logic" claim is unverified: I did not audit combat.ts for it and make no finding either way. README is the generic AI Studio one (examples/trinity-siege/README.md:5).
Class: refine. The target is Tier A: fix blurb and overflow; correctness is a separate question.
Top 3 changes, in order: 1. Replace the blurb with a player-facing one under 60 words matching metadata.json. 2. Fix phone overflow in the embedded app. 3. Review combat.ts against SHAPE_MATRIX/RACE_LEAN intent and add a unit test (only if Robert wants it vouched for).
Out of scope: TS-native rewrite, new factions, art, balance, anything above Tier A.
Dependencies / risks: `/arcade/trinity_siege/` is an AI Studio export (config.ts:12); edits go in examples/trinity-siege and need a re-export/build step I did not trace.
Effort: S
Open question for Robert: none
