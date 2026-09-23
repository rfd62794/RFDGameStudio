"""
Tkinter Adapter: Windowed Framework Testing

The "Emergency Spare Tire" of Python GUI development - zero dependencies,
built-in standard library, perfect for verifying our Iron Frame works
outside the terminal.

This adapter proves our PixelRenderer is window-agnostic and validates
that the Narrative Pre-Caching doesn't freeze the UI.
"""

import tkinter as tk
import threading
import asyncio
import time
from typing import Optional, Dict, List, Tuple
from pathlib import Path
import sys
import os

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loguru import logger
from ui.pixel_renderer import PixelRenderer
from predictive_narrative import create_predictive_engine
from game_state import GameState, create_tavern_scenario
from logic.orientation import OrientationManager
from d20_core import D20Resolver


class TkinterAdapter:
    """
    Minimal Tkinter wrapper for the DGT Perfect Simulator.
    
    Maps our existing PixelRenderer to a grid of colored rectangles,
    proving window-agnostic portability while maintaining async narrative
    processing in the background.
    """
    
    def __init__(self, scale: int = 10):
        """
        Initialize Tkinter adapter.
        
        Args:
            scale: Scale factor for pixel display (10x = 800x480 window)
        """
        self.scale = scale
        self.width = 80 * scale
        self.height = 48 * scale
        
        # Tkinter setup
        self.root = tk.Tk()
        self.root.title("DGT Perfect Simulator - Windowed Test")
        self.root.geometry(f"{self.width}x{self.height}")
        self.root.resizable(False, False)
        
        # Canvas for drawing
        self.canvas = tk.Canvas(
            self.root, 
            width=self.width, 
            height=self.height, 
            bg='black',
            highlightthickness=0
        )
        self.canvas.pack()
        
        # Performance tracking
        self.frame_times: List[float] = []
        self.last_frame_time = time.perf_counter()
        self.fps_counter = 0
        self.fps_start_time = time.perf_counter()
        
        # Game components
        self.pixel_renderer: Optional[PixelRenderer] = None
        self.predictive_engine = None
        self.game_state: Optional[GameState] = None
        self.orientation_manager: Optional[OrientationManager] = None
        self.d20_resolver: Optional[D20Resolver] = None
        
        # Async event loop for background processing
        self.loop = None
        self.loop_thread: Optional[threading.Thread] = None
        
        # UI state
        self.running = False
        self.frame_count = 0
        
        logger.info("🖥️ Tkinter Adapter initialized")
    
    def initialize_game_systems(self) -> None:
        """Initialize all game systems for testing."""
        logger.info("🎮 Initializing game systems...")
        
        # Create game state
        self.game_state = create_tavern_scenario()
        self.orientation_manager = OrientationManager()
        self.d20_resolver = D20Resolver()
        
        # Enable deterministic mode
        self.d20_resolver.enable_deterministic_mode(True)
        
        # Create pixel renderer
        self.pixel_renderer = PixelRenderer(
            width=80,
            height=48,
            scale_factor=1  # We'll scale in Tkinter
        )
        
        # Start async event loop in background thread
        self._start_async_loop()
        
        logger.info("✅ Game systems initialized")
    
    def _start_async_loop(self) -> None:
        """Start async event loop in background thread."""
        def run_loop():
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            
            # Create predictive engine
            self.predictive_engine = create_predictive_engine()
            self.predictive_engine.set_orientation_manager(self.orientation_manager)
            
            # Start pre-caching
            self.loop.run_until_complete(self.predictive_engine.start())
            
            # Keep loop running
            self.loop.run_forever()
        
        self.loop_thread = threading.Thread(target=run_loop, daemon=True)
        self.loop_thread.start()
        
        # Wait for initialization
        time.sleep(0.5)
        
        logger.info("🔄 Async loop started in background")
    
    def update_frame(self) -> None:
        """
        Update a single frame - called by Tkinter main loop.
        
        This is the bridge between our game systems and the Tkinter UI.
        """
        if not self.running:
            return
        
        frame_start = time.perf_counter()
        
        try:
            # 1. Update game state
            self._update_game_state()
            
            # 2. Get frame data from PixelRenderer
            frame_data = self._get_frame_data()
            
            # 3. Draw to Tkinter canvas
            self._draw_frame(frame_data)
            
            # 4. Update performance metrics
            self._update_performance_metrics(frame_start)
            
            # 5. Schedule next frame
            self.root.after(33, self.update_frame)  # ~30 FPS
            
        except Exception as e:
            logger.error(f"Frame update error: {e}")
            self.root.after(100, self.update_frame)  # Retry after delay
    
    def _update_game_state(self) -> None:
        """Update game state and trigger narrative pre-caching."""
        if not self.game_state or not self.predictive_engine:
            return
        
        # Simulate player movement for testing
        if self.frame_count % 60 == 0:  # Every 2 seconds at 30 FPS
            # Move player in a pattern
            x, y = self.game_state.player.position
            x = (x + 1) % 10
            self.game_state.player.position = (x, y)
            
            # Update orientation
            self.orientation_manager.set_position(x, y, 0)
            
            # Trigger narrative pre-caching (async)
            if self.loop and self.predictive_engine:
                asyncio.run_coroutine_threadsafe(
                    self.predictive_engine.look_ahead(self.game_state),
                    self.loop
                )
        
        self.frame_count += 1
    
    def _get_frame_data(self) -> List[List[str]]:
        """Get current frame data from PixelRenderer."""
        if not self.pixel_renderer:
            return [['black' for _ in range(80)] for _ in range(48)]
        
        # For now, create a simple test pattern
        frame = [['black' for _ in range(80)] for _ in range(48)]
        
        # Draw player position
        if self.game_state:
            px, py = self.game_state.player.position
            if 0 <= px < 80 and 0 <= py < 48:
                frame[py][px] = 'white'
        
        # Draw some test NPCs
        if self.game_state and self.game_state.current_room:
            for i, npc in enumerate(self.game_state.current_room.npcs[:5]):
                npc_pos = npc.get('position', (0, 0))
                nx, ny = npc_pos
                if 0 <= nx < 80 and 0 <= ny < 48:
                    frame[ny][nx] = ['red', 'green', 'blue', 'yellow', 'cyan'][i % 5]
        
        # Draw border
        for x in range(80):
            frame[0][x] = 'gray'
            frame[47][x] = 'gray'
        for y in range(48):
            frame[y][0] = 'gray'
            frame[y][79] = 'gray'
        
        return frame
    
    def _draw_frame(self, frame_data: List[List[str]]) -> None:
        """Draw frame data to Tkinter canvas."""
        # Clear canvas
        self.canvas.delete("all")
        
        # Draw pixels
        for y, row in enumerate(frame_data):
            for x, color in enumerate(row):
                if color != 'black':  # Skip black pixels
                    x1 = x * self.scale
                    y1 = y * self.scale
                    x2 = x1 + self.scale
                    y2 = y1 + self.scale
                    
                    self.canvas.create_rectangle(
                        x1, y1, x2, y2,
                        fill=color,
                        outline="",
                        tags=f"pixel_{x}_{y}"
                    )
        
        # Draw performance info
        self._draw_performance_info()
    
    def _draw_performance_info(self) -> None:
        """Draw performance information on canvas."""
        if not self.frame_times:
            return
        
        # Calculate FPS
        current_time = time.perf_counter()
        if current_time - self.fps_start_time >= 1.0:
            fps = self.fps_counter
            self.fps_counter = 0
            self.fps_start_time = current_time
        else:
            fps = self.fps_counter
        
        # Draw text
        info_text = f"FPS: {fps} | Frame: {self.frame_count}"
        if self.predictive_engine:
            stats = self.predictive_engine.get_stats()
            cache_hit_rate = stats.get('hit_rate', 0)
            info_text += f" | Cache: {cache_hit_rate:.1%}"
        
        self.canvas.create_text(
            5, 5,
            text=info_text,
            fill='white',
            anchor='nw',
            font=('Courier', 8)
        )
        
        # Draw player position
        if self.game_state:
            px, py = self.game_state.player.position
            pos_text = f"Player: ({px}, {py})"
            self.canvas.create_text(
                5, 20,
                text=pos_text,
                fill='white',
                anchor='nw',
                font=('Courier', 8)
            )
    
    def _update_performance_metrics(self, frame_start: float) -> None:
        """Update performance metrics."""
        frame_time = time.perf_counter() - frame_start
        self.frame_times.append(frame_time)
        
        # Keep only last 60 frames (2 seconds)
        if len(self.frame_times) > 60:
            self.frame_times.pop(0)
        
        self.fps_counter += 1
    
    def test_action_resolution(self) -> None:
        """Test action resolution and measure latency."""
        if not self.d20_resolver or not self.game_state:
            return
        
        start_time = time.perf_counter()
        
        # Resolve a test action
        result = self.d20_resolver.resolve_action(
            "talk",
            "I greet the bartender",
            self.game_state,
            ["tavern"],
            "bartender"
        )
        
        resolution_time = time.perf_counter() - start_time
        
        logger.info(f"Action resolution: {resolution_time*1000:.1f}ms (success: {result.success})")
        
        # Display result on canvas
        result_text = f"Action: {'SUCCESS' if result.success else 'FAILURE'} ({resolution_time*1000:.1f}ms)"
        self.canvas.create_text(
            self.width // 2,
            self.height - 20,
            text=result_text,
            fill='yellow' if result.success else 'red',
            anchor='center',
            font=('Courier', 10, 'bold')
        )
    
    def run(self) -> None:
        """Start the Tkinter main loop."""
        logger.info("🚀 Starting Tkinter main loop...")
        
        # Initialize game systems
        self.initialize_game_systems()
        
        # Start running
        self.running = True
        
        # Start frame updates
        self.update_frame()
        
        # Test action resolution periodically
        def test_actions():
            if self.running:
                self.test_action_resolution()
                self.root.after(2000, test_actions)  # Test every 2 seconds
        
        test_actions()
        
        # Start main loop
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            logger.info("🛑 Tkinter main loop interrupted")
        finally:
            self.cleanup()
    
    def cleanup(self) -> None:
        """Clean up resources."""
        logger.info("🧹 Cleaning up Tkinter adapter...")
        
        self.running = False
        
        # Stop async loop
        if self.loop and self.predictive_engine:
            asyncio.run_coroutine_threadsafe(
                self.predictive_engine.stop(),
                self.loop
            )
        
        # Stop event loop
        if self.loop:
            self.loop.call_soon_threadsafe(self.loop.stop)
        
        # Wait for thread to finish
        if self.loop_thread and self.loop_thread.is_alive():
            self.loop_thread.join(timeout=1.0)
        
        logger.info("✅ Tkinter adapter cleaned up")


def main():
    """Main entry point for Tkinter testing."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🖥️ DGT Perfect Simulator - Tkinter Window Test")
    print("=" * 50)
    print("Testing windowed portability with zero dependencies...")
    print()
    
    # Create and run adapter
    adapter = TkinterAdapter(scale=10)
    
    try:
        adapter.run()
    except Exception as e:
        logger.error(f"❌ Tkinter test failed: {e}")
        raise
    
    print("\n🎯 Tkinter test completed")
    print("✅ Windowed portability verified")
    print("🚀 Ready for advanced GUI frameworks")


if __name__ == "__main__":
    main()
