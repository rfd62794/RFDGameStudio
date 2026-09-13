"""
Geometric Profile Pass - ASCII Line-Art Rendering

Zone D: Shape profile display using ASCII line-art characters.
Shows the "Vague Shape" (Triangle/Square) as structural blueprint of the Voyager's soul.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import math

from loguru import logger

from . import BaseRenderPass, RenderContext, RenderResult, RenderPassType
from ..sprite_factory import SpriteFactory, CompositeSpriteConfig, CharacterClass, SpriteLayer, ShadingPattern


class ShapeType(Enum):
    """Types of geometric shapes for character profiles."""
    TRIANGLE = "triangle"
    SQUARE = "square"
    CIRCLE = "circle"
    DIAMOND = "diamond"
    STAR = "star"
    HEXAGON = "hexagon"


@dataclass
class ProfileConfig:
    """Configuration for geometric profile display."""
    width: int = 15
    height: int = 10
    shape_type: ShapeType = ShapeType.TRIANGLE
    show_outline: bool = True
    show_fill: bool = False
    animate_rotation: bool = False
    render_mode: str = "geometric"  # "geometric" or "silhouette"
    character_class: CharacterClass = CharacterClass.VOYAGER
    show_composite_sprite: bool = False
    line_thickness: int = 1
    # Composite sprite parameters
    head_type: str = "default"
    body_type: str = "default"
    feet_type: str = "default"
    held_item: str = "none"
    stance: str = "neutral"
    shading_enabled: bool = True
    breathing_enabled: bool = True


class GeometricProfilePass(BaseRenderPass):
    """
    ASCII line-art rendering for character profiles.
    
    Displays geometric shapes representing the "Vague Shape"
    of characters using ASCII line-art characters.
    """
    
    def __init__(self, config: Optional[ProfileConfig] = None):
        """
        Initialize the geometric profile pass.
        
        Args:
            config: Optional profile configuration
        """
        super().__init__(RenderPassType.GEOMETRIC_PROFILE)
        self.config = config or ProfileConfig()
        
        # Line-art characters
        self.line_chars = {
            "horizontal": "─",
            "vertical": "│",
            "diagonal_up": "/",
            "diagonal_down": "\\",
            "corner_ul": "┌",
            "corner_ur": "┐",
            "corner_ll": "└",
            "corner_lr": "┘",
            "cross": "┼",
            "tee_up": "┴",
            "tee_down": "┬",
            "tee_left": "├",
            "tee_right": "┤"
        }
        
        # Initialize sprite factory for composite rendering
        self.sprite_factory = SpriteFactory()
        
        # Rotation animation state
        self.rotation_angle = 0.0
        self.last_rotation_time = 0.0
        
        # Animation frame state
        self.animation_frame = 0
        self.last_animation_time = 0.0
        
        logger.info(f"GeometricProfilePass initialized: {self.config.shape_type.value}")
    
    def render(self, context: RenderContext) -> RenderResult:
        """
        Render geometric profile.
        
        Args:
            context: Shared rendering context
            
        Returns:
            RenderResult with profile content
        """
        # Update rotation animation
        if self.config.animate_rotation:
            self._update_rotation(context.current_time)
        
        if self.config.render_mode == "silhouette" and self.config.show_composite_sprite:
            # Render composite sprite
            content = self._render_composite_sprite(context)
        else:
            # Render geometric shape
            buffer = self._create_shape_buffer()
            content = self._buffer_to_string(buffer)
        
        return RenderResult(
            content=content,
            width=self.config.width,
            height=self.config.height,
            metadata={
                "shape_type": self.config.shape_type.value,
                "render_mode": self.config.render_mode,
                "rotation_angle": self.rotation_angle,
                "character_class": self.config.character_class.value
            }
        )
    
    def _render_composite_sprite(self, context: RenderContext) -> str:
        """
        Render a composite sprite using the SpriteFactory.
        
        Args:
            context: Rendering context
            
        Returns:
            Rendered composite sprite as string
        """
        # Create sprite configuration
        sprite_config = CompositeSpriteConfig(
            character_class=self.config.character_class,
            head_type="default",
            body_type="default",
            feet_type="default",
            held_item="none",
            stance="neutral",
            shading_enabled=True,
            breathing_enabled=True
        )
        
        # Create composite sprite
        composite_sprite = self.sprite_factory.create_composite_sprite(sprite_config)
        
        # Create breathing animation frames
        animation_frames = self.sprite_factory.create_breathing_animation_frames(sprite_config, 2)
        
        # Update animation state
        self._update_animation(context.current_time)
        
        # Get current frame
        current_frame = animation_frames[self.animation_frame % len(animation_frames)]
        
        # Convert to string representation
        return self._composite_sprite_to_string(current_frame)
    
    def _composite_sprite_to_string(self, sprite: List[List[Optional[Pixel]]]) -> str:
        """
        Convert composite sprite to string representation.
        
        Args:
            sprite: Composite sprite pixel array
            
        Returns:
            String representation
        """
        lines = []
        
        for row in sprite:
            line_chars = []
            for pixel in row:
                if pixel is None:
                    line_chars.append(" ")
                else:
                    # Convert pixel to character based on intensity
                    if pixel.intensity == 0.0:
                        line_chars.append(" ")
                    elif pixel.intensity < 0.3:
                        line_chars.append("░")
                    elif pixel.intensity < 0.6:
                        line_chars.append("▒")
                    elif pixel.intensity < 0.9:
                        line_chars.append("▓")
                    else:
                        line_chars.append("█")
            
            lines.append(''.join(line_chars))
        
        return '\n'.join(lines)
    
    def _update_animation(self, current_time: float) -> None:
        """Update animation state for breathing effect."""
        # Update breathing animation every 1.5 seconds
        if current_time - self.last_animation_time > 1.5:
            self.animation_frame += 1
            self.last_animation_time = current_time
    
    def get_optimal_size(self, context: RenderContext) -> Tuple[int, int]:
        """Get optimal size for geometric profile."""
        return (self.config.width, self.config.height)
    
    def _create_shape_buffer(self) -> List[List[str]]:
        """
        Create shape buffer based on configuration.
        
        Returns:
            2D array of characters
        """
        buffer = [[" " for _ in range(self.config.width)] for _ in range(self.config.height)]
        
        if self.config.shape_type == ShapeType.TRIANGLE:
            self._draw_triangle(buffer)
        elif self.config.shape_type == ShapeType.SQUARE:
            self._draw_square(buffer)
        elif self.config.shape_type == ShapeType.CIRCLE:
            self._draw_circle(buffer)
        elif self.config.shape_type == ShapeType.DIAMOND:
            self._draw_diamond(buffer)
        elif self.config.shape_type == ShapeType.STAR:
            self._draw_star(buffer)
        elif self.config.shape_type == ShapeType.HEXAGON:
            self._draw_hexagon(buffer)
        
        return buffer
    
    def _draw_triangle(self, buffer: List[List[str]]) -> None:
        """Draw a triangle shape."""
        width, height = self.config.width, self.config.height
        center_x, center_y = width // 2, height // 2
        
        # Calculate triangle vertices
        size = min(width, height) // 3
        top = (center_x, center_y - size)
        left = (center_x - size, center_y + size)
        right = (center_x + size, center_y + size)
        
        # Draw outline
        if self.config.show_outline:
            self._draw_line(buffer, top, left)
            self._draw_line(buffer, left, right)
            self._draw_line(buffer, right, top)
        
        # Fill if requested
        if self.config.show_fill:
            self._fill_triangle(buffer, top, left, right)
    
    def _draw_square(self, buffer: List[List[str]]) -> None:
        """Draw a square shape."""
        width, height = self.config.width, self.config.height
        center_x, center_y = width // 2, height // 2
        
        # Calculate square bounds
        size = min(width, height) // 3
        left = center_x - size
        right = center_x + size
        top = center_y - size
        bottom = center_y + size
        
        # Draw outline
        if self.config.show_outline:
            # Top and bottom
            for x in range(left, right + 1):
                if 0 <= x < width and 0 <= top < height:
                    buffer[top][x] = self.line_chars["horizontal"]
                if 0 <= x < width and 0 <= bottom < height:
                    buffer[bottom][x] = self.line_chars["horizontal"]
            
            # Left and right
            for y in range(top, bottom + 1):
                if 0 <= left < width and 0 <= y < height:
                    buffer[y][left] = self.line_chars["vertical"]
                if 0 <= right < width and 0 <= y < height:
                    buffer[y][right] = self.line_chars["vertical"]
            
            # Corners
            if 0 <= top < height and 0 <= left < width:
                buffer[top][left] = self.line_chars["corner_ul"]
            if 0 <= top < height and 0 <= right < width:
                buffer[top][right] = self.line_chars["corner_ur"]
            if 0 <= bottom < height and 0 <= left < width:
                buffer[bottom][left] = self.line_chars["corner_ll"]
            if 0 <= bottom < height and 0 <= right < width:
                buffer[bottom][right] = self.line_chars["corner_lr"]
        
        # Fill if requested
        if self.config.show_fill:
            for y in range(top + 1, bottom):
                for x in range(left + 1, right):
                    if 0 <= x < width and 0 <= y < height:
                        buffer[y][x] = "█"
    
    def _draw_circle(self, buffer: List[List[str]]) -> None:
        """Draw a circle shape."""
        width, height = self.config.width, self.config.height
        center_x, center_y = width // 2, height // 2
        radius = min(width, height) // 3
        
        # Draw circle using Bresenham's algorithm
        for angle in range(360):
            rad = math.radians(angle + self.rotation_angle)
            x = int(center_x + radius * math.cos(rad))
            y = int(center_y + radius * math.sin(rad))
            
            if 0 <= x < width and 0 <= y < height:
                buffer[y][x] = "●"
    
    def _draw_diamond(self, buffer: List[List[str]]) -> None:
        """Draw a diamond shape."""
        width, height = self.config.width, self.config.height
        center_x, center_y = width // 2, height // 2
        size = min(width, height) // 3
        
        # Draw diamond outline
        for i in range(-size, size + 1):
            # Top to center
            x = center_x + i
            y = center_y - size + abs(i)
            if 0 <= x < width and 0 <= y < height:
                buffer[y][x] = self.line_chars["diagonal_up"] if i < 0 else self.line_chars["diagonal_down"]
            
            # Center to bottom
            y = center_y + size - abs(i)
            if 0 <= x < width and 0 <= y < height:
                buffer[y][x] = self.line_chars["diagonal_down"] if i < 0 else self.line_chars["diagonal_up"]
    
    def _draw_star(self, buffer: List[List[str]]) -> None:
        """Draw a star shape."""
        width, height = self.config.width, self.config.height
        center_x, center_y = width // 2, height // 2
        size = min(width, height) // 3
        
        # Draw 5-pointed star
        points = []
        for i in range(5):
            angle = math.radians(i * 72 - 90 + self.rotation_angle)
            x = center_x + int(size * math.cos(angle))
            y = center_y + int(size * math.sin(angle))
            points.append((x, y))
        
        # Connect points
        for i in range(5):
            self._draw_line(buffer, points[i], points[(i + 2) % 5])
    
    def _draw_hexagon(self, buffer: List[List[str]]) -> None:
        """Draw a hexagon shape."""
        width, height = self.config.width, self.config.height
        center_x, center_y = width // 2, height // 2
        size = min(width, height) // 3
        
        # Draw hexagon vertices
        points = []
        for i in range(6):
            angle = math.radians(i * 60 + self.rotation_angle)
            x = center_x + int(size * math.cos(angle))
            y = center_y + int(size * math.sin(angle))
            points.append((x, y))
        
        # Connect vertices
        for i in range(6):
            self._draw_line(buffer, points[i], points[(i + 1) % 6])
    
    def _draw_line(self, buffer: List[List[str]], start: Tuple[int, int], end: Tuple[int, int]) -> None:
        """Draw a line between two points using Bresenham's algorithm."""
        x0, y0 = start
        x1, y1 = end
        
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        
        x, y = x0, y0
        
        while True:
            if 0 <= x < self.config.width and 0 <= y < self.config.height:
                buffer[y][x] = self.line_chars["diagonal_up"] if sx * sy > 0 else self.line_chars["diagonal_down"]
            
            if x == x1 and y == y1:
                break
            
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy
    
    def _fill_triangle(self, buffer: List[List[str]], top: Tuple[int, int], 
                       left: Tuple[int, int], right: Tuple[int, int]) -> None:
        """Fill a triangle shape."""
        # Simple fill using scanline algorithm
        for y in range(left[1], top[1] + 1):
            if 0 <= y < self.config.height:
                # Calculate left and right boundaries for this scanline
                left_x = left[0] + (top[0] - left[0]) * (y - left[1]) // (top[1] - left[1])
                right_x = right[0] + (top[0] - right[0]) * (y - right[1]) // (top[1] - right[1])
                
                for x in range(left_x, right_x + 1):
                    if 0 <= x < self.config.width:
                        buffer[y][x] = "█"
    
    def _update_rotation(self, current_time: float) -> None:
        """Update rotation animation."""
        # Rotate 45 degrees per second
        if current_time - self.last_rotation_time > 0.1:
            self.rotation_angle += 45
            self.rotation_angle %= 360
            self.last_rotation_time = current_time
    
    def _buffer_to_string(self, buffer: List[List[str]]) -> str:
        """Convert buffer to string."""
        return '\n'.join(''.join(row) for row in buffer)
    
    def set_shape_type(self, shape_type: ShapeType) -> None:
        """Set the shape type."""
        self.config.shape_type = shape_type
        logger.info(f"GeometricProfilePass shape changed to {shape_type.value}")
    
    def set_config(self, config: ProfileConfig) -> None:
        """Update profile configuration."""
        self.config = config
        logger.info(f"GeometricProfilePass config updated")


# Export for use by other modules
__all__ = ["GeometricProfilePass", "ProfileConfig", "ShapeType"]
