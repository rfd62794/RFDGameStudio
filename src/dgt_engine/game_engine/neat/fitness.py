"""
Fitness Calculator - Performance Evaluation for NEAT Evolution
Calculates fitness scores based on survival time and performance metrics
"""

import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from loguru import logger

from dgt_engine.foundation.types import Result


@dataclass
class FitnessMetrics:
    """Fitness evaluation metrics"""
    survival_time: float
    asteroids_destroyed: int
    bullets_fired: int
    accuracy: float
    near_misses: int
    distance_traveled: float
    energy_efficiency: float


class FitnessCalculator:
    """Calculates fitness scores for NEAT evolution"""
    
    def __init__(self):
        self.start_time = 0.0
        self.initial_energy = 100.0
        self.metrics = FitnessMetrics(
            survival_time=0.0,
            asteroids_destroyed=0,
            bullets_fired=0,
            accuracy=0.0,
            near_misses=0,
            distance_traveled=0.0,
            energy_efficiency=0.0
        )
        
        # Tracking variables
        self.last_position = (0.0, 0.0)
        self.energy_used = 0.0
        self.shots_hit = 0
        
        logger.info("🎯 FitnessCalculator initialized")
    
    def start_evaluation(self, initial_position: Tuple[float, float], initial_energy: float = 100.0) -> None:
        """Start fitness evaluation"""
        self.start_time = time.time()
        self.initial_energy = initial_energy
        self.last_position = initial_position
        self.energy_used = 0.0
        self.shots_hit = 0
        
        # Reset metrics
        self.metrics = FitnessMetrics(
            survival_time=0.0,
            asteroids_destroyed=0,
            bullets_fired=0,
            accuracy=0.0,
            near_misses=0,
            distance_traveled=0.0,
            energy_efficiency=0.0
        )
        
        logger.debug("🚀 Started fitness evaluation")
    
    def update_metrics(self, current_position: Tuple[float, float], current_energy: float,
                      asteroids_destroyed: int = 0, bullets_fired: int = 0, 
                      shots_hit: int = 0, near_misses: int = 0) -> None:
        """Update fitness metrics during evaluation"""
        current_time = time.time()
        
        # Update survival time
        self.metrics.survival_time = current_time - self.start_time
        
        # Update performance metrics
        self.metrics.asteroids_destroyed += asteroids_destroyed
        self.metrics.bullets_fired += bullets_fired
        self.shots_hit += shots_hit
        self.metrics.near_misses += near_misses
        
        # Calculate distance traveled
        dx = current_position[0] - self.last_position[0]
        dy = current_position[1] - self.last_position[1]
        distance = math.sqrt(dx**2 + dy**2)
        self.metrics.distance_traveled += distance
        self.last_position = current_position
        
        # Calculate energy used
        self.energy_used = max(0, self.initial_energy - current_energy)
        
        # Calculate accuracy
        if self.metrics.bullets_fired > 0:
            self.metrics.accuracy = self.shots_hit / self.metrics.bullets_fired
        
        # Calculate energy efficiency
        if self.energy_used > 0:
            self.metrics.energy_efficiency = self.metrics.asteroids_destroyed / self.energy_used
    
    def calculate_fitness(self) -> float:
        """Calculate overall fitness score"""
        # Primary fitness components
        survival_score = self.metrics.survival_time * 1.0
        destruction_score = self.metrics.asteroids_destroyed * 10.0
        
        # Secondary fitness components (bonuses)
        accuracy_bonus = 0.0
        if self.metrics.accuracy > 0.5:  # Good accuracy bonus
            accuracy_bonus = self.metrics.accuracy * 5.0
        
        efficiency_bonus = 0.0
        if self.metrics.energy_efficiency > 0.1:  # Energy efficiency bonus
            efficiency_bonus = self.metrics.energy_efficiency * 20.0
        
        near_miss_bonus = self.metrics.near_misses * 2.0  # Risk-taking bonus
        
        # Penalty for excessive shooting (machine gun prevention)
        shooting_penalty = 0.0
        if self.metrics.bullets_fired > 100:  # Too many shots
            excess_shots = self.metrics.bullets_fired - 100
            shooting_penalty = excess_shots * 0.1
        
        # Total fitness
        total_fitness = (
            survival_score + 
            destruction_score + 
            accuracy_bonus + 
            efficiency_bonus + 
            near_miss_bonus - 
            shooting_penalty
        )
        
        # Ensure fitness is non-negative
        total_fitness = max(0.0, total_fitness)
        
        logger.debug(f"🎯 Fitness calculated: {total_fitness:.2f}")
        return total_fitness
    
    def get_detailed_fitness(self) -> Dict[str, Any]:
        """Get detailed fitness breakdown"""
        fitness = self.calculate_fitness()
        
        return {
            'total_fitness': fitness,
            'survival_score': self.metrics.survival_time * 1.0,
            'destruction_score': self.metrics.asteroids_destroyed * 10.0,
            'accuracy_bonus': self.metrics.accuracy * 5.0 if self.metrics.accuracy > 0.5 else 0.0,
            'efficiency_bonus': self.metrics.energy_efficiency * 20.0 if self.metrics.energy_efficiency > 0.1 else 0.0,
            'near_miss_bonus': self.metrics.near_misses * 2.0,
            'shooting_penalty': max(0, (self.metrics.bullets_fired - 100) * 0.1),
            'metrics': {
                'survival_time': self.metrics.survival_time,
                'asteroids_destroyed': self.metrics.asteroids_destroyed,
                'bullets_fired': self.metrics.bullets_fired,
                'accuracy': self.metrics.accuracy,
                'near_misses': self.metrics.near_misses,
                'distance_traveled': self.metrics.distance_traveled,
                'energy_efficiency': self.metrics.energy_efficiency
            }
        }
    
    def evaluate_genome(self, network, game_simulation: callable) -> Result[Tuple[float, float]]:
        """Evaluate a single genome using game simulation"""
        try:
            # Reset calculator
            self.start_evaluation((80.0, 72.0), 100.0)
            
            # Run game simulation
            result = game_simulation(network)
            
            if not result.success:
                return Result(success=False, error=f"Game simulation failed: {result.error}")
            
            # Get final metrics from simulation
            final_metrics = result.value
            
            # Update with final metrics
            self.update_metrics(
                current_position=final_metrics.get('position', (80.0, 72.0)),
                current_energy=final_metrics.get('energy', 0.0),
                asteroids_destroyed=final_metrics.get('asteroids_destroyed', 0),
                bullets_fired=final_metrics.get('bullets_fired', 0),
                shots_hit=final_metrics.get('shots_hit', 0),
                near_misses=final_metrics.get('near_misses', 0)
            )
            
            # Calculate fitness
            fitness = self.calculate_fitness()
            
            # Return survival time and asteroids destroyed for genome fitness calculation
            return Result(success=True, value=(self.metrics.survival_time, self.metrics.asteroids_destroyed))
            
        except Exception as e:
            return Result(success=False, error=f"Genome evaluation failed: {e}")


# Factory function
def create_fitness_calculator() -> FitnessCalculator:
    """Create fitness calculator with default parameters"""
    return FitnessCalculator()
