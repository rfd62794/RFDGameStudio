# RFDGameStudio — Project State

*Last updated: June 2026*

## Current Phase

**Phase 2c — Race Animation — CERTIFIED**

## Phase 2c Completion Criteria

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
| Python floor: `uv run pytest -v` → **21 passed, 0 failed** (unchanged) | ✅ |
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
# Python floor (Phase 2c — unchanged)
uv run pytest -v
21 passed in 0.27s

# TypeScript floor (Phase 2c — unchanged)
npx vitest run
Tests  12 passed (12)

# Vite build
npx vite build
dist/index.html                   0.41 kB │ gzip:   0.29 kB
dist/assets/index-ClkC6YSK.css    6.23 kB │ gzip:   1.61 kB
dist/assets/index-q8LBqzjn.js   476.15 kB │ gzip: 153.23 kB
✓ built in 1.33s
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
        BreederTab.tsx
        RaceTrack.tsx       — Phase 2c: animated 6-lane track
        SVGRacer.tsx        — Phase 2c: horse+jockey SVG sprite
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
| **2b** | Horse Racing Logic Extraction | ✅ **CERTIFIED** |
| **2c** | Race Animation | ✅ **CERTIFIED** |
| 3 | Claude Tool Integration | Pending |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |
