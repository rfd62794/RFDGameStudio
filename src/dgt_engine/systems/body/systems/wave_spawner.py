"""
Wave Spawner - Arcade-Style Wave Management with Safe-Haven Respawning
SRP: Manages wave progression and entity spawning for arcade classics
"""

import math
import random
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from engines.body.systems.fracture_system import FractureSystem, AsteroidFragment


@dataclass
class WaveConfig:
    """Configuration for a single wave"""
    wave_number: int
    asteroid_count: int
    speed_multiplier: float
    size_weights: List[int]  # Weighted sizes [3,3,2,2,1] etc.
    safe_haven_radius: float = 40.0
    
    def get_random_size(self) -> int:
        """Get random asteroid size based on weights"""
        return random.choice(self.size_weights)


class WaveSpawner:
    """
    Arcade-style wave spawner with safe-haven respawn logic.
    Integrates with FractureSystem for asteroid management.
    """
    
    def __init__(self, fracture_system: FractureSystem):
        """
        Initialize wave spawner
        
        Args:
            fracture_system: FractureSystem for asteroid creation
        """
        self.fracture_system = fracture_system
        
        # Wave management
        self.current_wave = 0
        self.active_asteroids: List[AsteroidFragment] = []
        self.wave_configs: List[WaveConfig] = []
        
        # Player tracking for safe-haven spawning
        self.player_position: Optional[Tuple[float, float]] = (SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
        
        # Wave state
        self.is_wave_active = False
        self.wave_start_time = 0.0
        self.total_waves_completed = 0
        
        # Generate wave configurations
        self._generate_wave_configs()
        
    def _generate_wave_configs(self) -> None:
        """Generate progressive wave configurations"""
        self.wave_configs = []
        
        for wave_num in range(1, 20):  # Support up to 20 waves
            config = self.fracture_system.calculate_wave_difficulty(wave_num)
            
            wave_config = WaveConfig(
                wave_number=wave_num,
                asteroid_count=config['asteroid_count'],
                speed_multiplier=config['speed_multiplier'],
                size_weights=config['size_weights'],
                safe_haven_radius=40.0
            )
            
            self.wave_configs.append(wave_config)
    
    def set_player_position(self, x: float, y: float) -> None:
        """Update player position for safe-haven calculations"""
        self.player_position = (x, y)
    
    def start_next_wave(self) -> Result[WaveConfig]:
        """
        Start the next wave
        
        Returns:
            Result containing the wave configuration
        """
        if self.is_wave_active:
            return Result(success=False, error="Wave already active")
        
        self.current_wave += 1
        
        if self.current_wave > len(self.wave_configs):
            # Generate additional wave if needed
            last_config = self.wave_configs[-1]
            new_config = WaveConfig(
                wave_number=self.current_wave,
                asteroid_count=min(last_config.asteroid_count + 2, 15),
                speed_multiplier=last_config.speed_multiplier + 0.1,
                size_weights=last_config.size_weights,
                safe_haven_radius=40.0
            )
            self.wave_configs.append(new_config)
        
        wave_config = self.wave_configs[self.current_wave - 1]
        
        # Spawn asteroids for this wave
        spawn_result = self._spawn_wave_asteroids(wave_config)
        
        if not spawn_result.success:
            return Result(success=False, error=f"Failed to spawn wave: {spawn_result.error}")
        
        self.is_wave_active = True
        self.active_asteroids = spawn_result.value
        self.wave_start_time = 0.0  # Will be set on first update
        
        return Result(success=True, value=wave_config)
    
    def _spawn_wave_asteroids(self, config: WaveConfig) -> Result[List[AsteroidFragment]]:
        """Spawn asteroids for a wave with safe-haven logic"""
        try:
            asteroids = []
            safe_zone = None
            
            if self.player_position:
                safe_zone = (
                    self.player_position[0], 
                    self.player_position[1], 
                    config.safe_haven_radius
                )
            
            # Create asteroids using fracture system
            for i in range(config.asteroid_count):
                # Get random size based on wave weights
                size = config.get_random_size()
                
                # Find safe position
                if safe_zone:
                    x, y = self._find_safe_position(safe_zone)
                else:
                    x = random.uniform(20, SOVEREIGN_WIDTH - 20)
                    y = random.uniform(20, SOVEREIGN_HEIGHT - 20)
                
                # Calculate velocity with speed multiplier
                base_speed = random.uniform(15, 30)
                speed = base_speed * config.speed_multiplier
                angle = random.uniform(0, 2 * math.pi)
                
                vx = math.cos(angle) * speed
                vy = math.sin(angle) * speed
                
                # Create asteroid
                asteroid = self.fracture_system._create_fragment(size, x, y, vx, vy)
                asteroids.append(asteroid)
            
            return Result(success=True, value=asteroids)
            
        except Exception as e:
            return Result(success=False, error=f"Wave spawn failed: {e}")
    
    def _find_safe_position(self, safe_zone: Tuple[float, float, float]) -> Tuple[float, float]:
        """Find position outside safe zone"""
        safe_x, safe_y, safe_radius = safe_zone
        max_attempts = 50
        
        for _ in range(max_attempts):
            x = random.uniform(20, SOVEREIGN_WIDTH - 20)
            y = random.uniform(20, SOVEREIGN_HEIGHT - 20)
            
            # Check if position is outside safe zone
            distance = math.sqrt((x - safe_x)**2 + (y - safe_y)**2)
            if distance > safe_radius + 10:  # Add buffer
                return x, y
        
        # Fallback: spawn at edge of screen
        edge_positions = [
            (20, random.uniform(20, SOVEREIGN_HEIGHT - 20)),
            (SOVEREIGN_WIDTH - 20, random.uniform(20, SOVEREIGN_HEIGHT - 20)),
            (random.uniform(20, SOVEREIGN_WIDTH - 20), 20),
            (random.uniform(20, SOVEREIGN_WIDTH - 20), SOVEREIGN_HEIGHT - 20)
        ]
        return random.choice(edge_positions)
    
    def update(self, dt: float) -> Result[bool]:
        """
        Update wave state and check for wave completion
        
        Args:
            dt: Time delta in seconds
            
        Returns:
            Result containing True if wave completed
        """
        if not self.is_wave_active:
            return Result(success=True, value=False)
        
        # Update wave timer
        self.wave_start_time += dt
        
        # Update asteroid physics
        self.fracture_system.update_asteroids(self.active_asteroids, dt)
        
        # Check if wave is complete
        if self.fracture_system.should_spawn_new_wave(self.active_asteroids):
            self._complete_wave()
            return Result(success=True, value=True)  # Wave completed
        
        return Result(success=True, value=False)  # Wave continues
    
    def _complete_wave(self) -> None:
        """Complete current wave"""
        self.is_wave_active = False
        self.total_waves_completed += 1
        self.active_asteroids.clear()
    
    def fracture_asteroid(self, 
                          asteroid: AsteroidFragment, 
                          impact_angle: Optional[float] = None) -> Result[List[AsteroidFragment]]:
        """
        Fracture an asteroid and update active list
        
        Args:
            asteroid: Asteroid to fracture
            impact_angle: Impact angle for scatter direction
            
        Returns:
            Result containing new fragments
        """
        # Remove original asteroid
        if asteroid in self.active_asteroids:
            self.active_asteroids.remove(asteroid)
        
        # Fracture it
        fracture_result = self.fracture_system.fracture_asteroid(asteroid, impact_angle)
        
        if fracture_result.success:
            # Add new fragments to active list
            for fragment in fracture_result.value:
                self.active_asteroids.append(fragment)
        
        return fracture_result
    
    def get_active_asteroids(self) -> List[AsteroidFragment]:
        """Get list of active asteroids"""
        return self.active_asteroids.copy()
    
    def get_wave_status(self) -> Dict[str, Any]:
        """Get current wave status"""
        size_distribution = self.fracture_system.get_size_distribution(self.active_asteroids)
        
        return {
            'current_wave': self.current_wave,
            'is_wave_active': self.is_wave_active,
            'wave_time': self.wave_start_time,
            'total_waves_completed': self.total_waves_completed,
            'active_asteroids': len(self.active_asteroids),
            'size_distribution': size_distribution,
            'total_points': self.fracture_system.get_total_points(self.active_asteroids),
            'player_position': self.player_position
        }
    
    def reset(self) -> Result[bool]:
        """Reset spawner to initial state"""
        self.current_wave = 0
        self.active_asteroids.clear()
        self.is_wave_active = False
        self.wave_start_time = 0.0
        self.total_waves_completed = 0
        
        return Result(success=True, value=True)
    
    def get_wave_config(self, wave_number: int) -> Optional[WaveConfig]:
        """Get configuration for a specific wave"""
        if 1 <= wave_number <= len(self.wave_configs):
            return self.wave_configs[wave_number - 1]
        return None
    
    def get_next_wave_preview(self) -> Optional[Dict[str, Any]]:
        """Get preview of next wave"""
        if self.current_wave >= len(self.wave_configs):
            return None
        
        next_config = self.wave_configs[self.current_wave]
        
        return {
            'wave_number': next_config.wave_number,
            'asteroid_count': next_config.asteroid_count,
            'speed_multiplier': next_config.speed_multiplier,
            'size_distribution': {
                'large': next_config.size_weights.count(3),
                'medium': next_config.size_weights.count(2),
                'small': next_config.size_weights.count(1)
            }
        }


# Factory functions for common configurations
def create_arcade_wave_spawner(fracture_system: FractureSystem) -> WaveSpawner:
    """Create standard arcade wave spawner"""
    return WaveSpawner(fracture_system)


def create_survival_wave_spawner(fracture_system: FractureSystem) -> WaveSpawner:
    """Create survival mode wave spawner (harder progression)"""
    spawner = WaveSpawner(fracture_system)
    
    # Override wave configs for survival mode
    for config in spawner.wave_configs:
        config.speed_multiplier *= 1.5  # 50% faster
        config.asteroid_count = int(config.asteroid_count * 1.3)  # 30% more asteroids
        config.safe_haven_radius = 30.0  # Smaller safe zone
    
    return spawner
