"""
FractureSystem - Classic Asteroid Splitting Logic
SRP: Handles 1 -> 2 -> 4 rock splitting logic
"""

import math
import random
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from src.shared.entities.kinetics import KineticBody, create_asteroid

@dataclass
class AsteroidFragment:
    """Represents an asteroid fragment"""
    kinetic_body: KineticBody
    size: int  # 1 = small, 2 = medium, 3 = large
    health: int
    radius: float
    color: Tuple[int, int, int]
    point_value: int
    
    def get_position(self) -> Tuple[float, float]:
        return self.kinetic_body.get_position_tuple()


class FractureSystem:
    """
    Handles asteroid splitting.
    Implements the classic 1->2->4 fracture pattern.
    """
    
    def __init__(self):
        # Size configurations: size -> (radius, health, points, color)
        self.size_configs = {
            3: {  # Large
                'radius': 8.0,
                'health': 1,
                'points': 20,
                'color': (170, 170, 170),
                'split_count': 2,
                'split_into_size': 2
            },
            2: {  # Medium
                'radius': 4.0,
                'health': 1,
                'points': 50,
                'color': (192, 192, 192),
                'split_count': 2,
                'split_into_size': 1
            },
            1: {  # Small
                'radius': 2.0,
                'health': 1,
                'points': 100,
                'color': (224, 224, 224),
                'split_count': 0,
                'split_into_size': 0
            }
        }
        
        self.fragment_speed_range = (15.0, 40.0)
        self.scatter_angle_range = math.pi / 3

    def fracture_asteroid(self, 
                          asteroid: AsteroidFragment,
                          impact_angle: Optional[float] = None) -> List[AsteroidFragment]:
        config = self.size_configs.get(asteroid.size)
        if config['split_count'] == 0:
            return []
        
        fragments = []
        parent_pos = asteroid.get_position()
        parent_velocity = asteroid.kinetic_body.state.velocity
        
        if impact_angle is not None:
            base_angle = impact_angle
        else:
            base_angle = random.uniform(0, 2 * math.pi)
        
        for i in range(config['split_count']):
            angle_offset = (i - config['split_count'] / 2) * (self.scatter_angle_range / config['split_count'])
            scatter_angle = base_angle + angle_offset
            
            speed = random.uniform(*self.fragment_speed_range)
            fragment_velocity = parent_velocity * 0.5
            
            scatter_velocity_x = math.cos(scatter_angle) * speed
            scatter_velocity_y = math.sin(scatter_angle) * speed
            
            final_velocity_x = fragment_velocity.x + scatter_velocity_x
            final_velocity_y = fragment_velocity.y + scatter_velocity_y
            
            fragment = self._create_fragment(
                size=config['split_into_size'],
                x=parent_pos[0],
                y=parent_pos[1],
                vx=final_velocity_x,
                vy=final_velocity_y
            )
            fragments.append(fragment)
        
        return fragments
    
    def _create_fragment(self, 
                        size: int, 
                        x: float, 
                        y: float, 
                        vx: float, 
                        vy: float) -> AsteroidFragment:
        config = self.size_configs[size]
        offset_x = random.uniform(-2, 2)
        offset_y = random.uniform(-2, 2)
        
        kinetic_body = create_asteroid(x + offset_x, y + offset_y, vx, vy)
        
        return AsteroidFragment(
            kinetic_body=kinetic_body,
            size=size,
            health=config['health'],
            radius=config['radius'],
            color=config['color'],
            point_value=config['points']
        )
    
    def create_initial_asteroids(self, count: int, 
                                 bounds: Tuple[int, int] = (160, 144),
                                 safe_zone: Optional[Tuple[float, float, float]] = None) -> List[AsteroidFragment]:
        asteroids = []
        for _ in range(count):
            if safe_zone:
                x, y = self._find_safe_position(bounds, safe_zone)
            else:
                x = random.uniform(20, bounds[0] - 20)
                y = random.uniform(20, bounds[1] - 20)
            
            vx = random.uniform(-30, 30)
            vy = random.uniform(-30, 30)
            size = random.choice([3, 3, 2, 2, 1])
            
            asteroid = self._create_fragment(size, x, y, vx, vy)
            asteroids.append(asteroid)
        return asteroids
    
    def _find_safe_position(self, bounds: Tuple[int, int], safe_zone: Tuple[float, float, float]) -> Tuple[float, float]:
        safe_x, safe_y, safe_radius = safe_zone
        for _ in range(50):
            x = random.uniform(20, bounds[0] - 20)
            y = random.uniform(20, bounds[1] - 20)
            distance = math.sqrt((x - safe_x)**2 + (y - safe_y)**2)
            if distance > safe_radius + 10:
                return x, y
        return (20, 20)


def create_classic_fracture_system() -> FractureSystem:
    return FractureSystem()
