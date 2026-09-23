"""
Entity Manager - Component-Based Architecture
Manages the lifecycle of all game entities with object pooling
"""

from typing import Dict, List, Any, Optional, Type, Protocol
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
import uuid
from loguru import logger

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT


class EntityProtocol(Protocol):
    """Protocol for all game entities"""
    id: str
    active: bool
    x: float
    y: float
    vx: float
    vy: float
    radius: float
    
    def update(self, dt: float) -> None: ...
    def render(self, surface) -> None: ...
    def deactivate(self) -> None: ...


@dataclass
class Entity:
    """Base entity class with pooling support"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    active: bool = True
    x: float = 0.0
    y: float = 0.0
    vx: float = 0.0
    vy: float = 0.0
    radius: float = 5.0
    entity_type: str = "entity"
    
    # Pooling support
    in_pool: bool = False
    
    def update(self, dt: float) -> None:
        """Update entity position and state"""
        if not self.active:
            return
        
        # Update position
        self.x += self.vx * dt
        self.y += self.vy * dt
        
        # Toroidal wrap
        self.x = self.x % SOVEREIGN_WIDTH
        self.y = self.y % SOVEREIGN_HEIGHT
    
    def render(self, surface) -> None:
        """Render entity (base implementation)"""
        if not self.active:
            return
        # Base rendering - override in subclasses
    
    def deactivate(self) -> None:
        """Deactivate entity for pooling"""
        self.active = False
        self.in_pool = True
    
    def activate(self) -> None:
        """Activate entity from pool"""
        self.active = True
        self.in_pool = False
    
    def reset(self) -> None:
        """Reset entity to default state"""
        self.x = 0.0
        self.y = 0.0
        self.vx = 0.0
        self.vy = 0.0
        self.active = False
        self.in_pool = True


class ObjectPool:
    """Generic object pool for entity management"""
    
    def __init__(self, entity_class: Type[Entity], initial_size: int = 10):
        self.entity_class = entity_class
        self.pool: List[Entity] = []
        self.active_entities: List[Entity] = []
        
        # Pre-allocate pool
        for _ in range(initial_size):
            entity = entity_class()
            entity.deactivate()
            self.pool.append(entity)
        
        logger.info(f"🏊 ObjectPool created: {entity_class.__name__} (size: {initial_size})")
    
    def acquire(self) -> Entity:
        """Acquire entity from pool"""
        # Try to get from pool
        if self.pool:
            entity = self.pool.pop()
            entity.activate()
            self.active_entities.append(entity)
            return entity
        
        # Pool exhausted, create new entity
        logger.warning(f"⚠️ Pool exhausted for {self.entity_class.__name__}, creating new entity")
        entity = self.entity_class()
        entity.activate()
        self.active_entities.append(entity)
        return entity
    
    def release(self, entity: Entity) -> None:
        """Release entity back to pool"""
        if entity in self.active_entities:
            entity.reset()
            self.active_entities.remove(entity)
            self.pool.append(entity)
    
    def release_all(self) -> None:
        """Release all active entities back to pool"""
        for entity in self.active_entities.copy():
            self.release(entity)
    
    def get_active_count(self) -> int:
        """Get number of active entities"""
        return len(self.active_entities)
    
    def get_pool_size(self) -> int:
        """Get pool size"""
        return len(self.pool)


class EntityManager:
    """Manages all entity pools and lifecycle"""
    
    def __init__(self):
        self.pools: Dict[str, ObjectPool] = {}
        self.entity_registry: Dict[str, Type[Entity]] = {}
        
        logger.info("🎮 EntityManager initialized")
    
    def register_entity_type(self, entity_type: str, entity_class: Type[Entity], 
                           pool_size: int = 10) -> Result[bool]:
        """Register entity type with pool"""
        try:
            self.entity_registry[entity_type] = entity_class
            self.pools[entity_type] = ObjectPool(entity_class, pool_size)
            
            logger.info(f"✅ Registered entity type: {entity_type}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to register entity type: {e}")
    
    def spawn_entity(self, entity_type: str, **kwargs) -> Result[Entity]:
        """Spawn entity of given type"""
        try:
            if entity_type not in self.pools:
                return Result(success=False, error=f"Entity type '{entity_type}' not registered")
            
            entity = self.pools[entity_type].acquire()
            
            # Apply spawn parameters
            for key, value in kwargs.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)
            
            logger.debug(f"🎯 Spawned {entity_type}: {entity.id}")
            return Result(success=True, value=entity)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to spawn entity: {e}")
    
    def despawn_entity(self, entity: Entity) -> Result[bool]:
        """Despawn entity back to pool"""
        try:
            entity_type = entity.entity_type
            
            if entity_type not in self.pools:
                return Result(success=False, error=f"Entity type '{entity_type}' not registered")
            
            self.pools[entity_type].release(entity)
            
            logger.debug(f"🗑️ Despawned {entity_type}: {entity.id}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to despawn entity: {e}")
    
    def update_all(self, dt: float) -> None:
        """Update all active entities"""
        for pool in self.pools.values():
            for entity in pool.active_entities.copy():  # Copy to avoid modification during iteration
                entity.update(dt)
    
    def render_all(self, surface) -> None:
        """Render all active entities"""
        for pool in self.pools.values():
            for entity in pool.active_entities:
                entity.render(surface)
    
    def get_entities_by_type(self, entity_type: str) -> List[Entity]:
        """Get all active entities of given type"""
        if entity_type not in self.pools:
            return []
        
        return self.pools[entity_type].active_entities.copy()
    
    def get_all_active_entities(self) -> List[Entity]:
        """Get all active entities"""
        all_entities = []
        for pool in self.pools.values():
            all_entities.extend(pool.active_entities)
        return all_entities
    
    def clear_all(self) -> None:
        """Clear all entities back to pools"""
        for pool in self.pools.values():
            pool.release_all()
        
        logger.info("🧹 Cleared all entities")
    
    def get_status(self) -> Dict[str, Any]:
        """Get entity manager status"""
        status = {
            'registered_types': list(self.entity_registry.keys()),
            'total_active': 0,
            'total_pooled': 0,
            'pool_details': {}
        }
        
        for entity_type, pool in self.pools.items():
            active_count = pool.get_active_count()
            pool_size = pool.get_pool_size()
            
            status['total_active'] += active_count
            status['total_pooled'] += pool_size
            status['pool_details'][entity_type] = {
                'active': active_count,
                'pooled': pool_size
            }
        
        return status


# Specialized entity types for asteroids game
class ShipEntity(Entity):
    """Ship entity with player control and paced combat"""
    
    def __init__(self):
        super().__init__()
        self.entity_type = "ship"
        self.angle = 0.0
        self.energy = 100.0
        self.lives = 3
        self.invulnerable_time = 0.0
        self.radius = 3.0  # Tight hit-box for high-stakes navigation
        
        # Weapon pacing system
        self.fire_cooldown = 0.0
        self.fire_cooldown_max = 0.15  # 150ms between shots (human rhythm)
        self.last_fire_time = 0.0
    
    def update(self, dt: float) -> None:
        super().update(dt)
        
        # Update invulnerability
        if self.invulnerable_time > 0:
            self.invulnerable_time -= dt
        
        # Update fire cooldown
        if self.fire_cooldown > 0:
            self.fire_cooldown -= dt
    
    def can_fire(self) -> bool:
        """Check if ship can fire based on cooldown"""
        return self.fire_cooldown <= 0
    
    def fire_weapon(self) -> bool:
        """Attempt to fire weapon"""
        if self.can_fire():
            self.fire_cooldown = self.fire_cooldown_max
            self.last_fire_time = time.time()
            return True
        return False


class AsteroidEntity(Entity):
    """Asteroid entity with health and splitting"""
    
    def __init__(self):
        super().__init__()
        self.entity_type = "asteroid"
        self.health = 1
        self.size = 1
        self.color = "gray"
        self.radius = 4.0  # Default medium size
    
    def reset(self) -> None:
        super().reset()
        self.health = 1
        self.size = 1
        self.color = "gray"
        self.radius = 4.0


class BulletEntity(Entity):
    """Bullet entity with lifetime"""
    
    def __init__(self):
        super().__init__()
        self.entity_type = "bullet"
        self.lifetime = 1.0
        self.radius = 2.0
    
    def update(self, dt: float) -> None:
        super().update(dt)
        
        # Update lifetime
        self.lifetime -= dt
        
        # Deactivate if expired
        if self.lifetime <= 0:
            self.deactivate()
    
    def reset(self) -> None:
        super().reset()
        self.lifetime = 1.0
