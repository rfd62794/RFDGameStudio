"""
Asset Loader - Minimal Stub for Import Compatibility

This is a minimal stub to prevent import errors while the full
asset loader system is being refactored.
"""

from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass


@dataclass
class AssetDefinition:
    """Minimal asset definition stub"""
    name: str
    path: str
    asset_type: str = "unknown"
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class AssetLoader:
    """Minimal asset loader stub"""
    
    def __init__(self, base_path: Optional[Path] = None):
        self.base_path = base_path or Path(".")
        self._cache: Dict[str, Any] = {}
    
    def load(self, asset_path: str) -> Optional[Any]:
        """Load asset (stub implementation)"""
        if asset_path in self._cache:
            return self._cache[asset_path]
        
        # Stub: return None for all assets
        return None
    
    def preload(self, asset_list: List[str]) -> None:
        """Preload assets (stub implementation)"""
        pass
    
    def clear_cache(self) -> None:
        """Clear asset cache"""
        self._cache.clear()


class ObjectRegistry:
    """Minimal object registry stub"""
    
    def __init__(self):
        self._objects: Dict[str, Any] = {}
    
    def register(self, name: str, obj: Any) -> None:
        """Register object"""
        self._objects[name] = obj
    
    def get(self, name: str) -> Optional[Any]:
        """Get registered object"""
        return self._objects.get(name)
    
    def list_objects(self) -> List[str]:
        """List all registered objects"""
        return list(self._objects.keys())


# Global instances for backward compatibility
default_loader = AssetLoader()
default_registry = ObjectRegistry()
