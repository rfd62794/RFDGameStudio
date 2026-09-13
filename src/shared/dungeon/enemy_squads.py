from dataclasses import dataclass, field
from src.shared.genetics.genome import SlimeGenome as Genome
from src.shared.genetics.cultural_archetypes import CulturalArchetype
import random

@dataclass
class EnemySlime:
    name:     str
    genome:   Genome
    level:    int
    max_hp:   int
    current_hp: int = 0
    
    def __post_init__(self):
        self.current_hp = self.max_hp

@dataclass  
class EnemySquad:
    name:    str          # "The Thorn Pack"
    members: list[EnemySlime]
    threat:  str          # "low" "medium" "high" "boss"

# Pre-defined squad templates:
SQUAD_TEMPLATES = [
    {
        "name": "Lone Wanderer",
        "threat": "low",
        "size": 1,
        "culture": CulturalArchetype.MARSH,
        "level_range": (1, 2),
    },
    {
        "name": "The Thorn Pack",
        "threat": "medium",
        "size": 3,
        "culture": CulturalArchetype.MARSH,
        "level_range": (1, 3),
    },
    {
        "name": "Ember Warband",
        "threat": "medium",
        "size": 2,
        "culture": CulturalArchetype.EMBER,
        "level_range": (2, 4),
    },
    {
        "name": "Void Sentinels",
        "threat": "high",
        "size": 4,
        "culture": CulturalArchetype.VOID,
        "level_range": (3, 5),
    },
    {
        "name": "Crystal Guard",
        "threat": "high",
        "size": 2,
        "culture": CulturalArchetype.CRYSTAL,
        "level_range": (4, 6),
    },
    {
        "name": "Swarm of Pips",
        "threat": "medium",
        "size": 5,
        "culture": CulturalArchetype.TUNDRA,
        "level_range": (1, 2),
    },
]

BOSS_TEMPLATES = [
    {
        "name": "The Colossus",
        "threat": "boss",
        "size": 1,
        "culture": CulturalArchetype.EMBER,
        "level_range": (8, 10),
    },
    {
        "name": "The Void Council",
        "threat": "boss", 
        "size": 3,
        "culture": CulturalArchetype.VOID,
        "level_range": (6, 8),
    },
]

def generate_squad(template: dict, 
                   rng: random.Random) -> EnemySquad:
    members = []
    # Use Genome.random_for_culture if available, else generate_random() from genetics
    # Since Step 3 (Genome update) hasn't happened yet, I'll use a placeholder or wait
    # Actually, the user's snippet uses Genome.random_for_culture. I should implement that in Step 3 soon.
    # For Step 2 verification, I'll define a dummy Genome.random_for_culture or implement it now.
    
    from src.shared.genetics import generate_random
    
    for i in range(template["size"]):
        level = rng.randint(*template["level_range"])
        # Placeholder for Genome.random_for_culture
        if hasattr(Genome, 'random_for_culture'):
            genome = Genome.random_for_culture(
                template["culture"].value, seed=rng.randint(0, 99999)
            )
        else:
            genome = generate_random()
            genome.cultural_base = template["culture"].value
            
        hp = 15 + level * 5
        members.append(EnemySlime(
            name=f"{template['name']} {i+1}" 
                 if template['size'] > 1 
                 else template['name'],
            genome=genome,
            level=level,
            max_hp=hp,
        ))
    return EnemySquad(
        name=template["name"],
        members=members,
        threat=template["threat"],
    )

def generate_boss_squad(rng: random.Random) -> EnemySquad:
    template = rng.choice(BOSS_TEMPLATES)
    return generate_squad(template, rng)

def generate_combat_squad(depth: int,
                          rng: random.Random) -> EnemySquad:
    # Filter by threat appropriate to depth
    if depth <= 2:
        eligible = [t for t in SQUAD_TEMPLATES 
                   if t["threat"] in ("low", "medium")]
    else:
        eligible = SQUAD_TEMPLATES
    return generate_squad(rng.choice(eligible), rng)
