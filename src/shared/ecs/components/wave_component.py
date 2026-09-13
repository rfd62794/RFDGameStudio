"""
WaveComponent - Enemy wave state for Tower Defense
ADR-008: Slimes Are Towers
"""
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class WaveComponent:
    """Enemy wave state"""
    wave_number: int = 1
    enemies_spawned: int = 0
    enemies_alive: int = 0
    spawn_rate: float = 1.0  # Enemies per second
    spawn_timer: float = 0.0
    
    # Wave configuration
    enemies_per_wave: int = 10
    spawn_interval: float = 2.0  # Seconds between enemy spawns
    
    # Difficulty scaling
    enemy_hp_multiplier: float = 1.0
    enemy_speed_multiplier: float = 1.0
    enemy_reward_multiplier: float = 1.0
    
    # Wave state
    wave_active: bool = False
    wave_complete: bool = False
    wave_complete_time: float = 0.0
    
    # Spawn points (for procedural generation)
    spawn_points: List[tuple] = field(default_factory=lambda: [(0, 5), (9, 5)])
    
    def start_wave(self) -> None:
        """Start a new wave"""
        self.wave_active = True
        self.wave_complete = False
        self.enemies_spawned = 0
        self.enemies_alive = 0
        self.spawn_timer = 0.0
        
        # Scale difficulty with wave number
        self.enemy_hp_multiplier = 1.0 + (self.wave_number - 1) * 0.2
        self.enemy_speed_multiplier = 1.0 + (self.wave_number - 1) * 0.1
        self.enemy_reward_multiplier = 1.0 + (self.wave_number - 1) * 0.15
        
        # Increase spawn rate with waves
        self.spawn_rate = min(1.0 + (self.wave_number - 1) * 0.1, 3.0)
        self.enemies_per_wave = min(10 + (self.wave_number - 1) * 2, 30)
    
    def update_spawn_timer(self, dt: float) -> None:
        """Update spawn timer"""
        if self.wave_active and not self.wave_complete:
            self.spawn_timer += dt
    
    def can_spawn_enemy(self) -> bool:
        """Check if an enemy can be spawned"""
        return (self.wave_active and 
                not self.wave_complete and 
                self.enemies_spawned < self.enemies_per_wave and
                self.spawn_timer >= self.spawn_interval)
    
    def spawn_enemy(self) -> None:
        """Mark an enemy as spawned"""
        self.enemies_spawned += 1
        self.enemies_alive += 1
        self.spawn_timer = 0.0
    
    def enemy_killed(self) -> None:
        """Mark an enemy as killed"""
        self.enemies_alive -= 1
        if self.enemies_alive <= 0 and self.enemies_spawned >= self.enemies_per_wave:
            self.complete_wave()
    
    def enemy_escaped(self) -> None:
        """Mark an enemy as escaped"""
        self.enemies_alive -= 1
        if self.enemies_alive <= 0 and self.enemies_spawned >= self.enemies_per_wave:
            self.complete_wave()
    
    def complete_wave(self) -> None:
        """Mark wave as complete"""
        self.wave_complete = True
        self.wave_active = False
        self.wave_complete_time = 0.0
    
    def get_progress(self) -> float:
        """Get wave progress (0.0 to 1.0)"""
        if self.enemies_per_wave == 0:
            return 1.0
        return self.enemies_spawned / self.enemies_per_wave
    
    def get_remaining_enemies(self) -> int:
        """Get number of enemies left to spawn"""
        return max(0, self.enemies_per_wave - self.enemies_spawned)
    
    def get_wave_info(self) -> dict:
        """Get wave information for UI"""
        return {
            "wave_number": self.wave_number,
            "enemies_total": self.enemies_per_wave,
            "enemies_spawned": self.enemies_spawned,
            "enemies_alive": self.enemies_alive,
            "progress": self.get_progress(),
            "is_active": self.wave_active,
            "is_complete": self.wave_complete,
            "difficulty_multipliers": {
                "hp": self.enemy_hp_multiplier,
                "speed": self.enemy_speed_multiplier,
                "reward": self.enemy_reward_multiplier,
            }
        }
    
    def next_wave(self) -> None:
        """Prepare for next wave"""
        self.wave_number += 1
        self.wave_complete = False
        self.wave_complete_time = 0.0
