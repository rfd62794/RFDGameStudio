"""
KineticBody Component - Physics Foundation for Entities

Sprint E1: Turbo Entity Synthesis - Component Layer
ADR 216: Component Composition over Inheritance

Provides the physical foundation for all entities in the DGT Platform.
This component handles movement, collision, and physics calculations
while remaining independent of specific entity types.
"""

from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
import math

from foundation.types import Result
from foundation.protocols import Vector2Protocol
from foundation.vector import Vector2


@dataclass
class PhysicsStats:
    """Physical statistics derived from genetic traits"""
    max_speed: float
    acceleration: float
    deceleration: float
    turn_rate: float
    mass: float
    drag_coefficient: float
    collision_radius: float


@dataclass
class KineticState:
    """Current kinetic state of an entity"""
    position: Vector2
    velocity: Vector2
    acceleration: Vector2
    heading: float  # Angle in radians
    angular_velocity: float
    
    def copy(self) -> 'KineticState':
        """Create a copy of the kinetic state"""
        return KineticState(
            position=self.position.copy(),
            velocity=self.velocity.copy(),
            acceleration=self.acceleration.copy(),
            heading=self.heading,
            angular_velocity=self.angular_velocity
        )


class KineticBody:
    """
    Kinetic Body Component - Physics Foundation
    
    Provides physics calculations and movement for entities.
    Designed to be composed into entity classes rather than inherited.
    """
    
    def __init__(self, initial_state: KineticState, physics_stats: PhysicsStats):
        self.state = initial_state.copy()
        self.stats = physics_stats
        self._active = True
        
        # Physics constants
        self.dt = 1.0 / 60.0  # 60Hz physics timestep
        
        # Performance tracking
        self.update_count = 0
        self.total_distance_traveled = 0.0
        self.last_position = self.state.position.copy()
    
    def apply_thrust(self, thrust_magnitude: float) -> Result[None]:
        """
        Apply thrust force in the direction of current heading.
        
        Args:
            thrust_magnitude: Magnitude of thrust force
            
        Returns:
            Result indicating success
        """
        try:
            # Calculate thrust vector
            thrust_direction = Vector2(math.cos(self.state.heading), math.sin(self.state.heading))
            thrust_force = thrust_direction * thrust_magnitude
            
            # Apply acceleration (F = ma, so a = F/m)
            self.state.acceleration = thrust_force / self.stats.mass
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to apply thrust: {str(e)}")
    
    def rotate(self, angular_velocity: float) -> Result[None]:
        """
        Set angular velocity for rotation.
        
        Args:
            angular_velocity: Angular velocity in radians/second
            
        Returns:
            Result indicating success
        """
        try:
            # Clamp to maximum turn rate
            self.state.angular_velocity = max(-self.stats.turn_rate, 
                                           min(self.stats.turn_rate, angular_velocity))
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to rotate: {str(e)}")
    
    def update(self, dt: float) -> Result[None]:
        """
        Update physics simulation for one timestep.
        
        Args:
            dt: Time delta in seconds
            
        Returns:
            Result indicating success
        """
        try:
            if not self._active:
                return Result.success_result(None)
            
            # Update heading
            self.state.heading += self.state.angular_velocity * dt
            
            # Apply drag to acceleration
            drag_force = self.state.velocity * (-self.stats.drag_coefficient)
            total_acceleration = self.state.acceleration + drag_force
            
            # Update velocity
            self.state.velocity = self.state.velocity + total_acceleration * dt
            
            # Apply speed limit
            if self.state.velocity.magnitude() > self.stats.max_speed:
                self.state.velocity = self.state.velocity.normalize() * self.stats.max_speed
            
            # Update position
            old_position = self.state.position.copy()
            self.state.position = self.state.position + self.state.velocity * dt
            
            # Track distance traveled
            distance = self.state.position.distance_to(old_position)
            self.total_distance_traveled += distance
            
            # Reset acceleration
            self.state.acceleration = Vector2(0, 0)
            
            # Update performance metrics
            self.update_count += 1
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to update physics: {str(e)}")
    
    def apply_brake(self, brake_strength: float) -> Result[None]:
        """
        Apply braking force to reduce velocity.
        
        Args:
            brake_strength: Brake strength (0.0 to 1.0)
            
        Returns:
            Result indicating success
        """
        try:
            # Calculate brake force opposite to velocity
            if self.state.velocity.magnitude() > 0:
                brake_direction = self.state.velocity.normalize() * -1
                brake_force = brake_direction * (brake_strength * self.stats.deceleration)
                self.state.acceleration = brake_force
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to apply brake: {str(e)}")
    
    def get_speed(self) -> float:
        """Get current speed"""
        return self.state.velocity.magnitude()
    
    def get_kinetic_energy(self) -> float:
        """Calculate kinetic energy (0.5 * m * v^2)"""
        return 0.5 * self.stats.mass * self.state.velocity.magnitude_squared()
    
    def get_momentum(self) -> Vector2:
        """Calculate momentum (m * v)"""
        return self.state.velocity * self.stats.mass
    
    def is_moving(self) -> bool:
        """Check if entity is moving"""
        return self.state.velocity.magnitude() > 0.01
    
    def stop(self) -> Result[None]:
        """Stop all movement"""
        try:
            self.state.velocity = Vector2(0, 0)
            self.state.acceleration = Vector2(0, 0)
            self.state.angular_velocity = 0.0
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to stop: {str(e)}")
    
    def set_active(self, active: bool) -> None:
        """Set active state"""
        self._active = active
    
    def is_active(self) -> bool:
        """Get active state"""
        return self._active
    
    def get_state_dict(self) -> Dict[str, Any]:
        """Get current state as dictionary"""
        return {
            'position': self.state.position.to_tuple(),
            'velocity': self.state.velocity.to_tuple(),
            'acceleration': self.state.acceleration.to_tuple(),
            'heading': self.state.heading,
            'angular_velocity': self.state.angular_velocity,
            'speed': self.get_speed(),
            'kinetic_energy': self.get_kinetic_energy(),
            'active': self._active,
            'update_count': self.update_count,
            'total_distance_traveled': self.total_distance_traveled
        }
    
    def get_stats_dict(self) -> Dict[str, Any]:
        """Get physics statistics as dictionary"""
        return {
            'max_speed': self.stats.max_speed,
            'acceleration': self.stats.acceleration,
            'deceleration': self.stats.deceleration,
            'turn_rate': self.stats.turn_rate,
            'mass': self.stats.mass,
            'drag_coefficient': self.stats.drag_coefficient,
            'collision_radius': self.stats.collision_radius
        }


# === FACTORY FUNCTIONS ===

def create_default_kinetic_body(position: Tuple[float, float]) -> KineticBody:
    """Create a kinetic body with default physics stats"""
    initial_state = KineticState(
        position=Vector2(position[0], position[1]),
        velocity=Vector2(0, 0),
        acceleration=Vector2(0, 0),
        heading=0.0,
        angular_velocity=0.0
    )
    
    physics_stats = PhysicsStats(
        max_speed=50.0,
        acceleration=10.0,
        deceleration=5.0,
        turn_rate=math.pi,  # 180 degrees per second
        mass=10.0,
        drag_coefficient=0.1,
        collision_radius=5.0
    )
    
    return KineticBody(initial_state, physics_stats)


def create_fast_kinetic_body(position: Tuple[float, float]) -> KineticBody:
    """Create a kinetic body optimized for speed"""
    initial_state = KineticState(
        position=Vector2(position[0], position[1]),
        velocity=Vector2(0, 0),
        acceleration=Vector2(0, 0),
        heading=0.0,
        angular_velocity=0.0
    )
    
    physics_stats = PhysicsStats(
        max_speed=100.0,
        acceleration=15.0,
        deceleration=8.0,
        turn_rate=math.pi * 1.5,  # 270 degrees per second
        mass=5.0,
        drag_coefficient=0.05,
        collision_radius=4.0
    )
    
    return KineticBody(initial_state, physics_stats)


def create_heavy_kinetic_body(position: Tuple[float, float]) -> KineticBody:
    """Create a kinetic body optimized for mass/stability"""
    initial_state = KineticState(
        position=Vector2(position[0], position[1]),
        velocity=Vector2(0, 0),
        acceleration=Vector2(0, 0),
        heading=0.0,
        angular_velocity=0.0
    )
    
    physics_stats = PhysicsStats(
        max_speed=25.0,
        acceleration=5.0,
        deceleration=3.0,
        turn_rate=math.pi * 0.5,  # 90 degrees per second
        mass=20.0,
        drag_coefficient=0.2,
        collision_radius=8.0
    )
    
    return KineticBody(initial_state, physics_stats)


# === EXPORTS ===

__all__ = [
    'PhysicsStats',
    'KineticState', 
    'KineticBody',
    'create_default_kinetic_body',
    'create_fast_kinetic_body',
    'create_heavy_kinetic_body'
]
