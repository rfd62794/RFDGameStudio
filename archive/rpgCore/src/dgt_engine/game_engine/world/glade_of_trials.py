"""
Glade of Trials - ADR 106: The Jewel-Box Demo
Curated 20x15 scene showcasing the DGT engine's capabilities
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import random

from dgt_state import Tile, TileType, Voyager


class TerrainType(Enum):
    """Terrain types for the Glade"""
    GRASS = "grass"
    DIRT_PATH = "dirt_path"
    STONE_GROUND = "stone_ground"
    VOID_PATCH = "void_patch"


class FeatureType(Enum):
    """Feature types in the Glade"""
    SWAYING_OAK = "swaying_oak"
    ANCIENT_STONE = "ancient_stone"
    IRON_LOCKBOX = "iron_lockbox"
    GRASS_TUFT = "grass_tuft"
    MYSTIC_FLOWER = "mystic_flower"
    ROCK_FORMATION = "rock_formation"
    BUSH_CLUSTER = "bush_cluster"


@dataclass
class MapFeature:
    """Interactive or decorative feature on the map"""
    x: int
    y: int
    feature_type: FeatureType
    is_barrier: bool = False
    interaction_id: Optional[str] = None
    description: str = ""


@dataclass
class TerrainTile:
    """Base terrain tile"""
    x: int
    y: int
    terrain_type: TerrainType
    sprite_id: str
    has_clutter: bool = False


class GladeOfTrials:
    """
    The Glade of Trials - 20x15 curated game slice
    
    Layout:
    - Center: Voyager starting position
    - North: Dense oak grove barrier
    - East: Ancient stone with observation check
    - South: Iron lockbox with lockpicking check  
    - West: Void patch (goal/exit)
    - Scattered: Environmental clutter and details
    """
    
    def __init__(self):
        self.width = 20
        self.height = 15
        
        # Map data
        self.terrain_tiles: Dict[Tuple[int, int], TerrainTile] = {}
        self.features: List[MapFeature] = []
        self.tiles: Dict[Tuple[int, int], Tile] = {}
        
        # Voyager starting position (center)
        self.voyager_start = (10, 7)
        
        # Generate the glade
        self._generate_terrain()
        self._place_features()
        self._add_environmental_clutter()
        self._create_tile_objects()
        
        print(f"🌳 Glade of Trials generated: {self.width}x{self.height}")
    
    def _generate_terrain(self) -> None:
        """Generate base terrain for the glade"""
        for y in range(self.height):
            for x in range(self.width):
                # Determine terrain type
                terrain_type = self._determine_terrain_type(x, y)
                sprite_id = self._get_terrain_sprite(terrain_type)
                
                terrain = TerrainTile(
                    x=x, y=y,
                    terrain_type=terrain_type,
                    sprite_id=sprite_id
                )
                
                self.terrain_tiles[(x, y)] = terrain
    
    def _determine_terrain_type(self, x: int, y: int) -> TerrainType:
        """Determine terrain type for a given position"""
        # Central path area
        if 8 <= x <= 12 and 6 <= y <= 8:
            return TerrainType.DIRT_PATH
        
        # Void patch (goal) in west
        if x <= 2 and 6 <= y <= 8:
            return TerrainType.VOID_PATCH
        
        # Stone ground around features
        if (15 <= x <= 17 and 5 <= y <= 7) or (12 <= x <= 14 and 9 <= y <= 11):
            return TerrainType.STONE_GROUND
        
        # Default grass
        return TerrainType.GRASS
    
    def _get_terrain_sprite(self, terrain_type: TerrainType) -> str:
        """Get sprite ID for terrain type"""
        sprite_map = {
            TerrainType.GRASS: "grass",
            TerrainType.DIRT_PATH: "dirt_path", 
            TerrainType.STONE_GROUND: "stone_ground",
            TerrainType.VOID_PATCH: "void_patch"
        }
        return sprite_map.get(terrain_type, "grass")
    
    def _place_features(self) -> None:
        """Place major features in the glade"""
        
        # North barrier: Dense oak grove
        oak_positions = [
            (6, 2), (7, 2), (8, 2), (9, 2), (10, 2), (11, 2), (12, 2), (13, 2),
            (6, 3), (13, 3),
            (6, 4), (13, 4)
        ]
        
        for x, y in oak_positions:
            feature = MapFeature(
                x=x, y=y,
                feature_type=FeatureType.SWAYING_OAK,
                is_barrier=True,
                description="A dense oak tree with swaying branches"
            )
            self.features.append(feature)
        
        # East: Ancient stone (observation check)
        ancient_stone = MapFeature(
            x=16, y=6,
            feature_type=FeatureType.ANCIENT_STONE,
            is_barrier=False,
            interaction_id="ancient_stone",
            description="An ancient stone covered in mysterious runes"
        )
        self.features.append(ancient_stone)
        
        # South: Iron lockbox (lockpicking check)
        iron_lockbox = MapFeature(
            x=13, y=10,
            feature_type=FeatureType.IRON_LOCKBOX,
            is_barrier=False,
            interaction_id="iron_lockbox",
            description="An iron lockbox with a complex mechanism"
        )
        self.features.append(iron_lockbox)
        
        # West: Void patch (goal) - already handled by terrain
        
        # Scattered decorative features
        decorative_features = [
            # Rock formations
            (3, 3, FeatureType.ROCK_FORMATION),
            (17, 12, FeatureType.ROCK_FORMATION),
            (5, 11, FeatureType.ROCK_FORMATION),
            
            # Bush clusters
            (2, 13, FeatureType.BUSH_CLUSTER),
            (18, 3, FeatureType.BUSH_CLUSTER),
            (8, 12, FeatureType.BUSH_CLUSTER),
            
            # Mystic flowers
            (4, 5, FeatureType.MYSTIC_FLOWER),
            (15, 8, FeatureType.MYSTIC_FLOWER),
            (9, 4, FeatureType.MYSTIC_FLOWER),
            (11, 13, FeatureType.MYSTIC_FLOWER),
        ]
        
        for x, y, feature_type in decorative_features:
            feature = MapFeature(
                x=x, y=y,
                feature_type=feature_type,
                is_barrier=False,
                description=f"A {feature_type.value.replace('_', ' ')}"
            )
            self.features.append(feature)
    
    def _add_environmental_clutter(self) -> None:
        """Add procedural clutter for visual richness"""
        # Add grass tufts to grassy areas
        for y in range(self.height):
            for x in range(self.width):
                terrain = self.terrain_tiles.get((x, y))
                if terrain and terrain.terrain_type == TerrainType.GRASS:
                    # Random chance of grass tuft
                    if random.random() < 0.3:  # 30% chance
                        terrain.has_clutter = True
    
    def _create_tile_objects(self) -> None:
        """Convert terrain and features to tile objects"""
        # First, create terrain tiles
        for pos, terrain in self.terrain_tiles.items():
            # Skip if there's a feature here
            if any(f.x == pos[0] and f.y == pos[1] for f in self.features):
                continue
            
            # Determine tile type
            if terrain.terrain_type == TerrainType.VOID_PATCH:
                tile_type = TileType.INTERACTIVE  # Goal is interactive
                interaction_id = "void_patch"
                description = "A shimmering void patch - the portal to Volume 4"
            else:
                tile_type = TileType.EMPTY
                interaction_id = None
                description = f"{terrain.terrain_type.value.replace('_', ' ').title()} ground"
            
            tile = Tile(
                x=pos[0], y=pos[1],
                tile_type=tile_type,
                sprite_id=terrain.sprite_id,
                is_barrier=False,
                interaction_id=interaction_id,
                description=description
            )
            
            self.tiles[pos] = tile
        
        # Then, add feature tiles
        for feature in self.features:
            tile_type = TileType.BARRIER if feature.is_barrier else TileType.INTERACTIVE
            
            tile = Tile(
                x=feature.x, y=feature.y,
                tile_type=tile_type,
                sprite_id=feature.feature_type.value,
                is_barrier=feature.is_barrier,
                interaction_id=feature.interaction_id,
                description=feature.description
            )
            
            self.tiles[(feature.x, feature.y)] = tile
    
    def get_starting_position(self) -> Tuple[int, int]:
        """Get Voyager starting position"""
        return self.voyager_start
    
    def get_tile(self, x: int, y: int) -> Optional[Tile]:
        """Get tile at position"""
        return self.tiles.get((x, y))
    
    def get_all_tiles(self) -> List[Tile]:
        """Get all tiles in the glade"""
        return list(self.tiles.values())
    
    def get_interactable_tiles(self) -> List[Tile]:
        """Get all interactive tiles"""
        return [tile for tile in self.tiles.values() if tile.interaction_id]
    
    def print_map_overview(self) -> None:
        """Print ASCII overview of the glade"""
        print("🗺️  The Glade of Trials")
        print("=" * 50)
        print("📍 Key Locations:")
        print("  🧭 Start: Center (10, 7)")
        print("  🌳 Barrier: Northern oak grove")
        print("  🗿 Puzzle: Ancient stone (16, 6) - Observation check")
        print("  📦 Challenge: Iron lockbox (13, 10) - Lockpick check")
        print("  🌌 Goal: Void patch (west) - Portal to Volume 4")
        print("")
        print("🎯 Objectives:")
        print("  1. Explore the glade")
        print("  2. Examine the ancient stone (DC 12 Observation)")
        print("  3. Open the iron lockbox (DC 15 Lockpick)")
        print("  4. Reach the void patch")
        print("")
        
        # Print ASCII map
        self._print_ascii_map()
    
    def _print_ascii_map(self) -> None:
        """Print ASCII representation of the map"""
        print("   " + "".join(str(i).rjust(2) for i in range(self.width)))
        print("  " + "─" * (self.width * 2 + 1))
        
        for y in range(self.height):
            row = f"{y:2d}│"
            for x in range(self.width):
                if (x, y) == self.voyager_start:
                    row += " @"
                else:
                    tile = self.get_tile(x, y)
                    if tile:
                        if tile.is_barrier:
                            row += " #"
                        elif tile.interaction_id:
                            if tile.interaction_id == "ancient_stone":
                                row += " 🗿"
                            elif tile.interaction_id == "iron_lockbox":
                                row += " 📦"
                            elif tile.interaction_id == "void_patch":
                                row += " 🌌"
                            else:
                                row += " ?"
                        else:
                            # Terrain symbols
                            if tile.sprite_id == "void_patch":
                                row += " ◌"
                            elif tile.sprite_id == "dirt_path":
                                row += " ·"
                            elif tile.sprite_id == "stone_ground":
                                row += " ▫"
                            else:  # grass
                                row += " ◦"
                    else:
                        row += " ."
                row += " "
            print(row)
        
        print("  " + "─" * (self.width * 2 + 1))
        print("\nLegend: @=Start, #=Tree, 🗿=Stone, 📦=Lockbox, 🌌=Goal, ◦=Grass, ·=Path, ▫=Stone, ◌=Void")


# Factory function
def create_glade_of_trials() -> GladeOfTrials:
    """Create the Glade of Trials map"""
    return GladeOfTrials()


# Test implementation
if __name__ == "__main__":
    # Test the Glade of Trials
    glade = create_glade_of_trials()
    
    # Print overview
    glade.print_map_overview()
    
    # Test tile access
    print("\n🔍 Testing tile access:")
    print(f"Start position: {glade.get_starting_position()}")
    print(f"Start tile: {glade.get_tile(10, 7).description}")
    print(f"Ancient stone: {glade.get_tile(16, 6).description}")
    print(f"Iron lockbox: {glade.get_tile(13, 10).description}")
    print(f"Void patch: {glade.get_tile(1, 7).description}")
    
    # Test interactable tiles
    interactables = glade.get_interactable_tiles()
    print(f"\n🎯 Found {len(interactables)} interactive objects:")
    for tile in interactables:
        print(f"  {tile.interaction_id} at ({tile.x}, {tile.y}): {tile.description}")
    
    print(f"\n📊 Total tiles: {len(glade.get_all_tiles())}")
