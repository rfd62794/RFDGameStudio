"""
World Engine - The World Pillar

Deterministic procedural world generation using Seed_Zero.
Provides tile data and world state to D&D Engine.
No circular dependencies - pure data provider.
"""

import time
import hashlib
from typing import Tuple, List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

from loguru import logger


class TileType(Enum):
    """Tile types for world generation"""
    GRASS = 0
    STONE = 1
    WATER = 2
    FOREST = 3
    MOUNTAIN = 4
    SAND = 5
    SNOW = 6
    DOOR_CLOSED = 7
    DOOR_OPEN = 8
    WALL = 9
    FLOOR = 10


@dataclass
class TileData:
    """Tile data structure"""
    tile_type: TileType
    walkable: bool
    metadata: Dict[str, Any]
    
    def copy(self) -> 'TileData':
        """Create a copy of tile data"""
        return TileData(
            tile_type=self.tile_type,
            walkable=self.walkable,
            metadata=self.metadata.copy()
        )


@dataclass
class WorldDelta:
    """World state change delta"""
    position: Tuple[int, int]
    original_tile: TileData
    current_tile: TileData
    timestamp: float
    delta_type: str = "tile_change"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert delta to dictionary for persistence"""
        return {
            "position": self.position,
            "current_tile_type": self.current_tile.tile_type.value,
            "current_walkable": self.current_tile.walkable,
            "current_metadata": self.current_tile.metadata,
            "timestamp": self.timestamp,
            "delta_type": self.delta_type
        }


class PermutationTable:
    """Permutation table for deterministic noise generation"""
    
    def __init__(self, seed: str):
        self.seed = seed
        self.permutation = self._generate_permutation()
        
    def _generate_permutation(self) -> List[int]:
        """Generate permutation table from seed"""
        # Create hash-based permutation
        hash_obj = hashlib.md5(self.seed.encode())
        hash_bytes = hash_obj.digest()
        
        # Convert to permutation (0-255)
        permutation = list(range(256))
        
        # Shuffle using hash bytes
        for i in range(255, 0, -1):
            hash_index = i % len(hash_bytes)
            shuffle_value = hash_bytes[hash_index]
            j = shuffle_value % (i + 1)
            permutation[i], permutation[j] = permutation[j], permutation[i]
        
        return permutation
    
    def get_value(self, x: int, y: int) -> float:
        """Get deterministic value from permutation table"""
        # Simple hash-based noise
        combined = (x * 374761393 + y * 668265263) % 256
        return self.permutation[combined] / 255.0


class WorldEngine:
    """World Engine - The World Pillar
    
    Deterministic procedural world generation using Seed_Zero.
    Provides tile data and world state to D&D Engine.
    """
    
    def __init__(self, seed_zero: str = "SEED_ZERO", width: int = 100, height: int = 100):
        self.seed_zero = seed_zero
        self.width = width
        self.height = height
        self.permutation_table = PermutationTable(seed_zero)
        
        # Base world map (generated from seed)
        self.base_map: Dict[Tuple[int, int], TileData] = {}
        
        # Initialize world
        self._generate_base_world()
        
        logger.info(f"🌍 World Engine initialized - Seed: {seed_zero}, Size: {width}x{height}")
    
    def _generate_base_world(self) -> None:
        """Generate base world from seed using deterministic algorithms"""
        logger.info("🏗️ Generating base world from seed...")
        
        for y in range(self.height):
            for x in range(self.width):
                tile_data = self._generate_tile_at_position(x, y)
                self.base_map[(x, y)] = tile_data
        
        logger.info(f"✅ Base world generated: {len(self.base_map)} tiles")
    
    def _generate_tile_at_position(self, x: int, y: int) -> TileData:
        """Generate tile at specific position using deterministic noise"""
        # Get noise value from permutation table
        noise_value = self.permutation_table.get_value(x, y)
        
        # Determine tile type based on noise and position
        tile_type, walkable, metadata = self._classify_tile(noise_value, x, y)
        
        return TileData(
            tile_type=tile_type,
            walkable=walkable,
            metadata=metadata
        )
    
    def _classify_tile(self, noise_value: float, x: int, y: int) -> Tuple[TileType, bool, Dict[str, Any]]:
        """Classify tile based on noise value and position"""
        # Base terrain classification
        if noise_value < 0.2:
            return TileType.WATER, False, {"terrain": "water", "depth": noise_value * 5}
        elif noise_value < 0.3:
            return TileType.SAND, True, {"terrain": "sand", "dryness": noise_value}
        elif noise_value < 0.6:
            return TileType.GRASS, True, {"terrain": "grass", "height": noise_value}
        elif noise_value < 0.8:
            return TileType.FOREST, True, {"terrain": "forest", "density": noise_value}
        else:
            return TileType.MOUNTAIN, False, {"terrain": "mountain", "elevation": noise_value}
    
    def get_tile_at(self, position: Tuple[int, int]) -> TileData:
        """Get tile data at position"""
        x, y = position
        
        # Check bounds
        if x < 0 or x >= self.width or y < 0 or y >= self.height:
            # Return default tile for out of bounds
            return TileData(
                tile_type=TileType.WALL,
                walkable=False,
                metadata={"terrain": "void", "out_of_bounds": True}
            )
        
        return self.base_map.get(position, self._generate_tile_at_position(x, y))
    
    def get_collision_map(self, environment: str = "all") -> List[List[bool]]:
        """Get collision map for navigation"""
        collision_map = []
        
        for y in range(self.height):
            row = []
            for x in range(self.width):
                tile = self.get_tile_at((x, y))
                row.append(not tile.walkable)  # True = obstacle, False = walkable
            collision_map.append(row)
        
        return collision_map
    
    def get_tiles_in_region(self, min_x: int, min_y: int, max_x: int, max_y: int) -> Dict[Tuple[int, int], TileData]:
        """Get tiles in rectangular region"""
        tiles = {}
        
        for y in range(max(0, min_y), min(self.height, max_y + 1)):
            for x in range(max(0, min_x), min(self.width, max_x + 1)):
                tiles[(x, y)] = self.get_tile_at((x, y))
        
        return tiles
    
    def find_special_locations(self) -> Dict[str, Tuple[int, int]]:
        """Find special locations in the world (doors, triggers, etc.)"""
        special_locations = {}
        
        # Scan for special tiles
        for position, tile in self.base_map.items():
            x, y = position
            
            # Look for potential door locations (transition points)
            if tile.tile_type == TileType.GRASS and self._is_transition_point(x, y):
                special_locations[f"transition_{x}_{y}"] = position
            
            # Look for water edges
            if tile.tile_type == TileType.WATER and self._has_adjacent_land(x, y):
                special_locations[f"water_edge_{x}_{y}"] = position
            
            # Look for forest clearings
            if tile.tile_type == TileType.FOREST and self._is_clearing(x, y):
                special_locations[f"clearing_{x}_{y}"] = position
        
        return special_locations
    
    def _is_transition_point(self, x: int, y: int) -> bool:
        """Check if position is a good transition point"""
        # Simple heuristic: look for areas with mixed terrain
        adjacent_tiles = []
        
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx == 0 and dy == 0:
                    continue
                
                adj_tile = self.get_tile_at((x + dx, y + dy))
                adjacent_tiles.append(adj_tile.tile_type)
        
        # Transition if multiple terrain types nearby
        unique_types = set(adjacent_tiles)
        return len(unique_types) >= 2
    
    def _has_adjacent_land(self, x: int, y: int) -> bool:
        """Check if water tile has adjacent land"""
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx == 0 and dy == 0:
                    continue
                
                adj_tile = self.get_tile_at((x + dx, y + dy))
                if adj_tile.walkable:
                    return True
        
        return False
    
    def _is_clearing(self, x: int, y: int) -> bool:
        """Check if forest position is a clearing"""
        # Count forest tiles in 3x3 area
        forest_count = 0
        
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                adj_tile = self.get_tile_at((x + dx, y + dy))
                if adj_tile.tile_type == TileType.FOREST:
                    forest_count += 1
        
        # Clearing if less than 50% forest
        return forest_count < 5
    
    def apply_delta(self, delta: WorldDelta) -> None:
        """Apply a world state change delta"""
        position = delta.position
        
        # Update base map (for persistence)
        self.base_map[position] = delta.current_tile.copy()
        
        logger.debug(f"🔄 Applied delta at {position}: {delta.original_tile.tile_type} → {delta.current_tile.tile_type}")
    
    def get_world_statistics(self) -> Dict[str, Any]:
        """Get world generation statistics"""
        tile_counts = {}
        walkable_count = 0
        
        for tile in self.base_map.values():
            tile_type_name = tile.tile_type.name
            tile_counts[tile_type_name] = tile_counts.get(tile_type_name, 0) + 1
            
            if tile.walkable:
                walkable_count += 1
        
        total_tiles = len(self.base_map)
        
        return {
            "seed": self.seed_zero,
            "dimensions": f"{self.width}x{self.height}",
            "total_tiles": total_tiles,
            "walkable_tiles": walkable_count,
            "walkable_percentage": (walkable_count / total_tiles) * 100,
            "tile_distribution": tile_counts,
            "special_locations": len(self.find_special_locations())
        }


# Factory for creating World Engine instances
class WorldEngineFactory:
    """Factory for creating World Engine instances"""
    
    @staticmethod
    def create_world(seed_zero: str = "SEED_ZERO", width: int = 100, height: int = 100) -> WorldEngine:
        """Create a World Engine with specified parameters"""
        return WorldEngine(seed_zero, width, height)
    
    @staticmethod
    def create_demo_world() -> WorldEngine:
        """Create a demo world for testing"""
        return WorldEngine("DEMO_SEED", 50, 50)
    
    @staticmethod
    def create_tavern_world() -> WorldEngine:
        """Create a world optimized for tavern demo"""
        world = WorldEngine("TAVERN_SEED", 50, 50)
        
        # Add special locations for demo
        demo_deltas = [
            WorldDelta(
                position=(10, 25),
                original_tile=world.get_tile_at((10, 25)),
                current_tile=TileData(TileType.GRASS, True, {"terrain": "forest_edge", "special": "spawn"}),
                timestamp=time.time()
            ),
            WorldDelta(
                position=(10, 20),
                original_tile=world.get_tile_at((10, 20)),
                current_tile=TileData(TileType.DOOR_CLOSED, False, {"terrain": "gate", "target_env": "town"}),
                timestamp=time.time()
            ),
            WorldDelta(
                position=(20, 10),
                original_tile=world.get_tile_at((20, 10)),
                current_tile=TileData(TileType.DOOR_CLOSED, False, {"terrain": "tavern_entrance", "target_env": "tavern"}),
                timestamp=time.time()
            ),
            WorldDelta(
                position=(25, 30),
                original_tile=world.get_tile_at((25, 30)),
                current_tile=TileData(TileType.FLOOR, True, {"terrain": "tavern_interior", "special": "goal"}),
                timestamp=time.time()
            )
        ]
        
        # Apply demo deltas
        for delta in demo_deltas:
            world.apply_delta(delta)
        
        logger.info("🏪 Demo tavern world created with special locations")
        return world
