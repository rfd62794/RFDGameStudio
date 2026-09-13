
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path.cwd() / "src"))

from apps.space.training_loop import TrainingLoop
from rpg_core.systems.mind.neat.neat_engine import NeuralNetwork

def test_evaluation():
    loop = TrainingLoop(population_size=1, max_generations=1)
    nn = NeuralNetwork(num_inputs=8, num_hidden=8, num_outputs=3)
    
    # Manually run simulation and report details
    from apps.space.training_loop import HighSpeedSimulation
    from apps.space.logic.ai_controller import create_ai_controller
    
    ctrl = create_ai_controller("DEBUG", True, nn)
    sim = HighSpeedSimulation(ctrl)
    res = sim.run_simulation()
    
    print(f"Simulation Result: {res}")
    if not res.success:
        print(f"Error: {res.error}")
    else:
        print(f"Metrics: {res.value}")

if __name__ == "__main__":
    test_evaluation()
