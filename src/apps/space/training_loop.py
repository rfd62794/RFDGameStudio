"""
Training Loop - NEAT Evolution for AI Pilot
High-speed training environment for evolving autonomous asteroid navigation
"""

import time
import sys
import math
import random
from pathlib import Path
from typing import Dict, List, Any, Tuple
from loguru import logger

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, DEBUG_INFINITE_ENERGY
from dgt_engine.systems.mind.neat.neat_engine import NEATEngine, NeuralNetwork, create_neat_engine
from dgt_engine.systems.mind.neat.fitness import FitnessCalculator, create_fitness_calculator
from dgt_engine.systems.kernel.controller import ControlInput
from apps.space.logic.ai_controller import create_ai_controller
from apps.space.arcade_visual_asteroids import ArcadeVisualAsteroids


class TrainingLoop:
    """High-speed training loop for NEAT evolution"""
    
    def __init__(self, population_size: int = 50, max_generations: int = 50):
        self.population_size = population_size
        self.max_generations = max_generations
        
        # NEAT components
        self.neat_engine = create_neat_engine(population_size, num_inputs=8)
        self.fitness_calculator = create_fitness_calculator()
        
        # Training statistics
        self.generation_stats = []
        self.best_fitness_history = []
        self.training_start_time = time.time()
        
        logger.info(f"🧬 TrainingLoop initialized: {population_size} genomes, {max_generations} generations")
    
    def evaluate_genome(self, network: NeuralNetwork) -> Result[Tuple[float, float]]:
        """Evaluate a single genome using high-speed simulation"""
        try:
            # Create AI controller with neural network
            ai_controller = create_ai_controller(
                controller_id=f"EVALUATION_PILOT",
                use_neural_network=True,
                neural_network=network
            )
            
            # Create high-speed game simulation
            game = HighSpeedSimulation(ai_controller)
            
            # Run simulation
            result = game.run_simulation()
            
            if not result.success:
                return Result(success=False, error=f"Simulation failed: {result.error}")
            
            # Get performance metrics
            metrics = result.value
            
            # Return survival time, asteroids destroyed, and scrap collected for fitness calculation
            # Apply camping penalty and engagement penalty to survival score
            total_penalty = metrics['camping_penalty'] + metrics.get('engagement_penalty', 0.0)
            effective_survival = max(0.0, metrics['survival_time'] - total_penalty)
            return Result(success=True, value=(effective_survival, metrics['asteroids_destroyed'], metrics.get('scrap_collected', 0)))
            
        except Exception as e:
            return Result(success=False, error=f"Genome evaluation failed: {e}")
    
    def train(self) -> Result[Dict[str, Any]]:
        """Run complete training evolution"""
        try:
            logger.info(f"🚀 Starting NEAT training for {self.max_generations} generations")
            
            for generation in range(self.max_generations):
                generation_start = time.time()
                
                # Evaluate current population
                fitness_result = self.neat_engine.evaluate_population(self.evaluate_genome)
                
                if not fitness_result.success:
                    return Result(success=False, error=f"Population evaluation failed: {fitness_result.error}")
                
                stats = fitness_result.value
                stats['generation_time'] = time.time() - generation_start
                
                # Record statistics
                self.generation_stats.append(stats)
                self.best_fitness_history.append(stats['best_fitness_ever'])
                
                logger.info(f"📊 Generation {generation}: avg={stats['avg_fitness']:.2f}, "
                           f"max={stats['max_fitness']:.2f}, best_ever={stats['best_fitness_ever']:.2f}")
                
                # Check if we've reached target fitness
                if stats['best_fitness_ever'] >= 1000.0:  # Target fitness threshold
                    logger.info(f"🎯 Target fitness reached in generation {generation}")
                    break
                
                # Evolve to next generation (except for last generation)
                if generation < self.max_generations - 1:
                    evolution_result = self.neat_engine.evolve_population()
                    
                    if not evolution_result.success:
                        return Result(success=False, error=f"Population evolution failed: {evolution_result.error}")
            
            # Training complete
            training_time = time.time() - self.training_start_time
            
            # Get final best genome
            best_genome = self.neat_engine.get_best_genome()
            
            final_stats = {
                'training_time': training_time,
                'generations_completed': len(self.generation_stats),
                'best_fitness_ever': self.best_fitness_history[-1] if self.best_fitness_history else 0.0,
                'final_generation_stats': self.generation_stats[-1] if self.generation_stats else None,
                'best_genome': best_genome,
                'fitness_progression': self.best_fitness_history,
                'neat_engine_status': self.neat_engine.get_status()
            }
            
            logger.info(f"🏆 Training complete! Best fitness: {final_stats['best_fitness_ever']:.2f}")
            
            return Result(success=True, value=final_stats)
            
        except Exception as e:
            return Result(success=False, error=f"Training failed: {e}")
    
    def save_best_genome(self, filename: str = "best_pilot_network.json") -> Result[bool]:
        """Save the best trained neural network"""
        try:
            best_genome = self.neat_engine.get_best_genome()
            
            if not best_genome:
                return Result(success=False, error="No best genome found")
            
            # Save network weights and architecture
            network_data = {
                'num_inputs': best_genome.network.num_inputs,
                'num_hidden': best_genome.network.num_hidden,
                'num_outputs': best_genome.network.num_outputs,
                'weights_input_hidden': best_genome.network.weights_input_hidden,
                'weights_hidden_output': best_genome.network.weights_hidden_output,
                'bias_hidden': best_genome.network.bias_hidden,
                'bias_output': best_genome.network.bias_output,
                'fitness': best_genome.fitness,
                'generation': best_genome.generation
            }
            
            import json
            with open(filename, 'w') as f:
                json.dump(network_data, f, indent=2)
            
            logger.info(f"💾 Best genome saved to {filename}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to save genome: {e}")
    
    def load_best_genome(self, filename: str = "best_pilot_network.json") -> Result[NeuralNetwork]:
        """Load a trained neural network"""
        try:
            import json
            
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
            
            logger.info(f"📖 Neural network loaded from {filename}")
            return Result(success=True, value=network)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load genome: {e}")


class HighSpeedSimulation:
    """High-speed game simulation for fitness evaluation"""
    
    def __init__(self, ai_controller):
        self.ai_controller = ai_controller
        self.max_simulation_time = 60.0  # 60 seconds max per evaluation
        self.simulation_speed = 1.0  # Can be increased for faster training
        
        # Performance metrics
        self.survival_time = 0.0
        self.asteroids_destroyed = 0
        self.scrap_collected = 0
        self.bullets_fired = 0
        self.shots_hit = 0
        self.near_misses = 0
        
        # Game state (simplified for speed)
        self.ship_x = SOVEREIGN_WIDTH // 2
        self.ship_y = SOVEREIGN_HEIGHT // 2
        self.ship_vx = 0.0
        self.ship_vy = 0.0
        self.ship_angle = 0.0
        self.ship_angle = 0.0
        self.ship_energy = 100.0
        self.ship_lives = 3
        
        # Combat settings
        self.ship_last_fire_time = -10.0
        self.ship_fire_cooldown = 1.0
        
        # Camping Penalty Logic
        self.camping_penalty = 0.0
        self.camping_anchor = (self.ship_x, self.ship_y)
        self.camping_timer = 0.0
        self.camping_radius = 20.0  # Tightened from 100.0 to prevent safe circling
        self.max_camping_time = 3.0
        
        # Engagement tracking
        self.time_since_scrap = 0.0
        self.time_since_hit = 0.0
        self.max_idle_time = 5.0  # Time before penalty kicks in
        self.engagement_penalty = 0.0
        
        # Simplified entities
        self.asteroids = []
        self.scrap_entities = []
        self._spawn_test_asteroids()
        
        logger.debug("🚀 HighSpeedSimulation initialized")
    
    def _spawn_test_asteroids(self) -> None:
        """Spawn test asteroids for evaluation"""
        # Create a challenging but manageable asteroid field
        test_asteroids = [
            {'x': 50, 'y': 50, 'vx': 20, 'vy': 15, 'size': 3, 'radius': 8.0, 'health': 3},
            {'x': 120, 'y': 80, 'vx': -15, 'vy': 25, 'size': 2, 'radius': 4.0, 'health': 2},
            {'x': 30, 'y': 100, 'vx': 30, 'vy': -20, 'size': 2, 'radius': 4.0, 'health': 2},
            {'x': 90, 'y': 40, 'vx': -25, 'vy': 10, 'size': 1, 'radius': 2.0, 'health': 1},
            {'x': 140, 'y': 120, 'vx': 10, 'vy': -30, 'size': 1, 'radius': 2.0, 'health': 1}
        ]
        
        self.asteroids = test_asteroids.copy()
    
    def run_simulation(self) -> Result[Dict[str, Any]]:
        """Run high-speed simulation"""
        try:
            dt = 1.0 / 60.0  # 60Hz timestep
            simulation_time = 0.0
            
            # Reset metrics
            self.survival_time = 0.0
            self.asteroids_destroyed = 0
            self.scrap_collected = 0
            self.bullets_fired = 0
            self.shots_hit = 0
            self.near_misses = 0
            
            # Reset ship state
            self.ship_x = SOVEREIGN_WIDTH // 2
            self.ship_y = SOVEREIGN_HEIGHT // 2
            self.ship_vx = 0.0
            self.ship_vy = 0.0
            self.ship_angle = 0.0
            self.ship_energy = 100.0
            self.ship_lives = 3
            self.ship_last_fire_time = -10.0
            
            self.camping_penalty = 0.0
            self.camping_anchor = (self.ship_x, self.ship_y)
            self.camping_timer = 0.0
            
            self.time_since_scrap = 0.0
            self.time_since_hit = 0.0
            self.engagement_penalty = 0.0
            
            # Reset entities
            self.asteroids = []
            self.scrap_entities = []
            self._spawn_test_asteroids()
            
            # Simulation loop
            while simulation_time < self.max_simulation_time and self.ship_lives > 0:
                # Update AI controller
                entity_state = {
                    'x': self.ship_x,
                    'y': self.ship_y,
                    'vx': self.ship_vx,
                    'vy': self.ship_vy,
                    'angle': self.ship_angle,
                    'energy': self.ship_energy,
                    'scrap': self.scrap_entities
                }
                
                world_data = {
                    'asteroids': self.asteroids
                }
                
                control_result = self.ai_controller.update(dt, entity_state, world_data)
                
                if not control_result.success:
                    break
                
                controls = control_result.value
                
                # Apply controls
                self._apply_controls(controls, dt)
                
                # Update physics
                self._update_physics(dt)
                
                # Check collisions
                self._check_collisions()
                
                # Update time
                simulation_time += dt
                self.survival_time = simulation_time
            
            # Return performance metrics
            metrics = {
                'survival_time': self.survival_time,
                'camping_penalty': self.camping_penalty,
                'engagement_penalty': self.engagement_penalty,
                'asteroids_destroyed': self.asteroids_destroyed,
                'scrap_collected': self.scrap_collected,
                'bullets_fired': self.bullets_fired,
                'shots_hit': self.shots_hit,
                'near_misses': self.near_misses,
                'final_energy': self.ship_energy,
                'final_lives': self.ship_lives
            }
            
            return Result(success=True, value=metrics)
            
        except Exception as e:
            return Result(success=False, error=f"Simulation failed: {e}")
    
    def _apply_controls(self, controls: ControlInput, dt: float) -> None:
        """Apply AI controls to ship"""
        # Extract control values from ControlInput object
        thrust = controls.thrust
        rotation = controls.rotation
        fire_weapon = controls.fire_weapon
        
        # Apply thrust
        if thrust != 0:
            thrust_magnitude = thrust * 50.0
            thrust_x = thrust_magnitude * math.cos(self.ship_angle)
            thrust_y = thrust_magnitude * math.sin(self.ship_angle)
            
            self.ship_vx += thrust_x * dt
            self.ship_vy += thrust_y * dt
            
            # No energy drain in training mode (DEBUG_INFINITE_ENERGY)
        
        # Apply rotation
        if rotation != 0:
            rotation_speed = rotation * 3.0
            self.ship_angle += rotation_speed * dt
            self.ship_angle = self.ship_angle % (2 * math.pi)
        
        # Handle weapon fire
        if fire_weapon:
            if self.survival_time - self.ship_last_fire_time >= self.ship_fire_cooldown:
                self.ship_last_fire_time = self.survival_time
                self._fire_bullet()
    
    def _get_toroidal_vector(self, x1, y1, x2, y2) -> Tuple[float, float, float]:
        """Calculate shortest vector from p1 to p2 in a toroidal world"""
        dx = x2 - x1
        dy = y2 - y1
        if abs(dx) > SOVEREIGN_WIDTH / 2: dx -= math.copysign(SOVEREIGN_WIDTH, dx)
        if abs(dy) > SOVEREIGN_HEIGHT / 2: dy -= math.copysign(SOVEREIGN_HEIGHT, dy)
        dist = math.sqrt(dx**2 + dy**2)
        return dx, dy, dist

    def _fire_bullet(self) -> None:
        """Fire bullet with toroidal raycast check"""
        self.bullets_fired += 1
        shoot_range = 300.0
        cone_angle = 0.1
        
        hit_asteroid = None
        min_dist = float('inf')
        
        for asteroid in self.asteroids:
            dx, dy, dist = self._get_toroidal_vector(self.ship_x, self.ship_y, asteroid['x'], asteroid['y'])
            if dist > shoot_range: continue
                
            angle_to_target = math.atan2(dy, dx)
            angle_diff = abs(angle_to_target - self.ship_angle)
            while angle_diff > math.pi: angle_diff = abs(angle_diff - 2 * math.pi)
            
            if angle_diff < cone_angle:
                if dist < min_dist:
                    min_dist = dist
                    hit_asteroid = asteroid
        
        if hit_asteroid:
            self.shots_hit += 1
            self.time_since_hit = 0.0
            self.asteroids_destroyed += 1
            
            # Spawn scrap where asteroid was
            new_scrap = {
                'x': hit_asteroid['x'],
                'y': hit_asteroid['y'],
                'value': random.randint(5, 15),
                'radius': 3.0
            }
            self.scrap_entities.append(new_scrap)
            
            self.asteroids.remove(hit_asteroid)
            self._spawn_single_asteroid()
            
    def _spawn_single_asteroid(self) -> None:
        """Spawn a single new asteroid at edge of screen"""
        side = random.randint(0, 3)
        if side == 0: # Top
            x, y = random.uniform(0, SOVEREIGN_WIDTH), 0
        elif side == 1: # Right
            x, y = SOVEREIGN_WIDTH, random.uniform(0, SOVEREIGN_HEIGHT)
        elif side == 2: # Bottom
            x, y = random.uniform(0, SOVEREIGN_WIDTH), SOVEREIGN_HEIGHT
        else: # Left
            x, y = 0, random.uniform(0, SOVEREIGN_HEIGHT)
            
        new_asteroid = {
            'x': x, 'y': y,
            'vx': random.uniform(-20, 20),
            'vy': random.uniform(-20, 20),
            'size': 2, 'radius': 4.0, 'health': 1
        }
        self.asteroids.append(new_asteroid)
    
    def _update_physics(self, dt: float) -> None:
        """Update physics simulation"""
        # Update ship position
        self.ship_x += self.ship_vx * dt
        self.ship_y += self.ship_vy * dt
        
        # Toroidal wrap
        self.ship_x = self.ship_x % SOVEREIGN_WIDTH
        self.ship_y = self.ship_y % SOVEREIGN_HEIGHT
        
        # Check camping
        dist_from_anchor = math.sqrt((self.ship_x - self.camping_anchor[0])**2 + 
                                   (self.ship_y - self.camping_anchor[1])**2)
                                   
        if dist_from_anchor < self.camping_radius:
            self.camping_timer += dt
            if self.camping_timer > self.max_camping_time:
                # Apply penalty for camping
                self.camping_penalty += 0.5 * dt  # Reduced from 50.0
        else:
            # Moved enough, reset anchor
            self.camping_timer = 0.0
            self.camping_anchor = (self.ship_x, self.ship_y)
            
        # Check engagement (Scrap & Combat)
        self.time_since_scrap += dt
        self.time_since_hit += dt
        
        if self.time_since_scrap > self.max_idle_time:
            self.engagement_penalty += 0.2 * dt  # Reduced from 10.0
            
        if self.time_since_hit > self.max_idle_time:
            self.engagement_penalty += 0.1 * dt   # Reduced from 5.0
        
        # Apply drag
        self.ship_vx *= 0.999
        self.ship_vy *= 0.999
        
        # Update asteroids
        for asteroid in self.asteroids:
            asteroid['x'] += asteroid['vx'] * dt
            asteroid['y'] += asteroid['vy'] * dt
            
            # Wrap around screen
            asteroid['x'] = asteroid['x'] % SOVEREIGN_WIDTH
            asteroid['y'] = asteroid['y'] % SOVEREIGN_HEIGHT
            
        # Update scrap and check collection
        collected_scrap = []
        for scrap in self.scrap_entities:
            dx, dy, dist = self._get_toroidal_vector(self.ship_x, self.ship_y, scrap['x'], scrap['y'])
            if dist < 6.0:  # Ship radius 3 + Scrap radius 3
                self.scrap_collected += 1
                self.time_since_scrap = 0.0
                collected_scrap.append(scrap)
        
        for scrap in collected_scrap:
            self.scrap_entities.remove(scrap)
    
    def _check_collisions(self) -> None:
        """Check collisions (Toroidal awareness)"""
        ship_radius = 3.0
        for asteroid in self.asteroids:
            _, _, distance = self._get_toroidal_vector(self.ship_x, self.ship_y, asteroid['x'], asteroid['y'])
            if distance < ship_radius + asteroid['radius']:
                self.ship_lives -= 1
                if self.ship_lives <= 0: break
                self.asteroids.remove(asteroid)
                break


def main():
    """Main training entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="NEAT AI Pilot Training")
    parser.add_argument("--population", type=int, default=50, help="Population size")
    parser.add_argument("--generations", type=int, default=50, help="Maximum generations")
    parser.add_argument("--load", type=str, help="Load existing network")
    parser.add_argument("--save", type=str, default="best_pilot_network.json", help="Save network filename")
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🧬 NEAT AI Pilot Training")
    print("=" * 40)
    print(f"Population: {args.population}")
    print(f"Generations: {args.generations}")
    print()
    
    # Create training loop
    training = TrainingLoop(args.population, args.generations)
    
    try:
        # Run training
        result = training.train()
        
        if result.success:
            stats = result.value
            
            print(f"\n🏆 Training Complete!")
            print(f"⏱️ Training time: {stats['training_time']:.1f}s")
            print(f"🎯 Best fitness: {stats['best_fitness_ever']:.2f}")
            print(f"📊 Generations: {stats['generations_completed']}")
            
            # Save best network
            save_result = training.save_best_genome(args.save)
            if save_result.success:
                print(f"💾 Best pilot saved to {args.save}")
            
            return 0
        else:
            print(f"❌ Training failed: {result.error}")
            return 1
            
    except KeyboardInterrupt:
        print("\n🛑 Training interrupted by user")
        return 0
    except Exception as e:
        print(f"💥 Training error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
