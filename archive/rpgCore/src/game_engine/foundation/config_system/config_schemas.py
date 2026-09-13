"""
Configuration validation schemas using Pydantic.

SOLID Principle: Single Responsibility
- Each schema validates ONE configuration domain
- No business logic, pure data validation
- Type hints provide documentation
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Dict, Any, List, Optional
from enum import Enum


class RendererType(str, Enum):
    """Supported renderer types."""
    GODOT = "godot"
    PIXEL = "pixel"
    CANVAS = "canvas"
    CONSOLE = "console"


class CollisionType(str, Enum):
    """Collision detection algorithms."""
    CIRCLE = "circle"
    AABB = "aabb"
    PIXEL = "pixel"


class GameType(str, Enum):
    """Supported game types."""
    SPACE = "space"
    RPG = "rpg"
    TYCOON = "tycoon"


class PhysicsConfig(BaseModel):
    """Physics system configuration."""
    collision_check_frequency: int = Field(
        default=60,
        ge=10,
        le=300,
        description="Collision checks per second"
    )
    particle_pool_size: int = Field(
        default=1000,
        ge=100,
        le=10000,
        description="Maximum particles in pool"
    )
    collision_detection_type: CollisionType = Field(
        default=CollisionType.CIRCLE,
        description="Collision detection algorithm"
    )
    gravity_enabled: bool = Field(
        default=False,
        description="Enable gravity simulation"
    )
    max_velocity: float = Field(
        default=500.0,
        gt=0,
        description="Maximum entity velocity"
    )

    model_config = ConfigDict(use_enum_values=False)


class GraphicsConfig(BaseModel):
    """Graphics/rendering configuration."""
    target_fps: int = Field(
        default=60,
        ge=30,
        le=144,
        description="Target frames per second"
    )
    renderer_type: RendererType = Field(
        default=RendererType.GODOT,
        description="Rendering backend"
    )
    resolution_width: int = Field(
        default=640,
        ge=320,
        description="Screen width in pixels"
    )
    resolution_height: int = Field(
        default=576,
        ge=240,
        description="Screen height in pixels"
    )
    enable_vsync: bool = Field(
        default=True,
        description="Enable vertical sync"
    )
    enable_fullscreen: bool = Field(
        default=False,
        description="Fullscreen mode"
    )

    model_config = ConfigDict(use_enum_values=False)

    @field_validator('resolution_width', 'resolution_height', mode='before')
    @classmethod
    def validate_resolution(cls, v: Any) -> Any:
        """Resolution must be multiple of 16 for alignment."""
        if v % 16 != 0:
            raise ValueError(f"Resolution must be multiple of 16, got {v}")
        return v


class EntityPoolConfig(BaseModel):
    """Configuration for entity pooling."""
    initial_pool_size: int = Field(
        default=100,
        ge=10,
        le=10000,
        description="Initial entity pool size"
    )
    grow_increment: int = Field(
        default=50,
        ge=10,
        description="Pool size increase when exhausted"
    )
    max_pool_size: int = Field(
        default=5000,
        ge=100,
        description="Maximum pool size"
    )


class SpaceGameConfig(BaseModel):
    """Space game specific configuration."""
    game_type: GameType = Field(default=GameType.SPACE)
    initial_lives: int = Field(default=3, ge=1, le=10)
    initial_wave: int = Field(default=1, ge=1)
    waves_infinite: bool = Field(default=True)
    max_waves: int = Field(default=100, ge=1)
    asteroids_per_wave_base: int = Field(default=5, ge=1, le=50)
    asteroids_spawn_scaling: float = Field(default=1.2, gt=1.0, lt=3.0)
    projectile_speed: float = Field(default=300.0, gt=0)
    projectile_lifetime: float = Field(default=1.0, gt=0)
    ship_max_velocity: float = Field(default=200.0, gt=0)
    ship_acceleration: float = Field(default=150.0, gt=0)
    ship_rotation_speed: float = Field(default=3.0, gt=0)


class RPGGameConfig(BaseModel):
    """RPG game specific configuration."""
    game_type: GameType = Field(default=GameType.RPG)
    enable_permadeath: bool = Field(default=False)
    enable_level_scaling: bool = Field(default=True)
    base_difficulty: float = Field(default=1.0, gt=0, lt=10)
    difficulty_scaling_per_level: float = Field(default=1.1, gt=1.0, lt=2.0)


class TycoonGameConfig(BaseModel):
    """Tycoon game specific configuration."""
    game_type: GameType = Field(default=GameType.TYCOON)
    starting_capital: float = Field(default=10000.0, gt=0)
    enable_breeding: bool = Field(default=True)
    breeding_cooldown_days: int = Field(default=30, ge=1, le=365)
    initial_animals: int = Field(default=10, ge=1, le=1000)
    max_animals_per_facility: int = Field(default=100, ge=10)


class GameConfig(BaseModel):
    """Top-level game configuration."""
    game_title: str = Field(default="rpgCore")
    game_version: str = Field(default="0.1.0")
    game_type: GameType = Field(default=GameType.SPACE)

    # Subsystem configurations
    physics: PhysicsConfig = Field(default_factory=PhysicsConfig)
    graphics: GraphicsConfig = Field(default_factory=GraphicsConfig)
    entity_pool: EntityPoolConfig = Field(default_factory=EntityPoolConfig)

    # Game-specific configurations
    space: Optional[SpaceGameConfig] = None
    rpg: Optional[RPGGameConfig] = None
    tycoon: Optional[TycoonGameConfig] = None

    # Additional metadata
    debug_mode: bool = Field(default=False)
    log_level: str = Field(default="INFO")
    custom_settings: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(use_enum_values=False)

    @field_validator('game_version', mode='before')
    @classmethod
    def validate_version(cls, v: Any) -> Any:
        """Version must be semantic versioning (X.Y.Z)."""
        parts = v.split('.')
        if len(parts) != 3:
            raise ValueError(f"Version must be semantic versioning (X.Y.Z), got {v}")
        try:
            [int(p) for p in parts]
        except ValueError:
            raise ValueError(f"Version parts must be integers, got {v}")
        return v

    @field_validator('game_type', mode='before')
    @classmethod
    def ensure_game_type_config(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Ensure appropriate config exists for game type."""
        configs = {
            GameType.SPACE: 'space',
            GameType.RPG: 'rpg',
            GameType.TYCOON: 'tycoon',
        }
        config_name = configs[v]
        if values.get(config_name) is None:
            # Create default config for this game type
            if v == GameType.SPACE:
                values[config_name] = SpaceGameConfig()
            elif v == GameType.RPG:
                values[config_name] = RPGGameConfig()
            elif v == GameType.TYCOON:
                values[config_name] = TycoonGameConfig()
        return v


class SystemConfig(BaseModel):
    """System-level configuration (logging, debugging)."""
    debug_enabled: bool = Field(default=False)
    log_level: str = Field(default="INFO")
    log_file: Optional[str] = None
    profiling_enabled: bool = Field(default=False)
    performance_metrics_enabled: bool = Field(default=True)
    custom_hooks: Dict[str, str] = Field(default_factory=dict)

    @field_validator('log_level', mode='before')
    @classmethod
    def validate_log_level(cls, v: Any) -> Any:
        """Log level must be valid."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level: {v}")
        return v.upper()


# Preset configurations for common scenarios

DEFAULT_SPACE_CONFIG = GameConfig(
    game_type=GameType.SPACE,
    space=SpaceGameConfig()
)

DEFAULT_RPG_CONFIG = GameConfig(
    game_type=GameType.RPG,
    rpg=RPGGameConfig()
)

DEFAULT_TYCOON_CONFIG = GameConfig(
    game_type=GameType.TYCOON,
    tycoon=TycoonGameConfig()
)

DEVELOPMENT_CONFIG = GameConfig(
    debug_mode=True,
    log_level="DEBUG",
    graphics=GraphicsConfig(
        enable_vsync=False,
        target_fps=120
    )
)

PRODUCTION_CONFIG = GameConfig(
    debug_mode=False,
    log_level="WARNING",
    physics=PhysicsConfig(
        particle_pool_size=2000
    )
)
