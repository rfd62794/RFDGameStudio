"""
Shared Gravity Systems
SRP: Newtonian attraction between points.
"""
import math
from .kinematics import Vector2, Kinematics

def calculate_attraction(pos1: Vector2, pos2: Vector2, mass_product: float, g: float = 100.0) -> Vector2:
    """Calculate gravitational force vector between two points."""
    direction = pos2 - pos1
    distance_sq = max(1.0, direction.magnitude()**2)
    force_magnitude = (g * mass_product) / distance_sq
    return direction.normalize() * force_magnitude

def apply_point_gravity(entity: Kinematics, target_pos: Vector2, strength: float, dt: float):
    """Pull entity toward a target position."""
    force = calculate_attraction(entity.position, target_pos, strength)
    entity.apply_force(force, dt)
