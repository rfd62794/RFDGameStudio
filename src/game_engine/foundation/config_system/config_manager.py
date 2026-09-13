"""
ConfigManager - Centralized configuration management with validation.

SOLID Principle: Single Responsibility
- Only responsible for loading, validating, and providing configurations
- Does not handle business logic or game state
- Delegates validation to Pydantic schemas

Architecture:
- Singleton pattern for global access
- Environment-aware configuration (dev, staging, prod)
- Lazy loading of configuration files
- Type-safe retrieval with defaults
"""

from pathlib import Path
from typing import Dict, Any, Optional, Type, TypeVar, Generic
import json
import yaml
from enum import Enum

from .config_schemas import (
    GameConfig, SystemConfig, PhysicsConfig, GraphicsConfig,
    EntityPoolConfig, SpaceGameConfig, RPGGameConfig, TycoonGameConfig,
    GameType, RendererType, CollisionType,
    DEFAULT_SPACE_CONFIG, DEFAULT_RPG_CONFIG, DEFAULT_TYCOON_CONFIG,
    DEVELOPMENT_CONFIG, PRODUCTION_CONFIG
)

T = TypeVar('T')


class Environment(str, Enum):
    """Environment configurations."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class ConfigManager:
    """
    Central configuration manager for game systems.

    Responsibilities:
    - Load configurations from files (YAML, JSON)
    - Validate configurations using Pydantic schemas
    - Provide type-safe access to configurations
    - Support environment-specific overrides

    Does NOT handle:
    - Persistence (use ConfigWriter)
    - Encryption (handle at file level)
    - Hot-reloading (call reload_config() explicitly)
    """

    def __init__(self, config_dir: Optional[Path] = None, environment: Environment = Environment.DEVELOPMENT):
        """
        Initialize the configuration manager.

        Args:
            config_dir: Directory containing configuration files
            environment: Deployment environment (development, staging, production)
        """
        self.config_dir = config_dir or Path("config")
        self.environment = environment
        self._game_config: Optional[GameConfig] = None
        self._system_config: Optional[SystemConfig] = None
        self._cache: Dict[str, Any] = {}

    @property
    def game_config(self) -> GameConfig:
        """Get the current game configuration (lazy-loads if needed)."""
        if self._game_config is None:
            self._game_config = self._load_game_config()
        return self._game_config

    @property
    def system_config(self) -> SystemConfig:
        """Get the current system configuration (lazy-loads if needed)."""
        if self._system_config is None:
            self._system_config = self._load_system_config()
        return self._system_config

    def _load_game_config(self) -> GameConfig:
        """Load game configuration from file or use preset."""
        # Try to load from environment-specific file
        config_file = self.config_dir / f"game.{self.environment.value}.yaml"

        if config_file.exists():
            return self._load_from_file(config_file, GameConfig)

        # Fall back to generic game.yaml
        generic_file = self.config_dir / "game.yaml"
        if generic_file.exists():
            return self._load_from_file(generic_file, GameConfig)

        # Use environment-specific preset
        if self.environment == Environment.PRODUCTION:
            return PRODUCTION_CONFIG
        elif self.environment == Environment.DEVELOPMENT:
            return DEVELOPMENT_CONFIG

        # Default: space game config
        return DEFAULT_SPACE_CONFIG

    def _load_system_config(self) -> SystemConfig:
        """Load system configuration from file or use default."""
        config_file = self.config_dir / f"system.{self.environment.value}.yaml"

        if config_file.exists():
            return self._load_from_file(config_file, SystemConfig)

        generic_file = self.config_dir / "system.yaml"
        if generic_file.exists():
            return self._load_from_file(generic_file, SystemConfig)

        # Use appropriate preset based on environment
        if self.environment == Environment.PRODUCTION:
            return SystemConfig(
                debug_enabled=False,
                log_level="WARNING",
                profiling_enabled=False,
                performance_metrics_enabled=True
            )
        else:
            return SystemConfig(
                debug_enabled=True,
                log_level="DEBUG",
                profiling_enabled=True,
                performance_metrics_enabled=True
            )

    def _load_from_file(self, file_path: Path, schema: Type[T]) -> T:
        """
        Load configuration from file and validate with schema.

        Args:
            file_path: Path to configuration file (YAML or JSON)
            schema: Pydantic model class for validation

        Returns:
            Validated configuration object

        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file format is invalid
            ValidationError: If configuration doesn't match schema
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {file_path}")

        # Load file based on extension
        if file_path.suffix in ['.yaml', '.yml']:
            with open(file_path, 'r') as f:
                data = yaml.safe_load(f) or {}
        elif file_path.suffix == '.json':
            with open(file_path, 'r') as f:
                data = json.load(f)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")

        # Validate with Pydantic schema
        return schema(**data)

    def get_game_type_config(self) -> Dict[str, Any]:
        """
        Get the configuration for the current game type.

        Returns:
            Dictionary with game-type-specific configuration

        Raises:
            ValueError: If game type config is not loaded
        """
        config = self.game_config
        game_type = config.game_type

        if game_type == GameType.SPACE:
            if config.space is None:
                raise ValueError("Space game configuration not loaded")
            return config.space.model_dump()
        elif game_type == GameType.RPG:
            if config.rpg is None:
                raise ValueError("RPG game configuration not loaded")
            return config.rpg.model_dump()
        elif game_type == GameType.TYCOON:
            if config.tycoon is None:
                raise ValueError("Tycoon game configuration not loaded")
            return config.tycoon.model_dump()
        else:
            raise ValueError(f"Unknown game type: {game_type}")

    def get_physics_config(self) -> PhysicsConfig:
        """Get physics configuration."""
        return self.game_config.physics

    def get_graphics_config(self) -> GraphicsConfig:
        """Get graphics configuration."""
        return self.game_config.graphics

    def get_entity_pool_config(self) -> EntityPoolConfig:
        """Get entity pool configuration."""
        return self.game_config.entity_pool

    def update_game_config(self, **kwargs) -> None:
        """
        Update game configuration at runtime.

        Args:
            **kwargs: Configuration fields to update

        Raises:
            ValueError: If field is invalid or unrecognized
        """
        if self._game_config is None:
            self._game_config = self._load_game_config()

        # Create new config with updated values
        config_dict = self._game_config.model_dump()
        config_dict.update(kwargs)
        self._game_config = GameConfig(**config_dict)

        # Clear cache
        self._cache.clear()

    def update_system_config(self, **kwargs) -> None:
        """
        Update system configuration at runtime.

        Args:
            **kwargs: Configuration fields to update
        """
        if self._system_config is None:
            self._system_config = self._load_system_config()

        config_dict = self._system_config.model_dump()
        config_dict.update(kwargs)
        self._system_config = SystemConfig(**config_dict)

        self._cache.clear()

    def reload_config(self) -> None:
        """Reload all configurations from disk."""
        self._game_config = None
        self._system_config = None
        self._cache.clear()

    def validate_config(self) -> list:
        """
        Validate current configuration.

        Returns:
            List of validation issues (empty if valid)
        """
        issues = []

        try:
            # Ensure configs are loaded
            _ = self.game_config
            _ = self.system_config
        except Exception as e:
            issues.append(f"Configuration validation failed: {str(e)}")

        # Additional semantic validation
        graphics = self.get_graphics_config()
        if graphics.target_fps < 30 or graphics.target_fps > 144:
            issues.append(f"Invalid target_fps: {graphics.target_fps} (should be 30-144)")

        physics = self.get_physics_config()
        if physics.collision_check_frequency < 10 or physics.collision_check_frequency > 300:
            issues.append(f"Invalid collision_check_frequency: {physics.collision_check_frequency}")

        return issues

    def export_config(self, output_format: str = "yaml") -> str:
        """
        Export current configuration as string.

        Args:
            output_format: Format to export ("yaml" or "json")

        Returns:
            Configuration as string
        """
        config_dict = {
            "game": self.game_config.model_dump(),
            "system": self.system_config.model_dump()
        }

        if output_format == "yaml":
            return yaml.dump(config_dict, default_flow_style=False)
        elif output_format == "json":
            return json.dumps(config_dict, indent=2)
        else:
            raise ValueError(f"Unsupported format: {output_format}")

    def get_stats(self) -> Dict[str, Any]:
        """Get configuration statistics."""
        return {
            "environment": self.environment.value,
            "config_dir": str(self.config_dir),
            "game_type": self.game_config.game_type.value,
            "debug_mode": self.game_config.debug_mode,
            "target_fps": self.game_config.graphics.target_fps,
            "cached_items": len(self._cache),
            "system_debug_enabled": self.system_config.debug_enabled,
            "log_level": self.system_config.log_level
        }

    def __repr__(self) -> str:
        return (
            f"ConfigManager(env={self.environment.value}, "
            f"game_type={self.game_config.game_type.value}, "
            f"dir={self.config_dir})"
        )
