from src.shared.items.inventory import Inventory

class Hero:
    def __init__(self, name: str, class_type: str):
        self.name = name
        self.class_type = class_type
        # Base stats scaling based on class_type (fighter | mage | rogue)
        self.stats = {
            "hp": 20, "max_hp": 20,
            "mp": 10, "max_mp": 10,
            "attack": 5, "defense": 5,
            "speed": 5, "magic": 5
        }
        self.inventory = Inventory(capacity=20)
        self.xp = 0
        self.level = 1
        
        self._apply_class_bonuses()

    def _apply_class_bonuses(self):
        if self.class_type == "fighter":
            self.stats["max_hp"] += 10
            self.stats["hp"] = self.stats["max_hp"]
            self.stats["attack"] += 3
            self.stats["defense"] += 3
            self.stats["speed"] -= 2
        elif self.class_type == "mage":
            self.stats["max_mp"] += 10
            self.stats["mp"] = self.stats["max_mp"]
            self.stats["magic"] += 5
            self.stats["defense"] -= 2
        elif self.class_type == "rogue":
            self.stats["speed"] += 5
            self.stats["attack"] += 2
            self.stats["defense"] -= 1

    def gain_xp(self, amount: int) -> bool:
        """Adds XP and handles level ups. Returns True if leveled up."""
        self.xp += amount
        xp_needed = self.level * 100
        leveled_up = False
        while self.xp >= xp_needed:
            self.xp -= xp_needed
            self.level_up()
            leveled_up = True
            xp_needed = self.level * 100
        return leveled_up

    def level_up(self) -> None:
        """Scales stats based on class archetype."""
        self.level += 1
        
        # General slight bump across the board
        for stat in ["max_hp", "max_mp", "attack", "defense", "speed", "magic"]:
            self.stats[stat] += 1
            
        # Class specific focused bumps
        if self.class_type == "fighter":
            self.stats["max_hp"] += 3
            self.stats["attack"] += 2
            self.stats["defense"] += 2
        elif self.class_type == "mage":
            self.stats["max_mp"] += 3
            self.stats["magic"] += 3
        elif self.class_type == "rogue":
            self.stats["speed"] += 3
            self.stats["attack"] += 1

        # Heal on level up
        self.stats["hp"] = self.stats["max_hp"]
        self.stats["mp"] = self.stats["max_mp"]

    def is_alive(self) -> bool:
        return self.stats["hp"] > 0

    def effective_stat(self, stat: str) -> int:
        """Returns base stat + equipment modifiers."""
        base = self.stats.get(stat, 0)
        equip_bonus = self.inventory.get_stat_total(stat)
        return base + equip_bonus
