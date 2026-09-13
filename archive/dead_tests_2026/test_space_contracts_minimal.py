"""
Minimal Space Physics Contract Tests

Phase 1: Interface Definition & Hardening

Focused contract tests that avoid complex import chains to validate
the core architectural improvements made to the space engine.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List

# Add src to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

# Direct imports to avoid circular dependencies
try:
    from dgt_core.foundation.types import Result, ValidationResult
    from dgt_engine.engines.space.vector2 import Vector2
    from dgt_engine.engines.space.space_entity import SpaceEntity, EntityType
    IMPORTS_AVAILABLE = True
    print("✅ Core imports successful")
except ImportError as e:
    print(f"❌ Import Error: {e}")
    IMPORTS_AVAILABLE = False


def test_result_pattern_implementation():
    """Test that SpaceEntity properly implements Result[T] pattern"""
    if not IMPORTS_AVAILABLE:
        print("⚠️ Skipping test - imports not available")
        return False
    
    print("🧪 Testing Result[T] pattern implementation...")
    
    try:
        # Create test entity
        entity = SpaceEntity(
            EntityType.SHIP, 
            Vector2(80, 72), 
            Vector2(0, 0), 
            0.0
        )
        
        # Test update returns Result[None]
        result = entity.update(0.016)  # 60Hz timestep
        assert isinstance(result, Result), f"update() returned {type(result)}, expected Result"
        assert result.success is True, "update() should succeed"
        assert result.value is None, "update() should return None on success"
        print("  ✅ update() returns Result[None]")
        
        # Test collision check returns Result[bool]
        other = SpaceEntity(
            EntityType.LARGE_ASTEROID,
            Vector2(90, 72),
            Vector2(0, 0),
            0.0
        )
        collision_result = entity.check_collision(other)
        assert isinstance(collision_result, Result), f"check_collision() returned {type(collision_result)}, expected Result"
        assert isinstance(collision_result.value, bool), "check_collision() should return bool"
        print("  ✅ check_collision() returns Result[bool]")
        
        # Test thrust application returns Result[None]
        thrust_result = entity.apply_thrust(150.0)
        assert isinstance(thrust_result, Result), f"apply_thrust() returned {type(thrust_result)}, expected Result"
        assert thrust_result.success is True, "apply_thrust() should succeed"
        print("  ✅ apply_thrust() returns Result[None]")
        
        # Test rotation returns Result[None]
        rotation_result = entity.rotate(1.0)
        assert isinstance(rotation_result, Result), f"rotate() returned {type(rotation_result)}, expected Result"
        assert rotation_result.success is True, "rotate() should succeed"
        print("  ✅ rotate() returns Result[None]")
        
        # Test state serialization returns Result[Dict]
        state_result = entity.get_state_dict()
        assert isinstance(state_result, Result), f"get_state_dict() returned {type(state_result)}, expected Result"
        assert isinstance(state_result.value, dict), "get_state_dict() should return dict"
        print("  ✅ get_state_dict() returns Result[Dict]")
        
        # Test asteroid splitting returns Result[List]
        asteroid = SpaceEntity(
            EntityType.LARGE_ASTEROID,
            Vector2(80, 72),
            Vector2(0, 0),
            0.0
        )
        split_result = asteroid.split_asteroid()
        assert isinstance(split_result, Result), f"split_asteroid() returned {type(split_result)}, expected Result"
        assert isinstance(split_result.value, list), "split_asteroid() should return list"
        print("  ✅ split_asteroid() returns Result[List]")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        return False


def test_sovereign_constraint_compliance():
    """Test compliance with 160x144 sovereign resolution"""
    if not IMPORTS_AVAILABLE:
        print("⚠️ Skipping test - imports not available")
        return False
    
    print("🧪 Testing sovereign constraint compliance...")
    
    try:
        entity = SpaceEntity(
            EntityType.SHIP,
            Vector2(80, 72),
            Vector2(0, 0),
            0.0
        )
        
        # Test toroidal wrapping
        entity.position = Vector2(-10, 50)  # Outside left boundary
        entity.update(0.016)
        assert 0 <= entity.position.x < 160, f"X coordinate {entity.position.x} should wrap to sovereign bounds"
        print("  ✅ Left boundary wrapping")
        
        entity.position = Vector2(170, 50)  # Outside right boundary
        entity.update(0.016)
        assert 0 <= entity.position.x < 160, f"X coordinate {entity.position.x} should wrap to sovereign bounds"
        print("  ✅ Right boundary wrapping")
        
        entity.position = Vector2(80, -10)  # Outside top boundary
        entity.update(0.016)
        assert 0 <= entity.position.y < 144, f"Y coordinate {entity.position.y} should wrap to sovereign bounds"
        print("  ✅ Top boundary wrapping")
        
        entity.position = Vector2(80, 150)  # Outside bottom boundary
        entity.update(0.016)
        assert 0 <= entity.position.y < 144, f"Y coordinate {entity.position.y} should wrap to sovereign bounds"
        print("  ✅ Bottom boundary wrapping")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        return False


def test_newtonian_physics_compliance():
    """Test Newtonian physics implementation"""
    if not IMPORTS_AVAILABLE:
        print("⚠️ Skipping test - imports not available")
        return False
    
    print("🧪 Testing Newtonian physics compliance...")
    
    try:
        entity = SpaceEntity(
            EntityType.SHIP,
            Vector2(80, 72),
            Vector2(10, 0),  # Moving right
            0.0
        )
        
        initial_position = entity.position.x
        initial_velocity = entity.velocity.x
        
        # Update physics (no friction in Newtonian space)
        dt = 0.016  # 60Hz
        entity.update(dt)
        
        # Position should change based on velocity
        assert entity.position.x > initial_position, f"Position should update based on velocity"
        print("  ✅ Position updates based on velocity")
        
        # Velocity should remain constant (no friction)
        assert abs(entity.velocity.x - initial_velocity) < 0.001, f"Velocity should remain constant"
        print("  ✅ Velocity remains constant (no friction)")
        
        # Test thrust changes velocity
        entity.apply_thrust(150.0)
        entity.update(dt)
        assert entity.velocity.x > initial_velocity, f"Thrust should change velocity"
        print("  ✅ Thrust changes velocity")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        return False


def test_entity_type_initialization():
    """Test proper initialization of different entity types"""
    if not IMPORTS_AVAILABLE:
        print("⚠️ Skipping test - imports not available")
        return False
    
    print("🧪 Testing entity type initialization...")
    
    try:
        # Test ship initialization
        ship = SpaceEntity(EntityType.SHIP, Vector2(80, 72), Vector2(0, 0), 0.0)
        assert ship.entity_type == EntityType.SHIP
        assert ship.radius == 4.0
        assert ship.mass == 1.0
        assert ship.thrust_force == 150.0
        assert len(ship.vertices) == 3  # Triangle shape
        print("  ✅ Ship initialization")
        
        # Test large asteroid initialization
        asteroid = SpaceEntity(EntityType.LARGE_ASTEROID, Vector2(80, 72), Vector2(0, 0), 0.0)
        assert asteroid.entity_type == EntityType.LARGE_ASTEROID
        assert asteroid.radius == 12.0
        assert asteroid.mass == 4.0
        assert asteroid.velocity.magnitude() > 0  # Should have random velocity
        print("  ✅ Large asteroid initialization")
        
        # Test bullet initialization
        bullet = SpaceEntity(EntityType.BULLET, Vector2(80, 72), Vector2(0, 0), 0.0)
        assert bullet.entity_type == EntityType.BULLET
        assert bullet.radius == 1.0
        assert bullet.mass == 0.1
        assert bullet.lifetime == 1.0
        assert bullet.velocity.magnitude() == 300.0  # Fast bullet speed
        print("  ✅ Bullet initialization")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        return False


def test_error_handling_patterns():
    """Test consistent error handling patterns"""
    if not IMPORTS_AVAILABLE:
        print("⚠️ Skipping test - imports not available")
        return False
    
    print("🧪 Testing error handling patterns...")
    
    try:
        entity = SpaceEntity(
            EntityType.SHIP,
            Vector2(80, 72),
            Vector2(0, 0),
            0.0
        )
        
        # Test invalid thrust should still succeed but set thrust to 0 for non-ship
        scrap = SpaceEntity(EntityType.SCRAP, Vector2(80, 72), Vector2(0, 0), 0.0)
        thrust_result = scrap.apply_thrust(150.0)
        assert isinstance(thrust_result, Result), f"Should return Result even for invalid operations"
        assert thrust_result.success is True, f"Should handle invalid operations gracefully"
        print("  ✅ Invalid thrust handled gracefully")
        
        # Test collision with inactive entity
        entity.active = False
        collision_result = entity.check_collision(scrap)
        assert collision_result.success is True, f"Collision check should succeed"
        assert collision_result.value is False, f"Inactive entities should not collide"
        print("  ✅ Inactive entity collision handled")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        return False


def run_all_tests():
    """Run all contract tests"""
    print("🚀 Starting Minimal Space Physics Contract Tests")
    print("=" * 60)
    
    tests = [
        ("Result[T] Pattern Implementation", test_result_pattern_implementation),
        ("Sovereign Constraint Compliance", test_sovereign_constraint_compliance),
        ("Newtonian Physics Compliance", test_newtonian_physics_compliance),
        ("Entity Type Initialization", test_entity_type_initialization),
        ("Error Handling Patterns", test_error_handling_patterns),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All contract tests passed! Space engine architecture is solid.")
        return True
    else:
        print("⚠️ Some tests failed. Review implementation.")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
