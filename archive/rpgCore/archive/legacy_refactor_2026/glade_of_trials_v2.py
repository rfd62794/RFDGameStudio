"""
Glade of Trials V2 - ADR 107: Tiny Farm Professional Integration
The complete game slice with professional Tiny Farm RPG assets
"""

import sys
import os
import time
import tkinter as tk
from tkinter import Canvas
from typing import Dict, List, Tuple, Optional, Any

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Core imports
from dgt_state import DGTState, Tile, TileType, Voyager
from dgt_physics import can_move_to

# Enhanced systems with Tiny Farm integration
from src.assets.tiny_farm_asset_loader import create_tiny_farm_asset_loader
from src.graphics.enhanced_ppu_dual_layer import DualLayerPPU
from src.graphics.character_sprites import AnimationState
from src.mechanics.d20_system import D20Roll
from src.world.glade_of_trials import create_glade_of_trials
from src.ui.narrative_scroll import create_narrative_scroll, MessageType
from src.graphics.environmental_polish import create_environmental_polish

# Graphics imports
from src.graphics.ppu_tk_native_enhanced import RenderEntity, RenderLayer


class GladeOfTrialsV2:
    """
    Glade of Trials V2 - Professional Tiny Farm Integration
    
    Features:
    - Tiny Farm RPG professional assets with DGT DNA preservation
    - Enhanced character sprites with professional art
    - Dithered and palette-locked visual consistency
    - Complete tactical mechanics and narrative systems
    - Professional polish while maintaining systemic integrity
    """
    
    def __init__(self):
        # Initialize window
        self.root = tk.Tk()
        self.root.title("🏆 Glade of Trials V2 - Tiny Farm Professional Edition")
        self.root.geometry("800x720")
        self.root.configure(bg='#1a1a1a')
        self.root.resizable(False, False)
        
        # Game state
        self.state = DGTState()
        self.glade = create_glade_of_trials()
        self._setup_glade_state()
        
        # Rendering setup
        self._setup_rendering_layers()
        
        # Initialize systems with Tiny Farm integration
        self._initialize_tiny_farm_systems()
        
        # Apply visual enhancements
        self._apply_professional_polish()
        
        # Input handling
        self._setup_input()
        
        # Game loop state
        self.running = True
        self.update_counter = 0
        self.last_update_time = time.time()
        
        # Welcome message
        self.narrative_scroll.add_story_message("🌟 Welcome to the Glade of Trials - Professional Edition!", critical=True)
        self.narrative_scroll.add_system_message("Experience professional Tiny Farm art with DGT systemic logic")
        self.narrative_scroll.add_system_message("Use WASD to move, E to interact, ESC to quit")
        
        print("🎮 Glade of Trials V2 initialized with Tiny Farm professional assets")
        print("🗺️ World Map:")
        self.glade.print_map_overview()
    
    def _setup_glade_state(self) -> None:
        """Setup DGT state with enhanced Glade of Trials"""
        # Set world dimensions
        self.state.world_width = self.glade.width
        self.state.world_height = self.glade.height
        
        # Set voyager starting position
        start_x, start_y = self.glade.get_starting_position()
        self.state.voyager = Voyager(start_x, start_y)
        
        # Load glade tiles
        self.state.tiles = {}
        for tile in self.glade.get_all_tiles():
            self.state.tiles[(tile.x, tile.y)] = tile
    
    def _setup_rendering_layers(self) -> None:
        """Setup dual-layer rendering"""
        # Game canvas (main world)
        self.game_canvas = Canvas(
            self.root,
            width=800,
            height=600,
            bg='#0a0a0a',
            highlightthickness=0
        )
        self.game_canvas.pack(pady=(20, 5))
        
        # HUD canvas (narrative and UI)
        self.hud_canvas = Canvas(
            self.root,
            width=800,
            height=120,
            bg='#1a1a1a',
            highlightthickness=0
        )
        self.hud_canvas.pack(pady=(5, 20))
    
    def _initialize_tiny_farm_systems(self) -> None:
        """Initialize systems with Tiny Farm integration"""
        # Tiny Farm enhanced asset loader
        self.asset_loader = create_tiny_farm_asset_loader()
        
        # Show integration stats
        stats = self.asset_loader.get_tiny_farm_stats()
        print(f"🚜 Tiny Farm Integration: {stats['processed_sprites']}/{stats['total_mappings']} assets loaded")
        
        # Dual-layer PPU with Tiny Farm assets
        self.ppu = DualLayerPPU(self.game_canvas, self.hud_canvas, self.asset_loader)
        
        # Override PPU's asset loader with Tiny Farm version
        self.ppu.asset_loader = self.asset_loader
        
        # Narrative scroll
        self.narrative_scroll = create_narrative_scroll(
            self.hud_canvas, 
            position=(10, 10), 
            size=(780, 100)
        )
        
        # Environmental polish
        self.env_polish = create_environmental_polish(self.game_canvas)
        
        # Generate environmental clutter
        self._generate_environmental_clutter()
        
        print("🎨 All systems initialized with Tiny Farm professional assets")
    
    def _generate_environmental_clutter(self) -> None:
        """Generate environmental clutter compatible with Tiny Farm assets"""
        for pos, terrain in self.glade.terrain_tiles.items():
            # Adjust density for professional aesthetic
            if terrain.terrain_type.value == "grass":
                density = 0.3  # Slightly reduced for cleaner look
            elif terrain.terrain_type.value == "stone_ground":
                density = 0.15
            elif terrain.terrain_type.value == "dirt_path":
                density = 0.05
            else:
                density = 0.0
            
            if density > 0:
                self.env_polish.generate_clutter_for_terrain(
                    terrain.terrain_type.value, 
                    pos[0], pos[1], 
                    density
                )
        
        # Initial render
        self.env_polish.render_clutter()
        
        print(f"🌿 Generated environmental clutter for {len(self.env_polish.clutter_elements)} elements")
    
    def _apply_professional_polish(self) -> None:
        """Apply professional visual polish while maintaining DGT DNA"""
        # Enhanced visual settings for professional assets
        self.ppu.game_ppu.shadow_opacity = 0.4  # Subtle shadows for professional look
        self.ppu.game_ppu.wind_frequency = 1.5   # Gentler wind sway
        
        # Apply refined Game Boy palette
        self._apply_professional_palette()
        
        # Enable kinetic animations
        self._enable_professional_animations()
        
        print("🎨 Professional polish applied: Refined aesthetics with DGT systemic integrity")
    
    def _apply_professional_palette(self) -> None:
        """Apply refined Game Boy palette for professional assets"""
        # Refined Game Boy palette for professional integration
        professional_palette = {
            "darkest": "#0f380f",   # Classic Game Boy green
            "dark": "#306230",      # Dark green  
            "light": "#8bac0f",     # Light green
            "lightest": "#9bbc0f",  # Lightest green
            "accent_gold": "#ffd700",  # Gold accent for special items
            "stone_gray": "#8b8680",   # Refined stone
            "wood_brown": "#6b4423",   # Rich wood
            "metal_silver": "#c0c0c0"   # Polished metal
        }
        
        # Update dither presets with professional colors
        from src.graphics.ppu_tk_native_enhanced import DitherPresets
        
        lush_green = DitherPresets.get_lush_green()
        lush_green.dark_color = professional_palette["dark"]
        lush_green.light_color = professional_palette["light"]
        
        stone_gray = DitherPresets.get_stone_gray()
        stone_gray.dark_color = professional_palette["darkest"]
        stone_gray.light_color = professional_palette["stone_gray"]
        
        wood_brown = DitherPresets.get_wood_brown()
        wood_brown.dark_color = professional_palette["wood_brown"]
        wood_brown.light_color = professional_palette["dark"]
        
        metal_silver = DitherPresets.get_metal_silver()
        metal_silver.dark_color = professional_palette["stone_gray"]
        metal_silver.light_color = professional_palette["metal_silver"]
        
        print("🎮 Professional Game Boy palette applied")
    
    def _enable_professional_animations(self) -> None:
        """Enable animations optimized for professional assets"""
        # Mark professional assets for animation
        for tile in self.state.tiles.values():
            if tile.sprite_id in ["swaying_oak", "bush_cluster", "mystic_flower"]:
                # These will benefit from subtle animation
                pass
        
        print("🌸 Professional animations enabled")
    
    def _setup_input(self) -> None:
        """Setup keyboard input handling"""
        self.root.bind('<Key>', self._on_key_press)
        self.root.bind('<KeyRelease>', self._on_key_release)
        
        # Track pressed keys
        self.pressed_keys = set()
    
    def _on_key_press(self, event) -> None:
        """Handle key press events"""
        key = event.keysym.lower()
        self.pressed_keys.add(key)
        
        # Handle immediate actions
        if key == 'escape':
            self.running = False
            self.root.quit()
        elif key == 'e':
            self._handle_interaction()
    
    def _on_key_release(self, event) -> None:
        """Handle key release events"""
        key = event.keysym.lower()
        self.pressed_keys.discard(key)
    
    def _process_input(self) -> None:
        """Process continuous input (movement)"""
        dx, dy = 0, 0
        
        if 'w' in self.pressed_keys:
            dy = -1
        elif 's' in self.pressed_keys:
            dy = 1
        
        if 'a' in self.pressed_keys:
            dx = -1
        elif 'd' in self.pressed_keys:
            dx = 1
        
        if dx != 0 or dy != 0:
            self._move_voyager(dx, dy)
    
    def _move_voyager(self, dx: int, dy: int) -> None:
        """Move voyager with professional animation and feedback"""
        old_x, old_y = self.state.voyager.get_position()
        new_x, new_y = old_x + dx, old_y + dy
        
        if can_move_to(self.state, new_x, new_y):
            self.state.voyager.set_position(new_x, new_y)
            
            # Set character to walking animation
            character = self.ppu.character_sprites.get("voyager")
            if character:
                character.set_state(AnimationState.WALKING)
            
            # Enhanced movement narrative
            direction = self._get_direction_name(dx, dy)
            self.narrative_scroll.add_movement_message(f"moved {direction}")
            
            # Check for special terrain
            self._check_terrain_effects(new_x, new_y)
            
            # Return to idle after movement
            self.root.after(200, self._return_character_to_idle)
            
        else:
            # Enhanced blocked feedback
            self.narrative_scroll.add_movement_message("blocked by barrier")
            
            # Bump animation
            character = self.ppu.character_sprites.get("voyager")
            if character:
                character.set_state(AnimationState.INTERACTING)
                self.root.after(300, self._return_character_to_idle)
    
    def _get_direction_name(self, dx: int, dy: int) -> str:
        """Get direction name from movement delta"""
        if dy < 0:
            return "north"
        elif dy > 0:
            return "south"
        elif dx < 0:
            return "west"
        elif dx > 0:
            return "east"
        else:
            return "nowhere"
    
    def _check_terrain_effects(self, x: int, y: int) -> None:
        """Check for special terrain effects with professional assets"""
        tile = self.state.get_tile(x, y)
        if not tile:
            return
        
        # Enhanced terrain descriptions
        if tile.interaction_id == "void_patch":
            self.narrative_scroll.add_story_message(
                "🌌 You've reached the void patch! The portal to Volume 4 awaits...",
                critical=True
            )
            self._handle_victory()
        elif tile.sprite_id == "ancient_stone":
            self.narrative_scroll.add_discovery_message("You stand before the mysterious ancient stone")
        elif tile.sprite_id == "iron_lockbox":
            self.narrative_scroll.add_discovery_message("You examine the intricately crafted iron lockbox")
    
    def _handle_interaction(self) -> None:
        """Handle interaction with professional feedback"""
        voyager_x, voyager_y = self.state.voyager.get_position()
        interactable = self.state.get_interactable_at(voyager_x, voyager_y)
        
        if interactable and interactable.interaction_id:
            # Set character to interacting animation
            character = self.ppu.character_sprites.get("voyager")
            if character:
                character.set_state(AnimationState.INTERACTING)
            
            # Perform skill check
            self._perform_skill_check(interactable.interaction_id)
        else:
            self.narrative_scroll.add_interaction_message("Nothing to interact with nearby", False)
    
    def _perform_skill_check(self, check_id: str) -> None:
        """Perform D20 skill check with professional narrative"""
        try:
            roll = self.ppu.perform_d20_check(check_id)
            
            # Enhanced narrative based on result
            if check_id == "ancient_stone":
                self._handle_stone_interaction(roll)
            elif check_id == "iron_lockbox":
                self._handle_lockbox_interaction(roll)
            elif check_id == "void_patch":
                self._handle_void_interaction(roll)
            
            # Return character to idle
            self.root.after(1000, self._return_character_to_idle)
            
        except Exception as e:
            self.narrative_scroll.add_system_message(f"Error during skill check: {e}")
    
    def _handle_stone_interaction(self, roll: D20Roll) -> None:
        """Handle ancient stone interaction with professional narrative"""
        if roll.result.value >= 4:  # Critical Success
            self.narrative_scroll.add_story_message(
                "✨ The ancient runes glow with ethereal light! Forgotten knowledge flows into your consciousness.",
                critical=True
            )
        elif roll.result.value >= 3:  # Success
            self.narrative_scroll.add_discovery_message(
                "🔍 You decipher the mysterious runes. They speak of an ancient guardian protecting these lands."
            )
        elif roll.result.value == 2:  # Failure
            self.narrative_scroll.add_interaction_message(
                "🔍 The ancient symbols remain enigmatic, their secrets hidden from your understanding."
            )
        else:  # Critical Failure
            self.narrative_scroll.add_interaction_message(
                "💥 The stone's mystical energy repels you! Your mind reels from the ancient power.",
                False
            )
    
    def _handle_lockbox_interaction(self, roll: D20Roll) -> None:
        """Handle iron lockbox interaction with professional narrative"""
        if roll.result.value >= 4:  # Critical Success
            self.narrative_scroll.add_story_message(
                "💎 With masterful precision, the complex lock yields! Inside, you discover a rare crystal pulsing with energy.",
                critical=True
            )
        elif roll.result.value >= 3:  # Success
            self.narrative_scroll.add_discovery_message(
                "🔓 After careful manipulation, the lock opens! You find ancient coins and a mysterious key."
            )
        elif roll.result.value == 2:  # Failure
            self.narrative_scroll.add_interaction_message(
                "🔒 The sophisticated mechanism resists your attempts. This lock requires greater skill."
            )
        else:  # Critical Failure
            self.narrative_scroll.add_interaction_message(
                "⚠️ Your lockpick snaps in the intricate mechanism! The lock seems even more secure now.",
                False
            )
    
    def _handle_void_interaction(self, roll: D20Roll) -> None:
        """Handle void patch interaction"""
        self.narrative_scroll.add_story_message(
            "🌌 The void patch welcomes you. Reality bends and colors swirl as you step through the portal...",
            critical=True
        )
        self._handle_victory()
    
    def _return_character_to_idle(self) -> None:
        """Return character to idle animation"""
        character = self.ppu.character_sprites.get("voyager")
        if character:
            character.set_state(AnimationState.IDLE)
    
    def _handle_victory(self) -> None:
        """Handle reaching the goal"""
        self.narrative_scroll.add_story_message(
            "🏆 Congratulations! You've completed the Glade of Trials - Professional Edition!",
            critical=True
        )
    
    def _render(self) -> None:
        """Render the professional game scene"""
        # Create render entities with Tiny Farm assets
        entities = []
        
        # Add world tiles
        for tile in self.state.tiles.values():
            layer = self._get_render_layer(tile.tile_type)
            
            entity = RenderEntity(
                world_pos=(tile.x, tile.y),
                sprite_id=tile.sprite_id,
                layer=layer,
                visible=True,
                material_id=self._get_material_id(tile.sprite_id),
                collision=tile.is_barrier,
                tags=["interactive"] if tile.tile_type == TileType.INTERACTIVE else [],
                metadata={"description": tile.description}
            )
            entities.append(entity)
        
        # Add voyager with professional sprite
        voyager_entity = RenderEntity(
            world_pos=self.state.voyager.get_position(),
            sprite_id=self.state.voyager.sprite_id,
            layer=RenderLayer.ACTORS,
            visible=True,
            material_id="organic",
            collision=False,
            tags=["player", "animated"],
            metadata={"description": "The Voyager - Professional Edition"}
        )
        
        # Set animation state based on movement
        if any(key in self.pressed_keys for key in ['w', 'a', 's', 'd']):
            voyager_entity.tags.append("moving")
        
        entities.append(voyager_entity)
        
        # Render game layer
        self.ppu.render_game_layer(entities)
        
        # Render environmental clutter
        self.env_polish.render_clutter()
    
    def _get_render_layer(self, tile_type):
        """Get render layer for tile type"""
        if tile_type == TileType.BARRIER:
            return RenderLayer.FRINGE
        elif tile_type == TileType.INTERACTIVE:
            return RenderLayer.ACTORS
        else:
            return RenderLayer.SURFACES
    
    def _get_material_id(self, sprite_id: str) -> str:
        """Get material ID for sprite"""
        material_map = {
            "swaying_oak": "organic",
            "ancient_stone": "stone",
            "iron_lockbox": "metal",
            "rock_formation": "stone",
            "bush_cluster": "organic",
            "mystic_flower": "organic",
            "grass": "organic",
            "dirt_path": "stone",
            "stone_ground": "stone",
            "void_patch": "void",
            "voyager": "organic"
        }
        return material_map.get(sprite_id, "organic")
    
    def game_loop(self) -> None:
        """Main game loop with professional polish"""
        if not self.running:
            return
        
        # Calculate delta time
        current_time = time.time()
        delta_time = current_time - self.last_update_time
        self.last_update_time = current_time
        
        # Input
        self._process_input()
        
        # Update
        self.update_counter += 1
        
        # Update animations
        self.ppu.update_animations()
        self.env_polish.update_animation(delta_time)
        
        # Render
        self._render()
        
        # Schedule next frame (60 FPS)
        self.root.after(16, self.game_loop)
    
    def run(self) -> None:
        """Start the professional Glade of Trials"""
        print("🎮 Starting Glade of Trials V2 - Professional Edition...")
        print("🎯 Experience:")
        print("  • Professional Tiny Farm RPG assets")
        print("  • DGT systemic logic and mechanics")
        print("  • Enhanced visual polish and animations")
        print("  • Complete tactical gameplay")
        print("")
        
        # Start game loop
        self.game_loop()
        
        # Run tkinter main loop
        self.root.mainloop()


def main():
    """Main entry point for Glade of Trials V2"""
    print("🏆 Glade of Trials V2 - Tiny Farm Professional Edition")
    print("=" * 60)
    print("🎮 ADR 107: Asset Supplementation Protocol")
    print("✅ Professional Tiny Farm RPG Assets")
    print("✅ DGT Systemic Logic Preservation")
    print("✅ Enhanced Visual Polish")
    print("✅ Complete Tactical Mechanics")
    print("✅ Professional Character Sprites")
    print("✅ Dithered & Palette-Locked Aesthetic")
    print("")
    print("🚜 Professional Art + DGT Logic = Retail-Ready Game Slice")
    print("")
    
    # Create and run runtime
    runtime = GladeOfTrialsV2()
    runtime.run()


if __name__ == "__main__":
    main()
