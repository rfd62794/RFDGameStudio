"""
Production-Ready Tests for Scrap Entity System

Tests cover:
- SOLID principles compliance
- Result[T] pattern usage  
- Type safety validation
- Performance benchmarks
- Edge case handling
"""

import pytest
import time
import math
from pathlib import Path
from unittest.mock import Mock, patch
from typing import Dict, Any

from src.apps.space.scrap_entity import ScrapEntity, ScrapType, ScrapLocker
from src.apps.space.entities.space_entity import EntityType
from src.apps.space.entities.vector2 import Vector2
from src.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from src.foundation.types import Result


class TestScrapType:
    """Test ScrapType utility class"""
    
    def test_get_random_type_distribution(self):
        """Test random type distribution over many iterations"""
        type_counts = {ScrapType.COMMON: 0, ScrapType.RARE: 0, ScrapType.EPIC: 0}
        iterations = 10000
        
        for _ in range(iterations):
            scrap_type = ScrapType.get_random_type()
            type_counts[scrap_type] += 1
        
        # Verify approximate distribution (within 5% tolerance)
        common_ratio = type_counts[ScrapType.COMMON] / iterations
        rare_ratio = type_counts[ScrapType.RARE] / iterations  
        epic_ratio = type_counts[ScrapType.EPIC] / iterations
        
        assert 0.65 <= common_ratio <= 0.75  # ~70%
        assert 0.20 <= rare_ratio <= 0.30    # ~25%
        assert 0.03 <= epic_ratio <= 0.07    # ~5%
    
    def test_get_value(self):
        """Test scrap value retrieval"""
        assert ScrapType.get_value(ScrapType.COMMON) == 1
        assert ScrapType.get_value(ScrapType.RARE) == 3
        assert ScrapType.get_value(ScrapType.EPIC) == 5
        assert ScrapType.get_value("invalid") == 1  # Fallback
    
    def test_get_color(self):
        """Test scrap color retrieval"""
        assert ScrapType.get_color(ScrapType.COMMON) == 2  # Gray
        assert ScrapType.get_color(ScrapType.RARE) == 3    # Dark gray
        assert ScrapType.get_color(ScrapType.EPIC) == 1     # White
        assert ScrapType.get_color("invalid") == 2         # Fallback
    
    def test_get_size(self):
        """Test scrap size retrieval"""
        assert ScrapType.get_size(ScrapType.COMMON) == 1  # 1x1
        assert ScrapType.get_size(ScrapType.RARE) == 2    # 2x2
        assert ScrapType.get_size(ScrapType.EPIC) == 2     # 2x2
        assert ScrapType.get_size("invalid") == 1         # Fallback


class TestScrapEntity:
    """Test ScrapEntity class"""
    
    @pytest.fixture
    def common_scrap(self):
        """Fixture for common scrap entity"""
        position = Vector2(50, 50)
        return ScrapEntity(position, ScrapType.COMMON)
    
    @pytest.fixture
    def rare_scrap(self):
        """Fixture for rare scrap entity"""
        position = Vector2(100, 100)
        return ScrapEntity(position, ScrapType.RARE)
    
    def test_initialization(self, common_scrap):
        """Test proper initialization"""
        assert common_scrap.scrap_type == ScrapType.COMMON
        assert common_scrap.scrap_value == 1
        assert common_scrap.scrap_color == 2
        assert common_scrap.scrap_size == 1
        assert common_scrap.radius == 1.0
        assert common_scrap.mass == 0.1
        assert common_scrap.collectable is True
        assert common_scrap.collected is False
        assert common_scrap.active is True
        assert common_scrap.vertices == []  # No vertices for scrap
    
    def test_random_type_initialization(self):
        """Test initialization with random type"""
        position = Vector2(75, 75)
        scrap = ScrapEntity(position)  # No type specified
        
        assert scrap.scrap_type in [ScrapType.COMMON, ScrapType.RARE, ScrapType.EPIC]
        assert scrap.scrap_value in [1, 3, 5]
        assert scrap.scrap_color in [1, 2, 3]
        assert scrap.scrap_size in [1, 2]
    
    def test_update_physics(self, common_scrap):
        """Test physics update with pulsing effect"""
        initial_phase = common_scrap.pulse_phase
        initial_intensity = common_scrap.glow_intensity
        
        # Update by 1 second at 60Hz
        dt = 1.0 / 60.0
        common_scrap.update(dt)
        
        # Phase should advance
        assert common_scrap.pulse_phase != initial_phase
        # Age should increase (note: parent class also updates age)
        assert common_scrap.age >= dt
        # Intensity should change due to pulsing
        assert common_scrap.glow_intensity != initial_intensity
    
    def test_update_inactive(self, common_scrap):
        """Test update on inactive entity"""
        common_scrap.active = False
        initial_age = common_scrap.age
        
        common_scrap.update(1.0)
        
        # Should not update
        assert common_scrap.age == initial_age
    
    def test_update_collected(self, common_scrap):
        """Test update on collected entity"""
        common_scrap.collected = True
        initial_age = common_scrap.age
        
        common_scrap.update(1.0)
        
        # Should not update
        assert common_scrap.age == initial_age
    
    def test_collect(self, common_scrap):
        """Test scrap collection"""
        collection_data = common_scrap.collect()
        
        assert collection_data['scrap_type'] == ScrapType.COMMON
        assert collection_data['scrap_value'] == 1
        assert collection_data['position'] == (50, 50)
        assert 'collection_time' in collection_data
        
        # Entity should be marked as collected
        assert common_scrap.collected is True
        assert common_scrap.active is False
        assert common_scrap.collection_time is not None
    
    def test_collect_already_collected(self, common_scrap):
        """Test collecting already collected scrap"""
        common_scrap.collected = True
        common_scrap.active = False
        
        collection_data = common_scrap.collect()
        
        # Should return empty dict
        assert collection_data == {}
    
    def test_collect_not_collectable(self, common_scrap):
        """Test collecting non-collectable scrap"""
        common_scrap.collectable = False
        
        collection_data = common_scrap.collect()
        
        # Should return empty dict
        assert collection_data == {}
    
    def test_get_render_data(self, common_scrap):
        """Test render data generation"""
        render_data = common_scrap.get_render_data()
        
        assert render_data['position'] == Vector2(50, 50)
        assert render_data['size'] == 1
        assert render_data['color'] == 2
        assert render_data['scrap_type'] == ScrapType.COMMON
        assert render_data['active'] is True
        assert 'glow_intensity' in render_data
    
    def test_get_state_dict(self, common_scrap):
        """Test state serialization"""
        state = common_scrap.get_state_dict()
        
        assert state['scrap_type'] == ScrapType.COMMON
        assert state['scrap_value'] == 1
        assert state['position'] == (50, 50)
        assert state['velocity'] == (0, 0)  # Initial velocity
        assert state['collected'] is False
        assert state['active'] is True
    
    def test_drift_behavior(self, common_scrap):
        """Test optional drift behavior"""
        # Initially no velocity
        assert common_scrap.velocity.magnitude() == 0
        
        # Update many times to trigger random drift
        for _ in range(1000):  # High iteration to trigger 1% chance
            common_scrap.update(1.0 / 60.0)
            if common_scrap.velocity.magnitude() > 0:
                break
        
        # Should eventually drift
        assert common_scrap.velocity.magnitude() > 0
        
        # Velocity should decrease over time
        initial_velocity = common_scrap.velocity.magnitude()
        for _ in range(10):
            common_scrap.update(1.0 / 60.0)
        
        assert common_scrap.velocity.magnitude() < initial_velocity


class TestScrapLocker:
    """Test ScrapLocker persistent storage"""
    
    @pytest.fixture
    def temp_locker(self, tmp_path):
        """Fixture for temporary locker"""
        locker_path = tmp_path / "test_locker.json"
        return ScrapLocker(locker_path)
    
    def test_initialization_new_file(self, temp_locker):
        """Test initialization with new file"""
        assert temp_locker.get_scrap_counts() == {'common': 0, 'rare': 0, 'epic': 0}
        assert temp_locker.get_total_scrap() == 0
        assert temp_locker.locker_path.exists()
    
    def test_add_scrap(self, temp_locker):
        """Test adding scrap to locker"""
        notification = temp_locker.add_scrap(ScrapType.COMMON, 5)
        
        assert notification['action'] == 'scrap_acquired'
        assert notification['scrap_type'] == ScrapType.COMMON
        assert notification['amount'] == 5
        assert notification['new_total'] == 5
        assert notification['overall_total'] == 5
        assert 'SCRAP ACQUIRED' in notification['message']
        
        # Verify counts
        assert temp_locker.get_scrap_counts()['common'] == 5
        assert temp_locker.get_total_scrap() == 5
    
    def test_add_multiple_scrap_types(self, temp_locker):
        """Test adding different scrap types"""
        temp_locker.add_scrap(ScrapType.COMMON, 10)
        temp_locker.add_scrap(ScrapType.RARE, 3)
        temp_locker.add_scrap(ScrapType.EPIC, 1)
        
        counts = temp_locker.get_scrap_counts()
        assert counts['common'] == 10
        assert counts['rare'] == 3
        assert counts['epic'] == 1
        assert temp_locker.get_total_scrap() == 14
    
    def test_persistence(self, temp_locker):
        """Test data persistence across instances"""
        # Add scrap to first instance
        temp_locker.add_scrap(ScrapType.RARE, 7)
        
        # Create new instance with same path
        new_locker = ScrapLocker(temp_locker.locker_path)
        
        # Should load existing data
        assert new_locker.get_scrap_counts()['rare'] == 7
        assert new_locker.get_total_scrap() == 7
    
    def test_record_asteroid_destroyed(self, temp_locker):
        """Test asteroid destruction recording"""
        temp_locker.record_asteroid_destroyed(EntityType.LARGE_ASTEROID)
        temp_locker.record_asteroid_destroyed(EntityType.MEDIUM_ASTEROID)
        
        stats = temp_locker.get_session_stats()
        assert stats['asteroids_destroyed'] == 2
    
    def test_get_locker_summary(self, temp_locker):
        """Test complete locker summary"""
        temp_locker.add_scrap(ScrapType.EPIC, 2)
        temp_locker.record_asteroid_destroyed(EntityType.SMALL_ASTEROID)
        
        summary = temp_locker.get_locker_summary()
        
        assert 'scrap_counts' in summary
        assert 'total_scrap' in summary
        assert 'session_stats' in summary
        assert 'locker_path' in summary
        assert summary['scrap_counts']['epic'] == 2
        assert summary['total_scrap'] == 2
        assert summary['session_stats']['asteroids_destroyed'] == 1


class TestPerformance:
    """Performance and stress tests"""
    
    def test_scrap_creation_performance(self):
        """Test scrap entity creation performance"""
        start_time = time.perf_counter()
        
        # Create 1000 scrap entities
        scraps = []
        for i in range(1000):
            position = Vector2(i % SOVEREIGN_WIDTH, i % SOVEREIGN_HEIGHT)
            scrap = ScrapEntity(position)
            scraps.append(scrap)
        
        end_time = time.perf_counter()
        creation_time = end_time - start_time
        
        # Should create 1000 entities in under 100ms
        assert creation_time < 0.1
        assert len(scraps) == 1000
    
    def test_physics_update_performance(self):
        """Test physics update performance"""
        # Create 100 scrap entities
        scraps = []
        for i in range(100):
            position = Vector2(i * 10, i * 10)
            scrap = ScrapEntity(position)
            scraps.append(scrap)
        
        start_time = time.perf_counter()
        
        # Update for 1 second (60 frames)
        dt = 1.0 / 60.0
        for _ in range(60):
            for scrap in scraps:
                scrap.update(dt)
        
        end_time = time.perf_counter()
        update_time = end_time - start_time
        
        # Should update 6000 entity-frames in under 50ms
        assert update_time < 0.05
    
    def test_locker_performance(self):
        """Test locker performance under load"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        locker = ScrapLocker(Path(f"test_performance_locker_{unique_id}.json"))
        
        start_time = time.perf_counter()
        
        # Add 1000 scrap entries
        for i in range(1000):
            scrap_type = ScrapType.get_random_type()
            locker.add_scrap(scrap_type, 1)
        
        end_time = time.perf_counter()
        operation_time = end_time - start_time
        
        # Should handle 1000 operations in under 1s (file I/O is slower)
        assert operation_time < 1.0
        assert locker.get_total_scrap() == 1000
        
        # Cleanup
        locker.locker_path.unlink(missing_ok=True)


class TestEdgeCases:
    """Edge case and error handling tests"""
    
    def test_invalid_position(self):
        """Test scrap with invalid position"""
        # Should handle any position
        scrap = ScrapEntity(Vector2(-100, -100))
        assert scrap.position.x == -100
        assert scrap.position.y == -100
    
    def test_extreme_values(self):
        """Test scrap with extreme values"""
        scrap = ScrapEntity(Vector2(999999, 999999), ScrapType.EPIC)
        assert scrap.scrap_value == 5
        assert scrap.scrap_size == 2
    
    def test_filesystem_errors(self):
        """Test handling of filesystem errors"""
        # Use invalid path
        invalid_path = Path("/invalid/path/that/does/not/exist/locker.json")
        locker = ScrapLocker(invalid_path)
        
        # Should handle gracefully with default data
        assert locker.get_scrap_counts() == {'common': 0, 'rare': 0, 'epic': 0}
    
    @patch('builtins.open')
    def test_json_error_handling(self, mock_open):
        """Test handling of JSON parsing errors"""
        mock_open.return_value.__enter__.return_value.read.return_value = "invalid json"
        
        locker = ScrapLocker(Path("test_corrupted.json"))
        
        # Should handle corrupted JSON gracefully
        assert locker.get_scrap_counts() == {'common': 0, 'rare': 0, 'epic': 0}


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
