> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 200: Phase D Body Systems Architecture - BaseSystem Pattern for ECS

## Status
**Accepted** - Core pattern for all Phase D body system migrations

## Context

The RPG Core refactoring aims to migrate from scattered ECS implementations in `src/dgt_engine/` to a unified `src/game_engine/systems/body/` structure. Phase D implements 6 major body systems:

1. **Step 1**: EntityManager (core ECS)
2. **Step 3**: CollisionSystem (spatial detection)
3. **Step 4**: ProjectileSystem (pooled projectiles)
4. **Step 5**: StatusManager (effect lifecycle)
5. **Step 5.5**: FractureSystem + WaveSpawner (destruction and spawning)
6. **Step 6**: Graphics systems (rendering pipeline)

All existing implementations are functional but scattered. The challenge is to consolidate these into a coherent architecture while maintaining backward compatibility and preserving existing functionality.

## Decision

Implement all Phase D body systems as **BaseSystem extensions** following a consistent architectural pattern:

```
Each System Must:
├─ Extend BaseSystem (framework integration)
├─ Implement process_intent() for external control
├─ Provide comprehensive get_status() reporting
├─ Include factory functions for common configurations
├─ Support 100% test pass rate (40+ suites minimum)
├─ Use object pooling for memory efficiency
├─ Maintain backward compatibility via shims
└─ Follow Result<T> error handling pattern
```

## Technical Architecture

### 1. BaseSystem Extension Pattern

All systems inherit from `BaseSystem` with standardized interface:

```python
from game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result

class MyBodySystem(BaseSystem):
    """Specialized body system implementation"""

    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config or SystemConfig(name="MyBodySystem"))
        self.status = SystemStatus.IDLE
        self._initialized = False

    def initialize(self) -> bool:
        """Initialize system and return success status"""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update system state each frame"""
        if self.status != SystemStatus.RUNNING:
            return
        # Update logic here

    def shutdown(self) -> None:
        """Clean up resources"""
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process external control commands"""
        action = intent.get("action", "")
        # Process action and return result dict
        return {"success": True}

    def get_status(self) -> Dict[str, Any]:
        """Return comprehensive system status"""
        return {
            'status': self.status.name,
            'initialized': self._initialized,
            # System-specific metrics
        }
```

### 2. Intent-Based Operation Model

External systems communicate with body systems via structured intent dictionaries:

```python
# Example: Fire projectile
intent = {
    "action": "fire",
    "owner_id": "player_1",
    "position": (80.0, 72.0),
    "velocity": (10.0, 0.0),
    "projectile_type": "arcade"
}
result = projectile_system.process_intent(intent)
# result = {"success": True, "fired": True, "projectile_id": "p_123"}

# Example: Apply status effect
intent = {
    "action": "apply_effect",
    "target_id": "enemy_1",
    "effect_type": "slow",
    "duration": 5.0,
    "stacking_mode": "additive"
}
result = status_manager.process_intent(intent)
# result = {"success": True, "effect_applied": True}
```

### 3. Object Pooling Strategy

Memory-efficient entity reuse for performance-critical systems:

```python
class PooledSystem(BaseSystem):
    """System using pre-allocated object pools"""

    def __init__(self, config: Optional[SystemConfig] = None, max_objects: int = 100):
        super().__init__(config)
        self.max_objects = max_objects
        self.object_pool: List[PooledObject] = [
            PooledObject() for _ in range(max_objects)
        ]
        self.active_objects: Dict[str, PooledObject] = {}
        self.available_pool = self.object_pool.copy()

    def acquire_object(self) -> Optional[PooledObject]:
        """Get object from pool"""
        if not self.available_pool:
            return None
        obj = self.available_pool.pop()
        obj.reset()
        return obj

    def return_object(self, obj: PooledObject) -> None:
        """Return object to pool"""
        self.available_pool.append(obj)
```

Applied to:
- **ProjectileSystem**: Pre-allocated projectile objects
- **FractureSystem**: Pre-allocated asteroid fragments
- **WaveSpawner**: Pre-allocated entity spawning

### 4. Result<T> Error Handling

Consistent error handling across all systems:

```python
from game_engine.foundation import Result

# Success case
result = Result(success=True, value=42)
if result.success:
    print(f"Value: {result.value}")

# Error case
result = Result(success=False, error="Invalid configuration")
if not result.success:
    print(f"Error: {result.error}")

# Usage in body systems
def fracture_entity(self, entity: Entity, size: int) -> Result[List[Fragment]]:
    """Fracture entity and return fragments"""
    if size < 1 or size > 3:
        return Result(success=False, error=f"Invalid size: {size}")

    fragments = self._create_fragments(entity, size)
    return Result(success=True, value=fragments)
```

### 5. Factory Functions Pattern

Pre-configured system instantiation:

```python
# Arcade configuration (100 projectiles, 150ms cooldown)
def create_arcade_projectile_system() -> ProjectileSystem:
    system = ProjectileSystem(
        max_projectiles=100,
        cooldown_ms=150,
        lifetime_s=2.0
    )
    system.initialize()
    return system

# Hard configuration (50 projectiles, 500ms cooldown)
def create_hard_projectile_system() -> ProjectileSystem:
    system = ProjectileSystem(
        max_projectiles=50,
        cooldown_ms=500,
        lifetime_s=3.0
    )
    system.initialize()
    return system

# Usage
projectile_system = create_arcade_projectile_system()
```

### 6. Comprehensive Status Reporting

All systems provide detailed status queries:

```python
class EntityManager(BaseSystem):
    def get_status(self) -> Dict[str, Any]:
        return {
            'status': self.status.name,
            'initialized': self._initialized,
            'total_entities': len(self.entities),
            'active_entities': len([e for e in self.entities.values() if e.active]),
            'entity_pool_available': len(self.entity_pool),
            'entity_pool_size': self.max_entities,
            'creation_rate': self.total_created / self.total_time if self.total_time > 0 else 0,
            'destruction_rate': self.total_destroyed / self.total_time if self.total_time > 0 else 0,
        }
```

## Implementation Details

### Directory Structure

```
src/game_engine/systems/body/
├── __init__.py                      # Clean public API exports
├── entity_manager.py               # EntityManager + ECS core
├── collision_system.py             # Collision detection
├── projectile_system.py            # Projectile management
├── status_manager.py               # Status effects
├── fracture_system.py              # Object destruction
└── wave_spawner.py                 # Wave progression
```

### Testing Strategy

Every system requires comprehensive test coverage:

```
scripts/
├── test_phase_d_step1.py           # EntityManager (8 suites, 30+ assertions)
├── test_phase_d_step3_collision.py # Collision (8 suites, 30+ assertions)
├── test_phase_d_step4_projectile.py # Projectiles (8 suites, 30+ assertions)
├── test_phase_d_step5_status.py    # Status effects (8 suites, 30+ assertions)
├── test_phase_d_step5_5_fracture.py # Fracture (8 suites, 30+ assertions)
└── test_phase_d_step5_5_wave.py    # Wave spawner (10 suites, 40+ assertions)

Total: 50+ test suites, 200+ assertions, 100% pass rate required
```

### Backward Compatibility Shims

Each migrated system gets a compatibility shim:

```python
# src/dgt_engine/systems/body/__compat__.py
"""Backward compatibility layer - redirect to new locations"""

from src.game_engine.systems.body import (
    EntityManager,
    CollisionSystem,
    ProjectileSystem,
    StatusManager,
    FractureSystem,
    WaveSpawner,
    # ... all exports
)

__all__ = [
    'EntityManager',
    'CollisionSystem',
    # ... etc
]
```

Old code continues working:
```python
# Old import path still works
from src.dgt_engine.systems.body import EntityManager

# New import path also works
from src.game_engine.systems.body import EntityManager
```

## Key Design Principles

### 1. Separation of Concerns
- Each system has single responsibility
- EntityManager: Entity lifecycle only
- CollisionSystem: Spatial queries only
- ProjectileSystem: Projectile management only
- Systems compose via intent calls, not direct dependencies

### 2. Performance First
- Object pooling for zero-allocation operation
- Pre-allocated collections
- Minimal garbage collection during gameplay
- Efficient spatial indexing for collision queries

### 3. Testability
- Pure functions where possible
- Dependency injection via constructor
- Deterministic behavior with fixed random seeds
- Mock-friendly interfaces

### 4. Extensibility
- Factory functions for variant configurations
- Pluggable intent handlers
- Composable system stacks
- Clear interface contracts

## Metrics & Success Criteria

| Metric | Target |
|--------|--------|
| Test Pass Rate | 100% |
| Test Suites per System | 8-10 minimum |
| Total Assertions | 200+ across Phase D |
| Object Pool Efficiency | < 5% allocation during gameplay |
| Frame Time Impact | < 5ms per system |
| Code Coverage | 80%+ per system |
| Documentation | 100% (docstrings + tests) |
| Backward Compatibility | All old imports work via shims |

## Phase D Implementation Timeline

| Step | System | Sessions | Code Lines | Tests | Status |
|------|--------|----------|-----------|-------|--------|
| **1** | EntityManager | 1 | 1000 | 30+ | ✅ Complete |
| **3** | CollisionSystem | 1 | 800 | 30+ | ✅ Complete |
| **4** | ProjectileSystem | 1 | 600 | 40+ | ✅ Complete |
| **5** | StatusManager | 1 | 400 | 25+ | ✅ Complete |
| **5.5** | Fracture+Wave | 1 | 900 | 50+ | ✅ Complete |
| **6** | Graphics Systems | 3-4 | 2000 | 100+ | 🏗️ In Progress |

---

## Consequences

### Positive
- ✅ Consistent architecture across all body systems
- ✅ Highly testable with clear interfaces
- ✅ Memory efficient with object pooling
- ✅ Backward compatible with old code
- ✅ Easy to compose systems together
- ✅ Clear intent-based control model
- ✅ Comprehensive status reporting for debugging

### Negative
- ⚠️ Additional layer of abstraction vs direct access
- ⚠️ Memory overhead for object pools (mitigated by reuse)
- ⚠️ Test maintenance burden (mitigated by factory functions)

### Mitigations
- Use clear naming conventions (process_intent, get_status)
- Provide comprehensive documentation
- Include usage examples in test suites
- Create development guide for new systems

---

## Related Decisions

- **ADR-201**: Genetic Inheritance for Fracture System
- **ADR-202**: Safe-Haven Spawning Algorithm
- **ADR-203**: Graphics Systems Organization
- **ADR-204**: Multi-Genre Engine Support

---

**Phase**: Phase D Step 1-6 (Body Systems Migration)
**Decision Date**: Feb 2026
**Status**: Accepted - Implementation complete through Step 5.5
**Next Review**: Upon Phase D Step 6 completion
