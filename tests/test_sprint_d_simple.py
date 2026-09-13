"""
Simple Sprint D Test - Direct Import Test

Sprint D: Orchestration Layer - Simplified Verification
Tests the core functionality without complex import paths.
"""

import sys
from pathlib import Path

def test_simple_base_system():
    """Test BaseSystem with direct imports"""
    # Add src to path
    src_path = Path(__file__).parent / "src"
    if str(src_path) not in sys.path:
        sys.path.insert(0, str(src_path))
    
    # Import directly
    from dgt_engine.foundation.types import Result
    from dgt_engine.foundation.registry import DGTRegistry
    
    print("✅ Foundation imports successful")
    
    # Test registry functionality
    registry = DGTRegistry()
    print("✅ Registry created")
    
    # Test system registration
    class TestSystem:
        def __init__(self):
            self.system_id = "test"
            self.system_name = "Test System"
        
        def get_state(self):
            return {"system_id": self.system_id, "status": "running"}
    
    system = TestSystem()
    result = registry.register_system("test", system, {"type": "test"})
    assert result.success, f"System registration failed: {result.error}"
    print("✅ System registered")
    
    # Test system retrieval
    retrieved_result = registry.get_system("test")
    assert retrieved_result.success, f"System retrieval failed: {retrieved_result.error}"
    assert retrieved_result.value.system_id == "test"
    print("✅ System retrieved")

def test_simple_race_simulation():
    """Test simple race simulation without complex system"""
    from dgt_engine.foundation.vector import Vector2
    from dgt_engine.foundation.registry import DGTRegistry
    from dgt_engine.foundation.protocols import EntityStateSnapshot, EntityType
    
    print("✅ Race simulation imports successful")
    
    # Create registry
    registry = DGTRegistry()
    
    # Create simple race participant
    participant = EntityStateSnapshot(
        entity_id="racer_1",
        entity_type=EntityType.SHIP,
        position=Vector2(50, 72),
        velocity=Vector2(10, 0),
        radius=5.0,
        active=True,
        metadata={"race_position": 0, "distance": 0.0}
    )
    
    # Register participant
    registry.register_entity_state("racer_1", participant)
    print("✅ Participant registered")
    
    # Simulate race movement
    for i in range(10):
        # Update position
        new_position = participant.position + Vector2(5, 0)  # Move 5 units per step
        participant.position = new_position
        participant.metadata["distance"] += 5.0
        
        # Re-register with new position
        registry.register_entity_state("racer_1", participant)
    
    print(f"✅ Race simulated - final distance: {participant.metadata['distance']}")
    
    # Get world snapshot
    snapshot_result = registry.get_world_snapshot()
    assert snapshot_result.success, f"Snapshot failed: {snapshot_result.error}"
    
    snapshot = snapshot_result.value
    assert len(snapshot.entities) == 1
    assert snapshot.entities[0].entity_id == "racer_1"
    assert snapshot.entities[0].position.x == 100  # 50 + 10*5
    print("✅ World snapshot verified")

def test_registry_centralization():
    """Test registry centralization functionality"""
    from dgt_engine.foundation.registry import DGTRegistry, RegistryType
    from dgt_engine.foundation.protocols import WorldStateSnapshot, EntityStateSnapshot, EntityType
    from dgt_engine.foundation.vector import Vector2
    
    print("✅ Registry centralization imports successful")
    
    # Create fresh registry
    registry = DGTRegistry()
    # Clear any existing state to ensure test isolation
    registry.clear_registry(RegistryType.ENTITY)
    registry.clear_registry(RegistryType.SYSTEM)
    
    # Create multiple entities
    entities = [
        EntityStateSnapshot("entity_1", EntityType.SHIP, Vector2(10, 10), Vector2(1, 0), 5.0, True, {}),
        EntityStateSnapshot("entity_2", EntityType.ASTEROID, Vector2(50, 50), Vector2(0, 1), 8.0, True, {}),
        EntityStateSnapshot("entity_3", EntityType.SCRAP, Vector2(100, 100), Vector2(-1, -1), 3.0, True, {})
    ]
    
    # Register all entities
    for entity in entities:
        registry.register(entity.entity_id, entity, RegistryType.ENTITY, {})
    
    print("✅ Multiple entities registered")
    
    # Get world snapshot
    snapshot_result = registry.get_world_snapshot()
    assert snapshot_result.success, f"World snapshot failed: {snapshot_result.error}"
    
    snapshot = snapshot_result.value
    # Check that we have at least our 3 registered entities
    registered_entity_ids = [e.entity_id for e in snapshot.entities]
    expected_ids = ["entity_1", "entity_2", "entity_3"]
    for expected_id in expected_ids:
        assert expected_id in registered_entity_ids, f"Expected entity {expected_id} not found in registry"
    
    # The registry might have additional entities, so we check for at least 3
    actual_entity_count = len([e for e in snapshot.entities if e.entity_id in expected_ids])
    assert actual_entity_count == 3, f"Expected exactly 3 of our entities, found {actual_entity_count}"
    assert snapshot.game_active == True
    print("✅ World snapshot contains all entities")
    
    # Test system state management
    system_states = {
        "race_system": {"status": "running", "participants": 3},
        "physics_system": {"status": "running", "fps": 60.0},
        "render_system": {"status": "running", "frames": 1000}
    }
    
    for system_id, state in system_states.items():
        class MockSystem:
            def __init__(self, state_data):
                self.state_data = state_data
            def get_state(self):
                return self.state_data
        
        registry.register_system(system_id, MockSystem(state), state)
    
    print("✅ Multiple systems registered")
    
    # Get all system states
    all_states_result = registry.get_all_system_states()
    assert all_states_result.success, f"System states failed: {all_states_result.error}"
    
    all_states = all_states_result.value
    assert len(all_states) == 3
    assert "race_system" in all_states
    assert all_states["race_system"]["participants"] == 3
    print("✅ All system states retrieved")

if __name__ == "__main__":
    print("🔧 Testing Sprint D Orchestration Layer (Simplified)...")
    
    tests = [
        ("Simple Base System", test_simple_base_system),
        ("Simple Race Simulation", test_simple_race_simulation),
        ("Registry Centralization", test_registry_centralization)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        success = test_func()
        results.append((test_name, success))
    
    print(f"\n🏁 Sprint D Test Results:")
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    all_passed = all(success for _, success in results)
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if all_passed:
        print("\n🏆 Sprint D: ORCHESTRATION LAYER - SUCCESS!")
        print("🚀 The Plug-and-Play interface is working!")
        print("🏁 First Turbo simulation running on steel foundation!")
