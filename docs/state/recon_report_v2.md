# RFDGameStudio Recon Report v2 — Direct-File Evidence

**Date:** 2026-07-02  
**Scope:** `c:\Github\RFDGameStudio`  
**Method:** Every claim below is paired with a direct file read from this session. Command-only observations are labeled **MACHINE-OBSERVED** and are not independently verifiable by file read.

---

## 1. ADR-005 vs. ADR-007 — Direct Quotes

### 1.1 What ADR-005 actually says

`docs/adr/ADR-005.md:19-23`:

```
19|## Decision
20|
21|Component systems are **named patterns** documented in the studio SDD.
22|Each game implements the patterns it needs in its own `logic.lua`.
23|No shared binary. No `require()`. The names exist to communicate design intent.
```

`docs/adr/ADR-005.md:32-33`:

```
32|- This decision is permanent. Any proposal to create a shared Lua library requires
33|  a new ADR that explicitly supersedes this one.
```

### 1.2 What ADR-007 actually says

`docs/adr/ADR-007.md:29-44` (the real naming-convention table):

```
29|### Naming Convention by Primitive
30|
31|Each function in the studio follows a verb-first naming convention. The verb
32|signals which primitive the function implements.
33|
34|| Primitive | Verb(s) | Example |
35|---|---|---|
36|| Entity | `generate_`, `create_`, `destroy_` | `generate_horse`, `create_snake` |
37|| Action | `apply_`, `update_`, `breed_` | `update_horse_after_race`, `apply_damage` |
38|| Resolution | `resolve_`, `simulate_` | `simulate_race`, `resolve_fight` |
39|| Consequence | `apply_`, `settle_` | `settle_bets`, `apply_race_result` |
40|| Movement | `tick_`, `move_` | `tick_race`, `move_snake` |
41|| Physics | `detect_`, `collide_` | `detect_wall_collision`, `collide_parts` |
42|| Lifecycle | `init_`, `step_`, `destroy_` | `init_game`, `step_game`, `destroy_entity` |
```

`docs/adr/ADR-007.md:54-70` (the real engine directory structure):

```
54|engine/
55|  primitives/
56|    entity.lua       — ID generation, schema validation helpers
57|    action.lua       — Pure state transformation utilities
58|    resolution.lua   — RNG-seeded outcome patterns
59|    consequence.lua  — Post-resolution state application utilities
60|    movement.lua     — Position update patterns (grid, continuous)
61|    physics.lua      — Collision detection/response patterns
62|    lifecycle.lua    — Lifecycle hook registry and dispatch
63|  systems/
64|    genetics.lua     — breed_stat, generate_color_profile, inheritance patterns
65|    odds.lua         — calculate_odds, calculate_place_odds, calculate_show_odds
66|    market.lua       — settle_bets, calculate_horse_price, sell_entity
67|    combat.lua       — resolve_hit, calculate_damage, apply_damage (BattleBots)
68|    grid_movement.lua — move_in_direction, detect_boundary, detect_self_collision
69|
70|**Primitive files define contracts, not implementations.** They export pattern
```

### 1.3 Actual engine directory contents

`engine/primitives/` (direct `list_dir`):

- `action.lua`
- `consequence.lua`
- `entity.lua`
- `lifecycle.lua`
- `movement.lua`
- `physics.lua`
- `resolution.lua`

`engine/systems/` (direct `list_dir`):

- `combat.lua`
- `genetics.lua`
- `market.lua`
- `odds.lua`

**Discrepancy:** ADR-007 lists `grid_movement.lua`; it does not exist in the repo. The actual systems directory contains only the four files above.

### 1.4 The contradiction

- ADR-005: no shared Lua library, no `require()`, each game implements patterns in its own `logic.lua`.
- ADR-007: shared `engine/primitives/` and `engine/systems/` files, and an explicit mapping of horse-racing functions into those engine files.
- ADR-007 `docs/adr/ADR-007.md:5` says **Supersedes: None**, so ADR-005 is still active.

The contradiction is real and unresolved.

---

## 2. `docs/state/current.md` — Direct Quotes

### 2.1 Phase 2w is SlimeCoin, not "Mutant Battle Ball & Slime Coin"

`docs/state/current.md:7`:

```
7|**Phase 2w — SlimeCoin — CERTIFIED**
```

`docs/state/current.md:9-31` lists SlimeCoin completion criteria only.

### 2.2 Phase 2v is Mutant Battle Ball

`docs/state/current.md:46-82` lists Mutant Battle Ball completion criteria only.

### 2.3 Phase 3 still lists 5 tools and all pending deployment steps

`docs/state/current.md:206-219`:

```
206|## Phase 3 Completion Criteria
207|
208|| Criterion | Status |
209|---|---|---|
210|...|
213|| `studio_mcp/tools.py` — 5 tools: load_game, call, get_schema, get_systems, run_headless | ✅ |
214|...|
```

`docs/state/current.md:221-229`:

```
221|## Phase 3 Pending (manual steps on Nitro)
222|
223|| Criterion | Status |
224|---|---|---|
225|| `uv run uvicorn studio_mcp.server:asgi_app --host 0.0.0.0 --port 8025` starts | Pending |
226|| `curl http://localhost:8025/health` → `{"status": "ok"}` | Pending |
227|| NSSM service `RFDStudioMCP` registered on Nitro | Pending |
228|| Claude Desktop config updated with mcp-remote entry | Pending |
229|| Live Claude session: 5 studio tools visible in tool list | Pending |
```

All five items are still marked **Pending** in the file.

### 2.4 Roadmap table still shows Phase 4 as pending

`docs/state/current.md:356-375`:

```
356|## Phase Roadmap
357|
358|| Phase | Title | Status |
359|---|---|---|
360|| **1** | Python Runtime Core | ✅ **CERTIFIED** |
361|| **2** | TypeScript Runtime | ✅ **CERTIFIED** |
...
371|| **2v** | Mutant Battle Ball | ✅ **CERTIFIED** |
372|| **3** | Claude Tool Integration | ✅ **CERTIFIED** |
373|| 4 | Second Game | Pending |
374|| 5 | Rust Runtime | Pending |
375|
```

So `current.md` certifies Phase 2v and 2w as completed games, but the roadmap table still lists Phase 4 "Second Game" as `Pending`.

---

## 3. `studio_mcp` Tool Surface — Direct Evidence

### 3.1 `studio_mcp/tools.py` exposes 14 tools

`studio_mcp/tools.py:1-18`:

```
 1|"""tools.py — MCP tool definitions for RFDStudioMCP.
 2|
 3|Fourteen tools exposed to Claude:
 4|  studio_load_game           — load a game session, return session_id
 5|  studio_call                — call a named Lua function on a session
 6|  studio_get_schema          — return entity schema from data.yaml
 7|  studio_get_systems         — return the systems.yaml manifest
 8|  studio_run_headless        — run a Lua function N times, return aggregated results
 9|  studio_validate_game       — validate all four game files
10|  studio_run_tests           — run pytest and return structured results
11|  studio_balance_report      — run N race simulations, return win/place/show distribution
12|  studio_get_state           — inspect GAME_STATE after init_game (slither_rogue)
13|  studio_screenshot          — render PyGame frame and save as PNG
14|  studio_build               — run vite build and return structured output
15|  studio_write_arcade_index  — write the _index.md for the arcade bundle in the site repo
16|  studio_write_arcade_page   — write a child game page under the arcade bundle
17|  studio_deploy_arcade       — copy dist/ to site repo static, then hugo build + SFTP deploy
```

### 3.2 `studio_mcp/server.py` registers the same 14 tools

`studio_mcp/server.py:24-56`:

```
24|from studio_mcp.tools import (
25|    studio_balance_report,
26|    studio_build,
27|    studio_call,
28|    studio_get_schema,
29|    studio_get_state,
30|    studio_get_systems,
31|    studio_load_game,
32|    studio_run_headless,
33|    studio_run_tests,
34|    studio_screenshot,
35|    studio_validate_game,
36|    studio_write_arcade_index,
37|    studio_write_arcade_page,
38|    studio_deploy_arcade,
39|)
```

```
43|mcp.tool()(studio_load_game)
44|mcp.tool()(studio_call)
45|mcp.tool()(studio_get_schema)
46|mcp.tool()(studio_get_systems)
47|mcp.tool()(studio_run_headless)
48|mcp.tool()(studio_validate_game)
49|mcp.tool()(studio_run_tests)
50|mcp.tool()(studio_balance_report)
51|mcp.tool()(studio_get_state)
52|mcp.tool()(studio_screenshot)
53|mcp.tool()(studio_build)
54|mcp.tool()(studio_write_arcade_index)
55|mcp.tool()(studio_write_arcade_page)
56|mcp.tool()(studio_deploy_arcade)
```

### 3.3 Service and health check — MACHINE-OBSERVED

```text
nssm status RFDStudioMCP
→ SERVICE_RUNNING
```

```text
curl.exe http://localhost:8025/health
→ {"status": "ok", "service": "RFDStudioMCP", "port": 8025}
```

These two observations were produced by commands run on this machine. They are not claims about file contents and cannot be verified by reading a file.

---

## 4. Gap Analysis — Direct Evidence

`docs/RFDGameStudio_GapAnalysis.md:3`:

```
3|*June 2026 | Current state: Phase 2c certified*
```

`docs/RFDGameStudio_GapAnalysis.md:9-93` lists six gaps:

- GAP-001: `create_race` missing from `logic.lua`
- GAP-002: no persistence
- GAP-003: race class enforcement not wired
- GAP-004: slot unlocking not implemented
- GAP-005: bankruptcy / emergency grant not implemented
- GAP-006: `calculate_payouts` and `settle_bets` overlap

`docs/state/current.md` shows these are resolved:

- `create_race` is in `logic.lua` and `systems.yaml` (`docs/state/current.md:192`, `games/horse_racing/systems.yaml:44`).
- Persistence (`derby_sim_state_v1`) is certified in Phase 2e (`docs/state/current.md:162`).
- Class eligibility is enforced by `create_race` (`docs/state/current.md:192`).
- Slot unlock is implemented in Phase 2d (`docs/state/current.md:196`).
- Emergency grant is implemented in Phase 2d (`docs/state/current.md:197`).
- `calculate_payouts` is deprecated in Phase 2d (`docs/state/current.md:194`).

**Conclusion:** the gap analysis document is from Phase 2c and is now stale. All six gaps have been addressed in later phases.

---

## 5. `examples/scrapcrawl` — Direct Evidence

### 5.1 File inventory from `list_dir`

`examples/scrapcrawl/src/` contains 15 files:

- `App.tsx` (759 lines)
- `catalog.ts`
- `combat.ts` (105 lines)
- `companion.ts` (118 lines)
- `crafting.ts` (80 lines)
- `growth.ts` (7 lines)
- `index.css`
- `index.ts` (105 lines)
- `llmContent.ts` (141 lines)
- `main.tsx`
- `rooms.ts` (63 lines)
- `sculptDemo.ts`
- `state.ts` (26 lines)
- `trace.ts` (78 lines)
- `types.ts` (62 lines)

`examples/scrapcrawl/tests/game.test.ts`: 1,103 lines.

### 5.2 Core functions and types

`examples/scrapcrawl/src/types.ts:1-62` defines:

- `GearSlot`, `InteractionType`, `CatalogId`
- `Stats`, `Equipment`, `Room`, `Combatant`, `Slime`, `SculptedContent`, `PlayerState`

`examples/scrapcrawl/src/rooms.ts:40-62` exports:

- `getRoom`
- `canMoveTo`
- `move`

`examples/scrapcrawl/src/combat.ts:12` exports:

- `resolveFight`

`examples/scrapcrawl/src/crafting.ts:4-26` exports:

- `canCraft`
- `craft`

`examples/scrapcrawl/src/companion.ts:14-117` exports:

- `recruitCompanion`
- `setActiveCompanion`
- `breedSlimes`
- `companionCombatant`
- `awardCompanionXp`

`examples/scrapcrawl/src/growth.ts:3-6` exports:

- `growthFactor`

`examples/scrapcrawl/src/llmContent.ts:11-90` exports:

- `validateSculptedContent`
- `fallbackContent`
- `sculptRoomIfNeeded`

`examples/scrapcrawl/src/state.ts:3-25` exports:

- `initPlayer`
- `wipe`

### 5.3 ADR-007 primitive mapping (inferred from actual function names)

| ScrapCrawl Function | ADR-007 Primitive | Rationale |
|---------------------|---------------------|-----------|
| `getRoom` | **none** — read accessor | No `get_` primitive in ADR-007. Closest is Entity. |
| `canMoveTo` | Movement / Physics | Validates adjacency; not a named primitive verb. |
| `move` | Movement | Verb `move_` is in the Movement family. |
| `canCraft` | Action | Precondition check for a state change. |
| `craft` | Action / Consequence | Applies a recipe and returns new state. |
| `resolveFight` | Resolution | Verb `resolve_` is in the Resolution family. |
| `recruitCompanion` | Entity | Creates a new entity (`create_`/`generate_` family). |
| `setActiveCompanion` | Action | Applies a state change. |
| `breedSlimes` | Action | Verb `breed_` is in the Action family. |
| `awardCompanionXp` | Action | Applies a state change. |
| `companionCombatant` | **none** — helper | Builds a combatant view; not a primitive. |
| `growthFactor` | **none** — outside table | ADR-007 does not list a `StatSystem` primitive in its naming table. Would need a new primitive or be game-specific. |
| `initPlayer` | Lifecycle | Verb `init_` is in the Lifecycle family. |
| `wipe` | **none** — helper | Resets only `currentRoomId`; not a named primitive. |
| `validateSculptedContent` | **none** — content guard | No ADR-007 primitive for LLM output validation. |
| `fallbackContent` | Resolution / Consequence | Generates fallback data when LLM output fails. |
| `sculptRoomIfNeeded` | **none** — new territory | Async content-sculpting orchestrator. No ADR-007 equivalent. |

### 5.4 Relationship to engine systems

`examples/scrapcrawl` is a TypeScript example, not a four-file studio game. It does not load `engine/primitives/` or `engine/systems/`.

`engine/systems/genetics.lua:78-80` defines `breed_stat(stat_a, stat_b)` for horses. `examples/scrapcrawl/src/companion.ts:69-74` defines its own inline `breedStat`. They are similar (average of two parent stats plus randomness) but not the same:

- `genetics.lua` uses an approximate normal distribution and generational boost.
- `companion.ts` uses a simple uniform offset of ±2.

If ScrapCrawl were ported into the studio, the breeding logic would either duplicate the engine pattern or require a new slime-specific genetics primitive.

### 5.5 ADR-008 UI mapping (inferred from `App.tsx`)

`examples/scrapcrawl/src/App.tsx` is 759 lines. The UI areas are:

| UI Area | ADR-008 Shared Type | Evidence |
|---------|---------------------|----------|
| Header title + cert/protocol badges | `badge`, `label` | `App.tsx:158-174` |
| Scrap reserves display | `stat_display` | `App.tsx:217-223` |
| Tier 2 clearance badge | `badge` | `App.tsx:225-235` |
| Current room panel | `panel`, `label`, `badge` | `App.tsx:240-279` |
| Resolve Combat button | `action_button` | `App.tsx:286-293` |
| D20 roll result panel | `panel`, `stat_display`, `badge` | `App.tsx:302-318` |
| Adjacent connections list | `card_grid` / `data_table` | `App.tsx:321-347` |
| Equipment life table | `data_table` | `App.tsx:370-537` |
| Durability bars | `stat_bar` | `App.tsx:406-414`, `461-468`, `511-518` |
| Proficiency display | `stat_display` | `App.tsx:428-434`, etc. |
| Console trace log | `history_list` | `App.tsx:551-572` |
| Crafting catalog recipe cards | `card`, `card_grid`, `action_button` | `App.tsx:576-759` |

**Missing shared types:** a `room_map` / `world_graph` for the connected room graph, and a `roster_grid` / `breed_panel` for companions. The companion system is tested but not rendered in `App.tsx`.

---

## 6. `examples/trinity-siege` — Direct Evidence

### 6.1 File inventory from `list_dir`

`examples/trinity-siege/src/`:

- `App.tsx` (688 lines)
- `combat.ts` (354 lines)
- `components/ControlPanel.tsx` (349 lines)
- `components/HexRingBoard.tsx` (430 lines)
- `components/WaveLog.tsx` (327 lines)
- `index.css`
- `main.tsx`
- `types.ts` (133 lines)

`examples/trinity-siege/` root contains `.env.example`, `.gitignore`, `README.md`, `assets/`, `index.html`, `metadata.json`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `src/`. It does **not** contain `data.yaml`, `ui.yaml`, `logic.lua`, or `systems.yaml`.

### 6.2 Core functions and types

`examples/trinity-siege/src/types.ts:1-133` defines:

- `UnitShape`, `Race`, `Unit`, `TileState`, `LaneState`, `GamePhase`
- `OrcUnit`, `Attack`, `DuelLog`, `BattleResult`
- Constants: `STARTING_GOLD`, `COST_UNIT`, `COST_WALL`, `INCOME_BASE`, `INCOME_PER_TERRITORY`, `MAX_WAVES`, `LIVES_STARTING`, `LANE_NAMES`, `SHAPE_MATRIX`, `RACE_LEAN`

`examples/trinity-siege/src/combat.ts:1-120` exports:

- `selectBestDefender`
- `resolvePaired`
- `resolveAggregate`

`examples/trinity-siege/src/App.tsx:82-120` defines `generateWaveForecast`. The phase and action handlers are at:

- `handleNextPhase`: `App.tsx:204`
- `handleBuyUnit`: `App.tsx:344`
- `handleBuyWall`: `App.tsx:362`
- `handleDismantleWall`: `App.tsx:374`
- `handleDisbandUnit`: `App.tsx:383`
- `handleStartMoveUnit`: `App.tsx:388`
- `handleCompleteMoveUnit`: `App.tsx:392`
- `handleCancelMoveUnit`: `App.tsx:400`
- `handleRestart`: `App.tsx:405`
- `handleQuickSeed`: `App.tsx:425`

### 6.3 ADR-007 primitive mapping (inferred from actual function names)

| Trinity Function | ADR-007 Primitive | Rationale |
|------------------|-------------------|-----------|
| `generateWaveForecast` | **none** — closest Resolution | Weighted random lane selection; not a contest between participants. |
| `handleBuyUnit` | Entity | Creates a new unit entity. |
| `handleBuyWall` | Action / Entity | Modifies citadel structure. |
| `handleDismantleWall` | Action | Removes a wall. |
| `handleDisbandUnit` | Action | Removes an entity. |
| `handleStartMoveUnit` / `handleCompleteMoveUnit` | Movement | Repositions a unit. |
| `handleCancelMoveUnit` | Action | Cancels movement state. |
| `handleNextPhase` | Lifecycle | Steps the game phase machine. |
| `handleRestart` | Lifecycle | Re-initializes game state. |
| `handleQuickSeed` | **none** — debug helper | Adds test units/walls. |
| `selectBestDefender` | Action | Chooses a defender for an attack. |
| `resolvePaired` | Resolution | 1v1 cascading duel resolution. |
| `resolveAggregate` | Resolution | Summed-strength resolution. |
| `battle_ring` | Resolution + Consequence | Orchestrates multi-lane combat and produces state deltas. |

### 6.4 Relationship to engine systems

`engine/systems/combat.lua:1-4`:

```
1|-- engine/systems/combat.lua
2|-- Combat resolution system for part-based arena fighters.
3|-- Used by: BattleBots (Phase 3+)
4|-- Not used by: horse_racing, slither_rogue
```

`engine/systems/combat.lua:19-59` defines `calculate_damage`, `apply_damage`, `resolve_hit`, and `simulate_fight` as stubs that throw `not implemented for this game`. These signatures are for part-based BattleBots combat (health, armor, weapon_type, reach). They do not match Trinity's shape-matrix, cascading-duel, wall/garrison model.

No game in `games/` declares `combat` in `engine_systems`:

- `games/horse_racing/systems.yaml:6-9` → `genetics`, `odds`, `market`
- `games/slither_rogue/systems.yaml:10` → `engine_systems: []`
- `games/mutant_battle_ball/systems.yaml` → no `engine_systems` key
- `games/slime_coin/systems.yaml:57` → `engine_systems: []`

So `engine/systems/combat.lua` is currently loaded by no studio game.

### 6.5 ADR-008 UI mapping (inferred from components)

`examples/trinity-siege/src/components/HexRingBoard.tsx:1-80` renders the board as a custom SVG with sector paths. This is not in the ADR-008 shared vocabulary.

| UI Area | ADR-008 Shared Type | Evidence |
|---------|---------------------|----------|
| Header gold/wave/lives | `stat_display`, `badge` | `App.tsx:30-34`, `ControlPanel.tsx:79-?` |
| Phase instructions | `panel`, `label` | `ControlPanel.tsx` banner area |
| Hex ring board | **new game-specific type** | `HexRingBoard.tsx` custom SVG |
| Selected tile info | `panel`, `label` | `ControlPanel.tsx:65-71` |
| Buy unit / buy wall buttons | `action_button` | `ControlPanel.tsx` |
| Garrison list | `card_grid` / `data_table` | `ControlPanel.tsx` tile units |
| Move / disband buttons | `action_button` | `ControlPanel.tsx` |
| Wave log lane weights | `stat_bar` | `WaveLog.tsx:46-52` |
| Incoming orcs list | `card_grid` / `data_table` | `WaveLog.tsx` |
| Battle result cards | `card` | `WaveLog.tsx` |
| Duel log | `history_list` | `WaveLog.tsx` |
| Game over / rules overlay | `modal`, `panel` | `App.tsx` overlay |

**Missing shared types:** a `tactical_board` / `hex_grid` and a `unit_token` / `forecast_indicator` abstraction.

---

## 7. BattleBots References — Direct Evidence

`grep_search` for `BattleBots` (case-insensitive) across the repo found 46 matches in 9 files:

- `docs/directives/RFDGameStudio_Phase2j_Directive.md`
- `docs/state/recon_report.md` (the flawed v1 report)
- `engine/systems/combat.lua`
- `tests/fixtures/engine/systems/combat.lua`
- `docs/adr/ADR-006.md`
- `docs/adr/ADR-007.md`
- `docs/directives/RFDGameStudio_Recon_Directive.md`
- `docs/directives/RFDGameStudio_Phase3_Directive.md`
- `docs/sdd/RFDGameStudio_SDD_v0_2.md`

No match appears in any `games/` game logic, `examples/trinity-siege/`, or `examples/scrapcrawl/` source code. BattleBots is referenced only in design documents and the unused `engine/systems/combat.lua` stub.

---

## 8. Directory Maps — Actual Contents

### 8.1 Engine

`engine/primitives/`: `action.lua`, `consequence.lua`, `entity.lua`, `lifecycle.lua`, `movement.lua`, `physics.lua`, `resolution.lua`

`engine/systems/`: `combat.lua`, `genetics.lua`, `market.lua`, `odds.lua`

`engine/ui/`: `resolver.lua`, `resolver.py`

### 8.2 Games (four-file studio games)

`games/horse_racing/`: `data.yaml`, `logic.lua`, `systems.yaml`, `ui.yaml`

`games/mutant_battle_ball/`: `data.yaml`, `logic.lua`, `systems.yaml`, `ui.yaml`

`games/slime_coin/`: `data.yaml`, `logic.lua`, `systems.yaml`, `ui.yaml`

`games/slither_rogue/`: `collision.lua`, `data.yaml`, `logic.lua`, `physics.lua`, `render.lua`, `state.lua`, `systems.yaml`, `ui.yaml`, `utils.lua`

### 8.3 Studio and Studio MCP

`studio/`: `__init__.py`, `executor.py`, `loader.py`, `runtime.py`, `validator.py`

`studio_mcp/`: `__init__.py`, `server.py`, `session_store.py`, `tools.py`

### 8.4 TypeScript Arcade (`ts/src`)

- `main.tsx`
- `fengari-shim.js`, `fengari-web.d.ts`, `index.css`, `vite-env.d.ts`
- `components/GameShell.tsx`, `TabManager.tsx`
- `engine/executor.ts`, `loader.ts`, `runtime.ts`, `types.ts`, `ui_interpreter.tsx`, `ui_resolver.ts`
- `games/registry.ts`
- `games/horse_racing/`, `games/mutant_battle_ball/`, `games/slime_coin/`, `games/slither_rogue/` (each with `App.tsx`, `config.ts`, `styles.css`, `types.ts`, and a `components/` folder)
- `hooks/`
- `ui/base.css`, `ui/tokens.css`, `ui/components/` (Button, Card, Panel, StatBar, Badge, etc.)

### 8.5 Examples

`examples/` contains:

- `coin-pusher-arcade/`
- `horse-racing-&-breeding/`
- `lua/` (a single three-file example: `data.yaml`, `logic.lua`, `ui.yaml`)
- `mutant-battle-ball/`
- `scrapcrawl/`
- `slither-rogue_-evolution/`
- `trinity-siege/`

---

## 9. Git Status — Direct Output

Raw output of `git -C c:\Github\RFDGameStudio status --short`:

```text
?? docs/state/recon_report.md
```

The only untracked file is the flawed v1 report. No other working-tree changes.

---

## 10. Open Decisions

1. **ADR-005 vs. ADR-007 contradiction.** Either ADR-007 supersedes ADR-005 (requires an ADR update) or the shared engine primitives are aspirational only.
2. **`current.md` roadmap table.** Phase 4 "Second Game" is still `Pending` despite Phase 2v and 2w certifying Mutant Battle Ball and Slime Coin.
3. **`current.md` Phase 3 pending section.** Steps 1–3 (uvicorn start, curl health, NSSM registration) appear complete based on machine observation, but the file still lists all five as Pending.
4. **`docs/RFDGameStudio_GapAnalysis.md`.** Written at Phase 2c; all six gaps are resolved in later phases. Should be archived or marked stale.
5. **ScrapCrawl / Trinity-Siege studio integration.** Both are plain TS examples without the four-file contract. Any port requires new directives and new ADR-008 vocabulary.
6. **`engine/systems/combat.lua`.** Stub file for BattleBots; not used by any existing game. ADR-007 also references a non-existent `grid_movement.lua`.

---

*Report generated from direct file reads and labeled machine observations. No code was changed.*
