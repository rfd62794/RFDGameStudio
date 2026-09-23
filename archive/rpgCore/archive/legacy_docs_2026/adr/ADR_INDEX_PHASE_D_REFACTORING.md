> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Architecture Decision Record Index - Phase D Refactoring

## Overview

This document indexes the Architecture Decision Records (ADRs) for the **Phase D Body Systems Migration** and related refactoring work. The ADRs break down the comprehensive 1443-line refactoring plan into digestible, decision-focused documents.

**Total ADRs**: 5 core ADRs + existing legacy ADRs (191-193)
**Coverage**: Phase D Steps 1-6, architecture patterns, migration strategy

---

## Core ADRs for Phase D Refactoring

### ADR-200: Phase D Body Systems Architecture - BaseSystem Pattern

**File**: `ADR_200_PHASE_D_BODY_SYSTEMS_ARCHITECTURE.md`

**Scope**: Architectural foundation for all Phase D body systems

**Key Decisions**:
- All Phase D systems extend `BaseSystem` (framework integration)
- `process_intent()` for external control via dictionary commands
- Comprehensive `get_status()` reporting for all systems
- Factory functions for configuration variants
- Object pooling for memory efficiency
- `Result<T>` error handling pattern

**Affected Systems**:
- EntityManager (Step 1) ✅
- CollisionSystem (Step 3) ✅
- ProjectileSystem (Step 4) ✅
- StatusManager (Step 5) ✅
- FractureSystem (Step 5.5) ✅
- WaveSpawner (Step 5.5) ✅
- Graphics Systems (Step 6) 🏗️

**Test Coverage**: 50+ test suites, 200+ assertions, 100% pass rate

**Status**: ✅ Accepted - Implementation complete through Step 5.5

**Related**: ADR-201, ADR-202, ADR-203, ADR-204

---

### ADR-201: Genetic Inheritance System for Fracture-Based Evolution

**File**: `ADR_201_GENETIC_INHERITANCE_SYSTEM.md`

**Scope**: Evolutionary gameplay mechanics for object destruction

**Key Decisions**:
- Fragments inherit and mutate traits from parents
- Mutation rates: ±10% speed, ±5% size/mass, ±5 hue per generation
- Generation counter for lineage tracking
- Discovery system tracks unique genetic patterns
- Optional feature (can be disabled via factory function)

**Traits**:
- `speed_modifier`: 0.5x to 2.0x
- `size_modifier`: 70% to 130%
- `mass_modifier`: 70% to 130%
- `color_shift`: ±5 hue per generation
- `generation`: Counter increments on fracture

**Configuration Variants**:
- Classic (no genetics) - predictable gameplay
- Genetic (with evolution) - emergent gameplay
- Hard (genetic + faster) - challenging

**Test Coverage**: 8 test suites (FractureSystem)

**Status**: ✅ Accepted - Implementation complete (Phase D Step 5.5a)

**Related**: ADR-200 (parent pattern), ADR-202 (used by WaveSpawner)

---

### ADR-202: Safe-Haven Spawning Algorithm for Wave-Based Games

**File**: `ADR_202_SAFE_HAVEN_SPAWNING_ALGORITHM.md`

**Scope**: Fair asteroid spawning mechanics in arcade games

**Key Decisions**:
- Circular safe-haven buffer around player (configurable, default 40px)
- Adaptive position generation with retry loop (50 attempts)
- Fallback to screen edges if random fails
- Dynamic zone updates following player movement
- O(1) average case, O(n) worst case with fallback

**Algorithm**:
1. Generate random position within bounds
2. Verify distance from safe-haven center
3. If valid, return position
4. If max attempts exceeded, use edge fallback
5. Edge fallback always guarantees outside safe zone

**Configuration per Game Type**:
| Type | Radius | Spawn Boundary | Difficulty |
|------|--------|----------------|-----------|
| Arcade | 40px | 20px | Normal |
| Survival | 30px | 20px | Hard |
| Sandbox | 60px | 10px | Easy |

**Test Coverage**: 10 test suites (WaveSpawner)

**Status**: ✅ Accepted - Implementation complete (Phase D Step 5.5b)

**Related**: ADR-200 (parent pattern), ADR-201 (spawns genetic asteroids)

---

### ADR-203: Multi-Genre Engine Support Architecture

**File**: `ADR_203_MULTI_GENRE_ENGINE_SUPPORT.md`

**Scope**: Single engine supporting multiple game genres

**Key Decisions**:
- Configuration-driven system composition (no fork in code)
- `GameEngineRouter` selects configuration per game type
- `IGameSlice` protocol for demo interface
- Unified launcher with mode selection
- Time modes: real-time, turn-based, economic

**Game Types**:

**Space Combat**:
- Time: real-time, physics-driven
- Rendering: pixel-perfect 160×144
- Collision: enabled
- Physics: enabled
- Config: arcade wave mode

**RPG**:
- Time: turn-based, narrative-paced
- Rendering: isometric tile-based
- Collision: enabled
- Physics: disabled
- Config: quest/dialogue focus

**Tycoon**:
- Time: economic ticks
- Rendering: dashboard UI
- Collision: disabled
- Physics: disabled
- Config: market/economy focus

**Configuration Template**:
```python
GameConfig(
    game_type="space_combat",          # Selects template
    time_mode="real-time",             # Real-time vs turn-based
    render_mode="pixel_perfect",       # Rendering pipeline
    physics_enabled=True,              # Physics simulation
    collision_enabled=True,            # Collision detection
    max_entities=200,                  # System scaling
    enable_genetics=False,             # Optional features
    wave_mode="arcade"                 # Game-type-specific
)
```

**Router Usage**:
```python
# Get configuration for game type
config = GameEngineRouter.get_config_for_game_type("space_combat")

# Create fully configured engine
engine = GameEngineRouter.create_engine_for_game_type("space_combat")

# Launch demo via launcher
launcher = GameLauncher()
launcher.launch_game("space_combat", demo_name="asteroids")
```

**Extensibility**:
- Easy: New genres (define config template), new rendering modes
- Harder: Fundamentally different data models

**Status**: 🟡 Proposed - Design ready for Phase E-G implementation

**Related**: ADR-200 (system composition), ADR-204 (migration timeline)

---

### ADR-204: 10-Phase Gradual Migration with Backward Compatibility Shims

**File**: `ADR_204_PHASED_MIGRATION_STRATEGY.md`

**Scope**: Overall migration strategy and risk mitigation

**Key Decisions**:
- 10 phases (A-J) for gradual migration
- Backward compatibility shims maintain old import paths
- Each phase validated before proceeding
- Estimated 50-70 days total
- Clear rollback points between phases

**Phases**:

| Phase | Content | Duration | Status |
|-------|---------|----------|--------|
| **A** | Setup & Shims | 1 day | ✅ |
| **B** | Foundation (types, protocols) | 2 days | ✅ |
| **C** | Engines (10+ game engines) | 3 days | ✅ |
| **D1** | EntityManager & ECS | 1 day | ✅ |
| **D3** | CollisionSystem | 1 day | ✅ |
| **D4** | ProjectileSystem | 1 day | ✅ |
| **D5** | StatusManager | 1 day | ✅ |
| **D5.5** | Fracture + Wave | 1 day | ✅ |
| **D6** | Graphics Systems | 3 days | 🏗️ |
| **E** | Assets & Configuration | 3 days | ⏳ |
| **F** | UI Layer | 3 days | ⏳ |
| **G** | Demo Consolidation | 7 days | ⏳ |
| **H** | Tests | 4 days | ⏳ |
| **I** | Rust Integration | 3 days | ⏳ |
| **J** | Docs & Cleanup | 3 days | ⏳ |

**Progress**: 53% complete (through Phase D.5.5)

**Shim Layer**:
```python
# Old imports still work (redirect to new location)
from src.dgt_engine.systems.body import EntityManager

# Via shim at src/dgt_engine/systems/body/__compat__.py:
from src.game_engine.systems.body import EntityManager
```

**Risk Mitigation**:
- Automated validation after each phase
- Comprehensive test suites for each step
- Clear rollback procedures
- Frequent commits to main

**Status**: ✅ Accepted - Implementation 53% complete

**Related**: ADR-200 (architecture), ADR-201-203 (specific decisions)

---

## How to Use These ADRs

### For Developers

1. **Understanding Architecture**: Start with ADR-200 (BaseSystem pattern)
2. **Feature Details**: Read ADR-201 (genetics) or ADR-202 (spawning)
3. **Multi-Genre Support**: Study ADR-203 (configuration-driven design)
4. **Migration Context**: Reference ADR-204 (phase timeline)

### For New Phases

Each ADR provides:
- **Context**: Problem being solved
- **Decision**: What was chosen
- **Alternatives**: What was rejected and why
- **Implementation**: Code examples
- **Test Coverage**: How to validate
- **Consequences**: Tradeoffs

### For Code Review

Check implementation against:
- BaseSystem pattern (ADR-200)
- Object pooling strategy (ADR-200)
- Result<T> error handling (ADR-200)
- Factory function pattern (ADR-200)
- Test requirements (50+ suites minimum)

---

## Decision Dependency Graph

```
ADR-204 (Phased Migration)
    ├─ ADR-200 (BaseSystem Pattern)          [Foundation for all systems]
    │   ├─ ADR-201 (Genetic Inheritance)    [FractureSystem feature]
    │   ├─ ADR-202 (Safe-Haven Spawning)    [WaveSpawner feature]
    │   └─ ADR-203 (Multi-Genre Support)    [Configuration composition]
    │
    ├─ Phase D (Systems)
    │   ├─ Step 1: EntityManager            [ADR-200]
    │   ├─ Step 3: CollisionSystem          [ADR-200]
    │   ├─ Step 4: ProjectileSystem         [ADR-200]
    │   ├─ Step 5: StatusManager            [ADR-200]
    │   ├─ Step 5.5: Fracture+Wave          [ADR-200, ADR-201, ADR-202]
    │   └─ Step 6: Graphics Systems         [ADR-200]
    │
    └─ Phases E-J (Integration)             [ADR-203, ADR-204]
```

---

## Metrics & Success Criteria

### Code Quality (All ADRs)
- Test pass rate: 100%
- Test coverage: 80%+
- Documentation: 100% (docstrings + ADRs)
- Performance: No regression (< 5% difference)

### Phase D (ADR-200 + Steps 1-6)
- 50+ test suites
- 200+ assertions
- ~4500 lines implementation
- All systems use BaseSystem pattern
- Full backward compatibility

### Multi-Genre Support (ADR-203)
- Single engine supports 3+ game types
- Easy configuration per genre
- Clear composition patterns
- Extensible for new types

### Migration Progress (ADR-204)
- Current: 53% complete (9 of 17 work units)
- Target: 100% by ~March 7, 2026
- Rollback safety maintained throughout
- No breaking changes to old imports

---

## Future ADRs

Planned ADRs for upcoming phases:

- **ADR-210**: Graphics Systems Architecture (ADR-200 applied to rendering)
- **ADR-220**: Asset Loader Consolidation (Phase E design)
- **ADR-230**: Configuration Management System (Phase E design)
- **ADR-240**: Demo Consolidation Architecture (Phase G design)
- **ADR-250**: Test Migration Strategy (Phase H design)

---

## Review & Update Schedule

| Document | Last Updated | Next Review |
|----------|-------------|-------------|
| ADR-200 | Feb 13, 2026 | Phase D.6 completion |
| ADR-201 | Feb 13, 2026 | Phase D.6 completion |
| ADR-202 | Feb 13, 2026 | Phase D.6 completion |
| ADR-203 | Feb 13, 2026 | Phase E start |
| ADR-204 | Feb 13, 2026 | Each phase completion |

---

## Related Documentation

- **Main Plan**: `/c/Users/cheat/.claude/plans/fizzy-giggling-sphinx.md` (1443 lines)
- **Memory**: `C:\Users\cheat\.claude\projects\...\memory\MEMORY.md` (Persistent session context)
- **Session Summary**: `SESSION_4_SUMMARY.md` (Phase D.5.5 completion)

---

**Index Created**: Feb 13, 2026
**Phase D Status**: 83% complete (5 of 6 steps done)
**Next Phase**: D.6 (Graphics systems) - 3 days estimated
**Overall Progress**: 53% (9 of 17 work units)
