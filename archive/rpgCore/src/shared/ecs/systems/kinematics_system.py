"""
KinematicsSystem - Physics update logic for ECS
ADR-006: Systems Return State, Don't Mutate
"""
from typing import List
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.kinematics_component import KinematicsComponent


class KinematicsSystem:
    """Handles physics updates for creatures with KinematicsComponent"""
    
    def update(self, creature, kinematics: KinematicsComponent, dt: float) -> None:
        """Update creature physics using component state"""
        # Apply friction (energy affects how "slippery" they are)
        friction = kinematics.friction + (getattr(creature, 'genome', None).energy * 0.05 if hasattr(creature, 'genome') else 0.0)
        current_velocity = kinematics.get_velocity()
        kinematics.set_velocity(current_velocity * min(0.98, friction))
        
        # Apply forces to velocity (from behavior system)
        forces = getattr(creature, 'forces', Vector2(0, 0))
        new_velocity = kinematics.get_velocity() + (forces * dt)
        
        # Clamp speed
        max_speed = kinematics.max_speed + (getattr(creature, 'genome', None).energy * 150.0 if hasattr(creature, 'genome') else 0.0)
        speed = new_velocity.magnitude()
        if speed > max_speed:
            new_velocity = new_velocity.normalize() * max_speed
        
        kinematics.set_velocity(new_velocity)
        
        # Update position
        kinematics.update_position(dt)
        
        # Reset forces for next frame (forces will be set by behavior system)
        creature.forces = Vector2(0, 0)
        
        # Keep in bounds (legacy behavior from Creature)
        self._handle_bounds(creature, kinematics)
    
    def _handle_bounds(self, creature, kinematics: KinematicsComponent) -> None:
        """Keep creature in bounds (legacy behavior)"""
        width, height = 800, 600  # TODO: Make configurable
        margin = 30
        position = kinematics.get_position()
        velocity = kinematics.get_velocity()
        
        if position.x < margin:
            # Update position directly through kinematics
            if hasattr(kinematics, '_creature'):
                kinematics._creature.kinematics.position.x = margin
                kinematics._creature.kinematics.velocity.x *= -0.5
            # Clear any target position
            if hasattr(creature, '_target_pos'):
                creature._target_pos = None
        elif position.x > width - margin:
            if hasattr(kinematics, '_creature'):
                kinematics._creature.kinematics.position.x = width - margin
                kinematics._creature.kinematics.velocity.x *= -0.5
            if hasattr(creature, '_target_pos'):
                creature._target_pos = None
                
        if position.y < margin:
            if hasattr(kinematics, '_creature'):
                kinematics._creature.kinematics.position.y = margin
                kinematics._creature.kinematics.velocity.y *= -0.5
            if hasattr(creature, '_target_pos'):
                creature._target_pos = None
        elif position.y > height - margin:
            if hasattr(kinematics, '_creature'):
                kinematics._creature.kinematics.position.y = height - margin
                kinematics._creature.kinematics.velocity.y *= -0.5
            if hasattr(creature, '_target_pos'):
                creature._target_pos = None
    
    def update_batch(self, creatures: List, kinematics_components: List[KinematicsComponent], dt: float) -> None:
        """Update multiple creatures efficiently"""
        for creature, kinematics in zip(creatures, kinematics_components):
            self.update(creature, kinematics, dt)
