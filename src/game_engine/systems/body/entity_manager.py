"""
Entity Manager - Component-Based ECS Architecture

Manages the lifecycle of all game entities with object pooling and component
composition. This is the core infrastructure for the body system.

Features:
- Entity pooling for memory efficiency
- Component-based composition
- Type-safe entity spawning and despawning
- Batch update and render operations
"""

from typing import Dict, List, Any, Optional, Type, Protocol, Set
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
import uuid
from enum import Enum

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result


class EntityComponentProtocol(Protocol):
    """Protocol for components attached to entities"""
    entity_id: str

    def initialize(self) -> None: ...
    def update(self, dt: float) -> None: ...
    def shutdown(self) -> None: ...


class EntityProtocol(Protocol):
    """Protocol for all game entities"""
    id: str
    active: bool
    entity_type: str
    components: Dict[str, EntityComponentProtocol]

    def add_component(self, component_id: str, component: EntityComponentProtocol) -> None: ...
    def get_component(self, component_id: str) -> Optional[EntityComponentProtocol]: ...
    def has_component(self, component_id: str) -> bool: ...
    def remove_component(self, component_id: str) -> None: ...
    def update(self, dt: float) -> None: ...
    def deactivate(self) -> None: ...


@dataclass
class EntityComponent(ABC):
    """Base component for entities"""
    entity_id: str = ""

    @abstractmethod
    def initialize(self) -> None:
        """Initialize component"""
        pass

    @abstractmethod
    def update(self, dt: float) -> None:
        """Update component state"""
        pass

    @abstractmethod
    def shutdown(self) -> None:
        """Shutdown component"""
        pass


@dataclass
class Entity:
    """Base entity class with component composition"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    active: bool = True
    entity_type: str = "entity"
    components: Dict[str, EntityComponent] = field(default_factory=dict)

    # Pooling support
    in_pool: bool = False

    def add_component(self, component_id: str, component: EntityComponent) -> None:
        """Add component to entity"""
        component.entity_id = self.id
        self.components[component_id] = component
        component.initialize()

    def get_component(self, component_id: str) -> Optional[EntityComponent]:
        """Get component by ID"""
        return self.components.get(component_id)

    def has_component(self, component_id: str) -> bool:
        """Check if entity has component"""
        return component_id in self.components

    def remove_component(self, component_id: str) -> None:
        """Remove component from entity"""
        if component_id in self.components:
            self.components[component_id].shutdown()
            del self.components[component_id]

    def update(self, dt: float) -> None:
        """Update entity and all components"""
        if not self.active:
            return

        for component in self.components.values():
            component.update(dt)

    def deactivate(self) -> None:
        """Deactivate entity for pooling"""
        self.active = False
        self.in_pool = True

        # Shutdown all components
        for component in self.components.values():
            component.shutdown()

    def activate(self) -> None:
        """Activate entity from pool"""
        self.active = True
        self.in_pool = False

    def reset(self) -> None:
        """Reset entity to default state"""
        self.active = False
        self.in_pool = True

        # Clear components
        for component in list(self.components.values()):
            component.shutdown()
        self.components.clear()


class ObjectPool:
    """Generic object pool for entity management with pooling strategy"""

    def __init__(self, entity_class: Type[Entity], initial_size: int = 10):
        self.entity_class = entity_class
        self.pool: List[Entity] = []
        self.active_entities: Set[str] = set()  # Track by ID for O(1) lookup
        self.entities_by_id: Dict[str, Entity] = {}

        # Pre-allocate pool
        for _ in range(initial_size):
            entity = entity_class()
            entity.deactivate()
            self.pool.append(entity)

    def acquire(self) -> Entity:
        """Acquire entity from pool"""
        # Try to get from pool
        if self.pool:
            entity = self.pool.pop()
            entity.activate()
            self.active_entities.add(entity.id)
            self.entities_by_id[entity.id] = entity
            return entity

        # Pool exhausted, create new entity
        entity = self.entity_class()
        entity.activate()
        self.active_entities.add(entity.id)
        self.entities_by_id[entity.id] = entity
        return entity

    def release(self, entity: Entity) -> None:
        """Release entity back to pool"""
        if entity.id in self.active_entities:
            entity.reset()
            self.active_entities.discard(entity.id)
            del self.entities_by_id[entity.id]
            self.pool.append(entity)

    def release_all(self) -> None:
        """Release all active entities back to pool"""
        for entity_id in list(self.active_entities):
            entity = self.entities_by_id[entity_id]
            self.release(entity)

    def get_active_count(self) -> int:
        """Get number of active entities"""
        return len(self.active_entities)

    def get_pool_size(self) -> int:
        """Get pool size"""
        return len(self.pool)

    def get_active_entities(self) -> List[Entity]:
        """Get list of all active entities"""
        return [self.entities_by_id[eid] for eid in self.active_entities]


class EntityManager(BaseSystem):
    """Manages all entity pools and lifecycle"""

    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config or SystemConfig(name="EntityManager"))
        self.pools: Dict[str, ObjectPool] = {}
        self.entity_registry: Dict[str, Type[Entity]] = {}
        self.all_entities: Dict[str, Entity] = {}

    def initialize(self) -> bool:
        """Initialize the entity manager"""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update all active entities"""
        if self.status != SystemStatus.RUNNING:
            return

        for entity in list(self.all_entities.values()):
            if entity.active:
                entity.update(delta_time)

    def shutdown(self) -> None:
        """Shutdown entity manager and all entities"""
        for pool in self.pools.values():
            pool.release_all()

        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process entity-related intents"""
        action = intent.get("action", "")

        if action == "spawn":
            entity_type = intent.get("entity_type", "")
            kwargs = intent.get("kwargs", {})
            result = self.spawn_entity(entity_type, **kwargs)
            if result.success:
                return {"entity": result.value, "entity_id": result.value.id}
            return {"error": result.error}

        elif action == "despawn":
            entity_id = intent.get("entity_id", "")
            result = self.despawn_entity(entity_id)
            return {"success": result.success, "error": result.error if not result.success else None}

        elif action == "get_entities":
            entity_type = intent.get("entity_type")
            if entity_type:
                entities = self.get_entities_by_type(entity_type)
            else:
                entities = self.get_all_active_entities()
            return {"entities": entities, "count": len(entities)}

        else:
            return {"error": f"Unknown EntityManager action: {action}"}

    def register_entity_type(self, entity_type: str, entity_class: Type[Entity],
                           pool_size: int = 10) -> Result[bool]:
        """Register entity type with pool"""
        try:
            self.entity_registry[entity_type] = entity_class
            self.pools[entity_type] = ObjectPool(entity_class, pool_size)
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to register entity type: {e}")

    def spawn_entity(self, entity_type: str, **kwargs) -> Result[Entity]:
        """Spawn entity of given type"""
        try:
            if entity_type not in self.pools:
                return Result(success=False, error=f"Entity type '{entity_type}' not registered")

            entity = self.pools[entity_type].acquire()

            # Set entity type
            entity.entity_type = entity_type

            # Apply spawn parameters
            for key, value in kwargs.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)

            self.all_entities[entity.id] = entity
            return Result(success=True, value=entity)

        except Exception as e:
            return Result(success=False, error=f"Failed to spawn entity: {e}")

    def despawn_entity(self, entity_id: str) -> Result[bool]:
        """Despawn entity back to pool by ID"""
        try:
            if entity_id not in self.all_entities:
                return Result(success=False, error=f"Entity not found: {entity_id}")

            entity = self.all_entities[entity_id]
            entity_type = entity.entity_type

            if entity_type not in self.pools:
                return Result(success=False, error=f"Entity type '{entity_type}' not registered")

            self.pools[entity_type].release(entity)
            del self.all_entities[entity_id]

            return Result(success=True, value=True)

        except Exception as e:
            return Result(success=False, error=f"Failed to despawn entity: {e}")

    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get entity by ID"""
        return self.all_entities.get(entity_id)

    def get_entities_by_type(self, entity_type: str) -> List[Entity]:
        """Get all active entities of given type"""
        if entity_type not in self.pools:
            return []

        return self.pools[entity_type].get_active_entities()

    def get_all_active_entities(self) -> List[Entity]:
        """Get all active entities"""
        return [e for e in self.all_entities.values() if e.active]

    def clear_all(self) -> None:
        """Clear all entities back to pools"""
        for pool in self.pools.values():
            pool.release_all()

        self.all_entities.clear()

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

    # --- Template-based spawning ---

    # --- Template-based spawning ---

    def set_template_registry(self, template_registry: Any) -> None:
        """
        Set the EntityTemplateRegistry for template-based spawning.

        Args:
            template_registry: An EntityTemplateRegistry instance
        """
        self._template_registry = template_registry

    def _ensure_entity_type_registered(self, entity_type: str) -> None:
        """Ensure entity type is registered, otherwise auto-register base Entity."""
        if entity_type not in self.pools:
            # Auto-register default Entity if not found, to prevent crash on simple templates
            # In production, you might want to log a warning or error here.
            from src.game_engine.systems.body.entity_manager import Entity
            self.register_entity_type(entity_type, Entity)

    def _apply_template_properties(self, entity: Entity, template: Any) -> None:
        """Apply properties from template to entity."""
        # 1. Apply base properties
        if hasattr(template, 'base_properties'):
            properties = template.base_properties.items()
        else:
            from dataclasses import asdict
            properties = asdict(template).items() if hasattr(template, "__dataclass_fields__") else vars(template).items()
            
        for key, value in properties:
            if hasattr(entity, key) and key not in ('template_id', 'entity_type', 'display_name'):
                setattr(entity, key, value)
        
        # 2. Add components
        # Note: In a real ECS, we'd look up Component classes by name. 
        # For now, we stub this or assume the component strings map to logic elsewhere.
        # This implementation assumes components are managed externally or simple tags for now across Phase E.
        pass

    def _apply_property_overrides(self, entity: Entity, overrides: Dict[str, Any]) -> None:
        """Apply override properties."""
        for key, value in overrides.items():
            if hasattr(entity, key):
                setattr(entity, key, value)

    def spawn_from_template(self, template_id: str, **overrides) -> Result[Entity]:
        """
        Spawn an entity from a registered template.

        Looks up the template by ID, spawns an entity of the template's
        entity_type, and applies template properties plus any overrides.

        Args:
            template_id: ID of the template in the template registry
            **overrides: Property overrides (e.g., x=100, y=200)

        Returns:
            Result containing the spawned Entity on success
        """
        try:
            registry = getattr(self, '_template_registry', None)
            if registry is None:
                return Result(success=False, error="No template registry set. Call set_template_registry() first.")

            if hasattr(registry, 'get_template'):
                template = registry.get_template(template_id)
            elif hasattr(registry, 'get'):
                template = registry.get(template_id)
            else:
                return Result(success=False, error="Invalid template registry")

            if template is None:
                return Result(success=False, error=f"Template not found: {template_id}")

            entity_type = template.entity_type
            self._ensure_entity_type_registered(entity_type)

            result = self.spawn_entity(entity_type)
            if not result.success:
                return result

            entity = result.value
            self._apply_template_properties(entity, template)
            self._apply_property_overrides(entity, overrides)

            return Result(success=True, value=entity)

        except Exception as e:
            return Result(success=False, error=f"Failed to spawn from template: {e}")

    def spawn_from_config(self, config_dict: Dict[str, Any]) -> Result[Entity]:
        """
        Spawn an entity from a configuration dictionary.

        The dict must contain 'entity_type' and may contain any
        entity properties as key-value pairs.

        Args:
            config_dict: Dictionary with entity_type and properties

        Returns:
            Result containing the spawned Entity on success
        """
        try:
            entity_type = config_dict.get("entity_type")
            if not entity_type:
                return Result(success=False, error="Config dict must contain 'entity_type'")

            self._ensure_entity_type_registered(entity_type)
            props = {k: v for k, v in config_dict.items() if k != "entity_type"}
            return self.spawn_entity(entity_type, **props)

        except Exception as e:
            return Result(success=False, error=f"Failed to spawn from config: {e}")

    def batch_spawn_from_template(self, template_id: str, count: int, **overrides) -> List[Entity]:
        """
        Spawn multiple entities from the same template.

        Args:
            template_id: ID of the template
            count: Number of entities to spawn
            **overrides: Property overrides applied to all entities

        Returns:
            List of spawned Entity objects (only successful spawns)
        """
        entities = []
        for _ in range(count):
            result = self.spawn_from_template(template_id, **overrides)
            if result.success:
                entities.append(result.value)
        return entities


# Specialized entity types for specific game types

@dataclass
class SpaceEntity(Entity):
    """Entity for space combat games with physics properties"""

    def __init__(self):
        super().__init__()
        self.entity_type = "space_entity"
        self.x: float = 0.0
        self.y: float = 0.0
        self.vx: float = 0.0
        self.vy: float = 0.0
        self.angle: float = 0.0
        self.radius: float = 5.0

    def reset(self) -> None:
        super().reset()
        self.x = 0.0
        self.y = 0.0
        self.vx = 0.0
        self.vy = 0.0
        self.angle = 0.0
        self.radius = 5.0


@dataclass
class RPGEntity(Entity):
    """Entity for RPG games with attributes and state"""

    def __init__(self):
        super().__init__()
        self.entity_type = "rpg_entity"
        self.name: str = ""
        self.x: float = 0.0
        self.y: float = 0.0
        self.z: float = 0.0
        self.health: int = 100
        self.mana: int = 50
        self.stamina: int = 100
        self.level: int = 1
        self.experience: int = 0

    def reset(self) -> None:
        super().reset()
        self.name = ""
        self.x = 0.0
        self.y = 0.0
        self.z = 0.0
        self.health = 100
        self.mana = 50
        self.stamina = 100
        self.level = 1
        self.experience = 0


@dataclass
class TycoonEntity(Entity):
    """Entity for tycoon/business simulation games"""

    def __init__(self):
        super().__init__()
        self.entity_type = "tycoon_entity"
        self.name: str = ""
        self.owner_id: str = ""
        self.wealth: float = 0.0
        self.production_rate: float = 0.0
        self.efficiency: float = 1.0

    def reset(self) -> None:
        super().reset()
        self.name = ""
        self.owner_id = ""
        self.wealth = 0.0
        self.production_rate = 0.0
        self.efficiency = 1.0
