"""
Shared Physics Kinematics
SRP: Generalized Newtonian components for entities.
"""
import math
from dataclasses import dataclass, field
from typing import Tuple, Optional

@dataclass
class Vector2:
    """Standard 2D vector logic."""
    x: float
    y: float
    
    def __add__(self, other: 'Vector2') -> 'Vector2':
        return Vector2(self.x + other.x, self.y + other.y)
    
    def __sub__(self, other: 'Vector2') -> 'Vector2':
        return Vector2(self.x - other.x, self.y - other.y)
    
    def __mul__(self, scalar: float) -> 'Vector2':
        return Vector2(self.x * scalar, self.y * scalar)
    
    def magnitude(self) -> float:
        return math.sqrt(self.x**2 + self.y**2)
    
    def normalize(self) -> 'Vector2':
        mag = self.magnitude()
        if mag == 0:
            return Vector2(0, 0)
        return Vector2(self.x / mag, self.y / mag)

@dataclass
class Kinematics:
    """Generalized physics state for an entity."""
    position: Vector2
    velocity: Vector2
    acceleration: Vector2 = field(default_factory=lambda: Vector2(0, 0))
    angle: float = 0.0
    angular_velocity: float = 0.0
    drag: float = 0.0  # Force applied opposite to velocity
    angular_drag: float = 0.0

    def apply_force(self, force: Vector2, dt: float):
        """Apply force to acceleration."""
        self.velocity = self.velocity + (force * dt)

    def update(self, dt: float):
        """Update position and velocity."""
        # Apply drag
        if self.drag > 0:
            speed = self.velocity.magnitude()
            if speed > 0:
                drag_force = self.velocity.normalize() * (-self.drag * speed * dt)
                self.velocity = self.velocity + drag_force
                # Prevent oscillation around zero
                if self.velocity.magnitude() > speed:
                    self.velocity = Vector2(0, 0)

        # Update position
        self.position = self.position + (self.velocity * dt)
        
        # Update orientation
        self.angle += self.angular_velocity * dt
        
        # Apply angular drag
        if self.angular_drag > 0:
            original_av = self.angular_velocity
            decay = 1.0 - (self.angular_drag * dt)
            self.angular_velocity *= max(0, decay)
