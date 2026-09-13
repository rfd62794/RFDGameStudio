"""
Raycasting Engine - SOLID Refactor

Single Responsibility: Ray casting and hit detection.
Part of ASCIIDoomRenderer refactoring for better maintainability.
"""

import math
from typing import Optional, Tuple
from dataclasses import dataclass

from loguru import logger

from world_ledger import WorldLedger, Coordinate, WorldChunk
from game_state import GameState
from .raycasting_types import Ray3D, HitResult


class RayCaster:
    """
    Handles ray casting operations for 3D rendering.
    
    Single Responsibility: Cast rays and determine hit results.
    """

    def __init__(self, world_ledger: WorldLedger, max_distance: float = 20.0):
        """Initialize the ray caster."""
        self.world_ledger = world_ledger
        self.max_distance = max_distance
        
        # Wall detection tags
        self.wall_tags = ["wall", "stone", "barrier", "obstacle", "blocked"]
        
        logger.debug(f"RayCaster initialized with max_distance: {max_distance}")

    def cast_ray(self, ray: Ray3D, game_state: GameState) -> HitResult:
        """
        Cast a single ray and return hit information.
        
        Args:
            ray: The ray to cast
            game_state: Current game state
            
        Returns:
            HitResult with distance and content
        """
        direction = ray.get_direction()
        
        # Step through the ray with proper bounds checking
        max_steps = min(int(ray.length), self.max_distance)
        
        for step in range(1, max_steps + 1):
            # Calculate position along ray
            check_x = ray.origin_x + direction[0] * step
            check_y = ray.origin_y + direction[1] * step
            
            # Get coordinate with bounds checking
            coord = self._get_safe_coordinate(check_x, check_y)
            if not coord:
                continue
                
            # Check for chunk at this coordinate
            chunk = self.world_ledger.get_chunk(coord, 0)
            
            # Check for walls first (they block line of sight)
            if self._is_wall(chunk, check_x, check_y):
                return HitResult(
                    hit=True,
                    distance=step,
                    height=1.0,
                    content="wall",  # Let renderer determine character
                    coordinate=coord,
                    entity_id=None
                )
            
            # Check for entities
            entity = self._get_entity_at(coord, game_state)
            if entity:
                return HitResult(
                    hit=True,
                    distance=step,
                    height=1.0,
                    content="entity",  # Let renderer determine character
                    coordinate=coord,
                    entity_id=entity.id
                )
            
            # Check for items
            item = self._get_item_at(coord, game_state)
            if item:
                return HitResult(
                    hit=True,
                    distance=step,
                    height=0.5,
                    content="item",  # Let renderer determine character
                    coordinate=coord,
                    entity_id=None
                )
        
        # No hit
        return HitResult(
            hit=False,
            distance=ray.length,
            height=0.0,
            content='',
            coordinate=None,
            entity_id=None
        )

    def _get_safe_coordinate(self, x: float, y: float) -> Optional[Coordinate]:
        """
        Get a safe coordinate with bounds checking.
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Coordinate if valid, None otherwise
        """
        try:
            # Basic bounds checking - prevent extreme values
            if abs(x) > 1000 or abs(y) > 1000:
                logger.warning(f"Coordinate out of bounds: ({x}, {y})")
                return None
                
            return Coordinate(int(x), int(y), 0)
        except (ValueError, OverflowError) as e:
            logger.error(f"Invalid coordinate: ({x}, {y}) - {e}")
            return None

    def _is_wall(self, chunk: WorldChunk, x: float, y: float) -> bool:
        """
        Check if a position is a wall.
        
        Args:
            chunk: World chunk at position
            x: X position
            y: Y position
            
        Returns:
            True if this is a wall position
        """
        if not chunk:
            return True  # Missing chunks are walls
            
        # Check if coordinate is outside chunk boundaries
        chunk_x, chunk_y, chunk_t = chunk.coordinate
        
        # Simple boundary check
        if x < chunk_x or x >= chunk_x + 1 or y < chunk_y or y >= chunk_y + 1:
            return True
        
        # Check for wall-like tags
        return any(tag in chunk.tags for tag in self.wall_tags)

    def _get_entity_at(self, coord: Coordinate, game_state: GameState) -> Optional[object]:
        """
        Get entity at a coordinate.
        
        Args:
            coord: Coordinate to check
            game_state: Current game state
            
        Returns:
            Entity if found, None otherwise
        """
        # This would integrate with the EntityAI system
        # For now, return None to maintain current functionality
        return None

    def _get_item_at(self, coord: Coordinate, game_state: GameState) -> Optional[object]:
        """
        Get item at a coordinate.
        
        Args:
            coord: Coordinate to check
            game_state: Current game state
            
        Returns:
            Item if found, None otherwise
        """
        # This would integrate with the loot system
        # For now, return None to maintain current functionality
        return None

    def set_max_distance(self, distance: float) -> None:
        """
        Update maximum casting distance.
        
        Args:
            distance: New maximum distance
        """
        if distance <= 0:
            logger.warning(f"Invalid max_distance: {distance}, using default")
            return
            
        self.max_distance = distance
        logger.debug(f"RayCaster max_distance updated to: {distance}")


# Export for use by renderer
__all__ = ["RayCaster"]
