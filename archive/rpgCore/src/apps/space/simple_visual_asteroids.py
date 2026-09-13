"""
Simple Visual Asteroids - High-Fidelity Launch
Simplified visual asteroids game without controller complexity
"""

import pygame
import sys
import math
from typing import Dict, List, Any
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from foundation.system_clock import SystemClock
from loguru import logger


class SimpleVisualAsteroids:
    """Simplified visual asteroids game with direct control"""
    
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
        pygame.display.set_caption("DGT Platform - Simple Visual Asteroids")
        
        # Create surface for game rendering (160x144)
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Game state
        self.ship_x = SOVEREIGN_WIDTH // 2
        self.ship_y = SOVEREIGN_HEIGHT // 2
        self.ship_angle = 0.0
        self.ship_vx = 0.0
        self.ship_vy = 0.0
        self.ship_energy = 100.0
        self.ship_lives = 3
        self.ship_score = 0
        self.invulnerable_time = 0.0
        
        # Bullets
        self.bullets = []
        self.bullet_speed = 300.0
        self.bullet_lifetime = 1.0  # 1 second lifetime
        
        # Asteroids
        self.asteroids = [
            {'x': 50, 'y': 50, 'vx': 10, 'vy': 5, 'radius': 15, 'size': 2, 'color': 'gray', 'health': 3},
            {'x': 120, 'y': 80, 'vx': -8, 'vy': 12, 'radius': 10, 'size': 1, 'color': 'light_gray', 'health': 2},
            {'x': 30, 'y': 100, 'vx': 15, 'vy': -10, 'radius': 20, 'size': 3, 'color': 'dark_gray', 'health': 4}
        ]
        
        # Game time
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
            'yellow': (255, 255, 0)
        }
        
        # Input state
        self.keys_pressed = set()
        
        # Font
        try:
            self.font = pygame.font.Font(None, 10)
        except:
            self.font = pygame.font.SysFont('monospace', 8)
        
        logger.info("🎮 Simple Visual Asteroids initialized")
    
    def handle_events(self) -> None:
        """Handle pygame events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                self.keys_pressed.add(event.key)
                if event.key == pygame.K_ESCAPE:
                    self.running = False
            elif event.type == pygame.KEYUP:
                self.keys_pressed.discard(event.key)
    
    def update_game_state(self) -> None:
        """Update game state based on input"""
        # Handle input
        thrust = 0.0
        rotation = 0.0
        
        if pygame.K_UP in self.keys_pressed or pygame.K_w in self.keys_pressed:
            thrust = 1.0
        if pygame.K_DOWN in self.keys_pressed or pygame.K_s in self.keys_pressed:
            thrust = -0.5  # Reverse thrust
        if pygame.K_LEFT in self.keys_pressed or pygame.K_a in self.keys_pressed:
            rotation = -2.0
        if pygame.K_RIGHT in self.keys_pressed or pygame.K_d in self.keys_pressed:
            rotation = 2.0
        if pygame.K_SPACE in self.keys_pressed:
            self._fire_weapon()
        
        # Apply thrust
        if thrust != 0:
            thrust_magnitude = thrust * 50.0
            thrust_x = thrust_magnitude * math.cos(self.ship_angle)
            thrust_y = thrust_magnitude * math.sin(self.ship_angle)
            
            self.ship_vx += thrust_x * self.dt
            self.ship_vy += thrust_y * self.dt
            
            # Drain energy
            self.ship_energy = max(0, self.ship_energy - abs(thrust) * self.dt * 10)
        
        # Apply rotation
        if rotation != 0:
            self.ship_angle += rotation * self.dt
            self.ship_angle = self.ship_angle % (2 * math.pi)
        
        # Update position
        self.ship_x += self.ship_vx * self.dt
        self.ship_y += self.ship_vy * self.dt
        
        # Toroidal wrap
        self.ship_x = self.ship_x % SOVEREIGN_WIDTH
        self.ship_y = self.ship_y % SOVEREIGN_HEIGHT
        
        # Apply drag
        self.ship_vx *= 0.999
        self.ship_vy *= 0.999
        
        # Update invulnerability
        if self.invulnerable_time > 0:
            self.invulnerable_time -= self.dt
        
        # Update asteroids
        for asteroid in self.asteroids:
            asteroid['x'] += asteroid['vx'] * self.dt
            asteroid['y'] += asteroid['vy'] * self.dt
            
            # Wrap around screen
            asteroid['x'] = asteroid['x'] % SOVEREIGN_WIDTH
            asteroid['y'] = asteroid['y'] % SOVEREIGN_HEIGHT
        
        # Update bullets
        bullets_to_remove = []
        for bullet_idx, bullet in enumerate(self.bullets):
            # Update position
            bullet['x'] += bullet['vx'] * self.dt
            bullet['y'] += bullet['vy'] * self.dt
            
            # Update lifetime
            bullet['lifetime'] -= self.dt
            
            # Remove if expired or out of bounds
            if bullet['lifetime'] <= 0:
                bullets_to_remove.append(bullet_idx)
            elif (bullet['x'] < 0 or bullet['x'] > SOVEREIGN_WIDTH or 
                  bullet['y'] < 0 or bullet['y'] > SOVEREIGN_HEIGHT):
                bullets_to_remove.append(bullet_idx)
        
        # Remove expired bullets
        for bullet_idx in sorted(bullets_to_remove, reverse=True):
            del self.bullets[bullet_idx]
        
        # Check collisions
        self._check_collisions()
        
        # Update game time
        self.game_time += self.dt
    
    def _fire_weapon(self) -> None:
        """Fire weapon and create bullet"""
        if self.ship_energy >= 5:
            self.ship_energy -= 5
            
            # Create bullet at ship position
            bullet = {
                'x': self.ship_x + 10 * math.cos(self.ship_angle),
                'y': self.ship_y + 10 * math.sin(self.ship_angle),
                'vx': self.bullet_speed * math.cos(self.ship_angle),
                'vy': self.bullet_speed * math.sin(self.ship_angle),
                'lifetime': self.bullet_lifetime,
                'radius': 2
            }
            self.bullets.append(bullet)
            
            logger.info(f"🔫 Weapon fired! Total bullets: {len(self.bullets)}")
    
    def _check_collisions(self) -> None:
        """Check for collisions with asteroids and bullets"""
        if self.invulnerable_time > 0:
            return
        
        # Check ship-asteroid collisions
        for asteroid in self.asteroids:
            distance = math.sqrt((self.ship_x - asteroid['x'])**2 + (self.ship_y - asteroid['y'])**2)
            collision_distance = 5.0 + asteroid['radius']
            
            if distance < collision_distance:
                # Ship hit!
                self.ship_lives -= 1
                self.invulnerable_time = 3.0  # 3 seconds of invulnerability
                
                if self.ship_lives <= 0:
                    logger.info("💥 Game Over!")
                    self.running = False
                
                break
        
        # Check bullet-asteroid collisions
        bullets_to_remove = []
        asteroids_to_remove = []
        
        for bullet_idx, bullet in enumerate(self.bullets):
            bullet_hit = False
            
            for asteroid_idx, asteroid in enumerate(self.asteroids):
                distance = math.sqrt((bullet['x'] - asteroid['x'])**2 + (bullet['y'] - asteroid['y'])**2)
                collision_distance = bullet['radius'] + asteroid['radius']
                
                if distance < collision_distance:
                    # Bullet hit asteroid!
                    bullet_hit = True
                    bullets_to_remove.append(bullet_idx)
                    
                    # Damage asteroid
                    asteroid['health'] -= 1
                    
                    if asteroid['health'] <= 0:
                        # Asteroid destroyed
                        asteroids_to_remove.append(asteroid_idx)
                        self.ship_score += asteroid['size'] * 10
                        logger.info(f"💥 Asteroid destroyed! Score: {self.ship_score}")
                        
                        # Create smaller asteroids if large enough
                        if asteroid['size'] > 1:
                            self._split_asteroid(asteroid)
                    
                    break
            
            if bullet_hit:
                break
        
        # Remove hit bullets
        for bullet_idx in sorted(bullets_to_remove, reverse=True):
            del self.bullets[bullet_idx]
        
        # Remove destroyed asteroids
        for asteroid_idx in sorted(asteroids_to_remove, reverse=True):
            del self.asteroids[aster_idx]
    
    def _split_asteroid(self, asteroid: Dict) -> None:
        """Split asteroid into smaller pieces"""
        if asteroid['size'] <= 1:
            return
        
        # Create 2 smaller asteroids
        for i in range(2):
            # Random velocity change
            angle = math.atan2(asteroid['vy'], asteroid['vx']) + (i - 0.5) * math.pi / 2
            speed = math.sqrt(asteroid['vx']**2 + asteroid['vy']**2) * 1.2
            
            new_asteroid = {
                'x': asteroid['x'],
                'y': asteroid['y'],
                'vx': speed * math.cos(angle),
                'vy': speed * math.sin(angle),
                'radius': asteroid['radius'] * 0.7,
                'size': asteroid['size'] - 1,
                'color': asteroid['color'],
                'health': asteroid['size'] - 1
            }
            self.asteroids.append(new_asteroid)
    
    def render_game(self) -> None:
        """Render the game"""
        # Clear surface
        self.game_surface.fill(self.colors['black'])
        
        # Draw ship
        self._draw_ship()
        
        # Draw asteroids
        self._draw_asteroids()
        
        # Draw bullets
        self._draw_bullets()
        
        # Draw HUD
        self._draw_hud()
        
        # Scale to screen
        scaled_surface = pygame.transform.scale(self.game_surface, (self.screen_width, self.screen_height))
        self.screen.blit(scaled_surface, (0, 0))
        
        pygame.display.flip()
    
    def _draw_ship(self) -> None:
        """Draw the ship"""
        # Draw triangle ship
        ship_points = [
            (self.ship_x + 8 * math.cos(self.ship_angle), 
             self.ship_y + 8 * math.sin(self.ship_angle)),
            (self.ship_x + 8 * math.cos(self.ship_angle + 2.4), 
             self.ship_y + 8 * math.sin(self.ship_angle + 2.4)),
            (self.ship_x + 8 * math.cos(self.ship_angle - 2.4), 
             self.ship_y + 8 * math.sin(self.ship_angle - 2.4))
        ]
        
        # Flicker if invulnerable
        if self.invulnerable_time <= 0 or int(self.game_time * 10) % 2 == 0:
            pygame.draw.polygon(self.game_surface, self.colors['white'], ship_points)
            pygame.draw.polygon(self.game_surface, self.colors['green'], ship_points, 1)
    
    def _draw_asteroids(self) -> None:
        """Draw asteroids"""
        for asteroid in self.asteroids:
            color = self.colors[asteroid['color']]
            
            # Draw asteroid circle
            pygame.draw.circle(self.game_surface, color, 
                             (int(asteroid['x']), int(asteroid['y'])), 
                             int(asteroid['radius']))
            
            # Draw outline
            pygame.draw.circle(self.game_surface, self.colors['white'], 
                             (int(asteroid['x']), int(asteroid['y'])), 
                             int(asteroid['radius']), 1)
            
            # Draw health indicator
            if asteroid['health'] > 1:
                health_color = self.colors['green'] if asteroid['health'] > 2 else self.colors['yellow']
                pygame.draw.circle(self.game_surface, health_color,
                                 (int(asteroid['x']), int(asteroid['y'])), 
                                 int(asteroid['radius']) // 2)
    
    def _draw_bullets(self) -> None:
        """Draw bullets"""
        for bullet in self.bullets:
            # Draw bullet as small circle
            pygame.draw.circle(self.game_surface, self.colors['yellow'],
                             (int(bullet['x']), int(bullet['y'])), 
                             bullet['radius'])
            
            # Add glow effect
            pygame.draw.circle(self.game_surface, self.colors['white'],
                             (int(bullet['x']), int(bullet['y'])), 
                             bullet['radius'] + 1, 1)
    
    def _draw_hud(self) -> None:
        """Draw HUD information"""
        hud_texts = [
            f"Lives: {self.ship_lives}",
            f"Score: {self.ship_score}",
            f"Energy: {int(self.ship_energy)}%",
            f"Bullets: {len(self.bullets)}",
            f"Pos: ({int(self.ship_x)},{int(self.ship_y)})"
        ]
        
        y_offset = 2
        for text in hud_texts:
            text_surface = self.font.render(text, True, self.colors['white'])
            self.game_surface.blit(text_surface, (2, y_offset))
            y_offset += 10
        
        # Instructions
        if self.game_time < 5.0:
            instructions = [
                "WASD/Arrows: Move",
                "Space: Fire",
                "ESC: Exit"
            ]
            y_offset = SOVEREIGN_HEIGHT - 30
            for text in instructions:
                text_surface = self.font.render(text, True, self.colors['green'])
                self.game_surface.blit(text_surface, (2, y_offset))
                y_offset += 8
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            clock = pygame.time.Clock()
            
            logger.info("🎮 Starting Simple Visual Asteroids game loop")
            
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
            return Result(success=False, error=f"Game loop failed: {e}")
    
    def cleanup(self) -> None:
        """Clean up resources"""
        pygame.quit()
        logger.info("🧹 Simple Visual Asteroids cleanup complete")


def main():
    """Main entry point for Simple Visual Asteroids"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🎮 DGT Platform - Simple Visual Asteroids")
    print("=" * 45)
    print("Direct control visual demo")
    print()
    
    # Create and run game
    game = SimpleVisualAsteroids()
    
    try:
        result = game.run()
        
        if result.success:
            print("🏆 Game completed successfully!")
            return 0
        else:
            print(f"❌ Game failed: {result.error}")
            return 1
            
    except KeyboardInterrupt:
        print("\n🛑 Game interrupted by user")
        return 0
    finally:
        game.cleanup()


if __name__ == "__main__":
    exit(main())
