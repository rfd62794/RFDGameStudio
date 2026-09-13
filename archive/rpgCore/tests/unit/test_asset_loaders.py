"""
Unit tests for Asset Loaders (Phase E - Step 1).

Tests verify:
- AbstractAssetLoader interface compliance
- ConfigAssetLoader (YAML/JSON loading, validation)
- EntityTemplateLoader (single/multi template, validation)
- SpriteAssetLoader (image loading with/without Pillow)
- CustomAssetLoader (extension registration, loading)
- AssetLoaderRegistry (loader routing)
"""

import pytest
import json
import tempfile
import os
from pathlib import Path

from src.game_engine.foundation.asset_system.asset_loaders import (
    AbstractAssetLoader,
    ConfigAssetLoader,
    EntityTemplateLoader,
    SpriteAssetLoader,
    CustomAssetLoader,
    AssetLoaderRegistry,
)
from src.game_engine.foundation.asset_system.asset_registry import AssetType


@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def config_yaml_file(temp_dir):
    """Create a sample YAML config file."""
    path = os.path.join(temp_dir, "game.yaml")
    import yaml
    data = {
        "game_name": "Test Game",
        "version": "1.0.0",
        "physics": {"gravity": 9.8, "friction": 0.1},
    }
    with open(path, 'w') as f:
        yaml.dump(data, f)
    return path


@pytest.fixture
def config_json_file(temp_dir):
    """Create a sample JSON config file."""
    path = os.path.join(temp_dir, "settings.json")
    data = {"display": {"width": 800, "height": 600}, "fullscreen": False}
    with open(path, 'w') as f:
        json.dump(data, f)
    return path


@pytest.fixture
def single_template_yaml(temp_dir):
    """Create a YAML file with a single entity template."""
    path = os.path.join(temp_dir, "asteroid.yaml")
    import yaml
    data = {
        "template_id": "asteroid_large",
        "entity_type": "asteroid",
        "display_name": "Large Asteroid",
        "radius": 20.0,
        "health": 50,
    }
    with open(path, 'w') as f:
        yaml.dump(data, f)
    return path


@pytest.fixture
def multi_template_yaml(temp_dir):
    """Create a YAML file with multiple entity templates."""
    path = os.path.join(temp_dir, "space_entities.yaml")
    import yaml
    data = {
        "templates": [
            {
                "template_id": "asteroid_large",
                "entity_type": "asteroid",
                "display_name": "Large Asteroid",
                "radius": 20.0,
            },
            {
                "template_id": "asteroid_small",
                "entity_type": "asteroid",
                "display_name": "Small Asteroid",
                "radius": 5.0,
            },
        ]
    }
    with open(path, 'w') as f:
        yaml.dump(data, f)
    return path


@pytest.fixture
def template_json_file(temp_dir):
    """Create a JSON file with entity templates."""
    path = os.path.join(temp_dir, "templates.json")
    data = {
        "templates": [
            {
                "template_id": "ship_player",
                "entity_type": "ship",
                "display_name": "Player Ship",
            }
        ]
    }
    with open(path, 'w') as f:
        json.dump(data, f)
    return path


# --- ConfigAssetLoader Tests ---

class TestConfigAssetLoader:
    """Tests for ConfigAssetLoader."""

    def test_load_yaml_config(self, config_yaml_file):
        """Loading a valid YAML config should succeed."""
        loader = ConfigAssetLoader()
        result = loader.load(config_yaml_file)

        assert result.success
        asset = result.value
        assert asset.asset_type == AssetType.CONFIG
        assert asset.data["game_name"] == "Test Game"
        assert asset.data["physics"]["gravity"] == 9.8

    def test_load_json_config(self, config_json_file):
        """Loading a valid JSON config should succeed."""
        loader = ConfigAssetLoader()
        result = loader.load(config_json_file)

        assert result.success
        asset = result.value
        assert asset.data["display"]["width"] == 800

    def test_load_with_custom_id(self, config_yaml_file):
        """Custom asset ID should override filename-based ID."""
        loader = ConfigAssetLoader()
        result = loader.load(config_yaml_file, asset_id="my_config")

        assert result.success
        assert result.value.id == "my_config"

    def test_load_with_tags(self, config_yaml_file):
        """Tags should be attached to the loaded asset."""
        loader = ConfigAssetLoader()
        result = loader.load(config_yaml_file, tags=["core", "game"])

        assert result.success
        assert "core" in result.value.tags
        assert "game" in result.value.tags

    def test_load_missing_file(self):
        """Loading a non-existent file should fail."""
        loader = ConfigAssetLoader()
        result = loader.load("/nonexistent/path/config.yaml")

        assert not result.success
        assert "not found" in result.error.lower()

    def test_load_unsupported_extension(self, temp_dir):
        """Loading a file with wrong extension should fail."""
        path = os.path.join(temp_dir, "config.txt")
        with open(path, 'w') as f:
            f.write("not a config")

        loader = ConfigAssetLoader()
        result = loader.load(path)

        assert not result.success
        assert "Unsupported file type" in result.error

    def test_load_invalid_yaml(self, temp_dir):
        """Loading malformed YAML should fail."""
        path = os.path.join(temp_dir, "bad.yaml")
        with open(path, 'w') as f:
            f.write("{{invalid: yaml: [}")

        loader = ConfigAssetLoader()
        result = loader.load(path)

        assert not result.success
        assert "error" in result.error.lower() or "parse" in result.error.lower()

    def test_load_non_dict_yaml(self, temp_dir):
        """Config file containing a list instead of dict should fail."""
        path = os.path.join(temp_dir, "list.yaml")
        import yaml
        with open(path, 'w') as f:
            yaml.dump([1, 2, 3], f)

        loader = ConfigAssetLoader()
        result = loader.load(path)

        assert not result.success
        assert "dictionary" in result.error.lower()

    def test_supports_config_type(self):
        """ConfigAssetLoader should support CONFIG type only."""
        loader = ConfigAssetLoader()
        assert loader.supports_type(AssetType.CONFIG)
        assert not loader.supports_type(AssetType.SPRITE)

    def test_default_asset_id_from_filename(self, config_yaml_file):
        """Default asset ID should be derived from filename stem."""
        loader = ConfigAssetLoader()
        result = loader.load(config_yaml_file)

        assert result.success
        assert result.value.id == "game"


# --- EntityTemplateLoader Tests ---

class TestEntityTemplateLoader:
    """Tests for EntityTemplateLoader."""

    def test_load_single_template(self, single_template_yaml):
        """Loading a single template YAML should succeed."""
        loader = EntityTemplateLoader()
        result = loader.load(single_template_yaml)

        assert result.success
        asset = result.value
        assert asset.asset_type == AssetType.ENTITY_TEMPLATE
        assert len(asset.data) == 1
        assert asset.data[0]["template_id"] == "asteroid_large"

    def test_load_multi_template(self, multi_template_yaml):
        """Loading multiple templates should return all templates."""
        loader = EntityTemplateLoader()
        result = loader.load(multi_template_yaml)

        assert result.success
        assert len(result.value.data) == 2
        ids = [t["template_id"] for t in result.value.data]
        assert "asteroid_large" in ids
        assert "asteroid_small" in ids

    def test_load_template_json(self, template_json_file):
        """Loading templates from JSON should succeed."""
        loader = EntityTemplateLoader()
        result = loader.load(template_json_file)

        assert result.success
        assert result.value.data[0]["template_id"] == "ship_player"

    def test_load_missing_template_id(self, temp_dir):
        """Template without template_id should fail validation."""
        path = os.path.join(temp_dir, "bad_template.yaml")
        import yaml
        with open(path, 'w') as f:
            yaml.dump({"entity_type": "asteroid"}, f)

        loader = EntityTemplateLoader()
        result = loader.load(path)

        assert not result.success
        assert "template_id" in result.error.lower()

    def test_load_missing_entity_type(self, temp_dir):
        """Template without entity_type should fail validation."""
        path = os.path.join(temp_dir, "bad_template.yaml")
        import yaml
        with open(path, 'w') as f:
            yaml.dump({"template_id": "test"}, f)

        loader = EntityTemplateLoader()
        result = loader.load(path)

        assert not result.success
        assert "entity_type" in result.error.lower()

    def test_load_empty_file(self, temp_dir):
        """Loading an empty YAML file should fail."""
        path = os.path.join(temp_dir, "empty.yaml")
        with open(path, 'w') as f:
            f.write("")

        loader = EntityTemplateLoader()
        result = loader.load(path)

        assert not result.success
        assert "empty" in result.error.lower()

    def test_template_count_in_metadata(self, multi_template_yaml):
        """Metadata should include template count."""
        loader = EntityTemplateLoader()
        result = loader.load(multi_template_yaml)

        assert result.success
        assert result.value.metadata["count"] == 2

    def test_supports_entity_template_type(self):
        """EntityTemplateLoader should support ENTITY_TEMPLATE type only."""
        loader = EntityTemplateLoader()
        assert loader.supports_type(AssetType.ENTITY_TEMPLATE)
        assert not loader.supports_type(AssetType.CONFIG)


# --- SpriteAssetLoader Tests ---

class TestSpriteAssetLoader:
    """Tests for SpriteAssetLoader."""

    def test_load_png_sprite(self, temp_dir):
        """Loading a PNG sprite should succeed."""
        # Create a minimal 1x1 PNG
        path = os.path.join(temp_dir, "test.png")
        try:
            from PIL import Image
            img = Image.new('RGBA', (32, 32), (255, 0, 0, 255))
            img.save(path)
        except ImportError:
            pytest.skip("Pillow not installed")

        loader = SpriteAssetLoader()
        result = loader.load(path)

        assert result.success
        asset = result.value
        assert asset.asset_type == AssetType.SPRITE
        assert asset.data["width"] == 32
        assert asset.data["height"] == 32

    def test_load_missing_sprite(self):
        """Loading a non-existent sprite should fail."""
        loader = SpriteAssetLoader()
        result = loader.load("/nonexistent/sprite.png")

        assert not result.success
        assert "not found" in result.error.lower()

    def test_load_unsupported_format(self, temp_dir):
        """Loading a file with wrong extension should fail."""
        path = os.path.join(temp_dir, "data.txt")
        with open(path, 'w') as f:
            f.write("not an image")

        loader = SpriteAssetLoader()
        result = loader.load(path)

        assert not result.success
        assert "Unsupported file type" in result.error

    def test_supports_sprite_type(self):
        """SpriteAssetLoader should support SPRITE type only."""
        loader = SpriteAssetLoader()
        assert loader.supports_type(AssetType.SPRITE)
        assert not loader.supports_type(AssetType.CONFIG)


# --- CustomAssetLoader Tests ---

class TestCustomAssetLoader:
    """Tests for CustomAssetLoader."""

    def test_register_and_load(self, temp_dir):
        """Registered custom loader should load files."""
        path = os.path.join(temp_dir, "data.dat")
        with open(path, 'w') as f:
            f.write("custom data content")

        loader = CustomAssetLoader()
        loader.register_loader('.dat', lambda p: {"content": open(p).read()})

        result = loader.load(path)

        assert result.success
        assert result.value.asset_type == AssetType.CUSTOM
        assert result.value.data["content"] == "custom data content"

    def test_load_unregistered_extension(self, temp_dir):
        """Loading file with unregistered extension should fail."""
        path = os.path.join(temp_dir, "data.xyz")
        with open(path, 'w') as f:
            f.write("some data")

        loader = CustomAssetLoader()
        result = loader.load(path)

        assert not result.success
        assert "No custom loader registered" in result.error

    def test_registered_extensions_property(self):
        """registered_extensions should list registered extensions."""
        loader = CustomAssetLoader()
        loader.register_loader('.dat', lambda p: {})
        loader.register_loader('.bin', lambda p: {})

        assert '.dat' in loader.registered_extensions
        assert '.bin' in loader.registered_extensions

    def test_custom_loader_error_handling(self, temp_dir):
        """Custom loader that raises should return error result."""
        path = os.path.join(temp_dir, "data.err")
        with open(path, 'w') as f:
            f.write("data")

        loader = CustomAssetLoader()
        loader.register_loader('.err', lambda p: (_ for _ in ()).throw(ValueError("test error")))

        result = loader.load(path)

        assert not result.success
        assert "Custom loader failed" in result.error

    def test_supports_custom_type(self):
        """CustomAssetLoader should support CUSTOM type only."""
        loader = CustomAssetLoader()
        assert loader.supports_type(AssetType.CUSTOM)
        assert not loader.supports_type(AssetType.SPRITE)


# --- AssetLoaderRegistry Tests ---

class TestAssetLoaderRegistry:
    """Tests for AssetLoaderRegistry."""

    def test_create_default_has_all_loaders(self):
        """Default registry should have config, template, sprite, custom loaders."""
        registry = AssetLoaderRegistry.create_default()

        assert registry.get_loader(AssetType.CONFIG) is not None
        assert registry.get_loader(AssetType.ENTITY_TEMPLATE) is not None
        assert registry.get_loader(AssetType.SPRITE) is not None
        assert registry.get_loader(AssetType.CUSTOM) is not None

    def test_load_through_registry(self, config_yaml_file):
        """Loading through registry should delegate to correct loader."""
        registry = AssetLoaderRegistry.create_default()
        result = registry.load(AssetType.CONFIG, config_yaml_file)

        assert result.success
        assert result.value.asset_type == AssetType.CONFIG

    def test_load_unregistered_type(self):
        """Loading unregistered type should fail."""
        registry = AssetLoaderRegistry()
        result = registry.load(AssetType.SOUND, "/some/path.wav")

        assert not result.success
        assert "No loader registered" in result.error

    def test_get_loader_returns_none_for_missing(self):
        """Getting loader for unregistered type should return None."""
        registry = AssetLoaderRegistry()
        assert registry.get_loader(AssetType.SOUND) is None
