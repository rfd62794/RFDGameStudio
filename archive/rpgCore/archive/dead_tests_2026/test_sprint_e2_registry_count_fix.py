"""
Registry Count Fix Test

Sprint E2.2: Registry Count Resolution - Debugging
Tests the registry counting logic to understand the assertion failure.
"""

import sys
from pathlib import Path

def test_registry_count_debug():
    """Debug registry counting issues"""
    try:
        # Add src to path
        src_path = Path(__file__).parent / "src"
        if str(src_path) not in sys.path:
            sys.path.insert(0, str(src_path))
        
        from apps.tycoon.entities.turtle import create_random_turtle
        from dgt_engine.foundation.registry import DGTRegistry, RegistryType
        
        print("🔧 Registry count debug imports successful")
        
        # Create registry
        registry = DGTRegistry()
        
        # Create turtles
        turtles = []
        for i in range(5):
            turtle = create_random_turtle(f"turtle_{i}", (20 + i * 20, 72))
            turtles.append(turtle)
            print(f"Created turtle_{i} at position {turtle.position}")
        
        # Register turtles and track registration count
        registration_count = 0
        for turtle in turtles:
            result = turtle.register_with_registry(registry)
            if result.success:
                registration_count += 1
                print(f"✅ Registered turtle_{i}")
            else:
                print(f"❌ Failed to register turtle_{i}: {result.error}")
        
        print(f"📊 Registration attempts: {registration_count}")
        
        # Check registry state
        snapshot_result = registry.get_world_snapshot()
        assert snapshot_result.success, f"Registry snapshot failed: {snapshot_result.error}"
        
        # Count entities by type
        entity_count = len(snapshot_result.value.entities)
        print(f"📊 Registry entity count: {entity_count}")
        
        # List all entity IDs
        entity_ids = [entity.entity_id for entity in snapshot_result.value.entities]
        print(f"📊 Entity IDs: {entity_ids}")
        
        # Check for unique IDs
        unique_ids = set(entity_ids)
        print(f"📊 Unique entity IDs: {len(unique_ids)}")
        
        # Check if we have the expected turtles
        expected_turtle_ids = {f"entity_turtle_{i}" for i in range(5)}
        found_turtle_ids = set(entity_ids) & expected_turtle_ids
        print(f"📊 Expected turtle IDs found: {len(found_turtle_ids)}")
        
        return entity_count == 5 and len(found_turtle_ids) == 5
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Testing Registry Count Debug...")
    success = test_registry_count_debug()
    print(f"🏁 Registry Count Debug: {'✅ PASSED' if success else '❌ FAILED'}")
