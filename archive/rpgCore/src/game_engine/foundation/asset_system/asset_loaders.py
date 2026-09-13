"""
Asset Loaders - Pluggable asset loading strategies.

SOLID Principle: Open/Closed
- New loader types can be added without modifying existing code
- Each loader handles one asset type (Single Responsibility)
- Loaders return Result<Asset> for consistent error handling

Architecture:
- AbstractAssetLoader defines the interface
- Concrete loaders for configs, templates, sprites, and custom types
- All loaders integrate with AssetRegistry for registration
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional, Type
import json

from src.game_engine.foundation.result import Result
from src.game_engine.foundation.asset_system.asset_registry import Asset, AssetType

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False


class AbstractAssetLoader(ABC):
    """
    Base class for all asset loaders.

    Each loader is responsible for:
    - Loading a specific asset type from disk
    - Validating the loaded data
    - Returning a Result<Asset> with success or error
    """

    @abstractmethod
    def load(self, path: str, asset_id: Optional[str] = None,
             tags: Optional[List[str]] = None,
             metadata: Optional[Dict[str, Any]] = None) -> Result:
        """
        Load an asset from the given path.

        Args:
            path: File path to load from
            asset_id: Optional custom ID (defaults to filename stem)
            tags: Optional tags for the asset
            metadata: Optional metadata dictionary

        Returns:
            Result containing the Asset on success, or error message
        """
        pass

    @abstractmethod
    def supports_type(self, asset_type: AssetType) -> bool:
        """Check if this loader supports the given asset type."""
        pass

    def _resolve_asset_id(self, path: str, asset_id: Optional[str]) -> str:
        """Generate asset ID from path if not provided."""
        if asset_id:
            return asset_id
        return Path(path).stem

    def _validate_path(self, path: str, extensions: List[str]) -> Result:
        """
        Validate that path exists and has an allowed extension.

        Args:
            path: File path to validate
            extensions: List of allowed extensions (e.g., ['.yaml', '.json'])

        Returns:
            Result with True on success, error message on failure
        """
        file_path = Path(path)
        if not file_path.exists():
            return Result(success=False, error=f"File not found: {path}")
        if not file_path.is_file():
            return Result(success=False, error=f"Not a file: {path}")
        if extensions and file_path.suffix.lower() not in extensions:
            return Result(
                success=False,
                error=f"Unsupported file type '{file_path.suffix}' for {self.__class__.__name__}. "
                      f"Expected: {extensions}"
            )
        return Result(success=True, value=True)


class ConfigAssetLoader(AbstractAssetLoader):
    """
    Loads configuration files (YAML/JSON) as config assets.

    Supports .yaml, .yml, and .json files. Validates that the loaded
    data is a dictionary structure.
    """

    SUPPORTED_EXTENSIONS = ['.yaml', '.yml', '.json']

    def load(self, path: str, asset_id: Optional[str] = None,
             tags: Optional[List[str]] = None,
             metadata: Optional[Dict[str, Any]] = None) -> Result:
        validation = self._validate_path(path, self.SUPPORTED_EXTENSIONS)
        if not validation.success:
            return validation

        file_path = Path(path)
        data = self._load_data_file(file_path)
        if isinstance(data, Result):
            return data

        if not isinstance(data, dict):
            return Result(
                success=False,
                error=f"Config file must contain a dictionary, got {type(data).__name__}"
            )

        resolved_id = self._resolve_asset_id(path, asset_id)
        asset = Asset(
            id=resolved_id,
            asset_type=AssetType.CONFIG,
            data=data,
            metadata=metadata or {"source_path": str(file_path)},
            tags=tags or []
        )
        return Result(success=True, value=asset)

    def supports_type(self, asset_type: AssetType) -> bool:
        return asset_type == AssetType.CONFIG

    def _load_data_file(self, file_path: Path) -> Any:
        """Load YAML or JSON file and return parsed data or Result on error."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                if file_path.suffix.lower() in ('.yaml', '.yml'):
                    if not HAS_YAML:
                        return Result(success=False, error="PyYAML not installed")
                    return yaml.safe_load(f)
                return json.load(f)
        except (json.JSONDecodeError, yaml.YAMLError) as e:
            return Result(success=False, error=f"Parse error in {file_path}: {e}")
        except Exception as e:
            return Result(success=False, error=f"Failed to load {file_path}: {e}")


class EntityTemplateLoader(ConfigAssetLoader):
    """
    Loads entity template definitions from YAML/JSON files.

    Expected format - single template:
        template_id: "asteroid_large"
        entity_type: "asteroid"
        ...

    Expected format - multiple templates:
        templates:
          - template_id: "asteroid_large"
            entity_type: "asteroid"
            ...
          - template_id: "asteroid_small"
            ...
    """

    def load(self, path: str, asset_id: Optional[str] = None,
             tags: Optional[List[str]] = None,
             metadata: Optional[Dict[str, Any]] = None) -> Result:
        validation = self._validate_path(path, self.SUPPORTED_EXTENSIONS)
        if not validation.success:
            return validation

        file_path = Path(path)
        data = self._load_data_file(file_path)
        if isinstance(data, Result):
            return data

        if data is None:
            return Result(success=False, error=f"Empty file: {path}")

        templates = self._normalize_templates(data)
        if isinstance(templates, Result):
            return templates

        validation_result = self._validate_templates(templates)
        if not validation_result.success:
            return validation_result

        resolved_id = self._resolve_asset_id(path, asset_id)
        asset = Asset(
            id=resolved_id,
            asset_type=AssetType.ENTITY_TEMPLATE,
            data=templates,
            metadata=metadata or {"source_path": str(file_path), "count": len(templates)},
            tags=tags or []
        )
        return Result(success=True, value=asset)

    def supports_type(self, asset_type: AssetType) -> bool:
        return asset_type == AssetType.ENTITY_TEMPLATE

    def _normalize_templates(self, data: Any) -> Any:
        """Convert data to list of template dicts or return Result on error."""
        if isinstance(data, dict):
            if "templates" in data:
                templates = data["templates"]
                if not isinstance(templates, list):
                    return Result(success=False, error="'templates' key must contain a list")
                return templates
            return [data]

        if isinstance(data, list):
            return data

        return Result(success=False, error=f"Expected dict or list, got {type(data).__name__}")

    def _validate_templates(self, templates: List[Dict]) -> Result:
        """Validate that all templates have required fields."""
        for i, tmpl in enumerate(templates):
            if not isinstance(tmpl, dict):
                return Result(success=False, error=f"Template at index {i} is not a dictionary")
            if "template_id" not in tmpl:
                return Result(success=False, error=f"Template at index {i} missing 'template_id'")
            if "entity_type" not in tmpl:
                return Result(success=False, error=f"Template at index {i} missing 'entity_type'")
        return Result(success=True, value=True)


class SpriteAssetLoader(AbstractAssetLoader):
    """
    Loads sprite/image files as sprite assets.

    Uses Pillow for image loading. Returns image dimensions and mode
    in metadata. Falls back to basic file info if Pillow is unavailable.
    """

    SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.gif']

    def load(self, path: str, asset_id: Optional[str] = None,
             tags: Optional[List[str]] = None,
             metadata: Optional[Dict[str, Any]] = None) -> Result:
        validation = self._validate_path(path, self.SUPPORTED_EXTENSIONS)
        if not validation.success:
            return validation

        file_path = Path(path)
        resolved_id = self._resolve_asset_id(path, asset_id)

        try:
            if HAS_PILLOW:
                img = Image.open(file_path)
                sprite_data = {
                    "width": img.width,
                    "height": img.height,
                    "mode": img.mode,
                    "format": img.format,
                }
                img.close()
            else:
                sprite_data = {
                    "width": 0,
                    "height": 0,
                    "mode": "unknown",
                    "format": file_path.suffix.lstrip('.').upper(),
                    "note": "Pillow not installed - dimensions unavailable"
                }

            asset_metadata = metadata or {}
            asset_metadata["source_path"] = str(file_path)
            asset_metadata.update(sprite_data)

            asset = Asset(
                id=resolved_id,
                asset_type=AssetType.SPRITE,
                data=sprite_data,
                metadata=asset_metadata,
                tags=tags or []
            )
            return Result(success=True, value=asset)

        except Exception as e:
            return Result(success=False, error=f"Failed to load sprite {path}: {e}")

    def supports_type(self, asset_type: AssetType) -> bool:
        return asset_type == AssetType.SPRITE


class CustomAssetLoader(AbstractAssetLoader):
    """
    User-extensible asset loader for custom asset types.

    Provides a hook-based system where users register load functions
    for custom asset types.
    """

    def __init__(self):
        self._load_functions: Dict[str, Any] = {}

    def register_loader(self, extension: str, load_fn) -> None:
        """
        Register a custom load function for a file extension.

        Args:
            extension: File extension including dot (e.g., '.dat')
            load_fn: Callable(path) -> dict that returns asset data
        """
        self._load_functions[extension.lower()] = load_fn

    def load(self, path: str, asset_id: Optional[str] = None,
             tags: Optional[List[str]] = None,
             metadata: Optional[Dict[str, Any]] = None) -> Result:
        file_path = Path(path)
        if not file_path.exists():
            return Result(success=False, error=f"File not found: {path}")
        if not file_path.is_file():
            return Result(success=False, error=f"Not a file: {path}")

        ext = file_path.suffix.lower()
        if ext not in self._load_functions:
            return Result(
                success=False,
                error=f"No custom loader registered for extension '{ext}'"
            )

        resolved_id = self._resolve_asset_id(path, asset_id)

        try:
            data = self._load_functions[ext](str(file_path))

            asset = Asset(
                id=resolved_id,
                asset_type=AssetType.CUSTOM,
                data=data,
                metadata=metadata or {"source_path": str(file_path)},
                tags=tags or []
            )
            return Result(success=True, value=asset)

        except Exception as e:
            return Result(success=False, error=f"Custom loader failed for {path}: {e}")

    def supports_type(self, asset_type: AssetType) -> bool:
        return asset_type == AssetType.CUSTOM

    @property
    def registered_extensions(self) -> List[str]:
        """Get list of registered custom extensions."""
        return list(self._load_functions.keys())


class AssetLoaderRegistry:
    """
    Registry that maps asset types to their loaders.

    Provides a single entry point for loading any asset type
    by delegating to the appropriate loader.
    """

    def __init__(self):
        self._loaders: Dict[AssetType, AbstractAssetLoader] = {}

    def register_loader(self, asset_type: AssetType, loader: AbstractAssetLoader) -> None:
        """Register a loader for an asset type."""
        self._loaders[asset_type] = loader

    def get_loader(self, asset_type: AssetType) -> Optional[AbstractAssetLoader]:
        """Get the loader for an asset type."""
        return self._loaders.get(asset_type)

    def load(self, asset_type: AssetType, path: str, **kwargs) -> Result:
        """
        Load an asset using the appropriate loader.

        Args:
            asset_type: Type of asset to load
            path: File path
            **kwargs: Additional arguments passed to the loader

        Returns:
            Result containing the Asset on success
        """
        loader = self._loaders.get(asset_type)
        if not loader:
            return Result(success=False, error=f"No loader registered for {asset_type.value}")
        return loader.load(path, **kwargs)

    @classmethod
    def create_default(cls) -> "AssetLoaderRegistry":
        """Create a registry with all default loaders registered."""
        registry = cls()
        registry.register_loader(AssetType.CONFIG, ConfigAssetLoader())
        registry.register_loader(AssetType.ENTITY_TEMPLATE, EntityTemplateLoader())
        registry.register_loader(AssetType.SPRITE, SpriteAssetLoader())
        registry.register_loader(AssetType.CUSTOM, CustomAssetLoader())
        return registry
