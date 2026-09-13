"""
Proportional Layout System - Resolution-Independent UI Positioning
Extracted and modernized from TurboShells base_panel.py for universal deployment
"""

from typing import Tuple, Optional, Union
from dataclasses import dataclass
from enum import Enum


class AnchorPoint(Enum):
    """UI element anchoring positions for proportional layout"""
    TOP_LEFT = "top_left"
    TOP_CENTER = "top_center"
    TOP_RIGHT = "top_right"
    CENTER_LEFT = "center_left"
    CENTER = "center"
    CENTER_RIGHT = "center_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_CENTER = "bottom_center"
    BOTTOM_RIGHT = "bottom_right"


@dataclass
class NormalizedRect:
    """Rectangle using normalized coordinates (0.0-1.0) for resolution independence"""
    x: float  # 0.0 to 1.0 (left to right)
    y: float  # 0.0 to 1.0 (top to bottom)
    width: float  # 0.0 to 1.0
    height: float  # 0.0 to 1.0
    
    def to_physical(self, container_size: Tuple[int, int]) -> Tuple[int, int, int, int]:
        """Convert normalized rect to physical pixel coordinates"""
        container_width, container_height = container_size
        
        x = int(self.x * container_width)
        y = int(self.y * container_height)
        width = int(self.width * container_width)
        height = int(self.height * container_height)
        
        return x, y, width, height
    
    @classmethod
    def from_physical(cls, physical_rect: Tuple[int, int, int, int], 
                     container_size: Tuple[int, int]) -> 'NormalizedRect':
        """Create normalized rect from physical coordinates"""
        px, py, pwidth, pheight = physical_rect
        container_width, container_height = container_size
        
        x = px / container_width
        y = py / container_height
        width = pwidth / container_width
        height = pheight / container_height
        
        return cls(x, y, width, height)


@dataclass
class LayoutOffset:
    """Offset values for fine-tuning proportional layouts"""
    x_offset: int = 0
    y_offset: int = 0
    width_offset: int = 0
    height_offset: int = 0


class ProportionalLayout:
    """
    Universal layout system that maintains proportional positioning
    across any resolution from 160x144 to 4K+ displays
    """
    
    def __init__(self, container_size: Tuple[int, int]):
        self.container_size = container_size
        self._aspect_ratio = container_size[0] / container_size[1]
    
    def update_container_size(self, new_size: Tuple[int, int]) -> None:
        """Update container size for dynamic resizing"""
        self.container_size = new_size
        self._aspect_ratio = new_size[0] / new_size[1]
    
    def get_relative_rect(self, 
                         anchor: AnchorPoint,
                         normalized_size: Tuple[float, float],
                         normalized_position: Optional[Tuple[float, float]] = None,
                         offsets: Optional[LayoutOffset] = None) -> NormalizedRect:
        """
        Calculate normalized rectangle using anchor-based positioning.
        
        Args:
            anchor: Anchor point for positioning
            normalized_size: (width, height) as 0.0-1.0 of container
            normalized_position: Optional (x, y) as 0.0-1.0 for custom positioning
            offsets: Pixel offsets for fine-tuning
        
        Returns:
            NormalizedRect with calculated position and size
        """
        width, height = normalized_size
        offsets = offsets or LayoutOffset()
        
        # Calculate position based on anchor
        if normalized_position:
            # Use custom position
            x, y = normalized_position
        else:
            # Calculate position based on anchor point
            x, y = self._calculate_anchor_position(anchor, width, height)
        
        # Apply pixel offsets (converted to normalized)
        if offsets.x_offset != 0 or offsets.y_offset != 0:
            x += offsets.x_offset / self.container_size[0]
            y += offsets.y_offset / self.container_size[1]
        
        # Apply size offsets
        if offsets.width_offset != 0:
            width += offsets.width_offset / self.container_size[0]
        if offsets.height_offset != 0:
            height += offsets.height_offset / self.container_size[1]
        
        # Clamp values to valid range
        x = max(0.0, min(1.0, x))
        y = max(0.0, min(1.0, y))
        width = max(0.0, min(1.0 - x, width))
        height = max(0.0, min(1.0 - y, height))
        
        return NormalizedRect(x, y, width, height)
    
    def _calculate_anchor_position(self, anchor: AnchorPoint, 
                                  width: float, height: float) -> Tuple[float, float]:
        """Calculate position based on anchor point"""
        if anchor == AnchorPoint.TOP_LEFT:
            return (0.0, 0.0)
        elif anchor == AnchorPoint.TOP_CENTER:
            return ((1.0 - width) / 2, 0.0)
        elif anchor == AnchorPoint.TOP_RIGHT:
            return (1.0 - width, 0.0)
        elif anchor == AnchorPoint.CENTER_LEFT:
            return (0.0, (1.0 - height) / 2)
        elif anchor == AnchorPoint.CENTER:
            return ((1.0 - width) / 2, (1.0 - height) / 2)
        elif anchor == AnchorPoint.CENTER_RIGHT:
            return (1.0 - width, (1.0 - height) / 2)
        elif anchor == AnchorPoint.BOTTOM_LEFT:
            return (0.0, 1.0 - height)
        elif anchor == AnchorPoint.BOTTOM_CENTER:
            return ((1.0 - width) / 2, 1.0 - height)
        elif anchor == AnchorPoint.BOTTOM_RIGHT:
            return (1.0 - width, 1.0 - height)
        else:
            return (0.0, 0.0)  # Default to top-left
    
    def get_physical_rect(self, normalized_rect: NormalizedRect) -> Tuple[int, int, int, int]:
        """Convert normalized rect to physical pixel coordinates"""
        return normalized_rect.to_physical(self.container_size)
    
    def create_button_layout(self, button_count: int, 
                           orientation: str = "horizontal",
                           spacing: float = 0.02) -> list[NormalizedRect]:
        """
        Create layout for multiple buttons with automatic spacing.
        
        Args:
            button_count: Number of buttons to layout
            orientation: "horizontal" or "vertical"
            spacing: Normalized spacing between buttons (0.0-1.0)
        
        Returns:
            List of NormalizedRect for each button
        """
        buttons = []
        
        if orientation == "horizontal":
            button_width = (1.0 - (spacing * (button_count - 1))) / button_count
            button_height = 0.1  # 10% of container height
            
            for i in range(button_count):
                x = i * (button_width + spacing)
                y = 0.9  # Bottom 10% of container
                buttons.append(NormalizedRect(x, y, button_width, button_height))
        
        elif orientation == "vertical":
            button_width = 0.8  # 80% of container width
            button_height = (1.0 - (spacing * (button_count - 1))) / button_count
            
            for i in range(button_count):
                x = 0.1  # Left 10% of container
                y = i * (button_height + spacing)
                buttons.append(NormalizedRect(x, y, button_width, button_height))
        
        return buttons
    
    def create_grid_layout(self, cols: int, rows: int,
                         cell_spacing: float = 0.02) -> list[NormalizedRect]:
        """
        Create grid layout for uniform cell positioning.
        
        Args:
            cols: Number of columns
            rows: Number of rows
            cell_spacing: Normalized spacing between cells
        
        Returns:
            List of NormalizedRect for each grid cell
        """
        cells = []
        
        cell_width = (1.0 - (cell_spacing * (cols - 1))) / cols
        cell_height = (1.0 - (cell_spacing * (rows - 1))) / rows
        
        for row in range(rows):
            for col in range(cols):
                x = col * (cell_width + cell_spacing)
                y = row * (cell_height + cell_spacing)
                cells.append(NormalizedRect(x, y, cell_width, cell_height))
        
        return cells
    
    def maintain_aspect_ratio(self, normalized_rect: NormalizedRect,
                           target_aspect: float) -> NormalizedRect:
        """
        Adjust rectangle to maintain specific aspect ratio.
        
        Args:
            normalized_rect: Original normalized rectangle
            target_aspect: Desired aspect ratio (width/height)
        
        Returns:
            Adjusted NormalizedRect with correct aspect ratio
        """
        current_aspect = normalized_rect.width / normalized_rect.height
        
        if current_aspect > target_aspect:
            # Too wide, reduce width
            new_width = normalized_rect.height * target_aspect
            x_offset = (normalized_rect.width - new_width) / 2
            return NormalizedRect(
                normalized_rect.x + x_offset,
                normalized_rect.y,
                new_width,
                normalized_rect.height
            )
        else:
            # Too tall, reduce height
            new_height = normalized_rect.width / target_aspect
            y_offset = (normalized_rect.height - new_height) / 2
            return NormalizedRect(
                normalized_rect.x,
                normalized_rect.y + y_offset,
                normalized_rect.width,
                new_height
            )


class LayoutManager:
    """
    High-level layout manager that handles multiple proportional layouts
    and provides unified interface for dynamic resizing
    """
    
    def __init__(self, container_size: Tuple[int, int]):
        self.container_size = container_size
        self.layouts = {}
        self.global_layout = ProportionalLayout(container_size)
    
    def create_layout(self, name: str, sub_container_rect: NormalizedRect) -> ProportionalLayout:
        """Create a sub-layout within a specific container region"""
        physical_rect = sub_container_rect.to_physical(self.container_size)
        sub_layout = ProportionalLayout((physical_rect[2], physical_rect[3]))
        self.layouts[name] = sub_layout
        return sub_layout
    
    def resize_container(self, new_size: Tuple[int, int]) -> None:
        """Resize main container and all sub-layouts"""
        self.global_layout.update_container_size(new_size)
        self.container_size = new_size
        
        # Recalculate sub-layout sizes
        for layout in self.layouts.values():
            # Sub-layouts will need to be recreated with new container sizes
            # This is handled by the individual components that own them
            pass
    
    def get_layout(self, name: str = "global") -> ProportionalLayout:
        """Get layout by name"""
        if name == "global":
            return self.global_layout
        return self.layouts.get(name, self.global_layout)
