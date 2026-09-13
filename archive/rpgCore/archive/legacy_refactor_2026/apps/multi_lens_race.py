#!/usr/bin/env python3
"""
DGT Multi-Lens Race Viewer
Terminal Leaderboard + PPU Visual Sprint - Architectural Convergence Demo

Demonstrates the Body-Soul integration: Terminal shows data, PPU shows visuals
Server handles all logic, clients just display their perspective
"""

import sys
import time
import argparse
import threading
from pathlib import Path
from queue import Queue, Empty
from typing import Dict, Any, Optional, List

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger


class TerminalLeaderboard:
    """Terminal-based race leaderboard display"""
    
    def __init__(self, update_rate_hz: int = 5):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.server = None
        
        logger.info("📊 Terminal Leaderboard initialized")
    
    def connect_to_server(self, server) -> bool:
        """Connect to simulation server"""
        self.server = server
        logger.info("📊 Connected to simulation server")
        return True
    
    def start(self):
        """Start terminal leaderboard"""
        if not self.server:
            logger.error("📊 No server connection")
            return False
        
        self.running = True
        logger.info("📊 Terminal Leaderboard started")
        return True
    
    def run(self):
        """Run terminal display loop"""
        if not self.start():
            return False
        
        print("📊 DGT RACE LEADERBOARD")
        print("=" * 60)
        print("Live race data from simulation server...")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            while self.running:
                # Get leaderboard data
                leaderboard = self.server.get_race_leaderboard(10)
                
                # Clear screen (simple method)
                print("\033[2J\033[H", end="")
                
                # Display header
                print("📊 DGT RACE LEADERBOARD")
                print("=" * 60)
                print(f"Time: {time.strftime('%H:%M:%S')}")
                print()
                
                if leaderboard:
                    # Display leaderboard
                    print("Pos | Turtle ID          | Checkpoint | Distance | Speed | Stamina")
                    print("-" * 60)
                    
                    for entry in leaderboard:
                        pos = entry.get('position', 0)
                        turtle_id = entry.get('turtle_id', 'unknown')[:16].ljust(16)
                        checkpoint = entry.get('checkpoint', 0)
                        distance = entry.get('distance', 0)
                        speed = entry.get('speed', 0)
                        stamina = entry.get('stamina', 0)
                        
                        print(f"{pos:3d} | {turtle_id} | {checkpoint:10d} | {distance:8.1f} | {speed:5.2f} | {stamina:7.1f}")
                else:
                    print("No race in progress")
                
                print()
                print("Updating every 0.2 seconds...")
                
                # Sleep for update rate
                time.sleep(1.0 / self.update_rate_hz)
                
        except KeyboardInterrupt:
            print("\n📊 Leaderboard stopped by user")
        
        self.running = False
        logger.info("📊 Terminal Leaderboard stopped")
        return True


class PPURaceViewer:
    """PPU visual race viewer"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.server = None
        self.client = None
        
        logger.info("🎮 PPU Race Viewer initialized")
    
    def connect_to_server(self, server) -> bool:
        """Connect to simulation server"""
        try:
            from dgt_core.client import UIClient, ClientConfig, DisplayMode
            
            self.server = server
            
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
            
            logger.info("🎮 PPU Viewer connected to server")
            return True
            
        except Exception as e:
            logger.error(f"🎮 Failed to connect PPU viewer: {e}")
            return False
    
    def start(self) -> bool:
        """Start PPU viewer"""
        if not self.client:
            logger.error("🎮 No client connection")
            return False
        
        if not self.client.start():
            logger.error("🎮 Failed to start client")
            return False
        
        self.running = True
        logger.info("🎮 PPU Race Viewer started")
        return True
    
    def run(self):
        """Run PPU visualization loop"""
        if not self.start():
            return False
        
        print("🎮 PPU RACE VIEWER")
        print("=" * 50)
        print("Visual race display running...")
        print("Close window to stop")
        print()
        
        try:
            frame_count = 0
            last_time = time.time()
            
            while self.running:
                current_time = time.time()
                delta_time = current_time - last_time
                
                # Target 30 FPS
                if delta_time >= 1.0 / 30:
                    # Create race visualization state
                    game_state = self._create_race_visualization()
                    
                    if game_state:
                        # Send to client for rendering
                        try:
                            self.server.state_queue.put_nowait(game_state)
                        except:
                            # Queue full, skip this frame
                            pass
                    
                    frame_count += 1
                    last_time = current_time
                
                # Small sleep to prevent CPU overload
                time.sleep(0.001)
                
        except KeyboardInterrupt:
            print("\n🎮 Viewer stopped by user")
        except Exception as e:
            if "window was closed" in str(e).lower():
                print("\n🎮 Viewer window closed")
            else:
                logger.error(f"🎮 Viewer error: {e}")
                raise e
        
        finally:
            self.stop()
        
        return True
    
    def _create_race_visualization(self) -> Optional[Dict[str, Any]]:
        """Create race visualization state for PPU rendering"""
        if not self.server or not self.server.racing_service:
            return None
        
        # Get race state
        race_state = self.server.racing_service._get_race_state()
        
        if not race_state.get('race_active', False):
            return None
        
        # Create PPU-compatible visualization
        track_width = 160
        track_height = 144
        
        # Scale race coordinates to PPU dimensions
        scale_x = track_width / 800.0  # Original track width
        scale_y = track_height / 600.0  # Original track height
        
        # Create turtle entities
        turtle_entities = []
        
        for turtle_id, racer_data in race_state.get('racers', {}).items():
            # Scale coordinates
            x = int(racer_data['x'] * scale_x)
            y = int(racer_data['y'] * scale_y)
            
            # Get position for visual effects
            position = racer_data.get('position', 1)
            
            # Visual effects based on position
            effect_map = {
                1: 'pulse',    # Leader - pulsing
                2: 'glow',     # Second place - glowing
                3: None,       # Third place - normal
                4: 'flicker'   # Others - flickering
            }
            
            effect = effect_map.get(position, 'flicker')
            
            turtle_entity = {
                'id': f"racer_{turtle_id[:8]}",
                'x': max(0, min(track_width, x)),
                'y': max(0, min(track_height, y)),
                'type': 'dynamic',
                'effect': effect,
                'depth': 2,
                'race_data': {
                    'position': position,
                    'speed': racer_data.get('speed', 0),
                    'stamina': racer_data.get('stamina', 0),
                    'checkpoint': racer_data.get('current_checkpoint', 0)
                }
            }
            
            turtle_entities.append(turtle_entity)
        
        # Create track background
        track_background = {
            'id': 'race_track_ppu',
            'type': 'baked',
            'track_lines': [
                # Simple oval track representation
                {'x1': 20, 'y1': 20, 'x2': 140, 'y2': 20},   # Top
                {'x1': 140, 'y1': 20, 'x2': 140, 'y2': 124}, # Right
                {'x1': 140, 'y1': 124, 'x2': 20, 'y2': 124}, # Bottom
                {'x1': 20, 'y1': 124, 'x2': 20, 'y2': 20}    # Left
            ]
        }
        
        # Create race HUD
        race_time = race_state.get('race_time', 0)
        hud_data = {
            'line_1': f"🏁 RACE IN PROGRESS",
            'line_2': f"Time: {race_time:.1f}s",
            'line_3': f"Racers: {len(turtle_entities)}",
            'line_4': f"FPS: 30"
        }
        
        return {
            'width': track_width,
            'height': track_height,
            'entities': turtle_entities,
            'background': track_background,
            'hud': hud_data,
            'effects': {
                'ambient_light': 0.8,
                'particle_count': 3,
                'weather': 'clear'
            },
            'frame': {
                'count': frame_count,
                'fps': 30.0,
                'delta_time': delta_time
            }
        }
    
    def stop(self):
        """Stop PPU viewer"""
        self.running = False
        
        if self.client:
            self.client.stop()
            self.client.cleanup()
        
        logger.info("🎮 PPU Race Viewer stopped")


class MultiLensRaceSystem:
    """Multi-lens race system coordinator"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.server = None
        self.terminal = None
        self.ppu_viewer = None
        
        logger.info("🔄 Multi-Lens Race System initialized")
    
    def setup_server(self) -> bool:
        """Setup simulation server with racing enabled"""
        try:
            from dgt_core.server import SimulationServer, SimulationConfig
            from dgt_core.simulation.genetics import TurboGenome
            
            # Create server with racing enabled
            config = SimulationConfig(
                target_fps=60,
                max_entities=20,
                enable_physics=False,
                enable_genetics=True,
                enable_racing=True,
                enable_d20=False,
                log_to_file=False
            )
            
            self.server = SimulationServer(config)
            
            # Create test turtles with diverse genetics
            test_turtles = self._create_test_turtles()
            
            # Register turtles with server
            for turtle_id, genome in test_turtles.items():
                entity = self.server.entity_system.Entity(
                    id=turtle_id,
                    x=50,  # Start position
                    y=50,
                    entity_type="racing_turtle",
                    metadata={
                        'generation': genome.generation,
                        'genome_data': genome.dict(),
                        'fitness_score': genome.calculate_fitness()
                    }
                )
                self.server.entity_system.add_entity(entity)
            
            logger.info(f"🔄 Server setup complete with {len(test_turtles)} test turtles")
            return True
            
        except Exception as e:
            logger.error(f"🔄 Failed to setup server: {e}")
            return False
    
    def _create_test_turtles(self) -> Dict[str, TurboGenome]:
        """Create test turtles with diverse genetics"""
        turtles = {}
        
        # Fast turtle
        turtles['speedster'] = TurboGenome(
            speed=2.5,
            stamina=0.8,
            intelligence=1.2,
            shell_base_color=(255, 0, 0),  # Red
            generation=0
        )
        
        # Balanced turtle
        turtles['balanced'] = TurboGenome(
            speed=1.0,
            stamina=1.0,
            intelligence=1.0,
            shell_base_color=(0, 255, 0),  # Green
            generation=0
        )
        
        # Endurance turtle
        turtles['endurance'] = TurboGenome(
            speed=0.7,
            stamina=2.5,
            intelligence=0.9,
            shell_base_color=(0, 0, 255),  # Blue
            generation=0
        )
        
        # Smart turtle
        turtles['smart'] = TurboGenome(
            speed=1.2,
            stamina=1.1,
            intelligence=2.8,
            shell_base_color=(255, 255, 0),  # Yellow
            generation=0
        )
        
        return turtles
    
    def start_race(self) -> bool:
        """Start the race with all registered turtles"""
        if not self.server:
            logger.error("🔄 No server available")
            return False
        
        # Get all turtle entities
        turtle_ids = [
            entity_id for entity_id, entity in self.server.entity_system.entities.items()
            if entity.entity_type == "racing_turtle"
        ]
        
        if len(turtle_ids) < 2:
            logger.error("🔄 Need at least 2 turtles to race")
            return False
        
        # Start the race
        success = self.server.start_race(turtle_ids)
        
        if success:
            logger.info(f"🔄 Race started with {len(turtle_ids)} participants")
        
        return success
    
    def run_multi_lens_demo(self):
        """Run the multi-lens demonstration"""
        print("🔄 DGT MULTI-LENS RACE DEMONSTRATION")
        print("=" * 60)
        print("Architectural Convergence: Terminal + PPU + Server")
        print()
        
        # Setup server
        if not self.setup_server():
            print("❌ Failed to setup server")
            return False
        
        # Start server
        if not self.server.start():
            print("❌ Failed to start server")
            return False
        
        # Create viewers
        self.terminal = TerminalLeaderboard(update_rate_hz=5)
        self.ppu_viewer = PPURaceViewer(update_rate_hz=self.update_rate_hz)
        
        # Connect viewers to server
        self.terminal.connect_to_server(self.server)
        self.ppu_viewer.connect_to_server(self.server)
        
        # Start race
        if not self.start_race():
            print("❌ Failed to start race")
            self.server.stop()
            return False
        
        print("🏁 Race started! Watch both displays:")
        print("  - Terminal: Live leaderboard with data")
        print("  - PPU Window: Visual race simulation")
        print()
        
        try:
            # Run terminal in main thread
            terminal_thread = threading.Thread(target=self.terminal.run, daemon=True)
            terminal_thread.start()
            
            # Run PPU in main thread
            self.ppu_viewer.run()
            
        except KeyboardInterrupt:
            print("\n🔄 Demo stopped by user")
        
        finally:
            # Cleanup
            self.stop()
        
        return True
    
    def stop(self):
        """Stop all components"""
        logger.info("🔄 Stopping multi-lens system...")
        
        if self.terminal:
            self.terminal.running = False
        
        if self.ppu_viewer:
            self.ppu_viewer.stop()
        
        if self.server:
            # Save race log
            self.server.save_race_log()
            self.server.stop()
            self.server.cleanup()
        
        logger.info("🔄 Multi-lens system stopped")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="DGT Multi-Lens Race Demo")
    parser.add_argument('--fps', type=int, default=30, help="PPU update rate in Hz")
    parser.add_argument('--verbose', action='store_true', help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    # Create and run multi-lens system
    system = MultiLensRaceSystem(update_rate_hz=args.fps)
    
    try:
        success = system.run_multi_lens_demo()
        if not success:
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
