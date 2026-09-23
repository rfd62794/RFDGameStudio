"""Tests for racing adapter functionality"""

import pytest
from unittest.mock import Mock
from src.shared.dispatch.adapters.racing_adapter import TrackConfig, create_racing_dispatch, resolve_racing_dispatch


class TestRacingAdapter:
    """Test racing adapter functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_slime = Mock()
        self.mock_slime.slime_id = "racing_slime_001"
        
        self.track_config = TrackConfig(
            terrain_segments=["grass", "mud", "rock", "grass"],
            length=1500.0,
            laps=3,
            difficulty="medium"
        )
    
    def test_track_config_creation(self):
        """Test TrackConfig dataclass creation"""
        config = TrackConfig(
            terrain_segments=["grass", "mud"],
            length=1000.0,
            laps=2,
            difficulty="easy"
        )
        
        assert config.terrain_segments == ["grass", "mud"]
        assert config.length == 1000.0
        assert config.laps == 2
        assert config.difficulty == "easy"
    
    def test_create_racing_dispatch(self):
        """Test racing dispatch creation"""
        slimes = [self.mock_slime]
        
        dispatch = create_racing_dispatch(slimes, self.track_config)
        
        assert dispatch.zone_type.value == "racing"
        assert len(dispatch.slime_ids) == 1
        assert "racing_slime_001" in dispatch.slime_ids
        assert dispatch.status == "preparing"
        
        # Check track config is stored in outcome
        assert dispatch.outcome is not None
        assert dispatch.outcome['integration_status'] == 'scaffolded'
        assert dispatch.outcome['track_config'] == self.track_config
        assert 'RaceEngine integration pending' in dispatch.outcome['note']
    
    def test_create_racing_dispatch_multiple_slimes(self):
        """Test racing dispatch with multiple slimes"""
        slime2 = Mock()
        slime2.slime_id = "racing_slime_002"
        
        slimes = [self.mock_slime, slime2]
        
        dispatch = create_racing_dispatch(slimes, self.track_config)
        
        assert len(dispatch.slime_ids) == 2
        assert "racing_slime_001" in dispatch.slime_ids
        assert "racing_slime_002" in dispatch.slime_ids
    
    def test_resolve_racing_dispatch_deferred(self):
        """Test racing dispatch resolution is deferred"""
        from src.shared.dispatch.zone_types import ZoneType
        from src.shared.dispatch.dispatch_record import DispatchRecord
        
        dispatch = DispatchRecord(
            slime_ids=["racing_slime_001"],
            zone_type=ZoneType.RACING  # Use ZoneType enum
        )
        dispatch.outcome = {
            'track_config': self.track_config,
            'integration_status': 'scaffolded'
        }
        
        slimes = [self.mock_slime]
        outcome = resolve_racing_dispatch(dispatch, slimes)
        
        assert outcome['zone_type'] == 'racing'
        assert outcome['status'] == 'deferred_to_simulation'
        assert outcome['resource_gains'] == {}
        assert outcome['stat_deltas'] == {}
        assert outcome['losses'] == []
        assert outcome['integration_note'] == 'RaceEngine integration pending'
        assert outcome['track_config'] == self.track_config
    
    def test_resolve_racing_dispatch_no_outcome(self):
        """Test racing dispatch resolution with no stored outcome"""
        from src.shared.dispatch.zone_types import ZoneType
        from src.shared.dispatch.dispatch_record import DispatchRecord
        
        dispatch = DispatchRecord(
            slime_ids=["racing_slime_001"],
            zone_type=ZoneType.RACING
        )
        # No outcome set
        
        slimes = [self.mock_slime]
        outcome = resolve_racing_dispatch(dispatch, slimes)
        
        assert outcome['zone_type'] == 'racing'
        assert outcome['status'] == 'deferred_to_simulation'
        assert outcome['track_config'] is None
    
    def test_racing_adapter_scaffolded_status(self):
        """Test that racing adapter clearly indicates scaffolded status"""
        slimes = [self.mock_slime]
        
        dispatch = create_racing_dispatch(slimes, self.track_config)
        outcome = resolve_racing_dispatch(dispatch, slimes)
        
        # Both creation and resolution should indicate scaffolded status
        assert dispatch.outcome['integration_status'] == 'scaffolded'
        assert outcome['integration_note'] == 'RaceEngine integration pending'
    
    def test_track_config_storage(self):
        """Test track config is properly stored and retrieved"""
        slimes = [self.mock_slime]
        
        # Create dispatch with custom track
        custom_track = TrackConfig(
            terrain_segments=["rock", "rock", "mud"],
            length=2000.0,
            laps=5,
            difficulty="hard"
        )
        
        dispatch = create_racing_dispatch(slimes, custom_track)
        outcome = resolve_racing_dispatch(dispatch, slimes)
        
        # Track config should be preserved
        assert outcome['track_config'] == custom_track
        assert outcome['track_config'].length == 2000.0
        assert outcome['track_config'].laps == 5
        assert outcome['track_config'].difficulty == "hard"
    
    def test_future_integration_hook_placeholder(self):
        """Test that future integration hook exists but is not implemented"""
        from src.shared.dispatch.adapters.racing_adapter import integrate_with_race_engine
        
        # Function should exist but not be implemented
        assert callable(integrate_with_race_engine)
        
        # Should not raise errors when imported (no implementation yet)
        # This test mainly ensures the function exists for future use
        assert True  # If we get here, the function exists and can be called
