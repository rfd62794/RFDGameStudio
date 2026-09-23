#!/usr/bin/env python3
"""
Phase D Step 1 Verification - ECS Infrastructure

Tests:
1. EntityManager initialization and lifecycle
2. Entity pooling and object reuse
3. Component composition on entities
4. Intent-based entity spawning/despawning
5. Multi-game-type entity specialization
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.body import (
    EntityManager,
    Entity,
    EntityComponent,
    ObjectPool,
    SpaceEntity,
    RPGEntity,
    TycoonEntity,
)
from game_engine.foundation import SystemConfig, SystemStatus


def test_1_entity_manager_initialization():
    """Test 1: EntityManager initialization and lifecycle"""
    print("\n[TEST 1] EntityManager initialization and lifecycle")

    config = SystemConfig(name="TestEntityManager", performance_monitoring=True)
    manager = EntityManager(config)

    # Test initialization
    assert manager.initialize() == True, "✗ Failed to initialize"
    assert manager.status == SystemStatus.RUNNING, "✗ Status not RUNNING"
    assert manager._initialized == True, "✗ _initialized flag not set"
    print("[OK] Initialization successful")

    # Test shutdown
    manager.shutdown()
    assert manager.status == SystemStatus.STOPPED, "✗ Status not STOPPED"
    print("[OK] Shutdown successful")


def test_2_entity_pooling():
    """Test 2: Entity pooling and object reuse"""
    print("\n[TEST 2] Entity pooling and object reuse")

    manager = EntityManager()
    manager.initialize()

    # Register entity type
    result = manager.register_entity_type("test_entity", Entity, pool_size=5)
    assert result.success == True, f"✗ Failed to register: {result.error}"
    print("[OK] Entity type registered")

    # Spawn entities
    entities = []
    for i in range(3):
        result = manager.spawn_entity("test_entity")
        assert result.success == True, f"✗ Failed to spawn: {result.error}"
        entities.append(result.value)

    assert len(entities) == 3, "✗ Wrong number of entities spawned"
    print("[OK] Spawned 3 entities from pool")

    # Check pool status
    status = manager.get_status()
    assert status['pool_details']['test_entity']['active'] == 3, "✗ Wrong active count"
    assert status['pool_details']['test_entity']['pooled'] == 2, "✗ Wrong pooled count"
    print("[OK] Pool status correct (3 active, 2 pooled)")

    # Despawn entity - should return to pool
    result = manager.despawn_entity(entities[0].id)
    assert result.success == True, f"✗ Failed to despawn: {result.error}"

    status = manager.get_status()
    assert status['pool_details']['test_entity']['active'] == 2, "✗ Active count not decremented"
    assert status['pool_details']['test_entity']['pooled'] == 3, "✗ Pooled count not incremented"
    print("[OK] Entity returned to pool after despawn")

    manager.shutdown()


def test_3_component_composition():
    """Test 3: Component composition on entities"""
    print("\n[TEST 3] Component composition on entities")

    class TestComponent(EntityComponent):
        def __init__(self):
            super().__init__()
            self.update_count = 0
            self.initialized = False
            self.was_shutdown = False

        def initialize(self):
            self.initialized = True

        def update(self, dt: float):
            self.update_count += 1

        def shutdown(self):
            self.was_shutdown = True

    manager = EntityManager()
    manager.initialize()

    # Register entity type
    manager.register_entity_type("component_test", Entity, pool_size=1)

    # Spawn entity and add components
    result = manager.spawn_entity("component_test")
    entity = result.value

    comp1 = TestComponent()
    comp2 = TestComponent()

    entity.add_component("comp1", comp1)
    entity.add_component("comp2", comp2)

    assert entity.has_component("comp1"), "✗ Component not added"
    assert entity.has_component("comp2"), "✗ Component not added"
    assert comp1.initialized == True, "✗ Component not initialized"
    assert comp2.initialized == True, "✗ Component not initialized"
    print("[OK] Components added and initialized")

    # Update entity (should update components)
    entity.update(0.016)
    assert comp1.update_count == 1, "✗ Component not updated"
    assert comp2.update_count == 1, "✗ Component not updated"
    print("[OK] Components updated with entity")

    # Remove component
    entity.remove_component("comp1")
    assert entity.has_component("comp1") == False, "✗ Component not removed"
    assert comp1.was_shutdown == True, "✗ Component not shut down"
    print("[OK] Component removed and shut down")

    manager.shutdown()


def test_4_intent_based_entity_operations():
    """Test 4: Intent-based entity spawning/despawning"""
    print("\n[TEST 4] Intent-based entity spawning/despawning")

    manager = EntityManager()
    manager.initialize()

    # Register entity type
    manager.register_entity_type("space_entity", SpaceEntity, pool_size=5)

    # Intent: spawn entity
    result = manager.process_intent({
        "action": "spawn",
        "entity_type": "space_entity",
        "kwargs": {"x": 10.0, "y": 20.0, "angle": 45.0}
    })

    assert "entity_id" in result, f"✗ Spawn intent failed: {result}"
    entity_id = result["entity_id"]
    entity = manager.get_entity(entity_id)
    assert entity.x == 10.0, "✗ Entity x not set"
    assert entity.y == 20.0, "✗ Entity y not set"
    assert entity.angle == 45.0, "✗ Entity angle not set"
    print("[OK] Intent-based spawn with properties")

    # Intent: get entities
    result = manager.process_intent({
        "action": "get_entities",
        "entity_type": "space_entity"
    })

    assert result["count"] == 1, f"✗ Wrong entity count: {result['count']}"
    print("[OK] Intent-based entity query")

    # Intent: despawn entity
    result = manager.process_intent({
        "action": "despawn",
        "entity_id": entity_id
    })

    assert result["success"] == True, f"✗ Despawn intent failed: {result}"
    assert manager.get_entity(entity_id) is None, "✗ Entity not removed"
    print("[OK] Intent-based despawn")

    manager.shutdown()


def test_5_multi_game_type_entities():
    """Test 5: Multi-game-type entity specialization"""
    print("\n[TEST 5] Multi-game-type entity specialization")

    manager = EntityManager()
    manager.initialize()

    # Register different entity types for different genres
    manager.register_entity_type("space_entity", SpaceEntity, pool_size=3)
    manager.register_entity_type("rpg_entity", RPGEntity, pool_size=3)
    manager.register_entity_type("tycoon_entity", TycoonEntity, pool_size=3)

    # Spawn space entity
    space_result = manager.spawn_entity("space_entity", x=100.0, y=200.0, vx=50.0)
    space_entity = space_result.value
    assert isinstance(space_entity, SpaceEntity), "✗ Not SpaceEntity"
    assert space_entity.vx == 50.0, "✗ Space entity velocity not set"
    print("[OK] Space entity created with physics properties")

    # Spawn RPG entity
    rpg_result = manager.spawn_entity("rpg_entity", name="Hero", level=5, health=150)
    rpg_entity = rpg_result.value
    assert isinstance(rpg_entity, RPGEntity), "✗ Not RPGEntity"
    assert rpg_entity.name == "Hero", "✗ RPG entity name not set"
    assert rpg_entity.level == 5, "✗ RPG entity level not set"
    print("[OK] RPG entity created with attributes")

    # Spawn tycoon entity
    tycoon_result = manager.spawn_entity("tycoon_entity", name="Store", wealth=5000.0)
    tycoon_entity = tycoon_result.value
    assert isinstance(tycoon_entity, TycoonEntity), "✗ Not TycoonEntity"
    assert tycoon_entity.wealth == 5000.0, "✗ Tycoon entity wealth not set"
    print("[OK] Tycoon entity created with business properties")

    # Verify separate pools
    status = manager.get_status()
    assert len(status['registered_types']) == 3, "✗ Wrong number of entity types"
    assert status['pool_details']['space_entity']['active'] == 1, "✗ Space entity pool wrong"
    assert status['pool_details']['rpg_entity']['active'] == 1, "✗ RPG entity pool wrong"
    assert status['pool_details']['tycoon_entity']['active'] == 1, "✗ Tycoon entity pool wrong"
    print("[OK] All entity pools maintained separately")

    manager.shutdown()


def main():
    """Run all Phase D Step 1 tests"""
    print("=" * 60)
    print("PHASE D STEP 1: ECS Infrastructure Tests")
    print("=" * 60)

    try:
        test_1_entity_manager_initialization()
        test_2_entity_pooling()
        test_3_component_composition()
        test_4_intent_based_entity_operations()
        test_5_multi_game_type_entities()

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
