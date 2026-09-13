"""
Voyager Logic: Deterministic Action Library (The Rails)

Pre-baked D&D archetypes to prevent "Decision Paralysis" in small LLMs.
"""

STANDARD_ACTIONS = {
    "aggressive": [
        {"id": "force", "label": "Intimidate the guard", "stat": "strength"},
        {"id": "combat", "label": "Start a brawl", "stat": "strength"},
        {"id": "investigate", "label": "Search for weapons", "stat": "intelligence"},
        {"id": "leave_area", "label": "Leave this place", "stat": "dexterity"}
    ],
    "curious": [
        {"id": "charm", "label": "Talk to the bartender", "stat": "charisma"},
        {"id": "investigate", "label": "Examine the rowdy crowd", "stat": "intelligence"},
        {"id": "finesse", "label": "Eavesdrop on conversations", "stat": "dexterity"},
        {"id": "leave_area", "label": "Leave this place", "stat": "dexterity"}
    ],
    "tactical": [
        {"id": "finesse", "label": "Find the exit", "stat": "dexterity"},
        {"id": "investigate", "label": "Identify the strongest patron", "stat": "intelligence"},
        {"id": "distract", "label": "Cause a small commotion", "stat": "charisma"},
        {"id": "leave_area", "label": "Leave this place", "stat": "dexterity"}
    ],
    "chaotic": [
        {"id": "distract", "label": "Flip a table", "stat": "strength"},
        {"id": "charm", "label": "Buy everyone a round", "stat": "charisma"},
        {"id": "finesse", "label": "Pickpocket a patron", "stat": "dexterity"},
        {"id": "leave_area", "label": "Leave this place", "stat": "dexterity"}
    ],
    "cunning": [
        {"id": "stealth", "label": "Slip into the shadows", "stat": "dexterity"},
        {"id": "finesse", "label": "Pick the lock", "stat": "dexterity"},
        {"id": "investigate", "label": "Search for a secret passage", "stat": "intelligence"},
        {"id": "leave_area", "label": "Leave this place", "stat": "dexterity"}
    ],
    "diplomatic": [
        {"id": "charm", "label": "Negotiate a truce", "stat": "charisma"},
        {"id": "social", "label": "De-escalate the tension", "stat": "charisma"},
        {"id": "investigate", "label": "Look for shared interests", "stat": "intelligence"},
        {"id": "leave_area", "label": "Leave this place", "stat": "dexterity"}
    ]
}
