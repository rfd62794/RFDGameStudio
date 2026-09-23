"""
Configuration Management System for DGT System

Provides externalized configuration management with YAML/JSON support,
environment variable overrides, and validation. Follows the 12-factor app
methodology for configuration management.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, Union, Type, TypeVar
from dataclasses import dataclass, field, asdict
from abc import ABC, abstractmethod

import yaml
from pydantic import BaseModel, Field, field_validator
from loguru import logger

T = TypeVar('T', bound=BaseModel)


class ConfigurationError(Exception):
    """Configuration-related errors"""
    pass


class ConfigurationLoader(ABC):
    """Abstract base for configuration loaders"""
    
    @abstractmethod
    def load(self, path: Path) -> Dict[str, Any]:
        """Load configuration from file"""
        pass
    
    @abstractmethod
    def save(self, data: Dict[str, Any], path: Path) -> None:
        """Save configuration to file"""
        pass


class YamlConfigurationLoader(ConfigurationLoader):
    """YAML configuration loader"""
    
    def load(self, path: Path) -> Dict[str, Any]:
        """Load YAML configuration"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        except yaml.YAMLError as e:
            raise ConfigurationError(f"Invalid YAML in {path}: {e}")
        except FileNotFoundError:
            logger.warning(f"Configuration file not found: {path}")
            return {}
        except Exception as e:
            raise ConfigurationError(f"Failed to load {path}: {e}")
    
    def save(self, data: Dict[str, Any], path: Path) -> None:
        """Save YAML configuration"""
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, default_flow_style=False, indent=2)
        except Exception as e:
            raise ConfigurationError(f"Failed to save {path}: {e}")


class JsonConfigurationLoader(ConfigurationLoader):
    """JSON configuration loader"""
    
    def load(self, path: Path) -> Dict[str, Any]:
        """Load JSON configuration"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in {path}: {e}")
        except FileNotFoundError:
            logger.warning(f"Configuration file not found: {path}")
            return {}
        except Exception as e:
            raise ConfigurationError(f"Failed to load {path}: {e}")
    
    def save(self, data: Dict[str, Any], path: Path) -> None:
        """Save JSON configuration"""
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            raise ConfigurationError(f"Failed to save {path}: {e}")


class SystemConfigModel(BaseModel):
    """Pydantic model for system configuration with validation"""
    
    # Core system settings
    mode: str = Field(default="autonomous", description="System run mode")
    scene: str = Field(default="tavern", description="Game scene")
    seed: str = Field(default="TAVERN_SEED", description="World seed")
    
    # Performance settings
    target_fps: int = Field(default=60, ge=1, le=240, description="Target frame rate")
    enable_performance_monitoring: bool = Field(default=True, description="Enable performance monitoring")
    
    # Graphics settings
    enable_graphics: bool = Field(default=True, description="Enable graphics rendering")
    graphics_width: int = Field(default=1024, ge=640, description="Graphics width")
    graphics_height: int = Field(default=768, ge=480, description="Graphics height")
    fullscreen: bool = Field(default=False, description="Fullscreen mode")
    
    # System features
    enable_persistence: bool = Field(default=True, description="Enable data persistence")
    enable_logging: bool = Field(default=True, description="Enable logging")
    enable_console: bool = Field(default=True, description="Enable developer console")
    enable_debug_mode: bool = Field(default=False, description="Enable debug mode")
    
    # Logging configuration
    log_level: str = Field(default="INFO", description="Log level")
    log_file: Optional[str] = Field(default=None, description="Log file path")
    log_rotation: str = Field(default="10 MB", description="Log rotation size")
    
    # Network settings (for future use)
    enable_network: bool = Field(default=False, description="Enable network features")
    network_port: int = Field(default=8080, ge=1024, le=65535, description="Network port")
    
    # Resource paths
    assets_path: str = Field(default="assets/", description="Asset path")
    data_path: str = Field(default="data/", description="Data path")
    logs_path: str = Field(default="logs/", description="Log path")
    
    @field_validator('mode', mode='before')
    @classmethod
    def validate_mode(cls, v: Any) -> Any:
        allowed_modes = ['autonomous', 'demo', 'interactive', 'server']
        if v not in allowed_modes:
            raise ValueError(f"Mode must be one of: {allowed_modes}")
        return v
    
    @field_validator('scene', mode='before')
    @classmethod
    def validate_scene(cls, v: Any) -> Any:
        allowed_scenes = ['tavern', 'forest', 'demo', 'custom']
        if v not in allowed_scenes:
            raise ValueError(f"Scene must be one of: {allowed_scenes}")
        return v
    
    @field_validator('log_level', mode='before')
    @classmethod
    def validate_log_level(cls, v: Any) -> Any:
        allowed_levels = ['TRACE', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()
    
    @field_validator('assets_path', 'data_path', 'logs_path', mode='before')
    @classmethod
    def validate_paths(cls, v: Any) -> Any:
        return v.rstrip('/') + '/'


class ConfigurationManager:
    """Centralized configuration management"""
    
    def __init__(self, 
                 config_dir: Optional[Path] = None,
                 environment_prefix: str = "DGT_") -> None:
        self.config_dir = config_dir or Path("config")
        self.environment_prefix = environment_prefix
        
        # Configuration loaders
        self.loaders = {
            '.yaml': YamlConfigurationLoader(),
            '.yml': YamlConfigurationLoader(),
            '.json': JsonConfigurationLoader()
        }
        
        # Cached configuration
        self._config_cache: Optional[SystemConfigModel] = None
        
        logger.info(f"📋 Configuration Manager initialized - Directory: {self.config_dir}")
    
    def load_configuration(self, 
                          config_name: str = "system",
                          model_class: Type[T] = SystemConfigModel) -> T:
        """Load and validate configuration"""
        config_file = self._find_config_file(config_name)
        
        # Load base configuration
        base_config = {}
        if config_file and config_file.exists():
            loader = self.loaders.get(config_file.suffix)
            if loader:
                base_config = loader.load(config_file)
                logger.info(f"📋 Loaded configuration from {config_file}")
            else:
                logger.warning(f"Unsupported config format: {config_file.suffix}")
        
        # Apply environment variable overrides
        env_config = self._load_environment_overrides()
        
        # Merge configurations (env vars take precedence)
        merged_config = {**base_config, **env_config}
        
        # Validate and create model
        try:
            config = model_class(**merged_config)
            self._config_cache = config
            logger.info(f"✅ Configuration validated and loaded")
            return config
        except Exception as e:
            raise ConfigurationError(f"Configuration validation failed: {e}")
    
    def save_configuration(self, 
                           config: Union[BaseModel, Dict[str, Any]], 
                           config_name: str = "system",
                           format: str = "yaml") -> None:
        """Save configuration to file"""
        config_file = self.config_dir / f"{config_name}.{format}"
        
        # Convert to dict if Pydantic model
        if isinstance(config, BaseModel):
            data = asdict(config)
        else:
            data = config
        
        # Save using appropriate loader
        loader = self.loaders.get(f".{format}")
        if loader:
            loader.save(data, config_file)
            logger.info(f"💾 Configuration saved to {config_file}")
        else:
            raise ConfigurationError(f"Unsupported format: {format}")
    
    def get_default_config(self) -> SystemConfigModel:
        """Get default configuration"""
        return SystemConfigModel()
    
    def _find_config_file(self, config_name: str) -> Optional[Path]:
        """Find configuration file by name"""
        for ext in ['.yaml', '.yml', '.json']:
            config_file = self.config_dir / f"{config_name}{ext}"
            if config_file.exists():
                return config_file
        return None
    
    def _load_environment_overrides(self) -> Dict[str, Any]:
        """Load configuration from environment variables"""
        env_config = {}
        
        # Map environment variables to config keys
        env_mappings = {
            f"{self.environment_prefix}MODE": "mode",
            f"{self.environment_prefix}SCENE": "scene", 
            f"{self.environment_prefix}SEED": "seed",
            f"{self.environment_prefix}TARGET_FPS": "target_fps",
            f"{self.environment_prefix}ENABLE_GRAPHICS": "enable_graphics",
            f"{self.environment_prefix}ENABLE_PERSISTENCE": "enable_persistence",
            f"{self.environment_prefix}ENABLE_LOGGING": "enable_logging",
            f"{self.environment_prefix}ENABLE_CONSOLE": "enable_console",
            f"{self.environment_prefix}ENABLE_DEBUG": "enable_debug_mode",
            f"{self.environment_prefix}LOG_LEVEL": "log_level",
            f"{self.environment_prefix}LOG_FILE": "log_file",
            f"{self.environment_prefix}ASSETS_PATH": "assets_path",
            f"{self.environment_prefix}DATA_PATH": "data_path",
            f"{self.environment_prefix}LOGS_PATH": "logs_path",
            f"{self.environment_prefix}GRAPHICS_WIDTH": "graphics_width",
            f"{self.environment_prefix}GRAPHICS_HEIGHT": "graphics_height",
            f"{self.environment_prefix}FULLSCREEN": "fullscreen"
        }
        
        for env_var, config_key in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                # Convert string values to appropriate types
                converted_value = self._convert_env_value(value, config_key)
                env_config[config_key] = converted_value
                logger.debug(f"📋 Environment override: {config_key} = {converted_value}")
        
        return env_config
    
    def _convert_env_value(self, value: str, key: str) -> Union[str, int, bool, float]:
        """Convert environment variable string to appropriate type"""
        # Boolean conversion
        if key.startswith('enable_') or key == 'fullscreen':
            return value.lower() in ('true', '1', 'yes', 'on')
        
        # Integer conversion
        if key in ['target_fps', 'graphics_width', 'graphics_height', 'network_port']:
            try:
                return int(value)
            except ValueError:
                logger.warning(f"Invalid integer value for {key}: {value}")
                return value
        
        # Float conversion (if needed in future)
        # if key.endswith('_rate') or key.endswith('_ratio'):
        #     try:
        #         return float(value)
        #     except ValueError:
        #         logger.warning(f"Invalid float value for {key}: {value}")
        #         return value
        
        # Default to string
        return value
    
    def create_default_config_file(self, config_name: str = "system", format: str = "yaml") -> None:
        """Create default configuration file"""
        default_config = self.get_default_config()
        self.save_configuration(default_config, config_name, format)
    
    def reload_configuration(self) -> SystemConfigModel:
        """Reload configuration from disk"""
        self._config_cache = None
        return self.load_configuration()


# Global configuration manager instance
_config_manager: Optional[ConfigurationManager] = None


def get_configuration_manager() -> ConfigurationManager:
    """Get the global configuration manager"""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigurationManager()
    return _config_manager


def load_system_config(config_name: str = "system") -> SystemConfigModel:
    """Load system configuration using global manager"""
    manager = get_configuration_manager()
    return manager.load_configuration(config_name)


def setup_configuration_management(config_dir: Optional[Path] = None) -> ConfigurationManager:
    """Setup global configuration management"""
    global _config_manager
    _config_manager = ConfigurationManager(config_dir)
    return _config_manager
