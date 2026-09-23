"""
Successor Registry - Genetic Pipeline for AI Evolution
ADR 208: Aggressor Architecture - Successor Protocol

Manages the parent-child relationship and genetic succession
for AI pilot evolution with automatic cloning and mutation.
"""

import json
import random
import math
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict
from loguru import logger

from foundation.types import Result


@dataclass
class ParentGenome:
    """Parent genome data for succession"""
    pilot_id: str
    generation: int
    fitness: float
    timestamp: float
    neural_network: Dict[str, Any]
    combat_stats: Dict[str, Any]
    success_traits: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ParentGenome':
        """Create from dictionary"""
        return cls(**data)


@dataclass
class SuccessionEvent:
    """Record of a succession event"""
    timestamp: float
    parent_id: str
    child_count: int
    mutation_rate: float
    reason: str  # "fitness_threshold", "parent_death", "manual"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SuccessionEvent':
        """Create from dictionary"""
        return cls(**data)


class SuccessorRegistry:
    """Manages genetic succession and parent-child relationships"""
    
    def __init__(self, registry_path: str = "src/foundation/persistence/successor_queue.json"):
        self.registry_path = Path(registry_path)
        self.parents: List[ParentGenome] = []
        self.succession_log: List[SuccessionEvent] = []
        
        # Configuration
        self.mutation_rate = 0.05  # 5% mutation rate
        self.fitness_threshold = 100.0  # Minimum fitness to become parent
        self.max_parents = 5  # Maximum number of parents to keep
        self.children_per_parent = 3  # Number of children to spawn
        
        # Statistics
        self.total_successions = 0
        self.total_mutations = 0
        
        # Load existing registry
        self.load_registry()
        
        logger.info(f"🧬 SuccessorRegistry initialized with {len(self.parents)} parents")
    
    def load_registry(self) -> Result[bool]:
        """Load successor registry from file"""
        try:
            if not self.registry_path.exists():
                # Create initial empty registry
                self._create_empty_registry()
                return Result.success_result(True)
            
            with open(self.registry_path, 'r') as f:
                data = json.load(f)
            
            # Load configuration
            self.mutation_rate = data.get('mutation_rate', 0.05)
            self.fitness_threshold = data.get('fitness_threshold', 100.0)
            
            # Load parents
            self.parents = []
            for parent_data in data.get('parents', []):
                parent = ParentGenome.from_dict(parent_data)
                self.parents.append(parent)
            
            # Load succession log
            self.succession_log = []
            for event_data in data.get('succession_log', []):
                event = SuccessionEvent.from_dict(event_data)
                self.succession_log.append(event)
            
            logger.info(f"📖 Loaded {len(self.parents)} parents from registry")
            return Result.success_result(True)
            
        except Exception as e:
            logger.error(f"Failed to load successor registry: {e}")
            return Result.failure_result(f"Failed to load registry: {e}")
    
    def save_registry(self) -> Result[bool]:
        """Save successor registry to file"""
        try:
            # Prepare data for serialization
            data = {
                'metadata': {
                    'version': '1.0',
                    'created': '2026-02-12',
                    'description': 'Successor Queue for Genetic Pipeline',
                    'total_parents': len(self.parents),
                    'last_updated': None  # Would add timestamp
                },
                'parents': [parent.to_dict() for parent in self.parents],
                'succession_log': [event.to_dict() for event in self.succession_log],
                'mutation_rate': self.mutation_rate,
                'fitness_threshold': self.fitness_threshold
            }
            
            # Ensure directory exists
            self.registry_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save to file
            with open(self.registry_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"💾 Saved {len(self.parents)} parents to registry")
            return Result.success_result(True)
            
        except Exception as e:
            logger.error(f"Failed to save successor registry: {e}")
            return Result.failure_result(f"Failed to save registry: {e}")
    
    def _create_empty_registry(self) -> None:
        """Create empty successor registry file"""
        data = {
            'metadata': {
                'version': '1.0',
                'created': '2026-02-12',
                'description': 'Successor Queue for Genetic Pipeline',
                'total_parents': 0,
                'last_updated': None
            },
            'parents': [],
            'succession_log': [],
            'mutation_rate': self.mutation_rate,
            'fitness_threshold': self.fitness_threshold
        }
        
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_parent(self, pilot_id: str, generation: int, fitness: float, 
                   neural_network: Dict[str, Any], combat_stats: Dict[str, Any],
                   success_traits: List[str]) -> Result[str]:
        """Add a parent to the registry"""
        try:
            # Check if pilot meets fitness threshold
            if fitness < self.fitness_threshold:
                return Result.failure_result(f"Fitness {fitness} below threshold {self.fitness_threshold}")
            
            # Create parent genome
            parent = ParentGenome(
                pilot_id=pilot_id,
                generation=generation,
                fitness=fitness,
                timestamp=time.time(),
                neural_network=neural_network,
                combat_stats=combat_stats,
                success_traits=success_traits
            )
            
            # Add to parents list
            self.parents.append(parent)
            
            # Sort by fitness (highest first)
            self.parents.sort(key=lambda p: p.fitness, reverse=True)
            
            # Limit to max parents
            if len(self.parents) > self.max_parents:
                removed = self.parents[self.max_parents:]
                self.parents = self.parents[:self.max_parents]
                logger.info(f"🗑️ Removed {len(removed)} lower-fitness parents")
            
            # Save registry
            self.save_registry()
            
            logger.info(f"👑 Added parent {pilot_id} (Gen {generation}) with fitness {fitness}")
            return Result.success_result(parent.pilot_id)
            
        except Exception as e:
            return Result.failure_result(f"Failed to add parent: {e}")
    
    def generate_successors(self, parent_id: str, count: int = None) -> Result[List[Dict[str, Any]]]:
        """Generate successor children from a parent"""
        try:
            # Find parent
            parent = None
            for p in self.parents:
                if p.pilot_id == parent_id:
                    parent = p
                    break
            
            if not parent:
                return Result.failure_result(f"Parent {parent_id} not found")
            
            # Determine number of children
            child_count = count or self.children_per_parent
            
            # Generate children
            children = []
            for i in range(child_count):
                child_genome = self._create_child_genome(parent, i)
                children.append(child_genome)
                self.total_mutations += 1
            
            # Log succession event
            event = SuccessionEvent(
                timestamp=time.time(),
                parent_id=parent_id,
                child_count=child_count,
                mutation_rate=self.mutation_rate,
                reason="fitness_threshold"
            )
            self.succession_log.append(event)
            self.total_successions += 1
            
            # Save registry
            self.save_registry()
            
            logger.info(f"🧬 Generated {child_count} successors from parent {parent_id}")
            return Result.success_result(children)
            
        except Exception as e:
            return Result.failure_result(f"Failed to generate successors: {e}")
    
    def _create_child_genome(self, parent: ParentGenome, child_index: int) -> Dict[str, Any]:
        """Create a child genome with mutations"""
        # Copy parent neural network
        child_network = self._mutate_neural_network(parent.neural_network)
        
        # Create child genome
        child_genome = {
            'pilot_id': f"{parent.pilot_id}_child_{child_index}",
            'generation': parent.generation + 1,
            'parent_id': parent.pilot_id,
            'neural_network': child_network,
            'inherited_traits': parent.success_traits.copy(),
            'mutations_applied': self.total_mutations
        }
        
        return child_genome
    
    def _mutate_neural_network(self, network: Dict[str, Any]) -> Dict[str, Any]:
        """Apply mutations to neural network weights"""
        mutated_network = {
            'num_inputs': network.get('num_inputs', 7),
            'num_hidden': network.get('num_hidden', 8),
            'num_outputs': network.get('num_outputs', 3),
            'weights_input_hidden': [],
            'weights_hidden_output': [],
            'bias_hidden': [],
            'bias_output': []
        }
        
        # Mutate input-hidden weights
        for weight_row in network.get('weights_input_hidden', []):
            mutated_row = []
            for weight in weight_row:
                # Apply mutation with probability
                if random.random() < self.mutation_rate:
                    # Add small random mutation
                    mutation = random.uniform(-0.1, 0.1)
                    new_weight = weight + mutation
                    # Clamp to reasonable range
                    new_weight = max(-1.0, min(1.0, new_weight))
                    mutated_row.append(new_weight)
                else:
                    mutated_row.append(weight)
            mutated_network['weights_input_hidden'].append(mutated_row)
        
        # Mutate hidden-output weights
        for weight_row in network.get('weights_hidden_output', []):
            mutated_row = []
            for weight in weight_row:
                if random.random() < self.mutation_rate:
                    mutation = random.uniform(-0.1, 0.1)
                    new_weight = weight + mutation
                    new_weight = max(-1.0, min(1.0, new_weight))
                    mutated_row.append(new_weight)
                else:
                    mutated_row.append(weight)
            mutated_network['weights_hidden_output'].append(mutated_row)
        
        # Mutate biases
        for bias in network.get('bias_hidden', []):
            if random.random() < self.mutation_rate:
                mutation = random.uniform(-0.1, 0.1)
                new_bias = bias + mutation
                new_bias = max(-1.0, min(1.0, new_bias))
                mutated_network['bias_hidden'].append(new_bias)
            else:
                mutated_network['bias_hidden'].append(bias)
        
        for bias in network.get('bias_output', []):
            if random.random() < self.mutation_rate:
                mutation = random.uniform(-0.1, 0.1)
                new_bias = bias + mutation
                new_bias = max(-1.0, min(1.0, new_bias))
                mutated_network['bias_output'].append(new_bias)
            else:
                mutated_network['bias_output'].append(bias)
        
        return mutated_network
    
    def get_best_parent(self) -> Optional[ParentGenome]:
        """Get the best parent (highest fitness)"""
        if not self.parents:
            return None
        return self.parents[0]  # Sorted by fitness, highest first
    
    def get_parents_by_fitness(self, min_fitness: float = 0.0) -> List[ParentGenome]:
        """Get parents above minimum fitness threshold"""
        return [p for p in self.parents if p.fitness >= min_fitness]
    
    def check_for_succession(self, pilot_id: str, fitness: float, generation: int,
                           neural_network: Dict[str, Any], combat_stats: Dict[str, Any]) -> Result[bool]:
        """Check if pilot should trigger succession"""
        try:
            # Check if pilot meets fitness threshold
            if fitness >= self.fitness_threshold:
                # Identify success traits
                success_traits = self._identify_success_traits(combat_stats)
                
                # Add as parent
                result = self.add_parent(
                    pilot_id=pilot_id,
                    generation=generation,
                    fitness=fitness,
                    neural_network=neural_network,
                    combat_stats=combat_stats,
                    success_traits=success_traits
                )
                
                if result.success:
                    # Generate successors
                    self.generate_successors(pilot_id)
                    return Result.success_result(True)
            
            return Result.success_result(False)
            
        except Exception as e:
            return Result.failure_result(f"Succession check failed: {e}")
    
    def _identify_success_traits(self, combat_stats: Dict[str, Any]) -> List[str]:
        """Identify successful traits from combat statistics"""
        traits = []
        
        # Combat efficiency
        efficiency = combat_stats.get('combat_efficiency', 0.0)
        if efficiency > 0.5:
            traits.append('high_efficiency')
        
        # Aggression
        shots_fired = combat_stats.get('shots_fired', 0)
        if shots_fired > 10:
            traits.append('aggressive')
        
        # Survival
        collisions = combat_stats.get('collisions', 0)
        if collisions < 5:
            traits.append('careful')
        
        # Collection
        scrap_collected = combat_stats.get('scrap_collected', 0)
        if scrap_collected > 20:
            traits.append('collector')
        
        # Destruction
        asteroids_destroyed = combat_stats.get('asteroids_destroyed', 0)
        if asteroids_destroyed > 5:
            traits.append('destroyer')
        
        return traits
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics"""
        if not self.parents:
            return {
                'total_parents': 0,
                'total_successions': self.total_successions,
                'total_mutations': self.total_mutations,
                'average_fitness': 0.0,
                'best_fitness': 0.0
            }
        
        fitnesses = [p.fitness for p in self.parents]
        
        return {
            'total_parents': len(self.parents),
            'total_successions': self.total_successions,
            'total_mutations': self.total_mutations,
            'average_fitness': sum(fitnesses) / len(fitnesses),
            'best_fitness': max(fitnesses),
            'fitness_threshold': self.fitness_threshold,
            'mutation_rate': self.mutation_rate,
            'recent_successions': len([e for e in self.succession_log if time.time() - e.timestamp < 300])  # Last 5 minutes
        }
    
    def clear_registry(self) -> Result[bool]:
        """Clear all parents and succession log"""
        try:
            self.parents.clear()
            self.succession_log.clear()
            self.total_successions = 0
            self.total_mutations = 0
            
            # Save empty registry
            self.save_registry()
            
            logger.info("🧹 Successor registry cleared")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Failed to clear registry: {e}")


# Factory function
def create_successor_registry() -> SuccessorRegistry:
    """Create a new successor registry instance"""
    return SuccessorRegistry()


# Test function
def test_successor_registry():
    """Test the successor registry functionality"""
    import time
    
    # Create registry
    registry = create_successor_registry()
    
    # Create mock neural network
    mock_network = {
        'num_inputs': 7,
        'num_hidden': 8,
        'num_outputs': 3,
        'weights_input_hidden': [[random.uniform(-1, 1) for _ in range(8)] for _ in range(7)],
        'weights_hidden_output': [[random.uniform(-1, 1) for _ in range(3)] for _ in range(8)],
        'bias_hidden': [random.uniform(-1, 1) for _ in range(8)],
        'bias_output': [random.uniform(-1, 1) for _ in range(3)]
    }
    
    # Create mock combat stats
    mock_stats = {
        'shots_fired': 25,
        'combat_efficiency': 0.8,
        'collisions': 2,
        'scrap_collected': 15,
        'asteroids_destroyed': 8
    }
    
    # Test adding a parent
    print("Testing parent addition...")
    result = registry.add_parent(
        pilot_id="test_pilot",
        generation=1,
        fitness=150.0,
        neural_network=mock_network,
        combat_stats=mock_stats,
        success_traits=['aggressive', 'destroyer']
    )
    print(f"Parent addition: {result.success}")
    
    # Test succession
    print("\nTesting succession...")
    result = registry.generate_successors("test_pilot")
    if result.success:
        children = result.value
        print(f"Generated {len(children)} children")
        for i, child in enumerate(children):
            print(f"  Child {i}: {child['pilot_id']}")
    
    # Test statistics
    print("\nRegistry statistics:")
    stats = registry.get_registry_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print("\nSuccessor registry test complete!")


if __name__ == "__main__":
    test_successor_registry()
