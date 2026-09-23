"""
Production-ready configuration management for DGT Autonomous Movie System

Environment-based configuration with validation and type safety.
Supports development, testing, and production deployment scenarios.
"""

import os
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum

from pydantic import BaseModel, Field, field_validator, ConfigDict
from loguru import logger


class EnvironmentType(str, Enum):
    """Supported deployment environments"""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class LogLevel(str, Enum):
    """Supported log levels"""
    TRACE = "TRACE"
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class PerformanceConfig:
    """Performance tuning parameters"""
    target_fps: int = 60
    frame_delay: float = field(default_factory=lambda: 1.0 / 60)
    intent_cooldown_ms: int = 10
    movement_range: int = 15
    persistence_interval_turns: int = 10
    max_pathfinding_distance: int = 50
    
    def __post_init__(self):
        """Calculate derived values"""
        self.frame_delay = 1.0 / self.target_fps


@dataclass
class WorldConfig:
    """World generation parameters"""
    default_seed: str = "TAVERN_SEED"
    world_size: tuple[int, int] = (50, 50)
    tile_types: List[str] = field(default_factory=lambda: [
        "GRASS", "STONE", "WATER", "FOREST", "MOUNTAIN", 
        "SAND", "SNOW", "DOOR_CLOSED", "DOOR_OPEN", "WALL", "FLOOR"
    ])
    
    # Environment configurations
    environments: Dict[str, str] = field(default_factory=lambda: {
        "forest": "forest_bank",
        "town": "town_bank", 
        "tavern": "tavern_bank"
    })


@dataclass
class RenderingConfig:
    """Graphics and rendering parameters"""
    resolution: tuple[int, int] = (160, 144)
    ppu_mode: str = "GAME_BOY_PARITY"
    layer_composition: bool = True
    viewport_following: bool = True
    
    # Asset management
    assets_path: str = "assets/"
    tile_bank_format: str = "safetensors"


@dataclass
class PersistenceConfig:
    """Data persistence parameters"""
    enabled: bool = True
    format: str = "json"
    compression: bool = False
    backup_interval_turns: int = 50
    max_backup_files: int = 5
    
    # File paths
    persistence_file: str = "persistence.json"
    backup_directory: str = "backups/"


@dataclass
class MonitoringConfig:
    """Performance monitoring and observability"""
    enabled: bool = True
    metrics_collection: bool = True
    performance_profiling: bool = False
    memory_monitoring: bool = True
    
    # Alert thresholds
    max_fps_drop: float = 10.0  # Alert if FPS drops by more than this
    max_memory_mb: int = 512    # Alert if memory exceeds this
    max_turn_time_ms: float = 50.0  # Alert if turn processing exceeds this


class DGTConfig(BaseModel):
    """Main configuration model with Pydantic validation"""
    
    # Environment identification
    environment: EnvironmentType = EnvironmentType.DEVELOPMENT
    debug: bool = False
    
    # Core component configurations
    performance: PerformanceConfig = Field(default_factory=PerformanceConfig)
    world: WorldConfig = Field(default_factory=WorldConfig)
    rendering: RenderingConfig = Field(default_factory=RenderingConfig)
    persistence: PersistenceConfig = Field(default_factory=PersistenceConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)
    
    # Logging configuration
    log_level: LogLevel = LogLevel.INFO
    log_file: Optional[str] = None
    log_rotation: Optional[str] = None
    
    # Feature flags
    movie_mode: bool = True
    autonomous_generation: bool = True
    subtitle_generation: bool = True
    llm_integration: bool = False  # Disabled by default for production
    
    # Security and deployment
    cors_enabled: bool = False
    api_rate_limit: Optional[int] = None
    
    @field_validator('environment', mode='before')
    @classmethod
    def validate_environment(cls, v: Any) -> Any:
        """Validate environment setting"""
        if v not in EnvironmentType:
            raise ValueError(f"Invalid environment: {v}")
        return v
    
    @field_validator('log_level', mode='before')
    @classmethod
    def validate_log_level(cls, v: Any) -> Any:
        """Validate log level"""
        if v not in LogLevel:
            raise ValueError(f"Invalid log level: {v}")
        return v
    
    @field_validator('performance', mode='before')
    @classmethod
    def validate_performance(cls, v: Any) -> Any:
        """Validate performance settings"""
        if v.target_fps <= 0 or v.target_fps > 120:
            raise ValueError("Target FPS must be between 1 and 120")
        if v.intent_cooldown_ms < 0:
            raise ValueError("Intent cooldown must be non-negative")
        return v
    
    model_config = ConfigDict(
        use_enum_values=True,
        validate_assignment=True,
        extra="forbid"
    )


class ConfigManager:
    """Configuration management with environment detection and validation"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file or self._find_config_file()
        self._config: Optional[DGTConfig] = None
        self._environment = self._detect_environment()
        
    @property
    def config(self) -> DGTConfig:
        """Get current configuration (lazy loading)"""
        if self._config is None:
            self._config = self._load_configuration()
        return self._config
    
    def _detect_environment(self) -> EnvironmentType:
        """Detect current environment from environment variables"""
        env = os.getenv("DGT_ENV", "").lower()
        
        if env == "production" or env == "prod":
            return EnvironmentType.PRODUCTION
        elif env == "staging" or env == "stage":
            return EnvironmentType.STAGING
        elif env == "testing" or env == "test":
            return EnvironmentType.TESTING
        else:
            return EnvironmentType.DEVELOPMENT
    
    def _find_config_file(self) -> str:
        """Find configuration file in standard locations"""
        possible_paths = [
            "config.json",
            "config/dgt.json",
            "config/dgt.{env}.json".format(env=self._environment.value),
            os.path.expanduser("~/.dgt/config.json"),
            "/etc/dgt/config.json"
        ]
        
        for path in possible_paths:
            if Path(path).exists():
                logger.info(f"Found configuration file: {path}")
                return path
        
        # No config file found - will use defaults
        logger.info("No configuration file found, using defaults")
        return ""
    
    def _load_configuration(self) -> DGTConfig:
        """Load and validate configuration"""
        try:
            # Start with environment-specific defaults
            config_dict = self._get_environment_defaults()
            
            # Load from file if exists
            if self.config_file and Path(self.config_file).exists():
                with open(self.config_file, 'r') as f:
                    file_config = json.load(f)
                    config_dict.update(file_config)
                logger.info(f"Loaded configuration from {self.config_file}")
            
            # Override with environment variables
            config_dict.update(self._load_env_overrides())
            
            # Create and validate configuration
            config = DGTConfig(**config_dict)
            config.environment = self._environment  # Ensure environment is set correctly
            
            logger.info(f"Configuration loaded for environment: {self._environment.value}")
            return config
            
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            logger.info("Falling back to minimal safe configuration")
            return DGTConfig(environment=self._environment, debug=True)
    
    def _get_environment_defaults(self) -> Dict[str, Any]:
        """Get default configuration for current environment"""
        base_defaults = {
            "environment": self._environment.value,
            "debug": self._environment == EnvironmentType.DEVELOPMENT,
            "log_level": "DEBUG" if self._environment == EnvironmentType.DEVELOPMENT else "INFO",
            "monitoring": {
                "enabled": self._environment != EnvironmentType.DEVELOPMENT,
                "performance_profiling": self._environment == EnvironmentType.DEVELOPMENT
            }
        }
        
        # Environment-specific overrides
        if self._environment == EnvironmentType.PRODUCTION:
            base_defaults.update({
                "performance": {"target_fps": 60, "intent_cooldown_ms": 10},
                "persistence": {"backup_interval_turns": 25},
                "monitoring": {"max_memory_mb": 1024}
            })
        elif self._environment == EnvironmentType.TESTING:
            base_defaults.update({
                "performance": {"target_fps": 30},  # Lower FPS for testing
                "persistence": {"enabled": False},  # Disable persistence in tests
                "movie_mode": False
            })
        
        return base_defaults
    
    def _load_env_overrides(self) -> Dict[str, Any]:
        """Load configuration overrides from environment variables"""
        overrides = {}
        
        # Map environment variables to config keys
        env_mappings = {
            "DGT_DEBUG": ("debug", lambda x: x.lower() == "true"),
            "DGT_LOG_LEVEL": ("log_level", str),
            "DGT_TARGET_FPS": ("performance.target_fps", int),
            "DGT_ASSETS_PATH": ("rendering.assets_path", str),
            "DGT_PERSISTENCE_ENABLED": ("persistence.enabled", lambda x: x.lower() == "true"),
            "DGT_MONITORING_ENABLED": ("monitoring.enabled", lambda x: x.lower() == "true"),
            "DGT_MOVIE_MODE": ("movie_mode", lambda x: x.lower() == "true"),
        }
        
        for env_var, (config_key, converter) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                try:
                    converted_value = converter(value)
                    self._set_nested_dict(overrides, config_key, converted_value)
                    logger.debug(f"Environment override: {config_key} = {converted_value}")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid environment variable {env_var}={value}: {e}")
        
        return overrides
    
    def _set_nested_dict(self, d: Dict[str, Any], key: str, value: Any) -> None:
        """Set nested dictionary value using dot notation"""
        keys = key.split('.')
        for k in keys[:-1]:
            d = d.setdefault(k, {})
        d[keys[-1]] = value
    
    def save_configuration(self, file_path: Optional[str] = None) -> None:
        """Save current configuration to file"""
        if file_path is None:
            file_path = self.config_file or "config.json"
        
        try:
            # Ensure directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Convert to dict and save
            config_dict = self.config.model_dump()
            with open(file_path, 'w') as f:
                json.dump(config_dict, f, indent=2, default=str)
            
            logger.info(f"Configuration saved to {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            raise
    
    def validate_configuration(self) -> List[str]:
        """Validate current configuration and return list of issues"""
        issues = []
        config = self.config
        
        # Performance validation
        if config.performance.target_fps < 30:
            issues.append("Low target FPS may impact user experience")
        
        if config.performance.intent_cooldown_ms > 100:
            issues.append("High intent cooldown may cause sluggish response")
        
        # Persistence validation
        if config.persistence.enabled and not config.persistence.persistence_file:
            issues.append("Persistence enabled but no file specified")
        
        # Monitoring validation
        if config.monitoring.enabled and config.monitoring.max_memory_mb < 256:
            issues.append("Low memory threshold may cause false alerts")
        
        # Environment-specific validation
        if config.environment == EnvironmentType.PRODUCTION:
            if config.debug:
                issues.append("Debug mode should be disabled in production")
            if config.log_level == LogLevel.DEBUG:
                issues.append("Debug logging should be disabled in production")
        
        return issues
    
    def get_summary(self) -> str:
        """Get configuration summary for logging"""
        config = self.config
        return (
            f"DGT Configuration - Environment: {config.environment.value}, "
            f"FPS: {config.performance.target_fps}, "
            f"Debug: {config.debug}, "
            f"Movie Mode: {config.movie_mode}, "
            f"Monitoring: {config.monitoring.enabled}"
        )


# Global configuration instance
_config_manager: Optional[ConfigManager] = None


def get_config() -> DGTConfig:
    """Get global configuration instance"""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager.config


def initialize_config(config_file: Optional[str] = None) -> DGTConfig:
    """Initialize configuration system"""
    global _config_manager
    _config_manager = ConfigManager(config_file)
    
    # Validate and log any issues
    issues = _config_manager.validate_configuration()
    if issues:
        logger.warning("Configuration issues detected:")
        for issue in issues:
            logger.warning(f"  - {issue}")
    
    # Log configuration summary
    logger.info(_config_manager.get_summary())
    
    return _config_manager.config
