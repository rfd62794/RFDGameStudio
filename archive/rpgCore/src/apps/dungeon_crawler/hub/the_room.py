from src.shared.items.item import Item

class TheRoom:
    """The central hub for the crawler, serving as the permanent start point."""

    def __init__(self):
        self.chest: list[Item] = []
        self.has_escape_rope: bool = True
        self.flavor_text: str = (
            "A worn bedroom. Peeling wallpaper. A chest in the corner.\n"
            "A ladder descends into darkness beneath a frayed rug.\n"
            "An escape rope hangs by the ladder, just in case."
        )

    def deposit(self, item: Item) -> None:
        """Stores an item permanently across runs."""
        self.chest.append(item)

    def withdraw(self, item_id: str) -> Item | None:
        """Removes an item from the chest and returns it."""
        for i, item in enumerate(self.chest):
            if item.id == item_id:
                return self.chest.pop(i)
        return None

    def restock_escape_rope(self, cost: int, gold: int) -> bool:
        """Purchases a new escape rope if affordable."""
        if not self.has_escape_rope and gold >= cost:
            self.has_escape_rope = True
            return True
        return False
