"""
Asteroids Spawner
SRP: Wave management and asteroid fracturing
"""
import random
from typing import List, Tuple, Optional
from src.apps.asteroids.entities.asteroid import Asteroid
from src.shared.entities.fracture import FractureSystem, AsteroidFragment

class Spawner:
    """Manages wave spawning and fracturing"""
    
    def __init__(self, bounds: Tuple[int, int] = (160, 144)):
        self.bounds = bounds
        self.fracture_system = FractureSystem()

    def spawn_wave(self, count: int, safe_zone: Optional[Tuple[float, float, float]] = None) -> List[Asteroid]:
        """Spawn initial wave of asteroids"""
        fragments = self.fracture_system.create_initial_asteroids(count, self.bounds, safe_zone)
        return [self._to_entity(f) for f in fragments]

    def fracture(self, asteroid: Asteroid) -> List[Asteroid]:
        """Split asteroid into smaller fragments"""
        # Convert back to fragment for fracture system
        f = AsteroidFragment(
            kinetic_body=asteroid.kinetics,
            size=asteroid.size,
            health=1,
            radius=asteroid.radius,
            color=asteroid.color,
            point_value=asteroid.point_value
        )
        new_fragments = self.fracture_system.fracture_asteroid(f)
        return [self._to_entity(nf) for nf in new_fragments]

    def _to_entity(self, fragment: AsteroidFragment) -> Asteroid:
        return Asteroid(
            kinetics=fragment.kinetic_body,
            size=fragment.size,
            radius=fragment.radius,
            color=fragment.color,
            point_value=fragment.point_value
        )
