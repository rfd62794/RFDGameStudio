"""
Large Workspace - 1280x720 Professional Development Environment
ADR 208: Aggressor Architecture - Large Viewport with Visual Intelligence

Professional IDE workspace with 4x scaled sovereign viewport,
real-time neural debugging, and successor management.
"""

import pygame
import sys
import math
import tkinter as tk
from tkinter import ttk, scrolledtext
import threading
import time
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from loguru import logger

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from foundation.persistence.successor_registry import create_successor_registry
from engines.view.render_panel import RenderPanel, RenderPanelFactory
from apps.space.combatant_evolution import CombatantEvolution, CombatantPilot


class LargeViewport:
    """4x scaled sovereign viewport with visual intelligence"""
    
    def __init__(self, parent_frame: tk.Widget):
        self.parent_frame = parent_frame
        
        # Fixed 4x scaling for 1280x720 workspace
        self.scale_factor = 4
        self.viewport_width = SOVEREIGN_WIDTH * self.scale_factor  # 640
        self.viewport_height = SOVEREIGN_HEIGHT * self.scale_factor  # 576
        
        # Create render panel
        self.render_panel = RenderPanelFactory.create_sovereign_viewport(
            parent_frame, 
            self.viewport_width, 
            self.viewport_height
        )
        
        # Visual intelligence overlay
        self.show_debug_lines = True
        self.debug_surface = pygame.Surface((self.viewport_width, self.viewport_height), pygame.SRCALPHA)
        
        # Game instance
        self.game: Optional[CombatantEvolution] = None
        self.running = False
        
        # Performance tracking
        self.fps_history = []
        self.last_frame_time = 0
        
        logger.info(f"🖥️ LargeViewport initialized at {self.scale_factor}x scaling")
    
    def initialize_game(self) -> Result[bool]:
        """Initialize the combatant evolution game"""
        try:
            self.game = CombatantEvolution()
            self.running = True
            
            # Start game thread
            game_thread = threading.Thread(target=self._game_loop, daemon=True)
            game_thread.start()
            
            logger.info("🎮 Game initialized in large viewport")
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
                
                # Copy to render panel surface
                self.render_panel.sovereign_surface.blit(self.game.game_surface, (0, 0))
                
                # Draw visual intelligence overlay
                if self.show_debug_lines:
                    self._draw_debug_overlay()
                
                # Render frame
                self.render_panel.render_frame()
                
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
    
    def _draw_debug_overlay(self) -> None:
        """Draw visual intelligence overlay"""
        if not self.game or not self.game.pilots:
            return
        
        # Clear debug surface
        self.debug_surface.fill((0, 0, 0, 0))
        
        # Draw debug info for each pilot
        for pilot in self.game.pilots:
            self._draw_pilot_debug_lines(pilot)
        
        # Blit debug surface to main surface
        self.render_panel.sovereign_surface.blit(self.debug_surface, (0, 0))
    
    def _draw_pilot_debug_lines(self, pilot: CombatantPilot) -> None:
        """Draw debug lines for a single pilot"""
        # Scale positions for 4x viewport
        ship_x = int(pilot.visual_x * self.scale_factor)
        ship_y = int(pilot.visual_y * self.scale_factor)
        
        # Draw heading line (where ship is pointing)
        heading_length = 40
        heading_end_x = ship_x + heading_length * math.cos(pilot.visual_angle)
        heading_end_y = ship_y + heading_length * math.sin(pilot.visual_angle)
        
        # Draw heading line in pilot color
        pygame.draw.line(self.debug_surface, pilot.color, 
                        (ship_x, ship_y), (heading_end_x, heading_end_y), 2)
        
        # Find nearest asteroid and draw target line
        nearest_asteroid = self._find_nearest_asteroid(pilot)
        if nearest_asteroid:
            ast_x = int(nearest_asteroid['x'] * self.scale_factor)
            ast_y = int(nearest_asteroid['y'] * self.scale_factor)
            
            # Draw target line in yellow
            pygame.draw.line(self.debug_surface, (255, 255, 0),
                           (ship_x, ship_y), (ast_x, ast_y), 1)
            
            # Draw asteroid circle
            ast_radius = int(nearest_asteroid['radius'] * self.scale_factor)
            pygame.draw.circle(self.debug_surface, (255, 255, 0),
                             (ast_x, ast_y), ast_radius, 1)
        
        # Draw ship circle
        pygame.draw.circle(self.debug_surface, pilot.color,
                         (ship_x, ship_y), 6, 2)
        
        # Draw pilot ID
        font = pygame.font.Font(None, 12)
        text = font.render(pilot.pilot_id[:3], True, pilot.color)
        self.debug_surface.blit(text, (ship_x + 10, ship_y - 10))
    
    def _find_nearest_asteroid(self, pilot: CombatantPilot) -> Optional[Dict[str, Any]]:
        """Find nearest asteroid to pilot"""
        if not self.game or not self.game.asteroids:
            return None
        
        nearest = None
        min_distance = float('inf')
        
        for asteroid in self.game.asteroids:
            distance = math.sqrt((pilot.visual_x - asteroid['x'])**2 + 
                               (pilot.visual_y - asteroid['y'])**2)
            if distance < min_distance:
                min_distance = distance
                nearest = asteroid
        
        return nearest
    
    def get_canvas_widget(self) -> tk.Canvas:
        """Get the tkinter canvas widget"""
        return self.render_panel.get_canvas_widget()
    
    def pack(self, **kwargs) -> None:
        """Pack the viewport"""
        self.render_panel.pack(**kwargs)
    
    def stop_game(self) -> None:
        """Stop the game"""
        self.running = False
        if self.game:
            self.game.cleanup()
            self.game = None


class SuccessorManager:
    """Successor management panel"""
    
    def __init__(self, parent_frame: tk.Widget):
        self.parent_frame = parent_frame
        self.registry = create_successor_registry()
        
        # Create frame
        self.frame = ttk.LabelFrame(parent_frame, text="Successor Manager", padding=10)
        self.frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Statistics display
        self.stats_text = tk.Text(self.frame, height=8, width=40, font=('Courier', 9))
        self.stats_text.pack(fill=tk.BOTH, expand=True)
        
        # Control buttons
        button_frame = ttk.Frame(self.frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="Refresh Stats", command=self.update_stats).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Clear Registry", command=self.clear_registry).pack(side=tk.LEFT, padx=2)
        
        # Auto-update
        self.update_stats()
        
        logger.info("🧬 SuccessorManager initialized")
    
    def update_stats(self) -> None:
        """Update successor statistics display"""
        try:
            stats = self.registry.get_registry_statistics()
            
            # Format statistics
            stats_text = "SUCCESSOR REGISTRY STATISTICS\n"
            stats_text += "=" * 35 + "\n"
            stats_text += f"Total Parents: {stats['total_parents']}\n"
            stats_text += f"Total Successions: {stats['total_successions']}\n"
            stats_text += f"Total Mutations: {stats['total_mutations']}\n"
            stats_text += f"Best Fitness: {stats['best_fitness']:.1f}\n"
            stats_text += f"Avg Fitness: {stats['average_fitness']:.1f}\n"
            stats_text += f"Fitness Threshold: {stats['fitness_threshold']:.1f}\n"
            stats_text += f"Mutation Rate: {stats['mutation_rate']:.2%}\n"
            stats_text += f"Recent Successions: {stats['recent_successions']}\n"
            
            # Update display
            self.stats_text.delete(1.0, tk.END)
            self.stats_text.insert(1.0, stats_text)
            
        except Exception as e:
            logger.error(f"Failed to update stats: {e}")
    
    def clear_registry(self) -> None:
        """Clear the successor registry"""
        try:
            self.registry.clear_registry()
            self.update_stats()
            logger.info("🧹 Successor registry cleared")
        except Exception as e:
            logger.error(f"Failed to clear registry: {e}")
    
    def check_pilot_for_succession(self, pilot: CombatantPilot) -> None:
        """Check if pilot should trigger succession"""
        try:
            # Get pilot neural network
            if hasattr(pilot.controller, 'neural_network') and pilot.controller.neural_network:
                neural_network = {
                    'num_inputs': pilot.controller.neural_network.num_inputs,
                    'num_hidden': pilot.controller.neural_network.num_hidden,
                    'num_outputs': pilot.controller.neural_network.num_outputs,
                    'weights_input_hidden': pilot.controller.neural_network.weights_input_hidden,
                    'weights_hidden_output': pilot.controller.neural_network.weights_hidden_output,
                    'bias_hidden': pilot.controller.neural_network.bias_hidden,
                    'bias_output': pilot.controller.neural_network.bias_output
                }
            else:
                neural_network = {}
            
            # Check succession
            result = self.registry.check_for_succession(
                pilot_id=pilot.pilot_id,
                fitness=pilot.fitness,
                generation=pilot.generation,
                neural_network=neural_network,
                combat_stats=pilot.get_combat_stats()
            )
            
            if result.success and result.value:
                logger.info(f"🧬 Succession triggered for {pilot.pilot_id}")
                self.update_stats()
            
        except Exception as e:
            logger.error(f"Succession check failed for {pilot.pilot_id}: {e}")


class LargeWorkspace:
    """1280x720 professional workspace with large viewport"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("DGT Platform - Large Workspace (1280x720)")
        self.root.geometry("1280x720")
        self.root.configure(bg='#1a1a1a')
        self.root.resizable(False, False)  # Fixed size for professional layout
        
        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Configure colors
        self.style.configure('TLabelFrame', background='#2a2a2a', foreground='white')
        self.style.configure('TLabelFrame.Label', background='#2a2a2a', foreground='cyan')
        
        # Main container
        self.main_container = ttk.Frame(self.root)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create layout
        self._create_layout()
        
        # Status tracking
        self.last_update_time = time.time()
        self.update_interval = 0.1  # 100ms update interval
        
        logger.info("🖥️ LargeWorkspace initialized (1280x720)")
    
    def _create_layout(self) -> None:
        """Create 1280x720 workspace layout"""
        # Left side - Large viewport (640x576)
        left_frame = ttk.Frame(self.main_container)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        viewport_label = ttk.Label(left_frame, text="4x Scaled Sovereign Viewport", 
                                  font=('Arial', 14, 'bold'))
        viewport_label.pack(pady=5)
        
        self.viewport = LargeViewport(left_frame)
        self.viewport.pack(pady=5)
        
        # Right side - Control panels (620px total width)
        right_frame = ttk.Frame(self.main_container, width=620)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, padx=(10, 0))
        right_frame.pack_propagate(False)
        
        # Successor Manager (top)
        self.successor_manager = SuccessorManager(right_frame)
        
        # Combat Statistics (middle)
        self._create_combat_stats_panel(right_frame)
        
        # Controls (bottom)
        self._create_control_panel(right_frame)
        
        # Status bar
        self.status_frame = ttk.Frame(self.root)
        self.status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.status_label = ttk.Label(self.status_frame, text="Ready", relief=tk.SUNKEN)
        self.status_label.pack(fill=tk.X, padx=5, pady=2)
        
        self.perf_label = ttk.Label(self.status_frame, text="", relief=tk.SUNKEN)
        self.perf_label.pack(side=tk.RIGHT, padx=5, pady=2)
    
    def _create_combat_stats_panel(self, parent_frame: tk.Widget) -> None:
        """Create combat statistics panel"""
        stats_frame = ttk.LabelFrame(parent_frame, text="Combat Statistics", padding=10)
        stats_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        # Create text widget for stats
        self.combat_stats_text = tk.Text(stats_frame, height=12, width=40, font=('Courier', 9))
        self.combat_stats_text.pack(fill=tk.BOTH, expand=True)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(stats_frame, orient=tk.VERTICAL, command=self.combat_stats_text.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.combat_stats_text.config(yscrollcommand=scrollbar.set)
    
    def _create_control_panel(self, parent_frame: tk.Widget) -> None:
        """Create control panel"""
        control_frame = ttk.LabelFrame(parent_frame, text="Controls", padding=10)
        control_frame.pack(fill=tk.X, pady=5)
        
        # Debug options
        debug_frame = ttk.Frame(control_frame)
        debug_frame.pack(fill=tk.X, pady=5)
        
        self.debug_lines_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(debug_frame, text="Show Debug Lines", 
                       variable=self.debug_lines_var,
                       command=self.toggle_debug_lines).pack(anchor=tk.W)
        
        # Action buttons
        button_frame = ttk.Frame(control_frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="Reset Game", command=self.reset_game).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Next Generation", command=self.next_generation).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Add Asteroids", command=self.add_asteroids).pack(side=tk.LEFT, padx=2)
    
    def toggle_debug_lines(self) -> None:
        """Toggle debug line display"""
        self.viewport.show_debug_lines = self.debug_lines_var.get()
        logger.info(f"🔍 Debug lines: {self.viewport.show_debug_lines}")
    
    def reset_game(self) -> None:
        """Reset the game"""
        logger.info("🔄 Resetting game")
        if self.viewport.game:
            self.viewport.game._advance_generation()
    
    def next_generation(self) -> None:
        """Advance to next generation"""
        logger.info("⏭️ Advancing generation")
        if self.viewport.game:
            self.viewport.game._advance_generation()
    
    def add_asteroids(self) -> None:
        """Add more asteroids"""
        logger.info("☄️ Adding asteroids")
        if self.viewport.game:
            self.viewport.game._spawn_asteroids()
    
    def initialize(self) -> Result[bool]:
        """Initialize workspace components"""
        try:
            # Initialize viewport game
            result = self.viewport.initialize_game()
            if not result.success:
                return result
            
            # Start update loop
            self._start_update_loop()
            
            logger.info("🖥️ Large workspace initialized successfully")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Workspace initialization failed: {e}")
    
    def _start_update_loop(self) -> None:
        """Start periodic update loop"""
        self._update_workspace()
    
    def _update_workspace(self) -> None:
        """Update workspace components"""
        try:
            current_time = time.time()
            
            # Update combat statistics
            if self.viewport.game:
                self._update_combat_stats()
                
                # Check for succession
                for pilot in self.viewport.game.pilots:
                    self.successor_manager.check_pilot_for_succession(pilot)
                
                # Update performance stats
                perf_stats = self.viewport.render_panel.get_render_stats()
                perf_text = f"FPS: {perf_stats['avg_fps']:.1f} | Scale: {perf_stats['scale_factor']}x"
                self.perf_label.config(text=perf_text)
                
                # Update status
                if self.viewport.running:
                    self.status_label.config(text="Running - Generative War Active")
                else:
                    self.status_label.config(text="Stopped")
            
            # Schedule next update
            self.root.after(int(self.update_interval * 1000), self._update_workspace)
            
        except Exception as e:
            logger.error(f"Workspace update error: {e}")
            self.root.after(int(self.update_interval * 1000), self._update_workspace)
    
    def _update_combat_stats(self) -> None:
        """Update combat statistics display"""
        try:
            if not self.viewport.game or not self.viewport.game.pilots:
                return
            
            stats_text = "COMBATANT EVOLUTION STATISTICS\n"
            stats_text += "=" * 35 + "\n"
            
            for pilot in self.viewport.game.pilots:
                combat_stats = pilot.get_combat_stats()
                
                stats_text += f"\n{pilot.pilot_id} (Gen {pilot.generation})\n"
                stats_text += f"  Fitness: {combat_stats['combat_fitness']:.1f}\n"
                stats_text += f"  Shots Fired: {combat_stats['shots_fired']}\n"
                stats_text += f"  Shots Hit: {combat_stats['shots_hit']}\n"
                stats_text += f"  Efficiency: {combat_stats['combat_efficiency']:.2%}\n"
                stats_text += f"  Destroyed: {combat_stats['asteroids_destroyed']}\n"
                stats_text += f"  Collisions: {combat_stats['collisions']}\n"
            
            # Update display
            self.combat_stats_text.delete(1.0, tk.END)
            self.combat_stats_text.insert(1.0, stats_text)
            
        except Exception as e:
            logger.error(f"Failed to update combat stats: {e}")
    
    def run(self) -> None:
        """Run the large workspace"""
        try:
            # Initialize
            result = self.initialize()
            if not result.success:
                print(f"❌ Failed to initialize: {result.error}")
                return
            
            # Start main loop
            logger.info("🖥️ Starting large workspace main loop")
            self.root.mainloop()
            
        except KeyboardInterrupt:
            logger.info("🛑 Large workspace interrupted by user")
        except Exception as e:
            logger.error(f"Large workspace error: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self) -> None:
        """Clean up workspace resources"""
        try:
            # Stop viewport
            self.viewport.stop_game()
            
            # Close window
            self.root.quit()
            self.root.destroy()
            
            logger.info("🧹 Large workspace cleanup complete")
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")


def main():
    """Main entry point for Large Workspace"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🖥️ DGT Platform - Large Workspace")
    print("=" * 50)
    print("1280x720 Professional Development Environment")
    print("4x Scaled Viewport with Visual Intelligence")
    print("Generative War with Successor Management")
    print()
    
    # Create and run workspace
    workspace = LargeWorkspace()
    workspace.run()


if __name__ == "__main__":
    main()
