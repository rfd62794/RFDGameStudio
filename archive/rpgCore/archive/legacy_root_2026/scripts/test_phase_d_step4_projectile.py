#!/usr/bin/env python3
"""
Phase D Step 4 Verification - Projectile System

Tests:
1. ProjectileSystem initialization and lifecycle
2. Projectile firing with cooldown limits
3. Projectile pool management and reuse
4. Projectile lifetime expiration
5. Owner-specific cooldown tracking
6. Factory functions for configurations
"""

import sys
import math
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.body import (
    ProjectileSystem,
    ProjectileState,
    create_arcade_projectile_system,
    create_rapid_fire_system,
    create_heavy_weapon_system,
)
from game_engine.foundation import SystemConfig, SystemStatus


def test_1_projectile_system_initialization():
    """Test 1: ProjectileSystem initialization and lifecycle"""
    print("\n[TEST 1] ProjectileSystem initialization and lifecycle")

    config = SystemConfig(name="TestProjectileSystem", performance_monitoring=True)
    system = ProjectileSystem(config, max_projectiles=10, default_cooldown_ms=100)

    # Test initialization
    assert system.initialize() == True, "Failed to initialize"
    assert system.status == SystemStatus.RUNNING, "Status not RUNNING"
    assert len(system.projectile_pool) == 10, "Pool not initialized correctly"
    print("[OK] Initialization successful")

    # Test shutdown
    system.shutdown()
    assert system.status == SystemStatus.STOPPED, "Status not STOPPED"
    assert len(system.projectile_pool) == 0, "Pool not cleared"
    print("[OK] Shutdown successful")


def test_2_projectile_firing_with_cooldown():
    """Test 2: Projectile firing with cooldown limits"""
    print("\n[TEST 2] Projectile firing with cooldown limits")

    system = ProjectileSystem(max_projectiles=5, default_cooldown_ms=100)
    system.initialize()

    # First shot should succeed
    result = system.fire_projectile(
        owner_id="player",
        x=50.0, y=50.0,
        angle=0.0,
        current_time=0.0,
        damage=10.0,
        speed=300.0
    )
    assert result.success == True, f"First shot failed: {result.error}"
    assert len(system.active_projectiles) == 1, "Projectile not added"
    print("[OK] First projectile fired")

    # Second shot immediately should fail (cooldown)
    result2 = system.fire_projectile(
        owner_id="player",
        x=50.0, y=50.0,
        angle=0.0,
        current_time=0.01,  # Only 0.01 seconds later
        damage=10.0
    )
    assert result2.success == False, "Shot should be blocked by cooldown"
    print("[OK] Cooldown prevents rapid fire")

    # Shot after cooldown should succeed
    result3 = system.fire_projectile(
        owner_id="player",
        x=50.0, y=50.0,
        angle=0.0,
        current_time=0.15,  # 0.15 seconds later (past 0.1s cooldown)
        damage=10.0
    )
    assert result3.success == True, "Shot should succeed after cooldown"
    assert len(system.active_projectiles) == 2, "Second projectile not added"
    print("[OK] Can fire after cooldown expires")

    system.shutdown()


def test_3_projectile_pool_management():
    """Test 3: Projectile pool management and reuse"""
    print("\n[TEST 3] Projectile pool management and reuse")

    system = ProjectileSystem(max_projectiles=3, default_cooldown_ms=0)
    system.initialize()

    # Fire all projectiles
    projectile_ids = []
    for i in range(3):
        result = system.fire_projectile(
            owner_id="player",
            x=float(i*10), y=50.0,
            angle=0.0,
            current_time=float(i)*0.01,
            damage=1.0
        )
        assert result.success == True, f"Projectile {i} failed to fire"
        projectile_ids.append(result.value.id)

    assert len(system.active_projectiles) == 3, "Not all projectiles active"
    assert len(system.projectile_pool) == 0, "Pool should be empty"
    print("[OK] All projectiles fired and pool exhausted")

    # Try to fire beyond pool limit
    result = system.fire_projectile(
        owner_id="player",
        x=100.0, y=50.0,
        angle=0.0,
        current_time=1.0,
        damage=1.0
    )
    assert result.success == False, "Should not fire beyond pool limit"
    print("[OK] Pool limit enforced")

    # Return projectiles to pool
    expired = system.update_projectiles(current_time=5.0)  # Way past 2s lifetime
    assert len(expired) == 3, "Should have 3 expired projectiles"
    assert len(system.active_projectiles) == 0, "Active projectiles not cleared"
    assert len(system.projectile_pool) == 3, "Projectiles not returned to pool"
    print("[OK] Pool management and projectile recycling working")

    system.shutdown()


def test_4_projectile_lifetime_expiration():
    """Test 4: Projectile lifetime expiration"""
    print("\n[TEST 4] Projectile lifetime expiration")

    system = ProjectileSystem(max_projectiles=10, default_cooldown_ms=0)
    system.initialize()

    # Fire a projectile
    result = system.fire_projectile(
        owner_id="player",
        x=50.0, y=50.0,
        angle=0.0,
        current_time=0.0,
        damage=5.0
    )
    projectile = result.value

    # Check not expired at short time
    assert projectile.id in system.projectile_stats, "Stats not tracked"
    expired_list = system.update_projectiles(current_time=1.0)
    assert len(expired_list) == 0, "Projectile expired too early"
    assert len(system.active_projectiles) == 1, "Projectile deactivated early"
    print("[OK] Projectile active within lifetime")

    # Check expired after lifetime
    expired_list = system.update_projectiles(current_time=3.0)
    assert len(expired_list) == 1, "Projectile not expired"
    assert expired_list[0].id == projectile.id, "Wrong projectile expired"
    assert len(system.active_projectiles) == 0, "Expired projectile still active"
    print("[OK] Projectile expires after lifetime")

    system.shutdown()


def test_5_owner_specific_cooldown():
    """Test 5: Owner-specific cooldown tracking"""
    print("\n[TEST 5] Owner-specific cooldown tracking")

    system = ProjectileSystem(max_projectiles=20, default_cooldown_ms=100)
    system.initialize()

    # Set custom cooldown for player2
    system.set_owner_cooldown("player2", 50)  # 50ms instead of 100ms

    # Fire with default cooldown (player1) at time 0.0
    result1 = system.fire_projectile("player1", 0.0, 0.0, 0.0, 0.0, 1.0, 100.0)
    assert result1.success == True, "Player1 first shot failed"

    # Fire with custom cooldown (player2) at time 0.0
    result2 = system.fire_projectile("player2", 0.0, 0.0, 0.0, 0.0, 1.0, 100.0)
    assert result2.success == True, "Player2 first shot failed"

    # Check cooldowns at time 0.03 (30ms after firing)
    # Player1: 100ms cooldown, fired at 0.0, checked at 0.03 -> 70ms remaining
    # Player2: 50ms cooldown, fired at 0.0, checked at 0.03 -> 20ms remaining
    remaining1 = system.get_cooldown_remaining("player1", 0.03)
    remaining2 = system.get_cooldown_remaining("player2", 0.03)

    assert remaining1 > 0, f"Player1 cooldown not working (remaining={remaining1})"
    assert remaining2 > 0, f"Player2 cooldown not working (remaining={remaining2})"
    assert remaining1 > remaining2, f"Player1 should have longer remaining ({remaining1} > {remaining2})"
    print("[OK] Per-owner cooldowns working correctly")

    system.shutdown()


def test_6_factory_functions():
    """Test 6: Factory functions for configurations"""
    print("\n[TEST 6] Factory functions for configurations")

    # Arcade configuration
    arcade = create_arcade_projectile_system()
    assert arcade.max_projectiles == 100, "Wrong arcade pool size"
    assert arcade.default_cooldown_seconds == 0.15, "Wrong arcade cooldown"
    print("[OK] Arcade configuration created")

    # Rapid fire configuration
    rapid = create_rapid_fire_system()
    assert rapid.max_projectiles == 150, "Wrong rapid pool size"
    assert rapid.default_cooldown_seconds == 0.1, "Wrong rapid cooldown"
    print("[OK] Rapid fire configuration created")

    # Heavy weapon configuration
    heavy = create_heavy_weapon_system()
    assert heavy.max_projectiles == 50, "Wrong heavy pool size"
    assert heavy.default_cooldown_seconds == 0.5, "Wrong heavy cooldown"
    print("[OK] Heavy weapon configuration created")


def test_7_projectile_system_status():
    """Test 7: Projectile system status and statistics"""
    print("\n[TEST 7] Projectile system status and statistics")

    system = ProjectileSystem(max_projectiles=10, default_cooldown_ms=100)
    system.initialize()

    # Fire a few projectiles
    for i in range(3):
        system.fire_projectile("player", float(i)*0.5, 50.0, 0.0, float(i)*0.15, 1.0, 200.0)

    # Get status
    status = system.get_status()
    assert status['active_projectiles'] == 3, "Wrong active count"
    assert status['pool_size'] == 7, "Wrong pool size"
    assert status['total_fired'] == 3, "Wrong total fired"
    assert status['max_projectiles'] == 10, "Wrong max"
    print("[OK] Status report contains expected fields")

    # Expire some projectiles
    system.update_projectiles(current_time=5.0)
    status = system.get_status()
    assert status['total_expired'] == 3, "Wrong total expired"
    print("[OK] Statistics tracking working")

    system.shutdown()


def main():
    """Run all Phase D Step 4 projectile tests"""
    print("=" * 60)
    print("PHASE D STEP 4: Projectile System Tests")
    print("=" * 60)

    try:
        test_1_projectile_system_initialization()
        test_2_projectile_firing_with_cooldown()
        test_3_projectile_pool_management()
        test_4_projectile_lifetime_expiration()
        test_5_owner_specific_cooldown()
        test_6_factory_functions()
        test_7_projectile_system_status()

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
