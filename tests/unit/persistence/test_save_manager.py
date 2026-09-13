"""
Tests for SaveManager atomic save/load system
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

from src.shared.persistence.save_manager import SaveManager
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.session.game_session import GameSession, GardenState, WorldState
from src.shared.genetics.cultural_base import CulturalBase
from src.shared.genetics.genome import SlimeGenome


class TestSaveManager:
    
    def test_atomic_save_creates_backup(self):
        """Test that atomic save creates backup file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Override save paths for testing
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Create initial save with some data
            roster = Roster()
            session = GameSession.new_game()
            session.resources['gold'] = 100
            
            # First save should create main file but no backup
            result1 = SaveManager.save(roster, session)
            assert result1 is True
            assert SaveManager.SAVE_FILE.exists()
            assert not SaveManager.BACKUP_FILE.exists()
            
            # Add a slime and save again
            slime = RosterSlime(
                slime_id="test_slime",
                name="Test Slime",
                genome=SlimeGenome(
                    shape="round",
                    size="medium", 
                    base_color=[100, 200, 100],
                    pattern="spotted",
                    pattern_color=[50, 50, 50],
                    accessory="none",
                    curiosity=0.5,
                    energy=0.5,
                    affection=0.5,
                    shyness=0.5,
                    base_hp=20.0,
                    base_atk=5.0,
                    base_spd=5.0,
                    generation=1,
                    cultural_base=CulturalBase.VOID
                )
            )
            roster.add_slime(slime)
            session.resources['gold'] = 200
            
            # Second save should create backup
            result2 = SaveManager.save(roster, session)
            assert result2 is True
            assert SaveManager.BACKUP_FILE.exists()
            
            # Verify both files have different content
            main_data = json.loads(SaveManager.SAVE_FILE.read_text())
            backup_data = json.loads(SaveManager.BACKUP_FILE.read_text())
            
            # Check that we have the slime data in both files
            assert len(main_data['roster']['slimes']) == 1
            assert main_data['roster']['slimes'][0]['name'] == "Test Slime"
            assert main_data['session']['resources']['gold'] == 200
            assert len(backup_data['roster']['slimes']) == 0  # Backup has old data (empty)
            assert backup_data['session']['resources']['gold'] == 100  # Backup has old gold
    
    def test_save_failure_doesnt_corrupt_existing(self):
        """Test that save failure doesn't corrupt existing save"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Create initial save
            roster = Roster()
            session = GameSession.new_game()
            session.resources['gold'] = 100
            
            result1 = SaveManager.save(roster, session)
            assert result1 is True
            original_content = SaveManager.SAVE_FILE.read_text()
            
            # Mock save to fail
            with patch('pathlib.Path.write_text', side_effect=Exception("Save failed")):
                result2 = SaveManager.save(roster, session)
                assert result2 is False
            
            # Original file should be unchanged
            assert SaveManager.SAVE_FILE.read_text() == original_content
    
    def test_load_from_main_save(self):
        """Test loading from main save file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Create test data
            roster = Roster()
            slime = RosterSlime(
                slime_id="load_test",
                name="Load Test",
                genome=SlimeGenome(
                    shape="amorphous",
                    size="small",
                    base_color=[255, 100, 100],
                    pattern="solid",
                    pattern_color=[255, 255, 255],
                    accessory="glow",
                    curiosity=0.8,
                    energy=0.3,
                    affection=0.9,
                    shyness=0.2,
                    base_hp=25.0,
                    base_atk=6.0,
                    base_spd=4.0,
                    generation=1,
                    cultural_base=CulturalBase.TIDE
                )
            )
            roster.add_slime(slime)
            
            session = GameSession.new_game()
            session.resources['gold'] = 300
            session.garden.room_level = 2
            
            # Save the data
            SaveManager.save(roster, session)
            
            # Load the data
            result = SaveManager.load()
            assert result is not None
            
            roster_data, session_data = result
            assert len(roster_data['slimes']) == 1
            assert roster_data['slimes'][0]['name'] == "Load Test"
            assert session_data['resources']['gold'] == 300
            assert session_data['garden']['room_level'] == 2
    
    def test_load_fallback_to_backup(self):
        """Test loading falls back to backup when main is corrupted"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Create test data
            roster = Roster()
            session = GameSession.new_game()
            session.resources['gold'] = 400
            
            # Save to create main file
            SaveManager.save(roster, session)
            
            # Add more data and save again to create backup
            session.resources['gold'] = 500
            SaveManager.save(roster, session)
            
            # Verify backup exists
            assert SaveManager.BACKUP_FILE.exists()
            
            # Corrupt main file
            SaveManager.SAVE_FILE.write_text("corrupted data")
            
            # Should load from backup
            result = SaveManager.load()
            assert result is not None
            
            roster_data, session_data = result
            assert session_data['resources']['gold'] == 400  # From backup
    
    def test_load_returns_none_when_no_save(self):
        """Test load returns None when no save exists"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            result = SaveManager.load()
            assert result is None
    
    def test_has_save_detection(self):
        """Test has_save detection"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Initially no save
            assert not SaveManager.has_save()
            
            # Create save file
            SaveManager.SAVE_FILE.write_text("{}")
            assert SaveManager.has_save()
            
            # Delete save file
            SaveManager.SAVE_FILE.unlink()
            assert not SaveManager.has_save()
    
    def test_delete_save_removes_all_files(self):
        """Test delete_save removes all save files"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Create both files
            SaveManager.SAVE_FILE.write_text("main")
            SaveManager.BACKUP_FILE.write_text("backup")
            
            assert SaveManager.SAVE_FILE.exists()
            assert SaveManager.BACKUP_FILE.exists()
            
            # Delete all saves
            SaveManager.delete_save()
            
            assert not SaveManager.SAVE_FILE.exists()
            assert not SaveManager.BACKUP_FILE.exists()
    
    def test_save_version_and_timestamp(self):
        """Test save includes version and timestamp"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            roster = Roster()
            session = GameSession.new_game()
            
            SaveManager.save(roster, session)
            
            data = json.loads(SaveManager.SAVE_FILE.read_text())
            
            assert data['version'] == 2
            assert 'saved_at' in data
            # Should be valid ISO format timestamp
            datetime.fromisoformat(data['saved_at'])
            
            # Check that timestamp was updated (within reasonable range)
            saved_data = json.loads(SaveManager.SAVE_FILE.read_text())
            saved_at = datetime.fromisoformat(saved_data['saved_at'])
            now = datetime.now(timezone.utc)
            assert abs((now - saved_at).total_seconds()) < 60, "Timestamp should be recent"
    
    @patch('os.getenv')
    def test_skip_save_flag(self, mock_getenv):
        """Test SKIP_SAVE environment variable bypasses saves"""
        mock_getenv.return_value = 'true'
        
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            
            roster = Roster()
            session = GameSession.new_game()
            
            # Should return True but not create file
            result = SaveManager.save(roster, session)
            assert result is True
            assert not SaveManager.SAVE_FILE.exists()
    
    def test_auto_save_convenience_method(self):
        """Test auto_save convenience method"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Mock context
            mock_context = MagicMock()
            mock_roster = Roster()
            mock_session = GameSession.new_game()
            mock_context.roster = mock_roster
            mock_context.game_session = mock_session
            
            result = SaveManager.auto_save(mock_context)
            assert result is True
            assert SaveManager.SAVE_FILE.exists()
            
            data = json.loads(SaveManager.SAVE_FILE.read_text())
            assert data['version'] == 2
            assert 'roster' in data
            assert 'session' in data
    
    def test_auto_save_with_none_context(self):
        """Test auto_save returns False with None context"""
        result = SaveManager.auto_save(None)
        assert result is False
    
    def test_round_trip_complete_data_preservation(self):
        """Test complete round trip preserves all data"""
        with tempfile.TemporaryDirectory() as temp_dir:
            SaveManager.SAVE_DIR = Path(temp_dir)
            SaveManager.SAVE_FILE = SaveManager.SAVE_DIR / 'player.json'
            SaveManager.BACKUP_FILE = SaveManager.SAVE_DIR / 'player.backup.json'
            
            # Create comprehensive test data
            roster = Roster()
            
            # Add multiple slimes with different properties
            slimes = [
                RosterSlime(
                    slime_id="slime_1",
                    name="Alpha",
                    genome=SlimeGenome(
                        shape="round", size="medium", base_color=[255, 0, 0],
                        pattern="spotted", pattern_color=[255, 255, 0],
                        accessory="crown", curiosity=0.9, energy=0.1,
                        affection=0.5, shyness=0.2,
                        base_hp=30.0, base_atk=8.0, base_spd=4.0,
                        generation=2, cultural_base=CulturalBase.EMBER
                    ),
                    team=TeamRole.DUNGEON,
                    locked=True,
                    alive=True
                ),
                RosterSlime(
                    slime_id="slime_2",
                    name="Beta", 
                    genome=SlimeGenome(
                        shape="elongated", size="large", base_color=[0, 0, 255],
                        pattern="striped", pattern_color=[255, 255, 255],
                        accessory="shell", curiosity=0.3, energy=0.8,
                        affection=0.7, shyness=0.9,
                        base_hp=15.0, base_atk=12.0, base_spd=8.0,
                        generation=1, cultural_base=CulturalBase.CRYSTAL
                    ),
                    team=TeamRole.RACING,
                    locked=False,
                    alive=True
                ),
                RosterSlime(
                    slime_id="slime_3",
                    name="Gamma",
                    genome=SlimeGenome(
                        shape="cubic", size="tiny", base_color=[0, 255, 0],
                        pattern="marbled", pattern_color=[255, 255, 255],
                        accessory="scar", curiosity=0.5, energy=0.5,
                        affection=0.5, shyness=0.5,
                        base_hp=10.0, base_atk=10.0, base_spd=10.0,
                        generation=3, cultural_base=CulturalBase.MARSH
                    ),
                    team=TeamRole.UNASSIGNED,
                    locked=False,
                    alive=False  # Dead slime
                )
            ]
            
            for slime in slimes:
                roster.add_slime(slime)
            
            # Create comprehensive session data
            session = GameSession.new_game()
            session.resources = {'gold': 500, 'scrap': 50, 'food': 200}
            session.garden.room_level = 3
            session.garden.unlocked_rooms = ['nursery', 'training_area']
            session.garden.capacity = 10
            session.world.discovered_cultures = ['ember', 'crystal']
            session.world.diplomatic_standing = {'ember': 'friendly', 'crystal': 'neutral'}
            session.world.conquered_zones = ['zone_1']
            session.world.active_events = [{'type': 'festival', 'name': 'Crystal Festival'}]
            session.active_dispatches = []
            session.current_tick = 1000
            
            # Save
            assert SaveManager.save(roster, session)
            
            # Load
            result = SaveManager.load()
            assert result is not None
            
            roster_data, session_data = result
            
            # Verify roster data
            assert len(roster_data['slimes']) == 3
            assert roster_data['slimes'][0]['name'] == "Alpha"
            assert roster_data['slimes'][0]['team'] == "dungeon"
            assert roster_data['slimes'][0]['locked'] is True
            assert roster_data['slimes'][0]['alive'] is True
            assert roster_data['slimes'][0]['genome']['cultural_base'] == "ember"
            
            assert roster_data['slimes'][1]['name'] == "Beta"
            assert roster_data['slimes'][1]['team'] == "racing"
            assert roster_data['slimes'][1]['locked'] is False
            assert roster_data['slimes'][2]['alive'] is False
            
            # Verify session data
            assert session_data['resources']['gold'] == 500
            assert session_data['resources']['scrap'] == 50
            assert session_data['resources']['food'] == 200
            assert session_data['garden']['room_level'] == 3
            assert session_data['garden']['unlocked_rooms'] == ['nursery', 'training_area']
            assert session_data['garden']['capacity'] == 10
            assert session_data['world']['discovered_cultures'] == ['ember', 'crystal']
            assert session_data['world']['diplomatic_standing'] == {'ember': 'friendly', 'crystal': 'neutral'}
            assert session_data['world']['conquered_zones'] == ['zone_1']
            assert session_data['world']['active_events'] == [{'type': 'festival', 'name': 'Crystal Festival'}]
            assert session_data['current_tick'] == 1000
            
            # Verify timestamp - it's in the top-level save data, not session_data
            full_data = json.loads(SaveManager.SAVE_FILE.read_text())
            assert 'saved_at' in full_data
            datetime.fromisoformat(full_data['saved_at'])
