# rpgCore Engine Audit
**Date:** 2026-02-21 (Session 017)
**Scope:** Read-only assessment of all systems outside `src/apps/slime_clan/`.

## Extraction Status (Session 018)
| Component | Source | Extracted To | Status |
|---|---|---|---|
| D20Resolver | `game_engine/engines/d20_core.py` | `src/shared/combat/d20_resolver.py` | ✅ Extracted, 11 tests |
| BaseSystem | `game_engine/foundation/base_system.py` | `src/shared/engine/base_system.py` | ✅ Extracted |
| SystemClock | `game_engine/core/clock.py` | `src/shared/engine/system_clock.py` | ✅ Extracted |
| NarrativeEngine | `dgt_engine/narrative/` | `src/shared/narrative/` | ✅ Extracted (Graph, Registry, Tracker) |
| RenderAdapters | `game_engine/engines/pygame_bridge.py` | `src/shared/rendering/` | ✅ Consolidated (Layers, Sprites, Fonts, Sovereign Surface) |

---

## `src/dgt_engine/` — DGT Autonomous Movie System

| Attribute | Detail |
|---|---|
| **What it does** | Service-Oriented Architecture (SOA) heartbeat controller running at 60 FPS. Manages scene configuration (tavern, forest, town), autonomous AI navigation, graphics rendering, narrative/persona engines, dependency injection, and a developer console. 786-line `main.py` orchestrates the full lifecycle. |
| **Key subsystems** | `engine/chronos.py` (time), `narrative/persona.py` (NPC personality), `systems/body/` (graphics), `ui/`, `views/`, `mechanics/`, `di/` (dependency injection), `config/` |
| **Test status** | Broken. 73+ test failures due to stale import paths from a namespace refactor. Tests exist but are quarantined to `tests/stress/`, `tests/verification/`, `tests/integration/`. |
| **Slime Clan relevance** | **High.** The heartbeat controller, scene manager pattern, and graphics engine are exactly what the Tech Debt doc calls for — a unified Scene Manager to replace the subprocess architecture. The DI container could wire services cleanly. |
| **Verdict** | **🟢 Integrate** — The scene manager and heartbeat loop are the foundation for replacing the multi-window subprocess hack. Graphics and UI subsystems could replace raw pygame calls. |

---

## `src/game_engine/` — Multi-Genre Game Engine

| Attribute | Detail |
|---|---|
| **What it does** | Layered engine framework with tiered architecture: Foundation (SystemClock, Vector2/3), Engines (D20Resolver, ChronosEngine, NarrativeEngine, SyntheticRealityEngine), Systems (AI, graphics, game logic, kernel, narrative), and rendering bridges (PyGame, Godot, Terminal). |
| **Key subsystems** | `core/clock.py` (SystemClock), `core/types.py` (Vector2/3), `engines/d20_core.py` (D&D dice resolver with advantage/disadvantage), `engines/pygame_bridge.py` (entity-based PyGame renderer), `engines/godot_bridge.py`, `systems/ai/`, `systems/game/`, `foundation/` (BaseSystem protocol) |
| **Test status** | Broken — same stale import issue as `dgt_engine`. Core logic appears sound. |
| **Slime Clan relevance** | **High.** `D20Resolver` could replace the flat `actor.attack - target.defense` damage formula with proper dice rolls, advantage/disadvantage, and saving throws. `SystemClock` is a clean delta-time manager. `pygame_bridge.py` is a rendering adapter pattern that could standardize how slime_clan draws frames. `BaseSystem` protocol defines the `initialize/tick/shutdown` lifecycle slime_clan already follows informally. |
| **Verdict** | **🟡 Extract** — D20Resolver, SystemClock, and BaseSystem are excellent shared components. Need cleanup of import paths before integration. The full engine is over-scoped for slime_clan but individual pieces are gold. |

---

## `src/foundation/` — Persistence Layer

| Attribute | Detail |
|---|---|
| **What it does** | Contains a single `persistence/` subdirectory. Likely save/load infrastructure. |
| **Test status** | Unknown — no dedicated tests found in active test path. |
| **Slime Clan relevance** | **Medium.** Squad loadout saving (Session 020), overworld node state persistence, and campaign progress will need a save system. |
| **Verdict** | **🟡 Extract** — Worth evaluating once save/load becomes a priority. |

---

## `src/apps/space/` — Asteroids & Space Combat

| Attribute | Detail |
|---|---|
| **What it does** | 21 source files spanning multiple game variants: visual asteroids, NEAT AI training, tournament mode, combatant evolution, cultural evolution, scrap entities, physics bodies, and a space voyager engine. Includes `input_handler.py`, `physics_body.py`, and `space_physics.py`. |
| **Key subsystems** | `asteroids_clone_sdk.py` (19KB game loop), `training_loop.py` (23KB NEAT AI), `tournament_mode.py` (27KB), `combatant_evolution.py` (28KB genetic algorithms), `physics_body.py` (18KB collision/physics) |
| **Test status** | Broken — stale imports. |
| **Slime Clan relevance** | **Low.** The physics and input handler are space-specific. The NEAT AI and genetic evolution concepts are interesting but operate at a different scale than slime_clan's tactical combat. |
| **Verdict** | **🔴 Archive** — Impressive experiments that ran their course. No direct value for the astronaut's journey. Keep for reference but don't invest integration effort. |

---

## `src/apps/tycoon/` — Tycoon Dashboard

| Attribute | Detail |
|---|---|
| **What it does** | Business simulation with a dashboard UI, component system, entity hierarchy, and dedicated rendering pipeline. 19KB `dashboard.py` suggests a data-driven management view. |
| **Test status** | Unknown. |
| **Slime Clan relevance** | **Low.** The dashboard pattern could inform a future squad management or resource overview screen, but the tycoon domain is unrelated. |
| **Verdict** | **🔴 Archive** — Domain mismatch. Interesting architecture for reference only. |

---

## `src/demos/` — Demo Applications

| Attribute | Detail |
|---|---|
| **What it does** | Four demo directories: `rpg/`, `sandbox/`, `space_combat/`, `tycoon/`. Showcase implementations built on the engine layers. |
| **Test status** | Not tested — demo code. |
| **Slime Clan relevance** | **Low.** The `rpg/` demo may contain patterns worth studying, but these are proof-of-concept code, not production components. |
| **Verdict** | **🔴 Archive** — Reference material only. |

---

## `godot_project/` — Godot C# Port

| Attribute | Detail |
|---|---|
| **What it does** | A Godot 4 project with C# source organized into Interfaces, Models, Rendering, Server, Utils, and Scenes. Includes build scripts and a `.csproj`. Appears to be a port of the Python engine into Godot's ecosystem. |
| **Test status** | No tests found. Build status unknown. |
| **Slime Clan relevance** | **None currently.** If slime_clan ever migrates off PyGame to a proper engine, Godot is a candidate, but that's a major architectural decision far beyond current scope. |
| **Verdict** | **🔴 Archive** — Out of scope for the Python-based slime_clan development. |

---

## `rust/` — Rust Modules

| Attribute | Detail |
|---|---|
| **What it does** | Two Rust crates: `physics/` and `sprite_analyzer/`. Likely performance-critical ports of Python systems. |
| **Test status** | Unknown. |
| **Slime Clan relevance** | **None.** Slime_clan is pure Python/PyGame. Rust FFI adds complexity with no current benefit. |
| **Verdict** | **🔴 Archive** — Performance exploration. Not relevant. |

---

## `archive/` — Legacy Code

| Attribute | Detail |
|---|---|
| **What it does** | Contains `legacy_refactor_2026/`, `superseded_v1/`, `stories/`, a legacy `world_engine.py`, and a `roster.db.bak`. Explicitly archived material. |
| **Verdict** | **🔴 Archive** — Already archived. Leave as-is. |

---

## Recommended Integration Priority

| Priority | System | Action | Why |
|---|---|---|---|
| **1** | `dgt_engine` scene manager + heartbeat | **Integrate** | Eliminates the multi-window subprocess hack (Tech Debt #2). Single pygame window, state-machine views. |
| **2** | `game_engine` D20Resolver | **Extract** | Replaces flat damage math with proper dice rolls. Adds depth to combat without complexity. |
| **3** | `game_engine` SystemClock + BaseSystem | **Extract** | Standardizes the `init/tick/shutdown` lifecycle across all three tiers. |
| **4** | `game_engine` pygame_bridge | **Extract** | Entity-based rendering pattern could clean up slime_clan's manual draw calls. |
| **5** | `foundation` persistence | **Extract** | Needed when save/load becomes a feature (Session 020+). |
| — | Everything else | **Archive** | Space, tycoon, demos, Godot, Rust — impressive work, not relevant to the astronaut's journey. |
