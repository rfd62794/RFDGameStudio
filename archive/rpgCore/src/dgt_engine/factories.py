"""
Factories for Character Archetypes and Location Templates.
Enables rapid scenario prototyping and diverse Voyager behaviors.
"""

from typing import Dict, List
from game_state import PlayerStats, Room, NPC, Goal, Item
from objective_factory import generate_goals_for_location

class CharacterFactory:
    """Generates PlayerStats based on character archetypes."""
    
    ARCHETYPES = {
        "aggressive": {
            "name": "Warrior",
            "attributes": {"strength": 10, "dexterity": 2, "intelligence": -2, "charisma": -2},
            "gold": 20
        },
        "cunning": {
            "name": "Thief",
            "attributes": {"strength": -2, "dexterity": 10, "intelligence": 5, "charisma": 2},
            "gold": 100
        },
        "diplomatic": {
            "name": "Negotiator",
            "attributes": {"strength": -5, "dexterity": 0, "intelligence": 5, "charisma": 10},
            "gold": 200
        }
    }
    
    @classmethod
    def create(cls, archetype_name: str) -> PlayerStats:
        config = cls.ARCHETYPES.get(archetype_name.lower(), cls.ARCHETYPES["aggressive"])
        return PlayerStats(
            name=config["name"],
            attributes=config["attributes"],
            gold=config["gold"]
        )

import json
from pathlib import Path

class ScenarioFactory:
    """Generates a sequence of locations and goals (Story Frames) from JSON."""
    
    @classmethod
    def load_act(cls, act_id: str) -> Dict:
        """Load a scenario blueprint from JSON."""
        # Standardize path: scenario_{act_id}.json in root
        blueprint_path = Path(f"scenario_{act_id}.json")
        if not blueprint_path.exists():
            logger.error(f"Blueprint not found: {blueprint_path}")
            return {}
            
        try:
            with open(blueprint_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading blueprint {act_id}: {e}")
            return {}

    @classmethod
    def get_heist_story(cls) -> Dict:
        """Legacy wrapper for heist blueprint."""
        return cls.load_act("heist")

