# wire_rust scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: turn-based deck-building prototype where "your deck is your salvage pile": rooms, salvage parts, D20 checks, element-chemistry synergies (games/wire_rust/data.yaml:6-8; ts/src/games/wire_rust/config.ts:7). Version 0.1.0 (games/wire_rust/VERSION). Points at a short roguelike run, but its end is not defined.
Working:
- Loop wired through Lua: init_game, move_room, resolve_encounter, get_synergies (ts/src/games/wire_rust/App.tsx:28,52,67,81; games/wire_rust/logic.lua:19,74,102,123).
- Loss state: hp <= 0 shows "SYSTEM SHUTDOWN" and a "Reboot Core" reset (App.tsx:119-137, handleReset :97).
- Tests: ts/tests/test_wire_rust_ui.ts (title and start render) and tests/test_wire_rust.py (4 test functions); live 0 errors, "Start Run" found (docs/state/demo-audit-batch2-2026-10-03.md:31).
Rough:
- No win condition found; constant max_rooms: 5 is declared but referenced nowhere else (games/wire_rust/data.yaml:12; grep of games/wire_rust and ts/src/games/wire_rust: one hit).
- No restart before dying: Reboot appears only on the game-over card (App.tsx:127-137); A3 fails (batch2:31).
- No build script (batch2:31 "none"); 340 lines of TS in total, so it is a thin prototype.
Class: improve - extends a working but thin loop; what a run ends with is unstated, so only Tier A is proposed.
Top 3 changes, in order: 1. Add an in-run Restart/New Run control (handleReset exists, App.tsx:97). 2. Add `build:wire_rust` (A7). 3. Check phone fit of the 4-card hand (App.tsx:237, h-40 cards) in the 210 px frame.
Out of scope: win condition, new cards/elements/rooms, balance, art, Lua-to-TS rewrite.
Dependencies / risks: shared Lua session; the Python tests run under uv, not vitest.
Effort: S
Open question for Robert: is a Wire & Rust run meant to end after 5 rooms with a win (max_rooms is unused) or run until death? No evidence either way; nothing past Tier A is proposed until answered.
