"""
DGT Sector Refactor Demo - ADR 168
Verifies Component-Lite Architecture, Sector Manager, and Screen Wrap
"""

import time
import random
import math
from typing import List, Dict

from loguru import logger

import sys
from pathlib import Path

# Add project root to sys.path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# DGT Core Imports
from src.dgt_core.kernel.components import PhysicsComponent, RenderComponent, InventoryComponent, EntityID
from src.dgt_core.simulation.sector_manager import SectorManager, Entity
from src.body.ppu import create_ppu_body
from src.dgt_core.kernel.constants import TARGET_FPS, FRAME_DELAY_SECONDS

# Configure Logging
logger.add("sector_test.log", rotation="1 MB")

class SectorRefactorDemo:
    def __init__(self):
        self.sector = SectorManager()
        self.ppu = create_ppu_body()
        
        # Perf metrics
        self.frame_count = 0
        self.start_time = time.time()
        self.last_report = time.time()
        
        if not self.ppu.initialize():
            logger.error("❌ Failed to initialize PPU")
            exit(1)
            
    def setup_demo(self):
        logger.info("🌌 Setting up Sector Refactor Demo")
        
        # 1. Spawn Player Ship
        player = Entity(
            id=EntityID(id="player_01", type="ship"),
            physics=PhysicsComponent(
                x=80, y=72,  # Center of 160x144
                mass=10.0,
                max_thrust=150.0,
                drag_coefficient=0.98
            ),
            render=RenderComponent(
                sprite_id="player",
                layer=2,
                color="#00FF00" # Green
            ),
            inventory=InventoryComponent(
                capacity=20,
                base_mass_modifier=2.0 # Heavy cargo
            )
        )
        self.sector.add_entity(player)
        self.player_entity = player
        self.ppu.add_sprite(type('obj', (object,), {'sprite_id': 'player', 'width': 8, 'height': 8, 'color': '#00FF00', 'dither_pattern': 'solid', 'layer': 2}))
        
        # 2. Spawn 50 Asteroids
        for i in range(50):
            asteroid = Entity(
                id=EntityID(id=f"asteroid_{i}", type="asteroid"),
                physics=PhysicsComponent(
                    x=random.randint(0, 160),
                    y=random.randint(0, 144),
                    velocity_x=random.uniform(-5, 5),
                    velocity_y=random.uniform(-5, 5),
                    mass=50.0,
                    drag_coefficient=1.0 # No drag in deep space for asteroids? Or slight.
                ),
                render=RenderComponent(
                    sprite_id="asteroid",
                    layer=1,
                    color="#808080"
                )
            )
            self.sector.add_entity(asteroid)
            # Register sprite (mock)
            
        self.ppu.add_sprite(type('obj', (object,), {'sprite_id': 'asteroid', 'width': 4, 'height': 4, 'color': '#808080', 'dither_pattern': 'checkerboard', 'layer': 1}))

    def update_input(self):
        """Mock Player Input (Orbit center)"""
        # Simple AI to drive player: accelerate towards cursor or just spin
        # Let's make it thrust forward and turn
        
        p = self.player_entity.physics
        # Turn
        p.heading += 2.0
        # Thrust
        rad = math.radians(p.heading)
        p.thrust_input_x = math.cos(rad) * 0.5
        p.thrust_input_y = math.sin(rad) * 0.5
        
        # Simulate adding inventory items to test mass
        if self.frame_count % 60 == 0:
            if not self.player_entity.inventory.items:
                self.player_entity.inventory.items['ore'] = 0
            self.player_entity.inventory.items['ore'] += 1
            # logger.info(f"📦 Inventory added. Mass is now: {p.mass:.1f}")

    def run(self, duration_sec: int = 15):
        self.setup_demo()
        
        logger.info(f"🏁 Starting Simulation for {duration_sec} seconds...")
        
        loop_start = time.time()
        while time.time() - loop_start < duration_sec:
            frame_start = time.time()
            
            # 1. Logic (Input)
            self.update_input()
            
            # 2. Sector Update (Physics + Wrap + Mass + Survival)
            events = self.sector.update(FRAME_DELAY_SECONDS)
            
            # Handle Events
            if "PORTAL_SPAWNED" in events:
                logger.warning("⚠️ PROXIMITY ALERT: EXTRACTION PORTAL DETECTED")
                # Register portal sprite
                self.ppu.add_sprite(type('obj', (object,), {'sprite_id': 'portal', 'width': 8, 'height': 8, 'color': '#00FFFF', 'dither_pattern': 'solid', 'layer': 2}))

            if "VICTORY" in events:
                logger.success(f"🚀 EXTRACTION COMPLETE | NEURAL PATTERN SECURED")
                logger.success(f"📦 CARGO TRANSFERRED: {self.player_entity.inventory.items.get('ore', 0)} Units | MASS: {self.player_entity.physics.mass:.1f}")
                time.sleep(2)
                break
                
            if "CRASH_FAIL" in events:
                logger.error("🛑 DE-SYNC DETECTED | CRITICAL IMPACT")
                logger.info("🏥 MED-BAY LINK ESTABLISHED... RE-SOCKETING CORE... CLONE 05 ACTIVATED")
                time.sleep(2)
                break
            
            # 3. Render
            render_packet = self.sector.get_render_data()
            self.ppu.render(render_packet) # Packet is now just the list
            self.ppu.update()
            
            # Sleep to maintain Target FPS
            elapsed = time.time() - frame_start
            sleep_time = max(0, FRAME_DELAY_SECONDS - elapsed)
            time.sleep(sleep_time)
            
            # Report every second (HUD Update)
            self.frame_count += 1
            if time.time() - self.last_report > 1.0:
                fps = self.frame_count / (time.time() - self.last_report)
                t_minus = 60.0 - self.sector.time_elapsed
                energy = self.player_entity.physics.energy
                status = "DRIFTING" if energy <= 0 else "OPERATIONAL"
                
                if t_minus > 0:
                    logger.info(f"⏱️ T-MINUS: {t_minus:.1f}s | 🔋 ENERGY: {energy:.1f}% [{status}]")
                else:
                    logger.warning(f"🚨 EXTRACTION WINDOW OPEN | GO TO PORTAL!")
                    
                self.frame_count = 0
                self.last_report = time.time()
        
        self.ppu._cleanup()

if __name__ == "__main__":
    sim = SectorRefactorDemo()
    sim.run(15)
    logger.success("✅ Sector Refactor Test Complete")
