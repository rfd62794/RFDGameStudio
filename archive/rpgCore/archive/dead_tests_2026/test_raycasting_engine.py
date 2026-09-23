"""
Comprehensive tests for raycasting engine and SOLID components.

Tests edge cases, performance, and integration scenarios for the
refactored ASCIIDoomRenderer system.
"""

import pytest
import math
from unittest.mock import Mock, MagicMock
from dataclasses import dataclass
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from world_ledger import WorldLedger, Coordinate, WorldChunk
from game_state import GameState
from ui.raycasting_engine import RayCaster
from ui.character_renderer import CharacterRenderer, RenderConfig
from ui.raycasting_types import Ray3D, HitResult


class TestRay3D:
    """Test the Ray3D dataclass and its methods."""

    def test_ray_creation(self):
        """Test basic ray creation."""
        ray = Ray3D(origin_x=0.0, origin_y=0.0, angle=45.0, length=10.0)
        assert ray.origin_x == 0.0
        assert ray.origin_y == 0.0
        assert ray.angle == 45.0
        assert ray.length == 10.0

    def test_get_direction_0_degrees(self):
        """Test direction calculation for 0 degrees (pointing right)."""
        ray = Ray3D(0, 0, 0, 10)
        direction = ray.get_direction()
        assert abs(direction[0] - 1.0) < 0.0001  # cos(0) = 1
        assert abs(direction[1] - 0.0) < 0.0001  # sin(0) = 0

    def test_get_direction_90_degrees(self):
        """Test direction calculation for 90 degrees (pointing up)."""
        ray = Ray3D(0, 0, 90, 10)
        direction = ray.get_direction()
        assert abs(direction[0] - 0.0) < 0.0001  # cos(90) = 0
        assert abs(direction[1] - 1.0) < 0.0001  # sin(90) = 1

    def test_get_direction_45_degrees(self):
        """Test direction calculation for 45 degrees."""
        ray = Ray3D(0, 0, 45, 10)
        direction = ray.get_direction()
        expected = math.sqrt(2) / 2
        assert abs(direction[0] - expected) < 0.0001
        assert abs(direction[1] - expected) < 0.0001

    def test_normalize_angle(self):
        """Test angle normalization to 0-360 range."""
        ray = Ray3D(0, 0, 450, 10)  # 450 degrees = 90 degrees normalized
        normalized = ray.normalize_angle()
        assert normalized.angle == 90.0

    def test_normalize_negative_angle(self):
        """Test normalization of negative angles."""
        ray = Ray3D(0, 0, -90, 10)  # -90 degrees = 270 degrees normalized
        normalized = ray.normalize_angle()
        assert normalized.angle == 270.0


class TestHitResult:
    """Test the HitResult dataclass and its helper methods."""

    def test_hit_result_creation(self):
        """Test basic hit result creation."""
        coord = Coordinate(5, 5, 0)
        hit = HitResult(
            hit=True,
            distance=10.0,
            height=1.0,
            content="wall",
            coordinate=coord,
            entity_id=None
        )
        assert hit.hit is True
        assert hit.distance == 10.0
        assert hit.content == "wall"

    def test_is_entity_hit(self):
        """Test entity hit detection."""
        coord = Coordinate(5, 5, 0)
        entity_hit = HitResult(True, 10.0, 1.0, "entity", coord, "entity_123")
        wall_hit = HitResult(True, 10.0, 1.0, "wall", coord, None)
        
        assert entity_hit.is_entity_hit() is True
        assert wall_hit.is_entity_hit() is False

    def test_is_wall_hit(self):
        """Test wall hit detection."""
        coord = Coordinate(5, 5, 0)
        wall_hit = HitResult(True, 10.0, 1.0, "wall", coord, None)
        entity_hit = HitResult(True, 10.0, 1.0, "entity", coord, "entity_123")
        
        assert wall_hit.is_wall_hit() is True
        assert entity_hit.is_wall_hit() is False

    def test_is_item_hit(self):
        """Test item hit detection."""
        coord = Coordinate(5, 5, 0)
        item_hit = HitResult(True, 5.0, 0.5, "item", coord, None)
        wall_hit = HitResult(True, 10.0, 1.0, "wall", coord, None)
        
        assert item_hit.is_item_hit() is True
        assert wall_hit.is_item_hit() is False

    def test_get_depth_score(self):
        """Test depth score calculation for z-ordering."""
        close_hit = HitResult(True, 2.0, 1.0, "wall", None, None)
        far_hit = HitResult(True, 10.0, 1.0, "wall", None, None)
        miss = HitResult(False, 20.0, 0.0, "", None, None)
        
        close_score = close_hit.get_depth_score()
        far_score = far_hit.get_depth_score()
        miss_score = miss.get_depth_score()
        
        assert close_score > far_score  # Closer objects have higher scores
        assert far_score > miss_score   # Hits have higher scores than misses
        assert miss_score == 0.0        # Misses have zero score


class TestCharacterRenderer:
    """Test the CharacterRenderer component."""

    def test_renderer_creation(self):
        """Test renderer creation with default config."""
        renderer = CharacterRenderer()
        assert renderer.config is not None
        assert len(renderer.config.wall_chars) > 0
        assert len(renderer.config.entity_chars) > 0
        assert renderer.threat_mode is False

    def test_renderer_creation_with_custom_config(self):
        """Test renderer creation with custom configuration."""
        config = RenderConfig(
            wall_chars=['#', '='],
            entity_chars=['@', '&'],
            item_chars=['$', '%'],
            threat_chars=['!', '?'],
            floor_chars=['.']
        )
        renderer = CharacterRenderer(config)
        assert renderer.config.wall_chars == ['#', '=']
        assert renderer.config.entity_chars == ['@', '&']

    def test_invalid_config_raises_error(self):
        """Test that invalid configuration raises ValueError."""
        with pytest.raises(ValueError):
            config = RenderConfig(
                wall_chars=[],  # Empty list is invalid
                entity_chars=['@'],
                item_chars=['$'],
                threat_chars=['!'],
                floor_chars=['.']
            )
            CharacterRenderer(config)

    def test_get_character_no_hit(self):
        """Test character rendering for missed rays."""
        renderer = CharacterRenderer()
        hit = HitResult(False, 20.0, 0.0, "", None, None)
        char = renderer.get_character(hit)
        assert char == ' '

    def test_get_character_wall_hit(self):
        """Test character rendering for wall hits."""
        renderer = CharacterRenderer()
        coord = Coordinate(5, 5, 0)
        hit = HitResult(True, 3.0, 1.0, "wall", coord, None)
        char = renderer.get_character(hit)
        assert char in renderer.config.wall_chars

    def test_get_character_entity_hit(self):
        """Test character rendering for entity hits."""
        renderer = CharacterRenderer()
        coord = Coordinate(5, 5, 0)
        hit = HitResult(True, 4.0, 1.0, "entity", coord, "entity_123")
        char = renderer.get_character(hit)
        assert char in renderer.config.entity_chars

    def test_get_character_item_hit(self):
        """Test character rendering for item hits."""
        renderer = CharacterRenderer()
        coord = Coordinate(5, 5, 0)
        hit = HitResult(True, 2.0, 0.5, "item", coord, None)
        char = renderer.get_character(hit)
        assert char in renderer.config.item_chars

    def test_threat_mode(self):
        """Test threat mode functionality."""
        renderer = CharacterRenderer()
        coord = Coordinate(5, 5, 0)
        hit = HitResult(True, 4.0, 1.0, "entity", coord, "entity_123")
        
        # Without threat mode
        char_normal = renderer.get_character(hit)
        assert char_normal in renderer.config.entity_chars
        
        # With threat mode
        renderer.set_threat_mode(True)
        char_threat = renderer.get_character(hit)
        assert char_threat in renderer.config.threat_chars

    def test_distance_shading(self):
        """Test distance-based shading."""
        renderer = CharacterRenderer()
        
        # Close objects should remain unchanged
        close_char = renderer.apply_distance_shading('#', 3.0)
        assert close_char == '#'
        
        # Distant objects should be shaded
        far_char = renderer.apply_distance_shading('#', 20.0)
        assert far_char in ['░', '▒', '▓']

    def test_config_update(self):
        """Test configuration updates."""
        renderer = CharacterRenderer()
        new_config = RenderConfig(
            wall_chars=['X', 'Y'],
            entity_chars=['A', 'B'],
            item_chars=['C', 'D'],
            threat_chars=['E', 'F'],
            floor_chars=['G']
        )
        
        renderer.update_config(new_config)
        assert renderer.config.wall_chars == ['X', 'Y']


class TestRayCaster:
    """Test the RayCaster component."""

    def test_ray_caster_creation(self):
        """Test ray caster creation."""
        mock_ledger = Mock(spec=WorldLedger)
        caster = RayCaster(mock_ledger, max_distance=15.0)
        assert caster.world_ledger == mock_ledger
        assert caster.max_distance == 15.0
        assert len(caster.wall_tags) > 0

    def test_cast_ray_no_hit(self):
        """Test ray casting with no hits."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None  # No chunks
        
        caster = RayCaster(mock_ledger)
        ray = Ray3D(0, 0, 0, 10)
        mock_game_state = Mock(spec=GameState)
        
        hit = caster.cast_ray(ray, mock_game_state)
        
        assert hit.hit is False
        assert hit.distance == ray.length
        assert hit.content == ''

    def test_cast_ray_wall_hit(self):
        """Test ray casting with wall hit."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_chunk = Mock(spec=WorldChunk)
        mock_chunk.coordinate = Coordinate(0, 0, 0)
        mock_chunk.tags = ["wall"]
        mock_ledger.get_chunk.return_value = mock_chunk
        
        caster = RayCaster(mock_ledger)
        ray = Ray3D(0, 0, 0, 10)
        mock_game_state = Mock(spec=GameState)
        
        hit = caster.cast_ray(ray, mock_game_state)
        
        assert hit.hit is True
        assert hit.content == "wall"
        assert hit.coordinate is not None

    def test_cast_ray_entity_hit(self):
        """Test ray casting with entity hit."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_chunk = Mock(spec=WorldChunk)
        mock_chunk.coordinate = Coordinate(0, 0, 0)
        mock_chunk.tags = []  # Not a wall
        mock_ledger.get_chunk.return_value = mock_chunk
        
        caster = RayCaster(mock_ledger)
        ray = Ray3D(0, 0, 0, 10)
        mock_game_state = Mock(spec=GameState)
        
        # Mock entity detection
        with pytest.patch.object(caster, '_get_entity_at') as mock_entity:
            mock_entity.return_value = Mock()
            mock_entity.return_value.id = "entity_123"
            
            hit = caster.cast_ray(ray, mock_game_state)
            
            assert hit.hit is True
            assert hit.content == "entity"
            assert hit.entity_id == "entity_123"

    def test_safe_coordinate_bounds_checking(self):
        """Test coordinate bounds checking."""
        mock_ledger = Mock(spec=WorldLedger)
        caster = RayCaster(mock_ledger)
        
        # Valid coordinates
        coord = caster._get_safe_coordinate(5.0, 5.0)
        assert coord == Coordinate(5, 5, 0)
        
        # Invalid coordinates (too large)
        coord = caster._get_safe_coordinate(2000.0, 2000.0)
        assert coord is None
        
        # Invalid coordinates (NaN)
        coord = caster._get_safe_coordinate(float('nan'), 5.0)
        assert coord is None

    def test_is_wall_detection(self):
        """Test wall detection logic."""
        mock_ledger = Mock(spec=WorldLedger)
        caster = RayCaster(mock_ledger)
        
        # Wall chunk
        wall_chunk = Mock(spec=WorldChunk)
        wall_chunk.coordinate = Coordinate(0, 0, 0)
        wall_chunk.tags = ["wall"]
        assert caster._is_wall(wall_chunk, 0.5, 0.5) is True
        
        # Non-wall chunk
        floor_chunk = Mock(spec=WorldChunk)
        floor_chunk.coordinate = Coordinate(0, 0, 0)
        floor_chunk.tags = ["floor"]
        assert caster._is_wall(floor_chunk, 0.5, 0.5) is False
        
        # Missing chunk (treated as wall)
        assert caster._is_wall(None, 0.5, 0.5) is True
        
        # Out of bounds (treated as wall)
        chunk = Mock(spec=WorldChunk)
        chunk.coordinate = Coordinate(0, 0, 0)
        assert caster._is_wall(chunk, 1.5, 1.5) is True

    def test_max_distance_update(self):
        """Test updating maximum distance."""
        mock_ledger = Mock(spec=WorldLedger)
        caster = RayCaster(mock_ledger)
        
        caster.set_max_distance(25.0)
        assert caster.max_distance == 25.0
        
        # Invalid distance should be ignored
        caster.set_max_distance(-5.0)
        assert caster.max_distance == 25.0  # Should remain unchanged


class TestIntegration:
    """Integration tests for the complete raycasting system."""

    def test_full_raycasting_pipeline(self):
        """Test the complete raycasting pipeline."""
        # Setup mocks
        mock_ledger = Mock(spec=WorldLedger)
        mock_chunk = Mock(spec=WorldChunk)
        mock_chunk.coordinate = Coordinate(1, 0, 0)
        mock_chunk.tags = ["wall"]
        mock_ledger.get_chunk.return_value = mock_chunk
        
        # Create components
        caster = RayCaster(mock_ledger, max_distance=10)
        renderer = CharacterRenderer()
        
        # Cast ray
        ray = Ray3D(0, 0, 0, 10)
        mock_game_state = Mock(spec=GameState)
        
        hit = caster.cast_ray(ray, mock_game_state)
        char = renderer.get_character(hit)
        
        # Verify pipeline
        assert hit.hit is True
        assert hit.content == "wall"
        assert char in renderer.config.wall_chars

    def test_threat_mode_integration(self):
        """Test threat mode integration across components."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_chunk = Mock(spec=WorldChunk)
        mock_chunk.coordinate = Coordinate(1, 0, 0)
        mock_chunk.tags = []  # Not a wall
        
        # Mock entity
        mock_entity = Mock()
        mock_entity.id = "threat_entity"
        
        mock_ledger.get_chunk.return_value = mock_chunk
        
        caster = RayCaster(mock_ledger)
        renderer = CharacterRenderer()
        
        # Enable threat mode
        renderer.set_threat_mode(True)
        
        ray = Ray3D(0, 0, 0, 10)
        mock_game_state = Mock(spec=GameState)
        
        # Mock entity detection
        with pytest.patch.object(caster, '_get_entity_at') as mock_entity_func:
            mock_entity_func.return_value = mock_entity
            
            hit = caster.cast_ray(ray, mock_game_state)
            char = renderer.get_character(hit)
            
            assert hit.hit is True
            assert hit.content == "entity"
            assert char in renderer.config.threat_chars


class TestPerformance:
    """Performance tests for raycasting components."""

    def test_raycasting_performance(self):
        """Test raycasting performance with many rays."""
        import time
        
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None  # No hits for speed
        
        caster = RayCaster(mock_ledger)
        mock_game_state = Mock(spec=GameState)
        
        # Cast many rays
        start_time = time.time()
        for i in range(1000):
            ray = Ray3D(0, 0, i % 360, 10)
            caster.cast_ray(ray, mock_game_state)
        end_time = time.time()
        
        # Should complete quickly (adjust threshold as needed)
        duration = end_time - start_time
        assert duration < 1.0  # 1000 rays should take less than 1 second

    def test_character_renderer_performance(self):
        """Test character renderer performance."""
        import time
        
        renderer = CharacterRenderer()
        
        # Create many hit results
        hits = []
        for i in range(1000):
            coord = Coordinate(i % 10, i % 10, 0)
            hit = HitResult(
                hit=True,
                distance=float(i % 20),
                height=1.0,
                content="wall",
                coordinate=coord,
                entity_id=None
            )
            hits.append(hit)
        
        # Render many characters
        start_time = time.time()
        for hit in hits:
            renderer.get_character(hit)
        end_time = time.time()
        
        duration = end_time - start_time
        assert duration < 0.1  # 1000 character renders should be very fast


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
