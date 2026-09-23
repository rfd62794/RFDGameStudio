"""
60-Second Survival Game - Energy Drain & Extraction Protocol
ADR 172: Pure Python Stabilization with Rich Terminal UI

Integrates:
- Energy-Mass physics drain: drain = (thrust_input * base_rate) * (mass / 10.0)
- 60-second Rich Terminal countdown
- Portal Entity spawn at T-minus 0
- Victory/Failure branches with proper logging
- Stable PPU-free rendering (Rich Terminal only)
"""

import asyncio
import time
import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.layout import Layout
from rich.progress import Progress, BarColumn, TimeRemainingColumn
from rich.align import Align

# Import physics components
from dgt_core.kernel.components import PhysicsComponent, EntityID
from dgt_core.engines.space.space_physics import SpaceVoyagerEngine


class GameState(str, Enum):
    """Game state enumeration"""
    PREPARATION = "preparation"
    SURVIVAL = "survival"
    EXTRACTION = "extraction"
    VICTORY = "victory"
    FAILURE = "failure"


@dataclass
class PortalEntity:
    """Portal extraction entity"""
    entity_id: EntityID
    x: float
    y: float
    radius: float = 20.0
    active: bool = False


@dataclass
class AsteroidEntity:
    """Asteroid hazard entity"""
    entity_id: EntityID
    x: float
    y: float
    velocity_x: float
    velocity_y: float
    radius: float = 15.0
    mass: float = 5.0


class SurvivalGame:
    """60-second survival game with energy management"""
    
    def __init__(self):
        self.console = Console()
        self.game_state = GameState.PREPARATION
        
        # Game timing
        self.game_time = 0.0
        self.survival_duration = 60.0  # 60 seconds
        self.dt = 1.0 / 60.0  # 60 FPS
        
        # Physics engine
        self.physics_engine = SpaceVoyagerEngine()
        
        # Player ship (Sovereign Scout)
        self.player_physics = PhysicsComponent(
            x=80.0, y=36.0,  # Center-top of 160x144 grid
            mass=10.0,
            energy=100.0,
            max_energy=100.0,
            base_drain_rate=0.5
        )
        
        # Game entities
        self.portal: Optional[PortalEntity] = None
        self.asteroids: List[AsteroidEntity] = []
        
        # Player input
        self.thrust_x = 0.0
        self.thrust_y = 0.0
        
        # Game stats
        self.initial_mass = self.player_physics.mass
        self.distance_traveled = 0.0
        self.asteroid_hits = 0
        self.extraction_success = False
        
        # Rich display components
        self.live_display: Optional[Live] = None
        
        logger.info("🚀 Survival Game initialized - 60-second extraction protocol")
    
    def initialize_game(self) -> None:
        """Initialize game state"""
        self.game_state = GameState.PREPARATION
        self.game_time = 0.0
        
        # Reset player
        self.player_physics.x = 80.0
        self.player_physics.y = 36.0
        self.player_physics.velocity_x = 0.0
        self.player_physics.velocity_y = 0.0
        self.player_physics.energy = 100.0
        self.player_physics.mass = self.initial_mass
        
        # Clear entities
        self.asteroids.clear()
        self.portal = None
        
        # Reset stats
        self.distance_traveled = 0.0
        self.asteroid_hits = 0
        self.extraction_success = False
        
        # Create asteroid field
        self._create_asteroid_field()
        
        logger.info("🎮 Game initialized - Asteroid field deployed")
    
    def _create_asteroid_field(self) -> None:
        """Create asteroid field"""
        # Create scattered asteroids
        for i in range(8):
            asteroid = AsteroidEntity(
                entity_id=EntityID(f"asteroid_{i}", "asteroid"),
                x=random.uniform(20.0, 140.0),
                y=random.uniform(20.0, 100.0),
                velocity_x=random.uniform(-2.0, 2.0),
                velocity_y=random.uniform(-2.0, 2.0),
                mass=random.uniform(3.0, 8.0)
            )
            self.asteroids.append(asteroid)
        
        logger.info(f"☄️ Created {len(self.asteroids)} asteroids")
    
    def start_survival_phase(self) -> None:
        """Begin 60-second survival phase"""
        self.game_state = GameState.SURVIVAL
        logger.info("⏱️ Survival phase started - 60 seconds until extraction")
    
    def update(self, dt: float) -> None:
        """Update game state"""
        if self.game_state not in [GameState.SURVIVAL, GameState.EXTRACTION]:
            return
        
        self.game_time += dt
        
        # Update player physics
        self.player_physics.thrust_input_x = self.thrust_x
        self.player_physics.thrust_input_y = self.thrust_y
        
        # Apply physics with energy-mass drain
        self.physics_engine.update(self.player_physics, dt)
        
        # Track distance
        speed = math.sqrt(self.player_physics.velocity_x**2 + self.player_physics.velocity_y**2)
        self.distance_traveled += speed * dt
        
        # Keep player in bounds
        self._constrain_to_bounds(self.player_physics)
        
        # Update asteroids
        self._update_asteroids(dt)
        
        # Check collisions
        self._check_collisions()
        
        # Check game state transitions
        self._check_state_transitions()
    
    def _constrain_to_bounds(self, physics: PhysicsComponent) -> None:
        """Keep entity within 160x144 grid"""
        margin = 5.0
        
        if physics.x < margin:
            physics.x = margin
            physics.velocity_x = abs(physics.velocity_x) * 0.5
        elif physics.x > 160.0 - margin:
            physics.x = 160.0 - margin
            physics.velocity_x = -abs(physics.velocity_x) * 0.5
        
        if physics.y < margin:
            physics.y = margin
            physics.velocity_y = abs(physics.velocity_y) * 0.5
        elif physics.y > 144.0 - margin:
            physics.y = 144.0 - margin
            physics.velocity_y = -abs(physics.velocity_y) * 0.5
    
    def _update_asteroids(self, dt: float) -> None:
        """Update asteroid positions"""
        for asteroid in self.asteroids:
            asteroid.x += asteroid.velocity_x * dt * 60
            asteroid.y += asteroid.velocity_y * dt * 60
            
            # Bounce off bounds
            if asteroid.x < 10 or asteroid.x > 150:
                asteroid.velocity_x *= -1
            if asteroid.y < 10 or asteroid.y > 130:
                asteroid.velocity_y *= -1
            
            # Keep in bounds
            asteroid.x = max(10.0, min(150.0, asteroid.x))
            asteroid.y = max(10.0, min(130.0, asteroid.y))
    
    def _check_collisions(self) -> None:
        """Check for collisions"""
        player_speed = math.sqrt(self.player_physics.velocity_x**2 + self.player_physics.velocity_y**2)
        
        # Check asteroid collisions
        for asteroid in self.asteroids:
            dx = self.player_physics.x - asteroid.x
            dy = self.player_physics.y - asteroid.y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance < (asteroid.radius + 5.0):  # Player radius ~5
                if player_speed > 5.0:
                    # High-speed collision - failure
                    self.game_state = GameState.FAILURE
                    logger.error("💥 DE-SYNC DETECTED - High-speed asteroid impact!")
                    logger.error(f"   Impact velocity: {player_speed:.1f} > 5.0 threshold")
                    logger.error("   Returning to Med-Bay (Static Mock)")
                    return
                else:
                    # Low-speed bump - damage but continue
                    self.asteroid_hits += 1
                    # Bounce off
                    self.player_physics.velocity_x = -self.player_physics.velocity_x * 0.5
                    self.player_physics.velocity_y = -self.player_physics.velocity_y * 0.5
                    logger.warning(f"⚠️ Low-speed asteroid bump (#{self.asteroid_hits})")
        
        # Check portal extraction
        if self.portal and self.portal.active:
            dx = self.player_physics.x - self.portal.x
            dy = self.player_physics.y - self.portal.y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance < self.portal.radius:
                self.game_state = GameState.VICTORY
                self.extraction_success = True
                logger.success("🎉 EXTRACTION COMPLETE!")
                logger.success(f"   Survival time: {self.game_time:.1f}s")
                logger.success(f"   Final mass: {self.player_physics.mass:.1f}")
                logger.success(f"   Energy remaining: {self.player_physics.energy:.1f}%")
                logger.success(f"   Distance traveled: {self.distance_traveled:.1f}")
                logger.success(f"   Asteroid hits: {self.asteroid_hits}")
    
    def _check_state_transitions(self) -> None:
        """Check for game state transitions"""
        if self.game_state == GameState.SURVIVAL:
            # Check if 60 seconds are up
            if self.game_time >= self.survival_duration:
                self.game_state = GameState.EXTRACTION
                # Spawn portal at bottom-center
                self.portal = PortalEntity(
                    entity_id=EntityID("extraction_portal", "portal"),
                    x=80.0,  # Center of 160x144
                    y=130.0,  # Bottom area
                    radius=20.0,
                    active=True
                )
                logger.info("🌀 EXTRACTION PORTAL SPAWNED - Bottom-center position (80, 130)")
                logger.info("📍 Reach the portal for extraction!")
    
    def set_thrust(self, x: float, y: float) -> None:
        """Set player thrust input"""
        self.thrust_x = max(-1.0, min(1.0, x))
        self.thrust_y = max(-1.0, min(1.0, y))
    
    def create_display(self) -> Panel:
        """Create Rich display panel"""
        # Create status table
        status_table = Table(show_header=False, box=None, expand=True)
        
        # Game state and timing
        if self.game_state == GameState.SURVIVAL:
            time_remaining = max(0, self.survival_duration - self.game_time)
            time_color = "red" if time_remaining < 10 else "yellow" if time_remaining < 30 else "green"
            status_table.add_row("🎮 State:", f"[bold]{self.game_state.value.upper()}[/bold]")
            status_table.add_row("⏱️ Time Remaining:", f"[{time_color}]{time_remaining:.1f}s[/{time_color}]")
        elif self.game_state == GameState.EXTRACTION:
            status_table.add_row("🎮 State:", f"[bold cyan]{self.game_state.value.upper()}[/bold]")
            status_table.add_row("🌀 Portal:", "[green]ACTIVE - Reach for extraction![/green]")
        elif self.game_state == GameState.VICTORY:
            status_table.add_row("🎮 State:", f"[bold green]{self.game_state.value.upper()}[/bold]")
            status_table.add_row("🎉 Result:", "[green]EXTRACTION COMPLETE![/green]")
        elif self.game_state == GameState.FAILURE:
            status_table.add_row("🎮 State:", f"[bold red]{self.game_state.value.upper()}[/bold]")
            status_table.add_row("💥 Result:", "[red]DE-SYNC DETECTED![/red]")
        else:
            status_table.add_row("🎮 State:", f"[bold]{self.game_state.value.upper()}[/bold]")
            status_table.add_row("⏱️ Game Time:", f"{self.game_time:.1f}s")
        
        status_table.add_row("", "")  # Spacer
        
        # Player status
        energy_color = "red" if self.player_physics.energy < 20 else "yellow" if self.player_physics.energy < 50 else "green"
        status_table.add_row("🚀 Position:", f"({self.player_physics.x:.0f}, {self.player_physics.y:.0f})")
        status_table.add_row("⚡ Energy:", f"[{energy_color}]{self.player_physics.energy:.1f}%[/{energy_color}]")
        status_table.add_row("⚖️ Mass:", f"{self.player_physics.mass:.1f}")
        
        speed = math.sqrt(self.player_physics.velocity_x**2 + self.player_physics.velocity_y**2)
        speed_color = "red" if speed > 5.0 else "yellow" if speed > 3.0 else "green"
        status_table.add_row("🏃 Speed:", f"[{speed_color}]{speed:.1f}[/{speed_color}]")
        
        status_table.add_row("", "")  # Spacer
        
        # Game stats
        status_table.add_row("📊 Distance:", f"{self.distance_traveled:.1f}")
        status_table.add_row("☄️ Asteroid Hits:", f"{self.asteroid_hits}")
        
        # Energy-Mass drain info
        if self.thrust_x != 0 or self.thrust_y != 0:
            thrust_mag = math.sqrt(self.thrust_x**2 + self.thrust_y**2)
            mass_factor = max(1.0, self.player_physics.mass / 10.0)
            drain_rate = thrust_mag * self.player_physics.base_drain_rate * mass_factor
            status_table.add_row("🔋 Drain Rate:", f"{drain_rate:.2f}/s")
            status_table.add_row("⚖️ Mass Factor:", f"{mass_factor:.2f}x")
        
        # Controls help
        status_table.add_row("", "")  # Spacer
        status_table.add_row("🎮 Controls:", "WASD or Arrow Keys to thrust")
        
        # Create main panel
        panel_title = f"🚀 60-Second Survival Game - {self.game_state.value.title()}"
        
        return Panel(
            Align.center(status_table),
            title=f"[bold cyan]{panel_title}[/bold cyan]",
            border_style="cyan",
            padding=(1, 2)
        )
    
    async def run_game(self) -> None:
        """Run the game loop"""
        self.initialize_game()
        
        # Show initial state
        self.console.print("🚀 60-Second Survival Game", style="bold cyan")
        self.console.print("Survive for 60 seconds, then reach the extraction portal!", style="yellow")
        self.console.print("Avoid high-speed asteroid collisions (>5.0 velocity)!", style="red")
        self.console.print("Press any key to begin...")
        
        # Wait for input
        input()
        
        self.start_survival_phase()
        
        # Game loop with Rich Live display
        with Live(self.create_display(), refresh_per_second=30, console=self.console) as live:
            last_time = time.time()
            
            while self.game_state in [GameState.SURVIVAL, GameState.EXTRACTION]:
                current_time = time.time()
                dt = current_time - last_time
                last_time = current_time
                
                # Handle input (simplified - in real implementation, use proper input handling)
                # For demo, use random thrust
                if random.random() < 0.3:  # 30% chance to change thrust
                    self.set_thrust(random.uniform(-1, 1), random.uniform(-1, 1))
                else:
                    self.set_thrust(0, 0)
                
                # Update game
                self.update(dt)
                
                # Update display
                live.update(self.create_display())
                
                # Control frame rate
                await asyncio.sleep(1/60)  # 60 FPS
            
            # Show final state
            live.update(self.create_display())
            
            # Final message
            if self.game_state == GameState.VICTORY:
                self.console.print("\n🎉 VICTORY! Extraction complete!", style="bold green")
                self.console.print(Panel(
                    f"Survival Time: {self.game_time:.1f}s\n"
                    f"Final Mass: {self.player_physics.mass:.1f}\n"
                    f"Energy Remaining: {self.player_physics.energy:.1f}%\n"
                    f"Distance Traveled: {self.distance_traveled:.1f}\n"
                    f"Asteroid Hits: {self.asteroid_hits}",
                    title="🏆 Loot Summary",
                    border_style="green"
                ))
            elif self.game_state == GameState.FAILURE:
                self.console.print("\n💥 FAILURE! De-sync detected!", style="bold red")
                self.console.print("Returning to Med-Bay for repairs...", style="yellow")


async def main():
    """Main entry point"""
    logger.info("🎮 Starting 60-Second Survival Game")
    
    game = SurvivalGame()
    await game.run_game()
    
    logger.info("🎮 Game completed")


if __name__ == "__main__":
    asyncio.run(main())
