"""
Combatant Evolution - Safe Respawn & Active Offense
Demonstrates AI pilots with combat capabilities and smart respawning
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
from apps.space.logic.knowledge_library import create_knowledge_library


class CombatantPilot:
    """AI pilot with combat capabilities and safe respawn"""
    
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
        
        # Combat metrics
        self.shots_fired = 0
        self.shots_hit = 0
        self.combat_efficiency = 0.0
        
        # Respawn system
        self.pending_respawn = False
        self.resawn_position = None
        
        # Visual state
        self.is_blackout = False
        self.is_ghost_phase = False
        self.blackout_alpha = 255
        self.ghost_alpha = 255
        
        logger.info(f"🔫 Combatant pilot {pilot_id} (Gen {generation}) initialized")
    
    def _load_network(self, filename: str) -> Optional[NeuralNetwork]:
        """Load neural network from file"""
        try:
            with open(filename, 'r') as f:
                network_data = json.load(f)
            
            # Reconstruct neural network with 7 inputs (added crosshair input)
            network = NeuralNetwork(
                num_inputs=network_data.get('num_inputs', 7),
                num_hidden=network_data.get('num_hidden', 8),
                num_outputs=network_data.get('num_outputs', 3)
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
        """Update combatant pilot"""
        # Handle pending respawn
        if self.pending_respawn and self.respawn_position:
            self.visual_x, self.visual_y = self.respawn_position
            self.pending_respawn = False
            self.respawn_position = None
            logger.debug(f"📍 {self.pilot_id} respawned at ({self.visual_x}, {self.visual_y})")
        
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
                
                # Handle weapon firing
                if controls.fire_weapon:
                    self._fire_weapon(asteroids)
                
                # Wrap position
                self.visual_x = self.visual_x % SOVEREIGN_WIDTH
                self.visual_y = self.visual_y % SOVEREIGN_HEIGHT
            
            # Update visual states
            self.is_blackout = self.controller.is_blackout
            self.is_ghost_phase = self.controller.is_in_ghost_phase()
            
            if self.is_blackout:
                self.blackout_alpha = 128  # 50% transparency
                self.ghost_alpha = 255
            elif self.is_ghost_phase:
                self.blackout_alpha = 255
                self.ghost_alpha = 180  # 70% transparency (flickering effect)
            else:
                self.blackout_alpha = 255
                self.ghost_alpha = 255
        
        # Update metrics
        self.survival_time += dt
        
        # Calculate combat efficiency
        if self.shots_fired > 0:
            self.combat_efficiency = self.shots_hit / self.shots_fired
    
    def _fire_weapon(self, asteroids: List[Dict]) -> None:
        """Fire weapon at asteroids with aggression incentive"""
        self.shots_fired += 1
        
        # Check for asteroid in crosshair and destroy it
        for asteroid in asteroids[:]:  # Copy list to allow modification during iteration
            # Calculate angle to asteroid
            dx = asteroid['x'] - self.visual_x
            dy = asteroid['y'] - self.visual_y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance > 80.0:  # Maximum range
                continue
            
            angle_to_asteroid = math.atan2(dy, dx)
            angle_diff = abs(angle_to_asteroid - self.visual_angle)
            
            # Normalize angle difference
            while angle_diff > math.pi:
                angle_diff = abs(angle_diff - 2 * math.pi)
            
            # Check if within crosshair cone (30 degrees for combat)
            if angle_diff < math.pi / 6:  # 30 degrees
                # Hit! Destroy asteroid
                asteroids.remove(asteroid)
                self.asteroids_destroyed += 1
                self.shots_hit += 1
                self.fitness += 15.0  # Combat bonus
                
                # Aggression incentive - reward for aiming and shooting
                self.fitness += 2.0  # Small bonus for firing in right direction
                
                logger.debug(f"💥 {self.pilot_id} destroyed asteroid! Combat efficiency: {self.combat_efficiency:.2f}")
                break
        else:
            # Missed shot - still give small aggression incentive for trying
            if self.shots_fired % 10 == 0:  # Every 10 shots
                self.fitness += 1.0  # Small reward for attempting to shoot
    
    def check_collisions(self, asteroids: List[Dict]) -> bool:
        """Check for collisions and trigger safe respawn"""
        # Skip collision check during ghost phase
        if self.is_ghost_phase:
            return False
        
        collision_occurred = False
        
        for asteroid in asteroids:
            distance = math.sqrt((self.visual_x - asteroid['x'])**2 + 
                               (self.visual_y - asteroid['y'])**2)
            collision_distance = 3.0 + asteroid['radius']  # Ship radius + asteroid radius
            
            if distance < collision_distance:
                # Collision detected
                collision_occurred = True
                self.collisions += 1
                
                # Find safe respawn position
                safe_pos = self._find_safe_respawn_position(asteroids)
                
                # Trigger blackout with safe respawn
                self.controller.trigger_blackout(duration=2.0, safe_position=safe_pos)
                
                # Set pending respawn
                self.pending_respawn = True
                self.respawn_position = safe_pos
                
                # Apply fitness penalty
                self.fitness -= 50.0  # Heavy penalty for collision
                
                logger.info(f"💥 {self.pilot_id} collision! Safe respawn at ({safe_pos[0]:.1f}, {safe_pos[1]:.1f})")
                break
        
        return collision_occurred
    
    def _find_safe_respawn_position(self, asteroids: List[Dict]) -> Tuple[float, float]:
        """Find safest position for respawn"""
        # Grid-based search for safe position
        grid_size = 20
        best_position = (SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
        best_distance = 0.0
        
        for x in range(0, SOVEREIGN_WIDTH, grid_size):
            for y in range(0, SOVEREIGN_HEIGHT, grid_size):
                # Calculate minimum distance to all asteroids
                min_distance = float('inf')
                
                for asteroid in asteroids:
                    distance = math.sqrt((x - asteroid['x'])**2 + (y - asteroid['y'])**2)
                    min_distance = min(min_distance, distance)
                
                # Prefer positions with maximum minimum distance
                if min_distance > best_distance:
                    best_distance = min_distance
                    best_position = (x, y)
        
        # Ensure minimum safe distance
        if best_distance < 40.0:
            # If no safe position found, use corner
            corners = [
                (20, 20), (SOVEREIGN_WIDTH - 20, 20),
                (20, SOVEREIGN_HEIGHT - 20), (SOVEREIGN_WIDTH - 20, SOVEREIGN_HEIGHT - 20)
            ]
            best_position = random.choice(corners)
        
        return best_position
    
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
        """Update pilot fitness with combat bonuses and aggression incentives"""
        # Base fitness
        base_fitness = self.survival_time + (self.asteroids_destroyed * 10) + (self.scrap_collected * 25)
        
        # Combat bonus
        combat_bonus = self.asteroids_destroyed * 15  # Additional bonus for destruction
        
        # Aggression incentive - reward for firing bullets
        aggression_bonus = min(self.shots_fired * 2, 50.0)  # Cap at 50 points
        
        # Efficiency bonus
        efficiency_bonus = 0.0
        if self.shots_fired > 0:
            efficiency_bonus = self.combat_efficiency * 20.0  # Bonus for accuracy
        
        # Curiosity bias - penalty for staying still
        curiosity_penalty = 0.0
        if self.survival_time > 5.0:  # After 5 seconds
            # Check if pilot is moving (simple velocity check)
            total_movement = abs(self.visual_x - (SOVEREIGN_WIDTH // 2)) + abs(self.visual_y - (SOVEREIGN_HEIGHT // 2))
            if total_movement < 20:  # Haven't moved much
                curiosity_penalty = (self.survival_time - 5.0) * 0.5  # Penalty for inactivity
        
        self.fitness = base_fitness + combat_bonus + aggression_bonus + efficiency_bonus - curiosity_penalty
    
    def get_combat_stats(self) -> Dict[str, Any]:
        """Get combat statistics"""
        return {
            'generation': self.generation,
            'shots_fired': self.shots_fired,
            'shots_hit': self.shots_hit,
            'combat_efficiency': self.combat_efficiency,
            'asteroids_destroyed': self.asteroids_destroyed,
            'collisions': self.collisions,
            'combat_fitness': self.fitness
        }


class CombatantEvolution:
    """Main game demonstrating combat capabilities and safe respawning"""
    
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
        pygame.display.set_caption("DGT Platform - Combatant Evolution")
        
        # Create surface for game rendering
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
        
        # Create combatant pilots
        self.pilots = []
        self._initialize_pilots()
        
        # Game state
        self.game_time = 0.0
        self.dt = 1.0 / 60.0
        self.current_generation = 0
        self.generation_duration = 30.0  # 30 seconds per generation
        
        # Phosphor green and high-contrast colors
        self.ship_color = (0, 255, 0)  # Phosphor green for ships
        self.asteroid_color = (170, 170, 170)  # Grey for asteroids
        self.bullet_color = (255, 255, 255)  # White for bullets
        
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
        
        # Combat metrics
        self.generation_history = []
        
        # Spawn entities after initialization
        self._spawn_entities()
        
        logger.info("🔫 Combatant Evolution initialized")
    
    def _initialize_pilots(self) -> None:
        """Initialize combatant pilots"""
        pilot_configs = [
            ("WARRIOR", 0, (255, 100, 100), None, False),  # No inherited knowledge
            ("HUNTER", 1, (100, 255, 100), None, True),     # Inherits from warrior
            ("DESTROYER", 2, (100, 100, 255), "best_pilot_network.json", True),  # Inherits + neural network
        ]
        
        for pilot_id, generation, color, network_file, inherit_knowledge in pilot_configs:
            pilot = CombatantPilot(pilot_id, generation, color, network_file, inherit_knowledge)
            self.pilots.append(pilot)
    
    def _spawn_entities(self) -> None:
        """Spawn asteroids and scrap"""
        # Spawn asteroids
        base_asteroids = [
            {'x': 50, 'y': 50, 'vx': 15, 'vy': 10, 'size': 3, 'radius': 8.0, 'health': 3, 'color': self.asteroid_color},
            {'x': 120, 'y': 80, 'vx': -10, 'vy': 20, 'size': 2, 'radius': 4.0, 'health': 2, 'color': self.asteroid_color},
            {'x': 30, 'y': 100, 'vx': 25, 'vy': -15, 'size': 2, 'radius': 4.0, 'health': 2, 'color': self.asteroid_color},
            {'x': 90, 'y': 40, 'vx': -20, 'vy': 15, 'size': 1, 'radius': 2.0, 'health': 1, 'color': self.asteroid_color},
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
                elif event.key == pygame.K_SPACE:
                    # Add more asteroids for testing
                    self._spawn_asteroids()
    
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
        if len(self.asteroids) < 3:
            self._spawn_asteroids()
        
        if len(self.scrap_entities) < 3:
            self._spawn_entities()
    
    def _spawn_asteroids(self) -> None:
        """Spawn additional asteroids"""
        new_asteroids = [
            {'x': random.randint(20, SOVEREIGN_WIDTH-20), 
             'y': random.randint(20, SOVEREIGN_HEIGHT-20),
             'vx': random.uniform(-20, 20), 
             'vy': random.uniform(-20, 20),
             'size': random.randint(1, 3), 
             'radius': random.uniform(2.0, 8.0), 
             'health': random.randint(1, 3), 
             'color': self.asteroid_color}  # Use grey color
        ]
        
        for asteroid in new_asteroids:
            self.asteroids.append(asteroid)
    
    def _advance_generation(self) -> None:
        """Advance to next generation"""
        self.current_generation += 1
        
        # Record generation statistics
        generation_stats = {
            'generation': self.current_generation,
            'time': self.game_time,
            'pilots': [pilot.get_combat_stats() for pilot in self.pilots]
        }
        
        self.generation_history.append(generation_stats)
        
        logger.info(f"🔫 Advanced to combat generation {self.current_generation}")
    
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
        
        # Draw combat HUD
        self._draw_combat_hud()
        
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
        """Draw combatant pilots"""
        for pilot in self.pilots:
            # Apply visual effects
            pilot_color = pilot.color
            
            if pilot.is_blackout:
                pilot_color = tuple(c // 2 for c in pilot.color)  # Darken during blackout
            elif pilot.is_ghost_phase:
                # Flickering effect during ghost phase
                if int(self.game_time * 10) % 2 == 0:
                    pilot_color = tuple(c // 2 for c in pilot.color)
            
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
            
            # Draw crosshair for combat visualization
            if not pilot.is_blackout:
                crosshair_length = 15
                crosshair_angle = pilot.visual_angle
                crosshair_x = pilot.visual_x + crosshair_length * math.cos(crosshair_angle)
                crosshair_y = pilot.visual_y + crosshair_length * math.sin(crosshair_angle)
                pygame.draw.circle(self.game_surface, self.colors['cyan'], 
                                 (int(crosshair_x), int(crosshair_y)), 2)
            
            # Draw generation indicator
            gen_text = f"G{pilot.generation}"
            gen_surface = self.font.render(gen_text, True, pilot_color)
            self.game_surface.blit(gen_surface, (int(pilot.visual_x - 8), int(pilot.visual_y - 15)))
    
    def _draw_combat_hud(self) -> None:
        """Draw combat evolution HUD"""
        y_offset = 2
        
        # Title
        title_text = "COMBATANT EVOLUTION"
        title_surface = self.font.render(title_text, True, self.colors['white'])
        self.game_surface.blit(title_surface, (2, y_offset))
        y_offset += 10
        
        # Generation info
        gen_text = f"Generation: {self.current_generation}"
        gen_surface = self.font.render(gen_text, True, self.colors['cyan'])
        self.game_surface.blit(gen_surface, (2, y_offset))
        y_offset += 8
        
        # Pilot combat stats
        for pilot in self.pilots:
            pilot_text = f"{pilot.pilot_id}: F={pilot.fitness:.1f} K={pilot.asteroids_destroyed} E={pilot.combat_efficiency:.2f}"
            pilot_surface = self.font.render(pilot_text, True, pilot.color)
            self.game_surface.blit(pilot_surface, (2, y_offset))
            y_offset += 8
        
        # Asteroid count
        asteroid_text = f"Asteroids: {len(self.asteroids)}"
        asteroid_surface = self.font.render(asteroid_text, True, self.colors['red'])
        self.game_surface.blit(asteroid_surface, (2, y_offset))
        y_offset += 8
        
        # Instructions
        instructions = [
            "ESC: Exit",
            "R: Next Generation",
            "SPACE: Add Asteroids"
        ]
        
        y_offset = SOVEREIGN_HEIGHT - 32
        for instruction in instructions:
            inst_surface = self.font.render(instruction, True, self.colors['green'])
            self.game_surface.blit(inst_surface, (2, y_offset))
            y_offset += 8
    
    def run(self) -> Result[bool]:
        """Main game loop"""
        try:
            clock = pygame.time.Clock()
            
            logger.info("🔫 Starting Combatant Evolution")
            
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
        logger.info("🧹 Combatant Evolution cleanup complete")


def main():
    """Main entry point for Combatant Evolution"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🔫 DGT Platform - Combatant Evolution")
    print("=" * 45)
    print("Safe Respawn & Active Offense Demonstration")
    print("Watch AI pilots learn to fight and survive!")
    print()
    
    # Create and run game
    game = CombatantEvolution()
    
    try:
        result = game.run()
        
        if result.success:
            print("🏆 Combatant Evolution completed successfully!")
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
