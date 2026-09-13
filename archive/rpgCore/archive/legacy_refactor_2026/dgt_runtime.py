"""
DGT Runtime - The Minimal Game Engine
KISS Principle: Input -> Update -> Render -> Repeat
"""

import tkinter as tk
from tkinter import Canvas
import sys
import os
from typing import Dict, Any
import threading

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from dgt_state import DGTState, TileType
from dgt_physics import can_move_to
from graphics.ppu_tk_native_enhanced import EnhancedTkinterPPU, RenderEntity, DitherPresets
from utils.asset_loader import AssetLoader
from src.core.handler import create_dgt_window_handler, RenderCommand, CommandType


class DGTRuntime:
    """The bicycle engine - simple 2D RPG runtime"""
    
    def __init__(self):
        # Initialize window
        self.root = tk.Tk()
        self.root.title("🎮 DGT Runtime - Playable Demo")
        self.root.geometry("800x600")
        self.root.configure(bg='#1a1a1a')
        
        # Game state
        self.state = DGTState()
        
        # Initialize DGT Window Handler
        self.window_handler = create_dgt_window_handler(self.root, 640, 480)
        
        # Initialize PPU (using handler's canvas)
        self.asset_loader = MockAssetLoader()
        self.ppu = EnhancedTkinterPPU(self.window_handler.canvas, self.asset_loader)
        
        # Cache sprites in handler
        self._cache_sprites()
        
        # UI elements
        self._setup_ui()
        
        # Game loop control
        self.running = True
        self.update_counter = 0
        
        # Set game update callback
        self.window_handler.set_game_update_callback(self.game_update)
        
        print("🎮 DGT Runtime Initialized with Dedicated Handler")
        print("Controls: WASD to move, E to interact, ESC to quit")
    
    def _setup_ui(self) -> None:
        """Setup UI elements"""
        # Status bar
        self.status_frame = tk.Frame(self.root, bg='#2a2a2a')
        self.status_frame.pack(fill=tk.X, padx=20, pady=(0, 10))
        
        self.status_label = tk.Label(
            self.status_frame,
            text=self.state.message,
            font=("Courier", 10),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        self.status_label.pack(side=tk.LEFT, padx=10, pady=5)
        
        # Position label
        self.position_label = tk.Label(
            self.status_frame,
            text=f"Position: ({self.state.voyager.x}, {self.state.voyager.y})",
            font=("Courier", 10),
            fg='#ffffff',
            bg='#2a2a2a'
        )
        self.position_label.pack(side=tk.RIGHT, padx=10, pady=5)
    
    def _cache_sprites(self) -> None:
        """Cache sprites in the window handler for instant access"""
        for sprite_id, sprite in self.asset_loader.sprites.items():
            self.window_handler.raster_cache.cache_sprite(sprite_id, sprite)
        
        print(f"🎨 Cached {len(self.asset_loader.sprites)} sprites in handler")
    
    def game_update(self) -> None:
        """Game logic update called from dedicated thread"""
        # Process input from handler
        pressed_keys = self.window_handler.input_interceptor.get_pressed_keys()
        
        # Handle movement
        dx, dy = 0, 0
        if 'w' in pressed_keys:
            dy = -1
        elif 's' in pressed_keys:
            dy = 1
        
        if 'a' in pressed_keys:
            dx = -1
        elif 'd' in pressed_keys:
            dx = 1
        
        if dx != 0 or dy != 0:
            self._move_voyager(dx, dy)
        
        # Handle interaction
        if 'e' in pressed_keys:
            self._handle_interaction()
        
        # Handle quit
        if 'escape' in pressed_keys:
            self.running = False
            self.root.quit()
        
        # Queue render command
        self._queue_render()
        
        self.update_counter += 1
    
    def _queue_render(self) -> None:
        """Queue render commands for the handler"""
        # Clear canvas command
        clear_command = RenderCommand(command_type=CommandType.CLEAR)
        self.window_handler.queue_command(clear_command)
        
        # Create render entities from world state
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
        
        # Add voyager
        from graphics.ppu_tk_native_enhanced import RenderLayer
        voyager_entity = RenderEntity(
            world_pos=self.state.voyager.get_position(),
            sprite_id=self.state.voyager.sprite_id,
            layer=RenderLayer.ACTORS,
            visible=True,
            material_id="organic",
            collision=False,
            tags=["player", "animated"],
            metadata={"description": "The Voyager"}
        )
        entities.append(voyager_entity)
        
        # Queue draw commands for each entity
        for entity in entities:
            if entity.world_pos and entity.sprite_id:
                draw_command = RenderCommand(
                    command_type=CommandType.DRAW_SPRITE,
                    entity_id=f"entity_{entity.world_pos[0]}_{entity.world_pos[1]}",
                    position=entity.world_pos,
                    sprite_id=entity.sprite_id
                )
                self.window_handler.queue_command(draw_command)
    
    def _handle_interaction(self) -> None:
        """Handle interaction key"""
        result = self.state.interact()
        print(f"🎯 {result}")
        self._update_status()
    
    
    def _move_voyager(self, dx: int, dy: int) -> None:
        """Move voyager with physics check"""
        old_x, old_y = self.state.voyager.get_position()
        new_x, new_y = old_x + dx, old_y + dy
        
        if can_move_to(self.state, new_x, new_y):
            self.state.voyager.set_position(new_x, new_y)
            self.state.message = f"Moved to ({new_x}, {new_y})"
            print(f"🚶 Moved from ({old_x}, {old_y}) to ({new_x}, {new_y})")
        else:
            self.state.message = f"Blocked at ({new_x}, {new_y})!"
            print(f"🚫 Blocked at ({new_x}, {new_y})")
        
        self._update_status()
    
    def _update_status(self) -> None:
        """Update UI status"""
        self.status_label.config(text=self.state.message)
        x, y = self.state.voyager.get_position()
        self.position_label.config(text=f"Position: ({x}, {y})")
    
    
    def _get_render_layer(self, tile_type):
        """Get render layer for tile type"""
        from graphics.ppu_tk_native_enhanced import RenderLayer
        if tile_type == TileType.BARRIER:
            return RenderLayer.FRINGE
        elif tile_type == TileType.INTERACTIVE:
            return RenderLayer.ACTORS
        else:
            return RenderLayer.SURFACES
    
    def _get_material_id(self, sprite_id: str) -> str:
        """Get material ID for sprite"""
        material_map = {
            "tree": "organic",
            "rock": "stone",
            "bush": "organic",
            "flower": "organic",
            "mushroom": "organic",
            "iron_lockbox": "metal",
            "voyager": "organic"
        }
        return material_map.get(sprite_id, "organic")
    
    
    def run(self) -> None:
        """Start the game with dedicated handler"""
        print("🎮 Starting DGT Runtime with Dedicated Handler...")
        print("🗺️ World Map:")
        self._print_world_map()
        
        # Start the dedicated handler
        self.window_handler.start()
        
        # Run tkinter main loop (now just for UI events)
        self.root.mainloop()
        
        # Cleanup
        self.window_handler.stop()
    
    def _print_world_map(self) -> None:
        """Print ASCII world map"""
        print("   " + "".join(str(i) for i in range(self.state.world_width)))
        print("  " + "─" * (self.state.world_width * 2 + 1))
        
        for y in range(self.state.world_height):
            row = f"{y:2d}│"
            for x in range(self.state.world_width):
                if (x, y) == self.state.voyager.get_position():
                    row += " @"
                else:
                    tile = self.state.get_tile(x, y)
                    if tile:
                        if tile.is_barrier:
                            row += " #"
                        elif tile.tile_type == TileType.INTERACTIVE:
                            row += " ?"
                        else:
                            row += " ◦"
                    else:
                        row += " ."
                row += " "
            print(row)
        
        print("  " + "─" * (self.state.world_width * 2 + 1))
        print("\nLegend: @=Voyager, #=Barrier, ?=Interactive, ◦=Object, .=Empty")


class MockAssetLoader:
    """Mock asset loader for demo"""
    
    def __init__(self):
        self.sprites = {}
        self._create_mock_sprites()
    
    def _create_mock_sprites(self) -> None:
        """Create mock sprites for demo"""
        # Create simple colored rectangles as sprites
        colors = {
            "voyager": "#00ff00",      # Green player
            "tree": "#2d5a27",        # Dark green tree
            "rock": "#757575",        # Gray rock
            "bush": "#4b7845",        # Light green bush
            "flower": "#ff69b4",      # Pink flower
            "mushroom": "#8b4513",    # Brown mushroom
            "iron_lockbox": "#9e9e9e" # Gray lockbox
        }
        
        for sprite_id, color in colors.items():
            # Create 16x16 sprite
            import tkinter as tk
            sprite = tk.PhotoImage(width=16, height=16)
            
            # Fill with color
            for y in range(16):
                for x in range(16):
                    sprite.put(color, (x, y))
            
            # Scale for display (4x)
            sprite = sprite.zoom(4, 4)
            self.sprites[sprite_id] = sprite
    
    def get_sprite(self, sprite_id: str):
        """Get sprite by ID"""
        return self.sprites.get(sprite_id)


def main():
    """Main entry point"""
    print("🎮 DGT Runtime - Minimal Game Engine")
    print("=" * 50)
    print("🚴 The Bicycle Engine - Simple, Functional, Fun")
    print("")
    print("Controls:")
    print("  WASD - Move the Voyager")
    print("  E    - Interact with objects")
    print("  ESC  - Quit game")
    print("")
    print("Objective:")
    print("  • Explore the world")
    print("  • Find the iron lockbox")
    print("  • Try to open it (need D20 >= 15)")
    print("")
    
    # Create and run runtime
    runtime = DGTRuntime()
    runtime.run()


if __name__ == "__main__":
    main()
