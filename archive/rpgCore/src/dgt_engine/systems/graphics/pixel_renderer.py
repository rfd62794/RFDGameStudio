"""
Pixel Renderer - Unicode Half-Block Implementation

ADR 031: The Pixel-Protocol Dashboard
Uses Unicode block elements and ANSI colors for 80x48 pixel art rendering.
Maintains fixed-grid architecture while doubling vertical resolution.
"""

import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger


class BlockType(Enum):
    """Unicode block element types for half-block rendering."""
    EMPTY = ' '
    FULL = '█'
    UPPER_HALF = '▀'
    LOWER_HALF = '▄'
    LEFT_QUARTER = '▌'
    RIGHT_QUARTER = '▐'
    UPPER_LEFT_QUARTER = '▛'
    UPPER_RIGHT_QUARTER = '▜'
    LOWER_LEFT_QUARTER = '▙'
    LOWER_RIGHT_QUARTER = '▟'
    LIGHT_SHADE = '░'
    MEDIUM_SHADE = '▒'
    DARK_SHADE = '▓'


@dataclass
class Pixel:
    """A single pixel with color and intensity."""
    r: int = 0  # Red 0-5 (ANSI 6-level)
    g: int = 0  # Green 0-5  
    b: int = 0  # Blue 0-5
    intensity: float = 0.0  # Brightness 0.0-1.0 (0.0 = empty/transparent)
    
    def is_empty(self) -> bool:
        """Check if pixel is empty/transparent."""
        return self.intensity <= 0.0
    
    def to_ansi_color(self) -> int:
        """Convert RGB to ANSI 256-color index."""
        if self.is_empty():
            return 0  # Default background
        
        # Convert 6-level RGB to ANSI 256-color
        # Formula: 16 + 36 * r + 6 * g + b
        return 16 + 36 * min(5, self.r) + 6 * min(5, self.g) + min(5, self.b)
    
    def to_hex(self) -> str:
        """Convert to hex color string."""
        if self.is_empty():
            return "#000000"
        
        # Scale 6-level RGB to 8-bit
        r8 = int((self.r / 5.0) * 255)
        g8 = int((self.g / 5.0) * 255) 
        b8 = int((self.b / 5.0) * 255)
        
        return f"#{r8:02x}{g8:02x}{b8:02x}"


@dataclass
class SpriteFrame:
    """A single frame of an animated sprite."""
    pixels: List[List[Pixel]]
    width: int
    height: int
    
    def __post_init__(self):
        """Validate sprite dimensions."""
        if len(self.pixels) != self.height:
            raise ValueError(f"Sprite height mismatch: expected {self.height}, got {len(self.pixels)}")
        
        for row in self.pixels:
            if len(row) != self.width:
                raise ValueError(f"Sprite width mismatch: expected {self.width}, got {len(row)}")
    
    def get_pixel(self, x: int, y: int) -> Pixel:
        """Get pixel at coordinates with bounds checking."""
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.pixels[y][x]
        return Pixel()  # Empty pixel for out of bounds


@dataclass
class AnimatedSprite:
    """An animated sprite with multiple frames."""
    frames: List[SpriteFrame]
    frame_duration: float  # Seconds per frame
    loop: bool = True
    
    def get_frame(self, time: float) -> SpriteFrame:
        """Get appropriate frame for given time."""
        if not self.frames:
            return SpriteFrame([], 0, 0)
        
        if len(self.frames) == 1:
            return self.frames[0]
        
        # Calculate frame index
        total_duration = len(self.frames) * self.frame_duration
        if self.loop:
            time = time % total_duration
        
        frame_index = min(int(time / self.frame_duration), len(self.frames) - 1)
        return self.frames[frame_index]


class ColorPalette:
    """ANSI color palette for faction-based coloring."""
    
    # Faction color mappings (6-level RGB)
    FACTION_COLORS = {
        "legion": {"r": 5, "g": 0, "b": 0},      # Red
        "merchants": {"r": 5, "g": 4, "b": 0},   # Gold/Yellow
        "scholars": {"r": 0, "g": 3, "b": 5},    # Blue
        "nomads": {"r": 3, "g": 5, "b": 0},      # Green
        "mystics": {"r": 4, "g": 0, "b": 5},     # Purple
        "neutral": {"r": 3, "g": 3, "b": 3},     # Grey
    }
    
    # Environment colors
    ENVIRONMENT_COLORS = {
        "wall": {"r": 2, "g": 2, "b": 2},       # Dark grey
        "floor": {"r": 1, "g": 1, "b": 1},      # Light grey
        "water": {"r": 0, "g": 2, "b": 4},      # Blue
        "grass": {"r": 1, "g": 3, "b": 0},      # Green
        "stone": {"r": 3, "g": 3, "b": 3},      # Stone grey
        "wood": {"r": 4, "g": 2, "b": 0},       # Brown
    }
    
    @classmethod
    def get_faction_color(cls, faction: str, intensity: float = 1.0) -> Pixel:
        """Get pixel color for faction."""
        color = cls.FACTION_COLORS.get(faction, cls.FACTION_COLORS["neutral"])
        return Pixel(
            r=color["r"],
            g=color["g"], 
            b=color["b"],
            intensity=intensity
        )
    
    @classmethod
    def get_environment_color(cls, env_type: str, intensity: float = 1.0) -> Pixel:
        """Get pixel color for environment."""
        color = cls.ENVIRONMENT_COLORS.get(env_type, cls.ENVIRONMENT_COLORS["wall"])
        return Pixel(
            r=color["r"],
            g=color["g"],
            b=color["b"],
            intensity=intensity
        )


class PixelRenderer:
    """
    High-resolution pixel renderer using Unicode half-block technique.
    
    Converts 80x48 pixel buffer to 80x24 character output with ANSI colors.
    """
    
    def __init__(self, width: int = 80, height: int = 48):
        """
        Initialize pixel renderer.
        
        Args:
            width: Pixel width (typically 80)
            height: Pixel height (typically 48 for half-block rendering)
        """
        self.pixel_width = width
        self.pixel_height = height
        self.char_width = width
        self.char_height = height // 2  # Half-block doubles vertical resolution
        
        # Pixel buffer (2D array of Pixel objects)
        self.pixels = [[Pixel() for _ in range(width)] for _ in range(height)]
        
        # ANSI escape sequences
        self.ANSI_RESET = "\033[0m"
        self.ANSI_COLOR_PREFIX = "\033[38;5;"
        self.ANSI_BG_PREFIX = "\033[48;5;"
        
        logger.info(f"PixelRenderer initialized: {width}x{height} pixels ({self.char_width}x{self.char_height} chars)")
    
    def clear(self) -> None:
        """Clear the pixel buffer."""
        self.pixels = [[Pixel() for _ in range(self.pixel_width)] for _ in range(self.pixel_height)]
    
    def set_pixel(self, x: int, y: int, pixel: Pixel) -> None:
        """
        Set a single pixel with bounds checking.
        
        Args:
            x: X coordinate
            y: Y coordinate  
            pixel: Pixel data
        """
        if 0 <= x < self.pixel_width and 0 <= y < self.pixel_height:
            self.pixels[y][x] = pixel
    
    def set_pixel_rgb(self, x: int, y: int, r: int, g: int, b: int, intensity: float = 1.0) -> None:
        """
        Set a pixel using RGB values.
        
        Args:
            x: X coordinate
            y: Y coordinate
            r: Red component (0-5)
            g: Green component (0-5)
            b: Blue component (0-5)
            intensity: Brightness (0.0-1.0)
        """
        pixel = Pixel(r=r, g=g, b=b, intensity=intensity)
        self.set_pixel(x, y, pixel)
    
    def draw_sprite(self, sprite: AnimatedSprite, x: int, y: int, time: float) -> None:
        """
        Draw an animated sprite at position.
        
        Args:
            sprite: Animated sprite to draw
            x: X position (top-left)
            y: Y position (top-left)
            time: Current time for animation
        """
        frame = sprite.get_frame(time)
        
        for py in range(frame.height):
            for px in range(frame.width):
                pixel = frame.get_pixel(px, py)
                if not pixel.is_empty():
                    self.set_pixel(x + px, y + py, pixel)
    
    def draw_line(self, x1: int, y1: int, x2: int, y2: int, pixel: Pixel) -> None:
        """
        Draw a line using Bresenham's algorithm.
        
        Args:
            x1, y1: Start coordinates
            x2, y2: End coordinates
            pixel: Pixel color
        """
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy
        
        x, y = x1, y1
        
        while True:
            self.set_pixel(x, y, pixel)
            
            if x == x2 and y == y2:
                break
            
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy
    
    def draw_rectangle(self, x: int, y: int, width: int, height: int, pixel: Pixel, fill: bool = False) -> None:
        """
        Draw a rectangle.
        
        Args:
            x, y: Top-left corner
            width: Rectangle width
            height: Rectangle height
            pixel: Pixel color
            fill: Whether to fill the rectangle
        """
        if fill:
            for py in range(y, y + height):
                for px in range(x, x + width):
                    self.set_pixel(px, py, pixel)
        else:
            # Draw outline
            for px in range(x, x + width):
                self.set_pixel(px, y, pixel)
                self.set_pixel(px, y + height - 1, pixel)
            for py in range(y, y + height):
                self.set_pixel(x, py, pixel)
                self.set_pixel(x + width - 1, py, pixel)
    
    def render_to_string(self) -> str:
        """
        Render pixel buffer to ANSI string using half-block technique.
        
        Returns:
            ANSI-colored string ready for terminal output
        """
        lines = []
        
        for char_y in range(self.char_height):
            line_parts = []
            
            for char_x in range(self.char_width):
                # Get upper and lower pixels
                upper_pixel = self.pixels[char_y * 2][char_x] if char_y * 2 < self.pixel_height else Pixel()
                lower_pixel = self.pixels[char_y * 2 + 1][char_x] if char_y * 2 + 1 < self.pixel_height else Pixel()
                
                # Determine block type and colors
                upper_empty = upper_pixel.is_empty()
                lower_empty = lower_pixel.is_empty()
                
                if upper_empty and lower_empty:
                    # Both empty - space
                    line_parts.append(' ')
                elif not upper_empty and lower_empty:
                    # Only upper - upper half block
                    line_parts.append(self._colored_char('▀', upper_pixel, None))
                elif upper_empty and not lower_empty:
                    # Only lower - lower half block  
                    line_parts.append(self._colored_char('▄', None, lower_pixel))
                else:
                    # Both present - check if same color
                    if upper_pixel.to_ansi_color() == lower_pixel.to_ansi_color():
                        # Same color - full block
                        line_parts.append(self._colored_char('█', upper_pixel, None))
                    else:
                        # Different colors - use two half blocks with different colors
                        # This requires complex ANSI handling, for now use upper
                        line_parts.append(self._colored_char('▀', upper_pixel, None))
            
            lines.append(''.join(line_parts))
        
        return '\n'.join(lines)
    
    def _colored_char(self, char: str, fg_pixel: Optional[Pixel], bg_pixel: Optional[Pixel]) -> str:
        """
        Apply ANSI coloring to a character.
        
        Args:
            char: Character to color
            fg_pixel: Foreground pixel (or None)
            bg_pixel: Background pixel (or None)
            
        Returns:
            ANSI-colored character string
        """
        if fg_pixel is None and bg_pixel is None:
            return char
        
        parts = []
        
        # Foreground color
        if fg_pixel and not fg_pixel.is_empty():
            parts.append(f"{self.ANSI_COLOR_PREFIX}{fg_pixel.to_ansi_color()}m")
        
        # Background color
        if bg_pixel and not bg_pixel.is_empty():
            parts.append(f"{self.ANSI_BG_PREFIX}{bg_pixel.to_ansi_color()}m")
        
        # Character and reset
        parts.append(char)
        parts.append(self.ANSI_RESET)
        
        return ''.join(parts)
    
    def get_dimensions(self) -> Tuple[int, int]:
        """Get pixel dimensions."""
        return (self.pixel_width, self.pixel_height)
    
    def get_char_dimensions(self) -> Tuple[int, int]:
        """Get character dimensions after half-block conversion."""
        return (self.char_width, self.char_height)


# Export for use by other modules
__all__ = [
    "PixelRenderer", 
    "Pixel", 
    "AnimatedSprite", 
    "SpriteFrame",
    "ColorPalette",
    "BlockType"
]
