"""
DGT Vector Space Battle Demo - ADR 131 Implementation
Real-time space combat with procedural triangle graphics

Demonstrates:
- Vector triangle ship rendering
- Real-time rotation based on physics heading
- Projectile tracer effects
- Motion blur and ghosting
- Genetic ship shape generation
"""

import tkinter as tk
import time
import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger

# Import DGT vector components
from src.dgt_core.engines.body.ppu_vector import (
    VectorPPU, ShipShapeGenerator, ShipClass, initialize_vector_ppu
)

# Import physics and combat systems
from src.dgt_core.simulation.space_physics import (
    SpaceShip, SpaceVoyagerEngine, TargetingSystem, CombatIntent
)
from src.dgt_core.simulation.combat_navigator import CombatNavigator
from src.dgt_core.simulation.projectile_system import (
    ProjectileSystem, ProjectileType, initialize_projectile_system
)


class VectorBattleArena:
    """Vector graphics battle arena with Tkinter PPU"""
    
    def __init__(self, width: int = 800, height: int = 600):
        self.width = width
        self.height = height
        
        # Initialize systems
        self.vector_ppu = initialize_vector_ppu()
        self.projectile_system = initialize_projectile_system()
        self.targeting_system = TargetingSystem(max_range=500.0)
        
        # Battle state
        self.ships: Dict[str, SpaceShip] = {}
        self.navigators: Dict[str, CombatNavigator] = {}
        
        # Simulation state
        self.simulation_time = 0.0
        self.dt = 1.0 / 60.0
        self.is_running = False
        self.battle_complete = False
        
        # Battle stats
        self.shots_fired = 0
        self.total_hits = 0
        self.total_damage = 0.0
        self.ships_destroyed = []
        
        # Tkinter setup
        self.root = tk.Tk()
        self.root.title("🚀 DGT Vector Space Battle")
        self.root.geometry(f"{width}x{height}")
        self.root.resizable(False, False)
        
        # Create canvas
        self.canvas = tk.Canvas(
            self.root, 
            width=width, 
            height=height, 
            bg="#000011",  # Dark space background
            highlightthickness=0
        )
        self.canvas.pack()
        
        # Status label
        self.status_label = tk.Label(
            self.root,
            text="Initializing...",
            bg="#000011",
            fg="#00FF00",
            font=("Courier", 10)
        )
        self.status_label.place(x=10, y=10)
        
        logger.info(f"🚀 Vector Battle Arena initialized: {width}x{height}")
    
    def create_vector_ship(self, ship_id: str, x: float, y: float, heading: float = 0.0, 
                          ship_class: ShipClass = ShipClass.FIGHTER) -> SpaceShip:
        """Create ship with vector graphics"""
        # Generate ship shape
        ship_shape = ShipShapeGenerator.create_fighter()  # Default
        if ship_class == ShipClass.INTERCEPTOR:
            ship_shape = ShipShapeGenerator.create_interceptor()
        elif ship_class == ShipClass.CRUISER:
            ship_shape = ShipShapeGenerator.create_cruiser()
        elif ship_class == ShipClass.HEAVY:
            ship_shape = ShipShapeGenerator.create_heavy()
        elif ship_class == ShipClass.STEALTH:
            ship_shape = ShipShapeGenerator.create_stealth()
        
        # Add to vector PPU
        self.vector_ppu.add_ship(ship_id, ship_shape)
        
        # Create physics ship
        ship = SpaceShip(
            ship_id=ship_id,
            x=x, y=y,
            heading=heading,
            hull_integrity=200.0,  # Increased hull health
            shield_strength=100.0,  # Increased shields
            weapon_range=400.0,
            weapon_damage=5.0,      # Reduced damage for longer battles
            fire_rate=1.0          # Slower fire rate
        )
        
        # Add physics engine
        ship.physics_engine = SpaceVoyagerEngine()
        
        # Add to battle systems
        self.ships[ship_id] = ship
        self.navigators[ship_id] = CombatNavigator(ship, self.targeting_system)
        
        logger.info(f"🚀 Created vector ship: {ship_id} ({ship_class.value})")
        return ship
    
    def setup_vector_battle(self):
        """Setup vector battle with different ship classes"""
        logger.info("🚀 Setting up vector battle...")
        
        # Create different ship classes for visual variety
        self.create_vector_ship("Ship_A", 200, 300, 0, ShipClass.INTERCEPTOR)
        self.create_vector_ship("Ship_B", 600, 300, 180, ShipClass.HEAVY)
        
        logger.info("🚀 Vector battle setup complete")
    
    def update(self):
        """Update battle simulation and vector graphics"""
        if not self.is_running or self.battle_complete:
            return
        
        self.simulation_time += self.dt
        
        # Update ships
        active_ships = [s for s in self.ships.values() if not s.is_destroyed()]
        
        for ship_id, ship in self.ships.items():
            if ship.is_destroyed():
                continue
            
            navigator = self.navigators[ship_id]
            nav_data = navigator.update(active_ships, self.simulation_time, self.dt)
            
            # Update physics
            target_pos = nav_data.get('target_position')
            if target_pos:
                ship.physics_engine.update(ship, target_pos, self.dt)
            
            # Update vector PPU with new position
            self.vector_ppu.update_ship(ship_id, ship.x, ship.y, ship.heading)
            
            # Mark ship as destroyed in vector PPU if needed
            if ship.is_destroyed():
                ship_body = self.vector_ppu.ship_bodies.get(ship_id)
                if ship_body:
                    ship_body.is_destroyed = True
            
            # Fire weapons
            if nav_data.get('should_fire', False):
                target_id = nav_data.get('target_id')
                if target_id and target_id in self.ships:
                    target = self.ships[target_id]
                    proj_id = self.projectile_system.fire_projectile(ship, target)
                    if proj_id:
                        self.shots_fired += 1
                        logger.debug(f"🚀 {ship_id} fires at {target_id}")
            
            # Keep ships in bounds
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
        
        # Update projectiles and vector graphics
        impacts = self.projectile_system.update(self.dt, active_ships)
        
        # Update projectile positions in vector PPU
        for projectile in self.projectile_system.get_active_projectiles():
            self.vector_ppu.update_projectile(projectile.projectile_id, projectile.x, projectile.y)
        
        # Handle impacts
        for impact in impacts:
            self.total_hits += 1
            
            # Debug: check what type of object impact is
            if hasattr(impact, 'damage_dealt'):
                # ImpactResult object
                self.total_damage += impact.damage_dealt
                proj_id = impact.projectile_id
                target_id = impact.target_id
            else:
                # Dictionary object (fallback)
                self.total_damage += impact.get('damage', 0)
                proj_id = impact.get('projectile_id', 'unknown')
                target_id = impact.get('target_id', 'unknown')
            
            # Remove projectile from vector PPU
            self.vector_ppu.remove_projectile(proj_id)
            
            target_ship = self.ships.get(target_id)
            if target_ship and target_ship.is_destroyed():
                self.ships_destroyed.append(target_id)
                logger.info(f"☠️  Ship {target_id} destroyed!")
        
        # Check battle end
        if len(active_ships) <= 1:
            self.battle_complete = True
            self.is_running = False
            if active_ships:
                logger.info(f"🏆 Winner: {active_ships[0].ship_id}!")
            else:
                logger.info("💀 No survivors!")
        
        # Update status display
        self.update_status_display()
    
    def update_status_display(self):
        """Update status label"""
        accuracy = (self.total_hits / max(1, self.shots_fired) * 100)
        status_text = (
            f"Time: {self.simulation_time:.1f}s | "
            f"Shots: {self.shots_fired} | "
            f"Hits: {self.total_hits} | "
            f"Accuracy: {accuracy:.1f}% | "
            f"Damage: {self.total_damage:.1f} | "
            f"Status: {'COMPLETE' if self.battle_complete else 'ACTIVE'}"
        )
        self.status_label.config(text=status_text)
    
    def render_frame(self):
        """Render one frame of vector graphics"""
        # Clear canvas with fade effect for motion blur
        self.canvas.create_rectangle(
            0, 0, self.width, self.height,
            fill="#000011",
            outline=""
        )
        
        # Render all vector graphics
        self.vector_ppu.render_to_canvas(self.canvas)
    
    def game_loop(self):
        """Main game loop"""
        if self.is_running:
            self.update()
            self.render_frame()
            self.root.after(16, self.game_loop)  # ~60 FPS
    
    def run_vector_battle(self, duration: float = 30.0):
        """Run vector battle demonstration"""
        print("🚀 DGT Vector Space Battle Demo")
        print("=" * 50)
        print("Demonstrating procedural triangle graphics:")
        print("• Real-time ship rotation based on physics")
        print("• Motion blur and ghosting effects")
        print("• Projectile tracer lines")
        print("• Genetic ship shape variation")
        print("=" * 50)
        
        # Setup battle
        self.setup_vector_battle()
        
        # Start simulation
        self.is_running = True
        start_time = time.time()
        
        # Start game loop
        self.game_loop()
        
        # Schedule battle end
        self.root.after(int(duration * 1000), self.end_battle)
        
        # Start Tkinter event loop
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            print("\nBattle interrupted by user")
        
        # Final report
        self.print_battle_report()
    
    def end_battle(self):
        """End the battle"""
        self.is_running = False
        self.battle_complete = True
        logger.info("🚀 Battle duration reached - ending simulation")
        
        # Keep window open for 3 seconds to show final state
        self.root.after(3000, self.root.quit)
    
    def print_battle_report(self):
        """Print final battle statistics"""
        accuracy = (self.total_hits / max(1, self.shots_fired) * 100)
        survivors = len([s for s in self.ships.values() if not s.is_destroyed()])
        
        print("\n╭────── Vector Battle Report ───────╮")
        print(f"│ Battle Duration: {self.simulation_time:.1f}s")
        print(f"│ Shots Fired: {self.shots_fired}")
        print(f"│ Hits: {self.total_hits}")
        print(f"│ Accuracy: {accuracy:.1f}%")
        print(f"│ Total Damage: {self.total_damage:.1f}")
        print(f"│ Ships Destroyed: {len(self.ships_destroyed)}")
        print(f"│ Survivors: {survivors}")
        print(f"│ Rendering Engine: Vector Triangles")
        print(f"│ Visual Effects: Motion Blur + Tracers")
        print("╰───────────────────────────────────╯")
        
        # Show vector PPU stats
        vector_stats = self.vector_ppu.get_render_stats()
        print("\n╭────── Vector Rendering Stats ──────╮")
        print(f"│ Ships Rendered: {vector_stats['ships_rendered']}")
        print(f"│ Triangles Total: {vector_stats['total_triangles']}")
        print(f"│ Projectile Tracers: {vector_stats['projectiles_tracked']}")
        print(f"│ Motion Blur: {'Enabled' if vector_stats['motion_blur_enabled'] else 'Disabled'}")
        print("╰───────────────────────────────────╯")


def main():
    """Main demo function"""
    # Configure logging
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Create and run vector battle
    arena = VectorBattleArena()
    arena.run_vector_battle(duration=30.0)


if __name__ == "__main__":
    main()
