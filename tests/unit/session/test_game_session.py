"""Tests for GameSession functionality"""

import pytest
import tempfile
import json
from pathlib import Path
from uuid import UUID

from src.shared.session.game_session import GameSession, GardenState, WorldState


class TestGameSession:
    """Test GameSession creation and basic functionality"""
    
    def test_new_game_creation(self):
        """Test creating a new game session"""
        session = GameSession.new_game()
        
        assert isinstance(session.session_id, UUID)
        assert session.resources == {'gold': 100, 'scrap': 0, 'food': 50}
        assert session.current_tick == 0
        assert session.active_dispatches == []
        
        # Test garden defaults
        assert session.garden.room_level == 0
        assert session.garden.unlocked_rooms == []
        assert session.garden.capacity == 6
        assert session.garden.idle_assignments == {}
        
        # Test world defaults
        assert session.world.discovered_cultures == []
        assert session.world.diplomatic_standing == {}
        assert session.world.conquered_zones == []
        assert session.world.active_events == []
    
    def test_custom_session_creation(self):
        """Test creating a session with custom state"""
        garden = GardenState(room_level=2, capacity=8)
        world = WorldState(discovered_cultures=['ember', 'crystal'])
        
        session = GameSession(
            session_id=UUID('12345678-1234-5678-9abc-123456789abc'),
            resources={'gold': 500, 'scrap': 100, 'food': 200},
            garden=garden,
            world=world,
            active_dispatches=[],
            current_tick=1000
        )
        
        assert session.session_id == UUID('12345678-1234-5678-9abc-123456789abc')
        assert session.resources == {'gold': 500, 'scrap': 100, 'food': 200}
        assert session.garden.room_level == 2
        assert session.garden.capacity == 8
        assert session.world.discovered_cultures == ['ember', 'crystal']
        assert session.current_tick == 1000


class TestResourceManagement:
    """Test resource management functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.session = GameSession.new_game()
    
    def test_add_resource_existing(self):
        """Test adding to existing resource"""
        self.session.add_resource('gold', 50)
        assert self.session.resources['gold'] == 150
    
    def test_add_resource_new(self):
        """Test adding new resource type"""
        self.session.add_resource('gems', 25)
        assert self.session.resources['gems'] == 25
    
    def test_remove_resource_success(self):
        """Test successful resource removal"""
        result = self.session.remove_resource('gold', 50)
        assert result == True
        assert self.session.resources['gold'] == 50
    
    def test_remove_resource_insufficient(self):
        """Test removing more than available"""
        result = self.session.remove_resource('gold', 200)
        assert result == False
        assert self.session.resources['gold'] == 100  # Unchanged
    
    def test_remove_resource_nonexistent(self):
        """Test removing non-existent resource"""
        result = self.session.remove_resource('gems', 10)
        assert result == False
        assert 'gems' not in self.session.resources
    
    def test_has_resources_true(self):
        """Test checking sufficient resources"""
        assert self.session.has_resources('gold', 50) == True
        assert self.session.has_resources('gold', 100) == True
    
    def test_has_resources_false(self):
        """Test checking insufficient resources"""
        assert self.session.has_resources('gold', 150) == False
        assert self.session.has_resources('scrap', 1) == False


class TestGardenState:
    """Test garden state management"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.session = GameSession.new_game()
    
    def test_unlock_room(self):
        """Test unlocking new rooms"""
        self.session.unlock_room('nursery')
        assert 'nursery' in self.session.garden.unlocked_rooms
        
        # Test duplicate unlock doesn't duplicate
        self.session.unlock_room('nursery')
        assert self.session.garden.unlocked_rooms.count('nursery') == 1
    
    def test_unlock_multiple_rooms(self):
        """Test unlocking multiple rooms"""
        rooms = ['nursery', 'training', 'workshop']
        for room in rooms:
            self.session.unlock_room(room)
        
        assert set(self.session.garden.unlocked_rooms) == set(rooms)
    
    def test_idle_assignments(self):
        """Test slime idle assignments"""
        self.session.garden.idle_assignments['slime_001'] = 'training'
        self.session.garden.idle_assignments['slime_002'] = 'resting'
        
        assert self.session.garden.idle_assignments['slime_001'] == 'training'
        assert self.session.garden.idle_assignments['slime_002'] == 'resting'
        assert len(self.session.garden.idle_assignments) == 2


class TestWorldState:
    """Test world state management"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.session = GameSession.new_game()
    
    def test_discover_culture(self):
        """Test discovering new cultures"""
        self.session.discover_culture('ember')
        assert 'ember' in self.session.world.discovered_cultures
        
        # Test duplicate discovery doesn't duplicate
        self.session.discover_culture('ember')
        assert self.session.world.discovered_cultures.count('ember') == 1
    
    def test_discover_multiple_cultures(self):
        """Test discovering multiple cultures"""
        cultures = ['ember', 'crystal', 'marsh']
        for culture in cultures:
            self.session.discover_culture(culture)
        
        assert set(self.session.world.discovered_cultures) == set(cultures)
    
    def test_diplomatic_standing(self):
        """Test setting diplomatic standing"""
        self.session.set_diplomatic_standing('ember', 'friendly')
        self.session.set_diplomatic_standing('crystal', 'neutral')
        
        assert self.session.world.diplomatic_standing['ember'] == 'friendly'
        assert self.session.world.diplomatic_standing['crystal'] == 'neutral'
    
    def test_conquered_zones(self):
        """Test conquered zones tracking"""
        self.session.world.conquered_zones.append('fire_territory')
        self.session.world.conquered_zones.append('ice_territory')
        
        assert 'fire_territory' in self.session.world.conquered_zones
        assert 'ice_territory' in self.session.world.conquered_zones
        assert len(self.session.world.conquered_zones) == 2
    
    def test_active_events(self):
        """Test active world events"""
        event1 = {'type': 'festival', 'location': 'ember_village'}
        event2 = {'type': 'raid', 'location': 'crystal_mines'}
        
        self.session.add_active_event(event1)
        self.session.add_active_event(event2)
        
        assert len(self.session.world.active_events) == 2
        assert self.session.world.active_events[0] == event1
        assert self.session.world.active_events[1] == event2
        
        # Test event removal
        self.session.remove_active_event(0)
        assert len(self.session.world.active_events) == 1
        assert self.session.world.active_events[0] == event2


class TestTickManagement:
    """Test tick counter functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.session = GameSession.new_game()
    
    def test_advance_tick_default(self):
        """Test advancing tick by default amount"""
        self.session.advance_tick()
        assert self.session.current_tick == 1
    
    def test_advance_tick_custom(self):
        """Test advancing tick by custom amount"""
        self.session.advance_tick(10)
        assert self.session.current_tick == 10
        
        self.session.advance_tick(5)
        assert self.session.current_tick == 15


class TestSerialization:
    """Test serialization and deserialization"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.session = GameSession.new_game()
        # Add some test data
        self.session.add_resource('gold', 50)
        self.session.unlock_room('nursery')
        self.session.discover_culture('ember')
        self.session.set_diplomatic_standing('ember', 'friendly')
        self.session.advance_tick(100)
    
    def test_to_dict(self):
        """Test converting session to dictionary"""
        data = self.session.to_dict()
        
        assert 'session_id' in data
        assert 'resources' in data
        assert 'garden' in data
        assert 'world' in data
        assert 'active_dispatches' in data
        assert 'current_tick' in data
        
        assert data['resources']['gold'] == 150
        assert data['garden']['unlocked_rooms'] == ['nursery']
        assert data['world']['discovered_cultures'] == ['ember']
        assert data['world']['diplomatic_standing']['ember'] == 'friendly'
        assert data['current_tick'] == 100
    
    def test_from_dict(self):
        """Test creating session from dictionary"""
        data = self.session.to_dict()
        restored = GameSession.from_dict(data)
        
        assert restored.session_id == self.session.session_id
        assert restored.resources == self.session.resources
        assert restored.garden.unlocked_rooms == self.session.garden.unlocked_rooms
        assert restored.world.discovered_cultures == self.session.world.discovered_cultures
        assert restored.world.diplomatic_standing == self.session.world.diplomatic_standing
        assert restored.current_tick == self.session.current_tick
    
    def test_serialization_round_trip(self):
        """Test full serialization round trip"""
        # Serialize
        data = self.session.to_dict()
        
        # Restore
        restored = GameSession.from_dict(data)
        
        # Verify all data matches
        assert restored.session_id == self.session.session_id
        assert restored.resources == self.session.resources
        assert restored.garden.room_level == self.session.garden.room_level
        assert restored.garden.unlocked_rooms == self.session.garden.unlocked_rooms
        assert restored.garden.capacity == self.session.garden.capacity
        assert restored.garden.idle_assignments == self.session.garden.idle_assignments
        assert restored.world.discovered_cultures == self.session.world.discovered_cultures
        assert restored.world.diplomatic_standing == self.session.world.diplomatic_standing
        assert restored.world.conquered_zones == self.session.world.conquered_zones
        assert restored.world.active_events == self.session.world.active_events
        assert restored.current_tick == self.session.current_tick


class TestFilePersistence:
    """Test file save/load functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.session = GameSession.new_game()
        self.session.add_resource('gold', 25)
        self.session.unlock_room('training')
        self.session.discover_culture('crystal')
    
    def test_save_and_load_file(self):
        """Test saving and loading from file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            filepath = f.name
        
        try:
            # Save
            self.session.save_to_file(filepath)
            
            # Verify file exists and contains valid JSON
            assert Path(filepath).exists()
            with open(filepath, 'r') as f:
                data = json.load(f)
            assert 'session_id' in data
            
            # Load
            loaded = GameSession.load_from_file(filepath)
            
            # Verify data matches
            assert loaded.session_id == self.session.session_id
            assert loaded.resources == self.session.resources
            assert loaded.garden.unlocked_rooms == self.session.garden.unlocked_rooms
            assert loaded.world.discovered_cultures == self.session.world.discovered_cultures
            
        finally:
            # Clean up
            Path(filepath).unlink(missing_ok=True)
    
    def test_load_nonexistent_file(self):
        """Test loading non-existent file raises error"""
        with pytest.raises(FileNotFoundError):
            GameSession.load_from_file('nonexistent_file.json')
