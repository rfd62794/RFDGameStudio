"""
KineticBody Component - Newtonian Physics with Toroidal Wrapping
SRP: Handles velocity, thrust, and screen wrapping for any movable entity
"""

import math
from typing import Tuple, Optional
from dataclasses import dataclass
from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT


@dataclass
class Vector2D:
    """2D vector for physics calculations"""
    x: float
    y: float
    
    def __add__(self, other: 'Vector2D') -> 'Vector2D':
        return Vector2D(self.x + other.x, self.y + other.y)
    
    def __mul__(self, scalar: float) -> 'Vector2D':
        return Vector2D(self.x * scalar, self.y * scalar)
    
    def magnitude(self) -> float:
        return math.sqrt(self.x**2 + self.y**2)
    
    def normalize(self) -> 'Vector2D':
        mag = self.magnitude()
        if mag == 0:
            return Vector2D(0, 0)
        return Vector2D(self.x / mag, self.y / mag)


@dataclass
class KineticState:
    """Complete kinetic state of an entity"""
    position: Vector2D
    velocity: Vector2D
    angle: float  # Radians
    angular_velocity: float = 0.0
    
    def copy(self) -> 'KineticState':
        return KineticState(
            position=Vector2D(self.position.x, self.position.y),
            velocity=Vector2D(self.velocity.x, self.velocity.y),
            angle=self.angle,
            angular_velocity=self.angular_velocity
        )


class KineticBody:
    """
    Drop-in component for Newtonian physics with toroidal screen wrapping.
    Provides the "floaty" feel essential for arcade classics.
    """
    
    def __init__(self, 
                 initial_position: Optional[Vector2D] = None,
                 initial_velocity: Optional[Vector2D] = None,
                 initial_angle: float = 0.0):
        """
        Initialize kinetic body
        
        Args:
            initial_position: Starting position (defaults to screen center)
            initial_velocity: Starting velocity (defaults to stationary)
            initial_angle: Starting angle in radians (0 = pointing right)
        """
        self.state = KineticState(
            position=initial_position or Vector2D(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2),
            velocity=initial_velocity or Vector2D(0, 0),
            angle=initial_angle
        )
        
        # Physics parameters
        self.thrust_power = 50.0  # Units per second
        self.rotation_speed = 3.0  # Radians per second
        self.max_velocity = 200.0  # Maximum velocity magnitude
        
        # Damping for arcade feel
        self.velocity_damping = 0.99  # Slight velocity reduction per frame
        self.angular_damping = 0.95   # Angular velocity reduction
        
    def apply_thrust(self, magnitude: float, dt: float) -> None:
        """
        Apply thrust in the direction the entity is facing
        
        Args:
            magnitude: Thrust magnitude (-1.0 to 1.0, where negative = reverse)
            dt: Time delta in seconds
        """
        # Calculate thrust vector
        thrust_direction = Vector2D(
            math.cos(self.state.angle),
            math.sin(self.state.angle)
        )
        
        # Apply thrust to velocity
        thrust_force = thrust_direction * (magnitude * self.thrust_power * dt)
        self.state.velocity = self.state.velocity + thrust_force
        
        # Limit maximum velocity
        if self.state.velocity.magnitude() > self.max_velocity:
            self.state.velocity = self.state.velocity.normalize() * self.max_velocity
    
    def apply_rotation(self, direction: float, dt: float) -> None:
        """
        Apply rotation
        
        Args:
            direction: Rotation direction (-1.0 to 1.0)
            dt: Time delta in seconds
        """
        self.state.angular_velocity = direction * self.rotation_speed
        self.state.angle += self.state.angular_velocity * dt
        
        # Normalize angle to [0, 2π]
        self.state.angle = self.state.angle % (2 * math.pi)
    
    def update(self, dt: float) -> None:
        """
        Update physics simulation for one time step
        
        Args:
            dt: Time delta in seconds
        """
        # Update position based on velocity
        self.state.position = self.state.position + (self.state.velocity * dt)
        
        # Apply toroidal wrapping
        self.state.position.x = self.state.position.x % SOVEREIGN_WIDTH
        self.state.position.y = self.state.position.y % SOVEREIGN_HEIGHT
        
        # Apply damping for arcade feel
        self.state.velocity = self.state.velocity * self.velocity_damping
        self.state.angular_velocity *= self.angular_damping
        
        # Stop very small velocities (precision threshold)
        if self.state.velocity.magnitude() < 0.1:
            self.state.velocity = Vector2D(0, 0)
    
    def get_forward_vector(self) -> Vector2D:
        """Get the forward direction vector"""
        return Vector2D(math.cos(self.state.angle), math.sin(self.state.angle))
    
    def get_position_tuple(self) -> Tuple[float, float]:
        """Get position as (x, y) tuple for rendering"""
        return (self.state.position.x, self.state.position.y)
    
    def set_position(self, x: float, y: float) -> None:
        """Set position directly (for respawning, teleporting, etc.)"""
        self.state.position = Vector2D(x, y)
    
    def set_angle(self, angle: float) -> None:
        """Set angle directly in radians"""
        self.state.angle = angle % (2 * math.pi)
    
    def stop(self) -> None:
        """Stop all movement"""
        self.state.velocity = Vector2D(0, 0)
        self.state.angular_velocity = 0.0
    
    def get_state_copy(self) -> KineticState:
        """Get a copy of the current kinetic state"""
        return self.state.copy()
    
    def restore_state(self, state: KineticState) -> None:
        """Restore a previously saved state"""
        self.state = state.copy()


# Factory functions for common arcade patterns
def create_player_ship(start_x: float = None, start_y: float = None) -> KineticBody:
    """Create a player ship with standard arcade physics"""
    if start_x is None:
        start_x = SOVEREIGN_WIDTH / 2
    if start_y is None:
        start_y = SOVEREIGN_HEIGHT / 2
    
    return KineticBody(
        initial_position=Vector2D(start_x, start_y),
        initial_angle=0.0  # Pointing right
    )


def create_asteroid(start_x: float, start_y: float, 
                   velocity_x: float, velocity_y: float) -> KineticBody:
    """Create an asteroid with initial velocity"""
    return KineticBody(
        initial_position=Vector2D(start_x, start_y),
        initial_velocity=Vector2D(velocity_x, velocity_y)
    )


def create_projectile(start_x: float, start_y: float, angle: float,
                     speed: float = 300.0) -> KineticBody:
    """Create a projectile with high-speed motion"""
    velocity = Vector2D(
        math.cos(angle) * speed,
        math.sin(angle) * speed
    )
    
    body = KineticBody(
        initial_position=Vector2D(start_x, start_y),
        initial_velocity=velocity,
        initial_angle=angle
    )
    
    # Projectiles don't rotate or dampen
    body.angular_damping = 1.0
    body.velocity_damping = 1.0
    
    return body
