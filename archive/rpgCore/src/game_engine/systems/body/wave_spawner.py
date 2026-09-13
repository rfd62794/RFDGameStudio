"""
Wave Spawner - Arcade-Style Wave Management with Safe-Haven Respawning

Manages wave progression, entity spawning with safe zones, and difficulty scaling.
Integrates with FractureSystem for progressive asteroid generation.

Features:
- Progressive wave difficulty calculation
- Safe-haven respawn zones around player
- Entity pooling and recycling
- Difficulty scaling and configuration
- Wave completion detection
"""

import math
import random
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result
from src.game_engine.systems.body.entity_manager import SpaceEntity
from src.game_engine.systems.body.fracture_system import FractureSystem, AsteroidFragment, GeneticTraits

# Screen constants
SCREEN_WIDTH = 160
SCREEN_HEIGHT = 144


@dataclass
class WaveConfig:
    """Configuration for a single wave"""
    wave_number: int
    asteroid_count: int
    speed_multiplier: float
    size_weights: List[int]
    safe_haven_radius: float = 40.0

    def get_random_size(self) -> int:
        """Get random asteroid size based on weights"""
        return random.choice(self.size_weights)


class WaveSpawner(BaseSystem):
    """
    Manages arcade-style wave progression with safe-haven spawning.
    Integrates with FractureSystem for asteroid creation and management.
    """

    def __init__(self, config: Optional[SystemConfig] = None,
                 fracture_system: Optional[FractureSystem] = None):
        super().__init__(config or SystemConfig(name="WaveSpawner"))
        self.fracture_system = fracture_system or FractureSystem()

        # Wave management
        self.current_wave = 0
        self.active_fragments: List[AsteroidFragment] = []
        self.wave_configs: List[WaveConfig] = []

        # Player tracking
        self.player_position: Optional[Tuple[float, float]] = (SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)

        # Wave state
        self.is_wave_active = False
        self.wave_start_time = 0.0
        self.total_waves_completed = 0
        self.total_spawned = 0

    def initialize(self) -> bool:
        """Initialize the wave spawner"""
        self.fracture_system.initialize()
        self._generate_wave_configs()
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update wave state"""
        if self.status != SystemStatus.RUNNING or not self.is_wave_active:
            return

        self.wave_start_time += delta_time
        self.fracture_system.tick(delta_time)

    def shutdown(self) -> None:
        """Shutdown the wave spawner"""
        self.fracture_system.shutdown()
        self.active_fragments.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process wave-related intents"""
        action = intent.get("action", "")

        if action == "start_wave":
            result = self.start_next_wave()
            if result.success:
                return {"wave_started": True, "wave_number": result.value.wave_number}
            return {"wave_started": False, "error": result.error}

        elif action == "set_player_position":
            x = intent.get("x", 0.0)
            y = intent.get("y", 0.0)
            self.set_player_position(x, y)
            return {"position_updated": True}

        elif action == "get_status":
            return self.get_status()

        else:
            return {"error": f"Unknown WaveSpawner action: {action}"}

    def _generate_wave_configs(self) -> None:
        """Generate progressive wave configurations"""
        self.wave_configs = []

        for wave_num in range(1, 20):
            difficulty = self.fracture_system.calculate_wave_difficulty(wave_num)

            wave_config = WaveConfig(
                wave_number=wave_num,
                asteroid_count=difficulty['asteroid_count'],
                speed_multiplier=difficulty['speed_multiplier'],
                size_weights=difficulty['size_weights'],
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
            Result with WaveConfig for new wave
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

        # Spawn asteroids
        spawn_result = self._spawn_wave_asteroids(wave_config)

        if not spawn_result.success:
            return Result(success=False, error=f"Failed to spawn wave: {spawn_result.error}")

        self.is_wave_active = True
        self.active_fragments = spawn_result.value
        self.wave_start_time = 0.0
        self.total_spawned += len(self.active_fragments)

        return Result(success=True, value=wave_config)

    def _spawn_wave_asteroids(self, config: WaveConfig) -> Result[List[AsteroidFragment]]:
        """Spawn asteroids for a wave"""
        try:
            asteroids = []
            safe_zone = None

            if self.player_position:
                safe_zone = (
                    self.player_position[0],
                    self.player_position[1],
                    config.safe_haven_radius
                )

            # Spawn asteroids using fracture system
            for i in range(config.asteroid_count):
                size = config.get_random_size()

                # Find position outside safe zone
                if safe_zone:
                    x, y = self._find_safe_position(safe_zone)
                else:
                    x = random.uniform(20, SCREEN_WIDTH - 20)
                    y = random.uniform(20, SCREEN_HEIGHT - 20)

                # Calculate velocity with speed multiplier
                base_speed = random.uniform(15, 30)
                speed = base_speed * config.speed_multiplier
                angle = random.uniform(0, 2 * math.pi)

                vx = math.cos(angle) * speed
                vy = math.sin(angle) * speed

                # Create entity
                entity = SpaceEntity()
                entity.x = x
                entity.y = y
                entity.vx = vx
                entity.vy = vy
                entity.angle = angle
                entity.entity_type = "asteroid"

                # Create genetic traits if enabled
                genetic_traits = None
                if self.fracture_system.enable_genetics:
                    genetic_traits = GeneticTraits(generation=0)
                    entity.genetic_id = f"wave{self.current_wave}_ast{i}"

                # Create fragment wrapper
                from src.game_engine.systems.body.fracture_system import AsteroidFragment as AF
                fragment_config = self.fracture_system.size_configs[size]

                asteroid = AF(
                    entity=entity,
                    size=size,
                    health=fragment_config['health'],
                    radius=fragment_config['radius'],
                    color=fragment_config['color'],
                    point_value=fragment_config['points'],
                    genetic_traits=genetic_traits,
                    genetic_id=getattr(entity, 'genetic_id', '')
                )

                asteroids.append(asteroid)
                self.fracture_system.active_fragments[entity.id] = asteroid

            return Result(success=True, value=asteroids)

        except Exception as e:
            return Result(success=False, error=f"Wave spawn failed: {e}")

    def _find_safe_position(self, safe_zone: Tuple[float, float, float]) -> Tuple[float, float]:
        """Find position outside safe zone"""
        safe_x, safe_y, safe_radius = safe_zone
        max_attempts = 50

        for _ in range(max_attempts):
            x = random.uniform(20, SCREEN_WIDTH - 20)
            y = random.uniform(20, SCREEN_HEIGHT - 20)

            distance = math.sqrt((x - safe_x)**2 + (y - safe_y)**2)
            if distance > safe_radius + 10:
                return x, y

        # Fallback to screen edge
        edge_positions = [
            (20, random.uniform(20, SCREEN_HEIGHT - 20)),
            (SCREEN_WIDTH - 20, random.uniform(20, SCREEN_HEIGHT - 20)),
            (random.uniform(20, SCREEN_WIDTH - 20), 20),
            (random.uniform(20, SCREEN_WIDTH - 20), SCREEN_HEIGHT - 20)
        ]
        return random.choice(edge_positions)

    def update_wave(self, delta_time: float) -> bool:
        """
        Update wave state and check for completion

        Args:
            delta_time: Time delta in seconds

        Returns:
            True if wave completed
        """
        if not self.is_wave_active:
            return False

        # Update physics
        self.fracture_system.tick(delta_time)

        # Check if wave complete
        if len(self.active_fragments) == 0:
            self._complete_wave()
            return True

        return False

    def _complete_wave(self) -> None:
        """Complete current wave"""
        self.is_wave_active = False
        self.total_waves_completed += 1
        self.active_fragments.clear()

    def fracture_asteroid(self, asteroid: AsteroidFragment,
                         impact_angle: Optional[float] = None) -> Result[List[AsteroidFragment]]:
        """
        Fracture an asteroid and update active list

        Args:
            asteroid: Asteroid to fracture
            impact_angle: Impact direction

        Returns:
            Result with new fragments
        """
        # Remove from active list
        if asteroid in self.active_fragments:
            self.active_fragments.remove(asteroid)

        # Fracture using fracture system
        fracture_result = self.fracture_system.fracture_entity(
            asteroid.entity,
            asteroid.size,
            asteroid.health,
            impact_angle,
            asteroid.genetic_traits
        )

        if fracture_result.success:
            for fragment in fracture_result.value:
                self.active_fragments.append(fragment)

        return fracture_result

    def get_active_asteroids(self) -> List[AsteroidFragment]:
        """Get list of active asteroids"""
        return self.active_fragments.copy()

    def get_status(self) -> Dict[str, Any]:
        """Get wave spawner status"""
        # Calculate size distribution from active fragments
        size_dist = {1: 0, 2: 0, 3: 0}
        for fragment in self.active_fragments:
            size_dist[fragment.size] += 1

        return {
            'current_wave': self.current_wave,
            'is_wave_active': self.is_wave_active,
            'wave_time': self.wave_start_time,
            'total_waves_completed': self.total_waves_completed,
            'active_asteroids': len(self.active_fragments),
            'size_distribution': size_dist,
            'total_points': self.fracture_system.get_total_points(),
            'total_spawned': self.total_spawned,
            'player_position': self.player_position
        }

    def reset(self) -> Result[bool]:
        """Reset spawner to initial state"""
        self.current_wave = 0
        self.active_fragments.clear()
        self.is_wave_active = False
        self.wave_start_time = 0.0
        self.total_waves_completed = 0
        self.total_spawned = 0
        return Result(success=True, value=True)

    def get_wave_config(self, wave_number: int) -> Optional[WaveConfig]:
        """Get configuration for specific wave"""
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


# Factory functions

def create_arcade_wave_spawner(fracture_system: Optional[FractureSystem] = None) -> WaveSpawner:
    """Create standard arcade wave spawner"""
    spawner = WaveSpawner(fracture_system=fracture_system)
    spawner.initialize()
    return spawner


def create_survival_wave_spawner(fracture_system: Optional[FractureSystem] = None) -> WaveSpawner:
    """Create survival mode wave spawner (harder progression)"""
    spawner = WaveSpawner(fracture_system=fracture_system)
    spawner.initialize()

    # Increase difficulty
    for config in spawner.wave_configs:
        config.speed_multiplier *= 1.5
        config.asteroid_count = int(config.asteroid_count * 1.3)
        config.safe_haven_radius = 30.0

    return spawner
