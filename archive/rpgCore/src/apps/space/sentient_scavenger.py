"""
Sentient Scavenger - Active Learning AI with Penalty Awareness
Demonstrates real-time adaptation and "sting" response learning
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

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, DEBUG_INFINITE_ENERGY
from engines.mind.neat.neat_engine import NeuralNetwork
from apps.space.logic.ai_controller import create_ai_controller
from apps.space.arcade_visual_asteroids import ArcadeVisualAsteroids


class SentientPilot:
    """AI pilot with active learning and penalty awareness"""
    
    def __init__(self, pilot_id: str, color: Tuple[int, int, int], 
                 network_file: Optional[str] = None):
        self.pilot_id = pilot_id
        self.color = color
        
        # Create AI controller with active learning
        neural_network = None
        if network_file and Path(network_file).exists():
            neural_network = self._load_network(network_file)
        
        self.controller = create_ai_controller(
            controller_id=pilot_id,
            use_neural_network=(neural_network is not None),
            neural_network=neural_network
        )
        
        # Visual position
        self.visual_x = SOVEREIGN_WIDTH // 2
        self.visual_y = SOVEREIGN_HEIGHT // 2
        self.visual_angle = 0.0
        
        # Performance metrics
        self.survival_time = 0.0
        self.asteroids_destroyed = 0
        self.scrap_collected = 0
        self.collisions = 0
        self.fitness = 0.0
        
        # Learning metrics
        self.safe_buffer_distance = 25.0  # Initial safe distance
        self.learning_progress = 0.0
        
        # Visual state
        self.is_blackout = False
        self.blackout_alpha = 255
        
        logger.info(f"🧠 Sentient pilot {pilot_id} initialized with active learning")
    
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
    
    def update(self, dt: float, asteroids: List[Dict], scrap_entities: List[Dict]) -> None:
        """Update sentient pilot with learning"""
        # Create mock entity state
        entity_state = {
            'x': self.visual_x,
            'y': self.visual_y,
            'vx': 0.0,
            'vy': 0.0,
            'angle': self.visual_angle,
            'energy': 100.0
        }
        
        # Create world data
        world_data = {
            'asteroids': asteroids,
            'scrap': scrap_entities
        }
        
        # Update controller
        control_result = self.controller.update(dt, entity_state, world_data)
        
        if control_result.success:
            controls = control_result.value
            
            # Apply controls if not in blackout
            if not self.controller.is_blackout:
                # Update visual position based on controls
                if controls.thrust != 0:
                    thrust_magnitude = controls.thrust * 50.0
                    self.visual_x += thrust_magnitude * math.cos(self.visual_angle) * dt
                    self.visual_y += thrust_magnitude * math.sin(self.visual_angle) * dt
                
                if controls.rotation != 0:
                    self.visual_angle += controls.rotation * 3.0 * dt
                    self.visual_angle = self.visual_angle % (2 * math.pi)
                
                # Wrap position
                self.visual_x = self.visual_x % SOVEREIGN_WIDTH
                self.visual_y = self.visual_y % SOVEREIGN_HEIGHT
            
            # Update blackout state
            self.is_blackout = self.controller.is_blackout
            if self.is_blackout:
                self.blackout_alpha = 128  # 50% transparency
            else:
                self.blackout_alpha = 255
        
        # Update metrics
        self.survival_time += dt
        
        # Update learning progress
        self._update_learning_progress()
    
    def _update_learning_progress(self) -> None:
        """Update learning progress based on memory"""
        if hasattr(self.controller, 'get_memory_summary'):
            memory_summary = self.controller.get_memory_summary()
            
            # Calculate safe buffer distance based on learning
            if memory_summary['near_misses_count'] > 0:
                # Increase safe distance based on near misses
                self.safe_buffer_distance = 25.0 + (memory_summary['near_misses_count'] * 2.0)
                self.safe_buffer_distance = min(self.safe_buffer_distance, 50.0)  # Cap at 50px
            
            # Calculate learning progress
            if self.survival_time > 0:
                collision_rate = self.collisions / self.survival_time
                self.learning_progress = max(0.0, 1.0 - collision_rate)
    
    def check_collisions(self, asteroids: List[Dict]) -> bool:
        """Check for collisions and trigger learning"""
        collision_occurred = False
        
        for asteroid in asteroids:
            distance = math.sqrt((self.visual_x - asteroid['x'])**2 + 
                               (self.visual_y - asteroid['y'])**2)
            collision_distance = 3.0 + asteroid['radius']  # Ship radius + asteroid radius
            
            if distance < collision_distance:
                # Collision detected
                collision_occurred = True
                self.collisions += 1
                
                # Trigger blackout and learning
                self.controller.trigger_blackout(duration=2.0)
                
                # Apply fitness penalty
                self.fitness -= 50.0  # Heavy penalty for collision
                
                logger.info(f"💥 {self.pilot_id} collision! Safe buffer: {self.safe_buffer_distance:.1f}px")
                break
        
        return collision_occurred
    
    def check_scrap_collection(self, scrap_entities: List[Dict]) -> None:
        """Check for scrap collection"""
        scrap_to_remove = []
        
        for scrap_idx, scrap in enumerate(scrap_entities):
            distance = math.sqrt((self.visual_x - scrap['x'])**2 + 
                               (self.visual_y - scrap['y'])**2)
            if distance < scrap['radius'] + 3:  # Ship radius
                scrap_to_remove.append(scrap_idx)
                self.scrap_collected += scrap['value']
                self.fitness += scrap['value'] * 25  # Scrap bonus
        
        # Remove collected scrap
        for scrap_idx in sorted(scrap_to_remove, reverse=True):
            del scrap_entities[scrap_idx]
    
    def get_stress_level(self) -> float:
        """Get current stress level"""
        if hasattr(self.controller, 'get_stress_level'):
            return self.controller.get_stress_level()
        return 0.0
    
    def get_memory_summary(self) -> Dict[str, Any]:
        """Get memory summary for debugging"""
        if hasattr(self.controller, 'get_memory_summary'):
            return self.controller.get_memory_summary()
        return {}
    
    def update_fitness(self) -> None:
        """Update pilot fitness with learning bonuses"""
        # Base fitness
        base_fitness = self.survival_time + (self.asteroids_destroyed * 10) + (self.scrap_collected * 25)
        
        # Learning bonus
        learning_bonus = self.learning_progress * 100.0
        
        self.fitness = base_fitness + learning_bonus


class SentientScavenger:
    """Main game demonstrating active learning AI"""
    
    def __init__(self):
        self.running = True
        
        # Initialize PyGame
        pygame.init()
        
        # Create display with 4x scaling
        scale_factor = 4
        self.screen_width = SOVEREIGN_WIDTH * scale_factor
        self.screen_height = SOVEREIGN_HEIGHT * scale_factor
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption("DGT Platform - Sentient Scavenger")
        
        # Create surface for game rendering
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Create sentient pilot
        self.pilot = SentientPilot("SENTIENT_PILOT", (100, 200, 255), "best_pilot_network.json")
        
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
        
        # Font
        try:
            self.font = pygame.font.Font(None, 8)
        except:
            self.font = pygame.font.SysFont('monospace', 6)
        
        # Game entities
        self.asteroids = []
        self.scrap_entities = []
        
        # Environmental noise
        self.noise_factor = 0.1
        
        # Learning metrics
        self.collision_count = 0
        self.learning_events = []
        
        # Spawn entities after initialization
        self._spawn_entities()
        
        logger.info("🧠 Sentient Scavenger initialized")
    
    def _spawn_entities(self) -> None:
        """Spawn asteroids and scrap"""
        # Spawn asteroids
        base_asteroids = [
            {'x': 50, 'y': 50, 'vx': 25, 'vy': 15, 'size': 3, 'radius': 8.0, 'health': 3, 'color': 'dark_gray'},
            {'x': 120, 'y': 80, 'vx': -20, 'vy': 30, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'gray'},
            {'x': 30, 'y': 100, 'vx': 35, 'vy': -25, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'light_gray'},
            {'x': 90, 'y': 40, 'vx': -30, 'vy': 20, 'size': 1, 'radius': 2.0, 'health': 1, 'color': 'white'},
        ]
        
        for asteroid in base_asteroids:
            # Apply environmental noise
            noisy_asteroid = asteroid.copy()
            noisy_asteroid['vx'] *= (1.0 + random.uniform(-self.noise_factor, self.noise_factor))
            noisy_asteroid['vy'] *= (1.0 + random.uniform(-self.noise_factor, self.noise_factor))
            self.asteroids.append(noisy_asteroid)
        
        # Spawn scrap
        scrap_configs = [
            {'x': 80, 'y': 40, 'value': 5, 'radius': 3},
            {'x': 40, 'y': 100, 'value': 10, 'radius': 4},
            {'x': 120, 'y': 80, 'value': 15, 'radius': 5},
            {'x': 60, 'y': 60, 'value': 8, 'radius': 3},
            {'x': 100, 'y': 120, 'value': 12, 'radius': 4},
        ]
        
        for config in scrap_configs:
            self.scrap_entities.append(config.copy())
    
    def handle_events(self) -> None:
        """Handle pygame events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                elif event.key == pygame.K_r:
                    # Reset learning
                    self._reset_learning()
                elif event.key == pygame.K_SPACE:
                    # Force collision for testing
                    self.pilot.collisions += 1
                    self.pilot.controller.trigger_blackout(2.0)
    
    def update_game_state(self) -> None:
        """Update game state"""
        self.game_time += self.dt
        
        # Update asteroids
        for asteroid in self.asteroids:
            asteroid['x'] += asteroid['vx'] * self.dt
            asteroid['y'] += asteroid['vy'] * self.dt
            
            # Wrap around screen
            asteroid['x'] = asteroid['x'] % SOVEREIGN_WIDTH
            asteroid['y'] = asteroid['y'] % SOVEREIGN_HEIGHT
        
        # Update pilot
        self.pilot.update(self.dt, self.asteroids, self.scrap_entities)
        
        # Check collisions
        collision_occurred = self.pilot.check_collisions(self.asteroids)
        if collision_occurred:
            self.collision_count += 1
            self.learning_events.append({
                'time': self.game_time,
                'type': 'collision',
                'safe_buffer': self.pilot.safe_buffer_distance
            })
        
        # Check scrap collection
        self.pilot.check_scrap_collection(self.scrap_entities)
        
        # Update fitness
        self.pilot.update_fitness()
        
        # Respawn entities if needed
        if len(self.asteroids) < 2:
            self._spawn_entities()
    
    def render_game(self) -> None:
        """Render the game"""
        # Clear surface
        self.game_surface.fill(self.colors['black'])
        
        # Draw safe buffer
        self._draw_safe_buffer()
        
        # Draw scrap
        self._draw_scrap()
        
        # Draw asteroids
        self._draw_asteroids()
        
        # Draw pilot
        self._draw_pilot()
        
        # Draw stress HUD
        self._draw_stress_hud()
        
        # Scale to screen
        scaled_surface = pygame.transform.scale(self.game_surface, (self.screen_width, self.screen_height))
        self.screen.blit(scaled_surface, (0, 0))
        
        pygame.display.flip()
    
    def _draw_safe_buffer(self) -> None:
        """Draw pilot's safe buffer zone"""
        # Draw circle representing safe buffer distance
        buffer_color = (*self.pilot.color, 50)  # Transparent version of pilot color
        
        # Create surface for transparent circle
        buffer_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.circle(buffer_surface, buffer_color,
                         (int(self.pilot.visual_x), int(self.pilot.visual_y)),
                         int(self.pilot.safe_buffer_distance), 1)
        
        self.game_surface.blit(buffer_surface, (0, 0))
    
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
    
    def _draw_pilot(self) -> None:
        """Draw sentient pilot"""
        # Apply blackout alpha if needed
        pilot_color = self.pilot.color
        if self.pilot.is_blackout:
            pilot_color = tuple(c // 2 for c in pilot_color)  # Darken during blackout
        
        # Draw triangle ship
        ship_points = [
            (self.pilot.visual_x + 6 * math.cos(self.pilot.visual_angle), 
             self.pilot.visual_y + 6 * math.sin(self.pilot.visual_angle)),
            (self.pilot.visual_x + 6 * math.cos(self.pilot.visual_angle + 2.4), 
             self.pilot.visual_y + 6 * math.sin(self.pilot.visual_angle + 2.4)),
            (self.pilot.visual_x + 6 * math.cos(self.pilot.visual_angle - 2.4), 
             self.pilot.visual_y + 6 * math.sin(self.pilot.visual_angle - 2.4))
        ]
        
        pygame.draw.polygon(self.game_surface, pilot_color, ship_points)
        pygame.draw.polygon(self.game_surface, self.colors['white'], ship_points, 1)
        
        # Draw blackout indicator
        if self.pilot.is_blackout:
            pygame.draw.circle(self.game_surface, self.colors['red'],
                             (int(self.pilot.visual_x), int(self.pilot.visual_y)), 
                             10, 2)
    
    def _draw_stress_hud(self) -> None:
        """Draw stress and learning HUD"""
        y_offset = 2
        
        # Title
        title_text = "SENTIENT SCAVENGER"
        title_surface = self.font.render(title_text, True, self.colors['white'])
        self.game_surface.blit(title_surface, (2, y_offset))
        y_offset += 10
        
        # Stress meter
        stress_level = self.pilot.get_stress_level()
        stress_text = f"Stress: {stress_level:.2f}"
        stress_color = self.colors['green'] if stress_level < 0.5 else self.colors['yellow'] if stress_level < 0.8 else self.colors['red']
        stress_surface = self.font.render(stress_text, True, stress_color)
        self.game_surface.blit(stress_surface, (2, y_offset))
        y_offset += 8
        
        # Learning progress
        learning_text = f"Learning: {self.pilot.learning_progress:.2f}"
        learning_surface = self.font.render(learning_text, True, self.colors['cyan'])
        self.game_surface.blit(learning_surface, (2, y_offset))
        y_offset += 8
        
        # Safe buffer
        buffer_text = f"Buffer: {self.pilot.safe_buffer_distance:.1f}px"
        buffer_surface = self.font.render(buffer_text, True, self.colors['purple'])
        self.game_surface.blit(buffer_surface, (2, y_offset))
        y_offset += 8
        
        # Collisions
        collision_text = f"Collisions: {self.pilot.collisions}"
        collision_surface = self.font.render(collision_text, True, self.colors['red'])
        self.game_surface.blit(collision_surface, (2, y_offset))
        y_offset += 8
        
        # Fitness
        fitness_text = f"Fitness: {self.pilot.fitness:.1f}"
        fitness_surface = self.font.render(fitness_text, True, self.colors['white'])
        self.game_surface.blit(fitness_surface, (2, y_offset))
        y_offset += 8
        
        # Memory summary
        memory_summary = self.pilot.get_memory_summary()
        if memory_summary:
            memory_text = f"Near Misses: {memory_summary['near_misses_count']}"
            memory_surface = self.font.render(memory_text, True, self.colors['yellow'])
            self.game_surface.blit(memory_surface, (2, y_offset))
            y_offset += 8
        
        # Instructions
        instructions = [
            "ESC: Exit",
            "R: Reset Learning",
            "SPACE: Test Blackout"
        ]
        
        y_offset = SOVEREIGN_HEIGHT - 30
        for instruction in instructions:
            inst_surface = self.font.render(instruction, True, self.colors['green'])
            self.game_surface.blit(inst_surface, (2, y_offset))
            y_offset += 8
    
    def _reset_learning(self) -> None:
        """Reset learning progress"""
        self.pilot.controller.short_term_memory.reset()
        self.pilot.safe_buffer_distance = 25.0
        self.pilot.learning_progress = 0.0
        self.collision_count = 0
        self.learning_events.clear()
        
        logger.info("🔄 Learning reset")
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            clock = pygame.time.Clock()
            
            logger.info("🧠 Starting Sentient Scavenger")
            
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
            return Result(success=False, error=f"Game failed: {e}")
    
    def cleanup(self) -> None:
        """Clean up resources"""
        pygame.quit()
        logger.info("🧹 Sentient Scavenger cleanup complete")


def main():
    """Main entry point for Sentient Scavenger"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🧠 DGT Platform - Sentient Scavenger")
    print("=" * 45)
    print("Active Learning AI with Penalty Awareness")
    print("Watch the AI learn from its mistakes in real-time!")
    print()
    
    # Create and run game
    game = SentientScavenger()
    
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
