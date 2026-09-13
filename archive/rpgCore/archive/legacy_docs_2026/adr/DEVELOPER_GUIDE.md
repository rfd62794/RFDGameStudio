> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Developer Guide: Phase D Refactoring & Architecture

Quick reference for developers working on Phase D and beyond.

---

## Quick Start

### Understanding the Architecture

1. **New System Implementation**? → Read **ADR-200** (BaseSystem pattern)
2. **Working on Fractures**? → Read **ADR-201** (Genetic inheritance)
3. **Working on Wave Spawner**? → Read **ADR-202** (Safe-haven algorithm)
4. **Multi-Genre Support**? → Read **ADR-203** (Configuration routing)
5. **Overall Timeline**? → Read **ADR-204** (Phased migration)

### Critical Files

**Architecture**:
```
src/game_engine/
├── foundation/base_system.py           # All systems extend this
├── systems/body/                       # Core systems
│   ├── entity_manager.py              # ECS foundation
│   ├── collision_system.py            # Spatial queries
│   ├── projectile_system.py           # Pooled projectiles
│   ├── status_manager.py              # Effect lifecycle
│   ├── fracture_system.py             # Object destruction (genetic)
│   ├── wave_spawner.py                # Wave progression (safe-haven)
│   └── __init__.py                    # Public API exports
└── systems/graphics/                  # Rendering systems (in progress)
```

**Tests**:
```
scripts/
├── test_phase_d_step1.py              # EntityManager (8 suites)
├── test_phase_d_step3_collision.py    # CollisionSystem (8 suites)
├── test_phase_d_step4_projectile.py   # ProjectileSystem (8 suites)
├── test_phase_d_step5_status.py       # StatusManager (8 suites)
├── test_phase_d_step5_5_fracture.py   # FractureSystem (8 suites)
└── test_phase_d_step5_5_wave.py       # WaveSpawner (10 suites)
```

---

## Implementing a New Body System

Follow this exact workflow:

### Step 1: Plan (Read ADR-200)

Understand:
- BaseSystem inheritance pattern
- process_intent() for external control
- get_status() reporting requirements
- Object pooling strategy
- Factory functions pattern

### Step 2: Read Existing

```bash
# Understand existing implementation
cat src/dgt_engine/systems/body/my_system.py

# Identify dependencies
grep -r "import" src/dgt_engine/systems/body/my_system.py
```

### Step 3: Create New Implementation

```bash
# Create new file (copy from old, adapt imports)
cp src/dgt_engine/systems/body/my_system.py \
   src/game_engine/systems/body/my_system.py

# Edit: Update imports to use game_engine paths
# Edit: Ensure BaseSystem pattern followed
# Edit: Verify error handling uses Result<T>
# Edit: Add factory functions
```

### Step 4: Write Tests

```bash
# Create comprehensive test file
cat > scripts/test_phase_d_step_X.py << 'EOF'
#!/usr/bin/env python3
"""
Phase D Step X Verification - My System

Tests:
1. Initialization and lifecycle
2. [System-specific test 2]
3. [System-specific test 3]
4. [System-specific test 4]
5. [System-specific test 5]
6. [System-specific test 6]
7. Factory functions
8. System status and statistics
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.body import MySystem
from game_engine.foundation import SystemConfig, SystemStatus

def test_1_initialization():
    """Test 1: Initialization and lifecycle"""
    system = MySystem()
    assert system.initialize() == True
    assert system.status == SystemStatus.RUNNING
    system.shutdown()
    assert system.status == SystemStatus.STOPPED
    print("[OK] Initialization successful")

# ... more tests (minimum 8)

def main():
    print("=" * 60)
    print("PHASE D STEP X: My System Tests")
    print("=" * 60)

    try:
        test_1_initialization()
        # ... run other tests
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED [OK]")
        print("=" * 60)
        return 0
    except AssertionError as e:
        print(f"\n[FAIL] {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
EOF

# Run tests until 100% pass rate
chmod +x scripts/test_phase_d_step_X.py
python scripts/test_phase_d_step_X.py
```

### Step 5: Create Shim

```bash
# Create compatibility layer
cat > src/dgt_engine/systems/body/__compat__.py << 'EOF'
"""Backward compatibility shims for body systems"""

from src.game_engine.systems.body import (
    MySystem,
    create_my_system_factory1,
    create_my_system_factory2,
)

__all__ = [
    'MySystem',
    'create_my_system_factory1',
    'create_my_system_factory2',
]
EOF
```

### Step 6: Export from __init__

```python
# src/game_engine/systems/body/__init__.py

from .my_system import (
    MySystem,
    create_my_system_factory1,
    create_my_system_factory2,
)

__all__ = [
    'MySystem',
    'create_my_system_factory1',
    'create_my_system_factory2',
]
```

### Step 7: Commit

```bash
# Verify tests pass
python scripts/test_phase_d_step_X.py

# Stage changes
git add src/game_engine/systems/body/my_system.py
git add scripts/test_phase_d_step_X.py
git add src/dgt_engine/systems/body/__compat__.py
git add src/game_engine/systems/body/__init__.py

# Commit with clear message
git commit -m "refactor(phase-d-stepX): implement MySystem with factory functions

Migrates MySystem from dgt_engine to game_engine with:
- BaseSystem extension pattern
- Intent-based process_intent() interface
- Comprehensive get_status() reporting
- Object pooling for memory efficiency
- 8 test suites with 100% pass rate

Old imports still work via compat shim at:
src/dgt_engine/systems/body/__compat__.py
"

# Push to main
git push origin main
```

---

## Common Patterns

### BaseSystem Template

```python
from typing import Optional, Dict, Any
from game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result

class MySystem(BaseSystem):
    """Brief description"""

    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config or SystemConfig(name="MySystem"))
        # Initialize your fields

    def initialize(self) -> bool:
        """Initialize system"""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update system each frame"""
        if self.status != SystemStatus.RUNNING:
            return
        # Update logic

    def shutdown(self) -> None:
        """Clean up resources"""
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process external control commands"""
        action = intent.get("action", "")

        if action == "my_action":
            # Do something
            return {"success": True}

        return {"error": f"Unknown action: {action}"}

    def get_status(self) -> Dict[str, Any]:
        """Return system status"""
        return {
            'status': self.status.name,
            'initialized': self._initialized,
            # Your metrics
        }
```

### Factory Functions

```python
def create_arcade_my_system() -> MySystem:
    """Create arcade configuration"""
    system = MySystem(SystemConfig(name="MySystem"))
    system.initialize()
    return system

def create_hard_my_system() -> MySystem:
    """Create hard configuration"""
    system = MySystem(SystemConfig(name="MySystem", performance_monitoring=True))
    system.initialize()
    return system
```

### Error Handling with Result<T>

```python
from game_engine.foundation import Result

def my_operation(value: int) -> Result[str]:
    """Perform operation with error handling"""

    if value < 0:
        return Result(success=False, error="Value must be positive")

    result = f"Processed: {value * 2}"
    return Result(success=True, value=result)

# Usage
result = my_operation(-5)
if not result.success:
    print(f"Error: {result.error}")
else:
    print(f"Value: {result.value}")
```

### Object Pooling

```python
class PooledSystem(BaseSystem):
    def __init__(self, max_objects: int = 100):
        super().__init__()
        self.max_objects = max_objects
        self.object_pool = [MyPooledObject() for _ in range(max_objects)]
        self.active_objects = {}

    def acquire_object(self) -> Optional[MyPooledObject]:
        """Get object from pool"""
        if not self.object_pool:
            return None
        obj = self.object_pool.pop()
        obj.reset()
        return obj

    def return_object(self, obj: MyPooledObject) -> None:
        """Return object to pool"""
        self.object_pool.append(obj)

    def get_status(self) -> Dict[str, Any]:
        return {
            **super().get_status(),
            'pool_available': len(self.object_pool),
            'pool_active': len(self.active_objects),
            'pool_efficiency': len(self.object_pool) / self.max_objects
        }
```

---

## Testing Checklist

Before committing, ensure:

- [ ] System extends `BaseSystem`
- [ ] `initialize()` returns `bool` and sets status
- [ ] `tick()` checks `self.status != SystemStatus.RUNNING`
- [ ] `shutdown()` cleans up all resources
- [ ] `process_intent()` returns `Dict[str, Any]` with `success` key
- [ ] `get_status()` includes `'status'` and `'initialized'` keys
- [ ] Factory functions provided (minimum 2 variants)
- [ ] 8+ test suites written
- [ ] 30+ assertions total
- [ ] 100% test pass rate
- [ ] Old imports work via shim
- [ ] No circular dependencies

Run verification:

```bash
# Test import paths
python -c "from game_engine.systems.body import MySystem; print('✓ New')"
python -c "from dgt_engine.systems.body import MySystem; print('✓ Old shim')"

# Run test suite
python scripts/test_phase_d_step_X.py

# Check for import issues
python -m pydeps src/game_engine/systems/body/my_system.py --show-cycle
```

---

## Debugging Tips

### Import Errors

```bash
# Check import chain
python -c "import src.game_engine.systems.body.my_system"

# Trace imports in file
grep -E "^from|^import" src/game_engine/systems/body/my_system.py

# List all imports recursively
python -c "
import ast
with open('src/game_engine/systems/body/my_system.py') as f:
    tree = ast.parse(f.read())
for node in ast.walk(tree):
    if isinstance(node, ast.Import):
        print('import', ', '.join(a.name for a in node.names))
    elif isinstance(node, ast.ImportFrom):
        print(f'from {node.module} import', ', '.join(a.name for a in node.names))
"
```

### Test Failures

```bash
# Run single test with full traceback
python -c "
import sys
sys.path.insert(0, 'src')
from scripts.test_phase_d_step_X import test_1_initialization
try:
    test_1_initialization()
    print('[OK]')
except Exception as e:
    import traceback
    traceback.print_exc()
"

# Add debug output
print(f"DEBUG: system.status = {system.status}")
print(f"DEBUG: system._initialized = {system._initialized}")
print(f"DEBUG: result = {result}")
```

### Performance Issues

```bash
# Profile system initialization
python -m cProfile -s cumulative scripts/test_phase_d_step_X.py | head -20

# Check object pool efficiency
status = system.get_status()
print(f"Pool efficiency: {status['pool_efficiency']}")

# Measure tick time
import time
start = time.perf_counter()
system.tick(0.016)  # 16ms frame
elapsed = time.perf_counter() - start
print(f"Tick time: {elapsed*1000:.2f}ms")
```

---

## Phase Progress

Current status (Feb 13, 2026):

| Step | System | Status | Lines | Tests |
|------|--------|--------|-------|-------|
| 1 | EntityManager | ✅ | 1000 | 30+ |
| 3 | CollisionSystem | ✅ | 800 | 30+ |
| 4 | ProjectileSystem | ✅ | 600 | 40+ |
| 5 | StatusManager | ✅ | 400 | 25+ |
| 5.5 | Fracture+Wave | ✅ | 900 | 50+ |
| 6 | Graphics Systems | 🏗️ | 2000 | 100+ |

**Phase D Completion**: 83% (5 of 6 steps done)

---

## Getting Help

1. **Architecture questions**: Review ADR-200
2. **Specific features**: Check corresponding ADR (ADR-201, ADR-202, etc.)
3. **Test examples**: Look at existing test files in `scripts/`
4. **Code examples**: Grep for patterns in completed systems

---

**Last Updated**: Feb 13, 2026
**Maintained By**: Claude Code AI
**Next Update**: Phase D Step 6 completion
