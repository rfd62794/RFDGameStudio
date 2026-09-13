"""
DGT Elite Pilot Viewer - ADR 136 Implementation
Load and visualize trained elite pilots in the PPU Arena

Usage:
    python view_elite.py --latest
    python view_elite.py --genome elite_genome_gen50.json
    python view_elite.py --generation 25
"""

import argparse
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Any

import tkinter as tk
from loguru import logger

from src.dgt_core.simulation.headless_server import HeadlessSimulationServer, HeadlessConfig
from src.dgt_core.simulation.neuro_pilot import NeuroPilot
from src.dgt_core.simulation.space_physics import SpaceShip, SpaceVoyagerEngine
from src.dgt_core.simulation.projectile_system import ProjectileSystem, initialize_projectile_system
from src.dgt_core.engines.body.ship_renderer import ShipRenderer, ShipDNA, ShipClass, initialize_ship_renderer
from src.dgt_core.engines.body.ppu_input import PPUInputService, initialize_ppu_input
from src.dgt_core.simulation.fleet_service import CommanderService, initialize_commander_service


class ElitePilotArena:
    """Arena for viewing elite pilot performance"""
    
    def __init__(self, width: int = 1000, height: int = 700):
        self.width = width
        self.height = height
        
        # Initialize systems
        self.ship_renderer = initialize_ship_renderer(width, height)
        self.projectile_system = initialize_projectile_system()
        self.commander_service = initialize_commander_service()
        self.ppu_input_service = initialize_ppu_input(width, height)
        self.headless_server = HeadlessSimulationServer(HeadlessConfig())
        
        # Elite pilot and opponents
        self.elite_pilot: Optional[NeuroPilot] = None
        self.opponent_pilots: List[NeuroPilot] = []
        
        # Ships
        self.ships: Dict[str, SpaceShip] = {}
        self.pilots: Dict[str, NeuroPilot] = {}
        
        # Simulation state
        self.simulation_time = 0.0
        self.dt = 1.0 / 60.0
        self.is_running = False
        self.is_paused = False
        
        # Battle statistics
        self.shots_fired = 0
        self.total_hits = 0
        self.total_damage = 0.0
        
        # Tkinter setup
        self.root = tk.Tk()
        self.root.title("🏆 DGT Elite Pilot Viewer")
        self.root.geometry(f"{width}x{height}")
        self.root.resizable(False, False)
        
        # Create canvas
        self.canvas = tk.Canvas(
            self.root, 
            width=width, 
            height=height, 
            bg="#000033",
            highlightthickness=0
        )
        self.canvas.pack()
        
        # Control panel
        self.control_frame = tk.Frame(self.root, bg="#000011")
        self.control_frame.place(x=10, y=10)
        
        # Elite pilot info
        self.elite_label = tk.Label(
            self.control_frame,
            text="No Elite Pilot Loaded",
            fg="#FFD700", bg="#000011", font=("Arial", 12, "bold")
        )
        self.elite_label.pack(anchor="w")
        
        # Performance stats
        self.stats_label = tk.Label(
            self.control_frame,
            text="",
            fg="#00FF00", bg="#000011", font=("Arial", 10)
        )
        self.stats_label.pack(anchor="w")
        
        # Battle status
        self.battle_label = tk.Label(
            self.control_frame,
            text="",
            fg="#00FFFF", bg="#000011", font=("Arial", 10)
        )
        self.battle_label.pack(anchor="w")
        
        # Control buttons
        self.button_frame = tk.Frame(self.control_frame, bg="#000011")
        self.button_frame.pack(pady=5)
        
        self.start_button = tk.Button(
            self.button_frame,
            text="Start Battle",
            command=self.toggle_battle,
            bg="#001144",
            fg="white",
            font=("Courier", 9)
        )
        self.start_button.pack(side="left", padx=2)
        
        self.reset_button = tk.Button(
            self.button_frame,
            text="Reset",
            command=self.reset_battle,
            bg="#441144",
            fg="white",
            font=("Courier", 9)
        )
        self.reset_button.pack(side="left", padx=2)
        
        self.next_button = tk.Button(
            self.button_frame,
            text="Next Elite",
            command=self.load_next_elite,
            bg="#114411",
            fg="white",
            font=("Courier", 9)
        )
        self.next_button.pack(side="left", padx=2)
        
        logger.info(f"🏆 Elite Pilot Arena initialized: {width}x{height}")
    
    def load_elite_pilot(self, genome_filename: str):
        """Load elite pilot from file"""
        try:
            self.elite_pilot = self.headless_server.load_elite_genome(genome_filename)
            
            # Load elite info
            registry_path = Path("src/dgt_core/registry/brains") / genome_filename
            with open(registry_path, 'r') as f:
                elite_info = json.load(f)
            
            # Update display
            self.elite_label.config(
                text=f"Elite Pilot Gen {elite_info['generation']} | Fitness: {elite_info['fitness']:.2f}"
            )
            
            self.stats_label.config(
                text=f"K/D: {elite_info['performance_stats']['enemies_destroyed']:.0f} | "
                     f"Accuracy: {elite_info['performance_stats']['accuracy']:.2%} | "
                     f"Damage: {elite_info['performance_stats']['damage_dealt']:.0f}"
            )
            
            logger.info(f"🏆 Loaded elite pilot: {genome_filename}")
            
            # Setup battle
            self.setup_elite_battle()
            
        except Exception as e:
            logger.error(f"❌ Failed to load elite pilot: {e}")
            self.elite_label.config(text=f"Error loading pilot: {e}")
    
    def load_latest_elite(self):
        """Load the latest elite pilot"""
        try:
            elite_pilot = self.headless_server.get_latest_elite()
            if elite_pilot:
                # Find the latest file
                registry_path = Path("src/dgt_core/registry/brains")
                elite_files = list(registry_path.glob("elite_genome_*.json"))
                
                if elite_files:
                    latest_file = max(elite_files, key=lambda f: f.stat().st_mtime)
                    self.load_elite_pilot(latest_file.name)
                else:
                    logger.warning("⚠️ No elite pilots found in registry")
                    self.elite_label.config(text="No Elite Pilots Found")
            else:
                logger.warning("⚠️ No elite pilots available")
                self.elite_label.config(text="No Elite Pilots Available")
                
        except Exception as e:
            logger.error(f"❌ Failed to load latest elite: {e}")
            self.elite_label.config(text=f"Error: {e}")
    
    def load_elite_by_generation(self, generation: int):
        """Load elite pilot by generation number"""
        registry_path = Path("src/dgt_core/registry/brains")
        pattern = f"elite_genome_gen{generation}_*.json"
        files = list(registry_path.glob(pattern))
        
        if files:
            self.load_elite_pilot(files[0].name)
        else:
            logger.warning(f"⚠️ No elite pilot found for generation {generation}")
            self.elite_label.config(text=f"No Elite for Gen {generation}")
    
    def setup_elite_battle(self):
        """Setup battle with elite pilot vs opponents"""
        if not self.elite_pilot:
            logger.warning("⚠️ No elite pilot loaded")
            return
        
        # Clear existing ships
        self.ships.clear()
        self.pilots.clear()
        self.ship_renderer.ship_polygons.clear()
        
        # Create elite pilot ship
        elite_ship = self._create_ship_for_pilot(
            self.elite_pilot, "Elite", 500, 350, 0, "#FFD700", "#FF6B35"
        )
        
        # Create opponent ships (random pilots)
        import random
        for i in range(4):
            # Create random opponent
            opponent = self.headless_server.pilot_factory.create_pilot()
            
            # Random position around arena
            angle = (i * 90) * 3.14159 / 180
            x = 500 + int(300 * math.cos(angle))
            y = 350 + int(300 * math.sin(angle))
            
            opponent_ship = self._create_ship_for_pilot(
                opponent, f"Opp_{i}", x, y, angle * 180 / 3.14159, 
                "#FF4444", "#FF1493"
            )
            
            self.opponent_pilots.append(opponent)
        
        logger.info(f"🏆 Elite battle setup: {len(self.ships)} ships")
    
    def _create_ship_for_pilot(self, pilot: NeuroPilot, name: str, x: float, y: float, 
                              heading: float, hull_color: str, reactor_color: str) -> SpaceShip:
        """Create ship for pilot with custom colors"""
        # Create ship physics
        ship = SpaceShip(
            ship_id=pilot.genome.key,
            x=x, y=y,
            heading=heading,
            velocity_x=0.0, velocity_y=0.0,
            hull_integrity=200.0,
            shield_strength=100.0,
            weapon_range=400.0,
            weapon_damage=25.0,
            fire_rate=2.0
        )
        
        # Create ship engine
        ship.engine = SpaceVoyagerEngine(
            thrust_power=0.5,
            rotation_speed=5.0
        )
        
        # Assign pilot
        self.pilots[pilot.genome.key] = pilot
        self.ships[pilot.genome.key] = ship
        
        # Create ShipDNA
        ship_dna = ShipDNA()
        ship_dna.hull_color = hull_color
        ship_dna.reactor_color = reactor_color
        
        ship.ship_dna = ship_dna
        ship.ship_class = ShipClass.INTERCEPTOR
        
        return ship
    
    def update(self):
        """Update battle simulation"""
        if not self.is_running or self.is_paused:
            return
        
        self.simulation_time += self.dt
        
        # Get active ships
        active_ships = [ship for ship in self.ships.values() if not ship.is_destroyed()]
        
        # Update each pilot-controlled ship
        for fleet_ship in self.pilots.values():
            ship = self.ships.get(fleet_ship.genome.key)
            if not ship or ship.is_destroyed():
                continue
            
            # Get targets and threats
            targets = [s for s in active_ships if s.ship_id != ship.ship_id]
            threats = targets
            
            # Get neural action
            action = fleet_ship.get_action(ship, targets, threats)
            
            # Apply neural control
            fleet_ship.apply_action(ship, action, self.dt)
            
            # Handle weapon firing
            if fleet_ship.should_fire_weapon(action, ship):
                if targets:
                    target = targets[0]
                    proj_id = self.projectile_system.fire_projectile(ship, target)
                    if proj_id:
                        self.shots_fired += 1
                        fleet_ship.shots_fired += 1
            
            # Keep ship in bounds
            self._keep_ship_in_bounds(ship)
        
        # Update projectiles
        impacts = self.projectile_system.update(self.dt, active_ships)
        
        # Update exhaust particles
        self.ship_renderer.update_particles(self.dt, self.canvas)
        
        # Handle impacts
        for impact in impacts:
            self.total_hits += 1
            self.total_damage += impact.damage_dealt
            
            # Check for ship destruction
            target_ship = self.ships.get(impact.target_id)
            if target_ship and target_ship.is_destroyed():
                # Remove destroyed ship from renderer
                self.ship_renderer.clear_destroyed_ships([impact.target_id], self.canvas)
        
        # Update battle status
        self.update_battle_display()
    
    def _keep_ship_in_bounds(self, ship):
        """Keep ship within arena bounds"""
        margin = 50
        if ship.x < margin:
            ship.x = margin
            ship.velocity_x = abs(ship.velocity_x) * 0.5
        elif ship.x > self.width - margin:
            ship.x = self.width - margin
            ship.velocity_x = -abs(ship.velocity_x) * 0.5
        
        if ship.y < margin:
            ship.y = margin
            ship.velocity_y = abs(ship.velocity_y) * 0.5
        elif ship.y > self.height - margin:
            ship.y = self.height - margin
            ship.velocity_y = -abs(ship.velocity_y) * 0.5
    
    def update_battle_display(self):
        """Update battle status display"""
        active_ships = [s for s in self.ships.values() if not s.is_destroyed()]
        elite_ship = None
        
        if self.elite_pilot:
            elite_ship = self.ships.get(self.elite_pilot.genome.key)
        
        battle_text = (
            f"Time: {self.simulation_time:.1f}s | "
            f"Active: {len(active_ships)} | "
            f"Shots: {self.shots_fired} | "
            f"Hits: {self.total_hits}"
        )
        
        if elite_ship:
            battle_text += f" | Elite Health: {elite_ship.hull_integrity:.0f}"
        
        self.battle_label.config(text=battle_text)
    
    def render_frame(self):
        """Render the current frame"""
        # Clear canvas
        self.canvas.delete("all")
        
        # Draw background
        self.canvas.create_rectangle(0, 0, self.width, self.height, fill="#000033", outline="")
        
        # Draw arena boundary
        self.canvas.create_rectangle(50, 50, self.width-50, self.height-50, 
                                   outline="#00FF00", width=2)
        
        # Render ships
        for ship_id, ship in self.ships.items():
            if not ship.is_destroyed():
                # Get the pilot for this ship
                pilot = self.pilots.get(ship_id)
                thrust_level = 0.0
                
                if pilot:
                    last_action = getattr(pilot, 'last_action', None)
                    thrust_level = last_action.thrust if last_action else 0.0
                
                # Create render packet
                from src.dgt_core.engines.body.ship_renderer import RenderPacket
                render_packet = RenderPacket(
                    ship_id=ship.ship_id,
                    x=ship.x,
                    y=ship.y,
                    heading=ship.heading,
                    velocity_x=ship.velocity_x,
                    velocity_y=ship.velocity_y,
                    ship_class=getattr(ship, 'ship_class', ShipClass.INTERCEPTOR),
                    ship_dna=getattr(ship, 'ship_dna', ShipDNA()),
                    is_destroyed=ship.is_destroyed(),
                    thrust_level=thrust_level
                )
                
                # Highlight elite pilot
                is_elite = (self.elite_pilot and ship_id == self.elite_pilot.genome.key)
                
                # Render ship
                self.ship_renderer.render_ship(render_packet, self.canvas, is_elite)
        
        # Update and render particles
        self.ship_renderer.update_particles(self.dt, self.canvas)
        
        # Draw projectiles
        for projectile in self.projectile_system.get_active_projectiles():
            self.canvas.create_oval(
                projectile.x - 2, projectile.y - 2,
                projectile.x + 2, projectile.y + 2,
                fill="#FFFF00", outline=""
            )
    
    def toggle_battle(self):
        """Toggle battle simulation"""
        if self.is_running:
            self.is_running = False
            self.start_button.config(text="Start Battle")
            logger.info("⏸️ Battle paused")
        else:
            self.is_running = True
            self.is_paused = False
            self.start_button.config(text="Pause Battle")
            logger.info("▶️ Battle started")
    
    def reset_battle(self):
        """Reset battle to initial state"""
        self.is_running = False
        self.simulation_time = 0.0
        self.shots_fired = 0
        self.total_hits = 0
        self.total_damage = 0.0
        
        # Reset ships
        for ship in self.ships.values():
            ship.hull_integrity = 200.0
            ship.shield_strength = 100.0
            ship.velocity_x = 0
            ship.velocity_y = 0
        
        # Reset projectiles
        self.projectile_system = initialize_projectile_system()
        
        # Reset button
        self.start_button.config(text="Start Battle")
        
        logger.info("🔄 Battle reset")
    
    def load_next_elite(self):
        """Load next elite pilot"""
        if not self.elite_pilot:
            self.load_latest_elite()
            return
        
        # Find current generation
        current_gen = None
        registry_path = Path("src/dgt_core/registry/brains")
        elite_files = list(registry_path.glob("elite_genome_*.json"))
        
        for file in elite_files:
            with open(file, 'r') as f:
                data = json.load(f)
                if data['genome_id'] == str(self.elite_pilot.genome.key):
                    current_gen = data['generation']
                    break
        
        if current_gen is not None:
            # Try to load next generation
            next_gen = current_gen + 1
            self.load_elite_by_generation(next_gen)
        else:
            logger.warning("⚠️ Could not determine current generation")
    
    def game_loop(self):
        """Main game loop"""
        if self.is_running:
            self.update()
            self.render_frame()
            self.root.after(16, self.game_loop)  # ~60 FPS
    
    def run_viewer(self, duration: float = 120.0):
        """Run elite pilot viewer"""
        print("🏆 DGT Elite Pilot Viewer")
        print("=" * 60)
        print("Viewing trained elite pilots:")
        print("• Load latest elite pilot from registry")
        print("• Real-time battle visualization")
        print("• Performance statistics display")
        print("• Compare multiple elite pilots")
        print("=" * 60)
        
        # Load latest elite if none specified
        if not self.elite_pilot:
            self.load_latest_elite()
        
        # Bind input handlers
        self.ppu_input_service.bind_canvas(self.canvas, self.commander_service)
        
        # Start game loop
        self.game_loop()
        
        # Schedule end
        self.root.after(int(duration * 1000), self.end_viewer)
        
        # Start Tkinter event loop
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            print("\nViewer interrupted by user")
    
    def end_viewer(self):
        """End the viewer"""
        self.is_running = False
        logger.info("🏆 Elite pilot viewer completed")
        self.root.quit()


def main():
    """Main entry point"""
    import math
    
    parser = argparse.ArgumentParser(
        description="DGT Elite Pilot Viewer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # View latest elite pilot
  python view_elite.py --latest
  
  # View specific elite genome
  python view_elite.py --genome elite_genome_gen50.json
  
  # View elite from specific generation
  python view_elite.py --generation 25
        """
    )
    
    # Loading options
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--latest', action='store_true',
                      help='Load latest elite pilot')
    group.add_argument('--genome', type=str,
                      help='Load specific elite genome file')
    group.add_argument('--generation', type=int,
                      help='Load elite pilot from generation')
    
    # Viewer options
    parser.add_argument('--duration', type=float, default=120.0,
                       help='Viewer duration in seconds (default: 120.0)')
    
    args = parser.parse_args()
    
    # Configure logging
    logger.add("logs/elite_viewer.log", rotation="10 MB", level="INFO")
    
    # Create viewer
    arena = ElitePilotArena()
    
    # Load elite pilot
    if args.latest:
        arena.load_latest_elite()
    elif args.genome:
        arena.load_elite_pilot(args.genome)
    elif args.generation:
        arena.load_elite_by_generation(args.generation)
    
    # Run viewer
    arena.run_viewer(duration=args.duration)


if __name__ == "__main__":
    main()
