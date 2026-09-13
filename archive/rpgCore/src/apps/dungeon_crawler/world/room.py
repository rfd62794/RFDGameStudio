from dataclasses import dataclass, field
from apps.dungeon_crawler.entities.enemy import Enemy

@dataclass
class Room:
    id: str
    room_type: str  # 'combat', 'treasure', 'rest', 'merchant', 'boss'
    connections: list[str] = field(default_factory=list)
    enemies: list[Enemy] = field(default_factory=list)
    cleared: bool = False
    revealed: bool = False

    def has_enemies(self) -> bool:
        return len(self.enemies) > 0

    def all_enemies_defeated(self) -> bool:
        if not self.has_enemies():
            return True
        return all(not enemy.is_alive() for enemy in self.enemies)


    def reveal(self) -> None:
        self.revealed = True

    def clear(self) -> None:
        self.cleared = True

    def is_accessible(self) -> bool:
        """Returns True if revealed (and inherently connected to a cleared room conceptually)."""
        return self.revealed

