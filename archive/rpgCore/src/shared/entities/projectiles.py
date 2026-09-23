"""
ProjectileSystem - Bullet Pool Management with Rhythmic Cadence
SRP: Manages bullet pool, cooldown, and projectile lifecycle
"""

import math
from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass
from src.shared.entities.kinetics import KineticBody, create_projectile

@dataclass
class Projectile:
    """Individual projectile with lifecycle tracking"""
    kinetic_body: KineticBody
    spawn_time: float
    owner_id: str
    damage: float = 1.0
    lifetime: float = 2.0  # Seconds before auto-despawn
    
    def is_expired(self, current_time: float) -> bool:
        """Check if projectile has exceeded its lifetime"""
        return (current_time - self.spawn_time) > self.lifetime
    
    def get_position(self) -> Tuple[float, float]:
        """Get current position for collision detection"""
        return self.kinetic_body.get_position_tuple()


class ProjectileSystem:
    """
    Manages bullet pool and rhythmic firing with 150ms cadence.
    """
    
    def __init__(self, max_projectiles: int = 4, cooldown_ms: int = 150):
        self.max_projectiles = max_projectiles
        self.cooldown_seconds = cooldown_ms / 1000.0
        
        self.active_projectiles: List[Projectile] = []
        self.projectile_pool: List[Projectile] = []
        self.last_fire_time: Dict[str, float] = {}
        
        self._initialize_pool()
        
    def _initialize_pool(self) -> None:
        """Pre-allocate projectile pool"""
        for _ in range(self.max_projectiles):
            projectile = Projectile(
                kinetic_body=KineticBody(),
                spawn_time=0.0,
                owner_id=""
            )
            self.projectile_pool.append(projectile)
    
    def can_fire(self, owner_id: str, current_time: float) -> bool:
        if owner_id in self.last_fire_time:
            time_since_last = current_time - self.last_fire_time[owner_id]
            if time_since_last < self.cooldown_seconds:
                return False
        return len(self.active_projectiles) < self.max_projectiles
    
    def fire_projectile(self, 
                       owner_id: str,
                       start_x: float,
                       start_y: float,
                       angle: float,
                       current_time: float,
                       damage: float = 1.0,
                       speed: float = 300.0) -> Optional[Projectile]:
        if not self.can_fire(owner_id, current_time):
            return None
        
        if not self.projectile_pool:
            return None
        
        projectile = self.projectile_pool.pop()
        projectile.kinetic_body = create_projectile(start_x, start_y, angle, speed)
        projectile.spawn_time = current_time
        projectile.owner_id = owner_id
        projectile.damage = damage
        
        self.active_projectiles.append(projectile)
        self.last_fire_time[owner_id] = current_time
        
        return projectile
    
    def update(self, dt: float, current_time: float) -> List[Projectile]:
        expired = []
        for projectile in self.active_projectiles:
            projectile.kinetic_body.update(dt)
        
        for projectile in self.active_projectiles[:]:
            if projectile.is_expired(current_time):
                expired.append(projectile)
                self.active_projectiles.remove(projectile)
        
        for projectile in expired:
            self._return_to_pool(projectile)
        
        return expired
    
    def check_collisions(self, collision_check_func) -> List[Tuple[Projectile, Any]]:
        collisions = []
        for projectile in self.active_projectiles[:]:
            pos = projectile.get_position()
            collision_data = collision_check_func(pos)
            
            if collision_data is not None:
                collisions.append((projectile, collision_data))
                self.active_projectiles.remove(projectile)
                self._return_to_pool(projectile)
        return collisions
    
    def get_active_positions(self) -> List[Tuple[float, float]]:
        return [proj.get_position() for proj in self.active_projectiles]
    
    def clear_all(self) -> None:
        for projectile in self.active_projectiles:
            self._return_to_pool(projectile)
        self.active_projectiles.clear()
        self.last_fire_time.clear()
    
    def _return_to_pool(self, projectile: Projectile) -> None:
        projectile.owner_id = ""
        projectile.spawn_time = 0.0
        projectile.damage = 1.0
        self.projectile_pool.append(projectile)


def create_arcade_projectile_system() -> ProjectileSystem:
    return ProjectileSystem(max_projectiles=4, cooldown_ms=150)
