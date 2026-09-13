"""
Arcade Visual Asteroids - Final Polish
Arcade-scale entities with precision collision and visual effects
"""

import pygame
import sys
import random
import math
from typing import Dict, List, Any
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from dgt_engine.foundation.system_clock import SystemClock
from loguru import logger


class ArcadeVisualAsteroids:
    """Arcade-polished asteroids game with precision collision and visual effects"""
    
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
        pygame.display.set_caption("DGT Platform - Arcade Asteroids")
        
        # Create surface for game rendering (160x144)
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Game state with arcade-scale sizing
        self.ship_x = SOVEREIGN_WIDTH // 2
        self.ship_y = SOVEREIGN_HEIGHT // 2
        self.ship_angle = 0.0
        self.ship_vx = 0.0
        self.ship_vy = 0.0
        self.ship_energy = 100.0
        self.ship_lives = 3
        self.ship_score = 0
        self.invulnerable_time = 0.0
        self.ship_radius = 3.0  # Tight hit-box for high-stakes navigation
        
        # Bullets with precision tracking
        self.bullets = []
        self.bullet_speed = 300.0
        self.bullet_lifetime = 1.0
        self.bullet_radius = 2.0
        
        # Asteroids with arcade-scale sizing
        self.asteroids = []
        self._spawn_initial_asteroids()
        
        # Visual effects
        self.pop_effects = []  # 3-frame pop effects
        
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
            'yellow': (255, 255, 0),
            'orange': (255, 165, 0)
        }
        
        # Input state
        self.keys_pressed = set()
        
        # Font
        try:
            self.font = pygame.font.Font(None, 10)
        except:
            self.font = pygame.font.SysFont('monospace', 8)
        
        logger.info("🎮 Arcade Visual Asteroids initialized")
    
    def _spawn_initial_asteroids(self) -> None:
        """Spawn initial asteroids with arcade-scale sizing"""
        asteroid_configs = [
            {'x': 50, 'y': 50, 'vx': 30, 'vy': 20, 'size': 3, 'radius': 8.0, 'health': 3, 'color': 'dark_gray'},
            {'x': 120, 'y': 80, 'vx': -25, 'vy': 35, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'gray'},
            {'x': 30, 'y': 100, 'vx': 40, 'vy': -30, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'light_gray'}
        ]
        
        for config in asteroid_configs:
            # Ensure safe spawn distance from ship
            while True:
                dist_from_ship = math.sqrt((config['x'] - self.ship_x)**2 + (config['y'] - self.ship_y)**2)
                if dist_from_ship > 30.0:  # 30px safety zone
                    break
                # Move to random safe position
                config['x'] = random.uniform(20, SOVEREIGN_WIDTH - 20)
                config['y'] = random.uniform(20, SOVEREIGN_HEIGHT - 20)
            
            self.asteroids.append(config.copy())
    
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
        """Update game state with precision collision"""
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
        
        # Update bullets with precision tracking
        bullets_to_remove = []
        for bullet_idx, bullet in enumerate(self.bullets):
            # Store previous position for sweep test
            prev_x = bullet['x']
            prev_y = bullet['y']
            
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
            else:
                # Store previous position for collision detection
                bullet['prev_x'] = prev_x
                bullet['prev_y'] = prev_y
        
        # Remove expired bullets
        for bullet_idx in sorted(bullets_to_remove, reverse=True):
            del self.bullets[bullet_idx]
        
        # Update visual effects
        effects_to_remove = []
        for effect_idx, effect in enumerate(self.pop_effects):
            effect['frame'] += 1
            if effect['frame'] >= 3:  # 3-frame effect
                effects_to_remove.append(effect_idx)
        
        for effect_idx in sorted(effects_to_remove, reverse=True):
            del self.pop_effects[effect_idx]
        
        # Check collisions with precision sweep
        self._check_precision_collisions()
        
        # Update game time
        self.game_time += self.dt
    
    def _fire_weapon(self) -> None:
        """Fire weapon with precision bullet creation"""
        if self.ship_energy >= 5:
            self.ship_energy -= 5
            
            # Create bullet at ship position with previous position tracking
            bullet = {
                'x': self.ship_x + 10 * math.cos(self.ship_angle),
                'y': self.ship_y + 10 * math.sin(self.ship_angle),
                'prev_x': self.ship_x + 10 * math.cos(self.ship_angle),
                'prev_y': self.ship_y + 10 * math.sin(self.ship_angle),
                'vx': self.bullet_speed * math.cos(self.ship_angle),
                'vy': self.bullet_speed * math.sin(self.ship_angle),
                'lifetime': self.bullet_lifetime,
                'radius': self.bullet_radius
            }
            self.bullets.append(bullet)
            
            logger.info(f"🔫 Weapon fired! Total bullets: {len(self.bullets)}")
    
    def _check_precision_collisions(self) -> None:
        """Check collisions with sweep test for bullets"""
        if self.invulnerable_time > 0:
            return
        
        # Check ship-asteroid collisions
        for asteroid in self.asteroids:
            distance = math.sqrt((self.ship_x - asteroid['x'])**2 + (self.ship_y - asteroid['y'])**2)
            collision_distance = self.ship_radius + asteroid['radius']
            
            if distance < collision_distance:
                # Ship hit!
                self.ship_lives -= 1
                self.invulnerable_time = 3.0  # 3 seconds of invulnerability
                
                if self.ship_lives <= 0:
                    logger.info("💥 Game Over!")
                    self.running = False
                
                break
        
        # Check bullet-asteroid collisions with sweep test
        bullets_to_remove = []
        asteroids_to_remove = []
        
        for bullet_idx, bullet in enumerate(self.bullets):
            bullet_hit = False
            
            for asteroid_idx, asteroid in enumerate(self.asteroids):
                # Sweep test for bullet-asteroid collision
                if self._sweep_collision_test(bullet, asteroid):
                    bullet_hit = True
                    bullets_to_remove.append(bullet_idx)
                    
                    # Damage asteroid
                    asteroid['health'] -= 1
                    
                    if asteroid['health'] <= 0:
                        # Asteroid destroyed
                        asteroids_to_remove.append(asteroid_idx)
                        self.ship_score += asteroid['size'] * 10
                        
                        # Add pop effect
                        self.pop_effects.append({
                            'x': asteroid['x'],
                            'y': asteroid['y'],
                            'radius': asteroid['radius'],
                            'frame': 0
                        })
                        
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
            del self.asteroids[asteroid_idx]
    
    def _sweep_collision_test(self, bullet: Dict, asteroid: Dict) -> bool:
        """Continuous collision detection for bullets"""
        # Line segment from previous to current position
        x1, y1 = bullet['prev_x'], bullet['prev_y']
        x2, y2 = bullet['x'], bullet['y']
        
        # Check if line segment intersects asteroid circle
        return self._line_circle_intersection(
            x1, y1, x2, y2,
            asteroid['x'], asteroid['y'],
            asteroid['radius'] + bullet['radius']
        )
    
    def _line_circle_intersection(self, x1: float, y1: float, x2: float, y2: float,
                                cx: float, cy: float, radius: float) -> bool:
        """Check if line segment intersects circle"""
        # Vector from line start to circle center
        dx = cx - x1
        dy = cy - y1
        
        # Line direction vector
        lx = x2 - x1
        ly = y2 - y1
        
        # Line length squared
        line_length_sq = lx * lx + ly * ly
        
        if line_length_sq == 0:
            # Line is a point
            distance_sq = dx * dx + dy * dy
            return distance_sq <= radius * radius
        
        # Project circle center onto line
        t = max(0, min(1, (dx * lx + dy * ly) / line_length_sq))
        
        # Closest point on line segment to circle center
        closest_x = x1 + t * lx
        closest_y = y1 + t * ly
        
        # Distance from closest point to circle center
        dist_x = cx - closest_x
        dist_y = cy - closest_y
        distance_sq = dist_x * dist_x + dist_y * dist_y
        
        return distance_sq <= radius * radius
    
    def _split_asteroid(self, asteroid: Dict) -> None:
        """Split asteroid into smaller pieces with arcade-scale sizing"""
        for i in range(2):
            # Random velocity change
            angle = math.atan2(asteroid['vy'], asteroid['vx']) + (i - 0.5) * math.pi / 2
            speed = math.sqrt(asteroid['vx']**2 + asteroid['vy']**2) * 1.2
            
            new_size = asteroid['size'] - 1
            new_radius = self._get_asteroid_radius(new_size)
            
            new_asteroid = {
                'x': asteroid['x'],
                'y': asteroid['y'],
                'vx': speed * math.cos(angle),
                'vy': speed * math.sin(angle),
                'size': new_size,
                'radius': new_radius,
                'health': new_size,
                'color': asteroid['color']
            }
            self.asteroids.append(new_asteroid)
    
    def _get_asteroid_radius(self, size: int) -> float:
        """Get arcade-scale asteroid radius"""
        radius_map = {
            3: 8.0,  # Large
            2: 4.0,  # Medium  
            1: 2.0   # Small
        }
        return radius_map.get(size, 4.0)
    
    def render_game(self) -> None:
        """Render the game with arcade polish"""
        # Clear surface
        self.game_surface.fill(self.colors['black'])
        
        # Draw ship
        self._draw_ship()
        
        # Draw asteroids
        self._draw_asteroids()
        
        # Draw bullets
        self._draw_bullets()
        
        # Draw visual effects
        self._draw_effects()
        
        # Draw HUD
        self._draw_hud()
        
        # Scale to screen
        scaled_surface = pygame.transform.scale(self.game_surface, (self.screen_width, self.screen_height))
        self.screen.blit(scaled_surface, (0, 0))
        
        pygame.display.flip()
    
    def _draw_ship(self) -> None:
        """Draw the ship with tight hit-box"""
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
        
        # Draw hit-box for debugging (optional)
        # pygame.draw.circle(self.game_surface, self.colors['red'], 
        #                  (int(self.ship_x), int(self.ship_y)), 
        #                  int(self.ship_radius), 1)
    
    def _draw_asteroids(self) -> None:
        """Draw asteroids with arcade-scale sizing"""
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
                                 max(1, int(asteroid['radius']) // 2))
    
    def _draw_bullets(self) -> None:
        """Draw bullets with precision"""
        for bullet in self.bullets:
            # Draw bullet as small circle
            pygame.draw.circle(self.game_surface, self.colors['yellow'],
                             (int(bullet['x']), int(bullet['y'])), 
                             int(bullet['radius']))
            
            # Add glow effect
            pygame.draw.circle(self.game_surface, self.colors['white'],
                             (int(bullet['x']), int(bullet['y'])), 
                             int(bullet['radius']) + 1, 1)
    
    def _draw_effects(self) -> None:
        """Draw visual effects"""
        for effect in self.pop_effects:
            # 3-frame pop effect
            frame = effect['frame']
            if frame == 0:
                # Expand ring
                pygame.draw.circle(self.game_surface, self.colors['orange'],
                                 (int(effect['x']), int(effect['y'])), 
                                 int(effect['radius']), 2)
            elif frame == 1:
                # Medium ring
                pygame.draw.circle(self.game_surface, self.colors['yellow'],
                                 (int(effect['x']), int(effect['y'])), 
                                 int(effect['radius'] * 1.5), 1)
            elif frame == 2:
                # Small ring
                pygame.draw.circle(self.game_surface, self.colors['white'],
                                 (int(effect['x']), int(effect['y'])), 
                                 int(effect['radius'] * 2), 1)
    
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
                "ESC: Exit",
                "Arcade Polish!"
            ]
            y_offset = SOVEREIGN_HEIGHT - 40
            for text in instructions:
                text_surface = self.font.render(text, True, self.colors['green'])
                self.game_surface.blit(text_surface, (2, y_offset))
                y_offset += 8
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            clock = pygame.time.Clock()
            
            logger.info("🎮 Starting Arcade Visual Asteroids game loop")
            
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
        logger.info("🧹 Arcade Visual Asteroids cleanup complete")


def main():
    """Main entry point for Arcade Visual Asteroids"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🎮 DGT Platform - Arcade Visual Asteroids")
    print("=" * 50)
    print("Arcade-scale entities with precision collision")
    print("Ship: 3px hit-box | Asteroids: 8px/4px/2px")
    print("Sweep collision for bullets | Visual pop effects")
    print()
    
    # Create and run game
    game = ArcadeVisualAsteroids()
    
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
