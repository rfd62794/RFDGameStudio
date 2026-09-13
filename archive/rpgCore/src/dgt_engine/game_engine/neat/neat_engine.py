"""
NEAT Engine - Neural Network Evolution for AI Pilot
Implements neuroevolution for autonomous asteroid navigation
"""

import random
import math
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from loguru import logger

from dgt_engine.foundation.types import Result


@dataclass
class NeuralNetwork:
    """Simple feed-forward neural network for AI pilot"""
    
    def __init__(self, num_inputs: int = 7, num_hidden: int = 8, num_outputs: int = 3):
        self.num_inputs = num_inputs
        self.num_hidden = num_hidden
        self.num_outputs = num_outputs
        
        # Initialize weights with small random values
        self.weights_input_hidden = [[random.uniform(-1, 1) for _ in range(num_hidden)] 
                                   for _ in range(num_inputs)]
        self.weights_hidden_output = [[random.uniform(-1, 1) for _ in range(num_outputs)] 
                                     for _ in range(num_hidden)]
        
        # Initialize biases
        self.bias_hidden = [random.uniform(-1, 1) for _ in range(num_hidden)]
        self.bias_output = [random.uniform(-1, 1) for _ in range(num_outputs)]
        
        # Activation functions
        self.activation_hidden = lambda x: max(0, x)  # ReLU for hidden
        self.activation_output = lambda x: math.tanh(x)  # Tanh for control outputs
    
    def forward(self, inputs: List[float]) -> List[float]:
        """Forward pass through the network"""
        if len(inputs) != self.num_inputs:
            raise ValueError(f"Expected {self.num_inputs} inputs, got {len(inputs)}")
        
        # Hidden layer
        hidden = []
        for i in range(self.num_hidden):
            weighted_sum = self.bias_hidden[i]
            for j in range(self.num_inputs):
                weighted_sum += inputs[j] * self.weights_input_hidden[j][i]
            hidden.append(self.activation_hidden(weighted_sum))
        
        # Output layer
        outputs = []
        for i in range(self.num_outputs):
            weighted_sum = self.bias_output[i]
            for j in range(self.num_hidden):
                weighted_sum += hidden[j] * self.weights_hidden_output[j][i]
            outputs.append(self.activation_output(weighted_sum))
        
        return outputs
    
    def mutate(self, mutation_rate: float = 0.1, mutation_strength: float = 0.5) -> None:
        """Mutate the network weights and biases"""
        # Weights
        for i in range(self.num_inputs):
            for j in range(self.num_hidden):
                if random.random() < mutation_rate:
                    self.weights_input_hidden[i][j] += random.uniform(-1, 1) * mutation_strength
        
        for i in range(self.num_hidden):
            for j in range(self.num_outputs):
                if random.random() < mutation_rate:
                    self.weights_hidden_output[i][j] += random.uniform(-1, 1) * mutation_strength
        
        # Biases
        for i in range(self.num_hidden):
            if random.random() < mutation_rate:
                self.bias_hidden[i] += random.uniform(-1, 1) * mutation_strength
        
        for i in range(self.num_outputs):
            if random.random() < mutation_rate:
                self.bias_output[i] += random.uniform(-1, 1) * mutation_strength

    def mutate_structure(self, chance: float = 0.05) -> bool:
        """Structural mutation: Add a new hidden node (5% default chance)"""
        if random.random() > chance:
            return False
            
        # Add a new hidden node
        self.num_hidden += 1
        
        # New input->hidden weights (initially 0 to avoid chaos)
        for i in range(self.num_inputs):
            self.weights_input_hidden[i].append(0.0)
            
        # New hidden->output weights
        self.weights_hidden_output.append([random.uniform(-0.1, 0.1) for _ in range(self.num_outputs)])
        
        # New bias
        self.bias_hidden.append(0.0)
        
        logger.info(f"🧬 Brain Evolution: Added new hidden node. Current complexity: {self.num_hidden}")
        return True
    
    def crossover(self, other: 'NeuralNetwork') -> 'NeuralNetwork':
        """Create offspring through structural alignment crossover"""
        # Determine child size (take the more complex one)
        num_hidden = max(self.num_hidden, other.num_hidden)
        child = NeuralNetwork(self.num_inputs, num_hidden, self.num_outputs)
        
        # Crossover input-hidden weights
        for i in range(self.num_inputs):
            for j in range(num_hidden):
                has_self = j < self.num_hidden
                has_other = j < other.num_hidden
                
                if has_self and has_other:
                    child.weights_input_hidden[i][j] = self.weights_input_hidden[i][j] if random.random() < 0.5 else other.weights_input_hidden[i][j]
                elif has_self:
                    child.weights_input_hidden[i][j] = self.weights_input_hidden[i][j]
                else: # has_other must be true
                    child.weights_input_hidden[i][j] = other.weights_input_hidden[i][j]
        
        # Crossover hidden-output weights
        for i in range(num_hidden):
            for j in range(self.num_outputs):
                has_self = i < self.num_hidden
                has_other = i < other.num_hidden
                
                if has_self and has_other:
                    child.weights_hidden_output[i][j] = self.weights_hidden_output[i][j] if random.random() < 0.5 else other.weights_hidden_output[i][j]
                elif has_self:
                    child.weights_hidden_output[i][j] = self.weights_hidden_output[i][j]
                else:
                    child.weights_hidden_output[i][j] = other.weights_hidden_output[i][j]
        
        # Crossover biases
        for i in range(num_hidden):
            has_self = i < self.num_hidden
            has_other = i < other.num_hidden
            
            if has_self and has_other:
                child.bias_hidden[i] = self.bias_hidden[i] if random.random() < 0.5 else other.bias_hidden[i]
            elif has_self:
                child.bias_hidden[i] = self.bias_hidden[i]
            else:
                child.bias_hidden[i] = other.bias_hidden[i]
        
        for i in range(self.num_outputs):
            child.bias_output[i] = self.bias_output[i] if random.random() < 0.5 else other.bias_output[i]
        
        return child
    
    def copy(self) -> 'NeuralNetwork':
        """Create a deep copy of the network"""
        copy = NeuralNetwork(self.num_inputs, self.num_hidden, self.num_outputs)
        copy.weights_input_hidden = [row[:] for row in self.weights_input_hidden]
        copy.weights_hidden_output = [row[:] for row in self.weights_hidden_output]
        copy.bias_hidden = self.bias_hidden[:]
        copy.bias_output = self.bias_output[:]
        return copy


@dataclass
class Genome:
    """Genome representing a neural network with fitness"""
    
    def __init__(self, network: NeuralNetwork, fitness: float = 0.0):
        self.network = network
        self.fitness = fitness
        self.generation = 0
    
    def calculate_fitness(self, survival_time: float, asteroids_destroyed: int, scrap_collected: int = 0) -> None:
        """Calculate fitness based on performance metrics"""
        # Fitness = (SurvivalTime × 1.0) + (RocksDestroyed × 10.0) + (Scrap × 20.0)
        self.fitness = survival_time + (asteroids_destroyed * 10.0) + (scrap_collected * 20.0)
    
    def mutate(self, mutation_rate: float = 0.1, mutation_strength: float = 0.5) -> None:
        """Mutate the genome's neural network (parameters + structure)"""
        self.network.mutate(mutation_rate, mutation_strength)
        self.network.mutate_structure(chance=0.05)  # 5% chance to grow brain
    
    def copy(self) -> 'Genome':
        """Create a deep copy of the genome"""
        return Genome(self.network.copy(), self.fitness)


class NEATEngine:
    """NEAT evolution engine for training AI pilots"""
    
    def __init__(self, population_size: int = 50, num_inputs: int = 7, num_outputs: int = 3):
        self.population_size = population_size
        self.num_inputs = num_inputs
        self.num_outputs = num_outputs
        
        self.population: List[Genome] = []
        self.generation = 0
        self.best_genome: Optional[Genome] = None
        self.best_fitness_ever = 0.0
        
        # Evolution parameters
        self.mutation_rate = 0.1
        self.mutation_strength = 0.5
        self.elitism_count = 2  # Keep top 2 genomes
        
        logger.info(f"🧠 NEATEngine initialized with population size {population_size}, inputs {num_inputs}")
    
    def initialize_population(self) -> Result[bool]:
        """Initialize random population"""
        try:
            self.population = []
            
            for _ in range(self.population_size):
                network = NeuralNetwork(num_inputs=self.num_inputs, num_hidden=8, num_outputs=self.num_outputs)
                genome = Genome(network, fitness=0.0)
                genome.generation = 0
                self.population.append(genome)
            
            self.generation = 0
            self.best_genome = None
            self.best_fitness_ever = 0.0
            
            logger.info(f"✅ Initialized population with {len(self.population)} genomes")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to initialize population: {e}")
    
    def evaluate_population(self, fitness_function: callable) -> Result[Dict[str, Any]]:
        """Evaluate entire population using fitness function"""
        try:
            fitness_scores = []
            
            for genome in self.population:
                # Run fitness function (should return survival_time, asteroids_destroyed, scrap_collected)
                result = fitness_function(genome.network)
                
                if result.success:
                    survival_time, asteroids_destroyed, scrap_collected = result.value
                    genome.calculate_fitness(survival_time, asteroids_destroyed, scrap_collected)
                    fitness_scores.append(genome.fitness)
                else:
                    genome.fitness = 0.0
                    fitness_scores.append(0.0)
                    logger.error(f"Fitness evaluation failed: {result.error}")
            
            # Update best genome
            current_best = max(self.population, key=lambda g: g.fitness)
            if current_best.fitness > self.best_fitness_ever:
                self.best_genome = current_best.copy()
                self.best_fitness_ever = current_best.fitness
                logger.info(f"🏆 New best fitness: {self.best_fitness_ever:.2f}")
            
            # Calculate statistics
            avg_fitness = sum(fitness_scores) / len(fitness_scores)
            max_fitness = max(fitness_scores)
            min_fitness = min(fitness_scores)
            
            stats = {
                'generation': self.generation,
                'avg_fitness': avg_fitness,
                'max_fitness': max_fitness,
                'min_fitness': min_fitness,
                'best_fitness_ever': self.best_fitness_ever,
                'population_size': len(self.population)
            }
            
            logger.info(f"📊 Generation {self.generation} stats: avg={avg_fitness:.2f}, max={max_fitness:.2f}")
            return Result(success=True, value=stats)
            
        except Exception as e:
            return Result(success=False, error=f"Population evaluation failed: {e}")
    
    def evolve_population(self) -> Result[Dict[str, Any]]:
        """Evolve population to next generation"""
        try:
            # Sort population by fitness (descending)
            self.population.sort(key=lambda g: g.fitness, reverse=True)
            
            # Keep elite genomes
            new_population = []
            elite_count = min(self.elitism_count, len(self.population))
            
            for i in range(elite_count):
                elite_genome = self.population[i].copy()
                elite_genome.generation = self.generation + 1
                new_population.append(elite_genome)
            
            # Create offspring through tournament selection and crossover
            while len(new_population) < self.population_size:
                # Tournament selection
                parent1 = self._tournament_selection()
                parent2 = self._tournament_selection()
                
                # Crossover
                child_network = parent1.network.crossover(parent2.network)
                child_genome = Genome(child_network, fitness=0.0)
                child_genome.generation = self.generation + 1
                
                # Mutation
                child_genome.mutate(self.mutation_rate, self.mutation_strength)
                
                new_population.append(child_genome)
            
            self.population = new_population
            self.generation += 1
            
            logger.info(f"🧬 Evolved to generation {self.generation}")
            
            return Result(success=True, value={
                'generation': self.generation,
                'population_size': len(self.population)
            })
            
        except Exception as e:
            return Result(success=False, error=f"Population evolution failed: {e}")
    
    def _tournament_selection(self, tournament_size: int = 3) -> Genome:
        """Select parent using tournament selection"""
        tournament = random.sample(self.population, min(tournament_size, len(self.population)))
        return max(tournament, key=lambda g: g.fitness)
    
    def get_best_genome(self) -> Optional[Genome]:
        """Get the best genome from current population"""
        if not self.population:
            return None
        
        return max(self.population, key=lambda g: g.fitness)
    
    def get_network_inputs(self, ship_state: Dict, asteroids: List[Dict]) -> List[float]:
        """Prepare neural network inputs from game state"""
        # Find nearest asteroid
        nearest_asteroid = None
        min_distance = float('inf')
        
        for asteroid in asteroids:
            distance = math.sqrt((ship_state['x'] - asteroid['x'])**2 + 
                               (ship_state['y'] - asteroid['y'])**2)
            if distance < min_distance:
                min_distance = distance
                nearest_asteroid = asteroid
        
        if nearest_asteroid is None:
            # No asteroids, return neutral inputs
            return [0.0, 0.0, ship_state['vx'], ship_state['vy'], ship_state['angle']]
        
        # Calculate inputs
        dx = nearest_asteroid['x'] - ship_state['x']
        dy = nearest_asteroid['y'] - ship_state['y']
        distance = math.sqrt(dx**2 + dy**2)
        
        # Normalize inputs
        # Input 1: Distance to nearest asteroid (normalized)
        distance_input = min(distance / 100.0, 1.0)  # Normalize to 0-1
        
        # Input 2: Angle to nearest asteroid (normalized to -1 to 1)
        angle_to_asteroid = math.atan2(dy, dx)
        angle_input = math.sin(angle_to_asteroid - ship_state['angle'])
        
        # Input 3: Ship velocity X (normalized)
        vx_input = ship_state['vx'] / 100.0
        
        # Input 4: Ship velocity Y (normalized)
        vy_input = ship_state['vy'] / 100.0
        
        # Input 5: Ship heading (normalized)
        heading_input = math.sin(ship_state['angle'])
        
        return [distance_input, angle_input, vx_input, vy_input, heading_input]
    
    def interpret_network_outputs(self, outputs: List[float]) -> Dict[str, float]:
        """Interpret neural network outputs as control inputs"""
        # Output 0: Thrust (-1 to 1)
        thrust = max(-1.0, min(1.0, outputs[0]))
        
        # Output 1: Rotation (-1 to 1, negative = left, positive = right)
        rotation = max(-1.0, min(1.0, outputs[1]))
        
        # Output 2: Fire weapon (0 to 1, threshold at 0.5)
        fire_weapon = outputs[2] > 0.5
        
        return {
            'thrust': thrust,
            'rotation': rotation,
            'fire_weapon': fire_weapon
        }
    
    def get_status(self) -> Dict[str, Any]:
        """Get NEAT engine status"""
        return {
            'generation': self.generation,
            'population_size': len(self.population),
            'best_fitness_ever': self.best_fitness_ever,
            'best_genome_fitness': self.best_genome.fitness if self.best_genome else 0.0,
            'mutation_rate': self.mutation_rate,
            'mutation_strength': self.mutation_strength,
            'elitism_count': self.elitism_count
        }


# Factory function
def create_neat_engine(population_size: int = 50, num_inputs: int = 7, num_outputs: int = 3) -> NEATEngine:
    """Create NEAT engine with default parameters"""
    engine = NEATEngine(population_size, num_inputs, num_outputs)
    engine.initialize_population()
    return engine
