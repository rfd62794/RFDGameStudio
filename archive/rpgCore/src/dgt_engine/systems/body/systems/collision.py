"""
Collision System - Interface-Agnostic Collision Detection
Handles broad-phase and narrow-phase collision checks for any EntityProtocols
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass
from enum import Enum
import math
from loguru import logger

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from .entity_manager import Entity, EntityProtocol


class CollisionType(Enum):
    """Collision detection types"""
    CIRCLE = "circle"
    AABB = "aabb"  # Axis-Aligned Bounding Box
    PIXEL = "pixel"  # Pixel-perfect collision


@dataclass
class CollisionInfo:
    """Information about a collision"""
    entity_a: Entity
    entity_b: Entity
    collision_type: CollisionType
    distance: float
    penetration_depth: float
    collision_normal: Tuple[float, float]
    timestamp: float


@dataclass
class CollisionGroup:
    """Group of entities that can collide with each other"""
    name: str
    entity_types: Set[str]
    can_collide_with: Set[str]  # Other groups this can collide with
    
    def can_collide_with_entity(self, entity_type: str) -> bool:
        """Check if this group can collide with entity type"""
        return entity_type in self.can_collide_with


class CollisionSystem:
    """Interface-agnostic collision detection system"""
    
    def __init__(self):
        self.collision_groups: Dict[str, CollisionGroup] = {}
        self.collision_handlers: Dict[Tuple[str, str], callable] = {}
        self.active_collisions: List[CollisionInfo] = []
        self.collision_history: List[CollisionInfo] = []
        
        # Performance tracking
        self.checks_per_frame = 0
        self.collisions_per_frame = 0
        self.total_checks = 0
        self.total_collisions = 0
        
        logger.info("💥 CollisionSystem initialized")
    
    def register_collision_group(self, group: CollisionGroup) -> Result[bool]:
        """Register a collision group"""
        try:
            self.collision_groups[group.name] = group
            
            logger.info(f"✅ Registered collision group: {group.name}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to register collision group: {e}")
    
    def register_collision_handler(self, type_a: str, type_b: str, handler: callable) -> Result[bool]:
        """Register collision handler for entity types"""
        try:
            key = (type_a, type_b) if type_a <= type_b else (type_b, type_a)
            self.collision_handlers[key] = handler
            
            logger.info(f"✅ Registered collision handler: {type_a} <-> {type_b}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to register collision handler: {e}")
    
    def check_collisions(self, entities: List[Entity], current_time: float) -> List[CollisionInfo]:
        """Check all collisions between entities"""
        self.active_collisions.clear()
        self.checks_per_frame = 0
        self.collisions_per_frame = 0
        
        # Broad-phase: Group entities by type
        entities_by_type = {}
        for entity in entities:
            if not entity.active:
                continue
            
            if entity.entity_type not in entities_by_type:
                entities_by_type[entity.entity_type] = []
            entities_by_type[entity.entity_type].append(entity)
        
        # Check collisions between groups
        for group_name, group in self.collision_groups.items():
            for entity_type in group.entity_types:
                if entity_type not in entities_by_type:
                    continue
                
                entities_a = entities_by_type[entity_type]
                
                # Check against collidable types
                for collidable_type in group.can_collide_with:
                    if collidable_type not in entities_by_type:
                        continue
                    
                    entities_b = entities_by_type[collidable_type]
                    
                    # Skip if same type and already checked
                    if entity_type == collidable_type:
                        continue
                    
                    # Check collisions between these entity groups
                    collisions = self._check_entity_group_collisions(
                        entities_a, entities_b, current_time
                    )
                    self.active_collisions.extend(collisions)
        
        # Update statistics
        self.total_checks += self.checks_per_frame
        self.total_collisions += self.collisions_per_frame
        
        # Handle collisions
        self._handle_collisions()
        
        return self.active_collisions
    
    def _check_entity_group_collisions(self, entities_a: List[Entity], 
                                     entities_b: List[Entity], 
                                     current_time: float) -> List[CollisionInfo]:
        """Check collisions between two groups of entities"""
        collisions = []
        
        for entity_a in entities_a:
            for entity_b in entities_b:
                self.checks_per_frame += 1
                
                # Skip if either entity is inactive
                if not entity_a.active or not entity_b.active:
                    continue
                
                # Check collision
                collision_info = self._check_entity_collision(entity_a, entity_b, current_time)
                
                if collision_info:
                    collisions.append(collision_info)
                    self.collisions_per_frame += 1
        
        return collisions
    
    def _check_entity_collision(self, entity_a: Entity, entity_b: Entity, 
                              current_time: float) -> Optional[CollisionInfo]:
        """Check collision between two entities with precision sweep for bullets"""
        # Special handling for bullet-asteroid collisions (sweep test)
        if (entity_a.entity_type == "bullet" and entity_b.entity_type == "asteroid") or \
           (entity_a.entity_type == "asteroid" and entity_b.entity_type == "bullet"):
            
            bullet = entity_a if entity_a.entity_type == "bullet" else entity_b
            asteroid = entity_b if entity_b.entity_type == "asteroid" else entity_a
            
            # Sweep test for bullet - check if bullet path intersects asteroid
            if self._sweep_collision_test(bullet, asteroid, current_time):
                penetration_depth = (bullet.radius + asteroid.radius) - math.sqrt(
                    (bullet.x - asteroid.x)**2 + (bullet.y - asteroid.y)**2
                )
                
                # Calculate collision normal
                distance = math.sqrt((bullet.x - asteroid.x)**2 + (bullet.y - asteroid.y)**2)
                if distance > 0:
                    normal_x = (asteroid.x - bullet.x) / distance
                    normal_y = (asteroid.y - bullet.y) / distance
                else:
                    normal_x, normal_y = 1.0, 0.0
                
                return CollisionInfo(
                    entity_a=entity_a,
                    entity_b=entity_b,
                    collision_type=CollisionType.CIRCLE,
                    distance=distance,
                    penetration_depth=penetration_depth,
                    collision_normal=(normal_x, normal_y),
                    timestamp=current_time
                )
        
        # Standard circle collision for other cases
        distance = math.sqrt(
            (entity_a.x - entity_b.x)**2 + 
            (entity_a.y - entity_b.y)**2
        )
        
        collision_distance = entity_a.radius + entity_b.radius
        
        if distance < collision_distance:
            # Collision detected
            penetration_depth = collision_distance - distance
            
            # Calculate collision normal (from a to b)
            if distance > 0:
                normal_x = (entity_b.x - entity_a.x) / distance
                normal_y = (entity_b.y - entity_a.y) / distance
            else:
                # Entities at same position, use arbitrary normal
                normal_x, normal_y = 1.0, 0.0
            
            return CollisionInfo(
                entity_a=entity_a,
                entity_b=entity_b,
                collision_type=CollisionType.CIRCLE,
                distance=distance,
                penetration_depth=penetration_depth,
                collision_normal=(normal_x, normal_y),
                timestamp=current_time
            )
        
        return None
    
    def _sweep_collision_test(self, bullet: Entity, asteroid: Entity, current_time: float) -> bool:
        """Continuous collision detection for bullets - checks if bullet path intersects asteroid"""
        # Get bullet's previous position (estimate based on velocity)
        dt = 1.0 / 60.0  # Assume 60 FPS
        prev_x = bullet.x - bullet.vx * dt
        prev_y = bullet.y - bullet.vy * dt
        
        # Line segment from previous to current position
        line_start_x, line_start_y = prev_x, prev_y
        line_end_x, line_end_y = bullet.x, bullet.y
        
        # Check if line segment intersects asteroid circle
        return self._line_circle_intersection(
            line_start_x, line_start_y,
            line_end_x, line_end_y,
            asteroid.x, asteroid.y,
            asteroid.radius + bullet.radius
        )
    
    def _line_circle_intersection(self, x1: float, y1: float, x2: float, y2: float,
                                cx: float, cy: float, radius: float) -> bool:
        """Check if line segment intersects circle"""
        # Vector from line start to circle center
        dx = cx - x1
        dy = cy - y1
        
        # Line direction vector
        lx = x2 - x1
        ly = y2 - y1
        
        # Line length squared
        line_length_sq = lx * lx + ly * ly
        
        if line_length_sq == 0:
            # Line is a point
            distance_sq = dx * dx + dy * dy
            return distance_sq <= radius * radius
        
        # Project circle center onto line
        t = max(0, min(1, (dx * lx + dy * ly) / line_length_sq))
        
        # Closest point on line segment to circle center
        closest_x = x1 + t * lx
        closest_y = y1 + t * ly
        
        # Distance from closest point to circle center
        dist_x = cx - closest_x
        dist_y = cy - closest_y
        distance_sq = dist_x * dist_x + dist_y * dist_y
        
        return distance_sq <= radius * radius
    
    def _handle_collisions(self) -> None:
        """Handle all active collisions"""
        for collision in self.active_collisions:
            type_a = collision.entity_a.entity_type
            type_b = collision.entity_b.entity_type
            
            # Find collision handler
            key = (type_a, type_b) if type_a <= type_b else (type_b, type_a)
            
            if key in self.collision_handlers:
                handler = self.collision_handlers[key]
                
                try:
                    handler(collision)
                except Exception as e:
                    logger.error(f"Collision handler failed: {e}")
            
            # Add to history
            self.collision_history.append(collision)
            
            # Limit history size
            if len(self.collision_history) > 1000:
                self.collision_history = self.collision_history[-500:]
    
    def get_entities_in_radius(self, entities: List[Entity], center_x: float, 
                              center_y: float, radius: float) -> List[Entity]:
        """Get all entities within a radius"""
        entities_in_radius = []
        
        for entity in entities:
            if not entity.active:
                continue
            
            distance = math.sqrt(
                (entity.x - center_x)**2 + 
                (entity.y - center_y)**2
            )
            
            if distance <= radius:
                entities_in_radius.append(entity)
        
        return entities_in_radius
    
    def get_nearest_entity(self, entities: List[Entity], target_x: float, 
                          target_y: float, entity_type: Optional[str] = None) -> Optional[Entity]:
        """Get nearest entity to target position"""
        nearest_entity = None
        nearest_distance = float('inf')
        
        for entity in entities:
            if not entity.active:
                continue
            
            if entity_type and entity.entity_type != entity_type:
                continue
            
            distance = math.sqrt(
                (entity.x - target_x)**2 + 
                (entity.y - target_y)**2
            )
            
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_entity = entity
        
        return nearest_entity
    
    def line_of_sight(self, entities: List[Entity], start_x: float, start_y: float,
                     end_x: float, end_y: float, entity_type: Optional[str] = None) -> bool:
        """Check if there's a clear line of sight between two points"""
        # Simple implementation: check if any entity blocks the line
        line_length = math.sqrt((end_x - start_x)**2 + (end_y - start_y)**2)
        
        if line_length == 0:
            return True
        
        # Normalize direction
        dir_x = (end_x - start_x) / line_length
        dir_y = (end_y - start_y) / line_length
        
        # Check points along the line
        steps = int(line_length)
        for i in range(steps):
            check_x = start_x + dir_x * i
            check_y = start_y + dir_y * i
            
            # Check if any entity blocks this point
            for entity in entities:
                if not entity.active:
                    continue
                
                if entity_type and entity.entity_type != entity_type:
                    continue
                
                distance = math.sqrt(
                    (entity.x - check_x)**2 + 
                    (entity.y - check_y)**2
                )
                
                if distance < entity.radius:
                    return False
        
        return True
    
    def get_status(self) -> Dict[str, Any]:
        """Get collision system status"""
        return {
            'collision_groups': list(self.collision_groups.keys()),
            'collision_handlers': list(self.collision_handlers.keys()),
            'active_collisions': len(self.active_collisions),
            'collision_history_size': len(self.collision_history),
            'checks_per_frame': self.checks_per_frame,
            'collisions_per_frame': self.collisions_per_frame,
            'total_checks': self.total_checks,
            'total_collisions': self.total_collisions
        }


# Common collision handlers
def handle_bullet_asteroid_collision(collision: CollisionInfo) -> None:
    """Handle bullet-asteroid collision"""
    bullet = collision.entity_a
    asteroid = collision.entity_b
    
    # Determine which is which
    if bullet.entity_type != "bullet":
        bullet, asteroid = asteroid, bullet
    
    # Damage asteroid
    if hasattr(asteroid, 'health'):
        asteroid.health -= 1
        
        # Deactivate bullet
        bullet.deactivate()
        
        # Check if asteroid should be destroyed
        if asteroid.health <= 0:
            asteroid.deactivate()
    
    from loguru import logger
    logger.debug(f"💥 Bullet-asteroid collision: {bullet.id} -> {asteroid.id}")


def handle_ship_asteroid_collision(collision: CollisionInfo) -> None:
    """Handle ship-asteroid collision"""
    ship = collision.entity_a
    asteroid = collision.entity_b
    
    # Determine which is which
    if ship.entity_type != "ship":
        ship, asteroid = asteroid, ship
    
    # Damage ship
    if hasattr(ship, 'lives'):
        ship.lives -= 1
        
        # Set invulnerability
        if hasattr(ship, 'invulnerable_time'):
            ship.invulnerable_time = 3.0
    
    from loguru import logger
    logger.debug(f"💥 Ship-asteroid collision: {ship.id} <- {asteroid.id}")


def handle_ship_bullet_collision(collision: CollisionInfo) -> None:
    """Handle ship-bullet collision (friendly fire)"""
    # Usually disabled, but can be used for specific game modes
    pass


# Factory functions for common collision setups
def create_asteroids_collision_groups() -> Dict[str, CollisionGroup]:
    """Create collision groups for asteroids game"""
    return {
        "projectiles": CollisionGroup(
            name="projectiles",
            entity_types={"bullet"},
            can_collide_with={"asteroids"}
        ),
        "asteroids": CollisionGroup(
            name="asteroids", 
            entity_types={"asteroid"},
            can_collide_with={"ship", "projectiles"}
        ),
        "player": CollisionGroup(
            name="player",
            entity_types={"ship"},
            can_collide_with={"asteroids"}
        )
    }


def setup_asteroids_collision_handlers(collision_system: CollisionSystem) -> None:
    """Setup collision handlers for asteroids game"""
    collision_system.register_collision_handler("bullet", "asteroid", handle_bullet_asteroid_collision)
    collision_system.register_collision_handler("ship", "asteroid", handle_ship_asteroid_collision)
