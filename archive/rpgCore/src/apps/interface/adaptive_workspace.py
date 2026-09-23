"""
Adaptive Workspace - 320x240 Flight Space with Widgetized UI
ADR 210: Adaptive Flight Space & Widgetized HUD

Professional IDE with expanded sovereign bounds and modular UI components.
Features manual pilot control, dedicated control widgets, and tri-brain AI integration.
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
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, ADAPTIVE_WIDTH, ADAPTIVE_HEIGHT
from foundation.persistence.successor_registry import create_successor_registry
from engines.view.render_panel import RenderPanel, RenderPanelFactory
from engines.mind.tri_brain import create_tri_brain, TriBrain
from apps.interface.size_control_widget import create_size_control_widget
from apps.interface.manual_control_widget import create_manual_control_widget
from apps.space.combatant_evolution import CombatantEvolution, CombatantPilot


class AdaptiveViewport:
    """320x240 adaptive viewport with integer scaling"""
    
    def __init__(self, parent_frame: tk.Widget):
        self.parent_frame = parent_frame
        
        # Adaptive dimensions
        self.world_width = ADAPTIVE_WIDTH
        self.world_height = ADAPTIVE_HEIGHT
        
        # Calculate optimal scaling for 1280x720 workspace
        self.scale_factor = 3  # 320x3 = 960, 240x3 = 720 (fits perfectly)
        self.viewport_width = self.world_width * self.scale_factor
        self.viewport_height = self.world_height * self.scale_factor
        
        # Create render panel with adaptive size (default to adaptive)
        self.render_panel = RenderPanel(parent_frame, self.viewport_width, self.viewport_height, "adaptive")
        
        # Create game surface at adaptive resolution
        self.game_surface = pygame.Surface((self.world_width, self.world_height))
        self.game_surface.fill((0, 0, 0))
        
        # Visual intelligence overlay
        self.show_debug_lines = True
        self.debug_surface = pygame.Surface((self.viewport_width, self.viewport_height), pygame.SRCALPHA)
        
        # Game instance
        self.game: Optional[CombatantEvolution] = None
        self.running = False
        
        # Manual control
        self.manual_control = False
        self.manual_thrust = 0.0
        self.manual_rotation = 0.0
        self.manual_fire = False
        
        # Performance tracking
        self.fps_history = []
        self.last_frame_time = 0
        self.max_fps = 60
        
        logger.info(f"🖥️ AdaptiveViewport initialized at {self.world_width}x{self.world_height} with {self.scale_factor}x scaling")
    
    def initialize_game(self) -> Result[bool]:
        """Initialize the combatant evolution game with adaptive bounds"""
        try:
            # Create game with adaptive world size
            self.game = CombatantEvolution()
            self.running = True
            
            # Start game thread
            game_thread = threading.Thread(target=self._game_loop, daemon=True)
            game_thread.start()
            
            logger.info("🎮 Game initialized in adaptive viewport")
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
                
                # Render to adaptive surface
                self.game.render_game()
                
                # Scale game surface to adaptive resolution
                scaled_surface = pygame.transform.scale(self.game.game_surface, 
                                                       (self.world_width, self.world_height))
                self.render_panel.sovereign_surface.blit(scaled_surface, (0, 0))
                
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
        """Draw visual intelligence overlay for adaptive space"""
        if not self.game or not self.game.pilots:
            return
        
        # Clear debug surface
        self.debug_surface.fill((0, 0, 0, 0))
        
        # Draw debug info for each pilot
        for pilot in self.game.pilots:
            self._draw_pilot_debug_lines(pilot)
        
        # Draw adaptive grid
        self._draw_adaptive_grid()
        
        # Blit debug surface to main surface
        self.render_panel.sovereign_surface.blit(self.debug_surface, (0, 0))
    
    def _draw_adaptive_grid(self) -> None:
        """Draw grid lines for adaptive space"""
        grid_color = (40, 40, 40, 128)  # Semi-transparent gray
        
        # Draw grid every 40 pixels (8 pixels in original space)
        grid_spacing = 40
        
        for x in range(0, self.viewport_width, grid_spacing):
            pygame.draw.line(self.debug_surface, grid_color, (x, 0), (x, self.viewport_height), 1)
        
        for y in range(0, self.viewport_height, grid_spacing):
            pygame.draw.line(self.debug_surface, grid_color, (0, y), (self.viewport_width, y), 1)
        
        # Draw border
        border_color = (100, 100, 100, 200)
        pygame.draw.rect(self.debug_surface, border_color, 
                         (0, 0, self.viewport_width, self.viewport_height), 2)
    
    def _draw_pilot_debug_lines(self, pilot: CombatantPilot) -> None:
        """Draw debug lines for a single pilot in adaptive space"""
        # Scale positions for viewport
        ship_x = int(pilot.visual_x * self.scale_factor * 2)  # 2x scaling from 160x320
        ship_y = int(pilot.visual_y * self.scale_factor * 2)
        
        # Draw heading line
        heading_length = 60
        heading_end_x = ship_x + heading_length * math.cos(pilot.visual_angle)
        heading_end_y = ship_y + heading_length * math.sin(pilot.visual_angle)
        
        pygame.draw.line(self.debug_surface, pilot.color, 
                        (ship_x, ship_y), (heading_end_x, heading_end_y), 2)
        
        # Find nearest asteroid and draw target line
        nearest_asteroid = self._find_nearest_asteroid(pilot)
        if nearest_asteroid:
            ast_x = int(nearest_asteroid['x'] * self.scale_factor * 2)
            ast_y = int(nearest_asteroid['y'] * self.scale_factor * 2)
            
            pygame.draw.line(self.debug_surface, (255, 255, 0),
                           (ship_x, ship_y), (ast_x, ast_y), 1)
            
            ast_radius = int(nearest_asteroid['radius'] * self.scale_factor * 2)
            pygame.draw.circle(self.debug_surface, (255, 255, 0),
                             (ast_x, ast_y), ast_radius, 1)
        
        # Draw ship circle
        pygame.draw.circle(self.debug_surface, pilot.color,
                         (ship_x, ship_y), 8, 2)
        
        # Draw pilot ID
        font = pygame.font.Font(None, 16)
        text = font.render(pilot.pilot_id[:3], True, pilot.color)
        self.debug_surface.blit(text, (ship_x + 15, ship_y - 15))
    
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
    
    def set_manual_control(self, enabled: bool) -> None:
        """Enable or disable manual control"""
        self.manual_control = enabled
        logger.info(f"🎮 Manual control: {enabled}")
    
    def set_manual_inputs(self, thrust: float, rotation: float, fire: bool) -> None:
        """Set manual control inputs"""
        if self.manual_control:
            self.manual_thrust = thrust
            self.manual_rotation = rotation
            self.manual_fire = fire
    
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


class ControlWidget:
    """Dedicated control widget with manual pilot controls"""
    
    def __init__(self, parent_frame: tk.Widget, viewport: AdaptiveViewport):
        self.parent_frame = parent_frame
        self.viewport = viewport
        
        # Create frame
        self.frame = ttk.LabelFrame(parent_frame, text="Manual Pilot Controls", padding=10)
        self.frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Control variables
        self.manual_control_var = tk.BooleanVar(value=False)
        
        # Create controls
        self._create_controls()
        
        # Bind keyboard events
        self._bind_keyboard()
        
        logger.info("🎮 ControlWidget initialized")
    
    def _create_controls(self) -> None:
        """Create control widgets"""
        # Manual control toggle
        ttk.Checkbutton(self.frame, text="Enable Manual Control", 
                       variable=self.manual_control_var,
                       command=self._toggle_manual_control).pack(anchor=tk.W)
        
        # Status display
        self.status_label = ttk.Label(self.frame, text="Manual Control: OFF")
        self.status_label.pack(anchor=tk.W, pady=5)
        
        # Control instructions
        instructions = ttk.Label(self.frame, text="Controls: W/S=Thrust, A/D=Rotate, Space=Fire", 
                                font=('Arial', 9))
        instructions.pack(anchor=tk.W)
        
        # Control state display
        self.control_state_label = ttk.Label(self.frame, text="Thrust: 0.0 | Rotation: 0.0 | Fire: OFF")
        self.control_state_label.pack(anchor=tk.W, pady=5)
    
    def _toggle_manual_control(self) -> None:
        """Toggle manual control mode"""
        enabled = self.manual_control_var.get()
        self.viewport.set_manual_control(enabled)
        
        if enabled:
            self.status_label.config(text="Manual Control: ON")
            logger.info("🎮 Manual control enabled")
        else:
            self.status_label.config(text="Manual Control: OFF")
            logger.info("🎮 Manual control disabled")
    
    def _bind_keyboard(self) -> None:
        """Bind keyboard events for manual control"""
        self.parent_frame.bind('<KeyPress>', self._on_key_press)
        self.parent_frame.bind('<KeyRelease>', self._on_key_release)
        
        # Track key states
        self.keys_pressed = set()
    
    def _on_key_press(self, event) -> None:
        """Handle key press events"""
        if not self.manual_control_var.get():
            return
        
        key = event.keysym.lower()
        self.keys_pressed.add(key)
        
        # Update control state
        self._update_control_state()
    
    def _on_key_release(self, event) -> None:
        """Handle key release events"""
        key = event.keysym.lower()
        self.keys_pressed.discard(key)
        
        # Update control state
        self._update_control_state()
    
    def _update_control_state(self) -> None:
        """Update control state based on pressed keys"""
        thrust = 0.0
        rotation = 0.0
        fire = False
        
        if 'w' in self.keys_pressed:
            thrust = 1.0
        elif 's' in self.keys_pressed:
            thrust = -1.0
        
        if 'a' in self.keys_pressed:
            rotation = -1.0
        elif 'd' in self.keys_pressed:
            rotation = 1.0
        
        if 'space' in self.keys_pressed:
            fire = True
        
        # Send to viewport
        self.viewport.set_manual_inputs(thrust, rotation, fire)
        
        # Update display
        self.control_state_label.config(
            text=f"Thrust: {thrust:+.1f} | Rotation: {rotation:+.1f} | Fire: {'ON' if fire else 'OFF'}"
        )


class SuccessorWidget:
    """Enhanced successor manager widget with controls"""
    
    def __init__(self, parent_frame: tk.Widget):
        self.parent_frame = parent_frame
        self.registry = create_successor_registry()
        
        # Create frame
        self.frame = ttk.LabelFrame(parent_frame, text="Successor Manager", padding=10)
        self.frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Create controls
        self._create_controls()
        
        # Update display
        self.update_stats()
        
        logger.info("🧬 SuccessorWidget initialized")
    
    def _create_controls(self) -> None:
        """Create control widgets"""
        # Statistics display
        self.stats_text = tk.Text(self.frame, height=8, width=40, font=('Courier', 9))
        self.stats_text.pack(fill=tk.BOTH, expand=True)
        
        # Control buttons
        button_frame = ttk.Frame(self.frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="Refresh Stats", command=self.update_stats).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Save Parent", command=self.save_parent).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Manual Cull", command=self.manual_cull).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Clear Registry", command=self.clear_registry).pack(side=tk.LEFT, padx=2)
    
    def update_stats(self) -> None:
        """Update successor statistics display"""
        try:
            stats = self.registry.get_registry_statistics()
            
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
            
            self.stats_text.delete(1.0, tk.END)
            self.stats_text.insert(1.0, stats_text)
            
        except Exception as e:
            logger.error(f"Failed to update stats: {e}")
    
    def save_parent(self) -> None:
        """Manually save current best pilot as parent"""
        try:
            # This would get the current best pilot from the game
            # For now, just show a message
            logger.info("💾 Manual parent save requested")
            self.update_stats()
        except Exception as e:
            logger.error(f"Failed to save parent: {e}")
    
    def manual_cull(self) -> None:
        """Manually cull lowest fitness parents"""
        try:
            if self.registry.parents:
                # Remove lowest fitness parent
                self.registry.parents.sort(key=lambda p: p.fitness)
                removed = self.registry.parents.pop(0)
                self.registry.save_registry()
                logger.info(f"🗑️ Culled parent {removed.pilot_id} with fitness {removed.fitness}")
                self.update_stats()
        except Exception as e:
            logger.error(f"Failed to cull parents: {e}")
    
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
            # Get pilot neural network (would be tri-brain in real implementation)
            neural_network = {
                'num_inputs': 7,
                'num_hidden': 8,
                'num_outputs': 3,
                'weights_input_hidden': [[0.0] * 8 for _ in range(7)],  # Placeholder
                'weights_hidden_output': [[0.0] * 3 for _ in range(8)],  # Placeholder
                'bias_hidden': [0.0] * 8,
                'bias_output': [0.0] * 3
            }
            
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


class AdaptiveWorkspace:
    """1280x720 adaptive workspace with expanded flight space"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("DGT Platform - Adaptive Workspace (320x240)")
        self.root.geometry("1280x720")
        self.root.configure(bg='#1a1a1a')
        self.root.resizable(False, False)
        
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
        
        logger.info("🖥️ AdaptiveWorkspace initialized (320x240)")
    
    def _create_layout(self) -> None:
        """Create 1280x720 workspace layout"""
        # Left side - Adaptive viewport (960x720)
        left_frame = ttk.Frame(self.main_container)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        viewport_label = ttk.Label(left_frame, text="Adaptive Viewport (320x240)", 
                                  font=('Arial', 14, 'bold'))
        viewport_label.pack(pady=5)
        
        self.viewport = AdaptiveViewport(left_frame)
        self.viewport.pack(pady=5)
        
        # Right side - Control widgets (300px total width)
        right_frame = ttk.Frame(self.main_container, width=300)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, padx=(10, 0))
        right_frame.pack_propagate(False)
        
        # Create size control widget (top)
        self.size_control_widget = create_size_control_widget(right_frame, self.viewport.render_panel, self._on_size_change)
        
        # Manual control widget
        self.manual_control_widget = create_manual_control_widget(right_frame, self._on_manual_toggle)
        
        # Manual control widget (legacy)
        self.control_widget = ControlWidget(right_frame, self.viewport)
        
        # Successor widget
        self.successor_widget = SuccessorWidget(right_frame)
        
        # Combat statistics widget
        self._create_combat_stats_widget(right_frame)
        
        # Status bar
        self.status_frame = ttk.Frame(self.root)
        self.status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.status_label = ttk.Label(self.status_frame, text="Ready", relief=tk.SUNKEN)
        self.status_label.pack(fill=tk.X, padx=5, pady=2)
        
        self.perf_label = ttk.Label(self.status_frame, text="", relief=tk.SUNKEN)
        self.perf_label.pack(side=tk.RIGHT, padx=5, pady=2)
    
    def _create_combat_stats_widget(self, parent_frame: tk.Widget) -> None:
        """Create combat statistics widget"""
        stats_frame = ttk.LabelFrame(parent_frame, text="Combat Statistics", padding=10)
        stats_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        # Create text widget for stats
        self.combat_stats_text = tk.Text(stats_frame, height=10, width=35, font=('Courier', 9))
        self.combat_stats_text.pack(fill=tk.BOTH, expand=True)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(stats_frame, orient=tk.VERTICAL, command=self.combat_stats_text.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.combat_stats_text.config(yscrollcommand=scrollbar.set)
    
    def _on_manual_toggle(self, active: bool, thrust: float = 0.0, rotation: float = 0.0, fire: bool = False) -> None:
        """Handle manual control toggle"""
        try:
            if self.viewport.game:
                # Update viewport manual control
                self.viewport.set_manual_control(active)
                if active:
                    self.viewport.set_manual_inputs(thrust, rotation, fire)
            
            logger.info(f"🎮 Manual control: {active}")
            
        except Exception as e:
            logger.error(f"Manual control toggle failed: {e}")
    
    def _on_size_change(self, new_size: str) -> None:
        """Handle size change from size control widget"""
        try:
            # Update workspace layout for new size
            self._update_layout_for_new_size()
            
            logger.info(f"📏 Workspace adapted to {new_size} size")
            
        except Exception as e:
            logger.error(f"Failed to adapt workspace layout: {e}")
    
    def _update_layout_for_new_size(self) -> None:
        """Update workspace layout for new render panel size"""
        try:
            # Get current size info
            size_info = self.viewport.render_panel.get_current_size_info()
            
            # Update viewport display size
            new_display_width = size_info['display_width']
            new_display_height = size_info['display_height']
            
            # Update canvas size
            self.viewport.canvas.config(width=new_display_width, height=new_display_height)
            
            # Update workspace title
            self.root.title(f"DGT Platform - Adaptive Workspace ({size_info['size_name']})")
            
            logger.info(f"🖥️ Workspace resized to {size_info['display_width']}x{size_info['display_height']}")
            
        except Exception as e:
            logger.error(f"Failed to update layout: {e}")
    
    def initialize(self) -> Result[bool]:
        """Initialize workspace components"""
        try:
            # Initialize viewport game
            result = self.viewport.initialize_game()
            if not result.success:
                return result
            
            # Start update loop
            self._start_update_loop()
            
            logger.info("🖥️ Adaptive workspace initialized successfully")
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
                    self.successor_widget.check_pilot_for_succession(pilot)
                
                # Update performance stats
                perf_stats = self.viewport.render_panel.get_render_stats()
                perf_text = f"FPS: {perf_stats['avg_fps']:.1f} | Scale: {perf_stats['scale_factor']}x"
                self.perf_label.config(text=perf_text)
                
                # Update status
                if self.viewport.running:
                    self.status_label.config(text="Running - Adaptive Flight Space Active")
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
            stats_text += f"Flight Space: {self.viewport.world_width}x{self.viewport.world_height}\n"
            stats_text += f"Scale Factor: {self.viewport.scale_factor}x\n\n"
            
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
        """Run the adaptive workspace"""
        try:
            # Initialize
            result = self.initialize()
            if not result.success:
                print(f"❌ Failed to initialize: {result.error}")
                return
            
            # Start main loop
            logger.info("🖥️ Starting adaptive workspace main loop")
            self.root.mainloop()
            
        except KeyboardInterrupt:
            logger.info("🛑 Adaptive workspace interrupted by user")
        except Exception as e:
            logger.error(f"Adaptive workspace error: {e}")
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
            
            logger.info("🧹 Adaptive workspace cleanup complete")
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")


def main():
    """Main entry point for Adaptive Workspace"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🖥️ DGT Platform - Adaptive Workspace")
    print("=" * 50)
    print("320x240 Adaptive Flight Space")
    print("Widgetized UI with Manual Control")
    print("Tri-Brain AI Architecture")
    print()
    
    # Create and run workspace
    workspace = AdaptiveWorkspace()
    workspace.run()


if __name__ == "__main__":
    main()
