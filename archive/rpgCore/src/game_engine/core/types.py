"""
Core Type Definitions

Fundamental vector types and mathematical utilities used throughout the engine.
These are immutable, serializable, and have zero external dependencies.
"""

from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class Vector2:
    """
    2D Vector with x and y components.

    Immutable and hashable for use in collections.
    """
    x: float
    y: float

    def __add__(self, other: "Vector2") -> "Vector2":
        return Vector2(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Vector2") -> "Vector2":
        return Vector2(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Vector2":
        return Vector2(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar: float) -> "Vector2":
        return self.__mul__(scalar)

    def __truediv__(self, scalar: float) -> "Vector2":
        if scalar == 0:
            raise ValueError("Cannot divide vector by zero")
        return Vector2(self.x / scalar, self.y / scalar)

    def magnitude(self) -> float:
        """Calculate the magnitude (length) of the vector."""
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def normalized(self) -> "Vector2":
        """Return a normalized (unit length) version of this vector."""
        mag = self.magnitude()
        if mag == 0:
            return Vector2(0, 0)
        return self / mag

    def dot(self, other: "Vector2") -> float:
        """Calculate the dot product with another vector."""
        return self.x * other.x + self.y * other.y

    def to_tuple(self) -> Tuple[float, float]:
        """Convert to (x, y) tuple."""
        return (self.x, self.y)

    @staticmethod
    def from_tuple(t: Tuple[float, float]) -> "Vector2":
        """Create Vector2 from (x, y) tuple."""
        return Vector2(t[0], t[1])


@dataclass(frozen=True)
class Vector3:
    """
    3D Vector with x, y, and z components.

    Immutable and hashable for use in collections.
    """
    x: float
    y: float
    z: float

    def __add__(self, other: "Vector3") -> "Vector3":
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

    def __sub__(self, other: "Vector3") -> "Vector3":
        return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)

    def __mul__(self, scalar: float) -> "Vector3":
        return Vector3(self.x * scalar, self.y * scalar, self.z * scalar)

    def __rmul__(self, scalar: float) -> "Vector3":
        return self.__mul__(scalar)

    def __truediv__(self, scalar: float) -> "Vector3":
        if scalar == 0:
            raise ValueError("Cannot divide vector by zero")
        return Vector3(self.x / scalar, self.y / scalar, self.z / scalar)

    def magnitude(self) -> float:
        """Calculate the magnitude (length) of the vector."""
        return (self.x ** 2 + self.y ** 2 + self.z ** 2) ** 0.5

    def normalized(self) -> "Vector3":
        """Return a normalized (unit length) version of this vector."""
        mag = self.magnitude()
        if mag == 0:
            return Vector3(0, 0, 0)
        return self / mag

    def dot(self, other: "Vector3") -> float:
        """Calculate the dot product with another vector."""
        return self.x * other.x + self.y * other.y + self.z * other.z

    def cross(self, other: "Vector3") -> "Vector3":
        """Calculate the cross product with another vector."""
        return Vector3(
            self.y * other.z - self.z * other.y,
            self.z * other.x - self.x * other.z,
            self.x * other.y - self.y * other.x,
        )

    def to_tuple(self) -> Tuple[float, float, float]:
        """Convert to (x, y, z) tuple."""
        return (self.x, self.y, self.z)

    @staticmethod
    def from_tuple(t: Tuple[float, float, float]) -> "Vector3":
        """Create Vector3 from (x, y, z) tuple."""
        return Vector3(t[0], t[1], t[2])
