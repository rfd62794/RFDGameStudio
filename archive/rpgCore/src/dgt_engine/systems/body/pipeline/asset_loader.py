"""
Asset Loader - Foundation Tier Asset Management
Handles loading and validation of all game assets
"""

import json
import time
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Union, Any, Tuple
from dataclasses import dataclass, asdict
from PIL import Image
from loguru import logger

from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from dgt_engine.foundation.types import Result, ValidationResult


@dataclass
class AssetMetadata:
    """Metadata for loaded assets"""
    name: str
    asset_type: str  # 'sprite', 'building', 'config', etc.
    file_path: str
    size: Optional[Tuple[int, int]] = None
    checksum: Optional[str] = None
    loaded_at: Optional[str] = None
    validated: bool = False

# Alias for backward compatibility
AssetDefinition = AssetMetadata


class AssetLoader:
    """Professional asset loading and validation system"""
    
    def __init__(self, base_path: Optional[Union[str, Path]] = None):
        self.base_path = Path(base_path) if base_path else Path("assets")
        self.loaded_assets: Dict[str, AssetMetadata] = {}
        self.asset_cache: Dict[str, Any] = {}
        
        # Supported formats
        self.image_formats = {'.png', '.jpg', '.jpeg', '.gif', '.bmp'}
        self.config_formats = {'.json', '.yaml', '.yml'}
        
        logger.info(f"📦 AssetLoader initialized with base path: {self.base_path}")
    
    def load_asset(self, asset_path: Union[str, Path], asset_type: str) -> Result[Any]:
        """Load an asset with validation"""
        try:
            full_path = self.base_path / asset_path
            
            if not full_path.exists():
                return Result(success=False, error=f"Asset not found: {full_path}")
            
            # Determine loading method by type
            if asset_type == 'sprite':
                result = self._load_image(full_path)
            elif asset_type == 'building':
                result = self._load_building_config(full_path)
            elif asset_type == 'scenario':
                result = self._load_scenario(full_path)
            elif asset_type == 'config':
                result = self._load_config(full_path)
            else:
                result = self._load_generic(full_path)
            
            if result.success:
                # Create metadata
                metadata = AssetMetadata(
                    name=Path(asset_path).stem,
                    asset_type=asset_type,
                    file_path=str(full_path),
                    size=self._get_asset_size(result.value, asset_type),
                    validated=True
                )
                
                self.loaded_assets[metadata.name] = metadata
                self.asset_cache[metadata.name] = result.value
                
                logger.info(f"✅ Loaded {asset_type}: {metadata.name}")
            
            return result
            
        except Exception as e:
            error_msg = f"Failed to load asset {asset_path}: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def _load_image(self, file_path: Path) -> Result[Image.Image]:
        """Load and validate image asset"""
        try:
            if file_path.suffix.lower() not in self.image_formats:
                return Result(success=False, error=f"Unsupported image format: {file_path.suffix}")
            
            image = Image.open(file_path)
            
            # Validate image properties
            if image.mode not in ['RGB', 'RGBA', 'L', 'P']:
                return Result(success=False, error=f"Unsupported image mode: {image.mode}")
            
            # Check if image is reasonable size
            if image.size[0] > 4096 or image.size[1] > 4096:
                logger.warning(f"Large image detected: {image.size}")
            
            return Result(success=True, value=image)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load image: {str(e)}")
    
    def _load_building_config(self, file_path: Path) -> Result[Dict[str, Any]]:
        """Load and validate building configuration"""
        try:
            if file_path.suffix.lower() not in {'.yaml', '.yml'}:
                return Result(success=False, error=f"Building configs must be YAML files")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            # Validate building structure
            validation = self._validate_building_config(config)
            if not validation.success:
                return validation
            
            return Result(success=True, value=config)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load building config: {str(e)}")
    
    def _load_scenario(self, file_path: Path) -> Result[Dict[str, Any]]:
        """Load and validate scenario configuration"""
        try:
            if file_path.suffix.lower() not in {'.json'}:
                return Result(success=False, error=f"Scenarios must be JSON files")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # Validate scenario structure
            validation = self._validate_scenario_config(config)
            if not validation.success:
                return validation
            
            return Result(success=True, value=config)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load scenario: {str(e)}")
    
    def _validate_scenario_config(self, config: Dict[str, Any]) -> ValidationResult:
        """Validate scenario configuration structure"""
        required_fields = ['player', 'position', 'world_time']
        
        for field in required_fields:
            if field not in config:
                return ValidationResult(success=False, error=f"Missing required field: {field}")
        
        # Validate player structure
        player = config['player']
        if not isinstance(player, dict):
            return ValidationResult(success=False, error="Player must be a dictionary")
        
        player_fields = ['name', 'hp', 'max_hp', 'attributes']
        for field in player_fields:
            if field not in player:
                return ValidationResult(success=False, error=f"Missing required player field: {field}")
        
        # Validate position
        position = config['position']
        if not isinstance(position, dict) or 'x' not in position or 'y' not in position:
            return ValidationResult(success=False, error="Invalid position format")
        
        return ValidationResult(success=True)
    
    def _load_config(self, file_path: Path) -> Result[Dict[str, Any]]:
        """Load generic configuration file"""
        try:
            if file_path.suffix.lower() in {'.json'}:
                with open(file_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            elif file_path.suffix.lower() in {'.yaml', '.yml'}:
                with open(file_path, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f)
            else:
                return Result(success=False, error=f"Unsupported config format: {file_path.suffix}")
            
            return Result(success=True, value=config)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load config: {str(e)}")
    
    def _load_generic(self, file_path: Path) -> Result[Any]:
        """Load generic file as text"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return Result(success=True, value=content)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load file: {str(e)}")
    
    def _validate_building_config(self, config: Dict[str, Any]) -> ValidationResult:
        """Validate building configuration structure"""
        required_fields = ['name', 'type', 'size']
        
        for field in required_fields:
            if field not in config:
                return ValidationResult(success=False, error=f"Missing required field: {field}")
        
        # Validate size
        size = config['size']
        if not isinstance(size, dict) or 'width' not in size or 'height' not in size:
            return ValidationResult(success=False, error="Invalid size format")
        
        width, height = size['width'], size['height']
        if not isinstance(width, int) or not isinstance(height, int):
            return ValidationResult(success=False, error="Size values must be integers")
        
        if width <= 0 or height <= 0:
            return ValidationResult(success=False, error="Size values must be positive")
        
        # Check if building fits in sovereign constraints
        if width > SOVEREIGN_WIDTH or height > SOVEREIGN_HEIGHT:
            logger.warning(f"Building size ({width}x{height}) exceeds sovereign constraints ({SOVEREIGN_WIDTH}x{SOVEREIGN_HEIGHT})")
        
        return ValidationResult(success=True)
    
    def _get_asset_size(self, asset: Any, asset_type: str) -> Optional[Tuple[int, int]]:
        """Get size information for asset"""
        if asset_type == 'sprite' and isinstance(asset, Image.Image):
            return asset.size
        elif asset_type == 'building' and isinstance(asset, dict):
            size_info = asset.get('size', {})
            if isinstance(size_info, dict):
                return (size_info.get('width', 0), size_info.get('height', 0))
        return None
    
    def get_asset(self, name: str) -> Optional[Any]:
        """Get loaded asset by name"""
        return self.asset_cache.get(name)
    
    def get_metadata(self, name: str) -> Optional[AssetMetadata]:
        """Get asset metadata by name"""
        return self.loaded_assets.get(name)
    
    def list_assets(self, asset_type: Optional[str] = None) -> List[AssetMetadata]:
        """List all loaded assets, optionally filtered by type"""
        assets = list(self.loaded_assets.values())
        
        if asset_type:
            assets = [a for a in assets if a.asset_type == asset_type]
        
        return assets
    
    def unload_asset(self, name: str) -> bool:
        """Unload an asset"""
        if name in self.loaded_assets:
            del self.loaded_assets[name]
            if name in self.asset_cache:
                del self.asset_cache[name]
            logger.info(f"🗑️ Unloaded asset: {name}")
            return True
        return False
    
    def clear_cache(self) -> None:
        """Clear all loaded assets"""
        self.loaded_assets.clear()
        self.asset_cache.clear()
        logger.info("🗑️ Cleared all assets from cache")
    
    def validate_integrity(self) -> ValidationResult:
        """Validate integrity of all loaded assets"""
        errors = []
        
        for name, metadata in self.loaded_assets.items():
            # Check if file still exists
            if not Path(metadata.file_path).exists():
                errors.append(f"Asset file missing: {name}")
                continue
            
            # Check if asset is still in cache
            if name not in self.asset_cache:
                errors.append(f"Asset missing from cache: {name}")
        
        if errors:
            return ValidationResult(success=False, error="; ".join(errors))
        
        return ValidationResult(success=True)
    
    def load_building_registry(self, registry_path: Union[str, Path]) -> Result[List[Dict[str, Any]]]:
        """Load multiple building configurations from a directory"""
        try:
            registry_path = Path(registry_path)
            
            if not registry_path.exists():
                return Result(success=False, error=f"Registry path not found: {registry_path}")
            
            buildings = []
            
            # Find all building YAML files
            for yaml_file in registry_path.glob("building_*.yaml"):
                result = self.load_asset(yaml_file.relative_to(self.base_path), 'building')
                
                if result.success:
                    buildings.append(result.value)
                    logger.info(f"🏢 Loaded building: {yaml_file.stem}")
                else:
                    logger.warning(f"Failed to load building {yaml_file}: {result.error}")
            
            logger.info(f"🏢 Loaded {len(buildings)} buildings from registry")
            return Result(success=True, value=buildings)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load building registry: {str(e)}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get loading statistics"""
        stats = {
            'total_assets': len(self.loaded_assets),
            'by_type': {},
            'total_size_mb': 0
        }
        
        for metadata in self.loaded_assets.values():
            # Count by type
            asset_type = metadata.asset_type
            if asset_type not in stats['by_type']:
                stats['by_type'][asset_type] = 0
            stats['by_type'][asset_type] += 1
            
            # Estimate size (rough calculation)
            if metadata.size:
                pixels = metadata.size[0] * metadata.size[1]
                stats['total_size_mb'] += pixels * 4 / (1024 * 1024)  # Assume 4 bytes per pixel
        
        return stats

class ObjectRegistry:
    """Registry for spawnable game objects"""
    
    def __init__(self, asset_loader: AssetLoader):
        self.asset_loader = asset_loader
        self.registered_objects: Dict[str, Any] = {}
        logger.info("📦 ObjectRegistry initialized")
    
    def register_object(self, name: str, object_def: Any) -> None:
        """Register an object definition"""
        self.registered_objects[name] = object_def
        logger.info(f"📝 Registered object: {name}")
    
    def spawn_object(self, asset_id: str, position: Tuple[int, int]) -> Optional[Any]:
        """Spawn an object at position"""
        # Logic to spawn object would go here
        # For now, return a simple dict representation or look up in registered objects
        logger.debug(f"✨ Spawning {asset_id} at {position}")
        return {
            "id": asset_id,
            "position": position,
            "spawned_at": time.time()
        }

    def get_registered_objects(self) -> List[str]:
         return list(self.registered_objects.keys())
