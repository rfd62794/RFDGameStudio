# planetofgreed scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: live TS-native territory 4x with six Culture Houses on a wheel, fragments and a Rank-1 ending (ts/src/games/planetofgreed/config.ts:7). Active work line: style split, house stats, AI decisions (planetofgreed/CHANGELOG.md:12-24; ts/tests/test_planetofgreed_{house_stats,aiDecisions,style_split}.ts).
Working:
- 10 dedicated test files (ts/tests/test_planetofgreed_*.ts) and a standalone build script (audit batch2:18).
- Saves via shared persistence (planetofgreed/App.tsx:315,379); Rank-1 ending check wired at each Annual Report (App.tsx:1139-1156).
- Live: loads, "Start game" and "New Campaign" present, 0 console errors (audit batch2:18).
Rough:
- ROADMAP.md:50-56 still lists house-stat asymmetry and the AI upgrade as deferred, but CHANGELOG.md:16-17 and the aiDecisions.ts/houseStats.ts files show them done: stale roadmap.
- Ending is explicitly a placeholder: "no cutscene, no narration... Real ending content is out of scope" (endingSystem.ts:12-15).
- Leftover CorpWorld naming: player-facing "CorpWorld commanders" (App.tsx:1865); save key 'corpworld_state' (App.tsx:315,379).
Class: refine - shipped and tested; remaining work is cleanup and finishing the ending, not new direction.
Top 3 changes, in order: 1. Fix player-facing CorpWorld text (App.tsx:1865); keep the save key or add a read fallback so old saves survive. 2. Update the ROADMAP.md deferred list to match shipped work. 3. Phone and desktop screenshot pass (audit batch2:18 lists screenshot "n/v").
Out of scope: ending cutscene/narration content, new Houses, combat rule changes (Circle/Square/Triangle), art replacement, the itch visibility toggle (Robert's, ROADMAP.md:143-146).
Dependencies / risks: shares combat/map code with the corpworld origin (corpworld/README.md:15-17); renaming the save key invalidates existing saves; BoardroomHeader and FactionTheme are shared with other games (CHANGELOG.md:30-45).
Effort: S
Open question for Robert: none
