"""
Foundation Layer (Tier 1B) - Protocols and Base Classes

System registries, base classes for systems/components, dependency injection,
and protocol definitions. These form the infrastructure that allows all systems
to be composed together.

Depends on: game_engine.core
"""

from src.game_engine.foundation.base_system import (
    BaseSystem,
    BaseComponent,
    SystemConfig,
    SystemStatus,
    PerformanceMetrics,
)
from src.game_engine.foundation.protocols import (
    Vector2Protocol,
    Vector3Protocol,
    EntityProtocol,
    GameStateProtocol,
    ClockProtocol,
    RenderPacketProtocol,
    ConfigProtocol,
)
from src.game_engine.foundation.registry import (
    DGTRegistry,
    RegistryType,
    RegistryEntry,
)
from src.game_engine.foundation.result import Result

__all__ = [
    # Base classes
    "BaseSystem",
    "BaseComponent",
    "SystemConfig",
    "SystemStatus",
    "PerformanceMetrics",
    # Protocols
    "Vector2Protocol",
    "Vector3Protocol",
    "EntityProtocol",
    "GameStateProtocol",
    "ClockProtocol",
    "RenderPacketProtocol",
    "ConfigProtocol",
    # Registry
    "DGTRegistry",
    "RegistryType",
    "RegistryEntry",
    # Result type
    "Result",
]
