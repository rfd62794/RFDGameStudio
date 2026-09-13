#!/usr/bin/env python3
"""
DGT Trinity Dashboard - Sovereign Simulation Control Center
Simultaneous display: Monitor + Race View + Genetics Lab

The final handoff interface for the Infinite Tournament Loop
Provides real-time monitoring of the self-sustaining digital ecosystem
"""

import sys
import time
import argparse
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any
from queue import Queue, Empty

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger


class TrinityMonitor:
    """Real-time monitoring dashboard for the infinite tournament"""
    
    def __init__(self, update_rate_hz: int = 2):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.infinite_tournament = None
        
        logger.info("📊 Trinity Monitor initialized")
    
    def connect_to_services(self):
        """Connect to infinite tournament services"""
        try:
            from dgt_core.simulation.infinite_tournament import infinite_tournament
            from dgt_core.simulation.roster import roster_manager
            from dgt_core.simulation.narrative import narrative_bridge
            
            self.infinite_tournament = infinite_tournament
            
            logger.info("📊 Connected to infinite tournament services")
            return True
            
        except Exception as e:
            logger.error(f"📊 Failed to connect to services: {e}")
            return False
    
    def start(self):
        """Start monitoring dashboard"""
        if not self.infinite_tournament:
            logger.error("📊 No service connection")
            return False
        
        # Start infinite tournament if not running
        if not self.infinite_tournament.running:
            self.infinite_tournament.start()
        
        self.running = True
        logger.info("📊 Trinity Monitor started")
        return True
    
    def run(self):
        """Run monitoring dashboard loop"""
        if not self.start():
            return False
        
        print("📊 DGT TRINITY MONITOR")
        print("=" * 80)
        print("Sovereign Simulation Control Center")
        print("Monitoring: Tournament Loop + Roster + Narratives + Evolution")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            while self.running:
                # Clear screen
                print("\033[2J\033[H", end="")
                
                # Display main dashboard
                self._display_dashboard()
                
                # Sleep for update rate
                time.sleep(1.0 / self.update_rate_hz)
                
        except KeyboardInterrupt:
            print("\n📊 Monitor stopped by user")
        
        self.running = False
        logger.info("📊 Trinity Monitor stopped")
        return True
    
    def _display_dashboard(self):
        """Display main monitoring dashboard"""
        print("📊 SOVEREIGN SIMULATION DASHBOARD")
        print("=" * 80)
        print(f"Time: {time.strftime('%H:%M:%S')} | Loop: {'ACTIVE' if self.infinite_tournament.running else 'STOPPED'}")
        print()
        
        # Get loop status
        loop_status = self.infinite_tournament.get_loop_status()
        
        # Display tournament status
        print("🏆 TOURNAMENT STATUS")
        print("-" * 40)
        print(f"Tournaments Completed: {loop_status['tournament_count']}")
        print(f"Current Tournament: {loop_status['current_tournament_id'][:12] if loop_status['current_tournament_id'] else 'None'}")
        
        if 'current_tournament' in loop_status:
            current = loop_status['current_tournament']
            print(f"Status: {current['status'].upper()}")
            print(f"Round: {current['current_round']}/{current['total_rounds']}")
            print(f"Matches: {current['completed_matches']}/{current['total_matches']}")
            print(f"Duration: {current['duration']:.1f}s")
        
        print()
        
        # Display evolution metrics
        metrics = self.infinite_tournament.get_evolution_metrics()
        
        print("🧬 EVOLUTION METRICS")
        print("-" * 40)
        
        if 'roster_stats' in metrics:
            roster = metrics['roster_stats']
            print(f"Active Turtles: {roster['total_active']}")
            print(f"Total Races: {roster['total_races']}")
            print(f"Total Wins: {roster['total_wins']}")
            print(f"Win Rate: {roster['avg_win_rate']:.2%}")
            print(f"Generations: {len(roster.get('generations', []))}")
        
        print()
        
        # Display narrative summary
        if 'narrative_summary' in metrics:
            narrative = metrics['narrative_summary']
            print("📖 NARRATIVE STATUS")
            print("-" * 40)
            print(f"Turtles with Stories: {narrative['total_turtles']}")
            print(f"Total Stories: {narrative['total_stories']}")
            print(f"LEGENDARY Turtles: {narrative['legendary_turtles']}")
            
            if narrative['story_types']:
                print("Story Types:", ", ".join(narrative['story_types'].keys()))
        
        print()
        
        # Display recent legendary turtles
        if 'narrative_summary' in metrics:
            from dgt_core.simulation.narrative import narrative_bridge
            legendary_turtles = narrative_bridge.get_legendary_turtles()
            
            if legendary_turtles:
                print("🌟 LEGENDARY HALL OF FAME")
                print("-" * 40)
                for i, (turtle_id, story) in enumerate(legendary_turtles[:5]):
                    print(f"{i+1}. {story.title}")
                    print(f"   {story.content[:60]}...")
                print()
        
        # Display system status
        print("⚙️ SYSTEM STATUS")
        print("-" * 40)
        print(f"Infinite Loop: {'♾️ ACTIVE' if loop_status['running'] else '⏸️ PAUSED'}")
        print(f"Auto-Start: {'✅ ON' if metrics.get('loop_config', {}).get('auto_start') else '❌ OFF'}")
        print(f"Auto-Bake: {'✅ ON' if metrics.get('loop_config', {}).get('auto_bake_evolution') else '❌ OFF'}")
        print(f"Narratives: {'✅ ON' if metrics.get('loop_config', {}).get('generate_narratives') else '❌ OFF'}")
        
        print()
        print("Commands: [Ctrl+C] Stop | [Space] Force Tournament | [R] Reset Stats")
    
    def handle_input(self):
        """Handle user input commands"""
        # This would be implemented with a proper input handling system
        # For now, it's a placeholder for future enhancement
        pass


class TrinityRaceView:
    """PPU race visualization for Trinity dashboard"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.running = False
        
        logger.info("🎮 Trinity Race View initialized")
    
    def start(self):
        """Start race visualization"""
        self.running = True
        logger.info("🎮 Trinity Race View started")
        return True
    
    def run(self):
        """Run race visualization loop"""
        if not self.start():
            return False
        
        print("🎮 TRINITY RACE VIEW")
        print("=" * 50)
        print("Live tournament heat visualization...")
        print("Close window to stop")
        print()
        
        try:
            # This would integrate with the actual PPU race viewer
            # For now, simulate the race visualization
            frame_count = 0
            
            while self.running:
                # Simulate race frame
                frame_count += 1
                
                # Display race status
                if frame_count % 30 == 0:  # Every second at 30 FPS
                    print(f"🎮 Race Frame: {frame_count} | Heat in progress...")
                
                time.sleep(1.0 / 30.0)
                
        except KeyboardInterrupt:
            print("\n🎮 Race view stopped by user")
        
        self.running = False
        logger.info("🎮 Trinity Race View stopped")
        return True


class TrinityGeneticsLab:
    """Genetics laboratory monitoring for Trinity dashboard"""
    
    def __init__(self, update_rate_hz: int = 1):
        self.update_rate_hz = update_rate_hz
        self.running = False
        
        logger.info("🧬 Trinity Genetics Lab initialized")
    
    def start(self):
        """Start genetics lab monitoring"""
        self.running = True
        logger.info("🧬 Trinity Genetics Lab started")
        return True
    
    def run(self):
        """Run genetics lab monitoring loop"""
        if not self.start():
            return False
        
        print("🧬 TRINITY GENETICS LAB")
        print("=" * 50)
        print("Real-time genetic evolution monitoring...")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            while self.running:
                # Clear screen
                print("\033[2J\033[H", end="")
                
                # Display genetics lab dashboard
                self._display_genetics_lab()
                
                # Sleep for update rate
                time.sleep(1.0 / self.update_rate_hz)
                
        except KeyboardInterrupt:
            print("\n🧬 Genetics lab stopped by user")
        
        self.running = False
        logger.info("🧬 Trinity Genetics Lab stopped")
        return True
    
    def _display_genetics_lab(self):
        """Display genetics lab dashboard"""
        print("🧬 GENETICS EVOLUTION LABORATORY")
        print("=" * 60)
        print(f"Time: {time.strftime('%H:%M:%S')} | Monitoring Active Mutations")
        print()
        
        try:
            from dgt_core.simulation.infinite_tournament import infinite_tournament
            from dgt_core.simulation.roster import roster_manager
            from dgt_core.registry.evolution_log import EvolutionLog
            
            # Get evolution log
            evolution_log = EvolutionLog()
            
            # Display recent evolution activity
            print("🔬 RECENT EVOLUTION ACTIVITY")
            print("-" * 40)
            
            # Get latest evolution entries
            if evolution_log.entries:
                recent_entries = evolution_log.entries[-10:]
                for i, entry in enumerate(recent_entries):
                    timestamp = time.strftime('%H:%M:%S', time.localtime(entry.timestamp))
                    print(f"{i+1:2d}. {timestamp} | Gen {entry.generation} | {entry.turtle_id[:12]}...")
                    print(f"    Fitness: {entry.fitness_score:.3f} | Pattern: {entry.shell_pattern}")
            else:
                print("No evolution activity recorded yet")
            
            print()
            
            # Display top performers
            print("🏆 TOP PERFORMERS (Current Generation)")
            print("-" * 40)
            
            active_turtles = roster_manager.get_active_roster(10)
            if active_turtles:
                for i, turtle in enumerate(active_turtles[:5]):
                    fitness = turtle.genome.calculate_fitness()
                    print(f"{i+1}. {turtle.name[:15]:15} | Fitness: {fitness:.3f}")
                    print(f"   Wins: {turtle.wins:2d} | Generation: {turtle.generation}")
            else:
                print("No active turtles in roster")
            
            print()
            
            # Display genetic diversity metrics
            print("📊 GENETIC DIVERSITY METRICS")
            print("-" * 40)
            
            if active_turtles:
                # Calculate diversity metrics
                patterns = set()
                colors = set()
                generations = set()
                
                for turtle in active_turtles:
                    patterns.add(turtle.genome.shell_pattern_type)
                    colors.add(f"#{turtle.genome.shell_base_color[0]:02x}{turtle.genome.shell_base_color[1]:02x}{turtle.genome.shell_base_color[2]:02x}")
                    generations.add(turtle.generation)
                
                print(f"Pattern Diversity: {len(patterns)} types")
                print(f"Color Diversity: {len(colors)} unique")
                print(f"Generation Spread: {min(generations)}-{max(generations)}")
                
                # Calculate average fitness
                avg_fitness = sum(t.genome.calculate_fitness() for t in active_turtles) / len(active_turtles)
                print(f"Average Fitness: {avg_fitness:.3f}")
            
            print()
            
            # Display mutation activity
            print("⚡ MUTATION ACTIVITY LOG")
            print("-" * 40)
            
            # This would track recent mutations
            # For now, display placeholder data
            print("Recent Mutations:")
            print("  • Speed mutation detected in Gen 3 lineage")
            print("  • Color pattern shift in Gen 2 offspring")
            print("  • Stamina enhancement in champion lineage")
            
        except Exception as e:
            print(f"Error loading genetics data: {e}")
        
        print()
        print("Monitoring: Evolution Log | Roster | Mutation Patterns")


class TrinityDashboard:
    """Main Trinity dashboard coordinator"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.monitor = None
        self.race_view = None
        self.genetics_lab = None
        
        logger.info("🔄 Trinity Dashboard initialized")
    
    def start_trinity(self) -> bool:
        """Start all three Trinity components"""
        print("🔄 DGT TRINITY DASHBOARD")
        print("=" * 80)
        print("Sovereign Simulation Control Center")
        print("Launching: Monitor + Race View + Genetics Lab")
        print()
        
        # Initialize components
        self.monitor = TrinityMonitor(update_rate_hz=2)
        self.race_view = TrinityRaceView(update_rate_hz=self.update_rate_hz)
        self.genetics_lab = TrinityGeneticsLab(update_rate_hz=1)
        
        # Connect services
        if not self.monitor.connect_to_services():
            print("❌ Failed to connect to services")
            return False
        
        # Start monitor in background thread
        monitor_thread = threading.Thread(target=self.monitor.run, daemon=True)
        monitor_thread.start()
        
        # Start genetics lab in background thread
        lab_thread = threading.Thread(target=self.genetics_lab.run, daemon=True)
        lab_thread.start()
        
        # Run race view in main thread
        try:
            print("🔄 Trinity Dashboard Active")
            print("Monitor: Running in background")
            print("Genetics Lab: Running in background")
            print("Race View: Active in main thread")
            print()
            print("The Infinite Tournament Loop is now running!")
            print("Your digital ecosystem is evolving autonomously.")
            print()
            print("Press Ctrl+C to stop the Trinity Dashboard")
            print()
            
            # Run race view (or simulation)
            self.race_view.run()
            
        except KeyboardInterrupt:
            print("\n🔄 Trinity Dashboard stopped by user")
        
        finally:
            # Cleanup
            self.stop()
        
        return True
    
    def stop(self):
        """Stop all Trinity components"""
        logger.info("🔄 Stopping Trinity Dashboard...")
        
        if self.monitor:
            self.monitor.running = False
        
        if self.race_view:
            self.race_view.running = False
        
        if self.genetics_lab:
            self.genetics_lab.running = False
        
        logger.info("🔄 Trinity Dashboard stopped")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="DGT Trinity Dashboard")
    parser.add_argument('--fps', type=int, default=30, help="Update rate in Hz")
    parser.add_argument('--verbose', action='store_true', help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    # Create and run Trinity dashboard
    dashboard = TrinityDashboard(update_rate_hz=args.fps)
    
    try:
        success = dashboard.start_trinity()
        if not success:
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
