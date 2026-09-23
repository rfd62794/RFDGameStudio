"""
Entity Spawner - Wave-Based Entity Generation
Handles wave logic, spawn rates, and level scaling
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import math
import time
from loguru import logger

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from .entity_manager import EntityManager, Entity


class SpawnPattern(Enum):
    """Spawn pattern types"""
    RANDOM = "random"
    CIRCLE = "circle"
    LINE = "line"
    SPIRAL = "spiral"
    WAVE = "wave"


@dataclass
class SpawnConfig:
    """Configuration for entity spawning"""
    entity_type: str
    spawn_rate: float  # Entities per second
    max_entities: int  # Maximum active entities
    spawn_pattern: SpawnPattern = SpawnPattern.RANDOM
    spawn_radius: float = 50.0
    spawn_center_x: float = SOVEREIGN_WIDTH / 2
    spawn_center_y: float = SOVEREIGN_HEIGHT / 2
    
    # Wave configuration
    wave_size: int = 1
    wave_interval: float = 2.0  # Seconds between waves
    
    # Entity properties
    entity_properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.entity_properties is None:
            self.entity_properties = {}


@dataclass
class WaveConfig:
    """Configuration for wave spawning"""
    wave_number: int
    entities_per_wave: int
    spawn_interval: float
    difficulty_multiplier: float = 1.0
    
    # Progressive difficulty
    increase_speed: bool = False
    increase_health: bool = False
    increase_size: bool = False


class EntitySpawner:
    """Handles entity spawning with wave management and object pooling"""
    
    def __init__(self, entity_manager: EntityManager):
        self.entity_manager = entity_manager
        self.spawn_configs: Dict[str, SpawnConfig] = {}
        self.active_spawners: Dict[str, float] = {}  # spawn_type -> next_spawn_time
        self.wave_configs: Dict[str, List[WaveConfig]] = {}
        
        # Timing
        self.game_time = 0.0
        self.last_spawn_check = 0.0
        
        # Statistics
        self.total_spawned = 0
        self.spawn_history: List[Dict[str, Any]] = []
        
        logger.info("🎯 EntitySpawner initialized")
    
    def register_spawn_type(self, spawn_type: str, config: SpawnConfig) -> Result[bool]:
        """Register a spawn type with configuration"""
        try:
            self.spawn_configs[spawn_type] = config
            self.active_spawners[spawn_type] = 0.0  # Ready to spawn immediately
            
            logger.info(f"✅ Registered spawn type: {spawn_type}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to register spawn type: {e}")
    
    def register_wave_config(self, spawn_type: str, waves: List[WaveConfig]) -> Result[bool]:
        """Register wave configuration for spawn type"""
        try:
            self.wave_configs[spawn_type] = waves
            
            logger.info(f"✅ Registered wave config for: {spawn_type} ({len(waves)} waves)")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to register wave config: {e}")
    
    def update(self, dt: float) -> None:
        """Update spawner and handle spawning"""
        self.game_time += dt
        
        # Check each spawn type
        for spawn_type, config in self.spawn_configs.items():
            if spawn_type not in self.active_spawners:
                continue
            
            next_spawn_time = self.active_spawners[spawn_type]
            
            if self.game_time >= next_spawn_time:
                # Time to spawn
                spawn_result = self._spawn_entities(spawn_type, config)
                
                if spawn_result.success:
                    # Schedule next spawn
                    spawn_interval = 1.0 / config.spawn_rate
                    self.active_spawners[spawn_type] = self.game_time + spawn_interval
                else:
                    logger.error(f"Spawn failed for {spawn_type}: {spawn_result.error}")
    
    def _spawn_entities(self, spawn_type: str, config: SpawnConfig) -> Result[bool]:
        """Spawn entities based on configuration"""
        try:
            # Check entity limit
            current_entities = len(self.entity_manager.get_entities_by_type(config.entity_type))
            if current_entities >= config.max_entities:
                return Result(success=False, error="Entity limit reached")
            
            # Calculate spawn positions
            spawn_positions = self._calculate_spawn_positions(config)
            
            # Spawn entities
            spawned_count = 0
            for position in spawn_positions:
                if spawned_count >= config.wave_size:
                    break
                
                # Create entity with properties
                entity_props = config.entity_properties.copy()
                entity_props.update({
                    'x': position[0],
                    'y': position[1]
                })
                
                spawn_result = self.entity_manager.spawn_entity(config.entity_type, **entity_props)
                
                if spawn_result.success:
                    spawned_count += 1
                    self.total_spawned += 1
                    
                    # Record spawn
                    self.spawn_history.append({
                        'time': self.game_time,
                        'type': spawn_type,
                        'entity_id': spawn_result.value.id,
                        'position': position
                    })
                else:
                    logger.error(f"Failed to spawn entity: {spawn_result.error}")
            
            logger.debug(f"🎯 Spawned {spawned_count} {config.entity_type} entities")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Spawn failed: {e}")
    
    def _calculate_spawn_positions(self, config: SpawnConfig) -> List[tuple]:
        """Calculate spawn positions based on pattern"""
        positions = []
        
        if config.spawn_pattern == SpawnPattern.RANDOM:
            positions = self._spawn_random(config)
        elif config.spawn_pattern == SpawnPattern.CIRCLE:
            positions = self._spawn_circle(config)
        elif config.spawn_pattern == SpawnPattern.LINE:
            positions = self._spawn_line(config)
        elif config.spawn_pattern == SpawnPattern.SPIRAL:
            positions = self._spawn_spiral(config)
        elif config.spawn_pattern == SpawnPattern.WAVE:
            positions = self._spawn_wave(config)
        else:
            positions = self._spawn_random(config)
        
        return positions
    
    def _spawn_random(self, config: SpawnConfig) -> List[tuple]:
        """Random spawn pattern with ship safety zone"""
        positions = []
        
        # Get ship position for safety zone
        ship_x = SOVEREIGN_WIDTH // 2
        ship_y = SOVEREIGN_HEIGHT // 2
        safety_radius = 30.0
        
        for _ in range(config.wave_size):
            attempts = 0
            max_attempts = 50
            
            while attempts < max_attempts:
                # Random position avoiding center
                x = math.random.uniform(20, SOVEREIGN_WIDTH - 20)
                y = math.random.uniform(20, SOVEREIGN_HEIGHT - 20)
                
                # Check distance from ship (safety zone)
                dist_from_ship = math.sqrt(
                    (x - ship_x)**2 + (y - ship_y)**2
                )
                
                # Check distance from spawn center
                dist_from_center = math.sqrt(
                    (x - config.spawn_center_x)**2 + 
                    (y - config.spawn_center_y)**2
                )
                
                if dist_from_ship > safety_radius and dist_from_center > config.spawn_radius:
                    positions.append((x, y))
                    break
                
                attempts += 1
            
            # If we couldn't find a safe position, spawn anyway (fallback)
            if attempts >= max_attempts:
                x = math.random.uniform(20, SOVEREIGN_WIDTH - 20)
                y = math.random.uniform(20, SOVEREIGN_HEIGHT - 20)
                positions.append((x, y))
        
        return positions
    
    def _spawn_circle(self, config: SpawnConfig) -> List[tuple]:
        """Circle spawn pattern"""
        positions = []
        
        for i in range(config.wave_size):
            angle = (2 * math.pi * i) / config.wave_size
            x = config.spawn_center_x + config.spawn_radius * math.cos(angle)
            y = config.spawn_center_y + config.spawn_radius * math.sin(angle)
            
            # Wrap to screen bounds
            x = x % SOVEREIGN_WIDTH
            y = y % SOVEREIGN_HEIGHT
            
            positions.append((x, y))
        
        return positions
    
    def _spawn_line(self, config: SpawnConfig) -> List[tuple]:
        """Line spawn pattern"""
        positions = []
        
        for i in range(config.wave_size):
            # Horizontal line across screen
            x = (SOVEREIGN_WIDTH * i) / config.wave_size
            y = config.spawn_center_y
            
            positions.append((x, y))
        
        return positions
    
    def _spawn_spiral(self, config: SpawnConfig) -> List[tuple]:
        """Spiral spawn pattern"""
        positions = []
        
        for i in range(config.wave_size):
            t = i / config.wave_size
            angle = 4 * math.pi * t  # 2 full rotations
            radius = config.spawn_radius * t
            
            x = config.spawn_center_x + radius * math.cos(angle)
            y = config.spawn_center_y + radius * math.sin(angle)
            
            # Wrap to screen bounds
            x = x % SOVEREIGN_WIDTH
            y = y % SOVEREIGN_HEIGHT
            
            positions.append((x, y))
        
        return positions
    
    def _spawn_wave(self, config: SpawnConfig) -> List[tuple]:
        """Wave spawn pattern"""
        positions = []
        
        for i in range(config.wave_size):
            # Sine wave pattern
            x = (SOVEREIGN_WIDTH * i) / config.wave_size
            y = config.spawn_center_y + 20 * math.sin(2 * math.pi * i / config.wave_size)
            
            positions.append((x, y))
        
        return positions
    
    def spawn_wave(self, spawn_type: str, wave_number: int = 1) -> Result[bool]:
        """Spawn a specific wave"""
        try:
            if spawn_type not in self.spawn_configs:
                return Result(success=False, error=f"Spawn type '{spawn_type}' not registered")
            
            config = self.spawn_configs[spawn_type]
            
            # Apply wave difficulty
            if spawn_type in self.wave_configs and wave_number <= len(self.wave_configs[spawn_type]):
                wave_config = self.wave_configs[spawn_type][wave_number - 1]
                
                # Modify config for wave
                modified_config = SpawnConfig(
                    entity_type=config.entity_type,
                    spawn_rate=config.spawn_rate * wave_config.difficulty_multiplier,
                    max_entities=config.max_entities,
                    spawn_pattern=config.spawn_pattern,
                    spawn_radius=config.spawn_radius,
                    wave_size=wave_config.entities_per_wave,
                    wave_interval=wave_config.spawn_interval,
                    entity_properties=config.entity_properties.copy()
                )
                
                # Apply difficulty modifiers
                if wave_config.increase_speed:
                    speed_mult = 1.0 + (wave_number - 1) * 0.2
                    modified_config.entity_properties['vx'] *= speed_mult
                    modified_config.entity_properties['vy'] *= speed_mult
                
                if wave_config.increase_health:
                    health_mult = 1.0 + (wave_number - 1) * 0.3
                    modified_config.entity_properties['health'] = int(
                        modified_config.entity_properties.get('health', 1) * health_mult
                    )
                
                if wave_config.increase_size:
                    size_mult = 1.0 + (wave_number - 1) * 0.1
                    modified_config.entity_properties['radius'] *= size_mult
                
                return self._spawn_entities(spawn_type, modified_config)
            else:
                # Use default config
                return self._spawn_entities(spawn_type, config)
                
        except Exception as e:
            return Result(success=False, error=f"Wave spawn failed: {e}")
    
    def start_spawning(self, spawn_type: str) -> Result[bool]:
        """Start continuous spawning for type"""
        try:
            if spawn_type not in self.spawn_configs:
                return Result(success=False, error=f"Spawn type '{spawn_type}' not registered")
            
            self.active_spawners[spawn_type] = self.game_time
            
            logger.info(f"🚀 Started spawning: {spawn_type}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to start spawning: {e}")
    
    def stop_spawning(self, spawn_type: str) -> Result[bool]:
        """Stop spawning for type"""
        try:
            if spawn_type in self.active_spawners:
                del self.active_spawners[spawn_type]
            
            logger.info(f"🛑 Stopped spawning: {spawn_type}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to stop spawning: {e}")
    
    def clear_all(self) -> None:
        """Clear all spawners"""
        self.active_spawners.clear()
        logger.info("🧹 Cleared all spawners")
    
    def get_status(self) -> Dict[str, Any]:
        """Get spawner status"""
        return {
            'game_time': self.game_time,
            'total_spawned': self.total_spawned,
            'active_spawners': list(self.active_spawners.keys()),
            'registered_types': list(self.spawn_configs.keys()),
            'spawn_history_count': len(self.spawn_history),
            'recent_spawns': self.spawn_history[-10:] if self.spawn_history else []
        }


# Factory functions for common spawn configurations
def create_asteroid_spawn_config() -> SpawnConfig:
    """Create default asteroid spawn configuration with arcade-scale sizing"""
    return SpawnConfig(
        entity_type="asteroid",
        spawn_rate=0.5,  # 1 asteroid every 2 seconds
        max_entities=10,
        spawn_pattern=SpawnPattern.RANDOM,
        spawn_radius=60.0,
        wave_size=1,
        wave_interval=3.0,
        entity_properties={
            'vx': 30.0,  # Base velocity
            'vy': 20.0,
            'health': 2,
            'size': 2,
            'radius': 8.0  # Large asteroid (8px radius)
        }
    )


def create_bullet_spawn_config() -> SpawnConfig:
    """Create bullet spawn configuration (manual spawning)"""
    return SpawnConfig(
        entity_type="bullet",
        spawn_rate=10.0,  # High rate for manual spawning
        max_entities=20,
        spawn_pattern=SpawnPattern.RANDOM,
        wave_size=1,
        entity_properties={
            'lifetime': 1.0,
            'radius': 2.0
        }
    )


def create_wave_configs() -> Dict[str, List[WaveConfig]]:
    """Create progressive wave configurations"""
    return {
        "asteroid": [
            WaveConfig(1, 3, 5.0, 1.0),
            WaveConfig(2, 5, 4.0, 1.2),
            WaveConfig(3, 7, 3.0, 1.5),
            WaveConfig(4, 10, 2.0, 2.0),
            WaveConfig(5, 15, 1.5, 2.5, True, True)  # Increase speed and health
        ]
    }
