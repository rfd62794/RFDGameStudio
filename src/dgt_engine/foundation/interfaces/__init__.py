"""
DGT Platform - Interface Definitions

This package contains all Protocol definitions and abstract base classes
that enforce the Three-Tier Architecture and enable dependency injection.

All components must implement the appropriate Protocol before
any concrete implementation can be added.

Phase 1 Priority: Interface Definition & Hardening
"""

from .protocols import (
    EngineProtocol,
    RenderProtocol,
    StateProtocol,
    DIProtocol,
    PPUProtocol,
    PhysicsProtocol,
    SpaceEntityProtocol,
    ScrapProtocol,
    TerminalHandshakeProtocol,
)

from .entity_protocol import (
    EntityProtocol,
    RenderableProtocol,
    CollectableProtocol,
    PhysicsProtocol as EntityPhysicsProtocol,
    ScrapEntityProtocol,
    ShipEntityProtocol,
    AsteroidEntityProtocol,
)

from .visuals import (
    AnimationState,
    SpriteCoordinate,
)

from ..base import (
    BaseEngine,
    BaseRenderer,
    BaseStateManager,
)

__all__ = [
    # Engine-level Protocols
    "EngineProtocol",
    "RenderProtocol", 
    "StateProtocol",
    "DIProtocol",
    "PPUProtocol",
    "PhysicsProtocol",
    "SpaceEntityProtocol",
    "ScrapProtocol",
    "TerminalHandshakeProtocol",
    
    # Entity-level Protocols
    "EntityProtocol",
    "RenderableProtocol",
    "CollectableProtocol",
    "EntityPhysicsProtocol",
    "ScrapEntityProtocol",
    "ShipEntityProtocol",
    "AsteroidEntityProtocol",
    
    # Visual Shared Types
    "AnimationState",
    "SpriteCoordinate",
    
    # Abstract Base Classes
    "BaseEngine",
    "BaseRenderer",
    "BaseStateManager",
]

