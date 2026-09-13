from typing import List, Optional, Tuple, Dict
from src.shared.entities.creature import Creature
from src.shared.genetics import SlimeGenome

class GardenState:
    """Garden state using unified Creature entities"""
    def __init__(self):
        self.creatures: List[Creature] = []
        self.selected: Optional[Creature] = None
        # Index for fast lookup by slime_id
        self._creature_index: Dict[str, Creature] = {}

    def add_creature(self, creature: Creature) -> None:
        """Add a creature to the garden"""
        self.creatures.append(creature)
        self._creature_index[creature.slime_id] = creature

    def remove_creature(self, slime_id: str) -> None:
        """Remove creature by slime_id"""
        creature = self._creature_index.get(slime_id)
        if creature:
            self.creatures.remove(creature)
            del self._creature_index[slime_id]
            if self.selected == creature:
                self.selected = None

    def get_creature(self, slime_id: str) -> Optional[Creature]:
        """Get creature by slime_id (fast lookup)"""
        return self._creature_index.get(slime_id)

    def get_creature_by_name(self, name: str) -> Optional[Creature]:
        """Legacy method - get creature by name (slower)"""
        for creature in self.creatures:
            if creature.name == name:
                return creature
        return None

    def update(self, dt: float, cursor_pos: Optional[Tuple[float, float]] = None) -> None:
        """Update all creatures"""
        for creature in self.creatures:
            creature.update(dt, cursor_pos)

    def save(self) -> dict:
        """Serialize for persistence using Creature.to_dict()"""
        data = {
            "creatures": [creature.to_dict() for creature in self.creatures],
            "selected_id": self.selected.slime_id if self.selected else None
        }
        return data

    def load(self, data: dict) -> None:
        """Restore from save using Creature.from_dict()"""
        self.creatures = []
        self._creature_index = {}
        self.selected = None
        
        for c_data in data.get("creatures", []):
            creature = Creature.from_dict(c_data)
            self.add_creature(creature)
        
        # Restore selected creature
        selected_id = data.get("selected_id")
        if selected_id:
            self.selected = self.get_creature(selected_id)

    # Legacy compatibility methods (deprecated) ===
    def add_slime(self, slime) -> None:
        """Legacy compatibility - convert Slime to Creature"""
        # Convert old Slime to Creature
        creature = Creature(
            name=slime.name,
            genome=slime.genome,
            kinematics=slime.kinematics
        )
        # Store reference to original slime for identity preservation
        creature._original_slime = slime
        self.add_creature(creature)

    def remove_slime(self, name: str) -> None:
        """Legacy compatibility - remove by name"""
        creature = self.get_creature_by_name(name)
        if creature:
            self.remove_creature(creature.slime_id)

    def get_slime(self, name: str) -> Optional[object]:
        """Legacy compatibility - get by name, return original Slime if available"""
        creature = self.get_creature_by_name(name)
        if creature and hasattr(creature, '_original_slime'):
            return creature._original_slime
        return creature

    @property
    def slimes(self) -> List[object]:
        """Legacy compatibility - expose creatures as original objects when possible"""
        result = []
        for creature in self.creatures:
            if hasattr(creature, '_original_slime'):
                result.append(creature._original_slime)
            else:
                result.append(creature)
        return result
