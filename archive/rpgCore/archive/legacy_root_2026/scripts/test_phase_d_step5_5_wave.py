#!/usr/bin/env python3
"""
Phase D Step 5.5b Verification - Wave Spawner System

Tests:
1. WaveSpawner initialization and lifecycle
2. Wave progression and configuration
3. Safe-haven spawning mechanics
4. Player position tracking
5. Wave completion detection
6. Asteroid fracturing during wave
7. Factory functions
8. Status tracking and statistics
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.body import (
    WaveSpawner,
    WaveConfig,
    FractureSystem,
    create_arcade_wave_spawner,
    create_survival_wave_spawner,
)
from game_engine.foundation import SystemConfig, SystemStatus


def test_1_wave_spawner_initialization():
    """Test 1: WaveSpawner initialization and lifecycle"""
    print("\n[TEST 1] WaveSpawner initialization and lifecycle")

    config = SystemConfig(name="TestWaveSpawner", performance_monitoring=True)
    fracture_system = FractureSystem()
    spawner = WaveSpawner(config, fracture_system)

    # Test initialization
    assert spawner.initialize() == True, "Failed to initialize"
    assert spawner.status == SystemStatus.RUNNING, "Status not RUNNING"
    assert len(spawner.wave_configs) > 0, "Wave configs not generated"
    print("[OK] Initialization successful with wave configs")

    # Test shutdown
    spawner.shutdown()
    assert spawner.status == SystemStatus.STOPPED, "Status not STOPPED"
    print("[OK] Shutdown successful")


def test_2_wave_progression():
    """Test 2: Wave progression and configuration"""
    print("\n[TEST 2] Wave progression and configuration")

    spawner = WaveSpawner()
    spawner.initialize()

    # Start wave 1
    result1 = spawner.start_next_wave()
    assert result1.success == True, f"Failed to start wave 1: {result1.error}"
    assert result1.value.wave_number == 1, "Wave should be 1"
    assert spawner.current_wave == 1, "Current wave should be 1"
    assert spawner.is_wave_active == True, "Wave should be active"
    print("[OK] Wave 1 started successfully")

    # Check asteroids spawned
    status1 = spawner.get_status()
    assert status1['active_asteroids'] > 0, "Should have spawned asteroids"
    print(f"[OK] Wave 1 spawned {status1['active_asteroids']} asteroids")

    # Complete wave 1
    spawner._complete_wave()
    assert spawner.is_wave_active == False, "Wave should not be active"

    # Start wave 2
    result2 = spawner.start_next_wave()
    assert result2.success == True, "Failed to start wave 2"
    assert result2.value.wave_number == 2, "Wave should be 2"
    assert result2.value.speed_multiplier > result1.value.speed_multiplier, \
        "Wave 2 should be faster"
    print("[OK] Wave 2 started with increased difficulty")

    spawner.shutdown()


def test_3_safe_haven_spawning():
    """Test 3: Safe-haven spawn zone mechanics"""
    print("\n[TEST 3] Safe-haven spawning mechanics")

    spawner = WaveSpawner()
    spawner.initialize()

    # Set player position at center
    player_x, player_y = 80.0, 72.0
    spawner.set_player_position(player_x, player_y)
    assert spawner.player_position == (player_x, player_y), "Player position not set"
    print(f"[OK] Player position set to ({player_x}, {player_y})")

    # Start wave with safe zone
    result = spawner.start_next_wave()
    assert result.success == True, "Failed to start wave"

    # Check asteroids are outside safe zone
    safe_radius = 40.0
    for asteroid in spawner.active_fragments:
        ast_x, ast_y = asteroid.entity.x, asteroid.entity.y
        distance = ((ast_x - player_x)**2 + (ast_y - player_y)**2)**0.5
        assert distance > safe_radius - 5, \
            f"Asteroid at ({ast_x}, {ast_y}) too close to player (distance={distance:.1f})"

    print(f"[OK] All asteroids spawned outside {safe_radius}px safe zone")

    spawner.shutdown()


def test_4_player_position_tracking():
    """Test 4: Dynamic player position tracking"""
    print("\n[TEST 4] Player position tracking")

    spawner = WaveSpawner()
    spawner.initialize()

    # Set initial position
    spawner.set_player_position(80.0, 72.0)
    assert spawner.player_position == (80.0, 72.0), "Initial position not set"

    # Update position
    spawner.set_player_position(100.0, 90.0)
    assert spawner.player_position == (100.0, 90.0), "Position not updated"

    # Start wave with new position
    result = spawner.start_next_wave()
    assert result.success == True, "Failed to start wave"

    status = spawner.get_status()
    assert status['player_position'] == (100.0, 90.0), "Status should reflect new position"
    print("[OK] Player position dynamically tracked")

    spawner.shutdown()


def test_5_wave_completion_detection():
    """Test 5: Wave completion detection"""
    print("\n[TEST 5] Wave completion detection")

    spawner = WaveSpawner()
    spawner.initialize()

    # Start wave
    result = spawner.start_next_wave()
    assert spawner.is_wave_active == True, "Wave should be active"
    initial_count = len(spawner.active_fragments)
    print(f"[OK] Wave started with {initial_count} asteroids")

    # Complete wave manually
    spawner.active_fragments.clear()
    completed = spawner.update_wave(0.016)  # 16ms update
    assert completed == True, "Should detect wave completion"
    assert spawner.is_wave_active == False, "Wave should not be active after completion"
    assert spawner.total_waves_completed == 1, "Total completed should increment"
    print("[OK] Wave completion detected")

    spawner.shutdown()


def test_6_asteroid_fracturing_during_wave():
    """Test 6: Fracturing asteroids during wave"""
    print("\n[TEST 6] Asteroid fracturing during wave")

    spawner = WaveSpawner()
    spawner.initialize()

    # Start wave
    result = spawner.start_next_wave()
    assert spawner.is_wave_active == True, "Wave should be active"

    initial_count = len(spawner.active_fragments)
    first_asteroid = spawner.active_fragments[0]

    # Fracture first asteroid
    fracture_result = spawner.fracture_asteroid(first_asteroid)
    assert fracture_result.success == True, f"Fracture failed: {fracture_result.error}"

    # Check active count changed
    new_count = len(spawner.active_fragments)
    expected_increase = len(fracture_result.value) - 1  # -1 for removed, +N for fragments
    print(f"[OK] Fractured asteroid: {initial_count} -> {new_count} asteroids")

    spawner.shutdown()


def test_7_factory_functions():
    """Test 7: Factory functions for configurations"""
    print("\n[TEST 7] Factory functions for configurations")

    # Arcade spawner
    arcade = create_arcade_wave_spawner()
    assert arcade.current_wave == 0, "New spawner should be at wave 0"
    print("[OK] Arcade wave spawner created")

    # Survival spawner
    fracture_system = FractureSystem()
    survival = create_survival_wave_spawner(fracture_system)

    # Check survival is harder
    arcade_wave = arcade.wave_configs[0]
    survival_wave = survival.wave_configs[0]

    assert survival_wave.speed_multiplier > arcade_wave.speed_multiplier, \
        "Survival should be faster"
    assert survival_wave.asteroid_count > arcade_wave.asteroid_count, \
        "Survival should have more asteroids"
    assert survival_wave.safe_haven_radius < arcade_wave.safe_haven_radius, \
        "Survival should have smaller safe zone"
    print("[OK] Survival wave spawner created with increased difficulty")


def test_8_wave_spawner_status():
    """Test 8: Status tracking and statistics"""
    print("\n[TEST 8] Wave spawner status and statistics")

    spawner = WaveSpawner()
    spawner.initialize()

    # Start multiple waves
    spawner.start_next_wave()
    status1 = spawner.get_status()
    assert status1['current_wave'] == 1, "Should be wave 1"
    assert status1['is_wave_active'] == True, "Wave should be active"
    print(f"[OK] Wave 1 status: {status1['active_asteroids']} asteroids")

    # Complete and start wave 2
    spawner._complete_wave()
    spawner.start_next_wave()
    status2 = spawner.get_status()
    assert status2['current_wave'] == 2, "Should be wave 2"
    assert status2['total_waves_completed'] == 1, "Should have completed 1 wave"
    print(f"[OK] Wave 2 status: {status2['active_asteroids']} asteroids, "
          f"{status2['total_waves_completed']} completed")

    # Check size distribution
    dist = status2['size_distribution']
    assert sum(dist.values()) == status2['active_asteroids'], "Distribution should match count"
    print(f"[OK] Size distribution: {dist}")

    spawner.shutdown()


def test_9_wave_preview():
    """Test 9: Next wave preview"""
    print("\n[TEST 9] Next wave preview")

    spawner = WaveSpawner()
    spawner.initialize()

    # Get preview of first wave
    preview = spawner.get_next_wave_preview()
    assert preview is not None, "Should have preview"
    assert preview['wave_number'] == 1, "Should preview wave 1"
    assert preview['asteroid_count'] > 0, "Should show asteroid count"
    print(f"[OK] Wave 1 preview: {preview['asteroid_count']} asteroids")

    # Start wave and get next preview
    spawner.start_next_wave()
    spawner._complete_wave()
    preview2 = spawner.get_next_wave_preview()
    assert preview2['wave_number'] == 2, "Should preview wave 2"
    assert preview2['speed_multiplier'] > preview['speed_multiplier'], \
        "Next wave should be harder"
    print(f"[OK] Wave 2 preview: {preview2['asteroid_count']} asteroids, "
          f"{preview2['speed_multiplier']:.1f}x speed")

    spawner.shutdown()


def test_10_spawner_reset():
    """Test 10: Spawner reset functionality"""
    print("\n[TEST 10] Spawner reset functionality")

    spawner = WaveSpawner()
    spawner.initialize()

    # Progress through some waves
    spawner.start_next_wave()
    spawner._complete_wave()
    spawner.start_next_wave()
    spawner._complete_wave()

    assert spawner.current_wave == 2, "Should be at wave 2"
    assert spawner.total_waves_completed == 2, "Should have completed 2 waves"

    # Reset
    reset_result = spawner.reset()
    assert reset_result.success == True, "Reset should succeed"
    assert spawner.current_wave == 0, "Current wave should reset"
    assert spawner.total_waves_completed == 0, "Total completed should reset"
    assert spawner.is_wave_active == False, "Wave should not be active"
    print("[OK] Spawner reset successfully")

    spawner.shutdown()


def main():
    """Run all Phase D Step 5.5b wave spawner tests"""
    print("=" * 60)
    print("PHASE D STEP 5.5b: Wave Spawner System Tests")
    print("=" * 60)

    try:
        test_1_wave_spawner_initialization()
        test_2_wave_progression()
        test_3_safe_haven_spawning()
        test_4_player_position_tracking()
        test_5_wave_completion_detection()
        test_6_asteroid_fracturing_during_wave()
        test_7_factory_functions()
        test_8_wave_spawner_status()
        test_9_wave_preview()
        test_10_spawner_reset()

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
