"""
Tri-Brain Architecture - Specialized Neural Sub-Systems
ADR 209: Tri-Brain Model - Cognitive Dissonance Handling

Splits monolithic neural network into three specialized nodes:
Survivor (avoidance), Predator (combat), and Scavenger (collection).
Arbiter system weighs conflicting intents for final action.
"""

import math
import random
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from loguru import logger

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT


@dataclass
class BrainNodeOutput:
    """Output from a brain node"""
    thrust: float  # -1 to 1
    rotation: float  # -1 to 1
    fire_weapon: float  # 0 to 1
    confidence: float  # 0 to 1
    intent: str  # Description of intent
    priority: float  # 0 to 1, higher = more important


class AvoidanceNet:
    """Survivor brain node - focuses on avoiding danger"""
    
    def __init__(self):
        self.num_inputs = 8  # 8-ray spatial scan
        self.num_hidden = 6
        self.num_outputs = 3
        
        # Initialize weights
        self.weights_input_hidden = [[random.uniform(-1, 1) for _ in range(self.num_hidden)] 
                                   for _ in range(self.num_inputs)]
        self.weights_hidden_output = [[random.uniform(-1, 1) for _ in range(self.num_outputs)] 
                                     for _ in range(self.num_hidden)]
        self.bias_hidden = [random.uniform(-1, 1) for _ in range(self.num_hidden)]
        self.bias_output = [random.uniform(-1, 1) for _ in range(self.num_outputs)]
        
        logger.debug("🧠 AvoidanceNet initialized")
    
    def process(self, spatial_scan: List[float], threat_distance: float) -> BrainNodeOutput:
        """Process spatial scan and threat information"""
        try:
            # Forward propagation
            hidden = []
            for i in range(self.num_hidden):
                activation = self.bias_hidden[i]
                for j in range(self.num_inputs):
                    activation += spatial_scan[j] * self.weights_input_hidden[j][i]
                hidden.append(self._tanh(activation))
            
            # Output layer
            outputs = []
            for i in range(self.num_outputs):
                activation = self.bias_output[i]
                for j in range(self.num_hidden):
                    activation += hidden[j] * self.weights_hidden_output[j][i]
                outputs.append(self._tanh(activation))
            
            # Convert to control outputs
            thrust = outputs[0]
            rotation = outputs[1]
            fire_weapon = max(0, outputs[2])  # Avoidance net rarely fires
            
            # Calculate confidence based on threat level
            confidence = min(1.0, threat_distance / 50.0)  # Higher confidence when threats are far
            
            # Priority based on immediate danger
            priority = 1.0 - (threat_distance / 100.0)  # Higher priority when close to danger
            
            intent = "Avoid danger"
            if threat_distance < 20:
                intent = "Evasive maneuver - Critical!"
            elif threat_distance < 40:
                intent = "Evasive maneuver"
            
            return BrainNodeOutput(
                thrust=thrust,
                rotation=rotation,
                fire_weapon=fire_weapon,
                confidence=confidence,
                intent=intent,
                priority=priority
            )
            
        except Exception as e:
            logger.error(f"AvoidanceNet processing failed: {e}")
            return BrainNodeOutput(0, 0, 0, 0, "Error", 0)
    
    def _tanh(self, x: float) -> float:
        """Tanh activation function"""
        return math.tanh(x)


class CombatNet:
    """Predator brain node - focuses on combat"""
    
    def __init__(self):
        self.num_inputs = 7  # Target vector + crosshair
        self.num_hidden = 8
        self.num_outputs = 3
        
        # Initialize weights
        self.weights_input_hidden = [[random.uniform(-1, 1) for _ in range(self.num_hidden)] 
                                   for _ in range(self.num_inputs)]
        self.weights_hidden_output = [[random.uniform(-1, 1) for _ in range(self.num_outputs)] 
                                     for _ in range(self.num_hidden)]
        self.bias_hidden = [random.uniform(-1, 1) for _ in range(self.num_hidden)]
        self.bias_output = [random.uniform(-1, 1) for _ in range(self.num_outputs)]
        
        logger.debug("🧠 CombatNet initialized")
    
    def process(self, target_vector: List[float], crosshair: float, energy: float) -> BrainNodeOutput:
        """Process target information for combat"""
        try:
            # Forward propagation
            hidden = []
            for i in range(self.num_hidden):
                activation = self.bias_hidden[i]
                for j in range(self.num_inputs):
                    activation += target_vector[j] * self.weights_input_hidden[j][i]
                hidden.append(self._tanh(activation))
            
            # Output layer
            outputs = []
            for i in range(self.num_outputs):
                activation = self.bias_output[i]
                for j in range(self.num_hidden):
                    activation += hidden[j] * self.weights_hidden_output[j][i]
                outputs.append(self._tanh(activation))
            
            # Convert to control outputs
            thrust = outputs[0]
            rotation = outputs[1]
            fire_weapon = max(0, outputs[2] + crosshair * 0.5)  # Boost fire when in crosshair
            
            # Calculate confidence based on target acquisition
            confidence = crosshair  # Higher confidence when target is in crosshair
            
            # Priority based on combat readiness
            priority = 0.7  # Combat has medium priority by default
            if energy > 50:
                priority = 0.8  # Higher priority when have energy
            if crosshair > 0.8:
                priority = 0.9  # Very high priority when perfect shot
            
            intent = "Engage target"
            if fire_weapon > 0.5:
                intent = "Fire on target"
            elif crosshair > 0.5:
                intent = "Acquire target"
            else:
                intent = "Search for targets"
            
            return BrainNodeOutput(
                thrust=thrust,
                rotation=rotation,
                fire_weapon=fire_weapon,
                confidence=confidence,
                intent=intent,
                priority=priority
            )
            
        except Exception as e:
            logger.error(f"CombatNet processing failed: {e}")
            return BrainNodeOutput(0, 0, 0, 0, "Error", 0)
    
    def _tanh(self, x: float) -> float:
        """Tanh activation function"""
        return math.tanh(x)


class ResourceNet:
    """Scavenger brain node - focuses on resource collection"""
    
    def __init__(self):
        self.num_inputs = 6  # Scrap vector + energy
        self.num_hidden = 6
        self.num_outputs = 3
        
        # Initialize weights
        self.weights_input_hidden = [[random.uniform(-1, 1) for _ in range(self.num_hidden)] 
                                   for _ in range(self.num_inputs)]
        self.weights_hidden_output = [[random.uniform(-1, 1) for _ in range(self.num_outputs)] 
                                     for _ in range(self.num_hidden)]
        self.bias_hidden = [random.uniform(-1, 1) for _ in range(self.num_hidden)]
        self.bias_output = [random.uniform(-1, 1) for _ in range(self.num_outputs)]
        
        logger.debug("🧠 ResourceNet initialized")
    
    def process(self, scrap_vector: List[float], energy: float) -> BrainNodeOutput:
        """Process scrap information for collection"""
        try:
            # Forward propagation
            hidden = []
            for i in range(self.num_hidden):
                activation = self.bias_hidden[i]
                for j in range(self.num_inputs):
                    activation += scrap_vector[j] * self.weights_input_hidden[j][i]
                hidden.append(self._tanh(activation))
            
            # Output layer
            outputs = []
            for i in range(self.num_outputs):
                activation = self.bias_output[i]
                for j in range(self.num_hidden):
                    activation += hidden[j] * self.weights_hidden_output[j][i]
                outputs.append(self._tanh(activation))
            
            # Convert to control outputs
            thrust = outputs[0]
            rotation = outputs[1]
            fire_weapon = max(0, outputs[2])  # Resource net rarely fires
            
            # Calculate confidence based on scrap availability
            confidence = min(1.0, scrap_vector[0] / 100.0)  # Based on distance to nearest scrap
            
            # Priority based on energy needs
            priority = 0.5  # Resource collection has lower priority by default
            if energy < 30:
                priority = 0.9  # High priority when low on energy
            elif energy < 60:
                priority = 0.7  # Medium priority when moderate energy
            
            intent = "Collect resources"
            if energy < 30:
                intent = "Critical - Need resources!"
            elif scrap_vector[0] < 30:
                intent = "Nearby resource detected"
            else:
                intent = "Search for resources"
            
            return BrainNodeOutput(
                thrust=thrust,
                rotation=rotation,
                fire_weapon=fire_weapon,
                confidence=confidence,
                intent=intent,
                priority=priority
            )
            
        except Exception as e:
            logger.error(f"ResourceNet processing failed: {e}")
            return BrainNodeOutput(0, 0, 0, 0, "Error", 0)
    
    def _tanh(self, x: float) -> float:
        """Tanh activation function"""
        return math.tanh(x)


class Arbiter:
    """Frontal lobe - weighs conflicting brain node outputs"""
    
    def __init__(self):
        self.decision_history = []
        self.max_history = 100
        
        # Weighting factors for different situations
        self.survival_weight = 1.0  # Survival always gets full weight
        self.combat_weight = 0.8
        self.resource_weight = 0.6
        
        logger.debug("🧠 Arbiter initialized")
    
    def arbitrate(self, avoidance_output: BrainNodeOutput, 
                  combat_output: BrainNodeOutput, 
                  resource_output: BrainNodeOutput) -> BrainNodeOutput:
        """Arbitrate between conflicting brain node outputs"""
        try:
            # Create list of outputs with their effective priorities
            candidates = [
                (avoidance_output, avoidance_output.priority * self.survival_weight),
                (combat_output, combat_output.priority * self.combat_weight),
                (resource_output, resource_output.priority * self.resource_weight)
            ]
            
            # Sort by effective priority (highest first)
            candidates.sort(key=lambda x: x[1], reverse=True)
            
            # Select winner
            winner_output, winner_priority = candidates[0]
            
            # Create blended output
            final_output = self._blend_outputs(candidates, winner_output)
            
            # Record decision
            self._record_decision(winner_output.intent, winner_priority)
            
            return final_output
            
        except Exception as e:
            logger.error(f"Arbitration failed: {e}")
            return BrainNodeOutput(0, 0, 0, 0, "Error", 0)
    
    def _blend_outputs(self, candidates: List[Tuple[BrainNodeOutput, float]], 
                      primary: BrainNodeOutput) -> BrainNodeOutput:
        """Blend outputs based on priorities"""
        # Start with primary output
        blended_thrust = primary.thrust
        blended_rotation = primary.rotation
        blended_fire = primary.fire_weapon
        
        # Add weighted contributions from other nodes
        total_priority = sum(priority for _, priority in candidates)
        
        for output, priority in candidates[1:]:  # Skip primary
            weight = priority / total_priority
            blended_thrust += output.thrust * weight * 0.3  # 30% influence
            blended_rotation += output.rotation * weight * 0.3
            blended_fire += output.fire_weapon * weight * 0.3
        
        # Clamp values
        blended_thrust = max(-1.0, min(1.0, blended_thrust))
        blended_rotation = max(-1.0, min(1.0, blended_rotation))
        blended_fire = max(0.0, min(1.0, blended_fire))
        
        # Use primary's intent and confidence
        return BrainNodeOutput(
            thrust=blended_thrust,
            rotation=blended_rotation,
            fire_weapon=blended_fire,
            confidence=primary.confidence,
            intent=primary.intent,
            priority=primary.priority
        )
    
    def _record_decision(self, intent: str, priority: float) -> None:
        """Record arbitration decision for analysis"""
        self.decision_history.append({
            'intent': intent,
            'priority': priority,
            'timestamp': time.time()
        })
        
        # Limit history size
        if len(self.decision_history) > self.max_history:
            self.decision_history.pop(0)
    
    def get_decision_statistics(self) -> Dict[str, Any]:
        """Get statistics about arbitration decisions"""
        if not self.decision_history:
            return {
                'total_decisions': 0,
                'intent_distribution': {},
                'average_priority': 0.0
            }
        
        # Count intent distribution
        intent_counts = {}
        total_priority = 0.0
        
        for decision in self.decision_history:
            intent = decision['intent']
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
            total_priority += decision['priority']
        
        return {
            'total_decisions': len(self.decision_history),
            'intent_distribution': intent_counts,
            'average_priority': total_priority / len(self.decision_history),
            'recent_decisions': self.decision_history[-10:]  # Last 10 decisions
        }


class TriBrain:
    """Tri-Brain architecture with three specialized nodes and arbiter"""
    
    def __init__(self):
        # Initialize brain nodes
        self.avoidance_net = AvoidanceNet()
        self.combat_net = CombatNet()
        self.resource_net = ResourceNet()
        self.arbiter = Arbiter()
        
        # Performance tracking
        self.processing_time = 0.0
        self.decision_count = 0
        
        logger.info("🧠 Tri-Brain initialized with 3 specialized nodes")
    
    def process(self, spatial_scan: List[float], target_vector: List[float], 
                scrap_vector: List[float], crosshair: float, 
                threat_distance: float, energy: float) -> BrainNodeOutput:
        """Process inputs through tri-brain architecture"""
        try:
            import time
            start_time = time.time()
            
            # Process through each brain node
            avoidance_output = self.avoidance_net.process(spatial_scan, threat_distance)
            combat_output = self.combat_net.process(target_vector, crosshair, energy)
            resource_output = self.resource_net.process(scrap_vector, energy)
            
            # Arbitrate between outputs
            final_output = self.arbiter.arbitrate(avoidance_output, combat_output, resource_output)
            
            # Track performance
            self.processing_time = time.time() - start_time
            self.decision_count += 1
            
            return final_output
            
        except Exception as e:
            logger.error(f"Tri-Brain processing failed: {e}")
            return BrainNodeOutput(0, 0, 0, 0, "Error", 0)
    
    def get_brain_state(self) -> Dict[str, Any]:
        """Get current brain state for debugging"""
        return {
            'processing_time': self.processing_time,
            'decision_count': self.decision_count,
            'arbiter_stats': self.arbiter.get_decision_statistics()
        }
    
    def mutate(self, mutation_rate: float = 0.05) -> None:
        """Apply mutations to all brain networks"""
        try:
            # Mutate avoidance net
            self._mutate_network(self.avoidance_net, mutation_rate)
            
            # Mutate combat net
            self._mutate_network(self.combat_net, mutation_rate)
            
            # Mutate resource net
            self._mutate_network(self.resource_net, mutation_rate)
            
            logger.info(f"🧬 Tri-Brain mutated with rate {mutation_rate}")
            
        except Exception as e:
            logger.error(f"Tri-Brain mutation failed: {e}")
    
    def _mutate_network(self, network, mutation_rate: float) -> None:
        """Mutate a single network"""
        # Mutate input-hidden weights
        for i in range(len(network.weights_input_hidden)):
            for j in range(len(network.weights_input_hidden[i])):
                if random.random() < mutation_rate:
                    mutation = random.uniform(-0.1, 0.1)
                    network.weights_input_hidden[i][j] += mutation
                    network.weights_input_hidden[i][j] = max(-1.0, min(1.0, network.weights_input_hidden[i][j]))
        
        # Mutate hidden-output weights
        for i in range(len(network.weights_hidden_output)):
            for j in range(len(network.weights_hidden_output[i])):
                if random.random() < mutation_rate:
                    mutation = random.uniform(-0.1, 0.1)
                    network.weights_hidden_output[i][j] += mutation
                    network.weights_hidden_output[i][j] = max(-1.0, min(1.0, network.weights_hidden_output[i][j]))
        
        # Mutate biases
        for i in range(len(network.bias_hidden)):
            if random.random() < mutation_rate:
                mutation = random.uniform(-0.1, 0.1)
                network.bias_hidden[i] += mutation
                network.bias_hidden[i] = max(-1.0, min(1.0, network.bias_hidden[i]))
        
        for i in range(len(network.bias_output)):
            if random.random() < mutation_rate:
                mutation = random.uniform(-0.1, 0.1)
                network.bias_output[i] += mutation
                network.bias_output[i] = max(-1.0, min(1.0, network.bias_output[i]))
    
    def save_state(self) -> Dict[str, Any]:
        """Save tri-brain state for succession"""
        return {
            'avoidance_net': {
                'weights_input_hidden': self.avoidance_net.weights_input_hidden,
                'weights_hidden_output': self.avoidance_net.weights_hidden_output,
                'bias_hidden': self.avoidance_net.bias_hidden,
                'bias_output': self.avoidance_net.bias_output
            },
            'combat_net': {
                'weights_input_hidden': self.combat_net.weights_input_hidden,
                'weights_hidden_output': self.combat_net.weights_hidden_output,
                'bias_hidden': self.combat_net.bias_hidden,
                'bias_output': self.combat_net.bias_output
            },
            'resource_net': {
                'weights_input_hidden': self.resource_net.weights_input_hidden,
                'weights_hidden_output': self.resource_net.weights_hidden_output,
                'bias_hidden': self.resource_net.bias_hidden,
                'bias_output': self.resource_net.bias_output
            },
            'arbiter_stats': self.arbiter.get_decision_statistics()
        }
    
    def load_state(self, state: Dict[str, Any]) -> Result[bool]:
        """Load tri-brain state from succession"""
        try:
            # Load avoidance net
            if 'avoidance_net' in state:
                an = state['avoidance_net']
                self.avoidance_net.weights_input_hidden = an['weights_input_hidden']
                self.avoidance_net.weights_hidden_output = an['weights_hidden_output']
                self.avoidance_net.bias_hidden = an['bias_hidden']
                self.avoidance_net.bias_output = an['bias_output']
            
            # Load combat net
            if 'combat_net' in state:
                cn = state['combat_net']
                self.combat_net.weights_input_hidden = cn['weights_input_hidden']
                self.combat_net.weights_hidden_output = cn['weights_hidden_output']
                self.combat_net.bias_hidden = cn['bias_hidden']
                self.combat_net.bias_output = cn['bias_output']
            
            # Load resource net
            if 'resource_net' in state:
                rn = state['resource_net']
                self.resource_net.weights_input_hidden = rn['weights_input_hidden']
                self.resource_net.weights_hidden_output = rn['weights_hidden_output']
                self.resource_net.bias_hidden = rn['bias_hidden']
                self.resource_net.bias_output = rn['bias_output']
            
            logger.info("📖 Tri-Brain state loaded from succession")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Failed to load tri-brain state: {e}")


# Factory function
def create_tri_brain() -> TriBrain:
    """Create a new tri-brain instance"""
    return TriBrain()


# Test function
def test_tri_brain():
    """Test the tri-brain architecture"""
    import time
    
    # Create tri-brain
    brain = create_tri_brain()
    
    # Create mock inputs
    spatial_scan = [0.8, 0.6, 0.4, 0.2, 0.1, 0.1, 0.1, 0.1]  # 8-ray scan
    target_vector = [0.3, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0]  # Target info
    scrap_vector = [0.7, 0.2, 0.0, 0.0, 0.0, 0.0]  # Scrap info
    crosshair = 0.8  # Good target acquisition
    threat_distance = 15.0  # Close threat
    energy = 75.0  # Good energy
    
    print("🧠 Testing Tri-Brain Architecture")
    print("=" * 40)
    
    # Process decision
    output = brain.process(spatial_scan, target_vector, scrap_vector, 
                           crosshair, threat_distance, energy)
    
    print(f"Final Decision: {output.intent}")
    print(f"Thrust: {output.thrust:.2f}")
    print(f"Rotation: {output.rotation:.2f}")
    print(f"Fire: {output.fire_weapon:.2f}")
    print(f"Confidence: {output.confidence:.2f}")
    print(f"Priority: {output.priority:.2f}")
    print(f"Processing Time: {brain.processing_time*1000:.2f}ms")
    
    # Test arbitration statistics
    stats = brain.arbiter.get_decision_statistics()
    print(f"\nArbitration Stats:")
    print(f"Total Decisions: {stats['total_decisions']}")
    print(f"Intent Distribution: {stats['intent_distribution']}")
    
    # Test mutation
    print("\nTesting mutation...")
    brain.mutate(0.1)
    print("Mutation applied")
    
    print("\nTri-Brain test complete!")


if __name__ == "__main__":
    test_tri_brain()
