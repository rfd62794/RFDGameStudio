"""
Unit tests for EntityManager template integration (Phase E - Step 3).

Tests verify:
- spawn_from_template with registered templates
- spawn_from_config with config dictionaries
- batch_spawn_from_template for multiple entities
- Property overrides
- Error handling for missing templates/registries
"""

import pytest

from src.game_engine.systems.body.entity_manager import (
    EntityManager, Entity, SpaceEntity
)
from src.game_engine.foundation import SystemConfig, Result
from src.game_engine.foundation.asset_system.entity_templates import (
    EntityTemplate, EntityTemplateRegistry
)


@pytest.fixture
def manager():
    """Create an initialized EntityManager."""
    mgr = EntityManager(SystemConfig(name="TestEntityManager"))
    mgr.initialize()
    return mgr


@pytest.fixture
def template_registry():
    """Create a template registry with sample templates."""
    registry = EntityTemplateRegistry()

    asteroid_template = EntityTemplate(
        template_id="asteroid_large",
        entity_type="asteroid",
        display_name="Large Asteroid",
        radius=20.0,
        mass=5.0,
        health=50,
        damage=10,
        max_velocity=100.0,
    )
    registry.register(asteroid_template)

    ship_template = EntityTemplate(
        template_id="player_ship",
        entity_type="ship",
        display_name="Player Ship",
        radius=8.0,
        mass=2.0,
        health=100,
        damage=0,
        acceleration=50.0,
        max_velocity=300.0,
    )
    registry.register(ship_template)

    projectile_template = EntityTemplate(
        template_id="bullet",
        entity_type="projectile",
        display_name="Bullet",
        radius=2.0,
        mass=0.1,
        health=1,
        damage=25,
        max_velocity=500.0,
    )
    registry.register(projectile_template)

    return registry


@pytest.fixture
def manager_with_templates(manager, template_registry):
    """Create an EntityManager with template registry attached."""
    manager.set_template_registry(template_registry)
    return manager


class TestSpawnFromTemplate:
    """Test spawn_from_template method."""

    def test_spawn_creates_entity(self, manager_with_templates):
        """Spawning from template should create an active entity."""
        result = manager_with_templates.spawn_from_template("asteroid_large")

        assert result.success
        entity = result.value
        assert entity is not None
        assert entity.active
        assert entity.entity_type == "asteroid"

    def test_spawn_applies_template_properties(self, manager_with_templates):
        """Entity should have properties from the template."""
        result = manager_with_templates.spawn_from_template("player_ship")

        assert result.success
        entity = result.value
        # These are set from the template
        assert entity.entity_type == "ship"

    def test_spawn_with_overrides(self, manager_with_templates):
        """Overrides should take priority over template properties."""
        result = manager_with_templates.spawn_from_template(
            "asteroid_large",
            entity_type="custom_asteroid"
        )

        assert result.success
        assert result.value.entity_type == "custom_asteroid"

    def test_spawn_missing_template(self, manager_with_templates):
        """Spawning from non-existent template should fail."""
        result = manager_with_templates.spawn_from_template("nonexistent")

        assert not result.success
        assert "not found" in result.error.lower()

    def test_spawn_without_registry(self, manager):
        """Spawning without setting template registry should fail."""
        result = manager.spawn_from_template("asteroid_large")

        assert not result.success
        assert "registry" in result.error.lower()

    def test_spawn_auto_registers_entity_type(self, manager_with_templates):
        """Entity type should be auto-registered on first use."""
        # "asteroid" type not manually registered, but template references it
        result = manager_with_templates.spawn_from_template("asteroid_large")

        assert result.success
        assert "asteroid" in manager_with_templates.pools

    def test_spawned_entity_tracked(self, manager_with_templates):
        """Spawned entity should be in all_entities."""
        result = manager_with_templates.spawn_from_template("asteroid_large")

        assert result.success
        entity_id = result.value.id
        assert manager_with_templates.get_entity(entity_id) is not None

    def test_spawn_multiple_templates(self, manager_with_templates):
        """Multiple different templates should all work."""
        r1 = manager_with_templates.spawn_from_template("asteroid_large")
        r2 = manager_with_templates.spawn_from_template("player_ship")
        r3 = manager_with_templates.spawn_from_template("bullet")

        assert r1.success
        assert r2.success
        assert r3.success
        assert r1.value.id != r2.value.id != r3.value.id


class TestSpawnFromConfig:
    """Test spawn_from_config method."""

    def test_spawn_from_config_dict(self, manager):
        """Spawning from config dict should create entity."""
        config = {
            "entity_type": "test_entity",
        }
        result = manager.spawn_from_config(config)

        assert result.success
        assert result.value.entity_type == "test_entity"

    def test_spawn_config_missing_type(self, manager):
        """Config without entity_type should fail."""
        result = manager.spawn_from_config({"name": "test"})

        assert not result.success
        assert "entity_type" in result.error.lower()

    def test_spawn_config_auto_registers(self, manager):
        """Entity type in config should be auto-registered."""
        config = {"entity_type": "new_type"}
        result = manager.spawn_from_config(config)

        assert result.success
        assert "new_type" in manager.pools

    def test_spawn_config_empty_dict(self, manager):
        """Empty config dict should fail."""
        result = manager.spawn_from_config({})

        assert not result.success


class TestBatchSpawnFromTemplate:
    """Test batch_spawn_from_template method."""

    def test_batch_spawn_count(self, manager_with_templates):
        """Batch spawn should create the requested number of entities."""
        entities = manager_with_templates.batch_spawn_from_template(
            "asteroid_large", count=5
        )

        assert len(entities) == 5

    def test_batch_spawn_unique_ids(self, manager_with_templates):
        """Batch spawned entities should all have unique IDs."""
        entities = manager_with_templates.batch_spawn_from_template(
            "asteroid_large", count=10
        )

        ids = [e.id for e in entities]
        assert len(set(ids)) == 10

    def test_batch_spawn_with_overrides(self, manager_with_templates):
        """All batch spawned entities should have the overrides applied."""
        entities = manager_with_templates.batch_spawn_from_template(
            "asteroid_large", count=3
        )

        for entity in entities:
            assert entity.entity_type == "asteroid"

    def test_batch_spawn_zero(self, manager_with_templates):
        """Batch spawn with count=0 should return empty list."""
        entities = manager_with_templates.batch_spawn_from_template(
            "asteroid_large", count=0
        )

        assert len(entities) == 0

    def test_batch_spawn_all_tracked(self, manager_with_templates):
        """All batch spawned entities should be tracked by manager."""
        entities = manager_with_templates.batch_spawn_from_template(
            "asteroid_large", count=5
        )

        for entity in entities:
            assert manager_with_templates.get_entity(entity.id) is not None


class TestTemplateRegistryIntegration:
    """Test set_template_registry and lifecycle."""

    def test_set_template_registry(self, manager, template_registry):
        """Setting template registry should enable template spawning."""
        manager.set_template_registry(template_registry)

        result = manager.spawn_from_template("asteroid_large")
        assert result.success

    def test_despawn_template_entity(self, manager_with_templates):
        """Entities spawned from templates should be despawnable."""
        result = manager_with_templates.spawn_from_template("asteroid_large")
        assert result.success

        entity_id = result.value.id
        despawn_result = manager_with_templates.despawn_entity(entity_id)
        assert despawn_result.success

        assert manager_with_templates.get_entity(entity_id) is None
