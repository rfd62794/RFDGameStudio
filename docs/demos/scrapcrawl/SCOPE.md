# scrapcrawl scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: small crafting dungeon-crawl: move between rooms, craft disposable gear, fight on D20 rolls with win-only proficiency (ts/src/games/scrapcrawl/config.ts:7; App.tsx:278). Labelled "Phase A" (games/scrapcrawl/data.yaml:4). Direction beyond a vertical slice is not stated anywhere I read.
Working:
- Playable loop: move/fight/craft handlers with sfx (App.tsx:107-163); logic in games/scrapcrawl/logic.lua (245 lines) via useLuaCall (App.tsx:88).
- Chrome polished: TitleScreen, first-run primer saved as scrapcrawl_tutorial_seen, mute toggle (App.tsx:92-100,165-180; Polish_Scrapcrawl_Chrome_Directive Status Done).
- Build script exists: `build:scrapcrawl` (ts/package.json:15; ts/vite.scrapcrawl.config.ts:1-2); audit shows clean load and New Game on the title (docs/state/demo-audit-batch2-2026-10-03.md:19).
Rough:
- Tiny content: 5 rooms in games/scrapcrawl/data.yaml (lines 10-34) and no win, loss or end state in App.tsx (WIN/LOSS only per fight, lines 117,335-336).
- No persistence and no in-game restart: state is plain useState (ts/src/hooks/useGameState.ts:25-45); "New Game" exists only on the title (App.tsx:207).
- No scrapcrawl test file (ts/tests has none named for it); other tests only mention the id (test_per_game_builds.ts:34,67).
Class: improve (held). The improvement cannot be chosen without a goal; Tier A gaps only.
Top 3 changes, in order: 1. In-game Restart that resets to the initial state without reload (A3); 2. A test file for resolve_fight/craft/move_player (A6); how to run logic.lua from vitest is not verified, check for an existing Lua harness first; 3. Add the arcade-manifest screenshot (A5).
Out of scope: win/loss design, new rooms or enemies, balance changes, art redesign, moving logic off Lua, persistence (B2) until direction is set.
Dependencies / risks: depends on shared GameShell, useLuaCall and games/scrapcrawl/*.yaml/lua; session.files.data drives rooms (App.tsx:104); the D20 roll is injected (App.tsx:111 passes it to Lua; logic.lua:171 takes `roll`), which helps testing.
Effort: S
Open question for Robert: yes. What is the player's goal or end state (clear all rooms, reach a boss room, survive N fights)? Nothing past Tier A is proposed until answered.
