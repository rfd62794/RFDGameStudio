"""
Tournament Mode - Live Evolution Spectator
Multi-AI competition with visual debugging and scrap collection
"""

import pygame
import sys
import math
import json
import random
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from loguru import logger

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, DEBUG_INFINITE_ENERGY
from dgt_engine.game_engine import TriBrain, create_tri_brain, ShipGenetics
from dgt_engine.game_engine.actors.asteroid_pilot import AsteroidPilot
from dgt_engine.systems.body import UnifiedPPU, create_unified_ppu, RenderPacket


class Bullet:
    """Projectile fired by pilot"""
    def __init__(self, x: float, y: float, angle: float, owner_id: str):
        self.x = x
        self.y = y
        self.vx = math.cos(angle) * 400.0  # Fast bullet
        self.vy = math.sin(angle) * 400.0
        self.owner_id = owner_id
        self.lifetime = 2.0  # 2.0 second lifetime
        self.active = True

    def update(self, dt: float) -> None:
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.lifetime -= dt
        if self.lifetime <= 0:
            self.active = False


class Explosion:
    """Visual particle effect for impacts"""
    def __init__(self, x: float, y: float, color: Tuple[int, int, int]):
        self.x = x
        self.y = y
        self.color = color
        self.radius = 2.0
        self.lifetime = 0.5  # 0.5 second lifetime
        self.max_lifetime = 0.5
        self.active = True

    def update(self, dt: float) -> None:
        self.lifetime -= dt
        self.radius += 30.0 * dt  # Expand
        if self.lifetime <= 0:
            self.active = False

    def draw(self, surface: pygame.Surface) -> None:
        alpha = int(255 * (self.lifetime / self.max_lifetime))
        # Pygame doesn't easily support alpha on simple shapes without surfaces
        # We'll just draw a circle with decreasing radius or color intensity
        color_intensity = max(0, int(255 * (self.lifetime / self.max_lifetime)))
        fade_color = (
            min(255, self.color[0] + (255 - self.color[0]) * (1.0 - self.lifetime/self.max_lifetime)),
            min(255, self.color[1] + (255 - self.color[1]) * (1.0 - self.lifetime/self.max_lifetime)),
            min(255, self.color[2] + (255 - self.color[2]) * (1.0 - self.lifetime/self.max_lifetime))
        )
        pygame.draw.circle(surface, self.color, (int(self.x), int(self.y)), int(self.radius), 1)


class TournamentPilot:
    """Individual AI pilot for tournament mode"""
    
    def __init__(self, pilot_id: str, color: Tuple[int, int, int], 
                 generation: int, network_file: Optional[str] = None):
        self.pilot_id = pilot_id
        self.color = color
        self.generation = generation
        
        # Combat state
        self.bullets: List[Bullet] = []
        self.last_fire_time = -10.0  # Allow immediate first shot
        self.fire_cooldown = 1.0  # 1.0s cooldown (Slower firing)
        
        # Create AI controller
        if network_file and Path(network_file).exists():
            neural_network = self._load_network(network_file)
        
        # Use TriBrain for advanced pilots
        self.controller = create_tri_brain(pilot_id)
        
        # Performance metrics
        self.survival_time = 0.0
        self.asteroids_destroyed = 0
        self.scrap_collected = 0
        self.fitness = 0.0
        
        # Visual position (for tournament display)
        self.visual_x = 0
        self.visual_y = 0
        self.visual_angle = 0
        
        logger.info(f"🤖 Tournament pilot {pilot_id} (Gen {generation}) initialized")
    
    def _load_network(self, filename: str) -> Optional[NeuralNetwork]:
        """Load neural network from file"""
        try:
            with open(filename, 'r') as f:
                network_data = json.load(f)
            
            # Reconstruct neural network
            network = NeuralNetwork(
                num_inputs=network_data['num_inputs'],
                num_hidden=network_data['num_hidden'],
                num_outputs=network_data['num_outputs']
            )
            
            # Restore weights and biases
            network.weights_input_hidden = network_data['weights_input_hidden']
            network.weights_hidden_output = network_data['weights_hidden_output']
            network.bias_hidden = network_data['bias_hidden']
            network.bias_output = network_data['bias_output']
            
            logger.info(f"📖 Loaded neural network from {filename}")
            return network
            
        except Exception as e:
            logger.error(f"Failed to load network {filename}: {e}")
            return None
    
    def update_fitness(self, survival_time: float, asteroids_destroyed: int, scrap_collected: int) -> None:
        """Update pilot fitness with scrap awareness"""
        self.survival_time = survival_time
        self.asteroids_destroyed = asteroids_destroyed
        self.scrap_collected = scrap_collected
        
        # Fitness = Survival + (Rocks * 10) + (Scrap * 25)
        self.fitness = survival_time + (asteroids_destroyed * 10) + (scrap_collected * 25)
    
    def get_mental_vector(self) -> Dict[str, Any]:
        """Get the AI's current mental vector for debugging"""
        if hasattr(self.controller, 'get_mental_vector'):
            return self.controller.get_mental_vector()
        return {'x': 0, 'y': 0, 'target': None, 'type': None}


class TournamentMode:
    """Live evolution tournament with multiple AI pilots"""
    
    def __init__(self):
        self.running = True
        
        # Initialize PyGame
        pygame.init()
        
        # Create display with 4x scaling for desktop visibility
        scale_factor = 4
        self.screen_width = SOVEREIGN_WIDTH * scale_factor
        self.screen_height = SOVEREIGN_HEIGHT * scale_factor
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption("DGT Platform - AI Tournament Mode")
        
        # Create surface for game rendering (160x144)
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Tournament pilots
        self.pilots = []
        
        # Pilot colors
        self.pilot_colors = [
            (255, 100, 100),  # Red - Gen 0
            (100, 255, 100),  # Green - Gen 25  
            (100, 100, 255),  # Blue - Gen 50
        ]
        
        # Initialize pilots
        self._initialize_pilots()
        
        # Game state
        self.game_time = 0.0
        self.dt = 1.0 / 60.0
        
        # Colors
        self.colors = {
            'black': (0, 0, 0),
            'white': (255, 255, 255),
            'gray': (128, 128, 128),
            'light_gray': (192, 192, 192),
            'dark_gray': (64, 64, 64),
            'green': (0, 255, 0),
            'red': (255, 0, 0),
            'blue': (0, 100, 255),
            'yellow': (255, 255, 0),
            'orange': (255, 165, 0),
            'purple': (128, 0, 128),
            'cyan': (0, 255, 255)
        }
        
        # Pilot colors
        self.pilot_colors = [
            (255, 100, 100),  # Red - Gen 0
            (100, 255, 100),  # Green - Gen 25  
            (100, 100, 255),  # Blue - Gen 50
        ]
        
        # Font
        try:
            self.font = pygame.font.Font(None, 8)
        except:
            self.font = pygame.font.SysFont('monospace', 6)
        
        # Scrap entities
        self.scrap_entities = []
        self._spawn_scrap()
        
        # Projectiles and FX
        self.explosions: List[Explosion] = []
        
        # Asteroids
        self.asteroids = []
        self._spawn_asteroids()
        
        # Environmental noise
        self.noise_factor = 0.1  # 10% velocity variation
        
        logger.info("🏆 Tournament Mode initialized")
    
    def _initialize_pilots(self) -> None:
        """Initialize tournament pilots"""
        pilot_configs = [
            #("GEN_0_PILOT", self.pilot_colors[0], 0, None),  # Rule-based
            ("GEN_25_PILOT", self.pilot_colors[1], 25, "best_pilot_network.json"),  # Load best network for Green
            #("GEN_50_PILOT", self.pilot_colors[2], 50, "best_pilot_network.json"),  # Load best network
        ]
        
        for pilot_id, color, generation, network_file in pilot_configs:
            pilot = TournamentPilot(pilot_id, color, generation, network_file)
            self.pilots.append(pilot)
    
    def _spawn_scrap(self) -> None:
        """Spawn scrap entities for collection"""
        scrap_configs = [
            {'x': 80, 'y': 40, 'value': 5, 'radius': 3},
            {'x': 40, 'y': 100, 'value': 10, 'radius': 4},
            {'x': 120, 'y': 80, 'value': 15, 'radius': 5},
            {'x': 60, 'y': 60, 'value': 8, 'radius': 3},
        ]
        
        for config in scrap_configs:
            self.scrap_entities.append(config.copy())

    def _spawn_scrap_at(self, x: float, y: float) -> None:
        """Spawn scrap at a specific location (from destroyed asteroid)"""
        new_scrap = {
            'x': x,
            'y': y,
            'value': random.randint(5, 15),
            'radius': 3
        }
        self.scrap_entities.append(new_scrap)
        logger.info(f"✨ Scrap spawned at ({x:.1f}, {y:.1f})")
    
    def _spawn_asteroids(self) -> None:
        """Spawn asteroids with environmental noise"""
        base_asteroids = [
            {'x': 50, 'y': 50, 'vx': 30, 'vy': 20, 'size': 3, 'radius': 8.0, 'health': 3, 'color': 'dark_gray'},
            {'x': 120, 'y': 80, 'vx': -25, 'vy': 35, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'gray'},
            {'x': 30, 'y': 100, 'vx': 40, 'vy': -30, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'light_gray'},
        ]
        
        noise_factor = 0.1  # 10% velocity variation
        
        for asteroid in base_asteroids:
            # Apply environmental noise
            noisy_asteroid = asteroid.copy()
            noisy_asteroid['vx'] *= (1.0 + random.uniform(-noise_factor, noise_factor))
            noisy_asteroid['vy'] *= (1.0 + random.uniform(-noise_factor, noise_factor))
            self.asteroids.append(noisy_asteroid)
    
    def handle_events(self) -> None:
        """Handle pygame events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                elif event.key == pygame.K_r:
                    # Reset tournament
                    self._reset_tournament()
    
    def update_game_state(self) -> None:
        """Update tournament game state"""
        self.game_time += self.dt
        
        # Update asteroids
        for asteroid in self.asteroids:
            asteroid['x'] += asteroid['vx'] * self.dt
            asteroid['y'] += asteroid['vy'] * self.dt
            
            # Wrap around screen
            asteroid['x'] = asteroid['x'] % SOVEREIGN_WIDTH
            asteroid['y'] = asteroid['y'] % SOVEREIGN_HEIGHT
        
        # Update each pilot
        for pilot in self.pilots:
            self._update_pilot(pilot)
            
            # Update bullets
            for bullet in pilot.bullets:
                bullet.update(self.dt)
                # Wrap bullet position
                bullet.x = bullet.x % SOVEREIGN_WIDTH
                bullet.y = bullet.y % SOVEREIGN_HEIGHT
            pilot.bullets = [b for b in pilot.bullets if b.active]
        
        # Update explosions
        for explosion in self.explosions[:]:
            explosion.update(self.dt)
            if not explosion.active:
                self.explosions.remove(explosion)

        # Check collisions
        self._check_collisions()
        
        # Respawn entities if needed
        if len(self.asteroids) < 2:
            self._spawn_asteroids()
        
        if len(self.scrap_entities) < 3:
            self._spawn_scrap()
    
    def _update_pilot(self, pilot: TournamentPilot) -> None:
        """Update individual pilot"""
        # Create mock entity state
        entity_state = {
            'x': SOVEREIGN_WIDTH // 2,
            'y': SOVEREIGN_HEIGHT // 2,
            'vx': 0.0,
            'vy': 0.0,
            'angle': 0.0,
            'energy': 100.0
        }
        
        # Create world data
        world_data = {
            'asteroids': self.asteroids,
            'scrap': self.scrap_entities
        }
        
        # Update controller
        control_result = pilot.controller.update(self.dt, entity_state, world_data)
        if control_result.success:
            pilot.last_controls = control_result.value
            
            # Apply controls to physics
            # This part of the code was incomplete in the instruction,
            # so I'm keeping the original logic for visual updates.
            # If _apply_pilot_controls is a new method, it would need to be defined.
            
            # Update visual position based on controls
            if pilot.last_controls.thrust != 0:
                thrust_magnitude = pilot.last_controls.thrust * 50.0
                pilot.visual_x += thrust_magnitude * math.cos(pilot.visual_angle) * self.dt
                pilot.visual_y += thrust_magnitude * math.sin(pilot.visual_angle) * self.dt
            
            if pilot.last_controls.rotation != 0:
                pilot.visual_angle += pilot.last_controls.rotation * 3.0 * self.dt
                pilot.visual_angle = pilot.visual_angle % (2 * math.pi)
                
            # Handle firing
            if pilot.last_controls.fire_weapon:
                current_time = self.game_time
                if current_time - pilot.last_fire_time >= pilot.fire_cooldown:
                    pilot.last_fire_time = current_time
                    # Spawn bullet from nose of ship
                    nose_x = pilot.visual_x + 10 * math.cos(pilot.visual_angle)
                    nose_y = pilot.visual_y + 10 * math.sin(pilot.visual_angle)
                    new_bullet = Bullet(nose_x, nose_y, pilot.visual_angle, pilot.pilot_id)
                    pilot.bullets.append(new_bullet)
            
            # Wrap position
            pilot.visual_x = pilot.visual_x % SOVEREIGN_WIDTH
            pilot.visual_y = pilot.visual_y % SOVEREIGN_HEIGHT
            
            # Update fitness
            pilot.update_fitness(self.game_time, pilot.asteroids_destroyed, pilot.scrap_collected)

    def _get_toroidal_vector(self, x1: float, y1: float, x2: float, y2: float) -> Tuple[float, float, float]:
        """Calculate shortest vector from p1 to p2 in a toroidal world"""
        dx = x2 - x1
        dy = y2 - y1
        if abs(dx) > SOVEREIGN_WIDTH / 2: dx -= math.copysign(SOVEREIGN_WIDTH, dx)
        if abs(dy) > SOVEREIGN_HEIGHT / 2: dy -= math.copysign(SOVEREIGN_HEIGHT, dy)
        dist = math.sqrt(dx**2 + dy**2)
        return dx, dy, dist

    def _check_collisions(self) -> None:
        """Check collisions for all pilots and bullets using toroidal awareness"""
        # Scrap collection
        for pilot in self.pilots:
            scrap_to_remove = []
            for scrap_idx, scrap in enumerate(self.scrap_entities):
                _, _, distance = self._get_toroidal_vector(pilot.visual_x, pilot.visual_y, scrap['x'], scrap['y'])
                if distance < scrap['radius'] + 3:  # Ship radius
                    scrap_to_remove.append(scrap_idx)
                    pilot.scrap_collected += scrap['value']
            
            # Remove collected scrap
            for scrap_idx in sorted(scrap_to_remove, reverse=True):
                del self.scrap_entities[scrap_idx]
                
        # Bullet collisions
        for pilot in self.pilots:
            for bullet in pilot.bullets:
                if not bullet.active: continue
                
                # Check asteroid hits
                for asteroid in self.asteroids[:]: # Iterate over a copy to allow removal
                    _, _, dist = self._get_toroidal_vector(bullet.x, bullet.y, asteroid['x'], asteroid['y'])
                    if dist < asteroid['radius'] + 2: # Bullet radius approx 2
                        bullet.active = False
                        asteroid['health'] -= 1
                        
                        # Visual hit effect
                        self.explosions.append(Explosion(bullet.x, bullet.y, (255, 200, 50)))
                        
                        if asteroid['health'] <= 0:
                            pilot.asteroids_destroyed += 1
                            # Explosion on destruction
                            self.explosions.append(Explosion(asteroid['x'], asteroid['y'], (255, 255, 255)))
                            # Spawn scrap
                            self._spawn_scrap_at(asteroid['x'], asteroid['y'])
                            self.asteroids.remove(asteroid)
                        break # Bullet hit something, stop checking other asteroids
    
    def render_game(self) -> None:
        """Render tournament mode"""
        # Clear surface
        self.game_surface.fill(self.colors['black'])
        
        # Draw scrap entities
        self._draw_scrap()
        
        # Draw asteroids
        self._draw_asteroids()
        
        # Draw bullets
        self._draw_bullets()
        
        # Draw pilots
        self._draw_pilots()
        
        # Draw explosions
        self._draw_explosions()

        # Draw mental vectors
        self._draw_mental_vectors()
        
        # Draw tournament HUD
        self._draw_tournament_hud()
        
        # Scale to screen
        scaled_surface = pygame.transform.scale(self.game_surface, (self.screen_width, self.screen_height))
        self.screen.blit(scaled_surface, (0, 0))
        
        pygame.display.flip()
    
    def _draw_scrap(self) -> None:
        """Draw scrap entities"""
        for scrap in self.scrap_entities:
            # Draw scrap as diamond
            size = scrap['radius']
            points = [
                (scrap['x'], scrap['y'] - size),
                (scrap['x'] + size, scrap['y']),
                (scrap['x'], scrap['y'] + size),
                (scrap['x'] - size, scrap['y'])
            ]
            pygame.draw.polygon(self.game_surface, self.colors['yellow'], points)
            pygame.draw.polygon(self.game_surface, self.colors['orange'], points, 1)
    
    def _draw_bullets(self) -> None:
        """Draw projectiles"""
        for pilot in self.pilots:
            for bullet in pilot.bullets:
                if bullet.active:
                    # Draw bullet trace
                    end_x = bullet.x - bullet.vx * 0.05
                    end_y = bullet.y - bullet.vy * 0.05
                    pygame.draw.line(self.game_surface, self.colors['white'],
                                   (int(bullet.x), int(bullet.y)),
                                   (int(end_x), int(end_y)), 1)
    
    def _draw_asteroids(self) -> None:
        """Draw asteroids"""
        for asteroid in self.asteroids:
            color = self.colors[asteroid['color']]
            pygame.draw.circle(self.game_surface, color, 
                             (int(asteroid['x']), int(asteroid['y'])), 
                             int(asteroid['radius']))
            pygame.draw.circle(self.game_surface, self.colors['white'], 
                             (int(asteroid['x']), int(asteroid['y'])), 
                             int(asteroid['radius']), 1)
    
    def _draw_pilots(self) -> None:
        """Draw tournament pilots"""
        for pilot in self.pilots:
            # Draw triangle ship
            ship_points = [
                (pilot.visual_x + 6 * math.cos(pilot.visual_angle), 
                 pilot.visual_y + 6 * math.sin(pilot.visual_angle)),
                (pilot.visual_x + 6 * math.cos(pilot.visual_angle + 2.4), 
                 pilot.visual_y + 6 * math.sin(pilot.visual_angle + 2.4)),
                (pilot.visual_x + 6 * math.cos(pilot.visual_angle - 2.4), 
                 pilot.visual_y + 6 * math.sin(pilot.visual_angle - 2.4))
            ]
            
            pygame.draw.polygon(self.game_surface, pilot.color, ship_points)
            pygame.draw.polygon(self.game_surface, self.colors['white'], ship_points, 1)
            
            # Draw reload bar
            time_since_fire = self.game_time - pilot.last_fire_time
            recharge_pct = min(1.0, time_since_fire / pilot.fire_cooldown)
            
            bar_width = 12
            bar_height = 2
            bar_x = pilot.visual_x - bar_width // 2
            bar_y = pilot.visual_y - 10
            
            # Background
            pygame.draw.rect(self.game_surface, self.colors['dark_gray'], 
                           (int(bar_x), int(bar_y), bar_width, bar_height))
            
            # Progress 
            if recharge_pct < 1.0:
                color = self.colors['yellow']
                fill_width = int(bar_width * recharge_pct)
                pygame.draw.rect(self.game_surface, color, 
                               (int(bar_x), int(bar_y), fill_width, bar_height))
            else:
                # Fully charged
                pygame.draw.rect(self.game_surface, self.colors['green'], 
                               (int(bar_x), int(bar_y), bar_width, bar_height))
    
    def _draw_mental_vectors(self) -> None:
        """Draw mental vectors for debugging"""
        for pilot in self.pilots:
            mental_vector = pilot.get_mental_vector()
            
            if mental_vector['target']:
                # Draw line from pilot to target
                target_x = pilot.visual_x + mental_vector['x']
                target_y = pilot.visual_y + mental_vector['y']
                
                # Choose color based on target type
                if mental_vector['type'] == 'threat':
                    vector_color = self.colors['red']
                elif mental_vector['type'] == 'resource':
                    vector_color = self.colors['yellow']
                else:
                    vector_color = self.colors['gray']
                
                # Draw mental vector line
                pygame.draw.line(self.game_surface, vector_color,
                               (int(pilot.visual_x), int(pilot.visual_y)),
                               (int(target_x), int(target_y)), 1)
                
                # Draw target indicator
                pygame.draw.circle(self.game_surface, vector_color,
                                 (int(target_x), int(target_y)), 2)
    
    def _draw_tournament_hud(self) -> None:
        """Draw tournament HUD"""
        y_offset = 2
        
        # Title
        title_text = "AI TOURNAMENT"
        title_surface = self.font.render(title_text, True, self.colors['white'])
        self.game_surface.blit(title_surface, (2, y_offset))
        y_offset += 10
        
        # Pilot scores
        for pilot in self.pilots:
            pilot_text = f"{pilot.pilot_id}: S={pilot.scrap_collected} F={pilot.fitness:.1f}"
            pilot_surface = self.font.render(pilot_text, True, pilot.color)
            self.game_surface.blit(pilot_surface, (2, y_offset))
            y_offset += 8
        
        # Instructions
        instructions = [
            "ESC: Exit",
            "R: Reset",
            "Lines: AI thinking"
        ]
        
        y_offset = SOVEREIGN_HEIGHT - 30
        for instruction in instructions:
            inst_surface = self.font.render(instruction, True, self.colors['green'])
            self.game_surface.blit(inst_surface, (2, y_offset))
            y_offset += 8
    
    def _reset_tournament(self) -> None:
        """Reset tournament"""
        # Reset pilots
        for pilot in self.pilots:
            pilot.visual_x = SOVEREIGN_WIDTH // 2
            pilot.visual_y = SOVEREIGN_HEIGHT // 2
            pilot.visual_angle = 0.0
            pilot.survival_time = 0.0
            pilot.asteroids_destroyed = 0
            pilot.scrap_collected = 0
            pilot.fitness = 0.0
        
        # Reset entities
        self.scrap_entities.clear()
        self.asteroids.clear()
        self._spawn_scrap()
        self._spawn_asteroids()
        
        # Reset time
        self.game_time = 0.0
        
        logger.info("🔄 Tournament reset")
    
    def run(self) -> Result[bool]:
        """Main tournament loop"""
        try:
            clock = pygame.time.Clock()
            
            logger.info("🏆 Starting AI Tournament")
            
            while self.running:
                # Handle events
                self.handle_events()
                
                # Update game state
                self.update_game_state()
                
                # Render
                self.render_game()
                
                # Control frame rate
                clock.tick(60)
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Tournament failed: {e}")
    
    def _draw_explosions(self) -> None:
        """Draw visual effects"""
        for explosion in self.explosions:
            explosion.draw(self.game_surface)

    def cleanup(self) -> None:
        """Clean up resources"""
        pygame.quit()
        logger.info("🧹 Tournament Mode cleanup complete")


def main():
    """Main entry point for Tournament Mode"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🏆 DGT Platform - AI Tournament Mode")
    print("=" * 45)
    print("Live Evolution Spectator")
    print("Single Pilot Mode: Gen 25 (Green)")
    print("Scrap collection prioritized over survival")
    print()
    
    # Create and run tournament
    tournament = TournamentMode()
    
    try:
        result = tournament.run()
        
        if result.success:
            print("🏆 Tournament completed successfully!")
            return 0
        else:
            print(f"❌ Tournament failed: {result.error}")
            return 1
            
    except KeyboardInterrupt:
        print("\n🛑 Tournament interrupted by user")
        return 0
    finally:
        tournament.cleanup()


if __name__ == "__main__":
    exit(main())
