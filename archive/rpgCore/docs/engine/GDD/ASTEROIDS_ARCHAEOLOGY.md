# Asteroids Archaeology — Recovery Plan

This document identifies the surviving Asteroids implementations, their current state, and the roadmap for resurrecting the "Fourth Pillar" demo.

## Inventory Table

| Path | Version | State | Notes |
| :--- | :--- | :--- | :--- |
| `src/apps/space/asteroids_slice.py` | Benchmark | Working | Headless stress test. Relies on `dgt_engine`. |
| `src/apps/space/asteroids_clone_sdk.py` | SDK Case Study | Working | Component-based classic version. Very clean. |
| `src/apps/space/visual_asteroids.py` | High-Fidelity | Partial | Integrated with `AssetLoader` and `UnifiedPPU`. |
| `src/apps/space/asteroids_strategy.py` | Orchestrator | Working | Lean orchestrator using component systems. |
| `src/dgt_engine/game_engine/neat/` | AI Brain | Logic Only | Core NEAT implementation for pilot training. |
| `archive/dead_tests_2026/` | Test Suite | 4 Files | Full contract coverage for Slice, SDK, and NEAT. |

## Version Analysis

### 1. Player Version (`asteroids_clone_sdk.py`)
- **State**: Working.
- **Imports**: `foundation` (legacy), `engines.body`.
- **Logic**: Manual controller, `FractureSystem` for asteroid splitting, `ProjectileSystem` for pooling.

### 2. AI Training Version (`asteroids_neat_game.py`)
- **State**: Broken/Archived (Godot dependent).
- **Imports**: `src.game_engine.godot`.
- **Logic**: Evolutionary training loop (NEAT), fitness calculation (survival + points).

### 3. Shared Simulation (`asteroids_slice.py`)
- **State**: Working.
- **Imports**: `dgt_engine.systems.body`.
- **Logic**: Toroidal wrap physics, software rasterization, perf monitoring.

## Recommended Recovery Plan

We should unify these disparate parts into a single, cohesive demo structure in `src/apps/asteroids/`.

### Proposed Structure
```text
src/apps/asteroids/
├── simulation/     # Physics, spawning, collision (from asteroids_strategy.py)
├── entities/       # Ship, Asteroid, Projectile templates
├── player/         # Human controller & HUD (from asteroids_clone_sdk.py)
├── ai_trainer/     # NEAT training loop (from neat_engine.py)
└── run_asteroids.py # Unified entry with --mode [human|ai|train]
```

### Strategic Moves
1.  **Resurrect SDK Core**: Move `asteroids_clone_sdk.py` logic to `src/apps/asteroids/` as the baseline.
2.  **Harvest NEAT**: Extract `SimpleNeuralNetwork` and `NEATAsteroidPilot` from `dgt_engine` into the new `ai_trainer` module.
3.  **Shared System Extraction**: Identify generic Asteroids physics (toroidal wrap, fragmentation) and evaluate if they belong in `src/shared/physics/` or remain demo-specific.

## Estimated Scope
- **Resurrection Phase**: 1-2 sessions. Moving files, fixing imports to use `src/shared/`, and getting a basic "Human" mode running in the new folder.
- **Training Phase**: 2-3 sessions. Re-wiring NEAT to the new simulation core for headless training.
- **Polymorphic Entry**: 1 session. Implementing the command-line switcher.

**Target**: A single demo that can either be played for fun or used to train the next generation of pilots.

---
*Verified: 2026-02-22*
*Protected Floor: 312 passing tests*
