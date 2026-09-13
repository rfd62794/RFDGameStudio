"""
DGT Space Physics - ADR 130 Implementation
Real-time Newtonian physics engine for space combat simulation

Refactored for Component-Lite Architecture (ADR 168)
"""

import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from engines.kernel.components import PhysicsComponent
from foundation.system_clock import SystemClock

class CombatIntent(str, Enum):
    """AI combat intent states"""
    PURSUIT = "pursuit"           # Aggressive target chase
    STRAFE = "strafe"             # Broadside maneuvering
    RETREAT = "retreat"           # Tactical withdrawal
    EVADE = "evade"               # Defensive dodging
    LOCKED = "locked"             # Weapon lock achieved


@dataclass
class PIDController:
    """PID controller for smooth rotation and movement"""
    kp: float = 1.0
    ki: float = 0.0
    kd: float = 0.0
    integral: float = 0.0
    previous_error: float = 0.0
    
    def update(self, error: float, dt: float) -> float:
        """Update PID controller and return control output"""
        # Proportional term
        p_term = self.kp * error
        
        # Integral term
        self.integral += error * dt
        i_term = self.ki * self.integral
        
        # Derivative term
        derivative = (error - self.previous_error) / dt if dt > 0 else 0.0
        d_term = self.kd * derivative
        
        self.previous_error = error
        
        return p_term + i_term + d_term
    
    def reset(self):
        """Reset PID controller state"""
        self.integral = 0.0
        self.previous_error = 0.0


class SpaceVoyagerEngine:
    """Newtonian physics engine with PID-controlled navigation"""
    
    def __init__(self, thrust_power: float = 0.5, rotation_speed: float = 5.0, target_fps: float = 60.0):
        self.thrust_power = thrust_power
        self.rotation_speed = rotation_speed
        
        # PID controllers for smooth movement
        self.rotation_pid = PIDController(kp=2.0, ki=0.1, kd=0.5)
        self.thrust_pid = PIDController(kp=1.0, ki=0.0, kd=0.2)
        
        # Physics parameters
        self.max_velocity = 10.0
        self.max_angular_velocity = 15.0
        
        # Target tracking
        self.target_position: Optional[Tuple[float, float]] = None
        self.command_confidence: float = 1.0
        
        # System clock for consistent timing
        self.system_clock = SystemClock(target_fps=target_fps, max_cpu_usage=75.0)
        
        logger.debug(f"🚀 SpaceVoyagerEngine initialized (Component-Lite) at {target_fps} FPS")
    
    def update(self, physics: PhysicsComponent, dt: float = 0.016) -> Dict[str, Any]:
        """Update physics component with Newtonian mechanics"""
        
        # 1. Apply Physics (Inertia & Drag)
        self._apply_physics(physics, dt)
        
        return {
            "x": physics.x,
            "y": physics.y,
            "vx": physics.velocity_x,
            "vy": physics.velocity_y
        }
    
    def _apply_physics(self, physics: PhysicsComponent, dt: float):
        """Apply Newtonian physics and constraints"""
        
        # Apply manual thrust (if set via thrust_input_x/y)
        if physics.thrust_input_x != 0 or physics.thrust_input_y != 0:
            # Calculate thrust magnitude for energy drain
            thrust_msg = math.sqrt(physics.thrust_input_x**2 + physics.thrust_input_y**2)
            
            # Energy Drain: (Thrust * Rate) * (Mass / 10.0)
            # Heavier ships drain battery significantly faster
            mass_factor = max(1.0, physics.mass / 10.0)
            energy_drain = thrust_msg * physics.base_drain_rate * mass_factor * dt
            
            if physics.energy > 0:
                physics.energy = max(0.0, physics.energy - energy_drain)
                
                # Apply thrust
                accel_x = (physics.thrust_input_x * physics.max_thrust) / physics.mass
                accel_y = (physics.thrust_input_y * physics.max_thrust) / physics.mass
                
                physics.velocity_x += accel_x * dt
                physics.velocity_y += accel_y * dt
            else:
                # Dead Drift: No thrust allowed
                pass
            
            # Reset specialized input (impulse-like) if needed, 
            # but usually the input persists until changed. 
            # We assume 'thrust_input' is the current throttle state.
        
        # Apply drag (space friction simulation)
        physics.velocity_x *= physics.drag_coefficient
        physics.velocity_y *= physics.drag_coefficient
        
        # Limit maximum velocity
        speed = math.sqrt(physics.velocity_x**2 + physics.velocity_y**2)
        if speed > self.max_velocity:
            scale = self.max_velocity / speed
            physics.velocity_x *= scale
            physics.velocity_y *= scale
        
        # Update position based on velocity
        # Note: 60 is a normalization factor from original code, kept for consistency
        physics.x += physics.velocity_x * dt * 60  
        physics.y += physics.velocity_y * dt * 60

# Global physics engine instance
space_physics_engine = None

def initialize_space_physics() -> SpaceVoyagerEngine:
    """Initialize global space physics engine"""
    global space_physics_engine
    space_physics_engine = SpaceVoyagerEngine()
    logger.info("🚀 Space Physics Engine initialized")
    return space_physics_engine



