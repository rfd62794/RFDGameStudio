#!/usr/bin/env python3
"""
DGT Genetic Lab Viewer - Alpha Turtle Visualization
Volume 3: Creative Genesis - Live genetic breeding visualization

Connects to DGT Simulation Server to display the current Alpha Turtle
from the genetic breeding service in real-time.
"""

import sys
import time
import argparse
from pathlib import Path
from queue import Queue, Empty
from typing import Dict, Any, Optional

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger


class GeneticLabViewer:
    """Live viewer for genetic breeding laboratory"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.server = None
        self.client = None
        
        # Performance tracking
        self.frame_count = 0
        self.last_update_time = time.time()
        
        logger.info("🧬 Genetic Lab Viewer initialized")
    
    def connect_to_server(self) -> bool:
        """Connect to DGT Simulation Server"""
        try:
            from dgt_core.server import SimulationServer, SimulationConfig
            from dgt_core.client import UIClient, ClientConfig, DisplayMode
            
            # Create server with genetics enabled
            server_config = SimulationConfig(
                target_fps=60,
                max_entities=50,
                enable_physics=False,  # Disable for pure genetics
                enable_genetics=True,
                enable_d20=False,
                log_to_file=False
            )
            
            self.server = SimulationServer(server_config)
            
            # Create communication queue
            queue = Queue(maxsize=10)
            self.server.state_queue = queue
            
            # Create PPU client
            client_config = ClientConfig(
                display_mode=DisplayMode.PPU,
                update_rate_hz=self.update_rate_hz,
                local_mode=True
            )
            
            self.client = UIClient(client_config)
            self.client.connect_to_local_server(queue)
            
            logger.info("🔗 Connected to simulation server")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to server: {e}")
            return False
    
    def create_turtle_game_state(self, alpha_turtle: Dict[str, Any]) -> Dict[str, Any]:
        """Create game state featuring the alpha turtle"""
        # Convert turtle genetics to visual representation
        shell_pattern = alpha_turtle.get('shell_pattern', 'solid')
        primary_color = alpha_turtle.get('primary_color', '#00FF00')
        secondary_color = alpha_turtle.get('secondary_color', '#FFFFFF')
        speed = alpha_turtle.get('speed', 1.0)
        fitness = alpha_turtle.get('fitness_score', 0.5)
        
        # Map genetics to visual effects
        effect_map = {
            'solid': None,
            'striped': 'pulse',
            'spotted': 'flicker',
            'spiral': 'sway',
            'camouflage': 'fade'
        }
        
        # Create turtle entity with genetic traits
        turtle_entity = {
            'id': alpha_turtle.get('turtle_id', 'alpha_turtle'),
            'x': 80,  # Center of 160px width
            'y': 72,  # Center of 144px height
            'type': 'dynamic',
            'effect': effect_map.get(shell_pattern, None),
            'depth': 2,
            'genetics': {
                'shell_pattern': shell_pattern,
                'primary_color': primary_color,
                'secondary_color': secondary_color,
                'speed': speed,
                'fitness': fitness,
                'generation': alpha_turtle.get('generation', 0)
            }
        }
        
        # Create decorative entities based on genetics
        decorations = []
        
        # Add speed indicators (particles)
        if speed > 1.5:
            for i in range(int(speed * 3)):
                decorations.append({
                    'id': f'speed_particle_{i}',
                    'x': 80 + (i - 3) * 10,
                    'y': 72 + (i % 2) * 5 - 5,
                    'type': 'effect',
                    'effect': 'flicker',
                    'depth': 3
                })
        
        # Add fitness aura
        if fitness > 0.8:
            decorations.append({
                'id': 'fitness_aura',
                'x': 80,
                'y': 72,
                'type': 'effect',
                'effect': 'pulse',
                'depth': 1
            })
        
        # Create genetic HUD
        hud_data = {
            'line_1': f"🧬 Alpha Turtle",
            'line_2': f"Gen: {alpha_turtle.get('generation', 0)}",
            'line_3': f"Fitness: {fitness:.3f}",
            'line_4': f"Speed: {speed:.2f}"
        }
        
        return {
            'width': 160,
            'height': 144,
            'entities': [turtle_entity] + decorations,
            'background': {
                'id': 'genetic_lab_bg',
                'type': 'baked'
            },
            'hud': hud_data,
            'effects': {
                'ambient_light': 0.7 + fitness * 0.3,  # Brighter for higher fitness
                'particle_count': int(speed * 5),
                'weather': 'clear'
            },
            'frame': {
                'count': self.frame_count,
                'fps': self._get_current_fps(),
                'delta_time': time.time() - self.last_update_time
            }
        }
    
    def _get_current_fps(self) -> float:
        """Calculate current FPS"""
        current_time = time.time()
        delta_time = current_time - self.last_update_time
        return 1.0 / delta_time if delta_time > 0 else self.update_rate_hz
    
    def start(self) -> bool:
        """Start the genetic lab viewer"""
        if not self.connect_to_server():
            return False
        
        # Start server and client
        if not self.server.start():
            logger.error("❌ Failed to start server")
            return False
        
        if not self.client.start():
            logger.error("❌ Failed to start client")
            self.server.stop()
            return False
        
        self.running = True
        logger.info("🧬 Genetic Lab Viewer started")
        return True
    
    def run(self):
        """Main visualization loop"""
        if not self.start():
            return False
        
        print("🧬 DGT Genetic Lab Viewer")
        print("=" * 50)
        print("Watching Alpha Turtle evolution...")
        print("Close window to stop")
        print()
        
        try:
            while self.running:
                current_time = time.time()
                
                # Update at target rate
                if current_time - self.last_update_time >= 1.0 / self.update_rate_hz:
                    # Get alpha turtle from server
                    alpha_turtle = self.server.get_alpha_turtle_state()
                    
                    if alpha_turtle:
                        # Create visualization state
                        game_state = self.create_turtle_game_state(alpha_turtle)
                        
                        # Send to client for rendering
                        try:
                            self.server.state_queue.put_nowait(game_state)
                        except:
                            # Queue full, skip this frame
                            pass
                        
                        # Log genetic progress
                        if self.frame_count % 180 == 0:  # Every 6 seconds at 30Hz
                            generation = alpha_turtle.get('generation', 0)
                            fitness = alpha_turtle.get('fitness_score', 0)
                            logger.info(f"🧬 Gen {generation}: Fitness {fitness:.3f}")
                    
                    self.frame_count += 1
                    self.last_update_time = current_time
                
                # Small sleep to prevent CPU overload
                time.sleep(0.001)
                
        except KeyboardInterrupt:
            print("\n🛑 Viewer stopped by user")
        except Exception as e:
            if "window was closed" in str(e).lower():
                print("\n🧬 Viewer window closed")
            else:
                logger.error(f"❌ Viewer error: {e}")
                raise e
        
        finally:
            self.stop()
        
        return True
    
    def stop(self):
        """Stop the viewer"""
        self.running = False
        
        if self.client:
            self.client.stop()
            self.client.cleanup()
        
        if self.server:
            self.server.stop()
            self.server.cleanup()
        
        logger.info("🧬 Genetic Lab Viewer stopped")
    
    def get_genetic_stats(self) -> Dict[str, Any]:
        """Get current genetic statistics"""
        if self.server:
            return self.server.get_genetic_stats()
        return {}


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="DGT Genetic Lab Viewer")
    parser.add_argument('--fps', type=int, default=30, help="Update rate in Hz")
    parser.add_argument('--verbose', action='store_true', help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    # Create and run viewer
    viewer = GeneticLabViewer(update_rate_hz=args.fps)
    
    try:
        success = viewer.run()
        if not success:
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
