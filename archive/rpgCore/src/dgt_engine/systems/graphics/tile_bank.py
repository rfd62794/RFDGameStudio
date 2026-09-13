"""
Tile Bank System - Game Boy Hardware Parity

ADR 036: The Metasprite & Tile-Bank System
Implements the Background (BG) layer with 8x8 pixel patterns.
"""

from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum

from loguru import logger

# Import from the new location (same directory)
from engines.graphics.pixel_renderer import Pixel, ColorPalette


class TileType(Enum):
    """Types of tiles for the Game Boy-style rendering."""
    GRASS = "grass"
    WATER = "water"
    STONE = "stone"
    WOOD = "wood"
    SAND = "sand"
    DIRT = "dirt"
    WALL = "wall"
    DOOR = "door"
    WINDOW = "window"
    PATH = "path"
    FLOWER = "flower"
    TREE = "tree"
    CHEST = "chest"
    TORCH = "torch"
    STAIRS = "stairs"
    BRIDGE = "bridge"
    LAVA = "lava"
    ICE = "ice"
    SNOW = "snow"
    VOID = "void"


@dataclass
class TilePattern:
    """8x8 pixel pattern for Game Boy-style rendering."""
    tile_type: TileType
    width: int = 8
    height: int = 8
    pixels: List[List[Optional[Pixel]]] = None
    transparent_color: int = 0  # Color 0 is transparent in Game Boy
    animation_frames: int = 1  # Number of animation frames
    solid: bool = True  # Whether tile blocks movement
    
    def __post_init__(self):
        """Initialize pixel array if not provided."""
        if self.pixels is None:
            self.pixels = [[None for _ in range(self.width)] for _ in range(self.height)]


class TileBank:
    """
    Registry of 8x8 pixel patterns mimicking Game Boy VRAM.
    
    Manages up to 256 tiles simultaneously, with tile bank swapping
    for different areas (like Pokémon's town transitions).
    """
    
    def __init__(self):
        """Initialize the tile bank."""
        self.tiles: Dict[str, TilePattern] = {}
        self.current_bank: str = "default"
        self.banks: Dict[str, Dict[str, TilePattern]] = {}
        self.max_tiles_per_bank = 256  # Game Boy VRAM limitation
        
        self._initialize_default_tiles()
        self._initialize_banks()
        
        logger.info(f"TileBank initialized with {len(self.tiles)} tiles")
    
    def _initialize_default_tiles(self):
        """Initialize the default tile patterns."""
        
        # Grass tiles (4 variations for natural look)
        self._create_grass_tiles()
        
        # Water tiles (4 variations with animation)
        self._create_water_tiles()
        
        # Stone and building materials
        self._create_stone_tiles()
        self._create_wood_tiles()
        
        # Natural terrain
        self._create_sand_tiles()
        self._create_dirt_tiles()
        
        # Structure tiles
        self._create_wall_tiles()
        self._create_door_tiles()
        self._create_window_tiles()
        
        # Path and decoration tiles
        self._create_path_tiles()
        self._create_flower_tiles()
        self._create_tree_tiles()
        
        # Interactive tiles
        self._create_chest_tiles()
        self._create_torch_tiles()
        
        # Vertical movement tiles
        self._create_stairs_tiles()
        
        # Special tiles
        self._create_bridge_tiles()
        self._create_lava_tiles()
        self._create_ice_tiles()
        self._create_snow_tiles()
        
        # Void tile (transparent)
        self._create_void_tile()
    
    def _create_grass_tiles(self):
        """Create grass tile variations."""
        grass_colors = [
            (34, 139, 34),   # Green
            (46, 125, 50),   # Dark green
            (85, 170, 85),   # Light green
            (62, 142, 62),   # Medium green
        ]
        
        for i, color in enumerate(grass_colors):
            tile = TilePattern(TileType.GRASS)
            
            # Create grass pattern with some texture
            for y in range(8):
                for x in range(8):
                    if (x + y) % 3 == 0:  # Add texture
                        tile.pixels[y][x] = Pixel(color[0], color[1], color[2], 1.0)
                    elif (x * y) % 7 == 0:  # Darker spots
                        tile.pixels[y][x] = Pixel(color[0] * 0.7, color[1] * 0.7, color[2] * 0.7, 1.0)
                    else:
                        tile.pixels[y][x] = Pixel(color[0], color[1], color[2], 0.9)
            
            self.tiles[f"grass_{i}"] = tile
    
    def _create_water_tiles(self):
        """Create animated water tiles."""
        water_colors = [
            (64, 164, 223),  # Blue
            (72, 172, 231),  # Light blue
            (56, 156, 215),  # Dark blue
            (48, 148, 207),  # Deep blue
        ]
        
        for i, color in enumerate(water_colors):
            tile = TilePattern(TileType.WATER, animation_frames=4)
            
            # Create water pattern with waves
            for y in range(8):
                for x in range(8):
                    wave_offset = (x + y + i) % 4
                    if wave_offset == 0:
                        tile.pixels[y][x] = Pixel(color[0], color[1], color[2], 1.0)
                    elif wave_offset == 1:
                        tile.pixels[y][x] = Pixel(color[0], color[1], color[2], 0.8)
                    elif wave_offset == 2:
                        tile.pixels[y][x] = Pixel(color[0], color[1], color[2], 0.6)
                    else:
                        tile.pixels[y][x] = Pixel(color[0], color[1], color[2], 0.4)
            
            self.tiles[f"water_{i}"] = tile
    
    def _create_stone_tiles(self):
        """Create stone and rock tiles."""
        # Stone tile
        tile = TilePattern(TileType.STONE)
        stone_color = (128, 128, 128)
        
        for y in range(8):
            for x in range(8):
                if (x + y) % 2 == 0:
                    tile.pixels[y][x] = Pixel(stone_color[0], stone_color[1], stone_color[2], 1.0)
                else:
                    tile.pixels[y][x] = Pixel(stone_color[0] * 0.8, stone_color[1] * 0.8, stone_color[2] * 0.8, 1.0)
        
        self.tiles["stone"] = tile
        
        # Cobblestone tile
        cobble = TilePattern(TileType.STONE)
        cobble_color = (112, 112, 112)
        
        for y in range(8):
            for x in range(8):
                if (x % 2 == 0) and (y % 2 == 0):
                    cobble.pixels[y][x] = Pixel(cobble_color[0], cobble_color[1], cobble_color[2], 1.0)
                else:
                    cobble.pixels[y][x] = Pixel(cobble_color[0] * 0.7, cobble_color[1] * 0.7, cobble_color[2] * 0.7, 1.0)
        
        self.tiles["cobblestone"] = cobble
    
    def _create_wood_tiles(self):
        """Create wood tiles."""
        wood_color = (139, 69, 19)
        
        # Wood plank
        wood = TilePattern(TileType.WOOD)
        
        for y in range(8):
            for x in range(8):
                if y % 3 == 0:  # Wood grain
                    wood.pixels[y][x] = Pixel(wood_color[0], wood_color[1], wood_color[2], 1.0)
                else:
                    wood.pixels[y][x] = Pixel(wood_color[0] * 0.8, wood_color[1] * 0.8, wood_color[2] * 0.8, 1.0)
        
        self.tiles["wood"] = wood
    
    def _create_sand_tiles(self):
        """Create sand tiles."""
        sand_color = (238, 203, 173)
        
        sand = TilePattern(TileType.SAND)
        
        for y in range(8):
            for x in range(8):
                # Random sand texture
                if (x * y) % 5 == 0:
                    sand.pixels[y][x] = Pixel(sand_color[0], sand_color[1], sand_color[2], 1.0)
                elif (x + y) % 3 == 0:
                    sand.pixels[y][x] = Pixel(sand_color[0] * 0.9, sand_color[1] * 0.9, sand_color[2] * 0.9, 1.0)
                else:
                    sand.pixels[y][x] = Pixel(sand_color[0] * 0.8, sand_color[1] * 0.8, sand_color[2] * 0.8, 1.0)
        
        self.tiles["sand"] = sand
    
    def _create_dirt_tiles(self):
        """Create dirt tiles."""
        dirt_color = (101, 67, 33)
        
        dirt = TilePattern(TileType.DIRT)
        
        for y in range(8):
            for x in range(8):
                dirt.pixels[y][x] = Pixel(dirt_color[0], dirt_color[1], dirt_color[2], 1.0)
        
        self.tiles["dirt"] = dirt
    
    def _create_wall_tiles(self):
        """Create wall tiles."""
        wall_color = (64, 64, 64)
        
        wall = TilePattern(TileType.WALL, solid=True)
        
        for y in range(8):
            for x in range(8):
                # Brick pattern
                if (x // 2 + y // 2) % 2 == 0:
                    wall.pixels[y][x] = Pixel(wall_color[0], wall_color[1], wall_color[2], 1.0)
                else:
                    wall.pixels[y][x] = Pixel(wall_color[0] * 0.8, wall_color[1] * 0.8, wall_color[2] * 0.8, 1.0)
        
        self.tiles["wall"] = wall
    
    def _create_door_tiles(self):
        """Create door tiles."""
        door_color = (139, 90, 43)
        
        door = TilePattern(TileType.DOOR)
        
        # Simple door design
        for y in range(8):
            for x in range(8):
                if x == 0 or x == 7 or y == 0 or y == 7:  # Frame
                    door.pixels[y][x] = Pixel(door_color[0], door_color[1], door_color[2], 1.0)
                elif x == 3 or x == 4:  # Door center
                    door.pixels[y][x] = Pixel(door_color[0] * 0.9, door_color[1] * 0.9, door_color[2] * 0.9, 1.0)
        
        self.tiles["door"] = door
    
    def _create_window_tiles(self):
        """Create window tiles."""
        glass_color = (135, 206, 235)
        frame_color = (101, 67, 33)
        
        window = TilePattern(TileType.WINDOW)
        
        for y in range(8):
            for x in range(8):
                if x == 0 or x == 7 or y == 0 or y == 7:  # Frame
                    window.pixels[y][x] = Pixel(frame_color[0], frame_color[1], frame_color[2], 1.0)
                else:  # Glass
                    window.pixels[y][x] = Pixel(glass_color[0], glass_color[1], glass_color[2], 0.8)
        
        self.tiles["window"] = window
    
    def _create_path_tiles(self):
        """Create path tiles."""
        path_color = (160, 160, 160)
        
        path = TilePattern(TileType.PATH)
        
        for y in range(8):
            for x in range(8):
                # Cobblestone path
                if (x + y) % 2 == 0:
                    path.pixels[y][x] = Pixel(path_color[0], path_color[1], path_color[2], 1.0)
                else:
                    path.pixels[y][x] = Pixel(path_color[0] * 0.8, path_color[1] * 0.8, path_color[2] * 0.8, 1.0)
        
        self.tiles["path"] = path
    
    def _create_flower_tiles(self):
        """Create flower tiles."""
        flower_color = (255, 182, 193)
        center_color = (255, 105, 180)
        
        flower = TilePattern(TileType.FLOWER)
        
        # Simple flower design
        for y in range(8):
            for x in range(8):
                if 3 <= x <= 4 and 3 <= y <= 4:  # Center
                    flower.pixels[y][x] = Pixel(center_color[0], center_color[1], center_color[2], 1.0)
                elif (abs(x - 3.5) + abs(y - 3.5)) <= 2.5:  # Petals
                    flower.pixels[y][x] = Pixel(flower_color[0], flower_color[1], flower_color[2], 1.0)
        
        self.tiles["flower"] = flower
    
    def _create_tree_tiles(self):
        """Create tree tiles."""
        trunk_color = (101, 67, 33)
        leaf_color = (34, 139, 34)
        
        tree = TilePattern(TileType.TREE)
        
        # Simple tree design
        for y in range(8):
            for x in range(8):
                if y >= 5:  # Trunk
                    if 3 <= x <= 4:
                        tree.pixels[y][x] = Pixel(trunk_color[0], trunk_color[1], trunk_color[2], 1.0)
                else:  # Leaves
                    if (abs(x - 3.5) + abs(y - 2.5)) <= 2.5:
                        tree.pixels[y][x] = Pixel(leaf_color[0], leaf_color[1], leaf_color[2], 1.0)
        
        self.tiles["tree"] = tree
    
    def _create_chest_tiles(self):
        """Create chest tiles."""
        chest_color = (139, 90, 43)
        metal_color = (192, 192, 192)
        
        chest = TilePattern(TileType.CHEST)
        
        # Chest design
        for y in range(8):
            for x in range(8):
                if 1 <= x <= 6 and 2 <= y <= 6:  # Chest body
                    chest.pixels[y][x] = Pixel(chest_color[0], chest_color[1], chest_color[2], 1.0)
                elif 3 <= x <= 4 and y == 1:  # Lock
                    chest.pixels[y][x] = Pixel(metal_color[0], metal_color[1], metal_color[2], 1.0)
        
        self.tiles["chest"] = chest
    
    def _create_torch_tiles(self):
        """Create torch tiles."""
        torch_color = (255, 255, 0)
        wood_color = (139, 69, 19)
        
        torch = TilePattern(TileType.TORCH, animation_frames=4)
        
        # Torch with flame animation
        for y in range(8):
            for x in range(8):
                if x == 3 and y >= 4:  # Torch handle
                    torch.pixels[y][x] = Pixel(wood_color[0], wood_color[1], wood_color[2], 1.0)
                elif 2 <= x <= 4 and y <= 3:  # Flame
                    flame_height = 3 - (y % 4)
                    intensity = 1.0 - (flame_height * 0.2)
                    torch.pixels[y][x] = Pixel(torch_color[0], torch_color[1], torch_color[2], intensity)
        
        self.tiles["torch"] = torch
    
    def _create_stairs_tiles(self):
        """Create stairs tiles."""
        stone_color = (128, 128, 128)
        
        stairs = TilePattern(TileType.STAIRS)
        
        # Stair design
        for y in range(8):
            for x in range(8):
                if x <= y:  # Diagonal stairs
                    stairs.pixels[y][x] = Pixel(stone_color[0], stone_color[1], stone_color[2], 1.0)
        
        self.tiles["stairs"] = stairs
    
    def _create_bridge_tiles(self):
        """Create bridge tiles."""
        wood_color = (139, 69, 19)
        
        bridge = TilePattern(TileType.BRIDGE)
        
        # Bridge planks
        for y in range(8):
            for x in range(8):
                if y % 2 == 0:  # Horizontal planks
                    bridge.pixels[y][x] = Pixel(wood_color[0], wood_color[1], wood_color[2], 1.0)
                else:
                    bridge.pixels[y][x] = Pixel(wood_color[0] * 0.8, wood_color[1] * 0.8, wood_color[2] * 0.8, 1.0)
        
        self.tiles["bridge"] = bridge
    
    def _create_lava_tiles(self):
        """Create lava tiles."""
        lava_color = (255, 69, 0)
        
        lava = TilePattern(TileType.LAVA, animation_frames=4)
        
        # Animated lava
        for y in range(8):
            for x in range(8):
                bubble = (x + y) % 3 == 0
                if bubble:
                    lava.pixels[y][x] = Pixel(255, 105, 0, 1.0)  # Bright bubble
                else:
                    lava.pixels[y][x] = Pixel(lava_color[0], lava_color[1], lava_color[2], 0.9)
        
        self.tiles["lava"] = lava
    
    def _create_ice_tiles(self):
        """Create ice tiles."""
        ice_color = (176, 224, 230)
        
        ice = TilePattern(TileType.ICE)
        
        # Ice with cracks
        for y in range(8):
            for x in range(8):
                if (x + y) % 7 == 0:  # Cracks
                    ice.pixels[y][x] = None  # Transparent crack
                else:
                    ice.pixels[y][x] = Pixel(ice_color[0], ice_color[1], ice_color[2], 0.9)
        
        self.tiles["ice"] = ice
    
    def _create_snow_tiles(self):
        """Create snow tiles."""
        snow_color = (255, 255, 255)
        
        snow = TilePattern(TileType.SNOW)
        
        # Snow texture
        for y in range(8):
            for x in range(8):
                if (x * y) % 4 == 0:
                    snow.pixels[y][x] = Pixel(snow_color[0], snow_color[1], snow_color[2], 1.0)
                else:
                    snow.pixels[y][x] = Pixel(snow_color[0] * 0.95, snow_color[1] * 0.95, snow_color[2] * 0.95, 1.0)
        
        self.tiles["snow"] = snow
    
    def _create_void_tile(self):
        """Create void tile (transparent)."""
        void = TilePattern(TileType.VOID, solid=False)
        
        # Void is completely transparent
        for y in range(8):
            for x in range(8):
                void.pixels[y][x] = None
        
        self.tiles["void"] = void
    
    def _initialize_banks(self):
        """Initialize different tile banks for different areas."""
        
        # Default bank (already loaded)
        self.banks["default"] = self.tiles.copy()
        
        # Forest bank (more trees and grass)
        forest_bank = self.tiles.copy()
        # Add more tree variations
        for i in range(2, 4):
            tree_tile = TilePattern(TileType.TREE)
            leaf_color = (46, 125, 50)  # Darker green
            for y in range(8):
                for x in range(8):
                    if y >= 5 + i:  # Lower trunk
                        if 3 <= x <= 4:
                            tree_tile.pixels[y][x] = Pixel(101, 67, 33, 1.0)
                    else:  # Leaves
                        if (abs(x - 3.5) + abs(y - 2.5)) <= 2.5 + i:
                            tree_tile.pixels[y][x] = Pixel(leaf_color[0], leaf_color[1], leaf_color[2], 1.0)
            forest_bank[f"tree_{i}"] = tree_tile
        
        self.banks["forest"] = forest_bank
        
        # Town bank (more buildings)
        town_bank = self.tiles.copy()
        # Add more building tiles
        for i in range(2, 4):
            building_tile = TilePattern(TileType.WALL)
            brick_color = (139, 90, 43)  # Brown bricks
            for y in range(8):
                for x in range(8):
                    if (x // 2 + y // 2 + i) % 2 == 0:
                        building_tile.pixels[y][x] = Pixel(brick_color[0], brick_color[1], brick_color[2], 1.0)
                    else:
                        building_tile.pixels[y][x] = Pixel(brick_color[0] * 0.8, brick_color[1] * 0.8, brick_color[2] * 0.8, 1.0)
            town_bank[f"building_{i}"] = building_tile
        
        self.banks["town"] = town_bank
        
        # Dungeon bank (darker, more stone)
        dungeon_bank = self.tiles.copy()
        # Replace bright tiles with dark versions
        for tile_name in dungeon_bank:
            if "grass" in tile_name:
                # Dark grass for dungeon
                dark_grass = TilePattern(TileType.GRASS)
                for y in range(8):
                    for x in range(8):
                        dark_grass.pixels[y][x] = Pixel(34, 69, 34, 0.7)  # Dark green
                dungeon_bank[tile_name] = dark_grass
        
        self.banks["dungeon"] = dungeon_bank
    
    def get_tile(self, tile_key: str, bank: Optional[str] = None) -> Optional[TilePattern]:
        """
        Get a tile pattern by key.
        
        Args:
            tile_key: Tile identifier
            bank: Optional bank name (uses current bank if None)
            
        Returns:
            Tile pattern or None if not found
        """
        bank_name = bank or self.current_bank
        
        if bank_name in self.banks:
            return self.banks[bank_name].get(tile_key)
        
        return self.tiles.get(tile_key)
    
    def switch_bank(self, bank_name: str) -> bool:
        """
        Switch to a different tile bank.
        
        Args:
            bank_name: Name of the bank to switch to
            
        Returns:
            True if successful, False if bank not found
        """
        if bank_name in self.banks:
            self.current_bank = bank_name
            self.tiles = self.banks[bank_name]
            logger.info(f"Switched to tile bank: {bank_name}")
            return True
        
        logger.warning(f"Tile bank not found: {bank_name}")
        return False
    
    def get_animation_frame(self, tile_key: str, frame: int, bank: Optional[str] = None) -> Optional[TilePattern]:
        """
        Get a specific animation frame for an animated tile.
        
        Args:
            tile_key: Tile identifier
            frame: Animation frame number
            bank: Optional bank name
            
        Returns:
            Tile pattern for the specific frame
        """
        tile = self.get_tile(tile_key, bank)
        
        if tile and tile.animation_frames > 1:
            # Create a modified tile for this frame
            frame_tile = TilePattern(
                tile.tile_type,
                width=tile.width,
                height=tile.height,
                pixels=[[None for _ in range(tile.width)] for _ in range(tile.height)],
                transparent_color=tile.transparent_color,
                animation_frames=tile.animation_frames,
                solid=tile.solid
            )
            
            # Apply frame-specific modifications
            for y in range(tile.height):
                for x in range(tile.width):
                    original_pixel = tile.pixels[y][x]
                    if original_pixel is not None:
                        # Modify intensity based on frame
                        intensity_modifier = 1.0 - (frame * 0.2 / tile.animation_frames)
                        frame_tile.pixels[y][x] = Pixel(
                            original_pixel.r,
                            original_pixel.g,
                            original_pixel.b,
                            original_pixel.intensity * intensity_modifier
                        )
            
            return frame_tile
        
        return tile
    
    def get_available_tiles(self, bank: Optional[str] = None) -> List[str]:
        """
        Get list of available tiles in a bank.
        
        Args:
            bank: Optional bank name
            
        Returns:
            List of tile keys
        """
        bank_name = bank or self.current_bank
        
        if bank_name in self.banks:
            return list(self.banks[bank_name].keys())
        
        return list(self.tiles.keys())
    
    def get_tile_info(self) -> Dict[str, Any]:
        """Get information about the tile bank system."""
        return {
            "current_bank": self.current_bank,
            "available_banks": list(self.banks.keys()),
            "tiles_per_bank": self.max_tiles_per_bank,
            "total_tiles": len(self.tiles),
            "tile_types": list(TileType),
            "animated_tiles": [name for name, tile in self.tiles.items() if tile.animation_frames > 1]
        }


# Export for use by other modules
__all__ = ["TileBank", "TilePattern", "TileType"]
