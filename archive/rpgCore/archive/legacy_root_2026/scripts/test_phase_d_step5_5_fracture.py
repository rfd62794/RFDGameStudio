#!/usr/bin/env python3
"""
Phase D Step 5.5a Verification - Fracture System

Tests:
1. FractureSystem initialization and lifecycle
2. Fragment creation and pool management
3. Asteroid fracturing with size progression (3->2->1)
4. Genetic trait inheritance and evolution
5. Wave difficulty calculation
6. Fragment damage tracking
7. Factory functions for configurations
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.body import (
    FractureSystem,
    AsteroidFragment,
    GeneticTraits,
    create_classic_fracture_system,
    create_genetic_fracture_system,
    create_hard_fracture_system,
)
from game_engine.systems.body.entity_manager import SpaceEntity
from game_engine.foundation import SystemConfig, SystemStatus


def test_1_fracture_system_initialization():
    """Test 1: FractureSystem initialization and lifecycle"""
    print("\n[TEST 1] FractureSystem initialization and lifecycle")

    config = SystemConfig(name="TestFractureSystem", performance_monitoring=True)
    system = FractureSystem(config, max_fragments=50)

    # Test initialization
    assert system.initialize() == True, "Failed to initialize"
    assert system.status == SystemStatus.RUNNING, "Status not RUNNING"
    assert len(system.fragment_pool) == 50, "Pool not initialized correctly"
    print("[OK] Initialization successful")

    # Test shutdown
    system.shutdown()
    assert system.status == SystemStatus.STOPPED, "Status not STOPPED"
    print("[OK] Shutdown successful")


def test_2_fragment_pool_management():
    """Test 2: Fragment pool management and recycling"""
    print("\n[TEST 2] Fragment pool management and recycling")

    system = FractureSystem(max_fragments=10)
    system.initialize()

    # Create a fragment by fractioning
    entity = SpaceEntity()
    entity.x = 80.0
    entity.y = 72.0
    entity.vx = 0.0
    entity.vy = 0.0

    result = system.fracture_entity(entity, size=3)
    assert result.success == True, f"Fracture failed: {result.error}"
    assert len(result.value) == 2, "Should create 2 fragments from size 3"
    print("[OK] Created 2 fragments from size 3 asteroid")

    # Check pools
    assert len(system.fragment_pool) < 10, "Pool should have been consumed"
    assert len(system.active_fragments) == 2, "Should have 2 active fragments"
    print("[OK] Fragment pools updated correctly")

    system.shutdown()


def test_3_fracture_cascade():
    """Test 3: Fracture cascade - 3->2->1"""
    print("\n[TEST 3] Fracture cascade (size 3 -> 2 -> 1)")

    system = FractureSystem(max_fragments=100, enable_genetics=False)
    system.initialize()

    # Create large asteroid
    entity_large = SpaceEntity()
    entity_large.x = 80.0
    entity_large.y = 72.0

    # Fracture large (3) -> medium (2) x2
    result1 = system.fracture_entity(entity_large, size=3)
    assert result1.success == True, "Failed to fracture size 3"
    assert len(result1.value) == 2, "Should have 2 medium fragments"
    medium_fragments = result1.value
    print("[OK] Size 3 fractured into 2 size-2 fragments")

    # Fracture one medium (2) -> small (1) x2
    result2 = system.fracture_entity(medium_fragments[0].entity, size=2)
    assert result2.success == True, "Failed to fracture size 2"
    assert len(result2.value) == 2, "Should have 2 small fragments"
    print("[OK] Size 2 fractured into 2 size-1 fragments")

    # Try to fracture small (1) - should return no fragments
    result3 = system.fracture_entity(result2.value[0].entity, size=1)
    assert result3.success == True, "Should succeed for size 1"
    assert len(result3.value) == 0, "Size 1 should not fracture"
    print("[OK] Size 1 does not fracture (destroyed)")

    system.shutdown()


def test_4_genetic_inheritance():
    """Test 4: Genetic trait inheritance and evolution"""
    print("\n[TEST 4] Genetic trait inheritance and evolution")

    system = FractureSystem(max_fragments=100, enable_genetics=True)
    system.initialize()

    # Create initial genetic traits
    parent_traits = GeneticTraits(
        speed_modifier=1.2,
        size_modifier=1.1,
        mass_modifier=0.95,
        color_shift=45,
        generation=0
    )

    # Fracture with genetic traits
    entity = SpaceEntity()
    entity.x = 80.0
    entity.y = 72.0

    result = system.fracture_entity(entity, size=3, genetic_traits=parent_traits)
    assert result.success == True, "Fracture with genetics failed"
    fragments = result.value

    # Check that fragments inherited traits
    for fragment in fragments:
        assert fragment.genetic_traits is not None, "Fragment should have genetic traits"
        assert fragment.genetic_traits.generation == 1, "Generation should increment"
        print(f"[OK] Fragment generation {fragment.genetic_traits.generation} with "
              f"speed_mod {fragment.genetic_traits.speed_modifier:.2f}")

    # Check genetics tracking
    assert len(system.discovered_patterns) >= len(fragments), "Patterns should be tracked"
    print("[OK] Genetic patterns discovered and tracked")

    system.shutdown()


def test_5_wave_difficulty_calculation():
    """Test 5: Wave difficulty progression"""
    print("\n[TEST 5] Wave difficulty calculation")

    system = FractureSystem()
    system.initialize()

    # Test early waves
    wave1 = system.calculate_wave_difficulty(1)
    assert wave1['asteroid_count'] == 4, "Wave 1 should have 4 asteroids"
    assert wave1['speed_multiplier'] == 1.0, "Wave 1 should have 1.0x speed"
    print("[OK] Wave 1: 4 asteroids, 1.0x speed")

    # Test mid waves
    wave5 = system.calculate_wave_difficulty(5)
    assert wave5['asteroid_count'] > wave1['asteroid_count'], "Wave 5 should have more asteroids"
    assert wave5['speed_multiplier'] > 1.0, "Wave 5 should be faster"
    print(f"[OK] Wave 5: {wave5['asteroid_count']} asteroids, {wave5['speed_multiplier']:.1f}x speed")

    # Test difficulty scaling
    wave10 = system.calculate_wave_difficulty(10)
    assert wave10['asteroid_count'] <= 12, "Wave 10 should be capped at 12"
    assert wave10['speed_multiplier'] == 1.9, "Wave 10 should be 1.9x speed"
    print(f"[OK] Wave 10: {wave10['asteroid_count']} asteroids, {wave10['speed_multiplier']:.1f}x speed")

    system.shutdown()


def test_6_fragment_damage_tracking():
    """Test 6: Fragment damage and destruction"""
    print("\n[TEST 6] Fragment damage tracking and destruction")

    system = FractureSystem(max_fragments=10)
    system.initialize()

    # Get a medium fragment
    entity = SpaceEntity()
    entity.x = 80.0
    entity.y = 72.0
    result = system.fracture_entity(entity, size=2)
    fragments = result.value
    assert len(fragments) == 2, "Should have fragments"
    print("[OK] Fragment created (health=2)")

    fragment = fragments[0]
    initial_health = fragment.health

    # Apply some damage but not lethal (health is 2, apply 0.5)
    destroyed = fragment.take_damage(0.5)
    assert destroyed == False, f"Should not be destroyed with partial damage (health={fragment.health})"
    assert abs(fragment.health - (initial_health - 0.5)) < 0.01, "Health should decrease"
    print("[OK] Fragment took 0.5 damage, health decreased to 1.5")

    # Apply lethal damage to destroy
    destroyed = fragment.take_damage(2.0)  # 1.5 - 2.0 = -0.5 (destroyed)
    assert destroyed == True, f"Should be destroyed (health={fragment.health})"
    print("[OK] Fragment destroyed when health <= 0")

    system.shutdown()


def test_7_factory_functions():
    """Test 7: Factory functions for configurations"""
    print("\n[TEST 7] Factory functions for configurations")

    # Classic system (no genetics)
    classic = create_classic_fracture_system()
    assert classic.enable_genetics == False, "Classic should not have genetics"
    print("[OK] Classic fracture system created (no genetics)")

    # Genetic system
    genetic = create_genetic_fracture_system()
    assert genetic.enable_genetics == True, "Genetic system should have genetics"
    print("[OK] Genetic fracture system created (genetics enabled)")

    # Hard system
    hard = create_hard_fracture_system()
    assert hard.enable_genetics == True, "Hard system should have genetics"
    assert hard.fragment_speed_range[0] > 15.0, "Hard should have faster fragments"
    print("[OK] Hard fracture system created (faster fragments)")


def test_8_fracture_system_status():
    """Test 8: System status and statistics"""
    print("\n[TEST 8] Fracture system status and statistics")

    system = FractureSystem(max_fragments=20, enable_genetics=True)
    system.initialize()

    # Fracture some asteroids
    for i in range(3):
        entity = SpaceEntity()
        entity.x = 80.0 + i
        entity.y = 72.0
        system.fracture_entity(entity, size=3)

    # Get status
    status = system.get_status()
    assert status['active_fragments'] == 6, "Should have 6 fragments (3x2)"
    assert status['pool_available'] < 20, "Pool should be partially consumed"
    assert status['total_fractured'] == 3, "Should have fractured 3 asteroids"
    assert status['genetics_enabled'] == True, "Genetics should be enabled"
    print("[OK] Status report contains expected fields")

    # Check distribution
    dist = status['size_distribution']
    assert dist[2] == 6, "Should have 6 medium fragments"
    print(f"[OK] Size distribution: {dist}")

    system.shutdown()


def main():
    """Run all Phase D Step 5.5a fracture tests"""
    print("=" * 60)
    print("PHASE D STEP 5.5a: Fracture System Tests")
    print("=" * 60)

    try:
        test_1_fracture_system_initialization()
        test_2_fragment_pool_management()
        test_3_fracture_cascade()
        test_4_genetic_inheritance()
        test_5_wave_difficulty_calculation()
        test_6_fragment_damage_tracking()
        test_7_factory_functions()
        test_8_fracture_system_status()

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
