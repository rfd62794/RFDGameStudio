"""
Palette System - Color Mood Management

ADR 037: The Kinetic Sprite Controller
Implements palette swapping for different moods and areas.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from ui.pixel_renderer import Pixel


class PaletteType(Enum):
    """Color palettes for different moods and areas."""
    DEFAULT = "default"
    DUNGEON = "dungeon"  # Greyscale/Blue (Cold, dangerous)
    TOWN = "town"        # Sepia/Gold (Warm, safe)
    ACTION = "action"      # High-contrast (Red/White for combat)
    FOREST = "forest"      # Green/Brown (Natural)
    WATER = "water"        # Blue/Cyan (Aquatic)
    FIRE = "fire"          # Red/Orange (Dangerous)
    MAGIC = "magic"        # Purple/Pink (Mystical)
    LEGION = "legion"      # Red (Faction colors)
    MERCHANTS = "merchants"  # Gold (Faction colors)
    SCHOLARS = "scholars"    # Blue (Faction colors)


@dataclass
class ColorDefinition:
    """Definition for a color in a palette."""
    name: str
    r: int
    g: int
    b: int
    intensity: float = 1.0


@dataclass
class Palette:
    """Color palette for rendering."""
    name: str
    colors: Dict[str, ColorDefinition]
    description: str = ""
    mood: str = "neutral"


class PaletteManager:
    """
    Manages color palettes for mood-based rendering.
    
    Implements palette swapping to achieve different visual moods
    for different areas and situations.
    """
    
    def __init__(self):
        """Initialize the palette manager."""
        self.palettes: Dict[PaletteType, Palette] = {}
        self.current_palette: PaletteType = PaletteType.DEFAULT
        
        self._initialize_palettes()
        
        logger.info(f"PaletteManager initialized with {len(self.palettes)} palettes")
    
    def _initialize_palettes(self):
        """Initialize all color palettes."""
        
        # Default palette - balanced colors
        default_colors = {
            "grass": ColorDefinition("grass", 34, 139, 34, 1.0),
            "water": ColorDefinition("water", 64, 164, 223, 1.0),
            "stone": ColorDefinition("stone", 128, 128, 128, 1.0),
            "wood": ColorDefinition("wood", 139, 69, 19, 1.0),
            "sand": ColorDefinition("sand", 238, 203, 173, 1.0),
            "dirt": ColorDefinition("dirt", 101, 67, 33, 1.0),
            "wall": ColorDefinition("wall", 64, 64, 64, 1.0),
            "door": ColorDefinition("door", 139, 90, 43, 1.0),
            "window": ColorDefinition("window", 135, 206, 235, 1.0),
            "path": ColorDefinition("path", 160, 160, 160, 1.0),
            "flower": ColorDefinition("flower", 255, 182, 193, 1.0),
            "tree": ColorDefinition("tree", 34, 139, 34, 1.0),
            "chest": ColorDefinition("chest", 139, 90, 43, 1.0),
            "torch": ColorDefinition("torch", 255, 255, 0, 1.0),
            "lava": ColorDefinition("lava", 255, 69, 0, 1.0),
            "ice": ColorDefinition("ice", 176, 224, 230, 1.0),
            "snow": ColorDefinition("snow", 255, 255, 255, 1.0),
            "void": ColorDefinition("void", 0, 0, 0, 0.0)
        }
        
        self.palettes[PaletteType.DEFAULT] = Palette(
            name="default",
            colors=default_colors,
            description="Balanced natural colors",
            mood="neutral"
        )
        
        # Dungeon palette - cold and dangerous
        dungeon_colors = {
            "grass": ColorDefinition("grass", 50, 50, 50, 0.7),  # Darkened
            "water": ColorDefinition("water", 40, 80, 120, 0.8),  # Dark blue
            "stone": ColorDefinition("stone", 80, 80, 90, 0.9),  # Dark stone
            "wood": ColorDefinition("wood", 60, 40, 20, 0.7),  # Dark wood
            "sand": ColorDefinition("sand", 100, 80, 60, 0.6),  # Dark sand
            "dirt": ColorDefinition("dirt", 40, 30, 20, 0.8),  # Dark dirt
            "wall": ColorDefinition("wall", 40, 40, 50, 0.9),  # Dark wall
            "door": ColorDefinition("door", 60, 40, 20, 0.8),  # Dark door
            "window": ColorDefinition("window", 40, 60, 80, 0.7),  # Dark window
            "path": ColorDefinition("path", 80, 80, 80, 0.7),  # Dark path
            "flower": ColorDefinition("flower", 100, 80, 60, 0.5),  # Wilted flower
            "tree": ColorDefinition("tree", 30, 50, 30, 0.6),  # Dark tree
            "chest": ColorDefinition("chest", 60, 40, 20, 0.8),  # Dark chest
            "torch": ColorDefinition("torch", 200, 100, 0, 0.9),  # Dim torch
            "lava": ColorDefinition("lava", 180, 40, 0, 0.9),  # Dim lava
            "ice": ColorDefinition("ice", 120, 160, 180, 0.8),  # Dark ice
            "snow": ColorDefinition("snow", 200, 200, 200, 0.7),  # Dim snow
            "void": ColorDefinition("void", 20, 20, 30, 0.5)  # Dark void
        }
        
        self.palettes[PaletteType.DUNGEON] = Palette(
            name="dungeon",
            colors=dungeon_colors,
            description="Cold and dangerous atmosphere",
            mood="dangerous"
        )
        
        # Town palette - warm and safe
        town_colors = {
            "grass": ColorDefinition("grass", 120, 100, 60, 1.0),  # Golden grass
            "water": ColorDefinition("water", 100, 120, 140, 1.0),  # Calm water
            "stone": ColorDefinition("stone", 150, 130, 100, 1.0),  # Warm stone
            "wood": ColorDefinition("wood", 180, 140, 80, 1.0),  # Warm wood
            "sand": ColorDefinition("sand", 220, 200, 180, 1.0),  # Warm sand
            "dirt": ColorDefinition("dirt", 140, 120, 80, 1.0),  # Warm dirt
            "wall": ColorDefinition("wall", 160, 140, 100, 1.0),  # Warm wall
            "door": ColorDefinition("door", 180, 140, 80, 1.0),  # Warm door
            "window": ColorDefinition("window", 180, 200, 220, 1.0),  # Bright window
            "path": ColorDefinition("path", 180, 180, 180, 1.0),  # Bright path
            "flower": ColorDefinition("flower", 255, 200, 150, 1.0),  # Bright flower
            "tree": ColorDefinition("tree", 100, 120, 60, 1.0),  # Bright tree
            "chest": ColorDefinition("chest", 200, 160, 80, 1.0),  # Golden chest
            "torch": ColorDefinition("torch", 255, 200, 100, 1.0),  # Bright torch
            "lava": ColorDefinition("lava", 255, 150, 50, 1.0),  # Bright lava
            "ice": ColorDefinition("ice", 200, 220, 240, 1.0),  # Bright ice
            "snow": ColorDefinition("snow", 255, 255, 255, 1.0),  # Bright snow
            "void": ColorDefinition("void", 100, 100, 120, 0.3)  # Soft void
        }
        
        self.palettes[PaletteType.TOWN] = Palette(
            name="town",
            colors=town_colors,
            description="Warm and safe atmosphere",
            mood="safe"
        )
        
        # Action palette - high contrast for combat
        action_colors = {
            "grass": ColorDefinition("grass", 255, 255, 255, 1.0),  # White
            "water": ColorDefinition("water", 255, 255, 255, 1.0),  # White
            "stone": ColorDefinition("stone", 255, 255, 255, 1.0),  # White
            "wood": ColorDefinition("wood", 255, 255, 255, 1.0),  # White
            "sand": ColorDefinition("sand", 255, 255, 255, 1.0),  # White
            "dirt": ColorDefinition("dirt", 255, 255, 255, 1.0),  # White
            "wall": ColorDefinition("wall", 255, 255, 255, 1.0),  # White
            "door": ColorDefinition("door", 255, 255, 255, 1.0),  # White
            "window": ColorDefinition("window", 255, 255, 255, 1.0),  # White
            "path": ColorDefinition("path", 255, 255, 255, 1.0),  # White
            "flower": ColorDefinition("flower", 255, 255, 255, 1.0),  # White
            "tree": ColorDefinition("tree", 255, 255, 255, 1.0),  # White
            "chest": ColorDefinition("chest", 255, 255, 255, 1.0),  # White
            "torch": ColorDefinition("torch", 255, 255, 255, 1.0),  # White
            "lava": ColorDefinition("lava", 255, 255, 255, 1.0),  # White
            "ice": ColorDefinition("ice", 255, 255, 255, 1.0),  # White
            "snow": ColorDefinition("snow", 255, 255, 255, 1.0),  # White
            "void": ColorDefinition("void", 0, 0, 0, 0.0)  # Black void
        }
        
        self.palettes[PaletteType.ACTION] = Palette(
            name="action",
            colors=action_colors,
            description="High-contrast for combat",
            mood="intense"
        )
        
        # Forest palette - natural
        forest_colors = {
            "grass": ColorDefinition("grass", 46, 125, 50, 1.0),  # Dark green
            "water": ColorDefinition("water", 56, 156, 215, 1.0),  # Deep blue
            "stone": ColorDefinition("stone", 112, 112, 112, 1.0),  # Natural stone
            "wood": ColorDefinition("wood", 139, 69, 19, 1.0),  # Natural wood
            "sand": ColorDefinition("sand", 238, 203, 173, 1.0),  # Natural sand
            "dirt": ColorDefinition("dirt", 101, 67, 33, 1.0),  # Natural dirt
            "wall": ColorDefinition("wall", 64, 64, 64, 1.0),  # Natural wall
            "door": ColorDefinition("door", 139, 90, 43, 1.0),  # Natural door
            "window": ColorDefinition("window", 135, 206, 235, 1.0),  # Natural window
            "path": ColorDefinition("path", 160, 160, 160, 1.0),  # Natural path
            "flower": ColorDefinition("flower", 255, 182, 193, 1.0),  # Natural flower
            "tree": ColorDefinition("tree", 34, 139, 34, 1.0),  # Natural tree
            "chest": ColorDefinition("chest", 139, 90, 43, 1.0),  # Natural chest
            "torch": ColorDefinition("torch", 255, 255, 0, 1.0),  # Natural torch
            "lava": ColorDefinition("lava", 255, 69, 0, 1.0),  # Natural lava
            "ice": ColorDefinition("ice", 176, 224, 230, 1.0),  # Natural ice
            "snow": ColorDefinition("snow", 255, 255, 255, 1.0),  # Natural snow
            "void": ColorDefinition("void", 0, 0, 0, 0.0)  # Black void
        }
        
        self.palettes[PaletteType.FOREST] = Palette(
            name="forest",
            colors=forest_colors,
            description="Natural environment",
            mood="natural"
        )
        
        # Water palette - aquatic
        water_colors = {
            "grass": ColorDefinition("grass", 34, 139, 34, 0.8),  # Wet grass
            "water": ColorDefinition("water", 72, 172, 231, 1.0),  # Bright water
            "stone": ColorDefinition("stone", 128, 128, 128, 0.9),  # Wet stone
            "wood": ColorDefinition("wood", 139, 69, 19, 0.8),  # Wet wood
            "sand": ColorDefinition("sand", 238, 203, 173, 0.9),  # Wet sand
            "dirt": ColorDefinition("dirt", 101, 67, 33, 0.8),  # Wet dirt
            "wall": ColorDefinition("wall", 64, 64, 64, 0.9),  # Wet wall
            "door": ColorDefinition("door", 139, 90, 43, 0.8),  # Wet door
            "window": ColorDefinition("window", 135, 206, 235, 0.9),  # Wet window
            "path": ColorDefinition("path", 160, 160, 160, 0.9),  # Wet path
            "flower": ColorDefinition("flower", 255, 182, 193, 0.9),  # Wet flower
            "tree": ColorDefinition("tree", 34, 139, 34, 0.8),  # Wet tree
            "chest": ColorDefinition("chest", 139, 90, 43, 0.8),  # Wet chest
            "torch": ColorDefinition("torch", 255, 255, 0, 0.9),  # Wet torch
            "lava": ColorDefinition("lava", 255, 69, 0, 0.9),  # Wet lava
            "ice": ColorDefinition("ice", 176, 224, 230, 1.0),  # Wet ice
            "snow": ColorDefinition("snow", 255, 255, 255, 0.9),  # Wet snow
            "void": ColorDefinition("void", 0, 0, 0, 0.0)  # Black void
        }
        
        self.palettes[PaletteType.WATER] = Palette(
            name="water",
            colors=water_colors,
            description="Aquatic environment",
            mood="aquatic"
        )
        
        # Fire palette - dangerous
        fire_colors = {
            "grass": ColorDefinition("grass", 139, 34, 34, 0.8),  # Burnt grass
            "water": ColorDefinition("water", 255, 69, 0, 1.0),  # Lava water
            "stone": ColorDefinition("stone", 139, 69, 19, 0.9),  # Burnt stone
            "wood": ColorDefinition("wood", 139, 69, 19, 0.8),  # Burnt wood
            "sand": ColorDefinition("sand", 238, 203, 173, 0.8),  # Hot sand
            "dirt": ColorDefinition("dirt", 139, 69, 19, 0.8),  # Burnt dirt
            "wall": ColorDefinition("wall", 139, 69, 19, 0.9),  # Burnt wall
            "door": ColorDefinition("door", 139, 69, 19, 0.9),  # Burnt door
            "window": ColorDefinition("window", 255, 69, 0, 0.9),  # Hot window
            "path": ColorDefinition("path", 160, 160, 160, 0.8),  # Hot path
            "flower": ColorDefinition("flower", 139, 34, 34, 0.5),  # Burnt flower
            "tree": ColorDefinition("tree", 139, 69, 19, 0.8),  # Burnt tree
            "chest": ColorDefinition("chest", 139, 69, 19, 0.9),  # Burnt chest
            "torch": ColorDefinition("torch", 255, 255, 0, 1.0),  # Bright torch
            "lava": ColorDefinition("lava", 255, 69, 0, 1.0),  # Bright lava
            "ice": ColorDefinition("ice", 255, 69, 0, 0.5),  # Melting ice
            "snow": ColorDefinition("snow", 255, 200, 200, 0.7),  # Melting snow
            "void": ColorDefinition("void", 139, 69, 19, 0.8)  # Dark void
        }
        
        self.palettes[PaletteType.FIRE] = Palette(
            name="fire",
            colors=fire_colors,
            description="Dangerous environment",
            mood="dangerous"
        )
        
        # Magic palette - mystical
        magic_colors = {
            "grass": ColorDefinition("grass", 147, 112, 219, 1.0),  # Magical grass
            "water": ColorDefinition("water", 147, 112, 219, 1.0),  # Magical water
            "stone": ColorDefinition("stone", 147, 112, 219, 0.9),  # Magical stone
            "wood": ColorDefinition("wood", 147, 112, 219, 0.8),  # Magical wood
            "sand": ColorDefinition("sand", 238, 203, 173, 0.9),  # Magical sand
            "dirt": ColorDefinition("dirt", 147, 112, 219, 0.8),  # Magical dirt
            "wall": ColorDefinition("wall", 147, 112, 219, 0.9),  # Magical wall
            "door": ColorDefinition("door", 147, 112, 219, 0.9),  # Magical door
            "window": ColorDefinition("window", 147, 112, 219, 0.9),  # Magical window
            "path": ColorDefinition("path", 160, 160, 160, 0.9),  # Magical path
            "flower": ColorDefinition("flower", 255, 182, 193, 1.0),  # Magical flower
            "tree": ColorDefinition("tree", 147, 112, 219, 0.8),  # Magical tree
            "chest": ColorDefinition("chest", 147, 112, 219, 0.9),  # Magical chest
            "torch": ColorDefinition("torch", 255, 255, 0, 1.0),  # Magical torch
            "lava": ColorDefinition("lava", 255, 69, 0, 1.0),  # Magical lava
            "ice": ColorDefinition("ice", 176, 224, 230, 1.0),  # Magical ice
            "snow": ColorDefinition("snow", 255, 255, 255, 1.0),  # Magical snow
            "void": ColorDefinition("void", 147, 112, 219, 0.5)  # Magical void
        }
        
        self.palettes[PaletteType.MAGIC] = Palette(
            name="magic",
            colors=magic_colors,
            description="Mystical environment",
            mood="mystical"
        )
        
        # Faction palettes
        legion_colors = {
            "grass": ColorDefinition("grass", 139, 34, 34, 1.0),  # Red grass
            "water": ColorDefinition("water", 139, 34, 34, 0.8),  # Red water
            "stone": ColorDefinition("stone", 139, 34, 34, 0.9),  # Red stone
            "wood": ColorDefinition("wood", 139, 34, 34, 0.8),  # Red wood
            "sand": ColorDefinition("sand", 238, 203, 173, 0.8),  # Red sand
            "dirt": ColorDefinition("dirt", 139, 34, 34, 0.8),  # Red dirt
            "wall": ColorDefinition("wall", 139, 34, 34, 0.9),  # Red wall
            "door": ColorDefinition("door", 139, 34, 34, 0.9),  # Red door
            "window": ColorDefinition("window", 139, 34, 34, 0.9),  # Red window
            "path": ColorDefinition("path", 160, 160, 160, 0.8),  # Red path
            "flower": ColorDefinition("flower", 255, 182, 193, 0.8),  # Red flower
            "tree": ColorDefinition("tree", 139, 34, 34, 0.8),  # Red tree
            "chest": ColorDefinition("chest", 139, 34, 34, 0.9),  # Red chest
            "torch": ColorDefinition("torch", 255, 255, 0, 1.0),  # Red torch
            "lava": ColorDefinition("lava", 255, 69, 0, 1.0),  # Red lava
            "ice": ColorDefinition("ice", 176, 224, 230, 0.8),  # Red ice
            "snow": ColorDefinition("snow", 255, 200, 200, 0.7),  # Red snow
            "void": ColorDefinition("void", 139, 34, 34, 0.8)  # Red void
        }
        
        self.palettes[PaletteType.LEGION] = Palette(
            name="legion",
            colors=legion_colors,
            description="Legion faction colors",
            mood="militant"
        )
        
        merchants_colors = {
            "grass": ColorDefinition("grass", 218, 165, 32, 1.0),  # Gold grass
            "water": ColorDefinition("water", 218, 165, 32, 0.8),  # Gold water
            "stone": ColorDefinition("stone", 218, 165, 32, 0.9),  # Gold stone
            "wood": ColorDefinition("wood", 218, 165, 32, 0.8),  # Gold wood
            "sand": ColorDefinition("sand", 238, 203, 173, 0.9),  # Gold sand
            "dirt": ColorDefinition("dirt", 218, 165, 32, 0.8),  # Gold dirt
            "wall": ColorDefinition("wall", 218, 165, 32, 0.9),  # Gold wall
            "door": ColorDefinition("door", 218, 165, 32, 0.9),  # Gold door
            "window": ColorDefinition("window", 218, 165, 32, 0.9),  # Gold window
            "path": ColorDefinition("path", 218, 165, 32, 0.9),  # Gold path
            "flower": ColorDefinition("flower", 255, 215, 0, 1.0),  # Gold flower
            "tree": ColorDefinition("tree", 218, 165, 32, 0.8),  # Gold tree
            "chest": ColorDefinition("chest", 218, 165, 32, 0.9),  # Gold chest
            "torch": ColorDefinition("torch", 255, 255, 0, 1.0),  # Gold torch
            "lava": ColorDefinition("lava", 255, 69, 0, 1.0),  # Gold lava
            "ice": ColorDefinition("ice", 176, 224, 230, 0.8),  # Gold ice
            "snow": ColorDefinition("snow", 255, 255, 255, 0.7),  # Gold snow
            "void": ColorDefinition("void", 218, 165, 32, 0.5)  # Gold void
        }
        
        self.palettes[PaletteType.MERCHANTS] = Palette(
            name="merchants",
            colors=merchants_colors,
            description="Merchants faction colors",
            mood="prosperous"
        )
        
        scholars_colors = {
            "grass": ColorDefinition("grass", 112, 147, 219, 1.0),  # Blue grass
            "water": ColorDefinition("water", 112, 147, 219, 0.8),  # Blue water
            "stone": ColorDefinition("stone", 112, 147, 219, 0.9),  # Blue stone
            "wood": ColorDefinition("wood", 112, 147, 219, 0.8),  # Blue wood
            "sand": ColorDefinition("sand", 238, 203, 173, 0.9),  # Blue sand
            "dirt": ColorDefinition("dirt", 112, 147, 219, 0.8),  # Blue dirt
            "wall": ColorDefinition("wall", 112, 147, 219, 0.9),  # Blue wall
            "door": ColorDefinition("door", 112, 147, 219, 0.9),  # Blue door
            "window": ColorDefinition("window", 112, 147, 219, 0.9),  # Blue window
            "path": ColorDefinition("path", 112, 147, 219, 0.9),  # Blue path
            "flower": ColorDefinition("flower", 255, 182, 193, 0.8),  # Blue flower
            "tree": ColorDefinition("tree", 112, 147, 219, 0.8),  # Blue tree
            "chest": ColorDefinition("chest", 112, 147, 219, 0.9),  # Blue chest
            "torch": ColorDefinition("torch", 255, 255, 0, 1.0),  # Blue torch
            "lava": ColorDefinition("lava", 112, 147, 219, 0.9),  # Blue lava
            "ice": ColorDefinition("ice", 176, 224, 230, 0.8),  # Blue ice
            "snow": ColorDefinition("snow", 255, 255, 255, 0.7),  # Blue snow
            "void": ColorDefinition("void", 112, 147, 219, 0.5)  # Blue void
        }
        
        self.palettes[PaletteType.SCHOLARS] = Palette(
            name="scholars",
            colors=scholars_colors,
            description="Scholars faction colors",
            mood="intellectual"
        )
    
    def switch_palette(self, palette_type: PaletteType) -> bool:
        """
        Switch to a different color palette.
        
        Args:
            palette_type: Palette type to switch to
            
        Returns:
            True if successful, False if palette not found
        """
        if palette_type in self.palettes:
            self.current_palette = palette_type
            logger.info(f"Switched to {palette_type.value} palette")
            return True
        
        logger.warning(f"Palette not found: {palette_type.value}")
        return False
    
    def get_current_palette(self) -> Palette:
        """Get the current color palette."""
        return self.palettes[self.current_palette]
    
    def get_color(self, tile_type: str) -> Optional[ColorDefinition]:
        """
        Get a color from the current palette.
        
        Args:
            tile_type: Tile type identifier
            
        Returns:
            Color definition or None if not found
        """
        current_palette = self.get_current_palette()
        return current_palette.colors.get(tile_type)
    
    def apply_palette_to_tile_bank(self, tile_bank: 'TileBank') -> None:
        """
        Apply the current palette to a tile bank.
        
        Args:
            tile_bank: Tile bank to modify
        """
        current_palette = self.get_current_palette()
        
        # Update all tiles in the current bank with new colors
        for tile_key, tile_pattern in tile_bank.tiles.items():
            if tile_pattern.tile_type.value in current_palette.colors:
                new_color = current_palette.colors[tile_pattern.tile_type.value]
                
                # Update all pixels in the tile
                for y in range(tile_pattern.height):
                    for x in range(tile_pattern.width):
                        if tile_pattern.pixels[y][x] is not None:
                            pixel = tile_pattern.pixels[y][x]
                            pixel.r = new_color.r
                            pixel.g = new_color.g
                            pixel.b = new_color.b
                            pixel.intensity = new_color.intensity
    
    def get_palette_info(self) -> Dict[str, Any]:
        """Get information about the palette system."""
        return {
            "current_palette": self.current_palette.value,
            "available_palettes": [palette.value for palette in self.palettes.keys()],
            "total_palettes": len(self.palettes),
            "current_mood": self.get_current_palette().mood,
            "palette_descriptions": {palette.value: palette.description for palette in self.palettes.values()}
        }


# Export for use by other modules
__all__ = ["PaletteManager", "PaletteType", "Palette", "ColorDefinition"]
