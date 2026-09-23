"""
DGT Automated Space Battle Demo - ADR 130 Implementation
Real-time space combat simulation with AI-controlled ships

Demonstrates:
- Newtonian physics with inertia
- PID-controlled navigation
- Combat AI with intent switching
- Automated target locking and firing
- Particle exhaust effects
- Projectile collision detection
"""

import time
import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

from loguru import logger
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.layout import Layout
from rich.text import Text

# Import DGT components
from src.dgt_core.simulation.space_physics import (
    SpaceShip, SpaceVoyagerEngine, TargetingSystem, 
    initialize_space_physics, CombatIntent
)
from src.dgt_core.simulation.combat_navigator import (
    CombatNavigator, TacticalSituation, ManeuverType
)
from src.dgt_core.simulation.projectile_system import (
    ProjectileSystem, ProjectileType, initialize_projectile_system
)
from src.dgt_core.engines.body.exhaust_system import (
    ExhaustSystem, initialize_exhaust_system
)
from src.dgt_core.simulation.ship_genetics import (
    ShipGenome, ship_genetic_registry, HullType, EngineType, WeaponType
)


@dataclass
class BattleReport:
    """Battle statistics and reporting"""
    battle_time: float = 0.0
    total_shots_fired: int = 0
    total_hits: int = 0
    total_damage_dealt: float = 0.0
    ships_destroyed: List[str] = None
    
    def __post_init__(self):
        if self.ships_destroyed is None:
            self.ships_destroyed = []


class SpaceBattleArena:
    """Main space battle simulation arena"""
    
    def __init__(self, width: int = 800, height: int = 600):
        self.width = width
        self.height = height
        
        # Initialize systems
        self.physics_engine = initialize_space_physics()
        self.projectile_system = initialize_projectile_system()
        self.exhaust_system = initialize_exhaust_system()
        self.targeting_system = TargetingSystem(max_range=400.0)
        
        # Battle state
        self.ships: Dict[str, SpaceShip] = {}
        self.combat_navigators: Dict[str, CombatNavigator] = {}
        self.battle_report = BattleReport()
        
        # Simulation state
        self.simulation_time = 0.0
        self.dt = 1.0 / 60.0  # 60 FPS
        self.is_running = False
        self.battle_complete = False
        
        # Rich console for display
        self.console = Console()
        self.live_display = None
        
        logger.info(f"🚀 Space Battle Arena initialized: {width}x{height}")
    
    def create_ai_ship(self, ship_id: str, x: float, y: float, 
                      template_name: str = "light_fighter", team: str = "blue") -> SpaceShip:
        """Create an AI-controlled ship from genetic template"""
        # Get genetic template
        genome = ship_genetic_registry.generate_random_ship(template_name)
        combat_stats = genome.calculate_combat_stats()
        
        # Create ship
        ship = SpaceShip(
            ship_id=ship_id,
            x=x,
            y=y,
            hull_integrity=100.0,
            shield_strength=combat_stats.get('shield_capacity', 50.0),
            weapon_range=200.0 + genome.weapon_damage * 10,
            weapon_damage=combat_stats.get('weapon_damage', 10.0),
            fire_rate=combat_stats.get('fire_rate', 1.0),
            physics_engine=SpaceVoyagerEngine(
                thrust_power=0.3 + genome.thruster_output * 0.2,
                rotation_speed=3.0 + genome.initiative * 2.0
            )
        )
        
        # Add to battle
        self.ships[ship_id] = ship
        
        # Create combat navigator
        navigator = CombatNavigator(ship, self.targeting_system)
        navigator.aggression_level = random.uniform(0.5, 0.9)
        navigator.tactical_skill = random.uniform(0.6, 0.9)
        self.combat_navigators[ship_id] = navigator
        
        # Add exhaust emitter
        engine_type = genome.engine_type.value
        self.exhaust_system.add_ship_emitter(ship_id, engine_type)
        
        logger.info(f"🚀 Created AI ship: {ship_id} ({template_name}) at ({x}, {y})")
        return ship
    
    def setup_demo_battle(self):
        """Setup the demo battle with two AI ships"""
        logger.info("🚀 Setting up demo battle...")
        
        # Create two opposing ships
        ship_a = self.create_ai_ship("Ship_A", 200, 300, "light_fighter", "blue")
        ship_a.heading = 0  # Facing right
        
        ship_b = self.create_ai_ship("Ship_B", 600, 300, "medium_cruiser", "red")
        ship_b.heading = 180  # Facing left
        
        # Set initial targets
        ship_a.physics_engine.set_target("Ship_B", (ship_b.x, ship_b.y))
        ship_b.physics_engine.set_target("Ship_A", (ship_a.x, ship_a.y))
        
        logger.info("🚀 Demo battle setup complete")
    
    def update(self):
        """Update battle simulation"""
        if not self.is_running or self.battle_complete:
            return
        
        # Update simulation time
        self.simulation_time += self.dt
        self.battle_report.battle_time = self.simulation_time
        
        # Get list of active ships
        active_ships = [ship for ship in self.ships.values() if not ship.is_destroyed()]
        
        # Update combat navigation for each ship
        for ship_id, ship in self.ships.items():
            if ship.is_destroyed():
                continue
            
            navigator = self.combat_navigators[ship_id]
            
            # Update navigation and get tactical decisions
            nav_data = navigator.update(active_ships, self.simulation_time, self.dt)
            
            # Update ship physics
            physics_data = ship.physics_engine.update(
                ship, 
                nav_data.get('target_position'), 
                self.dt
            )
            
            # Update exhaust system
            is_thrusting = physics_data.get('thrust_applied', False)
            thrust_intensity = 0.8 if is_thrusting else 0.0
            self.exhaust_system.update_ship_thrust(
                ship_id, ship.x, ship.y, ship.heading, 
                is_thrusting, thrust_intensity
            )
            
            # Fire weapons if commanded
            if nav_data.get('should_fire', False):
                target_id = nav_data.get('target_id')
                if target_id and target_id in self.ships:
                    target = self.ships[target_id]
                    projectile_id = self.projectile_system.fire_projectile(
                        ship, target, ProjectileType.KINETIC
                    )
                    if projectile_id:
                        self.battle_report.total_shots_fired += 1
                        logger.debug(f"🚀 {ship_id} fired at {target_id}")
            
            # Keep ship in bounds
            self._keep_ship_in_bounds(ship)
        
        # Update projectile system
        impacts = self.projectile_system.update(self.dt, active_ships)
        for impact in impacts:
            self.battle_report.total_hits += 1
            self.battle_report.total_damage_dealt += impact.damage_dealt
            
            # Check for destroyed ships
            if impact.target_id in self.ships and self.ships[impact.target_id].is_destroyed():
                self.battle_report.ships_destroyed.append(impact.target_id)
                logger.info(f"🚀 Ship {impact.target_id} destroyed!")
        
        # Update exhaust system
        self.exhaust_system.update(self.dt)
        
        # Check battle completion
        self._check_battle_completion()
    
    def _keep_ship_in_bounds(self, ship: SpaceShip):
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
    
    def _check_battle_completion(self):
        """Check if battle is complete"""
        active_ships = [ship for ship in self.ships.values() if not ship.is_destroyed()]
        
        if len(active_ships) <= 1:
            self.battle_complete = True
            self.is_running = False
            
            if active_ships:
                winner = active_ships[0].ship_id
                logger.info(f"🚀 Battle complete! Winner: {winner}")
            else:
                logger.info("🚀 Battle complete! No survivors")
    
    def create_status_display(self) -> Layout:
        """Create rich status display layout"""
        layout = Layout()
        
        # Create panels
        battle_status = self._create_battle_status_panel()
        ship_status = self._create_ship_status_panel()
        system_stats = self._create_system_stats_panel()
        
        # Arrange layout
        layout.split_column(
            Layout(Panel(battle_status, title="Battle Status", border_style="blue")),
            Layout().split_row(
                Layout(Panel(ship_status, title="Ship Status", border_style="green")),
                Layout(Panel(system_stats, title="System Stats", border_style="yellow"))
            )
        )
        
        return layout
    
    def _create_battle_status_panel(self) -> Table:
        """Create battle status table"""
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="white")
        
        table.add_row("Battle Time", f"{self.battle_report.battle_time:.1f}s")
        table.add_row("Shots Fired", str(self.battle_report.total_shots_fired))
        table.add_row("Hits", str(self.battle_report.total_hits))
        table.add_row("Accuracy", f"{(self.battle_report.total_hits / max(1, self.battle_report.total_shots_fired) * 100):.1f}%")
        table.add_row("Total Damage", f"{self.battle_report.total_damage_dealt:.1f}")
        table.add_row("Ships Destroyed", str(len(self.battle_report.ships_destroyed)))
        table.add_row("Battle Status", "COMPLETE" if self.battle_complete else "ACTIVE")
        
        return table
    
    def _create_ship_status_panel(self) -> Table:
        """Create ship status table"""
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Ship", style="cyan")
        table.add_column("Position", style="white")
        table.add_column("Hull", style="green")
        table.add_column("Shields", style="blue")
        table.add_column("Intent", style="yellow")
        table.add_column("Speed", style="red")
        
        for ship_id, ship in self.ships.items():
            if ship.is_destroyed():
                status = "DESTROYED"
                hull = "0"
                shields = "0"
                intent = "N/A"
                speed = "0"
            else:
                navigator = self.combat_navigators[ship_id]
                status = f"({ship.x:.0f}, {ship.y:.0f})"
                hull = f"{ship.hull_integrity:.0f}%"
                shields = f"{ship.shield_strength:.0f}"
                intent = navigator.current_intent.value.upper()
                speed = f"{ship.get_speed():.1f}"
            
            table.add_row(ship_id, status, hull, shields, intent, speed)
        
        return table
    
    def _create_system_stats_panel(self) -> Table:
        """Create system statistics table"""
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("System", style="cyan")
        table.add_column("Stat", style="white")
        
        # Projectile system stats
        proj_stats = self.projectile_system.get_system_stats()
        table.add_row("Active Projectiles", str(proj_stats['active_projectiles']))
        table.add_row("Particle System", str(self.exhaust_system.total_particles))
        
        # Performance stats
        table.add_row("Simulation FPS", "60")
        table.add_row("Physics Engine", "ACTIVE")
        
        return table
    
    def run_battle(self, duration: float = 30.0):
        """Run the battle simulation"""
        logger.info(f"🚀 Starting battle simulation for {duration}s...")
        
        # Setup battle
        self.setup_demo_battle()
        
        # Start simulation
        self.is_running = True
        start_time = time.time()
        
        # Create live display
        with Live(self.create_status_display(), refresh_per_second=10, console=self.console) as live:
            while self.is_running and (time.time() - start_time) < duration:
                # Update simulation
                self.update()
                
                # Update display
                live.update(self.create_status_display())
                
                # Small delay for real-time feel
                time.sleep(0.016)  # ~60 FPS
        
        # Final battle report
        self._print_battle_report()
    
    def _print_battle_report(self):
        """Print final battle report"""
        accuracy = (self.battle_report.total_hits / max(1, self.battle_report.total_shots_fired) * 100)
        survivors = len([s for s in self.ships.values() if not s.is_destroyed()])
        
        report_text = f"""
Battle Duration: {self.battle_report.battle_time:.1f} seconds
Total Shots Fired: {self.battle_report.total_shots_fired}
Total Hits: {self.battle_report.total_hits}
Accuracy: {accuracy:.1f}%
Total Damage Dealt: {self.battle_report.total_damage_dealt:.1f}
Ships Destroyed: {len(self.battle_report.ships_destroyed)}
Survivors: {survivors}
        """
        
        report = Panel(
            report_text,
            title="🚀 Battle Report",
            border_style="green"
        )
        self.console.print(report)


def main():
    """Main demo function"""
    # Configure logging
    logger.remove()
    logger.add("logs/space_battle.log", level="DEBUG")
    logger.add(lambda msg: None, level="INFO")  # Suppress console logs during demo
    
    print("🚀 DGT Automated Space Battle Demo")
    print("=" * 50)
    print("Demonstrating real-time space combat with:")
    print("• Newtonian physics with inertia")
    print("• PID-controlled navigation")
    print("• Combat AI with intent switching")
    print("• Automated target locking")
    print("• Particle exhaust effects")
    print("• Projectile collision detection")
    print("=" * 50)
    
    # Create and run battle
    arena = SpaceBattleArena()
    arena.run_battle(duration=30.0)
    
    print("\n🚀 Demo complete! Check logs/space_battle.log for detailed combat logs.")


if __name__ == "__main__":
    main()
