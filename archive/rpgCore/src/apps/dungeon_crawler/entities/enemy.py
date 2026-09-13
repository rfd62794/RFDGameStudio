from shared.items.loot_table import LootTable
from shared.items.item import Item
from shared.combat.stance import StanceController
import random

class Enemy:
    def __init__(self, id_str: str, name: str, tier: str, stats: dict[str, int], loot_table: LootTable):
        self.id = id_str
        self.name = name
        self.tier = tier  # mindless | tactical
        self.stats = stats.copy()
        
        # Ensure current hp/mp exist if only max was provided, or vice versa
        if "hp" in self.stats and "max_hp" not in self.stats:
            self.stats["max_hp"] = self.stats["hp"]
            
        self.loot_table = loot_table
        self.stance_controller = StanceController()

    def is_alive(self) -> bool:
        return self.stats.get("hp", 0) > 0

    def evaluate_stance(self) -> bool:
        new_stance = self.stance_controller.evaluate(
            self.stats.get("hp", 0), 
            self.stats.get("max_hp", 1), 
            self.tier
        )
        return self.stance_controller.transition(new_stance)

    def get_effective_stat(self, stat: str) -> int:
        base_val = self.stats.get(stat, 0)
        return self.stance_controller.effective_stat(base_val, stat)

    def should_flee(self) -> bool:
        flee_chance = self.stance_controller.get_modifiers().flee_chance
        if flee_chance <= 0.0:
            return False
        return random.random() < flee_chance

    def get_loot(self, depth: int = 1) -> Item | None:
        """Returns instantiated Item from the loot table, or None."""
        return self.loot_table.roll(depth)

