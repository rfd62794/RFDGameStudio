"""
DGT Fleet Skirmish Demo - ADR 132 Implementation
Multi-ship fleet combat with team-based AI and particle effects

Demonstrates:
- 4 Interceptors vs 1 Heavy Dreadnought
- Team-based combat coordination
- Modular hardpoints and weapon systems
- Particle explosion effects
- Fleet management and formation
"""

import tkinter as tk
import time
import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger

# Import DGT fleet components
from src.dgt_core.simulation.fleet import (
    FleetManager, FleetShip, TeamAffiliation, ShipRole, 
    FleetFormation, initialize_fleet_manager
)
from src.dgt_core.engines.body.ppu_vector import (
    VectorPPU, ShipShapeGenerator, ShipClass, initialize_vector_ppu
)
from src.dgt_core.engines.body.particle_effects import (
    ParticleEffectsSystem, ExplosionType, initialize_particle_effects
)
from src.dgt_core.simulation.space_physics import (
    SpaceVoyagerEngine, TargetingSystem
)
from src.dgt_core.simulation.combat_navigator import CombatNavigator
from src.dgt_core.simulation.projectile_system import (
    ProjectileSystem, ProjectileType, initialize_projectile_system
)


class FleetBattleArena:
    """Multi-ship fleet battle arena with team coordination"""
    
    def __init__(self, width: int = 1000, height: int = 700):
        self.width = width
        self.height = height
        
        # Initialize systems
        self.fleet_manager = initialize_fleet_manager()
        self.vector_ppu = initialize_vector_ppu()
        self.particle_effects = initialize_particle_effects()
        self.projectile_system = initialize_projectile_system()
        self.targeting_system = TargetingSystem(max_range=600.0)
        
        # Combat navigators for fleet ships
        self.combat_navigators: Dict[str, CombatNavigator] = {}
        
        # Simulation state
        self.simulation_time = 0.0
        self.dt = 1.0 / 60.0
        self.is_running = False
        self.battle_complete = False
        
        # Battle statistics
        self.shots_fired = 0
        self.total_hits = 0
        self.total_damage = 0.0
        self.ships_destroyed = []
        
        # Tkinter setup
        self.root = tk.Tk()
        self.root.title("🚀 DGT Fleet Skirmish - 4v1 Battle")
        self.root.geometry(f"{width}x{height}")
        self.root.resizable(False, False)
        
        # Create canvas
        self.canvas = tk.Canvas(
            self.root, 
            width=width, 
            height=height, 
            bg="#000011",
            highlightthickness=0
        )
        self.canvas.pack()
        
        # Status panel
        self.status_frame = tk.Frame(self.root, bg="#000011")
        self.status_frame.place(x=10, y=10)
        
        self.status_label = tk.Label(
            self.status_frame,
            text="Initializing...",
            bg="#000011",
            fg="#00FF00",
            font=("Courier", 10)
        )
        self.status_label.pack()
        
        self.fleet_status_label = tk.Label(
            self.status_frame,
            text="",
            bg="#000011",
            fg="#00FFFF",
            font=("Courier", 9)
        )
        self.fleet_status_label.pack()
        
        logger.info(f"🚀 Fleet Battle Arena initialized: {width}x{height}")
    
    def setup_fleet_battle(self):
        """Setup 4 Interceptors vs 1 Dreadnought battle"""
        logger.info("🚀 Setting up fleet skirmish...")
        
        # Create Alpha team (4 Interceptors)
        alpha_formation = FleetFormation("wedge")
        alpha_ships = self.fleet_manager.create_fleet_formation(
            team=TeamAffiliation.ALPHA,
            formation=alpha_formation,
            center_x=200,
            center_y=350,
            roles=[ShipRole.INTERCEPTOR] * 4,
            ship_names=["Alpha-Lead", "Alpha-Wing-1", "Alpha-Wing-2", "Alpha-Wing-3"]
        )
        
        # Create Beta team (1 Dreadnought)
        beta_formation = FleetFormation("line")
        beta_ships = self.fleet_manager.create_fleet_formation(
            team=TeamAffiliation.BETA,
            formation=beta_formation,
            center_x=800,
            center_y=350,
            roles=[ShipRole.DREADNOUGHT],
            ship_names=["Beta-Dreadnought"]
        )
        
        # Set team relations (hostile)
        self.fleet_manager.set_team_relation(TeamAffiliation.ALPHA, TeamAffiliation.BETA, True)
        
        # Add all ships to vector PPU
        for fleet_ship in self.fleet_manager.all_ships.values():
            # Map ship role to vector class
            vector_class = self._map_role_to_vector_class(fleet_ship.role)
            ship_shape = self._get_shape_for_class(vector_class)
            
            self.vector_ppu.add_ship(fleet_ship.ship_id, ship_shape)
            
            # Create combat navigator
            navigator = CombatNavigator(fleet_ship.ship, self.targeting_system)
            navigator.aggression_level = 0.8 if fleet_ship.team == TeamAffiliation.ALPHA else 0.6
            self.combat_navigators[fleet_ship.ship_id] = navigator
        
        logger.info(f"🚀 Fleet battle setup complete: {len(alpha_ships)} Alpha vs {len(beta_ships)} Beta")
    
    def _map_role_to_vector_class(self, role: ShipRole) -> ShipClass:
        """Map ship role to vector rendering class"""
        mapping = {
            ShipRole.INTERCEPTOR: ShipClass.INTERCEPTOR,
            ShipRole.FIGHTER: ShipClass.FIGHTER,
            ShipRole.DREADNOUGHT: ShipClass.HEAVY,
            ShipRole.BOMBER: ShipClass.CRUISER,
            ShipRole.SUPPORT: ShipClass.STEALTH
        }
        return mapping.get(role, ShipClass.FIGHTER)
    
    def _get_shape_for_class(self, vector_class: ShipClass):
        """Get ship shape for vector class"""
        if vector_class == ShipClass.INTERCEPTOR:
            return ShipShapeGenerator.create_interceptor()
        elif vector_class == ShipClass.HEAVY:
            return ShipShapeGenerator.create_heavy()
        elif vector_class == ShipClass.CRUISER:
            return ShipShapeGenerator.create_cruiser()
        elif vector_class == ShipClass.STEALTH:
            return ShipShapeGenerator.create_stealth()
        else:
            return ShipShapeGenerator.create_fighter()
    
    def update(self):
        """Update fleet battle simulation"""
        if not self.is_running or self.battle_complete:
            return
        
        self.simulation_time += self.dt
        
        # Update fleet state
        self.fleet_manager.update_fleet_state()
        
        # Get all active ships
        all_ships = [fs.ship for fs in self.fleet_manager.all_ships.values() if not fs.ship.is_destroyed()]
        
        # Update each fleet ship
        for fleet_ship in self.fleet_manager.all_ships.values():
            if fleet_ship.ship.is_destroyed():
                continue
            
            navigator = self.combat_navigators.get(fleet_ship.ship_id)
            if not navigator:
                continue
            
            # Get enemy ships (team-based targeting)
            enemy_ships = self.fleet_manager.get_enemy_ships(fleet_ship)
            enemy_physics_ships = [es.ship for es in enemy_ships]
            
            # Update navigation
            nav_data = navigator.update(enemy_physics_ships, self.simulation_time, self.dt)
            
            # Update physics
            target_pos = nav_data.get('target_position')
            if target_pos:
                fleet_ship.ship.physics_engine.update(fleet_ship.ship, target_pos, self.dt)
            
            # Update vector PPU
            self.vector_ppu.update_ship(fleet_ship.ship_id, fleet_ship.ship.x, fleet_ship.ship.y, fleet_ship.ship.heading)
            
            # Handle weapon firing with hardpoints
            if nav_data.get('should_fire', False):
                target_id = nav_data.get('target_id')
                if target_id and target_id in [es.ship_id for es in enemy_ships]:
                    target_fleet_ship = self.fleet_manager.all_ships.get(target_id)
                    if target_fleet_ship:
                        # Fire from available hardpoints
                        active_hardpoints = fleet_ship.get_active_hardpoints()
                        for hardpoint in active_hardpoints[:1]:  # Fire from first available hardpoint
                            proj_id = self.projectile_system.fire_projectile(fleet_ship.ship, target_fleet_ship.ship)
                            if proj_id:
                                self.shots_fired += 1
                                logger.debug(f"🚀 {fleet_ship.ship_name} fires {hardpoint.hardpoint_type.value}")
                                break
            
            # Keep ships in bounds
            self._keep_ship_in_bounds(fleet_ship.ship)
        
        # Update projectiles
        impacts = self.projectile_system.update(self.dt, all_ships)
        
        # Update projectile positions in vector PPU
        for projectile in self.projectile_system.get_active_projectiles():
            self.vector_ppu.update_projectile(projectile.projectile_id, projectile.x, projectile.y)
        
        # Handle impacts
        for impact in impacts:
            self.total_hits += 1
            self.total_damage += impact.damage_dealt
            
            # Remove projectile from vector PPU
            self.vector_ppu.remove_projectile(impact.projectile_id)
            
            # Create shield hit effect
            target_fleet_ship = self.fleet_manager.all_ships.get(impact.target_id)
            if target_fleet_ship:
                self.particle_effects.create_shield_hit(impact.impact_position[0], impact.impact_position[1])
                
                # Check for ship destruction
                if target_fleet_ship.ship.is_destroyed():
                    # Create explosion effect
                    self.particle_effects.create_ship_explosion(
                        target_fleet_ship.ship.x, 
                        target_fleet_ship.ship.y,
                        target_fleet_ship.role.value
                    )
                    
                    # Mark as destroyed in vector PPU
                    ship_body = self.vector_ppu.ship_bodies.get(target_fleet_ship.ship_id)
                    if ship_body:
                        ship_body.is_destroyed = True
                    
                    self.ships_destroyed.append(target_fleet_ship.ship_name)
                    logger.info(f"💥 {target_fleet_ship.ship_name} destroyed!")
                    
                    # Update combat stats
                    for attacker in self.fleet_manager.all_ships.values():
                        if attacker.ship_id == impact.projectile_id.split('_')[0]:
                            attacker.update_combat_stats(impact.damage_dealt, True)
        
        # Update particle effects
        self.particle_effects.update(self.dt)
        
        # Check battle end
        alpha_ships = self.fleet_manager.get_team_ships(TeamAffiliation.ALPHA)
        beta_ships = self.fleet_manager.get_team_ships(TeamAffiliation.BETA)
        
        if len(alpha_ships) == 0 or len(beta_ships) == 0:
            self.battle_complete = True
            self.is_running = False
            
            winner = "ALPHA" if len(alpha_ships) > 0 else "BETA"
            logger.info(f"🏆 Team {winner} wins the battle!")
        
        # Update status displays
        self.update_status_display()
    
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
    
    def update_status_display(self):
        """Update status displays"""
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
        
        # Fleet status
        alpha_ships = self.fleet_manager.get_team_ships(TeamAffiliation.ALPHA)
        beta_ships = self.fleet_manager.get_team_ships(TeamAffiliation.BETA)
        
        fleet_text = (
            f"ALPHA (Cyan): {len(alpha_ships)} ships | "
            f"BETA (Red): {len(beta_ships)} ships | "
            f"Particles: {self.particle_effects.active_particles}"
        )
        self.fleet_status_label.config(text=fleet_text)
    
    def render_frame(self):
        """Render one frame"""
        # Clear canvas
        self.canvas.create_rectangle(
            0, 0, self.width, self.height,
            fill="#000011",
            outline=""
        )
        
        # Render vector graphics
        self.vector_ppu.render_to_canvas(self.canvas)
        
        # Render particle effects
        self.particle_effects.render_to_canvas(self.canvas)
    
    def game_loop(self):
        """Main game loop"""
        if self.is_running:
            self.update()
            self.render_frame()
            self.root.after(16, self.game_loop)  # ~60 FPS
    
    def run_fleet_skirmish(self, duration: float = 45.0):
        """Run fleet skirmish demonstration"""
        print("🚀 DGT Fleet Skirmish Demo")
        print("=" * 60)
        print("Demonstrating multi-ship fleet combat:")
        print("• 4 Alpha Interceptors (cyan) vs 1 Beta Dreadnought (red)")
        print("• Team-based AI coordination")
        print("• Modular weapon hardpoints")
        print("• Particle explosion effects")
        print("• Fleet formation and tactics")
        print("=" * 60)
        
        # Setup battle
        self.setup_fleet_battle()
        
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
        self.print_fleet_report()
    
    def end_battle(self):
        """End the fleet battle"""
        self.is_running = False
        self.battle_complete = True
        logger.info("🚀 Fleet battle duration reached - ending simulation")
        
        # Keep window open for 5 seconds to show final state
        self.root.after(5000, self.root.quit)
    
    def print_fleet_report(self):
        """Print comprehensive fleet battle report"""
        accuracy = (self.total_hits / max(1, self.shots_fired) * 100)
        
        print("\n╭────── Fleet Battle Report ───────╮")
        print(f"│ Battle Duration: {self.simulation_time:.1f}s")
        print(f"│ Shots Fired: {self.shots_fired}")
        print(f"│ Hits: {self.total_hits}")
        print(f"│ Accuracy: {accuracy:.1f}%")
        print(f"│ Total Damage: {self.total_damage:.1f}")
        print(f"│ Ships Destroyed: {len(self.ships_destroyed)}")
        
        # Team statistics
        alpha_ships = self.fleet_manager.get_team_ships(TeamAffiliation.ALPHA)
        beta_ships = self.fleet_manager.get_team_ships(TeamAffiliation.BETA)
        
        print(f"│ ALPHA Survivors: {len(alpha_ships)}")
        print(f"│ BETA Survivors: {len(beta_ships)}")
        print(f"│ Winner: {'ALPHA' if len(alpha_ships) > 0 else 'BETA'}")
        print("╰─────────────────────────────────╯")
        
        # Fleet statistics
        fleet_stats = self.fleet_manager.get_fleet_statistics()
        print("\n╭────── Fleet Statistics ────────╮")
        for team, stats in fleet_stats['teams'].items():
            print(f"│ {team.upper()}:")
            print(f"│   Ships: {stats['count']}")
            print(f"│   Fleet Value: {stats['total_fleet_value']:.1f}")
            print(f"│   Effectiveness: {stats['average_effectiveness']:.2f}")
        print("╰─────────────────────────────────╮")
        
        # Rendering statistics
        vector_stats = self.vector_ppu.get_render_stats()
        particle_stats = self.particle_effects.get_system_stats()
        
        print("\n╭────── Rendering Stats ────────╮")
        print(f"│ Ships Rendered: {vector_stats['ships_rendered']}")
        print(f"│ Triangles: {vector_stats['total_triangles']}")
        print(f"│ Active Explosions: {particle_stats['active_explosions']}")
        print(f"│ Active Particles: {particle_stats['active_particles']}")
        print(f"│ Total Explosions: {particle_stats['total_explosions_created']}")
        print("╰─────────────────────────────────╮")


def main():
    """Main demo function"""
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Create and run fleet skirmish
    arena = FleetBattleArena()
    arena.run_fleet_skirmish(duration=45.0)


if __name__ == "__main__":
    main()
