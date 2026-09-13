"""
Logical Viewport System - Universal Coordinate Mapping
Implements the 1000x1000 Sovereign Units system for resolution-independent simulation
"""

from typing import Tuple, Optional
from dataclasses import dataclass
import math


@dataclass
class ScalingMatrix:
    """Fixed-point scaling matrix for precise coordinate transformation"""
    scale_x: float
    scale_y: float
    offset_x: int = 0
    offset_y: int = 0
    
    def transform(self, logical_coords: Tuple[float, float]) -> Tuple[int, int]:
        """Transform logical coordinates to physical pixels"""
        logical_x, logical_y = logical_coords
        physical_x = int(logical_x * self.scale_x + self.offset_x)
        physical_y = int(logical_y * self.scale_y + self.offset_y)
        return physical_x, physical_y
    
    def transform_reverse(self, physical_coords: Tuple[int, int]) -> Tuple[float, float]:
        """Transform physical pixels back to logical coordinates"""
        physical_x, physical_y = physical_coords
        logical_x = (physical_x - self.offset_x) / self.scale_x
        logical_y = (physical_y - self.offset_y) / self.scale_y
        return logical_x, logical_y


class LogicalViewport:
    """
    Universal viewport that maps logical coordinates to any physical resolution.
    
    Core Principle: 1000x1000 Sovereign Units for all simulation logic
    Physical rendering adapts to window size automatically
    """
    
    def __init__(self, logical_size: Tuple[int, int] = (1000, 1000)):
        self.logical_size = logical_size  # Sovereign Units (1000x1000)
        self.physical_size = (160, 144)   # Default retro resolution
        self.scaling_matrix = ScalingMatrix(1.0, 1.0)
        self._dirty = True
        
    def set_physical_resolution(self, physical_size: Tuple[int, int]) -> None:
        """Update physical resolution and recalculate scaling matrix"""
        if self.physical_size != physical_size:
            self.physical_size = physical_size
            self._dirty = True
            self._recalculate_matrix()
    
    def _recalculate_matrix(self) -> None:
        """Recalculate scaling matrix based on current resolutions"""
        logical_width, logical_height = self.logical_size
        physical_width, physical_height = self.physical_size
        
        # Calculate scaling factors
        scale_x = physical_width / logical_width
        scale_y = physical_height / logical_height
        
        # Update scaling matrix
        self.scaling_matrix = ScalingMatrix(scale_x, scale_y)
        self._dirty = False
    
    def to_physical(self, logical_coords: Tuple[float, float]) -> Tuple[int, int]:
        """Convert logical coordinates to physical pixels"""
        if self._dirty:
            self._recalculate_matrix()
        return self.scaling_matrix.transform(logical_coords)
    
    def to_logical(self, physical_coords: Tuple[int, int]) -> Tuple[float, float]:
        """Convert physical pixels to logical coordinates"""
        if self._dirty:
            self._recalculate_matrix()
        return self.scaling_matrix.transform_reverse(physical_coords)
    
    def get_logical_bounds(self) -> Tuple[float, float, float, float]:
        """Get logical coordinate bounds (left, top, right, bottom)"""
        return (0.0, 0.0, float(self.logical_size[0]), float(self.logical_size[1]))
    
    def get_physical_bounds(self) -> Tuple[int, int, int, int]:
        """Get physical pixel bounds (left, top, right, bottom)"""
        return (0, 0, self.physical_size[0], self.physical_size[1])
    
    def map_race_position(self, race_meters: float) -> float:
        """
        Map race position from meters to logical units.
        
        Critical Translation: 1500m race track → 1000 logical units
        1 meter ≈ 0.6667 logical units
        """
        # 1500m maps to 1000 units, so scale factor is 1000/1500 = 2/3
        logical_units = race_meters * (1000.0 / 1500.0)
        return logical_units
    
    def map_race_position_reverse(self, logical_units: float) -> float:
        """Map logical units back to race meters"""
        race_meters = logical_units * (1500.0 / 1000.0)
        return race_meters
    
    def get_aspect_ratio(self) -> float:
        """Get current aspect ratio (width/height)"""
        return self.physical_size[0] / self.physical_size[1]
    
    def is_retro_mode(self) -> bool:
        """Check if current resolution matches retro profile (160x144)"""
        return self.physical_size == (160, 144)
    
    def is_hd_mode(self) -> bool:
        """Check if current resolution supports HD rendering"""
        return self.physical_size[0] > 640 and self.physical_size[1] > 480


class ViewportManager:
    """
    Manages multiple viewports and provides unified interface for coordinate mapping.
    Supports simultaneous rendering to multiple resolutions (e.g., retro + preview)
    """
    
    def __init__(self):
        self.primary_viewport = LogicalViewport()
        self.secondary_viewports = {}
    
    def add_viewport(self, name: str, viewport: LogicalViewport) -> None:
        """Add a secondary viewport for multi-resolution rendering"""
        self.secondary_viewports[name] = viewport
    
    def get_viewport(self, name: str = "primary") -> LogicalViewport:
        """Get viewport by name"""
        if name == "primary":
            return self.primary_viewport
        return self.secondary_viewports.get(name, self.primary_viewport)
    
    def update_all_resolutions(self, primary_size: Tuple[int, int], 
                              secondary_sizes: dict = None) -> None:
        """Update all viewport resolutions simultaneously"""
        self.primary_viewport.set_physical_resolution(primary_size)
        
        if secondary_sizes:
            for name, size in secondary_sizes.items():
                if name in self.secondary_viewports:
                    self.secondary_viewports[name].set_physical_resolution(size)
    
    def sync_logical_coordinates(self, logical_pos: Tuple[float, float]) -> dict:
        """Get physical coordinates for all viewports from same logical position"""
        results = {"primary": self.primary_viewport.to_physical(logical_pos)}
        
        for name, viewport in self.secondary_viewports.items():
            results[name] = viewport.to_physical(logical_pos)
        
        return results
