"""
Tests for EntityRegistry
"""

import pytest
from src.shared.state.entity_registry import EntityRegistry
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.genetics.genome import SlimeGenome, CulturalBase


class TestEntityRegistry:
    """Test EntityRegistry operations"""
    
    def test_register_and_get(self):
        """Test registering and retrieving slimes"""
        registry = EntityRegistry()
        
        # Create test slime
        genome = SlimeGenome(
            shape="amorphous",
            size="medium", 
            base_color=(100, 100, 100),
            pattern="solid",
            pattern_color=(120, 120, 120),
            accessory="none",
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER
        )
        slime = RosterSlime(
            slime_id="test_slime",
            name="Test Slime",
            genome=genome,
            team=TeamRole.UNASSIGNED
        )
        
        # Register and retrieve
        registry.register(slime)
        retrieved = registry.get("test_slime")
        
        assert retrieved is slime
        assert retrieved.name == "Test Slime"
        assert retrieved.genome.cultural_base == CulturalBase.EMBER
    
    def test_get_nonexistent(self):
        """Test getting non-existent slime returns None"""
        registry = EntityRegistry()
        assert registry.get("nonexistent") is None
    
    def test_get_team(self):
        """Test getting slimes by team"""
        registry = EntityRegistry()
        
        # Create test slimes
        genome = SlimeGenome(
            shape="amorphous",
            size="medium",
            base_color=(100, 100, 100),
            pattern="solid",
            pattern_color=(120, 120, 120),
            accessory="none",
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER
        )
        
        dungeon_slime = RosterSlime(
            slime_id="dungeon_slime",
            name="Dungeon Slime",
            genome=genome,
            team=TeamRole.DUNGEON
        )
        
        racing_slime = RosterSlime(
            slime_id="racing_slime",
            name="Racing Slime",
            genome=genome,
            team=TeamRole.RACING
        )
        
        unassigned_slime = RosterSlime(
            slime_id="unassigned_slime",
            name="Unassigned Slime",
            genome=genome,
            team=TeamRole.UNASSIGNED
        )
        
        # Register all slimes
        registry.register(dungeon_slime)
        registry.register(racing_slime)
        registry.register(unassigned_slime)
        
        # Test team retrieval
        dungeon_team = registry.get_team("dungeon")
        racing_team = registry.get_team("racing")
        unassigned_team = registry.get_team("unassigned")
        
        assert len(dungeon_team) == 1
        assert dungeon_team[0] is dungeon_slime
        
        assert len(racing_team) == 1
        assert racing_team[0] is racing_slime
        
        assert len(unassigned_team) == 1
        assert unassigned_team[0] is unassigned_slime
    
    def test_all(self):
        """Test getting all registered slimes"""
        registry = EntityRegistry()
        
        # Create test slimes
        genome = SlimeGenome(
            shape="amorphous",
            size="medium",
            base_color=(100, 100, 100),
            pattern="solid",
            pattern_color=(120, 120, 120),
            accessory="none",
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER
        )
        
        slime1 = RosterSlime(
            slime_id="slime1",
            name="Slime 1",
            genome=genome,
            team=TeamRole.UNASSIGNED
        )
        
        slime2 = RosterSlime(
            slime_id="slime2",
            name="Slime 2",
            genome=genome,
            team=TeamRole.UNASSIGNED
        )
        
        # Register and test
        registry.register(slime1)
        registry.register(slime2)
        
        all_slimes = registry.all()
        assert len(all_slimes) == 2
        assert slime1 in all_slimes
        assert slime2 in all_slimes
    
    def test_unregister(self):
        """Test unregistering slimes"""
        registry = EntityRegistry()
        
        # Create and register test slime
        genome = SlimeGenome(
            shape="amorphous",
            size="medium",
            base_color=(100, 100, 100),
            pattern="solid",
            pattern_color=(120, 120, 120),
            accessory="none",
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER
        )
        slime = RosterSlime(
            slime_id="test_slime",
            name="Test Slime",
            genome=genome,
            team=TeamRole.UNASSIGNED
        )
        
        registry.register(slime)
        assert registry.get("test_slime") is slime
        
        # Unregister and test
        registry.unregister("test_slime")
        assert registry.get("test_slime") is None
        assert len(registry.all()) == 0
    
    def test_from_roster(self):
        """Test creating registry from existing roster"""
        # Create test roster
        roster = Roster()
        
        # Add test slime to roster
        genome = SlimeGenome(
            shape="amorphous",
            size="medium",
            base_color=(100, 100, 100),
            pattern="solid",
            pattern_color=(120, 120, 120),
            accessory="none",
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER
        )
        slime = RosterSlime(
            slime_id="test_slime",
            name="Test Slime",
            genome=genome,
            team=TeamRole.DUNGEON
        )
        roster.add_slime(slime)
        
        # Create registry from roster
        registry = EntityRegistry.from_roster(roster)
        
        # Test that slime is in registry
        retrieved = registry.get("test_slime")
        assert retrieved is not None
        assert retrieved.name == "Test Slime"
        assert retrieved.team == TeamRole.DUNGEON
        
        # Test team retrieval
        dungeon_team = registry.get_team("dungeon")
        assert len(dungeon_team) == 1
        assert dungeon_team[0] is retrieved
