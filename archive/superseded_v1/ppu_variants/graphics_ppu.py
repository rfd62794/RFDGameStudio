"""
Graphics Engine - The Body Pillar

160x144 PPU rendering, TileBank management, and Metasprite display.
Game Boy Parity renderer with Tkinter/Canvas backend.
"""

import time
import sys
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

from loguru import logger

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Import from engines
try:
    from ..engines.dd_engine import GameState, Effect
except ImportError:
    from src.engines.dd_engine import GameState, Effect


class RenderLayer(Enum):
    """Rendering layers for compositing"""
    BACKGROUND = "background"
    TERRAIN = "terrain"
    ENTITIES = "entities"
    EFFECTS = "effects"
    UI = "ui"


@dataclass
class Tile:
    """Single tile definition"""
    tile_id: int
    pixel_data: List[List[int]]  # 8x8 pixel data
    palette: List[int] = field(default_factory=lambda: [0, 1, 2, 3])
    
    def get_pixel(self, x: int, y: int) -> int:
        """Get pixel color at position"""
        if 0 <= x < 8 and 0 <= y < 8:
            return self.pixel_data[y][x]
        return 0


@dataclass
class Sprite:
    """Sprite definition for entities"""
    sprite_id: int
    width: int
    height: int
    tiles: List[Tile]
    position: Tuple[int, int] = (0, 0)
    visible: bool = True
    
    def get_pixel(self, x: int, y: int) -> int:
        """Get pixel color at sprite position"""
        if not self.visible:
            return 0  # Transparent
        
        # Convert to tile coordinates
        tile_x = x // 8
        tile_y = y // 8
        pixel_x = x % 8
        pixel_y = y % 8
        
        if 0 <= tile_x < self.width // 8 and 0 <= tile_y < self.height // 8:
            tile_index = tile_y * (self.width // 8) + tile_x
            if tile_index < len(self.tiles):
                return self.tiles[tile_index].get_pixel(pixel_x, pixel_y)
        
        return 0  # Transparent


@dataclass
class Layer:
    """Rendering layer"""
    layer_type: RenderLayer
    width: int
    height: int
    pixel_data: List[List[int]] = field(default_factory=list)
    visible: bool = True
    
    def __post_init__(self):
        if not self.pixel_data:
            self.pixel_data = [[0 for _ in range(self.width)] for _ in range(self.height)]
    
    def set_pixel(self, x: int, y: int, color: int) -> None:
        """Set pixel color at position"""
        if 0 <= x < self.width and 0 <= y < self.height:
            self.pixel_data[y][x] = color
    
    def get_pixel(self, x: int, y: int) -> int:
        """Get pixel color at position"""
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.pixel_data[y][x]
        return 0
    
    def clear(self) -> None:
        """Clear layer to transparent"""
        self.pixel_data = [[0 for _ in range(self.width)] for _ in range(self.height)]


@dataclass
class RenderFrame:
    """Complete render frame"""
    width: int
    height: int
    layers: Dict[RenderLayer, Layer] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    
    def get_composite_pixel(self, x: int, y: int) -> int:
        """Get composite pixel from all layers"""
        # Layer order: background -> terrain -> entities -> effects -> ui
        layer_order = [
            RenderLayer.BACKGROUND,
            RenderLayer.TERRAIN,
            RenderLayer.ENTITIES,
            RenderLayer.EFFECTS,
            RenderLayer.UI
        ]
        
        for layer_type in layer_order:
            if layer_type in self.layers and self.layers[layer_type].visible:
                pixel = self.layers[layer_type].get_pixel(x, y)
                if pixel != 0:  # Not transparent
                    return pixel
        
        return 0  # Default background color


class TileBank:
    """Tile bank management for different environments"""
    
    def __init__(self):
        self.tile_banks: Dict[str, List[Tile]] = {}
        self.current_bank: str = "forest"
        
        logger.info("🎨 Tile Bank initialized")
    
    def load_tile_bank(self, bank_name: str, tiles: List[Tile]) -> None:
        """Load tile bank"""
        self.tile_banks[bank_name] = tiles
        logger.info(f"📦 Loaded tile bank: {bank_name} ({len(tiles)} tiles)")
    
    def set_current_bank(self, bank_name: str) -> None:
        """Set current active tile bank"""
        if bank_name in self.tile_banks:
            self.current_bank = bank_name
            logger.debug(f"🎨 Switched to tile bank: {bank_name}")
        else:
            logger.warning(f"❌ Tile bank not found: {bank_name}")
    
    def get_tile(self, tile_id: int) -> Optional[Tile]:
        """Get tile from current bank"""
        current_tiles = self.tile_banks.get(self.current_bank, [])
        
        for tile in current_tiles:
            if tile.tile_id == tile_id:
                return tile
        
        return None
    
    def create_mock_tile_bank(self, bank_name: str, num_tiles: int = 256) -> None:
        """Create mock tile bank for testing"""
        tiles = []
        
        for i in range(num_tiles):
            # Create simple 8x8 tile with pattern
            pixel_data = []
            for y in range(8):
                row = []
                for x in range(8):
                    # Simple checkerboard pattern
                    color = (x + y + i) % 4
                    row.append(color)
                pixel_data.append(row)
            
            tile = Tile(tile_id=i, pixel_data=pixel_data)
            tiles.append(tile)
        
        self.load_tile_bank(bank_name, tiles)


class PPU_160x144:
    """Picture Processing Unit - Game Boy Parity Renderer"""
    
    def __init__(self):
        self.width = 160
        self.height = 144
        self.frame_buffer: List[List[int]] = [[0 for _ in range(self.width)] for _ in range(self.height)]
        self.palette = [
            (255, 255, 255),  # White
            (170, 170, 170),  # Light gray
            (85, 85, 85),     # Dark gray
            (0, 0, 0)         # Black
        ]
        
        logger.info("🖥️ PPU-160x144 initialized - Game Boy Parity ready")
    
    def render_frame(self, frame: RenderFrame) -> None:
        """Render frame to internal buffer"""
        # Clear buffer
        self.frame_buffer = [[0 for _ in range(self.width)] for _ in range(self.height)]
        
        # Composite all layers
        for y in range(self.height):
            for x in range(self.width):
                color_index = frame.get_composite_pixel(x, y)
                self.frame_buffer[y][x] = color_index
    
    def display(self, frame: RenderFrame) -> None:
        """Display frame (placeholder for Tkinter/Canvas)"""
        self.render_frame(frame)
        logger.debug("🖼️ Frame displayed to PPU buffer")
    
    def get_frame_buffer(self) -> List[List[int]]:
        """Get current frame buffer"""
        return self.frame_buffer
    
    def get_rgb_pixel(self, x: int, y: int) -> Tuple[int, int, int]:
        """Get RGB color for pixel"""
        if 0 <= x < self.width and 0 <= y < self.height:
            color_index = self.frame_buffer[y][x]
            return self.palette[color_index]
        return (0, 0, 0)


class GraphicsEngine:
    """160x144 PPU rendering and tile management - The Body Pillar"""
    
    def __init__(self, assets_path: str):
        self.assets_path = assets_path
        self.tile_bank = TileBank()
        self.ppu = PPU_160x144()
        self.viewport_center: Tuple[int, int] = (80, 72)  # Center of 160x144 viewport
        
        # Rendering layers
        self.layers = {
            RenderLayer.BACKGROUND: Layer(RenderLayer.BACKGROUND, 160, 144),
            RenderLayer.TERRAIN: Layer(RenderLayer.TERRAIN, 160, 144),
            RenderLayer.ENTITIES: Layer(RenderLayer.ENTITIES, 160, 144),
            RenderLayer.EFFECTS: Layer(RenderLayer.EFFECTS, 160, 144),
            RenderLayer.UI: Layer(RenderLayer.UI, 160, 144)
        }
        
        # Mock tile banks for testing
        self._initialize_mock_tile_banks()
        
        logger.info("🎨 Graphics Engine initialized - Body Pillar ready")
    
    def render_state(self, game_state: GameState) -> RenderFrame:
        """Render current game state to frame buffer"""
        logger.debug(f"🎨 Rendering state: {game_state.player_position}")
        
        # Update viewport to follow player
        self._update_viewport(game_state.player_position)
        
        # Load appropriate tile bank
        self._load_tile_bank(game_state.current_environment)
        
        # Clear all layers
        for layer in self.layers.values():
            layer.clear()
        
        # Render layers in order
        self._render_background_layer(game_state)
        self._render_terrain_layer(game_state)
        self._render_entities_layer(game_state)
        self._render_effects_layer(game_state.active_effects)
        self._render_ui_layer(game_state)
        
        # Create render frame
        frame = RenderFrame(
            width=160,
            height=144,
            layers=self.layers.copy(),
            timestamp=time.time()
        )
        
        return frame
    
    def display_frame(self, frame: RenderFrame) -> None:
        """Display frame to screen (Tkinter/Canvas)"""
        self.ppu.display(frame)
    
    def get_rgb_frame_buffer(self) -> List[List[Tuple[int, int, int]]]:
        """Get RGB frame buffer for display"""
        rgb_buffer = []
        
        for y in range(self.ppu.height):
            rgb_row = []
            for x in range(self.ppu.width):
                rgb_pixel = self.ppu.get_rgb_pixel(x, y)
                rgb_row.append(rgb_pixel)
            rgb_buffer.append(rgb_row)
        
        return rgb_buffer
    
    def _update_viewport(self, player_position: Tuple[int, int]) -> None:
        """Update viewport to follow player"""
        # Simple viewport following
        self.viewport_center = player_position
    
    def _load_tile_bank(self, environment: str) -> None:
        """Load appropriate tile bank for environment"""
        bank_name = f"{environment}_bank"
        self.tile_bank.set_current_bank(bank_name)
    
    def _render_background_layer(self, game_state: GameState) -> None:
        """Render background layer"""
        background_layer = self.layers[RenderLayer.BACKGROUND]
        
        # Fill with default background color
        for y in range(144):
            for x in range(160):
                background_layer.set_pixel(x, y, 0)  # White background
    
    def _render_terrain_layer(self, game_state: GameState) -> None:
        """Render terrain layer"""
        terrain_layer = self.layers[RenderLayer.TERRAIN]
        
        # Render simple terrain based on environment
        environment_color = {
            "forest": 2,  # Dark green
            "town": 1,    # Light gray
            "tavern": 3   # Dark gray
        }.get(game_state.current_environment, 0)
        
        # Render some terrain features
        for y in range(144):
            for x in range(160):
                # Simple pattern based on position
                if (x + y) % 20 == 0:
                    terrain_layer.set_pixel(x, y, environment_color)
    
    def _render_entities_layer(self, game_state: GameState) -> None:
        """Render entities layer"""
        entities_layer = self.layers[RenderLayer.ENTITIES]
        
        # Render player as simple sprite
        player_x, player_y = game_state.player_position
        
        # Convert world coordinates to screen coordinates
        screen_x = player_x - self.viewport_center[0] + 80
        screen_y = player_y - self.viewport_center[1] + 72
        
        # Render player as 8x8 sprite
        if 0 <= screen_x < 152 and 0 <= screen_y < 136:  # Within bounds
            for dy in range(8):
                for dx in range(8):
                    if screen_x + dx < 160 and screen_y + dy < 144:
                        # Simple player sprite pattern
                        color = 3 if (dx + dy) % 4 < 2 else 0
                        entities_layer.set_pixel(screen_x + dx, screen_y + dy, color)
    
    def _render_effects_layer(self, effects: List[Effect]) -> None:
        """Render visual effects"""
        effects_layer = self.layers[RenderLayer.EFFECTS]
        
        for effect in effects:
            self._render_effect(effect, effects_layer)
    
    def _render_effect(self, effect: Effect, layer: Layer) -> None:
        """Render single effect"""
        effect_color = {
            "gate_reveal": 1,
            "city_ambiance": 2,
            "tavern_glow": 3,
            "firelight": 3,
            "completion_glow": 1
        }.get(effect.effect_type, 0)
        
        # Simple effect rendering
        for y in range(144):
            for x in range(160):
                if (x + y + int(effect.start_time * 10)) % 30 == 0:
                    layer.set_pixel(x, y, effect_color)
    
    def _render_ui_layer(self, game_state: GameState) -> None:
        """Render UI layer"""
        ui_layer = self.layers[RenderLayer.UI]
        
        # Render simple health bar
        health_percentage = game_state.player_health / 100.0
        bar_width = int(50 * health_percentage)
        
        for x in range(bar_width):
            ui_layer.set_pixel(x + 5, 5, 3)  # Black health bar
        
        # Render border
        for x in range(52):
            ui_layer.set_pixel(x + 5, 4, 3)
            ui_layer.set_pixel(x + 5, 6, 3)
    
    def _initialize_mock_tile_banks(self) -> None:
        """Initialize mock tile banks for testing"""
        environments = ["forest", "town", "tavern"]
        
        for env in environments:
            self.tile_bank.create_mock_tile_bank(f"{env}_bank", 64)
    
    def get_status(self) -> Dict[str, Any]:
        """Get graphics engine status"""
        return {
            "viewport_center": self.viewport_center,
            "current_tile_bank": self.tile_bank.current_bank,
            "active_layers": [name for name, layer in self.layers.items() if layer.visible],
            "ppu_resolution": f"{self.ppu.width}x{self.ppu.height}"
        }


# Factory for creating Graphics Engine instances
class GraphicsEngineFactory:
    """Factory for creating Graphics Engine instances"""
    
    @staticmethod
    def create_engine(assets_path: str = "assets/") -> GraphicsEngine:
        """Create a Graphics Engine with default configuration"""
        return GraphicsEngine(assets_path)
    
    @staticmethod
    def create_test_engine() -> GraphicsEngine:
        """Create a Graphics Engine for testing"""
        return GraphicsEngine("test_assets/")
