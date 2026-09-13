"""
Unit tests for Entity Factories (Phase E - Step 4).

Tests verify:
- Space factories: player_ship, asteroid, enemy_fighter, projectile
- RPG factories: character, npc, monster
- Tycoon factories: animal, facility
- Parameter validation and custom IDs
- Template validity (all factories produce valid templates)
"""

import pytest

from src.game_engine.systems.body.entity_factories import (
    create_player_ship,
    create_asteroid,
    create_enemy_fighter,
    create_projectile,
    create_character,
    create_npc,
    create_monster,
    create_animal,
    create_facility,
)
from src.game_engine.foundation.asset_system.entity_templates import EntityTemplateRegistry


# --- Space Game Factory Tests ---

class TestCreatePlayerShip:
    """Tests for create_player_ship factory."""

    def test_default_ship(self):
        """Default player ship should have valid properties."""
        tmpl = create_player_ship()
        assert tmpl.template_id == "player_ship"
        assert tmpl.entity_type == "ship"
        assert tmpl.health == 100
        assert "player" in tmpl.tags
        assert tmpl.validate() == []

    def test_custom_parameters(self):
        """Custom parameters should override defaults."""
        tmpl = create_player_ship(health=200, max_velocity=500.0)
        assert tmpl.health == 200
        assert tmpl.max_velocity == 500.0

    def test_custom_id(self):
        """Custom template ID should be used."""
        tmpl = create_player_ship(template_id="my_ship")
        assert tmpl.template_id == "my_ship"


class TestCreateAsteroid:
    """Tests for create_asteroid factory."""

    def test_small_asteroid(self):
        """Small asteroid should have correct properties."""
        tmpl = create_asteroid("small")
        assert tmpl.template_id == "asteroid_small"
        assert tmpl.radius == 5.0
        assert tmpl.score_value == 100
        assert tmpl.validate() == []

    def test_medium_asteroid(self):
        """Medium asteroid should have correct properties."""
        tmpl = create_asteroid("medium")
        assert tmpl.template_id == "asteroid_medium"
        assert tmpl.radius == 12.0
        assert tmpl.validate() == []

    def test_large_asteroid(self):
        """Large asteroid should have correct properties."""
        tmpl = create_asteroid("large")
        assert tmpl.template_id == "asteroid_large"
        assert tmpl.radius == 20.0
        assert tmpl.validate() == []

    def test_invalid_size(self):
        """Invalid size should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid asteroid size"):
            create_asteroid("huge")

    def test_custom_id(self):
        """Custom template ID should be used."""
        tmpl = create_asteroid("small", template_id="rock_1")
        assert tmpl.template_id == "rock_1"


class TestCreateEnemyFighter:
    """Tests for create_enemy_fighter factory."""

    def test_basic_fighter(self):
        """Basic fighter should have standard properties."""
        tmpl = create_enemy_fighter("basic")
        assert tmpl.template_id == "enemy_basic"
        assert tmpl.entity_type == "enemy"
        assert tmpl.custom_properties["ai_type"] == "basic"
        assert tmpl.validate() == []

    def test_aggressive_fighter(self):
        """Aggressive fighter should be stronger."""
        tmpl = create_enemy_fighter("aggressive")
        basic = create_enemy_fighter("basic")
        assert tmpl.health > basic.health
        assert tmpl.damage > basic.damage

    def test_evasive_fighter(self):
        """Evasive fighter should be faster."""
        tmpl = create_enemy_fighter("evasive")
        basic = create_enemy_fighter("basic")
        assert tmpl.max_velocity > basic.max_velocity

    def test_invalid_ai_type(self):
        """Invalid AI type should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid ai_type"):
            create_enemy_fighter("berserker")


class TestCreateProjectile:
    """Tests for create_projectile factory."""

    def test_bullet(self):
        """Bullet should be fast with moderate damage."""
        tmpl = create_projectile("bullet")
        assert tmpl.template_id == "projectile_bullet"
        assert tmpl.damage == 25
        assert tmpl.validate() == []

    def test_missile(self):
        """Missile should be slower with high damage."""
        tmpl = create_projectile("missile")
        bullet = create_projectile("bullet")
        assert tmpl.damage > bullet.damage
        assert tmpl.max_velocity < bullet.max_velocity

    def test_laser(self):
        """Laser should be fastest."""
        tmpl = create_projectile("laser")
        assert tmpl.max_velocity == 800.0
        assert tmpl.validate() == []

    def test_invalid_weapon(self):
        """Invalid weapon type should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid weapon_type"):
            create_projectile("plasma")


# --- RPG Game Factory Tests ---

class TestCreateCharacter:
    """Tests for create_character factory."""

    def test_warrior(self):
        """Warrior should have high health."""
        tmpl = create_character("warrior", level=1)
        assert tmpl.entity_type == "character"
        assert tmpl.custom_properties["class_type"] == "warrior"
        assert tmpl.validate() == []

    def test_mage(self):
        """Mage should have high damage."""
        mage = create_character("mage", level=1)
        warrior = create_character("warrior", level=1)
        assert mage.damage > warrior.damage

    def test_level_scaling(self):
        """Higher levels should have more health and damage."""
        low = create_character("warrior", level=1)
        high = create_character("warrior", level=10)
        assert high.health > low.health
        assert high.damage > low.damage

    def test_invalid_class(self):
        """Invalid class type should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid class_type"):
            create_character("paladin")

    def test_invalid_level(self):
        """Level out of range should raise ValueError."""
        with pytest.raises(ValueError):
            create_character("warrior", level=0)
        with pytest.raises(ValueError):
            create_character("warrior", level=101)


class TestCreateNPC:
    """Tests for create_npc factory."""

    def test_villager(self):
        """Villager NPC should be valid."""
        tmpl = create_npc("villager")
        assert tmpl.entity_type == "npc"
        assert tmpl.custom_properties["role"] == "villager"
        assert tmpl.validate() == []

    def test_guard_has_more_health(self):
        """Guard should have more health than villager."""
        guard = create_npc("guard")
        villager = create_npc("villager")
        assert guard.health > villager.health

    def test_invalid_role(self):
        """Invalid NPC role should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid NPC role"):
            create_npc("king")


class TestCreateMonster:
    """Tests for create_monster factory."""

    def test_goblin(self):
        """Goblin should be a weak monster."""
        tmpl = create_monster("goblin", level=1)
        assert tmpl.entity_type == "monster"
        assert tmpl.validate() == []

    def test_dragon_is_strongest(self):
        """Dragon should have highest stats."""
        dragon = create_monster("dragon", level=1)
        goblin = create_monster("goblin", level=1)
        assert dragon.health > goblin.health
        assert dragon.damage > goblin.damage

    def test_level_scaling(self):
        """Higher levels should scale monster stats."""
        low = create_monster("skeleton", level=1)
        high = create_monster("skeleton", level=10)
        assert high.health > low.health

    def test_invalid_species(self):
        """Invalid species should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid species"):
            create_monster("vampire")


# --- Tycoon Game Factory Tests ---

class TestCreateAnimal:
    """Tests for create_animal factory."""

    def test_cow(self):
        """Cow should be a large, slow animal."""
        tmpl = create_animal("cow")
        assert tmpl.entity_type == "animal"
        assert tmpl.custom_properties["species"] == "cow"
        assert tmpl.validate() == []

    def test_chicken_is_small(self):
        """Chicken should be smaller than cow."""
        chicken = create_animal("chicken")
        cow = create_animal("cow")
        assert chicken.radius < cow.radius

    def test_invalid_species(self):
        """Invalid species should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid species"):
            create_animal("horse")


class TestCreateFacility:
    """Tests for create_facility factory."""

    def test_barn(self):
        """Barn should be a basic facility."""
        tmpl = create_facility("barn")
        assert tmpl.entity_type == "facility"
        assert tmpl.max_velocity == 0.0  # buildings don't move
        assert tmpl.validate() == []

    def test_factory_is_largest(self):
        """Factory should be the largest facility."""
        factory = create_facility("factory")
        barn = create_facility("barn")
        assert factory.radius > barn.radius

    def test_invalid_type(self):
        """Invalid facility type should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid facility_type"):
            create_facility("castle")


# --- Registry Integration ---

class TestFactoryRegistryIntegration:
    """Test that factory-created templates work with the registry."""

    def test_register_all_space_templates(self):
        """All space templates should register successfully."""
        registry = EntityTemplateRegistry()
        registry.register(create_player_ship())
        registry.register(create_asteroid("large"))
        registry.register(create_asteroid("medium"))
        registry.register(create_asteroid("small"))
        registry.register(create_enemy_fighter("basic"))
        registry.register(create_projectile("bullet"))

        assert registry.count() == 6
        assert len(registry.list_by_tag("space")) == 6

    def test_register_rpg_templates(self):
        """RPG templates should register successfully."""
        registry = EntityTemplateRegistry()
        registry.register(create_character("warrior"))
        registry.register(create_npc("merchant"))
        registry.register(create_monster("goblin"))

        assert registry.count() == 3
        assert len(registry.list_by_tag("rpg")) == 3

    def test_register_tycoon_templates(self):
        """Tycoon templates should register successfully."""
        registry = EntityTemplateRegistry()
        registry.register(create_animal("cow"))
        registry.register(create_facility("barn"))

        assert registry.count() == 2
        assert len(registry.list_by_tag("tycoon")) == 2
