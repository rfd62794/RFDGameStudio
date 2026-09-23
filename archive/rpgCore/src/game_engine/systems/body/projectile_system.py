"""
Projectile System - Lifecycle Management for Fast-Moving Objects

Manages projectile pool, firing cooldowns, lifetime tracking, and collision detection.
Optimized for arcade and action games with high projectile throughput.

Features:
- Object pooling for memory efficiency
- Per-owner fire rate limiting (cooldown system)
- Automatic lifetime expiration
- Integration with collision system
- Factory functions for common configurations
"""

from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass
from enum import Enum

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result
from src.game_engine.systems.body.entity_manager import Entity, SpaceEntity


@dataclass
class ProjectileStats:
    """Statistics for a projectile"""
    owner_id: str
    spawn_time: float
    lifetime: float
    damage: float
    speed: float
    angle: float


class ProjectileState(Enum):
    """Projectile lifecycle states"""
    ACTIVE = "active"
    EXPIRED = "expired"
    RECYCLED = "recycled"


class ProjectileSystem(BaseSystem):
    """
    Manages projectile lifecycle, pooling, and firing rate limiting.
    Integrates with entity manager for efficient batch processing.
    """

    def __init__(self, config: Optional[SystemConfig] = None,
                 max_projectiles: int = 100,
                 default_cooldown_ms: int = 150):
        super().__init__(config or SystemConfig(name="ProjectileSystem"))
        self.max_projectiles = max_projectiles
        self.default_cooldown_seconds = default_cooldown_ms / 1000.0

        # Projectile management
        self.active_projectiles: List[SpaceEntity] = []
        self.projectile_pool: List[SpaceEntity] = []
        self.projectile_stats: Dict[str, ProjectileStats] = {}

        # Firing cooldown tracking per owner
        self.last_fire_time: Dict[str, float] = {}
        self.fire_cooldowns: Dict[str, float] = {}  # Per-owner custom cooldowns

        # Performance statistics
        self.total_fired = 0
        self.total_expired = 0

    def initialize(self) -> bool:
        """Initialize the projectile system"""
        self._initialize_pool()
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update projectile lifetimes"""
        if self.status != SystemStatus.RUNNING:
            return

        # Update active projectiles
        for projectile in self.active_projectiles:
            if hasattr(projectile, 'vx') and hasattr(projectile, 'x'):
                # Update position based on velocity
                projectile.x += projectile.vx * delta_time
                projectile.y += projectile.vy * delta_time

    def shutdown(self) -> None:
        """Shutdown the projectile system"""
        self.active_projectiles.clear()
        self.projectile_pool.clear()
        self.projectile_stats.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process projectile-related intents"""
        action = intent.get("action", "")

        if action == "fire":
            owner_id = intent.get("owner_id", "")
            x = intent.get("x", 0.0)
            y = intent.get("y", 0.0)
            angle = intent.get("angle", 0.0)
            current_time = intent.get("current_time", 0.0)
            damage = intent.get("damage", 1.0)
            speed = intent.get("speed", 300.0)

            result = self.fire_projectile(owner_id, x, y, angle, current_time, damage, speed)
            if result.success:
                return {"projectile_fired": True, "projectile_id": result.value.id}
            return {"projectile_fired": False, "error": result.error}

        elif action == "get_active_count":
            owner_id = intent.get("owner_id")
            count = self.get_active_count(owner_id)
            return {"active_count": count}

        elif action == "get_cooldown":
            owner_id = intent.get("owner_id", "")
            current_time = intent.get("current_time", 0.0)
            remaining = self.get_cooldown_remaining(owner_id, current_time)
            return {"cooldown_remaining": remaining}

        elif action == "get_stats":
            return self.get_status()

        else:
            return {"error": f"Unknown ProjectileSystem action: {action}"}

    def _initialize_pool(self) -> None:
        """Pre-allocate projectile pool"""
        for _ in range(self.max_projectiles):
            projectile = SpaceEntity()
            projectile.entity_type = "projectile"
            projectile.active = False
            self.projectile_pool.append(projectile)

    def can_fire(self, owner_id: str, current_time: float) -> bool:
        """Check if owner can fire based on cooldown and pool availability"""
        # Get owner's cooldown (use custom or default)
        cooldown = self.fire_cooldowns.get(owner_id, self.default_cooldown_seconds)

        # Check cooldown
        if owner_id in self.last_fire_time:
            time_since_last = current_time - self.last_fire_time[owner_id]
            if time_since_last < cooldown:
                return False

        # Check pool availability
        return len(self.active_projectiles) < self.max_projectiles

    def fire_projectile(self, owner_id: str, x: float, y: float, angle: float,
                       current_time: float, damage: float = 1.0,
                       speed: float = 300.0) -> Result[SpaceEntity]:
        """Fire a projectile from the pool"""
        if not self.can_fire(owner_id, current_time):
            return Result(success=False, error="Cannot fire: cooldown or pool limit exceeded")

        if not self.projectile_pool:
            return Result(success=False, error="No projectiles available in pool")

        # Get projectile from pool
        projectile = self.projectile_pool.pop()
        projectile.active = True
        projectile.entity_type = "projectile"

        # Set position
        projectile.x = x
        projectile.y = y

        # Set velocity from angle and speed
        import math
        projectile.vx = math.cos(angle) * speed
        projectile.vy = math.sin(angle) * speed
        projectile.angle = angle
        projectile.radius = 2.0  # Standard projectile radius

        # Track stats
        self.projectile_stats[projectile.id] = ProjectileStats(
            owner_id=owner_id,
            spawn_time=current_time,
            lifetime=2.0,  # Default 2 second lifetime
            damage=damage,
            speed=speed,
            angle=angle
        )

        # Add to active projectiles
        self.active_projectiles.append(projectile)

        # Update cooldown
        self.last_fire_time[owner_id] = current_time
        self.total_fired += 1

        return Result(success=True, value=projectile)

    def update_projectiles(self, current_time: float) -> List[SpaceEntity]:
        """Update all projectiles and return expired ones"""
        expired = []

        for projectile in self.active_projectiles[:]:
            if projectile.id not in self.projectile_stats:
                continue

            stats = self.projectile_stats[projectile.id]
            age = current_time - stats.spawn_time

            if age > stats.lifetime:
                expired.append(projectile)
                self.active_projectiles.remove(projectile)
                self._return_to_pool(projectile)
                self.total_expired += 1

        return expired

    def _return_to_pool(self, projectile: SpaceEntity) -> None:
        """Return projectile to pool for reuse"""
        if projectile.id in self.projectile_stats:
            del self.projectile_stats[projectile.id]

        projectile.active = False
        projectile.x = 0.0
        projectile.y = 0.0
        projectile.vx = 0.0
        projectile.vy = 0.0
        projectile.angle = 0.0

        self.projectile_pool.append(projectile)

    def get_active_count(self, owner_id: Optional[str] = None) -> int:
        """Get count of active projectiles"""
        if owner_id is None:
            return len(self.active_projectiles)

        return sum(1 for proj in self.active_projectiles
                  if proj.id in self.projectile_stats and
                  self.projectile_stats[proj.id].owner_id == owner_id)

    def get_active_projectiles(self) -> List[SpaceEntity]:
        """Get list of active projectiles"""
        return [p for p in self.active_projectiles if p.active]

    def get_cooldown_remaining(self, owner_id: str, current_time: float) -> float:
        """Get remaining cooldown time for owner"""
        if owner_id not in self.last_fire_time:
            return 0.0

        cooldown = self.fire_cooldowns.get(owner_id, self.default_cooldown_seconds)
        time_since_last = current_time - self.last_fire_time[owner_id]
        remaining = cooldown - time_since_last

        return max(0.0, remaining)

    def set_owner_cooldown(self, owner_id: str, cooldown_ms: int) -> None:
        """Set custom cooldown for specific owner"""
        self.fire_cooldowns[owner_id] = cooldown_ms / 1000.0

    def clear_all(self) -> None:
        """Clear all active projectiles"""
        for projectile in self.active_projectiles:
            self._return_to_pool(projectile)

        self.active_projectiles.clear()

    def get_status(self) -> Dict[str, Any]:
        """Get projectile system status"""
        return {
            'active_projectiles': len(self.active_projectiles),
            'pool_size': len(self.projectile_pool),
            'max_projectiles': self.max_projectiles,
            'default_cooldown_ms': int(self.default_cooldown_seconds * 1000),
            'total_fired': self.total_fired,
            'total_expired': self.total_expired,
            'tracked_owners': len(self.last_fire_time)
        }


# Factory functions for common configurations

def create_arcade_projectile_system() -> ProjectileSystem:
    """Create standard arcade projectile system (100 bullets, 150ms cooldown)"""
    return ProjectileSystem(max_projectiles=100, default_cooldown_ms=150)


def create_rapid_fire_system() -> ProjectileSystem:
    """Create rapid fire system (150 bullets, 100ms cooldown)"""
    return ProjectileSystem(max_projectiles=150, default_cooldown_ms=100)


def create_heavy_weapon_system() -> ProjectileSystem:
    """Create heavy weapon system (50 bullets, 500ms cooldown)"""
    return ProjectileSystem(max_projectiles=50, default_cooldown_ms=500)
