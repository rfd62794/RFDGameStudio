"""
Cultural Evolution - Epigenetic Learning Across Generations
Demonstrates shared knowledge inheritance and Lamarckian evolution
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
from dgt_engine.systems.mind.neat.neat_engine import NeuralNetwork
from apps.space.logic.ai_controller import create_ai_controller
from apps.space.logic.knowledge_library import create_knowledge_library


class CulturalPilot:
    """AI pilot with cultural knowledge inheritance"""
    
    def __init__(self, pilot_id: str, generation: int, color: Tuple[int, int, int],
                 network_file: Optional[str] = None, inherit_knowledge: bool = True):
        self.pilot_id = pilot_id
        self.generation = generation
        self.color = color
        self.inherit_knowledge = inherit_knowledge
        
        # Create AI controller
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
        
        # Cultural learning metrics
        self.techniques_applied = 0
        self.techniques_learned = 0
        self.knowledge_contributions = 0
        
        # Visual state
        self.is_blackout = False
        self.blackout_alpha = 255
        
        logger.info(f"🧬 Cultural pilot {pilot_id} (Gen {generation}) initialized")
    
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
        """Update cultural pilot"""
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
                
                # Track technique applications
                if hasattr(self.controller, 'knowledge_library'):
                    # Check if shared knowledge was applied
                    current_inputs = self.controller._prepare_neural_inputs(entity_state, asteroids, scrap_entities)
                    technique = self.controller.knowledge_library.get_technique_for_situation(current_inputs)
                    if technique:
                        self.techniques_applied += 1
            
            # Update blackout state
            self.is_blackout = self.controller.is_blackout
            if self.is_blackout:
                self.blackout_alpha = 128  # 50% transparency
            else:
                self.blackout_alpha = 255
        
        # Update metrics
        self.survival_time += dt
    
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
                
                logger.info(f"💥 {self.pilot_id} collision! Gen {self.generation}")
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
    
    def update_fitness(self) -> None:
        """Update pilot fitness"""
        # Base fitness
        base_fitness = self.survival_time + (self.asteroids_destroyed * 10) + (self.scrap_collected * 25)
        
        # Cultural learning bonus
        learning_bonus = self.techniques_applied * 5.0  # Bonus for using shared knowledge
        contribution_bonus = self.knowledge_contributions * 10.0  # Bonus for contributing knowledge
        
        self.fitness = base_fitness + learning_bonus + contribution_bonus
    
    def contribute_knowledge(self) -> None:
        """Contribute learned techniques to shared knowledge"""
        if hasattr(self.controller, 'knowledge_library'):
            # Save current knowledge state
            save_result = self.controller.knowledge_library.save_library()
            
            if save_result.success:
                self.knowledge_contributions += 1
                logger.info(f"📚 {self.pilot_id} contributed knowledge to library")
    
    def get_cultural_stats(self) -> Dict[str, Any]:
        """Get cultural learning statistics"""
        stats = {
            'generation': self.generation,
            'techniques_applied': self.techniques_applied,
            'techniques_learned': self.techniques_learned,
            'knowledge_contributions': self.knowledge_contributions,
            'cultural_fitness': self.fitness
        }
        
        if hasattr(self.controller, 'knowledge_library'):
            library_stats = self.controller.knowledge_library.get_library_statistics()
            stats['library_size'] = library_stats['total_techniques']
            stats['library_success_rate'] = library_stats['average_success_rate']
        
        return stats


class CulturalEvolution:
    """Main game demonstrating cultural evolution and epigenetic learning"""
    
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
        pygame.display.set_caption("DGT Platform - Cultural Evolution")
        
        # Create surface for game rendering
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Create cultural pilots from different generations
        self.pilots = []
        self._initialize_pilots()
        
        # Game state
        self.game_time = 0.0
        self.dt = 1.0 / 60.0
        self.current_generation = 0
        self.generation_duration = 30.0  # 30 seconds per generation
        
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
        
        # Evolution metrics
        self.generation_history = []
        self.knowledge_transfer_events = []
        
        # Spawn entities after initialization
        self._spawn_entities()
        
        logger.info("🧬 Cultural Evolution initialized")
    
    def _initialize_pilots(self) -> None:
        """Initialize pilots from different generations"""
        pilot_configs = [
            ("ANCESTOR", 0, (255, 100, 100), None, False),  # No inherited knowledge
            ("CHILD", 1, (100, 255, 100), None, True),     # Inherits from ancestor
            ("GRANDCHILD", 2, (100, 100, 255), "best_pilot_network.json", True),  # Inherits + neural network
        ]
        
        for pilot_id, generation, color, network_file, inherit_knowledge in pilot_configs:
            pilot = CulturalPilot(pilot_id, generation, color, network_file, inherit_knowledge)
            self.pilots.append(pilot)
    
    def _spawn_entities(self) -> None:
        """Spawn asteroids and scrap"""
        # Spawn asteroids
        base_asteroids = [
            {'x': 50, 'y': 50, 'vx': 20, 'vy': 15, 'size': 3, 'radius': 8.0, 'health': 3, 'color': 'dark_gray'},
            {'x': 120, 'y': 80, 'vx': -15, 'vy': 25, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'gray'},
            {'x': 30, 'y': 100, 'vx': 30, 'vy': -20, 'size': 2, 'radius': 4.0, 'health': 2, 'color': 'light_gray'},
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
                    # Reset generation
                    self._advance_generation()
                elif event.key == pygame.K_s:
                    # Save knowledge library
                    self._save_knowledge()
                elif event.key == pygame.K_l:
                    # Load knowledge library
                    self._load_knowledge()
    
    def update_game_state(self) -> None:
        """Update game state"""
        self.game_time += self.dt
        
        # Check for generation advancement
        if self.game_time > (self.current_generation + 1) * self.generation_duration:
            self._advance_generation()
        
        # Update asteroids
        for asteroid in self.asteroids:
            asteroid['x'] += asteroid['vx'] * self.dt
            asteroid['y'] += asteroid['vy'] * self.dt
            
            # Wrap around screen
            asteroid['x'] = asteroid['x'] % SOVEREIGN_WIDTH
            asteroid['y'] = asteroid['y'] % SOVEREIGN_HEIGHT
        
        # Update pilots
        for pilot in self.pilots:
            pilot.update(self.dt, self.asteroids, self.scrap_entities)
            
            # Check collisions
            pilot.check_collisions(self.asteroids)
            
            # Check scrap collection
            pilot.check_scrap_collection(self.scrap_entities)
            
            # Update fitness
            pilot.update_fitness()
        
        # Respawn entities if needed
        if len(self.asteroids) < 2:
            self._spawn_entities()
        
        if len(self.scrap_entities) < 3:
            self._spawn_entities()
    
    def _advance_generation(self) -> None:
        """Advance to next generation"""
        self.current_generation += 1
        
        # Record generation statistics
        generation_stats = {
            'generation': self.current_generation,
            'time': self.game_time,
            'pilots': [pilot.get_cultural_stats() for pilot in self.pilots]
        }
        
        self.generation_history.append(generation_stats)
        
        # Apply knowledge decay
        for pilot in self.pilots:
            if hasattr(pilot.controller, 'knowledge_library'):
                pilot.controller.knowledge_library.apply_knowledge_decay(self.game_time)
        
        # Contribute knowledge to library
        for pilot in self.pilots:
            pilot.contribute_knowledge()
        
        logger.info(f"🧬 Advanced to generation {self.current_generation}")
    
    def _save_knowledge(self) -> None:
        """Save shared knowledge library"""
        for pilot in self.pilots:
            if hasattr(pilot.controller, 'knowledge_library'):
                result = pilot.controller.knowledge_library.save_library()
                if result.success:
                    logger.info(f"💾 Saved knowledge library for {pilot.pilot_id}")
    
    def _load_knowledge(self) -> None:
        """Load shared knowledge library"""
        for pilot in self.pilots:
            if hasattr(pilot.controller, 'knowledge_library'):
                result = pilot.controller.knowledge_library.load_library()
                if result.success:
                    logger.info(f"📖 Loaded knowledge library for {pilot.pilot_id}")
    
    def render_game(self) -> None:
        """Render the game"""
        # Clear surface
        self.game_surface.fill(self.colors['black'])
        
        # Draw scrap
        self._draw_scrap()
        
        # Draw asteroids
        self._draw_asteroids()
        
        # Draw pilots
        self._draw_pilots()
        
        # Draw cultural HUD
        self._draw_cultural_hud()
        
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
        """Draw cultural pilots"""
        for pilot in self.pilots:
            # Apply blackout alpha if needed
            pilot_color = pilot.color
            if pilot.is_blackout:
                pilot_color = tuple(c // 2 for c in pilot_color)  # Darken during blackout
            
            # Draw triangle ship
            ship_points = [
                (pilot.visual_x + 6 * math.cos(pilot.visual_angle), 
                 pilot.visual_y + 6 * math.sin(pilot.visual_angle)),
                (pilot.visual_x + 6 * math.cos(pilot.visual_angle + 2.4), 
                 pilot.visual_y + 6 * math.sin(pilot.visual_angle + 2.4)),
                (pilot.visual_x + 6 * math.cos(pilot.visual_angle - 2.4), 
                 pilot.visual_y + 6 * math.sin(pilot.visual_angle - 2.4))
            ]
            
            pygame.draw.polygon(self.game_surface, pilot_color, ship_points)
            pygame.draw.polygon(self.game_surface, self.colors['white'], ship_points, 1)
            
            # Draw generation indicator
            gen_text = f"G{pilot.generation}"
            gen_surface = self.font.render(gen_text, True, pilot_color)
            self.game_surface.blit(gen_surface, (int(pilot.visual_x - 8), int(pilot.visual_y - 15)))
    
    def _draw_cultural_hud(self) -> None:
        """Draw cultural evolution HUD"""
        y_offset = 2
        
        # Title
        title_text = "CULTURAL EVOLUTION"
        title_surface = self.font.render(title_text, True, self.colors['white'])
        self.game_surface.blit(title_surface, (2, y_offset))
        y_offset += 10
        
        # Generation info
        gen_text = f"Generation: {self.current_generation}"
        gen_surface = self.font.render(gen_text, True, self.colors['cyan'])
        self.game_surface.blit(gen_surface, (2, y_offset))
        y_offset += 8
        
        # Pilot stats
        for pilot in self.pilots:
            pilot_text = f"{pilot.pilot_id}: F={pilot.fitness:.1f} T={pilot.techniques_applied}"
            pilot_surface = self.font.render(pilot_text, True, pilot.color)
            self.game_surface.blit(pilot_surface, (2, y_offset))
            y_offset += 8
        
        # Knowledge library stats
        if self.pilots and hasattr(self.pilots[0].controller, 'knowledge_library'):
            library_stats = self.pilots[0].controller.knowledge_library.get_library_statistics()
            library_text = f"Library: {library_stats['total_techniques']} techniques"
            library_surface = self.font.render(library_text, True, self.colors['yellow'])
            self.game_surface.blit(library_surface, (2, y_offset))
            y_offset += 8
            
            success_text = f"Success Rate: {library_stats['average_success_rate']:.2f}"
            success_surface = self.font.render(success_text, True, self.colors['green'])
            self.game_surface.blit(success_surface, (2, y_offset))
            y_offset += 8
        
        # Instructions
        instructions = [
            "ESC: Exit",
            "R: Next Generation",
            "S: Save Knowledge",
            "L: Load Knowledge"
        ]
        
        y_offset = SOVEREIGN_HEIGHT - 40
        for instruction in instructions:
            inst_surface = self.font.render(instruction, True, self.colors['green'])
            self.game_surface.blit(inst_surface, (2, y_offset))
            y_offset += 8
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            clock = pygame.time.Clock()
            
            logger.info("🧬 Starting Cultural Evolution")
            
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
        logger.info("🧹 Cultural Evolution cleanup complete")


def main():
    """Main entry point for Cultural Evolution"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🧬 DGT Platform - Cultural Evolution")
    print("=" * 45)
    print("Epigenetic Learning Across Generations")
    print("Watch knowledge transfer between AI generations!")
    print()
    
    # Create and run game
    game = CulturalEvolution()
    
    try:
        result = game.run()
        
        if result.success:
            print("🏆 Cultural Evolution completed successfully!")
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
