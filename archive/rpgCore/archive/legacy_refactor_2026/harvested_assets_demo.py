"""
Harvested Assets Demo - ADR 111 Integration Test
Tests the complete pipeline: harvested assets → DGT engines → rendering
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
from loguru import logger


class HarvestedAssetsDemo:
    """
    Demo showcasing harvested Tiny Farm assets in the DGT engine
    Tests ADR 111 semantic triage integration
    """
    
    def __init__(self):
        # Initialize window
        self.root = tk.Tk()
        self.root.title("🍪 Harvested Assets Demo - ADR 111 Integration")
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
        self.particle_time = 0
        self.current_asset_index = 0
        
        # Load harvested assets
        self.harvested_assets = self._load_harvested_assets()
        
        # Create demo sprites
        self._create_demo_sprites()
        
        # Setup UI
        self._setup_ui()
        
        # Set game update callback
        self.window_handler.set_game_update_callback(self.game_update)
        
        print("🍪 Harvested Assets Demo Initialized")
        print(f"📊 Loaded {len(self.harvested_assets)} harvested assets")
    
    def _load_harvested_assets(self) -> Dict[str, Dict]:
        """Load harvested assets from assets/harvested directory"""
        harvested_dir = Path("assets/harvested")
        assets = {}
        
        if not harvested_dir.exists():
            logger.warning("⚠️ assets/harvested directory not found")
            return assets
        
        # Load all YAML metadata files
        for yaml_file in harvested_dir.glob("*.yaml"):
            try:
                import yaml
                with open(yaml_file, 'r') as f:
                    metadata = yaml.safe_load(f)
                
                asset_id = metadata.get('object_id')
                if asset_id:
                    assets[asset_id] = metadata
                    logger.debug(f"📋 Loaded metadata: {asset_id}")
                
            except Exception as e:
                logger.error(f"⚠️ Error loading {yaml_file}: {e}")
        
        logger.info(f"📚 Loaded {len(assets)} harvested asset metadata files")
        return assets
    
    def _create_demo_sprites(self) -> None:
        """Create demo sprites from harvested assets"""
        from PIL import Image, ImageTk
        
        # Cache harvested sprites in handler
        for asset_id, metadata in self.harvested_assets.items():
            sprite_path = Path(metadata.get('sprite_path', ''))
            
            if sprite_path.exists():
                try:
                    # Load sprite image
                    sprite_image = Image.open(sprite_path)
                    
                    # Scale for display (4x)
                    scaled_image = sprite_image.resize(
                        (sprite_image.width * 4, sprite_image.height * 4),
                        Image.Resampling.NEAREST
                    )
                    
                    # Convert to tkinter PhotoImage
                    tk_sprite = ImageTk.PhotoImage(scaled_image)
                    
                    # Cache in handler
                    self.window_handler.raster_cache.cache_sprite(asset_id, tk_sprite)
                    
                    logger.debug(f"🎨 Cached sprite: {asset_id}")
                    
                except Exception as e:
                    logger.error(f"⚠️ Error caching sprite {asset_id}: {e}")
        
        # Create Voyager sprite if not available
        if 'voyager_0_0' not in self.harvested_assets:
            self._create_fallback_voyager()
        
        logger.info(f"🎨 Cached {len(self.window_handler.raster_cache.sprite_cache)} sprites")
    
    def _create_fallback_voyager(self) -> None:
        """Create fallback Voyager sprite"""
        from PIL import Image, ImageTk, ImageDraw
        
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
        
        # Add to harvested assets
        self.harvested_assets['voyager'] = {
            'object_id': 'voyager',
            'object_type': 'entity',
            'material_id': 'organic',
            'collision': False,
            'tags': ['player', 'interactive']
        }
        
        logger.info("🚶 Created fallback Voyager sprite")
    
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
            text="Cycling through harvested assets...",
            font=("Courier", 10),
            fg='#ffff00',
            bg='#2a2a2a'
        )
        self.status_label.pack(side=tk.LEFT, padx=10)
        
        self.asset_label = tk.Label(
            self.status_frame,
            text="Asset: None",
            font=("Courier", 10),
            fg='#ffffff',
            bg='#2a2a2a'
        )
        self.asset_label.pack(side=tk.RIGHT, padx=10)
        
        # Controls frame
        self.controls_frame = tk.Frame(self.root, bg='#2a2a2a')
        self.controls_frame.pack(fill=tk.X, padx=20, pady=(0, 10))
        
        tk.Button(
            self.controls_frame,
            text="Next Asset (N)",
            command=self._next_asset,
            bg='#4CAF50',
            fg='white'
        ).pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            self.controls_frame,
            text="Previous Asset (P)",
            command=self._prev_asset,
            bg='#2196F3',
            fg='white'
        ).pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            self.controls_frame,
            text="Random Asset (R)",
            command=self._random_asset,
            bg='#FF9800',
            fg='white'
        ).pack(side=tk.LEFT, padx=5)
        
        # Instructions
        instructions = [
            "🎮 Controls: WASD to move, N/P/R to cycle assets",
            "🍪 Showing harvested Tiny Farm assets with ADR 111 metadata",
            "🧠 Smart detection: chests, trees, crops, materials"
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
        
        # Handle asset cycling
        if 'n' in pressed_keys:
            self._next_asset()
        if 'p' in pressed_keys:
            self._prev_asset()
        if 'r' in pressed_keys:
            self._random_asset()
        
        # Update animations
        self.animation_time += 0.1
        self.particle_time += 0.1
        
        # Queue render commands
        self._queue_render()
        
        # Update performance display
        self._update_performance_display()
        
        self.frame_count += 1
    
    def _queue_render(self) -> None:
        """Queue render commands for harvested assets display"""
        # Clear canvas command
        clear_command = RenderCommand(command_type=CommandType.CLEAR)
        self.window_handler.queue_command(clear_command)
        
        # Draw background pattern
        self._draw_background_pattern()
        
        # Draw harvested assets in a grid
        self._draw_asset_grid()
        
        # Draw Voyager
        self._draw_voyager()
        
        # Draw current asset info
        self._draw_asset_info()
        
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
    
    def _draw_asset_grid(self) -> None:
        """Draw harvested assets in a grid layout"""
        if not self.harvested_assets:
            return
        
        # Get current asset
        asset_ids = list(self.harvested_assets.keys())
        if not asset_ids:
            return
        
        current_asset_id = asset_ids[self.current_asset_index % len(asset_ids)]
        current_metadata = self.harvested_assets[current_asset_id]
        
        # Draw asset in center
        sprite = self.window_handler.raster_cache.get_sprite(current_asset_id)
        if sprite:
            # Calculate centered position
            sprite_x = 400 - sprite.width() // 2
            sprite_y = 200 - sprite.height() // 2
            
            sprite_command = RenderCommand(
                command_type=CommandType.DRAW_SPRITE,
                entity_id="current_asset",
                position=(sprite_x, sprite_y),
                sprite_id=current_asset_id
            )
            self.window_handler.queue_command(sprite_command)
        
        # Draw surrounding assets in a circle
        num_surrounding = 8
        radius = 150
        
        for i in range(num_surrounding):
            angle = (i * 2 * math.pi / num_surrounding) + self.animation_time
            x = 400 + math.cos(angle) * radius
            y = 250 + math.sin(angle) * radius
            
            # Get a different asset for each position
            asset_index = (self.current_asset_index + i + 1) % len(asset_ids)
            asset_id = asset_ids[asset_index]
            surrounding_sprite = self.window_handler.raster_cache.get_sprite(asset_id)
            
            if surrounding_sprite:
                sprite_command = RenderCommand(
                    command_type=CommandType.DRAW_SPRITE,
                    entity_id=f"surrounding_{i}",
                    position=(x - surrounding_sprite.width() // 2, y - surrounding_sprite.height() // 2),
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
    
    def _draw_asset_info(self) -> None:
        """Draw information about the current asset"""
        asset_ids = list(self.harvested_assets.keys())
        if not asset_ids:
            return
        
        current_asset_id = asset_ids[self.current_asset_index % len(asset_ids)]
        metadata = self.harvested_assets[current_asset_id]
        
        # Create info text
        info_lines = [
            f"Asset: {current_asset_id}",
            f"Type: {metadata.get('object_type', 'unknown')}",
            f"Material: {metadata.get('material_id', 'unknown')}",
            f"Collision: {metadata.get('collision', False)}",
            f"Tags: {', '.join(metadata.get('tags', []))}",
            f"Source: {metadata.get('source', 'unknown')}"
        ]
        
        y_offset = 350
        for i, line in enumerate(info_lines):
            text_command = RenderCommand(
                command_type=CommandType.DRAW_TEXT,
                entity_id=f"info_{i}",
                position=(10, y_offset + i * 15),
                text=line
            )
            self.window_handler.queue_command(text_command)
    
    def _next_asset(self) -> None:
        """Cycle to next asset"""
        self.current_asset_index += 1
        asset_ids = list(self.harvested_assets.keys())
        if asset_ids:
            current_id = asset_ids[self.current_asset_index % len(asset_ids)]
            metadata = self.harvested_assets[current_id]
            self.asset_label.config(text=f"Asset: {current_id} ({metadata.get('object_type', 'unknown')})")
    
    def _prev_asset(self) -> None:
        """Cycle to previous asset"""
        self.current_asset_index -= 1
        asset_ids = list(self.harvested_assets.keys())
        if asset_ids:
            current_id = asset_ids[self.current_asset_index % len(asset_ids)]
            metadata = self.harvested_assets[current_id]
            self.asset_label.config(text=f"Asset: {current_id} ({metadata.get('object_type', 'unknown')})")
    
    def _random_asset(self) -> None:
        """Jump to random asset"""
        import random
        asset_ids = list(self.harvested_assets.keys())
        if asset_ids:
            self.current_asset_index = random.randint(0, len(asset_ids) - 1)
            current_id = asset_ids[self.current_asset_index]
            metadata = self.harvested_assets[current_id]
            self.asset_label.config(text=f"Asset: {current_id} ({metadata.get('object_type', 'unknown')})")
    
    def _update_performance_display(self) -> None:
        """Update performance UI elements"""
        current_time = time.time()
        
        # Update FPS display
        if current_time - self.start_time >= 0.5:  # Update every 500ms
            stats = self.window_handler.get_performance_stats()
            
            self.fps_label.config(text=f"FPS: {stats['actual_fps']}")
            self.perf_label.config(
                text=f"Assets: {len(self.harvested_assets)} | Cached: {stats['cached_sprites']}"
            )
            
            self.start_time = current_time
    
    def run(self) -> None:
        """Start the harvested assets demo"""
        print("🍪 Starting Harvested Assets Demo...")
        print("📊 Testing ADR 111 integration with DGT engines")
        print("🎮 Controls: WASD to move, N/P/R to cycle assets")
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
        print(f"  Assets Loaded: {len(self.harvested_assets)}")
        print(f"  Target FPS: {self.window_handler.fps_limit}")


def main():
    """Main entry point"""
    print("🍪 Harvested Assets Demo - ADR 111 Integration Test")
    print("=" * 60)
    print("🎯 Testing complete pipeline: harvested assets → DGT engines")
    print("🧠 Features:")
    print("  • ADR 111 semantic triage integration")
    print("  • Smart asset classification")
    print("  • Dynamic asset cycling")
    print("  • Performance monitoring")
    print("")
    print("🎮 Controls:")
    print("  WASD - Move Voyager")
    print("  N/P/R - Next/Previous/Random asset")
    print("  ESC  - Quit demo")
    print("")
    
    # Create and run demo
    demo = HarvestedAssetsDemo()
    demo.run()


if __name__ == "__main__":
    main()
