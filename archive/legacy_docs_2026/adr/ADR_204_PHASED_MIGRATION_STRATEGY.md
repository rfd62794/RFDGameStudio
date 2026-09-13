> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 204: 10-Phase Gradual Migration with Backward Compatibility Shims

## Status
**Accepted** - Active implementation (Phases A-D.5.5 complete, D.6+ pending)

## Context

RPG Core contains ~35,000 lines of code across 50+ systems organized ad-hoc in `src/dgt_engine/`. Complete restructuring in a single sprint would:

- Risk breaking existing functionality
- Block development during migration
- Create merge conflicts with other work
- Make rollback difficult

**Problem Statement**:
- Need to reorganize into coherent `src/game_engine/` structure
- Must maintain backward compatibility
- Should support parallel development
- Requires clear checkpoints for validation

## Decision

Implement **10-phase gradual migration (A-J)** with **backward compatibility shim layer**:

```
Phases:
A) Setup                         (1 day)   - Create new structure, shims
B) Foundation                    (2 days)  - Migrate types, protocols
C) Engines                       (3 days)  - Migrate 10+ game engines
D) Body Systems                  (10 days) - Migrate ECS and specialized systems
E) Assets & Configuration        (3 days)  - Consolidate loaders, configs
F) UI Layer                      (3 days)  - Migrate viewport, dashboard
G) Demo Consolidation            (7 days)  - Organize all demos
H) Tests                         (4 days)  - Migrate and validate all tests
I) Rust Integration              (3 days)  - Optional performance module
J) Documentation & Cleanup       (3 days)  - Remove shims, finalize

Total: 50-70 days estimated
```

## Technical Architecture

### 1. Shim Layer Architecture

**Old imports continue working**:

```python
# Old path (still works)
from src.dgt_engine.systems.body import EntityManager

# New path (actual implementation)
from src.game_engine.systems.body import EntityManager
```

Implementation:

```python
# src/dgt_engine/systems/body/__compat__.py
"""
Backward compatibility shims.
Redirect old imports to new locations.
Will be deprecated after full migration.
"""

# Import from new location
from src.game_engine.systems.body import (
    EntityManager,
    CollisionSystem,
    ProjectileSystem,
    StatusManager,
    FractureSystem,
    WaveSpawner,
    # ... all classes
)

# Re-export to old path
__all__ = [
    'EntityManager',
    'CollisionSystem',
    'ProjectileSystem',
    'StatusManager',
    'FractureSystem',
    'WaveSpawner',
    # ... etc
]

# Optional deprecation warning
import warnings

def __getattr__(name):
    if name in __all__:
        warnings.warn(
            f"Importing {name} from src.dgt_engine is deprecated. "
            f"Use src.game_engine instead.",
            DeprecationWarning,
            stacklevel=2
        )
        return globals()[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
```

### 2. Phase Structure

#### Phase A: Setup (1 day)

**Tasks**:
1. Create target directory structure under `src/game_engine/`
2. Create compatibility shim files in old locations
3. Verify import paths work (old and new)
4. Set up testing infrastructure

**Commits**:
```
refactor(phase-a): setup new directory structure and shim layer
```

**Verification**:
```python
# Old imports work
from src.dgt_engine.foundation import BaseSystem
print("✓ Old imports work")

# New imports work
from src.game_engine.foundation import BaseSystem
print("✓ New imports work")
```

#### Phase B: Foundation (2 days)

**Tasks**:
1. Migrate core types (types.py, constants.py, vec.py)
2. Migrate protocols and base classes
3. Migrate registry systems
4. Create compatibility shims

**Files**:
- `src/game_engine/core/types.py` (immutable types)
- `src/game_engine/foundation/base_system.py` (BaseSystem)
- `src/game_engine/foundation/protocols.py` (interfaces)

**Commits**:
```
refactor(phase-b): migrate foundation types and protocols
```

**Verification**:
```bash
python -c "from src.game_engine.foundation import BaseSystem; print('✓')"
python -c "from src.dgt_engine.foundation import BaseSystem; print('✓')"
pytest tests/unit/test_foundation.py -v
```

#### Phase C: Engines (3 days)

**Tasks**:
1. Migrate each engine independently (SRE, Chronos, D20, etc.)
2. Test each engine loads and initializes
3. Create compatibility shims for old paths
4. Consolidate duplicate engines

**Engines**:
- SyntheticRealityEngine
- ChronosEngine
- D20Resolver
- SemanticResolver
- NarrativeEngine
- PhysicsEngine
- RenderingEngine
- GameREPL

**Commits** (per engine):
```
refactor(phase-c-chronos): migrate ChronosEngine to new structure
refactor(phase-c-d20): migrate D20Resolver to new structure
refactor(phase-c-engines): consolidate remaining engines
```

**Verification**:
```bash
pytest tests/unit/test_engines.py -v
# Verify no circular imports
python -m pydeps src/game_engine --show-cycle
```

#### Phase D: Body Systems (10 days)

**Steps**:
1. EntityManager & ECS core
2. CollisionSystem (sweep detection)
3. ProjectileSystem (pooling)
4. StatusManager (effects)
5. FractureSystem + WaveSpawner (destruction)
6. Graphics systems (rendering)

**Task per Step**:
- Read existing implementation in old location
- Understand dependencies
- Create new system in new location
- Write 40+ test suites
- Create compatibility shim
- Commit with clear message

**Example (Step 1)**:

```bash
# Read existing
cat src/dgt_engine/systems/body/entity_manager.py | head -100

# Create new location
mkdir -p src/game_engine/systems/body

# Create new implementation
vim src/game_engine/systems/body/entity_manager.py
# (adapt imports, maintain API)

# Write tests
vim scripts/test_phase_d_step1.py
# (40+ test suites)

# Run tests until 100% pass
python scripts/test_phase_d_step1.py

# Create shim
vim src/dgt_engine/systems/body/__compat__.py

# Commit
git commit -m "refactor(phase-d-step1): migrate EntityManager to game_engine"
```

**Metrics**:
- Step 1: ~1000 lines, 30+ tests → 1 day
- Step 3: ~800 lines, 30+ tests → 1 day
- Step 4: ~600 lines, 40+ tests → 1 day
- Step 5: ~400 lines, 25+ tests → 1 day
- Step 5.5: ~900 lines, 50+ tests → 1 day
- Step 6: ~2000 lines, 100+ tests → 3 days

**Status**: ✅ Steps 1,3,4,5,5.5 complete | 🏗️ Step 6 in progress

#### Phase E: Assets & Configuration (3 days)

**Tasks**:
1. Consolidate asset loaders
2. Create configuration management
3. Implement YAML/JSON support
4. Create migration scripts

**Files**:
- `src/game_engine/assets/loader.py`
- `src/game_engine/config/manager.py`
- `src/game_engine/config/schemas.py`

**Commits**:
```
refactor(phase-e): consolidate assets and configuration management
```

#### Phase F: UI Layer (3 days)

**Tasks**:
1. Migrate viewport and dashboard
2. Migrate rendering adapters (Tkinter, PyGame)
3. Create UI mode system

**Files**:
- `src/game_engine/ui/viewport.py`
- `src/game_engine/ui/dashboard.py`
- `src/game_engine/ui/adapters/tkinter.py`

**Commits**:
```
refactor(phase-f): migrate UI layer and rendering adapters
```

#### Phase G: Demo Consolidation (7 days)

**Tasks**:
1. Create GameEngineRouter
2. Create unified Launcher
3. Migrate each demo type
4. Test multi-genre support

**Files**:
- `src/game_engine/game_engine_router.py`
- `src/demos/launcher.py`
- `src/demos/space_combat/*.py`
- `src/demos/rpg/*.py`
- `src/demos/tycoon/*.py`

**Commits**:
```
refactor(phase-g-router): create GameEngineRouter for multi-genre support
refactor(phase-g-space-combat): consolidate space combat demos
refactor(phase-g-rpg): consolidate RPG demos
refactor(phase-g-tycoon): consolidate tycoon demos
```

#### Phase H: Tests (4 days)

**Tasks**:
1. Migrate all 100+ tests to new structure
2. Update import paths
3. Fix any failures
4. Generate coverage reports

**Commits**:
```
refactor(phase-h): migrate tests to new structure and fix failures
```

#### Phase I: Rust Integration (3 days)

**Tasks**:
1. Move Rust modules to `rust/` directory
2. Create Python wrapper with fallback
3. Test optional integration

**Files**:
- `rust/sprite_analyzer/Cargo.toml`
- `src/game_engine/assets/sprite_analyzer.py` (wrapper)

**Commits**:
```
refactor(phase-i): integrate optional Rust performance module with fallback
```

#### Phase J: Cleanup & Docs (3 days)

**Tasks**:
1. Remove deprecated shims
2. Update documentation
3. Final validation
4. Performance benchmarking

**Commits**:
```
refactor(phase-j): remove deprecated shims and finalize documentation
```

### 3. Verification Strategy

Each phase has defined checkpoints:

```python
# Phase gate testing
def verify_phase_a():
    """Verify setup phase"""
    from src.game_engine.foundation import BaseSystem
    from src.dgt_engine.foundation import BaseSystem as OldBaseSystem
    assert BaseSystem is OldBaseSystem  # Should be same object
    print("✓ Phase A passed")

def verify_phase_b():
    """Verify foundation phase"""
    from src.game_engine.core import Vector2Protocol
    from src.dgt_engine.foundation import Vector2Protocol as OldProto
    # Both imports should work
    print("✓ Phase B passed")

# ... verify_phase_c through verify_phase_j
```

### 4. Risk Mitigation

| Risk | Mitigation | Contingency |
|------|-----------|-------------|
| Circular imports | Test immediately after each migration | Refactor module structure |
| Missed old imports | Comprehensive shim layer with logging | Add automated import migration tool |
| Test failures | Run tests after each step | Debug in isolation, fix incrementally |
| Performance regression | Benchmark each phase | Profile bottlenecks, optimize |
| Large merge conflicts | Merge to main after each phase | Use smaller commits, frequent pushes |

## Timeline & Progress

| Phase | Status | Start | End | Duration |
|-------|--------|-------|-----|----------|
| **A** | ✅ Complete | Feb 8 | Feb 8 | 1 day |
| **B** | ✅ Complete | Feb 8 | Feb 9 | 2 days |
| **C** | ✅ Complete | Feb 9 | Feb 11 | 3 days |
| **D.1** | ✅ Complete | Feb 11 | Feb 12 | 1 day |
| **D.3** | ✅ Complete | Feb 12 | Feb 12 | 1 day |
| **D.4** | ✅ Complete | Feb 12 | Feb 13 | 1 day |
| **D.5** | ✅ Complete | Feb 13 | Feb 13 | 1 day |
| **D.5.5** | ✅ Complete | Feb 13 | Feb 13 | 1 day |
| **D.6** | 🏗️ In Progress | Feb 13 | Feb 15 | 3 days |
| **E** | ⏳ Pending | Feb 15 | Feb 18 | 3 days |
| **F** | ⏳ Pending | Feb 18 | Feb 20 | 3 days |
| **G** | ⏳ Pending | Feb 20 | Feb 27 | 7 days |
| **H** | ⏳ Pending | Feb 27 | Mar 2 | 4 days |
| **I** | ⏳ Pending | Mar 2 | Mar 5 | 3 days |
| **J** | ⏳ Pending | Mar 5 | Mar 7 | 3 days |
| **TOTAL** | **53% Complete** | Feb 8 | Mar 7 | ~50 days |

## Consequences

### Positive
- ✅ **Non-Breaking**: Old code continues working throughout
- ✅ **Incremental**: Clear checkpoints for validation
- ✅ **Rollback-Safe**: Each phase can be reverted independently
- ✅ **Parallel-Friendly**: Other work can continue during migration
- ✅ **Well-Tested**: Each phase validated before moving forward
- ✅ **Clear Progress**: Visible completion metrics

### Negative
- ⚠️ **Long Timeline**: 50-70 days is significant time investment
- ⚠️ **Maintenance Burden**: Shim layer adds complexity initially
- ⚠️ **Temporary Duplication**: Two code paths until final cleanup

### Mitigations
- Automate validation with comprehensive test suites
- Clear documentation of each phase
- Regular commits to main for safety
- Shim layer is temporary (removed in Phase J)

---

## Success Criteria

✅ **Phase Completion**:
- All phases complete with 100% test pass rates
- All old import paths still work via shims
- No circular dependencies
- Backward compatibility verified

✅ **Code Quality**:
- 80%+ test coverage
- No performance regression
- All docstrings present
- Clear API boundaries

✅ **Documentation**:
- Architecture diagram accurate
- Each system documented
- Migration guide for developers
- Migration complete and shims removed

---

## Related Decisions

- **ADR-200**: BaseSystem pattern (consistent architecture)
- **ADR-201**: Genetic inheritance (Phase D Step 5.5)
- **ADR-202**: Safe-haven spawning (Phase D Step 5.5)
- **ADR-203**: Multi-genre support (Phase E-G)

---

**Overall Strategy**: Phase A-J gradual migration
**Decision Date**: Feb 2026
**Current Status**: 53% complete (Phases A-D.5.5 done, D.6 in progress)
**Estimated Completion**: March 7, 2026
**Next Phase**: D.6 (Graphics systems) → E (Assets/Config) → ...
