#!/usr/bin/env python3
"""
DGT Race Track Viewer - Selection Track Visualization
Volume 3.5: Digital Darwinism Machine - Kinetic Selection System

Displays top 4 turtles racing on a track with real-time fitness testing
and environmental selection pressure.
"""

import sys
import time
import argparse
from pathlib import Path
from queue import Queue, Empty
from typing import Dict, Any, Optional, List, Tuple

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger


class RaceTrackViewer:
    """Live race track viewer for top turtle performers"""
    
    def __init__(self, update_rate_hz: int = 30, race_distance: float = 100.0):
        self.update_rate_hz = update_rate_hz
        self.race_distance = race_distance
        self.running = False
        self.server = None
        self.client = None
        
        # Race state
        self.current_race_results = {}
        self.race_in_progress = False
        self.last_race_time = 0.0
        self.race_interval = 15.0  # New race every 15 seconds
        
        # Performance tracking
        self.frame_count = 0
        self.last_update_time = time.time()
        
        logger.info("🏁 Race Track Viewer initialized")
    
    def connect_to_server(self) -> bool:
        """Connect to DGT Simulation Server"""
        try:
            from dgt_core.server import SimulationServer, SimulationConfig
            from dgt_core.client import UIClient, ClientConfig, DisplayMode
            
            # Create server with genetics enabled
            server_config = SimulationConfig(
                target_fps=60,
                max_entities=50,
                enable_physics=False,
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
    
    def create_race_track_state(self, top_turtles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create race track visualization state"""
        # Track dimensions (Game Boy parity: 160x144)
        track_width = 160
        track_height = 144
        track_start_x = 10
        track_end_x = 150
        track_y_positions = [30, 50, 70, 90]  # 4 lanes
        
        # Create track background
        track_background = {
            'id': 'race_track_bg',
            'type': 'baked',
            'track_lines': [
                {'x1': track_start_x, 'y1': 20, 'x2': track_end_x, 'y2': 20},   # Start line
                {'x1': track_start_x, 'y1': 110, 'x2': track_end_x, 'y2': 110}, # Finish line
                {'x1': track_start_x, 'y1': 25, 'x2': track_start_x, 'y2': 105}, # Start barrier
                {'x1': track_end_x, 'y1': 25, 'x2': track_end_x, 'y2': 105}   # Finish barrier
            ],
            'lane_markers': [
                {'x1': track_start_x, 'y1': 40, 'x2': track_end_x, 'y2': 40},
                {'x1': track_start_x, 'y1': 60, 'x2': track_end_x, 'y2': 60},
                {'x1': track_start_x, 'y1': 80, 'x2': track_end_x, 'y2': 80},
                {'x1': track_start_x, 'y1': 100, 'x2': track_end_x, 'y2': 100}
            ]
        }
        
        # Create turtle entities for race
        turtle_entities = []
        race_positions = {}
        
        for i, turtle_data in enumerate(top_turtles[:4]):  # Top 4 turtles
            lane_y = track_y_positions[i]
            
            # Calculate race position based on fitness test results
            turtle_id = turtle_data['turtle_id']
            race_time = self.current_race_results.get(turtle_id, float('inf'))
            
            if race_time == float('inf'):
                # Haven't raced yet, start position
                turtle_x = track_start_x
            else:
                # Calculate position based on race progress
                # Faster turtles = further along track
                max_time = max(self.current_race_results.values()) if self.current_race_results else 100
                progress = 1.0 - (race_time / max_time) if max_time > 0 else 0
                turtle_x = track_start_x + (track_end_x - track_start_x) * progress
            
            # Map genetics to visual traits
            shell_pattern = turtle_data.get('shell_pattern', 'solid')
            primary_color = turtle_data.get('primary_color', '#00FF00')
            speed = turtle_data.get('speed', 1.0)
            fitness = turtle_data.get('fitness_score', 0.5)
            
            # Visual effects based on genetics
            effect_map = {
                'solid': None,
                'striped': 'pulse',
                'spotted': 'flicker',
                'spiral': 'sway',
                'camouflage': 'fade'
            }
            
            turtle_entity = {
                'id': f"racer_{i}",
                'x': int(turtle_x),
                'y': lane_y,
                'type': 'dynamic',
                'effect': effect_map.get(shell_pattern, None),
                'depth': 2,
                'genetics': {
                    'original_id': turtle_id,
                    'shell_pattern': shell_pattern,
                    'primary_color': primary_color,
                    'speed': speed,
                    'fitness': fitness,
                    'generation': turtle_data.get('generation', 0),
                    'race_time': race_time,
                    'lane': i + 1
                }
            }
            
            turtle_entities.append(turtle_entity)
            race_positions[turtle_id] = {'x': turtle_x, 'y': lane_y, 'lane': i + 1}
        
        # Create race decorations
        decorations = []
        
        # Start/Finish flags
        decorations.append({
            'id': 'start_flag',
            'x': track_start_x,
            'y': 15,
            'type': 'static',
            'depth': 1
        })
        
        decorations.append({
            'id': 'finish_flag',
            'x': track_end_x,
            'y': 15,
            'type': 'static',
            'depth': 1
        })
        
        # Speed indicators for fast turtles
        for i, turtle_data in enumerate(top_turtles[:4]):
            if turtle_data.get('speed', 0) > 1.2:
                decorations.append({
                    'id': f'speed_trail_{i}',
                    'x': turtle_entities[i]['x'] - 5,
                    'y': turtle_entities[i]['y'],
                    'type': 'effect',
                    'effect': 'flicker',
                    'depth': 3
                })
        
        # Create race HUD
        hud_data = {
            'line_1': f"🏁 TURTLE RACE ({self.race_distance}m)",
            'line_2': f"Generation: {top_turtles[0].get('generation', 0) if top_turtles else 0}",
            'line_3': f"Race Time: {time.time() - self.last_race_time:.1f}s" if self.race_in_progress else "Ready to Race",
            'line_4': f"Next Race: {max(0, self.race_interval - (time.time() - self.last_race_time)):.1f}s"
        }
        
        return {
            'width': track_width,
            'height': track_height,
            'entities': turtle_entities + decorations,
            'background': track_background,
            'hud': hud_data,
            'effects': {
                'ambient_light': 0.8,
                'particle_count': 5,
                'weather': 'clear'
            },
            'race_data': {
                'distance': self.race_distance,
                'lanes': 4,
                'positions': race_positions,
                'results': self.current_race_results,
                'in_progress': self.race_in_progress
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
        """Start the race track viewer"""
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
        logger.info("🏁 Race Track Viewer started")
        return True
    
    def run(self):
        """Main race visualization loop"""
        if not self.start():
            return False
        
        print("🏁 DGT Race Track Viewer")
        print("=" * 50)
        print("Watching top 4 turtles compete...")
        print("Close window to stop")
        print()
        
        try:
            while self.running:
                current_time = time.time()
                
                # Update at target rate
                if current_time - self.last_update_time >= 1.0 / self.update_rate_hz:
                    # Check if it's time for a new race
                    if current_time - self.last_race_time >= self.race_interval:
                        self._start_new_race()
                        self.last_race_time = current_time
                    
                    # Get top turtles for visualization
                    top_turtles = self._get_top_turtles(4)
                    
                    if top_turtles:
                        # Create race visualization state
                        game_state = self.create_race_track_state(top_turtles)
                        
                        # Send to client for rendering
                        try:
                            self.server.state_queue.put_nowait(game_state)
                        except:
                            # Queue full, skip this frame
                            pass
                        
                        # Log race progress
                        if self.frame_count % 180 == 0:  # Every 6 seconds at 30Hz
                            if self.race_in_progress and self.current_race_results:
                                fastest = min(self.current_race_results.items(), key=lambda x: x[1])
                                logger.info(f"🏁 Race leader: {fastest[0][:12]}... ({fastest[1]:.2f}s)")
                    
                    self.frame_count += 1
                    self.last_update_time = current_time
                
                # Small sleep to prevent CPU overload
                time.sleep(0.001)
                
        except KeyboardInterrupt:
            print("\n🛑 Viewer stopped by user")
        except Exception as e:
            if "window was closed" in str(e).lower():
                print("\n🏁 Viewer window closed")
            else:
                logger.error(f"❌ Viewer error: {e}")
                raise e
        
        finally:
            self.stop()
        
        return True
    
    def _start_new_race(self):
        """Start a new fitness test race"""
        if not self.server or not self.server.genetic_service:
            return
        
        logger.info("🏁 Starting new fitness test race...")
        self.race_in_progress = True
        
        # Run fitness test on current population
        self.current_race_results = self.server.genetic_service.fitness_test(self.race_distance)
        
        # Log race results
        if self.current_race_results:
            top_3 = list(self.current_race_results.items())[:3]
            logger.info("🏆 Race Results:")
            for i, (turtle_id, race_time) in enumerate(top_3):
                logger.info(f"  {i+1}. {turtle_id[:12]}... - {race_time:.2f}s")
        
        self.race_in_progress = False
    
    def _get_top_turtles(self, limit: int = 4) -> List[Dict[str, Any]]:
        """Get top turtles by fitness for race visualization"""
        if not self.server or not self.server.genetic_service:
            return []
        
        # Get alpha turtle and population stats
        alpha_turtle = self.server.genetic_service.get_alpha_turtle()
        if not alpha_turtle:
            return []
        
        # Get population and sort by fitness
        population = []
        for turtle_id, genome in self.server.genetic_service.turtles.items():
            packet = self.server.genetic_service.create_turtle_packet(turtle_id)
            if packet:
                population.append({
                    'turtle_id': turtle_id,
                    'generation': packet.generation,
                    'shell_pattern': packet.shell_pattern,
                    'primary_color': packet.primary_color,
                    'secondary_color': packet.secondary_color,
                    'speed': packet.speed,
                    'stamina': packet.stamina,
                    'intelligence': packet.intelligence,
                    'fitness_score': packet.fitness_score
                })
        
        # Sort by fitness (descending) and take top performers
        population.sort(key=lambda x: x['fitness_score'], reverse=True)
        
        return population[:limit]
    
    def stop(self):
        """Stop the viewer"""
        self.running = False
        
        if self.client:
            self.client.stop()
            self.client.cleanup()
        
        if self.server:
            self.server.stop()
            self.server.cleanup()
        
        logger.info("🏁 Race Track Viewer stopped")
    
    def get_race_stats(self) -> Dict[str, Any]:
        """Get current race statistics"""
        if not self.server or not self.server.genetic_service:
            return {}
        
        return {
            'race_distance': self.race_distance,
            'current_results': self.current_race_results,
            'race_in_progress': self.race_in_progress,
            'last_race_time': self.last_race_time,
            'next_race_in': max(0, self.race_interval - (time.time() - self.last_race_time)),
            'population_stats': self.server.genetic_service.get_population_stats()
        }


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="DGT Race Track Viewer")
    parser.add_argument('--fps', type=int, default=30, help="Update rate in Hz")
    parser.add_argument('--distance', type=float, default=100.0, help="Race distance in meters")
    parser.add_argument('--verbose', action='store_true', help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    # Create and run viewer
    viewer = RaceTrackViewer(update_rate_hz=args.fps, race_distance=args.distance)
    
    try:
        success = viewer.run()
        if not success:
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
