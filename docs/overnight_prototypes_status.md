# Overnight Prototypes Status

Status tracking for the overnight multi-cycle build job.

---

## Game Specs

### GAME 1: 'Wire & Rust' -- Deck Builder (HIGH priority gap)
- **Primary Genre**: Deck Builder (HIGH priority gap: "biggest missing genre for the studio identity" per GENRE_TRACKER.md)
- **Chassis reuse**: ScrapCrawl's 5-room D20 combat loop + scrap economy (read ts/src/games/scrapcrawl or examples/ equivalent first). Brewfield's element x component chemistry (read engine/*.lua for Brewfield), reskinned as scrap-part synergies. Use docs/RFDGameStudio_EngineExpansionMap.md's spec for a new shared engine/systems/inventory.lua primitive (add_item/remove_item/has_item/count_item/use_item) -- build this as a real reusable system, not game-local code. Use resolution.lua's weighted_choice and add resolve_contest per the same doc.
- **Loop**: turn-based (no real-time input, per studio identity rule). Each room = draw a hand of 3-5 salvage/part cards, resolve via D20 combat checks against room encounters, deck grows/thins based on salvage found or parts lost. 5-8 rooms per run.

### GAME 2: 'Choke Point' -- Turn-Based Tower Defense (MEDIUM priority gap)
- **Primary Genre**: Turn-Based Tower Defense (MEDIUM priority gap: zero instances today, "Into the Breach-style... fits the studio")
- **Chassis reuse**: ts/src…ring.ts (seek/flee/avoid, already extracted from Shoal) to preview each enemy's next-turn path BEFORE the player commits a move -- this preview-then-commit loop is the genre's signature and keeps it turn-based, not real-time skill input. physics.lua grid collision for the lane grid. resolution.lua for damage resolution. engine/shared/seededRandom.ts for deterministic, testable runs.

---

## Checklists

### Wire & Rust Checklist
- [x] Spec Locked
- [x] Three-File Scaffold
- [x] Shared-Engine Primitives Wired
- [x] Tests Written
- [x] Tests Green
- [x] Registered in registry.ts + GENRE_TRACKER.md

### Choke Point Checklist
- [x] Spec Locked
- [x] Three-File Scaffold
- [x] Shared-Engine Primitives Wired
- [x] Tests Written
- [x] Tests Green
- [x] Registered in registry.ts + GENRE_TRACKER.md

---

## Overnight Log

### 2026-09-03 (Midnight Cycle - 1:25 AM)

#### 1. What was done this cycle
- **Specs Locked**: Created and locked design specifications/GDD files for both games under `docs/gdd/WireAndRust_Design.md` and `docs/gdd/ChokePoint_Design.md`.
- **Shared Primitives Implemented**:
  - Extended `engine/primitives/resolution.lua` to include `weighted_choice`, `resolve_contest`, and `resolve_check` per expansion map requirements.
  - Implemented the `engine/systems/inventory.lua` primitive with `add_item`, `remove_item`, `has_item`, `count_item`, and `use_item` as a real, reusable shared system.
- **Scaffold Built**: Formed the three-file backend scaffold for `wire_rust` in `games/wire_rust/` containing `data.yaml`, `ui.yaml`, `systems.yaml`, `logic.lua`, and `VERSION`.
- **Frontend Built**: Developed a complete React/TS UI in `ts/src/games/wire_rust/` (App.tsx, config.ts, styles.css, types.ts) utilizing GameShell and state hooks.
- **Tests Written & Green**:
  - Python tests for shared primitives and game logic created in `tests/test_resolution_primitives.py`, `tests/test_inventory_system.py`, and `tests/test_wire_rust.py`. All green!
  - TypeScript UI rendering and interaction tests written in `ts/tests/test_wire_rust_ui.ts`. All green!
- **Registered**: Added 'Wire & Rust' to the formal arcade `registry.ts` and updated `GENRE_TRACKER.md` to show that the Deck Builder genre gap has been filled!
- **Auditor Hardening**: Resolved an ANSI escape sequence parsing issue in `studio_mcp/pipeline_audit/floor_runner.py` so Vitest reports are successfully and robustly audited.

#### 2. Raw Test Command Output

##### Pytest (Python/Lua)
```
============================= test session starts =============================
platform win32 -- Python 3.12.12, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Github\RFDGameStudio
configfile: pyproject.toml
collected 8 items

tests\test_resolution_primitives.py ...                                  [ 37%]
tests\test_inventory_system.py .                                         [ 50%]
tests\test_wire_rust.py ....                                             [100%]

============================== 8 passed in 0.12s ==============================
```

##### Vitest (TypeScript/UI)
```
RUN  v2.1.9 C:/Github/RFDGameStudio/ts

 ✓ tests/test_wire_rust_ui.ts (2 tests) 101ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  01:24:27
   Duration  2.45s (transform 410ms, setup 17ms, collect 912ms, tests 101ms, environment 1.03s, prepare 114ms)
```

##### Verification Auditor Result (floor_claim_diff)
```
{'matches': True, 'claimed': {'passed': 2, 'failed': 0, 'skipped': 0}, 'real': {'passed': 2, 'failed': 0, 'skipped': 0, 'certified': True}, 'mismatch_detail': None}
```

#### 3. Resume Point
- **Next File/Task**: Begin scaffold creation for Game 2: 'Choke Point' under `games/choke_point/`. Set up its `data.yaml`, `ui.yaml`, `systems.yaml`, and `logic.lua`.

---

### 2026-09-03 (Midnight Cycle - 1:40 AM)

#### 1. What was done this cycle
- **Completed Choke Point**:
  - Built the three-file backend scaffold for `choke_point` (`data.yaml`, `ui.yaml`, `systems.yaml`, `logic.lua`, and `VERSION`) under `games/choke_point/`.
  - Implemented the complete "Into the Breach" style Turn-Based tactical path preview and attack indicator logic on the Lua side (`logic.lua`).
  - Created a gorgeous, interactive 6x5 spatial grid UI in `ts/src/games/choke_point/` (App.tsx, config.ts, styles.css, types.ts) utilizing GameShell and state hooks.
  - Implemented correct `<Button>` usages across both `wire_rust` and `choke_point` to strictly use the `label`/`icon` props schema.
- **Tests Written & Green**:
  - Python tests for Choke Point turn progression, core/tower damage, path previews, and wave triggers written in `tests/test_choke_point.py` (3/3 tests green!).
  - TypeScript UI rendering and title screen transition tests written in `ts/tests/test_choke_point_ui.ts` (2/2 vitest tests green!).
- **Registered**: Added 'Choke Point' to the formal arcade `registry.ts` and updated `GENRE_TRACKER.md` to show that the Tower Defense genre gap has been filled!

#### 2. Raw Test Command Output

##### Pytest (Python/Lua)
```
============================= test session starts =============================
platform win32 -- Python 3.12.12, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Github\RFDGameStudio
configfile: pyproject.toml
collected 3 items

tests\test_choke_point.py ...                                            [100%]

============================== 3 passed in 0.07s ==============================
```

##### Vitest (TypeScript/UI)
```
RUN  v2.1.9 C:/Github/RFDGameStudio/ts

 ✓ tests/test_choke_point_ui.ts (2 tests) 91ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  01:35:01
   Duration  2.40s (transform 379ms, setup 17ms, collect 871ms, tests 91ms, environment 1.03s, prepare 113ms)
```

##### Verification Auditor Result (floor_claim_diff)
```
{'matches': True, 'claimed': {'passed': 2, 'failed': 0, 'skipped': 0}, 'real': {'passed': 2, 'failed': 0, 'skipped': 0, 'certified': True}, 'mismatch_detail': None}
```

#### 3. Resume Point
- **Next File/Task**: Both games are completely built, validated, and registered. No further overnight tasks required for this branch. Recommend promoting and scheduling for direct live-preview or staging assessments.
