#!/usr/bin/env python3
"""
Phase B Verification Test

Tests that the Tier 1 Foundation layer has been properly migrated.
Run this after Phase B to verify the foundation is solid.
"""

import sys


def test_base_system_imports():
    """Test base system imports."""
    try:
        from game_engine.foundation import (
            BaseSystem,
            BaseComponent,
            SystemConfig,
            SystemStatus,
        )

        print("[PASS] Base system imports work")

        # Test SystemConfig
        config = SystemConfig(name="TestSystem", priority=1)
        assert config.validate()
        print("[PASS] SystemConfig works")

        # Test SystemStatus enum
        assert SystemStatus.RUNNING.value == "running"
        print("[PASS] SystemStatus enum works")

        return True
    except Exception as e:
        print(f"[FAIL] Base system imports: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_protocols():
    """Test protocol definitions."""
    try:
        from game_engine.foundation import (
            Vector2Protocol,
            Vector3Protocol,
            EntityProtocol,
            GameStateProtocol,
            ClockProtocol,
            RenderPacketProtocol,
            ConfigProtocol,
        )
        from game_engine.core import Vector2, Vector3

        print("[PASS] Protocol imports work")

        # Test Vector2Protocol with actual Vector2
        v = Vector2(3.0, 4.0)
        assert isinstance(v, Vector2Protocol)
        print("[PASS] Vector2 satisfies Vector2Protocol")

        # Test Vector3Protocol with actual Vector3
        v3 = Vector3(1.0, 2.0, 3.0)
        assert isinstance(v3, Vector3Protocol)
        print("[PASS] Vector3 satisfies Vector3Protocol")

        return True
    except Exception as e:
        print(f"[FAIL] Protocol tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_registry():
    """Test registry functionality."""
    try:
        from game_engine.foundation import DGTRegistry, RegistryType

        print("[PASS] Registry imports work")

        # Test singleton
        reg1 = DGTRegistry()
        reg2 = DGTRegistry()
        assert reg1 is reg2
        print("[PASS] Registry is singleton")

        # Test registration
        test_obj = {"name": "test"}
        assert reg1.register("test_obj", test_obj, RegistryType.ASSET)
        print("[PASS] Object registration works")

        # Test retrieval
        retrieved = reg1.get("test_obj")
        assert retrieved is test_obj
        print("[PASS] Object retrieval works")

        # Test type indexing
        all_assets = reg1.get_by_type(RegistryType.ASSET)
        assert test_obj in all_assets
        print("[PASS] Type indexing works")

        # Test exists
        assert reg1.exists("test_obj")
        print("[PASS] Existence check works")

        # Test unregister
        assert reg1.unregister("test_obj")
        assert not reg1.exists("test_obj")
        print("[PASS] Unregistration works")

        # Cleanup
        reg1.clear()

        return True
    except Exception as e:
        print(f"[FAIL] Registry tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_custom_system():
    """Test creating a custom system."""
    try:
        from game_engine.foundation import BaseSystem, SystemConfig, SystemStatus

        class TestSystem(BaseSystem):
            def __init__(self):
                config = SystemConfig(name="TestSystem", performance_monitoring=True)
                super().__init__(config)
                self.ticks = 0

            def initialize(self) -> bool:
                self.status = SystemStatus.RUNNING
                self._initialized = True
                return True

            def tick(self, delta_time: float) -> None:
                self.ticks += 1

            def shutdown(self) -> None:
                self.status = SystemStatus.STOPPED

        # Create and test system
        system = TestSystem()
        assert system.initialize()
        print("[PASS] Custom system initialization works")

        # Test ticking
        system.tick(0.016)
        assert system.ticks == 1
        print("[PASS] System tick works")

        # Test metrics
        system._record_update_time(0.001)
        metrics = system.get_metrics()
        assert metrics.update_count > 0
        print("[PASS] Performance metrics work")

        # Test shutdown
        system.shutdown()
        assert system.status == SystemStatus.STOPPED
        print("[PASS] System shutdown works")

        return True
    except Exception as e:
        print(f"[FAIL] Custom system tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_backward_compatibility():
    """Test backward compatibility with old import paths."""
    try:
        import warnings

        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=DeprecationWarning)

            # This should redirect to new structure
            from dgt_engine.foundation import BaseSystem

            # Verify it's the same class
            from game_engine.foundation import BaseSystem as NewBaseSystem

            assert BaseSystem is NewBaseSystem
            print("[PASS] Backward compatibility for BaseSystem works")

        return True
    except Exception as e:
        print(f"[FAIL] Backward compatibility: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all Phase B verification tests."""
    print("=" * 70)
    print("PHASE B VERIFICATION TEST")
    print("Tier 1 Foundation Migration")
    print("=" * 70)
    print()

    results = []

    print("1. Testing base system...")
    results.append(test_base_system_imports())
    print()

    print("2. Testing protocols...")
    results.append(test_protocols())
    print()

    print("3. Testing registry...")
    results.append(test_registry())
    print()

    print("4. Testing custom system implementation...")
    results.append(test_custom_system())
    print()

    print("5. Testing backward compatibility...")
    results.append(test_backward_compatibility())
    print()

    print("=" * 70)
    if all(results):
        print("PHASE B: ALL TESTS PASSED")
        print("=" * 70)
        return 0
    else:
        print("PHASE B: SOME TESTS FAILED")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
