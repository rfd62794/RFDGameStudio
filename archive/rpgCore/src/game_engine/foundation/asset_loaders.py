from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Union
from pathlib import Path
import json
import yaml
from loguru import logger
from PIL import Image

from src.game_engine.foundation.asset_registry import Asset, AssetType

class AbstractAssetLoader(ABC):
    """Abstract base class for asset loaders."""
    
    @abstractmethod
    def load(self, path: Union[str, Path]) -> Any:
        """Load asset data from path."""
        pass
        
    @abstractmethod
    def supports_type(self, asset_type: AssetType) -> bool:
        """Check if this loader supports the given asset type."""
        pass

class SpriteAssetLoader(AbstractAssetLoader):
    """Loader for image/sprite assets using Pillow."""
    
    def load(self, path: Union[str, Path]) -> Image.Image:
        try:
            path_obj = Path(path)
            if not path_obj.exists():
                raise FileNotFoundError(f"Sprite not found: {path}")
                
            image = Image.open(path_obj)
            # Force loading data to ensure file handle can be closed
            image.load()
            return image
        except Exception as e:
            logger.error(f"Failed to load sprite {path}: {e}")
            raise

    def supports_type(self, asset_type: AssetType) -> bool:
        return asset_type in (AssetType.SPRITE, AssetType.TEXTURE)

class ConfigAssetLoader(AbstractAssetLoader):
    """Loader for configuration files (YAML/JSON)."""
    
    def load(self, path: Union[str, Path]) -> Dict[str, Any]:
        try:
            path_obj = Path(path)
            if not path_obj.exists():
                raise FileNotFoundError(f"Config not found: {path}")
                
            with open(path_obj, 'r', encoding='utf-8') as f:
                if path_obj.suffix.lower() in ('.yaml', '.yml'):
                    return yaml.safe_load(f) or {}
                elif path_obj.suffix.lower() == '.json':
                    return json.load(f)
                else:
                    raise ValueError(f"Unsupported config format: {path_obj.suffix}")
                    
        except Exception as e:
            logger.error(f"Failed to load config {path}: {e}")
            raise

    def supports_type(self, asset_type: AssetType) -> bool:
        return asset_type in (AssetType.CONFIG, AssetType.ENTITY_TEMPLATE)
