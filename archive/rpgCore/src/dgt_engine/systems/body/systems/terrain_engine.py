"""
Terrain Engine - Strategic Racing Environment

Sprint E2: The Derby Engine - Terrain System
ADR 219: Sovereign Terrain Mapping

Defines the 160x144 terrain system that creates strategic variety
for TurboShell racing. Different terrain types affect movement based on
genetic traits, creating risk/reward scenarios and strategic depth.
"""

from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import math
import random
import time

from foundation.types import Result
from foundation.protocols import Vector2Protocol
from foundation.vector import Vector2
from foundation.registry import DGTRegistry, RegistryType
from ...base import BaseSystem, SystemConfig


@dataclass
class TerrainCell:
    """Individual terrain cell in the 160x144 grid"""
    x: int
    y: int
    terrain_type: str
    friction: float  # Movement friction multiplier (1.0 = normal, <1.0 = slow, >1.0 = fast)
    energy_drain: float  # Energy drain multiplier per second
    color: Tuple[int, int, int]  # Visual representation color


class TerrainType:
    """Terrain type definitions with genetic interactions"""
    
    LAND = "land"
    WATER = "water"
    ROUGH = "rough"
    
    @staticmethod
    def get_default_properties(terrain_type: str) -> Dict[str, Any]:
        """Get default properties for terrain type"""
        properties = {
            TerrainType.LAND: {
                'friction': 1.0,
                'energy_drain': 0.0,
                'color': (34, 139, 34),  # Forest green
                'description': 'Standard terrain with normal movement'
            },
            TerrainType.WATER: {
                'friction': 0.3,  # Very slow without swim trait
                'energy_drain': 0.5,  # Moderate energy drain
                'color': (64, 164, 223),  # Ocean blue
                'description': 'Water terrain - requires swim trait for efficient movement'
            },
            TerrainType.ROUGH: {
                'friction': 0.6,
                'energy_drain': 1.5,  # High energy drain
                'color': (139, 69, 19),  # Brown mud
                'description': 'Rough terrain - drains energy quickly'
            }
        }
        return properties.get(terrain_type, properties[TerrainType.LAND])


class TerrainEngine(BaseSystem):
    """
    Terrain Engine - Strategic Racing Environment
    
    Manages the 160x144 terrain grid that creates strategic variety
    for TurboShell racing. Different terrain types affect movement based on
    genetic traits, creating risk/reward scenarios.
    """
    
    def __init__(self):
        config = SystemConfig(
            system_id="terrain_engine",
            system_name="Terrain Engine",
            enabled=True,
            debug_mode=False,
            auto_register=True,
            update_interval=1.0 / 30.0,  # 30Hz updates (slower than physics)
            priority=5  # Lower priority than physics
        )
        super().__init__(config)
        
        # Terrain grid (160x144 sovereign resolution)
        self.width = 160
        self.height = 144
        self.terrain_grid: List[List[TerrainCell]] = []
        
        # Terrain generation parameters
        self.water_probability = 0.15  # 15% water
        self.rough_probability = 0.10  # 10% rough
        self.cluster_size = 3  # Terrain clustering
        
        # Performance tracking
        self.update_count = 0
        self.last_generation_seed = None
        
        # Initialize terrain
        self._initialize_terrain()
    
    def _on_initialize(self) -> Result[bool]:
        """Initialize the terrain engine"""
        try:
            self._generate_terrain()
            self._get_logger().info("🏞️ Terrain Engine initialized")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Terrain Engine initialization failed: {str(e)}")
    
    def _on_shutdown(self) -> Result[None]:
        """Shutdown the terrain engine"""
        try:
            self.terrain_grid.clear()
            self._get_logger().info("🏞️ Terrain Engine shutdown")
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Terrain Engine shutdown failed: {str(e)}")
    
    def _on_update(self, dt: float) -> Result[None]:
        """Update the terrain engine"""
        try:
            self.update_count += 1
            
            # Terrain is static, but we can update visual effects or dynamic elements
            # For now, terrain doesn't change during races
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Terrain Engine update failed: {str(e)}")
    
    def _initialize_terrain(self) -> None:
        """Initialize the terrain grid"""
        self.terrain_grid = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                cell = TerrainCell(
                    x=x,
                    y=y,
                    terrain_type=TerrainType.LAND,
                    friction=1.0,
                    energy_drain=0.0,
                    color=(34, 139, 34)
                )
                row.append(cell)
            self.terrain_grid.append(row)
    
    def _generate_terrain(self) -> None:
        """Generate terrain using procedural methods"""
        # Use random seed for reproducible generation
        seed = int(time.time() * 1000) % 1000000
        random.seed(seed)
        self.last_generation_seed = seed
        
        # Generate terrain clusters
        self._generate_terrain_clusters()
        
        # Smooth terrain edges
        self._smooth_terrain()
        
        # Add strategic features
        self._add_strategic_features()
        
        self._get_logger().info(f"🏞️ Terrain generated with seed {seed}")
    
    def _generate_terrain_clusters(self) -> None:
        """Generate clustered terrain features"""
        # Generate water clusters
        num_water_clusters = int(self.width * self.height * self.water_probability / 100)
        for _ in range(num_water_clusters):
            self._create_terrain_cluster(TerrainType.WATER)
        
        # Generate rough clusters
        num_rough_clusters = int(self.width * self.height * self.rough_probability / 100)
        for _ in range(num_rough_clusters):
            self._create_terrain_cluster(TerrainType.ROUGH)
    
    def _create_terrain_cluster(self, terrain_type: str) -> None:
        """Create a cluster of the specified terrain type"""
        # Random cluster center
        center_x = random.randint(self.cluster_size, self.width - self.cluster_size - 1)
        center_y = random.randint(self.cluster_size, self.height - self.cluster_size - 1)
        
        # Cluster size variation
        cluster_radius = random.randint(2, self.cluster_size + 2)
        
        # Apply terrain in cluster pattern
        for y in range(max(0, center_y - cluster_radius), 
                         min(self.height, center_y + cluster_radius + 1)):
            for x in range(max(0, center_x - cluster_radius), 
                             min(self.width, center_x + cluster_radius + 1)):
                
                # Distance from center
                distance = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
                
                # Apply terrain with probability based on distance
                if distance <= cluster_radius:
                    probability = 0.8 - (distance / cluster_radius) * 0.6  # 80% at center, 20% at edge
                    if random.random() < probability:
                        self._set_terrain_cell(x, y, terrain_type)
    
    def _smooth_terrain(self) -> None:
        """Smooth terrain edges to create more natural transitions"""
        # Simple cellular automaton smoothing
        new_grid = [row[:] for row in self.terrain_grid]
        
        for y in range(1, self.height - 1):
            for x in range(1, self.width - 1):
                # Count neighboring terrain types
                neighbors = {}
                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        if dx == 0 and dy == 0:
                            continue
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < self.width and 0 <= ny < self.height:
                            neighbor_type = self.terrain_grid[ny][nx].terrain_type
                            neighbors[neighbor_type] = neighbors.get(neighbor_type, 0) + 1
                
                # Find most common neighbor
                if neighbors:
                    most_common = max(neighbors, key=neighbors.get)
                    if neighbors[most_common] >= 3:  # At least 3 neighbors agree
                        new_grid[y][x].terrain_type = most_common
                        # Update properties
                        properties = TerrainType.get_default_properties(most_common)
                        new_grid[y][x].friction = properties['friction']
                        new_grid[y][x].energy_drain = properties['energy_drain']
                        new_grid[y][x].color = properties['color']
        
        self.terrain_grid = new_grid
    
    def _add_strategic_features(self) -> None:
        """Add strategic terrain features for racing"""
        # Create a straight racing path through the middle
        path_y = self.height // 2
        path_start = 10
        path_end = self.width - 10
        
        for x in range(path_start, path_end):
            # Clear path (land terrain)
            self._set_terrain_cell(x, path_y, TerrainType.LAND)
            
            # Add occasional obstacles along the path
            if random.random() < 0.1:  # 10% chance
                obstacle_type = random.choice([TerrainType.ROUGH, TerrainType.WATER])
                self._set_terrain_cell(x, path_y, obstacle_type)
        
        # Create start and finish zones
        # Start zone (clear land)
        for x in range(5, 15):
            for y in range(path_y - 5, path_y + 5):
                if 0 <= y < self.height:
                    self._set_terrain_cell(x, y, TerrainType.LAND)
        
        # Finish zone (clear land)
        for x in range(self.width - 15, self.width - 5):
            for y in range(path_y - 5, path_y + 5):
                if 0 <= y < self.height:
                    self._set_terrain_cell(x, y, TerrainType.LAND)
    
    def _set_terrain_cell(self, x: int, y: int, terrain_type: str) -> None:
        """Set terrain cell properties"""
        if 0 <= x < self.width and 0 <= y < self.height:
            properties = TerrainType.get_default_properties(terrain_type)
            self.terrain_grid[y][x].terrain_type = terrain_type
            self.terrain_grid[y][x].friction = properties['friction']
            self.terrain_grid[y][x].energy_drain = properties['energy_drain']
            self.terrain_grid[y][x].color = properties['color']
    
    def get_terrain_at(self, x: float, y: float) -> TerrainCell:
        """Get terrain at specific coordinates"""
        grid_x = int(x) % self.width
        grid_y = int(y) % self.height
        return self.terrain_grid[grid_y][grid_x]
    
    def get_terrain_at_position(self, position: Vector2) -> TerrainCell:
        """Get terrain at vector position"""
        return self.get_terrain_at(position.x, position.y)
    
    def apply_terrain_effects(self, entity: 'SovereignTurtle', dt: float) -> Dict[str, float]:
        """
        Apply terrain effects to entity based on genetics.
        
        Args:
            entity: SovereignTurtle entity
            dt: Time delta in seconds
            
        Returns:
            Dictionary of applied effects (friction, energy_drain)
        """
        try:
            # Get current terrain
            terrain = self.get_terrain_at_position(entity.position)
            
            # Base effects
            friction = terrain.friction
            energy_drain = terrain.energy_drain
            
            # Genetic interactions
            if terrain.terrain_type == TerrainType.WATER:
                # Check swim trait (derived from limb shape)
                swim_trait_bonus = {
                    'FINS': 2.0,      # Fins are best for swimming
                    'FLIPPERS': 1.2,   # Flippers are okay
                    'FEET': 0.5       # Feet are poor for swimming
                }.get(entity.genome.limb_shape.value, 1.0)
                
                # Apply swim bonus to friction
                friction *= swim_trait_bonus
                
                # Reduce energy drain for good swimmers
                if swim_trait_bonus > 1.5:
                    energy_drain *= 0.5  # Good swimmers use less energy
            
            elif terrain.terrain_type == TerrainType.ROUGH:
                # Check endurance trait for rough terrain
                endurance_bonus = entity.turtle_stats.endurance / 50.0  # Normalize to 0-2 range
                
                # Reduce energy drain for high endurance
                energy_drain *= max(0.3, 1.0 - endurance_bonus * 0.3)
                
                # Slightly improve friction for high endurance
                if endurance_bonus > 1.5:
                    friction *= 1.2
            
            # Apply energy drain
            energy_cost = energy_drain * dt
            entity.energy = max(0, entity.energy - energy_cost)
            
            return {
                'friction': friction,
                'energy_drain': energy_drain,
                'energy_cost': energy_cost
            }
            
        except Exception as e:
            self._get_logger().error(f"Failed to apply terrain effects: {e}")
            return {'friction': 1.0, 'energy_drain': 0.0, 'energy_cost': 0.0}
    
    def get_terrain_map(self) -> List[List[Tuple[int, int, int]]]:
        """
        Get terrain map as RGB color array for rendering.
        
        Returns:
            2D array of RGB tuples for visualization
        """
        return [[cell.color for cell in row] for row in self.terrain_grid]
    
    def get_terrain_statistics(self) -> Dict[str, Any]:
        """Get terrain statistics"""
        terrain_counts = {
            TerrainType.LAND: 0,
            TerrainType.WATER: 0,
            TerrainType.ROUGH: 0
        }
        
        for row in self.terrain_grid:
            for cell in row:
                terrain_counts[cell.terrain_type] += 1
        
        total_cells = self.width * self.height
        terrain_percentages = {
            terrain_type: (count / total_cells) * 100
            for terrain_type, count in terrain_counts.items()
        }
        
        return {
            'total_cells': total_cells,
            'terrain_counts': terrain_counts,
            'terrain_percentages': terrain_percentages,
            'generation_seed': self.last_generation_seed,
            'update_count': self.update_count
        }
    
    def regenerate_terrain(self, seed: Optional[int] = None) -> Result[None]:
        """
        Regenerate terrain with optional seed.
        
        Args:
            seed: Optional seed for reproducible generation
            
        Returns:
            Result indicating success
        """
        try:
            if seed is not None:
                random.seed(seed)
            
            self._generate_terrain()
            
            # Update registry with new terrain
            registry = DGTRegistry()
            terrain_map = self.get_terrain_map()
            
            registry.register(
                "terrain_map",
                terrain_map,
                RegistryType.COMPONENT,
                {
                    'width': self.width,
                    'height': self.height,
                    'generation_seed': self.last_generation_seed,
                    'statistics': self.get_terrain_statistics()
                }
            )
            
            self._get_logger().info(f"🏞️ Terrain regenerated with seed {seed}")
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to regenerate terrain: {str(e)}")


# === FACTORY FUNCTIONS ===

def create_terrain_engine() -> TerrainEngine:
    """Create a terrain engine instance"""
    return TerrainEngine()


def create_balanced_terrain() -> TerrainEngine:
    """Create terrain engine with balanced terrain distribution"""
    engine = TerrainEngine()
    engine.water_probability = 0.12  # Less water
    engine.rough_probability = 0.08  # Less rough
    engine._generate_terrain()
    return engine


def create_challenging_terrain() -> TerrainEngine:
    """Create terrain engine with challenging terrain distribution"""
    engine = TerrainEngine()
    engine.water_probability = 0.25  # More water
    engine.rough_probability = 0.20  # More rough
    engine._generate_terrain()
    return engine


# === EXPORTS ===

__all__ = [
    'TerrainCell',
    'TerrainType',
    'TerrainEngine',
    'create_terrain_engine',
    'create_balanced_terrain',
    'create_challenging_terrain'
]
