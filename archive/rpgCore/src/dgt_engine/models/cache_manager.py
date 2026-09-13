"""
Cache management following Single Responsibility Principle.

Handles only caching operations with LRU eviction and memory management.
"""

import threading
from typing import Dict, Any, Optional, OrderedDict
from collections import OrderedDict
from dataclasses import dataclass
from time import time

from loguru import logger

from .interfaces import ICacheManager


@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    value: Any
    created_at: float
    last_accessed: float
    access_count: int = 0
    
    def touch(self) -> None:
        """Update last accessed time."""
        self.last_accessed = time()
        self.access_count += 1


class LRUCacheManager(ICacheManager):
    """
    LRU cache manager with thread-safe operations.
    
    Single responsibility: Cache storage and retrieval with eviction.
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: Optional[int] = None):
        """
        Initialize cache manager.
        
        Args:
            max_size: Maximum number of cached items
            ttl_seconds: Time-to-live for cache entries (None for no expiration)
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        
        # OrderedDict maintains insertion order for LRU
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.RLock()
        
        # Statistics
        self._hits = 0
        self._misses = 0
        self._evictions = 0
        
        logger.debug(f"🗄️ CacheManager initialized: max_size={max_size}, ttl={ttl_seconds}")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get cached item.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            entry = self._cache[key]
            
            # Check TTL expiration
            if self._is_expired(entry):
                del self._cache[key]
                self._misses += 1
                logger.debug(f"⏰ Cache entry expired: {key}")
                return None
            
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            entry.touch()
            self._hits += 1
            
            logger.debug(f"🎯 Cache hit: {key}")
            return entry.value
    
    def set(self, key: str, value: Any) -> None:
        """
        Cache an item.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        with self._lock:
            current_time = time()
            
            # Update existing entry
            if key in self._cache:
                entry = self._cache[key]
                entry.value = value
                entry.last_accessed = current_time
                entry.access_count += 1
                self._cache.move_to_end(key)
                return
            
            # Create new entry
            entry = CacheEntry(
                value=value,
                created_at=current_time,
                last_accessed=current_time
            )
            
            # Add to cache
            self._cache[key] = entry
            
            # Evict if over capacity
            self._evict_if_needed()
            
            logger.debug(f"💾 Cached item: {key}")
    
    def clear(self) -> None:
        """Clear all cache."""
        with self._lock:
            cleared_count = len(self._cache)
            self._cache.clear()
            self._hits = 0
            self._misses = 0
            self._evictions = 0
            
            logger.info(f"🧹 Cache cleared: {cleared_count} items removed")
    
    def size(self) -> int:
        """Get current cache size."""
        with self._lock:
            return len(self._cache)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = self._hits / total_requests if total_requests > 0 else 0
            
            return {
                'size': len(self._cache),
                'max_size': self.max_size,
                'hits': self._hits,
                'misses': self._misses,
                'evictions': self._evictions,
                'hit_rate': hit_rate,
                'ttl_seconds': self.ttl_seconds
            }
    
    def remove(self, key: str) -> bool:
        """
        Remove specific cache entry.
        
        Args:
            key: Cache key to remove
            
        Returns:
            True if entry was removed, False if not found
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.debug(f"🗑️ Removed cache entry: {key}")
                return True
            return False
    
    def cleanup_expired(self) -> int:
        """
        Remove all expired entries.
        
        Returns:
            Number of expired entries removed
        """
        with self._lock:
            expired_keys = []
            current_time = time()
            
            for key, entry in self._cache.items():
                if self._is_expired(entry, current_time):
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
            
            if expired_keys:
                logger.debug(f"⏰ Cleaned up {len(expired_keys)} expired entries")
            
            return len(expired_keys)
    
    def _is_expired(self, entry: CacheEntry, current_time: Optional[float] = None) -> bool:
        """Check if cache entry is expired."""
        if self.ttl_seconds is None:
            return False
        
        check_time = current_time or time()
        return (check_time - entry.created_at) > self.ttl_seconds
    
    def _evict_if_needed(self) -> None:
        """Evict oldest entries if cache is over capacity."""
        while len(self._cache) > self.max_size:
            # Pop oldest item (LRU)
            oldest_key, oldest_entry = self._cache.popitem(last=False)
            self._evictions += 1
            logger.debug(f"🗑️ Evicted cache entry: {oldest_key}")


class CacheManagerFactory:
    """Factory for creating cache managers with different strategies."""
    
    @staticmethod
    def create_lru_cache(max_size: int = 1000, ttl_seconds: Optional[int] = None) -> LRUCacheManager:
        """Create LRU cache manager."""
        return LRUCacheManager(max_size=max_size, ttl_seconds=ttl_seconds)
    
    @staticmethod
    def create_character_cache() -> LRUCacheManager:
        """Create cache optimized for character instances."""
        return LRUCacheManager(max_size=500, ttl_seconds=3600)  # 1 hour TTL
    
    @staticmethod
    def create_object_cache() -> LRUCacheManager:
        """Create cache optimized for object instances."""
        return LRUCacheManager(max_size=200, ttl_seconds=1800)  # 30 min TTL
    
    @staticmethod
    def create_environment_cache() -> LRUCacheManager:
        """Create cache optimized for environment instances."""
        return LRUCacheManager(max_size=50, ttl_seconds=7200)  # 2 hour TTL
