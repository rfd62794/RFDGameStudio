"""
Terrain Effects Debug Test

Sprint E2.2: Terrain Effects Debug
Tests just the terrain effects to isolate the failure.
"""

import sys
from pathlib import Path

def test_terrain_effects_debug():
    """Debug terrain effects test"""
    try:
        # Add src to path
        src_path = Path(__file__).parent / "src"
        if str(src_path) not in sys.path:
            sys.path.insert(0, str(src_path))
        
        from dgt_engine.engines.body.systems.terrain_engine import TerrainEngine, TerrainType, create_balanced_terrain
        from apps.tycoon.entities.turtle import create_fast_turtle, create_heavy_turtle
        
        print("✅ Terrain effects debug imports successful")
        
        # Create terrain engine
        terrain = create_balanced_terrain()
        print("✅ Terrain engine created")
        
        # Create test turtles
        fast_turtle = create_fast_turtle("swimmer", (50, 72))
        heavy_turtle = create_heavy_turtle("climber", (50, 72))
        
        print(f"Fast turtle genome: {fast_turtle.genome}")
        print(f"Heavy turtle genome: {heavy_turtle.genome}")
        
        # Test water effects
        water_effects_fast = terrain.apply_terrain_effects(fast_turtle, 1.0)
        water_effects_heavy = terrain.apply_terrain_effects(heavy_turtle, 1.0)
        
        print(f"Fast turtle water effects: {water_effects_fast}")
        print(f"Heavy turtle water effects: {water_effects_heavy}")
        
        # Fast turtle should have better water performance
        if water_effects_fast['friction'] > water_effects_heavy['friction']:
            print("✅ Fast turtle has better friction in water")
        else:
            print(f"❌ Fast turtle friction ({water_effects_fast['friction']}) <= heavy turtle friction ({water_effects_heavy['friction']})")
        
        if water_effects_fast['energy_drain'] < water_effects_heavy['energy_drain']:
            print("✅ Fast turtle has lower energy drain in water")
        else:
            print(f"❌ Fast turtle energy drain ({water_effects_fast['energy_drain']}) >= heavy turtle energy drain ({water_effects_heavy['energy_drain']})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Testing Terrain Effects Debug...")
    success = test_terrain_effects_debug()
    print(f"🏁 Terrain Effects Debug: {'✅ PASSED' if success else '❌ FAILED'}")
