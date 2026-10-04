# chimera_wilds scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: deliberately minimal "Phase 1" one-roll D20 encounter vs a random six-part chimera (games/chimera_wilds/logic.lua:1; ts/src/games/chimera_wilds/config.ts:6-9). Also the paper-doll / parts-assembly adopter (ROADMAP.md:38-42,167-170).
Working:
- Full encounter loop: random parts, D20, win/loss, history list, PaperDoll render (ts/src/games/chimera_wilds/App.tsx:60-93,196-250).
- Title screen with New Game, first-run tutorial modal, sound toggle (App.tsx:112-150,170-185,251-262); `build:chimera_wilds` exists (ts/package.json:13).
- Live page loads, 0 console errors (audit batch1 line 30).
Rough:
- No progression: player stays at baseline power/endurance (App.tsx:20-27) and state is in-memory only; the only writeSave call is the tutorial flag (App.tsx:54-62). Reload loses history; no reset control besides reload.
- Tests cover only the paper-doll port (ts/tests/test_chimera_paper_doll_port.ts, test_paper_doll_chimeralab_port.ts); none for generate_chimera / resolve_encounter.
- Lua takes the first candidate per slot ("Caller owns the random selection", games/chimera_wilds/logic.lua:32) while TS picks the parts first (App.tsx:34-43): works, but the contract is easy to misread.
Class: improve. Direction as built is "Phase 1"; the next step inside it is a reason to play twice, not a new game.
Top 3 changes: 1. Persist history and add a labelled Reset (A3, B2); 2. Unit tests for generate_chimera/resolve_encounter plus a headless 100-encounter run (A6, B4); 3. A win/loss/streak summary shown on the result panel (B3, B6); anything that changes the rules is Robert's call.
Out of scope: part trading/loot, multi-round combat, new art, sharing the parts types (ROADMAP.md:169), other demos.
Dependencies / risks: PaperDoll is shared engine code (engine/paperDoll): do not change it here; ROADMAP.md:38-40 names this demo as a possible second adopter of shared art work.
Effort: S
Open question for Robert: none
