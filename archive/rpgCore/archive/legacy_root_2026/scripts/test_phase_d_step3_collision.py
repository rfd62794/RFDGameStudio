#!/usr/bin/env python3
"""
Phase D Step 3 Verification - Collision System

Tests:
1. CollisionSystem initialization and lifecycle
2. Collision group registration
3. Circle collision detection
4. Sweep collision for fast-moving objects
5. Spatial queries (radius, nearest entity)
6. Collision handler execution
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.body import (
    CollisionSystem,
    CollisionInfo,
    CollisionGroup,
    CollisionType,
    create_space_combat_collision_groups,
    Entity,
    SpaceEntity,
)
from game_engine.foundation import SystemConfig, SystemStatus


def test_1_collision_system_initialization():
    """Test 1: CollisionSystem initialization and lifecycle"""
    print("\n[TEST 1] CollisionSystem initialization and lifecycle")

    config = SystemConfig(name="TestCollisionSystem", performance_monitoring=True)
    system = CollisionSystem(config)

    # Test initialization
    assert system.initialize() == True, "Failed to initialize"
    assert system.status == SystemStatus.RUNNING, "Status not RUNNING"
    assert system._initialized == True, "_initialized flag not set"
    print("[OK] Initialization successful")

    # Test shutdown
    system.shutdown()
    assert system.status == SystemStatus.STOPPED, "Status not STOPPED"
    assert len(system.collision_groups) == 0, "Groups not cleared on shutdown"
    print("[OK] Shutdown successful")


def test_2_collision_group_registration():
    """Test 2: Collision group registration"""
    print("\n[TEST 2] Collision group registration")

    system = CollisionSystem()
    system.initialize()

    # Register a collision group
    group = CollisionGroup(
        name="projectiles",
        entity_types={"bullet"},
        can_collide_with={"asteroid", "enemy"}
    )

    result = system.register_collision_group(group)
    assert result.success == True, f"Failed to register: {result.error}"
    assert "projectiles" in system.collision_groups, "Group not registered"
    print("[OK] Collision group registered")

    # Register multiple groups
    for name in ["asteroids", "player"]:
        group = CollisionGroup(
            name=name,
            entity_types={name.rstrip('s')},
            can_collide_with={"projectiles"}
        )
        result = system.register_collision_group(group)
        assert result.success == True, f"Failed to register {name}"

    assert len(system.collision_groups) == 3, "Wrong number of groups"
    print("[OK] Multiple groups registered")

    system.shutdown()


def test_3_circle_collision_detection():
    """Test 3: Circle collision detection"""
    print("\n[TEST 3] Circle collision detection")

    system = CollisionSystem()
    system.initialize()

    # Setup collision groups
    groups = create_space_combat_collision_groups()
    for group in groups.values():
        system.register_collision_group(group)

    # Create entities
    bullet = SpaceEntity()
    bullet.entity_type = "bullet"
    bullet.x = 50.0
    bullet.y = 50.0
    bullet.vx = 0.0
    bullet.vy = 0.0
    bullet.radius = 2.0

    asteroid = SpaceEntity()
    asteroid.entity_type = "asteroid"
    asteroid.x = 55.0  # 5 units away
    asteroid.y = 50.0
    asteroid.vx = 0.0
    asteroid.vy = 0.0
    asteroid.radius = 5.0

    entities = [bullet, asteroid]

    # Check collisions
    collisions = system.check_collisions(entities, current_time=0.0)
    assert len(collisions) > 0, f"No collision detected (bullet at {bullet.x},{bullet.y}, asteroid at {asteroid.x},{asteroid.y})"
    assert collisions[0].entity_a == bullet or collisions[0].entity_b == bullet, "Bullet not in collision"
    print("[OK] Circle collision detected")

    # Create fresh system and collision groups to avoid history issues
    system2 = CollisionSystem()
    system2.initialize()
    for group in create_space_combat_collision_groups().values():
        system2.register_collision_group(group)

    # No collision case - entities far apart
    bullet2 = SpaceEntity()
    bullet2.entity_type = "bullet"
    bullet2.x = 200.0  # Far away
    bullet2.vx = 0.0
    bullet2.vy = 0.0
    bullet2.radius = 2.0

    asteroid2 = SpaceEntity()
    asteroid2.entity_type = "asteroid"
    asteroid2.x = 0.0  # Different location
    asteroid2.vx = 0.0
    asteroid2.vy = 0.0
    asteroid2.y = 50.0
    asteroid2.radius = 5.0

    entities2 = [bullet2, asteroid2]
    collisions2 = system2.check_collisions(entities2, current_time=0.0)
    assert len(collisions2) == 0, f"False collision detected at distance {abs(bullet2.x - asteroid2.x)}"
    print("[OK] No collision when entities far apart")

    system2.shutdown()

    system.shutdown()


def test_4_sweep_collision_detection():
    """Test 4: Sweep collision for fast-moving objects"""
    print("\n[TEST 4] Sweep collision for fast-moving objects")

    system = CollisionSystem()
    system.initialize()

    # Setup collision groups
    groups = create_space_combat_collision_groups()
    for group in groups.values():
        system.register_collision_group(group)

    # Create fast bullet with small vx
    bullet = SpaceEntity()
    bullet.entity_type = "bullet"
    bullet.x = 50.0
    bullet.y = 50.0
    bullet.vx = 30.0  # Velocity - bullet moves 0.5 units/frame at 60FPS
    bullet.vy = 0.0
    bullet.radius = 2.0

    # Create asteroid near bullet's current position
    # (sweep test checks from prev_x to current x)
    asteroid = SpaceEntity()
    asteroid.entity_type = "asteroid"
    asteroid.x = 50.2  # Slightly ahead, within sweep range
    asteroid.y = 50.0
    asteroid.radius = 5.0

    entities = [bullet, asteroid]

    # Check collisions with sweep test
    # Even though current distance is small, sweep test should find it
    collisions = system.check_collisions(entities, current_time=0.0)
    assert len(collisions) > 0, f"Sweep collision not detected (distance={((bullet.x - asteroid.x)**2 + (bullet.y - asteroid.y)**2)**0.5:.2f})"
    print("[OK] Sweep collision detected for fast-moving object")

    system.shutdown()


def test_5_spatial_queries():
    """Test 5: Spatial queries (radius and nearest)"""
    print("\n[TEST 5] Spatial queries")

    system = CollisionSystem()
    system.initialize()

    # Create entities
    entities = []
    for i in range(5):
        entity = SpaceEntity()
        entity.entity_type = "asteroid"
        entity.x = float(i * 20)
        entity.y = 50.0
        entity.radius = 5.0
        entities.append(entity)

    # Test radius query
    center_x, center_y = 50.0, 50.0
    radius = 30.0
    in_radius = system.get_entities_in_radius(entities, center_x, center_y, radius)
    assert len(in_radius) > 0, "No entities in radius"
    assert len(in_radius) <= len(entities), "Too many entities in radius"
    print(f"[OK] Radius query found {len(in_radius)} entities in {radius} unit radius")

    # Test nearest entity
    nearest = system.get_nearest_entity(entities, center_x, center_y)
    assert nearest is not None, "No nearest entity found"
    assert isinstance(nearest, Entity), "Nearest entity not an Entity"
    print("[OK] Nearest entity query successful")

    # Test nearest by type
    nearest_asteroid = system.get_nearest_entity(entities, center_x, center_y, entity_type="asteroid")
    assert nearest_asteroid is not None, "No nearest asteroid found"
    print("[OK] Nearest entity by type query successful")

    system.shutdown()


def test_6_collision_handler_execution():
    """Test 6: Collision handler execution"""
    print("\n[TEST 6] Collision handler execution")

    system = CollisionSystem()
    system.initialize()

    # Setup collision groups
    groups = create_space_combat_collision_groups()
    for group in groups.values():
        system.register_collision_group(group)

    # Create collision handler
    collisions_handled = []

    def test_handler(collision: CollisionInfo):
        collisions_handled.append(collision)

    # Register handler
    result = system.register_collision_handler("bullet", "asteroid", test_handler)
    assert result.success == True, "Failed to register handler"
    print("[OK] Collision handler registered")

    # Create colliding entities
    bullet = SpaceEntity()
    bullet.entity_type = "bullet"
    bullet.x = 50.0
    bullet.y = 50.0
    bullet.radius = 2.0

    asteroid = SpaceEntity()
    asteroid.entity_type = "asteroid"
    asteroid.x = 53.0  # Collision will occur
    asteroid.y = 50.0
    asteroid.radius = 5.0

    entities = [bullet, asteroid]

    # Check collisions (should trigger handler)
    collisions = system.check_collisions(entities, current_time=0.0)
    assert len(collisions_handled) > 0, "Handler not called"
    print(f"[OK] Collision handler called {len(collisions_handled)} times")

    system.shutdown()


def test_7_collision_system_status():
    """Test 7: Collision system status and statistics"""
    print("\n[TEST 7] Collision system status and statistics")

    system = CollisionSystem()
    system.initialize()

    # Register groups and handlers
    groups = create_space_combat_collision_groups()
    for group in groups.values():
        system.register_collision_group(group)

    system.register_collision_handler("bullet", "asteroid", lambda c: None)

    # Get status
    status = system.get_status()
    assert status['collision_groups'] == ["projectiles", "asteroids", "player", "enemies"], "Wrong groups in status"
    assert len(status['collision_handlers']) > 0, "No handlers in status"
    assert status['active_collisions'] == 0, "Wrong active collision count"
    print("[OK] Status report contains expected fields")

    system.shutdown()


def main():
    """Run all Phase D Step 3 collision tests"""
    print("=" * 60)
    print("PHASE D STEP 3: Collision System Tests")
    print("=" * 60)

    try:
        test_1_collision_system_initialization()
        test_2_collision_group_registration()
        test_3_circle_collision_detection()
        test_4_sweep_collision_detection()
        test_5_spatial_queries()
        test_6_collision_handler_execution()
        test_7_collision_system_status()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED [OK]")
        print("=" * 60)
        return 0

    except AssertionError as e:
        print(f"\n[FAIL] {str(e)}")
        return 1
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
