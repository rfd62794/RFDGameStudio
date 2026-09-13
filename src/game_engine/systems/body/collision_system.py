"""
Collision System - Interface-Agnostic Collision Detection

Handles broad-phase and narrow-phase collision detection with support for:
- Circle-based collision detection
- Sweep testing for fast-moving objects (bullets)
- Group-based collision management
- Customizable collision handlers
"""

from typing import Dict, List, Any, Optional, Tuple, Set, Callable
from dataclasses import dataclass
from enum import Enum
import math

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result
from src.game_engine.systems.body.entity_manager import Entity


class CollisionType(Enum):
    """Collision detection types"""
    CIRCLE = "circle"
    AABB = "aabb"  # Axis-Aligned Bounding Box
    PIXEL = "pixel"  # Pixel-perfect collision


@dataclass
class CollisionInfo:
    """Information about a collision event"""
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


class CollisionSystem(BaseSystem):
    """Interface-agnostic collision detection system"""

    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config or SystemConfig(name="CollisionSystem"))
        self.collision_groups: Dict[str, CollisionGroup] = {}
        self.collision_handlers: Dict[Tuple[str, str], Callable] = {}
        self.active_collisions: List[CollisionInfo] = []
        self.collision_history: List[CollisionInfo] = []

        # Performance tracking
        self.checks_per_frame = 0
        self.collisions_per_frame = 0
        self.total_checks = 0
        self.total_collisions = 0

    def initialize(self) -> bool:
        """Initialize the collision system"""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update collision detection (should be called each frame)"""
        if self.status != SystemStatus.RUNNING:
            return
        # Collision checking is done on-demand via check_collisions()

    def shutdown(self) -> None:
        """Shutdown the collision system"""
        self.collision_groups.clear()
        self.collision_handlers.clear()
        self.active_collisions.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process collision-related intents"""
        action = intent.get("action", "")

        if action == "register_group":
            group_data = intent.get("group", {})
            group = CollisionGroup(
                name=group_data.get("name", ""),
                entity_types=set(group_data.get("entity_types", [])),
                can_collide_with=set(group_data.get("can_collide_with", []))
            )
            result = self.register_collision_group(group)
            return {"success": result.success, "error": result.error if not result.success else None}

        elif action == "check_collisions":
            entities = intent.get("entities", [])
            current_time = intent.get("current_time", 0.0)
            collisions = self.check_collisions(entities, current_time)
            return {"collisions": len(collisions), "collision_details": [
                {
                    "entity_a_id": c.entity_a.id,
                    "entity_b_id": c.entity_b.id,
                    "distance": c.distance,
                    "penetration": c.penetration_depth
                }
                for c in collisions
            ]}

        elif action == "get_status":
            return self.get_status()

        else:
            return {"error": f"Unknown CollisionSystem action: {action}"}

    def register_collision_group(self, group: CollisionGroup) -> Result[bool]:
        """Register a collision group"""
        try:
            self.collision_groups[group.name] = group
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to register collision group: {e}")

    def register_collision_handler(self, type_a: str, type_b: str, handler: Callable) -> Result[bool]:
        """Register collision handler for entity types"""
        try:
            key = (type_a, type_b) if type_a <= type_b else (type_b, type_a)
            self.collision_handlers[key] = handler
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to register collision handler: {e}")

    def check_collisions(self, entities: List[Entity], current_time: float) -> List[CollisionInfo]:
        """Check all collisions between entities"""
        self.active_collisions.clear()
        self.checks_per_frame = 0
        self.collisions_per_frame = 0

        # Broad-phase: Group entities by type
        entities_by_type: Dict[str, List[Entity]] = {}
        for entity in entities:
            if not entity.active:
                continue

            if entity.entity_type not in entities_by_type:
                entities_by_type[entity.entity_type] = []
            entities_by_type[entity.entity_type].append(entity)

        # Check collisions between groups
        for group in self.collision_groups.values():
            for entity_type in group.entity_types:
                if entity_type not in entities_by_type:
                    continue

                entities_a = entities_by_type[entity_type]

                # Check against collidable types
                for collidable_type in group.can_collide_with:
                    if collidable_type not in entities_by_type:
                        continue

                    entities_b = entities_by_type[collidable_type]

                    # Skip if same type (would need self-collision check separately)
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
        """Check collision between two entities with sweep test for fast objects"""
        # Special handling for projectile collisions (sweep test)
        if (entity_a.entity_type == "bullet" and entity_b.entity_type in ["asteroid", "enemy"]) or \
           (entity_b.entity_type == "bullet" and entity_a.entity_type in ["asteroid", "enemy"]):

            bullet = entity_a if entity_a.entity_type == "bullet" else entity_b
            target = entity_b if entity_a.entity_type == "bullet" else entity_a

            # Sweep test for bullet
            if self._sweep_collision_test(bullet, target, current_time):
                return self._create_collision_info(bullet, target, current_time)

        # Standard circle collision
        return self._check_circle_collision(entity_a, entity_b, current_time)

    def _check_circle_collision(self, entity_a: Entity, entity_b: Entity,
                               current_time: float) -> Optional[CollisionInfo]:
        """Check standard circle collision"""
        if not (hasattr(entity_a, 'x') and hasattr(entity_b, 'x')):
            return None

        distance = math.sqrt(
            (entity_a.x - entity_b.x) ** 2 +
            (entity_a.y - entity_b.y) ** 2
        )

        collision_distance = entity_a.radius + entity_b.radius

        if distance < collision_distance:
            return self._create_collision_info(entity_a, entity_b, current_time, distance)

        return None

    def _create_collision_info(self, entity_a: Entity, entity_b: Entity, current_time: float,
                              distance: Optional[float] = None) -> CollisionInfo:
        """Create collision info from two entities"""
        if distance is None:
            distance = math.sqrt(
                (entity_a.x - entity_b.x) ** 2 +
                (entity_a.y - entity_b.y) ** 2
            )

        collision_distance = entity_a.radius + entity_b.radius
        penetration_depth = collision_distance - distance

        # Calculate collision normal
        if distance > 0:
            normal_x = (entity_b.x - entity_a.x) / distance
            normal_y = (entity_b.y - entity_a.y) / distance
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

    def _sweep_collision_test(self, bullet: Entity, target: Entity, current_time: float) -> bool:
        """Continuous collision detection for fast-moving objects"""
        if not (hasattr(bullet, 'vx') and hasattr(target, 'x')):
            return False

        # Estimate previous position based on velocity
        dt = 1.0 / 60.0  # Assume 60 FPS
        prev_x = bullet.x - bullet.vx * dt
        prev_y = bullet.y - bullet.vy * dt

        # Check if line segment from prev to current intersects target circle
        return self._line_circle_intersection(
            prev_x, prev_y,
            bullet.x, bullet.y,
            target.x, target.y,
            target.radius + bullet.radius
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
        """Handle all active collisions via registered handlers"""
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
                    pass  # Silently fail to avoid breaking collision loop

            # Add to history
            self.collision_history.append(collision)

            # Limit history size
            if len(self.collision_history) > 1000:
                self.collision_history = self.collision_history[-500:]

    def get_entities_in_radius(self, entities: List[Entity], center_x: float,
                              center_y: float, radius: float) -> List[Entity]:
        """Get all entities within a radius (spatial query)"""
        entities_in_radius = []

        for entity in entities:
            if not entity.active or not hasattr(entity, 'x'):
                continue

            distance = math.sqrt(
                (entity.x - center_x) ** 2 +
                (entity.y - center_y) ** 2
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
            if not entity.active or not hasattr(entity, 'x'):
                continue

            if entity_type and entity.entity_type != entity_type:
                continue

            distance = math.sqrt(
                (entity.x - target_x) ** 2 +
                (entity.y - target_y) ** 2
            )

            if distance < nearest_distance:
                nearest_distance = distance
                nearest_entity = entity

        return nearest_entity

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

def handle_bullet_target_collision(collision: CollisionInfo) -> None:
    """Handle bullet-target collision (damage target, destroy bullet)"""
    bullet = collision.entity_a if collision.entity_a.entity_type == "bullet" else collision.entity_b
    target = collision.entity_b if collision.entity_a.entity_type == "bullet" else collision.entity_a

    # Damage target if it has health
    if hasattr(target, 'health'):
        target.health -= 1

    # Deactivate bullet
    bullet.active = False


def handle_entity_collision(collision: CollisionInfo) -> None:
    """Generic entity collision handler (for custom handling)"""
    pass


# Factory functions for common collision setups

def create_space_combat_collision_groups() -> Dict[str, CollisionGroup]:
    """Create collision groups for space combat game"""
    return {
        "projectiles": CollisionGroup(
            name="projectiles",
            entity_types={"bullet"},
            can_collide_with={"asteroid", "enemy"}
        ),
        "asteroids": CollisionGroup(
            name="asteroids",
            entity_types={"asteroid"},
            can_collide_with={"ship", "bullet"}
        ),
        "player": CollisionGroup(
            name="player",
            entity_types={"ship"},
            can_collide_with={"asteroid", "enemy"}
        ),
        "enemies": CollisionGroup(
            name="enemies",
            entity_types={"enemy"},
            can_collide_with={"ship", "bullet"}
        )
    }
