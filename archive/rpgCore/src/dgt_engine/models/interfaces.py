"""
Abstract interfaces for asset management and rendering.

Following Interface Segregation Principle - small, focused interfaces
for specific responsibilities.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple, Protocol
from pathlib import Path
from dataclasses import dataclass


class IAssetLoader(ABC):
    """Interface for loading assets from storage."""
    
    @abstractmethod
    def load_assets(self, asset_path: Path) -> bool:
        """Load assets from the specified path."""
        pass
    
    @abstractmethod
    def validate_asset_format(self, data: bytes) -> bool:
        """Validate asset format integrity."""
        pass
    
    @abstractmethod
    def cleanup(self) -> None:
        """Clean up resources."""
        pass


class ICacheManager(Protocol):
    """Protocol for cache management operations."""
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached item."""
        ...
    
    def set(self, key: str, value: Any) -> None:
        """Cache an item."""
        ...
    
    def clear(self) -> None:
        """Clear all cache."""
        ...
    
    def size(self) -> int:
        """Get cache size."""
        ...


class IInstantiationFactory(ABC):
    """Interface for creating runtime instances."""
    
    @abstractmethod
    def create_character(self, character_id: str, position: Tuple[int, int], **kwargs) -> Optional[Any]:
        """Create character instance."""
        pass
    
    @abstractmethod
    def create_object(self, object_id: str, position: Tuple[int, int], **kwargs) -> Optional[Any]:
        """Create object instance."""
        pass
    
    @abstractmethod
    def create_environment(self, environment_id: str, **kwargs) -> Optional[Any]:
        """Create environment instance."""
        pass


class IPaletteApplier(ABC):
    """Interface for palette application to sprites."""
    
    @abstractmethod
    def apply_palette(self, sprite_data: List[List[Optional[str]]], palette: List[str]) -> List[List[Optional[str]]]:
        """Apply color palette to sprite data."""
        pass


class IInteractionProvider(ABC):
    """Interface for interaction and dialogue data."""
    
    @abstractmethod
    def get_interaction(self, interaction_id: str) -> Optional[Dict[str, Any]]:
        """Get interaction by ID."""
        pass
    
    @abstractmethod
    def get_dialogue_set(self, dialogue_set_id: str) -> Optional[Dict[str, List[str]]]:
        """Get dialogue set by ID."""
        pass


class IAssetRegistry(ABC):
    """Interface for asset registry access."""
    
    @abstractmethod
    def get_available_characters(self) -> List[str]:
        """Get available character IDs."""
        pass
    
    @abstractmethod
    def get_available_objects(self) -> List[str]:
        """Get available object IDs."""
        pass
    
    @abstractmethod
    def get_available_environments(self) -> List[str]:
        """Get available environment IDs."""
        pass


@dataclass
class AssetMetadata:
    """Metadata for loaded assets."""
    version: int
    build_time: float
    checksum: str
    asset_count: int
    data_offset: int


@dataclass
class LoadResult:
    """Result of asset loading operation."""
    success: bool
    metadata: Optional[AssetMetadata] = None
    error: Optional[str] = None
