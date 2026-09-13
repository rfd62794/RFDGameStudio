import random
from .item import Item

class LootTable:
    """Handles weighted random item generation with depth-based scaling."""
    
    def __init__(self):
        self.entries: list[dict] = []  # List of {"template": dict/Item, "weight": float}

    def add_entry(self, item_template: Item, weight: float) -> None:
        """Adds a potential item drop with a relative weight."""
        self.entries.append({"template": item_template, "weight": weight})

    def roll(self, depth: int) -> Item | None:
        """
        Rolls against the loot table, returning an instantiated Item or None.
        Depth can be used to scale stats or drop rates in future passes.
        """
        if not self.entries:
            return None
            
        weights = [entry["weight"] for entry in self.entries]
        total_weight = sum(weights)
        
        # If total weight is very low or 0, avoid exceptions
        if total_weight <= 0:
            return None

        # Choose a random template based on weights
        chosen_entry = random.choices(self.entries, weights=weights, k=1)[0]
        template = chosen_entry["template"]
        
        # Create a new instance so modifications (like identifying) don't affect the table
        # We manually copy rather than deepcopying to keep things simple
        return Item(
            id=template.id,
            name=template.name,
            description=template.description,
            item_type=template.item_type,
            slot=template.slot,
            stat_modifiers=template.stat_modifiers.copy(),
            value=template.value,
            identified=template.identified
        )
