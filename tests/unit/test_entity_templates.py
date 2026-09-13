"""
Test suite for Entity Templates system.

Coverage:
- Template creation and validation
- Registry operations (register, retrieve, remove)
- Template inheritance
- Filtering and iteration
"""

import pytest
from src.game_engine.foundation.asset_system.entity_templates import (
    EntityTemplate, EntityTemplateRegistry, TemplateType
)


@pytest.fixture
def base_template():
    """Create a base template fixture."""
    return EntityTemplate(
        template_id="asteroid_large",
        entity_type="asteroid",
        display_name="Large Asteroid",
        radius=15.0,
        mass=10.0,
        health=50,
        score_value=100
    )


@pytest.fixture
def registry():
    """Create an empty registry fixture."""
    return EntityTemplateRegistry()


@pytest.fixture
def populated_registry(base_template):
    """Create a registry with templates."""
    registry = EntityTemplateRegistry()

    # Add base templates
    asteroid_large = EntityTemplate(
        template_id="asteroid_large",
        entity_type="asteroid",
        display_name="Large Asteroid",
        radius=15.0, mass=10.0, health=50, score_value=100
    )

    asteroid_medium = EntityTemplate(
        template_id="asteroid_medium",
        entity_type="asteroid",
        display_name="Medium Asteroid",
        radius=10.0, mass=5.0, health=30, score_value=50,
        parent_template_id="asteroid_large"
    )

    ship = EntityTemplate(
        template_id="ship",
        entity_type="ship",
        display_name="Player Ship",
        radius=5.0, mass=1.0, health=100, score_value=0
    )

    projectile = EntityTemplate(
        template_id="projectile",
        entity_type="projectile",
        display_name="Laser Projectile",
        radius=1.0, mass=0.0, health=1, damage=10,
        tags=["projectile", "weapon"]
    )

    registry.register(asteroid_large)
    registry.register(asteroid_medium, inherit_from="asteroid_large")
    registry.register(ship)
    registry.register(projectile)

    return registry


class TestEntityTemplateCreation:
    """Test entity template creation."""

    def test_create_default_template(self):
        """Test creating template with defaults."""
        template = EntityTemplate(
            template_id="test",
            entity_type="test_entity",
            display_name="Test Entity"
        )

        assert template.template_id == "test"
        assert template.radius == 5.0
        assert template.mass == 1.0
        assert template.health == 100
        assert template.visible is True

    def test_create_custom_template(self, base_template):
        """Test creating template with custom values."""
        assert base_template.template_id == "asteroid_large"
        assert base_template.radius == 15.0
        assert base_template.mass == 10.0
        assert base_template.health == 50

    def test_template_repr(self, base_template):
        """Test template string representation."""
        repr_str = repr(base_template)
        assert "asteroid_large" in repr_str
        assert "asteroid" in repr_str


class TestTemplateValidation:
    """Test template validation."""

    def test_validate_valid_template(self, base_template):
        """Test validating a valid template."""
        errors = base_template.validate()
        assert len(errors) == 0

    def test_validate_missing_template_id(self):
        """Test validation fails for missing template_id."""
        template = EntityTemplate(
            template_id="",
            entity_type="test",
            display_name="Test"
        )

        errors = template.validate()
        assert len(errors) > 0
        assert any("template_id" in e for e in errors)

    def test_validate_invalid_radius(self):
        """Test validation fails for invalid radius."""
        template = EntityTemplate(
            template_id="test",
            entity_type="test",
            display_name="Test",
            radius=-1.0
        )

        errors = template.validate()
        assert len(errors) > 0
        assert any("radius" in e for e in errors)

    def test_validate_invalid_health(self):
        """Test validation fails for invalid health."""
        template = EntityTemplate(
            template_id="test",
            entity_type="test",
            display_name="Test",
            health=-10
        )

        errors = template.validate()
        assert len(errors) > 0

    def test_validate_invalid_layer(self):
        """Test validation fails for out-of-range layer."""
        template = EntityTemplate(
            template_id="test",
            entity_type="test",
            display_name="Test",
            layer=300
        )

        errors = template.validate()
        assert len(errors) > 0
        assert any("layer" in e for e in errors)


class TestTemplateOperations:
    """Test template operations."""

    def test_create_instance(self, base_template):
        """Test creating instance from template."""
        instance = base_template.create_instance()

        assert instance.template_id == base_template.template_id
        assert instance is not base_template
        # Verify deep copy
        instance.custom_properties["key"] = "value"
        assert "key" not in base_template.custom_properties

    def test_add_tag(self, base_template):
        """Test adding tags to template."""
        base_template.add_tag("large")
        base_template.add_tag("destructible")

        assert base_template.has_tag("large")
        assert base_template.has_tag("destructible")
        assert len(base_template.tags) == 2

    def test_duplicate_tag_not_added(self, base_template):
        """Test that duplicate tags aren't added."""
        base_template.add_tag("large")
        base_template.add_tag("large")

        assert len(base_template.tags) == 1

    def test_custom_properties(self, base_template):
        """Test setting and getting custom properties."""
        base_template.set_custom_property("drop_rate", 0.5)
        base_template.set_custom_property("loot_type", "health")

        assert base_template.get_custom_property("drop_rate") == 0.5
        assert base_template.get_custom_property("loot_type") == "health"
        assert base_template.get_custom_property("missing", "default") == "default"


class TestTemplateSerializaation:
    """Test template serialization."""

    def test_to_dict(self, base_template):
        """Test converting template to dict."""
        data = base_template.to_dict()

        assert data["template_id"] == "asteroid_large"
        assert data["entity_type"] == "asteroid"
        assert data["radius"] == 15.0
        assert data["health"] == 50

    def test_from_dict(self):
        """Test creating template from dict."""
        data = {
            "template_id": "test",
            "entity_type": "test_entity",
            "display_name": "Test",
            "radius": 10.0,
            "health": 75
        }

        template = EntityTemplate.from_dict(data)

        assert template.template_id == "test"
        assert template.radius == 10.0
        assert template.health == 75

    def test_dict_roundtrip(self, base_template):
        """Test dict conversion roundtrip."""
        data = base_template.to_dict()
        restored = EntityTemplate.from_dict(data)

        assert restored.template_id == base_template.template_id
        assert restored.radius == base_template.radius
        assert restored.health == base_template.health


class TestRegistryOperations:
    """Test registry operations."""

    def test_register_template(self, registry, base_template):
        """Test registering a template."""
        registry.register(base_template)

        assert registry.count() == 1
        assert base_template.template_id in registry

    def test_register_duplicate_raises_error(self, registry, base_template):
        """Test registering duplicate template raises error."""
        registry.register(base_template)

        with pytest.raises(ValueError):
            registry.register(base_template)

    def test_register_invalid_template_raises_error(self, registry):
        """Test registering invalid template raises error."""
        invalid_template = EntityTemplate(
            template_id="",  # Invalid
            entity_type="test",
            display_name="Test"
        )

        with pytest.raises(ValueError):
            registry.register(invalid_template)

    def test_get_template(self, populated_registry):
        """Test retrieving a template."""
        template = populated_registry.get("asteroid_large")

        assert template is not None
        assert template.template_id == "asteroid_large"

    def test_get_nonexistent_returns_none(self, populated_registry):
        """Test getting nonexistent template returns None."""
        template = populated_registry.get("nonexistent")
        assert template is None

    def test_get_or_raise_found(self, populated_registry):
        """Test get_or_raise when template exists."""
        template = populated_registry.get_or_raise("asteroid_large")
        assert template is not None

    def test_get_or_raise_not_found(self, populated_registry):
        """Test get_or_raise when template doesn't exist."""
        with pytest.raises(KeyError):
            populated_registry.get_or_raise("nonexistent")

    def test_unregister_template(self, populated_registry):
        """Test unregistering a template."""
        result = populated_registry.unregister("asteroid_large")

        assert result is True
        assert "asteroid_large" not in populated_registry

    def test_unregister_nonexistent_returns_false(self, populated_registry):
        """Test unregistering nonexistent template returns False."""
        result = populated_registry.unregister("nonexistent")
        assert result is False

    def test_clear_registry(self, populated_registry):
        """Test clearing registry."""
        assert populated_registry.count() > 0

        populated_registry.clear()

        assert populated_registry.count() == 0


class TestRegistryFiltering:
    """Test registry filtering capabilities."""

    def test_list_by_type(self, populated_registry):
        """Test filtering templates by type."""
        asteroids = populated_registry.list_by_type("asteroid")

        assert len(asteroids) == 2
        assert all(t.entity_type == "asteroid" for t in asteroids)

    def test_list_by_type_empty(self, populated_registry):
        """Test filtering by type with no results."""
        templates = populated_registry.list_by_type("nonexistent")
        assert len(templates) == 0

    def test_list_by_tag(self, populated_registry):
        """Test filtering templates by tag."""
        tagged = populated_registry.list_by_tag("projectile")

        assert len(tagged) == 1
        assert tagged[0].template_id == "projectile"

    def test_list_by_tag_empty(self, populated_registry):
        """Test filtering by tag with no results."""
        templates = populated_registry.list_by_tag("nonexistent")
        assert len(templates) == 0

    def test_list_all(self, populated_registry):
        """Test listing all templates."""
        all_templates = populated_registry.list_all()

        assert len(all_templates) == 4

    def test_count_by_type(self, populated_registry):
        """Test counting templates by type."""
        asteroid_count = populated_registry.count_by_type("asteroid")
        assert asteroid_count == 2

        ship_count = populated_registry.count_by_type("ship")
        assert ship_count == 1


class TestTemplateInheritance:
    """Test template inheritance."""

    def test_register_with_inheritance(self, registry):
        """Test registering template with inheritance."""
        parent = EntityTemplate(
            template_id="parent",
            entity_type="asteroid",
            display_name="Parent"
        )

        child = EntityTemplate(
            template_id="child",
            entity_type="asteroid",
            display_name="Child",
            parent_template_id="parent"
        )

        registry.register(parent)
        registry.register(child, inherit_from="parent")

        assert child.parent_template_id == "parent"

    def test_register_with_nonexistent_parent_raises_error(self, registry):
        """Test registering with nonexistent parent raises error."""
        child = EntityTemplate(
            template_id="child",
            entity_type="asteroid",
            display_name="Child"
        )

        with pytest.raises(ValueError):
            registry.register(child, inherit_from="nonexistent")

    def test_get_children(self, populated_registry):
        """Test getting child templates."""
        children = populated_registry.get_children("asteroid_large")

        assert len(children) == 1
        assert children[0].template_id == "asteroid_medium"

    def test_get_children_no_children(self, populated_registry):
        """Test getting children when none exist."""
        children = populated_registry.get_children("ship")
        assert len(children) == 0


class TestRegistryValidation:
    """Test registry validation."""

    def test_validate_valid_registry(self, populated_registry):
        """Test validating a valid registry."""
        errors = populated_registry.validate()
        assert len(errors) == 0

    def test_validate_orphaned_inheritance(self, registry):
        """Test validation detects orphaned inheritance."""
        template = EntityTemplate(
            template_id="orphan",
            entity_type="test",
            display_name="Orphan",
            parent_template_id="nonexistent"
        )

        registry._templates[template.template_id] = template

        errors = registry.validate()
        assert len(errors) > 0
        assert any("parent" in e for e in errors)


class TestRegistryStatistics:
    """Test registry statistics."""

    def test_get_stats(self, populated_registry):
        """Test getting registry statistics."""
        stats = populated_registry.get_stats()

        assert stats["total_templates"] == 4
        assert stats["by_type"]["asteroid"] == 2
        assert stats["by_type"]["ship"] == 1
        assert "total_types" in stats
        assert "total_tags" in stats

    def test_stats_empty_registry(self, registry):
        """Test stats for empty registry."""
        stats = registry.get_stats()

        assert stats["total_templates"] == 0


class TestRegistryIteration:
    """Test registry iteration."""

    def test_contains(self, populated_registry):
        """Test checking if template exists."""
        assert "asteroid_large" in populated_registry
        assert "nonexistent" not in populated_registry

    def test_len(self, populated_registry):
        """Test getting registry length."""
        assert len(populated_registry) == 4

    def test_iter(self, populated_registry):
        """Test iterating over templates."""
        templates = list(populated_registry)

        assert len(templates) == 4
        assert all(isinstance(t, EntityTemplate) for t in templates)


class TestRegistryRepresentation:
    """Test registry representation."""

    def test_repr(self, populated_registry):
        """Test registry string representation."""
        repr_str = repr(populated_registry)

        assert "EntityTemplateRegistry" in repr_str
        assert "4" in repr_str
