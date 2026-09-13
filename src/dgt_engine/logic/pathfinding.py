"""
Pathfinding System for Autonomous Navigation

Deterministic pathfinding algorithm for the Voyager to navigate to narrative beacons.
Uses the assets.dgt collision data for obstacle avoidance and optimal route calculation.

This is the "stunt coordinator" that ensures the Voyager can reach the AI-defined
beacons reliably and efficiently.
"""

from typing import List, Tuple, Optional, Set, Dict, Any
from dataclasses import dataclass
from enum import Enum
import math

from loguru import logger

# Import SimulatorHost for type annotation - use forward reference to avoid circular imports
try:
    from core.simulator import SimulatorHost
except ImportError:
    # Fallback for when this module is imported before simulator
    SimulatorHost = None


class TileType(Enum):
    """Tile types for pathfinding."""
    WALKABLE = 0
    WALL = 1
    WATER = 2
    DOOR = 3
    NPC = 4


@dataclass
class PathNode:
    """Node in the pathfinding graph."""
    position: Tuple[int, int]
    g_score: float  # Total cost from start
    h_score: float  # Heuristic distance to goal
    f_score: float  # g_score + h_score
    parent: Optional['PathNode'] = None
    
    def __lt__(self, other: 'PathNode') -> bool:
        return self.f_score < other.f_score


class PathfindingGrid:
    """
    Grid-based pathfinding system using A* algorithm.
    
    Uses the assets.dgt collision data for obstacle detection and provides
    deterministic navigation for the Voyager.
    """
    
    def __init__(self, width: int, height: int, collision_data: Optional[Dict[str, Any]] = None):
        """
        Initialize the pathfinding grid.
        
        Args:
            width: Grid width in tiles
            height: Grid height in tiles
            collision_data: Collision data from assets.dgt
        """
        self.width = width
        self.height = height
        self.collision_data = collision_data or {}
        # Initialize grid with PathNode objects
        self._grid = [[PathNode((x, y), 0, 0, 0, None) for x in range(width)] for y in range(height)]
        
        # Load collision data if available
        self._load_collision_data()
        
        logger.debug(f"🗺️ Pathfinding grid initialized: {width}x{height}")
    
    def _load_collision_data(self) -> None:
        """Load collision data from assets.dgt."""
        if not self.collision_data:
            # Generate default collision map
            self._generate_default_collision_map()
            return
        
        # Load from collision data
        tile_registry = self.collision_data.get('tile_registry', {})
        environment_registry = self.collision_data.get('environment_registry', {})
        
        # Update grid with collision data
        for env_id, env_data in environment_registry.items():
            if 'tile_map' in env_data:
                tile_map = env_data['tile_map']
                self._apply_tile_map(tile_map, (0, 0))
        
        # Apply object collision data
        object_registry = self.collision_data.get('object_registry', {})
        for obj_id, obj_data in object_registry.get('objects', {}).items():
            if 'position' in obj_data:
                pos = obj_data['position']
                if 0 <= pos[0] < self.width and 0 <= pos[1] < self.height:
                    self._grid[pos[1]][pos[0]] = PathNode(pos, 0, 0, 0, None)
    
    def _generate_default_collision_map(self) -> None:
        """Generate a default collision map."""
        # Mark border walls as non-walkable by setting them to None
        for x in range(self.width):
            self._grid[0][x] = None  # Top border
            self._grid[self.height-1][x] = None  # Bottom border
        
        for y in range(self.height):
            self._grid[y][0] = None  # Left border
            self._grid[y][self.width-1] = None  # Right border
        
        # Add some interior walls (check bounds) - only for larger grids
        # BUT don't cover the entire center area
        if self.width > 15 and self.height > 15:
            wall_start_x = 5
            wall_end_x = min(10, self.width - 1)
            wall_start_y = 5
            wall_end_y = min(10, self.height - 1)
            
            for x in range(wall_start_x, wall_end_x + 1):
                for y in range(wall_start_y, wall_end_y + 1):
                    if x < self.width and y < self.height:
                        self._grid[y][x] = None  # Mark as wall
    
    def _apply_tile_map(self, tile_map: List[int], offset: Tuple[int, int]) -> None:
        """Apply tile map to grid."""
        for y, row in enumerate(tile_map):
            for x, tile_id in enumerate(row):
                if 0 <= x < self.width and 0 <= y < self.height:
                    tile_type = self._get_tile_type(tile_id)
                    if tile_type != TileType.WALKABLE:
                        self._grid[y][x] = PathNode((x + offset[0], y + offset[1]), 0, 0, 0, None)
    
    def _get_tile_type(self, tile_id: int) -> TileType:
        """Get tile type from tile ID."""
        # Simple mapping - would be expanded based on actual tile registry
        if tile_id == 1:
            return TileType.WALL
        elif tile_id == 2:
            return TileType.WATER
        elif tile_id == 3:
            return TileType.DOOR
        else:
            return TileType.WALKABLE
    
    def is_walkable(self, position: Tuple[int, int]) -> bool:
        """Check if a position is walkable."""
        x, y = position
        if 0 <= x < self.width and 0 <= y < self.height:
            # Position is walkable if grid cell is not None (not a wall)
            return self._grid[y][x] is not None
        return False
    
    def _is_tile_walkable(self, node: PathNode) -> bool:
        """Check if a tile node is walkable."""
        # For now, consider all nodes walkable except walls
        # In a real implementation, this would check the tile type
        return True
    
    def get_neighbors(self, position: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Get walkable neighboring positions."""
        x, y = position
        neighbors = []
        
        # Check all 8 directions
        directions = [
            (-1, -1), (0, -1), (1, -1),
            (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)
        ]
        
        for dx, dy in directions:
            new_x, new_y = x + dx, y + dy
            if 0 <= new_x < self.width and 0 <= new_y < self.height:
                if self.is_walkable((new_x, new_y)):
                    neighbors.append((new_x, new_y))
        
        return neighbors
    
    def find_path(self, start: Tuple[int, int], goal: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
        """
        Find path from start to goal using A* algorithm.
        
        Args:
            start: Starting position
            goal: Goal position
            
        Returns:
            List of positions forming the path, or None if no path found
        """
        if not self.is_walkable(start) or not self.is_walkable(goal):
            logger.warning(f"❌ Invalid start or goal position: start={start}, goal={goal}")
            return None
        
        # Reset grid for new pathfinding
        self._reset_grid()
        
        # Initialize start and goal nodes
        start_node = self._grid[start[1]][start[0]]
        goal_node = self._grid[goal[1]][goal[0]]
        
        if start_node is None or goal_node is None:
            logger.warning(f"❌ Start or goal node is None: start={start}, goal={goal}")
            return None
        
        start_node.g_score = 0
        start_node.h_score = self._heuristic(start, goal)
        start_node.f_score = start_node.h_score
        
        goal_node.h_score = 0
        
        # Open and closed sets for A*
        open_set = {start_node.position: start_node}
        closed_set = {}
        
        while open_set:
            # Get node with lowest f_score
            current = min(open_set.values(), key=lambda n: n.f_score)
            del open_set[current.position]
            closed_set[current.position] = current
            
            # Check if goal reached
            if current.position == goal_node.position:
                # Reconstruct path
                path = []
                while current.parent is not None:
                    path.append(current.position)
                    current = current.parent
                path.reverse()
                return path
            
            # Explore neighbors
            for neighbor_pos in self.get_neighbors(current.position):
                neighbor = self._grid[neighbor_pos[1]][neighbor_pos[0]]
                
                if neighbor is None or neighbor.position in closed_set:
                    continue
                
                # Calculate costs
                g_score = current.g_score + 1  # Uniform cost for now
                h_score = self._heuristic(neighbor_pos, goal)
                f_score = g_score + h_score
                
                # Check if this path is better
                tentative_g_score = current.g_score + 1
                if neighbor.position in open_set and tentative_g_score >= open_set[neighbor.position].g_score:
                    continue
                
                neighbor.g_score = tentative_g_score
                neighbor.h_score = h_score
                neighbor.f_score = f_score
                neighbor.parent = current
                open_set[neighbor.position] = neighbor
        
        logger.warning(f"❌ No path found from {start} to {goal}")
        return None
    
    def _reset_grid(self) -> None:
        """Reset the grid for new pathfinding."""
        for y in range(self.height):
            for x in range(self.width):
                node = self._grid[y][x]
                if node is not None:
                    node.g_score = 0
                    node.h_score = 0
                    node.f_score = 0
                    node.parent = None
    
    def _heuristic(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> float:
        """
        Heuristic function for A* algorithm.
        
        Uses Manhattan distance for grid-based pathfinding.
        """
        dx = abs(pos1[0] - pos2[0])
        dy = abs(pos1[1] - pos2[1])
        return dx + dy


class NavigationSystem:
    """
    High-level navigation system that coordinates pathfinding and beacon pursuit.
    
    Orchestrates the Voyager's journey through narrative beacons.
    """
    
    def __init__(self, pathfinding_grid: PathfindingGrid):
        self.pathfinding_grid = pathfinding_grid
        self.current_path: Optional[List[Tuple[int, int]]] = None
        self.path_index = 0
        
        logger.info("🧭 Navigation system initialized")
    
    def set_path_to_beacon(self, start_pos: Tuple[int, int], beacon_coords: Tuple[int, int]) -> bool:
        """
        Set path to target beacon.
        
        Args:
            start_pos: Current Voyager position
            beacon_coords: Target beacon coordinates
            
        Returns:
            True if path found, False otherwise
        """
        path = self.pathfinding_grid.find_path(start_pos, beacon_coords)
        
        if path:
            self.current_path = path
            self.path_index = 0
            logger.info(f"🛤️ Path set: {len(path)} steps to {beacon_coords}")
            return True
        else:
            logger.warning(f"❌ No path found to {beacon_coords}")
            return False
    
    def get_next_position(self) -> Optional[Tuple[int, int]]:
        """
        Get next position along current path.
        
        Returns:
            Next position in path, or None if no path is active
        """
        if not self.current_path or self.path_index >= len(self.current_path):
            return None
        
        if self.path_index < len(self.current_path):
            next_pos = self.current_path[self.path_index]
            self.path_index += 1
            return next_pos
        
        return None
    
    def is_path_complete(self) -> bool:
        """Check if current path is complete."""
        return not self.current_path or self.path_index >= len(self.current_path)
    
    def clear_path(self) -> None:
        """Clear current path."""
        self.current_path = None
        self.path_index = 0
        logger.debug("🧹 Path cleared")


class MovementController:
    """
    Controls Voyager movement along paths.
    
    Converts path coordinates to game actions and manages movement state.
    """
    
    def __init__(self, simulator: 'SimulatorHost'):
        self.simulator = simulator
        self.is_moving = False
        self.movement_queue: List[str] = []
        
        logger.info("🎮 Movement controller initialized")
    
    def move_along_path(self, path: List[Tuple[int, int]]) -> bool:
        """
        Move the Voyager along a path step by step.
        
        Args:
            path: List of positions forming the path
            
        Returns:
            True if movement successful, False otherwise
        """
        if not path:
            return False
        
        self.is_moving = True
        self.movement_queue = []
        
        for i, pos in enumerate(path):
            if i == 0:
                continue  # Skip first position (already there)
            
            # Calculate direction from previous position
            if i > 0:
                prev_pos = path[i-1]
                direction = self._get_direction_from_movement(prev_pos, pos)
                action_input = f"I move {direction}"
                self.movement_queue.append(action_input)
        
        self.is_moving = False
        return True
    
    def _get_direction_from_movement(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int]) -> str:
        """Get direction string from movement vector."""
        dx = to_pos[0] - from_pos[0]
        dy = to_pos[1] - from_pos[1]
        
        if dx > 0:
            return "east"
        elif dx < 0:
            return "west"
        elif dy > 0:
            return "south"
        elif dy < 0:
            return "north"
        else:
            return "here"
    
    def execute_movement_queue(self) -> None:
        """Execute queued movement actions."""
        for action in self.movement_queue:
            self.simulator.submit_action(action)
        
        self.movement_queue.clear()
    
    def stop_movement(self) -> None:
        """Stop current movement."""
        self.is_moving = False
        self.movement_queue.clear()
        logger.debug("🛑 Movement stopped")


# Factory for creating navigation components
class NavigationFactory:
    """Factory for creating navigation components."""
    
    @staticmethod
    def create_navigation_system(width: int, height: int, collision_data: Optional[Dict[str, Any]] = None) -> NavigationSystem:
        """Create navigation system with pathfinding grid."""
        grid = PathfindingGrid(width, height, collision_data)
        return NavigationSystem(grid)
    
    @staticmethod
    def create_movement_controller(simulator: 'SimulatorHost') -> MovementController:
        """Create movement controller for Voyager."""
        return MovementController(simulator)
