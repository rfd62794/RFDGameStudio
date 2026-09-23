#!/usr/bin/env python3
"""
Phase D Step 6 Verification - FXSystem

Tests for particle effects with pooling, emission, and physics.

Tests:
1. Initialization and lifecycle
2. Particle pooling and recycling
3. Emitter creation and management
4. Particle emission and velocity
5. Physics simulation (gravity)
6. Color interpolation over lifetime
7. Automatic particle cleanup
8. Multi-emitter support
9. Intent processing
10. Factory functions
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.graphics.fx import (
    FXSystem, Particle, ParticleEmitter,
    create_default_fx_system,
    create_large_fx_system,
    create_minimal_fx_system,
)
from game_engine.foundation import SystemStatus


def test_1_initialization_and_lifecycle():
    """Test 1: Initialization and lifecycle"""
    print("Test 1: Initialization and lifecycle...", end=" ")

    system = FXSystem()
    assert system.status == SystemStatus.UNINITIALIZED

    result = system.initialize()
    assert result == True
    assert system.status == SystemStatus.RUNNING

    system.tick(0.016)
    assert system.status == SystemStatus.RUNNING

    system.shutdown()
    assert system.status == SystemStatus.STOPPED

    print("[OK]")


def test_2_particle_pooling_and_recycling():
    """Test 2: Particle pooling and recycling"""
    print("Test 2: Particle pooling and recycling...", end=" ")

    system = create_default_fx_system()

    assert len(system.particle_pool) == 1000
    assert len(system.active_particles) == 0

    # Create and remove emitter to trigger particle recycling
    system.create_emitter("test", 50, 50)
    system.emit_particles("test", 100)

    assert len(system.active_particles) == 100
    assert len(system.particle_pool) == 900

    # Age particles until they expire
    for _ in range(5):
        system.tick(1.0)

    # Most particles should be recycled after expiring
    assert len(system.active_particles) < 100
    assert len(system.particle_pool) > 900

    system.shutdown()
    print("[OK]")


def test_3_emitter_creation_and_management():
    """Test 3: Emitter creation and management"""
    print("Test 3: Emitter creation and management...", end=" ")

    system = create_default_fx_system()

    emitter = system.create_emitter("emitter1", 100, 200)
    assert emitter is not None
    assert emitter.x == 100
    assert emitter.y == 200

    retrieved = system.get_emitter("emitter1")
    assert retrieved is emitter

    result = system.remove_emitter("emitter1")
    assert result == True

    missing = system.get_emitter("emitter1")
    assert missing is None

    system.shutdown()
    print("[OK]")


def test_4_particle_emission_and_velocity():
    """Test 4: Particle emission and velocity"""
    print("Test 4: Particle emission and velocity...", end=" ")

    system = create_default_fx_system()

    emitter = system.create_emitter("emitter", 50, 50)
    emitter.velocity_min = 5.0
    emitter.velocity_max = 5.0
    emitter.angle_min = 0
    emitter.angle_max = 0

    system.emit_particles("emitter", 10)

    assert len(system.active_particles) == 10

    for particle in system.active_particles:
        assert particle.x == 50
        assert particle.y == 50
        assert particle.vx > 0  # Should move right
        assert abs(particle.vx - 5.0) < 0.1  # Should be ~5.0

    system.shutdown()
    print("[OK]")


def test_5_physics_simulation_gravity():
    """Test 5: Physics simulation (gravity)"""
    print("Test 5: Physics simulation (gravity)...", end=" ")

    system = create_default_fx_system()

    emitter = system.create_emitter("emitter", 50, 50)
    emitter.velocity_min = 0
    emitter.velocity_max = 0
    emitter.gravity = 10.0
    emitter.lifetime_min = 5.0
    emitter.lifetime_max = 5.0

    system.emit_particles("emitter", 1)
    particle = system.active_particles[0]

    initial_vy = particle.vy
    system.tick(0.1)

    expected_vy = initial_vy + emitter.gravity * 0.1
    assert abs(particle.vy - expected_vy) < 0.01

    system.shutdown()
    print("[OK]")


def test_6_color_interpolation_over_lifetime():
    """Test 6: Color interpolation over lifetime"""
    print("Test 6: Color interpolation over lifetime...", end=" ")

    system = create_default_fx_system()

    emitter = system.create_emitter("emitter", 0, 0)
    emitter.start_color = (255, 0, 0)
    emitter.end_color = (0, 0, 0)
    emitter.lifetime_min = 2.0
    emitter.lifetime_max = 2.0

    system.emit_particles("emitter", 1)
    particle = system.active_particles[0]

    # At age 0, should be red
    color = particle.get_color()
    assert color[0] == 255

    # At half lifetime, should be halfway
    particle.age = 1.0
    color = particle.get_color()
    assert 120 < color[0] < 135

    # At end of lifetime, should be black
    particle.age = 2.0
    color = particle.get_color()
    assert color == (0, 0, 0)

    system.shutdown()
    print("[OK]")


def test_7_automatic_particle_cleanup():
    """Test 7: Automatic particle cleanup"""
    print("Test 7: Automatic particle cleanup...", end=" ")

    system = create_default_fx_system()

    emitter = system.create_emitter("emitter", 0, 0)
    emitter.lifetime_min = 0.1
    emitter.lifetime_max = 0.1

    system.emit_particles("emitter", 50)
    assert len(system.active_particles) == 50

    # Tick past lifetime
    system.tick(0.2)

    # Particles should be cleaned up and recycled
    assert len(system.active_particles) == 0
    assert len(system.particle_pool) > 900

    system.shutdown()
    print("[OK]")


def test_8_multi_emitter_support():
    """Test 8: Multi-emitter support"""
    print("Test 8: Multi-emitter support...", end=" ")

    system = create_default_fx_system()

    em1 = system.create_emitter("e1", 0, 0)
    em2 = system.create_emitter("e2", 100, 100)
    em3 = system.create_emitter("e3", 200, 200)

    assert len(system.emitters) == 3

    system.emit_particles("e1", 10)
    system.emit_particles("e2", 20)
    system.emit_particles("e3", 30)

    assert len(system.active_particles) == 60

    # Verify particles are at correct positions
    e1_particles = [p for p in system.active_particles if abs(p.x - 0) < 0.1]
    e2_particles = [p for p in system.active_particles if abs(p.x - 100) < 0.1]

    assert len(e1_particles) == 10
    assert len(e2_particles) == 20

    system.shutdown()
    print("[OK]")


def test_9_intent_processing():
    """Test 9: Intent processing"""
    print("Test 9: Intent processing...", end=" ")

    system = create_default_fx_system()

    intent = {"action": "create_emitter", "emitter_id": "e1", "x": 50, "y": 50}
    result = system.process_intent(intent)
    assert result['success'] == True

    intent = {"action": "emit_particles", "emitter_id": "e1", "count": 20}
    result = system.process_intent(intent)
    assert result['success'] == True

    intent = {"action": "get_active_particles"}
    result = system.process_intent(intent)
    assert result['active_particles'] == 20

    intent = {"action": "remove_emitter", "emitter_id": "e1"}
    result = system.process_intent(intent)
    assert result['success'] == True

    system.shutdown()
    print("[OK]")


def test_10_factory_functions():
    """Test 10: Factory functions"""
    print("Test 10: Factory functions...", end=" ")

    default = create_default_fx_system()
    assert default.max_particles == 1000
    assert default.status == SystemStatus.RUNNING
    default.shutdown()

    large = create_large_fx_system()
    assert large.max_particles == 5000
    assert large.status == SystemStatus.RUNNING
    large.shutdown()

    minimal = create_minimal_fx_system()
    assert minimal.max_particles == 200
    assert minimal.status == SystemStatus.RUNNING
    minimal.shutdown()

    print("[OK]")


def main():
    """Run all tests"""
    print("=" * 60)
    print("PHASE D STEP 6: FX SYSTEM TESTS")
    print("=" * 60)

    try:
        test_1_initialization_and_lifecycle()
        test_2_particle_pooling_and_recycling()
        test_3_emitter_creation_and_management()
        test_4_particle_emission_and_velocity()
        test_5_physics_simulation_gravity()
        test_6_color_interpolation_over_lifetime()
        test_7_automatic_particle_cleanup()
        test_8_multi_emitter_support()
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
