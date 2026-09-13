import os
import threading
from typing import Any, Dict, Optional, Union
from pathlib import Path
from loguru import logger
import yaml
import json

from src.game_engine.foundation.asset_registry import AssetRegistry
from src.game_engine.foundation.config_schemas import GameConfig

class ConfigManager:
    """
    Centralized configuration manager.
    Singleton pattern.
    Handles loading, validation (via Pydantic), and environment overrides.
    """
    _instance: Optional['ConfigManager'] = None
    _lock: threading.RLock = threading.RLock()
    
    def __new__(cls) -> 'ConfigManager':
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if getattr(self, '_initialized', False):
            return
            
        with self._lock:
            self._config: Optional[GameConfig] = None
            self._raw_config: Dict[str, Any] = {}
            self._environment = os.getenv("APP_ENV", "development")
            self._initialized = True
            logger.info(f"ConfigManager initialized (Env: {self._environment})")

    def load_config(self, path: Union[str, Path]) -> GameConfig:
        """
        Load configuration from a file.
        
        Args:
            path: Path to the config file (YAML or JSON)
            
        Returns:
            Validated GameConfig object
        """
        with self._lock:
            path_obj = Path(path)
            if not path_obj.exists():
                logger.warning(f"Config file not found: {path}, using defaults")
                self._config = GameConfig()
                return self._config

            try:
                with open(path_obj, 'r', encoding='utf-8') as f:
                    if path_obj.suffix.lower() in ('.yaml', '.yml'):
                        data = yaml.safe_load(f) or {}
                    elif path_obj.suffix.lower() == '.json':
                        data = json.load(f)
                    else:
                        raise ValueError(f"Unsupported config format: {path_obj.suffix}")
                
                # Apply environment overrides here if needed
                # For now, we just load the file
                
                self._raw_config = data
                self._config = GameConfig(**data)
                logger.info(f"Loaded configuration from {path}")
                return self._config
                
            except Exception as e:
                logger.error(f"Failed to load config from {path}: {e}")
                # Fallback to default
                self._config = GameConfig()
                return self._config

    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value by key (dot notation supported).
        
        Args:
            key: Config key (e.g. "graphics.resolution")
            default: Default value if key not found
            
        Returns:
            The configuration value
        """
        if self._config is None:
            # Lazy init default if not loaded
            self._config = GameConfig()
            
        # Try to access via Pydantic model first
        try:
            parts = key.split(".")
            value = self._config
            for part in parts:
                if hasattr(value, part):
                    value = getattr(value, part)
                elif isinstance(value, dict) and part in value:
                    value = value[part]
                else:
                    return default
            return value
        except Exception:
            return default

    def set(self, key: str, value: Any) -> None:
        """
        Runtime configuration update.
        Note: This does not persist to file.
        
        Args:
            key: Config key
            value: New value
        """
        # Complex to support dot notation set on Pydantic models safely at runtime
        # For Phase E, we'll keep it simple and just log a warning that it's read-only for now
        # or implement a simple dict override overlay.
        logger.warning(f"Runtime config updates not fully supported yet. Attempted to set {key}={value}")

    @property
    def config(self) -> GameConfig:
        """Access the raw Pydantic config object."""
        if self._config is None:
            self._config = GameConfig()
        return self._config
