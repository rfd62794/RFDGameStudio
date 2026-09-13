"""
Graphics Engine - The Body Pillar (PPU Implementation)
DGT SDK Adapter Version

160x144 Game Boy parity rendering with layer composition and viewport management.
The Graphics Engine renders the game state to the screen while maintaining
60 FPS performance and supporting subtitle overlay.

The Body Pillar transforms the Mind's state into visual representation.
"""

import time
import asyncio
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from loguru import logger

# === KERNEL BRIDGE IMPORTS ===
# Importing from the new DGT Kernel
try:
    from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
except ImportError:
    # Fallback to relative import if package is not in path
    from ...foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT

TARGET_FPS = 60
FRAME_DELAY_MS = 16
VIEWPORT_WIDTH_PIXELS = SOVEREIGN_WIDTH
VIEWPORT_HEIGHT_PIXELS = SOVEREIGN_HEIGHT
TILE_SIZE_PIXELS = 8
VIEWPORT_TILES_X = VIEWPORT_WIDTH_PIXELS // TILE_SIZE_PIXELS
VIEWPORT_TILES_Y = VIEWPORT_HEIGHT_PIXELS // TILE_SIZE_PIXELS

@dataclass
class GameState:
    pass

class TileType:
    pass

class BiomeType:
    pass

@dataclass
class SubtitleEvent:
    text: str
    duration: float = 3.0



class RenderLayer:
    """Fallback render layer class"""
    BACKGROUND = "background"
    SURFACES = "surfaces"
    FRINGE = "fringe"
    ACTORS = "actors"
    UI = "ui"
    
    def __init__(self, name: str):
        self.name = name
    
    def __str__(self):
        return self.name

@dataclass
class RenderFrame:
    """Complete frame with all layers"""
    width: int
    height: int
    layers: Dict[str, np.ndarray]
    timestamp: float = field(default_factory=time.time)
    
    def __post_init__(self):
        # Ensure all layers exist
        layer_names = ["background", "surfaces", "fringe", "actors", "ui"]
        for layer_name in layer_names:
            if layer_name not in self.layers:
                self.layers[layer_name] = np.zeros((self.height, self.width, 3), dtype=np.uint8)


@dataclass
class TileBank:
    """Tile bank for different environments"""
    environment: str
    tiles: Dict[TileType, np.ndarray]
    palette: Dict[str, Tuple[int, int, int]]
    
    def get_tile(self, tile_type: TileType) -> np.ndarray:
        """Get tile sprite for type"""
        return self.tiles.get(tile_type, self.tiles[TileType.GRASS])


@dataclass
class Viewport:
    """Camera viewport for world rendering"""
    center_x: int
    center_y: int
    width_tiles: int
    height_tiles: int
    
    def get_world_bounds(self) -> Tuple[int, int, int, int]:
        """Get world coordinates bounds"""
        half_width = self.width_tiles // 2
        half_height = self.height_tiles // 2
        
        min_x = max(0, self.center_x - half_width)
        max_x = min(50, self.center_x + half_width)
        min_y = max(0, self.center_y - half_height)
        max_y = min(50, self.center_y + half_height)
        
        return min_x, min_y, max_x, max_y
    
    def world_to_screen(self, world_x: int, world_y: int) -> Tuple[int, int]:
        """Convert world coordinates to screen coordinates"""
        screen_x = (world_x - self.center_x) * TILE_SIZE_PIXELS + VIEWPORT_WIDTH_PIXELS // 2
        screen_y = (world_y - self.center_y) * TILE_SIZE_PIXELS + VIEWPORT_HEIGHT_PIXELS // 2
        return screen_x, screen_y


class GraphicsEngine:
    """160x144 PPU rendering engine with Game Boy parity"""
    
    def __init__(self, assets_path: str = "assets/"):
        self.assets_path = assets_path
        
        # Rendering configuration
        self.width = VIEWPORT_WIDTH_PIXELS
        self.height = VIEWPORT_HEIGHT_PIXELS
        self.target_fps = TARGET_FPS
        
        # Viewport management
        self.viewport = Viewport(
            center_x=25,  # Center of 50x50 world
            center_y=25,
            width_tiles=20,  # VIEWPORT_TILES_X
            height_tiles=18  # VIEWPORT_TILES_Y
        )
        
        # Tile banks for different environments
        self.tile_banks: Dict[str, TileBank] = {}
        self.current_environment = "forest"
        
        # Rendering buffers
        self.frame_buffer: Optional[np.ndarray] = None
        self.current_frame: Optional[RenderFrame] = None
        
        # Performance tracking
        self.render_times: List[float] = []
        self.last_render_time = 0.0
        
        # Initialize tile banks
        self._initialize_tile_banks()
        
        # Initialize frame buffer
        self._initialize_frame_buffer()
        
        logger.info("🎨 Graphics Engine initialized (DGT SDK Adapter) - 160x144 PPU ready")
    
    # === FACADE INTERFACE ===
    
    async def render_state(self, game_state: GameState) -> RenderFrame:
        """Render complete game state (Facade method)"""
        start_time = time.time()
        
        # Update viewport to follow player
        self._update_viewport(game_state.player_position)
        
        # Switch tile bank if environment changed
        if game_state.current_environment != self.current_environment:
            await self._switch_environment(game_state.current_environment)
        
        # Create new frame
        frame = RenderFrame(
            width=self.width,
            height=self.height,
            layers={}
        )
        
        # Render each layer
        await self._render_background_layer(frame, game_state)
        await self._render_terrain_layer(frame, game_state)
        await self._render_entities_layer(frame, game_state)
        await self._render_effects_layer(frame, game_state)
        await self._render_ui_layer(frame, game_state)
        
        # Composite final frame
        await self._composite_frame(frame)
        
        # Track performance
        render_time = (time.time() - start_time) * 1000
        self.render_times.append(render_time)
        if len(self.render_times) > 60:  # Keep last 60 frames
            self.render_times.pop(0)
        
        self.last_render_time = render_time
        self.current_frame = frame
        
        return frame
    
    async def render_subtitles(self, frame: RenderFrame, subtitles: List[SubtitleEvent]) -> None:
        """Render subtitles onto frame (Facade method)"""
        if not subtitles:
            return
        
        # Get subtitle layer
        subtitle_layer = frame.layers[RenderLayer.SUBTITLES]
        
        for subtitle in subtitles:
            await self._render_subtitle(subtitle_layer, subtitle)
    
    async def display_frame(self, frame: RenderFrame) -> None:
        """Display frame to buffer (Facade method)"""
        # Composite all layers into final frame buffer
        self.frame_buffer = self._composite_layers(frame.layers)
        
        # In a real implementation, this would send to display
        # For now, just track that display was called
        logger.debug(f"🎨 Frame displayed: {frame.width}x{frame.height}")
    
    def get_rgb_frame_buffer(self) -> Optional[np.ndarray]:
        """Get RGB frame buffer for display (Facade method)"""
        return self.frame_buffer.copy() if self.frame_buffer is not None else None
    
    def get_tkinter_image(self, scale_factor: int = 4) -> Optional[Any]:
        """Get Tkinter PhotoImage for display in Cartographer tool"""
        if not PIL_AVAILABLE:
            logger.warning("⚠️ PIL not available, cannot create Tkinter image")
            return None
        
        if self.frame_buffer is None:
            return None
        
        try:
            # Convert numpy array to PIL Image
            # Scale up for better visibility in editor
            new_width = self.width * scale_factor
            new_height = self.height * scale_factor
            
            # Create PIL Image from numpy array
            pil_image = Image.fromarray(self.frame_buffer, 'RGB')
            
            # Scale up for editor visibility
            pil_image = pil_image.resize(
                (new_width, new_height), 
                Image.Resampling.NEAREST  # Preserve pixel art look
            )
            
            # Convert to PhotoImage
            photo_image = ImageTk.PhotoImage(pil_image)
            
            return photo_image
            
        except Exception as e:
            logger.error(f"❌ Failed to create Tkinter image: {e}")
            return None
    
    def get_status(self) -> Dict[str, Any]:
        """Get graphics engine status (Facade method)"""
        avg_render_time = sum(self.render_times) / len(self.render_times) if self.render_times else 0
        
        return {
            "resolution": f"{self.width}x{self.height}",
            "target_fps": self.target_fps,
            "current_environment": self.current_environment,
            "viewport_center": (self.viewport.center_x, self.viewport.center_y),
            "tile_banks": list(self.tile_banks.keys()),
            "avg_render_time_ms": avg_render_time,
            "last_render_time_ms": self.last_render_time
        }
    
    # === CORE RENDERING METHODS ===
    
    async def _render_background_layer(self, frame: RenderFrame, game_state: GameState) -> None:
        """Render background layer"""
        layer = frame.layers[RenderLayer.BACKGROUND]
        
        # Fill with background color (darkest Game Boy color)
        bg_color = COLOR_PALETTE["darkest"]
        layer.fill(bg_color)
    
    async def _render_terrain_layer(self, frame: RenderFrame, game_state: GameState) -> None:
        """Render terrain layer with tiles"""
        layer = frame.layers[RenderLayer.TERRAIN]
        
        # Get viewport bounds
        min_x, min_y, max_x, max_y = self.viewport.get_world_bounds()
        
        # Get current tile bank
        tile_bank = self.tile_banks.get(self.current_environment)
        if not tile_bank:
            logger.warning(f"No tile bank for environment: {self.current_environment}")
            return
        
        # Render tiles
        for world_y in range(min_y, min_y + self.viewport.height_tiles):
            for world_x in range(min_x, min_x + self.viewport.width_tiles):
                if world_x >= max_x or world_y >= max_y:
                    continue
                
                # Get tile data from world engine
                # This would normally come from the World Engine
                tile_type = self._get_tile_type_at_position(world_x, world_y)
                
                # Get tile sprite
                tile_sprite = tile_bank.get_tile(tile_type)
                
                # Calculate screen position
                screen_x, screen_y = self.viewport.world_to_screen(world_x, world_y)
                
                # Draw tile
                if 0 <= screen_x < self.width and 0 <= screen_y < self.height:
                    self._draw_tile(layer, screen_x, screen_y, tile_sprite)
    
    async def _render_entities_layer(self, frame: RenderFrame, game_state: GameState) -> None:
        """Render entities layer (player, NPCs, etc.)"""
        layer = frame.layers[RenderLayer.ENTITIES]
        
        # Render player
        player_screen_pos = self.viewport.world_to_screen(
            game_state.player_position[0],
            game_state.player_position[1]
        )
        
        # Draw player sprite
        player_sprite = self._create_player_sprite(game_state.voyager_state.value if hasattr(game_state.voyager_state, 'value') else game_state.voyager_state)
        self._draw_sprite(layer, player_screen_pos[0], player_screen_pos[1], player_sprite)
        
        # Render other entities (if any)
        # This would render NPCs, creatures, etc.
    
    async def _render_effects_layer(self, frame: RenderFrame, game_state: GameState) -> None:
        """Render effects layer (particles, animations, etc.)"""
        layer = frame.layers[RenderLayer.EFFECTS]
        
        # Render active effects
        for effect in game_state.active_effects:
            await self._render_effect(layer, effect, game_state)
    
    async def _render_ui_layer(self, frame: RenderFrame, game_state: GameState) -> None:
        """Render UI layer (HUD, indicators, etc.)"""
        layer = frame.layers[RenderLayer.UI]
        
        # Render debug information if enabled
        if self._should_show_debug_info():
            await self._render_debug_info(layer, game_state)
    
    async def _render_subtitle(self, layer: np.ndarray, subtitle: SubtitleEvent) -> None:
        """Render single subtitle"""
        # Simple subtitle rendering (placeholder)
        # In a real implementation, this would use proper font rendering
        
        subtitle_text = subtitle.text
        if len(subtitle_text) > 40:  # Truncate long subtitles
            subtitle_text = subtitle_text[:37] + "..."
        
        # Draw subtitle background
        subtitle_y = self.height - 30
        subtitle_height = 20
        bg_color = COLOR_PALETTE["darkest"]
        
        # Simple rectangle for subtitle background
        layer[subtitle_y:subtitle_y + subtitle_height, :] = bg_color
        
        # Note: Actual text rendering would require font handling
        # For now, just log the subtitle
        logger.debug(f"📝 Subtitle: {subtitle_text}")
    
    async def _render_effect(self, layer: np.ndarray, effect, game_state: GameState) -> None:
        """Render single effect"""
        # Placeholder for effect rendering
        # This would render particles, glows, etc.
        pass
    
    async def _render_debug_info(self, layer: np.ndarray, game_state: GameState) -> None:
        """Render debug information"""
        # Simple debug info rendering
        debug_text = f"Pos: {game_state.player_position} Turn: {game_state.turn_count}"
        logger.debug(f"🎮 Debug: {debug_text}")
    
    # === TILE MANAGEMENT ===
    
    def _initialize_tile_banks(self) -> None:
        """Initialize tile banks for different environments"""
        # Create simple tile sprites for each environment
        environments = ["forest", "town", "tavern", "mountain", "desert"]
        
        for env in environments:
            tile_bank = TileBank(
                environment=env,
                tiles=self._create_environment_tiles(env),
                palette=COLOR_PALETTE
            )
            self.tile_banks[env] = tile_bank
        
        logger.info(f"🎨 Initialized {len(self.tile_banks)} tile banks")
    
    def _create_environment_tiles(self, environment: str) -> Dict[TileType, np.ndarray]:
        """Create tile sprites for environment"""
        tiles = {}
        
        for tile_type in TileType:
            # Create simple 8x8 tile sprite
            tile_sprite = self._create_tile_sprite(tile_type, environment)
            tiles[tile_type] = tile_sprite
        
        return tiles
    
    def _create_tile_sprite(self, tile_type: TileType, environment: str) -> np.ndarray:
        """Create single tile sprite"""
        sprite = np.zeros((TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, 3), dtype=np.uint8)
        
        # Simple color-based tiles
        if tile_type == TileType.GRASS:
            sprite.fill(COLOR_PALETTE["light"])
        elif tile_type == TileType.STONE:
            sprite.fill(COLOR_PALETTE["dark"])
        elif tile_type == TileType.WATER:
            sprite.fill(COLOR_PALETTE["dark"])
        elif tile_type == TileType.FOREST:
            sprite.fill(COLOR_PALETTE["light"])
        elif tile_type == TileType.MOUNTAIN:
            sprite.fill(COLOR_PALETTE["dark"])
        elif tile_type == TileType.SAND:
            sprite.fill(COLOR_PALETTE["light"])
        elif tile_type == TileType.SNOW:
            sprite.fill(COLOR_PALETTE["lightest"])
        else:
            sprite.fill(COLOR_PALETTE["light"])
        
        return sprite
    
    def _create_player_sprite(self, voyager_state: str) -> np.ndarray:
        """Create player sprite based on state"""
        sprite = np.zeros((TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, 3), dtype=np.uint8)
        
        # Color based on Voyager state
        if voyager_state == "pondering":
            sprite.fill(COLOR_PALETTE["lightest"])  # White when thinking
        elif voyager_state == "moving":
            sprite.fill(COLOR_PALETTE["light"])  # Green when moving
        else:
            sprite.fill(COLOR_PALETTE["dark"])  # Dark when idle
        
        return sprite
    
    # === UTILITY METHODS ===
    
    def _update_viewport(self, player_position: Tuple[int, int]) -> None:
        """Update viewport to follow player"""
        self.viewport.center_x = player_position[0]
        self.viewport.center_y = player_position[1]
    
    async def _switch_environment(self, new_environment: str) -> None:
        """Switch to different environment tile bank"""
        if new_environment in self.tile_banks:
            self.current_environment = new_environment
            logger.info(f"🎨 Switched to environment: {new_environment}")
        else:
            logger.warning(f"Unknown environment: {new_environment}")
    
    def _get_tile_type_at_position(self, x: int, y: int) -> TileType:
        """Get tile type at position (placeholder)"""
        # This would normally query the World Engine
        # For now, return a simple pattern
        if (x + y) % 7 == 0:
            return TileType.STONE
        elif (x + y) % 5 == 0:
            return TileType.FOREST
        else:
            return TileType.GRASS
    
    def _draw_tile(self, layer: np.ndarray, x: int, y: int, tile: np.ndarray) -> None:
        """Draw tile to layer"""
        if 0 <= x < self.width - TILE_SIZE_PIXELS and 0 <= y < self.height - TILE_SIZE_PIXELS:
            layer[y:y+TILE_SIZE_PIXELS, x:x+TILE_SIZE_PIXELS] = tile
    
    def _draw_sprite(self, layer: np.ndarray, x: int, y: int, sprite: np.ndarray) -> None:
        """Draw sprite to layer"""
        self._draw_tile(layer, x, y, sprite)
    
    def _composite_frame(self, frame: RenderFrame) -> None:
        """Composite all layers into final frame"""
        # This is handled by display_frame
        pass
    
    def _composite_layers(self, layers: Dict[RenderLayer, np.ndarray]) -> np.ndarray:
        """Composite all layers into final frame buffer"""
        # Start with background
        final_frame = layers[RenderLayer.BACKGROUND].copy()
        
        # Composite each layer in order
        layer_order = [
            RenderLayer.TERRAIN,
            RenderLayer.ENTITIES,
            RenderLayer.EFFECTS,
            RenderLayer.UI,
            RenderLayer.SUBTITLES
        ]
        
        for layer_type in layer_order:
            if layer_type in layers:
                # Simple alpha blending (opaque layers)
                mask = np.any(layers[layer_type] != COLOR_PALETTE["darkest"], axis=2)
                final_frame[mask] = layers[layer_type][mask]
        
        return final_frame
    
    def _should_show_debug_info(self) -> bool:
        """Check if debug info should be shown"""
        # This would check configuration
        return False
    
    def _initialize_frame_buffer(self) -> None:
        """Initialize frame buffer"""
        self.frame_buffer = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        logger.info(f"🎨 Frame buffer initialized: {self.width}x{self.height}")
    
    # === PERFORMANCE MONITORING ===
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get rendering performance statistics"""
        if not self.render_times:
            return {"avg_render_time_ms": 0, "fps": 0}
        
        avg_time = sum(self.render_times) / len(self.render_times)
        fps = 1000 / avg_time if avg_time > 0 else 0
        
        return {
            "avg_render_time_ms": avg_time,
            "min_render_time_ms": min(self.render_times),
            "max_render_time_ms": max(self.render_times),
            "fps": fps,
            "frame_count": len(self.render_times)
        }


# === FACTORY ===

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


# === SYNCHRONOUS WRAPPER ===

class GraphicsEngineSync:
    """Synchronous wrapper for Graphics Engine (for compatibility)"""
    
    def __init__(self, graphics_engine: GraphicsEngine):
        self.graphics_engine = graphics_engine
        self._loop = asyncio.new_event_loop()
    
    def render_state(self, game_state: GameState) -> RenderFrame:
        """Synchronous render_state"""
        return self._loop.run_until_complete(
            self.graphics_engine.render_state(game_state)
        )
    
    def render_subtitles(self, frame: RenderFrame, subtitles: List[SubtitleEvent]) -> None:
        """Synchronous render_subtitles"""
        self._loop.run_until_complete(
            self.graphics_engine.render_subtitles(frame, subtitles)
        )
    
    def display_frame(self, frame: RenderFrame) -> None:
        """Synchronous display_frame"""
        self._loop.run_until_complete(
            self.graphics_engine.display_frame(frame)
        )
