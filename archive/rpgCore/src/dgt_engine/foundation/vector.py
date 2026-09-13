"""
Vector2 - Newtonian Physics Vector

ADR 195: The Newtonian Vector Core

Lightweight 2D vector class implementing the core physics
for the "Ur-Asteroids" game slice within the sovereign 160x144 grid.

Optimized for:
- Zero-friction momentum physics
- Fixed-pivot rotation calculations  
- Toroidal wrap boundary detection
- 60Hz update cycles
"""

from typing import Tuple
from dataclasses import dataclass
import math


@dataclass
class Vector2:
    """2D Vector for Newtonian physics calculations"""
    
    x: float
    y: float
    
    def __add__(self, other: 'Vector2') -> 'Vector2':
        """Vector addition for velocity accumulation"""
        return Vector2(self.x + other.x, self.y + other.y)
    
    def copy(self) -> 'Vector2':
        """Create a copy of this vector"""
        return Vector2(self.x, self.y)
    
    def __sub__(self, other: 'Vector2') -> 'Vector2':
        """Vector subtraction for relative positioning"""
        return Vector2(self.x - other.x, self.y - other.y)
    
    def __mul__(self, scalar: float) -> 'Vector2':
        """Scalar multiplication for thrust/damping"""
        return Vector2(self.x * scalar, self.y * scalar)
    
    def __rmul__(self, scalar: float) -> 'Vector2':
        """Right scalar multiplication"""
        return self.__mul__(scalar)
    
    def __truediv__(self, scalar: float) -> 'Vector2':
        """Scalar division for acceleration calculations"""
        return Vector2(self.x / scalar, self.y / scalar)
    
    def magnitude(self) -> float:
        """Calculate vector magnitude (distance from origin)"""
        return math.sqrt(self.x * self.x + self.y * self.y)
    
    def magnitude_squared(self) -> float:
        """Calculate squared magnitude (avoids sqrt for comparisons)"""
        return self.x * self.x + self.y * self.y
    
    def normalize(self) -> 'Vector2':
        """Return normalized unit vector"""
        mag = self.magnitude()
        if mag == 0:
            return Vector2(0, 0)
        return Vector2(self.x / mag, self.y / mag)
    
    def dot(self, other: 'Vector2') -> float:
        """Dot product for angle calculations"""
        return self.x * other.x + self.y * other.y
    
    def rotate(self, angle_rad: float) -> 'Vector2':
        """Rotate vector by angle (radians) - for fixed-pivot turning"""
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)
        return Vector2(
            self.x * cos_a - self.y * sin_a,
            self.x * sin_a + self.y * cos_a
        )
    
    def angle(self) -> float:
        """Get angle in radians from positive x-axis"""
        return math.atan2(self.y, self.x)
    
    def distance_to(self, other: 'Vector2') -> float:
        """Calculate distance to another vector"""
        return (self - other).magnitude()
    
    def distance_squared_to(self, other: 'Vector2') -> float:
        """Calculate squared distance (avoids sqrt for comparisons)"""
        return (self - other).magnitude_squared()
    
    def lerp(self, other: 'Vector2', t: float) -> 'Vector2':
        """Linear interpolation between vectors"""
        return self + (other - self) * t
    
    def reflect(self, normal: 'Vector2') -> 'Vector2':
        """Reflect vector across normal (for collision response)"""
        return self - normal * (2 * self.dot(normal))
    
    def clamp_magnitude(self, max_magnitude: float) -> 'Vector2':
        """Clamp vector to maximum magnitude"""
        if self.magnitude_squared() > max_magnitude * max_magnitude:
            return self.normalize() * max_magnitude
        return self
    
    def to_tuple(self) -> Tuple[float, float]:
        """Convert to tuple for rendering/system calls"""
        return (self.x, self.y)
    
    def to_int_tuple(self) -> Tuple[int, int]:
        """Convert to integer tuple for pixel coordinates"""
        return (int(self.x), int(self.y))
    
    @classmethod
    def from_angle(cls, angle_rad: float, magnitude: float = 1.0) -> 'Vector2':
        """Create vector from angle and magnitude"""
        return cls(
            math.cos(angle_rad) * magnitude,
            math.sin(angle_rad) * magnitude
        )
    
    @classmethod
    def zero(cls) -> 'Vector2':
        """Zero vector constant"""
        return cls(0, 0)
    
    @classmethod
    def up(cls) -> 'Vector2':
        """Up unit vector constant"""
        return cls(0, -1)
    
    @classmethod
    def down(cls) -> 'Vector2':
        """Down unit vector constant"""
        return cls(0, 1)
    
    @classmethod
    def left(cls) -> 'Vector2':
        """Left unit vector constant"""
        return cls(-1, 0)
    
    @classmethod
    def right(cls) -> 'Vector2':
        """Right unit vector constant"""
        return cls(1, 0)
    
    def __repr__(self) -> str:
        return f"Vector2({self.x:.2f}, {self.y:.2f})"
