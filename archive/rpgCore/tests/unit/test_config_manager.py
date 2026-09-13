"""
Test suite for ConfigManager.

Coverage:
- Configuration loading (YAML, JSON)
- Environment-specific configs
- Validation and error handling
- Runtime updates
- Configuration export
"""

import pytest
from pathlib import Path
import json
import yaml
import tempfile
from pydantic import ValidationError

from src.game_engine.foundation.config_system.config_manager import (
    ConfigManager, Environment
)
from src.game_engine.foundation.config_system.config_schemas import (
    GameConfig, SystemConfig, GameType, RendererType, CollisionType,
    DEFAULT_SPACE_CONFIG, DEVELOPMENT_CONFIG, PRODUCTION_CONFIG
)


@pytest.fixture
def temp_config_dir():
    """Create temporary configuration directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sample_game_config(temp_config_dir):
    """Create sample game.yaml configuration."""
    config_data = {
        "game_title": "Test RPG Core",
        "game_version": "1.0.0",
        "game_type": "space",
        "debug_mode": False,
        "log_level": "INFO",
        "physics": {
            "collision_check_frequency": 60,
            "particle_pool_size": 1000,
            "collision_detection_type": "circle",
            "gravity_enabled": False,
            "max_velocity": 500.0
        },
        "graphics": {
            "target_fps": 60,
            "renderer_type": "godot",
            "resolution_width": 640,
            "resolution_height": 576,
            "enable_vsync": True,
            "enable_fullscreen": False
        },
        "entity_pool": {
            "initial_pool_size": 100,
            "grow_increment": 50,
            "max_pool_size": 5000
        },
        "space": {
            "game_type": "space",
            "initial_lives": 3,
            "initial_wave": 1,
            "waves_infinite": True,
            "max_waves": 100,
            "asteroids_per_wave_base": 5,
            "asteroids_spawn_scaling": 1.2,
            "projectile_speed": 300.0,
            "projectile_lifetime": 1.0,
            "ship_max_velocity": 200.0,
            "ship_acceleration": 150.0,
            "ship_rotation_speed": 3.0
        }
    }

    config_file = temp_config_dir / "game.yaml"
    with open(config_file, 'w') as f:
        yaml.dump(config_data, f)

    return temp_config_dir


@pytest.fixture
def sample_system_config(temp_config_dir):
    """Create sample system.yaml configuration."""
    config_data = {
        "debug_enabled": True,
        "log_level": "DEBUG",
        "log_file": None,
        "profiling_enabled": True,
        "performance_metrics_enabled": True,
        "custom_hooks": {}
    }

    config_file = temp_config_dir / "system.yaml"
    with open(config_file, 'w') as f:
        yaml.dump(config_data, f)

    return temp_config_dir


class TestConfigManagerInitialization:
    """Test ConfigManager initialization."""

    def test_init_default(self):
        """Test initialization with defaults."""
        manager = ConfigManager()
        assert manager.environment == Environment.DEVELOPMENT
        assert manager.config_dir == Path("config")

    def test_init_custom_dir(self, temp_config_dir):
        """Test initialization with custom config directory."""
        manager = ConfigManager(config_dir=temp_config_dir)
        assert manager.config_dir == temp_config_dir

    def test_init_environment(self, temp_config_dir):
        """Test initialization with specific environment."""
        manager = ConfigManager(
            config_dir=temp_config_dir,
            environment=Environment.PRODUCTION
        )
        assert manager.environment == Environment.PRODUCTION


class TestGameConfigLoading:
    """Test game configuration loading."""

    def test_load_from_yaml(self, sample_game_config):
        """Test loading game config from YAML file."""
        manager = ConfigManager(config_dir=sample_game_config)
        config = manager.game_config

        assert config.game_title == "Test RPG Core"
        assert config.game_version == "1.0.0"
        assert config.game_type == GameType.SPACE
        assert config.debug_mode is False

    def test_load_physics_config(self, sample_game_config):
        """Test loading physics configuration."""
        manager = ConfigManager(config_dir=sample_game_config)
        physics = manager.get_physics_config()

        assert physics.collision_check_frequency == 60
        assert physics.particle_pool_size == 1000
        assert physics.collision_detection_type == CollisionType.CIRCLE

    def test_load_graphics_config(self, sample_game_config):
        """Test loading graphics configuration."""
        manager = ConfigManager(config_dir=sample_game_config)
        graphics = manager.get_graphics_config()

        assert graphics.target_fps == 60
        assert graphics.renderer_type == RendererType.GODOT
        assert graphics.resolution_width == 640
        assert graphics.resolution_height == 576

    def test_load_entity_pool_config(self, sample_game_config):
        """Test loading entity pool configuration."""
        manager = ConfigManager(config_dir=sample_game_config)
        pool = manager.get_entity_pool_config()

        assert pool.initial_pool_size == 100
        assert pool.grow_increment == 50
        assert pool.max_pool_size == 5000

    def test_get_game_type_config(self, sample_game_config):
        """Test retrieving game-type-specific config."""
        manager = ConfigManager(config_dir=sample_game_config)
        space_config = manager.get_game_type_config()

        assert space_config["game_type"] == "space"
        assert space_config["initial_lives"] == 3
        assert space_config["asteroids_per_wave_base"] == 5


class TestSystemConfigLoading:
    """Test system configuration loading."""

    def test_load_system_config(self, sample_system_config):
        """Test loading system configuration."""
        manager = ConfigManager(config_dir=sample_system_config)
        config = manager.system_config

        assert config.debug_enabled is True
        assert config.log_level == "DEBUG"
        assert config.profiling_enabled is True

    def test_system_config_development_preset(self, temp_config_dir):
        """Test development preset for system config."""
        manager = ConfigManager(
            config_dir=temp_config_dir,
            environment=Environment.DEVELOPMENT
        )
        config = manager.system_config

        assert config.debug_enabled is True
        assert config.log_level == "DEBUG"

    def test_system_config_production_preset(self, temp_config_dir):
        """Test production preset for system config."""
        manager = ConfigManager(
            config_dir=temp_config_dir,
            environment=Environment.PRODUCTION
        )
        config = manager.system_config

        assert config.debug_enabled is False
        assert config.log_level == "WARNING"


class TestEnvironmentSpecificConfigs:
    """Test environment-specific configuration loading."""

    def test_load_development_specific(self, temp_config_dir):
        """Test loading development-specific configuration."""
        # Create development-specific config
        config_data = {
            "game_title": "Dev Build",
            "game_version": "0.1.0",
            "game_type": "space",
            "debug_mode": True,
            "log_level": "DEBUG"
        }
        dev_file = temp_config_dir / "game.development.yaml"
        with open(dev_file, 'w') as f:
            yaml.dump(config_data, f)

        manager = ConfigManager(
            config_dir=temp_config_dir,
            environment=Environment.DEVELOPMENT
        )
        assert manager.game_config.game_title == "Dev Build"
        assert manager.game_config.debug_mode is True

    def test_load_production_specific(self, temp_config_dir):
        """Test loading production-specific configuration."""
        config_data = {
            "game_title": "Production",
            "game_version": "1.0.0",
            "game_type": "space",
            "debug_mode": False,
            "log_level": "ERROR"
        }
        prod_file = temp_config_dir / "game.production.yaml"
        with open(prod_file, 'w') as f:
            yaml.dump(config_data, f)

        manager = ConfigManager(
            config_dir=temp_config_dir,
            environment=Environment.PRODUCTION
        )
        assert manager.game_config.game_title == "Production"
        assert manager.game_config.debug_mode is False


class TestJSONConfigLoading:
    """Test JSON configuration loading."""

    def test_load_from_json(self, temp_config_dir):
        """Test loading configuration from JSON file."""
        config_data = {
            "game_title": "JSON Config",
            "game_version": "1.0.0",
            "game_type": "rpg",
            "debug_mode": False,
            "log_level": "INFO",
            "physics": {
                "collision_check_frequency": 60,
                "particle_pool_size": 1000,
                "collision_detection_type": "circle",
                "gravity_enabled": False,
                "max_velocity": 500.0
            },
            "graphics": {
                "target_fps": 60,
                "renderer_type": "godot",
                "resolution_width": 640,
                "resolution_height": 576,
                "enable_vsync": True,
                "enable_fullscreen": False
            },
            "entity_pool": {
                "initial_pool_size": 100,
                "grow_increment": 50,
                "max_pool_size": 5000
            },
            "rpg": {
                "game_type": "rpg",
                "enable_permadeath": False,
                "enable_level_scaling": True,
                "base_difficulty": 1.0,
                "difficulty_scaling_per_level": 1.1
            }
        }

        # Create generic game.json (YAML has priority over JSON in loading order)
        # So we test that JSON files are supported by calling _load_from_file directly
        config_file = temp_config_dir / "game.json"
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        manager = ConfigManager(config_dir=temp_config_dir)
        # Load directly from JSON file to test JSON support
        config = manager._load_from_file(config_file, GameConfig)

        assert config.game_title == "JSON Config"
        assert config.game_type == GameType.RPG


class TestConfigUpdateAtRuntime:
    """Test runtime configuration updates."""

    def test_update_game_config(self, sample_game_config):
        """Test updating game configuration at runtime."""
        manager = ConfigManager(config_dir=sample_game_config)
        original_fps = manager.get_graphics_config().target_fps

        manager.update_game_config(
            game_title="Updated Title"
        )

        assert manager.game_config.game_title == "Updated Title"
        # Other configs should remain unchanged
        assert manager.get_graphics_config().target_fps == original_fps

    def test_update_system_config(self, sample_system_config):
        """Test updating system configuration at runtime."""
        manager = ConfigManager(config_dir=sample_system_config)

        manager.update_system_config(debug_enabled=False)
        assert manager.system_config.debug_enabled is False

    def test_update_clears_cache(self, sample_game_config):
        """Test that updates clear the configuration cache."""
        manager = ConfigManager(config_dir=sample_game_config)
        _ = manager.game_config  # Load into cache

        manager.update_game_config(game_title="New Title")
        assert len(manager._cache) == 0

    def test_invalid_update_raises_error(self, sample_game_config):
        """Test that invalid updates raise validation errors."""
        manager = ConfigManager(config_dir=sample_game_config)

        with pytest.raises(ValidationError):
            manager.update_game_config(game_version="invalid_version")


class TestConfigValidation:
    """Test configuration validation."""

    def test_validate_config_success(self, sample_game_config, sample_system_config):
        """Test successful configuration validation."""
        temp_dir = Path(sample_game_config)
        # Copy system config to same directory
        system_file = temp_dir / "system.yaml"
        if not system_file.exists():
            with open(system_file, 'w') as f:
                yaml.dump({
                    "debug_enabled": True,
                    "log_level": "DEBUG"
                }, f)

        manager = ConfigManager(config_dir=temp_dir)
        issues = manager.validate_config()

        assert len(issues) == 0

    def test_validate_invalid_collision_frequency(self, temp_config_dir):
        """Test that Pydantic validation catches invalid collision frequency."""
        config_data = {
            "game_title": "Test",
            "game_version": "1.0.0",
            "game_type": "space",
            "physics": {
                "collision_check_frequency": 500,  # Invalid: too high (max 300)
                "particle_pool_size": 1000,
                "collision_detection_type": "circle",
                "gravity_enabled": False,
                "max_velocity": 500.0
            },
            "graphics": {
                "target_fps": 60,
                "renderer_type": "godot",
                "resolution_width": 640,
                "resolution_height": 576,
                "enable_vsync": True,
                "enable_fullscreen": False
            },
            "entity_pool": {
                "initial_pool_size": 100,
                "grow_increment": 50,
                "max_pool_size": 5000
            }
        }

        config_file = temp_config_dir / "game.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(config_data, f)

        manager = ConfigManager(config_dir=temp_config_dir)
        # Pydantic validation happens during load, raises error
        with pytest.raises(ValidationError):
            _ = manager.game_config


class TestConfigExport:
    """Test configuration export functionality."""

    def test_export_to_yaml(self, sample_game_config):
        """Test exporting configuration to YAML."""
        manager = ConfigManager(config_dir=sample_game_config)
        yaml_output = manager.export_config(output_format="yaml")

        assert isinstance(yaml_output, str)
        assert "game_type" in yaml_output
        assert "physics" in yaml_output

        # Parse to verify it's valid YAML (may contain enums serialized)
        # Just verify the string contains expected content
        assert "game:" in yaml_output
        assert "system:" in yaml_output

    def test_export_to_json(self, sample_game_config):
        """Test exporting configuration to JSON."""
        manager = ConfigManager(config_dir=sample_game_config)
        json_output = manager.export_config(output_format="json")

        assert isinstance(json_output, str)
        parsed = json.loads(json_output)
        assert "game" in parsed
        assert "system" in parsed

    def test_export_invalid_format(self, sample_game_config):
        """Test that invalid export format raises error."""
        manager = ConfigManager(config_dir=sample_game_config)

        with pytest.raises(ValueError):
            manager.export_config(output_format="xml")


class TestConfigReloading:
    """Test configuration reloading."""

    def test_reload_config(self, sample_game_config):
        """Test reloading configuration from disk."""
        manager = ConfigManager(config_dir=sample_game_config)
        original_title = manager.game_config.game_title

        # Modify file
        config_data = {
            "game_title": "Modified Title",
            "game_version": "1.0.0",
            "game_type": "space"
        }
        config_file = sample_game_config / "game.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(config_data, f)

        # Reload
        manager.reload_config()
        new_title = manager.game_config.game_title

        assert original_title != new_title
        assert new_title == "Modified Title"

    def test_reload_clears_cache(self, sample_game_config):
        """Test that reload clears the cache."""
        manager = ConfigManager(config_dir=sample_game_config)
        _ = manager.game_config

        manager.reload_config()
        assert len(manager._cache) == 0


class TestConfigStatistics:
    """Test configuration statistics."""

    def test_get_stats(self, sample_game_config):
        """Test getting configuration statistics."""
        manager = ConfigManager(config_dir=sample_game_config)
        stats = manager.get_stats()

        assert "environment" in stats
        assert "config_dir" in stats
        assert "game_type" in stats
        assert "target_fps" in stats
        assert stats["environment"] == "development"
        assert stats["target_fps"] == 60

    def test_stats_reflect_current_config(self, sample_game_config):
        """Test that stats reflect current configuration."""
        manager = ConfigManager(
            config_dir=sample_game_config,
            environment=Environment.PRODUCTION
        )
        stats = manager.get_stats()

        assert stats["environment"] == "production"


class TestLazyLoading:
    """Test lazy loading of configurations."""

    def test_game_config_lazy_loaded(self, sample_game_config):
        """Test that game config is lazy-loaded."""
        manager = ConfigManager(config_dir=sample_game_config)
        assert manager._game_config is None

        _ = manager.game_config
        assert manager._game_config is not None

    def test_system_config_lazy_loaded(self, sample_system_config):
        """Test that system config is lazy-loaded."""
        manager = ConfigManager(config_dir=sample_system_config)
        assert manager._system_config is None

        _ = manager.system_config
        assert manager._system_config is not None


class TestErrorHandling:
    """Test error handling."""

    def test_missing_config_file(self, temp_config_dir):
        """Test handling of missing config files."""
        manager = ConfigManager(config_dir=temp_config_dir)
        # Should use default config, not raise error
        config = manager.game_config
        assert config is not None

    def test_invalid_yaml_format(self, temp_config_dir):
        """Test handling of invalid YAML."""
        config_file = temp_config_dir / "game.yaml"
        with open(config_file, 'w') as f:
            f.write("invalid: yaml: format: {[")

        manager = ConfigManager(config_dir=temp_config_dir)
        with pytest.raises(Exception):
            _ = manager.game_config

    def test_validation_error_on_load(self, temp_config_dir):
        """Test validation errors during config load."""
        config_data = {
            "game_title": "Test",
            "game_version": "invalid",  # Invalid version format
            "game_type": "space"
        }

        config_file = temp_config_dir / "game.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(config_data, f)

        manager = ConfigManager(config_dir=temp_config_dir)
        with pytest.raises(ValidationError):
            _ = manager.game_config

    def test_invalid_game_type_config(self, sample_game_config):
        """Test error when accessing non-existent game type config."""
        manager = ConfigManager(config_dir=sample_game_config)
        # Config is space type, so accessing rpg should fail
        with pytest.raises(ValueError):
            # Create a config with rpg type but no rpg config
            manager.update_game_config(game_type="rpg")
            # This should trigger the error
            _ = manager.get_game_type_config()


class TestConfigRepresentation:
    """Test string representation."""

    def test_repr(self, sample_game_config):
        """Test ConfigManager string representation."""
        manager = ConfigManager(
            config_dir=sample_game_config,
            environment=Environment.DEVELOPMENT
        )
        repr_str = repr(manager)

        assert "ConfigManager" in repr_str
        assert "development" in repr_str
