import threading
import time
from typing import Dict, Optional, OrderedDict
from loguru import logger

from src.game_engine.foundation.asset_registry import Asset

class AssetCache:
    """
    LRU (Least Recently Used) Cache for assets.
    Thread-safe implementation with memory usage tracking.
    """
    
    def __init__(self, max_size: int = 100):
        self._max_size = max_size
        self._cache: OrderedDict[str, Asset] = OrderedDict()
        self._lock = threading.RLock()
        self._hits = 0
        self._misses = 0
        
    def get(self, asset_id: str) -> Optional[Asset]:
        """
        Retrieve an asset from cache.
        Updates LRU order on hit.
        
        Args:
            asset_id: The asset identifier
            
        Returns:
            The Asset if cached, None otherwise
        """
        with self._lock:
            if asset_id in self._cache:
                self._hits += 1
                self._cache.move_to_end(asset_id)
                return self._cache[asset_id]
            
            self._misses += 1
            return None
            
    def put(self, asset_id: str, asset: Asset) -> None:
        """
        Add an asset to the cache.
        Evicts least recently used item if cache is full.
        
        Args:
            asset_id: The asset identifier
            asset: The asset object
        """
        with self._lock:
            if asset_id in self._cache:
                self._cache.move_to_end(asset_id)
            else:
                if len(self._cache) >= self._max_size:
                    removed_id, _ = self._cache.popitem(last=False)
                    logger.debug(f"Evicted asset from cache: {removed_id}")
            
            self._cache[asset_id] = asset
            
    def invalidate(self, asset_id: str) -> None:
        """Remove a specific asset from cache."""
        with self._lock:
            if asset_id in self._cache:
                del self._cache[asset_id]
                logger.debug(f"Invalidated cache for: {asset_id}")
                
    def clear(self) -> None:
        """Clear the entire cache."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
            logger.info("Asset cache cleared")
            
    def get_stats(self) -> Dict[str, float]:
        """Get cache performance statistics."""
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = (self._hits / total_requests) if total_requests > 0 else 0.0
            
            return {
                "size": len(self._cache),
                "max_size": self._max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": hit_rate
            }
