"""
BehaviorSystem - Behavior update logic for ECS
ADR-006: Systems Return State, Don't Mutate
ADR-007: Demo-Specific Behavior Subclasses
"""
import random
import math
from typing import Optional
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.behavior_component import BehaviorComponent, BehaviorState


class BehaviorSystem:
    """Handles behavior updates for creatures with BehaviorComponent"""
    
    def update(self, creature, behavior: BehaviorComponent, dt: float, 
                cursor_pos: Optional[tuple] = None) -> Vector2:
        """Calculate forces based on behavior and return total force"""
        # Update internal state
        self._update_internal_state(creature, behavior, dt)
        
        # Calculate forces
        target_force = Vector2(0, 0)
        
        # 1. Cursor interaction (shyness/affection)
        if cursor_pos:
            cursor_force = self._calculate_cursor_interaction(creature, cursor_pos, behavior)
            target_force += cursor_force
        
        # 2. Wander behavior
        wander_force = self._calculate_wander_behavior(creature, behavior)
        target_force += wander_force
        
        return target_force
    
    def _update_internal_state(self, creature, behavior: BehaviorComponent, dt: float) -> None:
        """Update internal behavior state (timers, etc.)"""
        behavior.wander_timer -= dt
        
        # Update behavior flags based on genome
        genome = getattr(creature, 'genome', None)
        if genome:
            behavior.is_retreat_mode = genome.shyness > 0.7
            behavior.is_follow_mode = genome.affection > 0.7
    
    def _calculate_cursor_interaction(self, creature, cursor_pos: tuple, behavior: BehaviorComponent) -> Vector2:
        """Calculate force from cursor interaction"""
        genome = getattr(creature, 'genome', None)
        if not genome:
            return Vector2(0, 0)
        
        cursor_vec = Vector2(*cursor_pos)
        position = creature.kinematics.position
        diff = position - cursor_vec
        dist_to_cursor = diff.magnitude()
        
        force = Vector2(0, 0)
        
        if dist_to_cursor < 200.0:
            # Shy slimes retreat (Priority 1)
            if behavior.is_retreat_mode:
                retreat_dir = diff.normalize()
                # Retreat faster if shy
                force += retreat_dir * (genome.shyness * 400.0)
            
            # Affectionate slimes follow (if not too shy)
            elif behavior.is_follow_mode and dist_to_cursor > 40.0:
                follow_dir = (cursor_vec - position).normalize()
                force += follow_dir * (genome.affection * 200.0)
        
        return force
    
    def _calculate_wander_behavior(self, creature, behavior: BehaviorComponent) -> Vector2:
        """Calculate wander behavior force"""
        genome = getattr(creature, 'genome', None)
        if not genome:
            return Vector2(0, 0)
        
        # Update wander timer
        if behavior.wander_timer <= 0:
            # High energy slimes change direction more often
            behavior.wander_timer = random.uniform(1.0, 3.0) / (0.5 + genome.energy)
            
            # Set new target based on traits
            if genome.curiosity > 0.7:
                # Target points near edges or random
                if random.random() < 0.5:
                    behavior.target = Vector2(random.choice([30, 770]), random.uniform(30, 570))
                else:
                    behavior.target = Vector2(random.uniform(50, 750), random.uniform(50, 550))
            elif genome.energy > 0.3:
                # Random drift point
                current_pos = creature.kinematics.position
                behavior.target = current_pos + Vector2(random.uniform(-100, 100), random.uniform(-100, 100))
            else:
                # Slow/Sleepy
                behavior.target = None
        
        # Calculate force toward target
        if behavior.target:
            diff = behavior.target - creature.kinematics.position
            if diff.magnitude() > 10.0:
                dir_to_target = diff.normalize()
                # Energy affects force
                force_mag = 20.0 + (genome.energy * 80.0)
                return dir_to_target * force_mag
            else:
                behavior.target = None
        
        return Vector2(0, 0)
    
    def update_batch(self, creatures: list, behaviors: list[BehaviorComponent], 
                    dt: float, cursor_pos: Optional[tuple] = None) -> list[Vector2]:
        """Update multiple creatures and return forces"""
        forces = []
        for creature, behavior in zip(creatures, behaviors):
            force = self.update(creature, behavior, dt, cursor_pos)
            forces.append(force)
        return forces


class DungeonBehaviorSystem(BehaviorSystem):
    """Dungeon-specific behavior system (example of ADR-007)"""
    
    def update(self, creature, behavior: BehaviorComponent, dt: float, 
                cursor_pos: Optional[tuple] = None) -> Vector2:
        """Dungeon-specific behavior - grid-aware movement"""
        # For now, use base behavior
        # TODO: Add dungeon-specific logic (pathfinding, combat behavior, etc.)
        if behavior.behavior_type != "dungeon":
            behavior.behavior_type = "dungeon"
        
        return super().update(creature, behavior, dt, cursor_pos)


class RacingBehaviorSystem(BehaviorSystem):
    """Racing-specific behavior system (example of ADR-007)"""
    
    def update(self, creature, behavior: BehaviorComponent, dt: float, 
                cursor_pos: Optional[tuple] = None) -> Vector2:
        """Racing-specific behavior - track-based movement"""
        # For now, use base behavior
        # TODO: Add racing-specific logic (track following, boost behavior, etc.)
        if behavior.behavior_type != "racing":
            behavior.behavior_type = "racing"
        
        return super().update(creature, behavior, dt, cursor_pos)


class TowerDefenseBehaviorSystem(BehaviorSystem):
    """Tower Defense-specific behavior system (example of ADR-007)"""
    
    def update(self, creature, behavior: BehaviorComponent, dt: float, 
                cursor_pos: Optional[tuple] = None) -> Vector2:
        """Tower Defense-specific behavior - wave following"""
        # For now, use base behavior
        # TODO: Add tower defense specific logic (wave pathing, targeting, etc.)
        if behavior.behavior_type != "tower_defense":
            behavior.behavior_type = "tower_defense"
        
        return super().update(creature, behavior, dt, cursor_pos)
