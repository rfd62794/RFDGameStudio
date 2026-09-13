"""
Turbo-Scout Demo - Genetic Asteroids with Shell-Ships
Demonstrates TurboShells concepts absorbed into the DGT SDK

This demo shows genetic asteroids that evolve when split and shell-ships
with inherited traits that modify physics behavior.
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
from engines.body.systems.fracture_system import create_genetic_fracture_system, AsteroidFragment
from engines.body.systems.wave_spawner import WaveSpawner, create_arcade_wave_spawner
from engines.body.components.game_state import GameState, create_arcade_game_state
from engines.body.components.shell_ship import create_shell_ship_manager
from engines.body.systems.knowledge_library import create_knowledge_library
from apps.interface.menu_system import create_menu_system


class TurboScoutController:
    """Enhanced controller with ship selection"""
    
    def __init__(self, shell_ship_manager):
        self.shell_ship_manager = shell_ship_manager
        self.thrust = 0.0
        self.rotation = 0.0
        self.fire_weapon = False
        self.select_ship = False
        self.ship_index = 0
        
        # Input mapping
        self.keys_pressed = set()
        
        # Available ships
        self.ship_types = list(shell_ship_manager.get_available_archetypes().keys())
        
    def handle_event(self, event) -> None:
        """Handle pygame event"""
        if event.type == pygame.KEYDOWN:
            self.keys_pressed.add(event.key)
            
            # Ship selection
            if event.key == pygame.K_TAB:
                self.select_ship = True
            elif event.key == pygame.K_LEFT and self.select_ship:
                self.ship_index = (self.ship_index - 1) % len(self.ship_types)
            elif event.key == pygame.K_RIGHT and self.select_ship:
                self.ship_index = (self.ship_index + 1) % len(self.ship_types)
            elif event.key == pygame.K_RETURN and self.select_ship:
                # Apply selected ship
                ship_type = self.ship_types[self.ship_index]
                # This will be handled by the main game
                self.select_ship = False
                
        elif event.type == pygame.KEYUP:
            self.keys_pressed.discard(event.key)
    
    def update(self) -> None:
        """Update control state based on pressed keys"""
        # Reset controls
        self.thrust = 0.0
        self.rotation = 0.0
        self.fire_weapon = False
        
        # Check keys (only if not in ship selection mode)
        if not self.select_ship:
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
    
    def get_selected_ship(self) -> str:
        """Get currently selected ship type"""
        return self.ship_types[self.ship_index]


class TurboScoutDemo:
    """
    Turbo-Scout Demo with genetic asteroids and shell-ships
    Demonstrates the convergence of TurboShells and DGT SDK
    """
    
    def __init__(self):
        """Initialize the Turbo-Scout demo"""
        self.running = True
        
        # Initialize PyGame
        pygame.init()
        
        # Display setup (4x scaling for desktop)
        scale_factor = 4
        self.screen_width = SOVEREIGN_WIDTH * scale_factor
        self.screen_height = SOVEREIGN_HEIGHT * scale_factor
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption("DGT SDK - Turbo-Scout Demo")
        
        # Game surface (160x144)
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Initialize SDK Components with genetics
        self._initialize_genetic_components()
        
        # Game timing
        self.clock = pygame.time.Clock()
        self.dt = 1.0 / 60.0  # 60Hz for arcade precision
        self.game_time = 0.0
        
        # Enhanced color palette for genetic visualization
        self.colors = {
            'black': (0, 0, 0),
            'white': (255, 255, 255),
            'green': (0, 255, 0),
            'blue': (100, 150, 255),
            'red': (255, 100, 100),
            'amber': (255, 191, 0),
            'purple': (200, 100, 255),
            'cyan': (0, 255, 255),
            'grey': (170, 170, 170),
            'light_grey': (192, 192, 192),
            'dark_green': (0, 128, 0)
        }
        
        # Font
        try:
            self.font = pygame.font.Font(None, 8)
        except:
            self.font = pygame.font.SysFont('monospace', 6)
        
        # UI state
        self.show_genetics = False
        self.show_ship_selection = False
        
        logger.info("🧬 Turbo-Scout Demo initialized with genetic components")
    
    def _initialize_genetic_components(self) -> None:
        """Initialize all SDK components with genetic enhancements"""
        # Core game components with genetics
        self.kinetic_body = create_player_ship()
        self.projectile_system = create_arcade_projectile_system()
        self.fracture_system = create_genetic_fracture_system()  # Genetics enabled!
        self.game_state = create_arcade_game_state()
        
        # Shell-Ship management
        self.shell_ship_manager = create_shell_ship_manager()
        
        # Knowledge library for tracking discoveries
        self.knowledge_library = create_knowledge_library("data/genetic_library.json")
        
        # Wave management with genetic asteroids
        self.wave_spawner = create_arcade_wave_spawner(self.fracture_system)
        
        # Enhanced controller with ship selection
        self.manual_controller = TurboScoutController(self.shell_ship_manager)
        
        # Menu system
        self.menu_system = create_menu_system(SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT)
        self.menu_system.initialize()
        self.menu_system.on_start_game = self._on_start_game
        self.menu_system.on_exit_game = self._on_exit_game
        
        # Show menu initially
        self.menu_system.show_main_menu()
        
        # Game state tracking
        self.is_playing = False
        self.player_alive = False
        self.current_wave = 0
        
        logger.info("🧬 Genetic SDK Components initialized")
    
    def _on_start_game(self) -> None:
        """Handle start game from menu"""
        # Start new game session
        start_result = self.game_state.start_new_game()
        
        if start_result.success:
            # Reset player position and apply default ship
            self.kinetic_body.set_position(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
            self.kinetic_body.set_angle(0.0)
            self.kinetic_body.stop()
            
            # Apply balanced ship by default
            self.shell_ship_manager.select_archetype('balanced', self.kinetic_body)
            
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
                self.current_wave = 1
                logger.info("🧬 Turbo-Scout game started successfully")
            else:
                logger.error(f"Failed to start first wave: {wave_result.error}")
        else:
            logger.error(f"Failed to start game: {start_result.error}")
    
    def _on_exit_game(self) -> None:
        """Handle exit game from menu"""
        self.running = False
        logger.info("👋 Turbo-Scout demo exiting")
    
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
                
                # Toggle genetics display
                if event.type == pygame.KEYDOWN and event.key == pygame.K_g:
                    self.show_genetics = not self.show_genetics
                
                # Ship selection
                if event.type == pygame.KEYDOWN and event.key == pygame.K_TAB:
                    self.show_ship_selection = not self.show_ship_selection
                
                # Apply ship selection
                if event.type == pygame.KEYDOWN and event.key == pygame.K_RETURN and self.show_ship_selection:
                    selected_ship = self.manual_controller.get_selected_ship()
                    select_result = self.shell_ship_manager.select_archetype(selected_ship, self.kinetic_body)
                    
                    if select_result.success:
                        logger.info(f"🐢 Selected ship: {selected_ship}")
                        self.show_ship_selection = False
                
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
            self.current_wave += 1
            
            # Start next wave
            next_wave_result = self.wave_spawner.start_next_wave()
            if not next_wave_result.success:
                logger.error(f"Failed to start next wave: {next_wave_result.error}")
        
        # Check collisions and genetics
        self._check_genetic_collisions()
        
        # Check game over
        if self.game_state.game_over:
            self._handle_game_over()
    
    def _check_genetic_collisions(self) -> None:
        """Check collisions and track genetic discoveries"""
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
        
        # Handle collisions and genetic discoveries
        for projectile, asteroid in collisions:
            # Calculate impact angle for fracture
            dx = asteroid.kinetic_body.state.position.x - projectile.kinetic_body.state.position.x
            dy = asteroid.kinetic_body.state.position.y - projectile.kinetic_body.state.position.y
            impact_angle = math.atan2(dy, dx)
            
            # Add to knowledge library if genetic
            if asteroid.genetic_component:
                discovery_result = self.knowledge_library.add_discovery(
                    asteroid.genetic_component,
                    self.current_wave,
                    'asteroid'
                )
                
                if discovery_result.success:
                    logger.debug(f"🧬 Discovered genetic pattern: {asteroid.genetic_id}")
            
            # Fracture asteroid
            fracture_result = self.wave_spawner.fracture_asteroid(asteroid, impact_angle)
            
            if fracture_result.success:
                # Add score based on asteroid size
                size_categories = {3: 'large_asteroid', 2: 'medium_asteroid', 1: 'small_asteroid'}
                category = size_categories.get(asteroid.size, 'default')
                
                self.game_state.add_score(asteroid.point_value, category)
                
                # Track new genetic patterns from fragments
                for fragment in fracture_result.value:
                    if fragment.genetic_component:
                        fragment_discovery = self.knowledge_library.add_discovery(
                            fragment.genetic_component,
                            self.current_wave,
                            'asteroid'
                        )
                        
                        if fragment_discovery.success:
                            logger.debug(f"🧬 Discovered fragment pattern: {fragment.genetic_id}")
                
                logger.debug(f"💥 Genetic asteroid fractured! Size: {asteroid.size}")
        
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
            logger.info("💀 Turbo-Scout game over!")
        else:
            # Respawn player
            self.kinetic_body.set_position(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
            self.kinetic_body.set_angle(0.0)
            self.kinetic_body.stop()
            
            self.player_alive = True
            logger.info("🔄 Turbo-Scout respawned")
    
    def _handle_game_over(self) -> None:
        """Handle game over state"""
        self.is_playing = False
        
        # Show library statistics
        library_stats = self.knowledge_library.get_library_stats()
        logger.info(f"🧬 Game Over! Discoveries: {library_stats['total_discoveries']}")
        
        # Return to menu
        self.menu_system.show_main_menu()
    
    def render(self) -> None:
        """Render the game"""
        # Clear game surface
        self.game_surface.fill(self.colors['black'])
        
        if self.is_playing:
            # Render game objects
            self._render_genetic_objects()
            self._render_hud()
            
            # Render genetics overlay
            if self.show_genetics:
                self._render_genetics_overlay()
            
            # Render ship selection
            if self.show_ship_selection:
                self._render_ship_selection()
        
        # Render menu overlay
        self.menu_system.render(self.game_surface)
        
        # Scale to screen
        scaled_surface = pygame.transform.scale(self.game_surface, (self.screen_width, self.screen_height))
        self.screen.blit(scaled_surface, (0, 0))
        
        pygame.display.flip()
    
    def _render_genetic_objects(self) -> None:
        """Render genetic asteroids and ship"""
        # Render genetic asteroids
        for asteroid in self.wave_spawner.get_active_asteroids():
            pos = asteroid.get_position()
            
            # Use genetic color if available
            color = asteroid.color
            
            pygame.draw.circle(self.game_surface, color, 
                             (int(pos[0]), int(pos[1])), 
                             int(asteroid.radius))
            pygame.draw.circle(self.game_surface, self.colors['white'], 
                             (int(pos[0]), int(pos[1])), 
                             int(asteroid.radius), 1)
            
            # Show genetic ID for large asteroids
            if asteroid.size == 3 and asteroid.genetic_id:
                id_surface = self.font.render(asteroid.genetic_id[:8], True, self.colors['cyan'])
                self.game_surface.blit(id_surface, (int(pos[0]) - 20, int(pos[1]) - 15))
        
        # Render genetic ship
        if self.player_alive:
            player_pos = self.kinetic_body.get_position_tuple()
            player_angle = self.kinetic_body.state.angle
            
            # Get ship color from shell manager
            ship_color = self.shell_ship_manager.get_ship_color()
            
            # Draw triangle ship
            ship_points = [
                (player_pos[0] + 6 * math.cos(player_angle), 
                 player_pos[1] + 6 * math.sin(player_angle)),
                (player_pos[0] + 6 * math.cos(player_angle + 2.4), 
                 player_pos[1] + 6 * math.sin(player_angle + 2.4)),
                (player_pos[0] + 6 * math.cos(player_angle - 2.4), 
                 player_pos[1] + 6 * math.sin(player_angle - 2.4))
            ]
            
            pygame.draw.polygon(self.game_surface, ship_color, ship_points)
            pygame.draw.polygon(self.game_surface, self.colors['white'], ship_points, 1)
        
        # Render projectiles
        for projectile_pos in self.projectile_system.get_active_positions():
            pygame.draw.circle(self.game_surface, self.colors['white'], 
                             (int(projectile_pos[0]), int(projectile_pos[1])), 2)
    
    def _render_hud(self) -> None:
        """Render game HUD with genetic information"""
        y_offset = 2
        
        # Game stats
        game_stats = self.game_state.get_game_stats()
        
        # Score
        score_text = f"SCORE: {game_stats.get('score', 0)}"
        score_surface = self.font.render(score_text, True, self.colors['green'])
        self.game_surface.blit(score_surface, (2, y_offset))
        y_offset += 8
        
        # Lives and Wave
        lives_text = f"LIVES: {game_stats.get('lives', 0)} WAVE: {self.current_wave}"
        lives_surface = self.font.render(lives_text, True, self.colors['green'])
        self.game_surface.blit(lives_surface, (2, y_offset))
        y_offset += 8
        
        # Ship info
        ship_stats = self.shell_ship_manager.get_ship_stats()
        ship_text = f"SHIP: {ship_stats['archetype']}"
        ship_surface = self.font.render(ship_text, True, ship_stats['color'])
        self.game_surface.blit(ship_surface, (2, y_offset))
        y_offset += 8
        
        # Genetic discoveries
        library_stats = self.knowledge_library.get_library_stats()
        discoveries_text = f"DISCOVERIES: {library_stats['total_discoveries']}"
        discoveries_surface = self.font.render(discoveries_text, True, self.colors['cyan'])
        self.game_surface.blit(discoveries_surface, (2, y_offset))
        y_offset += 8
        
        # Instructions
        instructions = [
            "TAB: Ship Selection",
            "G: Genetics Info",
            "ESC: Menu"
        ]
        
        y_offset = SOVEREIGN_HEIGHT - 32
        for instruction in instructions:
            inst_surface = self.font.render(instruction, True, self.colors['amber'])
            self.game_surface.blit(inst_surface, (2, y_offset))
            y_offset += 8
    
    def _render_genetics_overlay(self) -> None:
        """Render genetics information overlay"""
        # Create semi-transparent overlay
        overlay = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill(self.colors['black'])
        self.game_surface.blit(overlay, (0, 0))
        
        # Title
        title_text = "GENETIC KNOWLEDGE LIBRARY"
        title_surface = self.font.render(title_text, True, self.colors['cyan'])
        self.game_surface.blit(title_surface, (2, 2))
        
        # Library stats
        library_stats = self.knowledge_library.get_library_stats()
        analysis = self.knowledge_library.analyze_patterns()
        
        y_offset = 12
        stats_lines = [
            f"Total Discoveries: {library_stats['total_discoveries']}",
            f"Generations: {library_stats['generations']}",
            f"Diversity Score: {analysis.diversity_score:.2f}",
            f"Sources: {library_stats['sources']}"
        ]
        
        for line in stats_lines:
            line_surface = self.font.render(str(line), True, self.colors['green'])
            self.game_surface.blit(line_surface, (2, y_offset))
            y_offset += 8
        
        # Recent discoveries
        y_offset += 4
        recent_text = "RECENT DISCOVERIES:"
        recent_surface = self.font.render(recent_text, True, self.colors['amber'])
        self.game_surface.blit(recent_surface, (2, y_offset))
        y_offset += 8
        
        discoveries = self.knowledge_library.get_all_discoveries()[:5]  # Last 5
        for discovery in discoveries:
            discovery_text = f"Gen {discovery.generation}: {discovery.genetic_id[:12]}..."
            discovery_surface = self.font.render(discovery_text, True, self.colors['white'])
            self.game_surface.blit(discovery_surface, (2, y_offset))
            y_offset += 8
    
    def _render_ship_selection(self) -> None:
        """Render ship selection interface"""
        # Create semi-transparent overlay
        overlay = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill(self.colors['black'])
        self.game_surface.blit(overlay, (0, 0))
        
        # Title
        title_text = "SELECT SHELL-SHIP"
        title_surface = self.font.render(title_text, True, self.colors['cyan'])
        self.game_surface.blit(title_surface, (2, 2))
        
        # Ship options
        archetypes = self.shell_ship_manager.get_available_archetypes()
        selected_ship = self.manual_controller.get_selected_ship()
        
        y_offset = 12
        for i, (ship_name, archetype) in enumerate(archetypes.items()):
            # Highlight selection
            if ship_name == selected_ship:
                color = self.colors['amber']
                prefix = ">"
            else:
                color = self.colors['green']
                prefix = " "
            
            ship_text = f"{prefix} {ship_name}: {archetype.description}"
            ship_surface = self.font.render(ship_text, True, color)
            self.game_surface.blit(ship_surface, (2, y_offset))
            y_offset += 8
            
            # Show traits
            traits = archetype.genetic_component.get_genetic_info()['traits']
            trait_text = f"   Speed: {traits['speed']} Mass: {traits['mass']}"
            trait_surface = self.font.render(trait_text, True, self.colors['grey'])
            self.game_surface.blit(trait_surface, (2, y_offset))
            y_offset += 8
        
        # Instructions
        y_offset = SOVEREIGN_HEIGHT - 24
        instructions = [
            "LEFT/RIGHT: Select",
            "ENTER: Apply",
            "TAB: Cancel"
        ]
        
        for instruction in instructions:
            inst_surface = self.font.render(instruction, True, self.colors['white'])
            self.game_surface.blit(inst_surface, (2, y_offset))
            y_offset += 8
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            logger.info("🧬 Starting Turbo-Scout Demo")
            
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
            return Result(success=False, error=f"Demo failed: {e}")
        
        finally:
            self.cleanup()
    
    def cleanup(self) -> None:
        """Clean up resources"""
        pygame.quit()
        logger.info("🧹 Turbo-Scout Demo cleanup complete")


def main():
    """Main entry point"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🧬 DGT SDK - Turbo-Scout Demo")
    print("=" * 40)
    print("Genetic Asteroids & Shell-Ships")
    print("TurboShells concepts absorbed into SDK")
    print()
    print("Features:")
    print("  • Genetic asteroids that evolve when split")
    print("  • Shell-ships with inherited traits")
    print("  • Knowledge library for discoveries")
    print("  • Real-time genetic tracking")
    print()
    print("Controls:")
    print("  W/↑ - Thrust Forward")
    print("  S/↓ - Thrust Backward")
    print("  A/← - Rotate Left")
    print("  D/→ - Rotate Right")
    print("  SPACE - Fire Weapon")
    print("  TAB - Ship Selection")
    print("  G - Genetics Info")
    print("  ESC - Pause Menu")
    print()
    
    # Create and run demo
    demo = TurboScoutDemo()
    
    try:
        result = demo.run()
        
        if result.success:
            print("🏆 Turbo-Scout Demo completed successfully!")
            return 0
        else:
            print(f"❌ Demo failed: {result.error}")
            return 1
            
    except KeyboardInterrupt:
        print("\n🛑 Demo interrupted by user")
        return 0


if __name__ == "__main__":
    exit(main())
