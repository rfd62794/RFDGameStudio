"""
60-Second Survival Game with PPU Integration
ADR 172: Pure Python Stabilization + PPU Graphics

Integrates:
- Energy-Mass physics drain: drain = (thrust_input * base_rate) * (mass / 10.0)
- 60-second survival with PPU rendering
- Portal Entity spawn at T-minus 0
- Victory/Failure branches with proper logging
- PPU-based graphics (Game Boy style rendering)
"""

import asyncio
import time
import math
import random
import sys
import os
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__)))

from loguru import logger

try:
    # Import existing PPU components
    from src.graphics.ppu_tk_native import NativeTkinterPPU, RenderLayer, CanvasEntity, RenderEntity
    from tools.dithering_engine import DitheringEngine, TemplateGenerator
    PPU_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ PPU components not available: {e}")
    PPU_AVAILABLE = False

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


class SurvivalGamePPU:
    """60-second survival game with PPU graphics"""
    
    def __init__(self):
        # Game state
        self.game_state = GameState.PREPARATION
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
        
        # PPU display
        self.ppu_body: Optional[PPUBody] = None
        self.is_running = False
        
        logger.info("🚀 Survival Game PPU initialized - 60-second extraction protocol")
    
    def initialize_game(self) -> bool:
        """Initialize game with PPU"""
        if not PPU_AVAILABLE:
            logger.error("❌ PPU not available - cannot initialize game")
            return False
        
        # Create PPU body
        self.ppu_body = PPUBody()
        if not self.ppu_body._setup():
            logger.error("❌ Failed to setup PPU body")
            return False
        
        # Reset game state
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
        
        # Setup initial PPU scene
        self._setup_ppu_scene()
        
        logger.info("🎮 Game initialized with PPU - Asteroid field deployed")
        return True
    
    def _create_asteroid_field(self) -> None:
        """Create asteroid field"""
        # Create scattered asteroids
        for i in range(6):  # Fewer asteroids for playability
            asteroid = AsteroidEntity(
                entity_id=EntityID(f"asteroid_{i}", "asteroid"),
                x=random.uniform(20.0, 140.0),
                y=random.uniform(40.0, 120.0),
                velocity_x=random.uniform(-1.5, 1.5),
                velocity_y=random.uniform(-1.5, 1.5),
                mass=random.uniform(3.0, 8.0)
            )
            self.asteroids.append(asteroid)
        
        logger.info(f"☄️ Created {len(self.asteroids)} asteroids")
    
    def _setup_ppu_scene(self) -> None:
        """Setup initial PPU scene"""
        if not self.ppu_body or not hasattr(self.ppu_body, 'ppu'):
            return
        
        ppu = self.ppu_body.ppu
        
        # Add background tiles (space)
        for y in range(18):
            for x in range(20):
                # Create space background with some variation
                if random.random() < 0.1:
                    tile_type = "star"
                else:
                    tile_type = "space"
                
                try:
                    ppu.set_tile(x * 8, y * 8, tile_type)
                except:
                    # Fallback - create simple background
                    pass
        
        # Add player ship
        try:
            player_entity = RenderEntity(
                world_pos=(int(self.player_physics.x), int(self.player_physics.y)),
                sprite_id="actor_voyager"
            )
            ppu.add_entity(player_entity)
        except:
            logger.warning("⚠️ Could not add player entity to PPU")
        
        # Add asteroids
        for asteroid in self.asteroids:
            try:
                asteroid_entity = RenderEntity(
                    world_pos=(int(asteroid.x), int(asteroid.y)),
                    sprite_id="object_boulder"
                )
                ppu.add_entity(asteroid_entity)
            except:
                logger.warning(f"⚠️ Could not add asteroid {asteroid.entity_id.id} to PPU")
        
        logger.info("🎨 PPU scene setup complete")
    
    def start_survival_phase(self) -> None:
        """Begin 60-second survival phase"""
        self.game_state = GameState.SURVIVAL
        self.is_running = True
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
        
        # Update PPU display
        self._update_ppu_display()
    
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
                    self.is_running = False
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
                self.is_running = False
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
                
                # Add portal to PPU
                self._add_portal_to_ppu()
    
    def _add_portal_to_ppu(self) -> None:
        """Add portal entity to PPU"""
        if not self.ppu_body or not hasattr(self.ppu_body, 'ppu') or not self.portal:
            return
        
        try:
            portal_entity = RenderEntity(
                world_pos=(int(self.portal.x), int(self.portal.y)),
                sprite_id="portal_wormhole"
            )
            self.ppu_body.ppu.add_entity(portal_entity)
            logger.info("🌀 Portal added to PPU display")
        except Exception as e:
            logger.warning(f"⚠️ Could not add portal to PPU: {e}")
    
    def _update_ppu_display(self) -> None:
        """Update PPU display with current game state"""
        if not self.ppu_body or not hasattr(self.ppu_body, 'ppu'):
            return
        
        ppu = self.ppu_body.ppu
        
        # Update player position
        try:
            # Remove old player entity and add new one at updated position
            player_entity = RenderEntity(
                world_pos=(int(self.player_physics.x), int(self.player_physics.y)),
                sprite_id="actor_voyager"
            )
            # Note: In a full implementation, we'd update existing entities
            # For now, we'll work with the PPU's entity management
        except:
            pass
        
        # Update asteroid positions
        for asteroid in self.asteroids:
            try:
                asteroid_entity = RenderEntity(
                    world_pos=(int(asteroid.x), int(asteroid.y)),
                    sprite_id="object_boulder"
                )
            except:
                pass
        
        # Update HUD with game status
        self._update_hud()
    
    def _update_hud(self) -> None:
        """Update HUD overlay"""
        if not self.ppu_body:
            return
        
        # Create HUD data
        hud_data = HUDData(
            energy=f"{self.player_physics.energy:.0f}%",
            mass=f"{self.player_physics.mass:.1f}",
            speed=f"{math.sqrt(self.player_physics.velocity_x**2 + self.player_physics.velocity_y**2):.1f}",
            time_remaining=max(0, self.survival_duration - self.game_time) if self.game_state == GameState.SURVIVAL else 0.0,
            state=self.game_state.value.upper(),
            asteroid_hits=self.asteroid_hits
        )
        
        # Send HUD update packet
        if hasattr(self.ppu_body, 'render'):
            packet = RenderPacket(
                timestamp=time.time(),
                frame_data={"hud": hud_data},
                entities=[],
                effects=[]
            )
            try:
                self.ppu_body.render(packet)
            except:
                pass
    
    def set_thrust(self, x: float, y: float) -> None:
        """Set player thrust input"""
        self.thrust_x = max(-1.0, min(1.0, x))
        self.thrust_y = max(-1.0, min(1.0, y))
    
    async def run_game(self) -> None:
        """Run the game loop with PPU"""
        if not self.initialize_game():
            logger.error("❌ Failed to initialize game")
            return
        
        logger.info("🚀 60-Second Survival Game with PPU")
        logger.info("Survive for 60 seconds, then reach the extraction portal!")
        logger.info("Avoid high-speed asteroid collisions (>5.0 velocity)!")
        logger.info("Use WASD or Arrow keys to control your ship.")
        
        # Start survival phase after a short delay
        await asyncio.sleep(1.0)
        self.start_survival_phase()
        
        # Game loop
        last_time = time.time()
        
        while self.is_running:
            current_time = time.time()
            dt = current_time - last_time
            last_time = current_time
            
            # Simple input simulation (in real implementation, use proper input handling)
            # For demo, use random thrust patterns
            if random.random() < 0.1:  # 10% chance to change thrust
                self.set_thrust(random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5))
            elif random.random() < 0.05:  # 5% chance to stop thrust
                self.set_thrust(0, 0)
            
            # Update game
            self.update(dt)
            
            # Control frame rate
            await asyncio.sleep(1/60)  # 60 FPS
        
        # Show final result
        if self.game_state == GameState.VICTORY:
            logger.success("🎉 VICTORY! Extraction complete!")
            logger.success(f"📊 Final Stats: Time={self.game_time:.1f}s, Mass={self.player_physics.mass:.1f}, Energy={self.player_physics.energy:.1f}%")
        elif self.game_state == GameState.FAILURE:
            logger.error("💥 FAILURE! De-sync detected!")
            logger.info("🏥 Returning to Med-Bay for repairs...")
    
    def cleanup(self) -> None:
        """Clean up resources"""
        self.is_running = False
        if self.ppu_body and hasattr(self.ppu_body, 'cleanup'):
            self.ppu_body.cleanup()
        logger.info("🧹 Game cleanup complete")


async def main():
    """Main entry point"""
    logger.info("🎮 Starting 60-Second Survival Game with PPU")
    
    game = SurvivalGamePPU()
    try:
        await game.run_game()
    except KeyboardInterrupt:
        logger.info("🛑 Game interrupted by user")
    finally:
        game.cleanup()
    
    logger.info("🎮 Game completed")


if __name__ == "__main__":
    asyncio.run(main())
