from dataclasses import dataclass, field

@dataclass
class Item:
    id: str
    name: str
    description: str
    item_type: str  # 'weapon', 'armor', 'consumable', 'key'
    slot: str  # 'weapon', 'offhand', 'head', 'body', 'accessory', 'none'
    stat_modifiers: dict[str, int] = field(default_factory=dict) # 'attack', 'defense', 'speed', 'magic'
    value: int = 0
    identified: bool = True

    def identify(self) -> None:
        """Reveals true name and stats for an unidentified item."""
        self.identified = True

    @property
    def display_name(self) -> str:
        """Returns the masked name if not identified."""
        return self.name if self.identified else "Unidentified Item"

    @property
    def display_stats(self) -> dict[str, int]:
        """Returns empty stats if not identified to hide properties."""
        return self.stat_modifiers if self.identified else {}
