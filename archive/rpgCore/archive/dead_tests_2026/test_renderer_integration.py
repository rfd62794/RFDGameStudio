"""
Integration test for the refactored ASCIIDoomRenderer.

Tests that the SOLID refactoring maintains compatibility with the existing system.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import pytest
from unittest.mock import Mock

from world_ledger import WorldLedger, Coordinate, WorldChunk
from game_state import GameState
from ui.renderer_3d import ASCIIDoomRenderer


class TestASCIIDoomRendererIntegration:
    """Integration tests for the refactored ASCIIDoomRenderer."""

    def test_renderer_initialization(self):
        """Test that the refactored renderer initializes correctly."""
        mock_ledger = Mock(spec=WorldLedger)
        
        renderer = ASCIIDoomRenderer(
            world_ledger=mock_ledger,
            width=80,
            height=24,
            faction_system=None
        )
        
        # Verify SOLID components are initialized
        assert renderer.ray_caster is not None
        assert renderer.character_renderer is not None
        assert renderer.sprite_billboard is not None
        
        # Verify legacy compatibility
        assert renderer.width == 80
        assert renderer.height == 24
        assert renderer.half_height == 12
        assert renderer.fov > 0

    def test_render_frame_basic(self):
        """Test basic frame rendering functionality."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None  # No chunks
        
        renderer = ASCIIDoomRenderer(
            world_ledger=mock_ledger,
            width=40,
            height=20
        )
        
        # Create mock game state
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 5.0
        mock_position.y = 5.0
        mock_game_state.position = mock_position
        mock_game_state.player_angle = 0.0
        
        # Render frame
        frame = renderer.render_frame(
            game_state=mock_game_state,
            player_angle=0.0,
            perception_range=10
        )
        
        # Verify frame structure
        assert isinstance(frame, list)
        assert len(frame) == 20  # height
        assert len(frame[0]) == 40  # width
        assert all(isinstance(row, list) for row in frame)

    def test_threat_mode_functionality(self):
        """Test threat mode integration."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None
        
        renderer = ASCIIDoomRenderer(
            world_ledger=mock_ledger,
            width=40,
            height=20
        )
        
        # Test threat mode toggle
        renderer.set_threat_mode(True)
        assert renderer.threat_mode is True
        assert renderer.character_renderer.threat_mode is True
        
        renderer.set_threat_mode(False)
        assert renderer.threat_mode is False
        assert renderer.character_renderer.threat_mode is False

    def test_legacy_compatibility(self):
        """Test that legacy methods still work for backward compatibility."""
        mock_ledger = Mock(spec=WorldLedger)
        
        renderer = ASCIIDoomRenderer(
            world_ledger=mock_ledger,
            width=80,
            height=24
        )
        
        # Test legacy character arrays are still accessible
        assert hasattr(renderer, 'wall_chars')
        assert hasattr(renderer, 'entity_chars')
        assert hasattr(renderer, 'item_chars')
        assert hasattr(renderer, 'threat_chars')
        
        # Test they're populated from the character renderer
        assert len(renderer.wall_chars) > 0
        assert len(renderer.entity_chars) > 0

    def test_get_frame_as_string(self):
        """Test frame to string conversion."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None
        
        renderer = ASCIIDoomRenderer(
            world_ledger=mock_ledger,
            width=10,
            height=5
        )
        
        # Create a simple frame
        frame = [[' ' for _ in range(10)] for _ in range(5)]
        frame[2][5] = '#'
        
        # Convert to string
        frame_string = renderer.get_frame_as_string(frame)
        
        # Verify conversion
        assert isinstance(frame_string, str)
        assert len(frame_string.split('\n')) == 5  # height lines
        assert all(len(line) == 10 for line in frame_string.split('\n'))  # width

    def test_viewport_summary(self):
        """Test viewport summary functionality."""
        mock_ledger = Mock(spec=WorldLedger)
        
        renderer = ASCIIDoomRenderer(
            world_ledger=mock_ledger,
            width=80,
            height=24
        )
        
        summary = renderer.get_viewport_summary()
        
        # Verify summary structure
        assert isinstance(summary, dict)
        assert 'width' in summary
        assert 'height' in summary
        assert 'fov' in summary
        assert 'wall_chars' in summary
        
        assert summary['width'] == 80
        assert summary['height'] == 24


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
