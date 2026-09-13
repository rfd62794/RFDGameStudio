"""
Asteroids Clone SDK - Component-Based Arcade Classic
Demonstrates the new DGT SDK components in action

This is the reference implementation showing how to build an arcade classic
using the 4 core components: KineticBody, ProjectileSystem, FractureSystem, GameState
"""

import pygame
import sys
import math
import time
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from loguru import logger

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from engines.body.components.kinetic_body import KineticBody, create_player_ship
from engines.body.systems.projectile_system import ProjectileSystem, create_arcade_projectile_system
from engines.body.systems.fracture_system import FractureSystem, create_classic_fracture_system, AsteroidFragment
from engines.body.systems.wave_spawner import WaveSpawner, create_arcade_wave_spawner
from engines.body.components.game_state import GameState, create_arcade_game_state
from apps.interface.menu_system import create_menu_system


class ManualController:
    """Manual player controller for keyboard input"""
    
    def __init__(self):
        self.thrust = 0.0
        self.rotation = 0.0
        self.fire_weapon = False
        
        # Input mapping
        self.keys_pressed = set()
        
    def handle_event(self, event) -> None:
        """Handle pygame event"""
        if event.type == pygame.KEYDOWN:
            self.keys_pressed.add(event.key)
        elif event.type == pygame.KEYUP:
            self.keys_pressed.discard(event.key)
    
    def update(self) -> None:
        """Update control state based on pressed keys"""
        # Reset controls
        self.thrust = 0.0
        self.rotation = 0.0
        self.fire_weapon = False
        
        # Check keys
        if pygame.K_w in self.keys_pressed or pygame.K_UP in self.keys_pressed:
            self.thrust = 1.0
        if pygame.K_s in self.keys_pressed or pygame.K_DOWN in self.keys_pressed:
            self.thrust = -1.0
        if pygame.K_a in self.keys_pressed or pygame.K_LEFT in self.keys_pressed:
            self.rotation = -1.0
        if pygame.K_d in self.keys_pressed or pygame.K_RIGHT in self.keys_pressed:
            self.rotation = 1.0
        if pygame.K_SPACE in self.keys_pressed:
            self.fire_weapon = True


class AsteroidsCloneSDK:
    """
    Component-based Asteroids Clone using the DGT SDK
    Demonstrates clean separation of concerns and reusability
    """
    
    def __init__(self):
        """Initialize the game with all SDK components"""
        self.running = True
        
        # Initialize PyGame
        pygame.init()
        
        # Display setup (4x scaling for desktop)
        scale_factor = 4
        self.screen_width = SOVEREIGN_WIDTH * scale_factor
        self.screen_height = SOVEREIGN_HEIGHT * scale_factor
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption("DGT SDK - Asteroids Clone")
        
        # Game surface (160x144)
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Initialize SDK Components
        self._initialize_components()
        
        # Game timing
        self.clock = pygame.time.Clock()
        self.dt = 1.0 / 60.0  # 60Hz for arcade precision
        self.game_time = 0.0
        
        # Colors (phosphor green aesthetic)
        self.colors = {
            'black': (0, 0, 0),
            'white': (255, 255, 255),
            'green': (0, 255, 0),
            'amber': (255, 191, 0),
            'grey': (170, 170, 170),
            'light_grey': (192, 192, 192),
            'dark_green': (0, 128, 0)
        }
        
        # Font
        try:
            self.font = pygame.font.Font(None, 8)
        except:
            self.font = pygame.font.SysFont('monospace', 6)
        
        logger.info("🎮 Asteroids Clone SDK initialized with components")
    
    def _initialize_components(self) -> None:
        """Initialize all SDK components"""
        # Core game components
        self.kinetic_body = create_player_ship()
        self.projectile_system = create_arcade_projectile_system()
        self.fracture_system = create_classic_fracture_system()
        self.game_state = create_arcade_game_state()
        
        # Wave management
        self.wave_spawner = create_arcade_wave_spawner(self.fracture_system)
        
        # Player control
        self.manual_controller = ManualController()
        
        # Menu system
        self.menu_system = create_menu_system(SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT)
        self.menu_system.initialize()
        self.menu_system.on_start_game = self._on_start_game
        self.menu_system.on_exit_game = self._on_exit_game
        
        # Show menu initially
        self.menu_system.show_main_menu()
        
        # Game state tracking
        self.is_playing = False
        self.player_alive = True
        
        logger.info("🔧 SDK Components initialized")
    
    def _on_start_game(self) -> None:
        """Handle start game from menu"""
        # Start new game session
        start_result = self.game_state.start_new_game()
        
        if start_result.success:
            # Reset player position
            self.kinetic_body.set_position(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
            self.kinetic_body.set_angle(0.0)
            self.kinetic_body.stop()
            
            # Clear projectiles
            self.projectile_system.clear_all()
            
            # Reset wave spawner
            self.wave_spawner.reset()
            self.wave_spawner.set_player_position(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
            
            # Start first wave
            wave_result = self.wave_spawner.start_next_wave()
            
            if wave_result.success:
                self.is_playing = True
                self.player_alive = True
                logger.info("🚀 Game started successfully")
            else:
                logger.error(f"Failed to start first wave: {wave_result.error}")
        else:
            logger.error(f"Failed to start game: {start_result.error}")
    
    def _on_exit_game(self) -> None:
        """Handle exit game from menu"""
        self.running = False
        logger.info("👋 Game exiting")
    
    def handle_events(self) -> None:
        """Handle pygame events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            # Let menu system handle input first
            if self.menu_system.is_menu_active():
                handled = False
                if event.type == pygame.KEYDOWN:
                    handled = self.menu_system.handle_input("KEYDOWN", event.key)
                if not handled:
                    self.manual_controller.handle_event(event)
            else:
                # Game input
                self.manual_controller.handle_event(event)
                
                # Pause menu
                if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                    self.menu_system.show_pause_menu()
    
    def update(self) -> None:
        """Update game state"""
        if not self.is_playing:
            return
        
        # Update game time
        self.game_time += self.dt
        
        # Update player controls
        self.manual_controller.update()
        
        # Apply player controls to kinetic body
        if self.player_alive:
            # Apply thrust and rotation
            if self.manual_controller.thrust != 0:
                self.kinetic_body.apply_thrust(self.manual_controller.thrust, self.dt)
            
            if self.manual_controller.rotation != 0:
                self.kinetic_body.apply_rotation(self.manual_controller.rotation, self.dt)
            
            # Handle firing
            if self.manual_controller.fire_weapon:
                player_pos = self.kinetic_body.get_position_tuple()
                player_angle = self.kinetic_body.state.angle
                
                fire_result = self.projectile_system.fire_projectile(
                    owner_id="player",
                    start_x=player_pos[0],
                    start_y=player_pos[1],
                    angle=player_angle,
                    current_time=self.game_time
                )
                
                # Fire result is logged by projectile system
            
            # Update player physics
            self.kinetic_body.update(self.dt)
            
            # Update wave spawner with player position
            self.wave_spawner.set_player_position(*player_pos)
        
        # Update projectiles
        expired_projectiles = self.projectile_system.update(self.dt, self.game_time)
        
        # Update wave spawner
        wave_result = self.wave_spawner.update(self.dt)
        
        if wave_result.success and wave_result.value:
            # Wave completed
            self.game_state.advance_wave()
            
            # Start next wave
            next_wave_result = self.wave_spawner.start_next_wave()
            if not next_wave_result.success:
                logger.error(f"Failed to start next wave: {next_wave_result.error}")
        
        # Check collisions
        self._check_collisions()
        
        # Check game over
        if self.game_state.game_over:
            self._handle_game_over()
    
    def _check_collisions(self) -> None:
        """Check all collision interactions"""
        if not self.player_alive:
            return
        
        player_pos = self.kinetic_body.get_position_tuple()
        
        # Check projectile-asteroid collisions
        def projectile_collision_check(projectile_pos: Tuple[float, float]) -> Optional[AsteroidFragment]:
            for asteroid in self.wave_spawner.get_active_asteroids():
                asteroid_pos = asteroid.get_position()
                distance = math.sqrt(
                    (projectile_pos[0] - asteroid_pos[0])**2 + 
                    (projectile_pos[1] - asteroid_pos[1])**2
                )
                
                if distance < asteroid.radius:
                    return asteroid
            return None
        
        collisions = self.projectile_system.check_collisions(
            projectile_collision_check, 
            self.game_time
        )
        
        # Handle collisions
        for projectile, asteroid in collisions:
            # Calculate impact angle for fracture
            dx = asteroid.kinetic_body.state.position.x - projectile.kinetic_body.state.position.x
            dy = asteroid.kinetic_body.state.position.y - projectile.kinetic_body.state.position.y
            impact_angle = math.atan2(dy, dx)
            
            # Fracture asteroid
            fracture_result = self.wave_spawner.fracture_asteroid(asteroid, impact_angle)
            
            if fracture_result.success:
                # Add score based on asteroid size
                size_categories = {3: 'large_asteroid', 2: 'medium_asteroid', 1: 'small_asteroid'}
                category = size_categories.get(asteroid.size, 'default')
                
                self.game_state.add_score(asteroid.point_value, category)
                
                logger.debug(f"💥 Asteroid destroyed! Size: {asteroid.size}, Points: {asteroid.point_value}")
        
        # Check player-asteroid collisions
        for asteroid in self.wave_spawner.get_active_asteroids():
            asteroid_pos = asteroid.get_position()
            distance = math.sqrt(
                (player_pos[0] - asteroid_pos[0])**2 + 
                (player_pos[1] - asteroid_pos[1])**2
            )
            
            if distance < asteroid.radius + 3:  # Ship radius ~3px
                # Player hit
                self._handle_player_hit()
                break
    
    def _handle_player_hit(self) -> None:
        """Handle player being hit by asteroid"""
        self.player_alive = False
        
        # Lose a life
        life_result = self.game_state.lose_life()
        
        if life_result.success and life_result.value:
            # Game over
            logger.info("💀 Game over!")
        else:
            # Respawn player
            self.kinetic_body.set_position(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
            self.kinetic_body.set_angle(0.0)
            self.kinetic_body.stop()
            
            self.player_alive = True
            logger.info("🔄 Player respawned")
    
    def _handle_game_over(self) -> None:
        """Handle game over state"""
        self.is_playing = False
        
        # Show high score entry if qualified
        game_stats = self.game_state.get_game_stats()
        logger.info(f"🏆 Game Over! Final Score: {game_stats.get('score', 0)}")
        
        # Return to menu
        self.menu_system.show_main_menu()
    
    def render(self) -> None:
        """Render the game"""
        # Clear game surface
        self.game_surface.fill(self.colors['black'])
        
        if self.is_playing:
            # Render game objects
            self._render_game_objects()
            self._render_hud()
        
        # Render menu overlay
        self.menu_system.render(self.game_surface)
        
        # Scale to screen
        scaled_surface = pygame.transform.scale(self.game_surface, (self.screen_width, self.screen_height))
        self.screen.blit(scaled_surface, (0, 0))
        
        pygame.display.flip()
    
    def _render_game_objects(self) -> None:
        """Render all game objects"""
        # Render asteroids
        for asteroid in self.wave_spawner.get_active_asteroids():
            pos = asteroid.get_position()
            pygame.draw.circle(self.game_surface, asteroid.color, 
                             (int(pos[0]), int(pos[1])), 
                             int(asteroid.radius))
            pygame.draw.circle(self.game_surface, self.colors['white'], 
                             (int(pos[0]), int(pos[1])), 
                             int(asteroid.radius), 1)
        
        # Render player
        if self.player_alive:
            player_pos = self.kinetic_body.get_position_tuple()
            player_angle = self.kinetic_body.state.angle
            
            # Draw triangle ship
            ship_points = [
                (player_pos[0] + 6 * math.cos(player_angle), 
                 player_pos[1] + 6 * math.sin(player_angle)),
                (player_pos[0] + 6 * math.cos(player_angle + 2.4), 
                 player_pos[1] + 6 * math.sin(player_angle + 2.4)),
                (player_pos[0] + 6 * math.cos(player_angle - 2.4), 
                 player_pos[1] + 6 * math.sin(player_angle - 2.4))
            ]
            
            pygame.draw.polygon(self.game_surface, self.colors['green'], ship_points)
            pygame.draw.polygon(self.game_surface, self.colors['white'], ship_points, 1)
        
        # Render projectiles
        for projectile_pos in self.projectile_system.get_active_positions():
            pygame.draw.circle(self.game_surface, self.colors['white'], 
                             (int(projectile_pos[0]), int(projectile_pos[1])), 2)
    
    def _render_hud(self) -> None:
        """Render game HUD"""
        y_offset = 2
        
        # Game stats
        game_stats = self.game_state.get_game_stats()
        
        # Score
        score_text = f"SCORE: {game_stats.get('score', 0)}"
        score_surface = self.font.render(score_text, True, self.colors['green'])
        self.game_surface.blit(score_surface, (2, y_offset))
        y_offset += 8
        
        # Lives
        lives_text = f"LIVES: {game_stats.get('lives', 0)}"
        lives_surface = self.font.render(lives_text, True, self.colors['green'])
        self.game_surface.blit(lives_surface, (2, y_offset))
        y_offset += 8
        
        # Wave
        wave_text = f"WAVE: {game_stats.get('wave', 1)}"
        wave_surface = self.font.render(wave_text, True, self.colors['green'])
        self.game_surface.blit(wave_surface, (2, y_offset))
        y_offset += 8
        
        # Asteroids remaining
        wave_status = self.wave_spawner.get_wave_status()
        asteroids_text = f"ASTEROIDS: {wave_status.get('active_asteroids', 0)}"
        asteroids_surface = self.font.render(asteroids_text, True, self.colors['amber'])
        self.game_surface.blit(asteroids_surface, (2, y_offset))
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            logger.info("🎮 Starting Asteroids Clone SDK")
            
            while self.running:
                # Handle events
                self.handle_events()
                
                # Update game
                self.update()
                
                # Render
                self.render()
                
                # Control frame rate (60Hz for arcade precision)
                self.clock.tick(60)
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Game failed: {e}")
        
        finally:
            self.cleanup()
    
    def cleanup(self) -> None:
        """Clean up resources"""
        pygame.quit()
        logger.info("🧹 Asteroids Clone SDK cleanup complete")


def main():
    """Main entry point"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🎮 DGT SDK - Asteroids Clone")
    print("=" * 40)
    print("Component-Based Arcade Classic")
    print("Built with 4 core SDK components:")
    print("  • KineticBody - Physics & Movement")
    print("  • ProjectileSystem - Bullet Management")
    print("  • FractureSystem - Asteroid Splitting")
    print("  • GameState - Score & Progress")
    print()
    print("Controls:")
    print("  W/↑ - Thrust Forward")
    print("  S/↓ - Thrust Backward")
    print("  A/← - Rotate Left")
    print("  D/→ - Rotate Right")
    print("  SPACE - Fire Weapon")
    print("  ESC - Pause Menu")
    print()
    
    # Create and run game
    game = AsteroidsCloneSDK()
    
    try:
        result = game.run()
        
        if result.success:
            print("🏆 Asteroids Clone completed successfully!")
            return 0
        else:
            print(f"❌ Game failed: {result.error}")
            return 1
            
    except KeyboardInterrupt:
        print("\n🛑 Game interrupted by user")
        return 0


if __name__ == "__main__":
    exit(main())
