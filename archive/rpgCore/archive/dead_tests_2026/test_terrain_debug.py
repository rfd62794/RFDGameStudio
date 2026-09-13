"""
Terrain System Debug Test

Sprint E2.2: Terrain System Debug
Tests just the terrain system to isolate the failure.
"""

import sys
from pathlib import Path

def test_terrain_system_debug():
    """Debug terrain system test"""
    try:
        # Add src to path
        src_path = Path(__file__).parent / "src"
        if str(src_path) not in sys.path:
            sys.path.insert(0, str(src_path))
        
        from dgt_engine.engines.body.systems.terrain_engine import TerrainEngine, TerrainType, create_balanced_terrain
        
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
        
        print(f"Found terrain types: land={land_cell.terrain_type if land_cell else None}, water={water_cell.terrain_type if water_cell else None}, rough={rough_cell.terrain_type if rough_cell else None}")
        
        # Verify we found all terrain types
        if land_cell is None:
            print("❌ No land terrain found!")
            return False
        if water_cell is None:
            print("❌ No water terrain found!")
            return False
        if rough_cell is None:
            print("❌ No rough terrain found!")
            return False
        
        print(f"✅ Terrain cell queries: land={land_cell.terrain_type}, water={water_cell.terrain_type}, rough={rough_cell.terrain_type}")
        
        # Verify terrain types
        if land_cell.terrain_type != TerrainType.LAND:
            print(f"❌ Expected {TerrainType.LAND}, got {land_cell.terrain_type}")
            return False
        if water_cell.terrain_type != TerrainType.WATER:
            print(f"❌ Expected {TerrainType.WATER}, got {water_cell.terrain_type}")
            return False
        if rough_cell.terrain_type != TerrainType.ROUGH:
            print(f"❌ Expected {TerrainType.ROUGH}, got {rough_cell.terrain_type}")
            return False
        
        print("✅ Terrain cell types verified")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Testing Terrain System Debug...")
    success = test_terrain_system_debug()
    print(f"🏁 Terrain System Debug: {'✅ PASSED' if success else '❌ FAILED'}")
