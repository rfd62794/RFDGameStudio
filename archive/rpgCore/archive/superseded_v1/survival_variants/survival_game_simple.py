"""
60-Second Survival Game with SimplePPU Direct-Line Protocol
ADR 175: Zero Circular Dependencies - Clean Architecture

This is the "Golden Path" implementation that bypasses all the import wars
and delivers a working Sovereign Scout with Energy-Mass physics.
"""

import asyncio
import time
import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger

# Import SimplePPU - ZERO circular dependencies!
from body.simple_ppu import SimplePPU, RenderDTO, create_simple_ppu

# Import physics components - NO circular dependencies!
from dgt_core.kernel.components import PhysicsComponent, EntityID
from dgt_core.engines.space.space_physics import SpaceVoyagerEngine

# Import narrative bridge for loot-to-lore pipeline
from narrative_bridge import process_extraction_result, ExtractionResult, get_random_story_snippet


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


class SurvivalGameSimple:
    """60-second survival game with SimplePPU Direct-Line rendering"""
    
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
        
        # Game stats
        self.initial_mass = self.player_physics.mass
        self.distance_traveled = 0.0
        self.asteroid_hits = 0
        self.extraction_success = False
        
        # SimplePPU - Direct-Line rendering!
        self.ppu: Optional[SimplePPU] = None
        self.is_running = False
        
        logger.info("🚀 Survival Game Simple initialized - Direct-Line PPU protocol")
    
    def initialize_game(self) -> bool:
        """Initialize game with SimplePPU"""
        # Create SimplePPU - ZERO circular dependencies!
        self.ppu = create_simple_ppu("Sovereign Scout - 60s Survival")
        if not self.ppu:
            logger.error("❌ Failed to create SimplePPU")
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
        
        logger.info("🎮 Game initialized with SimplePPU - Asteroid field deployed")
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
        
        # Get player input from SimplePPU
        if self.ppu:
            thrust_x, thrust_y = self.ppu.get_input_vector()
            self.player_physics.thrust_input_x = thrust_x
            self.player_physics.thrust_input_y = thrust_y
        
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
        
        # Render via Direct-Line protocol
        self._render_via_direct_line()
    
    def _constrain_to_bounds(self, physics: PhysicsComponent) -> None:
        """Newtonian Screen Wrap - ADR 178: Infinite Loop Protocol"""
        # Apply seamless modulo wrap for infinite space
        physics.x = physics.x % 160.0
        physics.y = physics.y % 144.0
        
        # No velocity loss - maintain Newtonian momentum through wrap
        # This creates the "Slingshot" effect for heavy ships
    
    def _update_asteroids(self, dt: float) -> None:
        """Update asteroid positions with Newtonian Screen Wrap"""
        for asteroid in self.asteroids:
            asteroid.x += asteroid.velocity_x * dt * 60
            asteroid.y += asteroid.velocity_y * dt * 60
            
            # Apply Newtonian Screen Wrap to asteroids too
            asteroid.x = asteroid.x % 160.0
            asteroid.y = asteroid.y % 144.0
    
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
    
    def _render_via_direct_line(self) -> None:
        """Render via Direct-Line protocol - NO circular dependencies!"""
        if not self.ppu:
            return
        
        # Add energy flicker effect when low
        if self.player_physics.energy < 10.0:
            # Random flicker for low energy
            if random.random() < 0.3:  # 30% chance to flicker
                return  # Skip this frame for flicker effect
        
        # Convert asteroids to DTO format
        asteroid_dto_list = []
        for asteroid in self.asteroids:
            asteroid_dto_list.append({
                'x': asteroid.x,
                'y': asteroid.y,
                'radius': asteroid.radius
            })
        
        # Convert portal to DTO format
        portal_dto = None
        if self.portal and self.portal.active:
            portal_dto = {
                'x': self.portal.x,
                'y': self.portal.y,
                'radius': self.portal.radius
            }
        
        # Create RenderDTO - Direct-Line data transfer!
        dto = RenderDTO(
            player_physics=self.player_physics,
            asteroids=asteroid_dto_list,
            portal=portal_dto,
            game_state=self.game_state.value.upper(),
            time_remaining=max(0, self.survival_duration - self.game_time) if self.game_state == GameState.SURVIVAL else 0.0
        )
        
        # Send to SimplePPU - ZERO circular dependencies!
        self.ppu.render(dto)
    
    def _process_narrative_outcome(self) -> None:
        """Process game outcome through narrative bridge"""
        # Create extraction result
        result = ExtractionResult(
            success=(self.game_state == GameState.VICTORY),
            final_mass=self.player_physics.mass,
            energy_remaining=self.player_physics.energy,
            distance_traveled=self.distance_traveled,
            asteroid_hits=self.asteroid_hits,
            survival_time=self.game_time,
            clone_number=1  # Will be updated by narrative bridge on failures
        )
        
        # Process through narrative bridge
        outcome = process_extraction_result(result)
        
        if outcome["type"] == "success":
            # VICTORY - Show loot summary and story
            logger.success("🎉 EXTRACTION COMPLETE!")
            logger.success(f"📊 Loot Summary:")
            logger.success(f"   Scrap Collected: {outcome['scrap_collected']:.1f}")
            logger.success(f"   Credits Earned: {outcome['credits_earned']}")
            logger.success(f"   Total Extractions: {outcome['total_extractions']}")
            
            # Show unlocked stories
            if outcome["new_stories"]:
                logger.info(f"📖 New Stories Unlocked: {', '.join(outcome['new_stories'])}")
            
            # Show random story snippet
            story_snippet = get_random_story_snippet()
            if story_snippet:
                logger.info("📚 Story Archive Entry:")
                logger.info(f"   {story_snippet}")
                
        else:
            # FAILURE - Show med-bay log
            logger.error("💥 DE-SYNC DETECTED!")
            logger.error(f"🏥 Med-Bay Log - Clone #{outcome['clone_number']}")
            logger.error(f"   {outcome['med_bay_log']}")
            logger.info("🔄 New clone activated. Return to the extraction zone.")
    
    async def run_game(self) -> None:
        """Run the game loop with SimplePPU"""
        if not self.initialize_game():
            logger.error("❌ Failed to initialize game")
            return
        
        logger.info("🚀 60-Second Survival Game with SimplePPU Direct-Line")
        logger.info("Survive for 60 seconds, then reach the extraction portal!")
        logger.info("Avoid high-speed asteroid collisions (>5.0 velocity)!")
        logger.info("Use WASD to control your ship. ESC to exit.")
        
        # Start survival phase after a short delay
        await asyncio.sleep(1.0)
        self.start_survival_phase()
        
        # Game loop
        last_time = time.time()
        
        while self.is_running:
            current_time = time.time()
            dt = current_time - last_time
            last_time = current_time
            
            # Update game
            self.update(dt)
            
            # Update SimplePPU display
            if self.ppu and not self.ppu.update():
                logger.info("🖼️ PPU window closed")
                break
            
            # Control frame rate
            await asyncio.sleep(1/60)  # 60 FPS
        
        # Process narrative outcome
        self._process_narrative_outcome()
        
        # Keep window open for a moment to see final state
        await asyncio.sleep(3.0)
    
    def cleanup(self) -> None:
        """Clean up resources"""
        self.is_running = False
        if self.ppu:
            self.ppu.stop()
        logger.info("🧹 Game cleanup complete")


async def main():
    """Main entry point"""
    logger.info("🎮 Starting 60-Second Survival Game with SimplePPU Direct-Line")
    
    game = SurvivalGameSimple()
    try:
        await game.run_game()
    except KeyboardInterrupt:
        logger.info("🛑 Game interrupted by user")
    finally:
        game.cleanup()
    
    logger.info("🎮 Game completed")


if __name__ == "__main__":
    asyncio.run(main())
