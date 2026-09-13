"""
Simple Space Entity Test

Direct test of the space entity improvements without complex imports.
"""

import sys
from pathlib import Path

# Add src to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

def test_space_entity_direct():
    """Test space entity directly without complex imports"""
    try:
        # Direct imports to avoid circular dependencies
        from dgt_engine.engines.space.vector2 import Vector2
        from dgt_engine.engines.space.space_entity import SpaceEntity, EntityType
        from dgt_core.foundation.types import Result
        
        print("✅ Core imports successful")
        
        # Create test entity
        entity = SpaceEntity(
            EntityType.SHIP, 
            Vector2(80, 72), 
            Vector2(0, 0), 
            0.0
        )
        
        print("✅ SpaceEntity created successfully")
        
        # Test Result[T] pattern
        result = entity.update(0.016)
        assert isinstance(result, Result), f"update() returned {type(result)}, expected Result"
        assert result.success is True, "update() should succeed"
        print("✅ Result[T] pattern working")
        
        # Test sovereign constraints
        entity.position = Vector2(-10, 50)  # Outside left boundary
        entity.update(0.016)
        assert 0 <= entity.position.x < 160, f"X coordinate should wrap to sovereign bounds"
        print("✅ Sovereign constraint compliance working")
        
        # Test Newtonian physics
        initial_position = entity.position.x
        entity.velocity = Vector2(10, 0)
        entity.update(0.016)
        assert entity.position.x > initial_position, f"Position should update based on velocity"
        print("✅ Newtonian physics working")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting Simple Space Entity Test")
    print("=" * 50)
    
    success = test_space_entity_direct()
    
    print("=" * 50)
    if success:
        print("🎉 All tests passed! Space engine architecture is working.")
    else:
        print("⚠️ Test failed. Review implementation.")
    
    sys.exit(0 if success else 1)
