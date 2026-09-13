"""
TowerDefenseBehaviorSystem - Genetics-driven tower behavior for Tower Defense
ADR-008: Slimes Are Towers
"""
from typing import Optional
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.behavior_component import BehaviorComponent
from src.shared.ecs.components.tower_component import TowerComponent
from src.shared.entities.creature import Creature


class TowerDefenseBehaviorSystem:
    """Genetics-driven tower behavior system"""
    
    def update(self, slime: Creature, behavior: BehaviorComponent, 
               tower: TowerComponent, dt: float) -> Vector2:
        """Determine tower behavior based on slime genetics"""
        
        # Assign tower component to creature for reference
        slime.tower_component = tower
        
        # Tower type is determined by genetics
        if slime.genome.curiosity > 0.7:
            return self._scout_tower_behavior(slime, tower, dt)
        elif slime.genome.energy > 0.7:
            return self._rapid_fire_tower_behavior(slime, tower, dt)
        elif slime.genome.affection > 0.7:
            return self._support_tower_behavior(slime, tower, dt)
        elif slime.genome.shyness > 0.7:
            return self._bunker_tower_behavior(slime, tower, dt)
        else:
            return self._balanced_tower_behavior(slime, tower, dt)
    
    def _scout_tower_behavior(self, slime: Creature, tower: TowerComponent, dt: float) -> Vector2:
        """Scout towers: High range, low damage, fast fire rate"""
        tower.tower_type = "scout"
        tower.base_range = 150.0
        tower.base_damage = 5.0
        tower.base_fire_rate = 2.0  # Shots per second
        
        # Find nearest enemy in range
        if tower.target:
            # Calculate direction to target
            tower.set_target(tower.target)
            
            # Check if target is in range
            distance = (tower.target - slime.kinematics.position).magnitude()
            if distance <= tower.get_range():
                # Fire at target
                if tower.can_fire(dt):
                    tower.fire(dt)
                    return Vector2(0, 0)  # No movement for towers
        
        # Look for new target
        return self._find_nearest_enemy(slime, tower)
    
    def _rapid_fire_tower_behavior(self, slime: Creature, tower: TowerComponent, dt: float) -> Vector2:
        """Rapid fire towers: Medium range, medium damage, very fast fire rate"""
        tower.tower_type = "rapid_fire"
        tower.base_range = 100.0
        tower.base_damage = 10.0
        tower.base_fire_rate = 3.0  # Shots per second
        
        # Target nearest enemy
        if tower.target:
            distance = (tower.target - slime.kinematics.position).magnitude()
            if distance <= tower.get_range():
                if tower.can_fire(dt):
                    tower.fire(dt)
                    return Vector2(0, 0)
        
        return self._find_nearest_enemy(slime, tower)
    
    def _support_tower_behavior(self, slime: Creature, tower: TowerComponent, dt: float) -> Vector2:
        """Support towers: Medium range, healing/buff abilities"""
        tower.tower_type = "support"
        tower.base_range = 120.0
        tower.base_damage = 3.0  # Low damage (healing)
        tower.base_fire_rate = 1.0  # Slow fire rate
        
        # Target nearest friendly slime for healing
        return self._find_nearest_friendly(slime, tower)
    
    def _bunker_tower_behavior(self, slime: Creature, tower: TowerComponent, dt: float) -> Vector2:
        """Bunker towers: Short range, high damage, slow fire rate"""
        tower.tower_type = "bunker"
        tower.base_range = 80.0
        tower.base_damage = 20.0
        tower.base_fire_rate = 0.8  # Slow fire rate
        
        # Target nearest enemy
        if tower.target:
            distance = (tower.target - slime.kinematics.position).magnitude()
            if distance <= tower.get_range():
                if tower.can_fire(dt):
                    tower.fire(dt)
                    return Vector2(0, 0)
        
        return self._find_nearest_enemy(slime, tower)
    
    def _balanced_tower_behavior(self, slime: Creature, tower: TowerComponent, dt: float) -> Vector2:
        """Balanced towers: Medium range, medium damage, medium fire rate"""
        tower.tower_type = "balanced"
        tower.base_range = 100.0
        tower.base_damage = 10.0
        tower.base_fire_rate = 1.5  # Shots per second
        
        # Target nearest enemy
        if tower.target:
            distance = (tower.target - slime.kinematics.position).magnitude()
            if distance <= tower.get_range():
                if tower.can_fire(dt):
                    tower.fire(dt)
                    return Vector2(0, 0)
        
        return self._find_nearest_enemy(slime, tower)
    
    def _find_nearest_enemy(self, slime: Creature, tower: TowerComponent) -> Vector2:
        """Find nearest enemy and set as target"""
        # This would be implemented by the wave system
        # For now, return no force (towers don't move)
        return Vector2(0, 0)
    
    def _find_nearest_friendly(self, slime: Creature, tower: TowerComponent) -> Vector2:
        """Find nearest friendly slime for support towers"""
        # This would be implemented by a separate system
        return Vector2(0, 0)
    
    def update_batch(self, towers: list[tuple[Creature, TowerComponent]], 
                    behaviors: list[BehaviorComponent], dt: float) -> list[Vector2]:
        """Update multiple towers efficiently"""
        forces = []
        for slime, tower, behavior in zip(towers, behaviors):
            force = self.update(slime, behavior, tower, dt)
            forces.append(force)
        return forces
