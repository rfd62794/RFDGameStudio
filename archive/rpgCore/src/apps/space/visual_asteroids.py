"""
Visual Asteroids - High-Fidelity Launch
Graphical integration of AsteroidsStrategy with UnifiedPPU and Genetic Sprites
"""

import pygame
import sys
import time
import math
from typing import Dict, List, Any, Optional
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from foundation.system_clock import SystemClock
from engines.body.pipeline.asset_loader import AssetLoader
from apps.space.asteroids_strategy import AsteroidsStrategy
from apps.space.logic.ai_controller import create_ai_controller, create_human_controller
from loguru import logger


class VisualAsteroids:
    """High-fidelity visual asteroids game with AI/Human controllers"""
    
    def __init__(self, ai_mode: bool = False):
        self.ai_mode = ai_mode
        self.running = True
        
        # Initialize PyGame
        pygame.init()
        
        # Create display with 4x scaling for desktop visibility
        scale_factor = 4
        self.screen_width = SOVEREIGN_WIDTH * scale_factor
        self.screen_height = SOVEREIGN_HEIGHT * scale_factor
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption("DGT Platform - Visual Asteroids")
        
        # Create surface for game rendering (160x144)
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Game components
        self.system_clock = SystemClock(target_fps=60.0)
        self.asset_loader = AssetLoader()
        self.asteroids_strategy = AsteroidsStrategy()
        
        # Set controller
        if ai_mode:
            ai_controller = create_ai_controller("AI_PILOT")
            set_result = self.asteroids_strategy.set_controller(ai_controller)
            if set_result.success:
                logger.info("🤖 AI Controller activated")
            else:
                logger.error(f"❌ AI Controller activation failed: {set_result.error}")
        else:
            human_controller = create_human_controller("HUMAN_PLAYER")
            set_result = self.asteroids_strategy.set_controller(human_controller)
            if set_result.success:
                logger.info("👤 Human Controller activated")
            else:
                logger.error(f"❌ Human Controller activation failed: {set_result.error}")
        
        # Game state
        self.game_time = 0.0
        self.dt = 1.0 / 60.0
        
        # Visual assets
        self.ship_sprite = None
        self.asteroid_sprites = {}
        self.font = None
        
        # Colors for rendering
        self.colors = {
            'black': (0, 0, 0),
            'white': (255, 255, 255),
            'gray': (128, 128, 128),
            'green': (0, 255, 0),
            'red': (255, 0, 0),
            'blue': (0, 100, 255),
            'yellow': (255, 255, 0)
        }
        
        logger.info(f"🎮 Visual Asteroids initialized (AI: {ai_mode})")
    
    def load_assets(self) -> Result[bool]:
        """Load visual assets using AssetLoader"""
        try:
            # Load ship sprite (voyager)
            ship_result = self.asset_loader.load_asset(
                Path("archive/legacy_refactor_2026/assets/harvested/voyager_0_0.yaml"),
                'sprite'
            )
            
            if ship_result.success:
                self.ship_sprite = ship_result.value
                logger.info("✅ Ship sprite loaded")
            else:
                # Create fallback ship sprite
                self.ship_sprite = self._create_fallback_ship()
                logger.warning("⚠️ Using fallback ship sprite")
            
            # Load asteroid sprites (building_*.yaml repurposed as debris)
            for i in range(1, 4):  # Load building_1_0.yaml to building_3_0.yaml
                asteroid_path = Path(f"archive/legacy_refactor_2026/assets/harvested/building_{i}_0.yaml")
                asteroid_result = self.asset_loader.load_asset(asteroid_path, 'sprite')
                
                if asteroid_result.success:
                    self.asteroid_sprites[i] = asteroid_result.value
                    logger.info(f"✅ Asteroid sprite {i} loaded")
                else:
                    # Create fallback asteroid sprite
                    self.asteroid_sprites[i] = self._create_fallback_asteroid(i)
                    logger.warning(f"⚠️ Using fallback asteroid sprite {i}")
            
            # Load font for HUD
            try:
                self.font = pygame.font.Font(None, 12)
            except:
                self.font = pygame.font.SysFont('monospace', 10)
                logger.warning("⚠️ Using system font")
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Asset loading failed: {e}")
    
    def _create_fallback_ship(self) -> pygame.Surface:
        """Create fallback ship sprite (triangle)"""
        surface = pygame.Surface((16, 16), pygame.SRCALPHA)
        surface.fill((0, 0, 0, 0))
        
        # Draw triangle ship
        points = [
            (8, 2),   # Top
            (2, 14),  # Bottom left
            (14, 14)  # Bottom right
        ]
        pygame.draw.polygon(surface, self.colors['white'], points)
        pygame.draw.polygon(surface, self.colors['green'], points, 1)
        
        return surface
    
    def _create_fallback_asteroid(self, size: int) -> pygame.Surface:
        """Create fallback asteroid sprite"""
        radius = 8 + size * 4  # Different sizes
        surface = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
        surface.fill((0, 0, 0, 0))
        
        # Draw asteroid circle
        pygame.draw.circle(surface, self.colors['gray'], (radius, radius), radius)
        pygame.draw.circle(surface, self.colors['white'], (radius, radius), radius, 1)
        
        # Add some detail
        for i in range(3):
            detail_x = radius + (radius // 2) * (i - 1)
            detail_y = radius + (radius // 3) * (i % 2 - 0.5)
            pygame.draw.circle(surface, self.colors['black'], (int(detail_x), int(detail_y)), 2)
        
        return surface
    
    def render_game(self) -> None:
        """Render the game to the game surface"""
        # Clear surface
        self.game_surface.fill(self.colors['black'])
        
        # Get game state
        hud_data = self.asteroids_strategy.get_hud_data()
        
        # Draw ship
        try:
            self._draw_ship(hud_data['position'], hud_data.get('angle', 0), hud_data['invulnerable'])
        except Exception as e:
            logger.error(f"Ship drawing failed: {e}")
            # Draw fallback ship
            pygame.draw.circle(self.game_surface, self.colors['white'], 
                             (int(hud_data['position']['x']), int(hud_data['position']['y'])), 5)
        
        # Draw asteroids
        self._draw_asteroids()
        
        # Draw AI targeting vector if in AI mode
        if self.ai_mode:
            self._draw_ai_target_vector(hud_data['position'])
        
        # Draw HUD
        self._draw_hud(hud_data)
        
        # Scale to screen
        scaled_surface = pygame.transform.scale(self.game_surface, (self.screen_width, self.screen_height))
        self.screen.blit(scaled_surface, (0, 0))
        
        pygame.display.flip()
    
    def _draw_ship(self, position: Dict, angle: float, invulnerable: bool) -> None:
        """Draw the ship sprite"""
        if self.ship_sprite:
            # Rotate sprite
            rotated_sprite = pygame.transform.rotate(self.ship_sprite, -angle * 180 / math.pi)
            
            # Center the sprite
            rect = rotated_sprite.get_rect(center=(int(position['x']), int(position['y'])))
            self.game_surface.blit(rotated_sprite, rect)
            
            # Add invulnerability flicker
            if invulnerable and int(self.game_time * 10) % 2 == 0:
                # Create flicker effect
                flicker_surface = pygame.Surface((rect.width, rect.height), pygame.SRCALPHA)
                flicker_surface.fill((255, 255, 255, 50))
                self.game_surface.blit(flicker_surface, rect)
    
    def _draw_asteroids(self) -> None:
        """Draw asteroids"""
        # This would get asteroids from the game state
        # For now, draw some demo asteroids
        demo_asteroids = [
            {'x': 50, 'y': 50, 'size': 1},
            {'x': 120, 'y': 80, 'size': 2},
            {'x': 30, 'y': 100, 'size': 3}
        ]
        
        for asteroid in demo_asteroids:
            sprite = self.asteroid_sprites.get(asteroid['size'])
            if sprite:
                rect = sprite.get_rect(center=(int(asteroid['x']), int(asteroid['y'])))
                self.game_surface.blit(sprite, rect)
    
    def _draw_ai_target_vector(self, ship_pos: Dict) -> None:
        """Draw AI targeting vector"""
        if self.ai_mode:
            # Get AI controller status
            controller_manager = self.asteroids_strategy.controller_manager
            active_controller = controller_manager.get_active_controller()
            
            if active_controller and hasattr(active_controller, 'get_status'):
                ai_status = active_controller.get_status()
                
                if ai_status.get('current_target'):
                    # Draw line to target
                    # For demo, draw to a random asteroid
                    target_x = 50 + int(self.game_time * 10) % 80
                    target_y = 50 + int(self.game_time * 15) % 80
                    
                    pygame.draw.line(
                        self.game_surface,
                        self.colors['yellow'],
                        (int(ship_pos['x']), int(ship_pos['y'])),
                        (target_x, target_y),
                        1
                    )
                    
                    # Draw target indicator
                    pygame.draw.circle(self.game_surface, self.colors['red'], (target_x, target_y), 3, 1)
    
    def _draw_hud(self, hud_data: Dict) -> None:
        """Draw HUD information"""
        if not self.font:
            return
        
        # HUD text
        hud_texts = [
            f"Lives: {hud_data['lives']}",
            f"Score: {hud_data['score']}",
            f"Energy: {int(hud_data['energy'])}%",
            f"Pos: ({int(hud_data['position']['x'])},{int(hud_data['position']['y'])})"
        ]
        
        y_offset = 2
        for text in hud_texts:
            text_surface = self.font.render(text, True, self.colors['white'])
            self.game_surface.blit(text_surface, (2, y_offset))
            y_offset += 12
        
        # AI status if in AI mode
        if self.ai_mode:
            controller_manager = self.asteroids_strategy.controller_manager
            active_controller = controller_manager.get_active_controller()
            
            if active_controller and hasattr(active_controller, 'get_status'):
                ai_status = active_controller.get_status()
                
                ai_texts = [
                    f"AI: {ai_status['state']}",
                    f"Collected: {ai_status['asteroids_collected']}",
                    f"Evaded: {ai_status['threats_evaded']}"
                ]
                
                y_offset = SOVEREIGN_HEIGHT - 30
                for text in ai_texts:
                    text_surface = self.font.render(text, True, self.colors['green'])
                    self.game_surface.blit(text_surface, (2, y_offset))
                    y_offset += 10
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            # Load assets
            asset_result = self.load_assets()
            if not asset_result.success:
                return asset_result
            
            # Game setup
            clock = pygame.time.Clock()
            
            # Create mock world data
            world_data = {
                'asteroids': [
                    {'x': 50, 'y': 50, 'vx': 10, 'vy': 5, 'radius': 15, 'size': 1},
                    {'x': 120, 'y': 80, 'vx': -8, 'vy': 12, 'radius': 10, 'size': 2},
                    {'x': 30, 'y': 100, 'vx': 15, 'vy': -10, 'radius': 20, 'size': 3}
                ]
            }
            
            logger.info("🎮 Starting Visual Asteroids game loop")
            
            while self.running:
                # Handle events
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        self.running = False
                    elif event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_ESCAPE:
                            self.running = False
                        elif event.key == pygame.K_SPACE and not self.ai_mode:
                            # Handle human input
                            pass
                
                # Update game state
                state_result = self.asteroids_strategy.update_game_state(self.dt, world_data)
                if state_result.success:
                    game_state = state_result.value
                    
                    # Update asteroid positions
                    for asteroid in world_data['asteroids']:
                        asteroid['x'] += asteroid['vx'] * self.dt
                        asteroid['y'] += asteroid['vy'] * self.dt
                        
                        # Wrap around screen
                        asteroid['x'] = asteroid['x'] % SOVEREIGN_WIDTH
                        asteroid['y'] = asteroid['y'] % SOVEREIGN_HEIGHT
                    
                    # Check game over
                    if game_state.get('game_over', False):
                        logger.info("💥 Game Over!")
                        self.running = False
                else:
                    logger.error(f"Game state update failed: {state_result.error}")
                
                # Render
                self.render_game()
                
                # Control frame rate
                clock.tick(60)
                self.game_time += self.dt
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Game loop failed: {e}")
    
    def cleanup(self) -> None:
        """Clean up resources"""
        pygame.quit()
        logger.info("🧹 Visual Asteroids cleanup complete")


def main():
    """Main entry point for Visual Asteroids"""
    import argparse
    
    parser = argparse.ArgumentParser(description="DGT Platform Visual Asteroids")
    parser.add_argument("--ai", action="store_true", help="Enable AI controller")
    parser.add_argument("--fps", type=float, default=60.0, help="Target FPS")
    parser.add_argument("--scale", type=int, default=4, help="Display scale factor")
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🎮 DGT Platform - Visual Asteroids")
    print("=" * 40)
    print(f"Mode: {'AI' if args.ai else 'Human'}")
    print(f"FPS: {args.fps}")
    print(f"Scale: {args.scale}x")
    print()
    
    # Create and run game
    game = VisualAsteroids(ai_mode=args.ai)
    
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
