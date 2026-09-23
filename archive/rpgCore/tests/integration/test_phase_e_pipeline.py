"""
Integration tests for Phase E pipeline (Assets -> Templates -> Spawning).

Tests the NEW Phase E components end-to-end:
- Asset loaders loading from real YAML config files
- Asset cache performance in realistic scenarios
- Template loading -> registration -> spawning via EntityManager
- Factory -> registry -> batch spawn pipeline
- Error handling across component boundaries
"""

import pytest
import os

from game_engine.foundation.asset_system.asset_registry import AssetRegistry, AssetType
from game_engine.foundation.asset_system.asset_loaders import (
    ConfigAssetLoader, EntityTemplateLoader, AssetLoaderRegistry
)
from game_engine.foundation.asset_system.asset_cache import AssetCache
from game_engine.foundation.asset_system.entity_templates import (
    EntityTemplate, EntityTemplateRegistry
)
from game_engine.systems.body.entity_manager import EntityManager, Entity
from game_engine.systems.body.entity_factories import (
    create_asteroid, create_player_ship, create_enemy_fighter, create_projectile
)
from game_engine.foundation import SystemConfig


# Path to assets directory
ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'assets')
CONFIGS_DIR = os.path.join(ASSETS_DIR, 'configs')
ENTITIES_DIR = os.path.join(ASSETS_DIR, 'entities')


class TestConfigLoadingPipeline:
    """Test loading config files through the full pipeline."""

    def test_load_game_config(self):
        """Load game.yaml through ConfigAssetLoader."""
        loader = ConfigAssetLoader()
        path = os.path.join(CONFIGS_DIR, 'game.yaml')
        result = loader.load(path, asset_id="game_config")

        assert result.success, f"Failed to load game.yaml: {result.error}"
        asset = result.value
        assert asset.asset_type == AssetType.CONFIG
        assert asset.data["game"]["name"] == "DGT Platform Demo"
        assert asset.data["display"]["width"] == 160

    def test_load_physics_config(self):
        """Load physics.yaml through ConfigAssetLoader."""
        loader = ConfigAssetLoader()
        path = os.path.join(CONFIGS_DIR, 'physics.yaml')
        result = loader.load(path, asset_id="physics_config")

        assert result.success
        assert result.value.data["physics"]["friction"] == 0.02

    def test_load_graphics_config(self):
        """Load graphics.yaml through ConfigAssetLoader."""
        loader = ConfigAssetLoader()
        path = os.path.join(CONFIGS_DIR, 'graphics.yaml')
        result = loader.load(path, asset_id="graphics_config")

        assert result.success
        assert result.value.data["renderer"]["width"] == 160

    def test_register_configs_in_asset_registry(self):
        """All loaded configs should register in AssetRegistry."""
        registry = AssetRegistry()
        loader = ConfigAssetLoader()

        for filename in ('game.yaml', 'physics.yaml', 'graphics.yaml'):
            path = os.path.join(CONFIGS_DIR, filename)
            result = loader.load(path)
            assert result.success
            registry.register(
                asset_id=result.value.id,
                asset_type=AssetType.CONFIG,
                data=result.value.data,
                tags=["config"]
            )

        assert registry.count() == 3
        assert registry.count_by_type(AssetType.CONFIG) == 3


class TestTemplateLoadingPipeline:
    """Test loading entity templates through the full pipeline."""

    def test_load_space_entities(self):
        """Load space_entities.yaml through EntityTemplateLoader."""
        loader = EntityTemplateLoader()
        path = os.path.join(ENTITIES_DIR, 'space_entities.yaml')
        result = loader.load(path)

        assert result.success, f"Failed to load space_entities.yaml: {result.error}"
        templates = result.value.data
        assert len(templates) == 6

        ids = [t["template_id"] for t in templates]
        assert "asteroid_large" in ids
        assert "player_ship" in ids
        assert "projectile_bullet" in ids

    def test_load_and_register_templates(self):
        """Load templates from YAML, create EntityTemplate objects, register them."""
        loader = EntityTemplateLoader()
        path = os.path.join(ENTITIES_DIR, 'space_entities.yaml')
        result = loader.load(path)
        assert result.success

        template_registry = EntityTemplateRegistry()
        for tmpl_data in result.value.data:
            template = EntityTemplate.from_dict(tmpl_data)
            errors = template.validate()
            assert errors == [], f"Template {tmpl_data['template_id']} invalid: {errors}"
            template_registry.register(template)

        assert template_registry.count() == 6
        assert template_registry.get("asteroid_large") is not None
        assert template_registry.get("player_ship") is not None

    def test_full_spawn_pipeline(self):
        """Load YAML -> register templates -> spawn entities via EntityManager."""
        # Load templates from YAML
        loader = EntityTemplateLoader()
        path = os.path.join(ENTITIES_DIR, 'space_entities.yaml')
        result = loader.load(path)
        assert result.success

        # Register in template registry
        template_registry = EntityTemplateRegistry()
        for tmpl_data in result.value.data:
            template = EntityTemplate.from_dict(tmpl_data)
            template_registry.register(template)

        # Wire up EntityManager
        manager = EntityManager(SystemConfig(name="IntegrationTest"))
        manager.initialize()
        manager.set_template_registry(template_registry)

        # Spawn entities from templates
        asteroid_result = manager.spawn_from_template("asteroid_large")
        ship_result = manager.spawn_from_template("player_ship")
        bullet_result = manager.spawn_from_template("projectile_bullet")

        assert asteroid_result.success
        assert ship_result.success
        assert bullet_result.success

        # Verify entities are tracked
        assert len(manager.get_all_active_entities()) == 3


class TestCachePerformance:
    """Test cache behavior in realistic scenarios."""

    def test_cache_hit_rate_on_repeated_access(self):
        """Repeated cache access should yield high hit rate."""
        cache = AssetCache(max_size=100)
        loader = ConfigAssetLoader()

        # Load and cache configs
        for filename in ('game.yaml', 'physics.yaml', 'graphics.yaml'):
            path = os.path.join(CONFIGS_DIR, filename)
            result = loader.load(path)
            assert result.success
            cache.put(result.value.id, result.value)

        # Access each 10 times
        for _ in range(10):
            for name in ('game', 'physics', 'graphics'):
                asset = cache.get(name)
                assert asset is not None

        assert cache.hit_rate > 95.0

    def test_cache_eviction_under_pressure(self):
        """Cache should evict LRU items when full."""
        cache = AssetCache(max_size=3)

        from game_engine.foundation.asset_system.asset_registry import Asset
        for i in range(5):
            asset = Asset(id=f"asset_{i}", asset_type=AssetType.CONFIG, data={})
            cache.put(f"asset_{i}", asset)

        # Only last 3 should remain
        assert cache.size == 3
        assert cache.get("asset_0") is None
        assert cache.get("asset_1") is None
        assert cache.get("asset_4") is not None


class TestBatchOperations:
    """Test batch spawning and operations."""

    def test_batch_spawn_from_yaml_templates(self):
        """Batch spawn 50 entities from loaded templates."""
        loader = EntityTemplateLoader()
        path = os.path.join(ENTITIES_DIR, 'space_entities.yaml')
        result = loader.load(path)
        assert result.success

        template_registry = EntityTemplateRegistry()
        for tmpl_data in result.value.data:
            template = EntityTemplate.from_dict(tmpl_data)
            template_registry.register(template)

        manager = EntityManager(SystemConfig(name="BatchTest"))
        manager.initialize()
        manager.set_template_registry(template_registry)

        # Batch spawn 50 asteroids
        entities = manager.batch_spawn_from_template("asteroid_large", count=50)
        assert len(entities) == 50

        # All should be tracked
        assert len(manager.get_all_active_entities()) == 50

        # All should have unique IDs
        ids = [e.id for e in entities]
        assert len(set(ids)) == 50

    def test_batch_spawn_from_factories(self):
        """Batch spawn using factory-created templates."""
        template_registry = EntityTemplateRegistry()
        template_registry.register(create_asteroid("large"))
        template_registry.register(create_asteroid("small"))
        template_registry.register(create_player_ship())

        manager = EntityManager(SystemConfig(name="FactoryBatchTest"))
        manager.initialize()
        manager.set_template_registry(template_registry)

        large = manager.batch_spawn_from_template("asteroid_large", count=10)
        small = manager.batch_spawn_from_template("asteroid_small", count=20)
        ships = manager.batch_spawn_from_template("player_ship", count=5)

        assert len(large) == 10
        assert len(small) == 20
        assert len(ships) == 5
        assert len(manager.get_all_active_entities()) == 35


class TestErrorHandling:
    """Test error propagation through the pipeline."""

    def test_missing_config_file(self):
        """Loading non-existent config should return failure."""
        loader = ConfigAssetLoader()
        result = loader.load(os.path.join(CONFIGS_DIR, 'nonexistent.yaml'))

        assert not result.success
        assert "not found" in result.error.lower()

    def test_missing_template_spawn(self):
        """Spawning from non-existent template should fail gracefully."""
        template_registry = EntityTemplateRegistry()
        manager = EntityManager(SystemConfig(name="ErrorTest"))
        manager.initialize()
        manager.set_template_registry(template_registry)

        result = manager.spawn_from_template("nonexistent")
        assert not result.success
        assert "not found" in result.error.lower()

    def test_loader_registry_missing_type(self):
        """Loading unregistered asset type should fail."""
        registry = AssetLoaderRegistry()
        result = registry.load(AssetType.SOUND, "/some/file.wav")

        assert not result.success
        assert "No loader registered" in result.error
