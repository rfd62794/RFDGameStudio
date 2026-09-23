"""
Fixed Harvested Assets Demo - PIL-First Architecture
Tests the complete pipeline with proper image handling
"""

import tkinter as tk
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional
import math
import time

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.handler import create_dgt_window_handler, RenderCommand, CommandType
from dgt_tiny_farm_loader import DGTCompatibleTinyFarmLoader
from loguru import logger


class FixedHarvestedAssetsDemo:
    """
    Fixed demo using PIL-First architecture and DGT-compatible loader
    Prevents namespace collisions and garbage collection issues
    """
    
    def __init__(self):
        # Initialize window
        self.root = tk.Tk()
        self.root.title("🔧 Fixed Harvested Assets Demo - PIL-First Architecture")
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
        
        # Animation state
        self.animation_time = 0
        self.current_asset_index = 0
        
        # Load harvested assets with corrected loader
        self.tiny_farm_loader = DGTCompatibleTinyFarmLoader(Path('assets/tiny_farm'))
        self._load_tiny_farm_assets()
        
        # Create demo sprites
        self._create_demo_sprites()
        
        # Setup UI
        self._setup_ui()
        
        # Set game update callback
        self.window_handler.set_game_update_callback(self.game_update)
        
        print("🔧 Fixed Harvested Assets Demo Initialized")
        print("🎯 PIL-First Architecture - No namespace collisions!")
    
    def _load_tiny_farm_assets(self) -> None:
        """Load Tiny Farm assets using the corrected loader"""
        try:
            # Load key assets
            key_sheets = [
                'Objects/chest.png',
                'Objects/Maple Tree.png', 
                'Objects/Spring Crops.png',
                'Character/Idle.png'
            ]
            
            total_loaded = 0
            for sheet in key_sheets:
                try:
                    self.tiny_farm_loader.harvest_sheet(sheet)
                    total_loaded += len(self.tiny_farm_loader.pil_registry)
                    print(f"✅ Loaded {sheet}: {len(self.tiny_farm_loader.pil_registry)} tiles")
                except Exception as e:
                    print(f"⚠️ Could not load {sheet}: {e}")
            
            # Integrate with DGT handler
            integrated = self.tiny_farm_loader.integrate_with_dgt_handler(self.window_handler)
            print(f"🎯 Integrated {integrated} sprites with DGT handler")
            
        except Exception as e:
            logger.error(f"⚠️ Error loading Tiny Farm assets: {e}")
    
    def _create_demo_sprites(self) -> None:
        """Create demo sprites"""
        from PIL import Image, ImageTk, ImageDraw
        
        # Create fallback Voyager if not loaded
        if 'Idle_0_0' not in self.window_handler.raster_cache.sprite_cache:
            # Create 32x32 Voyager sprite
            voyager_image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
            draw = ImageDraw.Draw(voyager_image)
            
            # Draw simple green triangle character
            draw.polygon([(16, 4), (4, 28), (28, 28)], fill=(0, 255, 0, 255))
            
            # Scale for display
            scaled_image = voyager_image.resize((128, 128), Image.Resampling.NEAREST)
            tk_sprite = ImageTk.PhotoImage(scaled_image)
            
            # Cache in handler
            self.window_handler.raster_cache.cache_sprite('voyager', tk_sprite)
            print("🚶 Created fallback Voyager sprite")
    
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
            text="Assets: 0",
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
            text="✅ PIL-First Architecture - No Namespace Collisions!",
            font=("Courier", 10),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        self.status_label.pack(side=tk.LEFT, padx=10)
        
        # Instructions
        instructions = [
            "🎮 Controls: WASD to move",
            "🔧 Fixed: PIL-First prevents PhotoImage namespace collisions",
            "📦 Real pixels hitting the screen - no more black boxes!"
        ]
        
        for instruction in instructions:
            tk.Label(
                self.root,
                text=instruction,
                font=("Courier", 9),
                fg='#cccccc',
                bg='#1a1a1a'
            ).pack(pady=2)
    
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
        self.voyager_x = max(32, min(768, self.voyager_x))
        self.voyager_y = max(32, min(468, self.voyager_y))
        
        # Update animations
        self.animation_time += 0.1
        
        # Queue render commands
        self._queue_render()
        
        # Update performance display
        self._update_performance_display()
        
        self.frame_count += 1
    
    def _queue_render(self) -> None:
        """Queue render commands for fixed asset display"""
        # Clear canvas command
        clear_command = RenderCommand(command_type=CommandType.CLEAR)
        self.window_handler.queue_command(clear_command)
        
        # Draw background pattern
        self._draw_background_pattern()
        
        # Draw Tiny Farm assets
        self._draw_tiny_farm_assets()
        
        # Draw Voyager
        self._draw_voyager()
        
        # Draw performance text
        fps_text = f"FPS: {self.window_handler.actual_fps}"
        text_command = RenderCommand(
            command_type=CommandType.DRAW_TEXT,
            entity_id="fps_text",
            position=(10, 10),
            text=fps_text
        )
        self.window_handler.queue_command(text_command)
    
    def _draw_background_pattern(self) -> None:
        """Draw a subtle background pattern"""
        # Create checkerboard pattern
        for y in range(0, 500, 32):
            for x in range(0, 800, 32):
                if ((x // 32) + (y // 32)) % 2 == 0:
                    rect_command = RenderCommand(
                        command_type=CommandType.DRAW_RECT,
                        entity_id=f"bg_{x}_{y}",
                        position=(x, y),
                        size=(32, 32),
                        color='#0f0f0f'
                    )
                    self.window_handler.queue_command(rect_command)
    
    def _draw_tiny_farm_assets(self) -> None:
        """Draw Tiny Farm assets in a circle pattern"""
        asset_ids = list(self.window_handler.raster_cache.sprite_cache.keys())
        
        # Filter out Voyager and system sprites
        game_assets = [aid for aid in asset_ids if aid.startswith(('chest_', 'Maple', 'Spring', 'Idle_'))]
        
        if not game_assets:
            return
        
        # Draw assets in a circle
        num_assets = min(len(game_assets), 8)
        radius = 150
        
        for i in range(num_assets):
            angle = (i * 2 * math.pi / num_assets) + self.animation_time
            x = 400 + math.cos(angle) * radius
            y = 250 + math.sin(angle) * radius
            
            asset_id = game_assets[i % len(game_assets)]
            sprite = self.window_handler.raster_cache.get_sprite(asset_id)
            
            if sprite:
                sprite_command = RenderCommand(
                    command_type=CommandType.DRAW_SPRITE,
                    entity_id=f"asset_{i}",
                    position=(x - sprite.width() // 2, y - sprite.height() // 2),
                    sprite_id=asset_id
                )
                self.window_handler.queue_command(sprite_command)
    
    def _draw_voyager(self) -> None:
        """Draw the Voyager character"""
        voyager_sprite = self.window_handler.raster_cache.get_sprite('voyager')
        if voyager_sprite:
            voyager_command = RenderCommand(
                command_type=CommandType.DRAW_SPRITE,
                entity_id="voyager",
                position=(self.voyager_x - voyager_sprite.width() // 2, 
                         self.voyager_y - voyager_sprite.height() // 2),
                sprite_id="voyager"
            )
            self.window_handler.queue_command(voyager_command)
    
    def _update_performance_display(self) -> None:
        """Update performance UI elements"""
        current_time = time.time()
        
        # Update FPS display
        if current_time - self.start_time >= 0.5:  # Update every 500ms
            stats = self.window_handler.get_performance_stats()
            
            self.fps_label.config(text=f"FPS: {stats['actual_fps']}")
            self.perf_label.config(
                text=f"Assets: {len(self.window_handler.raster_cache.sprite_cache)} | Cached: {stats['cached_sprites']}"
            )
            
            self.start_time = current_time
    
    def run(self) -> None:
        """Start the fixed harvested assets demo"""
        print("🔧 Starting Fixed Harvested Assets Demo...")
        print("🎯 PIL-First Architecture - Real pixels on screen!")
        print("🎮 Controls: WASD to move")
        print("")
        
        # Start the dedicated handler
        self.window_handler.start()
        
        # Run tkinter main loop
        self.root.mainloop()
        
        # Cleanup
        self.window_handler.stop()
        
        # Print final stats
        runtime = time.time() - self.start_time if hasattr(self, 'start_time') else 0
        avg_fps = self.frame_count / runtime if runtime > 0 else 0
        
        print("\n📊 Performance Summary:")
        print(f"  Runtime: {runtime:.1f}s")
        print(f"  Total Frames: {self.frame_count}")
        print(f"  Average FPS: {avg_fps:.1f}")
        print(f"  Assets Loaded: {len(self.window_handler.raster_cache.sprite_cache)}")
        print(f"  Target FPS: {self.window_handler.fps_limit}")
        print("✅ PIL-First Architecture - No Black Box Failure!")


def main():
    """Main entry point"""
    print("🔧 Fixed Harvested Assets Demo - PIL-First Architecture")
    print("=" * 60)
    print("🎯 Fixes:")
    print("  • PIL-First: Prevents PhotoImage namespace collisions")
    print("  • DGT Integration: Prevents garbage collection issues")
    print("  • Real Pixels: No more black boxes on screen")
    print("  • Proper Imports: Fixed Set type and namespace issues")
    print("")
    print("🎮 Controls:")
    print("  WASD - Move Voyager")
    print("  ESC  - Quit demo")
    print("")
    
    # Create and run demo
    demo = FixedHarvestedAssetsDemo()
    demo.run()


if __name__ == "__main__":
    main()
