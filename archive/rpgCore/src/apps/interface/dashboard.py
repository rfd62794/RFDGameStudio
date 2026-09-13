"""
Sovereign Dashboard - Modular Workspace Interface
ADR 206: Modular Dashboard for AI Pilot Development

Professional IDE-style workspace for AI pilot training and observation.
Maintains 160x144 sovereign resolution with dynamic scaling and widget layout.
"""

import pygame
import sys
import math
import tkinter as tk
from tkinter import ttk, scrolledtext
import threading
import time
from typing import Dict, List, Any, Optional, Tuple, Callable
from pathlib import Path
from loguru import logger

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from apps.space.combatant_evolution import CombatantEvolution, CombatantPilot


class SovereignViewport:
    """Dedicated 160x144 viewport with integer scaling"""
    
    def __init__(self, parent_frame: tk.Widget):
        self.parent_frame = parent_frame
        self.scale_factor = 1
        self.viewport_width = SOVEREIGN_WIDTH
        self.viewport_height = SOVEREIGN_HEIGHT
        
        # Create pygame surface
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Create tkinter canvas for display
        self.canvas = tk.Canvas(
            parent_frame,
            width=self.viewport_width,
            height=self.viewport_height,
            bg='black',
            highlightthickness=2,
            highlightbackground='cyan'
        )
        self.canvas.pack(padx=5, pady=5)
        
        # Game instance
        self.game: Optional[CombatantEvolution] = None
        self.running = False
        
        # Performance tracking
        self.fps_history = []
        self.last_frame_time = 0
        
        logger.info("🎮 SovereignViewport initialized")
    
    def calculate_optimal_scaling(self, available_width: int, available_height: int) -> int:
        """Calculate optimal integer scaling factor"""
        # Calculate maximum scale that fits
        width_scale = available_width // SOVEREIGN_WIDTH
        height_scale = available_height // SOVEREIGN_HEIGHT
        
        # Use the smaller scale to ensure full visibility
        optimal_scale = min(width_scale, height_scale, 4)  # Cap at 4x for performance
        
        return max(1, optimal_scale)  # Minimum 1x scale
    
    def update_layout(self, width: int, height: int) -> None:
        """Update viewport layout with new dimensions"""
        new_scale = self.calculate_optimal_scaling(width, height)
        
        if new_scale != self.scale_factor:
            self.scale_factor = new_scale
            self.viewport_width = SOVEREIGN_WIDTH * self.scale_factor
            self.viewport_height = SOVEREIGN_HEIGHT * self.scale_factor
            
            # Update canvas size
            self.canvas.config(width=self.viewport_width, height=self.viewport_height)
            
            logger.info(f"📐 Viewport scaled to {self.scale_factor}x ({self.viewport_width}x{self.viewport_height})")
    
    def initialize_game(self) -> Result[bool]:
        """Initialize the combatant evolution game"""
        try:
            self.game = CombatantEvolution()
            self.running = True
            
            # Start game thread
            game_thread = threading.Thread(target=self._game_loop, daemon=True)
            game_thread.start()
            
            logger.info("🎮 Game initialized in viewport")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Failed to initialize game: {e}")
    
    def _game_loop(self) -> None:
        """Game loop running in separate thread"""
        clock = pygame.time.Clock()
        
        while self.running and self.game:
            try:
                # Update game
                self.game.update_game_state()
                
                # Render to surface
                self.game.render_game()
                
                # Copy to our surface
                self.game_surface.blit(self.game.game_surface, (0, 0))
                
                # Update display
                self._update_display()
                
                # Control frame rate
                clock.tick(60)
                
                # Track performance
                current_time = time.time()
                if self.last_frame_time > 0:
                    frame_time = current_time - self.last_frame_time
                    fps = 1.0 / frame_time if frame_time > 0 else 60.0
                    self.fps_history.append(fps)
                    if len(self.fps_history) > 60:
                        self.fps_history.pop(0)
                self.last_frame_time = current_time
                
            except Exception as e:
                logger.error(f"Game loop error: {e}")
                break
    
    def _update_display(self) -> None:
        """Update tkinter canvas with pygame surface"""
        try:
            # Convert pygame surface to PIL Image
            import PIL.Image
            import PIL.ImageTk
            
            # Convert surface to RGB
            w, h = self.game_surface.get_size()
            raw_str = pygame.image.tostring(self.game_surface, 'RGB', False)
            pil_image = PIL.Image.frombytes('RGB', (w, h), raw_str)
            
            # Scale if needed
            if self.scale_factor > 1:
                new_size = (w * self.scale_factor, h * self.scale_factor)
                pil_image = pil_image.resize(new_size, PIL.Image.NEAREST)
            
            # Convert to PhotoImage
            photo = PIL.ImageTk.PhotoImage(pil_image)
            
            # Update canvas
            self.canvas.delete("all")
            self.canvas.create_image(0, 0, anchor=tk.NW, image=photo)
            self.canvas.image = photo  # Keep reference
            
        except ImportError:
            # Fallback: simple text display
            self.canvas.delete("all")
            self.canvas.create_text(
                self.viewport_width // 2,
                self.viewport_height // 2,
                text="Game Running\n(PIL not available)",
                fill="white",
                font=("Arial", 12)
            )
        except Exception as e:
            logger.error(f"Display update error: {e}")
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get viewport performance statistics"""
        if not self.fps_history:
            return {
                'avg_fps': 0.0,
                'min_fps': 0.0,
                'max_fps': 0.0,
                'scale_factor': self.scale_factor
            }
        
        return {
            'avg_fps': sum(self.fps_history) / len(self.fps_history),
            'min_fps': min(self.fps_history),
            'max_fps': max(self.fps_history),
            'scale_factor': self.scale_factor
        }
    
    def stop_game(self) -> None:
        """Stop the game"""
        self.running = False
        if self.game:
            self.game.cleanup()
            self.game = None


class ControlPanel:
    """Control panel for AI pilot management"""
    
    def __init__(self, parent_frame: tk.Widget, viewport: SovereignViewport):
        self.parent_frame = parent_frame
        self.viewport = viewport
        
        # Create main frame
        self.frame = ttk.LabelFrame(parent_frame, text="AI Control Panel", padding=10)
        self.frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Control variables
        self.energy_infinite = tk.BooleanVar(value=False)
        self.generation_var = tk.IntVar(value=0)
        self.training_speed = tk.DoubleVar(value=1.0)
        self.hard_bounds = tk.BooleanVar(value=False)
        
        # Create controls
        self._create_controls()
        
        logger.info("🎛️ ControlPanel initialized")
    
    def _create_controls(self) -> None:
        """Create control widgets"""
        # Energy controls
        energy_frame = ttk.LabelFrame(self.frame, text="Energy Settings")
        energy_frame.pack(fill=tk.X, pady=5)
        
        ttk.Checkbutton(
            energy_frame,
            text="Infinite Energy",
            variable=self.energy_infinite,
            command=self._toggle_energy
        ).pack(anchor=tk.W)
        
        # Generation controls
        generation_frame = ttk.LabelFrame(self.frame, text="Generation Control")
        generation_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(generation_frame, text="Select Generation:").pack(anchor=tk.W)
        
        for i in range(3):
            ttk.Radiobutton(
                generation_frame,
                text=f"Generation {i}",
                variable=self.generation_var,
                value=i,
                command=self._change_generation
            ).pack(anchor=tk.W)
        
        # Training controls
        training_frame = ttk.LabelFrame(self.frame, text="Training Settings")
        training_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(training_frame, text="Training Speed:").pack(anchor=tk.W)
        
        speed_scale = ttk.Scale(
            training_frame,
            from_=0.1,
            to=3.0,
            variable=self.training_speed,
            orient=tk.HORIZONTAL,
            command=self._update_training_speed
        )
        speed_scale.pack(fill=tk.X, padx=5)
        
        self.speed_label = ttk.Label(training_frame, text="1.0x")
        self.speed_label.pack(anchor=tk.W)
        
        # Boundary controls
        boundary_frame = ttk.LabelFrame(self.frame, text="Boundary Settings")
        boundary_frame.pack(fill=tk.X, pady=5)
        
        ttk.Checkbutton(
            boundary_frame,
            text="Hard Bounds (Bounce/Blackout)",
            variable=self.hard_bounds,
            command=self._toggle_hard_bounds
        ).pack(anchor=tk.W)
        
        # Action buttons
        action_frame = ttk.Frame(self.frame)
        action_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(
            action_frame,
            text="Reset Game",
            command=self._reset_game
        ).pack(side=tk.LEFT, padx=2)
        
        ttk.Button(
            action_frame,
            text="Next Generation",
            command=self._next_generation
        ).pack(side=tk.LEFT, padx=2)
        
        ttk.Button(
            action_frame,
            text="Add Asteroids",
            command=self._add_asteroids
        ).pack(side=tk.LEFT, padx=2)
    
    def _toggle_energy(self) -> None:
        """Toggle infinite energy mode"""
        infinite = self.energy_infinite.get()
        logger.info(f"🔋 Infinite energy: {infinite}")
        # This would update the game state
    
    def _change_generation(self) -> None:
        """Change selected generation"""
        generation = self.generation_var.get()
        logger.info(f"🧬 Selected generation: {generation}")
        # This would update the game to focus on selected generation
    
    def _update_training_speed(self, value: str) -> None:
        """Update training speed"""
        speed = float(value)
        self.speed_label.config(text=f"{speed:.1f}x")
        logger.info(f"⚡ Training speed: {speed:.1f}x")
        # This would update the game speed
    
    def _toggle_hard_bounds(self) -> None:
        """Toggle hard boundary mode"""
        hard_bounds = self.hard_bounds.get()
        logger.info(f"🔒 Hard bounds: {hard_bounds}")
        # This would update boundary behavior in physics
    
    def _reset_game(self) -> None:
        """Reset the game"""
        logger.info("🔄 Resetting game")
        if self.viewport.game:
            self.viewport.game._advance_generation()
    
    def _next_generation(self) -> None:
        """Advance to next generation"""
        logger.info("⏭️ Advancing generation")
        if self.viewport.game:
            self.viewport.game._advance_generation()
    
    def _add_asteroids(self) -> None:
        """Add more asteroids to the game"""
        logger.info("☄️ Adding asteroids")
        if self.viewport.game:
            self.viewport.game._spawn_asteroids()


class PhosphorTerminal:
    """Scrolling log terminal for debug output"""
    
    def __init__(self, parent_frame: tk.Widget):
        self.parent_frame = parent_frame
        
        # Create frame
        self.frame = ttk.LabelFrame(parent_frame, text="Terminal Log", padding=5)
        self.frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Create scrolled text widget
        self.text_widget = scrolledtext.ScrolledText(
            self.frame,
            height=10,
            width=60,
            bg='black',
            fg='green',
            font=('Courier', 9),
            wrap=tk.WORD
        )
        self.text_widget.pack(fill=tk.BOTH, expand=True)
        
        # Log buffer
        self.log_buffer = []
        self.max_lines = 1000
        
        # Configure tags for different log levels
        self.text_widget.tag_config('INFO', foreground='green')
        self.text_widget.tag_config('WARNING', foreground='yellow')
        self.text_widget.tag_config('ERROR', foreground='red')
        self.text_widget.tag_config('DEBUG', foreground='cyan')
        
        logger.info("📟 PhosphorTerminal initialized")
    
    def add_log(self, message: str, level: str = 'INFO') -> None:
        """Add log message to terminal"""
        timestamp = time.strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] {message}\n"
        
        # Add to text widget
        self.text_widget.insert(tk.END, formatted_message, level)
        
        # Limit buffer size
        lines = int(self.text_widget.index('end-1c').split('.')[0])
        if lines > self.max_lines:
            self.text_widget.delete('1.0', '2.0')
        
        # Auto-scroll to bottom
        self.text_widget.see(tk.END)
        
        # Add to buffer
        self.log_buffer.append((timestamp, message, level))
        if len(self.log_buffer) > self.max_lines:
            self.log_buffer.pop(0)
    
    def clear(self) -> None:
        """Clear terminal"""
        self.text_widget.delete('1.0', tk.END)
        self.log_buffer.clear()
    
    def get_logs(self) -> List[Tuple[str, str, str]]:
        """Get all log messages"""
        return self.log_buffer.copy()


class SovereignDashboard:
    """Main dashboard orchestrator for AI development"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("DGT Platform - Sovereign Dashboard")
        self.root.geometry("1200x800")
        self.root.configure(bg='#1a1a1a')
        
        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Configure colors
        self.style.configure('TLabelFrame', background='#2a2a2a', foreground='white')
        self.style.configure('TLabelFrame.Label', background='#2a2a2a', foreground='cyan')
        self.style.configure('TLabelframe.Label', background='#2a2a2a', foreground='cyan')
        
        # Main container
        self.main_container = ttk.Frame(self.root)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create layout
        self._create_layout()
        
        # Bind resize event
        self.root.bind('<Configure>', self._on_resize)
        
        # Status tracking
        self.last_update_time = time.time()
        self.update_interval = 0.1  # 100ms update interval
        
        logger.info("🏛️ SovereignDashboard initialized")
    
    def _create_layout(self) -> None:
        """Create dashboard layout"""
        # Left panel - Viewport
        left_frame = ttk.Frame(self.main_container)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        viewport_label = ttk.Label(left_frame, text="Sovereign Viewport", font=('Arial', 12, 'bold'))
        viewport_label.pack(pady=5)
        
        self.viewport = SovereignViewport(left_frame)
        
        # Right panel - Controls
        right_frame = ttk.Frame(self.main_container, width=400)
        right_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(10, 0))
        right_frame.pack_propagate(False)
        
        # Control panel
        self.control_panel = ControlPanel(right_frame, self.viewport)
        
        # Terminal
        self.terminal = PhosphorTerminal(right_frame)
        
        # Status bar
        self.status_frame = ttk.Frame(self.root)
        self.status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.status_label = ttk.Label(self.status_frame, text="Ready", relief=tk.SUNKEN)
        self.status_label.pack(fill=tk.X, padx=5, pady=2)
        
        # Performance label
        self.perf_label = ttk.Label(self.status_frame, text="", relief=tk.SUNKEN)
        self.perf_label.pack(side=tk.RIGHT, padx=5, pady=2)
    
    def _on_resize(self, event) -> None:
        """Handle window resize events"""
        if event.widget == self.root:
            # Update viewport scaling
            viewport_frame = self.viewport.canvas.master
            frame_width = viewport_frame.winfo_width()
            frame_height = viewport_frame.winfo_height()
            
            if frame_width > 1 and frame_height > 1:  # Valid dimensions
                self.viewport.update_layout(frame_width, frame_height)
    
    def initialize(self) -> Result[bool]:
        """Initialize dashboard components"""
        try:
            # Initialize viewport game
            result = self.viewport.initialize_game()
            if not result.success:
                return result
            
            # Start update loop
            self._start_update_loop()
            
            # Add initial log
            self.terminal.add_log("Sovereign Dashboard initialized", "INFO")
            self.terminal.add_log("Combatant Evolution running in viewport", "INFO")
            
            logger.info("🏛️ Dashboard initialized successfully")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Dashboard initialization failed: {e}")
    
    def _start_update_loop(self) -> None:
        """Start periodic update loop"""
        self._update_dashboard()
    
    def _update_dashboard(self) -> None:
        """Update dashboard components"""
        try:
            current_time = time.time()
            
            # Update performance stats
            if self.viewport.game:
                perf_stats = self.viewport.get_performance_stats()
                perf_text = f"FPS: {perf_stats['avg_fps']:.1f} | Scale: {perf_stats['scale_factor']}x"
                self.perf_label.config(text=perf_text)
                
                # Update status
                if self.viewport.running:
                    self.status_label.config(text="Running")
                else:
                    self.status_label.config(text="Stopped")
            
            # Schedule next update
            self.root.after(int(self.update_interval * 1000), self._update_dashboard)
            
        except Exception as e:
            logger.error(f"Dashboard update error: {e}")
            self.root.after(int(self.update_interval * 1000), self._update_dashboard)
    
    def run(self) -> None:
        """Run the dashboard"""
        try:
            # Initialize
            result = self.initialize()
            if not result.success:
                print(f"❌ Failed to initialize: {result.error}")
                return
            
            # Start main loop
            logger.info("🏛️ Starting dashboard main loop")
            self.root.mainloop()
            
        except KeyboardInterrupt:
            logger.info("🛑 Dashboard interrupted by user")
        except Exception as e:
            logger.error(f"Dashboard error: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self) -> None:
        """Clean up dashboard resources"""
        try:
            # Stop viewport
            self.viewport.stop_game()
            
            # Close window
            self.root.quit()
            self.root.destroy()
            
            logger.info("🧹 Dashboard cleanup complete")
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")


def main():
    """Main entry point for Sovereign Dashboard"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🏛️ DGT Platform - Sovereign Dashboard")
    print("=" * 50)
    print("Professional IDE for AI Pilot Development")
    print("Modular workspace with 160x144 sovereign resolution")
    print()
    
    # Create and run dashboard
    dashboard = SovereignDashboard()
    dashboard.run()


if __name__ == "__main__":
    main()
