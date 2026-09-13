"""
Kinetic Service - The Physics of Motion

ADR 195: The Newtonian Vector Core
ADR 122: Universal Packet Enforcement

Provides the `KineticEntity` class, a reusable physics component
that handles inertia, drag, and screen wrapping for any game slice
(Asteroids, BattleBot, Trench Racer).

Key Features:
- Inertia: Velocity accumulation and momentum conservation.
- Drag: Configurable resistance (0.0 for space, >0.0 for atmosphere).
- Wrapping: Toroidal screen wrapping for 160x144 bounds.
"""

from typing import Tuple, Optional, List
from dataclasses import dataclass, field
import math

from ...foundation.vector import Vector2
from ...foundation.interfaces.visuals import SpriteCoordinate


@dataclass
class KineticEntity:
    """
    A physics component that manages position, velocity, and motion dynamics.
    Can be composed into larger entities or used standalone.
    """
    
    # Position and Motion
    position: Vector2 = field(default_factory=lambda: Vector2(0.0, 0.0))
    velocity: Vector2 = field(default_factory=lambda: Vector2(0.0, 0.0))
    acceleration: Vector2 = field(default_factory=lambda: Vector2(0.0, 0.0))
    
    # Rotation
    heading: float = 0.0  # Radians, 0 = Right
    angular_velocity: float = 0.0  # Radians per second
    
    # Physics Properties
    mass: float = 1.0
    drag: float = 0.0  # 0.0 = Vacuum, 1.0 = Immediate stop (per second approximation)
    max_velocity: float = 1000.0  # Cap speed to prevent tunneling
    
    # Bounds for Wrapping
    wrap_bounds: Optional[Tuple[int, int]] = (160, 144)
    
    def update(self, dt: float) -> None:
        """
        Update physics state for a single time step.
        Methods: Euler Integration
        
        Args:
            dt: Delta time in seconds.
        """
        # 1. Apply Acceleration to Velocity
        if self.acceleration.magnitude_squared() > 0:
            self.velocity += self.acceleration * dt
            # Reset acceleration (it's instantaneous force usually)
            # In some systems acceleration is persistent, but for thrust we usually set it per frame
            # For now, we'll assume it's cleared or managed externally? 
            # Actually, standard pattern: user sets accel, update applies it.
            # If accel is thrust, it must be cleared or maintained by input.
            # We will NOT clear it here to allow continuous gravity etc.
            
        # 2. Apply Drag (Linear approximation)
        # v_new = v_old * (1 - drag * dt)
        if self.drag > 0:
            drag_factor = 1.0 - (self.drag * dt)
            drag_factor = max(0.0, drag_factor) # Prevent overshoot
            self.velocity *= drag_factor
            
        # 3. Clamp Velocity
        if self.max_velocity > 0:
            self.velocity = self.velocity.clamp_magnitude(self.max_velocity)
            
        # 4. Apply Velocity to Position
        self.position += self.velocity * dt
        
        # 5. Apply Angular Velocity
        if self.angular_velocity != 0:
            self.heading += self.angular_velocity * dt
            self.heading %= (2 * math.pi)
            
        # 6. Apply Screen Wrap
        if self.wrap_bounds:
            self.apply_wrap(self.wrap_bounds)

    def apply_force(self, force: Vector2) -> None:
        """Apply a periodic force (F=ma -> a=F/m)."""
        if self.mass > 0:
            self.acceleration += force * (1.0 / self.mass)

    def set_thrust(self, magnitude: float) -> None:
        """Set acceleration based on heading and magnitude."""
        if self.mass > 0:
            thrust_vector = Vector2.from_angle(self.heading, magnitude)
            self.acceleration = thrust_vector * (1.0 / self.mass)

    def apply_wrap(self, bounds: Tuple[int, int]) -> None:
        """
        Wrap position within toroidal bounds.
        
        Args:
           bounds: (width, height) tuple
        """
        width, height = bounds
        
        # Wrap X
        if self.position.x < 0:
            self.position.x += width
        elif self.position.x >= width:
            self.position.x -= width
            
        # Wrap Y
        if self.position.y < 0:
            self.position.y += height
        elif self.position.y >= height:
            self.position.y -= height

    def to_pixel_coords(self) -> Tuple[int, int]:
        """
        Convert position to integer pixel coordinates.
        Uses rounding to minimize jitter.
        """
        return (int(round(self.position.x)), int(round(self.position.y)))

    def get_wrapped_ghosts(self, margin: float = 8.0) -> List[Vector2]:
        """
        Get positions of toroidal ghosts for rendering.
        
        Args:
            margin: Distance from edge to trigger ghost.
            
        Returns:
            List of Vector2 positions (including the main one).
        """
        if not self.wrap_bounds:
            return [self.position]
            
        width, height = self.wrap_bounds
        ghosts = [self.position]
        
        x, y = self.position.x, self.position.y
        
        near_left = x < margin
        near_right = x > width - margin
        near_top = y < margin
        near_bottom = y > height - margin
        
        if near_left:
            ghosts.append(Vector2(x + width, y))
        elif near_right:
            ghosts.append(Vector2(x - width, y))
            
        if near_top:
            ghosts.append(Vector2(x, y + height))
        elif near_bottom:
            ghosts.append(Vector2(x, y - height))
            
        # Corners
        if near_left and near_top:
            ghosts.append(Vector2(x + width, y + height))
        elif near_right and near_top:
            ghosts.append(Vector2(x - width, y + height))
        elif near_left and near_bottom:
            ghosts.append(Vector2(x + width, y - height))
        elif near_right and near_bottom:
            ghosts.append(Vector2(x - width, y - height))
            
        return ghosts
