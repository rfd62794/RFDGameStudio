"""
WaveSystem - Manages enemy wave spawning and progression for Tower Defense
ADR-008: Slimes Are Towers
"""
import random
import uuid
from typing import List, Optional
from src.shared.ecs.components.wave_component import WaveComponent
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Vector2


class WaveSystem:
    """Manages enemy wave spawning and progression"""
    
    def __init__(self):
        self.wave_component = WaveComponent()
        self.enemy_spawn_points = [(0, 5), (9, 5)]  # Default spawn points
    
    def update(self, wave: WaveComponent, dt: float) -> List[Creature]:
        """Spawn enemies based on wave configuration"""
        new_enemies = []
        
        wave.update_spawn_timer(dt)
        
        while wave.can_spawn_enemy():
            enemy = self._create_enemy_slime(wave.wave_number)
            new_enemies.append(enemy)
            wave.spawn_enemy()
        
        return new_enemies
    
    def _create_enemy_slime(self, wave_number: int) -> Creature:
        """Create procedurally generated enemy slime"""
        # Generate enemy genome with wave-based difficulty
        base_hp = 10 + wave_number * 2
        base_speed = 50 + wave_number * 5
        base_damage = 5 + wave_number
        
        genome = SlimeGenome(
            shape=random.choice(["round", "square", "triangle"]),
            size=random.choice(["small", "medium", "large"]),
            base_color=(
                random.randint(100, 255),
                random.randint(0, 100),
                random.randint(0, 100)
            ),
            pattern="solid",
            pattern_color=(
                random.randint(0, 50),
                random.randint(0, 50),
                random.randint(0, 50)
            ),
            accessory="none",
            curiosity=random.uniform(0.2, 0.8),
            energy=random.uniform(0.2, 0.8),
            affection=random.uniform(0.2, 0.8),
            shyness=random.uniform(0.2, 0.8)
        )
        
        # Scale stats with wave difficulty
        level = min(1 + wave_number // 5, 10)
        
        enemy = Creature(
            name=f"Enemy-W{wave_number}-{uuid.uuid4().hex[:8]}",
            slime_id=str(uuid.uuid4()),
            genome=genome,
            level=level
        )
        
        # Set enemy stats based on wave difficulty
        hp = int(base_hp * self.wave_component.enemy_hp_multiplier)
        enemy.current_hp = hp
        # max_hp is a calculated property, don't set it
        enemy.base_damage = int(base_damage * self.wave_component.enemy_speed_multiplier)
        enemy.kinematics.velocity = Vector2(base_speed * self.wave_component.enemy_speed_multiplier, 0)
        enemy.reward = int(10 * self.wave_component.enemy_reward_multiplier)
        
        # Set position at random spawn point
        spawn_point = random.choice(self.enemy_spawn_points)
        world_pos = Vector2(spawn_point[0] * 48, spawn_point[1] * 48)
        enemy.kinematics.position = world_pos
        
        # Add behavior component for enemy movement
        from src.shared.ecs.components.behavior_component import BehaviorComponent
        enemy.behavior = BehaviorComponent()
        enemy.behavior.behavior_type = "tower_defense_enemy"
        
        return enemy
    
    def start_wave(self, wave_number: int) -> None:
        """Start a new wave"""
        self.wave_component.wave_number = wave_number
        self.wave_component.start_wave()
    
    def complete_wave(self) -> None:
        """Complete current wave"""
        self.wave_component.complete_wave()
    
    def next_wave(self) -> None:
        """Prepare for next wave"""
        self.wave_component.next_wave()
    
    def get_wave_info(self) -> dict:
        """Get current wave information"""
        return self.wave_component.get_wave_info()
    
    def get_spawn_points_for_wave(self, wave_number: int) -> List[tuple]:
        """Get spawn points for a specific wave"""
        # Can add more spawn points for higher waves
        base_points = [(0, 5), (9, 5)]
        if wave_number > 5:
            # Add side spawn points for higher waves
            base_points.extend([(5, 0), (5, 9)])
        return base_points
    
    def set_spawn_points(self, spawn_points: List[tuple]) -> None:
        """Set spawn points for wave system"""
        self.enemy_spawn_points = spawn_points
