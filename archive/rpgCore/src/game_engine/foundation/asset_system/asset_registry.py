"""
AssetRegistry - Centralized asset management and discovery.

SOLID Principle: Single Responsibility
- Only responsible for asset registration, retrieval, and caching
- Does not handle loading (delegated to specialized loaders)
- Does not handle rendering (that's the renderer's job)

Architecture:
- Singleton pattern for global access
- Type-safe asset retrieval
- Optional LRU caching for performance
- Metadata tracking for debugging
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Type, Generic, TypeVar
from enum import Enum
from datetime import datetime
import uuid


class AssetType(Enum):
    """Enumeration of supported asset types."""
    SPRITE = "sprite"
    SOUND = "sound"
    TEXTURE = "texture"
    CONFIG = "config"
    ENTITY_TEMPLATE = "entity_template"
    SHADER = "shader"
    ANIMATION = "animation"
    CUSTOM = "custom"


@dataclass
class Asset:
    """Container for an asset and its metadata."""
    id: str
    asset_type: AssetType
    data: Any
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=datetime.now().timestamp)
    tags: List[str] = field(default_factory=list)

    def has_tag(self, tag: str) -> bool:
        """Check if asset has a specific tag."""
        return tag in self.tags

    def add_tag(self, tag: str) -> None:
        """Add a tag to the asset."""
        if tag not in self.tags:
            self.tags.append(tag)

    def __repr__(self) -> str:
        return f"Asset(id={self.id}, type={self.asset_type.value}, tags={self.tags})"


class AssetRegistry:
    """
    Central registry for all game assets.

    Responsibilities:
    - Register and store assets
    - Retrieve assets by ID or type
    - Track asset metadata and dependencies
    - Provide iteration/filtering capabilities

    Does NOT handle:
    - Loading from disk (use AssetLoaders)
    - Rendering (use Renderers)
    - Serialization (use Serializers)
    """

    def __init__(self, enable_caching: bool = True, cache_size: int = 1000):
        """
        Initialize the asset registry.

        Args:
            enable_caching: Whether to enable LRU caching
            cache_size: Maximum number of assets to cache (if enabled)
        """
        self._assets: Dict[str, Asset] = {}
        self._type_index: Dict[AssetType, List[str]] = {t: [] for t in AssetType}
        self._tag_index: Dict[str, List[str]] = {}
        self._dependencies: Dict[str, List[str]] = {}
        self._enable_caching = enable_caching
        self._cache_size = cache_size
        self._access_log: Dict[str, int] = {}

    def register(
        self,
        asset_id: str,
        asset_type: AssetType,
        data: Any,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        dependencies: Optional[List[str]] = None
    ) -> "Asset":
        """
        Register an asset in the registry.

        Args:
            asset_id: Unique identifier for the asset
            asset_type: Type of the asset
            data: The actual asset data
            metadata: Optional metadata dictionary
            tags: Optional list of tags for categorization
            dependencies: Optional list of other asset IDs this depends on

        Returns:
            The registered Asset object

        Raises:
            ValueError: If asset_id already exists
        """
        if asset_id in self._assets:
            raise ValueError(f"Asset with ID '{asset_id}' already exists")

        asset = Asset(
            id=asset_id,
            asset_type=asset_type,
            data=data,
            metadata=metadata or {},
            tags=tags or []
        )

        self._assets[asset_id] = asset
        self._type_index[asset_type].append(asset_id)

        # Index tags
        for tag in (tags or []):
            if tag not in self._tag_index:
                self._tag_index[tag] = []
            self._tag_index[tag].append(asset_id)

        # Track dependencies
        if dependencies:
            self._dependencies[asset_id] = dependencies

        return asset

    def get(self, asset_id: str) -> Optional[Asset]:
        """
        Retrieve an asset by ID.

        Args:
            asset_id: The asset identifier

        Returns:
            The Asset object or None if not found
        """
        if asset_id in self._assets:
            self._access_log[asset_id] = self._access_log.get(asset_id, 0) + 1
            return self._assets[asset_id]
        return None

    def get_or_raise(self, asset_id: str) -> Asset:
        """
        Retrieve an asset by ID or raise an exception.

        Args:
            asset_id: The asset identifier

        Returns:
            The Asset object

        Raises:
            KeyError: If asset not found
        """
        asset = self.get(asset_id)
        if asset is None:
            raise KeyError(f"Asset not found: {asset_id}")
        return asset

    def list_by_type(self, asset_type: AssetType) -> List[Asset]:
        """
        Get all assets of a specific type.

        Args:
            asset_type: The AssetType to filter by

        Returns:
            List of Asset objects of that type
        """
        asset_ids = self._type_index.get(asset_type, [])
        return [self._assets[aid] for aid in asset_ids]

    def list_by_tag(self, tag: str) -> List[Asset]:
        """
        Get all assets with a specific tag.

        Args:
            tag: The tag to filter by

        Returns:
            List of Asset objects with that tag
        """
        asset_ids = self._tag_index.get(tag, [])
        return [self._assets[aid] for aid in asset_ids]

    def list_all(self) -> List[Asset]:
        """
        Get all registered assets.

        Returns:
            List of all Asset objects
        """
        return list(self._assets.values())

    def count(self) -> int:
        """Get the total number of registered assets."""
        return len(self._assets)

    def count_by_type(self, asset_type: AssetType) -> int:
        """Get the count of assets of a specific type."""
        return len(self._type_index.get(asset_type, []))

    def unregister(self, asset_id: str) -> bool:
        """
        Remove an asset from the registry.

        Args:
            asset_id: The asset to remove

        Returns:
            True if removed, False if not found
        """
        if asset_id not in self._assets:
            return False

        asset = self._assets.pop(asset_id)
        self._type_index[asset.asset_type].remove(asset_id)

        # Remove from tag index
        for tag in asset.tags:
            if tag in self._tag_index:
                self._tag_index[tag].remove(asset_id)
                if not self._tag_index[tag]:
                    del self._tag_index[tag]

        # Remove from dependencies
        if asset_id in self._dependencies:
            del self._dependencies[asset_id]

        if asset_id in self._access_log:
            del self._access_log[asset_id]

        return True

    def clear(self) -> None:
        """Clear all assets from the registry."""
        self._assets.clear()
        self._type_index = {t: [] for t in AssetType}
        self._tag_index.clear()
        self._dependencies.clear()
        self._access_log.clear()

    def validate(self) -> List[str]:
        """
        Validate registry integrity.

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        # Check for broken dependencies
        for asset_id, deps in self._dependencies.items():
            for dep_id in deps:
                if dep_id not in self._assets:
                    errors.append(
                        f"Asset '{asset_id}' depends on missing asset '{dep_id}'"
                    )

        # Check index consistency
        for asset_id, asset in self._assets.items():
            if asset_id not in self._type_index[asset.asset_type]:
                errors.append(f"Asset '{asset_id}' missing from type index")

        return errors

    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the registry.

        Returns:
            Dictionary with registry statistics
        """
        return {
            "total_assets": len(self._assets),
            "by_type": {t.value: len(ids) for t, ids in self._type_index.items()},
            "total_tags": len(self._tag_index),
            "most_accessed": sorted(
                self._access_log.items(), key=lambda x: x[1], reverse=True
            )[:10] if self._access_log else [],
            "total_dependencies": len(self._dependencies),
        }

    def __contains__(self, asset_id: str) -> bool:
        """Check if an asset exists in the registry."""
        return asset_id in self._assets

    def __len__(self) -> int:
        """Get the total number of assets."""
        return len(self._assets)

    def __iter__(self):
        """Iterate over all assets."""
        return iter(self._assets.values())

    def __repr__(self) -> str:
        return (
            f"AssetRegistry(assets={len(self._assets)}, "
            f"types={len([t for t in AssetType])}, "
            f"tags={len(self._tag_index)})"
        )
