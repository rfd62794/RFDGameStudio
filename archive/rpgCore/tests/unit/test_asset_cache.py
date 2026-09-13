"""
Unit tests for AssetCache (Phase E - Step 2).

Tests verify:
- Basic get/put operations
- LRU eviction behavior
- Cache hit/miss tracking
- TTL expiration
- Invalidation and clearing
- Statistics reporting
"""

import pytest
import time
from unittest.mock import patch

from src.game_engine.foundation.asset_system.asset_cache import AssetCache
from src.game_engine.foundation.asset_system.asset_registry import Asset, AssetType


def _make_asset(asset_id: str, asset_type: AssetType = AssetType.SPRITE) -> Asset:
    """Helper to create test assets."""
    return Asset(id=asset_id, asset_type=asset_type, data={"test": True})


class TestCacheBasicOperations:
    """Test basic get/put/invalidate/clear."""

    def test_put_and_get(self):
        """Putting and getting an asset should work."""
        cache = AssetCache(max_size=10)
        asset = _make_asset("sprite_1")
        cache.put("sprite_1", asset)

        result = cache.get("sprite_1")
        assert result is not None
        assert result.id == "sprite_1"

    def test_get_missing_returns_none(self):
        """Getting a non-existent asset should return None."""
        cache = AssetCache(max_size=10)
        assert cache.get("nonexistent") is None

    def test_put_overwrites_existing(self):
        """Putting with same ID should overwrite."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))

        new_asset = Asset(id="a", asset_type=AssetType.CONFIG, data={"updated": True})
        cache.put("a", new_asset)

        result = cache.get("a")
        assert result.data == {"updated": True}
        assert cache.size == 1

    def test_invalidate_removes_entry(self):
        """Invalidating should remove from cache."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))

        assert cache.invalidate("a")
        assert cache.get("a") is None

    def test_invalidate_nonexistent_returns_false(self):
        """Invalidating non-existent asset returns False."""
        cache = AssetCache(max_size=10)
        assert not cache.invalidate("nonexistent")

    def test_clear_removes_all(self):
        """Clearing should remove all entries."""
        cache = AssetCache(max_size=10)
        for i in range(5):
            cache.put(f"asset_{i}", _make_asset(f"asset_{i}"))

        cache.clear()
        assert cache.size == 0
        assert cache.get("asset_0") is None

    def test_contains(self):
        """Contains should check existence without affecting LRU order."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))

        assert cache.contains("a")
        assert not cache.contains("b")

    def test_size_property(self):
        """Size should reflect current cache entries."""
        cache = AssetCache(max_size=10)
        assert cache.size == 0

        cache.put("a", _make_asset("a"))
        assert cache.size == 1

        cache.put("b", _make_asset("b"))
        assert cache.size == 2


class TestLRUEviction:
    """Test LRU eviction behavior."""

    def test_evicts_when_full(self):
        """Cache should evict LRU when at max capacity."""
        cache = AssetCache(max_size=3)
        cache.put("a", _make_asset("a"))
        cache.put("b", _make_asset("b"))
        cache.put("c", _make_asset("c"))

        # Adding 4th should evict 'a' (least recently used)
        cache.put("d", _make_asset("d"))

        assert cache.size == 3
        assert cache.get("a") is None  # evicted
        assert cache.get("b") is not None
        assert cache.get("d") is not None

    def test_access_prevents_eviction(self):
        """Accessing an item should move it to MRU, preventing eviction."""
        cache = AssetCache(max_size=3)
        cache.put("a", _make_asset("a"))
        cache.put("b", _make_asset("b"))
        cache.put("c", _make_asset("c"))

        # Access 'a' to make it MRU
        cache.get("a")

        # Adding 'd' should now evict 'b' (the new LRU)
        cache.put("d", _make_asset("d"))

        assert cache.get("a") is not None  # saved by access
        assert cache.get("b") is None      # evicted
        assert cache.get("d") is not None

    def test_eviction_count_tracked(self):
        """Eviction counter should increment on each eviction."""
        cache = AssetCache(max_size=2)
        cache.put("a", _make_asset("a"))
        cache.put("b", _make_asset("b"))
        cache.put("c", _make_asset("c"))  # evicts 'a'
        cache.put("d", _make_asset("d"))  # evicts 'b'

        stats = cache.get_stats()
        assert stats["evictions"] == 2

    def test_max_size_one(self):
        """Cache with max_size=1 should only hold one item."""
        cache = AssetCache(max_size=1)
        cache.put("a", _make_asset("a"))
        cache.put("b", _make_asset("b"))

        assert cache.size == 1
        assert cache.get("a") is None
        assert cache.get("b") is not None


class TestCacheStatistics:
    """Test hit/miss/stats tracking."""

    def test_hit_increments_on_found(self):
        """Cache hit counter should increment on successful get."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))
        cache.get("a")
        cache.get("a")

        stats = cache.get_stats()
        assert stats["hits"] == 2
        assert stats["misses"] == 0

    def test_miss_increments_on_not_found(self):
        """Cache miss counter should increment on failed get."""
        cache = AssetCache(max_size=10)
        cache.get("nonexistent")

        stats = cache.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 1

    def test_hit_rate_calculation(self):
        """Hit rate should be correctly calculated."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))

        cache.get("a")      # hit
        cache.get("a")      # hit
        cache.get("missing") # miss

        assert cache.hit_rate == pytest.approx(66.666, rel=0.01)

    def test_hit_rate_zero_when_empty(self):
        """Hit rate should be 0 when no accesses have been made."""
        cache = AssetCache(max_size=10)
        assert cache.hit_rate == 0.0

    def test_reset_stats(self):
        """Resetting stats should clear all counters."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))
        cache.get("a")
        cache.get("missing")

        cache.reset_stats()
        stats = cache.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 0
        assert stats["evictions"] == 0

    def test_stats_include_all_fields(self):
        """Stats should include size, max_size, hits, misses, evictions, hit_rate, ttl."""
        cache = AssetCache(max_size=100, ttl=60.0)
        stats = cache.get_stats()

        assert "size" in stats
        assert "max_size" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "evictions" in stats
        assert "hit_rate" in stats
        assert "ttl" in stats
        assert stats["max_size"] == 100
        assert stats["ttl"] == 60.0


class TestCacheTTL:
    """Test TTL (time-to-live) expiration."""

    def test_expired_entry_returns_none(self):
        """Expired entry should be treated as cache miss."""
        cache = AssetCache(max_size=10, ttl=1.0)
        asset = _make_asset("a")
        
        with patch("time.monotonic") as mock_time:
            mock_time.return_value = 0.0
            cache.put("a", asset)
            
            mock_time.return_value = 1.1  # past TTL
            result = cache.get("a")
        
        assert result is None

    def test_expired_entry_counted_as_miss(self):
        """Expired entry access should count as miss."""
        cache = AssetCache(max_size=10, ttl=1.0)
        cache.put("a", _make_asset("a"))

        with patch("time.monotonic") as mock_time:
            mock_time.return_value = 0.0
            cache.put("a", _make_asset("a"))
            
            mock_time.return_value = 1.1
            cache.get("a")

        stats = cache.get_stats()
        assert stats["misses"] == 1

    def test_no_ttl_never_expires(self):
        """Without TTL, entries should never expire."""
        cache = AssetCache(max_size=10, ttl=None)
        cache.put("a", _make_asset("a"))

        # No expiry check needed
        assert cache.get("a") is not None


class TestCacheEdgeCases:
    """Test edge cases and validation."""

    def test_invalid_max_size_raises(self):
        """max_size < 1 should raise ValueError."""
        with pytest.raises(ValueError):
            AssetCache(max_size=0)

    def test_dunder_len(self):
        """len() should return cache size."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))
        assert len(cache) == 1

    def test_dunder_contains(self):
        """'in' operator should check cache membership."""
        cache = AssetCache(max_size=10)
        cache.put("a", _make_asset("a"))
        assert "a" in cache
        assert "b" not in cache

    def test_repr(self):
        """repr should be informative."""
        cache = AssetCache(max_size=100)
        r = repr(cache)
        assert "AssetCache" in r
        assert "100" in r
