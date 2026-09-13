"""
Entity Protocol - Interface Definitions for Space Entities

ADR 197: Entity Interface Segregation

Defines formal protocols for entity behavior, ensuring
proper dependency inversion and testability.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Tuple, TYPE_CHECKING

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.protocols import Vector2Protocol

# No TYPE_CHECKING needed - we use Foundation protocols only


class EntityProtocol(ABC):
    """Base protocol for all game entities"""
    
    @abstractmethod
    def update(self, dt: float) -> Result[None]:
        """Update entity state"""
        pass
    
    @abstractmethod
    def check_collision(self, other: 'EntityProtocol') -> Result[bool]:
        """Check collision with another entity"""
        pass
    
    @abstractmethod
    def get_state_dict(self) -> Result[Dict[str, Any]]:
        """Get serializable state"""
        pass
    
    @property
    @abstractmethod
    def active(self) -> bool:
        """Entity active status"""
        pass
    
    @property
    @abstractmethod
    def position(self) -> Vector2Protocol:
        """Entity position"""
        pass


class RenderableProtocol(ABC):
    """Protocol for entities that can be rendered"""
    
    @abstractmethod
    def get_render_data(self) -> Dict[str, Any]:
        """Get rendering data"""
        pass
    
    @property
    @abstractmethod
    def radius(self) -> float:
        """Entity radius for collision detection"""
        pass


class CollectableProtocol(ABC):
    """Protocol for entities that can be collected"""
    
    @abstractmethod
    def collect(self) -> Dict[str, Any]:
        """Collect the entity and return collection data"""
        pass
    
    @property
    @abstractmethod
    def collectable(self) -> bool:
        """Whether entity can be collected"""
        pass


class PhysicsProtocol(ABC):
    """Protocol for entities with physics properties"""
    
    @abstractmethod
    def apply_thrust(self, thrust_magnitude: float) -> Result[None]:
        """Apply thrust force"""
        pass
    
    @abstractmethod
    def rotate(self, angular_velocity: float) -> Result[None]:
        """Set angular velocity"""
        pass
    
    @property
    @abstractmethod
    def velocity(self) -> Vector2Protocol:
        """Current velocity"""
        pass
    
    @property
    @abstractmethod
    def heading(self) -> float:
        """Current heading in radians"""
        pass


class ScrapEntityProtocol(EntityProtocol, RenderableProtocol, CollectableProtocol):
    """Combined protocol for scrap entities"""
    pass


class ShipEntityProtocol(EntityProtocol, RenderableProtocol, PhysicsProtocol):
    """Combined protocol for ship entities"""
    pass


class AsteroidEntityProtocol(EntityProtocol, RenderableProtocol):
    """Combined protocol for asteroid entities"""
    
    @abstractmethod
    def split_asteroid(self) -> Result[List['AsteroidEntityProtocol']]:
        """Split asteroid into smaller pieces"""
        pass
