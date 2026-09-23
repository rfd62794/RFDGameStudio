"""
Pixel Renderer - Unicode Half-Block Rendering System

Provides low-resolution pixel art rendering using Unicode block elements
and ANSI colors. Implements 160x144 PPU-style graphics with half-block
precision for retro aesthetic.

Features:
- Unicode block element rendering (▀ ▄ █ etc.)
- ANSI 256-color support
- Sprite frame management with animation
- Efficient batch rendering
"""

import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result


# Factory functions
def create_default_pixel_renderer(width: int = 160, height: int = 144) -> 'PixelRenderer':
    """Create default pixel renderer with Game Boy resolution"""
    config = SystemConfig(name="PixelRenderer")
    renderer = PixelRenderer(config, width, height)
    renderer.initialize()
    return renderer


def create_high_res_pixel_renderer(width: int = 320, height: int = 288) -> 'PixelRenderer':
    """Create high-resolution pixel renderer (2x Game Boy resolution)"""
    config = SystemConfig(name="HighResPixelRenderer")
    renderer = PixelRenderer(config, width, height)
    renderer.initialize()
    return renderer


def create_ultra_res_pixel_renderer(width: int = 640, height: int = 576) -> 'PixelRenderer':
    """Create ultra-high-resolution pixel renderer (4x Game Boy resolution)"""
    config = SystemConfig(name="UltraResPixelRenderer", performance_monitoring=True)
    renderer = PixelRenderer(config, width, height)
    renderer.initialize()
    return renderer


class BlockType(Enum):
    """Unicode block elements for rendering"""
    EMPTY = ' '
    FULL = '█'
    UPPER_HALF = '▀'
    LOWER_HALF = '▄'
    LEFT_QUARTER = '▌'
    RIGHT_QUARTER = '▐'
    UPPER_LEFT = '▛'
    UPPER_RIGHT = '▜'
    LOWER_LEFT = '▙'
    LOWER_RIGHT = '▟'
    LIGHT_SHADE = '░'
    MEDIUM_SHADE = '▒'
    DARK_SHADE = '▓'


@dataclass
class Pixel:
    """Single pixel with color and intensity"""
    r: int = 0  # Red 0-5 (ANSI 6-level)
    g: int = 0  # Green 0-5
    b: int = 0  # Blue 0-5
    intensity: float = 0.0  # Brightness 0.0-1.0

    def is_empty(self) -> bool:
        """Check if pixel is empty/transparent"""
        return self.intensity <= 0.0

    def to_ansi_color(self) -> int:
        """Convert RGB to ANSI 256-color index"""
        if self.is_empty():
            return 0
        # Formula: 16 + 36*r + 6*g + b
        return 16 + 36 * min(5, self.r) + 6 * min(5, self.g) + min(5, self.b)

    def to_hex(self) -> str:
        """Convert to hex color string"""
        if self.is_empty():
            return "#000000"
        r8 = int((self.r / 5.0) * 255)
        g8 = int((self.g / 5.0) * 255)
        b8 = int((self.b / 5.0) * 255)
        return f"#{r8:02x}{g8:02x}{b8:02x}"


@dataclass
class SpriteFrame:
    """Single frame of an animated sprite"""
    pixels: List[List[Pixel]]
    width: int
    height: int

    def __post_init__(self):
        """Validate sprite dimensions"""
        if len(self.pixels) != self.height:
            raise ValueError(f"Sprite height mismatch: expected {self.height}, got {len(self.pixels)}")
        for row in self.pixels:
            if len(row) != self.width:
                raise ValueError(f"Sprite width mismatch: expected {self.width}, got {len(row)}")

    def get_pixel(self, x: int, y: int) -> Pixel:
        """Get pixel at coordinates with bounds checking"""
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.pixels[y][x]
        return Pixel()  # Empty pixel for out of bounds


@dataclass
class AnimatedSprite:
    """Animated sprite with multiple frames"""
    frames: List[SpriteFrame]
    frame_duration: float  # Seconds per frame
    loop: bool = True

    def get_frame(self, time: float) -> SpriteFrame:
        """Get appropriate frame for given time"""
        if not self.frames:
            return SpriteFrame([], 0, 0)

        if self.loop:
            frame_index = int((time / self.frame_duration) % len(self.frames))
        else:
            frame_index = min(int(time / self.frame_duration), len(self.frames) - 1)

        return self.frames[frame_index]

    def is_complete(self, time: float) -> bool:
        """Check if animation is complete"""
        if self.loop:
            return False
        return time >= len(self.frames) * self.frame_duration


class PixelRenderer(BaseSystem):
    """
    Renders pixel art using Unicode blocks and ANSI colors.
    Manages sprites, animation, and rendering buffer.
    """

    def __init__(self, config: Optional[SystemConfig] = None,
                 width: int = 160, height: int = 144):
        super().__init__(config or SystemConfig(name="PixelRenderer"))
        self.width = width
        self.height = height

        # Rendering buffer (RGBA)
        self.buffer: List[List[Pixel]] = [
            [Pixel() for _ in range(width)] for _ in range(height)
        ]

        # Sprite registry
        self.sprites: Dict[str, AnimatedSprite] = {}
        self.sprite_instances: Dict[str, Dict[str, Any]] = {}  # sprite_id -> {pos, time, etc}

        # Statistics
        self.total_sprites_rendered = 0
        self.total_frames_rendered = 0

    def initialize(self) -> bool:
        """Initialize the pixel renderer"""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update sprite animations"""
        if self.status != SystemStatus.RUNNING:
            return

        # Update sprite instance times
        for sprite_id in list(self.sprite_instances.keys()):
            self.sprite_instances[sprite_id]['time'] += delta_time

    def shutdown(self) -> None:
        """Shutdown the pixel renderer"""
        self.sprites.clear()
        self.sprite_instances.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process renderer intents"""
        action = intent.get("action", "")

        if action == "register_sprite":
            sprite_id = intent.get("sprite_id", "")
            animated_sprite = intent.get("sprite")
            self.register_sprite(sprite_id, animated_sprite)
            return {"registered": True}

        elif action == "render_sprite":
            sprite_id = intent.get("sprite_id", "")
            x = intent.get("x", 0)
            y = intent.get("y", 0)
            result = self.render_sprite_at(sprite_id, x, y)
            return {"rendered": result.success, "error": result.error}

        elif action == "clear_buffer":
            self.clear_buffer()
            return {"cleared": True}

        elif action == "get_buffer":
            return {"buffer_size": (self.width, self.height), "total_pixels": self.width * self.height}

        else:
            return {"error": f"Unknown PixelRenderer action: {action}"}

    def register_sprite(self, sprite_id: str, sprite: AnimatedSprite) -> None:
        """Register an animated sprite"""
        self.sprites[sprite_id] = sprite

    def render_sprite_at(self, sprite_id: str, x: int, y: int) -> Result[bool]:
        """Render sprite at specified position"""
        if sprite_id not in self.sprites:
            return Result(success=False, error=f"Sprite not found: {sprite_id}")

        sprite = self.sprites[sprite_id]
        frame_time = self.sprite_instances.get(sprite_id, {}).get('time', 0.0)
        frame = sprite.get_frame(frame_time)

        if not frame.pixels:
            return Result(success=False, error="Empty sprite frame")

        # Render frame to buffer
        for fy in range(frame.height):
            for fx in range(frame.width):
                buffer_x = x + fx
                buffer_y = y + fy

                if 0 <= buffer_x < self.width and 0 <= buffer_y < self.height:
                    pixel = frame.get_pixel(fx, fy)
                    if not pixel.is_empty():
                        self.buffer[buffer_y][buffer_x] = pixel

        self.total_sprites_rendered += 1
        return Result(success=True, value=True)

    def clear_buffer(self) -> None:
        """Clear the rendering buffer"""
        self.buffer = [
            [Pixel() for _ in range(self.width)] for _ in range(self.height)
        ]

    def draw_pixel(self, x: int, y: int, pixel: Pixel) -> Result[bool]:
        """Draw a single pixel"""
        if 0 <= x < self.width and 0 <= y < self.height:
            self.buffer[y][x] = pixel
            return Result(success=True, value=True)
        return Result(success=False, error="Pixel out of bounds")

    def draw_line(self, x0: int, y0: int, x1: int, y1: int, pixel: Pixel) -> None:
        """Draw a line using Bresenham algorithm"""
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy

        x, y = x0, y0
        while True:
            self.draw_pixel(x, y, pixel)
            if x == x1 and y == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy

    def draw_rect(self, x: int, y: int, w: int, h: int, pixel: Pixel, filled: bool = False) -> None:
        """Draw a rectangle"""
        if filled:
            for ry in range(y, y + h):
                for rx in range(x, x + w):
                    self.draw_pixel(rx, ry, pixel)
        else:
            # Top and bottom
            for rx in range(x, x + w):
                self.draw_pixel(rx, y, pixel)
                self.draw_pixel(rx, y + h - 1, pixel)
            # Left and right
            for ry in range(y, y + h):
                self.draw_pixel(x, ry, pixel)
                self.draw_pixel(x + w - 1, ry, pixel)

    def draw_circle(self, cx: int, cy: int, radius: int, pixel: Pixel, filled: bool = False) -> Result[bool]:
        """Draw a circle using Midpoint Circle Algorithm"""
        try:
            if radius < 0:
                return Result(success=False, error="Radius must be non-negative")

            if filled:
                # Draw filled circle
                for y in range(-radius, radius + 1):
                    for x in range(-radius, radius + 1):
                        if x*x + y*y <= radius*radius:
                            self.draw_pixel(cx + x, cy + y, pixel)
            else:
                # Draw circle outline (Midpoint algorithm)
                x = radius
                y = 0
                d = 3 - 2 * radius

                while x >= y:
                    # Draw 8 symmetric points
                    self.draw_pixel(cx + x, cy + y, pixel)
                    self.draw_pixel(cx - x, cy + y, pixel)
                    self.draw_pixel(cx + x, cy - y, pixel)
                    self.draw_pixel(cx - x, cy - y, pixel)
                    self.draw_pixel(cx + y, cy + x, pixel)
                    self.draw_pixel(cx - y, cy + x, pixel)
                    self.draw_pixel(cx + y, cy - x, pixel)
                    self.draw_pixel(cx - y, cy - x, pixel)

                    if d < 0:
                        d = d + 4 * y + 6
                    else:
                        d = d + 4 * (y - x) + 10
                        x -= 1
                    y += 1

            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=str(e))

    def draw_ellipse(self, cx: int, cy: int, rx: int, ry: int, pixel: Pixel) -> Result[bool]:
        """Draw an ellipse outline"""
        try:
            if rx < 0 or ry < 0:
                return Result(success=False, error="Radii must be non-negative")

            x = 0
            y = ry
            d1 = (ry * ry) - (rx * rx * ry) + (0.25 * rx * rx)

            while (rx * rx) * (y - 0.5) > (ry * ry) * (x + 1):
                self.draw_pixel(cx + x, cy + y, pixel)
                self.draw_pixel(cx - x, cy + y, pixel)
                self.draw_pixel(cx + x, cy - y, pixel)
                self.draw_pixel(cx - x, cy - y, pixel)

                if d1 < 0:
                    d1 = d1 + 2 * (ry * ry) * x + 3 * (ry * ry)
                else:
                    d1 = d1 + 2 * (ry * ry) * x - 2 * (rx * rx) * y + 3 * (ry * ry) - 2 * (rx * rx)
                    y -= 1
                x += 1

            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=str(e))

    def get_buffer_as_text(self) -> str:
        """Render buffer as ANSI-colored text with Unicode blocks"""
        lines = []
        for row in self.buffer:
            line = ""
            for pixel in row:
                if pixel.is_empty():
                    line += " "
                else:
                    # Use intensity to select block type
                    intensity = pixel.intensity
                    if intensity >= 0.9:
                        block = BlockType.FULL.value
                    elif intensity >= 0.7:
                        block = BlockType.DARK_SHADE.value
                    elif intensity >= 0.5:
                        block = BlockType.MEDIUM_SHADE.value
                    elif intensity >= 0.3:
                        block = BlockType.LIGHT_SHADE.value
                    else:
                        block = " "

                    # Add ANSI color code if needed
                    color_code = f"\033[38;5;{pixel.to_ansi_color()}m" if pixel.to_ansi_color() > 0 else ""
                    line += color_code + block if color_code else block

            lines.append(line)
        self.total_frames_rendered += 1
        return "\n".join(lines)

    def get_buffer_as_simple_text(self) -> str:
        """Render buffer as simple text (no ANSI codes, for compatibility)"""
        lines = []
        for row in self.buffer:
            line = ""
            for pixel in row:
                if pixel.is_empty():
                    line += " "
                else:
                    intensity = pixel.intensity
                    if intensity >= 0.9:
                        line += "█"
                    elif intensity >= 0.7:
                        line += "▓"
                    elif intensity >= 0.5:
                        line += "▒"
                    elif intensity >= 0.3:
                        line += "░"
                    else:
                        line += " "
            lines.append(line)
        self.total_frames_rendered += 1
        return "\n".join(lines)

    def get_status(self) -> Dict[str, Any]:
        """Get renderer status"""
        return {
            'status': self.status.name,
            'initialized': self._initialized,
            'buffer_size': (self.width, self.height),
            'total_pixels': self.width * self.height,
            'sprites_registered': len(self.sprites),
            'sprite_instances': len(self.sprite_instances),
            'total_sprites_rendered': self.total_sprites_rendered,
            'total_frames_rendered': self.total_frames_rendered
        }
