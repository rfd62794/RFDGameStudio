# choke_point scope analysis (2026-10-03, Sonnet scope agent, status `dev`)
Direction: small Lua-driven turn-based tactical defense with enemy move/attack previews (ts/src/games/choke_point/config.ts:7; games/choke_point/data.yaml:6-8). Reads as a compact puzzle-defense prototype.
Working:
- Complete loop: place tower, commit turn, waves advance, "Victory! All waves cleared!" and a core-breach loss (games/choke_point/logic.lua:233-242; App.tsx:90-109).
- Reset Grid on the loss card, title screen, shared SFX (App.tsx:58-60,77-86,36).
- UI test exists (ts/tests/test_choke_point_ui.ts:7-30).
Rough:
- Only 2 waves, 2 enemy types, 2 tower types (data.yaml:20-59; types.ts:1-2).
- Restart only on the loss card (App.tsx:98-109); audit: "Restart not found" at start (batch1 row choke_point). A victory screen in App.tsx was not found by grep for "wave": not confirmed either way.
- No `build:choke_point` script (grep of ts/package.json: none).
Class: refine. The loop is complete but tiny; polish and a small content pass fit without picking a new direction.
Top 3 changes, in order: 1. Tier A: in-play Restart, victory screen with next action, `build:choke_point`, phone check. 2. Headless Lua-state test over all waves (no softlock, win reachable). 3. More waves/enemy variety in data.yaml only (data, not logic).
Out of scope: new tower classes needing new Lua mechanics, larger grid, meta-progression, art overhaul.
Dependencies / risks: Lua runtime and `useLuaCall`/`useGameState` hooks (App.tsx:13); hosted via /arcade/rfdgamestudio/?game=choke_point (audit batch1 row).
Effort: S
Open question for Robert: none
