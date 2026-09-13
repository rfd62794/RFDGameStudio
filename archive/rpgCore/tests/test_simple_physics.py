"""
Simple Physics Test - Debug Version

Minimal test to isolate physics import issues.
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

def test_simple_physics():
    """Test physics without complex dependencies"""
    try:
        # Test basic imports first
        from dgt_engine.foundation.vector import Vector2
        from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
        print("✅ Foundation imports successful")
        
        # Test entity creation
        from apps.space.entities.space_entity import SpaceEntity, EntityType
        entity = SpaceEntity(
            entity_type=EntityType.SHIP,
            position=Vector2(80, 72),
            velocity=Vector2(0, 0),
            heading=0.0,
            radius=4.0
        )
        print("✅ Entity creation successful")
        
        # Test basic physics operations
        new_position = entity.position + Vector2(10, 5)
        print(f"✅ Position calculation: {new_position.x}, {new_position.y}")
        
        # Test toroidal wrapping
        wrapped_x = new_position.x % SOVEREIGN_WIDTH
        wrapped_y = new_position.y % SOVEREIGN_HEIGHT
        print(f"✅ Toroidal wrapping: {wrapped_x}, {wrapped_y}")
        
        pass
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        pass

if __name__ == "__main__":
    print("🔧 Testing simple physics operations...")
    try:
        test_simple_physics()
        success = True
    except Exception:
        success = False
    print(f"🏁 Test {'PASSED' if success else 'FAILED'}")
