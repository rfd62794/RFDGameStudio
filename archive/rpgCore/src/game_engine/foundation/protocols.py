"""
Foundation Protocols and Type Definitions

Pure protocol definitions that allow Tier 1 (Foundation) to interact
with higher tiers without direct imports. This enables loose coupling
between architectural layers.

Protocols define contracts that any conforming type can satisfy.
"""

from typing import Protocol, runtime_checkable, Tuple, Any, Optional, Dict, List
from abc import abstractmethod


# === VECTOR PROTOCOLS ===

@runtime_checkable
class Vector2Protocol(Protocol):
    """Protocol for 2D vector operations."""

    @property
    def x(self) -> float:
        """X component."""
        ...

    @property
    def y(self) -> float:
        """Y component."""
        ...

    def __add__(self, other: 'Vector2Protocol') -> 'Vector2Protocol':
        """Add two vectors."""
        ...

    def __sub__(self, other: 'Vector2Protocol') -> 'Vector2Protocol':
        """Subtract two vectors."""
        ...

    def __mul__(self, scalar: float) -> 'Vector2Protocol':
        """Multiply vector by scalar."""
        ...

    def __rmul__(self, scalar: float) -> 'Vector2Protocol':
        """Multiply vector by scalar (reverse)."""
        ...

    def __truediv__(self, scalar: float) -> 'Vector2Protocol':
        """Divide vector by scalar."""
        ...

    def magnitude(self) -> float:
        """Calculate vector magnitude."""
        ...

    def normalized(self) -> 'Vector2Protocol':
        """Return normalized vector."""
        ...

    def dot(self, other: 'Vector2Protocol') -> float:
        """Dot product with another vector."""
        ...

    def to_tuple(self) -> Tuple[float, float]:
        """Convert to tuple."""
        ...


@runtime_checkable
class Vector3Protocol(Protocol):
    """Protocol for 3D vector operations."""

    @property
    def x(self) -> float:
        """X component."""
        ...

    @property
    def y(self) -> float:
        """Y component."""
        ...

    @property
    def z(self) -> float:
        """Z component."""
        ...

    def __add__(self, other: 'Vector3Protocol') -> 'Vector3Protocol':
        """Add two vectors."""
        ...

    def __sub__(self, other: 'Vector3Protocol') -> 'Vector3Protocol':
        """Subtract two vectors."""
        ...

    def __mul__(self, scalar: float) -> 'Vector3Protocol':
        """Multiply vector by scalar."""
        ...

    def magnitude(self) -> float:
        """Calculate vector magnitude."""
        ...

    def normalized(self) -> 'Vector3Protocol':
        """Return normalized vector."""
        ...

    def dot(self, other: 'Vector3Protocol') -> float:
        """Dot product with another vector."""
        ...

    def cross(self, other: 'Vector3Protocol') -> 'Vector3Protocol':
        """Cross product with another vector."""
        ...

    def to_tuple(self) -> Tuple[float, float, float]:
        """Convert to tuple."""
        ...


# === ENTITY PROTOCOLS ===

@runtime_checkable
class EntityProtocol(Protocol):
    """Protocol for game entities."""

    @property
    def id(self) -> str:
        """Unique entity ID."""
        ...

    @property
    def position(self) -> Vector2Protocol:
        """Entity world position."""
        ...

    @property
    def active(self) -> bool:
        """Whether entity is active."""
        ...

    def update(self, delta_time: float) -> None:
        """Update entity state."""
        ...

    def destroy(self) -> None:
        """Destroy the entity."""
        ...


# === GAME STATE PROTOCOLS ===

@runtime_checkable
class GameStateProtocol(Protocol):
    """Protocol for game state containers."""

    def get_state(self, key: str) -> Any:
        """Get state value."""
        ...

    def set_state(self, key: str, value: Any) -> None:
        """Set state value."""
        ...

    def has_state(self, key: str) -> bool:
        """Check if state key exists."""
        ...

    def get_all_state(self) -> Dict[str, Any]:
        """Get all state."""
        ...


# === TIME PROTOCOLS ===

@runtime_checkable
class ClockProtocol(Protocol):
    """Protocol for time management."""

    @property
    def delta_time(self) -> float:
        """Time since last frame."""
        ...

    @property
    def total_time(self) -> float:
        """Total elapsed time."""
        ...

    @property
    def frame_count(self) -> int:
        """Number of frames."""
        ...

    def update(self, elapsed_seconds: float) -> None:
        """Update clock."""
        ...


# === RENDER PROTOCOLS ===

@runtime_checkable
class RenderPacketProtocol(Protocol):
    """Protocol for rendering data packets."""

    @property
    def layer(self) -> int:
        """Rendering layer/depth."""
        ...

    @property
    def data(self) -> bytes:
        """Raw render data."""
        ...

    @property
    def width(self) -> int:
        """Render width."""
        ...

    @property
    def height(self) -> int:
        """Render height."""
        ...


# === CONFIG PROTOCOLS ===

@runtime_checkable
class ConfigProtocol(Protocol):
    """Protocol for configuration objects."""

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        ...

    def set(self, key: str, value: Any) -> None:
        """Set configuration value."""
        ...

    def validate(self) -> bool:
        """Validate configuration."""
        ...
