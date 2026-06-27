# RFDGameStudio — Project State

*Last updated: June 2026*

## Current Phase

**Phase 2r — Horse Racing Features — CERTIFIED**

## Phase 2r Completion Criteria

| Criterion | Status |
|---|---|
| Back button CSS: `.arcade-back-btn` changed to `position: relative` | ✅ |
| Navbar CSS: `.arcade-game-nav`, `.arcade-game-nav-title`, `.arcade-game-content` added | ✅ |
| `main.tsx`: back button moved into navbar strip above game content | ✅ |
| `logic.lua`: `create_ai_race(race_class, data)` function added | ✅ |
| `tests/fixtures/horse_racing/logic.lua`: `create_ai_race` synced | ✅ |
| `App.tsx`: resting horse check in `handleNewRace` / `handleSkipRace` | ✅ |
| `App.tsx`: `_buildAiOnlyRace` helper for AI-only race creation | ✅ |
| `App.tsx`: `luaRaceToTs` helper to convert Lua race to TS format | ✅ |
| `types.ts`: `ai_only?: boolean` field added to `CurrentRace` interface | ✅ |
| `App.tsx`: `handleRaceComplete` skips career updates for AI-only races | ✅ |
| `BettingTab.tsx`: AI-only banner when `race.ai_only` is true | ✅ |
| `CalendarTab.tsx`: new React component for race calendar tab | ✅ |
| `styles.css`: calendar CSS styles (`.calendar-wrap`, `.calendar-row`, etc.) added | ✅ |
| Python tests: 2 new tests for `create_ai_race` → **258 passed, 0 failed** | ✅ |
| TS floor: unchanged → **29 passed, 0 failed** | ✅ |

**Test proof:**
```
uv run pytest -v     → 258 passed, 0 failed, 0 skipped
npx vitest run       → 29 passed, 0 failed, 0 skipped
```

**Phase 2f — Architecture Migration — CERTIFIED**

## Phase 2f Completion Criteria

| Criterion | Status |
|---|---|
| `engine/primitives/` — 7 .lua files (action, entity, resolution, consequence, movement, physics, lifecycle) | ✅ |
| `engine/systems/` — genetics.lua, odds.lua, market.lua | ✅ |
| `studio/loader.py` — `load_engine_source` + `engine_source` field on `GameFiles` | ✅ |
| `studio/executor.py` — accepts `engine_source`, prepends to game logic | ✅ |
| `studio/runtime.py` — passes `engine_source` to `Executor` | ✅ |
| `games/horse_racing/systems.yaml` — `engine_systems: [genetics, odds, market]` | ✅ |
| `games/horse_racing/logic.lua` — trimmed; only game-specific logic remains | ✅ |
| `ts/src/ui/tokens.css` — CSS custom properties only | ✅ |
| `ts/src/ui/base.css` — reset + typography | ✅ |
| `ts/src/games/horse_racing/styles.css` — all game-specific classes | ✅ |
| `ts/src/ui/components/` — 9 base components + index.ts barrel | ✅ |
| `ts/src/games/horse_racing/App.tsx` — game shell moved | ✅ |
| `ts/src/games/horse_racing/components/` — all 5 game components moved | ✅ |
| `ts/src/components/` — deleted | ✅ |
| `ts/src/App.tsx` — deleted | ✅ |
| `ts/src/main.tsx` — lazy-loading game router | ✅ |
| Python floor: `uv run pytest -v` → **32 passed, 0 failed** | ✅ |
| TS floor: `npx vitest run` → **17 passed, 0 failed** | ✅ |
| `npx vite build` → exits 0 (code-split: index + App chunks) | ✅ |

**Test proof:**
```
uv run pytest -v     → 32 passed, 0 failed, 0 skipped
npx vitest run       → 17 passed, 0 failed, 0 skipped
npx vite build       → ✓ built in 2.60s, exit 0 (lazy split: index + App chunks)
```

**Phase 2e — Full Example Parity — CERTIFIED**

## Phase 2e Completion Criteria

| Criterion | Status |
|---|---|
| `framer-motion` + `lucide-react` installed | ✅ |
| `starter_min_stat` / `starter_max_stat` added to `stable` block in both `data.yaml` + fixture | ✅ |
| `buildInitialState` seeds from `data.yaml.starter_horses` — Vanguard Spirit + Starlight Dream | ✅ |
| Persistence: `derby_sim_state_v1` localStorage save on every state change, restore on mount | ✅ |
| Cooldown ticker: 1s interval increments `ticker`, passed to StableTab for live badge recompute | ✅ |
| Skip race: `handleSkipRace` builds new race without navigating, `BettingTab` "Skip & New Race" | ✅ |
| Rename horse: inline click-to-edit in StableTab, Enter/Blur confirms, Escape cancels | ✅ |
| Sell horse: Sell button on each card calls `calculate_horse_price` via Lua, removes horse + adds funds | ✅ |
| Purchase starter: `handlePurchaseStarter` generates horse via `generate_horse` Lua, BettingTab market | ✅ |
| Styled sticky header with Trophy icon, DERBY SIM title, desktop tab nav, bank balance widget | ✅ |
| Framer Motion `AnimatePresence` tab transitions (opacity + y slide, 150ms) | ✅ |
| Mobile tab bar: second tab row, hidden on desktop, visible on ≤768px | ✅ |
| Footer: GAME RULES · PEDIGREE GENETICS DATA | ✅ |
| History tab: styled `history-card` components — no more raw table | ✅ |
| Cooldown badge on resting horses: "Resting Xm Xs" amber italic text | ✅ |
| Clear bets button in bet slip: clears `betEntries` local state | ✅ |
| Starter market in BettingTab: visible when `playerHorses.length < unlockedSlots` | ✅ |
| All new CSS classes added to `index.css` without removing existing ones | ✅ |
| Python floor: `uv run pytest -v` → **32 passed, 0 failed** (unchanged) | ✅ |
| TS floor: `npx vitest run` → **17 passed, 0 failed** (was 15) | ✅ |
| `npx vite build` → exits 0 | ✅ |

**Test proof:**
```
uv run pytest -v     → 32 passed, 0 failed, 0 skipped
npx vitest run       → 17 passed, 0 failed, 0 skipped (tests/test_runtime.ts: 9)
npx vite build       → ✓ built in 2.97s, exit 0
```

## Phase 2d Completion Criteria

| Criterion | Status |
|---|---|
| `create_race` in `logic.lua` — full race creation, class eligibility, NPC generation, odds | ✅ |
| `can_unlock_slot` in `logic.lua` — slot unlock validation | ✅ |
| `calculate_payouts` deprecated in `logic.lua` (comment, not removed) | ✅ |
| `systems.yaml` — `create_race` added to simulation, `can_unlock_slot` to market | ✅ |
| `buildRace()` TS implementation deleted — replaced with thin `create_race` Lua wrapper | ✅ |
| Emergency grant: `funds < 50 && playerOwnedHorses == 0` → $250 + dismissible banner | ✅ |
| Slot unlock button in `StableTab.tsx` — calls `can_unlock_slot` via Lua | ✅ |
| `GameState.emergency_grant_shown` field added to `types.ts` | ✅ |
| Python floor: `uv run pytest -v` → **32 passed, 0 failed** | ✅ |
| TS floor: `npx vitest run` → **15 passed, 0 failed** | ✅ |
| `npx vite build` → exits 0, no TypeScript errors | ✅ |
| `tests/fixtures/horse_racing/logic.lua` synced with game file | ✅ |
| Executor `_to_lua()` deep conversion — nested dicts/lists fully converted | ✅ |

## Phase 3 Completion Criteria

| Criterion | Status |
|---|---|
| `games/horse_racing/systems.yaml` exists with all logic.lua functions assigned | ✅ |
| `studio_mcp/__init__.py` created | ✅ |
| `studio_mcp/session_store.py` — in-memory session registry | ✅ |
| `studio_mcp/tools.py` — 5 tools: load_game, call, get_schema, get_systems, run_headless | ✅ |
| `studio_mcp/server.py` — FastMCP SSE server on port 8025 | ✅ |
| `pyproject.toml` — fastapi, uvicorn, mcp>=1.0.0,<2 added | ✅ |
| `tests/test_studio_mcp.py` — 7 new tests (22–28) | ✅ |
| Python floor: `uv run pytest -v` → **28 passed, 0 failed** | ✅ |
| TS floor: `npx vitest run` → **12 passed, 0 failed** (unchanged) | ✅ |
| `docs/adr/ADR-006.md` — systems.yaml ECS manifest ADR | ✅ |

## Phase 3 Pending (manual steps on Nitro)

| Criterion | Status |
|---|---|
| `uv run uvicorn studio_mcp.server:asgi_app --host 0.0.0.0 --port 8025` starts | Pending |
| `curl http://localhost:8025/health` → `{"status": "ok"}` | Pending |
| NSSM service `RFDStudioMCP` registered on Nitro | Pending |
| Claude Desktop config updated with mcp-remote entry | Pending |
| Live Claude session: 5 studio tools visible in tool list | Pending |

## Phase 2c Completion Criteria (archived)

| Criterion | Status |
|---|---|
| `SVGRacer.tsx` copied from examples into `ts/src/components/` | ✅ |
| `RaceTrack.tsx` — full animated 6-lane track | ✅ |
| `RaceTrack.tsx` — `anim_` prefix on all display state | ✅ |
| `RaceTrack.tsx` — Lua `final_rank` is authoritative result | ✅ |
| `RaceTrack.tsx` — 1x / 3x / 5x speed multiplier buttons | ✅ |
| `RaceTrack.tsx` — Skip button snaps all to 100%, reveals Lua results | ✅ |
| `RaceTrack.tsx` — announcer line updates from leader `anim_progress` | ✅ |
| `RaceTrack.tsx` — results panel with rank, time, bet won/lost | ✅ |
| `BettingTab.tsx` — `onRaceComplete` replaced with `onStartRace` | ✅ |
| `BettingTab.tsx` — enriches participants with `final_rank`/`finish_time` before handing off | ✅ |
| `App.tsx` — `isRacingActive` state added | ✅ |
| `App.tsx` — `handleStartRace` / `handleCloseRaceTrack` wired | ✅ |
| `App.tsx` — `RaceTrack` renders as full overlay when `isRacingActive` | ✅ |
| `index.css` — `.race-track-fullscreen`, `.race-track-header`, `.race-announcer`, `.btn-speed` added | ✅ |
| Python floor: `uv run pytest -v` → **21 passed, 0 failed** (at time of 2c cert) | ✅ |
| TS floor: `npx vitest run` → **12 passed, 0 failed** (unchanged) | ✅ |
| `npx vite build` → exits 0, no TypeScript errors | ✅ |

## Phase 2b Completion Criteria (archived)

| Criterion | Status |
|---|---|
| `data.yaml` — `starting_funds` corrected to 1000 | ✅ |
| `data.yaml` — stable/betting/race constants added | ✅ |
| `data.yaml` — `fee` field on all `race_classes` entries | ✅ |
| `data.yaml` — `starter_horses` (2) and `public_studs` (5) appended | ✅ |
| `tests/fixtures/horse_racing/data.yaml` — identical changes applied | ✅ |
| `logic.lua` — `calculate_place_odds` added | ✅ |
| `logic.lua` — `update_horse_after_race` added (pure, no mutation) | ✅ |
| `logic.lua` — `settle_bets` added | ✅ |
| `logic.lua` — `simulate_race` lupa-safe (pcall on absent keys) | ✅ |
| Python floor: `uv run pytest -v` → **21 passed, 0 failed** | ✅ |
| `types.ts` — `RaceParticipant.final_rank` added | ✅ |
| `types.ts` — `Bet` interface with `type` + `payout_odds` added | ✅ |
| `BettingTab.tsx` — Win/Place toggle, `calculate_place_odds` call | ✅ |
| `BettingTab.tsx` — `simulate_race` is sole race authority | ✅ |
| `BettingTab.tsx` — `settle_bets` handles all payout logic | ✅ |
| `BreederTab.tsx` — new component, `breed_horses` + `public_studs` | ✅ |
| `App.tsx` — `handleRaceComplete` wires `update_horse_after_race` | ✅ |
| `App.tsx` — `handleAddOffspring` + Breeder tab wired | ✅ |
| TS floor: `npx vitest run` → **12 passed, 0 failed** | ✅ |
| `npx vite build` → exits 0, 3 assets emitted | ✅ |

## Proof Output

```
# Python floor (Phase 2d)
uv run pytest -v
32 passed in 0.47s

# TypeScript floor (Phase 2d)
npx vitest run
Tests  15 passed (15)

# Vite build (Phase 2d)
npx vite build
dist/index.html                   0.41 kB │ gzip:   0.29 kB
dist/assets/index-BUE2ICXj.css    7.14 kB │ gzip:   1.75 kB
dist/assets/index-D6OhiBk9.js   482.46 kB │ gzip: 154.86 kB
✓ built in 1.18s
```

## Directory Structure

```
RFDGameStudio/
  games/horse_racing/          — canonical game files
    data.yaml
    ui.yaml                    — line 168 bug FIXED in Phase 2
    logic.lua
    systems.yaml               — Phase 3: ECS manifest / Phase 2d: updated
  studio_mcp/                  — Phase 3 MCP server
    __init__.py
    session_store.py
    tools.py
    server.py
  studio/                      — Phase 1 Python runtime (frozen)
    __init__.py
    loader.py
    validator.py
    executor.py
    runtime.py
  ts/                          — Phase 2 TypeScript runtime
    index.html
    package.json
    vite.config.ts
    tsconfig.json
    src/
      main.tsx
      App.tsx
      index.css
      fengari-web.d.ts
      engine/
        types.ts
        loader.ts
        executor.ts
        runtime.ts
      components/
        StableTab.tsx
        BettingTab.tsx
        BreederTab.tsx
        RaceTrack.tsx       — Phase 2c: animated 6-lane track
        SVGRacer.tsx        — Phase 2c: horse+jockey SVG sprite
    tests/
      test_loader.ts            — 5 tests
      test_executor.ts          — 3 tests
      test_runtime.ts           — 4 tests
    dist/                       — production build output
  tests/                        — Python tests
    __init__.py
    fixtures/horse_racing/
    test_loader.py
    test_executor.py
    test_runtime.py
    test_studio_mcp.py         — Phase 3: 7 MCP tool tests
  docs/adr/ADR-001…ADR-006
  docs/state/current.md
  requirements.txt
  README.md
```

## Phase Roadmap

| Phase | Title | Status |
|---|---|---|
| **1** | Python Runtime Core | ✅ **CERTIFIED** |
| **2** | TypeScript Runtime | ✅ **CERTIFIED** |
| **2b** | Horse Racing Logic Extraction | ✅ **CERTIFIED** |
| **2c** | Race Animation | ✅ **CERTIFIED** |
| **2d** | Gap Closure | ✅ **CERTIFIED** |
| **2e** | Full Example Parity | ✅ **CERTIFIED** |
| **2f** | Architecture Migration | ✅ **CERTIFIED** |
| **2r** | Horse Racing Features | ✅ **CERTIFIED** |
| **3** | Claude Tool Integration | ✅ **CERTIFIED** |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |
