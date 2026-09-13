"""
Objective Factory: Procedural Narrative Goals

Generates specific goals for locations to drive the Voyager agent's
behavior and create a sense of purpose in the story.
"""

import random
from typing import List, Dict
from game_state import Goal
from world_map import Location

OBJECTIVE_TEMPLATES = {
    "tavern": [
        {
            "id": "steal_mug",
            "desc": "Steal the legendary Golden Mug from the bar.",
            "methods": ["stealth", "finesse", "combat"],
            "targets": ["Mug", "Bartender"],
            "intent": "finesse"
        },
        {
            "id": "bribe_guard",
            "desc": "Bribe the guard to learn about the Obsidian Gate.",
            "methods": ["charm", "social", "gold"],
            "targets": ["Guard"],
            "intent": "charm"
        },
        {
            "id": "brawl",
            "desc": "Start a tavern brawl to cause a distraction.",
            "methods": ["combat", "force"],
            "targets": ["Patron", "Bartender"],
            "intent": "combat"
        },
        {
            "id": "cheat_dice",
            "desc": "Win a game of dice by cheating at the corner table.",
            "methods": ["finesse", "stealth", "intelligence"],
            "targets": ["Patron", "Dice"],
            "intent": "finesse"
        },
        {
            "id": "extort_info",
            "desc": "Corner the nervous informant and squeeze them for info.",
            "methods": ["force", "combat", "intimidation"],
            "targets": ["Informant"],
            "state": "hostile"
        }
    ],
    "plaza": [
        {
            "id": "infiltrate_noble",
            "desc": "Pickpocket the noble for a pass to the dungeon.",
            "methods": ["stealth", "finesse"],
            "targets": ["Noble"],
            "intent": "stealth"
        },
        {
            "id": "preach",
            "desc": "Gather a crowd and preach to gain followers.",
            "methods": ["charm", "social"],
            "targets": ["Merchant", "Street Urchin"],
            "intent": "charm"
        },
        {
            "id": "investigate_fountain",
            "desc": "Find the secret lever hidden in the Great Fountain.",
            "methods": ["investigate", "search"],
            "targets": ["Fountain"],
            "intent": "investigate"
        },
        {
            "id": "liberate_merchandise",
            "desc": "Liberate' some high-end silks from a distracted vendor.",
            "methods": ["stealth", "finesse"],
            "targets": ["Merchant", "Silks"],
            "intent": "stealth"
        },
        {
            "id": "stop_pickpocket",
            "desc": "Catch the street urchin before they reach the alley.",
            "methods": ["combat", "force", "intelligence"],
            "targets": ["Street Urchin"],
            "state": "hostile"
        }
    ],
    "dungeon": [
        {
            "id": "defeat_sentinel",
            "desc": "Defeat the Void Sentinel guarding the gate.",
            "methods": ["combat", "force", "magic"],
            "targets": ["Sentinel"],
            "state": "dead"
        },
        {
            "id": "unlock_gate",
            "desc": "Decode the runes on the Obsidian Gate.",
            "methods": ["investigate", "intelligence"],
            "targets": ["Gate"],
            "intent": "investigate"
        },
        {
            "id": "rescue_captive",
            "desc": "Pick the lock on the rusted iron cage.",
            "methods": ["finesse", "stealth", "force"],
            "targets": ["Cage", "Captive"],
            "intent": "finesse"
        },
        {
            "id": "collect_motes",
            "desc": "Gather glowing shadow motes from the dungeon walls.",
            "methods": ["investigate", "finesse"],
            "targets": ["Wall", "Mote"],
            "intent": "investigate"
        },
        {
            "id": "find_map",
            "desc": "Search the skeleton in the corner for a tattered map.",
            "methods": ["search", "investigate"],
            "targets": ["Skeleton", "Map"],
            "intent": "investigate"
        }
    ]
}

def create_goal_from_blueprint(g_def: Dict) -> Goal:
    """Creates a Goal object from a blueprint definition."""
    return Goal(
        id=g_def["id"],
        description=g_def["desc"],
        method_weights=g_def.get("methods", {}),
        target_tags=g_def.get("targets", []),
        required_intent=g_def.get("success_intent"),
        target_npc_state=g_def.get("success_state"),
        type="short"
    )

def generate_goals_for_location(loc_id: str, template_id: str) -> List[Goal]:
    """Generates goals for a specific location using templates or blueprints."""
    
    available = OBJECTIVE_TEMPLATES.get(template_id, OBJECTIVE_TEMPLATES["tavern"])
    num_goals = random.randint(1, 1)
    
    selected = random.sample(available, num_goals)
    goals = []
    
    for g_def in selected:
        # Map template list format to weights dictionary for backward compat
        methods = g_def.get("methods", [])
        weights = {m: 1.0 for m in methods} if isinstance(methods, list) else methods
        
        goals.append(Goal(
            id=g_def["id"],
            description=g_def["desc"],
            method_weights=weights,
            target_tags=g_def.get("targets", []),
            required_intent=g_def.get("intent"),
            target_npc_state=g_def.get("state"),
            type="short"
        ))
        
    return goals

