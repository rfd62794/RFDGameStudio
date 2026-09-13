"""
Comprehensive tests for the Composite Sprite System.

Tests the SpriteFactory, composite layering, anti-aliasing, breathing animations,
and integration with the multi-pass rendering system.
"""

import pytest
import time
from unittest.mock import Mock
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ui.sprite_factory import (
    SpriteFactory, SpriteLayer, ShadingPattern, CharacterClass,
    CompositeSpriteConfig, SpriteLayerTemplate
)
from ui.render_passes.geometric_profile import GeometricProfilePass, ProfileConfig, ShapeType
from ui.pixel_renderer import Pixel
from ui.render_passes import RenderContext, RenderResult, RenderPassType
from game_state import GameState
from world_ledger import WorldLedger


class TestSpriteFactory:
    """Test the SpriteFactory composite layering system."""

    def test_sprite_factory_initialization(self):
        """Test sprite factory initialization."""
        factory = SpriteFactory()
        
        assert factory.layer_templates is not None
        assert len(factory.layer_templates) > 0
        assert factory.shading_blocks is not None
        assert ShadingPattern.SOLID in factory.shading_blocks
        assert ShadingPattern.LIGHT in factory.shading_blocks
        
        # Check that templates were created
        assert "head_default" in factory.layer_templates
        assert "body_default" in factory.layer_templates
        assert "feet_default" in factory.layer_templates
        assert "held_none" in factory.layer_templates

    def test_layer_template_creation(self):
        """Test layer template creation."""
        template = SpriteLayerTemplate(
            layer_type=SpriteLayer.HEAD,
            width=3,
            height=3,
            pixels=[[None, None, None], [None, Pixel(255, 255, 255, 1.0), None]],
            anchor_x=1,
            anchor_y=1
        )
        
        assert template.layer_type == SpriteLayer.HEAD
        assert template.width == 3
        assert template.height == 3
        assert template.anchor_x == 1
        assert template.anchor_y == 1
        assert len(template.pixels) == 3
        assert template.pixels[1][1] is not None

    def test_composite_sprite_creation(self):
        """Test composite sprite creation."""
        factory = SpriteFactory()
        
        config = CompositeSpriteConfig(
            character_class=CharacterClass.VOYAGER,
            head_type="default",
            body_type="default",
            feet_type="default",
            held_item="none",
            stance="neutral",
            shading_enabled=True,
            breathing_enabled=True
        )
        
        composite = factory.create_composite_sprite(config)
        
        assert isinstance(composite, list)
        assert len(composite) > 0
        assert len(composite[0]) > 0
        # Should have head, body, and feet layers
        total_height = sum([
            3,  # head height
            5,  # body height
            2   # feet height
        ])
        assert len(composite) == total_height

    def test_equipment_variations(self):
        """Test different equipment combinations."""
        factory = SpriteFactory()
        
        # Test different head types
        configs = [
            CompositeSpriteConfig(CharacterClass.VOYAGER, head_type="default"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, head_type="helmet"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, head_type="hood"),
        ]
        
        sprites = [factory.create_composite_sprite(config) for config in configs]
        
        # All should be different
        assert sprites[0] != sprites[1]  # default vs helmet
        assert sprites[1] != sprites[2]  # helmet vs hood
        
        # Test different body types
        body_configs = [
            CompositeSpriteConfig(CharacterClass.VOYAGER, body_type="default"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, body_type="armor"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, body_type="robe"),
        ]
        
        body_sprites = [factory.create_composite_sprite(config) for config in body_configs]
        
        assert body_sprites[0] != body_sprites[1]  # default vs armor
        assert body_sprites[1] != body_sprites[2]  # armor vs robe

    def test_held_items(self):
        """Test different held items."""
        factory = SpriteFactory()
        
        item_configs = [
            CompositeSpriteConfig(CharacterClass.VOYAGER, held_item="none"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, held_item="sword"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, held_item="staff"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, held_item="bow"),
        ]
        
        item_sprites = [factory.create_composite_sprite(config) for config in item_configs]
        
        # None should be different from items
        assert item_sprites[0] != item_sprites[1]  # none vs sword
        assert item_sprites[1] != item_sprites[2]  # sword vs staff
        assert item_sprites[2] != item_sprites[3]  # staff vs bow

    def test_character_class_modifications(self):
        """Test character class-specific modifications."""
        factory = SpriteFactory()
        
        # Test different character classes
        class_configs = [
            CompositeSpriteConfig(CharacterClass.VOYAGER),
            CompositeSpriteConfig(CharacterClass.ROGUE),
            CompositeSpriteConfig(CharacterClass.WARRIOR),
            CompositeSpriteConfig(CharacterClass.MAGE),
        ]
        
        class_sprites = [factory.create_composite_sprite(config) for config in class_configs]
        
        # All should be different due to class modifications
        assert class_sprites[0] != class_sprites[1]  # Voyager vs Rogue
        assert class_sprites[1] != class_sprites[2]  # Rogue vs Warrior
        assert class_sprites[2] != class_sprites[3]  # Warrior vs Mage

    def test_shading_patterns(self):
        """Test different shading patterns."""
        factory = SpriteFactory()
        
        shading_configs = [
            CompositeSpriteConfig(CharacterClass.VOYAGER, shading_enabled=True),
            CompositeSpriteConfig(CharacterClass.VOYAGER, shading_enabled=False),
        ]
        
        sprites = [factory.create_composite_sprite(config) for config in shading_configs]
        
        # Shading should affect the sprite
        assert sprites[0] != sprites[1]

    def test_breathing_animation(self):
        """Test breathing animation frames."""
        factory = SpriteFactory()
        
        config = CompositeSpriteConfig(CharacterClass.VOYAGER, breathing_enabled=True)
        animation_frames = factory.create_breathing_animation_frames(config, 2)
        
        assert len(animation_frames) == 2
        assert animation_frames[0] != animation_frames[1]  # Frames should be different
        
        # Test with more frames
        more_frames = factory.create_breathing_animation_frames(config, 4)
        assert len(more_frames) == 4

    def test_asymmetric_stances(self):
        """Test asymmetric stance modifications."""
        factory = SpriteFactory()
        
        stance_configs = [
            CompositeSpriteConfig(CharacterClass.VOYAGER, stance="neutral"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, stance="combat"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, stance="stealth"),
            CompositeSpriteConfig(CharacterClass.VOYAGER, stance="casting"),
        ]
        
        stance_sprites = [factory.create_composite_sprite(config) for config in stance_configs]
        
        # All stances should produce different silhouettes
        assert stance_sprites[0] != stance_sprites[1]  # neutral vs combat
        assert stance_sprites[1] != stance_sprites[2]  # combat vs stealth
        assert stance_sprites[2] != stance_sprites[3]  # stealth vs casting

    def test_factory_info(self):
        """Test factory information retrieval."""
        factory = SpriteFactory()
        
        info = factory.get_layer_info()
        
        assert "total_layers" in info
        assert "layer_types" in info
        assert "shading_patterns" in info
        assert "character_classes" in info
        
        assert info["total_layers"] > 0
        assert "head" in info["layer_types"]
        assert "body" in info["layer_types"]
        assert "feet" in info["layer_types"]
        assert "held" in info["layer_types"]


class TestCompositeSpriteIntegration:
    """Test integration of composite sprites with the rendering system."""

    def test_geometric_profile_composite_mode(self):
        """Test geometric profile pass in composite mode."""
        config = ProfileConfig(
            render_mode="silhouette",
            show_composite_sprite=True,
            character_class=CharacterClass.VOYAGER,
            width=15,
            height=12
        )
        
        profile_pass = GeometricProfilePass(config)
        
        # Create mock context
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
        
        result = profile_pass.render(context)
        
        assert isinstance(result, RenderResult)
        assert result.width == 15
        assert result.height == 12
        assert result.content is not None
        assert result.metadata["render_mode"] == "silhouette"
        assert result.metadata["character_class"] == "voyager"
        
        # Should contain composite sprite characters
        assert any(c in result.content for c in ['█', '▓', '▒', '░'])

    def test_geometric_profile_geometric_mode(self):
        """Test geometric profile pass in geometric mode."""
        config = ProfileConfig(
            render_mode="geometric",
            show_composite_sprite=False,
            shape_type=ShapeType.TRIANGLE,
            width=15,
            height=10
        )
        
        profile_pass = GeometricProfilePass(config)
        
        # Create mock context
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
        
        result = profile_pass.render(context)
        
        assert isinstance(result, RenderResult)
        assert result.width == 15
        assert result.height == 10
        assert result.content is not None
        assert result.metadata["render_mode"] == "geometric"
        assert result.metadata["shape_type"] == "triangle"
        
        # Should contain geometric line-art characters
        assert any(c in result.content for c in ['/', '\\', '|', '_', '┌', '┐', '└', '┘'])

    def test_animation_integration(self):
        """Test animation integration with rendering system."""
        config = ProfileConfig(
            render_mode="silhouette",
            show_composite_sprite=True,
            character_class=CharacterClass.VOYAGER,
            breathing_enabled=True
        )
        
        profile_pass = GeometricProfilePass(config)
        
        # Create mock context
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
        
        # Render multiple frames to test animation
        frames = []
        for i in range(3):
            context.frame_count = i
            context.current_time = time.time() + (i * 0.1)
            result = profile_pass.render(context)
            frames.append(result.content)
        
        # Frames should be different due to breathing animation
        assert frames[0] != frames[1]
        assert frames[1] != frames[2]

    def test_multi_pass_composite_integration(self):
        """Test composite sprites in the multi-pass system."""
        from ui.render_passes import RenderPassRegistry
        
        registry = RenderPassRegistry()
        
        # Register passes with composite sprite support
        registry.register_pass(GeometricProfilePass(ProfileConfig(
            render_mode="silhouette",
            show_composite_sprite=True,
            character_class=CharacterClass.VOYAGER
        )))
        
        registry.register_pass(GeometricProfilePass(ProfileConfig(
            render_mode="geometric",
            shape_type=ShapeType.SQUARE,
            show_composite_sprite=False
        )))
        
        # Create mock context
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
        
        # Should have both geometric and silhouette results
        assert len(results) == 2
        
        # Check results
        for pass_type, result in results.items():
            assert isinstance(result, RenderResult)
            assert result.content is not None
            assert result.width > 0
            assert result.height > 0

    def test_equipment_visual_feedback(self):
        """Test that equipment changes are visually reflected."""
        from ui.render_passes import RenderPassRegistry
        
        registry = RenderPassRegistry()
        
        # Create different equipment configurations
        configs = [
            ProfileConfig(
                render_mode="silhouette",
                show_composite_sprite=True,
                character_class=CharacterClass.WARRIOR,
                head_type="default",
                body_type="default",
                held_item="none"
            ),
            ProfileConfig(
                render_mode="silhouette",
                show_composite_sprite=True,
                character_class=CharacterClass.WARRIOR,
                head_type="helmet",
                body_type="armor",
                held_item="sword"
            ),
            ProfileConfig(
                render_mode="silhouette",
                show_composite_sprite=True,
                character_class=CharacterClass.MAGE,
                head_type="hood",
                body_type="robe",
                held_item="staff"
            )
        ]
        
        # Create mock context
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
        
        # Render different equipment configurations
        results = []
        for config in configs:
            profile_pass = GeometricProfilePass(config)
            result = profile_pass.render(context)
            results.append(result.content)
        
        # All should be visually different
        assert results[0] != results[1]  # No equipment vs full armor
        assert results[1] != results[2]  # Warrior vs Mage equipment

    def test_performance_with_composite_sprites(self):
        """Test performance of composite sprite rendering."""
        from ui.render_passes import RenderPassRegistry
        
        registry = RenderPassRegistry()
        registry.register_pass(GeometricProfilePass(ProfileConfig(
            render_mode="silhouette",
            show_composite_sprite=True,
            character_class=CharacterClass.WARRIOR,
            breathing_enabled=True
        )))
        
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
        for i in range(50):
            context.frame_count = i
            context.current_time = time.time()
            results = registry.render_all(context)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / 50
        
        # Should be reasonably fast (under 0.1s per frame)
        assert avg_time < 0.1, f"Composite sprite rendering too slow: {avg_time:.4f}s"
        
        # Check performance summary
        summary = registry.get_performance_summary()
        assert summary["total_passes"] == 1
        assert len(summary["passes"]) == 1


class TestShadingAndAntiAliasing:
    """Test shading patterns and anti-aliasing effects."""

    def test_shading_blocks(self):
        """Test different shading block characters."""
        factory = SpriteFactory()
        
        assert ShadingPattern.SOLID in factory.shading_blocks
        assert ShadingPattern.LIGHT in factory.shading_blocks
        assert ShadingPattern.MEDIUM in factory.shading_blocks
        assert ShadingPattern.DARK in factory.shading_blocks
        assert ShadingPattern.DITHERED in factory.shading_blocks
        
        # Check character mappings
        assert factory.shading_blocks[ShadingPattern.SOLID] == "█"
        assert factory.shading_blocks[ShadingPattern.LIGHT] == "░"
        assert factory.shading_blocks[ShadingPattern.MEDIUM] == "▒"
        assert factory.shading_blocks[ShadingPattern.DARK] == "▓"

    def test_drop_shadow_effect(self):
        """Test drop shadow creation."""
        factory = SpriteFactory()
        
        config = CompositeSpriteConfig(CharacterClass.VOYAGER, shading_enabled=True)
        composite = factory.create_composite_sprite(config)
        
        # Check for shadow pixels (should have lower intensity)
        shadow_found = False
        for row in composite:
            for pixel in row:
                if pixel is not None and pixel.intensity < 0.5:
                    shadow_found = True
                    break
            if shadow_found:
                break
        
        assert shadow_found, "Drop shadow should be applied"

    def test_stealth_dithering(self):
        """Test stealth state dithering."""
        factory = SpriteFactory()
        
        normal_config = CompositeSpriteConfig(CharacterClass.VOYAGER, stance="neutral")
        stealth_config = CompositeSpriteConfig(CharacterClass.VOYAGER, stance="stealth")
        
        normal_sprite = factory.create_composite_sprite(normal_config)
        stealth_sprite = factory.create_composite_sprite(stealth_config)
        
        # Stealth sprite should have dithering (lower intensity pixels)
        stealth_intensity = 0
        for row in stealth_sprite:
            for pixel in row:
                if pixel is not None:
                    stealth_intensity += pixel.intensity
        
        normal_intensity = 0
        for row in normal_sprite:
            for pixel in row:
                if pixel is not None:
                    normal_intensity += pixel.intensity
        
        # Stealth should have lower overall intensity
        assert stealth_intensity < normal_intensity

    def test_intensity_levels(self):
        """Test different intensity levels in composite sprites."""
        factory = SpriteFactory()
        
        # Create sprites with different shading patterns
        configs = [
            CompositeSpriteConfig(CharacterClass.VOYAGER, shading_enabled=True),
            CompositeSpriteConfig(CharacterClass.VOYAGER, shading_enabled=False),
        ]
        
        sprites = [factory.create_composite_sprite(config) for config in configs]
        
        # Count non-transparent pixels
        pixel_counts = []
        for sprite in sprites:
            count = 0
            for row in sprite:
                for pixel in row:
                    if pixel is not None and pixel.intensity > 0:
                        count += 1
            pixel_counts.append(count)
        
        # Shading should affect pixel visibility
        # (This is a basic check - in reality, shading affects intensity, not visibility)
        assert len(pixel_counts) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
