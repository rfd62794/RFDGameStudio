"""
Entity Factories - Convenience factory functions for creating entity templates.

SOLID Principle: Factory Pattern
- Each factory creates a pre-configured EntityTemplate
- Templates can be registered in EntityTemplateRegistry for reuse
- Factory methods encapsulate game-specific entity definitions

Usage:
    template = create_asteroid("large")
    registry.register(template)
    entity = manager.spawn_from_template("asteroid_large")
"""

from typing import Dict, Any
from src.game_engine.foundation.asset_system.entity_templates import EntityTemplate


def _get_preset(presets: Dict[str, Dict[str, Any]], key: str, preset_type: str) -> Dict[str, Any]:
    """Retrieve preset or raise ValueError with valid options."""
    if key not in presets:
        valid_options = ", ".join(presets.keys())
        raise ValueError(f"Invalid {preset_type} '{key}'. Expected: {valid_options}")
    return presets[key]


def _validate_level(level: int, min_level: int = 1, max_level: int = 100) -> None:
    """Validate level is within range."""
    if level < min_level or level > max_level:
        raise ValueError(f"Level must be {min_level}-{max_level}, got {level}")


# --- Space Game Factories ---

def create_player_ship(
    template_id: str = "player_ship",
    acceleration: float = 50.0,
    max_velocity: float = 300.0,
    health: int = 100,
) -> EntityTemplate:
    """Create a player ship template for space games."""
    return EntityTemplate(
        template_id=template_id,
        entity_type="ship",
        display_name="Player Ship",
        radius=8.0,
        mass=2.0,
        max_velocity=max_velocity,
        acceleration=acceleration,
        friction=0.02,
        health=health,
        damage=0,
        score_value=0,
        collision_group="player",
        tags=["space", "player", "ship"],
        description="Player-controlled ship with thrust and rotation",
    )


def create_asteroid(
    size: str = "large",
    template_id: str = "",
) -> EntityTemplate:
    """
    Create an asteroid template.

    Args:
        size: "small", "medium", or "large"
        template_id: Custom ID (defaults to "asteroid_{size}")
    """
    presets = {
        "small": {"radius": 5.0, "mass": 1.0, "health": 20, "score_value": 100, "max_velocity": 150.0},
        "medium": {"radius": 12.0, "mass": 3.0, "health": 40, "score_value": 50, "max_velocity": 100.0},
        "large": {"radius": 20.0, "mass": 5.0, "health": 60, "score_value": 25, "max_velocity": 60.0},
    }

    props = _get_preset(presets, size, "asteroid size")
    resolved_id = template_id or f"asteroid_{size}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="asteroid",
        display_name=f"{size.capitalize()} Asteroid",
        radius=props["radius"],
        mass=props["mass"],
        max_velocity=props["max_velocity"],
        health=props["health"],
        damage=10,
        score_value=props["score_value"],
        collision_group="asteroid",
        tags=["space", "asteroid", size],
        description=f"{size.capitalize()} asteroid that splits on destruction",
    )


def create_enemy_fighter(
    ai_type: str = "basic",
    template_id: str = "",
) -> EntityTemplate:
    """
    Create an enemy fighter template.

    Args:
        ai_type: AI behavior type ("basic", "aggressive", "evasive")
        template_id: Custom ID (defaults to "enemy_{ai_type}")
    """
    presets = {
        "basic": {"health": 30, "damage": 15, "max_velocity": 200.0, "acceleration": 30.0, "score_value": 200},
        "aggressive": {"health": 50, "damage": 25, "max_velocity": 250.0, "acceleration": 40.0, "score_value": 350},
        "evasive": {"health": 20, "damage": 10, "max_velocity": 350.0, "acceleration": 60.0, "score_value": 300},
    }

    props = _get_preset(presets, ai_type, "ai_type")
    resolved_id = template_id or f"enemy_{ai_type}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="enemy",
        display_name=f"{ai_type.capitalize()} Fighter",
        radius=7.0,
        mass=1.5,
        max_velocity=props["max_velocity"],
        acceleration=props["acceleration"],
        health=props["health"],
        damage=props["damage"],
        score_value=props["score_value"],
        collision_group="enemy",
        tags=["space", "enemy", ai_type],
        custom_properties={"ai_type": ai_type},
        description=f"Enemy fighter with {ai_type} AI behavior",
    )


def create_projectile(
    weapon_type: str = "bullet",
    template_id: str = "",
) -> EntityTemplate:
    """
    Create a projectile template.

    Args:
        weapon_type: "bullet", "missile", or "laser"
        template_id: Custom ID (defaults to "projectile_{weapon_type}")
    """
    presets = {
        "bullet": {"radius": 2.0, "mass": 0.1, "damage": 25, "max_velocity": 500.0},
        "missile": {"radius": 4.0, "mass": 0.5, "damage": 75, "max_velocity": 300.0},
        "laser": {"radius": 1.0, "mass": 0.0, "damage": 15, "max_velocity": 800.0},
    }

    props = _get_preset(presets, weapon_type, "weapon_type")
    resolved_id = template_id or f"projectile_{weapon_type}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="projectile",
        display_name=f"{weapon_type.capitalize()}",
        radius=props["radius"],
        mass=props["mass"],
        max_velocity=props["max_velocity"],
        health=1,
        damage=props["damage"],
        score_value=0,
        collision_group="projectile",
        tags=["space", "projectile", weapon_type],
        description=f"{weapon_type.capitalize()} projectile",
    )


# --- RPG Game Factories ---

def create_character(
    class_type: str = "warrior",
    level: int = 1,
    template_id: str = "",
) -> EntityTemplate:
    """
    Create an RPG character template.

    Args:
        class_type: "warrior", "mage", or "rogue"
        level: Starting level (1-100)
        template_id: Custom ID
    """
    _validate_level(level)

    presets = {
        "warrior": {"health": 120 + (level * 10), "damage": 15 + (level * 2), "radius": 6.0, "mass": 3.0, "max_velocity": 150.0},
        "mage": {"health": 70 + (level * 5), "damage": 25 + (level * 3), "radius": 5.0, "mass": 1.5, "max_velocity": 120.0},
        "rogue": {"health": 90 + (level * 7), "damage": 20 + (level * 2), "radius": 5.0, "mass": 2.0, "max_velocity": 200.0},
    }

    props = _get_preset(presets, class_type, "class_type")
    resolved_id = template_id or f"character_{class_type}_lv{level}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="character",
        display_name=f"Level {level} {class_type.capitalize()}",
        radius=props["radius"],
        mass=props["mass"],
        max_velocity=props["max_velocity"],
        health=props["health"],
        damage=props["damage"],
        collision_group="player",
        tags=["rpg", "character", class_type],
        custom_properties={"class_type": class_type, "level": level},
        description=f"Level {level} {class_type} character",
    )


def create_npc(
    role: str = "villager",
    template_id: str = "",
) -> EntityTemplate:
    """
    Create an NPC template.

    Args:
        role: "villager", "merchant", "guard", or "quest_giver"
        template_id: Custom ID
    """
    presets = {
        "villager": {"health": 50, "max_velocity": 60.0},
        "merchant": {"health": 60, "max_velocity": 40.0},
        "guard": {"health": 150, "max_velocity": 100.0},
        "quest_giver": {"health": 80, "max_velocity": 50.0},
    }

    props = _get_preset(presets, role, "NPC role")
    resolved_id = template_id or f"npc_{role}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="npc",
        display_name=f"{role.replace('_', ' ').capitalize()}",
        radius=5.0,
        mass=2.0,
        max_velocity=props["max_velocity"],
        health=props["health"],
        damage=0,
        collision_enabled=False,
        collision_group="npc",
        tags=["rpg", "npc", role],
        custom_properties={"role": role},
        description=f"NPC with {role} role",
    )


def create_monster(
    species: str = "goblin",
    level: int = 1,
    template_id: str = "",
) -> EntityTemplate:
    """
    Create a monster template.

    Args:
        species: "goblin", "skeleton", "dragon"
        level: Monster level (1-100)
        template_id: Custom ID
    """
    _validate_level(level)

    presets = {
        "goblin": {"health": 30 + (level * 5), "damage": 8 + (level * 2), "radius": 4.0, "max_velocity": 120.0, "score_value": 50 + (level * 10)},
        "skeleton": {"health": 40 + (level * 6), "damage": 12 + (level * 2), "radius": 5.0, "max_velocity": 80.0, "score_value": 75 + (level * 15)},
        "dragon": {"health": 200 + (level * 20), "damage": 50 + (level * 5), "radius": 25.0, "max_velocity": 200.0, "score_value": 500 + (level * 50)},
    }

    props = _get_preset(presets, species, "species")
    resolved_id = template_id or f"monster_{species}_lv{level}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="monster",
        display_name=f"Level {level} {species.capitalize()}",
        radius=props["radius"],
        mass=3.0,
        max_velocity=props["max_velocity"],
        health=props["health"],
        damage=props["damage"],
        score_value=props["score_value"],
        collision_group="enemy",
        tags=["rpg", "monster", species],
        custom_properties={"species": species, "level": level},
        description=f"Level {level} {species} monster",
    )


# --- Tycoon Game Factories ---

def create_animal(
    species: str = "cow",
    template_id: str = "",
) -> EntityTemplate:
    """
    Create a tycoon animal template.

    Args:
        species: "cow", "chicken", "pig", "sheep"
        template_id: Custom ID
    """
    presets = {
        "cow": {"radius": 8.0, "mass": 10.0, "health": 200, "max_velocity": 30.0},
        "chicken": {"radius": 3.0, "mass": 1.0, "health": 50, "max_velocity": 50.0},
        "pig": {"radius": 6.0, "mass": 6.0, "health": 150, "max_velocity": 35.0},
        "sheep": {"radius": 5.0, "mass": 4.0, "health": 120, "max_velocity": 40.0},
    }

    props = _get_preset(presets, species, "species")
    resolved_id = template_id or f"animal_{species}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="animal",
        display_name=species.capitalize(),
        radius=props["radius"],
        mass=props["mass"],
        max_velocity=props["max_velocity"],
        health=props["health"],
        damage=0,
        collision_group="animal",
        tags=["tycoon", "animal", species],
        custom_properties={"species": species},
        description=f"{species.capitalize()} farm animal",
    )


def create_facility(
    facility_type: str = "barn",
    template_id: str = "",
) -> EntityTemplate:
    """
    Create a tycoon facility template.

    Args:
        facility_type: "barn", "factory", "store", "warehouse"
        template_id: Custom ID
    """
    presets = {
        "barn": {"radius": 20.0, "mass": 100.0, "health": 500},
        "factory": {"radius": 30.0, "mass": 200.0, "health": 800},
        "store": {"radius": 15.0, "mass": 80.0, "health": 400},
        "warehouse": {"radius": 25.0, "mass": 150.0, "health": 600},
    }

    props = _get_preset(presets, facility_type, "facility_type")
    resolved_id = template_id or f"facility_{facility_type}"

    return EntityTemplate(
        template_id=resolved_id,
        entity_type="facility",
        display_name=facility_type.capitalize(),
        radius=props["radius"],
        mass=props["mass"],
        max_velocity=0.0,
        health=props["health"],
        damage=0,
        collision_group="structure",
        tags=["tycoon", "facility", facility_type],
        custom_properties={"facility_type": facility_type},
        description=f"{facility_type.capitalize()} facility",
    )
