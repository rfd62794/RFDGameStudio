# wire_rust scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: small roguelike deck-builder prototype: scrap parts, chemistry synergies, 5 rooms, D20 encounter rolls (ts/src/games/wire_rust/config.ts:7; games/wire_rust/data.yaml:10-15,43-73; App.tsx:97-138). Built overnight as a scaffold (docs/overnight_prototypes_status.md:49-53); no roadmap or design doc beyond that, so direction past the scaffold is only implied.
Working:
- Thin full loop: init_game, draw_hand, get_synergies, move_room, resolve_encounter in 173 lines of Lua (games/wire_rust/logic.lua:19,44,74,102,123).
- Title screen, GameShell, sfx confirm/win/lose, and a game-over "Reboot Core" restart (App.tsx:42,83,113,129-134).
- UI tests exist (ts/tests/test_wire_rust_ui.ts, 2 tests); audit batch2:31 loads, 0 errors.
Rough:
- Audit "no restart seen" verified: handleReset is wired only to the game-over card (App.tsx:97,119,132); no in-play restart. No win state: App.tsx:119 treats only hp <= 0 as an end.
- Scrap is earned (logic.lua:144-146) but never spent in App.tsx or logic.lua; 4 cards and 5 rooms (data.yaml:17-73), so the "draft" promise has no shop or deck growth.
- No `build:wire_rust` script (ts/package.json); logic uses unseeded math.random (logic.lua:145), so no deterministic balance test.
Class: improve - the loop works but ends only in death; what the deck-builder should grow into is Robert's design call.
Top 3 changes, in order: 1. Add `build:wire_rust` and an in-play Restart (A3, A7). 2. Add a win condition (clear Control Room, data.yaml:68-73) and win screen (B6). 3. Seeded RNG plus headless run test: N runs, no negative hp, win and loss reachable (B4).
Out of scope: new cards/rooms/elements, scrap shop, meta progression, art pass, merging with Dissonance.
Dependencies / risks: shared Lua runtime and inventory.lua (touching them affects other games); RNG routing must stay portable (see games/shoal/ROADMAP.md LCG note).
Effort: M
Open question for Robert: none (scrap economy and card growth deliberately left for him)
