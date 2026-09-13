import random
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from loguru import logger
from src.apps.slime_clan.auto_battle import SlimeUnit, Shape, Hat, create_slime, TileState
from src.shared.combat.d20_resolver import D20Resolver

@dataclass
class Colony:
    id: str
    name: str
    x: int
    y: int
    coord: tuple[int, int]
    node_type: Any # NodeType enum
    connections: List[str]
    faction: Optional[str] = None
    original_faction: Optional[str] = None
    population: int = 10
    morale: int = 100
    relations: Dict[str, int] = field(default_factory=lambda: {"CLAN_BLUE": 0, "CLAN_RED": 0, "CLAN_YELLOW": 0, "ASTRONAUT": 20})
    units: List[SlimeUnit] = field(default_factory=list)
    map_seed: int = field(default_factory=lambda: random.randint(0, 999999))
    history: List[str] = field(default_factory=list)
    last_action_day: int = 1 # Tracking for passive sympathy decay
    hidden: bool = False
    hidden_turns: int = 0

class ColonyManager:
    def __init__(self, node_type_enum):
        self.colonies: Dict[str, Colony] = {}
        self.node_type_enum = node_type_enum
        self.name_pool = ["Mire", "Fenwick", "Ashroot", "Bramble", "Gust", "Ember", "Tide", "Cinder", "Reed", "Marsh"]
        self.resolver = D20Resolver()

    def create_colony(self, id: str, name: str, x: int, y: int, coord: tuple[int, int], node_type: Any, connections: List[str], faction: Optional[str] = None) -> Colony:
        colony = Colony(
            id=id,
            name=name,
            x=x,
            y=y,
            coord=coord,
            node_type=node_type,
            connections=connections,
            faction=faction,
            original_faction=faction
        )
        self.colonies[id] = colony
        
        # Generate named units for Unbound tribes
        if faction == "CLAN_YELLOW":
            self._generate_tribal_units(colony)
            
        return colony

    def _generate_tribal_units(self, colony: Colony):
        # Generate 3 named units
        available_names = list(self.name_pool)
        random.shuffle(available_names)
        
        for i in range(3):
            name = available_names.pop()
            shape = random.choice(list(Shape))
            hat = random.choice(list(Hat))
            unit = create_slime(f"{colony.id}_{name}", name, TileState.BLUE, shape, hat, is_player=True)
            # Astronaut sympathy starts at 20
            setattr(unit, "sympathy", 20)
            colony.units.append(unit)
        colony.history.append(f"Colony founded by {colony.original_faction}. Tribal units gathered.")

    def modify_sympathy(self, unit: SlimeUnit, amount: int, reason: str, colony: Optional[Colony] = None):
        """Adjust a unit's sympathy toward the player (0-100)."""
        current = getattr(unit, "sympathy", 20)
        new_val = max(0, min(100, current + amount))
        setattr(unit, "sympathy", new_val)
        direction = "grows" if amount > 0 else "withers"
        log_msg = f"{unit.name}'s trust in you {direction} ({reason}). (Sympathy: {new_val}/100)"
        logger.info(log_msg)
        if colony:
            colony.history.append(log_msg)
        return log_msg

    def apply_passive_decay(self, current_day: int):
        """Decrease sympathy by 1 for all units if 3 days passed without player interaction."""
        for colony in self.colonies.values():
            if colony.faction == "CLAN_BLUE": continue # Player-owned colonies immune
            
            days_since = current_day - colony.last_action_day
            if days_since >= 3 and days_since % 3 == 0:
                for unit in colony.units:
                    self.modify_sympathy(unit, -1, "passive decay", colony)

    def check_defections(self) -> List[Dict[str, Any]]:
        """Run defection rolls for all non-player colonies. Returns list of defection results."""
        defections = []
        for colony in self.colonies.values():
            if colony.faction == "CLAN_BLUE": continue
            
            for unit in list(colony.units): # Iterate over a copy because we remove units
                sympathy = getattr(unit, "sympathy", 0)
                if sympathy > 60:
                    # Roll D20 against sympathy score (higher sympathy = easier roll)
                    # We interpret this as: Roll >= (100 - sympathy) / 5 + 5? 
                    # Actually user said: "roll D20 against sympathy score"
                    # Usually this means roll + bonus > DC. 
                    # Let's say DC 25 - (sympathy/5). 
                    # If sympathy 100, DC 5. If sympathy 60, DC 13.
                    dc = max(5, 25 - (sympathy // 5))
                    result = self.resolver.ability_check(modifier=0, difficulty_class=dc)
                    
                    if result.success:
                        colony.units.remove(unit)
                        # Initialize loyalty for defectors
                        setattr(unit, "loyalty", 50)
                        
                        # Defected units bring faction traits
                        # (Assume Red favors Swords, Blue favors Shields)
                        if colony.original_faction == "CLAN_RED":
                            unit.hat = Hat.SWORD
                        elif colony.original_faction == "CLAN_BLUE":
                            unit.hat = Hat.SHIELD
                            
                        defections.append({
                            "unit": unit,
                            "from_colony": colony.name,
                            "from_faction": colony.faction
                        })
                        logger.success(f"🤝 Defection! {unit.name} has left {colony.name} to join the Astronaut.")
                    else:
                        # Failed roll increases sympathy (getting closer)
                        self.modify_sympathy(unit, 2, "failed defection roll", colony)
        return defections

    def get_colony(self, id: str) -> Optional[Colony]:
        return self.colonies.get(id)

    def get_owner(self, coord: tuple[int, int]) -> Optional[str]:
        for colony in self.colonies.values():
            if colony.coord == coord:
                return colony.faction
        return None

    def set_owner(self, coord: tuple[int, int], faction: Optional[str]):
        for colony in self.colonies.values():
            if colony.coord == coord:
                colony.faction = faction
                break

    def keys(self):
        return self.colonies.keys()

    def values(self):
        return self.colonies.values()

    def items(self):
        return self.colonies.items()

    def __iter__(self):
        return iter(self.colonies)

    def __getitem__(self, key):
        return self.colonies[key]

    def __contains__(self, key):
        return key in self.colonies

    def __len__(self):
        return len(self.colonies)
