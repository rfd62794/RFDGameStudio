"""
Foundation Types - Extended Protocol Definitions

Sprint C: State Management & Tier Decoupling
ADR 213: Abstract Bridge Pattern for Foundation Isolation

Defines pure protocols and type stubs that allow Foundation (Tier 1)
to interact with Engine/App (Tier 2/3) without direct imports.
"""

from typing import Protocol, runtime_checkable, Tuple, Any, Optional, Dict, List, TypeVar
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

# === VECTOR PROTOCOL (Foundation Layer) ===

@runtime_checkable
class Vector2Protocol(Protocol):
    """Protocol for 2D vector operations - Foundation layer definition"""
    
    @property
    def x(self) -> float: ...
    
    @property  
    def y(self) -> float: ...
    
    def __add__(self, other: 'Vector2Protocol') -> 'Vector2Protocol': ...
    
    def __sub__(self, other: 'Vector2Protocol') -> 'Vector2Protocol': ...
    
    def __mul__(self, scalar: float) -> 'Vector2Protocol': ...
    
    def __truediv__(self, scalar: float) -> 'Vector2Protocol': ...
    
    def copy(self) -> 'Vector2Protocol': ...
    
    def magnitude(self) -> float: ...
    
    def normalize(self) -> 'Vector2Protocol': ...
    
    def to_tuple(self) -> Tuple[float, float]: ...


@dataclass
class Vector2Stub:
    """Concrete stub implementation for Foundation use"""
    x: float
    y: float
    
    def __add__(self, other: 'Vector2Stub') -> 'Vector2Stub':
        return Vector2Stub(self.x + other.x, self.y + other.y)
    
    def __sub__(self, other: 'Vector2Stub') -> 'Vector2Stub':
        return Vector2Stub(self.x - other.x, self.y - other.y)
    
    def __mul__(self, scalar: float) -> 'Vector2Stub':
        return Vector2Stub(self.x * scalar, self.y * scalar)
    
    def __truediv__(self, scalar: float) -> 'Vector2Stub':
        return Vector2Stub(self.x / scalar, self.y / scalar)
    
    def copy(self) -> 'Vector2Stub':
        return Vector2Stub(self.x, self.y)
    
    def magnitude(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5
    
    def normalize(self) -> 'Vector2Stub':
        mag = self.magnitude()
        if mag == 0:
            return Vector2Stub(0, 0)
        return Vector2Stub(self.x / mag, self.y / mag)
    
    def to_tuple(self) -> Tuple[float, float]:
        return (self.x, self.y)


# === ENTITY PROTOCOLS (Foundation Layer) ===

@runtime_checkable
class EntityStateProtocol(Protocol):
    """Protocol for entity state - Foundation layer definition"""
    
    @property
    def entity_id(self) -> str: ...
    
    @property
    def position(self) -> Vector2Protocol: ...
    
    @property
    def velocity(self) -> Vector2Protocol: ...
    
    @property
    def active(self) -> bool: ...
    
    @property
    def radius(self) -> float: ...
    
    def get_state_dict(self) -> Dict[str, Any]: ...


@runtime_checkable  
class GenomeProtocol(Protocol):
    """Protocol for genome data - Foundation layer definition"""
    
    @property
    def genome_id(self) -> str: ...
    
    def get_traits(self) -> Dict[str, Any]: ...
    
    def validate(self) -> bool: ...


@runtime_checkable
class PhysicsStateProtocol(Protocol):
    """Protocol for physics state - Foundation layer definition"""
    
    @property
    def position(self) -> Vector2Protocol: ...
    
    @property
    def velocity(self) -> Vector2Protocol: ...
    
    @property
    def acceleration(self) -> Vector2Protocol: ...
    
    @property
    def mass(self) -> float: ...
    
    def apply_force(self, force: Vector2Protocol) -> None: ...
    
    def update(self, dt: float) -> None: ...


# === GAME STATE PROTOCOLS (Foundation Layer) ===

class EntityType(Enum):
    """Entity types defined in Foundation layer"""
    SHIP = "ship"
    ASTEROID = "asteroid"
    SCRAP = "scrap"
    BULLET = "bullet"
    POWERUP = "powerup"
    TURTLE = "turtle"


@dataclass
class EntityStateSnapshot:
    """Immutable snapshot of entity state for Foundation use"""
    entity_id: str
    entity_type: EntityType
    position: Vector2Stub
    velocity: Vector2Stub
    radius: float
    active: bool
    metadata: Dict[str, Any]


@dataclass
class WorldStateSnapshot:
    """Immutable snapshot of world state for Foundation use"""
    timestamp: float
    frame_count: int
    entities: List[EntityStateSnapshot]
    player_entity_id: Optional[str]
    score: int
    energy: float
    game_active: bool


@runtime_checkable
class StateRegistryProtocol(Protocol):
    """Protocol for state registry operations - Foundation layer"""
    
    def register_entity(self, entity: EntityStateProtocol) -> bool: ...
    
    def unregister_entity(self, entity_id: str) -> bool: ...
    
    def get_entity_state(self, entity_id: str) -> Optional[EntityStateProtocol]: ...
    
    def get_world_snapshot(self) -> WorldStateSnapshot: ...
    
    def restore_from_snapshot(self, snapshot: WorldStateSnapshot) -> bool: ...


# === CALLBACK PROTOCOLS (Unidirectional Flow) ===

@runtime_checkable
class EventCallbackProtocol(Protocol):
    """Protocol for event callbacks from Engine to App"""
    
    def on_entity_spawned(self, entity_id: str, entity_type: EntityType) -> None: ...
    
    def on_entity_destroyed(self, entity_id: str) -> None: ...
    
    def on_collision(self, entity1_id: str, entity2_id: str) -> None: ...
    
    def on_state_change(self, snapshot: WorldStateSnapshot) -> None: ...


@runtime_checkable
class RenderCallbackProtocol(Protocol):
    """Protocol for render callbacks from Engine to UI"""
    
    def on_frame_ready(self, frame_data: bytes) -> None: ...
    
    def on_viewport_change(self, x: int, y: int, width: int, height: int) -> None: ...
    
    def on_fps_update(self, fps: float) -> None: ...


# === DEPENDENCY INJECTION PROTOCOLS ===

@runtime_checkable
class EngineDependencyProtocol(Protocol):
    """Protocol for Engine dependencies - injected from App layer"""
    
    def get_event_callback(self) -> EventCallbackProtocol: ...
    
    def get_render_callback(self) -> RenderCallbackProtocol: ...
    
    def get_persistence_handler(self) -> 'PersistenceProtocol': ...


@runtime_checkable
class PersistenceProtocol(Protocol):
    """Protocol for persistence operations"""
    
    def save_state(self, snapshot: WorldStateSnapshot) -> bool: ...
    
    def load_state(self) -> Optional[WorldStateSnapshot]: ...
    
    def save_genome(self, genome: GenomeProtocol) -> bool: ...
    
    def load_genome(self, genome_id: str) -> Optional[GenomeProtocol]: ...


# === TYPE VARIABLES ===

T_Entity = TypeVar('T_Entity', bound=EntityStateProtocol)
T_Vector = TypeVar('T_Vector', bound=Vector2Protocol)
T_Genome = TypeVar('T_Genome', bound=GenomeProtocol)


# === EXPORTS ===

__all__ = [
    # Vector protocols
    'Vector2Protocol',
    'Vector2Stub',
    
    # Entity protocols  
    'EntityStateProtocol',
    'GenomeProtocol',
    'PhysicsStateProtocol',
    
    # State protocols
    'EntityType',
    'EntityStateSnapshot', 
    'WorldStateSnapshot',
    'StateRegistryProtocol',
    
    # Callback protocols
    'EventCallbackProtocol',
    'RenderCallbackProtocol',
    
    # Dependency injection
    'EngineDependencyProtocol',
    'PersistenceProtocol',
    
    # Type variables
    'T_Entity',
    'T_Vector', 
    'T_Genome'
]
