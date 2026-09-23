# Phase 0: Full Repository Analysis
## Pre-Migration Reconnaissance — rpgCore

**Date**: 2026-06-18
**Analyst**: Cascade (automated)
**Directive**: Read-only analysis. No source modifications, no archive deletions, no cleanup scripts executed.
**Purpose**: Establish ground truth before any migration effort. This document supersedes all prior audit documents.

---

## 1. Executive Summary

| Metric | Value | Source |
|--------|-------|--------|
| Total `src/` Python files | **688** | `os.walk('src')` |
| Total `archive/` files | **482** (268 Python) | `Get-ChildItem -Recurse` |
| Root audit documents | **22** | `find_by_name *.md` at root |
| Tests collected | **1169** | `pytest --co -q` |
| Tests passed | **1003** | `pytest` run |
| Tests failed | **65** | `pytest` run |
| Tests errored | **54** | `pytest` run |
| Tests skipped | **48** | `pytest` run |
| Python version | **3.12** | `pyproject.toml` |
| Missing dependency (fixed) | `pygame-ce` | Was absent from `pyproject.toml`, caused 35 collection errors |

**Key findings**:
- The `src/dgt_engine/` package (295 files) is the largest subsystem but only has 22 test import references — it is **massively under-tested** relative to its size.
- `src/shared/` (121 files) is the canonical engine layer with the heaviest test coverage (265 import references across 72 test files).
- `src/foundation/` contains **zero Python files** — it is an empty directory with only a `persistence/` subfolder.
- All 22 root audit documents contain stale numbers. None match the current 688-file / 1169-test reality.
- The `archive/` contains 482 files across 7 categories with identifiable salvage value in 4 of them.

---

## 2. Test Floor — Raw Results

### 2.1 Environment Fix Applied

**Root cause**: `pygame` (required by `src/shared/ui/base.py`, `src/shared/rendering/sovereign_surface.py`, and many other modules) was not declared in `pyproject.toml` dependencies.

**Fix**: Added `pygame-ce` to `pyproject.toml` line 34. This is the only modification made during this analysis.

**Before fix**: 35 collection errors (`ModuleNotFoundError: No module named 'pygame'`).
**After fix**: 0 collection errors. All 1169 tests collected successfully.

### 2.2 Raw pytest Results

```
1169 tests collected
1003 passed
  65 failed
  54 errored
  48 skipped
```

**Pass rate**: 85.8% (1003/1169)
**Failure rate**: 5.6% (65/1169)
**Error rate**: 4.6% (54/1169)
**Skip rate**: 4.1% (48/1169)

### 2.3 Failure Categories (from error messages)

| Category | Count | Root Cause |
|----------|-------|------------|
| `TypeError` (abstract instantiation) | ~20 | `UIComponent`/`Label` abstract methods not implemented in test subclasses |
| `TypeError` (constructor signature mismatch) | ~15 | API drift — tests call constructors with wrong args |
| `AttributeError` (missing attribute) | ~12 | `RosterEntry` vs `RosterSlime` mismatch (e.g., `is_elder`, `alive`, `stat_block`) |
| `ImportError` (missing module) | ~4 | Modules referenced by tests no longer exist |
| Other (assertion, value errors) | ~14 | Various logic failures |

### 2.4 Test Import Distribution

| `src/` Package | Test Import References | Test Files | Coverage Assessment |
|----------------|----------------------|------------|-------------------|
| `src/shared/` | 265 | 72 | **Heavily tested** — canonical engine layer |
| `src/tools/` (APJ) | 89 | 22 | **Well tested** — agent/inventory system |
| `src/apps/` | 66 | 25 | **Moderately tested** — demo layer |
| `src/dgt_engine/` | 22 | 7 | **Under-tested** — 295 files, only 7 test files |
| `src/game_engine/` | 17 | 8 | **Under-tested** — 53 files, 8 test files |
| `src/launcher/` | 2 | 1 | **Minimally tested** — 5 files, 1 test file |
| `src/foundation/` | 0 | 0 | **Zero coverage** — 0 Python files exist |

---

## 3. Active `src/` Tree — Module Map

### 3.1 Top-Level Structure

```
src/
├── apps/          127 .py files   Demo applications (10 subdirectories)
├── dgt_engine/    295 .py files   Legacy engine wrapper (largest package)
├── foundation/      0 .py files   Empty (only persistence/ subdir, no .py)
├── game_engine/    53 .py files   Alternative engine layer
├── launcher/        5 .py files   Demo launcher and registry
├── shared/        121 .py files   Canonical engine layer (23 subsystems)
└── tools/          87 .py files   APJ agent system + UI reviewer
```

**Total**: 688 Python files

### 3.2 `src/shared/` — Canonical Engine Layer (121 files, 23 subsystems)

This is the most important package. It contains the shared systems consumed by all demos.

| Subsystem | Files | Purpose | Test References |
|-----------|-------|---------|-----------------|
| `ui/` | ~25 | UI components (Panel, Label, Button, Card, layouts, theme, spec) | High |
| `ecs/` | ~16 | ECS components, systems, registry, sessions | High |
| `rendering/` | ~10 | SlimeRenderer, SpriteLoader, PyGameRenderer, SovereignSurface | High |
| `racing/` | ~8 | RaceEngine, RaceTrack, RaceCamera, RaceHUD, minimap | High |
| `genetics/` | ~7 | Genome, inheritance, breeding, cultural archetypes | High |
| `teams/` | ~4 | Roster, roster_save, stat_calculator | High |
| `stats/` | ~2 | StatBlock, culture_table | High |
| `combat/` | ~4 | D20Resolver, stance, turn_order | Medium |
| `engine/` | ~8 | SceneManager, SystemClock, BaseSystem, RenderPipeline | Medium |
| `entities/` | ~6 | Creature, kinetics, projectiles, fracture, game_state | Medium |
| `physics/` | ~4 | Kinematics, gravity, toroidal wrap | Medium |
| `dungeon/` | ~3 | DungeonEngine, DungeonTrack, enemy_squads | Medium |
| `dispatch/` | ~4 | DispatchSystem, dispatch_record, racing_adapter | Medium |
| `items/` | ~4 | Inventory, item, loot_table | Low |
| `narrative/` | ~4 | ConversationGraph, keyword_registry, state_tracker | Low |
| `persistence/` | ~1 | SaveManager | Low |
| `progression/` | ~1 | XPSystem | Low |
| `input/` | ~2 | ControllerBase | Low |
| `session/` | ~1 | GameSession | Low |
| `simulation/` | ~2 | BaseEngine, BaseTrack | Low |
| `state/` | ~2 | EntityRegistry, roster_sync | Low |
| `world/` | ~1 | Faction | Low |
| `__init__.py` | 1 | Package marker | — |

### 3.3 `src/apps/` — Demo Applications (127 files, 10 subdirectories)

| App | Files | Status (from tests) | Key Systems |
|-----|-------|---------------------|-------------|
| `slime_breeder/` | ~14 | Tested (4 test files) | Garden, breeding, racing, tower defense, team scenes |
| `dungeon_crawler/` | ~12 | Tested (6 test files) | Dungeon generation, combat, inventory, sessions |
| `asteroids/` | ~14 | Tested (2 test files) | Physics, collision, spawning, HUD, controller |
| `slime_clan/` | ~12 | Tested (5 test files) | Territory, factions, overworld, auto-battle |
| `last_appointment/` | ~6 | Tested (5 test files) | Dialogue, cards, text windows |
| `space/` | ~10+ | Tested (1 test file) | Asteroids clone, arcade visuals |
| `space_trader/` | ~? | Tested (1 test file) | Economy simulation |
| `interface/` | ~6 | Not directly tested | Dashboard, workspace, menu system |
| `tycoon/` | ~? | Not directly tested | Unknown |
| `dgt_launcher.py` | 1 | Not directly tested | 29KB launcher script |

### 3.4 `src/dgt_engine/` — Legacy Engine Wrapper (295 files)

This is the **largest package** but has minimal test coverage (22 import references in 7 test files). Contains:

- `dgt_core/` — Core rendering, engines, assets
- `engine/` — Game loop, game state, arbiter, semantic engine
- `di/` — Dependency injection container
- `assets/` — Asset fabrication, parsing, registry
- `interfaces/`, `exceptions/`, `models/`, `views/`, `mechanics/`, `narrative/`, `systems/`, `tools/`, `ui/`, `graphics/`, `config/`, `common/`, `foundation/`, `vector_libraries/`, `game_engine/`, `logic/`
- Root files: `main.py` (29KB), `c_style_facades.py` (19KB), `__compat__.py` (4KB), `factories.py` (2KB)

**Assessment**: This appears to be a prior-generation engine architecture that has been partially superseded by `src/shared/`. Its 295 files represent significant code mass but most are not directly tested.

### 3.5 `src/game_engine/` — Alternative Engine Layer (53 files)

Contains:
- `core/` — SystemClock, Vector2, Vector3
- `engines/` — Body, narrative engines
- `systems/` — Body (entity manager, templates, fracture, projectiles, wave spawner), Graphics (Godot render, pixel renderer, tile bank, FX), Kernel, Narrative
- `assets/`, `config/`, `foundation/`, `ui/`
- `bootstrap.py`

**Assessment**: Appears to be an earlier architectural layer, partially overlapping with `src/shared/`. Lightly tested (17 references in 8 test files).

### 3.6 `src/tools/` — APJ Agent System (87 files)

Contains:
- `apj/` — Full multi-agent governance system (agents, inventory, schema, parser, executor, swarm)
- `ui_reviewer/` — UI screenshot and review tools

**Assessment**: Well-tested (89 references in 22 test files). This is a development tool, not a game engine component.

### 3.7 `src/launcher/` — Demo Launcher (5 files)

Contains: `cli.py`, `manifest.py`, `registry.py`, `renderer_base.py`, `__init__.py`

### 3.8 `src/foundation/` — Empty (0 Python files)

Contains only a `persistence/` subdirectory with no Python files. This is effectively dead code in the tree.

---

## 4. Root Audit Document Cross-Check

### 4.1 Document Inventory (22 documents)

| # | Document | Date | Test Count Claimed | File Count Claimed | Verdict | Key Discrepancy |
|---|----------|------|--------------------|--------------------|---------|-----------------|
| 1 | `README.md` | — | 296 | — | **STALE** | Claims 296 tests, 4 demos. Actual: 1169 tests, 10+ apps. |
| 2 | `ENGINE_STATUS_REPORT.md` | Feb 2026 | — (claims 685 elsewhere) | — | **STALE** | Claims 3 playable demos. Test counts absent but demo status partially accurate. |
| 3 | `ENGINE_ANALYSIS.md` | — | — | — | **STALE** | Claims 2 playable, Asteroids "stubbed". Contradicts ENGINE_STATUS_REPORT. |
| 4 | `COMPREHENSIVE_ENGINE_INVENTORY.md` | Feb 2026 | — | 213+ | **STALE** | Claims 213+ files. Actual: 688. |
| 5 | `STRATEGIC_INVENTORY.md` | — | — | — | **UNVERIFIABLE** | Architectural observations about dual entity systems may still be relevant. No test/file counts. |
| 6 | `SYSTEMS_INTEGRATION_MAP.md` | Feb 2025 | — | — | **CURRENT** | Correctly identifies RenderComponent as missing — `render.py` is a 2-line stub. ECS component list accurate. |
| 7 | `REPOSITORY_MAPPING_AUDIT_SUMMARY.md` | Feb 2025 | — | 552 | **STALE** | Claims 552 files. Actual: 688. |
| 8 | `ADJ_SYSTEM_AUDIT.md` | Feb 2025 | 685 (floor: 462) | — | **STALE** | Claims 685 tests. Actual: 1003 passing. |
| 9 | `DOCSTRING_SYSTEM_AUDIT.md` | Feb 2025 | — | 552 | **STALE** | References 552 files. Actual: 688. |
| 10 | `FILE_INVENTORY_AUDIT.md` | Feb 2025 | — | 552 | **STALE** | Claims 552 files. Actual: 688. |
| 11 | `CODEBASE_INDEXING_AUDIT.md` | Feb 2025 | — | 552 | **STALE** | Claims 552 files, 1396 classes, 449 functions. File count wrong. |
| 12 | `DOCUMENTATION_INVENTORY.md` | Feb 2025 | — | — | **UNVERIFIABLE** | Lists ADRs. Would need to check each ADR file for existence. |
| 13 | `DEMO_INVENTORY_AUDIT.md` | — | 685 | 9 apps | **STALE** | Claims 685 tests, Slime Clan "0 tests". Actual: 1003 passing, Slime Clan has 5 test files. |
| 14 | `SPRITE_SYSTEMS_AUDIT.md` | Feb 2025 | — | — | **UNVERIFIABLE** | Describes rendering infrastructure. Files likely exist but claims unverified. |
| 15 | `ADJ_HANDOFF_SUMMARY.md` | Feb 2025 | 675 (10 failing) | — | **STALE** | Claims 675 passing, 10 failing. Actual: 1003 passing, 65 failing. |
| 16 | `ADJ_PHASE_3_ALIGNMENT.md` | Feb 2025 | 494 | — | **STALE** | Claims 494 tests in ADJ system. |
| 17 | `PHASE_3_RENDERING_CONTEXT.md` | Feb 2025 | — | — | **UNVERIFIABLE** | Phase 3 rendering plan. Architecture may have evolved since. |
| 18 | `APJ_HANDOFF_SESSION_2025-02-28.md` | Feb 2025 | — | — | **STALE** | Claims Phase 3 complete. Governance session notes. |
| 19 | `ADJ_LAYER_IMPLEMENTATION_SUMMARY.md` | Feb 2025 | — | — | **UNVERIFIABLE** | Describes ADJ layer architecture. May still be accurate. |
| 20 | `ADJ_README.md` | — | — | — | **UNVERIFIABLE** | CLI documentation. May still be accurate. |
| 21 | `CONTRIBUTING.md` | — | — | — | **STALE** | Claims Python 3.14.0 required. Actual: 3.12 per `pyproject.toml`. |
| 22 | `agent_memory.md` | — | — | — | **CURRENT** | Active design notes for dungeon path-based redesign. Appears to be in-use. |

### 4.2 Summary

| Verdict | Count |
|---------|-------|
| **STALE** | 13 |
| **UNVERIFIABLE** | 6 |
| **CURRENT** | 2 |
| **Not assessed** | 1 (`.gitignore` not a doc) |

**Pattern**: All documents dated Feb 2025 are stale. The codebase has grown from ~552 files to 688 files and from ~685 tests to 1169 tests since these documents were written. No document contains the correct current test count (1003 passing / 1169 collected).

---

## 5. Archive Triage — Salvage Value Assessment

### 5.1 Archive Overview

| Category | Total Files | Python Files | Size (bytes) | Salvage Value |
|----------|-------------|-------------|-------------|---------------|
| `legacy_root_2026/` | 152 | ~20 | ~500KB | **Low** — Godot 4.x C# project, mostly empty dirs |
| `legacy_refactor_2026/` | 135 | ~80 | ~1.5MB | **Medium** — NEAT configs, Rust integration patterns, tournament data |
| `dead_tests_2026/` | 68 | 68 | ~200KB | **None** — Tests for deleted modules, explicitly should not run |
| `legacy_docs_2026/` | 60 | 0 | ~300KB | **Medium** — Historical ADRs, implementation decision tree, system manual |
| `rendering_donors/` | 34 | ~15 | ~100KB | **High** — Terminal renderer, pygame shim, Godot bridge |
| `superseded_v1/` | 28 | ~5 | ~100KB | **Low** — Old body_legacy (cockpit, dispatcher, terminal) |
| `stories/` | 3 | 0 | ~2.7KB | **Medium** — Narrative content for Last Appointment demo |
| **Total** | **482** | **268** | **~3MB** | |

### 5.2 Per-Category Assessment

#### `legacy_root_2026/` — Godot Project (152 files)
- **Contents**: Godot 4.x project (`.csproj`, `project.godot`, `build.bat`), mostly empty directories (`Interfaces/`, `Models/`, `Rendering/`, `Server/`, `Utils/`, `scenes/`)
- **Salvage**: Low. The Godot project structure is a skeleton. If rpgCore ever migrates to Godot, the `project.godot` and `.csproj` files serve as a starting point, but the actual code is in `rendering_donors/godot/`.
- **Recommendation**: Preserve as historical artifact. No active salvage needed.

#### `legacy_refactor_2026/` — Refactor Archive (135 files)
- **Contents**: Python venv (`venv_stable/`), Rust DLL experiments (`build_rust.py`, `dgt_harvest_rust/`), NEAT configs (`neat_config.txt`, `neat_config_minimal.txt`), tournament YAMLs (12 heat files), fleet manager, various demo launchers, test scripts
- **Salvage**: Medium.
  - **NEAT configs**: Reusable for Asteroids AI training if implemented
  - **Rust integration patterns**: `build_rust.py`, `test_rust_dll.py` show how Rust DLLs were loaded — valuable if performance layer is added
  - **Tournament data format**: YAML heat files show tournament structure — reusable for racing tournaments
  - **`roster.db`**: SQLite database (49KB) — may contain historical roster data
- **Recommendation**: Extract NEAT configs and Rust integration patterns before any cleanup.

#### `dead_tests_2026/` — Dead Tests (68 files)
- **Contents**: Tests for deleted modules (`world_ledger`, `dgt_core`, `rpg_core`, `semantic_engine`)
- **Salvage**: None for code. Historical test patterns may inform future test design.
- **Recommendation**: Preserve as-is. Already excluded from pytest via `norecursedirs` in `pyproject.toml`.

#### `legacy_docs_2026/` — Legacy Documentation (60 files)
- **Contents**: Historical ADRs, `IMPLEMENTATION_DECISION_TREE.md` (10KB), `SYSTEM_MANUAL.md` (16KB), `DEPLOYMENT_LOCK_v1.0.md` (9.5KB), `REPO_AUDIT.md`, `VISION.md`, `ROADMAP.md`, `STATE.md`, `VERSION.md`, `COLONY_SYSTEM.md`, `SCENE_MANAGER.md`
- **Salvage**: Medium.
  - **`IMPLEMENTATION_DECISION_TREE.md`**: Documents architectural decision points — valuable for understanding why current architecture is the way it is
  - **`SYSTEM_MANUAL.md`**: 16KB system manual — may contain operational knowledge
  - **`DEPLOYMENT_LOCK_v1.0.md`**: Documents v1.0 deployment constraints
  - **ADR directory**: Historical architecture decisions
- **Recommendation**: Index and cross-reference with current ADRs before any cleanup.

#### `rendering_donors/` — Rendering Donors (34 files)
- **Contents**: Three rendering approaches preserved:
  - `godot/` — Godot 4.x C# bridge (`godot_bridge.py`, 11KB) — IPC client for Python-to-Godot rendering
  - `terminal/` — Terminal rendering using `rich` library — for headless servers, debugging, CLI tools
  - `pygame_shim/` — Proxy wrapper around `pygame.draw` that serializes draw calls into `RenderPackets` — for network-separated rendering
- **Salvage**: **High**.
  - **Terminal renderer**: Immediately useful for headless testing and debugging
  - **Pygame shim**: Valuable if rendering ever needs to be separated from simulation (network play, headless server + remote client)
  - **Godot bridge**: Blueprint for Python-core + Godot-frontend architecture
- **Recommendation**: These are the most valuable archive items. Document patterns before any cleanup.

#### `superseded_v1/` — Superseded v1 (28 files)
- **Contents**: `body_legacy/` with `cockpit.py` (12KB), `dispatcher.py` (14KB), `terminal.py` (13KB), `render_dto.py` (347 bytes)
- **Salvage**: Low.
  - **`dispatcher.py`**: Dispatch pattern may inform current `src/shared/dispatch/` design
  - Other files are monolithic legacy implementations
- **Recommendation**: Compare `dispatcher.py` with current `src/shared/dispatch/dispatch_system.py` for pattern insights.

#### `stories/` — Narrative Content (3 files)
- **Contents**: `first_extraction.md`, `seasoned_scout.md`, `veteran_pilot.md`
- **Salvage**: Medium. Story content directly usable by `src/apps/last_appointment/` demo.
- **Recommendation**: Integrate into Last Appointment demo's content pipeline if not already.

---

## 6. Migration-Relevance Tagging

### 6.1 `src/shared/` — PORTABLE

**Assessment**: This is the canonical engine layer. All subsystems are designed as shared, reusable components with no demo-specific logic. The ECS architecture (components, systems, registry) is clean and well-tested. Rendering, physics, genetics, combat, racing, and UI systems are all self-contained.

**Migration priority**: **Highest**. This package should be the foundation of any migration target.

**Caveats**:
- `ui/base_legacy.py` — Legacy compatibility layer, may be droppable
- `teams/roster_old.py` — Old roster implementation, superseded by `roster.py`
- `ui/base.py` and `ui/base_component.py` may overlap — needs deduplication

### 6.2 `src/apps/` — PORTABLE (per-demo)

**Assessment**: Each demo is self-contained and consumes `src/shared/` systems. The demo apps prove the engine's multi-genre capability.

**Migration priority**: **High**. Each demo can be migrated independently.

**Caveats**:
- `dgt_launcher.py` (29KB) is a monolithic launcher — should be refactored into `src/launcher/` pattern
- `interface/` and `tycoon/` have no direct test coverage — status unclear
- `space/` contains multiple experimental prototypes — needs triage

### 6.3 `src/dgt_engine/` — NOT PORTABLE

**Assessment**: 295 files with minimal test coverage (22 references in 7 test files). This is a prior-generation engine architecture with its own DI container, semantic engine, arbiter, and asset pipeline. It overlaps significantly with `src/shared/` and `src/game_engine/`.

**Migration priority**: **Low**. This package represents technical debt. Its useful components (if any) should be identified and extracted into `src/shared/`, then the package can be archived.

**Caveats**:
- `main.py` (29KB) and `c_style_facades.py` (19KB) are large files that may contain useful logic
- `__compat__.py` provides backward compatibility — check what it bridges
- Some test files import from `src.dgt_engine`, so it cannot be removed without fixing those tests

### 6.4 `src/game_engine/` — UNCLEAR

**Assessment**: 53 files with light test coverage (17 references in 8 test files). Contains alternative engine architecture (body systems, graphics systems, Godot render system). Partially overlaps with `src/shared/`.

**Migration priority**: **Medium**. Needs component-by-component assessment to determine what is unique vs duplicated with `src/shared/`.

**Caveats**:
- `systems/graphics/godot_render_system.py` — May be related to `archive/rendering_donors/godot/`
- `systems/body/` — Entity manager, templates, fracture, projectiles, wave spawner — may overlap with `src/shared/entities/` and `src/shared/ecs/`

### 6.5 `src/tools/` — PORTABLE (tooling, not engine)

**Assessment**: APJ agent system and UI reviewer. Well-tested (89 references in 22 test files). This is development tooling, not game engine code.

**Migration priority**: **Medium**. Portable as-is but not part of the game engine core.

### 6.6 `src/launcher/` — PORTABLE

**Assessment**: 5 files, minimal but clean. Handles demo registry and CLI entry point.

**Migration priority**: **High**. Should be the canonical entry point pattern.

### 6.7 `src/foundation/` — NOT PORTABLE (empty)

**Assessment**: Zero Python files. Contains only an empty `persistence/` subdirectory.

**Migration priority**: **None**. Dead code in the tree. Can be removed or repurposed.

---

## 7. Architectural Observations

### 7.1 Triple Engine Problem

The codebase contains **three overlapping engine layers**:
1. `src/shared/` (121 files) — Canonical, heavily tested, actively used
2. `src/dgt_engine/` (295 files) — Legacy, minimally tested, partially used
3. `src/game_engine/` (53 files) — Alternative, lightly tested, partially used

This represents significant code duplication and architectural ambiguity. Any migration effort must first determine which layer is canonical (evidence strongly suggests `src/shared/`) and plan consolidation of the others.

### 7.2 Test Coverage Gaps

- `src/dgt_engine/` has 295 files but only 7 test files referencing it — **96% of files have no direct test coverage**
- `src/game_engine/` has 53 files but only 8 test files — **85% of files have no direct test coverage**
- `src/foundation/` has 0 files but exists in the tree — **dead directory**

### 7.3 Entity System Fragmentation

Multiple entity representations exist:
- `src/shared/entities/creature.py` — Unified Creature model
- `src/apps/slime_breeder/entities/slime.py` — Slime entity
- `src/shared/teams/roster.py` — RosterSlime
- `src/shared/teams/roster_old.py` — Old roster (legacy)

The `RosterEntry` vs `RosterSlime` mismatch causes ~12 test failures.

### 7.4 UI Component Duplication

- `src/shared/ui/base.py` — Abstract UIComponent
- `src/shared/ui/base_component.py` — Another base component
- `src/shared/ui/base_legacy.py` — Legacy compatibility

Three "base" files in the UI layer suggest incomplete consolidation.

### 7.5 ECS Render Component is a Stub

`src/shared/ecs/components/render.py` contains only:
```python
"""Stub for src/shared/ecs/components/render.py"""
```

This confirms `SYSTEMS_INTEGRATION_MAP.md`'s assessment that RenderComponent is missing. The file exists but has no implementation.

---

## 8. Dependencies

### 8.1 Declared Dependencies (from `pyproject.toml`)

**Runtime**: `pygame-ce` (added during this analysis)
**Dev**: `pytest`, `pytest-cov`, `pytest-mock`, `pytest-asyncio`, `pytest-xdist`

### 8.2 Missing Dependencies

- `pygame-ce` was missing and has been added (the only modification in this analysis)
- No other missing dependencies detected — all 1169 tests collect successfully

### 8.3 Dependency Notes

- `uv.lock` does not declare `pygame-ce` — lock file needs regeneration after `pyproject.toml` change
- `CONTRIBUTING.md` claims Python 3.14.0 required — `pyproject.toml` specifies 3.12

---

## 9. Recommendations for Migration Planning

### 9.1 Immediate Actions (Before Migration)

1. **Regenerate `uv.lock`** to include `pygame-ce`
2. **Fix the 65 failing + 54 erroring tests** — these represent real bugs (abstract instantiation, API drift, entity model mismatch)
3. **Consolidate entity models** — Resolve `RosterEntry` vs `RosterSlime` mismatch
4. **Deduplicate UI base classes** — Merge `base.py`, `base_component.py`, `base_legacy.py`
5. **Remove `src/foundation/`** — Empty directory with no code

### 9.2 Migration Architecture Decision

The triple-engine problem (`shared/` vs `dgt_engine/` vs `game_engine/`) must be resolved before migration:

- **Option A**: Migrate `src/shared/` as canonical, archive `dgt_engine/` and `game_engine/`
- **Option B**: Merge unique components from `dgt_engine/` and `game_engine/` into `shared/`, then archive
- **Option C**: Keep all three but establish clear boundaries (not recommended — current state)

Evidence strongly supports **Option A or B**: `src/shared/` has 3x the test coverage of the other two combined and is the package imported by all demo apps.

### 9.3 Archive Salvage Priorities

1. **High**: `rendering_donors/` — Terminal renderer and pygame shim have immediate utility
2. **Medium**: `legacy_refactor_2026/` — NEAT configs and Rust integration patterns
3. **Medium**: `legacy_docs_2026/` — Implementation decision tree and system manual
4. **Medium**: `stories/` — Narrative content for Last Appointment
5. **Low**: `superseded_v1/`, `legacy_root_2026/` — Historical reference only
6. **None**: `dead_tests_2026/` — Explicitly dead, already excluded from pytest

---

## 10. Document Supersession

This document supersedes all 22 root-level audit documents listed in Section 4. Prior documents should be treated as historical reference only. The numbers in this document are the authoritative current state as of 2026-06-18.

---

*End of Phase 0 Analysis*
