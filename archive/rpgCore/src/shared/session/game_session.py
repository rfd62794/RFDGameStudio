"""
GameSession - Top-level shared state layer
Additive macro state that sits above existing demo sessions
"""

import json
from dataclasses import dataclass, field
from typing import Dict, List, Any
from uuid import uuid4, UUID


@dataclass
class GardenState:
    """Garden expansion and room management"""
    room_level: int = 0
    unlocked_rooms: List[str] = field(default_factory=list)
    capacity: int = 6
    idle_assignments: Dict[str, str] = field(default_factory=dict)


@dataclass  
class WorldState:
    """World progression and diplomatic state"""
    discovered_cultures: List[str] = field(default_factory=list)
    diplomatic_standing: Dict[str, str] = field(default_factory=dict)
    conquered_zones: List[str] = field(default_factory=list)
    active_events: List[dict] = field(default_factory=list)


@dataclass
class GameSession:
    """Top-level shared game state
    
    This is additive - sits above existing demo sessions without replacing them.
    Manages macro state like resources, garden expansion, and world progression.
    """
    session_id: UUID
    resources: Dict[str, int]  # gold, scrap, food
    garden: GardenState
    world: WorldState
    active_dispatches: List[Any]  # DispatchRecord references
    current_tick: int = 0
    
    @classmethod
    def new_game(cls) -> 'GameSession':
        """Create a new game session with default starting state"""
        return cls(
            session_id=uuid4(),
            resources={'gold': 100, 'scrap': 0, 'food': 50},
            garden=GardenState(),
            world=WorldState(),
            active_dispatches=[],
        )
    
    def add_resource(self, resource_type: str, amount: int) -> None:
        """Add resources to the session"""
        if resource_type in self.resources:
            self.resources[resource_type] += amount
        else:
            self.resources[resource_type] = amount
    
    def remove_resource(self, resource_type: str, amount: int) -> bool:
        """Remove resources, return False if insufficient"""
        if resource_type not in self.resources:
            return False
        if self.resources[resource_type] < amount:
            return False
        self.resources[resource_type] -= amount
        return True
    
    def has_resources(self, resource_type: str, amount: int) -> bool:
        """Check if session has sufficient resources"""
        return self.resources.get(resource_type, 0) >= amount
    
    def unlock_room(self, room_name: str) -> None:
        """Unlock a new garden room"""
        if room_name not in self.garden.unlocked_rooms:
            self.garden.unlocked_rooms.append(room_name)
    
    def discover_culture(self, culture_name: str) -> None:
        """Discover a new culture in the world"""
        if culture_name not in self.world.discovered_cultures:
            self.world.discovered_cultures.append(culture_name)
    
    def set_diplomatic_standing(self, culture: str, standing: str) -> None:
        """Set diplomatic standing with a culture"""
        self.world.diplomatic_standing[culture] = standing
    
    def add_active_event(self, event: dict) -> None:
        """Add an active world event"""
        self.world.active_events.append(event)
    
    def remove_active_event(self, event_index: int) -> None:
        """Remove an active world event by index"""
        if 0 <= event_index < len(self.world.active_events):
            self.world.active_events.pop(event_index)
    
    def advance_tick(self, ticks: int = 1) -> None:
        """Advance the game tick counter"""
        self.current_tick += ticks
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize game session to dictionary"""
        return {
            'session_id': str(self.session_id),
            'resources': self.resources,
            'garden': {
                'room_level': self.garden.room_level,
                'unlocked_rooms': self.garden.unlocked_rooms,
                'capacity': self.garden.capacity,
                'idle_assignments': self.garden.idle_assignments
            },
            'world': {
                'discovered_cultures': self.world.discovered_cultures,
                'diplomatic_standing': self.world.diplomatic_standing,
                'conquered_zones': self.world.conquered_zones,
                'active_events': self.world.active_events
            },
            'active_dispatches': [],  # DispatchRecords not serialized here
            'current_tick': self.current_tick
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GameSession':
        """Create game session from dictionary"""
        garden_data = data['garden']
        world_data = data['world']
        
        garden = GardenState(
            room_level=garden_data['room_level'],
            unlocked_rooms=garden_data['unlocked_rooms'],
            capacity=garden_data['capacity'],
            idle_assignments=garden_data['idle_assignments']
        )
        
        world = WorldState(
            discovered_cultures=world_data['discovered_cultures'],
            diplomatic_standing=world_data['diplomatic_standing'],
            conquered_zones=world_data['conquered_zones'],
            active_events=world_data['active_events']
        )
        
        return cls(
            session_id=UUID(data['session_id']),
            resources=data['resources'],
            garden=garden,
            world=world,
            active_dispatches=[],  # DispatchRecords not deserialized here
            current_tick=data['current_tick']
        )
    
    def save_to_file(self, filepath: str) -> None:
        """Save game session to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load_from_file(cls, filepath: str) -> 'GameSession':
        """Load game session from JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)
