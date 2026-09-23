"""
PPU Body - Near-Gameboy 60Hz Dithered Rendering
Tkinter + Rust blitter for high-performance retro graphics
"""

import time
import tkinter as tk
from tkinter import ttk
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import sys
from pathlib import Path

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger

try:
    # Import existing PPU components
    from src.engines.mind.dd_engine import NativeTkinterPPU, RenderLayer, CanvasEntity, RenderEntity
    from src.tools.dithering_engine import DitheringEngine, TemplateGenerator
    PPU_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ PPU components not available: {e}")
    # Create fallback RenderLayer enum
    from enum import Enum
    from dataclasses import dataclass
    from typing import Tuple
    
    class RenderLayer(Enum):
        BACKGROUND = 0
        SURFACES = 1
        FRINGE = 2
        ACTORS = 3
        UI = 4
    
    @dataclass
    class CanvasEntity:
        position: Tuple[int, int]
        size: Tuple[int, int]
        color: str = "#00FF00"
    
    @dataclass
    class RenderEntity:
        entity_id: str
        canvas_entity: CanvasEntity
        layer: RenderLayer = RenderLayer.ACTORS
    
    class NativeTkinterPPU:
        def __init__(self):
            pass
    
    class DitheringEngine:
        def __init__(self):
            pass
    
    class TemplateGenerator:
        def __init__(self):
            pass
    
    PPU_AVAILABLE = False

from .dispatcher import DisplayBody, RenderPacket, HUDData

# Game Boy parity constants
TILE_SIZE_PIXELS = 8
VIEWPORT_WIDTH_PIXELS = 160
VIEWPORT_HEIGHT_PIXELS = 144
VIEWPORT_TILES_X = 20
VIEWPORT_TILES_Y = 18

# Display scaling
DISPLAY_SCALE = 4
DISPLAY_WIDTH_PIXELS = VIEWPORT_WIDTH_PIXELS * DISPLAY_SCALE
DISPLAY_HEIGHT_PIXELS = VIEWPORT_HEIGHT_PIXELS * DISPLAY_SCALE

@dataclass
class SpriteConfig:
    """Configuration for PPU sprite"""
    sprite_id: str
    width: int = 16
    height: int = 16
    color: str = "#00FF00"
    dither_pattern: str = "checkerboard"
    layer: RenderLayer = RenderLayer.FRINGE

class PPUBody(DisplayBody):
    """PPU display body with 60Hz dithered Game Boy-style rendering"""
    
    def __init__(self):
        super().__init__("PPU")
        self.root: Optional[tk.Tk] = None
        self.ppu: Optional[NativeTkinterPPU] = None
        self.dither_engine: Optional[DitheringEngine] = None
        self.template_generator: Optional[TemplateGenerator] = None
        
        # Entity registry for packet layers
        self.packet_entities: Dict[str, RenderEntity] = {}
        
        # Performance tracking
        self.target_fps = 60
        self.frame_time = 1.0 / self.target_fps
        self.last_frame_time = 0.0
        
        # HUD overlay
        self.hud_canvas: Optional[tk.Canvas] = None
        self.hud_text_ids: List[int] = []
        
    def _setup(self):
        """Setup PPU rendering system"""
        if not PPU_AVAILABLE:
            logger.error("❌ PPU components not available")
            return False
        
        # Create main window
        self.root = tk.Tk()
        self.root.title("🎮 DGT PPU Display")
        self.root.resizable(False, False)
        
        # Create main frame
        main_frame = ttk.Frame(self.root, padding="5")
        main_frame.pack()
        
        # Create PPU display
        try:
            self.ppu = NativeTkinterPPU(self.root)
        except Exception as e:
            logger.error(f"❌ Failed to create PPU: {e}")
            self.ppu = None
            return False
        
        # Create dithering engine
        self.dither_engine = DitheringEngine()
        self.template_generator = TemplateGenerator(self.dither_engine)
        
        # Create HUD overlay canvas
        self._create_hud_overlay(main_frame)
        
        # Load default sprites
        self._load_default_sprites()
        
        logger.info("🎮 PPU body setup complete")
        return True
    
    def _create_hud_overlay(self, parent: ttk.Frame):
        """Create HUD overlay canvas"""
        self.hud_canvas = tk.Canvas(
            parent,
            width=DISPLAY_WIDTH_PIXELS,
            height=60,
            bg='black',
            highlightthickness=1,
            highlightbackground='green'
        )
        self.hud_canvas.pack(pady=(5, 0))
        
        # Create HUD text lines
        for i in range(4):
            y_pos = 10 + i * 12
            text_id = self.hud_canvas.create_text(
                5, y_pos,
                text="",
                anchor='w',
                fill='#00FF00',
                font=('Courier', 9)
            )
            self.hud_text_ids.append(text_id)
    
    def _load_default_sprites(self):
        """Load default sprites using dithering engine"""
        if not self.dither_engine or not self.ppu:
            return
        
        # Create basic colored sprites with dithering
        default_sprites = {
            'player': SpriteConfig('player', 16, 16, '#00FF00', 'solid'),
            'enemy': SpriteConfig('enemy', 16, 16, '#FF0000', 'checkerboard'),
            'item': SpriteConfig('item', 16, 16, '#FFFF00', 'dots'),
            'wall': SpriteConfig('wall', 16, 16, '#808080', 'metallic'),
            'grass': SpriteConfig('grass', 16, 16, '#228B22', 'organic'),
            'water': SpriteConfig('water', 16, 16, '#0064C8', 'noise'),
        }
        
        for sprite_name, config in default_sprites.items():
            self._create_dithered_sprite(config)
    
    def _create_dithered_sprite(self, config: SpriteConfig):
        """Create a dithered sprite"""
        if not self.dither_engine or not self.ppu:
            return
        
        # Generate dithered pattern
        pattern_grid = self.dither_engine.apply_dither(
            config.color, 
            config.dither_pattern, 
            0.3
        )
        
        # Convert to PhotoImage (simplified - in real implementation would use proper sprite loading)
        try:
            # Create a simple colored rectangle as placeholder
            sprite_image = tk.PhotoImage(
                width=config.width * DISPLAY_SCALE,
                height=config.height * DISPLAY_SCALE
            )
            
            # Fill with base color (simplified)
            for x in range(config.width * DISPLAY_SCALE):
                for y in range(config.height * DISPLAY_SCALE):
                    # Use dither pattern to determine color variation
                    pattern_x = (x // DISPLAY_SCALE) % 8
                    pattern_y = (y // DISPLAY_SCALE) % 8
                    
                    if pattern_y < len(pattern_grid) and pattern_x < len(pattern_grid[pattern_y]):
                        color = pattern_grid[pattern_y][pattern_x]
                    else:
                        color = config.color
                    
                    sprite_image.put(color, (x, y))
            
            # Store sprite
            self.ppu.sprites[config.sprite_id] = sprite_image
            self.ppu._sprite_refs.append(sprite_image)  # Prevent garbage collection
            
            logger.debug(f"🎨 Created sprite: {config.sprite_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to create sprite {config.sprite_id}: {e}")
    
    def _render_packet(self, packet: RenderPacket):
        """Render packet to PPU display"""
        if not self.ppu or not self.root:
            return
        
        # Rate limiting for 60Hz
        current_time = time.time()
        if current_time - self.last_frame_time < self.frame_time:
            return
        self.last_frame_time = current_time
        
        # Clear previous packet entities
        self._clear_packet_entities()
        
        # Process layers
        for layer in packet.layers:
            self._render_layer(layer)
        
        # Update HUD
        self._update_hud(packet.hud)
        
        # Update display
        if self.ppu.canvas:
            self.ppu.canvas.update()
    
    def _render_layer(self, layer):
        """Render a single layer"""
        if layer.type == "baked":
            # Render background/static element
            self._render_baked_layer(layer)
        elif layer.type == "dynamic":
            # Render dynamic entity
            self._render_dynamic_layer(layer)
        elif layer.type == "effect":
            # Render effect
            self._render_effect_layer(layer)
    
    def _render_baked_layer(self, layer):
        """Render baked/static layer"""
        # Create static entity at position
        if layer.x is not None and layer.y is not None:
            entity = RenderEntity(
                world_pos=(layer.x, layer.y),
                sprite_id=layer.id,
                layer=RenderLayer.BACKGROUND
            )
            
            canvas_id = self.ppu.add_entity(entity)
            self.packet_entities[layer.id] = entity
    
    def _render_dynamic_layer(self, layer):
        """Render dynamic layer"""
        # Create dynamic entity
        if layer.x is not None and layer.y is not None:
            entity = RenderEntity(
                world_pos=(layer.x, layer.y),
                sprite_id=layer.id,
                layer=RenderLayer.FRINGE
            )
            
            canvas_id = self.ppu.add_entity(entity)
            self.packet_entities[layer.id] = entity
            
            # Apply effect if specified
            if layer.effect:
                self._apply_effect(entity, layer.effect)
    
    def _render_effect_layer(self, layer):
        """Render effect layer"""
        # Handle special effects
        if layer.effect == "sway":
            self._apply_sway_effect(layer)
        elif layer.effect == "pulse":
            self._apply_pulse_effect(layer)
        elif layer.effect == "flicker":
            self._apply_flicker_effect(layer)
    
    def _apply_effect(self, entity: RenderEntity, effect: str):
        """Apply effect to entity"""
        # This would modify the entity's appearance
        # For now, just log the effect
        logger.debug(f"✨ Applying {effect} effect to {entity.sprite_id}")
    
    def _apply_sway_effect(self, layer):
        """Apply organic sway effect"""
        # Create swaying animation for grass/trees
        sway_offset = int(time.time() * 2) % 3 - 1  # -1, 0, or 1
        
        if layer.x is not None and layer.y is not None:
            entity = RenderEntity(
                world_pos=(layer.x + sway_offset, layer.y),
                sprite_id=layer.id,
                layer=RenderLayer.FRINGE
            )
            
            canvas_id = self.ppu.add_entity(entity)
            self.packet_entities[f"{layer.id}_sway"] = entity
    
    def _apply_pulse_effect(self, layer):
        """Apply pulsing effect"""
        # Create pulsing animation for magical items
        pulse_phase = (time.time() * 3) % (2 * 3.14159)
        pulse_intensity = (pulse_phase + 1) / 2  # 0 to 1
        
        # This would modify the sprite's brightness
        logger.debug(f"💫 Pulse effect for {layer.id}: {pulse_intensity:.2f}")
    
    def _apply_flicker_effect(self, layer):
        """Apply flickering effect"""
        # Create flickering animation for fire/lights
        flicker = (time.time() * 10) % 2 > 1  # Random on/off
        
        if flicker and layer.x is not None and layer.y is not None:
            entity = RenderEntity(
                world_pos=(layer.x, layer.y),
                sprite_id=layer.id,
                layer=RenderLayer.EFFECTS
            )
            
            canvas_id = self.ppu.add_entity(entity)
            self.packet_entities[f"{layer.id}_flicker"] = entity
    
    def _update_hud(self, hud: HUDData):
        """Update HUD overlay"""
        if not self.hud_canvas:
            return
        
        hud_lines = [
            hud.line_1, hud.line_2, hud.line_3, hud.line_4
        ]
        
        for i, line in enumerate(hud_lines):
            if i < len(self.hud_text_ids):
                self.hud_canvas.itemconfig(
                    self.hud_text_ids[i],
                    text=line
                )
    
    def _clear_packet_entities(self):
        """Clear entities from previous packet"""
        # Remove all packet entities from PPU
        for entity in self.packet_entities.values():
            if hasattr(entity, 'world_pos'):
                self.ppu.remove_entity(entity.world_pos)
        
        self.packet_entities.clear()
    
    def add_sprite(self, config: SpriteConfig) -> bool:
        """Add a new sprite to the PPU"""
        try:
            self._create_dithered_sprite(config)
            return True
        except Exception as e:
            logger.error(f"❌ Failed to add sprite {config.sprite_id}: {e}")
            return False
    
    def update_entity_position(self, entity_id: str, new_x: int, new_y: int) -> bool:
        """Update entity position"""
        if entity_id in self.packet_entities:
            old_entity = self.packet_entities[entity_id]
            self.ppu.update_entity_position(old_entity.world_pos, (new_x, new_y))
            old_entity.world_pos = (new_x, new_y)
            return True
        return False
    
    def _cleanup(self):
        """Cleanup PPU resources"""
        if self.ppu:
            # PPU cleanup handled by its own cleanup method
            self.ppu = None
        
        if self.hud_canvas:
            self.hud_canvas.destroy()
            self.hud_canvas = None
        
        if self.root:
            try:
                self.root.quit()
                self.root.destroy()
            except:
                pass
            self.root = None
        
        self.packet_entities.clear()
        self.hud_text_ids.clear()
    
    def run(self):
        """Run the PPU display (blocking)"""
        if self.root and self.is_initialized:
            try:
                self.root.mainloop()
            except KeyboardInterrupt:
                logger.info("🛑 PPU display stopped by user")
    
    def update(self):
        """Non-blocking update"""
        if self.root and self.is_initialized:
            try:
                self.root.update()
            except tk.TclError:
                logger.warning("⚠️ Tkinter update failed, window may be closed")
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get PPU performance statistics"""
        stats = super().get_performance_stats()
        
        if self.ppu:
            ppu_stats = self.ppu.get_performance_stats()
            stats.update(ppu_stats)
        
        stats['target_fps'] = self.target_fps
        stats['actual_fps'] = 1.0 / self.last_render_time if self.last_render_time > 0 else 0
        
        return stats

# Factory function
def create_ppu_body() -> PPUBody:
    """Create and initialize a PPU body"""
    body = PPUBody()
    if not body.initialize():
        logger.error("❌ Failed to create PPU body")
        return None
    return body
