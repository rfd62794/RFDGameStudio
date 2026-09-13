"""
Smooth Demo - ADR 108 Performance Demonstration
Shows butter-smooth Voyager movement with dedicated DGT Window Handler
"""

import tkinter as tk
import sys
import os
import time
import math
from typing import Dict, Any

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.handler import create_dgt_window_handler, RenderCommand, CommandType
from loguru import logger


class SmoothDemo:
    """
    Performance demo showcasing lag-free movement and animations
    Tests the dedicated handler under stress conditions
    """
    
    def __init__(self):
        # Initialize window
        self.root = tk.Tk()
        self.root.title("🚀 Smooth Demo - Dedicated Handler Performance Test")
        self.root.geometry("900x700")
        self.root.configure(bg='#1a1a1a')
        
        # Initialize DGT Window Handler
        self.window_handler = create_dgt_window_handler(self.root, 800, 500)
        
        # Demo state
        self.running = True
        self.frame_count = 0
        self.start_time = time.time()
        
        # Voyager state
        self.voyager_x = 400
        self.voyager_y = 250
        self.voyager_vx = 0
        self.voyager_vy = 0
        self.voyager_angle = 0
        
        # Animation state
        self.grass_offset = 0
        self.shadow_angle = 0
        self.particle_time = 0
        
        # Performance tracking
        self.last_perf_update = time.time()
        self.fps_samples = []
        
        # Create demo sprites
        self._create_demo_sprites()
        
        # Setup UI
        self._setup_ui()
        
        # Set game update callback
        self.window_handler.set_game_update_callback(self.game_update)
        
        print("🚀 Smooth Demo Initialized")
        print("Controls: WASD to move, Mouse to test responsiveness, ESC to quit")
    
    def _create_demo_sprites(self) -> None:
        """Create demo sprites for performance testing"""
        # Voyager sprite (green triangle)
        self.voyager_sprite = tk.PhotoImage(width=32, height=32)
        self._draw_triangle(self.voyager_sprite, "#00ff00", 32, 32)
        
        # Grass sprites for static background
        self.grass_sprites = []
        for i in range(4):
            grass = tk.PhotoImage(width=16, height=16)
            self._draw_grass(grass, i)
            self.grass_sprites.append(grass)
        
        # Shadow sprite
        self.shadow_sprite = tk.PhotoImage(width=32, height=32)
        self._draw_shadow(self.shadow_sprite)
        
        # Particle sprite
        self.particle_sprite = tk.PhotoImage(width=8, height=8)
        self._draw_particle(self.particle_sprite)
        
        # Try to use Tiny Farm Voyager sprite if available
        self._setup_voyager_sprite()
        
        # Cache remaining sprites in handler
        for i, grass in enumerate(self.grass_sprites):
            self.window_handler.raster_cache.cache_sprite(f"grass_{i}", grass)
        self.window_handler.raster_cache.cache_sprite("shadow", self.shadow_sprite)
        self.window_handler.raster_cache.cache_sprite("particle", self.particle_sprite)
        
        # ADR 109: Setup static background tiles
        self._setup_static_background()
        
        # Bake the background
        self.window_handler.bake_background()
        
        logger.info("🎨 Demo sprites created and cached with baked background")
    
    def _draw_triangle(self, sprite: tk.PhotoImage, color: str, width: int, height: int) -> None:
        """Draw triangle sprite"""
        cx, cy = width // 2, height // 2
        
        for y in range(height):
            for x in range(width):
                # Simple triangle shape
                if y >= cy and abs(x - cx) <= (y - cy) // 2:
                    sprite.put(color, (x, y))
    
    def _draw_grass(self, sprite: tk.PhotoImage, frame: int) -> None:
        """Draw animated grass sprite"""
        colors = ["#2d5a27", "#3d6a37", "#4d7a47", "#5d8a57"]
        
        for y in range(16):
            for x in range(16):
                # Animated grass pattern
                if y > 12 and (x + frame) % 3 == 0:
                    sprite.put(colors[frame % 4], (x, y))
                elif y > 8:
                    sprite.put("#2d5a27", (x, y))
    
    def _draw_shadow(self, sprite: tk.PhotoImage) -> None:
        """Draw shadow sprite"""
        for y in range(32):
            for x in range(32):
                # Elliptical shadow
                cx, cy = 16, 20
                if ((x - cx) ** 2) / 64 + ((y - cy) ** 2) / 16 <= 1:
                    alpha = int(255 * (1 - ((x - cx) ** 2) / 64 - ((y - cy) ** 2) / 16))
                    color = f"#{alpha:02x}{alpha:02x}{alpha:02x}"
                    sprite.put(color, (x, y))
    
    def _draw_particle(self, sprite: tk.PhotoImage) -> None:
        """Draw particle sprite"""
        for y in range(8):
            for x in range(8):
                # Small glowing particle
                cx, cy = 4, 4
                if (x - cx) ** 2 + (y - cy) ** 2 <= 9:
                    sprite.put("#ffff00", (x, y))
    
    def _setup_ui(self) -> None:
        """Setup UI elements"""
        # Performance frame
        self.perf_frame = tk.Frame(self.root, bg='#2a2a2a')
        self.perf_frame.pack(fill=tk.X, padx=20, pady=(10, 5))
        
        self.fps_label = tk.Label(
            self.perf_frame,
            text="FPS: 0",
            font=("Courier", 12, "bold"),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        self.fps_label.pack(side=tk.LEFT, padx=10)
        
        self.perf_label = tk.Label(
            self.perf_frame,
            text="Pulse: 0ms | Queue: 0",
            font=("Courier", 10),
            fg='#ffffff',
            bg='#2a2a2a'
        )
        self.perf_label.pack(side=tk.LEFT, padx=20)
        
        # Status frame
        self.status_frame = tk.Frame(self.root, bg='#2a2a2a')
        self.status_frame.pack(fill=tk.X, padx=20, pady=(0, 10))
        
        self.status_label = tk.Label(
            self.status_frame,
            text="Move with WASD - Watch for smooth, lag-free movement!",
            font=("Courier", 10),
            fg='#ffff00',
            bg='#2a2a2a'
        )
        self.status_label.pack(side=tk.LEFT, padx=10)
        
        self.position_label = tk.Label(
            self.status_frame,
            text="Position: (400, 250)",
            font=("Courier", 10),
            fg='#ffffff',
            bg='#2a2a2a'
        )
        self.position_label.pack(side=tk.RIGHT, padx=10)
    
    def game_update(self) -> None:
        """Game logic update called from dedicated thread"""
        # Process input
        pressed_keys = self.window_handler.input_interceptor.get_pressed_keys()
        
        # Update Voyager physics
        acceleration = 0.5
        friction = 0.9
        max_speed = 8
        
        if 'w' in pressed_keys:
            self.voyager_vy -= acceleration
        if 's' in pressed_keys:
            self.voyager_vy += acceleration
        if 'a' in pressed_keys:
            self.voyager_vx -= acceleration
        if 'd' in pressed_keys:
            self.voyager_vx += acceleration
        
        # Apply friction
        self.voyager_vx *= friction
        self.voyager_vy *= friction
        
        # Limit speed
        speed = math.sqrt(self.voyager_vx ** 2 + self.voyager_vy ** 2)
        if speed > max_speed:
            self.voyager_vx = (self.voyager_vx / speed) * max_speed
            self.voyager_vy = (self.voyager_vy / speed) * max_speed
        
        # Update position
        self.voyager_x += self.voyager_vx
        self.voyager_y += self.voyager_vy
        
        # Keep Voyager in bounds
        self.voyager_x = max(16, min(784, self.voyager_x))
        self.voyager_y = max(16, min(484, self.voyager_y))
        
        # Update angle based on velocity
        if speed > 0.1:
            self.voyager_angle = math.atan2(self.voyager_vy, self.voyager_vx)
        
        # Update animations
        self.grass_offset = (self.grass_offset + 0.1) % 4
        self.shadow_angle += 0.05
        self.particle_time += 0.1
        
        # Handle quit
        if 'escape' in pressed_keys:
            self.running = False
            self.root.quit()
        
        # Queue render commands
        self._queue_render()
        
        # Update performance display
        self._update_performance_display()
        
        self.frame_count += 1
    
    def _queue_render(self) -> None:
        """Queue render commands for smooth display with ADR 109 background baking"""
        # Clear canvas command
        clear_command = RenderCommand(command_type=CommandType.CLEAR)
        self.window_handler.queue_command(clear_command)
        
        # Update Voyager position in dynamic entities
        self.window_handler.clear_dynamic_entities()
        
        # Add Voyager as dynamic entity
        voyager_entity = {
            'entity_id': 'voyager',
            'position': (self.voyager_x - 16, self.voyager_y - 16),
            'sprite_id': 'voyager'
        }
        self.window_handler.add_dynamic_entity(voyager_entity)
        
        # Add shadow as dynamic entity
        shadow_x = self.voyager_x + math.sin(self.shadow_angle) * 2
        shadow_y = self.voyager_y + 8
        shadow_entity = {
            'entity_id': 'shadow',
            'position': (shadow_x, shadow_y),
            'sprite_id': 'shadow'
        }
        self.window_handler.add_dynamic_entity(shadow_entity)
        
        # Add particles as dynamic entities
        for i in range(8):
            angle = self.particle_time + (i * math.pi / 4)
            px = self.voyager_x + math.cos(angle) * 40
            py = self.voyager_y + math.sin(angle) * 40
            
            particle_entity = {
                'entity_id': f'particle_{i}',
                'position': (px - 4, py - 4),
                'sprite_id': 'particle'
            }
            self.window_handler.add_dynamic_entity(particle_entity)
        
        # Draw performance text overlay
        fps_text = f"FPS: {self.window_handler.actual_fps}"
        text_command = RenderCommand(
            command_type=CommandType.DRAW_TEXT,
            entity_id="fps_text",
            position=(10, 10),
            text=fps_text
        )
        self.window_handler.queue_command(text_command)
    
    def _setup_static_background(self) -> None:
        """ADR 109: Setup static background tiles for baking with Tiny Farm integration"""
        # Create a grass field with some variation
        for y in range(0, 500, 16):
            for x in range(0, 800, 16):
                # Vary grass pattern for visual interest
                pattern = ((x // 16) + (y // 16)) % 4
                self.window_handler.set_static_tile(x, y, f"grass_{pattern}")
        
        # Try to load Tiny Farm assets for professional visuals
        tiny_farm_loaded = self._load_tiny_farm_assets()
        
        if not tiny_farm_loaded:
            # Fallback to simple procedural assets
            self._setup_procedural_assets()
        
        logger.info(f"🏠 Static background setup: {len(self.window_handler.static_tiles)} tiles")
    
    def _load_tiny_farm_assets(self) -> bool:
        """Load Tiny Farm assets for professional visuals"""
        try:
            # Try to import Tiny Farm loader
            from src.assets.tiny_farm_sheet_loader import create_tiny_farm_sheet_loader
            
            # Create Tiny Farm loader
            tiny_farm_loader = create_tiny_farm_sheet_loader()
            
            # Get available sprites
            all_sprites = tiny_farm_loader.get_all_sprites()
            
            if len(all_sprites) > 0:
                logger.info(f"🚜 Loaded {len(all_sprites)} Tiny Farm sprites")
                
                # Add Tiny Farm sprites to cache
                for sprite_id, sprite in all_sprites.items():
                    self.window_handler.raster_cache.cache_sprite(f"tiny_farm_{sprite_id}", sprite)
                
                # Place Tiny Farm assets in background
                self._place_tiny_farm_assets(tiny_farm_loader)
                return True
            else:
                logger.warning("⚠️ No Tiny Farm sprites found")
                return False
                
        except Exception as e:
            logger.warning(f"⚠️ Could not load Tiny Farm assets: {e}")
            return False
    
    def _place_tiny_farm_assets(self, tiny_farm_loader) -> None:
        """Place Tiny Farm assets in the background"""
        # Place trees (using Tiny Farm tree sprites if available)
        tree_positions = [(100, 100), (300, 150), (600, 200), (700, 400), (150, 350)]
        for i, (tx, ty) in enumerate(tree_positions):
            # Try Tiny Farm tree first, then fallback
            tree_sprite_id = f"tiny_farm_swaying_oak"  # From Tiny Farm mapping
            if tiny_farm_loader.get_single_sprite(tree_sprite_id.replace("tiny_farm_", "")):
                self.window_handler.set_static_tile(tx, ty, tree_sprite_id)
            else:
                # Fallback to procedural tree
                tree_sprite = tk.PhotoImage(width=32, height=32)
                self._draw_tree(tree_sprite)
                tree_id = f"tree_{tx}_{ty}"
                self.window_handler.raster_cache.cache_sprite(tree_id, tree_sprite)
                self.window_handler.set_static_tile(tx, ty, tree_id)
        
        # Place objects (chests, houses, etc.)
        object_positions = [(200, 250), (400, 300), (500, 150)]
        for i, (ox, oy) in enumerate(object_positions):
            # Try Tiny Farm objects
            object_sprites = ["tiny_farm_iron_lockbox", "tiny_farm_house", "tiny_farm_chicken"]
            for obj_sprite_id in object_sprites:
                if tiny_farm_loader.get_single_sprite(obj_sprite_id.replace("tiny_farm_", "")):
                    self.window_handler.set_static_tile(ox, oy, obj_sprite_id)
                    break
            else:
                # Fallback to procedural rock
                rock_sprite = tk.PhotoImage(width=16, height=16)
                self._draw_rock(rock_sprite)
                rock_id = f"rock_{ox}_{oy}"
                self.window_handler.raster_cache.cache_sprite(rock_id, rock_sprite)
                self.window_handler.set_static_tile(ox, oy, rock_id)
        
        logger.info("🚜 Tiny Farm assets placed in background")
    
    def _setup_procedural_assets(self) -> None:
        """Setup procedural assets as fallback"""
        # Trees
        tree_positions = [(100, 100), (300, 150), (600, 200), (700, 400), (150, 350)]
        for tx, ty in tree_positions:
            tree_sprite = tk.PhotoImage(width=32, height=32)
            self._draw_tree(tree_sprite)
            tree_id = f"tree_{tx}_{ty}"
            self.window_handler.raster_cache.cache_sprite(tree_id, tree_sprite)
            self.window_handler.set_static_tile(tx, ty, tree_id)
        
        # Rocks
        rock_positions = [(200, 250), (500, 100), (400, 350)]
        for rx, ry in rock_positions:
            rock_sprite = tk.PhotoImage(width=16, height=16)
            self._draw_rock(rock_sprite)
            rock_id = f"rock_{rx}_{ry}"
            self.window_handler.raster_cache.cache_sprite(rock_id, rock_sprite)
            self.window_handler.set_static_tile(rx, ry, rock_id)
        
        logger.info("🎨 Procedural assets placed in background")
    
    def _setup_voyager_sprite(self) -> None:
        """Setup Voyager sprite with Tiny Farm integration"""
        try:
            # Try to load Tiny Farm Voyager sprite
            from src.assets.tiny_farm_sheet_loader import create_tiny_farm_sheet_loader
            
            tiny_farm_loader = create_tiny_farm_sheet_loader()
            voyager_sprite = tiny_farm_loader.get_single_sprite("voyager_idle")
            
            if voyager_sprite:
                # Use Tiny Farm Voyager sprite
                self.window_handler.raster_cache.cache_sprite("voyager", voyager_sprite)
                logger.info("🚶‍♂️ Using Tiny Farm Voyager sprite")
            else:
                # Fallback to procedural Voyager sprite
                self.window_handler.raster_cache.cache_sprite("voyager", self.voyager_sprite)
                logger.info("🚶‍♂️ Using procedural Voyager sprite")
                
        except Exception as e:
            # Fallback to procedural Voyager sprite
            self.window_handler.raster_cache.cache_sprite("voyager", self.voyager_sprite)
            logger.warning(f"⚠️ Could not load Tiny Farm Voyager: {e}, using procedural")
    
    def _draw_tree(self, sprite: tk.PhotoImage) -> None:
        """Draw simple tree sprite"""
        # Tree trunk (brown)
        for y in range(20, 28):
            for x in range(12, 20):
                sprite.put("#654321", (x, y))
        
        # Tree crown (green triangle)
        for y in range(8, 20):
            width = 20 - y
            for x in range(16 - width, 16 + width):
                sprite.put("#228b22", (x, y))
    
    def _draw_rock(self, sprite: tk.PhotoImage) -> None:
        """Draw simple rock sprite"""
        for y in range(16):
            for x in range(16):
                # Simple circular rock shape
                cx, cy = 8, 8
                if (x - cx) ** 2 + (y - cy) ** 2 <= 36:
                    sprite.put("#808080", (x, y))
    
    def _update_performance_display(self) -> None:
        """Update performance UI elements"""
        current_time = time.time()
        
        # Update FPS display
        if current_time - self.last_perf_update >= 0.5:  # Update every 500ms
            stats = self.window_handler.get_performance_stats()
            
            self.fps_label.config(text=f"FPS: {stats['actual_fps']}")
            self.perf_label.config(
                text=f"Pulse: {stats['avg_pulse_time_ms']:.1f}ms | Queue: {stats['command_queue_size']}"
            )
            
            self.position_label.config(
                text=f"Position: ({int(self.voyager_x)}, {int(self.voyager_y)})"
            )
            
            self.last_perf_update = current_time
            
            # Log performance warnings
            if stats['actual_fps'] < 50:
                logger.warning(f"⚠️ Performance drop: {stats['actual_fps']} FPS")
    
    def run(self) -> None:
        """Start the smooth demo"""
        print("🚀 Starting Smooth Demo...")
        print("📊 Testing dedicated handler performance...")
        print("🎮 Move with WASD - observe butter-smooth movement!")
        print("✨ Watch particles, shadows, and animated grass")
        print("")
        
        # Start the dedicated handler
        self.window_handler.start()
        
        # Run tkinter main loop
        self.root.mainloop()
        
        # Cleanup
        self.window_handler.stop()
        
        # Print final performance stats
        runtime = time.time() - self.start_time
        avg_fps = self.frame_count / runtime if runtime > 0 else 0
        
        print("\n📊 Performance Summary:")
        print(f"  Runtime: {runtime:.1f}s")
        print(f"  Total Frames: {self.frame_count}")
        print(f"  Average FPS: {avg_fps:.1f}")
        print(f"  Target FPS: {self.window_handler.fps_limit}")
        
        final_stats = self.window_handler.get_performance_stats()
        print(f"  Final Pulse Time: {final_stats['avg_pulse_time_ms']:.1f}ms")
        print(f"  Cached Patterns: {final_stats['cached_patterns']}")
        print(f"  Cached Sprites: {final_stats['cached_sprites']}")


def main():
    """Main entry point"""
    print("🚀 Smooth Demo - ADR 108 Performance Test")
    print("=" * 60)
    print("🎯 Testing Dedicated Tkinter Handler Performance")
    print("📊 Features:")
    print("  • 60Hz dedicated pulse loop")
    print("  • Thread-safe command queue")
    print("  • Pre-cached raster patterns")
    print("  • Input interceptor for stuck key prevention")
    print("  • Real-time performance monitoring")
    print("")
    print("🎮 Demo Features:")
    print("  • Smooth Voyager movement with physics")
    print("  • Animated grass background")
    print("  • Dynamic shadows")
    print("  • Particle effects")
    print("  • Performance overlay")
    print("")
    print("Controls:")
    print("  WASD - Move Voyager (smooth acceleration)")
    print("  ESC  - Quit demo")
    print("")
    
    # Create and run demo
    demo = SmoothDemo()
    demo.run()


if __name__ == "__main__":
    main()
