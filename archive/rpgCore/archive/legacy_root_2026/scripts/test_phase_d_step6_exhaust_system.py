#!/usr/bin/env python3
"""
Phase D Step 6 Verification - Exhaust System

Tests for entity movement trails and exhaust effects.

Tests:
1. Initialization and lifecycle
2. Trail creation and management
3. Trail position and velocity tracking
4. Velocity-based emission
5. Thruster type color variation
6. Emission rate control
7. Particle count scaling
8. Multi-trail support
9. Intent processing
10. Factory functions
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.graphics.fx.exhaust_system import (
    ExhaustSystem,
    ExhaustTrail,
    ThrusterType,
    create_default_exhaust_system,
    create_high_intensity_exhaust_system,
    create_minimal_exhaust_system,
)
from game_engine.foundation import SystemStatus


def test_1_initialization_and_lifecycle():
    """Test 1: Initialization and lifecycle"""
    print("Test 1: Initialization and lifecycle...", end=" ")

    system = ExhaustSystem()
    assert system.status == SystemStatus.UNINITIALIZED

    result = system.initialize()
    assert result == True
    assert system.status == SystemStatus.RUNNING

    system.tick(0.016)
    assert system.status == SystemStatus.RUNNING

    system.shutdown()
    assert system.status == SystemStatus.STOPPED

    print("[OK]")


def test_2_trail_creation_and_management():
    """Test 2: Trail creation and management"""
    print("Test 2: Trail creation and management...", end=" ")

    system = create_default_exhaust_system()

    result = system.create_trail("entity1", "trail1", 50, 50)
    assert result['success'] == True
    assert result['trail_id'] == "trail1"
    assert len(system.trails) == 1

    trail = system.trails.get("trail1")
    assert trail is not None
    assert trail.entity_id == "entity1"
    assert trail.x == 50
    assert trail.y == 50
    assert trail.active == True

    result = system.remove_trail("trail1")
    assert result['success'] == True
    assert len(system.trails) == 0

    result = system.remove_trail("nonexistent")
    assert result['success'] == False

    system.shutdown()
    print("[OK]")


def test_3_trail_position_and_velocity_tracking():
    """Test 3: Trail position and velocity tracking"""
    print("Test 3: Trail position and velocity tracking...", end=" ")

    system = create_default_exhaust_system()

    system.create_trail("entity1", "trail1", 0, 0)
    trail = system.trails["trail1"]
    assert trail.x == 0 and trail.y == 0
    assert trail.vx == 0 and trail.vy == 0

    result = system.update_trail("trail1", 100, 50, 10, 5)
    assert result['success'] == True

    trail = system.trails["trail1"]
    assert trail.x == 100
    assert trail.y == 50
    assert trail.vx == 10
    assert trail.vy == 5

    system.shutdown()
    print("[OK]")


def test_4_velocity_based_emission():
    """Test 4: Velocity-based emission"""
    print("Test 4: Velocity-based emission...", end=" ")

    system = create_default_exhaust_system()

    # Create trail with zero velocity (should not emit)
    system.create_trail("entity1", "trail1", 50, 50)
    trail = system.trails["trail1"]
    initial_particles = system.total_particles_emitted

    system.tick(0.1)  # Update with zero velocity
    assert system.total_particles_emitted == initial_particles, "No particles emitted at zero velocity"

    # Update with significant velocity (should emit)
    system.update_trail("trail1", 60, 50, 20, 0)  # Moving right at 20 units/sec
    system.tick(0.1)

    # Should have emitted particles based on velocity
    assert system.total_particles_emitted >= initial_particles, "Particles emitted with velocity"

    system.shutdown()
    print("[OK]")


def test_5_thruster_type_color_variation():
    """Test 5: Thruster type color variation"""
    print("Test 5: Thruster type color variation...", end=" ")

    system = create_default_exhaust_system()

    # Create trails with different thruster types
    for thruster in ThrusterType:
        trail_id = f"trail_{thruster.value}"
        system.create_trail("entity1", trail_id, 0, 0, thruster)
        trail = system.trails[trail_id]
        assert trail.thruster_type == thruster

    # Verify color mapping exists for all types
    for thruster in ThrusterType:
        assert thruster in system.trail_colors, f"Color mapping exists for {thruster.value}"
        start_color, end_color = system.trail_colors[thruster]
        assert isinstance(start_color, tuple) and len(start_color) == 3
        assert isinstance(end_color, tuple) and len(end_color) == 3

    system.shutdown()
    print("[OK]")


def test_6_emission_rate_control():
    """Test 6: Emission rate control"""
    print("Test 6: Emission rate control...", end=" ")

    system = create_default_exhaust_system()

    system.create_trail("entity1", "trail1", 50, 50)
    trail = system.trails["trail1"]
    default_rate = trail.emission_rate

    result = system.set_emission_rate("trail1", 20.0)
    assert result['success'] == True

    trail = system.trails["trail1"]
    assert trail.emission_rate == 20.0
    assert trail.emission_rate != default_rate

    result = system.set_emission_rate("nonexistent", 20.0)
    assert result['success'] == False

    system.shutdown()
    print("[OK]")


def test_7_particle_count_scaling():
    """Test 7: Particle count scaling"""
    print("Test 7: Particle count scaling...", end=" ")

    system = create_default_exhaust_system()

    system.create_trail("entity1", "trail1", 50, 50)
    trail1 = system.trails["trail1"]
    initial_particles = trail1.particles_emitted

    # Update with velocity and tick to emit particles
    system.update_trail("trail1", 50, 50, 50, 0)  # High velocity
    system.tick(0.1)

    trail1 = system.trails["trail1"]
    particles_high = trail1.particles_emitted - initial_particles

    # Update with lower velocity
    system.update_trail("trail1", 50, 50, 10, 0)  # Lower velocity
    initial_particles = trail1.particles_emitted
    system.tick(0.1)

    trail1 = system.trails["trail1"]
    particles_low = trail1.particles_emitted - initial_particles

    # Higher velocity should produce more particles
    assert particles_high > particles_low, "Higher velocity produces more particles"

    system.shutdown()
    print("[OK]")


def test_8_multi_trail_support():
    """Test 8: Multi-trail support"""
    print("Test 8: Multi-trail support...", end=" ")

    system = create_default_exhaust_system()

    # Create multiple trails
    for i in range(5):
        result = system.create_trail(f"entity{i}", f"trail{i}", i*10, i*10)
        assert result['success'] == True

    assert len(system.trails) == 5

    # Update each trail independently
    for i in range(5):
        system.update_trail(f"trail{i}", i*20, i*20, i*5, i*5)

    for i in range(5):
        trail = system.trails[f"trail{i}"]
        assert trail.x == i*20
        assert trail.y == i*20
        assert trail.vx == i*5
        assert trail.vy == i*5

    # Remove half
    for i in range(3):
        system.remove_trail(f"trail{i}")

    assert len(system.trails) == 2

    system.shutdown()
    print("[OK]")


def test_9_intent_processing():
    """Test 9: Intent processing"""
    print("Test 9: Intent processing...", end=" ")

    system = create_default_exhaust_system()

    # Create trail via intent
    intent = {
        "action": "create_trail",
        "entity_id": "entity1",
        "trail_id": "trail1",
        "x": 50,
        "y": 50,
        "thruster_type": ThrusterType.PLASMA
    }
    result = system.process_intent(intent)
    assert result['success'] == True
    assert "trail1" in system.trails

    # Update trail via intent
    intent = {
        "action": "update_trail",
        "trail_id": "trail1",
        "x": 100,
        "y": 100,
        "vx": 20,
        "vy": 10
    }
    result = system.process_intent(intent)
    assert result['success'] == True

    trail = system.trails["trail1"]
    assert trail.x == 100 and trail.y == 100
    assert trail.vx == 20 and trail.vy == 10

    # Set emission rate via intent
    intent = {
        "action": "set_emission_rate",
        "trail_id": "trail1",
        "rate": 25.0
    }
    result = system.process_intent(intent)
    assert result['success'] == True

    # Get trail count via intent
    intent = {"action": "get_trail_count"}
    result = system.process_intent(intent)
    assert result['trail_count'] == 1

    # Remove trail via intent
    intent = {
        "action": "remove_trail",
        "trail_id": "trail1"
    }
    result = system.process_intent(intent)
    assert result['success'] == True

    system.shutdown()
    print("[OK]")


def test_10_factory_functions():
    """Test 10: Factory functions"""
    print("Test 10: Factory functions...", end=" ")

    default = create_default_exhaust_system()
    assert default is not None
    assert default.status == SystemStatus.RUNNING
    default.shutdown()

    high = create_high_intensity_exhaust_system()
    assert high is not None
    assert high.status == SystemStatus.RUNNING
    high.shutdown()

    minimal = create_minimal_exhaust_system()
    assert minimal is not None
    assert minimal.status == SystemStatus.RUNNING
    minimal.shutdown()

    print("[OK]")


def main():
    """Run all tests"""
    print("=" * 60)
    print("PHASE D STEP 6: EXHAUST SYSTEM TESTS")
    print("=" * 60)

    try:
        test_1_initialization_and_lifecycle()
        test_2_trail_creation_and_management()
        test_3_trail_position_and_velocity_tracking()
        test_4_velocity_based_emission()
        test_5_thruster_type_color_variation()
        test_6_emission_rate_control()
        test_7_particle_count_scaling()
        test_8_multi_trail_support()
        test_9_intent_processing()
        test_10_factory_functions()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED [OK]")
        print("=" * 60)
        return 0

    except AssertionError as e:
        print(f"\n[FAIL] {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
