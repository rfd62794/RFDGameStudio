"""
ProjectileSystem - Bullet Pool Management with Rhythmic Cadence
SRP: Manages bullet pool, cooldown, and projectile lifecycle
"""

import math
import time
from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass, field
from foundation.types import Result
from engines.body.components.kinetic_body import KineticBody, create_projectile


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
    Independent of game loop - handles its own timing.
    """
    
    def __init__(self, max_projectiles: int = 4, cooldown_ms: int = 150):
        """
        Initialize projectile system
        
        Args:
            max_projectiles: Maximum concurrent projectiles
            cooldown_ms: Cooldown between shots in milliseconds
        """
        self.max_projectiles = max_projectiles
        self.cooldown_seconds = cooldown_ms / 1000.0
        
        # Projectile management
        self.active_projectiles: List[Projectile] = []
        self.projectile_pool: List[Projectile] = []
        
        # Cooldown tracking per owner
        self.last_fire_time: Dict[str, float] = {}
        
        # Initialize pool
        self._initialize_pool()
        
    def _initialize_pool(self) -> None:
        """Pre-allocate projectile pool for performance"""
        for _ in range(self.max_projectiles):
            projectile = Projectile(
                kinetic_body=KineticBody(),  # Will be configured on use
                spawn_time=0.0,
                owner_id=""
            )
            self.projectile_pool.append(projectile)
    
    def can_fire(self, owner_id: str, current_time: float) -> bool:
        """
        Check if owner can fire based on cooldown and pool availability
        
        Args:
            owner_id: Unique identifier for the firing entity
            current_time: Current game time in seconds
            
        Returns:
            True if firing is allowed
        """
        # Check cooldown
        if owner_id in self.last_fire_time:
            time_since_last = current_time - self.last_fire_time[owner_id]
            if time_since_last < self.cooldown_seconds:
                return False
        
        # Check pool availability
        return len(self.active_projectiles) < self.max_projectiles
    
    def fire_projectile(self, 
                       owner_id: str,
                       start_x: float,
                       start_y: float,
                       angle: float,
                       current_time: float,
                       damage: float = 1.0,
                       speed: float = 300.0) -> Result[Projectile]:
        """
        Fire a new projectile if allowed
        
        Args:
            owner_id: Unique identifier for the firing entity
            start_x: Starting X position
            start_y: Starting Y position
            angle: Firing angle in radians
            current_time: Current game time in seconds
            damage: Damage dealt by this projectile
            speed: Projectile speed
            
        Returns:
            Result containing the fired projectile or error
        """
        if not self.can_fire(owner_id, current_time):
            return Result(success=False, error="Cannot fire: cooldown or pool limit")
        
        # Get projectile from pool
        if not self.projectile_pool:
            return Result(success=False, error="No projectiles available in pool")
        
        projectile = self.projectile_pool.pop()
        
        # Configure projectile
        projectile.kinetic_body = create_projectile(start_x, start_y, angle, speed)
        projectile.spawn_time = current_time
        projectile.owner_id = owner_id
        projectile.damage = damage
        
        # Add to active projectiles
        self.active_projectiles.append(projectile)
        
        # Update cooldown tracking
        self.last_fire_time[owner_id] = current_time
        
        return Result(success=True, value=projectile)
    
    def update(self, dt: float, current_time: float) -> List[Projectile]:
        """
        Update all active projectiles and return expired ones
        
        Args:
            dt: Time delta in seconds
            current_time: Current game time in seconds
            
        Returns:
            List of expired projectiles to be recycled
        """
        expired = []
        
        # Update physics for all projectiles
        for projectile in self.active_projectiles:
            projectile.kinetic_body.update(dt)
        
        # Find expired projectiles
        for projectile in self.active_projectiles[:]:  # Copy list to allow removal
            if projectile.is_expired(current_time):
                expired.append(projectile)
                self.active_projectiles.remove(projectile)
        
        # Return expired projectiles to pool
        for projectile in expired:
            self._return_to_pool(projectile)
        
        return expired
    
    def check_collisions(self, 
                        collision_check_func,
                        current_time: float) -> List[Tuple[Projectile, Any]]:
        """
        Check collisions using provided function
        
        Args:
            collision_check_func: Function that takes a projectile position
                                and returns collision data or None
            current_time: Current game time for cleanup
            
        Returns:
            List of (projectile, collision_data) tuples
        """
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
        """Get positions of all active projectiles for rendering"""
        return [proj.get_position() for proj in self.active_projectiles]
    
    def get_projectile_count(self, owner_id: Optional[str] = None) -> int:
        """
        Get count of active projectiles
        
        Args:
            owner_id: If provided, count only projectiles from this owner
            
        Returns:
            Number of active projectiles
        """
        if owner_id is None:
            return len(self.active_projectiles)
        
        return sum(1 for proj in self.active_projectiles if proj.owner_id == owner_id)
    
    def get_cooldown_remaining(self, owner_id: str, current_time: float) -> float:
        """
        Get remaining cooldown time for an owner
        
        Args:
            owner_id: Owner to check
            current_time: Current game time
            
        Returns:
            Remaining cooldown in seconds (0 if ready)
        """
        if owner_id not in self.last_fire_time:
            return 0.0
        
        time_since_last = current_time - self.last_fire_time[owner_id]
        remaining = self.cooldown_seconds - time_since_last
        
        return max(0.0, remaining)
    
    def clear_all(self) -> None:
        """Clear all active projectiles and return them to pool"""
        for projectile in self.active_projectiles:
            self._return_to_pool(projectile)
        
        self.active_projectiles.clear()
        self.last_fire_time.clear()
    
    def _return_to_pool(self, projectile: Projectile) -> None:
        """Return projectile to pool for reuse"""
        projectile.owner_id = ""
        projectile.spawn_time = 0.0
        projectile.damage = 1.0
        self.projectile_pool.append(projectile)
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics for debugging"""
        return {
            'active_projectiles': len(self.active_projectiles),
            'pool_size': len(self.projectile_pool),
            'max_projectiles': self.max_projectiles,
            'cooldown_ms': int(self.cooldown_seconds * 1000),
            'owners_tracked': len(self.last_fire_time)
        }


# Factory functions for common arcade configurations
def create_arcade_projectile_system() -> ProjectileSystem:
    """Create standard arcade projectile system (4 bullets, 150ms cooldown)"""
    return ProjectileSystem(max_projectiles=4, cooldown_ms=150)


def create_rapid_fire_system() -> ProjectileSystem:
    """Create rapid fire system (6 bullets, 100ms cooldown)"""
    return ProjectileSystem(max_projectiles=6, cooldown_ms=100)


def create_heavy_weapon_system() -> ProjectileSystem:
    """Create heavy weapon system (2 bullets, 500ms cooldown)"""
    return ProjectileSystem(max_projectiles=2, cooldown_ms=500)
