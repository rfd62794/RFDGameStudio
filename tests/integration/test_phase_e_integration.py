"""
Phase E Integration Tests - End-to-end testing of asset/config systems.

Tests the complete flow:
1. ConfigManager loads configurations
2. AssetRegistry stores game assets
3. EntityTemplateRegistry defines entity blueprints
4. Combined: Configuration-based entity spawning

Architecture: Configuration → Assets → Templates → Entity Instances
"""

import pytest
import json
import yaml
import tempfile
from pathlib import Path

from src.game_engine.foundation.config_system.config_manager import ConfigManager, Environment
from src.game_engine.foundation.config_system.config_schemas import (
    GameConfig, GameType, PhysicsConfig, GraphicsConfig
)
from src.game_engine.foundation.asset_system.asset_registry import AssetRegistry, AssetType
from src.game_engine.foundation.asset_system.entity_templates import (
    EntityTemplate, EntityTemplateRegistry, TemplateType
)


@pytest.fixture
def temp_config_dir():
    """Create temporary config directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def space_config_dir(temp_config_dir):
    """Create space game configuration."""
    config_data = {
        "game_title": "Space Game Test",
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
def asset_registry():
    """Create populated asset registry."""
    registry = AssetRegistry()

    # Register ship sprite
    ship_sprite = {
        "frames": [(0, 0, 10, 10)],
        "animation_frames": [0],
        "animation_speed": 0.1
    }
    registry.register("ship_sprite", AssetType.SPRITE, ship_sprite, tags=["ship", "entity"])

    # Register asteroid sprites
    asteroid_large_sprite = {
        "frames": [(0, 0, 30, 30)],
        "animation_frames": [0]
    }
    registry.register("asteroid_large_sprite", AssetType.SPRITE, asteroid_large_sprite, tags=["asteroid", "entity"])

    # Register projectile sprite
    projectile_sprite = {
        "frames": [(0, 0, 2, 2)],
        "animation_frames": [0]
    }
    registry.register("projectile_sprite", AssetType.SPRITE, projectile_sprite, tags=["projectile", "entity"])

    # Register sound effects
    registry.register("fire_sound", AssetType.SOUND, {"filename": "fire.wav"}, tags=["sound"])
    registry.register("explosion_sound", AssetType.SOUND, {"filename": "explosion.wav"}, tags=["sound"])

    # Register configs
    physics_config = {"collision_frequency": 60}
    registry.register("physics_config", AssetType.CONFIG, physics_config, tags=["physics"])

    return registry


@pytest.fixture
def template_registry():
    """Create populated entity template registry."""
    registry = EntityTemplateRegistry()

    # Ship template
    ship = EntityTemplate(
        template_id="ship",
        entity_type="space_entity",
        display_name="Player Ship",
        radius=5.0,
        mass=1.0,
        max_velocity=200.0,
        health=100,
        score_value=0,
        color=1,
        collision_type="circle",
        collision_group="player"
    )
    ship.add_tag("player")
    ship.add_tag("controllable")
    registry.register(ship)

    # Large asteroid template
    asteroid_large = EntityTemplate(
        template_id="asteroid_large",
        entity_type="space_entity",
        display_name="Large Asteroid",
        radius=15.0,
        mass=10.0,
        health=50,
        damage=5,
        score_value=100,
        color=2,
        collision_type="circle",
        collision_group="asteroid"
    )
    asteroid_large.add_tag("asteroid")
    asteroid_large.add_tag("destructible")
    registry.register(asteroid_large)

    # Medium asteroid (inherits from large)
    asteroid_medium = EntityTemplate(
        template_id="asteroid_medium",
        entity_type="space_entity",
        display_name="Medium Asteroid",
        radius=10.0,
        mass=5.0,
        health=30,
        damage=3,
        score_value=50,
        color=2,
        collision_type="circle",
        collision_group="asteroid"
    )
    asteroid_medium.add_tag("asteroid")
    asteroid_medium.add_tag("destructible")
    registry.register(asteroid_medium, inherit_from="asteroid_large")

    # Projectile template
    projectile = EntityTemplate(
        template_id="projectile",
        entity_type="space_entity",
        display_name="Laser Projectile",
        radius=1.0,
        mass=0.0,
        health=1,
        damage=10,
        score_value=0,
        color=3,
        collision_type="circle",
        collision_group="projectile"
    )
    projectile.add_tag("projectile")
    projectile.add_tag("weapon")
    projectile.set_custom_property("lifetime", 1.0)
    registry.register(projectile)

    return registry


class TestConfigurationLoading:
    """Test loading configurations."""

    def test_load_space_config(self, space_config_dir):
        """Test loading space game configuration."""
        manager = ConfigManager(config_dir=space_config_dir)
        config = manager.game_config

        assert config.game_type == GameType.SPACE
        assert config.game_title == "Space Game Test"
        assert config.graphics.target_fps == 60
        assert config.physics.collision_check_frequency == 60

    def test_config_has_game_type_specific_config(self, space_config_dir):
        """Test that game-type-specific config is loaded."""
        manager = ConfigManager(config_dir=space_config_dir)
        assert manager.game_config.space is not None
        assert manager.game_config.space.asteroids_per_wave_base == 5

    def test_get_game_type_config(self, space_config_dir):
        """Test retrieving game-type-specific config."""
        manager = ConfigManager(config_dir=space_config_dir)
        space_config = manager.get_game_type_config()

        assert space_config["asteroids_per_wave_base"] == 5
        assert space_config["projectile_speed"] == 300.0

    def test_physics_config_retrieved(self, space_config_dir):
        """Test getting physics configuration."""
        manager = ConfigManager(config_dir=space_config_dir)
        physics = manager.get_physics_config()

        assert physics.collision_check_frequency == 60
        assert physics.particle_pool_size == 1000


class TestAssetRegistry:
    """Test asset registry operations."""

    def test_register_assets(self, asset_registry):
        """Test asset registration."""
        assert asset_registry.count() == 6

    def test_retrieve_sprite_asset(self, asset_registry):
        """Test retrieving sprite asset."""
        ship_sprite = asset_registry.get("ship_sprite")

        assert ship_sprite is not None
        assert ship_sprite.asset_type == AssetType.SPRITE
        assert ship_sprite.has_tag("ship")

    def test_list_sprites(self, asset_registry):
        """Test listing sprite assets."""
        sprites = asset_registry.list_by_type(AssetType.SPRITE)

        assert len(sprites) == 3

    def test_list_by_tag(self, asset_registry):
        """Test listing assets by tag."""
        entity_assets = asset_registry.list_by_tag("entity")

        assert len(entity_assets) == 3

    def test_sound_assets(self, asset_registry):
        """Test sound asset management."""
        sounds = asset_registry.list_by_type(AssetType.SOUND)

        assert len(sounds) == 2
        assert any("fire" in s.id for s in sounds)


class TestEntityTemplates:
    """Test entity template registry."""

    def test_register_templates(self, template_registry):
        """Test template registration."""
        assert template_registry.count() == 4

    def test_retrieve_ship_template(self, template_registry):
        """Test retrieving ship template."""
        ship = template_registry.get("ship")

        assert ship is not None
        assert ship.health == 100
        assert ship.has_tag("controllable")

    def test_retrieve_asteroid_template(self, template_registry):
        """Test retrieving asteroid template."""
        asteroid = template_registry.get("asteroid_large")

        assert asteroid is not None
        assert asteroid.radius == 15.0
        assert asteroid.score_value == 100

    def test_template_inheritance(self, template_registry):
        """Test template inheritance."""
        medium = template_registry.get("asteroid_medium")

        assert medium.parent_template_id == "asteroid_large"
        assert medium.radius < template_registry.get("asteroid_large").radius

    def test_get_child_templates(self, template_registry):
        """Test getting child templates."""
        children = template_registry.get_children("asteroid_large")

        assert len(children) == 1
        assert children[0].template_id == "asteroid_medium"

    def test_templates_by_tag(self, template_registry):
        """Test filtering templates by tag."""
        asteroids = template_registry.list_by_tag("asteroid")

        assert len(asteroids) == 2

    def test_template_custom_properties(self, template_registry):
        """Test custom properties in templates."""
        projectile = template_registry.get("projectile")

        assert projectile.get_custom_property("lifetime") == 1.0

    def test_create_template_instance(self, template_registry):
        """Test creating entity instance from template."""
        ship_template = template_registry.get("ship")
        ship_instance = ship_template.create_instance()

        assert ship_instance.template_id == ship_template.template_id
        assert ship_instance is not ship_template


class TestConfigAssetIntegration:
    """Test ConfigManager and AssetRegistry integration."""

    def test_assets_from_config(self, space_config_dir, asset_registry):
        """Test using assets configured in ConfigManager."""
        manager = ConfigManager(config_dir=space_config_dir)
        config = manager.game_config

        # Asset registry should have loaded assets
        assert asset_registry.count() > 0

        # Config and assets should be compatible
        physics_config = asset_registry.get("physics_config")
        assert physics_config is not None

    def test_entity_pool_config_affects_spawning(self, space_config_dir):
        """Test entity pool config impacts entity spawning."""
        manager = ConfigManager(config_dir=space_config_dir)
        pool_config = manager.get_entity_pool_config()

        # Pool config should determine entity allocation
        assert pool_config.initial_pool_size == 100
        assert pool_config.grow_increment == 50


class TestConfigTemplateIntegration:
    """Test ConfigManager and EntityTemplateRegistry integration."""

    def test_template_configuration(self, template_registry, space_config_dir):
        """Test template configuration."""
        manager = ConfigManager(config_dir=space_config_dir)
        space_config = manager.get_game_type_config()

        # Get projectile template
        projectile = template_registry.get("projectile")

        # Projectile velocity should match config
        assert space_config["projectile_speed"] == 300.0
        # Projectile lifetime could be from custom property
        assert projectile.get_custom_property("lifetime") == 1.0

    def test_asteroid_spawning_config(self, template_registry, space_config_dir):
        """Test asteroid spawning uses template and config."""
        manager = ConfigManager(config_dir=space_config_dir)
        space_config = manager.get_game_type_config()

        # Get asteroid templates
        asteroids = template_registry.list_by_tag("asteroid")

        # Should have multiple asteroid sizes
        assert len(asteroids) >= 2

        # Config determines how many to spawn
        base_spawn = space_config["asteroids_per_wave_base"]
        assert base_spawn == 5


class TestEndToEndGameSetup:
    """Test complete game setup from config to entity templates."""

    def test_complete_game_initialization(self, space_config_dir, asset_registry, template_registry):
        """Test initializing complete game from configurations."""
        # Load configuration
        config_manager = ConfigManager(config_dir=space_config_dir)
        game_config = config_manager.game_config

        # Verify configuration loaded
        assert game_config.game_type == GameType.SPACE
        assert game_config.graphics.target_fps == 60

        # Verify assets available
        assert asset_registry.count_by_type(AssetType.SPRITE) == 3

        # Verify templates available
        assert template_registry.count() == 4

        # Verify can spawn entities from templates
        ship = template_registry.get("ship")
        asteroid = template_registry.get("asteroid_large")
        projectile = template_registry.get("projectile")

        assert ship is not None
        assert asteroid is not None
        assert projectile is not None

    def test_entity_spawning_from_config_and_templates(self, space_config_dir, template_registry):
        """Test spawning entities using config and templates."""
        manager = ConfigManager(config_dir=space_config_dir)
        space_config = manager.get_game_type_config()

        # Spawn initial ship
        ship_template = template_registry.get("ship")
        ship = ship_template.create_instance()

        assert ship.health == 100
        assert ship.mass == 1.0

        # Spawn initial asteroids based on config
        asteroid_template = template_registry.get("asteroid_large")
        num_to_spawn = space_config["asteroids_per_wave_base"]

        asteroids = []
        for i in range(num_to_spawn):
            asteroid = asteroid_template.create_instance()
            asteroids.append(asteroid)

        assert len(asteroids) == 5
        assert all(a.score_value == 100 for a in asteroids)

    def test_template_inheritance_in_spawning(self, space_config_dir, template_registry):
        """Test using inherited templates for spawning."""
        # Get parent and child asteroid templates
        parent = template_registry.get("asteroid_large")
        child = template_registry.get("asteroid_medium")

        # Both should be usable templates
        assert parent is not None
        assert child is not None

        # Child should have modified properties
        assert child.radius < parent.radius
        assert child.health < parent.health

        # Both should spawn successfully
        parent_instance = parent.create_instance()
        child_instance = child.create_instance()

        assert parent_instance.radius == 15.0
        assert child_instance.radius == 10.0


class TestPhaseEValidation:
    """Test Phase E system validation."""

    def test_config_validation(self, space_config_dir):
        """Test configuration validation."""
        manager = ConfigManager(config_dir=space_config_dir)
        issues = manager.validate_config()

        assert len(issues) == 0

    def test_asset_registry_validation(self, asset_registry):
        """Test asset registry validation."""
        errors = asset_registry.validate()

        # Should be valid
        assert len(errors) == 0

    def test_template_registry_validation(self, template_registry):
        """Test template registry validation."""
        errors = template_registry.validate()

        # Should be valid
        assert len(errors) == 0

    def test_all_systems_valid(self, space_config_dir, asset_registry, template_registry):
        """Test all Phase E systems are valid."""
        config_manager = ConfigManager(config_dir=space_config_dir)

        config_valid = len(config_manager.validate_config()) == 0
        assets_valid = len(asset_registry.validate()) == 0
        templates_valid = len(template_registry.validate()) == 0

        assert config_valid and assets_valid and templates_valid
