"""
Pathfinding Navigator Module
ADR 084: Actor-Intent Decoupling

Pure pathfinding component - no state, just math.
Takes a Map + Start + Goal → Returns Path.
Can be swapped for different algorithms (A*, Dijkstra) without breaking the character.
"""

import asyncio
from typing import List, Tuple, Optional, Dict, Any
from loguru import logger
from dataclasses import dataclass

@dataclass
class PathfindingNavigator:
    """Pure pathfinding component - no state, just math"""
    
    def __init__(self, world_size: Tuple[int, int]):
        self.world_size = world_size
        self.world_width, self.world_height = world_size
    
    async def find_path(self, start: Tuple[int, int], goal: Tuple[int, int], collision_map: Dict[Tuple[int, int], bool]) -> Optional[List[Tuple[int, int]]]:
        """Find path from start to goal using A* algorithm"""
        try:
            return await self._astar_pathfinding(start, goal, collision_map)
        except Exception as e:
            logger.error(f"💥 Pathfinding failed: {e}")
            return None
    
    async def _astar_pathfinding(self, start: Tuple[int, int], goal: Tuple[int, int], collision_map: Dict[Tuple[int, int], bool]) -> Optional[List[Tuple[int, int]]]:
        """A* pathfinding algorithm"""
        # Simple A* implementation
        open_set = {start}
        came_from = {}
        g_score = {start: 0}
        f_score = {start: self._heuristic(start, goal)}
        
        iterations = 0
        max_iterations = 1000
        
        while open_set and iterations < max_iterations:
            iterations += 1
            
            current = min(open_set, key=lambda pos: f_score.get(pos, float('inf')))
            open_set.remove(current)
            
            if current == goal:
                return self._reconstruct_path(came_from, current)
            
            for neighbor in self._get_neighbors(current, collision_map):
                tentative_g_score = g_score.get(current, float('inf')) + 1
                tentative_f_score = tentative_g_score + self._heuristic(neighbor, goal)
                
                if neighbor not in g_score or tentative_f_score < f_score.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_f_score
        
        return None
    
    def _heuristic(self, pos: Tuple[int, int], goal: Tuple[int, int]) -> float:
        """A* heuristic function"""
        # Manhattan distance
        return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])
    
    def _reconstruct_path(self, came_from: Dict[Tuple[int, int], Tuple[int, int]], current: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Reconstruct path from came_from dictionary"""
        path = [current]
        while current in came_from:
            current = came_from[current]
            path.append(current)
        return list(reversed(path))
    
    def _get_neighbors(self, pos: Tuple[int, int], collision_map: Dict[Tuple[int, int], bool]) -> List[Tuple[int, int]]:
        """Get valid neighboring positions"""
        neighbors = []
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            new_pos = (pos[0] + dx, pos[1] + dy)
            if (0 <= new_pos[0] < self.world_width and 
                0 <= new_pos[1] < self.world_height and
                not collision_map.get(new_pos, False)):
                neighbors.append(new_pos)
        return neighbors
