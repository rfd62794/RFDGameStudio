"""
Asset Cache - LRU caching layer for asset management.

SOLID Principle: Single Responsibility
- Only responsible for caching loaded assets
- Does not handle loading (delegated to loaders)
- Does not handle registration (delegated to registry)

Architecture:
- LRU eviction strategy using OrderedDict
- Configurable max size and optional TTL
- Hit/miss statistics tracking
- Integration point between loaders and registry
"""

from collections import OrderedDict
from typing import Any, Dict, Optional
import time

from src.game_engine.foundation.asset_system.asset_registry import Asset


class AssetCache:
    """
    LRU cache for loaded assets.

    Sits between asset loaders and the registry to avoid
    reloading assets from disk on repeated access.
    """

    def __init__(self, max_size: int = 1000, ttl: Optional[float] = None):
        """
        Initialize the asset cache.

        Args:
            max_size: Maximum number of cached assets
            ttl: Optional time-to-live in seconds (None = no expiry)
        """
        if max_size < 1:
            raise ValueError("max_size must be >= 1")

        self._max_size = max_size
        self._ttl = ttl
        self._cache: OrderedDict[str, Asset] = OrderedDict()
        self._timestamps: Dict[str, float] = {}

        # Statistics
        self._hits = 0
        self._misses = 0
        self._evictions = 0

    def get(self, asset_id: str) -> Optional[Asset]:
        """
        Retrieve an asset from cache.

        Moves accessed item to end (most recently used).
        Returns None on cache miss or expired entry.
        """
        if asset_id not in self._cache:
            self._misses += 1
            return None

        if self._is_expired(asset_id):
            self._remove(asset_id)
            self._misses += 1
            return None

        self._cache.move_to_end(asset_id)
        self._hits += 1
        return self._cache[asset_id]

    def put(self, asset_id: str, asset: Asset) -> None:
        """
        Store an asset in cache.

        If cache is full, evicts the least recently used entry.
        If asset_id already exists, updates it and moves to end.
        """
        if asset_id in self._cache:
            self._cache.move_to_end(asset_id)
            self._cache[asset_id] = asset
            self._timestamps[asset_id] = time.monotonic()
            return

        # Evict LRU if at capacity
        while len(self._cache) >= self._max_size:
            self._evict_lru()

        self._cache[asset_id] = asset
        self._timestamps[asset_id] = time.monotonic()

    def invalidate(self, asset_id: str) -> bool:
        """
        Remove a specific asset from cache.

        Returns:
            True if the asset was in cache, False otherwise
        """
        if asset_id in self._cache:
            self._remove(asset_id)
            return True
        return False

    def clear(self) -> None:
        """Remove all assets from cache."""
        self._cache.clear()
        self._timestamps.clear()

    def contains(self, asset_id: str) -> bool:
        """Check if an asset is in cache (without affecting LRU order)."""
        if asset_id not in self._cache:
            return False
        if self._is_expired(asset_id):
            self._remove(asset_id)
            return False
        return True

    @property
    def size(self) -> int:
        """Current number of cached assets."""
        return len(self._cache)

    @property
    def max_size(self) -> int:
        """Maximum cache capacity."""
        return self._max_size

    @property
    def hit_rate(self) -> float:
        """Cache hit rate as a percentage (0.0 to 100.0)."""
        total = self._hits + self._misses
        if total == 0:
            return 0.0
        return (self._hits / total) * 100.0

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with hits, misses, evictions, size, hit_rate
        """
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "evictions": self._evictions,
            "hit_rate": self.hit_rate,
            "ttl": self._ttl,
        }

    def reset_stats(self) -> None:
        """Reset hit/miss/eviction counters."""
        self._hits = 0
        self._misses = 0
        self._evictions = 0

    def _evict_lru(self) -> None:
        """Evict the least recently used entry."""
        if self._cache:
            oldest_id, _ = self._cache.popitem(last=False)
            self._timestamps.pop(oldest_id, None)
            self._evictions += 1

    def _remove(self, asset_id: str) -> None:
        """Remove an entry from cache and timestamps."""
        self._cache.pop(asset_id, None)
        self._timestamps.pop(asset_id, None)

    def _is_expired(self, asset_id: str) -> bool:
        """Check if an asset has exceeded its TTL."""
        if self._ttl is None:
            return False
        elapsed = time.monotonic() - self._timestamps[asset_id]
        return elapsed >= self._ttl

    def __len__(self) -> int:
        return len(self._cache)

    def __contains__(self, asset_id: str) -> bool:
        return self.contains(asset_id)

    def __repr__(self) -> str:
        return (
            f"AssetCache(size={len(self._cache)}/{self._max_size}, "
            f"hit_rate={self.hit_rate:.1f}%)"
        )
