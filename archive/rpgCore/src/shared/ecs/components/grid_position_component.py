"""
GridPositionComponent - Grid placement for Tower Defense
ADR-010: Grid as Component
"""
from dataclasses import dataclass
from typing import Optional
from src.shared.physics.kinematics import Vector2


@dataclass
class GridPositionComponent:
    """Grid placement for slimes in tower defense"""
    grid_x: int
    grid_y: int
    
    def world_position(self, tile_size: int = 48) -> Vector2:
        """Convert grid position to world coordinates"""
        return Vector2(self.grid_x * tile_size, self.grid_y * tile_size)
    
    def set_world_position(self, world_pos: Vector2, tile_size: int = 48) -> None:
        """Set grid position from world coordinates"""
        self.grid_x = int(world_pos.x // tile_size)
        self.grid_y = int(world_pos.y // tile_size)
    
    def is_valid_position(self, grid_width: int = 10, grid_height: int = 10) -> bool:
        """Check if grid position is within bounds"""
        return 0 <= self.grid_x < grid_width and 0 <= self.grid_y < grid_height


class GridUtilities:
    """Utility functions for grid coordinate conversion"""
    
    @staticmethod
    def world_to_grid(world_pos: Vector2, tile_size: int = 48) -> tuple[int, int]:
        """Convert world coordinates to grid position"""
        return int(world_pos.x // tile_size), int(world_pos.y // tile_size)
    
    @staticmethod
    def grid_to_world(grid_x: int, grid_y: int, tile_size: int = 48) -> Vector2:
        """Convert grid position to world coordinates"""
        return Vector2(grid_x * tile_size, grid_y * tile_size)
    
    @staticmethod
    def get_tile_center(grid_x: int, grid_y: int, tile_size: int = 48) -> Vector2:
        """Get center position of a grid tile"""
        return Vector2(
            grid_x * tile_size + tile_size // 2,
            grid_y * tile_size + tile_size // 2
        )
    
    @staticmethod
    def distance_tiles(from_x: int, from_y: int, to_x: int, to_y: int) -> float:
        """Calculate distance between two grid positions in tiles"""
        dx = to_x - from_x
        dy = to_y - from_y
        return (dx * dx + dy * dy) ** 0.5
    
    @staticmethod
    def is_adjacent(x1: int, y1: int, x2: int, y2: int) -> bool:
        """Check if two grid positions are adjacent (including diagonal)"""
        return abs(x1 - x2) <= 1 and abs(y1 - y2) <= 1 and (x1 != x2 or y1 != y2)
