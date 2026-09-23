"""
Game Boy Parity Tests - Comprehensive Test Suite

Tests the Virtual PPU, TileBank, and Metasprite systems
for authentic Game Boy hardware parity.
"""

import pytest
import time
from unittest.mock import Mock
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ui.virtual_ppu import VirtualPPU, RenderLayer, TileMapCoordinate, SpriteCoordinate, WindowLayer
from ui.tile_bank import TileBank, TileType, TilePattern
from models.metasprite import Metasprite, MetaspriteConfig, CharacterRole
from ui.render_passes.pixel_viewport import PixelViewportPass, PixelViewportConfig
from ui.render_passes import RenderContext, RenderResult, RenderPassType
from game_state import GameState
from world_ledger import WorldLedger, Coordinate, WorldChunk
from ui.pixel_renderer import Pixel


class TestTileBank:
    """Test the TileBank system."""
    
    def test_tile_bank_initialization(self):
        """Test tile bank initialization."""
        tile_bank = TileBank()
        
        assert tile_bank.tiles is not None
        assert len(tile_bank.tiles) > 0
        assert tile_bank.max_tiles_per_bank == 256
        assert tile_bank.current_bank == "default"
        
        # Check for essential tiles
        assert "grass_0" in tile_bank.tiles
        assert "water_0" in tile_bank.tiles
        assert "stone" in tile_bank.tiles
        assert "wall" in tile_bank.tiles
        assert "void" in tile_bank.tiles
    
    def test_tile_patterns(self):
        """Test tile pattern creation."""
        tile_bank = TileBank()
        
        # Test grass tiles
        grass_tile = tile_bank.get_tile("grass_0")
        assert grass_tile is not None
        assert grass_tile.tile_type == TileType.GRASS
        assert grass_tile.width == 8
        assert grass_tile.height == 8
        assert len(grass_tile.pixels) == 8
        assert len(grass_tile.pixels[0]) == 8
        
        # Test water tiles
        water_tile = tile_bank.get_tile("water_0")
        assert water_tile is not None
        assert water_tile.tile_type == TileType.WATER
        assert water_tile.animation_frames == 4
        
        # Test void tile
        void_tile = tile_bank.get_tile("void")
        assert void_tile is not None
        assert void_tile.tile_type == TileType.VOID
        assert void_tile.solid == False
    
    def test_tile_bank_switching(self):
        """Test tile bank switching."""
        tile_bank = TileBank()
        
        # Test switching to different banks
        assert tile_bank.switch_bank("forest") == True
        assert tile_bank.current_bank == "forest"
        
        assert tile_bank.switch_bank("town") == True
        assert tile_bank.current_bank == "town"
        
        assert tile_bank.switch_bank("dungeon") == True
        assert tile_bank.current_bank == "dungeon"
        
        # Test invalid bank
        assert tile_bank.switch_bank("invalid") == False
        assert tile_bank.current_bank == "dungeon"  # Should remain unchanged
    
    def test_animation_frames(self):
        """Test animation frame generation."""
        tile_bank = TileBank()
        
        # Test animated water tile
        frame_0 = tile_bank.get_animation_frame("water_0", 0)
        frame_1 = tile_bank.get_animation_frame("water_0", 1)
        frame_2 = tile_bank.get_animation_frame("water_0", 2)
        frame_3 = tile_bank.get_animation_frame("water_0", 3)
        
        assert frame_0 is not None
        assert frame_1 is not None
        assert frame_2 is not None
        assert frame_3 is not None
        
        # Check that frames are different
        assert frame_0 != frame_1
        assert frame_1 != frame_2
        assert frame_2 != frame_3
    
    def test_tile_info(self):
        """Test tile bank information retrieval."""
        tile_bank = TileBank()
        
        info = tile_bank.get_tile_info()
        
        assert "current_bank" in info
        assert "available_banks" in info
        assert "max_tiles" in info
        assert "tile_types" in info
        assert "animated_tiles" in info
        
        assert info["max_tiles"] == 256
        assert len(info["available_banks"]) > 0
        assert len(info["tile_types"]) > 0


class TestMetasprite:
    """Test the Metasprite system."""
    
    def test_metasprite_initialization(self):
        """Test metasprite initialization."""
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        metasprite = Metasprite(config)
        
        assert metasprite.config.role == CharacterRole.VOYAGER
        assert metasprite.config.width == 16
        assert metasprite.config.height == 16
        assert metasprite.config.facing_direction == "down"
    
    def test_character_roles(self):
        """Test different character roles."""
        roles = [
            CharacterRole.VOYAGER,
            CharacterRole.WARRIOR,
            CharacterRole.ROGUE,
            CharacterRole.MAGE,
            CharacterRole.VILLAGER,
            CharacterRole.GUARD,
            CharacterRole.MERCHANT
        ]
        
        for role in roles:
            config = MetaspriteConfig(role=role)
            metasprite = Metasprite(config)
            
            assert metasprite.config.role == role
            assert metasprite.config.width == 16
            assert metasprite.config.height == 16
    
    def test_facing_directions(self):
        """Test different facing directions."""
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        metasprite = Metasprite(config)
        
        # Test all facing directions
        directions = ["up", "down", "left", "right"]
        
        for direction in directions:
            metasprite.set_facing_direction(direction)
            assert metasprite.config.facing_direction == direction
    
    def test_animation_frames(self):
        """Test animation frame generation."""
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        metasprite = Metasprite(config)
        
        # Test stepping animation
        metasprite.set_animation_frame(1)
        assert metasprite.config.animation_frame == 1
        
        metasprite.set_animation_frame(2)
        assert metasprite.config.animation_frame == 2
        
        # Test blink animation
        metasprite.set_animation_frame(3)
        assert metasprite.config.animation_frame == 3
    
    def test_equipment_modifications(self):
        """Test equipment modifications."""
        config = MetaspriteConfig(CharacterRole.WARRIOR)
        metasprite = Metasprite(config)
        
        # Test head equipment
        metasprite.set_equipment({
            "head": "helmet",
            "body": "armor",
            "weapon": "sword"
        })
        
        assert metasprite.config.equipment["head"] == "helmet"
        assert metasprite.config.equipment["body"] == "armor"
        assert metasprite.config.equipment["weapon"] == "sword"
    
    def test_render_to_string(self):
        """Test metasprite rendering to string."""
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        metasprite = Metasprite(config)
        
        rendered = metasprite.render_to_string()
        
        assert isinstance(rendered, str)
        assert len(rendered) > 0
        
        # Should contain half-block characters
        assert any(c in rendered for c in ['█', '▀', '▄', '▓'])
    
    def test_pixel_data(self):
        """Test raw pixel data access."""
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        metasprite = Metasprite(config)
        
        pixel_data = metasprite.get_pixel_data()
        
        assert isinstance(pixel_data, list)
        assert len(pixel_data) == 16
        assert len(pixel_data[0]) == 16


class TestVirtualPPU:
    """Test the Virtual PPU system."""
    
    def test_ppu_initialization(self):
        """Test PPU initialization."""
        ppu = VirtualPPU()
        
        assert ppu.width == 160  # Game Boy width
        assert ppu.height == 144  # Game Boy height
        assert ppu.tile_map is not None
        assert ppu.sprites is not None
        assert ppu.windows is not None
        
        # Check Game Boy limitations
        assert ppu.max_sprites == 40
        assert ppu.max_tiles == 256
        assert ppu.current_tile_bank == "default"
        
        # Check tile map dimensions
        assert len(ppu.tile_map) == 18  # 144 / 8 = 18
        assert len(ppu.tile_map[0]) == 20  # 160 / 8 = 20
    
    def test_tile_map_operations(self):
        """Test tile map operations."""
        ppu = VirtualPPU()
        
        # Test setting individual tiles
        ppu.set_tile(0, 0, "grass_0")
        assert ppu.get_tile_at(0, 0) == "grass_0"
        
        ppu.set_tile(8, 8, "stone")
        assert ppu.get_tile_at(8, 8) == "stone"
        
        # Test setting tile areas
        ppu.set_tile_area(0, 0, 5, 5, "grass_0")
        
        # Verify area was set
        for y in range(5):
            for x in range(5):
                assert ppu.get_tile_at(x * 8, y * 8) == "grass_0"
    
    def test_sprite_operations(self):
        """Test sprite operations."""
        ppu = VirtualPPU()
        
        # Create test metasprite
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        metasprite = Metasprite(config)
        
        # Test adding sprites
        assert ppu.add_sprite(0, 0, metasprite, 0) == True
        assert len(ppu.sprites) == 1
        assert ppu.get_sprite_at(0, 0) == metasprite
        
        # Test sprite limit
        for i in range(39):  # Add up to limit
            ppu.add_sprite(i * 20, i * 20, metasprite, i)
        
        assert len(ppu.sprites) == 40  # At limit
        assert ppu.add_sprite(100, 100, metasprite, 0) == False  # Over limit
        
        # Test removing sprites
        assert ppu.remove_sprite(metasprite) == True
        assert len(ppu.sprites) == 39
        
        assert ppu.get_sprite_at(0, 0) is None
    
    def test_window_operations(self):
        """Test window layer operations."""
        ppu = VirtualPPU()
        
        # Test adding windows
        ppu.add_window("Hello World", 10, 10, 80, 16)
        assert len(ppu.windows) == 1
        
        window = ppu.windows[0]
        assert window.content == "Hello World"
        assert window.x == 10
        assert window.y == 10
        assert window.width == 80
        assert window.height == 16
        
        # Test clearing windows
        ppu.clear_windows()
        assert len(ppu.windows) == 0
    
    def test_three_layer_rendering(self):
        """Test three-layer rendering process."""
        ppu = VirtualPPU()
        
        # Set up background
        ppu.set_tile_area(0, 0, 20, 18, "grass_0")
        
        # Add sprites
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        voyager = Metasprite(config)
        ppu.add_sprite(40, 40, voyager, 0)
        
        # Add window
        ppu.add_window("HP: 100/100", 10, 10, 100, 16)
        
        # Render frame
        rendered = ppu.render_frame()
        
        assert isinstance(rendered, str)
        assert len(rendered) > 0
        
        # Should contain elements from all three layers
        assert any("grass" in rendered.lower())  # Background
        assert any("█" in rendered)  # Objects
        assert any("HP:" in rendered)  # Window
    
    def test_transparency(self):
        """Test transparency support (Color 0)."""
        ppu = VirtualPPU()
        
        # Create tile with transparent pixels
        transparent_tile = TilePattern(TileType.VOID)
        
        # Set transparent tile
        ppu.set_tile(0, 0, "void")
        
        # Render and check transparency
        rendered = ppu.render_frame()
        
        # Should have empty spaces where transparent
        lines = rendered.split('\n')
        assert len(lines) > 0
        assert lines[0][0] == " "  # Transparent areas
    
    def test_ppu_info(self):
        """Test PPU information retrieval."""
        ppu = VirtualPPU()
        
        info = ppu.get_ppu_info()
        
        assert "resolution" in info
        assert "tile_resolution" in info
        assert "max_sprites" in info
        assert "current_sprites" in info
        assert "max_tiles" in info
        assert "current_tile_bank" in info
        assert "layers" in info
        
        assert info["resolution"] == "160x144"
        assert info["tile_resolution"] == "20x18"
        assert info["max_sprites"] == 40
        assert info["max_tiles"] == 256


class TestPixelViewportPassWithPPU:
    """Test PixelViewportPass with Virtual PPU integration."""
    
    def test_ppu_integration(self):
        """Test PixelViewportPass with Virtual PPU."""
        config = PixelViewportConfig(
            width=20, height=18, pixel_scale=1  # Smaller for testing
        )
        
        pass_obj = PixelViewportPass(config)
        
        # Create mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
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
        
        result = pass_obj.render(context)
        
        assert isinstance(result, RenderResult)
        assert result.width == 20
        assert result.height == 18
        assert result.content is not None
        assert result.metadata["rendering_mode"] == "game_virtual_ppu"
        assert "ppu_info" in result.metadata
        assert result.metadata["entity_count"] == 1  # Player sprite
    
    def test_game_boy_parity(self):
        """Test Game Boy hardware parity."""
        config = PixelViewportConfig(
            width=20, height=18, pixel_scale=1
        )
        
        pass_obj = PixelViewportPass(config)
        
        # Create mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 25.0
        mock_position.y = 30.0
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
        
        result = pass_obj.render(context)
        
        # Check Game Boy parity
        assert result.metadata["rendering_mode"] == "game_boy_virtual_ppu"
        assert result.metadata["pixel_width"] == 20
        assert result.metadata["pixel_height"] == 18
        assert result.metadata["pixel_ratio"] == "1:1"
        
        # Check PPU info
        ppu_info = result.metadata["ppu_info"]
        assert ppu_info["resolution"] == "160x144"
        assert ppu_info["tile_resolution"] == "20x18"
        assert ppu_info["max_sprites"] == 40
        assert ppu_info["layers"]["background"] == "TileMap"
        assert ppu_info["layers"]["objects"] == "Metasprites"
        assert ppu_info["layers"]["window"] == "Text Overlay"
    
    def test_entity_management(self):
        """Test entity management in Virtual PPU."""
        config = PixelViewportConfig(
            width=20, height=18, pixel_scale=1
        )
        
        pass_obj = PixelViewportPass(config)
        
        # Create mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
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
        
        # Add entities
        assert pass_obj._viewport.add_entity("npc_1", 32, 32, CharacterRole.VILLAGER, 1) == True
        assert pass_obj._viewport.add_entity("npc_2", 64, 32, CharacterRole.GUARD, 2) == True
        assert pass_obj._viewport.add_entity("npc_3", 96, 32, CharacterRole.MERCHANT, 0) == True
        
        assert len(pass_obj._viewport.entity_sprites) == 3
        
        # Remove entity
        assert pass_obj._viewport.remove_entity("npc_2") == True
        assert len(pass_obj._viewport.entity_sprites) == 2
        assert "npc_2" not in pass_obj._viewport.entity_sprites
        
        # Test sprite limit
        for i in range(37):  # Add up to limit
            pass_obj._viewport.add_entity(f"npc_{i}", i * 8, i * 8, CharacterRole.VILLAGER, i)
        
        assert len(pass_obj._viewport.entity_sprites) == 40  # At limit
        assert pass_obj._viewport.add_entity("npc_100", 200, 200, CharacterRole.VILLAGER, 0) == False  # Over limit
    
    def test_tile_bank_integration(self):
        """Test tile bank integration."""
        config = PixelViewportConfig(
            width=20, height=18, pixel_scale=1
        )
        
        pass_obj = PixelViewportPass(config)
        
        # Create mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 10.0
        mock_position.y = 15.0
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
        
        # Test tile bank switching
        assert pass_obj._viewport.switch_tile_bank("forest") == True
        assert pass_obj._viewport.virtual_ppu.current_tile_bank == "forest"
        
        assert pass_obj._viewport.switch_tile_bank("town") == True
        assert pass_obj._viewport.virtual_ppu.current_tile_bank == "town"
        
        # Render with different banks
        forest_result = pass_obj.render(context)
        town_result = pass_obj.render(context)
        
        assert forest_result != town_result  # Different tiles should produce different results


class TestGameBoyParityIntegration:
    """Test complete Game Boy parity integration."""
    
    def test_complete_game_boy_system(self):
        """Test the complete Game Boy parity system."""
        # Create render registry
        registry = RenderPassRegistry()
        registry.register_pass(PixelViewportPass(PixelViewportConfig(
            width=20, height=18, pixel_scale=1
        )))
        
        # Create mock game state
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
        
        # Render frame
        result = registry.render_all(context)
        
        # Should have pixel viewport result
        assert RenderPassType.PIXEL_VIEWPORT in result
        pixel_result = result[RenderPassType.PIXEL_VIEWPORT]
        
        assert isinstance(pixel_result, RenderResult)
        assert pixel_result.content is not None
        assert pixel_result.metadata["rendering_mode"] == "game_boy_virtual_ppu"
        
        # Check Game Boy hardware parity
        ppu_info = pixel_result.metadata["ppu_info"]
        assert ppu_info["resolution"] == "160x144"
        assert ppu_info["tile_resolution"] == "20x18"
        assert ppu_info["max_sprites"] == 40
        assert ppu_info["layers"]["background"] == "TileMap"
        assert ppu_info["layers"]["objects"] == "Metasprites"
        assert ppu_info["layers"]["window"] == "Text Overlay"
        
        # Check that it looks like Game Boy rendering
        content = pixel_result.content
        assert len(content.split('\n')) == 18  # 18 lines for 18 character height
        
        # Should contain Game Boy-style elements
        assert any("grass" in content.lower())  # Background tiles
        assert any("█" in content)  # Object sprites
        assert any("HP:" in content)  # Window text
    
    def test_performance_benchmarks(self):
        """Test performance of Game Boy parity system."""
        config = PixelViewportConfig(
            width=20, height=18, pixel_scale=1
        )
        
        pass_obj = PixelViewportPass(config)
        
        # Create mock context
        mock_game_state = Mock(spec=GameState)
        mock_position = Mock()
        mock_position.x = 50.0
        mock_position.y = 50.0
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
        
        # Measure performance
        start_time = time.time()
        
        # Render multiple frames
        for i in range(100):
            context.frame_count = i
            context.current_time = time.time()
            result = pass_obj.render(context)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / 100
        
        # Should be fast enough for Game Boy parity
        assert avg_time < 0.05, f"Game Boy rendering too slow: {avg_time:.4f}s per frame"
        
        # Check performance summary
        ppu_info = pass_obj._viewport.get_ppu_info()
        assert ppu_info["current_sprites"] <= 40  # Within Game Boy limits
        assert ppu_info["current_tile_bank"] in ["default", "forest", "town", "dungeon"]
        
        logger.info(f"Game Boy parity performance: {avg_time:.4f}s per frame")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
