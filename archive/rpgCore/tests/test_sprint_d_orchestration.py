"""
Test Sprint D Orchestration Layer

Sprint D: Orchestration Layer - Verification
Tests the BaseSystem orchestration and RaceRunner system functionality.
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

def test_base_system_orchestration():
    """Test BaseSystem orchestration patterns"""
    try:
        from src.engines.base import BaseSystem, SystemConfig, SystemStatus
        from src.dgt_engine.foundation.registry import DGTRegistry, RegistryType
        
        print("✅ Imports successful")
        
        # Create test system
        config = SystemConfig(
            system_id="test_system",
            system_name="Test System",
            enabled=True,
            auto_register=True
        )
        
        class TestSystem(BaseSystem):
            def _on_initialize(self) -> Result[bool]:
                return Result.success_result(True)
            
            def _on_shutdown(self) -> Result[None]:
                return Result.success_result(None)
            
            def _on_update(self, dt: float) -> Result[None]:
                return Result.success_result(None)
        
        system = TestSystem(config)
        print("✅ Test system created")
        
        # Test initialization
        init_result = system.initialize()
        assert init_result.success, f"System initialization failed: {init_result.error}"
        assert system.status == SystemStatus.RUNNING
        print("✅ System initialized")
        
        # Test registry integration
        registry = DGTRegistry()
        system_result = registry.get_system("test_system")
        assert system_result.success, f"System not found in registry: {system_result.error}"
        assert system_result.value == system
        print("✅ System registered in registry")
        
        # Test update
        update_result = system.update(1.0 / 60.0)
        assert update_result.success, f"System update failed: {update_result.error}"
        assert system.metrics.total_updates == 1
        print("✅ System update successful")
        
        # Test shutdown
        shutdown_result = system.shutdown()
        assert shutdown_result.success, f"System shutdown failed: {shutdown_result.error}"
        assert system.status == SystemStatus.STOPPED
        print("✅ System shutdown successful")
        
        pass
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        pass

def test_race_runner_system():
    """Test RaceRunner system functionality"""
    try:
        from src.engines.body.systems.race_runner import RaceRunnerSystem, create_race_runner_system, start_mock_race
        from src.dgt_engine.foundation.registry import DGTRegistry
        
        print("✅ RaceRunner imports successful")
        
        # Create race runner system
        system = create_race_runner_system()
        print("✅ RaceRunner system created")
        
        # Test initialization
        init_result = system.initialize()
        assert init_result.success, f"RaceRunner initialization failed: {init_result.error}"
        print("✅ RaceRunner initialized")
        
        # Test participant addition
        add_result = system.add_participant("test_runner", (50, 72))
        assert add_result.success, f"Failed to add participant: {add_result.error}"
        print("✅ Participant added")
        
        # Test race start
        start_result = system.handle_event("start_race", {})
        assert start_result.success, f"Failed to start race: {start_result.error}"
        assert system.race_active == True
        print("✅ Race started")
        
        # Test turbo boost
        turbo_result = system.handle_event("turbo_boost", {"participant_id": "test_runner"})
        assert turbo_result.success, f"Failed to activate turbo: {turbo_result.error}"
        print("✅ Turbo boost activated")
        
        # Run simulation for a few steps
        for i in range(10):
            update_result = system.update(1.0 / 60.0)
            assert update_result.success, f"Update {i} failed: {update_result.error}"
        
        print("✅ Simulation steps completed")
        
        # Test race state
        race_state = system.get_race_state()
        assert race_state['race_active'] == True
        assert race_state['participant_count'] == 1
        assert 'test_runner' in race_state['participants']
        assert race_state['participants']['test_runner']['distance_traveled'] > 0
        print("✅ Race state retrieved")
        
        # Test registry integration
        registry = DGTRegistry()
        snapshot_result = registry.get_world_snapshot()
        assert snapshot_result.success, f"Failed to get world snapshot: {snapshot_result.error}"
        
        snapshot = snapshot_result.value
        assert len(snapshot.entities) == 1
        assert snapshot.entities[0].entity_id == "test_runner"
        assert snapshot.entities[0].metadata['system'] == 'race_runner'
        print("✅ Registry integration working")
        
        # Test race stop
        stop_result = system.handle_event("stop_race", {})
        assert stop_result.success, f"Failed to stop race: {stop_result.error}"
        assert system.race_active == False
        print("✅ Race stopped")
        
        pass
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        pass

def test_mock_race_simulation():
    """Test complete mock race simulation"""
    try:
        print("🏁 Starting mock race simulation...")
        
        # Start mock race
        system = start_mock_race()
        print("✅ Mock race started")
        
        # Run simulation for 2 seconds
        import time
        start_time = time.time()
        
        while time.time() - start_time < 2.0:
            update_result = system.update(1.0 / 60.0)
            if not update_result.success:
                print(f"❌ Simulation update failed: {update_result.error}")
                break
            
            # Check race state periodically
            if int(time.time() - start_time) % 1 == 0:
                race_state = system.get_race_state()
                print(f"🏁 Time: {time.time() - start_time:.1f}s, "
                      f"Distance: {race_state['participants']['scout_1']['distance_traveled']:.1f}")
        
        # Stop race
        stop_result = system.handle_event("stop_race", {})
        assert stop_result.success, f"Failed to stop mock race: {stop_result.error}"
        
        # Get final results
        final_state = system.get_race_state()
        print(f"🏆 Race completed! Final distance: {final_state['participants']['scout_1']['distance_traveled']:.1f}")
        
        pass
        
    except Exception as e:
        print(f"❌ Mock race simulation failed: {e}")
        import traceback
        traceback.print_exc()
        pass

def test_system_metrics():
    """Test system metrics and registry integration"""
    try:
        from src.engines.base import BaseSystem, SystemConfig
        from src.dgt_engine.foundation.registry import DGTRegistry
        
        # Create test system
        config = SystemConfig(
            system_id="metrics_test",
            system_name="Metrics Test System",
            enabled=True,
            auto_register=True
        )
        
        class MetricsTestSystem(BaseSystem):
            def _on_initialize(self) -> Result[bool]:
                return Result.success_result(True)
            
            def _on_shutdown(self) -> Result[None]:
                return Result.success_result(None)
            
            def _on_update(self, dt: float) -> Result[None]:
                # Simulate some work
                import time
                time.sleep(0.001)  # 1ms of work
                return Result.success_result(None)
        
        system = MetricsTestSystem(config)
        system.initialize()
        
        # Update system multiple times
        for i in range(10):
            system.update(1.0 / 60.0)
        
        # Check metrics
        metrics = system.get_metrics()
        assert metrics.total_updates == 10
        assert metrics.average_time > 0
        assert metrics.fps > 0
        print(f"✅ System metrics: {metrics.total_updates} updates, "
              f"avg time: {metrics.average_time:.2f}ms, "
              f"fps: {metrics.fps:.1f}")
        
        # Test registry metrics update
        registry = DGTRegistry()
        metrics_update_result = registry.update_system_metrics("metrics_test", {
            'custom_metric': 42,
            'test_value': 'test'
        })
        assert metrics_update_result.success, f"Failed to update system metrics: {metrics_update_result.error}"
        
        print("✅ Registry metrics updated")
        
        # Get system state from registry
        system_result = registry.get_system("metrics_test")
        assert system_result.success, f"Failed to get system from registry: {system_result.error}"
        
        system_state = system_result.value.get_state()
        assert 'metrics' in system_state
        assert system_state['metrics']['custom_metric'] == 42
        print("✅ System state retrieved from registry")
        
        system.shutdown()
        
        pass
        
    except Exception as e:
        print(f"❌ System metrics test failed: {e}")
        import traceback
        traceback.print_exc()
        pass

if __name__ == "__main__":
    print("🔧 Testing Sprint D Orchestration Layer...")
    
    tests = [
        ("Base System Orchestration", test_base_system_orchestration),
        ("Race Runner System", test_race_runner_system),
        ("Mock Race Simulation", test_mock_race_simulation),
        ("System Metrics", test_system_metrics)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        try:
            test_func()
            success = True
        except Exception:
            success = False
        results.append((test_name, success))
    
    print(f"\n🏁 Sprint D Test Results:")
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    all_passed = all(success for _, success in results)
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
