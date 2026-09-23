"""
Kinetic Pawn - The Physical Body
"""

from typing import Tuple, List, Optional
from dataclasses import dataclass, field
import math

# Use relative imports if possible, or absolute
from foundation.vector import Vector2
from foundation.types import Result

# Constants for default wrapping (can be overridden)
SOVEREIGN_WIDTH = 160
SOVEREIGN_HEIGHT = 144

@dataclass
class KineticPawn:
    """
    Physical representation of an entity in the game world.
    Handles Newtonian physics, movement, and collision bounds.
    """
    
    # Core Physics
    position: Vector2
    velocity: Vector2 = field(default_factory=lambda: Vector2(0, 0))
    heading: float = 0.0  # Radians
    
    # Physical Properties
    mass: float = 1.0
    radius: float = 4.0
    friction: float = 0.0  # 0.0 = frictionless space
    
    # State
    active: bool = True
    angular_velocity: float = 0.0
    
    def update(self, dt: float) -> Result[None]:
        """Update physics state for one tick"""
        try:
            if not self.active:
                return Result.success_result(None)
            
            # 1. Update Position (Velocity * Time)
            self.position = self.position + (self.velocity * dt)
            
            # 2. Update Heading (Angular Velocity * Time)
            if self.angular_velocity != 0:
                self.heading = (self.heading + (self.angular_velocity * dt)) % (2 * math.pi)
            
            # 3. Apply Friction (if any)
            if self.friction > 0:
                self.velocity = self.velocity * (1.0 - (self.friction * dt))
                
            # 4. Enforce Toroidal Wrap
            self._apply_toroidal_wrap()
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"KineticPawn update failed: {e}")

    def apply_force(self, force: Vector2, dt: float) -> None:
        """Apply a force vector to the pawn (F=ma -> a=F/m)"""
        acceleration = force / self.mass
        self.velocity = self.velocity + (acceleration * dt)

    def apply_thrust(self, magnitude: float, dt: float) -> None:
        """Apply thrust in the direction of heading"""
        force_vector = Vector2.from_angle(self.heading, magnitude)
        self.apply_force(force_vector, dt)

    def _apply_toroidal_wrap(self) -> None:
        """Wrap position around the 160x144 sovereign bounds"""
        if self.position.x < 0:
            self.position.x += SOVEREIGN_WIDTH
        elif self.position.x >= SOVEREIGN_WIDTH:
            self.position.x -= SOVEREIGN_WIDTH
            
        if self.position.y < 0:
            self.position.y += SOVEREIGN_HEIGHT
        elif self.position.y >= SOVEREIGN_HEIGHT:
            self.position.y -= SOVEREIGN_HEIGHT
            
    def get_render_position(self) -> Tuple[int, int]:
        """Get integer coordinates for rendering"""
        return int(self.position.x), int(self.position.y)
