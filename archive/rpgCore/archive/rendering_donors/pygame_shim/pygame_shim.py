"""
PyGame Compatibility Shim - Legacy UI Logic Bridge
Allows pygame.Rect and pygame.Color logic to operate within DGT's Sovereign Layout System
"""

from typing import Tuple, Union, Optional, Any, Dict
from dataclasses import dataclass
import json
from pathlib import Path

# Import DGT core systems
from ..engines.viewport.logical_viewport import LogicalViewport
from ..ui.proportional_layout import ProportionalLayout


@dataclass
class LegacyUITheme:
    """Legacy UI theme constants extracted from TurboShells audit"""
    # Colors (HEX codes from legacy)
    BREEDING_PANEL_BG = (40, 40, 60)
    BREEDING_PANEL_BORDER = (80, 80, 120)
    SELECTION_GLOW = (255, 255, 0)  # Yellow
    BUTTON_NORMAL = (100, 100, 150)
    BUTTON_HOVER = (150, 150, 200)
    BUTTON_PRESSED = (80, 80, 120)
    
    # Roster panel colors
    ROSTER_BG = (30, 30, 50)
    ROSTER_BORDER = (60, 60, 90)
    TURTLE_CARD_BG = (50, 50, 70)
    TURTLE_CARD_BORDER = (100, 100, 130)
    RETIRED_OVERLAY = (128, 128, 128)
    
    # Shop panel colors
    SHOP_BG = (35, 45, 35)
    SHOP_BORDER = (70, 90, 70)
    PRICE_TAG_BG = (200, 200, 200)
    PRICE_TAG_TEXT = (0, 0, 0)
    CARD_HEADER_GRADIENT_TOP = (80, 80, 120)
    CARD_HEADER_GRADIENT_BOTTOM = (40, 40, 60)
    
    # Additional colors for testing
    BUTTON_TEXT_COLOR = (255, 255, 255)
    
    # Font sizes (legacy pixel sizes)
    FONT_SMALL = 8
    FONT_MEDIUM = 12
    FONT_LARGE = 16
    FONT_TITLE = 20
    
    # Spacing constants (legacy pixel offsets)
    PARENT_SLOT_OFFSET_X = 50
    PARENT_SLOT_OFFSET_Y = 100
    PARENT_SLOT_WIDTH = 200
    PARENT_SLOT_HEIGHT = 150
    PARENT_SLOT_SPACING = 20
    
    GRID_CELL_PADDING = 10
    GRID_CELL_SPACING = 5
    SCROLLBAR_WIDTH = 20
    SCROLLBAR_MARGIN = 5
    
    # Shop positioning
    CARD_HEADER_HEIGHT = 30
    PRICE_TAG_HEIGHT = 20
    PRICE_TAG_OFFSET_X = 5
    PRICE_TAG_OFFSET_Y = 5


class SovereignRect:
    """
    pygame.Rect compatibility class that automatically applies Universal Scaling
    Critical: Maps legacy pixel coordinates to SLS 1000x1000 logical space
    """
    
    def __init__(self, x: Union[int, float], y: Union[int, float], 
                 width: Union[int, float], height: Union[int, float],
                 viewport: Optional[LogicalViewport] = None):
        """
        Initialize SovereignRect with legacy pixel coordinates.
        
        Args:
            x, y, width, height: Legacy pixel coordinates
            viewport: LogicalViewport for scaling (uses default if None)
        """
        self.viewport = viewport or self._get_default_viewport()
        
        # Store original legacy coordinates
        self.legacy_x = float(x)
        self.legacy_y = float(y)
        self.legacy_width = float(width)
        self.legacy_height = float(height)
        
        # Apply Universal Scaling factors (0.2x, 0.24y from 800x600 → 160x144)
        # But we map to 1000x1000 logical space for SLS compatibility
        self.x, self.y = self._legacy_to_logical(x, y)
        self.width, self.height = self._legacy_to_logical(width, height)
    
    def _get_default_viewport(self) -> LogicalViewport:
        """Get default viewport for scaling"""
        # Default to 800x600 legacy resolution mapped to 1000x1000 logical
        viewport = LogicalViewport()
        viewport.set_physical_resolution((800, 600))
        return viewport
    
    def _legacy_to_logical(self, legacy_x: Union[int, float], 
                          legacy_y: Union[int, float]) -> Tuple[float, float]:
        """
        Convert legacy pixel coordinates to logical coordinates.
        
        Legacy assumption: 800x600 baseline resolution
        Target: 1000x1000 logical coordinate space
        """
        # Scale factors: 800px → 1000u, 600px → 1000u
        logical_x = (float(legacy_x) / 800.0) * 1000.0
        logical_y = (float(legacy_y) / 600.0) * 1000.0
        return logical_x, logical_y
    
    def _logical_to_legacy(self, logical_x: float, logical_y: float) -> Tuple[float, float]:
        """Convert logical coordinates back to legacy pixel coordinates"""
        legacy_x = (logical_x / 1000.0) * 800.0
        legacy_y = (logical_y / 1000.0) * 600.0
        return legacy_x, legacy_y
    
    # pygame.Rect compatibility methods
    @property
    def left(self) -> float:
        """Left edge (pygame.Rect compatibility)"""
        return self.x
    
    @property
    def right(self) -> float:
        """Right edge (pygame.Rect compatibility)"""
        return self.x + self.width
    
    @property
    def top(self) -> float:
        """Top edge (pygame.Rect compatibility)"""
        return self.y
    
    @property
    def bottom(self) -> float:
        """Bottom edge (pygame.Rect compatibility)"""
        return self.y + self.height
    
    @property
    def centerx(self) -> float:
        """Center x coordinate (pygame.Rect compatibility)"""
        return self.x + self.width / 2
    
    @property
    def centery(self) -> float:
        """Center y coordinate (pygame.Rect compatibility)"""
        return self.y + self.height / 2
    
    @property
    def center(self) -> Tuple[float, float]:
        """Center point (pygame.Rect compatibility)"""
        return (self.centerx, self.centery)
    
    @property
    def size(self) -> Tuple[float, float]:
        """Size tuple (pygame.Rect compatibility)"""
        return (self.width, self.height)
    
    @size.setter
    def size(self, new_size: Tuple[float, float]):
        """Set size (pygame.Rect compatibility)"""
        self.width, self.height = new_size
    
    def copy(self) -> 'SovereignRect':
        """Create a copy (pygame.Rect compatibility)"""
        return SovereignRect(
            self.legacy_x, self.legacy_y,
            self.legacy_width, self.legacy_height,
            self.viewport
        )
    
    def move(self, dx: float, dy: float) -> 'SovereignRect':
        """Move rectangle and return new one (pygame.Rect compatibility)"""
        # For pygame compatibility, move should operate on logical coordinates
        return SovereignRect(
            self.legacy_x + dx, self.legacy_y + dy,
            self.legacy_width, self.legacy_height,
            self.viewport
        )
    
    def inflate(self, dx: float, dy: float) -> 'SovereignRect':
        """Grow/shrink rectangle (pygame.Rect compatibility)"""
        return SovereignRect(
            self.legacy_x - dx/2, self.legacy_y - dy/2,
            self.legacy_width + dx, self.legacy_height + dy,
            self.viewport
        )
    
    def collidepoint(self, point: Tuple[float, float]) -> bool:
        """Check if point is inside rectangle (pygame.Rect compatibility)"""
        x, y = point
        return (self.left <= x <= self.right and 
                self.top <= y <= self.bottom)
    
    def colliderect(self, other: 'SovereignRect') -> bool:
        """Check collision with another rectangle (pygame.Rect compatibility)"""
        return (self.left < other.right and self.right > other.left and
                self.top < other.bottom and self.bottom > other.top)
    
    def get_physical_rect(self, target_resolution: Tuple[int, int]) -> Tuple[int, int, int, int]:
        """
        Get physical rectangle for target resolution.
        
        Args:
            target_resolution: (width, height) of target display
        
        Returns:
            Physical rectangle (x, y, width, height)
        """
        # Update viewport to target resolution
        temp_viewport = LogicalViewport()
        temp_viewport.set_physical_resolution(target_resolution)
        
        # Convert logical coordinates to physical
        physical_x = int((self.x / 1000.0) * target_resolution[0])
        physical_y = int((self.y / 1000.0) * target_resolution[1])
        physical_w = int((self.width / 1000.0) * target_resolution[0])
        physical_h = int((self.height / 1000.0) * target_resolution[1])
        
        return (physical_x, physical_y, physical_w, physical_h)
    
    def __str__(self) -> str:
        """String representation (pygame.Rect compatibility)"""
        return f"<SovereignRect({self.left:.1f}, {self.top:.1f}, {self.width:.1f}, {self.height:.1f})>"
    
    def __repr__(self) -> str:
        """Detailed representation"""
        return (f"SovereignRect(legacy=({self.legacy_x}, {self.legacy_y}, "
                f"{self.legacy_width}, {self.legacy_height}), "
                f"logical=({self.x:.1f}, {self.y:.1f}, {self.width:.1f}, {self.height:.1f}))")


class SovereignColor:
    """
    pygame.Color compatibility class that handles color processing
    """
    
    def __init__(self, r: int, g: int, b: int, a: int = 255):
        """Initialize color with RGBA values"""
        self.r = max(0, min(255, r))
        self.g = max(0, min(255, g))
        self.b = max(0, min(255, b))
        self.a = max(0, min(255, a))
    
    @property
    def r(self) -> int:
        return self._r
    
    @r.setter
    def r(self, value: int):
        self._r = max(0, min(255, value))
    
    @property
    def g(self) -> int:
        return self._g
    
    @g.setter
    def g(self, value: int):
        self._g = max(0, min(255, value))
    
    @property
    def b(self) -> int:
        return self._b
    
    @b.setter
    def b(self, value: int):
        self._b = max(0, min(255, value))
    
    @property
    def a(self) -> int:
        return self._a
    
    @a.setter
    def a(self, value: int):
        self._a = max(0, min(255, value))
    
    def __tuple__(self) -> Tuple[int, int, int, int]:
        """Return as tuple (pygame.Color compatibility)"""
        return (self.r, self.g, self.b, self.a)
    
    def __iter__(self):
        """Make color iterable"""
        return iter((self.r, self.g, self.b, self.a))
    
    def __str__(self) -> str:
        """String representation"""
        return f"(r={self.r}, g={self.g}, b={self.b}, a={self.a})"
    
    def __repr__(self) -> str:
        """Detailed representation"""
        return f"SovereignColor({self.r}, {self.g}, {self.b}, {self.a})"


class DGTDrawProxy:
    """
    Drawing proxy that maps pygame.draw calls to RenderPacket stream
    Critical: Allows legacy drawing code to work with modern DGT rendering
    """
    
    def __init__(self, viewport: LogicalViewport):
        self.viewport = viewport
        self.render_packets = []
        self.theme = LegacyUITheme()
    
    def rect(self, surface: Any, color: Union[SovereignColor, Tuple[int, int, int]], 
             rect: SovereignRect, width: int = 0) -> None:
        """
        Draw rectangle (pygame.draw.rect compatibility).
        
        Args:
            surface: Surface to draw on (ignored, uses render packets)
            color: Color to draw with
            rect: Rectangle to draw
            width: Border width (0 for filled)
        """
        # Convert color to tuple if needed
        if isinstance(color, SovereignColor):
            color_tuple = tuple(color)
        else:
            color_tuple = color
        
        # Get physical rectangle for current viewport resolution
        physical_rect = rect.get_physical_rect(self.viewport.physical_size)
        
        # Create render packet
        packet = {
            "type": "rectangle",
            "rect": physical_rect,
            "color": color_tuple,
            "width": width,
            "filled": (width == 0)
        }
        
        self.render_packets.append(packet)
    
    def circle(self, surface: Any, color: Union[SovereignColor, Tuple[int, int, int]],
               center: Tuple[float, float], radius: float, width: int = 0) -> None:
        """
        Draw circle (pygame.draw.circle compatibility).
        """
        if isinstance(color, SovereignColor):
            color_tuple = tuple(color)
        else:
            color_tuple = color
        
        # Convert center coordinates
        physical_center_x = int((center[0] / 1000.0) * self.viewport.physical_size[0])
        physical_center_y = int((center[1] / 1000.0) * self.viewport.physical_size[1])
        physical_radius = int((radius / 1000.0) * min(self.viewport.physical_size))
        
        packet = {
            "type": "circle",
            "center": (physical_center_x, physical_center_y),
            "radius": physical_radius,
            "color": color_tuple,
            "width": width,
            "filled": (width == 0)
        }
        
        self.render_packets.append(packet)
    
    def text(self, surface: Any, text: str, color: Union[SovereignColor, Tuple[int, int, int]],
              pos: Tuple[float, float], font_size: int = 12) -> None:
        """
        Draw text (pygame.font rendering compatibility).
        """
        if isinstance(color, SovereignColor):
            color_tuple = tuple(color)
        else:
            color_tuple = color
        
        # Convert position
        physical_x = int((pos[0] / 1000.0) * self.viewport.physical_size[0])
        physical_y = int((pos[1] / 1000.0) * self.viewport.physical_size[1])
        
        # Adjust font size for resolution
        physical_font_size = max(8, int(font_size * (self.viewport.physical_size[1] / 600.0)))
        
        packet = {
            "type": "text",
            "text": text,
            "position": (physical_x, physical_y),
            "color": color_tuple,
            "font_size": physical_font_size
        }
        
        self.render_packets.append(packet)
    
    def get_render_packets(self) -> list:
        """Get all render packets for the frame"""
        packets = self.render_packets.copy()
        self.render_packets.clear()
        return packets
    
    def clear(self) -> None:
        """Clear all render packets"""
        self.render_packets.clear()


class LegacyUIContext:
    """
    Complete context for running legacy UI logic within DGT system
    Provides all the pygame-like objects and methods needed for compatibility
    """
    
    def __init__(self, viewport: LogicalViewport):
        self.viewport = viewport
        self.draw_proxy = DGTDrawProxy(viewport)
        self.theme = LegacyUITheme()
        
        # Create pygame-like constants
        self.Rect = lambda x, y, w, h: SovereignRect(x, y, w, h, viewport)
        self.Color = SovereignColor
        
        # Drawing functions
        self.draw = self.draw_proxy
        
        # Theme access
        self.theme_colors = {
            'BREEDING_PANEL_BG': self.theme.BREEDING_PANEL_BG,
            'SELECTION_GLOW': self.theme.SELECTION_GLOW,
            'BUTTON_NORMAL': self.theme.BUTTON_NORMAL,
            'BUTTON_HOVER': self.theme.BUTTON_HOVER,
            'ROSTER_BG': self.theme.ROSTER_BG,
            'TURTLE_CARD_BG': self.theme.TURTLE_CARD_BG,
            'SHOP_BG': self.theme.SHOP_BG,
            'PRICE_TAG_BG': self.theme.PRICE_TAG_BG,
        }
        
        # Layout constants
        self.layout = {
            'PARENT_SLOT_OFFSET_X': self.theme.PARENT_SLOT_OFFSET_X,
            'PARENT_SLOT_OFFSET_Y': self.theme.PARENT_SLOT_OFFSET_Y,
            'PARENT_SLOT_WIDTH': self.theme.PARENT_SLOT_WIDTH,
            'PARENT_SLOT_HEIGHT': self.theme.PARENT_SLOT_HEIGHT,
            'PARENT_SLOT_SPACING': self.theme.PARENT_SLOT_SPACING,
            'GRID_CELL_PADDING': self.theme.GRID_CELL_PADDING,
            'GRID_CELL_SPACING': self.theme.GRID_CELL_SPACING,
            'SCROLLBAR_WIDTH': self.theme.SCROLLBAR_WIDTH,
            'CARD_HEADER_HEIGHT': self.theme.CARD_HEADER_HEIGHT,
            'PRICE_TAG_HEIGHT': self.theme.PRICE_TAG_HEIGHT,
        }
    
    def get_frame_data(self) -> Dict[str, Any]:
        """Get complete frame data for rendering"""
        return {
            "render_packets": self.draw_proxy.get_render_packets(),
            "viewport_size": self.viewport.physical_size,
            "logical_size": (1000, 1000)
        }
    
    def export_theme_to_json(self, filepath: str) -> None:
        """Export theme constants to JSON file"""
        theme_data = {
            "colors": {
                name: getattr(self.theme, name) for name in dir(self.theme)
                if name.isupper() and not callable(getattr(self.theme, name))
            },
            "fonts": {
                "FONT_SMALL": self.theme.FONT_SMALL,
                "FONT_MEDIUM": self.theme.FONT_MEDIUM,
                "FONT_LARGE": self.theme.FONT_LARGE,
                "FONT_TITLE": self.theme.FONT_TITLE,
            },
            "layout": {
                "PARENT_SLOT_OFFSET_X": self.theme.PARENT_SLOT_OFFSET_X,
                "PARENT_SLOT_OFFSET_Y": self.theme.PARENT_SLOT_OFFSET_Y,
                "PARENT_SLOT_OFFSET_WIDTH": self.theme.PARENT_SLOT_WIDTH,
                "PARENT_SLOT_OFFSET_HEIGHT": self.theme.PARENT_SLOT_OFFSET_Y,
                "PARENT_SLOT_SPACING": self.theme.PARENT_SLOT_SPACING,
                "GRID_CELL_PADDING": self.theme.GRID_CELL_PADDING,
                "GRID_CELL_SPACING": self.theme.GRID_CELL_SPACING,
                "SCROLLBAR_WIDTH": self.theme.SCROLLBAR_WIDTH,
                "CARD_HEADER_HEIGHT": self.theme.CARD_HEADER_HEIGHT,
                "PRICE_TAG_HEIGHT": self.theme.PRICE_TAG_HEIGHT,
            }
        }
        
        with open(filepath, 'w') as f:
            json.dump(theme_data, f, indent=2)


def create_legacy_context(resolution: Tuple[int, int] = (800, 600)) -> LegacyUIContext:
    """
    Factory function to create legacy UI context.
    
    Args:
        resolution: Target resolution for rendering
    
    Returns:
        LegacyUIContext instance
    """
    viewport = LogicalViewport()
    viewport.set_physical_resolution(resolution)
    return LegacyUIContext(viewport)
