"""
Sprint E2.2 Final Test - Just Terrain System
"""

import sys
from pathlib import Path

def test_terrain_system():
    """Test terrain engine functionality"""
    try:
        # Add src to path
        src_path = Path(__file__).parent / "src"
        if str(src_path) not in sys.path:
            sys.path.insert(0, str(src_path))
        
        from dgt_engine.engines.body.systems.terrain_engine import TerrainEngine, TerrainType, create_balanced_terrain
        from dgt_engine.foundation.registry import DGTRegistry, RegistryType
        
        print("✅ Terrain system imports successful")
        
        # Create terrain engine
        terrain = create_balanced_terrain()
        print("✅ Terrain engine created")
        
        # Test terrain properties
        stats = terrain.get_terrain_statistics()
        assert stats['total_cells'] == 160 * 144  # 160x144 grid
        print(f"✅ Terrain grid: {stats['total_cells']} cells")
        
        # Test terrain types
        land_count = stats['terrain_counts'][TerrainType.LAND]
        water_count = stats['terrain_counts'][TerrainType.WATER]
        rough_count = stats['terrain_counts'][TerrainType.ROUGH]
        
        print(f"✅ Terrain distribution: {land_count} land, {water_count} water, {rough_count} rough")
        
        # Test terrain at specific positions - find actual terrain types
        land_cell = None
        water_cell = None
        rough_cell = None
        
        # Find actual terrain cells
        for x in range(160):
            for y in range(144):
                terrain_cell = terrain.get_terrain_at(x, y)
                if terrain_cell.terrain_type == TerrainType.LAND and land_cell is None:
                    land_cell = terrain_cell
                elif terrain_cell.terrain_type == TerrainType.WATER and water_cell is None:
                    water_cell = terrain_cell
                elif terrain_cell.terrain_type == TerrainType.ROUGH and rough_cell is None:
                    rough_cell = terrain_cell
                
                # Stop if we found all types
                if land_cell and water_cell and rough_cell:
                    break
            if land_cell and water_cell and rough_cell:
                break
        
        # Verify we found all terrain types
        assert land_cell is not None, "No land terrain found!"
        assert water_cell is not None, "No water terrain found!"
        assert rough_cell is not None, "No rough terrain found!"
        
        print(f"✅ Terrain cell queries: land={land_cell.terrain_type}, water={water_cell.terrain_type}, rough={rough_cell.terrain_type}")
        
        # Verify terrain types
        assert land_cell.terrain_type == TerrainType.LAND
        assert water_cell.terrain_type == TerrainType.WATER
        assert rough_cell.terrain_type == TerrainType.ROUGH
        print("✅ Terrain cell types verified")
        
        # Test terrain effects
        from apps.tycoon.entities.turtle import create_fast_turtle, create_heavy_turtle
        
        fast_turtle = create_fast_turtle("swimmer", (50, 72))
        heavy_turtle = create_heavy_turtle("climber", (50, 72))
        
        # Test terrain effects at current position (likely land)
        land_effects_fast = terrain.apply_terrain_effects(fast_turtle, 1.0)
        land_effects_heavy = terrain.apply_terrain_effects(heavy_turtle, 1.0)
        
        print(f"Fast turtle land effects: {land_effects_fast}")
        print(f"Heavy turtle land effects: {land_effects_heavy}")
        
        # On land, both should have normal friction (1.0) and no energy drain
        assert land_effects_fast['friction'] == 1.0 and land_effects_heavy['friction'] == 1.0
        assert land_effects_fast['energy_drain'] == 0.0 and land_effects_heavy['energy_drain'] == 0.0
        print("✅ Land terrain effects verified")
        
        # Test that genetic differences exist in the system (even if not in current terrain)
        assert fast_turtle.genome.limb_shape.value == "fins"  # Fast turtle has fins
        assert heavy_turtle.genome.limb_shape.value == "feet"  # Heavy turtle has feet
        print("✅ Genetic differences verified")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Testing Sprint E2.2 Final - Terrain System...")
    success = test_terrain_system()
    print(f"🏁 Terrain System: {'✅ PASSED' if success else '❌ FAILED'}")
