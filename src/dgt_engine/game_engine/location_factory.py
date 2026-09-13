"""
Location Factory: Procedural Scene Generation

Generates varied game areas from templates to provide a 
'living world' experience with randomized tags and NPCs.
"""

import random
from typing import List, Dict, Optional
from world_map import Location, WorldObject

# --- Theoretical Pools ---

ROOM_TEMPLATES = {
    "tavern": {
        "names": ["The Rusty Flagon", "The Drunken Dragon", "The Silver Tankard", "The Boar's Snout"],
        "tags": ["Sticky Floors", "Rowdy Crowd", "Dimly Lit", "Loud", "Smoky"],
        "props": [
            {"name": "Wooden Table", "desc": "A heavy oak table"},
            {"name": "Beer Mug", "desc": "A frothy mug of ale", "stat": "strength", "mod": 1},
            {"name": "Hearth", "desc": "A crackling stone fireplace"}
        ],
        "npcs": ["Bartender", "Patron", "Minstrel", "Guard"]
    },
    "plaza": {
        "names": ["Grand Plaza", "Merchant's Square", "Sun-Drenched Court", "Gleaming Circle"],
        "tags": ["Crowded", "Marble Floors", "Open Space", "Sunlight", "Bustling"],
        "props": [
            {"name": "Fountain", "desc": "A sparkling water feature"},
            {"name": "Fruit Stand", "desc": "A colorful display of produce"},
            {"name": "Statue", "desc": "A monument to a local hero"}
        ],
        "npcs": ["Merchant", "Noble", "Street Urchin", "Town Crier"]
    },
    "dungeon": {
        "names": ["The Obsidian Maw", "Shadowed Ruins", "Echoing Catacombs", "The Iron Keep"],
        "tags": ["Ominous", "Cold Wind", "Dripping Water", "Magic Residue", "Crumbling Walls"],
        "props": [
            {"name": "Stone Altar", "desc": "A dark slab of rock"},
            {"name": "Rusted Lever", "desc": "A mechanism covered in grime"},
            {"name": "Iron Sconce", "desc": "A torch holder bolted to the wall"}
        ],
        "npcs": ["Skeleton", "Shadow", "Sentinel", "Cultist"]
    }
}

def generate_location(template_id: str, loc_id: str) -> Location:
    """Procedurally generates a location based on a template."""
    
    template = ROOM_TEMPLATES.get(template_id, ROOM_TEMPLATES["tavern"])
    
    name = random.choice(template["names"])
    
    # Pick 2-3 random tags
    num_tags = random.randint(2, 3)
    tags = random.sample(template["tags"], num_tags)
    
    # Pick 2-3 random props
    num_props = random.randint(2, 3)
    prop_defs = random.sample(template["props"], num_props)
    props = []
    for i, p_def in enumerate(prop_defs):
        props.append(WorldObject(
            id=f"{loc_id}_p{i}",
            name=p_def["name"],
            description=p_def["desc"],
            target_stat=p_def.get("stat"),
            modifier_value=p_def.get("mod", 0)
        ))
        
    # Pick 1-2 random NPCs
    num_npcs = random.randint(1, 2)
    npcs = random.sample(template["npcs"], num_npcs)
    
    return Location(
        id=loc_id,
        name=name,
        description=f"A typical {template_id} known as {name}. {random.choice(template['tags'])} permeates the area.",
        environment_tags=tags,
        props=props,
        initial_npcs=npcs
    )

def create_dynamic_world() -> Dict[str, Location]:
    """Creates a basic 3-room world map using procedural generation."""
    
    world = {}
    
    # Generate 3 locations
    world["tavern"] = generate_location("tavern", "tavern")
    world["plaza"] = generate_location("plaza", "plaza")
    world["dungeon"] = generate_location("dungeon", "dungeon")
    
    # Link them
    world["tavern"].connections = {"north": "plaza"}
    world["plaza"].connections = {"south": "tavern", "north": "dungeon"}
    world["dungeon"].connections = {"south": "plaza"}
    
    return world
