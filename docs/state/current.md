# RFDGameStudio — Project State

*Last updated: July 2026*

## Current Phase

**Phase 2 — TypeScript Runtime Core — CERTIFIED**

## Phase 2 Completion Criteria

| Criterion | Status |
|---|---|
| `games/horse_racing/ui.yaml` line 168 bug fixed (canonical) | ✅ |
| `tests/fixtures/horse_racing/ui.yaml` same fix applied | ✅ |
| Python floor: `uv run pytest -v` → 15 passed, 0 failed, 0 skipped | ✅ |
| `ts/` scaffolded: `package.json`, `vite.config.ts`, `tsconfig.json` | ✅ |
| `ts/src/engine/` — `types.ts`, `loader.ts`, `executor.ts`, `runtime.ts` | ✅ |
| `ts/src/` — `App.tsx`, `main.tsx`, `index.css` | ✅ |
| `ts/src/components/` — `StableTab.tsx`, `BettingTab.tsx`, `RaceTrack.tsx` | ✅ |
| `ts/tests/` — 12 named Vitest tests | ✅ |
| `npx vitest run` → 12 passed, 0 failed, 0 skipped | ✅ |
| `npx vite build` → exits 0, 3 assets emitted | ✅ |
| All game logic in Lua; React components contain no game logic | ✅ |
| `docs/state/current.md` updated to Phase 2 certified | ✅ |

## Proof Output

```
# Python floor (Phase 1 — unchanged)
uv run pytest -v
15 passed in 0.21s

# TypeScript floor (Phase 2)
npx vitest run --reporter=verbose

 ✓ tests/test_executor.ts (3)
   ✓ test_executor_call_returns_value
   ✓ test_executor_missing_function_throws
   ✓ test_executor_lua_error_throws
 ✓ tests/test_loader.ts (5)
   ✓ test_loader_returns_game_files
   ✓ test_loader_parses_game_id
   ✓ test_loader_parses_ui_tabs
   ✓ test_loader_logic_is_string
   ✓ test_loader_missing_game_id_throws
 ✓ tests/test_runtime.ts (4)
   ✓ test_runtime_load_game_returns_session
   ✓ test_runtime_call_delegates_to_executor
   ✓ test_runtime_get_schema_returns_fields
   ✓ test_runtime_get_schema_missing_throws
Tests 12 passed (12)

# Vite build
npx vite build
dist/index.html                   0.41 kB
dist/assets/index.css             5.31 kB
dist/assets/index.js            449.63 kB
✓ built in 1.30s
```

## Directory Structure

```
RFDGameStudio/
  games/horse_racing/          — canonical game files
    data.yaml
    ui.yaml                    — line 168 bug FIXED in Phase 2
    logic.lua
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
        RaceTrack.tsx
    tests/
      test_loader.ts            — 5 tests
      test_executor.ts          — 3 tests
      test_runtime.ts           — 4 tests
    dist/                       — production build output
  tests/                        — Python tests (Phase 1)
    __init__.py
    fixtures/horse_racing/
    test_loader.py
    test_executor.py
    test_runtime.py
  docs/adr/ADR-001…ADR-005
  docs/state/current.md
  requirements.txt
  README.md
```

## Phase Roadmap

| Phase | Title | Status |
|---|---|---|
| **1** | Python Runtime Core | ✅ **CERTIFIED** |
| **2** | TypeScript Runtime | ✅ **CERTIFIED** |
| 3 | Claude Tool Integration | Pending |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |
