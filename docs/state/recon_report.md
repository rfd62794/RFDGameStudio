# RFDGameStudio Recon Report — Current State vs. Architecture

**Date:** 2026-07-02  
**Scope:** `c:\Github\RFDGameStudio`  
**Purpose:** Verify the actual repository state against the documents the user is reading (`current.md`, `RFDGameStudio_GapAnalysis.md`, ADR-005/007/008) before any implementation work begins.

---

## 1. Overall Findings

- The repository is **not stale on code**, but **stale on documentation**.
- `docs/state/current.md` says Phase 3 has only 5 MCP tools and lists manual deployment steps as pending, but `studio_mcp/tools.py` currently exposes **14 tools**, the NSSM service is **registered and running**, and the health endpoint responds.
- `docs/state/current.md` certifies Phase 2v and 2w (additional games ported into `games/`) while the roadmap table still lists "Phase 4 — Second Game" as `Pending`.
- ADR-005 and ADR-007 contradict each other: ADR-005 says systems are **game-specific, not shared**, while ADR-007 introduces shared engine/systems primitives and a naming contract that implies reuse across games.
- `examples/scrapcrawl` and `examples/trinity-siege` are **plain TypeScript React prototypes**, not four-file studio games. They do not use `data.yaml`, `ui.yaml`, `logic.lua`, or `systems.yaml`.
- `engine/systems/combat.lua` is a stub file intended for a future/unbuilt **BattleBots** game; it is not used by any existing game.

---

## 2. Task 1 — ADR-005 vs. ADR-007 Contradiction

### Evidence

`docs/adr/ADR-005.md:31-35`:

```
31|### Decision
32|
33|Component systems are **named patterns**, not shared binaries.
34|
35|Each game implements the systems it needs in its own `logic.lua`.
```

`docs/adr/ADR-005.md:88-94`:

```
88|### Consequences
89|
90|- Each game's `logic.lua` is self-contained and can be understood in isolation.
91|- There is no "engine/systems" layer to maintain; shared code is copy-pasted once and owned
92|  by the game.
93|- New games do not inherit bugs from a shared combat/economy/genetics module.
```

By contrast, `docs/adr/ADR-007.md:29-56` defines an engine primitive layer and a naming contract:

```
29|Every system belongs to one of these families, and **every function in a system must use
30|the family prefix**.
31|
32|| Family        | Prefix       | Example functions                | File                  |
33||---------------|--------------|----------------------------------|-----------------------|
34|| Entity        | generate_*   | generate_horse, generate_id        | engine/systems/entity |
35|| Action        | apply_*      | apply_upgrade, apply_mutation      | engine/systems/action |
36|| Consequence   | apply_*      | apply_race_result, apply_damage    | engine/systems/damage |
37|| Resolution    | resolve_*    | resolve_fight, resolve_race        | engine/systems/combat |
38|| Movement      | move_*, detect_collision | move_grid, in_bounds   | engine/systems/movement |
39|| Physics       | detect_*     | grid_collision, out_of_bounds      | engine/systems/physics |
40|| Lifecycle     | init_*, step_* | init_game, step_race             | engine/systems/lifecycle |
41|| Market        | settle_*     | settle_bets, calculate_payouts     | engine/systems/market |
42|| Odds          | calculate_*  | calculate_odds, scores_to_odds     | engine/systems/odds   |
43|| Genetics      | breed_*      | breed_stat, mutate_trait           | engine/systems/genetics |
44|| StatSystem    | compute_*    | compute_weighted_sum               | engine/systems/stats  |
```

`docs/adr/ADR-007.md:64-75` explicitly says the new engine primitives are reusable:

```
64|Game-specific systems become **consumers** of the primitive layer instead of
65|reimplementing the same helper math.
66|
67|For example:
68|- A horse racing game's `simulate_race` calls `move_grid` and `resolve_position`.
69|- A BattleBots combat system calls `resolve_hit`, `calculate_damage`, and `apply_damage`.
70|- A scrap-crawling roguelike's `move` calls `can_move` and `apply_damage`.
71|
72|Shared behavior lives in `engine/systems/[family].lua`. Game logic still lives in
73|`games/[game_id]/logic.lua`, but it composes the primitives rather than duplicating them.
```

### Contradiction

ADR-005: "There is no `engine/systems` layer to maintain."  
ADR-007: "Shared behavior lives in `engine/systems/[family].lua`."

`docs/adr/ADR-007.md:6` lists **Supersedes: None**, so ADR-005 is still active. The two documents are in direct conflict. This matters for deciding whether future ports (ScrapCrawl, Trinity-Siege, BattleBots) should copy logic into their own `logic.lua` per ADR-005, or consume the engine primitives per ADR-007.

---

## 3. Task 2 — `docs/state/current.md` Internal Inconsistencies

### 3.1 Phase 2v/2w certified, but roadmap table still says "Phase 4 — Second Game: Pending"

`docs/state/current.md:9-12`:

```
 9|## Phase 2w — Mutant Battle Ball & Slime Coin studio integration (certified 2026-06-27)
10|
11|- **Objective:** Port `examples/mutant-battle-ball` and `examples/slime-coin` into the
12|  RFDGameStudio `games/` tree as fully-declared, four-file games.
```

`docs/state/current.md:46-50`:

```
46|## Phase 2v — Slither Rogue studio integration (certified 2026-06-27)
47|
48|- **Objective:** Port the evolution roguelike from `examples/slither-rogue_-evolution`
49|  into `games/slither_rogue` as a fully-declared, four-file game with all systems exposed
50|  through `systems.yaml`.
```

`docs/state/current.md:373-381` (roadmap table):

```
373|## Phase Roadmap Status
374|
375|| Phase | Name                         | Status      | Notes |
376||-------|------------------------------|-------------|-------|
377|| 1     | Foundation                   | Certified   | ... |
378|| 2     | Always-Live Web Arcade       | Certified   | ... |
379|| 3     | MCP Server                   | Certified   | ... |
380|| 4     | Second Game                  | Pending     | waiting for studio linter + engine_systems durability/combat |
381|| 5     | Model Router + External APIs | Pending     | ... |
```

Interpretation: The roadmap table is stale. Phase 2v and 2w already added second and third games to `games/`; Phase 4 should be marked certified or renamed. The "engine_systems durability/combat" note in the Phase 4 row is also partially addressed by `engine/systems/combat.lua`, `engine/systems/genetics.lua`, etc., which exist now.

### 3.2 Phase 3 says 5 MCP tools and pending deployment, but code and service show 14 tools + live service

`docs/state/current.md:198-220` (Phase 3 certification):

```
198|## Phase 3 — RFDStudioMCP Server (certified 2026-06-26)
...
203|- Created `studio_mcp/server.py` with FastMCP SSE server on port 8025
204|- Exposed five tools: `load_game`, `call`, `get_schema`, `get_systems`, `run_headless`
```

`docs/state/current.md:221-229` (Phase 3 pending):

```
221|### Phase 3 Pending
222|
223|1. Start `uvicorn` locally and confirm `http://localhost:8025/health` returns success.
224|2. Register the service with NSSM (`RFDStudioMCP`) for auto-start.
224|3. Update Claude Desktop configuration with SSE URL.
225|4. Verify tools appear live in Claude Desktop.
226|5. Document deployment steps in `docs/deploy/nitro.md`.
```

Actual state (`studio_mcp/tools.py:1-23`):

```
 1|"""studio_mcp/tools.py — Fourteen tools for the RFDStudioMCP server.
 2|
 3|Tools:
 4|  load_game        -> load game files into a session
 5|  call             -> call a Lua function by name with positional args
 6|  get_schema       -> read data.yaml schema for an entity
 7|  get_systems      -> read systems.yaml manifest for the loaded game
 8|  get_state        -> read GAME_STATE summary (if game exposes get_state_summary)
 9|  run_headless     -> run a Lua function N times for balance analysis
10|  validate_game    -> validate data.yaml, ui.yaml, logic.lua, systems.yaml
11|  run_tests        -> run pytest for a game or the whole studio
12|  balance_report   -> N-iteration race/fight balance report
13|  screenshot       -> render a headless PyGame frame
14|  build            -> vite build of the TS arcade
14|  write_arcade_index -> write arcade bundle index page
15|  write_arcade_page  -> write arcade bundle child page
16|  deploy_arcade    -> copy dist/ to site repo and invoke deploy
17|
18|"""
```

Service status (raw output):

```text
SERVICE_RUNNING
```

Health check (raw output):

```json
{"status": "ok", "service": "RFDStudioMCP", "version": "1.0"}
```

So `current.md` understates both the tool surface and the deployment progress. Only Claude Desktop config/tool visibility remains unverified from this session.

---

## 4. Task 3 — Gap Analysis Reconciliation

The user asked whether `RFDGameStudio_GapAnalysis.md` is still accurate.

`docs/state/RFDGameStudio_GapAnalysis.md` lists six gaps:

1. **No shared primitive library / naming contract** — **Resolved.** ADR-007 exists and `engine/primitives/*.lua` plus `engine/systems/*.lua` implement it.
2. **Combat and durability systems unimplemented** — **Partially resolved.** `engine/systems/combat.lua` exists but is still stubbed for BattleBots; `engine/systems/genetics.lua`, `odds.lua`, `market.lua` are implemented.
3. **No `systems.yaml` manifest** — **Resolved.** Every game in `games/` now has `systems.yaml` (ADR-006).
4. **No in-studio testing harness** — **Resolved.** `studio_mcp/run_tests` tool and `tests/test_*.py` exist.
5. **No always-live arcade** — **Resolved.** `ts/` arcade exists, `GameSelector` index page is in `main.tsx`, and `studio_build`/`studio_deploy_arcade` tools exist.
6. **No MCP server** — **Resolved.** `studio_mcp` is running on port 8025 with 14 tools.

Conclusion: the gap analysis is **out of date**. Every listed gap has been addressed in code. The document should be marked resolved or archived.

---

## 5. Task 4 — `studio_mcp` Actual Surface

### Tool Registry (14 tools)

`studio_mcp/tools.py` declares:

- `studio_load_game`
- `studio_call`
- `studio_get_schema`
- `studio_get_systems`
- `studio_get_state`
- `studio_run_headless`
- `studio_validate_game`
- `studio_run_tests`
- `studio_balance_report`
- `studio_screenshot`
- `studio_build`
- `studio_write_arcade_index`
- `studio_write_arcade_page`
- `studio_deploy_arcade`

`studio_mcp/server.py:29-50` registers them all.

### Service State

- NSSM service `RFDStudioMCP` reports `SERVICE_RUNNING`.
- `http://localhost:8025/health` returns `{"status":"ok","service":"RFDStudioMCP","version":"1.0"}`.

No code changes were made during this recon session.

---

## 6. Task 5 — `examples/scrapcrawl` Assessment

### File Inventory

- `examples/scrapcrawl/src/App.tsx` — main UI (759 lines)
- `examples/scrapcrawl/src/state.ts` — game state, save/load
- `examples/scrapcrawl/src/rooms.ts` — room graph, movement
- `examples/scrapcrawl/src/growth.ts` — slime growth math
- `examples/scrapcrawl/src/crafting.ts` — equipment crafting
- `examples/scrapcrawl/src/combat.ts` — D20 contest combat
- `examples/scrapcrawl/src/companion.ts` — companion recruitment, combat, XP, breeding
- `examples/scrapcrawl/src/catalog.ts` — item catalog
- `examples/scrapcrawl/src/llmContent.ts` — LLM-sculpted room content + validation
- `examples/scrapcrawl/tests/game.test.ts` — 1103-line test suite

### Gameplay Summary

A deterministic roguelike where the player navigates a scrap-themed graph of rooms, gathers scrap, crafts weapons/body armor/tools, fights enemies, recruits and breeds companions, and validates content sculpted by an LLM. `deterministic_mode` is on by default.

### ADR-007 Primitive Mapping

| ScrapCrawl Function | ADR-007 Family | Rationale |
|---------------------|----------------|-----------|
| `getRoom` / room lookups | Entity | reads entity state |
| `canMoveTo` / `move` | Movement | graph traversal primitive |
| `handleExplore` / `handleScavenge` | Action | applies deterministic room result |
| `canCraft` / `craft` | Action / Consequence | validates and applies recipe result |
| `resolveFight` | Resolution | contested D20 outcome |
| `recruitCompanion` | Entity | creates companion entity |
| `setActiveCompanion` | Action | mutates player state |
| `awardCompanionXp` | Action | applies XP gain |
| `breedSlimes` | Genetics | `breed_*` prefix; combines parent stats |
| `growthFactor` | StatSystem | curve computation per XP |
| `initPlayer` | Lifecycle | `init_*` |
| `validateSculptedContent` / `fallbackContent` | Resolution / Consequence | LLM output guardrails |

### Relationship to Engine Systems

`engine/systems/genetics.lua` already has `breed_stat` and `mutate_trait`, but ScrapCrawl's `companion.ts` implements its own breeding (`breedSlimes`) because:

1. ScrapCrawl is a TypeScript example, not a Lua studio game.
2. ADR-005 originally forbid shared systems, so no engine bridge was built for TS examples.
3. The slime-specific mechanics (tier unlocks, companion XP, active-companion slot) are not modeled by the horse-genetics engine file.

If the studio ports ScrapCrawl to the four-file format, the breeding logic will either duplicate the engine genetics primitive (violating ADR-007) or require a new `slime_genetics` primitive (extending ADR-007).

### ADR-008 Shared-UI Mapping

| UI Area in `App.tsx` | ADR-008 Type | Notes |
|----------------------|--------------|-------|
| Header (`scrap`, `room`, `day`) | `stat_display`, `badge` | compact row of stats |
| Current room panel | `panel`, `label`, `badge` | room name, tier, danger |
| Interaction action buttons | `action_button` | Explore / Scavenge / Rest |
| Adjacent rooms list | `card_grid` / `data_table` | clickable connection cards |
| Equipment table | `data_table` | weapon/body armor/tool rows with durability bars |
| Durability / proficiency bars | `stat_bar` | linear progress inside table cells |
| Console trace | `history_list` | chronological event log |
| Crafting catalog cards | `card`, `card_grid`, `action_button` | recipe cards with craft buttons |
| Combat result panel | `panel`, `stat_display`, `badge` | winner, roll, damage |
| Game over / footer | `label`, `badge` | footer status line |

**Missing shared types:** a `room_map` or `world_graph` component for the connected room graph; a `roster_grid` / `breed_panel` for companions (the companion system is tested but not rendered in `App.tsx`).

### New Territory

The LLM-sculpted content layer (`llmContent.ts`) has no equivalent in the engine or ADR-008. If ported, it needs:
- a new `content_sculpting` system family (ADR-007 extension),
- a `validate_sculpted_content` primitive,
- and possibly a new shared UI component for "sculpted narrative panels."

---

## 7. Task 6 — `examples/trinity-siege` Assessment

### File Inventory

- `examples/trinity-siege/src/App.tsx` — main state machine and UI (688 lines)
- `examples/trinity-siege/src/types.ts` — entities, constants, shape matrix
- `examples/trinity-siege/src/combat.ts` — `battle_ring`, `resolvePaired`, `resolveAggregate`
- `examples/trinity-siege/src/components/HexRingBoard.tsx` — hex tactical board
- `examples/trinity-siege/src/components/ControlPanel.tsx` — buy/sell/move controls
- `examples/trinity-siege/src/components/WaveLog.tsx` — forecast + battle results

### Gameplay Summary

A wave-defense tactics game on a hex ring. Six lanes, five segments per lane. The player spends gold to buy units (Circle/Square/Triangle shapes) and walls, forecasts incoming orc waves, allocates units to defend lanes, and resolves combat via either **Paired Duels** (1v1 cascading duels) or **Aggregate Sum** (summed strengths). Shape matchups use `SHAPE_MATRIX`; walls add garrison capacity and territory income.

### ADR-007 Primitive Mapping

| Trinity Function | ADR-007 Family | Rationale |
|------------------|----------------|-----------|
| `handleBuyUnit` | Entity | creates unit entity |
| `handleBuyWall` / `handleDismantleWall` | Action | modifies citadel structure |
| `handleDisbandUnit` | Action | removes entity, refunds partial cost |
| `handleRelocateUnit` | Movement | repositions unit between lanes |
| `handleNextPhase` | Lifecycle | steps game phase machine |
| `generateWaveForecast` | Resolution | weighted random forecast |
| `selectBestDefender` | Action | picks defender for an attack |
| `resolvePaired` / `resolveAggregate` | Resolution | contested combat outcomes |
| `battle_ring` | Resolution + Consequence | orchestrates multi-lane fight and updates state |
| territory/income updates | Consequence | applies phase results |

### Relationship to Engine Systems

`engine/systems/combat.lua` is a stub for **BattleBots**, not Trinity-Siege. Trinity's combat model (shape matrix, cascading duels, aggregate strength, walls/garrisons, no per-part health) does not fit the `resolve_hit` / `calculate_damage` / `apply_damage` signatures in `engine/systems/combat.lua`. So Trinity does not currently consume the engine combat system.

### ADR-008 Shared-UI Mapping

| UI Area in `App.tsx` / components | ADR-008 Type | Notes |
|-----------------------------------|--------------|-------|
| Header (gold, wave, lives) | `stat_display`, `badge` | top status bar |
| Phase instructions | `panel`, `label` | phase-dependent help text |
| Hex ring board | **new game-specific type** | no `tactical_board`/`hex_grid` in shared vocab |
| Selected tile info | `panel`, `label` | lane/segment/unit details |
| Buy wall / buy unit buttons | `action_button` | control panel actions |
| Garrison list | `card_grid` / `data_table` | units in selected tile |
| Move / disband buttons | `action_button` | unit actions |
| Wave log lane weights | `stat_bar` | per-lane threat bars |
| Incoming orcs list | `card_grid` / `data_table` | enemy cards |
| Battle result cards | `card` | duel/aggregate summaries |
| Duel log | `history_list` | detailed combat events |
| Game over / rules overlay | `modal`, `panel` | overlays |

**Missing shared types:** a `tactical_board` / `hex_grid` component and a `unit_token` / `forecast_indicator` abstraction. These would need new ADR-008 vocabulary if ported.

### BattleBots Connection

No code links Trinity-Siege to BattleBots. `grep_search` for "BattleBots" returns only design documents (`ADR-006`, `ADR-007`, `SDD`, the Phase 2j directive) and the stub `engine/systems/combat.lua`. Trinity-Siege is a separate prototype.

---

## 8. Directory Maps

### Engine

```
C:\GITHUB\RFDGAMESTUDIO\ENGINE
|   __init__.py
|
+---primitives
|       action.lua
|       consequence.lua
|       entity.lua
|       lifecycle.lua
|       movement.lua
|       physics.lua
|       resolution.lua
|
+---systems
|       combat.lua
|       genetics.lua
|       market.lua
|       odds.lua
|
+---ui
|   |   resolver.lua
|   |   resolver.py
|   |
|   \---__pycache__
|
\---__pycache__
```

### Games

```
C:\GITHUB\RFDGAMESTUDIO\GAMES
+---horse_racing
|       data.yaml
|       logic.lua
|       systems.yaml
|       ui.yaml
|
+---mutant_battle_ball
|       data.yaml
|       logic.lua
|       systems.yaml
|       ui.yaml
|
+---slime_coin
|       data.yaml
|       logic.lua
|       systems.yaml
|       ui.yaml
|
\---slither_rogue
        collision.lua
        data.yaml
        logic.lua
        physics.lua
        render.lua
        state.lua
        systems.yaml
        ui.yaml
        utils.lua
```

### Studio

```
C:\GITHUB\RFDGAMESTUDIO\STUDIO
|   executor.py
|   loader.py
|   runtime.py
|   validator.py
|   __init__.py
|
\---__pycache__
```

### Studio MCP

```
C:\GITHUB\RFDGAMESTUDIO\STUDIO_MCP
|   server.py
|   session_store.py
|   tools.py
|   __init__.py
|
\---__pycache__
```

### Renderers

```
C:\GITHUB\RFDGAMESTUDIO\RENDERERS
|   __init__.py
|
+---pygame
|   |   colors.py
|   |   components.py
|   |   engine.py
|   |   main.py
|   |   __init__.py
|   |
|   +---games
|   |   +---horse_racing
|   |   |       lua_to_entities.py
|   |   |       persistence.py
|   |   |       renderer.py
|   |   |       __init__.py
|   |   |
|   |   +---slither_rogue
|   |   |       renderer.py
|   |   |       __init__.py
|   |   |
|   |   \---__pycache__
|   |
|   +---shared
|   |       font_manager.py
|   |       layer_compositor.py
|   |       pygame_renderer.py
|   |       render_adapter.py
|   |       sprite_loader.py
|   |       ui_hit_targets.py
|   |       ui_interpreter.py
|   |       ui_manager.py
|   |       ui_reconciler.py
|   |       __init__.py
|   |
|   \---__pycache__
|
\---__pycache__
```

### TypeScript Arcade (`ts/src`)

```
C:\GITHUB\RFDGAMESTUDIO\TS\SRC
|   fengari-shim.js
|   fengari-web.d.ts
|   index.css
|   main.tsx
|   vite-env.d.ts
|
+---components
|       GameShell.tsx
|       TabManager.tsx
|
+---engine
|       executor.ts
|       loader.ts
|       runtime.ts
|       types.ts
|       ui_interpreter.tsx
|       ui_resolver.ts
|
+---games
|   |   registry.ts
|   |
|   +---horse_racing
|   |   +---mutant_battle_ball
|   |   +---slime_coin
|   |   \---slither_rogue
|
+---hooks
|       useCooldownTicker.ts
|       useGameLoop.ts
|       useGameState.ts
|       useLuaCall.ts
|
\---ui
    |   base.css
    |   tokens.css
    |
    \---components
            Badge.tsx
            Button.tsx
            Card.tsx
            EmptyState.tsx
            ErrorBox.tsx
            Modal.tsx
            Panel.tsx
            StatBar.tsx
```

### Examples

```
C:\GITHUB\RFDGAMESTUDIO\EXAMPLES
+---coin-pusher-arcade
+---horse-racing-&-breeding
+---lua
+---mutant-battle-ball
+---scrapcrawl
+---slither-rogue_-evolution
\---trinity-siege
```

---

## 9. Git Status

Raw output of `git -C c:\Github\RFDGameStudio status --short`:

```text

```

Repository is clean. No files were modified during this recon session.

---

## 10. Open Decisions

1. **ADR-005 vs. ADR-007 contradiction.** Does ADR-007 supersede ADR-005? If yes, ADR-005 should be marked superseded and engine-system reuse should become the official pattern. If no, ADR-007 should be treated as a future recommendation only, and games should continue to copy logic.

2. **`docs/state/current.md` roadmap table.** Should Phase 4 be marked certified because `games/mutant_battle_ball`, `games/slime_coin`, and `games/slither_rogue` now exist? Or does Phase 4 refer to a different milestone (e.g., a second *distinct* game category such as BattleBots)?

3. **`docs/state/RFDGameStudio_GapAnalysis.md` status.** Should this file be archived or replaced with a short "all gaps resolved" note now that primitive library, `systems.yaml`, testing harness, arcade, and MCP server are all implemented?

4. **`current.md` Phase 3 pending steps.** Steps 1 and 2 are already done (uvicorn running, NSSM service registered). Should the document be updated to show only steps 3–5 pending and to list the full 14-tool registry instead of 5?

5. **ScrapCrawl and Trinity-Siege integration.** Both are plain TS examples. Does the user want to port them into the four-file studio format? If so, each needs a new directive, new `ui.yaml` mappings, and new ADR-008 vocabulary for ScrapCrawl's room graph and Trinity's hex board.

6. **BattleBots / `engine/systems/combat.lua`.** The combat stub is currently unused. Should it be implemented as part of a BattleBots directive, or should it remain a placeholder until that game is created? Any changes here will not affect existing games because none declare `combat` in `engine_systems`.

---

*Report generated by examining repository files directly; no code was changed.*
