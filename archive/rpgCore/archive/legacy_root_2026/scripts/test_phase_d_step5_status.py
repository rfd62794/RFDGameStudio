#!/usr/bin/env python3
"""
Phase D Step 5 Verification - Status Manager

Quick test for StatusManager functionality
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.body import (
    StatusManager,
    EffectType,
    StackingMode,
    create_damage_buff,
    create_slow_debuff,
    create_poison_dot,
    create_stun_cc,
)
from game_engine.foundation import SystemStatus


def test_status_manager():
    """Test StatusManager basic functionality"""
    print("\n[STARTING] StatusManager Tests\n")

    manager = StatusManager()
    manager.initialize()

    # Test 1: Apply effect
    print("[TEST 1] Applying damage buff effect...")
    buff_config = create_damage_buff(magnitude=1.2, duration=10.0)
    result = manager.apply_effect(
        entity_id="player1",
        name=buff_config['name'],
        effect_type=buff_config['effect_type'],
        magnitude=buff_config['magnitude'],
        duration=buff_config['duration']
    )
    assert result.success, f"Failed to apply effect: {result.error}"
    assert manager.has_effect("player1", "damage_buff"), "Effect not applied"
    print("[OK] Damage buff applied successfully")

    # Test 2: Multiple effects
    print("\n[TEST 2] Applying multiple effects...")
    debuff_config = create_slow_debuff(magnitude=0.5, duration=5.0)
    result2 = manager.apply_effect(
        entity_id="player1",
        name=debuff_config['name'],
        effect_type=debuff_config['effect_type'],
        magnitude=debuff_config['magnitude'],
        duration=debuff_config['duration']
    )
    assert result2.success, "Failed to apply second effect"
    effects = manager.get_entity_effects("player1")
    assert len(effects) == 2, f"Wrong effect count: {len(effects)}"
    print("[OK] Multiple effects applied")

    # Test 3: Effect expiration
    print("\n[TEST 3] Testing effect expiration...")
    expired = manager.update_effects(delta_time=15.0, current_time=15.0)
    assert len(expired) >= 1, "Effects not expiring"
    remaining = manager.get_entity_effects("player1")
    assert len(remaining) <= 2, "Too many effects remaining"
    print(f"[OK] {len(expired)} effects expired")

    # Test 4: Status report
    print("\n[TEST 4] Getting status report...")
    status = manager.get_status()
    assert 'total_active_effects' in status, "Status missing fields"
    assert status['total_effects_applied'] >= 2, "Stats not tracked"
    print(f"[OK] Status: {status['total_active_effects']} active, {status['total_effects_applied']} total applied")

    manager.shutdown()
    assert manager.status == SystemStatus.STOPPED, "Not stopped"
    print("\n[COMPLETE] All StatusManager tests passed!")


if __name__ == "__main__":
    try:
        test_status_manager()
        print("\n" + "="*50)
        print("STATUS MANAGER TESTS PASSED")
        print("="*50)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
