"""
World State - Sovereign Boundary Management
ADR 207: MVC Pattern - Model Component

Owns the 160x144 coordinate system and entity management.
Enforces strict toroidal wrapping and boundary conditions.
"""

import math
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from loguru import logger

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from foundation.vector import Vector2


@dataclass
class Entity:
    """Base entity class for world state management"""
    id: str
    position: Vector2
    velocity: Vector2
    radius: float
    active: bool = True
    entity_type: str = "generic"
    
    def __post_init__(self):
        """Initialize derived properties"""
        self.last_position = Vector2(self.position.x, self.position.y)
    
    def update_position(self, dt: float) -> None:
        """Update position based on velocity"""
        self.last_position = Vector2(self.position.x, self.position.y)
        self.position.x += self.velocity.x * dt
        self.position.y += self.velocity.y * dt
    
    def get_distance_to(self, other: 'Entity') -> float:
        """Get distance to another entity"""
        return self.position.distance_to(other.position)
    
    def check_collision(self, other: 'Entity') -> bool:
        """Check collision with another entity"""
        if not (self.active and other.active):
            return False
        
        distance = self.get_distance_to(other)
        return distance < (self.radius + other.radius)


@dataclass
class ShipEntity(Entity):
    """Player ship entity"""
    angle: float = 0.0
    angular_velocity: float = 0.0
    energy: float = 100.0
    thrust_active: bool = False
    
    def __post_init__(self):
        super().__post_init__()
        self.entity_type = "ship"
    
    def rotate(self, delta_angle: float) -> None:
        """Rotate ship by delta angle"""
        self.angle += delta_angle
        # Normalize angle to [0, 2π]
        self.angle = self.angle % (2 * math.pi)
    
    def apply_thrust(self, thrust_force: float) -> None:
        """Apply thrust in current direction"""
        if thrust_force > 0:
            # Calculate thrust vector
            thrust_x = thrust_force * math.cos(self.angle)
            thrust_y = thrust_force * math.sin(self.angle)
            
            # Apply to velocity
            self.velocity.x += thrust_x
            self.velocity.y += thrust_y
    
    def get_forward_vector(self) -> Vector2:
        """Get forward direction vector"""
        return Vector2(math.cos(self.angle), math.sin(self.angle))


@dataclass
class AsteroidEntity(Entity):
    """Asteroid entity"""
    size: int = 1  # 1=small, 2=medium, 3=large
    rotation: float = 0.0
    rotation_speed: float = 0.0
    
    def __post_init__(self):
        super().__post_init__()
        self.entity_type = "asteroid"
        
        # Set radius based on size
        if self.size == 1:
            self.radius = 2.0
        elif self.size == 2:
            self.radius = 4.0
        else:  # size == 3
            self.radius = 8.0
    
    def update_rotation(self, dt: float) -> None:
        """Update asteroid rotation"""
        self.rotation += self.rotation_speed * dt
        self.rotation = self.rotation % (2 * math.pi)
    
    def split(self) -> List['AsteroidEntity']:
        """Split asteroid into smaller pieces"""
        if self.size <= 1:
            return []  # Can't split small asteroids
        
        # Create smaller asteroids
        new_size = self.size - 1
        new_asteroids = []
        
        for i in range(2):  # Split into 2 pieces
            # Random offset from current position
            offset_angle = (i * math.pi) + random.uniform(-0.5, 0.5)
            offset_distance = self.radius * 0.5
            
            new_pos = Vector2(
                self.position.x + offset_distance * math.cos(offset_angle),
                self.position.y + offset_distance * math.sin(offset_angle)
            )
            
            # Random velocity
            speed = random.uniform(20, 50)
            vel_angle = offset_angle + random.uniform(-0.3, 0.3)
            new_vel = Vector2(
                speed * math.cos(vel_angle),
                speed * math.sin(vel_angle)
            )
            
            new_asteroid = AsteroidEntity(
                id=f"asteroid_{self.id}_{i}",
                position=new_pos,
                velocity=new_vel,
                radius=0.0,  # Will be set in __post_init__
                entity_type="asteroid",
                size=new_size,
                rotation=random.uniform(0, 2 * math.pi),
                rotation_speed=random.uniform(-2, 2)
            )
            
            new_asteroids.append(new_asteroid)
        
        return new_asteroids


@dataclass
class BulletEntity(Entity):
    """Bullet entity"""
    lifetime: float = 2.0
    damage: float = 10.0
    owner_id: str = ""
    
    def __post_init__(self):
        super().__post_init__()
        self.entity_type = "bullet"
        self.radius = 1.0
    
    def update_lifetime(self, dt: float) -> None:
        """Update bullet lifetime"""
        self.lifetime -= dt
        if self.lifetime <= 0:
            self.active = False


@dataclass
class ScrapEntity(Entity):
    """Scrap entity for collection"""
    value: int = 10
    scrap_type: str = "metal"
    
    def __post_init__(self):
        super().__post_init__()
        self.entity_type = "scrap"
        self.radius = 3.0


class WorldState:
    """Sovereign world state manager with strict boundary enforcement"""
    
    def __init__(self):
        # World boundaries (always 160x144)
        self.width = SOVEREIGN_WIDTH
        self.height = SOVEREIGN_HEIGHT
        
        # Entity management
        self.entities: Dict[str, Entity] = {}
        self.entity_types: Dict[str, Set[str]] = {
            "ship": set(),
            "asteroid": set(),
            "bullet": set(),
            "scrap": set(),
            "generic": set()
        }
        
        # World properties
        self.wrap_enabled = True
        self.hard_bounds_enabled = False
        self.gravity_enabled = False
        
        # Statistics
        self.total_entities_created = 0
        self.total_entities_destroyed = 0
        
        logger.info(f"🌍 WorldState initialized ({self.width}x{self.height})")
    
    def add_entity(self, entity: Entity) -> Result[str]:
        """Add an entity to the world"""
        try:
            # Generate unique ID if not provided
            if not entity.id:
                entity.id = f"{entity.entity_type}_{self.total_entities_created}"
            
            # Add to entities dict
            self.entities[entity.id] = entity
            
            # Add to type tracking
            if entity.entity_type not in self.entity_types:
                self.entity_types[entity.entity_type] = set()
            self.entity_types[entity.entity_type].add(entity.id)
            
            self.total_entities_created += 1
            
            # Apply boundary correction immediately
            self._apply_boundary_correction(entity)
            
            logger.debug(f"➕ Added entity {entity.id} ({entity.entity_type})")
            return Result.success_result(entity.id)
            
        except Exception as e:
            return Result.failure_result(f"Failed to add entity: {e}")
    
    def remove_entity(self, entity_id: str) -> Result[bool]:
        """Remove an entity from the world"""
        try:
            if entity_id not in self.entities:
                return Result.failure_result(f"Entity {entity_id} not found")
            
            entity = self.entities[entity_id]
            
            # Remove from type tracking
            if entity.entity_type in self.entity_types:
                self.entity_types[entity.entity_type].discard(entity_id)
            
            # Remove from entities dict
            del self.entities[entity_id]
            
            self.total_entities_destroyed += 1
            
            logger.debug(f"➖ Removed entity {entity_id}")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Failed to remove entity: {e}")
    
    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get an entity by ID"""
        return self.entities.get(entity_id)
    
    def get_entities_by_type(self, entity_type: str) -> List[Entity]:
        """Get all entities of a specific type"""
        if entity_type not in self.entity_types:
            return []
        
        return [self.entities[eid] for eid in self.entity_types[entity_type] 
                if eid in self.entities]
    
    def get_all_entities(self) -> List[Entity]:
        """Get all active entities"""
        return [entity for entity in self.entities.values() if entity.active]
    
    def update_world(self, dt: float) -> Result[bool]:
        """Update all entities and enforce boundaries"""
        try:
            # Update all entities
            for entity in self.entities.values():
                if not entity.active:
                    continue
                
                # Update position
                entity.update_position(dt)
                
                # Apply boundary correction
                self._apply_boundary_correction(entity)
                
                # Entity-specific updates
                if isinstance(entity, ShipEntity):
                    # Update ship rotation
                    if entity.angular_velocity != 0:
                        entity.rotate(entity.angular_velocity * dt)
                
                elif isinstance(entity, AsteroidEntity):
                    # Update asteroid rotation
                    entity.update_rotation(dt)
                
                elif isinstance(entity, BulletEntity):
                    # Update bullet lifetime
                    entity.update_lifetime(dt)
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"World update failed: {e}")
    
    def _apply_boundary_correction(self, entity: Entity) -> None:
        """Apply boundary correction to entity position"""
        if self.hard_bounds_enabled:
            # Hard bounds - bounce or blackout
            self._apply_hard_bounds(entity)
        elif self.wrap_enabled:
            # Toroidal wrapping
            self._apply_toroidal_wrapping(entity)
        # else: No boundary correction (for testing)
    
    def _apply_toroidal_wrapping(self, entity: Entity) -> None:
        """Apply toroidal wrapping to entity position"""
        # Strict boundary enforcement at engine level
        
        # X-axis wrapping
        if entity.position.x < 0:
            entity.position.x = self.width - 1  # Wrap to right edge
            entity.last_position.x = entity.position.x
        elif entity.position.x >= self.width:
            entity.position.x = 0  # Wrap to left edge
            entity.last_position.x = entity.position.x
        
        # Y-axis wrapping
        if entity.position.y < 0:
            entity.position.y = self.height - 1  # Wrap to bottom edge
            entity.last_position.y = entity.position.y
        elif entity.position.y >= self.height:
            entity.position.y = 0  # Wrap to top edge
            entity.last_position.y = entity.position.y
    
    def _apply_hard_bounds(self, entity: Entity) -> None:
        """Apply hard boundary conditions"""
        collision_occurred = False
        
        # X-axis bounds
        if entity.position.x < entity.radius:
            entity.position.x = entity.radius
            entity.velocity.x = abs(entity.velocity.x)  # Bounce right
            collision_occurred = True
        elif entity.position.x >= self.width - entity.radius:
            entity.position.x = self.width - entity.radius
            entity.velocity.x = -abs(entity.velocity.x)  # Bounce left
            collision_occurred = True
        
        # Y-axis bounds
        if entity.position.y < entity.radius:
            entity.position.y = entity.radius
            entity.velocity.y = abs(entity.velocity.y)  # Bounce down
            collision_occurred = True
        elif entity.position.y >= self.height - entity.radius:
            entity.position.y = self.height - entity.radius
            entity.velocity.y = -abs(entity.velocity.y)  # Bounce up
            collision_occurred = True
        
        # Apply collision penalty for ships
        if collision_occurred and isinstance(entity, ShipEntity):
            entity.energy -= 10.0  # Penalty for hitting boundary
            if entity.energy <= 0:
                entity.active = False
    
    def check_collisions(self) -> List[Tuple[str, str]]:
        """Check all collisions and return collision pairs"""
        collisions = []
        active_entities = self.get_all_entities()
        
        for i, entity1 in enumerate(active_entities):
            for entity2 in active_entities[i+1:]:
                if entity1.check_collision(entity2):
                    collisions.append((entity1.id, entity2.id))
        
        return collisions
    
    def get_entities_in_radius(self, center: Vector2, radius: float) -> List[Entity]:
        """Get all entities within a radius of a center point"""
        entities_in_radius = []
        
        for entity in self.get_all_entities():
            distance = center.distance_to(entity.position)
            if distance <= radius:
                entities_in_radius.append(entity)
        
        return entities_in_radius
    
    def get_nearest_entity(self, center: Vector2, entity_type: str = None) -> Optional[Entity]:
        """Get the nearest entity to a center point"""
        nearest_entity = None
        min_distance = float('inf')
        
        entities_to_check = self.get_all_entities()
        if entity_type:
            entities_to_check = [e for e in entities_to_check if e.entity_type == entity_type]
        
        for entity in entities_to_check:
            distance = center.distance_to(entity.position)
            if distance < min_distance:
                min_distance = distance
                nearest_entity = entity
        
        return nearest_entity
    
    def resize_world(self, new_width: int, new_height: int, clear_entities: bool = True) -> Result[bool]:
        """Resize world boundaries and handle entity repositioning"""
        try:
            old_width = self.width
            old_height = self.height
            
            # Update world boundaries
            self.width = new_width
            self.height = new_height
            
            logger.info(f"🌍 World resized from {old_width}x{old_height} to {new_width}x{new_height}")
            
            if clear_entities:
                # Clear all entities for fresh start
                self.entities.clear()
                self.entity_types = {key: set() for key in self.entity_types}
                logger.info("🧹 Entities cleared for fresh start")
            else:
                # Reposition existing entities to fit new bounds
                self._reposition_entities(old_width, old_height)
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"World resize failed: {e}")
    
    def _reposition_entities(self, old_width: int, old_height: int) -> None:
        """Reposition entities to fit new world boundaries"""
        try:
            # Calculate scaling factors
            width_scale = self.width / old_width
            height_scale = self.height / old_height
            
            repositioned_count = 0
            for entity in self.entities.values():
                if not entity.active:
                    continue
                
                # Scale position
                entity.position.x *= width_scale
                entity.position.y *= height_scale
                
                # Ensure within new bounds
                entity.position.x = max(0, min(entity.position.x, self.width - 1))
                entity.position.y = max(0, min(entity.position.y, self.height - 1))
                
                # Scale velocity proportionally
                entity.velocity.x *= width_scale
                entity.velocity.y *= height_scale
                
                repositioned_count += 1
            
            logger.info(f"📐 Repositioned {repositioned_count} entities for new world size")
            
        except Exception as e:
            logger.error(f"Entity repositioning failed: {e}")
    
    def get_world_statistics(self) -> Dict[str, Any]:
        """Get world state statistics"""
        entity_counts = {}
        for entity_type, entity_ids in self.entity_types.items():
            active_count = sum(1 for eid in entity_ids 
                             if eid in self.entities and self.entities[eid].active)
            entity_counts[entity_type] = active_count
        
        return {
            'total_entities': len(self.entities),
            'active_entities': len(self.get_all_entities()),
            'entity_counts': entity_counts,
            'world_size': (self.width, self.height),
            'wrap_enabled': self.wrap_enabled,
            'hard_bounds_enabled': self.hard_bounds_enabled,
            'total_created': self.total_entities_created,
            'total_destroyed': self.total_entities_destroyed
        }
    
    def set_wrap_enabled(self, enabled: bool) -> None:
        """Enable or disable toroidal wrapping"""
        self.wrap_enabled = enabled
        logger.info(f"🌍 Toroidal wrapping: {enabled}")
    
    def set_hard_bounds_enabled(self, enabled: bool) -> None:
        """Enable or disable hard boundary conditions"""
        self.hard_bounds_enabled = enabled
        logger.info(f"🔒 Hard bounds: {enabled}")
    
    def clear_world(self) -> Result[bool]:
        """Clear all entities from the world"""
        try:
            self.entities.clear()
            for entity_type in self.entity_types:
                self.entity_types[entity_type].clear()
            
            logger.info("🧹 World cleared")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Failed to clear world: {e}")
    
    def create_ship(self, position: Vector2, angle: float = 0.0) -> Result[str]:
        """Create a ship entity"""
        ship = ShipEntity(
            id="",
            position=position,
            velocity=Vector2(0, 0),
            radius=4.0,
            angle=angle
        )
        return self.add_entity(ship)
    
    def create_asteroid(self, position: Vector2, velocity: Vector2, size: int = 3) -> Result[str]:
        """Create an asteroid entity"""
        asteroid = AsteroidEntity(
            id="",
            position=position,
            velocity=velocity,
            radius=0.0,  # Will be set in __post_init__
            size=size,
            rotation=random.uniform(0, 2 * math.pi),
            rotation_speed=random.uniform(-2, 2)
        )
        return self.add_entity(asteroid)
    
    def create_bullet(self, position: Vector2, velocity: Vector2, owner_id: str) -> Result[str]:
        """Create a bullet entity"""
        bullet = BulletEntity(
            id="",
            position=position,
            velocity=velocity,
            radius=1.0,
            owner_id=owner_id
        )
        return self.add_entity(bullet)
    
    def create_scrap(self, position: Vector2, value: int = 10) -> Result[str]:
        """Create a scrap entity"""
        scrap = ScrapEntity(
            id="",
            position=position,
            velocity=Vector2(0, 0),
            radius=3.0,
            value=value
        )
        return self.add_entity(scrap)


# Factory function
def create_world_state() -> WorldState:
    """Create a new world state instance"""
    return WorldState()


# Test function
def test_world_state():
    """Test the world state functionality"""
    import random
    
    # Create world
    world = WorldState()
    
    # Create ship
    ship_pos = Vector2(80, 72)
    ship_result = world.create_ship(ship_pos, 0.0)
    print(f"Ship creation: {ship_result}")
    
    # Create asteroids
    for i in range(3):
        ast_pos = Vector2(random.randint(10, 150), random.randint(10, 134))
        ast_vel = Vector2(random.uniform(-20, 20), random.uniform(-20, 20))
        ast_result = world.create_asteroid(ast_pos, ast_vel, random.randint(1, 3))
        print(f"Asteroid {i} creation: {ast_result}")
    
    # Test boundary wrapping
    print("\nTesting boundary wrapping:")
    ship = world.get_entity(ship_result.value)
    if ship:
        print(f"Initial position: {ship.position}")
        
        # Move outside boundaries
        ship.position.x = -10
        ship.position.y = 160
        world._apply_boundary_correction(ship)
        print(f"After wrapping: {ship.position}")
    
    # Test statistics
    print("\nWorld statistics:")
    stats = world.get_world_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    # Test update
    print("\nTesting world update:")
    for i in range(5):
        result = world.update_world(0.016)  # 60 FPS
        print(f"Update {i}: {result.success}")
    
    print("\nWorld state test complete!")


if __name__ == "__main__":
    test_world_state()
