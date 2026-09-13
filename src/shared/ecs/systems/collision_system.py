"""
CollisionSystem - Detects tower-enemy interactions for Tower Defense
ADR-008: Slimes Are Towers
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from src.shared.physics.kinematics import Vector2
from src.shared.entities.creature import Creature
from src.shared.ecs.components.tower_component import TowerComponent


@dataclass
class Projectile:
    """Projectile fired by towers"""
    position: Vector2
    velocity: Vector2
    damage: float
    tower_id: str
    target_id: Optional[str] = None
    lifetime: float = 2.0  # Seconds before projectile expires


class CollisionSystem:
    """Detects tower-enemy interactions (damage, death)"""
    
    def __init__(self):
        self.projectiles: List[Projectile] = []
        self.projectile_speed = 200.0  # Pixels per second
    
    def update(self, towers: List[Creature], enemies: List[Creature], 
               dt: float) -> Dict[str, int]:
        """
        Returns: {
            'enemies_killed': int,
            'gold_earned': int,
            'enemies_escaped': int,
            'damage_dealt': int,
        }
        """
        results = {
            'enemies_killed': 0,
            'gold_earned': 0,
            'enemies_escaped': 0,
            'damage_dealt': 0,
        }
        
        # Update projectiles
        self._update_projectiles(dt)
        
        # Check tower-enemy collisions
        for tower in towers:
            tower_component = self._get_tower_component(tower)
            if tower_component and tower_component.target:
                # Check if tower can fire
                if tower_component.can_fire(dt):
                    # Find nearest enemy in range
                    nearest_enemy = self._find_nearest_enemy(tower, enemies, tower_component)
                    if nearest_enemy:
                        # Fire projectile
                        self._fire_projectile(tower, nearest_enemy, tower_component)
                        tower_component.fire(dt)
        
        # Check projectile-enemy collisions
        self._check_projectile_collisions(enemies, results)
        
        # Check if enemies escaped (reached end of path)
        self._check_enemy_escaped(enemies, results)
        
        # Remove dead enemies
        enemies[:] = [enemy for enemy in enemies if enemy.current_hp > 0]
        
        return results
    
    def _get_tower_component(self, tower: Creature) -> Optional[TowerComponent]:
        """Get tower component from creature"""
        # This would be implemented using the component registry
        # For now, assume tower has tower_component attribute
        return getattr(tower, 'tower_component', None)
    
    def _find_nearest_enemy(self, tower: Creature, enemies: List[Creature], 
                           tower_component: TowerComponent) -> Optional[Creature]:
        """Find nearest enemy in tower range"""
        nearest_enemy = None
        nearest_distance = float('inf')
        
        for enemy in enemies:
            distance = (enemy.kinematics.position - tower.kinematics.position).magnitude()
            if distance <= tower_component.get_range() and distance < nearest_distance:
                nearest_enemy = enemy
                nearest_distance = distance
        
        return nearest_enemy
    
    def _fire_projectile(self, tower: Creature, enemy: Creature, 
                         tower_component: TowerComponent) -> None:
        """Fire projectile from tower to enemy"""
        projectile = Projectile(
            position=Vector2(tower.kinematics.position.x, tower.kinematics.position.y),
            velocity=Vector2(0, 0),  # Will be set below
            damage=tower_component.get_damage(),
            tower_id=tower.slime_id,
            target_id=enemy.slime_id
        )
        
        # Calculate projectile velocity
        direction = (enemy.kinematics.position - tower.kinematics.position).normalize()
        projectile.velocity = direction * self.projectile_speed
        
        self.projectiles.append(projectile)
    
    def _update_projectiles(self, dt: float) -> None:
        """Update projectile positions and remove expired ones"""
        active_projectiles = []
        
        for projectile in self.projectiles:
            # Update position
            projectile.position += projectile.velocity * dt
            
            # Update lifetime
            projectile.lifetime -= dt
            
            # Keep projectile if still active
            if projectile.lifetime > 0:
                active_projectiles.append(projectile)
        
        self.projectiles = active_projectiles
    
    def _check_projectile_collisions(self, enemies: List[Creature], 
                                    results: Dict[str, int]) -> None:
        """Check projectile-enemy collisions"""
        active_projectiles = []
        
        for projectile in self.projectiles:
            hit = False
            
            for enemy in enemies:
                # Check collision (simple distance-based)
                distance = (enemy.kinematics.position - projectile.position).magnitude()
                if distance < 20.0:  # Hit radius
                    # Apply damage
                    damage = projectile.damage
                    enemy.current_hp -= damage
                    results['damage_dealt'] += int(damage)
                    
                    # Check if enemy killed
                    if enemy.current_hp <= 0:
                        results['enemies_killed'] += 1
                        results['gold_earned'] += getattr(enemy, 'reward', 10)
                    
                    hit = True
                    break
            
            if not hit:
                active_projectiles.append(projectile)
        
        self.projectiles = active_projectiles
    
    def _check_enemy_escaped(self, enemies: List[Creature], results: Dict[str, int]) -> None:
        """Check if enemies escaped (reached end of path)"""
        for enemy in enemies:
            # Simple escape condition: enemy reached right side of screen
            if enemy.kinematics.position.x > 480:  # 10 tiles * 48px
                results['enemies_escaped'] += 1
                enemy.current_hp = 0  # Mark as dead
    
    def get_projectile_count(self) -> int:
        """Get current number of active projectiles"""
        return len(self.projectiles)
    
    def clear_projectiles(self) -> None:
        """Clear all projectiles"""
        self.projectiles.clear()
    
    def get_collision_stats(self) -> Dict[str, int]:
        """Get collision system statistics"""
        return {
            'active_projectiles': len(self.projectiles),
            'projectile_speed': self.projectile_speed,
        }
