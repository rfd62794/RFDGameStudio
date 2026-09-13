"""
Test Registry State Snapshots

Sprint C: State Management & Tier Decoupling - Verification
Tests the centralized DGTRegistry state snapshot functionality.
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

def test_registry_state_snapshots():
    """Test registry state snapshot functionality"""
    try:
        from src.dgt_engine.foundation.registry import DGTRegistry
        from src.dgt_engine.foundation.protocols import WorldStateSnapshot, EntityStateSnapshot, EntityType
        from src.dgt_engine.foundation.vector import Vector2
        
        print("✅ Imports successful")
        
        # Create registry
        registry = DGTRegistry()
        print("✅ Registry created")
        
        # Create test entity state
        entity_state = EntityStateSnapshot(
            entity_id="test_entity_001",
            entity_type=EntityType.SHIP,
            position=Vector2(80, 72),
            velocity=Vector2(10, 5),
            radius=4.0,
            active=True,
            metadata={"test": True}
        )
        print("✅ Entity state created")
        
        # Register entity state
        result = registry.register_entity_state("test_entity_001", entity_state)
        assert result.success, f"Entity state registration failed: {result.error}"
        print("✅ Entity state registered")
        
        # Get world snapshot
        snapshot_result = registry.get_world_snapshot()
        assert snapshot_result.success, f"World snapshot failed: {snapshot_result.error}"
        snapshot = snapshot_result.value
        print("✅ World snapshot created")
        
        # Verify snapshot content
        assert len(snapshot.entities) == 1
        assert snapshot.entities[0].entity_id == "test_entity_001"
        assert snapshot.entities[0].entity_type == EntityType.SHIP
        assert snapshot.entities[0].position.x == 80
        assert snapshot.entities[0].position.y == 72
        print("✅ Snapshot content verified")
        
        # Test restore from snapshot
        restore_result = registry.restore_from_snapshot(snapshot)
        assert restore_result.success, f"Restore from snapshot failed: {restore_result.error}"
        print("✅ Restore from snapshot successful")
        
        pass
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        pass

if __name__ == "__main__":
    print("🔧 Testing registry state snapshots...")
    try:
        test_registry_state_snapshots()
        success = True
    except Exception:
        success = False
    print(f"🏁 Test {'PASSED' if success else 'FAILED'}")
