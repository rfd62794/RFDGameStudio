"""
System and Component Registry

Centralized registry for discovering, registering, and managing all systems
and components in the engine. Provides a single source of truth for system
lifecycle and dependencies.

Thread-safe singleton implementation.
"""

from typing import Dict, List, Optional, Any, Set, Type, TypeVar
from dataclasses import dataclass, field
from enum import Enum
import threading
import time

T = TypeVar('T')


class RegistryType(Enum):
    """Registry entry types."""
    SYSTEM = "system"
    COMPONENT = "component"
    ENGINE = "engine"
    ASSET = "asset"


@dataclass
class RegistryEntry:
    """Entry in the registry with metadata."""
    name: str
    obj: Any
    entry_type: RegistryType
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    access_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def touch(self) -> None:
        """Update access timestamp."""
        self.last_accessed = time.time()
        self.access_count += 1


class DGTRegistry:
    """
    Centralized system and component registry.

    Provides:
    - Registration and deregistration of systems/components
    - Discovery and lookup by name or type
    - Lifecycle management
    - Dependency resolution
    - Performance metrics

    Thread-safe singleton implementation.
    """

    _instance: Optional['DGTRegistry'] = None
    _lock = threading.Lock()

    def __new__(cls) -> 'DGTRegistry':
        """Singleton pattern implementation."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """Initialize registry (only once for singleton)."""
        if hasattr(self, '_initialized'):
            return

        self._initialized = True
        self._entries: Dict[str, RegistryEntry] = {}
        self._type_index: Dict[RegistryType, List[str]] = {
            rt: [] for rt in RegistryType
        }
        self._lock = threading.Lock()

    def register(
        self,
        name: str,
        obj: Any,
        entry_type: RegistryType = RegistryType.SYSTEM,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Register an object in the registry.

        Args:
            name: Unique name for the entry
            obj: Object to register
            entry_type: Type of registry entry
            metadata: Optional metadata dictionary

        Returns:
            True if registration successful, False if name already exists
        """
        with self._lock:
            if name in self._entries:
                return False

            entry = RegistryEntry(
                name=name,
                obj=obj,
                entry_type=entry_type,
                metadata=metadata or {},
            )
            self._entries[name] = entry
            self._type_index[entry_type].append(name)
            return True

    def unregister(self, name: str) -> bool:
        """
        Unregister an object from the registry.

        Args:
            name: Name of entry to unregister

        Returns:
            True if unregistration successful, False if not found
        """
        with self._lock:
            if name not in self._entries:
                return False

            entry = self._entries.pop(name)
            self._type_index[entry.entry_type].remove(name)
            return True

    def get(self, name: str) -> Optional[Any]:
        """
        Get an object by name.

        Args:
            name: Name of entry

        Returns:
            Object if found, None otherwise
        """
        with self._lock:
            if name not in self._entries:
                return None

            entry = self._entries[name]
            entry.touch()
            return entry.obj

    def get_by_type(self, entry_type: RegistryType) -> List[Any]:
        """
        Get all objects of a specific type.

        Args:
            entry_type: Type of entries to retrieve

        Returns:
            List of objects of the specified type
        """
        with self._lock:
            names = self._type_index.get(entry_type, [])
            return [self._entries[name].obj for name in names]

    def get_all_by_type(self, entry_type: RegistryType) -> Dict[str, Any]:
        """
        Get all objects of a type with their names.

        Args:
            entry_type: Type of entries to retrieve

        Returns:
            Dictionary mapping names to objects
        """
        with self._lock:
            names = self._type_index.get(entry_type, [])
            return {name: self._entries[name].obj for name in names}

    def exists(self, name: str) -> bool:
        """Check if an entry exists."""
        with self._lock:
            return name in self._entries

    def get_entry_type(self, name: str) -> Optional[RegistryType]:
        """Get the type of a registered entry."""
        with self._lock:
            if name not in self._entries:
                return None
            return self._entries[name].entry_type

    def get_metadata(self, name: str) -> Optional[Dict[str, Any]]:
        """Get metadata for an entry."""
        with self._lock:
            if name not in self._entries:
                return None
            return self._entries[name].metadata.copy()

    def set_metadata(self, name: str, metadata: Dict[str, Any]) -> bool:
        """Set metadata for an entry."""
        with self._lock:
            if name not in self._entries:
                return False
            self._entries[name].metadata = metadata
            return True

    def get_all_names(self) -> List[str]:
        """Get all registered entry names."""
        with self._lock:
            return list(self._entries.keys())

    def get_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        with self._lock:
            stats = {
                "total_entries": len(self._entries),
                "by_type": {
                    rt.value: len(self._type_index.get(rt, []))
                    for rt in RegistryType
                },
            }
            return stats

    def clear(self) -> None:
        """Clear all entries from registry."""
        with self._lock:
            self._entries.clear()
            for rt in RegistryType:
                self._type_index[rt].clear()

    def __len__(self) -> int:
        """Get total number of entries."""
        return len(self._entries)

    def __contains__(self, name: str) -> bool:
        """Check if entry exists."""
        return name in self._entries

    def __repr__(self) -> str:
        """Registry representation."""
        stats = self.get_stats()
        return (
            f"DGTRegistry(total={stats['total_entries']}, "
            f"systems={stats['by_type']['system']}, "
            f"components={stats['by_type']['component']})"
        )
