#!/usr/bin/env python3
"""
Phase A Verification Test

Tests that the new directory structure and compatibility shim layer are working correctly.
Run this after Phase A to verify the foundation is solid.
"""

import sys
import warnings

def test_core_imports():
    """Test that core modules import correctly from new structure."""
    try:
        from game_engine.core import SystemClock, Vector2, Vector3
        print("[PASS] Core imports from new structure")

        # Test instantiation
        clock = SystemClock(target_fps=60)
        v2 = Vector2(1.0, 2.0)
        v3 = Vector3(1.0, 2.0, 3.0)

        # Test operations
        assert v2.magnitude() > 0
        assert v3.magnitude() > 0
        assert clock.delta_time == 0.0

        print("[PASS] Core types instantiate and work correctly")
        return True
    except Exception as e:
        print(f"[FAIL] Core imports: {e}")
        return False


def test_backward_compatibility():
    """Test that old import paths still work via shim layer."""
    try:
        # Suppress deprecation warnings for this test
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=DeprecationWarning)

            # This should redirect to new structure
            from dgt_engine.foundation import Vector2

            v = Vector2(3.0, 4.0)
            assert v.x == 3.0
            assert v.y == 4.0

        print("[PASS] Backward compatibility shim layer works")
        return True
    except Exception as e:
        print(f"[FAIL] Backward compatibility: {e}")
        return False


def test_package_structure():
    """Test that all required packages exist and are importable."""
    packages = [
        "game_engine",
        "game_engine.core",
        "game_engine.foundation",
        "game_engine.engines",
        "game_engine.systems",
        "game_engine.systems.kernel",
        "game_engine.systems.body",
        "game_engine.systems.graphics",
        "game_engine.systems.game",
        "game_engine.systems.ai",
        "game_engine.systems.narrative",
        "game_engine.assets",
        "game_engine.ui",
        "game_engine.config",
        "demos",
        "demos.space_combat",
        "demos.rpg",
        "demos.tycoon",
        "demos.sandbox",
    ]

    all_ok = True
    for package in packages:
        try:
            __import__(package)
            print(f"[PASS] Package importable: {package}")
        except ImportError as e:
            print(f"[FAIL] Cannot import {package}: {e}")
            all_ok = False

    return all_ok


def main():
    """Run all Phase A verification tests."""
    print("=" * 70)
    print("PHASE A VERIFICATION TEST")
    print("=" * 70)
    print()

    results = []

    print("1. Testing core package structure...")
    results.append(test_package_structure())
    print()

    print("2. Testing core imports...")
    results.append(test_core_imports())
    print()

    print("3. Testing backward compatibility...")
    results.append(test_backward_compatibility())
    print()

    print("=" * 70)
    if all(results):
        print("PHASE A: ALL TESTS PASSED")
        print("=" * 70)
        return 0
    else:
        print("PHASE A: SOME TESTS FAILED")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
