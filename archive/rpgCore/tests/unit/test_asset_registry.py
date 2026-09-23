"""
Unit tests for AssetRegistry (Phase E Track B - Day 1).

Tests verify:
- Asset registration and retrieval
- Type and tag indexing
- Dependency tracking
- Registry validation
- Statistics generation
"""

import pytest
from src.game_engine.foundation.asset_system.asset_registry import (
    AssetRegistry,
    AssetType,
    Asset,
)


class TestAssetRegistration:
    """Test basic asset registration."""

    def test_register_asset_creates_entry(self):
        """Registering an asset should store it."""
        registry = AssetRegistry()
        asset = registry.register(
            asset_id="test_sprite",
            asset_type=AssetType.SPRITE,
            data={"width": 32, "height": 32},
            tags=["animation", "player"]
        )

        assert asset is not None
        assert asset.id == "test_sprite"
        assert asset.asset_type == AssetType.SPRITE
        assert "animation" in asset.tags

    def test_register_duplicate_raises_error(self):
        """Registering duplicate asset ID should raise ValueError."""
        registry = AssetRegistry()
        registry.register("asset_1", AssetType.SPRITE, {})

        with pytest.raises(ValueError):
            registry.register("asset_1", AssetType.SPRITE, {})

    def test_get_returns_asset(self):
        """Getting a registered asset should return it."""
        registry = AssetRegistry()
        registry.register("sprite_1", AssetType.SPRITE, {"data": "value"})

        asset = registry.get("sprite_1")
        assert asset is not None
        assert asset.id == "sprite_1"
        assert asset.data == {"data": "value"}

    def test_get_nonexistent_returns_none(self):
        """Getting non-existent asset should return None."""
        registry = AssetRegistry()
        assert registry.get("nonexistent") is None

    def test_get_or_raise_returns_asset(self):
        """get_or_raise should return asset if exists."""
        registry = AssetRegistry()
        registry.register("sprite_1", AssetType.SPRITE, {})

        asset = registry.get_or_raise("sprite_1")
        assert asset.id == "sprite_1"

    def test_get_or_raise_throws_if_missing(self):
        """get_or_raise should throw KeyError if asset missing."""
        registry = AssetRegistry()

        with pytest.raises(KeyError):
            registry.get_or_raise("nonexistent")


class TestTypeIndexing:
    """Test filtering by asset type."""

    def test_list_by_type_returns_matching(self):
        """list_by_type should return only assets of that type."""
        registry = AssetRegistry()
        registry.register("sprite_1", AssetType.SPRITE, {})
        registry.register("sprite_2", AssetType.SPRITE, {})
        registry.register("config_1", AssetType.CONFIG, {})

        sprites = registry.list_by_type(AssetType.SPRITE)
        assert len(sprites) == 2
        assert all(s.asset_type == AssetType.SPRITE for s in sprites)

    def test_count_by_type_is_accurate(self):
        """count_by_type should return correct count."""
        registry = AssetRegistry()
        registry.register("s1", AssetType.SPRITE, {})
        registry.register("s2", AssetType.SPRITE, {})
        registry.register("c1", AssetType.CONFIG, {})

        assert registry.count_by_type(AssetType.SPRITE) == 2
        assert registry.count_by_type(AssetType.CONFIG) == 1
        assert registry.count_by_type(AssetType.SHADER) == 0


class TestTagIndexing:
    """Test filtering by tags."""

    def test_list_by_tag_returns_matching(self):
        """list_by_tag should return assets with that tag."""
        registry = AssetRegistry()
        registry.register("a1", AssetType.SPRITE, {}, tags=["player", "animated"])
        registry.register("a2", AssetType.SPRITE, {}, tags=["enemy", "animated"])
        registry.register("a3", AssetType.SPRITE, {}, tags=["player"])

        animated = registry.list_by_tag("animated")
        assert len(animated) == 2

        player = registry.list_by_tag("player")
        assert len(player) == 2

    def test_has_tag_checks_membership(self):
        """Asset.has_tag should return correct boolean."""
        asset = Asset(
            id="test",
            asset_type=AssetType.SPRITE,
            data={},
            tags=["tag1", "tag2"]
        )

        assert asset.has_tag("tag1")
        assert asset.has_tag("tag2")
        assert not asset.has_tag("tag3")

    def test_add_tag_works(self):
        """Asset.add_tag should add new tag."""
        asset = Asset(id="test", asset_type=AssetType.SPRITE, data={})
        assert len(asset.tags) == 0

        asset.add_tag("new_tag")
        assert asset.has_tag("new_tag")
        assert len(asset.tags) == 1


class TestDependencies:
    """Test dependency tracking."""

    def test_dependencies_tracked(self):
        """Dependencies should be tracked in registry."""
        registry = AssetRegistry()
        registry.register("base", AssetType.CONFIG, {})
        registry.register(
            "derived",
            AssetType.CONFIG,
            {},
            dependencies=["base"]
        )

        # Both should be registered
        assert registry.get("base") is not None
        assert registry.get("derived") is not None

    def test_validate_catches_broken_dependency(self):
        """Validation should find broken dependencies."""
        registry = AssetRegistry()
        registry.register(
            "orphan",
            AssetType.CONFIG,
            {},
            dependencies=["missing_asset"]
        )

        errors = registry.validate()
        assert len(errors) > 0
        assert "missing_asset" in str(errors)


class TestUnregister:
    """Test asset removal."""

    def test_unregister_removes_asset(self):
        """Unregistering should remove asset."""
        registry = AssetRegistry()
        registry.register("sprite_1", AssetType.SPRITE, {})

        assert registry.get("sprite_1") is not None
        result = registry.unregister("sprite_1")
        assert result is True
        assert registry.get("sprite_1") is None

    def test_unregister_nonexistent_returns_false(self):
        """Unregistering non-existent asset should return False."""
        registry = AssetRegistry()
        result = registry.unregister("nonexistent")
        assert result is False

    def test_unregister_cleans_indices(self):
        """Unregistering should clean up indices."""
        registry = AssetRegistry()
        registry.register("s1", AssetType.SPRITE, {}, tags=["tag1"])

        registry.unregister("s1")

        # Type index should be clean
        assert registry.count_by_type(AssetType.SPRITE) == 0
        # Tag index should be clean
        assert len(registry.list_by_tag("tag1")) == 0


class TestClear:
    """Test bulk clearing."""

    def test_clear_empties_registry(self):
        """Clearing should remove all assets."""
        registry = AssetRegistry()
        registry.register("a1", AssetType.SPRITE, {})
        registry.register("a2", AssetType.CONFIG, {})
        assert len(registry) == 2

        registry.clear()
        assert len(registry) == 0


class TestStatistics:
    """Test statistics generation."""

    def test_get_stats_returns_dict(self):
        """get_stats should return statistics dictionary."""
        registry = AssetRegistry()
        registry.register("s1", AssetType.SPRITE, {})
        registry.register("c1", AssetType.CONFIG, {})

        stats = registry.get_stats()
        assert stats["total_assets"] == 2
        assert stats["by_type"]["sprite"] == 1
        assert stats["by_type"]["config"] == 1


class TestIteration:
    """Test registry iteration."""

    def test_list_all_returns_all_assets(self):
        """list_all should return all assets."""
        registry = AssetRegistry()
        registry.register("a1", AssetType.SPRITE, {})
        registry.register("a2", AssetType.CONFIG, {})
        registry.register("a3", AssetType.SOUND, {})

        all_assets = registry.list_all()
        assert len(all_assets) == 3

    def test_iteration_works(self):
        """Registry should be iterable."""
        registry = AssetRegistry()
        registry.register("a1", AssetType.SPRITE, {})
        registry.register("a2", AssetType.CONFIG, {})

        count = 0
        for asset in registry:
            count += 1
        assert count == 2

    def test_contains_operator_works(self):
        """'in' operator should work."""
        registry = AssetRegistry()
        registry.register("exists", AssetType.SPRITE, {})

        assert "exists" in registry
        assert "missing" not in registry

    def test_len_operator_works(self):
        """len() should return asset count."""
        registry = AssetRegistry()
        registry.register("a1", AssetType.SPRITE, {})
        registry.register("a2", AssetType.SPRITE, {})

        assert len(registry) == 2


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_empty_registry_operations(self):
        """Operations on empty registry should be safe."""
        registry = AssetRegistry()

        assert len(registry) == 0
        assert registry.list_all() == []
        assert registry.list_by_type(AssetType.SPRITE) == []
        assert registry.validate() == []

    def test_metadata_preserved(self):
        """Metadata should be preserved through registration."""
        registry = AssetRegistry()
        metadata = {"version": 1, "author": "test"}
        registry.register(
            "test_asset",
            AssetType.CONFIG,
            {},
            metadata=metadata
        )

        asset = registry.get("test_asset")
        assert asset.metadata == metadata

    def test_repr_works(self):
        """String representations should be meaningful."""
        registry = AssetRegistry()
        registry.register("sprite_1", AssetType.SPRITE, {})

        repr_str = repr(registry)
        assert "AssetRegistry" in repr_str
        assert "1" in repr_str  # Count of 1 asset
