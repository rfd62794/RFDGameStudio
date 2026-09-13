> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Repository Audit: rpgCore

## 1. Full Directory Inventory

**`.github`**
Contains standard GitHub Actions workflows, PR templates, and configuration for CI/CD pipelines. Essential for automated testing and deployment.

**`assets`**
Houses game assets including configurations (`configs/`) and entity definitions (`entities/`). It serves as the primary resource bundle for visual and data-driven aspects of the applications.

**`data`**
Used for storing local persisting data. Likely contains JSON, Parquet, or SQLite files generated during runtime or testing for saving game state and telemetry.

**`docs`**
The knowledge base of the repository. It is heavily populated with ADRs, phase summaries, visionary manuals, and system documentation. It shows a history of heavy specification and architectural pivoting.

**`godot_project`**
Evidence of a previous or ongoing attempt to port or integrate the game logic with the Godot engine. Includes C# rendering scripts and Godot scene files.

**`legacy_logic_extraction`**
A quarantine zone for older scripts and logic that have been extracted from the main codebase, kept around for reference rather than active execution.

**`logs`**
Contains runtime logs, test outputs (`test_combat.log` etc.), and build logs. Acts as the primary sink for the Loguru output map.

**`rust`**
Holds the Rust source code for performance-critical components. Designed to be compiled into Python extensions using PyO3/Maturin.

**`scripts`**
A collection of standalone utilities and automation scripts, ranging from environment setup to deployment and maintenance tasks.

**`src`**
The core Python implementation. It is heavily subdivided into `apps`, `demos`, `dgt_engine`, `game_engine`, `foundation`, and `shared`. This is where all active execution originates.

**`tests`**
The comprehensive test suite containing unit, integration, and performance tests for the various engines and apps. Powered by `pytest`.

**`tools`**
Developer-centric utilities, potentially parsing tools or artifact generators used outside the main runtime applications.

---

## 2. Demo Status

**`slime_clan` (desktop PyGame app)**
*Status: Active / Playable Prototype*
Highly developed with a clear entry point (`run_overworld.py` / `app.py`). Contains functional `auto_battle`, `factions`, `colony` systems, and a `territorial_grid`. Actively guided by `SESSION_PROTOCOL.md`.

**`space` / Asteroids Clone / TurboScout**
*Status: Fragmented / Experimental*
A massive sandbox of exploratory scripts (`asteroids_clone_sdk.py`, `tournament_mode.py`, `cultural_evolution.py`, `sentient_scavenger.py`). It acts more as a testbed for AI/evolution mechanics rather than a cohesive game. 

**`tycoon`**
*Status: UI/Dashboard Prototype*
Found in `src/apps/tycoon`. Appears to be a management simulation interface with a prominent `dashboard.py`. Functional UI, but likely dependent on external logic.

**`rpg`, `sandbox`, `space_combat` (in `src/demos`)**
*Status: Skeleton / Abandoned*
These exist purely as empty folder structures with `__init__.py` and empty `scenarios/` directories. No actual implementation is present here.

---

## 3. Duplicate Systems

The repository suffers from severe "Not Invented Here" duplication across its architectural layers:

*   **Factions:** Implemented independently in `apps/slime_clan/factions.py`, `dgt_engine/logic/faction_system.py`, and `shared/world/faction.py`.
*   **Entities:** Massively fragmented. Exists in `apps/space/entities/space_entity.py`, `dgt_engine/foundation/interfaces/entity_protocol.py`, `dgt_engine/systems/body/systems/entity_manager.py`, `game_engine/systems/body/entity_manager.py`, and `game_engine/foundation/asset_system/entity_templates.py`.
*   **Physics:** Duplicated between `apps/space/space_physics.py` and `dgt_engine/systems/race/physics_engine.py`.

---

## 4. Docs Folder Audit

*   **`ASTEROIDS_CSHARP_PORT_PLAN.md`**: Plan for transitioning space logic to C# (Redundant if sticking to Python).
*   **`COLONY_SYSTEM.md`**: Architecture for the Slime Clan colony mechanics.
*   **`COMPONENT_ANALYSIS.md`**: Breakdown of engine components.
*   **`DEPLOYMENT_LOCK_v1.0.md`**: Deployment safety protocols.
*   **`ENGINE_AUDIT.md`**: A previous, potentially outdated audit of the engine.
*   **`GODOT_CSHARP_COMPATIBILITY_ASSESSMENT.md`**: Godot C# migration notes.
*   **`GODOT_SETUP_GUIDE.md`**: Guide for setting up Godot.
*   **`IMPLEMENTATION_DECISION_TREE.md`**: Logic flow for architectural choices.
*   **`INVENTORY.md`**: Massive dump of Python file summaries (Outdated quickly).
*   **`MILESTONES.md`**: Project milestones and tracking.
*   **`PHASE_D_REFACTORING_SUMMARY.md` & `PHASE_E_IMPLEMENTATION_ROADMAP.md`**: Historical phase roadmaps (Likely outdated).
*   **`README_ADR_BREAKDOWN.md`, `README_CURRENT_STATUS.md`, `README_LAUNCH.md`**: Fragmented README shards (Contradictory/Redundant; should be unified).
*   **`ROADMAP.md`**: Active session task plan for Slime Clan.
*   **`SCENE_MANAGER.md`**: Contact for scene transitions in Slime Clan.
*   **`SESSION_2026_02_14_SUMMARY.md` & `SESSION_PROTOCOL.md`**: Session logs and strict instructions for Slime Clan context.
*   **`STATE.md`**: High-level repository state (Likely redundant with this Audit).
*   **`SYSTEM_MANUAL.md`**: Manual for the "Sovereign Scout" system (space demo related).
*   **`TECHNICAL_VISIONARY_SUMMARY.md`**: Overarching goals of the repository.
*   **`TECH_DEBT.md`**: List of known issues and debt.
*   **`TURBOSHELLS_AUDIT_REPORT.md`**: Legacy audit for a "TurboShells" application.
*   **`VISION.md`**: The North Star document for Slime Clan.
*   **`VERSION.md`**: Documentation for DGT Platform v1.0.

---

## 5. Engine Coherence

The engine is highly fragmented. Instead of a single unified core, it is pulled apart across three distinct philosophy boundaries:

1.  **`shared/`**: Seems to be a primitive attempt at shared game logic (combat, world, rendering).
2.  **`dgt_engine/` (DuggerCore Git Tools Platform)**: A heavy, likely over-architected framework focusing on data-driven states and tooling. It implements its own logic, factions, interfaces, and physics.
3.  **`game_engine/`**: Another entirely separate engine layer containing foundation, godot integrations, asset systems, and core systems (body/entity managers).

There is zero unification. `shared`, `dgt_engine`, and `game_engine` actively compete to provide the same foundational components (Entities, Factories, Systems), meaning demos are hardcoded to specific engine layers rather than a unified core.

---

## 6. The Honest Summary

### What's Solid
The `slime_clan` application. It has a clear entry point, active documentation (`VISION.md`, `SESSION_PROTOCOL.md`), and playable mechanics. It relies on the engine successfully. The build pipeline and tests (via `uv run pytest`) appear operational and enforced.

### What's Fragmented
The Core Engine. The presence of `shared`, `game_engine`, and `dgt_engine` represents a catastrophic failure of DRY principles. Systems like entities, factions, and physics are redefined constantly based on whatever app or paradigm was in focus at the time. The documentation is similarly fragmented into endless `PHASE` and `README` shards.

### What Should Be Archived
1. The entire `src/demos` folder (empty skeletons).
2. `src/apps/space` (unless actively being ported to C#, it is a sprawling mess of experiments).
3. The multiple `README_*.md` shards, old `PHASE_*.md` files, and `INVENTORY.md` which bloat the knowledge base.
4. The competing engine bases. A strict decision must be made to consolidate `dgt_engine` and `game_engine` or archive one entirely.
