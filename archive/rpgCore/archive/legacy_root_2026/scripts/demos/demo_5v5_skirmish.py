import time
import random
import math
from typing import List, Dict

from loguru import logger

# DGT Core Imports
from src.dgt_core.kernel.state import GameState, ShipGenome, Entity
from src.dgt_core.kernel.fleet_roles import FleetRole
from src.dgt_core.generators.ship_wright import ShipWright
from src.dgt_core.simulation.space_physics import SpaceVoyagerEngine, SpaceShip
from src.dgt_core.kernel.constants import TARGET_FPS, FRAME_DELAY_SECONDS

# Configure Logging
logger.add("skirmish_test.log", rotation="1 MB")

class SkirmishSimulator:
    def __init__(self):
        self.ships: List[SpaceShip] = []
        self.game_state = GameState()
        self.physics_engine = SpaceVoyagerEngine()
        
        # Perf metrics
        self.frame_count = 0
        self.start_time = time.time()
        self.last_report = time.time()
    
    def spawn_ship(self, team: str, role: FleetRole, x: float, y: float, genome_id: str):
        # 1. Create Genome
        genome = ShipGenome(genome_id=genome_id)
        # Randomize traits for variation
        genome.traits = {
            "aggression": random.uniform(0.3, 0.9),
            "armor": random.uniform(0.1, 0.9)
        }
        
        # 2. Use ShipWright to get physics constraints
        physics_specs = ShipWright.apply_genetics(genome, role)
        
        # 3. Create SpaceShip Entity
        ship = SpaceShip(
            ship_id=f"{team}_{role.name}_{genome_id}",
            x=x,
            y=y,
            mass=physics_specs['mass'],
            max_thrust=physics_specs['max_thrust']
        )
        
        # Apply extra specs not standard in SpaceShip init (if supported, or stash in metadata)
        ship.metadata = physics_specs
        ship.metadata['team'] = team
        
        self.ships.append(ship)
        logger.info(f"🚀 Spawned {team} {role.name}: Mass={ship.mass:.1f}, Thrust={ship.max_thrust:.1f}")

    def setup_5v5(self):
        logger.info("⚔️ Setting up 5v5 Skirmish: Interceptors vs Heavies")
        
        # Team Alpha: 5 Interceptors
        for i in range(5):
            self.spawn_ship(
                team="Alpha", 
                role=FleetRole.INTERCEPTOR, 
                x=10 + i * 5, 
                y=10, 
                genome_id=f"A{i}"
            )
            
        # Team Bravo: 5 Heavies
        for i in range(5):
            self.spawn_ship(
                team="Bravo", 
                role=FleetRole.HEAVY, 
                x=10 + i * 5, 
                y=90, 
                genome_id=f"B{i}"
            )

    def update(self, dt: float):
        # Physics Update
        for ship in self.ships:
            # Simple AI: Fly towards center (50, 50)
            dx = 50 - ship.x
            dy = 50 - ship.y
            dist = math.sqrt(dx*dx + dy*dy)
            
            thrust_x = 0
            thrust_y = 0
            
            if dist > 5:
                # Normalize
                nx = dx / dist
                ny = dy / dist
                thrust_x = nx * 1.0 # Full throttle
                thrust_y = ny * 1.0
            
            # Apply physics
            ship.thrust_x = thrust_x
            ship.thrust_y = thrust_y
            self.physics_engine.update(ship, dt=dt)
            
            # Bounds check (wrap)
            if ship.x < 0: ship.x = 100
            if ship.x > 100: ship.x = 0
            if ship.y < 0: ship.y = 100
            if ship.y > 100: ship.y = 0
            
        self.frame_count += 1

    def run(self, duration_sec: int = 10):
        self.setup_5v5()
        
        logger.info(f"🏁 Starting Simulation for {duration_sec} seconds...")
        
        loop_start = time.time()
        while time.time() - loop_start < duration_sec:
            frame_start = time.time()
            
            self.update(FRAME_DELAY_SECONDS)
            
            # Sleep to maintain Target FPS
            elapsed = time.time() - frame_start
            sleep_time = max(0, FRAME_DELAY_SECONDS - elapsed)
            time.sleep(sleep_time)
            
            # Report every second
            if time.time() - self.last_report > 1.0:
                fps = self.frame_count / (time.time() - self.last_report)
                logger.info(f"📈 Performance: {fps:.2f} FPS | Active Ships: {len(self.ships)}")
                self.frame_count = 0
                self.last_report = time.time()

if __name__ == "__main__":
    sim = SkirmishSimulator()
    sim.run(10)
    print("✅ Skirmish Test Complete")
