"""
World Map Engine: Schema-Driven Locations and Props

Standardizes how game areas and objects are structured to enable 
deterministic navigation and narrative grounding.
"""

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class WorldObject(BaseModel):
    """A 'Prop' in the scene that the player can interact with."""
    id: str
    name: str
    description: str
    target_stat: Optional[str] = None
    modifier_value: int = 0
    is_lootable: bool = False
    tags: List[str] = Field(default_factory=list)


class Location(BaseModel):
    """A 'Set' or scene in the game world."""
    id: str
    name: str
    description: str
    environment_tags: List[str] = Field(default_factory=list)
    connections: Dict[str, str] = Field(default_factory=dict) # direction -> location_id
    props: List[WorldObject] = Field(default_factory=list)
    initial_npcs: List[str] = Field(default_factory=list) # IDs or names to spawn


def get_dynamic_tags(reputation: dict) -> list[str]:
    """Generates environmental tags based on global reputation."""
    tags = []
    law_rep = reputation.get("law", 0)
    
    if law_rep <= -10:
        tags.append("Wanted Posters")
    if law_rep <= -20:
        tags.append("Heavy Guard Presence")
    elif law_rep >= 10:
        tags.append("Friendly Guards")
        
    return tags


def create_starter_campaign() -> Dict[str, Location]:
    """
    Creates the 'Starter Campaign' sequence:
    Tavern -> Plaza -> Dungeon Entrance
    """
    
    world = {}
    
    # 1. The Tavern (The Start)
    world["tavern"] = Location(
        id="tavern",
        name="The Rusty Flagon",
        description="A dimly lit tavern filled with the smell of ale and roasted meat. Rowdy patrons fill the wooden tables.",
        environment_tags=["Sticky Floors", "Rowdy Crowd", "Dimly Lit"],
        connections={"north": "plaza"},
        props=[
            WorldObject(id="mug", name="Beer Mug", description="A heavy ceramic mug", target_stat="strength", modifier_value=1),
            WorldObject(id="table", name="Wooden Table", description="A rough-hewn oak table")
        ],
        initial_npcs=["Guard", "Bartender"]
    )
    
    # 2. Emerald City Plaza (The Transition)
    world["plaza"] = Location(
        id="plaza",
        name="Emerald City Plaza",
        description="A gleaming plaza paved with green marble. Fountains sparkle in the sunlight, and well-dressed citizens hurry past.",
        environment_tags=["Rainy", "Crowded", "Marble Floors"],
        connections={"south": "tavern", "north": "dungeon_gate"},
        props=[
            WorldObject(id="fountain", name="Great Fountain", description="A majestic fountain spraying crystal water"),
            WorldObject(id="statue", name="Hero Statue", description="A bronze statue of a fallen warrior")
        ],
        initial_npcs=["Street Urchin", "Merchant"]
    )
    
    # 3. Dungeon Entrance (The Climax)
    world["dungeon_gate"] = Location(
        id="dungeon_gate",
        name="The Obsidian Gate",
        description="A massive door of black stone stands at the base of the cliffs. Runes glow with a faint, ominous purple light.",
        environment_tags=["Ominous", "Magic Residue", "Cold Wind"],
        connections={"south": "plaza"},
        props=[
            WorldObject(id="gate", name="Obsidian Gate", description="The entrance to the deep dark"),
            WorldObject(id="skeleton", name="Ancient Skeleton", description="A pile of bones clutching a rusted blade", is_lootable=True)
        ],
        initial_npcs=["Void Sentinel"]
    )
    
    return world
