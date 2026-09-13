"""
Virtual PPU - Game Boy Hardware Parity

ADR 036: The Metasprite & Tile-Bank System
Virtual Picture Processing Unit that mimics Game Boy's three-layer rendering.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import time

from loguru import logger

from dgt_engine.systems.graphics.pixel_renderer import PixelRenderer, Pixel
from dgt_engine.systems.graphics.tile_bank import TileBank, TileType
from dgt_engine.models.metasprite import Metasprite, MetaspriteConfig, CharacterRole
from dgt_engine.foundation.interfaces.visuals import AnimationState, SpriteCoordinate
from dgt_engine.ui.palette_manager import PaletteManager, PaletteType


class RenderLayer(Enum):
    """Game Boy rendering layers."""
    BACKGROUND = "bg"  # TileMap layer
    WINDOW = "win"    # Text box overlay
    OBJECTS = "obj"   # Sprite layer


@dataclass
class TileMapCoordinate:
    """Coordinate in the tile map."""
    x: int
    y: int
    tile_key: str
    animation_frame: int = 0


# SpriteCoordinate is imported from foundation.interfaces.visuals


@dataclass
class WindowLayer:
    """Window layer for text boxes and status bars."""
    content: str
    x: int
    y: int
    width: int
    height: int
    transparent: bool = True


class VirtualPPU:
    """
    Virtual Picture Processing Unit mimicking Game Boy hardware.
    
    Implements three-layer rendering: Background (BG), Window (WIN), and Objects (OBJ).
    """
    
    def __init__(self, width: int = 160, height: int = 144, kinetic_controller=None):
        """
        Initialize the Virtual PPU.
        
        Args:
            width: Width in pixels (Game Boy: 160)
            height: Height in pixels (Game Boy: 144)
            kinetic_controller: Optional KineticSpriteController (injected via DI)
        """
        self.width = width
        self.height = height
        
        # Initialize rendering layers
        self.tile_map: List[List[Optional[str]]] = [[None for _ in range(width // 8)] for _ in range(height // 8)]
        self.sprites: List[SpriteCoordinate] = []
        self.windows: List[WindowLayer] = []
        
        # Initialize components
        self.tile_bank = TileBank()
        self.pixel_renderer = PixelRenderer(width, height)
        
        # Kinetic controller injected via DI (breaks circular dep with logic.animator)
        self.kinetic_controller = kinetic_controller
        self.palette_manager = PaletteManager()
        
        # Game Boy VRAM limitations
        self.max_sprites = 40  # Game Boy object limit
        self.max_tiles = 256  # Game Boy tile limit
        self.current_tile_bank = "default"
        
        # Animation timing
        self.last_animation_update = time.time()
        self.animation_update_interval = 0.1  # 10 FPS for animations
        
        logger.info(f"VirtualPPU initialized: {width}x{height} pixels ({width // 8}x{height // 8} tiles)")
        if self.kinetic_controller:
            logger.info(f"Kinetic systems: {self.kinetic_controller.get_sprite_info()}")
        logger.info(f"Palette manager: {self.palette_manager.get_palette_info()}")
    
    def set_tile(self, x: int, y: int, tile_key: str, animation_frame: int = 0) -> None:
        """
        Set a tile in the tile map.
        
        Args:
            x: Tile X coordinate (in tiles)
            y: Tile Y coordinate (in tiles)
            tile_key: Tile identifier
            animation_frame: Animation frame number
        """
        tile_x = x // 8
        tile_y = y // 8
        
        if 0 <= tile_x < len(self.tile_map[0]) and 0 <= tile_y < len(self.tile_map):
            self.tile_map[tile_y][tile_x] = tile_key
    
    def set_tile_area(self, x: int, y: int, width: int, height: int, tile_key: str) -> None:
        """
        Set an area of tiles.
        
        Args:
            x: Starting X coordinate (in tiles)
            y: Starting Y coordinate (in tiles)
            width: Width in tiles
            height: Height in tiles
            tile_key: Tile identifier
        """
        for tile_y in range(y, y + height):
            for tile_x in range(x, x + width):
                self.set_tile(tile_x * 8, tile_y * 8, tile_key)
    
    def add_sprite(self, x: int, y: int, metasprite: Metasprite, priority: int = 0) -> bool:
        """
        Add a sprite to the object layer.
        
        Args:
            x: Sprite X coordinate (in pixels)
            y: Sprite Y coordinate (in pixels)
            metasprite: Metasprite to render
            priority: Rendering priority (lower = on top)
            
        Returns:
            True if sprite was added, False if limit reached
        """
        if len(self.sprites) >= self.max_sprites:
            logger.warning("Sprite limit reached")
            return False
        
        sprite_coord = SpriteCoordinate(x, y, metasprite, priority)
        self.sprites.append(sprite_coord)
        
        # Sort sprites by priority
        self.sprites.sort(key=lambda s: s.priority)
        
        return True
    
    def remove_sprite(self, metasprite: Metasprite) -> bool:
        """
        Remove a sprite from the object layer.
        
        Args:
            metasprite: Metasprite to remove
            
        Returns:
            True if sprite was removed, False if not found
        """
        for i, sprite in enumerate(self.sprites):
            if sprite.metasprite == metasprite:
                del self.sprites[i]
                return True
        return False
    
    def add_window(self, content: str, x: int, y: int, width: int, height: int, transparent: bool = True) -> None:
        """
        Add a window layer element.
        
        Args:
            content: Text content
            x: X coordinate
            y: Y coordinate
            width: Width in pixels
            height: Height in pixels
            transparent: Whether window is transparent
        """
        window = WindowLayer(content, x, y, width, height, transparent)
        self.windows.append(window)
    
    def clear_window(self) -> None:
        """Clear all window elements."""
        self.windows.clear()
    
    def switch_tile_bank(self, bank_name: str) -> bool:
        """
        Switch to a different tile bank.
        
        Args:
            bank_name: Name of the tile bank
            
        Returns:
            True if successful, False if bank not found
        """
        return self.tile_bank.switch_bank(bank_name)
    
    def render_frame(self) -> str:
        """
        Render a complete frame using Game Boy three-layer architecture.
        
        Returns:
            Rendered frame as string
        """
        # Clear pixel buffer
        self.pixel_renderer.clear()
        
        # Step 1: Render Background (BG) - TileMap
        self._render_background()
        
        # Step 2: Render Objects (OBJ) - Metasprites
        self._render_objects()
        
        # Step 3: Render Window (WIN) - Text overlay
        self._render_windows()
        
        # Convert to string
        return self.pixel_renderer.render_to_string()
    
    def _render_background(self) -> None:
        """Render the background layer (BG)."""
        for tile_y in range(len(self.tile_map)):
            for tile_x in range(len(self.tile_map[0])):
                tile_key = self.tile_map[tile_y][tile_x]
                
                if tile_key:
                    tile_pattern = self.tile_bank.get_tile(tile_key)
                    
                    if tile_pattern:
                        # Render 8x8 tile at correct position
                        pixel_x = tile_x * 8
                        pixel_y = tile_y * 8
                        
                        for y in range(tile_pattern.height):
                            for x in range(tile_pattern.width):
                                tile_pixel = tile_pattern.pixels[y][x]
                                
                                if tile_pixel is not None:
                                    # Check for transparency (Game Boy Color 0)
                                    if tile_pixel.intensity > 0:
                                        buffer_x = pixel_x + x
                                        buffer_y = pixel_y + y
                                        
                                        if (buffer_x < self.width and buffer_y < self.height):
                                            self.pixel_renderer.set_pixel(buffer_x, buffer_y, tile_pixel)
    
    def _render_objects_with_shadows(self) -> None:
        """Render the object layer (OBJ) with Z-depth shadows."""
        # First render shadows (low priority, rendered first)
        for sprite_coord in self.sprites:
            if sprite_coord.priority >= 100:  # Shadow sprites have high priority number
                metasprite = sprite_coord.metasprite
                pixel_data = metasprite.get_pixel_data()
                
                # Render shadow at sprite position
                for y in range(metasprite.config.height):
                    for x in range(metasprite.config.width):
                        pixel = pixel_data[y][x]
                        
                        if pixel is not None:
                            # Check for transparency (Game Boy Color 0)
                            if pixel.intensity > 0:
                                buffer_x = sprite_coord.x + x
                                buffer_y = sprite_coord.y + y + 4  # Offset shadow below sprite
                                
                                if (buffer_x < self.width and buffer_y < self.height):
                                    self.pixel_renderer.set_pixel(buffer_x, buffer_y, pixel)
        
        # Then render regular sprites
        for sprite_coord in self.sprites:
            if sprite_coord.priority < 100:  # Regular sprites have lower priority
                metasprite = sprite_coord.metasprite
                pixel_data = metasprite.get_pixel_data()
                
                # Render 16x16 metasprite at correct position
                for y in range(metasprite.config.height):
                    for x in range(metasprite.config.width):
                        pixel = pixel_data[y][x]
                        
                        if pixel is not None:
                            # Check for transparency (Game Boy Color 0)
                            if pixel.intensity > 0:
                                buffer_x = sprite_coord.x + x
                                buffer_y = sprite_coord + y
                                
                                if (buffer_x < self.width and buffer_y < self.height):
                                    self.pixel_renderer.set_pixel(buffer_x, buffer_y, pixel)
        """Render the window layer (WIN) - Text overlay."""
        for window in self.windows:
            self._render_text_box(window)
    
    def _render_text_box(self, window: WindowLayer) -> None:
        """Render a text box window."""
        lines = window.content.split('\n')
        
        for line_idx, line in enumerate(lines):
            y = window.y + line_idx * 8  # Assume 8-pixel character height
            
            if y >= self.height:
                continue
            
            for char_idx, char in enumerate(line):
                x = window.x + char_idx * 8  # Assume 8-pixel character width
                
                if x >= self.width:
                    continue
                
                # Create simple character rendering
                if char == ' ':
                    continue  # Skip spaces
                
                # Render character as 8x8 block
                char_color = (255, 255, 255)  # White text
                char_intensity = 1.0
                
                if not window.transparent:
                    # Draw background for non-transparent windows
                    bg_color = (0, 0, 0)  # Black background
                    bg_intensity = 0.8
                    
                    for py in range(8):
                        for px in range(8):
                            buffer_x = x + px
                            buffer_y = y + py
                            
                            if (buffer_x < self.width and buffer_y < self.height):
                                self.pixel_renderer.set_pixel(buffer_x, buffer_y, 
                                    Pixel(bg_color[0], bg_color[1], bg_color[2], bg_intensity))
                
                # Draw character
                for py in range(8):
                    for px in range(8):
                        buffer_x = x + px
                        buffer_y = y + py
                        
                        if (buffer_x < self.width and buffer_y < self.height):
                            # Simple character rendering
                            if px < 4 and py < 4:  # Top-left quadrant
                                self.pixel_renderer.set_pixel(buffer_x, buffer_y, 
                                    Pixel(char_color[0], char_color[1], char_color[2], char_intensity))
    
    def get_tile_at(self, x: int, y: int) -> Optional[str]:
        """
        Get the tile at a specific position.
        
        Args:
            x: X coordinate in pixels
            y: Y coordinate in pixels
            
        Returns:
            Tile key or None if no tile
        """
        tile_x = x // 8
        tile_y = y // 8
        
        if 0 <= tile_x < len(self.tile_map[0]) and 0 <= tile_y < len(self.tile_map):
            return self.tile_map[tile_y][tile_x]
        
        return None
    
    def get_sprite_at(self, x: int, y: int) -> Optional[Metasprite]:
        """
        Get the sprite at a specific position.
        
        Args:
            x: X coordinate in pixels
            y: Y coordinate in pixels
            
        Returns:
            Metasprite or None if no sprite
        """
        for sprite_coord in self.sprites:
            if (sprite_coord.x <= x < sprite_coord.x + sprite_coord.metasprite.config.width and
                sprite_coord.y <= y < sprite_coord.y + sprite_coord.metasprite.config.height):
                return sprite_coord.metasprite
        
        return None
    
    def get_ppu_info(self) -> Dict[str, Any]:
        """Get information about the PPU state."""
        return {
            "resolution": f"{self.width}x{self.height}",
            "tile_resolution": f"{self.width // 8}x{self.height // 8}",
            "max_sprites": self.max_sprites,
            "current_sprites": len(self.sprites),
            "max_tiles": self.max_tiles,
            "current_tile_bank": self.current_tile_bank,
            "available_banks": self.tile_bank.get_available_tiles(),
            "layers": {
                "background": "TileMap",
                "objects": "Metasprites",
                "windows": "Text Overlay"
            }
        }


# Export for use by other modules
__all__ = ["VirtualPPU", "RenderLayer", "TileMapCoordinate", "SpriteCoordinate", "WindowLayer"]
