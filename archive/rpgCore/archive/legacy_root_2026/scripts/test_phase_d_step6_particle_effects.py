#!/usr/bin/env python3
"""
Phase D Step 6 Verification - Particle Effects

Tests for pre-configured particle effect presets with emitter composition.

Tests:
1. Effect preset availability
2. Effect copying and independence
3. Emitter configuration validation
4. Explosion effect composition
5. Smoke effect composition
6. Spark effect composition
7. Fire effect composition
8. Complex effects (multiple emitters per effect)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.graphics.fx.particle_effects import (
    ParticleEffect,
    EffectPreset,
    get_preset_effect,
    PRESET_EFFECTS,
    create_explosion_emitter,
    create_smoke_emitter,
    create_spark_emitter,
    create_fire_emitter,
)


def test_1_effect_preset_availability():
    """Test 1: Effect preset availability"""
    print("Test 1: Effect preset availability...", end=" ")

    # All presets should be defined
    assert len(PRESET_EFFECTS) > 0, "Should have presets defined"
    assert EffectPreset.EXPLOSION in [p for p in EffectPreset], "EXPLOSION preset exists"
    assert EffectPreset.SMOKE in [p for p in EffectPreset], "SMOKE preset exists"
    assert EffectPreset.SPARK in [p for p in EffectPreset], "SPARK preset exists"
    assert EffectPreset.FIRE in [p for p in EffectPreset], "FIRE preset exists"

    # Verify presets are in dict
    assert EffectPreset.EXPLOSION in PRESET_EFFECTS, "Explosion in preset dict"
    assert EffectPreset.SMOKE in PRESET_EFFECTS, "Smoke in preset dict"
    assert EffectPreset.SPARK in PRESET_EFFECTS, "Spark in preset dict"

    print("[OK]")


def test_2_effect_copying_and_independence():
    """Test 2: Effect copying and independence"""
    print("Test 2: Effect copying and independence...", end=" ")

    # Get two copies of same preset
    effect1 = get_preset_effect(EffectPreset.EXPLOSION)
    effect2 = get_preset_effect(EffectPreset.EXPLOSION)

    # They should have same configuration
    assert effect1.name == effect2.name, "Copies have same name"
    assert effect1.duration == effect2.duration, "Copies have same duration"
    assert len(effect1.emitters) == len(effect2.emitters), "Copies have same emitter count"

    # But they should be different objects
    assert effect1 is not effect2, "Copies are different objects"
    assert effect1.emitters is not effect2.emitters, "Emitters are different lists"
    if len(effect1.emitters) > 0:
        assert effect1.emitters[0] is not effect2.emitters[0], "Individual emitters are different objects"

    # Modifying one shouldn't affect the other
    if len(effect1.emitters) > 0:
        original_velocity = effect2.emitters[0].velocity_min
        effect1.emitters[0].velocity_min = 999
        assert effect2.emitters[0].velocity_min == original_velocity, "Modifying copy doesn't affect original"

    print("[OK]")


def test_3_emitter_configuration_validation():
    """Test 3: Emitter configuration validation"""
    print("Test 3: Emitter configuration validation...", end=" ")

    # Get explosion emitter and verify configuration
    explosion = create_explosion_emitter(1.0)
    assert explosion.particle_count > 0, "Particle count set"
    assert explosion.velocity_min > 0, "Min velocity set"
    assert explosion.velocity_max > explosion.velocity_min, "Max velocity > min velocity"
    assert explosion.angle_min >= 0 and explosion.angle_max <= 360, "Angles in valid range"
    assert explosion.lifetime_min > 0, "Min lifetime set"
    assert explosion.lifetime_max >= explosion.lifetime_min, "Max lifetime >= min lifetime"
    assert explosion.start_color is not None, "Start color set"
    assert explosion.end_color is not None, "End color set"

    print("[OK]")


def test_4_explosion_effect_composition():
    """Test 4: Explosion effect composition"""
    print("Test 4: Explosion effect composition...", end=" ")

    explosion = get_preset_effect(EffectPreset.EXPLOSION)
    assert explosion.name == "explosion", "Effect name correct"
    assert explosion.duration == 0.8, "Effect duration correct"
    assert len(explosion.emitters) > 0, "Has emitters"

    emitter = explosion.emitters[0]
    assert emitter.velocity_min > 0, "Explosion has velocity"
    assert emitter.lifetime_min > 0, "Explosion has lifetime"
    assert emitter.angle_min == 0 and emitter.angle_max == 360, "Explosion radiates in all directions"

    print("[OK]")


def test_5_smoke_effect_composition():
    """Test 5: Smoke effect composition"""
    print("Test 5: Smoke effect composition...", end=" ")

    smoke = get_preset_effect(EffectPreset.SMOKE)
    assert smoke.name == "smoke", "Effect name correct"
    assert smoke.duration > 1.0, "Smoke lasts longer than explosion"
    assert len(smoke.emitters) > 0, "Has emitters"

    emitter = smoke.emitters[0]
    assert emitter.angle_min > 45, "Smoke rises upward (angle > 45)"
    assert emitter.angle_max < 135, "Smoke rises upward (angle < 135)"
    assert emitter.lifetime_min > 1.0, "Smoke persists long"
    assert emitter.gravity < 0, "Smoke rises (negative gravity)"

    print("[OK]")


def test_6_spark_effect_composition():
    """Test 6: Spark effect composition"""
    print("Test 6: Spark effect composition...", end=" ")

    spark = get_preset_effect(EffectPreset.SPARK)
    assert spark.name == "spark", "Effect name correct"
    assert len(spark.emitters) > 0, "Has emitters"

    emitter = spark.emitters[0]
    assert emitter.velocity_min > 20, "Sparks are fast"
    assert emitter.lifetime_max < 1.0, "Sparks don't last long"
    assert emitter.angle_min == 0 and emitter.angle_max == 360, "Sparks scatter in all directions"
    assert emitter.gravity > 0, "Sparks fall (positive gravity)"

    print("[OK]")


def test_7_fire_effect_composition():
    """Test 7: Fire effect composition"""
    print("Test 7: Fire effect composition...", end=" ")

    fire = get_preset_effect(EffectPreset.FIRE)
    assert fire.name == "fire", "Effect name correct"
    assert len(fire.emitters) > 0, "Has emitters"

    emitter = fire.emitters[0]
    assert emitter.angle_min > 45, "Fire rises upward"
    assert emitter.angle_max < 135, "Fire rises upward"
    assert emitter.gravity < 0, "Fire rises (negative gravity)"
    assert emitter.lifetime_min > 0.3, "Fire persists a moment"

    print("[OK]")


def test_8_intensity_scaling():
    """Test 8: Intensity scaling"""
    print("Test 8: Intensity scaling...", end=" ")

    explosion_normal = create_explosion_emitter(1.0)
    explosion_intense = create_explosion_emitter(2.0)
    explosion_weak = create_explosion_emitter(0.5)

    # Verify scaling affects particle count
    assert explosion_intense.particle_count > explosion_normal.particle_count, "Intense has more particles"
    assert explosion_weak.particle_count < explosion_normal.particle_count, "Weak has fewer particles"

    # Verify scaling affects velocity
    assert explosion_intense.velocity_min > explosion_normal.velocity_min, "Intense is faster"
    assert explosion_weak.velocity_min < explosion_normal.velocity_min, "Weak is slower"

    print("[OK]")


def main():
    """Run all tests"""
    print("=" * 60)
    print("PHASE D STEP 6: PARTICLE EFFECTS TESTS")
    print("=" * 60)

    try:
        test_1_effect_preset_availability()
        test_2_effect_copying_and_independence()
        test_3_emitter_configuration_validation()
        test_4_explosion_effect_composition()
        test_5_smoke_effect_composition()
        test_6_spark_effect_composition()
        test_7_fire_effect_composition()
        test_8_intensity_scaling()

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
