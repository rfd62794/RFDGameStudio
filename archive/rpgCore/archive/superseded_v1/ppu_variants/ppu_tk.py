"""
Tkinter PPU Framework - The Body Pillar's Graphics Processing Unit

Implements a 5-layer compositing system using PIL for 160x144 Game Boy parity rendering.
Treats the screen as a layered buffer rather than a drawing surface.

Layer Stack:
- Layer 0 (Background): Pre-baked biome tiles (Grass, Dirt)
- Layer 1 (Surfaces): Systemic overlays (Fire, Water, Blood)  
- Layer 2 (Fringe): Objects/Interactables (Chests, Doors)
- Layer 3 (Actors): The Voyager and Personas
- Layer 4 (UI/Text): Typewriter dialogue and D20 roll overlays
"""

import tkinter as tk
from tkinter import Canvas, Label, Frame
import asyncio
import time
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import numpy as np

try:
    from PIL import Image, ImageTk, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from loguru import logger

from core.state import GameState, TileType, BiomeType
from core.constants import (
    TILE_SIZE_PIXELS, VIEWPORT_WIDTH_PIXELS, VIEWPORT_HEIGHT_PIXELS,
    VIEWPORT_TILES_X, VIEWPORT_TILES_Y, COLOR_PALETTE, TARGET_FPS
)
from utils.asset_loader import AssetLoader, ObjectRegistry


class RenderLayer(Enum):
    """5-layer compositing system"""
    BACKGROUND = 0    # Pre-baked biome tiles
    SURFACES = 1      # Systemic overlays (Fire, Water, Blood)
    FRINGE = 2        # Objects/Interactables (Chests, Doors)
    ACTORS = 3        # The Voyager and Personas
    UI_TEXT = 4       # Typewriter dialogue and D20 roll overlays


@dataclass
class LayerBuffer:
    """Individual layer buffer for compositing"""
    layer_type: RenderLayer
    width: int
    height: int
    data: np.ndarray
    dirty: bool = True  # Track if layer needs redraw
    
    def __post_init__(self):
        if self.data.size == 0:
            self.data = np.zeros((self.height, self.width, 3), dtype=np.uint8)
    
    def clear(self) -> None:
        """Clear layer to transparent"""
        self.data.fill(0)
        self.dirty = True
    
    def mark_dirty(self) -> None:
        """Mark layer as needing redraw"""
        self.dirty = True


@dataclass
class RenderEntity:
    """Entity with metadata for rendering"""
    entity_id: str
    position: Tuple[int, int]  # World coordinates
    object_type: str  # Reference to objects.yaml
    layer: RenderLayer
    visible: bool = True
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class TkinterPPU:
    """Tkinter-based Picture Processing Unit with 5-layer compositing"""
    
    def __init__(self, root: tk.Tk, asset_loader: AssetLoader):
        if not PIL_AVAILABLE:
            raise ImportError("PIL (Pillow) is required for Tkinter PPU")
        
        self.root = root
        self.asset_loader = asset_loader
        
        # Viewport configuration
        self.viewport_width = VIEWPORT_WIDTH_PIXELS
        self.viewport_height = VIEWPORT_HEIGHT_PIXELS
        self.tile_size = TILE_SIZE_PIXELS
        
        # Camera/viewport position in world coordinates
        self.camera_x: int = 25
        self.camera_y: int = 25
        
        # Layer buffers (5-layer compositing)
        self.layers: Dict[RenderLayer, LayerBuffer] = {}
        self._initialize_layers()
        
        # Entity registry
        self.entities: Dict[str, RenderEntity] = {}
        
        # Tkinter components
        self.frame: Optional[Frame] = None
        self.canvas: Optional[Canvas] = None
        self.photo_image: Optional[ImageTk.PhotoImage] = None
        
        # Composited frame buffer
        self.frame_buffer: Optional[Image.Image] = None
        
        # Performance tracking
        self.render_times: List[float] = []
        self.last_render_time: float = 0.0
        
        logger.info("🎨 Tkinter PPU initialized - 5-layer compositing ready")
    
    def _initialize_layers(self) -> None:
        """Initialize the 5 layer buffers"""
        for layer in RenderLayer:
            self.layers[layer] = LayerBuffer(
                layer_type=layer,
                width=self.viewport_width,
                height=self.viewport_height,
                data=np.zeros((self.viewport_height, self.viewport_width, 3), dtype=np.uint8)
            )
        
        logger.info(f"🎨 Initialized {len(self.layers)} render layers")
    
    def setup_ui(self, parent_frame: Frame = None) -> Frame:
        """Setup Tkinter UI components"""
        if parent_frame is None:
            parent_frame = self.root
        
        # Create main frame
        self.frame = Frame(parent_frame, bg="black", relief=tk.SUNKEN, borderwidth=2)
        self.frame.pack(padx=10, pady=10)
        
        # Create canvas for rendering
        self.canvas = Canvas(
            self.frame,
            width=self.viewport_width,
            height=self.viewport_height,
            bg="black",
            highlightthickness=0
        )
        self.canvas.pack()
        
        # Create initial photo image
        self.frame_buffer = Image.new(
            'RGB',
            (self.viewport_width, self.viewport_height),
            COLOR_PALETTE["darkest"]
        )
        self.photo_image = ImageTk.PhotoImage(self.frame_buffer)
        
        # Display photo image on canvas
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo_image)
        
        logger.info("🎨 Tkinter UI setup complete")
        return self.frame
    
    def set_camera_position(self, x: int, y: int) -> None:
        """Set camera position in world coordinates"""
        self.camera_x = x
        self.camera_y = y
        self._mark_all_layers_dirty()
    
    def add_entity(self, entity: RenderEntity) -> None:
        """Add entity to render registry"""
        self.entities[entity.entity_id] = entity
        self.layers[entity.layer].mark_dirty()
        logger.debug(f"🎨 Added entity {entity.entity_id} to layer {entity.layer.name}")
    
    def remove_entity(self, entity_id: str) -> None:
        """Remove entity from render registry"""
        if entity_id in self.entities:
            entity = self.entities[entity_id]
            del self.entities[entity_id]
            self.layers[entity.layer].mark_dirty()
            logger.debug(f"🎨 Removed entity {entity_id}")
    
    def update_entity_position(self, entity_id: str, position: Tuple[int, int]) -> None:
        """Update entity position"""
        if entity_id in self.entities:
            entity = self.entities[entity_id]
            entity.position = position
            self.layers[entity.layer].mark_dirty()
    
    def _mark_all_layers_dirty(self) -> None:
        """Mark all layers as needing redraw"""
        for layer in self.layers.values():
            layer.mark_dirty()
    
    async def render_frame(self, game_state: GameState) -> None:
        """Render complete frame using 5-layer compositing"""
        start_time = time.time()
        
        try:
            # Update camera to follow player
            self.set_camera_position(game_state.player_position[0], game_state.player_position[1])
            
            # Render each layer
            await self._render_background_layer(game_state)
            await self._render_surfaces_layer(game_state)
            await self._render_fringe_layer(game_state)
            await self._render_actors_layer(game_state)
            await self._render_ui_layer(game_state)
            
            # Composite layers
            await self._composite_layers()
            
            # Update Tkinter display
            await self._update_display()
            
            # Track performance
            render_time = (time.time() - start_time) * 1000
            self.render_times.append(render_time)
            if len(self.render_times) > 60:
                self.render_times.pop(0)
            
            self.last_render_time = render_time
            
        except Exception as e:
            logger.error(f"💥 Render frame failed: {e}")
    
    async def _render_background_layer(self, game_state: GameState) -> None:
        """Render Layer 0: Pre-baked biome tiles"""
        layer = self.layers[RenderLayer.BACKGROUND]
        
        if not layer.dirty:
            return
        
        layer.clear()
        
        # Get viewport bounds
        start_x = self.camera_x - (VIEWPORT_TILES_X // 2)
        start_y = self.camera_y - (VIEWPORT_TILES_Y // 2)
        
        # Render biome tiles using pre-baked assets
        for tile_y in range(VIEWPORT_TILES_Y):
            for tile_x in range(VIEWPORT_TILES_X):
                world_x = start_x + tile_x
                world_y = start_y + tile_y
                
                # Get tile from game state or world engine
                tile_type = self._get_tile_type_at_position(world_x, world_y, game_state)
                
                # Get pre-baked tile sprite
                tile_sprite = self.asset_loader.get_tile_sprite(tile_type)
                
                if tile_sprite:
                    # Draw tile to layer
                    screen_x = tile_x * self.tile_size
                    screen_y = tile_y * self.tile_size
                    self._draw_sprite_to_layer(layer, screen_x, screen_y, tile_sprite)
        
        layer.dirty = False
    
    async def _render_surfaces_layer(self, game_state: GameState) -> None:
        """Render Layer 1: Systemic overlays (Fire, Water, Blood)"""
        layer = self.layers[RenderLayer.SURFACES]
        
        if not layer.dirty:
            return
        
        layer.clear()
        
        # Render active effects and surfaces
        for effect in game_state.active_effects:
            if hasattr(effect, 'position'):
                screen_pos = self._world_to_screen(effect.position)
                effect_sprite = self.asset_loader.get_effect_sprite(effect.effect_type)
                
                if effect_sprite:
                    self._draw_sprite_to_layer(layer, screen_pos[0], screen_pos[1], effect_sprite)
        
        layer.dirty = False
    
    async def _render_fringe_layer(self, game_state: GameState) -> None:
        """Render Layer 2: Objects/Interactables (Chests, Doors)"""
        layer = self.layers[RenderLayer.FRINGE]
        
        if not layer.dirty:
            return
        
        layer.clear()
        
        # Render objects and interactables
        for entity_id, entity in self.entities.items():
            if entity.layer == RenderLayer.FRINGE and entity.visible:
                screen_pos = self._world_to_screen(entity.position)
                object_sprite = self.asset_loader.get_object_sprite(entity.object_type)
                
                if object_sprite:
                    self._draw_sprite_to_layer(layer, screen_pos[0], screen_pos[1], object_sprite)
        
        layer.dirty = False
    
    async def _render_actors_layer(self, game_state: GameState) -> None:
        """Render Layer 3: The Voyager and Personas"""
        layer = self.layers[RenderLayer.ACTORS]
        
        if not layer.dirty:
            return
        
        layer.clear()
        
        # Render player (Voyager)
        player_screen_pos = self._world_to_screen(game_state.player_position)
        player_sprite = self.asset_loader.get_actor_sprite("voyager", game_state.voyager_state)
        
        if player_sprite:
            self._draw_sprite_to_layer(layer, player_screen_pos[0], player_screen_pos[1], player_sprite)
        
        # Render other actors (Personas)
        for entity_id, entity in self.entities.items():
            if entity.layer == RenderLayer.ACTORS and entity.visible:
                screen_pos = self._world_to_screen(entity.position)
                actor_sprite = self.asset_loader.get_actor_sprite(entity.object_type, entity.metadata.get('state'))
                
                if actor_sprite:
                    self._draw_sprite_to_layer(layer, screen_pos[0], screen_pos[1], actor_sprite)
        
        layer.dirty = False
    
    async def _render_ui_layer(self, game_state: GameState) -> None:
        """Render Layer 4: Typewriter dialogue and D20 roll overlays"""
        layer = self.layers[RenderLayer.UI_TEXT]
        
        if not layer.dirty:
            return
        
        layer.clear()
        
        # Render UI elements (health bar, dialogue, D20 rolls)
        await self._render_health_bar(layer, game_state)
        await self._render_dialogue_text(layer, game_state)
        
        layer.dirty = False
    
    async def _render_health_bar(self, layer: LayerBuffer, game_state: GameState) -> None:
        """Render health bar UI element"""
        # Simple health bar at top of screen
        bar_width = 100
        bar_height = 8
        bar_x = 10
        bar_y = 10
        
        # Calculate health percentage
        health_pct = game_state.player_health / 100
        
        # Draw health bar background
        layer.data[bar_y:bar_y+bar_height, bar_x:bar_x+bar_width] = COLOR_PALETTE["darkest"]
        
        # Draw health bar fill
        fill_width = int(bar_width * health_pct)
        if fill_width > 0:
            layer.data[bar_y:bar_y+bar_height, bar_x:bar_x+fill_width] = COLOR_PALETTE["light"]
    
    async def _render_dialogue_text(self, layer: LayerBuffer, game_state: GameState) -> None:
        """Render dialogue text (placeholder for now)"""
        # In a full implementation, this would render text using a bitmap font
        # For now, just show a simple indicator when there are active effects
        if game_state.active_effects:
            # Draw dialogue indicator
            indicator_x = 10
            indicator_y = self.viewport_height - 20
            layer.data[indicator_y:indicator_y+4, indicator_x:indicator_x+8] = COLOR_PALETTE["lightest"]
    
    async def _composite_layers(self) -> None:
        """Composite all 5 layers into final frame buffer"""
        # Start with background layer
        composited = self.layers[RenderLayer.BACKGROUND].data.copy()
        
        # Composite layers in order (background -> UI)
        layer_order = [
            RenderLayer.SURFACES,
            RenderLayer.FRINGE,
            RenderLayer.ACTORS,
            RenderLayer.UI_TEXT
        ]
        
        for layer_type in layer_order:
            layer = self.layers[layer_type]
            # Simple alpha compositing (non-transparent pixels overwrite)
            mask = np.any(layer.data != COLOR_PALETTE["darkest"], axis=2)
            composited[mask] = layer.data[mask]
        
        # Convert to PIL Image
        self.frame_buffer = Image.fromarray(composited, 'RGB')
    
    async def _update_display(self) -> None:
        """Update Tkinter display with composited frame"""
        if self.frame_buffer and self.photo_image:
            # Update PhotoImage
            self.photo_image.paste(self.frame_buffer)
            
            # Update canvas
            if self.canvas:
                self.canvas.itemconfig(1, image=self.photo_image)  # Update the image item
    
    def _world_to_screen(self, world_pos: Tuple[int, int]) -> Tuple[int, int]:
        """Convert world coordinates to screen coordinates"""
        screen_x = (world_pos[0] - self.camera_x) * self.tile_size + (self.viewport_width // 2)
        screen_y = (world_pos[1] - self.camera_y) * self.tile_size + (self.viewport_height // 2)
        return screen_x, screen_y
    
    def _get_tile_type_at_position(self, x: int, y: int, game_state: GameState) -> TileType:
        """Get tile type at world position"""
        # This would normally query the World Engine
        # For now, return a simple pattern based on position
        if (x + y) % 7 == 0:
            return TileType.STONE
        elif (x + y) % 5 == 0:
            return TileType.FOREST
        else:
            return TileType.GRASS
    
    def _draw_sprite_to_layer(self, layer: LayerBuffer, x: int, y: int, sprite: Image.Image) -> None:
        """Draw sprite to layer buffer"""
        if sprite.size != (self.tile_size, self.tile_size):
            sprite = sprite.resize((self.tile_size, self.tile_size), Image.Resampling.NEAREST)
        
        sprite_array = np.array(sprite)
        
        # Draw sprite if within bounds
        if (0 <= x < self.viewport_width - self.tile_size and 
            0 <= y < self.viewport_height - self.tile_size):
            layer.data[y:y+self.tile_size, x:x+self.tile_size] = sprite_array
    
    def get_performance_stats(self) -> Dict[str, float]:
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


class TkinterGameWindow:
    """Main Tkinter game window with PPU integration"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("DGT Autonomous Movie System - Forest Gate")
        self.root.configure(bg="black")
        self.root.resizable(False, False)
        
        # Initialize asset loader
        self.asset_loader = AssetLoader()
        
        # Initialize PPU
        self.ppu = TkinterPPU(self.root, self.asset_loader)
        
        # Setup UI
        self.ppu.setup_ui()
        
        # Game state
        self.game_state: Optional[GameState] = None
        self.running = False
        
        logger.info("🎮 Tkinter Game Window initialized")
    
    def set_game_state(self, game_state: GameState) -> None:
        """Set current game state"""
        self.game_state = game_state
    
    async def start_render_loop(self) -> None:
        """Start the rendering loop"""
        self.running = True
        
        while self.running:
            if self.game_state:
                await self.ppu.render_frame(self.game_state)
            
            # Maintain target FPS
            await asyncio.sleep(1.0 / TARGET_FPS)
    
    def stop(self) -> None:
        """Stop the rendering loop"""
        self.running = False
        if self.root:
            self.root.quit()
    
    def run(self) -> None:
        """Run the Tkinter main loop"""
        try:
            # Start render loop in background
            asyncio.create_task(self.start_render_loop())
            
            # Run Tkinter main loop
            self.root.mainloop()
            
        except KeyboardInterrupt:
            logger.info("🛑 Tkinter window interrupted")
        finally:
            self.stop()
