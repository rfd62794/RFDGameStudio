from .item import Item

class Inventory:
    """Manages equipped slots, backpack storage, and gold economy for an entity."""
    
    VALID_SLOTS = {"weapon", "offhand", "head", "body", "accessory"}

    def __init__(self, capacity: int = 20):
        self.slots: dict[str, Item | None] = {slot: None for slot in self.VALID_SLOTS}
        self.backpack: list[Item] = []
        self.gold: int = 0
        self.capacity: int = capacity

    def equip(self, item: Item) -> Item | None:
        """Equips an item to its designated slot, returning any displaced item."""
        if item.slot not in self.VALID_SLOTS:
            raise ValueError(f"Cannot equip item to invalid slot: {item.slot}")
        
        displaced = self.slots[item.slot]
        self.slots[item.slot] = item
        return displaced

    def unequip(self, slot: str) -> Item | None:
        """Removes and returns the item from the given slot, leaving it empty."""
        if slot not in self.VALID_SLOTS:
            return None
        
        item = self.slots[slot]
        self.slots[slot] = None
        return item

    def add_to_backpack(self, item: Item) -> bool:
        """Adds an item to the backpack. Returns False if full."""
        if len(self.backpack) >= self.capacity:
            return False
            
        self.backpack.append(item)
        return True

    def remove_from_backpack(self, item_id: str) -> bool:
        """Removes the first instance of an item by ID from the backpack. Returns True if found."""
        for i, item in enumerate(self.backpack):
            if item.id == item_id:
                self.backpack.pop(i)
                return True
        return False

    def get_stat_total(self, stat: str) -> int:
        """Returns the sum of a specific stat from all actively equipped items."""
        total = 0
        for slot_item in self.slots.values():
            if slot_item is not None:
                # Use actual stats regardless of identification, or only active when identified?
                # Usually equip limits identify, but if equipped we use the actual modifiers.
                total += slot_item.stat_modifiers.get(stat, 0)
        return total

    def get_gold(self) -> int:
        return self.gold

    def add_gold(self, amount: int) -> None:
        if amount > 0:
            self.gold += amount

    def spend_gold(self, amount: int) -> bool:
        """Deducts gold. Returns False if insufficient funds."""
        if amount < 0 or amount > self.gold:
            return False
        self.gold -= amount
        return True
