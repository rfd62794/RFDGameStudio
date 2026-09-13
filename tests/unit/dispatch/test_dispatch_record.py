"""Tests for DispatchRecord functionality"""

import pytest
from datetime import datetime
from src.shared.dispatch.zone_types import ZoneType
from src.shared.dispatch.dispatch_record import DispatchRecord


class TestDispatchRecord:
    """Test DispatchRecord functionality"""
    
    def test_dispatch_record_creation(self):
        """Test basic dispatch record creation"""
        record = DispatchRecord(
            slime_ids=["slime_001", "slime_002"],
            zone_type=ZoneType.FORAGING
        )
        
        assert record.zone_type == ZoneType.FORAGING
        assert record.status == "preparing"
        assert len(record.slime_ids) == 2
        assert "slime_001" in record.slime_ids
        assert "slime_002" in record.slime_ids
        assert record.dispatch_id is not None
        assert len(record.dispatch_id) > 0
        assert record.created_at is not None
        assert record.completed_at is None
        assert record.outcome is None
    
    def test_dispatch_record_auto_zone_config(self):
        """Test zone config is automatically set"""
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.DUNGEON
        )
        
        assert record.zone_config is not None
        assert record.zone_config.zone_type == ZoneType.DUNGEON
        assert record.zone_config.risk_level == "high"
    
    def test_dispatch_record_properties(self):
        """Test dispatch record properties"""
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.FORAGING
        )
        
        # Initial state
        assert record.is_active == False
        assert record.is_complete == False
        assert record.squad_size == 1
        
        # Mark as active
        record.mark_active(1000)
        assert record.is_active == True
        assert record.is_complete == False
        assert record.status == "active"
        assert record.dispatch_tick == 1000
        assert record.return_tick > 1000
        
        # Mark as complete
        outcome = {"status": "success", "resource_gains": {"gold": 10}}
        record.mark_complete(outcome)
        assert record.is_active == False
        assert record.is_complete == True
        assert record.status == "complete"
        assert record.outcome == outcome
        assert record.completed_at is not None
    
    def test_dispatch_record_status_transitions(self):
        """Test dispatch record status transitions"""
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.FORAGING
        )
        
        # Preparing -> Active
        record.mark_active(1000)
        assert record.status == "active"
        
        # Active -> Returning
        record.mark_returning()
        assert record.status == "returning"
        assert record.is_active == True  # Still considered active
        
        # Returning -> Complete
        record.mark_complete({"status": "success"})
        assert record.status == "complete"
        assert record.is_active == False
        assert record.is_complete == True
    
    def test_dispatch_record_failure(self):
        """Test dispatch record failure handling"""
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.DUNGEON
        )
        
        record.mark_active(1000)
        record.mark_failed("Test failure")
        
        assert record.status == "failed"
        assert record.is_active == False
        assert record.is_complete == True
        assert record.outcome is not None
        assert record.outcome["status"] == "failed"
        assert record.outcome["reason"] == "Test failure"
        assert record.completed_at is not None
    
    def test_dispatch_record_string_representations(self):
        """Test string representations"""
        record = DispatchRecord(
            slime_ids=["slime_001", "slime_002"],
            zone_type=ZoneType.RACING
        )
        
        # Test __str__
        str_repr = str(record)
        assert "Dispatch[" in str_repr
        assert "racing" in str_repr
        assert "preparing" in str_repr
        assert "2 slimes" in str_repr
        
        # Test __repr__
        repr_str = repr(record)
        assert "DispatchRecord" in repr_str
        assert "zone=racing" in repr_str
        assert "status=preparing" in repr_str
        assert "slimes=2" in repr_str
    
    def test_dispatch_record_squad_size(self):
        """Test squad size calculation"""
        # Empty squad
        record = DispatchRecord(zone_type=ZoneType.FORAGING)
        assert record.squad_size == 0
        
        # Single slime
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.FORAGING
        )
        assert record.squad_size == 1
        
        # Multiple slimes
        record = DispatchRecord(
            slime_ids=["slime_001", "slime_002", "slime_003"],
            zone_type=ZoneType.FORAGING
        )
        assert record.squad_size == 3
    
    def test_dispatch_record_timestamps(self):
        """Test timestamp handling"""
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.FORAGING
        )
        
        # Created timestamp should be set
        assert record.created_at is not None
        created_time = datetime.fromisoformat(record.created_at)
        
        # Completed timestamp should be None initially
        assert record.completed_at is None
        
        # After completion, timestamp should be set
        record.mark_active(1000)
        record.mark_complete({"status": "success"})
        
        assert record.completed_at is not None
        completed_time = datetime.fromisoformat(record.completed_at)
        assert completed_time >= created_time
    
    def test_dispatch_record_outcome_structure(self):
        """Test outcome structure for different completion types"""
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.FORAGING
        )
        
        # Success outcome
        success_outcome = {
            "status": "success",
            "resource_gains": {"gold": 10, "food": 5},
            "stat_deltas": {"constitution": 0.1},
            "losses": []
        }
        record.mark_complete(success_outcome)
        assert record.outcome == success_outcome
        
        # Failure outcome (auto-generated)
        record2 = DispatchRecord(
            slime_ids=["slime_002"],
            zone_type=ZoneType.DUNGEON
        )
        record2.mark_active(2000)
        record2.mark_failed("Perished in dungeon")
        
        failure_outcome = record2.outcome
        assert failure_outcome["status"] == "failed"
        assert failure_outcome["reason"] == "Perished in dungeon"
        assert failure_outcome["resource_gains"] == {}
        assert failure_outcome["stat_deltas"] == {}
        assert failure_outcome["losses"] == []
    
    def test_dispatch_record_duration_calculation(self):
        """Test duration calculation"""
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.FORAGING
        )
        
        dispatch_tick = 1000
        record.mark_active(dispatch_tick)
        
        expected_return = dispatch_tick + record.zone_config.duration_ticks
        assert record.return_tick == expected_return
        
        # Duration should be positive
        assert record.return_tick > record.dispatch_tick
    
    def test_dispatch_record_with_custom_zone_config(self):
        """Test dispatch record with custom zone config"""
        from src.shared.dispatch.zone_types import ZoneConfig
        
        custom_config = ZoneConfig(
            zone_type=ZoneType.MISSION,
            min_stage="Prime",
            risk_level="critical",
            resource_returns={"gold": 2.0, "scrap": 1.0},
            duration_ticks=1200,
            stat_growth={"intelligence": 0.5}
        )
        
        record = DispatchRecord(
            slime_ids=["slime_001"],
            zone_type=ZoneType.MISSION,
            zone_config=custom_config
        )
        
        assert record.zone_config == custom_config
        assert record.zone_config.duration_ticks == 1200
        
        record.mark_active(5000)
        assert record.return_tick == 5000 + 1200
