#!/usr/bin/env python3
"""
DGT Tournament Viewer - Multi-Lens Genetic Tournament
Terminal Live Odds + PPU Visual Heats - ADR 127 Implementation

Displays real-time tournament brackets, live odds calculations, and visual race heats
Demonstrates the complete genetic ecosystem with persistent roster management
"""

import sys
import time
import argparse
import threading
import random
from pathlib import Path
from queue import Queue, Empty
from typing import Dict, List, Optional, Any

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger


class TournamentOddsDisplay:
    """Terminal-based live odds display"""
    
    def __init__(self, update_rate_hz: int = 2):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.tournament_service = None
        self.current_tournament_id = None
        
        logger.info("📊 Tournament Odds Display initialized")
    
    def connect_to_services(self, tournament_service) -> bool:
        """Connect to tournament service"""
        self.tournament_service = tournament_service
        logger.info("📊 Connected to tournament service")
        return True
    
    def start(self):
        """Start odds display"""
        if not self.tournament_service:
            logger.error("📊 No tournament service connection")
            return False
        
        self.running = True
        logger.info("📊 Tournament Odds Display started")
        return True
    
    def run(self):
        """Run terminal odds display loop"""
        if not self.start():
            return False
        
        print("📊 DGT TOURNAMENT ODDS TRACKER")
        print("=" * 70)
        print("Live tournament odds and bracket tracking...")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            while self.running:
                # Clear screen
                print("\033[2J\033[H", end="")
                
                # Display tournament header
                print("📊 DGT GENETIC TOURNAMENT")
                print("=" * 70)
                print(f"Time: {time.strftime('%H:%M:%S')}")
                print()
                
                # Get tournament status
                if self.current_tournament_id:
                    status = self.tournament_service.get_tournament_status(self.current_tournament_id)
                    if status:
                        self._display_tournament_status(status)
                        
                        # Display live heat odds
                        live_odds = self.tournament_service.get_live_heat_odds(self.current_tournament_id)
                        if live_odds:
                            self._display_live_odds(live_odds)
                    else:
                        print("No active tournament found")
                else:
                    print("No tournament selected")
                    print("Waiting for tournament to start...")
                
                print()
                print("Updating every 0.5 seconds...")
                
                # Sleep for update rate
                time.sleep(1.0 / self.update_rate_hz)
                
        except KeyboardInterrupt:
            print("\n📊 Odds display stopped by user")
        
        self.running = False
        logger.info("📊 Tournament Odds Display stopped")
        return True
    
    def _display_tournament_status(self, status: Dict[str, Any]):
        """Display tournament status information"""
        print(f"Tournament: {status['name']}")
        print(f"Status: {status['status'].upper()}")
        print(f"Round: {status['current_round']}/{status['total_rounds']}")
        print(f"Matches: {status['completed_matches']}/{status['total_matches']}")
        print(f"Duration: {status['duration']:.1f}s")
        print()
        
        # Display tournament odds
        if status.get('tournament_odds'):
            print("🏆 TOURNAMENT WIN ODDS")
            print("-" * 40)
            
            odds = status['tournament_odds']
            sorted_odds = sorted(odds.items(), key=lambda x: x[1], reverse=True)
            
            for i, (turtle_id, probability) in enumerate(sorted_odds[:8]):
                odds_pct = probability * 100
                print(f"{i+1:2d}. {turtle_id[:12]:12} | {odds_pct:5.1f}%")
        
        print()
    
    def _display_live_odds(self, live_odds: Dict[str, Any]):
        """Display live heat odds"""
        print(f"🔥 LIVE HEAT ODDS - Round {live_odds['round']}, Heat {live_odds['heat']}")
        print("-" * 50)
        
        odds = live_odds['live_odds']
        sorted_odds = sorted(odds.items(), key=lambda x: x[1], reverse=True)
        
        for i, (turtle_id, probability) in enumerate(sorted_odds):
            odds_pct = probability * 100
            bar_length = int(probability * 20)
            bar = "█" * bar_length + "░" * (20 - bar_length)
            print(f"{i+1}. {turtle_id[:10]:10} | {odds_pct:5.1f}% |{bar}")
        
        print()
    
    def set_tournament(self, tournament_id: str):
        """Set current tournament to track"""
        self.current_tournament_id = tournament_id
        logger.info(f"📊 Tracking tournament: {tournament_id}")


class PPUTournamentViewer:
    """PPU visual tournament heat viewer"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.tournament_service = None
        self.client = None
        
        logger.info("🎮 PPU Tournament Viewer initialized")
    
    def connect_to_services(self, tournament_service) -> bool:
        """Connect to tournament service"""
        try:
            from dgt_core.client import UIClient, ClientConfig, DisplayMode
            
            self.tournament_service = tournament_service
            
            # Create communication queue
            queue = Queue(maxsize=10)
            
            # Create PPU client
            client_config = ClientConfig(
                display_mode=DisplayMode.PPU,
                update_rate_hz=self.update_rate_hz,
                local_mode=True
            )
            
            self.client = UIClient(client_config)
            self.client.connect_to_local_server(queue)
            
            logger.info("🎮 PPU Viewer connected to tournament service")
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
        logger.info("🎮 PPU Tournament Viewer started")
        return True
    
    def run(self):
        """Run PPU visualization loop"""
        if not self.start():
            return False
        
        print("🎮 PPU TOURNAMENT HEAT VIEWER")
        print("=" * 50)
        print("Visual tournament heat display...")
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
                    # Create tournament visualization state
                    game_state = self._create_tournament_visualization()
                    
                    if game_state:
                        # Send to client for rendering
                        try:
                            # Note: In a real implementation, this would connect to the server
                            # For now, we'll simulate the visualization
                            pass
                        except:
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
    
    def _create_tournament_visualization(self) -> Optional[Dict[str, Any]]:
        """Create tournament heat visualization state for PPU rendering"""
        if not self.tournament_service:
            return None
        
        # Get current tournament
        # In a real implementation, this would get the active tournament
        # For now, return a demo state
        return {
            'width': 160,
            'height': 144,
            'entities': [
                {
                    'id': 'turtle_1',
                    'x': 40,
                    'y': 50,
                    'type': 'dynamic',
                    'effect': 'pulse',
                    'depth': 2
                },
                {
                    'id': 'turtle_2', 
                    'x': 60,
                    'y': 70,
                    'type': 'dynamic',
                    'effect': 'glow',
                    'depth': 2
                },
                {
                    'id': 'turtle_3',
                    'x': 80,
                    'y': 90,
                    'type': 'dynamic',
                    'effect': None,
                    'depth': 2
                },
                {
                    'id': 'turtle_4',
                    'x': 100,
                    'y': 60,
                    'type': 'dynamic',
                    'effect': 'flicker',
                    'depth': 2
                }
            ],
            'background': {
                'id': 'tournament_track',
                'type': 'baked'
            },
            'hud': {
                'line_1': "🏆 TOURNAMENT HEAT",
                'line_2': "Round 1 - Heat 1",
                'line_3': "4 Turtles Racing",
                'line_4': "Live Odds Available"
            },
            'effects': {
                'ambient_light': 0.9,
                'particle_count': 5,
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
        
        logger.info("🎮 PPU Tournament Viewer stopped")


class GeneticTournamentSystem:
    """Multi-lens genetic tournament coordinator"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.tournament_service = None
        self.odds_display = None
        self.ppu_viewer = None
        
        logger.info("🔄 Genetic Tournament System initialized")
    
    def setup_services(self) -> bool:
        """Setup tournament services"""
        try:
            from dgt_core.simulation.tournament import get_tournament_service
            from dgt_core.simulation.roster import roster_manager
            
            self.tournament_service = get_tournament_service()
            self.roster_manager = roster_manager
            
            logger.info("🔄 Tournament services setup complete")
            return True
            
        except Exception as e:
            logger.error(f"🔄 Failed to setup services: {e}")
            return False
    
    def create_sample_turtles(self, count: int = 20) -> bool:
        """Create sample turtles for tournament"""
        try:
            from dgt_core.simulation.genetics import TurboGenome
            from dgt_core.simulation.roster import TurtleStats
            
            # Create diverse sample turtles
            for i in range(count):
                name = f"Turtle_{i+1:02d}"
                
                # Generate varied genome
                genome = TurboGenome(
                    speed=0.5 + random.random() * 2.0,
                    stamina=0.5 + random.random() * 2.0,
                    intelligence=0.5 + random.random() * 2.0,
                    swim=0.5 + random.random() * 2.0,
                    climb=0.5 + random.random() * 2.0,
                    generation=random.randint(0, 3),
                    mutation_rate=0.05 + random.random() * 0.15
                )
                
                # Create turtle in roster
                turtle_id = self.roster_manager.create_turtle(name, genome)
                
                # Add some race history for variety
                if random.random() < 0.7:  # 70% have some experience
                    for j in range(random.randint(1, 10)):
                        position = random.randint(1, 4)
                        earnings = 100.0 / position
                        self.roster_manager.update_race_result(turtle_id, position, earnings)
            
            logger.info(f"🔄 Created {count} sample turtles")
            return True
            
        except Exception as e:
            logger.error(f"🔄 Failed to create sample turtles: {e}")
            return False
    
    def start_tournament(self) -> Optional[str]:
        """Start a new tournament"""
        tournament_id = self.tournament_service.create_tournament("Genetic Championship", 16)
        
        if tournament_id:
            success = self.tournament_service.start_tournament(tournament_id)
            if success:
                logger.info(f"🔄 Started tournament: {tournament_id}")
                return tournament_id
        
        return None
    
    def run_multi_lens_tournament(self):
        """Run the multi-lens tournament demonstration"""
        print("🔄 DGT GENETIC TOURNAMENT SYSTEM")
        print("=" * 70)
        print("Multi-Lens Tournament: Terminal Odds + PPU Visual Heats")
        print()
        
        # Setup services
        if not self.setup_services():
            print("❌ Failed to setup services")
            return False
        
        # Create sample turtles
        if not self.create_sample_turtles(20):
            print("❌ Failed to create sample turtles")
            return False
        
        # Start tournament
        tournament_id = self.start_tournament()
        if not tournament_id:
            print("❌ Failed to start tournament")
            return False
        
        # Create viewers
        self.odds_display = TournamentOddsDisplay(update_rate_hz=2)
        self.ppu_viewer = PPUTournamentViewer(update_rate_hz=self.update_rate_hz)
        
        # Connect viewers to services
        self.odds_display.connect_to_services(self.tournament_service)
        self.ppu_viewer.connect_to_services(self.tournament_service)
        
        # Set tournament for odds display
        self.odds_display.set_tournament(tournament_id)
        
        print("🏆 Genetic Tournament Started!")
        print("Watch both displays:")
        print("  - Terminal: Live odds and tournament status")
        print("  - PPU Window: Visual heat races")
        print()
        
        try:
            # Run terminal in main thread
            odds_thread = threading.Thread(target=self.odds_display.run, daemon=True)
            odds_thread.start()
            
            # Simulate tournament progression
            self._simulate_tournament_progression(tournament_id)
            
            # Run PPU in main thread
            self.ppu_viewer.run()
            
        except KeyboardInterrupt:
            print("\n🔄 Tournament stopped by user")
        
        finally:
            # Cleanup
            self.stop()
        
        return True
    
    def _simulate_tournament_progression(self, tournament_id: str):
        """Simulate tournament heat progression"""
        logger.info("🔄 Starting tournament progression simulation")
        
        heat_count = 0
        while heat_count < 10:  # Simulate 10 heats
            time.sleep(5.0)  # Wait 5 seconds between heats
            
            # Run next heat
            heat_result = self.tournament_service.run_next_heat(tournament_id)
            
            if heat_result:
                heat_count += 1
                logger.info(f"🔄 Heat {heat_count} completed")
            else:
                # Tournament might be finished
                status = self.tournament_service.get_tournament_status(tournament_id)
                if status and status['status'] == 'finished':
                    logger.info("🔄 Tournament completed")
                    break
                else:
                    logger.warning("🔄 No heat available, waiting...")
    
    def stop(self):
        """Stop all components"""
        logger.info("🔄 Stopping tournament system...")
        
        if self.odds_display:
            self.odds_display.running = False
        
        if self.ppu_viewer:
            self.ppu_viewer.stop()
        
        if self.tournament_service:
            # Cleanup tournament
            if hasattr(self, 'current_tournament_id') and self.current_tournament_id:
                self.tournament_service.cleanup_tournament(self.current_tournament_id)
        
        logger.info("🔄 Tournament system stopped")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="DGT Genetic Tournament System")
    parser.add_argument('--fps', type=int, default=30, help="PPU update rate in Hz")
    parser.add_argument('--verbose', action='store_true', help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    # Create and run tournament system
    system = GeneticTournamentSystem(update_rate_hz=args.fps)
    
    try:
        success = system.run_multi_lens_tournament()
        if not success:
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
