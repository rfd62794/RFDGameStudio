"""
Shared Spawner Base
SRP: Generic wave management and entity spawning logic.
"""
from abc import ABC, abstractmethod
from typing import List, Tuple, Any

class SpawnerBase(ABC):
    """
    Abstract base for demo-specific spawners.
    Tracks spawn counts and handles wave-level logic.
    """
    
    def __init__(self, bounds: Tuple[int, int]):
        self.bounds = bounds
        self.total_spawned = 0
        self.difficulty_level = 1

    @abstractmethod
    def spawn(self, position: Tuple[float, float], **kwargs) -> Any:
        """Spawn a single entity at given position."""
        pass

    def spawn_wave(self, count: int, positions: List[Tuple[float, float]]) -> List[Any]:
        """Spawn a batch of entities."""
        entities = []
        for pos in positions[:count]:
            entity = self.spawn(pos)
            if entity:
                entities.append(entity)
                self.total_spawned += 1
        return entities

    def set_difficulty(self, level: int):
        """Scale spawn parameters based on level."""
        self.difficulty_level = level

    def get_spawn_count(self) -> int:
        """Return total count of entities spawned in this lifetime."""
        return self.total_spawned
