"""
FractureSystem - Genetic Asteroid Splitting Logic with Cascading Cleanup
SRP: Handles 1 -> 2 -> 4 rock splitting logic with genetic inheritance
"""

import math
import random
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from foundation.types import Result
from engines.body.components.kinetic_body import KineticBody, create_asteroid
from engines.body.components.genetic_component import GeneticComponent, create_random_asteroid_genetics


@dataclass
class AsteroidFragment:
    """Represents a genetically-enhanced asteroid fragment"""
    kinetic_body: KineticBody
    size: int  # 1 = small, 2 = medium, 3 = large
    health: int
    radius: float
    color: Tuple[int, int, int]
    point_value: int
    genetic_component: Optional[GeneticComponent] = None
    genetic_id: str = ""
    
    def get_position(self) -> Tuple[float, float]:
        """Get current position"""
        return self.kinetic_body.get_position_tuple()
    
    def take_damage(self, damage: float) -> bool:
        """Apply damage and return True if destroyed"""
        self.health -= damage
        return self.health <= 0
    
    def get_genetic_info(self) -> Dict[str, Any]:
        """Get genetic information for display"""
        if self.genetic_component:
            return self.genetic_component.get_genetic_info()
        return {'genetic_id': self.genetic_id, 'traits': 'None'}
    
    def apply_genetic_modifiers(self) -> Result[Dict[str, float]]:
        """Apply genetic modifications to kinetic body"""
        if not self.genetic_component:
            return Result(success=True, value={})
        
        return self.genetic_component.apply_to_kinetic_body(self.kinetic_body)


class FractureSystem:
    """
    Handles asteroid splitting with genetic inheritance and cascading cleanup logic.
    Implements the classic 1->2->4 fracture pattern with genetic evolution.
    """
    
    def __init__(self, enable_genetics: bool = True):
        """
        Initialize fracture system with size configurations
        
        Args:
            enable_genetics: Whether to enable genetic inheritance
        """
        self.enable_genetics = enable_genetics
        
        # Size configurations: size -> (radius, health, points, color)
        self.size_configs = {
            3: {  # Large asteroid
                'radius': 8.0,
                'health': 3,
                'points': 20,
                'color': (170, 170, 170),  # Grey
                'split_count': 2,
                'split_into_size': 2
            },
            2: {  # Medium asteroid
                'radius': 4.0,
                'health': 2,
                'points': 50,
                'color': (192, 192, 192),  # Light grey
                'split_count': 2,
                'split_into_size': 1
            },
            1: {  # Small asteroid
                'radius': 2.0,
                'health': 1,
                'points': 100,
                'color': (224, 224, 224),  # Very light grey
                'split_count': 0,  # Small asteroids don't split
                'split_into_size': 0
            }
        }
        
        # Physics parameters for fragment behavior
        self.fragment_speed_range = (15.0, 40.0)  # Speed range for new fragments
        self.scatter_angle_range = math.pi / 3  # 60 degree scatter cone
        
        # Genetic tracking
        self.discovered_genetic_patterns: Dict[str, GeneticComponent] = {}
        self.genetic_lineage: Dict[str, List[str]] = {}  # parent -> children mapping
        
    def fracture_asteroid(self, 
                          asteroid: AsteroidFragment,
                          impact_angle: Optional[float] = None) -> Result[List[AsteroidFragment]]:
        """
        Fracture an asteroid into smaller pieces with genetic inheritance
        
        Args:
            asteroid: The asteroid to fracture
            impact_angle: Angle of impact (affects scatter direction)
            
        Returns:
            Result containing list of new fragments or error
        """
        config = self.size_configs.get(asteroid.size)
        
        if config['split_count'] == 0:
            # Small asteroid - no fragments, just destroy
            return Result(success=True, value=[])
        
        # Create fragments
        fragments = []
        parent_pos = asteroid.get_position()
        parent_velocity = asteroid.kinetic_body.state.velocity
        
        # Track genetic lineage
        parent_genetic_id = asteroid.genetic_id
        
        # Determine scatter direction
        if impact_angle is not None:
            base_angle = impact_angle
        else:
            base_angle = random.uniform(0, 2 * math.pi)
        
        # Generate fragments
        for i in range(config['split_count']):
            # Calculate scatter angle for this fragment
            angle_offset = (i - config['split_count'] / 2) * (self.scatter_angle_range / config['split_count'])
            scatter_angle = base_angle + angle_offset
            
            # Calculate fragment velocity
            speed = random.uniform(*self.fragment_speed_range)
            fragment_velocity = parent_velocity * 0.5  # Inherit some parent momentum
            
            # Add scatter velocity
            scatter_velocity_x = math.cos(scatter_angle) * speed
            scatter_velocity_y = math.sin(scatter_angle) * speed
            
            final_velocity_x = fragment_velocity.x + scatter_velocity_x
            final_velocity_y = fragment_velocity.y + scatter_velocity_y
            
            # Handle genetic inheritance
            fragment_genetic_component = None
            fragment_genetic_id = f"{parent_genetic_id}_frag{i+1}"
            
            if self.enable_genetics and asteroid.genetic_component:
                # Evolve genetics for fragment
                fragment_genetic_component = asteroid.genetic_component.evolve()
                fragment_genetic_id = fragment_genetic_component.genetic_code.genetic_id
                
                # Track lineage
                if parent_genetic_id not in self.genetic_lineage:
                    self.genetic_lineage[parent_genetic_id] = []
                self.genetic_lineage[parent_genetic_id].append(fragment_genetic_id)
                
                # Store discovered pattern
                self.discovered_genetic_patterns[fragment_genetic_id] = fragment_genetic_component
            
            # Create fragment
            fragment = self._create_fragment(
                size=config['split_into_size'],
                x=parent_pos[0],
                y=parent_pos[1],
                vx=final_velocity_x,
                vy=final_velocity_y,
                genetic_component=fragment_genetic_component,
                genetic_id=fragment_genetic_id
            )
            
            fragments.append(fragment)
        
        return Result(success=True, value=fragments)
    
    def _create_fragment(self, 
                        size: int, 
                        x: float, 
                        y: float, 
                        vx: float, 
                        vy: float,
                        genetic_component: Optional[GeneticComponent] = None,
                        genetic_id: str = "") -> AsteroidFragment:
        """Create a new asteroid fragment with genetic traits"""
        config = self.size_configs[size]
        
        # Add slight position offset to prevent overlap
        offset_x = random.uniform(-2, 2)
        offset_y = random.uniform(-2, 2)
        
        kinetic_body = create_asteroid(x + offset_x, y + offset_y, vx, vy)
        
        # Apply genetic modifications if present
        if genetic_component:
            genetic_result = genetic_component.apply_to_kinetic_body(kinetic_body)
            if genetic_result.success:
                # Modify color based on genetics
                base_color = config['color']
                modified_color = genetic_component.get_modified_color(base_color)
                
                # Modify size based on genetics
                modified_radius = config['radius'] * genetic_component.traits.size_modifier
            else:
                # Fallback to base values if genetic application fails
                modified_color = config['color']
                modified_radius = config['radius']
        else:
            modified_color = config['color']
            modified_radius = config['radius']
        
        return AsteroidFragment(
            kinetic_body=kinetic_body,
            size=size,
            health=config['health'],
            radius=modified_radius,
            color=modified_color,
            point_value=config['points'],
            genetic_component=genetic_component,
            genetic_id=genetic_id
        )
    
    def create_initial_asteroids(self, count: int, 
                                safe_zone: Optional[Tuple[float, float, float]] = None) -> List[AsteroidFragment]:
        """
        Create initial asteroids for a wave with genetic traits
        
        Args:
            count: Number of asteroids to create
            safe_zone: (x, y, radius) - area to avoid spawning asteroids
            
        Returns:
            List of created asteroids
        """
        asteroids = []
        
        for i in range(count):
            # Random position (avoiding safe zone if specified)
            if safe_zone:
                x, y = self._find_safe_position(safe_zone)
            else:
                x = random.uniform(20, 140)  # SOVEREIGN_WIDTH - 20
                y = random.uniform(20, 124)  # SOVEREIGN_HEIGHT - 20
            
            # Random velocity
            vx = random.uniform(-30, 30)
            vy = random.uniform(-30, 30)
            
            # Random size (favor larger asteroids initially)
            size_weights = [3, 3, 2, 2, 1]  # More large/medium asteroids
            size = random.choice(size_weights)
            
            # Create genetic component if enabled
            genetic_component = None
            genetic_id = f"asteroid_{i}_{random.randint(1000, 9999)}"
            
            if self.enable_genetics:
                genetic_component = create_random_asteroid_genetics()
                genetic_id = genetic_component.genetic_code.genetic_id
                
                # Store discovered pattern
                self.discovered_genetic_patterns[genetic_id] = genetic_component
            
            asteroid = self._create_fragment(
                size, x, y, vx, vy, 
                genetic_component=genetic_component,
                genetic_id=genetic_id
            )
            asteroids.append(asteroid)
        
        return asteroids
    
    def _find_safe_position(self, safe_zone: Tuple[float, float, float]) -> Tuple[float, float]:
        """Find a position outside the safe zone"""
        safe_x, safe_y, safe_radius = safe_zone
        max_attempts = 50
        
        for _ in range(max_attempts):
            x = random.uniform(20, 140)
            y = random.uniform(20, 124)
            
            # Check if position is outside safe zone
            distance = math.sqrt((x - safe_x)**2 + (y - safe_y)**2)
            if distance > safe_radius + 10:  # Add buffer
                return x, y
        
        # Fallback: spawn at edge of screen
        edge_positions = [
            (20, random.uniform(20, 124)),
            (140, random.uniform(20, 124)),
            (random.uniform(20, 140), 20),
            (random.uniform(20, 140), 124)
        ]
        return random.choice(edge_positions)
    
    def update_asteroids(self, asteroids: List[AsteroidFragment], dt: float) -> None:
        """
        Update physics for all asteroids
        
        Args:
            asteroids: List of asteroids to update
            dt: Time delta in seconds
        """
        for asteroid in asteroids:
            asteroid.kinetic_body.update(dt)
    
    def get_total_points(self, asteroids: List[AsteroidFragment]) -> int:
        """Calculate total point value of all asteroids"""
        return sum(asteroid.point_value for asteroid in asteroids)
    
    def get_size_distribution(self, asteroids: List[AsteroidFragment]) -> Dict[int, int]:
        """Get distribution of asteroid sizes"""
        distribution = {1: 0, 2: 0, 3: 0}
        for asteroid in asteroids:
            distribution[asteroid.size] += 1
        return distribution
    
    def should_spawn_new_wave(self, asteroids: List[AsteroidFragment]) -> bool:
        """Check if all asteroids are destroyed (wave complete)"""
        return len(asteroids) == 0
    
    def calculate_wave_difficulty(self, wave_number: int) -> Dict[str, Any]:
        """
        Calculate difficulty parameters for a wave
        
        Args:
            wave_number: Current wave number (1-based)
            
        Returns:
            Dictionary with difficulty parameters
        """
        # Progressive difficulty
        base_asteroids = 4
        asteroids_per_wave = 2
        
        asteroid_count = min(base_asteroids + (wave_number - 1) * asteroids_per_wave, 12)
        
        # Increase speed with waves
        speed_multiplier = 1.0 + (wave_number - 1) * 0.1
        
        # Favor smaller asteroids in later waves
        size_weights = [
            [3, 3, 2, 2, 1],      # Wave 1-2
            [3, 2, 2, 1, 1],      # Wave 3-4
            [2, 2, 1, 1, 1],      # Wave 5-6
            [2, 1, 1, 1, 1],      # Wave 7+
        ]
        
        weight_index = min((wave_number - 1) // 2, len(size_weights) - 1)
        
        return {
            'asteroid_count': asteroid_count,
            'speed_multiplier': speed_multiplier,
            'size_weights': size_weights[weight_index]
        }
    
    def get_discovered_patterns(self) -> Dict[str, GeneticComponent]:
        """Get all discovered genetic patterns"""
        return self.discovered_genetic_patterns.copy()
    
    def get_genetic_lineage(self) -> Dict[str, List[str]]:
        """Get genetic lineage mapping"""
        return self.genetic_lineage.copy()
    
    def get_pattern_analytics(self) -> Dict[str, Any]:
        """Get analytics about discovered genetic patterns"""
        if not self.discovered_genetic_patterns:
            return {
                'total_patterns': 0,
                'generations': {},
                'trait_distribution': {},
                'color_variety': {}
            }
        
        generations = {}
        trait_stats = {
            'speed': [],
            'mass': [],
            'thrust': [],
            'rotation': [],
            'friction': [],
            'aggression': [],
            'curiosity': [],
            'herd': []
        }
        colors = []
        
        for genetic_id, component in self.discovered_genetic_patterns.items():
            gen = component.genetic_code.generation
            generations[gen] = generations.get(gen, 0) + 1
            
            traits = component.genetic_code.traits
            trait_stats['speed'].append(traits.speed_modifier)
            trait_stats['mass'].append(traits.mass_modifier)
            trait_stats['thrust'].append(traits.thrust_efficiency)
            trait_stats['rotation'].append(traits.rotation_speed)
            trait_stats['friction'].append(traits.friction_modifier)
            trait_stats['aggression'].append(traits.aggression)
            trait_stats['curiosity'].append(traits.curiosity)
            trait_stats['herd'].append(traits.herd_mentality)
            
            colors.append(traits.color_shift)
        
        # Calculate averages
        trait_averages = {}
        for trait, values in trait_stats.items():
            if values:
                trait_averages[trait] = sum(values) / len(values)
            else:
                trait_averages[trait] = 1.0
        
        return {
            'total_patterns': len(self.discovered_genetic_patterns),
            'generations': generations,
            'trait_averages': trait_averages,
            'max_generation': max(generations.keys()) if generations else 1,
            'color_variety': len(set(colors)),
            'lineage_depth': self._calculate_lineage_depth()
        }
    
    def _calculate_lineage_depth(self) -> int:
        """Calculate maximum depth of genetic lineage"""
        max_depth = 0
        visited = set()
        
        def calculate_depth(genetic_id: str, depth: int = 0) -> int:
            if genetic_id in visited:
                return depth
            visited.add(genetic_id)
            
            children = self.genetic_lineage.get(genetic_id, [])
            if not children:
                return depth
            
            return max(calculate_depth(child, depth + 1) for child in children)
        
        for genetic_id in self.discovered_genetic_patterns.keys():
            max_depth = max(max_depth, calculate_depth(genetic_id))
        
        return max_depth


# Factory functions for common configurations
def create_classic_fracture_system() -> FractureSystem:
    """Create classic arcade fracture system without genetics"""
    return FractureSystem(enable_genetics=False)


def create_genetic_fracture_system() -> FractureSystem:
    """Create genetic fracture system with evolution enabled"""
    return FractureSystem(enable_genetics=True)


def create_hard_fracture_system() -> FractureSystem:
    """Create harder fracture system with more fragments"""
    system = FractureSystem(enable_genetics=True)
    system.fragment_speed_range = (25.0, 60.0)  # Faster fragments
    return system
