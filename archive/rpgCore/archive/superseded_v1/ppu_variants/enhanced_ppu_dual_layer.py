"""
Enhanced PPU with Dual-Layer Rendering - ADR 106: Visual-Mechanical Convergence
Game world layer + Narrative HUD layer for complete game slice experience
"""

import tkinter as tk
import math
import time
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
from loguru import logger

from .ppu_tk_native_enhanced import EnhancedTkinterPPU, RenderEntity, RenderLayer, DitherPresets
from .character_sprites import CharacterSprite, AnimationState
from ..mechanics.d20_system import D20System, D20VisualFeedback, D20Roll


class HUDLayer(Enum):
    """HUD rendering layers"""
    BACKGROUND = 0
    TEXT = 1
    EFFECTS = 2
    OVERLAY = 3


@dataclass
class NarrativeMessage:
    """Individual narrative message for the scroll"""
    text: str
    timestamp: float
    priority: int = 1  # 1=normal, 2=important, 3=critical
    color: str = "#ffffff"
    fade_duration: float = 5.0  # seconds


class DualLayerPPU:
    """
    Enhanced PPU with dual-layer rendering:
    - Game Layer: Traditional game world rendering
    - HUD Layer: Narrative scroll, D20 feedback, UI elements
    """
    
    def __init__(self, game_canvas: tk.Canvas, hud_canvas: tk.Canvas, asset_loader):
        self.game_canvas = game_canvas
        self.hud_canvas = hud_canvas
        self.asset_loader = asset_loader
        
        # Game layer (existing enhanced PPU)
        self.game_ppu = EnhancedTkinterPPU(game_canvas, asset_loader)
        
        # HUD layer components
        self.narrative_scroll: List[NarrativeMessage] = []
        self.max_narrative_lines = 8
        self.narrative_y_start = 20
        
        # D20 system integration
        self.d20_system = D20System()
        self.d20_feedback = D20VisualFeedback(hud_canvas, (400, 150))
        
        # Character sprite system
        self.character_sprites: Dict[str, CharacterSprite] = {}
        self._initialize_character_sprites()
        
        # HUD visual configuration
        self.hud_bg_color = "#1a1a1a"
        self.hud_border_color = "#00ff00"
        self.text_color = "#ffffff"
        self.narrative_color = "#00ff00"
        
        # Animation state
        self.last_update_time = time.time()
        self.frame_count = 0
        
        # Initialize HUD
        self._setup_hud_layout()
        
        logger.info("🎨 Dual-Layer PPU initialized with game + HUD rendering")
    
    def _initialize_character_sprites(self) -> None:
        """Initialize character sprite registry"""
        from .character_sprites import create_character_sprite
        
        # Create player character sprite
        self.character_sprites["voyager"] = create_character_sprite("voyager", "mystic")
        
        logger.debug("👤 Character sprites initialized")
    
    def _setup_hud_layout(self) -> None:
        """Setup HUD layout and background"""
        # Clear HUD canvas
        self.hud_canvas.delete("all")
        
        # HUD dimensions
        hud_width = 800
        hud_height = 120
        
        # Create HUD background
        self.hud_canvas.create_rectangle(
            0, 0, hud_width, hud_height,
            fill=self.hud_bg_color,
            outline=self.hud_border_color,
            width=2,
            tags="hud_background"
        )
        
        # Create narrative scroll area
        scroll_x = 10
        scroll_y = 10
        scroll_width = 780
        scroll_height = 100
        
        self.hud_canvas.create_rectangle(
            scroll_x, scroll_y, scroll_x + scroll_width, scroll_y + scroll_height,
            fill="#0a0a0a",
            outline="#444444",
            width=1,
            tags="narrative_background"
        )
        
        # Add title
        self.hud_canvas.create_text(
            hud_width // 2, 5,
            text="📜 The Voyager's Chronicle",
            font=("Arial", 10, "bold"),
            fill=self.hud_border_color,
            tags="hud_title"
        )
        
        logger.debug("🖼️ HUD layout initialized")
    
    def add_narrative_message(self, text: str, priority: int = 1, color: str = None) -> None:
        """Add message to narrative scroll"""
        if color is None:
            color = self.narrative_color if priority <= 2 else "#ffd700"
        
        message = NarrativeMessage(
            text=text,
            timestamp=time.time(),
            priority=priority,
            color=color
        )
        
        self.narrative_scroll.append(message)
        
        # Limit scroll length
        if len(self.narrative_scroll) > self.max_narrative_lines:
            self.narrative_scroll.pop(0)
        
        # Update display
        self._update_narrative_display()
        
        logger.debug(f"📜 Added narrative message: {text}")
    
    def _update_narrative_display(self) -> None:
        """Update narrative scroll display"""
        # Clear previous text
        self.hud_canvas.delete("narrative_text")
        
        # Display messages
        y_offset = self.narrative_y_start
        current_time = time.time()
        
        for message in self.narrative_scroll:
            # Calculate fade
            age = current_time - message.timestamp
            if age > message.fade_duration:
                continue  # Skip expired messages
            
            # Calculate alpha (simplified - just remove old messages)
            alpha = 1.0
            if age > message.fade_duration * 0.8:
                alpha = (message.fade_duration - age) / (message.fade_duration * 0.2)
            
            # Display message
            self.hud_canvas.create_text(
                15, y_offset,
                text=message.text,
                font=("Courier", 9),
                fill=message.color,
                anchor="w",
                tags="narrative_text"
            )
            
            y_offset += 12
    
    def render_game_layer(self, entities: List[RenderEntity]) -> None:
        """Render the game world layer"""
        # Update character sprites in entities
        entities = self._update_character_entities(entities)
        
        # Render with enhanced PPU
        self.game_ppu.render_enhanced_scene(entities)
        
        logger.debug(f"🎮 Rendered game layer with {len(entities)} entities")
    
    def _update_character_entities(self, entities: List[RenderEntity]) -> List[RenderEntity]:
        """Update entities with animated character sprites"""
        updated_entities = []
        
        for entity in entities:
            if entity.sprite_id in self.character_sprites:
                # Update character sprite animation
                character = self.character_sprites[entity.sprite_id]
                
                # Set animation state based on entity properties
                if entity.tags and "moving" in entity.tags:
                    character.set_state(AnimationState.WALKING)
                elif entity.tags and "interacting" in entity.tags:
                    character.set_state(AnimationState.INTERACTING)
                else:
                    character.set_state(AnimationState.IDLE)
                
                # Get current frame
                current_frame = character.get_current_frame()
                if current_frame:
                    # Store the frame reference for rendering
                    entity._sprite_frame = current_frame
            
            updated_entities.append(entity)
        
        return updated_entities
    
    def perform_d20_check(self, check_id: str) -> D20Roll:
        """Perform D20 check with visual feedback"""
        # Perform the check
        roll = self.d20_system.perform_check(check_id)
        
        # Show visual feedback
        self.d20_feedback.show_roll_result(roll)
        
        # Add to narrative
        self.add_narrative_message(roll.message, roll.result.value)
        
        return roll
    
    def update_animations(self) -> None:
        """Update all animations (game + HUD)"""
        current_time = time.time()
        
        # Update game layer animations
        self.game_ppu.update_frame()
        
        # Update narrative scroll
        self._update_narrative_display()
        
        # Update character sprites
        for character in self.character_sprites.values():
            character.get_current_frame()  # This updates the animation frame
        
        self.frame_count += 1
        self.last_update_time = current_time
    
    def clear_all(self) -> None:
        """Clear both game and HUD layers"""
        # Clear game layer
        self.game_ppu.clear_enhanced()
        
        # Clear HUD layer (except background)
        self.hud_canvas.delete("narrative_text")
        self.hud_canvas.delete("d20_feedback")
        
        # Reset narrative
        self.narrative_scroll.clear()
        
        logger.debug("🧹 Cleared all rendering layers")
    
    def get_render_stats(self) -> Dict[str, Any]:
        """Get comprehensive rendering statistics"""
        game_stats = self.game_ppu.get_enhanced_stats()
        
        return {
            'game_layer': game_stats,
            'hud_layer': {
                'narrative_messages': len(self.narrative_scroll),
                'character_sprites': len(self.character_sprites),
                'd20_history': len(self.d20_system.roll_history),
                'frame_count': self.frame_count
            },
            'total_entities': game_stats['entities'],
            'animated_entities': game_stats['kinetic_entities']
        }


class EnhancedAssetLoader:
    """Enhanced asset loader that integrates character sprites"""
    
    def __init__(self):
        self.sprites: Dict[str, Any] = {}
        self.character_sprites: Dict[str, CharacterSprite] = {}
        self._create_enhanced_sprites()
    
    def _create_enhanced_sprites(self) -> None:
        """Create enhanced sprite collection"""
        from .character_sprites import create_character_sprite
        
        # Create character sprites
        voyager_sprite = create_character_sprite("voyager", "mystic")
        self.character_sprites["voyager"] = voyager_sprite
        
        # Create environment sprites (enhanced versions)
        self._create_environment_sprites()
    
    def _create_environment_sprites(self) -> None:
        """Create enhanced environment sprites"""
        # Create enhanced versions of existing sprites
        sprite_configs = {
            "tree": {"color": "#2d5a27", "material": "organic"},
            "rock": {"color": "#757575", "material": "stone"},
            "bush": {"color": "#4b7845", "material": "organic"},
            "flower": {"color": "#ff69b4", "material": "organic"},
            "mushroom": {"color": "#8b4513", "material": "organic"},
            "iron_lockbox": {"color": "#9e9e9e", "material": "metal"},
            "ancient_stone": {"color": "#8b7355", "material": "stone"},
            "void_patch": {"color": "#1a0033", "material": "void"},
            "grass_tuft": {"color": "#3a6b35", "material": "organic"},
            # Add missing sprites from Glade of Trials
            "swaying_oak": {"color": "#2d5a27", "material": "organic"},
            "rock_formation": {"color": "#757575", "material": "stone"},
            "bush_cluster": {"color": "#4b7845", "material": "organic"},
            "mystic_flower": {"color": "#ff69b4", "material": "organic"},
            "grass": {"color": "#3a6b35", "material": "organic"},
            "dirt_path": {"color": "#8b7355", "material": "stone"},
            "stone_ground": {"color": "#959595", "material": "stone"}
        }
        
        for sprite_id, config in sprite_configs.items():
            self.sprites[sprite_id] = self._create_enhanced_sprite(
                config["color"], config["material"]
            )
    
    def _create_enhanced_sprite(self, base_color: str, material: str) -> tk.PhotoImage:
        """Create enhanced sprite with dithering"""
        sprite = tk.PhotoImage(width=16, height=16)
        
        # Apply dithering pattern based on material
        if material == "organic":
            pattern = DitherPresets.get_lush_green()
        elif material == "stone":
            pattern = DitherPresets.get_stone_gray()
        elif material == "metal":
            pattern = DitherPresets.get_metal_silver()
        else:
            pattern = DitherPresets.get_wood_brown()
        
        # Create dithered sprite
        for y in range(16):
            for x in range(16):
                dither_color = pattern.get_color_for_position(x, y)
                sprite.put(dither_color, (x, y))
        
        return sprite.zoom(4, 4)
    
    def get_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get sprite by ID"""
        # Check character sprites first
        if sprite_id in self.character_sprites:
            character = self.character_sprites[sprite_id]
            return character.get_current_frame()
        
        # Check regular sprites
        return self.sprites.get(sprite_id)
    
    def get_character_sprite(self, sprite_id: str) -> Optional[CharacterSprite]:
        """Get character sprite by ID"""
        return self.character_sprites.get(sprite_id)


# Factory function
def create_dual_layer_ppu(game_canvas: tk.Canvas, hud_canvas: tk.Canvas, asset_loader) -> DualLayerPPU:
    """Create dual-layer PPU system"""
    return DualLayerPPU(game_canvas, hud_canvas, asset_loader)


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test dual-layer PPU
    root = tk.Tk()
    root.title("Dual-Layer PPU Test")
    root.geometry("800x600")
    root.configure(bg='#1a1a1a')
    
    # Game canvas
    game_canvas = tk.Canvas(root, width=800, height=480, bg='#0a0a0a')
    game_canvas.pack(pady=(20, 5))
    
    # HUD canvas
    hud_canvas = tk.Canvas(root, width=800, height=120, bg='#1a1a1a')
    hud_canvas.pack(pady=(5, 20))
    
    # Create enhanced asset loader
    asset_loader = EnhancedAssetLoader()
    
    # Create dual-layer PPU
    ppu = create_dual_layer_ppu(game_canvas, hud_canvas, asset_loader)
    
    # Add initial narrative messages
    ppu.add_narrative_message("🌟 Welcome to the Glade of Trials!", 3, "#ffd700")
    ppu.add_narrative_message("📍 Use WASD to move, E to interact", 2)
    ppu.add_narrative_message("🎲 Find and examine the ancient stone...", 1)
    
    # Test controls
    control_frame = tk.Frame(root, bg='#1a1a1a')
    control_frame.pack()
    
    def test_d20():
        roll = ppu.perform_d20_check("ancient_stone")
        print(f"D20 Test: {roll.message}")
    
    def test_narrative():
        ppu.add_narrative_message(f"🎯 Test message #{time.time()}", 1)
    
    def test_animation():
        # Create test entities
        from .ppu_tk_native_enhanced import RenderEntity, RenderLayer
        
        entities = [
            RenderEntity((5, 5), 'voyager', RenderLayer.ACTORS, tags=["player", "animated"]),
            RenderEntity((8, 8), 'tree', RenderLayer.FRINGE, material_id="organic", collision=True),
            RenderEntity((12, 10), 'ancient_stone', RenderLayer.ACTORS, material_id="stone")
        ]
        
        ppu.render_game_layer(entities)
    
    tk.Button(control_frame, text="Test D20 Roll", command=test_d20).pack(side=tk.LEFT, padx=5)
    tk.Button(control_frame, text="Add Narrative", command=test_narrative).pack(side=tk.LEFT, padx=5)
    tk.Button(control_frame, text="Render Scene", command=test_animation).pack(side=tk.LEFT, padx=5)
    
    # Animation loop
    def update_loop():
        ppu.update_animations()
        root.after(50, update_loop)  # 20 FPS
    
    update_loop()
    
    print("🎨 Dual-Layer PPU Test running - Close window to exit")
    root.mainloop()
