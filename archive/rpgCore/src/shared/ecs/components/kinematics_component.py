"""
KinematicsComponent - Physics state wrapper for ECS
ADR-005: Components as Views, Not Owners
"""
from dataclasses import dataclass
from typing import Optional

from src.shared.physics.kinematics import Vector2


@dataclass
class KinematicsComponent:
    """Physics state component - wrapper around creature's kinematics data"""
    # Note: This component doesn't own the kinematics data
    # It provides the ECS interface to the creature's existing kinematics
    max_speed: float = 200.0
    friction: float = 0.92
    
    def get_position(self) -> Vector2:
        """Get current position from creature kinematics"""
        creature = getattr(self, '_creature', None)
        if creature:
            return creature.kinematics.position
        return Vector2(0, 0)
    
    def get_velocity(self) -> Vector2:
        """Get current velocity from creature kinematics"""
        creature = getattr(self, '_creature', None)
        if creature:
            return creature.kinematics.velocity
        return Vector2(0, 0)
    
    def set_velocity(self, velocity: Vector2) -> None:
        """Set velocity on creature kinematics"""
        creature = getattr(self, '_creature', None)
        if creature:
            creature.kinematics.velocity = velocity
    
    def apply_force(self, force: Vector2, dt: float) -> None:
        """Apply force to creature kinematics (legacy compatibility)"""
        creature = getattr(self, '_creature', None)
        if creature:
            creature.kinematics.apply_force(force, dt)
    
    def update_position(self, dt: float) -> None:
        """Update position using creature kinematics"""
        creature = getattr(self, '_creature', None)
        if creature:
            creature.kinematics.update(dt)
    
    def set_creature_reference(self, creature) -> None:
        """Set back-reference to creature for state access"""
        self._creature = creature
    
    def get_creature(self):
        """Get creature reference"""
        return getattr(self, '_creature', None)
