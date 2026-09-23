"""
Comprehensive tests for Multi-Pass Rendering System.

Tests the Poly-Graphical Architecture with different rendering methods
for specific UI zones, ensuring proper coordination and synchronization.
"""

import pytest
import time
from unittest.mock import Mock, MagicMock
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ui.render_passes import BaseRenderPass, RenderPassType, RenderContext, RenderResult, RenderPassRegistry
from ui.render_passes.pixel_viewport import PixelViewportPass, PixelViewportConfig
from ui.render_passes.braille_radar import BrailleRadarPass, RadarConfig, BrailleDot
from ui.render_passes.ansi_vitals import ANSIVitalsPass, VitalsConfig
from ui.render_passes.geometric_profile import GeometricProfilePass, ProfileConfig, ShapeType
from game_state import GameState
from world_ledger import WorldLedger, Coordinate


class TestRenderPassBase:
    """Test the base render pass functionality."""

    def test_render_pass_registry_initialization(self):
        """Test render pass registry initialization."""
        registry = RenderPassRegistry()
        
        assert len(registry.passes) == 0
        assert len(registry.render_order) == 0
        assert registry.get_all_passes() == []

    def test_render_pass_registration(self):
        """Test render pass registration."""
        registry = RenderPassRegistry()
        
        # Create a mock render pass
        class MockPass(BaseRenderPass):
            def __init__(self):
                super().__init__(RenderPassType.PIXEL_VIEWPORT)
            
            def render(self, context):
                return RenderResult("test", 5, 5, {})
            
            def get_optimal_size(self, context):
                return (5, 5)
        
        mock_pass = MockPass()
        registry.register_pass(mock_pass)
        
        assert len(registry.passes) == 1
        assert RenderPassType.PIXEL_VIEWPORT in registry.passes
        assert registry.get_pass(RenderPassType.PIXEL_VIEWPORT) == mock_pass
        assert len(registry.get_all_passes()) == 1

    def test_render_order_priority(self):
        """Test render pass order priority."""
        registry = RenderPassRegistry()
        
        # Register passes in different order
        registry.register_pass(GeometricProfilePass())
        registry.register_pass(PixelViewportPass())
        registry.register_pass(BrailleRadarPass())
        registry.register_pass(ANSIVitalsPass())
        
        # Check that they're in priority order
        expected_order = [
            RenderPassType.PIXEL_VIEWPORT,
            RenderPassType.BRAILLE_RADAR,
            RenderPassType.GEOMETRIC_PROFILE,
            RenderPassType.ANSI_VITALS
        ]
        
        actual_order = [pass_type for pass_type in registry.render_order]
        assert actual_order == expected_order

    def test_render_all_passes(self):
        """Test rendering all passes."""
        registry = RenderPassRegistry()
        
        # Register all passes
        registry.register_pass(PixelViewportPass())
        registry.register_pass(BrailleRadarPass())
        registry.register_pass(ANSIVitalsPass())
        registry.register_pass(GeometricProfilePass())
        
        # Create mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
        mock_game_state.position = mock_position
        
        mock_player = Mock()
        mock_player.hp = 85
        mock_player.max_hp = 100
        mock_game_state.player = mock_player
        
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        # Render all passes
        results = registry.render_all(context)
        
        # Check that all passes were rendered
        assert len(results) == 4
        assert RenderPassType.PIXEL_VIEWPORT in results
        assert RenderPassType.BRAILLE_RADAR in results
        assert RenderPassType.ANSI_VITALS in results
        assert RenderPassType.GEOMETRIC_PROFILE in results
        
        # Check result structure
        for pass_type, result in results.items():
            assert isinstance(result, RenderResult)
            assert result.content is not None
            assert result.width > 0
            assert result.height > 0
            assert isinstance(result.metadata, dict)

    def test_performance_summary(self):
        """Test performance summary generation."""
        registry = RenderPassRegistry()
        registry.register_pass(PixelViewportPass())
        registry.register_pass(BrailleRadarPass())
        
        summary = registry.get_performance_summary()
        
        assert isinstance(summary, dict)
        assert "total_passes" in summary
        assert summary["total_passes"] == 2
        assert "render_order" in summary
        assert "passes" in summary
        assert len(summary["passes"]) == 2


class TestPixelViewportPass:
    """Test the pixel viewport rendering pass."""

    def test_pixel_viewport_initialization(self):
        """Test pixel viewport pass initialization."""
        config = PixelViewportConfig(width=60, height=24)
        pass_obj = PixelViewportPass(config)
        
        assert pass_obj.config.width == 60
        assert pass_obj.config.height == 24
        assert pass_obj.pixel_width == 60
        assert pass_obj.pixel_height == 48  # 2:1 ratio
        assert pass_obj.pass_type == RenderPassType.PIXEL_VIEWPORT

    def test_pixel_viewport_rendering(self):
        """Test pixel viewport rendering."""
        pass_obj = PixelViewportPass()
        
        # Create mock context with proper position attribute
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
        mock_game_state.position = mock_position
        
        mock_ledger = Mock(spec=WorldLedger)
        pass_obj.set_world_ledger(mock_ledger)
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        result = pass_obj.render(context)
        
        assert isinstance(result, RenderResult)
        assert result.width == 60
        assert result.height == 24
        assert result.content is not None
        assert "pixel_width" in result.metadata
        assert result.metadata["pixel_width"] == 60
        assert result.metadata["pixel_height"] == 48

    def test_pixel_viewport_demo(self):
        """Test pixel viewport demo generation."""
        pass_obj = PixelViewportPass()
        
        demo = pass_obj.create_demo_frame()
        
        assert isinstance(demo, str)
        assert len(demo) > 0
        # Should contain Unicode block characters
        assert any(c in demo for c in ['█', '▀', '▄', '░', '▒', '▓'])

    def test_pixel_viewport_config_update(self):
        """Test pixel viewport configuration updates."""
        pass_obj = PixelViewportPass()
        
        new_config = PixelViewportConfig(width=80, height=30)
        pass_obj.update_config(new_config)
        
        assert pass_obj.config.width == 80
        assert pass_obj.config.height == 30
        assert pass_obj.pixel_width == 80
        assert pass_obj.pixel_height == 60


class TestBrailleRadarPass:
    """Test the Braille radar rendering pass."""

    def test_braille_radar_initialization(self):
        """Test Braille radar pass initialization."""
        config = RadarConfig(width=10, height=10)
        pass_obj = BrailleRadarPass(config)
        
        assert pass_obj.config.width == 10
        assert pass_obj.config.height == 10
        assert pass_obj.pass_type == RenderPassType.BRAILLE_RADAR
        assert pass_obj.BRAILLE_BASE == 0x2800

    def test_braille_dot_mapping(self):
        """Test Braille dot coordinate mapping."""
        pass_obj = BrailleRadarPass()
        
        # Test all 8 dot positions
        test_cases = [
            ((0, 0), BrailleDot.DOT_1),
            ((0, 1), BrailleDot.DOT_2),
            ((1, 0), BrailleDot.DOT_3),
            ((1, 1), BrailleDot.DOT_7),
            ((2, 0), BrailleDot.DOT_4),
            ((2, 1), BrailleDot.DOT_5),
            ((3, 0), BrailleDot.DOT_6),
            ((3, 1), BrailleDot.DOT_8),
        ]
        
        for (sub_x, sub_y), expected_dot in test_cases:
            dot = pass_obj._sub_pixel_to_braille_dot(sub_x, sub_y)
            assert dot == expected_dot

    def test_braille_radar_rendering(self):
        """Test Braille radar rendering."""
        pass_obj = BrailleRadarPass()
        
        # Create mock context with proper position attribute
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
        mock_game_state.position = mock_position
        
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None  # Empty world
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        result = pass_obj.render(context)
        
        assert isinstance(result, RenderResult)
        assert result.width == 10
        assert result.height == 10
        assert result.content is not None
        assert "resolution" in result.metadata
        assert result.metadata["resolution"] == "40x20 sub-pixels"

    def test_blinking_animation(self):
        """Test player blinking animation."""
        pass_obj = BrailleRadarPass(RadarConfig(player_blink=True))

        # Initialize with a time that will trigger blinking
        initial_time = time.time()
        pass_obj.last_blink_time = initial_time - 1.0  # Force immediate blink
        pass_obj.blink_state = True  # Set initial state
        
        # Update blinking - should toggle state
        pass_obj._update_blinking(initial_time)
        
        # The blink state should have changed
        assert pass_obj.blink_state == False

    def test_entity_tracking(self):
        """Test entity tracking functionality."""
        pass_obj = BrailleRadarPass()
        
        # Initially no entities
        assert pass_obj.get_entity_count() == 0
        
        # Add some entities
        pass_obj.entity_states["test_entity"] = {
            "type": "hostile",
            "char_x": 5,
            "char_y": 5,
            "last_seen": time.time()
        }
        
        assert pass_obj.get_entity_count() == 1
        
        # Clear entities
        pass_obj.clear_entities()
        assert pass_obj.get_entity_count() == 0


class TestANSIVitalsPass:
    """Test the ANSI vitals rendering pass."""

    def test_ansi_vitals_initialization(self):
        """Test ANSI vitals pass initialization."""
        config = VitalsConfig(width=20, height=8)
        pass_obj = ANSIVitalsPass(config)
        
        assert pass_obj.config.width == 20
        assert pass_obj.config.height == 8
        assert pass_obj.pass_type == RenderPassType.ANSI_VITALS
        assert "critical" in pass_obj.colors
        assert "full" in pass_obj.colors

    def test_progress_bar_creation(self):
        """Test progress bar creation."""
        pass_obj = ANSIVitalsPass()
        
        # Test different percentages
        bar_0 = pass_obj._create_progress_bar("HP", 0, 20)
        bar_25 = pass_obj._create_progress_bar("HP", 25, 20)
        bar_50 = pass_obj._create_progress_bar("HP", 50, 20)
        bar_75 = pass_obj._create_progress_bar("HP", 75, 20)
        bar_100 = pass_obj._create_progress_bar("HP", 100, 20)
        
        # All should contain ANSI color codes
        for bar in [bar_0, bar_25, bar_50, bar_75, bar_100]:
            assert "\033[" in bar  # ANSI color codes
            assert "HP" in bar

    def test_color_selection(self):
        """Test color selection based on percentage."""
        pass_obj = ANSIVitalsPass()
        
        # Test color mapping
        assert pass_obj.colors["critical"] == "\033[38;5;196m"  # Red
        assert pass_obj.colors["low"] == "\033[38;5;208m"        # Orange
        assert pass_obj.colors["medium"] == "\033[38;5;226m"     # Yellow
        assert pass_obj.colors["high"] == "\033[38;5;46m"       # Green
        assert pass_obj.colors["full"] == "\033[38;5;34m"        # Bright green

    def test_ansi_vitals_rendering(self):
        """Test ANSI vitals rendering."""
        pass_obj = ANSIVitalsPass()
        
        # Create mock context with proper player attribute
        mock_game_state = Mock(spec=GameState)
        mock_player = Mock()
        mock_player.hp = 75
        mock_player.max_hp = 100
        mock_game_state.player = mock_player
        
        mock_ledger = Mock(spec=WorldLedger)
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        result = pass_obj.render(context)
        
        assert isinstance(result, RenderResult)
        assert result.width == 20
        assert result.height == 8
        assert result.content is not None
        assert "hp_percent" in result.metadata
        assert result.metadata["hp_percent"] == 75.0


class TestGeometricProfilePass:
    """Test the geometric profile rendering pass."""

    def test_geometric_profile_initialization(self):
        """Test geometric profile pass initialization."""
        config = ProfileConfig(width=15, height=10)
        pass_obj = GeometricProfilePass(config)
        
        assert pass_obj.config.width == 15
        assert pass_obj.config.height == 10
        assert pass_obj.config.shape_type == ShapeType.TRIANGLE
        assert pass_obj.pass_type == RenderPassType.GEOMETRIC_PROFILE

    def test_shape_rendering(self):
        """Test different shape rendering."""
        pass_obj = GeometricProfilePass()
        
        # Test each shape type
        shapes = [
            ShapeType.TRIANGLE,
            ShapeType.SQUARE,
            ShapeType.CIRCLE,
            ShapeType.DIAMOND,
            ShapeType.STAR,
            ShapeType.HEXAGON
        ]
        
        for shape_type in shapes:
            pass_obj.set_shape_type(shape_type)
            buffer = pass_obj._create_shape_buffer()
            
            # Should have some non-space characters
            has_content = any(
                any(char != " " for char in row)
                for row in buffer
            )
            assert has_content, f"Shape {shape_type.value} should have content"
    
    def test_line_drawing(self):
        """Test line drawing functionality."""
        pass_obj = GeometricProfilePass()
        
        # Create a small buffer
        buffer = [[" " for _ in range(10)] for _ in range(10)]
        
        # Test horizontal and vertical lines
        pass_obj._draw_line(buffer, (0, 0), (9, 0))
        pass_obj._draw_line(buffer, (0, 0), (0, 9))
        
        # Should have line characters
        assert buffer[0][0] != " "  # Start point
        assert buffer[0][9] != " "  # End point of horizontal line
        assert buffer[9][0] != " "  # End point of vertical line
        # Note: buffer[9][9] should be empty since we only drew to (9,0) and (0,9)
    
    def test_rotation_animation(self):
        """Test rotation animation."""
        pass_obj = GeometricProfilePass(ProfileConfig(animate_rotation=True))
        
        # Reset rotation angle and time for testing
        pass_obj.rotation_angle = 0.0
        pass_obj.last_rotation_time = time.time()
        
        initial_angle = pass_obj.rotation_angle
        pass_obj._update_rotation(time.time())
        
        # Should not rotate immediately
        assert pass_obj.rotation_angle == initial_angle
        
        # Force rotation
        pass_obj.last_rotation_time = time.time() - 0.2
        pass_obj._update_rotation(time.time())
        
        assert pass_obj.rotation_angle != initial_angle
    
    def test_geometric_profile_rendering(self):
        """Test geometric profile rendering."""
        pass_obj = GeometricProfilePass()
        
        # Create mock context with proper position attribute
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
        mock_game_state.position = mock_position
        
        mock_ledger = Mock(spec=WorldLedger)
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        result = pass_obj.render(context)
        
        assert isinstance(result, RenderResult)
        assert result.width == 15
        assert result.height == 10
        assert result.content is not None
        assert "shape_type" in result.metadata
        assert result.metadata["shape_type"] == "triangle"


class TestIntegration:
    """Integration tests for the complete multi-pass system."""

    def test_complete_multi_pass_system(self):
        """Test the complete multi-pass rendering system."""
        # Create all passes
        registry = RenderPassRegistry()
        registry.register_pass(PixelViewportPass())
        registry.register_pass(BrailleRadarPass())
        registry.register_pass(ANSIVitalsPass())
        registry.register_pass(GeometricProfilePass())
        
        # Create comprehensive mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 25.0
        mock_position.y = 30.0
        mock_game_state.position = mock_position
        
        mock_player = Mock()
        mock_player.hp = 85
        mock_player.max_hp = 100
        mock_game_state.player = mock_player
        
        mock_ledger = Mock(spec=WorldLedger)
        
        # Mock world chunks for radar
        def mock_get_chunk(coord, layer):
            chunk = Mock()
            chunk.coordinate = coord
            # Add some walls
            if coord.x in [10, 20, 30] and coord.y in [10, 20, 30]:
                chunk.tags = ["wall"]
            else:
                chunk.tags = []
            return chunk
        
        mock_ledger.get_chunk = mock_get_chunk
        
        # Set __iter__ directly on the mock object
        def mock_iter():
            return iter([])
        
        type(mock_ledger).__iter__ = lambda self: iter([])
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        # Render all passes
        results = registry.render_all(context)
        
        # Verify all passes rendered successfully
        assert len(results) == 4
        
        # Check each pass has appropriate content
        pixel_result = results[RenderPassType.PIXEL_VIEWPORT]
        assert "█" in pixel_result.content or "▀" in pixel_result.content  # Pixel art
        
        radar_result = results[RenderPassType.BRAILLE_RADAR]
        assert chr(0x2800) in radar_result.content  # Braille base character
        
        vitals_result = results[RenderPassType.ANSI_VITALS]
        assert "HP:" in vitals_result.content  # Health display
        
        profile_result = results[RenderPassType.GEOMETRIC_PROFILE]
        assert any(c in profile_result.content for c in ['/', '\\', '|', '_'])  # Line art

    def test_coordinate_synchronization(self):
        """Test coordinate synchronization across passes."""
        registry = RenderPassRegistry()
        registry.register_pass(PixelViewportPass())
        registry.register_pass(BrailleRadarPass())
        
        # Create mock game state with proper position attribute
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 42.5
        mock_position.y = 37.8
        mock_game_state.position = mock_position
        
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        results = registry.render_all(context)
        
        # Both passes should use the same player position
        pixel_result = results[RenderPassType.PIXEL_VIEWPORT]
        radar_result = results[RenderPassType.BRAILLE_RADAR]
        
        # Should have some content
        assert pixel_result.content is not None
        assert radar_result.content is not None
        
        # The player should be visible in both renders
        # (This is a basic check - in reality, the positions would be transformed
        # based on each pass's coordinate system)
        assert pixel_result.content is not None
        assert radar_result.content is not None

    def test_performance_with_all_passes(self):
        """Test performance with all passes active."""
        registry = RenderPassRegistry()
        registry.register_pass(PixelViewportPass())
        registry.register_pass(BrailleRadarPass())
        registry.register_pass(ANSIVitalsPass())
        registry.register_pass(GeometricProfilePass())
        
        # Create mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 50.0
        mock_position.y = 50.0
        mock_game_state.position = mock_position
        
        mock_player = Mock()
        mock_player.hp = 100
        mock_player.max_hp = 100
        mock_game_state.player = mock_player
        
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None
        
        context = RenderContext(
            game_state=mock_game_state,
            world_ledger=mock_ledger,
            viewport_bounds=(0, 0, 100, 100),
            current_time=time.time(),
            frame_count=1
        )
        
        # Measure performance
        start_time = time.time()
        
        # Render multiple frames
        for i in range(10):
            context.frame_count = i
            results = registry.render_all(context)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / 10
        
        # Should be reasonably fast (under 0.1s per frame)
        assert avg_time < 0.1, f"Average render time too slow: {avg_time:.4f}s"
        
        # Check performance summary
        summary = registry.get_performance_summary()
        assert summary["total_passes"] == 4
        assert len(summary["passes"]) == 4


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
