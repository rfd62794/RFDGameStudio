"""
Comprehensive tests for pixel rendering system.

Tests Unicode half-block rendering, sprite registry, and integration
with the fixed-grid architecture.
"""

import pytest
import time
from unittest.mock import Mock, MagicMock
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ui.pixel_renderer import PixelRenderer, Pixel, AnimatedSprite, SpriteFrame, ColorPalette, BlockType
from ui.sprite_registry import SpriteRegistry, SpriteTemplate, SpriteType
from ui.pixel_viewport import PixelViewport, ViewportConfig
from world_ledger import WorldLedger, Coordinate, WorldChunk
from game_state import GameState


class TestPixel:
    """Test the Pixel dataclass and color conversion."""

    def test_pixel_creation(self):
        """Test basic pixel creation."""
        pixel = Pixel(r=3, g=2, b=1, intensity=0.8)
        assert pixel.r == 3
        assert pixel.g == 2
        assert pixel.b == 1
        assert pixel.intensity == 0.8

    def test_pixel_is_empty(self):
        """Test empty pixel detection."""
        empty_pixel = Pixel()
        assert empty_pixel.is_empty() is True
        
        filled_pixel = Pixel(r=1, g=1, b=1, intensity=0.5)
        assert filled_pixel.is_empty() is False
        
        zero_intensity = Pixel(r=3, g=2, b=1, intensity=0.0)
        assert zero_intensity.is_empty() is True

    def test_pixel_to_ansi_color(self):
        """Test ANSI color conversion."""
        # Black (empty)
        pixel = Pixel()
        assert pixel.to_ansi_color() == 0
        
        # White (max values)
        pixel = Pixel(r=5, g=5, b=5, intensity=1.0)
        expected = 16 + 36*5 + 6*5 + 5  # 231 (white)
        assert pixel.to_ansi_color() == expected
        
        # Red
        pixel = Pixel(r=5, g=0, b=0, intensity=1.0)
        expected = 16 + 36*5 + 6*0 + 0  # 196 (red)
        assert pixel.to_ansi_color() == expected

    def test_pixel_to_hex(self):
        """Test hex color conversion."""
        # Black
        pixel = Pixel()
        assert pixel.to_hex() == "#000000"
        
        # White
        pixel = Pixel(r=5, g=5, b=5, intensity=1.0)
        assert pixel.to_hex() == "#ffffff"
        
        # Red
        pixel = Pixel(r=5, g=0, b=0, intensity=1.0)
        assert pixel.to_hex() == "#ff0000"


class TestColorPalette:
    """Test the color palette system."""

    def test_faction_colors(self):
        """Test faction color mapping."""
        legion_color = ColorPalette.get_faction_color("legion")
        assert legion_color.r == 5  # Red
        assert legion_color.g == 0
        assert legion_color.b == 0
        
        merchants_color = ColorPalette.get_faction_color("merchants")
        assert merchants_color.r == 5  # Gold
        assert merchants_color.g == 4
        assert merchants_color.b == 0
        
        # Default to neutral for unknown faction
        unknown_color = ColorPalette.get_faction_color("unknown")
        neutral_color = ColorPalette.get_faction_color("neutral")
        assert unknown_color.r == neutral_color.r
        assert unknown_color.g == neutral_color.g
        assert unknown_color.b == neutral_color.b

    def test_environment_colors(self):
        """Test environment color mapping."""
        wall_color = ColorPalette.get_environment_color("wall")
        assert wall_color.r == 2  # Dark grey
        assert wall_color.g == 2
        assert wall_color.b == 2
        
        floor_color = ColorPalette.get_environment_color("floor")
        assert floor_color.r == 1  # Light grey
        assert floor_color.g == 1
        assert floor_color.b == 1

    def test_intensity_scaling(self):
        """Test intensity affects color but not RGB values."""
        base_color = ColorPalette.get_faction_color("legion", 1.0)
        dim_color = ColorPalette.get_faction_color("legion", 0.5)
        
        # RGB values should be the same
        assert base_color.r == dim_color.r
        assert base_color.g == dim_color.g
        assert base_color.b == dim_color.b
        
        # Intensity should differ
        assert base_color.intensity == 1.0
        assert dim_color.intensity == 0.5


class TestSpriteFrame:
    """Test sprite frame functionality."""

    def test_sprite_frame_creation(self):
        """Test sprite frame creation."""
        pixels = [
            [Pixel(r=1, g=1, b=1), Pixel()],
            [Pixel(), Pixel(r=2, g=2, b=2)]
        ]
        frame = SpriteFrame(pixels, 2, 2)
        
        assert frame.width == 2
        assert frame.height == 2
        assert len(frame.pixels) == 2

    def test_sprite_frame_validation(self):
        """Test sprite frame dimension validation."""
        # Valid frame
        pixels = [[Pixel(), Pixel()], [Pixel(), Pixel()]]
        frame = SpriteFrame(pixels, 2, 2)
        assert frame is not None
        
        # Invalid frame - height mismatch
        with pytest.raises(ValueError):
            SpriteFrame([[Pixel()], [Pixel()]], 2, 2)
        
        # Invalid frame - width mismatch
        with pytest.raises(ValueError):
            SpriteFrame([[Pixel()], [Pixel(), Pixel()]], 2, 2)

    def test_get_pixel_bounds_checking(self):
        """Test pixel retrieval with bounds checking."""
        pixels = [[Pixel(r=1, g=1, b=1), Pixel()], [Pixel(), Pixel(r=2, g=2, b=2)]]
        frame = SpriteFrame(pixels, 2, 2)
        
        # Valid coordinates
        pixel = frame.get_pixel(0, 0)
        assert pixel.r == 1
        
        # Out of bounds should return empty pixel
        pixel = frame.get_pixel(5, 5)
        assert pixel.is_empty()


class TestAnimatedSprite:
    """Test animated sprite functionality."""

    def test_animated_sprite_creation(self):
        """Test animated sprite creation."""
        frame1 = SpriteFrame([[Pixel(r=1, g=1, b=1)]], 1, 1)
        frame2 = SpriteFrame([[Pixel(r=2, g=2, b=2)]], 1, 1)
        
        sprite = AnimatedSprite([frame1, frame2], 0.5, loop=True)
        
        assert len(sprite.frames) == 2
        assert sprite.frame_duration == 0.5
        assert sprite.loop is True

    def test_get_frame_timing(self):
        """Test frame selection based on timing."""
        frame1 = SpriteFrame([[Pixel(r=1, g=1, b=1)]], 1, 1)
        frame2 = SpriteFrame([[Pixel(r=2, g=2, b=2)]], 1, 1)
        
        sprite = AnimatedSprite([frame1, frame2], 1.0, loop=True)
        
        # Should get first frame at time 0.5
        frame = sprite.get_frame(0.5)
        assert frame == frame1
        
        # Should get second frame at time 1.5
        frame = sprite.get_frame(1.5)
        assert frame == frame2
        
        # Should loop back to first frame at time 2.5
        frame = sprite.get_frame(2.5)
        assert frame == frame1

    def test_single_frame_sprite(self):
        """Test single frame sprite always returns same frame."""
        frame = SpriteFrame([[Pixel(r=1, g=1, b=1)]], 1, 1)
        sprite = AnimatedSprite([frame], 1.0, loop=False)
        
        for t in [0.0, 0.5, 1.0, 2.0]:
            assert sprite.get_frame(t) == frame

    def test_empty_sprite(self):
        """Test empty sprite handling."""
        sprite = AnimatedSprite([], 1.0, loop=True)
        frame = sprite.get_frame(0.0)
        assert frame.width == 0
        assert frame.height == 0


class TestSpriteTemplate:
    """Test sprite template functionality."""

    def test_sprite_template_creation(self):
        """Test sprite template creation."""
        pixel_data = [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ]
        template = SpriteTemplate("test", 3, 3, pixel_data)
        
        assert template.name == "test"
        assert template.width == 3
        assert template.height == 3
        assert template.pixel_data == pixel_data

    def test_create_sprite_from_template(self):
        """Test sprite creation from template."""
        pixel_data = [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ]
        template = SpriteTemplate("test", 3, 3, pixel_data)
        
        sprite = template.create_sprite("legion", 1.0)
        
        assert len(sprite.frames) == 1
        frame = sprite.frames[0]
        assert frame.width == 3
        assert frame.height == 3
        
        # Check that filled pixels have legion color
        center_pixel = frame.get_pixel(1, 1)
        assert center_pixel.r == 5  # Legion red
        assert center_pixel.g == 0
        assert center_pixel.b == 0
        
        # Check that empty pixels are empty
        empty_pixel = frame.get_pixel(0, 0)
        assert empty_pixel.is_empty()

    def test_create_animated_sprite_from_template(self):
        """Test animated sprite creation from template."""
        frame1_data = [[1]]
        frame2_data = [[1]]  # Same dimensions as frame1
        
        template = SpriteTemplate(
            "animated_test", 
            1, 1, 
            [[1]],  # Base frame
            animation_frames=[frame1_data, frame2_data],
            frame_duration=0.2
        )
        
        sprite = template.create_sprite("neutral", 1.0)
        
        assert len(sprite.frames) == 2
        assert sprite.frame_duration == 0.2


class TestSpriteRegistry:
    """Test sprite registry functionality."""

    def test_registry_initialization(self):
        """Test registry initialization with default sprites."""
        registry = SpriteRegistry()
        
        # Should have default sprites
        templates = registry.list_templates()
        assert "voyager_3x3" in templates
        assert "warrior_5x5" in templates
        assert "coin_3x3" in templates
        
        assert len(templates) >= 10  # Should have at least 10 default sprites

    def test_get_voyager_sprite(self):
        """Test Voyager sprite retrieval."""
        registry = SpriteRegistry()
        
        sprite = registry.get_voyager_sprite("neutral", "3x3")
        assert sprite is not None
        assert len(sprite.frames) > 1  # Should be animated
        
        # Check frame dimensions
        frame = sprite.frames[0]
        assert frame.width == 3
        assert frame.height == 3

    def test_get_character_sprites(self):
        """Test character sprite retrieval."""
        registry = SpriteRegistry()
        
        warrior = registry.get_character_sprite("warrior", "legion")
        assert warrior is not None
        
        frame = warrior.frames[0]
        assert frame.width == 5
        assert frame.height == 5
        
        # Should have legion coloring
        pixel = frame.get_pixel(2, 2)  # Center pixel
        assert pixel.r == 5  # Red

    def test_get_item_sprites(self):
        """Test item sprite retrieval."""
        registry = SpriteRegistry()
        
        coin = registry.get_item_sprite("coin")
        assert coin is not None
        
        frame = coin.frames[0]
        assert frame.width == 3
        assert frame.height == 3

    def test_get_environment_sprites(self):
        """Test environment sprite retrieval."""
        registry = SpriteRegistry()
        
        door = registry.get_environment_sprite("door")
        assert door is not None
        
        frame = door.frames[0]
        assert frame.width == 5
        assert frame.height == 5

    def test_get_effect_sprites(self):
        """Test effect sprite retrieval."""
        registry = SpriteRegistry()
        
        explosion = registry.get_effect_sprite("explosion")
        assert explosion is not None
        assert len(explosion.frames) > 1  # Should be animated

    def test_custom_sprite_creation(self):
        """Test custom sprite template creation."""
        registry = SpriteRegistry()
        
        # Create custom sprite
        pixel_data = [
            [1, 0],
            [0, 1]
        ]
        template = registry.create_custom_sprite("custom_test", pixel_data)
        
        assert template.name == "custom_test"
        assert template.width == 2
        assert template.height == 2
        
        # Should be able to retrieve it
        sprite = registry.get_sprite("custom_test")
        assert sprite is not None

    def test_unknown_sprite_handling(self):
        """Test handling of unknown sprite names."""
        registry = SpriteRegistry()
        
        sprite = registry.get_sprite("unknown_sprite")
        assert sprite is None


class TestPixelRenderer:
    """Test pixel renderer functionality."""

    def test_renderer_initialization(self):
        """Test renderer initialization."""
        renderer = PixelRenderer(80, 48)
        
        assert renderer.pixel_width == 80
        assert renderer.pixel_height == 48
        assert renderer.char_width == 80
        assert renderer.char_height == 24  # Half of pixel height

    def test_clear_buffer(self):
        """Test buffer clearing."""
        renderer = PixelRenderer(10, 10)
        
        # Set some pixels
        renderer.set_pixel(5, 5, Pixel(r=1, g=1, b=1, intensity=1.0))
        assert not renderer.pixels[5][5].is_empty()
        
        # Clear buffer
        renderer.clear()
        assert renderer.pixels[5][5].is_empty()

    def test_set_pixel_bounds_checking(self):
        """Test pixel setting with bounds checking."""
        renderer = PixelRenderer(10, 10)
        pixel = Pixel(r=1, g=1, b=1, intensity=1.0)
        
        # Valid coordinates
        renderer.set_pixel(5, 5, pixel)
        assert not renderer.pixels[5][5].is_empty()
        
        # Out of bounds should not crash
        renderer.set_pixel(15, 15, pixel)  # Should be ignored
        renderer.set_pixel(-1, -1, pixel)  # Should be ignored

    def test_set_pixel_rgb(self):
        """Test RGB pixel setting."""
        renderer = PixelRenderer(10, 10)
        
        renderer.set_pixel_rgb(5, 5, 3, 2, 1, 0.8)
        pixel = renderer.pixels[5][5]
        
        assert pixel.r == 3
        assert pixel.g == 2
        assert pixel.b == 1
        assert pixel.intensity == 0.8

    def test_draw_sprite(self):
        """Test sprite drawing."""
        renderer = PixelRenderer(20, 20)
        registry = SpriteRegistry()
        
        sprite = registry.get_voyager_sprite("neutral", "3x3")
        renderer.draw_sprite(sprite, 5, 5, 0.0)
        
        # Check that some pixels were drawn
        has_pixels = False
        for y in range(5, 8):
            for x in range(5, 8):
                if not renderer.pixels[y][x].is_empty():
                    has_pixels = True
                    break
            if has_pixels:
                break
        
        assert has_pixels

    def test_draw_line(self):
        """Test line drawing."""
        renderer = PixelRenderer(20, 20)
        pixel = Pixel(r=1, g=1, b=1, intensity=1.0)
        
        renderer.draw_line(0, 0, 5, 5, pixel)
        
        # Check that line was drawn
        assert not renderer.pixels[0][0].is_empty()
        assert not renderer.pixels[5][5].is_empty()

    def test_draw_rectangle(self):
        """Test rectangle drawing."""
        renderer = PixelRenderer(20, 20)
        pixel = Pixel(r=1, g=1, b=1, intensity=1.0)
        
        # Draw outline
        renderer.draw_rectangle(2, 2, 5, 3, pixel, fill=False)
        
        # Check all pixels that should be set in the rectangle outline
        # Rectangle from (2,2) to (6,4)
        
        # Top edge (y=2, x=2 to 6)
        for x in range(2, 7):
            assert not renderer.pixels[2][x].is_empty(), f"Top edge pixel ({x}, 2) should be set"
        
        # Bottom edge (y=4, x=2 to 6)
        for x in range(2, 7):
            assert not renderer.pixels[4][x].is_empty(), f"Bottom edge pixel ({x}, 4) should be set"
        
        # Left edge (x=2, y=2 to 4)
        for y in range(2, 5):
            assert not renderer.pixels[y][2].is_empty(), f"Left edge pixel (2, {y}) should be set"
        
        # Right edge (x=6, y=2 to 4)
        for y in range(2, 5):
            assert not renderer.pixels[y][6].is_empty(), f"Right edge pixel (6, {y}) should be set"
        
        # Clear and draw filled
        renderer.clear()
        renderer.draw_rectangle(2, 2, 3, 3, pixel, fill=True)
        
        # Check fill - rectangle from (2,2) to (4,4)
        for y in range(2, 5):  # 2 to 4 inclusive
            for x in range(2, 5):  # 2 to 4 inclusive
                assert not renderer.pixels[y][x].is_empty(), f"Fill pixel ({x}, {y}) should be set"

    def test_render_to_string(self):
        """Test rendering to ANSI string."""
        renderer = PixelRenderer(4, 4)  # 4x4 pixels = 4x2 chars
        
        # Set some pixels
        renderer.set_pixel_rgb(0, 0, 5, 0, 0)  # Red upper
        renderer.set_pixel_rgb(0, 1, 0, 5, 0)  # Green lower
        
        result = renderer.render_to_string()
        
        assert isinstance(result, str)
        assert len(result.split('\n')) == 2  # 2 character lines
        # Note: ANSI escape codes add extra characters, so we check for non-empty lines
        assert len(result.split('\n')[0]) > 0  # Should have content (may include ANSI codes)

    def test_half_block_rendering(self):
        """Test half-block rendering technique."""
        renderer = PixelRenderer(2, 4)  # 2x4 pixels = 2x2 chars
        
        # Create pattern: upper half red, lower half blue
        renderer.set_pixel_rgb(0, 0, 5, 0, 0)  # Red upper
        renderer.set_pixel_rgb(0, 1, 5, 0, 0)  # Red upper
        renderer.set_pixel_rgb(0, 2, 0, 0, 5)  # Blue lower
        renderer.set_pixel_rgb(0, 3, 0, 0, 5)  # Blue lower
        
        result = renderer.render_to_string()
        
        # Should contain ANSI color codes and block characters
        assert '\033[' in result  # ANSI escape sequence
        # When both upper and lower pixels are same color, it becomes a full block
        assert '█' in result  # Full block character


class TestPixelViewport:
    """Test pixel viewport integration."""

    def test_viewport_initialization(self):
        """Test viewport initialization."""
        mock_ledger = Mock(spec=WorldLedger)
        config = ViewportConfig(80, 48)
        
        viewport = PixelViewport(mock_ledger, config)
        
        assert viewport.config.pixel_width == 80
        assert viewport.config.pixel_height == 48
        assert viewport.pixel_renderer.pixel_width == 80
        assert viewport.pixel_renderer.pixel_height == 48

    def test_update_game_state(self):
        """Test game state updates."""
        mock_ledger = Mock(spec=WorldLedger)
        viewport = PixelViewport(mock_ledger)
        
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
        mock_game_state.position = mock_position
        mock_game_state.player_angle = 45.0
        
        viewport.update_game_state(mock_game_state)
        
        assert viewport.state.player_position == (10.0, 15.0)
        assert viewport.state.player_angle == 45.0

    def test_render_frame(self):
        """Test frame rendering."""
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None  # No chunks
        
        viewport = PixelViewport(mock_ledger)
        
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
        mock_game_state.position = mock_position
        mock_game_state.player_angle = 0.0
        
        result = viewport.render_frame(mock_game_state)
        
        assert isinstance(result, str)
        assert len(result) > 0

    def test_demo_scene(self):
        """Test demo scene creation."""
        mock_ledger = Mock(spec=WorldLedger)
        viewport = PixelViewport(mock_ledger)
        
        demo = viewport.create_demo_scene()
        
        assert isinstance(demo, str)
        assert len(demo) > 0
        assert '\033[' in demo  # Should contain ANSI codes

    def test_viewport_info(self):
        """Test viewport information retrieval."""
        mock_ledger = Mock(spec=WorldLedger)
        viewport = PixelViewport(mock_ledger)
        
        info = viewport.get_viewport_info()
        
        assert isinstance(info, dict)
        assert "dimensions" in info
        assert "char_dimensions" in info
        assert "player_position" in info
        assert "available_sprites" in info

    def test_config_update(self):
        """Test configuration updates."""
        mock_ledger = Mock(spec=WorldLedger)
        viewport = PixelViewport(mock_ledger)
        
        new_config = ViewportConfig(100, 60)
        viewport.set_config(new_config)
        
        assert viewport.config.pixel_width == 100
        assert viewport.config.pixel_height == 60
        assert viewport.pixel_renderer.pixel_width == 100
        assert viewport.pixel_renderer.pixel_height == 60


class TestIntegration:
    """Integration tests for the complete pixel system."""

    def test_complete_rendering_pipeline(self):
        """Test complete pixel rendering pipeline."""
        # Create components
        mock_ledger = Mock(spec=WorldLedger)
        mock_ledger.get_chunk.return_value = None
        
        viewport = PixelViewport(mock_ledger)
        
        # Create mock game state
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 5.0
        mock_position.y = 5.0
        mock_game_state.position = mock_position
        mock_game_state.player_angle = 0.0
        
        # Update and render
        viewport.update_game_state(mock_game_state)
        result = viewport.render_frame(mock_game_state)
        
        # Verify output
        assert isinstance(result, str)
        assert len(result) > 0
        
        # Should contain ANSI codes and block characters
        lines = result.split('\n')
        assert len(lines) > 0
        assert any('\033[' in line for line in lines)  # ANSI codes

    def test_sprite_animation_integration(self):
        """Test sprite animation in viewport."""
        mock_ledger = Mock(spec=WorldLedger)
        viewport = PixelViewport(mock_ledger)
        
        # Create demo scene (includes animated sprites)
        demo = viewport.create_demo_scene()
        
        assert isinstance(demo, str)
        assert len(demo) > 0

    def test_faction_color_integration(self):
        """Test faction-based coloring."""
        registry = SpriteRegistry()
        
        # Test different factions
        legion_sprite = registry.get_character_sprite("warrior", "legion")
        merchant_sprite = registry.get_character_sprite("warrior", "merchants")
        
        # Both should exist but have different colors
        assert legion_sprite is not None
        assert merchant_sprite is not None
        
        # Check color differences
        legion_frame = legion_sprite.frames[0]
        merchant_frame = merchant_sprite.frames[0]
        
        legion_pixel = legion_frame.get_pixel(2, 2)  # Center
        merchant_pixel = merchant_frame.get_pixel(2, 2)
        
        # Legion should be red, merchants should be gold
        assert legion_pixel.r == 5 and legion_pixel.g == 0  # Red
        assert merchant_pixel.r == 5 and merchant_pixel.g == 4  # Gold


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
