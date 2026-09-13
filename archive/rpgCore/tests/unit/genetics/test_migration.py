"""
Tests for Phase 4B migration to SlimeEntityTemplate.
Verifies that all active creation sites use the template
and that hard rejection works in RosterSyncService.
"""

import pytest
from unittest.mock import Mock, patch

from src.shared.genetics.entity_template import SlimeEntityTemplate
from src.shared.genetics.genome import SlimeGenome
from src.shared.teams.roster import RosterSlime, Roster
from src.shared.state.roster_sync import RosterSyncService
from src.shared.state.entity_registry import EntityRegistry
from src.shared.genetics.cultural_base import CulturalBase


class TestMigrationToEntityTemplate:
    """Test suite for Phase 4B migration verification."""
    
    @pytest.fixture
    def valid_genome(self):
        """Create a valid genome for testing."""
        return SlimeGenome(
            shape='round',
            size='medium',
            base_color=(100, 150, 200),
            pattern='solid',
            pattern_color=(50, 75, 100),
            accessory='none',
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
    
    @pytest.fixture
    def mock_roster_sync(self):
        """Create mock RosterSyncService for testing."""
        roster = Roster()
        registry = EntityRegistry()
        return RosterSyncService(roster, registry)
    
    def test_scene_garden_sync_calls_template(self, valid_genome):
        """Test that scene_garden.py _sync_roster_with_garden calls template.build."""
        # Mock the template.build to verify it gets called
        with patch.object(SlimeEntityTemplate, 'build') as mock_build:
            mock_build.return_value = RosterSlime(
                slime_id="test_slime",
                name="Test Slime",
                genome=valid_genome
            )
            
            # Import and test the method directly
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            
            # Create a mock scene with minimal setup
            scene = Mock()
            scene.roster = Mock()
            scene.roster.slimes = []
            scene.roster.entries = []
            scene.roster.add_slime = Mock()
            
            # Create mock slime object
            mock_slime = Mock()
            mock_slime.name = "Test Slime"
            mock_slime.genome = valid_genome
            
            # Mock garden_state
            scene.garden_state = Mock()
            scene.garden_state.slimes = [mock_slime]
            
            # Mock save_roster to avoid JSON serialization issues
            with patch('src.apps.slime_breeder.ui.scene_garden.save_roster'):
                # Call the method
                GardenScene._sync_roster_with_garden(scene)
            
            # Verify template.build was called
            mock_build.assert_called_once_with(
                genome=valid_genome,
                name="Test Slime",
                slime_id="test_slime"
            )
    
    def test_scene_garden_add_new_calls_template(self, valid_genome):
        """Test that scene_garden.py _add_new_slime calls template.build."""
        # Mock the template.build to verify it gets called
        with patch.object(SlimeEntityTemplate, 'build') as mock_build:
            mock_build.return_value = RosterSlime(
                slime_id="mochi_1",
                name="Mochi 1",
                genome=valid_genome
            )
            
            # Import and test the method directly
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            
            # Create a mock scene with minimal setup
            scene = Mock()
            scene.roster = Mock()
            scene.roster.add_slime = Mock()
            scene.context = Mock()
            scene.context.roster_sync = None
            
            # Mock garden_state and garden_rect
            scene.garden_state = Mock()
            scene.garden_state.slimes = []
            scene.garden_state.add_slime = Mock()
            scene.garden_rect = Mock()
            scene.garden_rect.width = 800
            scene.garden_rect.height = 600
            
            # Call the method
            GardenScene._add_new_slime(scene)
            
            # Verify template.build was called
            mock_build.assert_called_once()
            args, kwargs = mock_build.call_args
            assert 'genome' in kwargs
            assert 'name' in kwargs
            assert 'slime_id' in kwargs
    
    def test_breeding_scene_calls_template(self, valid_genome):
        """Test that breeding_scene.py finalize_breeding calls template.build."""
        # Mock the template.build to verify it gets called
        with patch.object(SlimeEntityTemplate, 'build') as mock_build:
            mock_build.return_value = RosterSlime(
                slime_id="slime_12345",
                name="Test Offspring",
                genome=valid_genome,
                level=1,
                generation=2
            )
            
            # Import and test the method directly
            from src.apps.slime_breeder.scenes.breeding_scene import BreedingScene
            
            # Create a mock scene with minimal setup
            scene = Mock()
            scene.offspring_genome = valid_genome
            scene.offspring_name = "Test Offspring"
            scene.parent_a = Mock()
            scene.parent_a.is_elder = False
            scene.parent_b = Mock()
            scene.parent_b.is_elder = False
            scene.parent_a.level = 3
            scene.parent_b.level = 3
            scene.context = Mock()
            scene.context.roster_sync = None
            
            # Call the method
            BreedingScene.finalize_breeding(scene)
            
            # Verify template.build was called
            mock_build.assert_called_once()
            args, kwargs = mock_build.call_args
            assert kwargs['genome'] == valid_genome
            assert kwargs['name'] == "Test Offspring"
            assert 'slime_id' in kwargs
    
    def test_roster_sync_hard_rejection(self, valid_genome, mock_roster_sync):
        """Test that RosterSyncService now rejects invalid slimes."""
        # Create invalid slime (missing required fields)
        invalid_genome = SlimeGenome(
            shape=None,  # Invalid
            size=None,  # Invalid
            base_color=None,  # Invalid
            pattern=None,  # Invalid
            pattern_color=None,  # Invalid
            accessory=None,  # Invalid
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
        
        invalid_slime = RosterSlime(
            slime_id="invalid_slime",
            name="Invalid Slime",
            genome=invalid_genome
        )
        
        # Test that invalid slime is rejected
        result = mock_roster_sync.add_slime(invalid_slime)
        
        assert result is False
        assert len(mock_roster_sync.roster.entries) == 0
        assert len(mock_roster_sync.registry._entities) == 0
    
    def test_roster_sync_accepts_valid_slime(self, valid_genome, mock_roster_sync):
        """Test that RosterSyncService accepts valid slimes."""
        valid_slime = RosterSlime(
            slime_id="valid_slime",
            name="Valid Slime",
            genome=valid_genome
        )
        
        # Test that valid slime is accepted
        result = mock_roster_sync.add_slime(valid_slime)
        
        assert result is True
        assert len(mock_roster_sync.roster.entries) == 1
        assert len(mock_roster_sync.registry._entities) == 1
        assert "valid_slime" in mock_roster_sync.registry._entities
