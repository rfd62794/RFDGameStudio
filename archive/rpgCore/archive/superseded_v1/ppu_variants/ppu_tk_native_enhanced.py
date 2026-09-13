"""
Enhanced Tkinter PPU - ADR 093: The "Sonic Aesthetic" Restoration
Procedural Juice Layer for premium retro gaming experience
"""

import tkinter as tk
import math
import time
from typing import List, Tuple, Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass
from loguru import logger

from core.constants import TARGET_FPS
from utils.asset_loader import AssetLoader
from .ppu_modes import PPUMode, PPULayouts, CombatPositions, AnimationFrames, PPUTransitionEffects

# Viewport Constants (Game Boy Parity)
TILE_SIZE_PIXELS = 8
VIEWPORT_WIDTH_PIXELS = 160
VIEWPORT_HEIGHT_PIXELS = 144
VIEWPORT_TILES_X = 20
VIEWPORT_TILES_Y = 18

# Display Scaling (4x for better visibility)
DISPLAY_SCALE = 4
DISPLAY_WIDTH_PIXELS = VIEWPORT_WIDTH_PIXELS * DISPLAY_SCALE
DISPLAY_HEIGHT_PIXELS = VIEWPORT_HEIGHT_PIXELS * DISPLAY_SCALE

class RenderLayer(Enum):
    """Canvas Z-index layers for proper compositing"""
    BACKGROUND = 0
    SURFACES = 1
    SHADOWS = 2  # New shadow layer
    FRINGE = 3  # Objects
    ACTORS = 4
    EFFECTS = 5  # New effects layer
    UI = 6

@dataclass
class DitherPattern:
    """Bayer dithering pattern for retro aesthetic"""
    name: str
    pattern: List[List[int]]
    dark_color: str
    light_color: str
    
    def get_color_for_position(self, x: int, y: int) -> str:
        """Get dithered color for specific position"""
        pattern_x = x % len(self.pattern[0])
        pattern_y = y % len(self.pattern)
        
        if self.pattern[pattern_y][pattern_x] == 1:
            return self.light_color
        else:
            return self.dark_color

class DitherPresets:
    """Predefined dithering patterns for materials"""
    
    @staticmethod
    def get_lush_green() -> DitherPattern:
        """Lush green dither for organic materials"""
        return DitherPattern(
            name="lush_green",
            pattern=[
                [0, 1, 0, 1],
                [1, 0, 1, 0],
                [0, 1, 0, 1],
                [1, 0, 1, 0]
            ],
            dark_color="#2d5a27",
            light_color="#3a6b35"
        )
    
    @staticmethod
    def get_wood_brown() -> DitherPattern:
        """Wood brown dither for wooden materials"""
        return DitherPattern(
            name="wood_brown",
            pattern=[
                [1, 0, 0, 1],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [1, 0, 0, 1]
            ],
            dark_color="#5d4037",
            light_color="#6b5447"
        )
    
    @staticmethod
    def get_stone_gray() -> DitherPattern:
        """Stone gray dither for stone materials"""
        return DitherPattern(
            name="stone_gray",
            pattern=[
                [0, 0, 1, 1],
                [0, 1, 1, 0],
                [1, 1, 0, 0],
                [1, 0, 0, 1]
            ],
            dark_color="#757575",
            light_color="#858585"
        )
    
    @staticmethod
    def get_metal_silver() -> DitherPattern:
        """Metal silver dither for metal materials"""
        return DitherPattern(
            name="metal_silver",
            pattern=[
                [1, 1, 0, 0],
                [1, 0, 0, 1],
                [0, 0, 1, 1],
                [0, 1, 1, 0]
            ],
            dark_color="#9e9e9e",
            light_color="#aeaeae"
        )

@dataclass
class CanvasEntity:
    """Enhanced entity with aesthetic properties"""
    canvas_id: int
    layer: RenderLayer
    world_pos: Tuple[int, int]
    sprite_id: str
    material_id: Optional[str] = None
    has_shadow: bool = False
    is_animated: bool = False
    dither_pattern: Optional[DitherPattern] = None
    last_update: float = 0.0
    animation_offset: float = 0.0

@dataclass
class RenderEntity:
    """Entity data for rendering with aesthetic properties"""
    world_pos: Tuple[int, int]
    sprite_id: str
    layer: RenderLayer
    visible: bool = True
    material_id: Optional[str] = None
    collision: bool = False
    tags: List[str] = None
    metadata: Dict[str, Any] = None

class EnhancedTkinterPPU:
    """
    Enhanced Tkinter PPU with Sonic/Game Boy aesthetic polish
    
    Features:
    - Bayer dithering for textured surfaces
    - Procedural drop shadows for grounding
    - Kinetic sway animation for organic materials
    - Palette limitation for retro authenticity
    """
    
    def __init__(self, canvas: tk.Canvas, asset_loader: AssetLoader):
        self.canvas = canvas
        self.asset_loader = asset_loader
        
        # Multi-mode support
        self.current_mode = PPUMode.OVERWORLD
        self.layout = PPULayouts.get_layout(PPUMode.OVERWORLD)
        
        # Enhanced rendering properties
        self.dither_presets = {
            'organic': DitherPresets.get_lush_green(),
            'wood': DitherPresets.get_wood_brown(),
            'stone': DitherPresets.get_stone_gray(),
            'metal': DitherPresets.get_metal_silver()
        }
        
        # Animation state
        self.animation_frame = 0
        self.animation_time = 0.0
        self.kinetic_entities: Dict[int, CanvasEntity] = {}
        
        # Shadow rendering
        self.shadow_color = "#000000"
        self.shadow_opacity = 0.5
        
        # Sprite references to prevent garbage collection
        self._sprite_refs = []
        
        # Canvas entity registry
        self.canvas_entities: Dict[Tuple[int, int], CanvasEntity] = {}
        
        # Performance tracking
        self.frame_count = 0
        self.render_times = []
        
        logger.info("🎨 Enhanced Tkinter PPU initialized with Sonic aesthetic polish")
    
    def _apply_dither_pattern(self, base_color: str, material_id: str, x: int, y: int, width: int, height: int) -> None:
        """Apply dithering pattern to create textured surface"""
        if material_id not in self.dither_presets:
            return
        
        pattern = self.dither_presets[material_id]
        
        # Create dithered rectangle pattern
        cell_size = 2  # 2x2 dither cells
        
        for dy in range(0, height, cell_size):
            for dx in range(0, width, cell_size):
                # Get dither color for this position
                dither_color = pattern.get_color_for_position(x + dx, y + dy)
                
                # Draw dither cell
                self.canvas.create_rectangle(
                    x + dx, y + dy,
                    x + dx + cell_size, y + dy + cell_size,
                    fill=dither_color,
                    outline="",
                    tags="dither"
                )
    
    def _draw_shadow(self, x: int, y: int, width: int, height: int) -> int:
        """Draw drop shadow to ground the object"""
        # Shadow offset and sizing
        shadow_offset_y = height // 4
        shadow_width = width
        shadow_height = height // 3
        
        # Create shadow as ellipse
        shadow_id = self.canvas.create_oval(
            x - shadow_width // 4,
            y + shadow_offset_y,
            x + shadow_width + shadow_width // 4,
            y + shadow_offset_y + shadow_height,
            fill=self.shadow_color,
            outline="",
            stipple="gray50",  # 50% transparency
            tags="shadow"
        )
        
        return shadow_id
    
    def _apply_kinetic_sway(self, entity: CanvasEntity, current_time: float) -> Tuple[int, int]:
        """Apply kinetic sway animation to animated objects"""
        if not entity.is_animated:
            return entity.world_pos
        
        # Calculate sway offset using sine wave
        sway_amplitude = 2  # pixels
        sway_frequency = 2.0  # Hz
        
        time_offset = current_time - entity.last_update
        sway_offset = sway_amplitude * math.sin(2 * math.pi * sway_frequency * time_offset)
        
        # Apply sway to x position
        base_x, base_y = entity.world_pos
        swayed_x = int(base_x + sway_offset)
        
        return (swayed_x, base_y)
    
    def _get_material_dither(self, material_id: str) -> Optional[DitherPattern]:
        """Get dither pattern for material"""
        return self.dither_presets.get(material_id)
    
    def _create_enhanced_sprite(self, entity: RenderEntity) -> Optional[tk.PhotoImage]:
        """Create enhanced sprite with dithering and effects"""
        try:
            # Get base sprite from asset loader
            base_sprite = self.asset_loader.get_sprite(entity.sprite_id)
            if not base_sprite:
                return None
            
            # Apply material-based enhancements
            if entity.material_id and entity.material_id in self.dither_presets:
                # Create dithered version
                dither_pattern = self.dither_presets[entity.material_id]
                
                # For now, return base sprite (dithering applied during rendering)
                return base_sprite
            
            return base_sprite
            
        except Exception as e:
            logger.error(f"⚠️ Enhanced sprite creation error: {e}")
            return None
    
    def add_entity(self, entity: RenderEntity) -> int:
        """Add enhanced entity with aesthetic polish"""
        # Determine if entity should have effects
        has_shadow = entity.collision  # Shadow for collision objects
        is_animated = entity.tags and "animated" in entity.tags
        dither_pattern = self._get_material_dither(entity.material_id) if entity.material_id else None
        
        # Get enhanced sprite
        sprite = self._create_enhanced_sprite(entity)
        if not sprite:
            logger.warning(f"Enhanced sprite {entity.sprite_id} not found")
            return -1
        
        # Calculate canvas position
        canvas_x, canvas_y = self._world_to_canvas_coords(entity.world_pos)
        
        # Draw shadow first (behind object)
        shadow_id = None
        if has_shadow:
            shadow_id = self._draw_shadow(canvas_x, canvas_y, 
                                       TILE_SIZE_PIXELS * DISPLAY_SCALE, 
                                       TILE_SIZE_PIXELS * DISPLAY_SCALE)
        
        # Apply dithering to background
        if entity.layer == RenderLayer.BACKGROUND and dither_pattern:
            self._apply_dither_pattern(
                dither_pattern.dark_color, entity.material_id,
                canvas_x, canvas_y,
                TILE_SIZE_PIXELS * DISPLAY_SCALE,
                TILE_SIZE_PIXELS * DISPLAY_SCALE
            )
        
        # Create main sprite
        canvas_id = self.canvas.create_image(
            canvas_x,
            canvas_y,
            image=sprite,
            anchor='nw',
            tags=(entity.layer.name.lower(), "enhanced")
        )
        
        # Create enhanced canvas entity
        canvas_entity = CanvasEntity(
            canvas_id=canvas_id,
            layer=entity.layer,
            world_pos=entity.world_pos,
            sprite_id=entity.sprite_id,
            material_id=entity.material_id,
            has_shadow=has_shadow,
            is_animated=is_animated,
            dither_pattern=dither_pattern,
            last_update=time.time()
        )
        
        # Register kinetic entities for animation
        if is_animated:
            self.kinetic_entities[canvas_id] = canvas_entity
        
        # Keep sprite reference
        self._sprite_refs.append(sprite)
        
        # Register entity
        self.canvas_entities[entity.world_pos] = canvas_entity
        
        logger.debug(f"🎨 Added enhanced entity: {entity.sprite_id} (shadow: {has_shadow}, animated: {is_animated})")
        
        return canvas_id
    
    def _world_to_canvas_coords(self, world_pos: Tuple[int, int]) -> Tuple[int, int]:
        """Convert world coordinates to canvas pixel coordinates"""
        world_x, world_y = world_pos
        
        # Calculate position relative to viewport
        rel_x = world_x - self.viewport_world_pos[0] if hasattr(self, 'viewport_world_pos') else world_x
        rel_y = world_y - self.viewport_world_pos[1] if hasattr(self, 'viewport_world_pos') else world_y
        
        # Convert to pixels and scale for display
        canvas_x = rel_x * TILE_SIZE_PIXELS * DISPLAY_SCALE
        canvas_y = rel_y * TILE_SIZE_PIXELS * DISPLAY_SCALE
        
        return canvas_x, canvas_y
    
    def update_kinetic_animations(self) -> None:
        """Update all kinetic animations (sway, breathing, etc.)"""
        current_time = time.time()
        
        for canvas_id, entity in self.kinetic_entities.items():
            # Calculate new position with sway
            swayed_pos = self._apply_kinetic_sway(entity, current_time)
            canvas_x, canvas_y = self._world_to_canvas_coords(swayed_pos)
            
            # Update entity position
            self.canvas.coords(canvas_id, canvas_x, canvas_y)
            
            # Update shadow position if exists
            if entity.has_shadow:
                shadow_items = self.canvas.find_withtag("shadow")
                if shadow_items:
                    # Update shadow to follow entity
                    shadow_offset_y = (TILE_SIZE_PIXELS * DISPLAY_SCALE) // 4
                    self.canvas.coords(
                        shadow_items[0],
                        canvas_x - (TILE_SIZE_PIXELS * DISPLAY_SCALE) // 4,
                        canvas_y + shadow_offset_y,
                        canvas_x + (TILE_SIZE_PIXELS * DISPLAY_SCALE) + (TILE_SIZE_PIXELS * DISPLAY_SCALE) // 4,
                        canvas_y + shadow_offset_y + (TILE_SIZE_PIXELS * DISPLAY_SCALE) // 3
                    )
    
    def render_enhanced_scene(self, entities: List[RenderEntity]) -> None:
        """Render scene with full aesthetic polish"""
        # Clear previous enhanced entities
        self.canvas.delete("enhanced")
        self.canvas.delete("dither")
        self.canvas.delete("shadow")
        
        # Clear registries
        self.canvas_entities.clear()
        self.kinetic_entities.clear()
        
        # Sort entities by layer for proper rendering order
        entities.sort(key=lambda e: e.layer.value)
        
        # Render entities with enhancements
        for entity in entities:
            if entity.visible:
                self.add_entity(entity)
        
        # Start kinetic animations
        if self.kinetic_entities:
            logger.info(f"🌸 Started kinetic animations for {len(self.kinetic_entities)} entities")
    
    def update_frame(self) -> None:
        """Update frame for animations and effects"""
        self.animation_frame += 1
        self.animation_time = time.time()
        
        # Update kinetic animations
        self.update_kinetic_animations()
        
        # Update dither patterns (frame interleaving for wind shimmer)
        if self.animation_frame % 2 == 0:
            self._update_dither_shimmer()
    
    def _update_dither_shimmer(self) -> None:
        """Update dither patterns to simulate wind shimmer on organic materials"""
        # This would cycle through different dither patterns
        # For now, we'll just update the animation time
        pass
    
    def set_viewport(self, world_pos: Tuple[int, int]) -> None:
        """Set viewport position and update all entities"""
        self.viewport_world_pos = world_pos
        
        # Update all entity positions relative to new viewport
        for world_pos, canvas_entity in list(self.canvas_entities.items()):
            canvas_x, canvas_y = self._world_to_canvas_coords(world_pos)
            self.canvas.coords(canvas_entity.canvas_id, canvas_x, canvas_y)
    
    def clear_enhanced(self) -> None:
        """Clear all enhanced entities"""
        self.canvas.delete("enhanced")
        self.canvas.delete("dither")
        self.canvas.delete("shadow")
        self.canvas_entities.clear()
        self.kinetic_entities.clear()
    
    def get_enhanced_stats(self) -> Dict[str, Any]:
        """Get enhanced rendering statistics"""
        return {
            'entities': len(self.canvas_entities),
            'kinetic_entities': len(self.kinetic_entities),
            'dither_patterns': len(self.dither_presets),
            'frame': self.animation_frame,
            'animation_time': self.animation_time
        }

# Factory function for easy integration
def create_enhanced_ppu(canvas: tk.Canvas, asset_loader: AssetLoader) -> EnhancedTkinterPPU:
    """Create enhanced PPU with Sonic aesthetic"""
    return EnhancedTkinterPPU(canvas, asset_loader)

# Test implementation
if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Test enhanced PPU
    root = tk.Tk()
    root.title("Enhanced PPU Test - Sonic Aesthetic")
    
    canvas = tk.Canvas(root, width=DISPLAY_WIDTH_PIXELS, height=DISPLAY_HEIGHT_PIXELS, bg='black')
    canvas.pack()
    
    # Mock asset loader for testing
    class MockAssetLoader:
        def get_sprite(self, sprite_id):
            # Create simple test sprite
            sprite = tk.PhotoImage(width=TILE_SIZE_PIXELS, height=TILE_SIZE_PIXELS)
            for y in range(TILE_SIZE_PIXELS):
                for x in range(TILE_SIZE_PIXELS):
                    sprite.put('#00ff00', (x, y))
            return sprite.zoom(DISPLAY_SCALE, DISPLAY_SCALE)
    
    asset_loader = MockAssetLoader()
    ppu = create_enhanced_ppu(canvas, asset_loader)
    
    # Test entities with different materials
    test_entities = [
        RenderEntity((5, 5), 'grass', RenderLayer.BACKGROUND, material_id='organic', tags=['animated']),
        RenderEntity((7, 7), 'tree', RenderLayer.FRINGE, material_id='wood', collision=True),
        RenderEntity((9, 6), 'boulder', RenderLayer.FRINGE, material_id='stone', collision=True),
        RenderEntity((11, 8), 'chest', RenderLayer.FRINGE, material_id='metal', collision=True),
    ]
    
    # Render enhanced scene
    ppu.render_enhanced_scene(test_entities)
    
    # Animation loop
    def update_loop():
        ppu.update_frame()
        root.after(50, update_loop)  # 20 FPS for visible animation
    
    update_loop()
    
    logger.info("🎨 Enhanced PPU Test running - Close window to exit")
    root.mainloop()
