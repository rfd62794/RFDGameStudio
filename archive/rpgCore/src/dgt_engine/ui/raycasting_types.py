"""
Raycasting Types - Shared Data Structures

Common types used by raycasting components.
Part of ASCIIDoomRenderer SOLID refactoring.
"""

import math
from typing import Tuple, Optional
from dataclasses import dataclass

from world_ledger import Coordinate


@dataclass
class Ray3D:
    """A 3D ray for raycasting."""
    origin_x: float
    origin_y: float
    angle: float  # Direction in degrees
    length: float
    
    def get_direction(self) -> Tuple[float, float]:
        """Get the direction vector for this ray."""
        angle_rad = math.radians(self.angle)
        return (math.cos(angle_rad), math.sin(angle_rad))

    def normalize_angle(self) -> 'Ray3D':
        """
        Normalize angle to 0-360 degree range.
        
        Returns:
            New Ray3D with normalized angle
        """
        normalized_angle = self.angle % 360
        return Ray3D(
            origin_x=self.origin_x,
            origin_y=self.origin_y,
            angle=normalized_angle,
            length=self.length
        )


@dataclass
class HitResult:
    """Result of a raycast against the world."""
    hit: bool
    distance: float
    height: float
    content: str
    coordinate: Optional[Coordinate]
    entity_id: Optional[str]

    def is_entity_hit(self) -> bool:
        """Check if this hit represents an entity."""
        return self.hit and self.entity_id is not None

    def is_wall_hit(self) -> bool:
        """Check if this hit represents a wall."""
        return self.hit and self.content == "wall"

    def is_item_hit(self) -> bool:
        """Check if this hit represents an item."""
        return self.hit and self.content == "item"

    def get_depth_score(self) -> float:
        """
        Calculate depth score for sorting (closer = higher score).
        
        Returns:
            Depth score for z-ordering
        """
        if not self.hit:
            return 0.0
        return 1.0 / (self.distance + 1.0)  # Prevent division by zero


# Export for use by other modules
__all__ = ["Ray3D", "HitResult"]
