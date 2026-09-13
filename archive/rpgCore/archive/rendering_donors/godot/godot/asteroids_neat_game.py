"""
Asteroids NEAT Game - Integration bridge between NEAT engine and game loop.

Connects Python NEAT evolution to Godot visual rendering via AsteroidsSDK.
Enables real-time evolution visualization of AI pilots learning Asteroids.

Architecture:
- NEATEngine: Population evolution (NEAT algorithm)
- AsteroidPilot: Individual agent control (neural network inputs/outputs)
- AsteroidsGame: Game loop with physics
- AsteroidsSDK: Rendering via Godot

Flow: NEAT Population → Genome → Network → Inputs (8-ray scan) → Outputs (thrust/rotate/fire) → Game Logic → Rendering
"""

import time
import random
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field

from .asteroids_clone_sdk import AsteroidsSDK
from ..engines.terminal_bridge import TerminalBridge
from ..engines.pygame_bridge import PyGameBridge
from .input_handler import InputHandler, InputCommandType
from .asteroids_game import GameState, GameStats, AsteroidsGame


@dataclass
class NEATAgentConfig:
    """Configuration for NEAT-controlled agent."""
    genome_id: int
    network_inputs: int = 8      # 8-ray spatial scan + threat distance + velocity + heading
    network_hidden: int = 8       # Hidden layer neurons
    network_outputs: int = 3      # Thrust, Rotation, Fire
    mutation_rate: float = 0.1
    mutation_power: float = 0.5


@dataclass
class FitnessMetrics:
    """Track fitness for NEAT genome."""
    survival_time: float = 0.0
    asteroids_destroyed: int = 0
    projectiles_fired: int = 0
    collisions_avoided: int = 0
    accuracy: float = 0.0  # Projectiles hit / projectiles fired
    efficiency: float = 0.0  # Score / time

    def calculate_composite_fitness(self) -> float:
        """Calculate multi-objective fitness score."""
        survival_score = self.survival_time * 1.0
        destruction_score = self.asteroids_destroyed * 10.0
        accuracy_score = self.accuracy * 5.0
        efficiency_score = self.efficiency * 20.0

        return survival_score + destruction_score + accuracy_score + efficiency_score


@dataclass
class SimpleNeuralNetwork:
    """Minimal neural network for NEAT genome execution."""
    genome_id: int
    input_size: int = 8
    hidden_size: int = 8
    output_size: int = 3

    # Network weights (will be populated from NEAT genome)
    input_to_hidden: List[List[float]] = field(default_factory=list)
    hidden_to_output: List[List[float]] = field(default_factory=list)
    hidden_bias: List[float] = field(default_factory=list)
    output_bias: List[float] = field(default_factory=list)

    def forward(self, inputs: List[float]) -> List[float]:
        """
        Forward pass through network.
        inputs: 8 spatial rays + threat distance + velocity magnitude + heading
        outputs: [thrust, rotation, fire]
        """
        if len(inputs) < self.input_size:
            inputs = inputs + [0.0] * (self.input_size - len(inputs))

        # Hidden layer: ReLU activation
        if not self.input_to_hidden:
            return [0.0, 0.0, 0.0]  # Fallback

        hidden = []
        for j in range(self.hidden_size):
            total = self.hidden_bias[j] if j < len(self.hidden_bias) else 0.0
            for i in range(len(inputs)):
                if j < len(self.input_to_hidden) and i < len(self.input_to_hidden[j]):
                    total += inputs[i] * self.input_to_hidden[j][i]
            hidden.append(max(0, total))  # ReLU

        # Output layer: Tanh activation
        outputs = []
        for k in range(self.output_size):
            total = self.output_bias[k] if k < len(self.output_bias) else 0.0
            for j in range(len(hidden)):
                if k < len(self.hidden_to_output) and j < len(self.hidden_to_output[k]):
                    total += hidden[j] * self.hidden_to_output[k][j]
            outputs.append(self._tanh(total))

        return outputs

    @staticmethod
    def _tanh(x: float) -> float:
        """Tanh activation."""
        return max(-1.0, min(1.0, 2.0 * x / (1.0 + abs(x))))


class NEATAsteroidPilot:
    """
    NEAT-controlled Asteroid pilot.
    Converts neural network outputs to game commands.
    """

    def __init__(self, genome_id: int, network: SimpleNeuralNetwork):
        self.genome_id = genome_id
        self.network = network
        self.fitness_metrics = FitnessMetrics()
        self.alive = True

    def compute_inputs(self, ship_entity: Dict, entities: List[Dict]) -> List[float]:
        """
        Prepare neural network inputs from game state.

        8-ray spatial scan + threat distance + velocity + heading
        """
        inputs = []

        # 8-ray spatial scan (normalized distances to nearest obstacle)
        ray_angles = [i * 3.14159 * 2 / 8 for i in range(8)]  # 8 rays

        for angle in ray_angles:
            nearest_distance = 999.0

            for entity in entities:
                if not entity.get("active"):
                    continue
                if entity.get("id") == ship_entity.get("id"):
                    continue

                dx = entity.get("x", 0) - ship_entity.get("x", 0)
                dy = entity.get("y", 0) - ship_entity.get("y", 0)
                dist = (dx**2 + dy**2) ** 0.5

                if dist < nearest_distance:
                    nearest_distance = dist

            # Normalize: 0-100 pixels → 0-1
            inputs.append(max(0.0, min(1.0, 1.0 - nearest_distance / 100.0)))

        # Threat distance (closest asteroid)
        threat_distance = 999.0
        for entity in entities:
            if not entity.get("active"):
                continue
            if entity.get("type") == "asteroid":
                dx = entity.get("x", 0) - ship_entity.get("x", 0)
                dy = entity.get("y", 0) - ship_entity.get("y", 0)
                dist = (dx**2 + dy**2) ** 0.5
                if dist < threat_distance:
                    threat_distance = dist

        inputs.append(max(0.0, min(1.0, 1.0 - threat_distance / 150.0)))

        return inputs[:8]  # Ensure 8 inputs

    def get_action(self, ship_entity: Dict, entities: List[Dict]) -> Dict[str, float]:
        """
        Compute action from neural network.
        Returns: {thrust: 0-1, rotation: -1 to 1, fire: 0-1}
        """
        inputs = self.compute_inputs(ship_entity, entities)
        outputs = self.network.forward(inputs)

        return {
            "thrust": max(0.0, outputs[0]) if len(outputs) > 0 else 0.0,
            "rotation": outputs[1] if len(outputs) > 1 else 0.0,
            "fire": max(0.0, outputs[2]) if len(outputs) > 2 else 0.0
        }


class AsteroidsNEATGame:
    """
    Asteroids game with NEAT AI control.
    Runs population of AI pilots competing in Asteroids.
    """

    def __init__(
        self,
        population_size: int = 5,
        target_fps: int = 60,
        godot_host: str = "localhost",
        godot_port: int = 9001,
        max_episode_time: float = 30.0,
        renderer: str = "terminal"
    ):
        self.population_size = population_size
        self.target_fps = target_fps
        self.frame_time = 1.0 / target_fps
        self.max_episode_time = max_episode_time
        self.renderer_type = renderer

        # Game systems
        if renderer == "godot":
            self.sdk = AsteroidsSDK(host=godot_host, port=godot_port)
        elif renderer == "terminal":
            self.sdk = TerminalBridge(width=80, height=40)
        elif renderer == "pygame":
            self.sdk = PyGameBridge(width=800, height=600, caption="NEAT Asteroids (PyGame)")
        else:
            raise ValueError(f"Unknown renderer: {renderer}")
            
        self.input_handler = InputHandler()

        # Game state
        self.state = GameState.INITIALIZING
        self.stats = GameStats()
        self.current_time = 0.0
        self.frame_count = 0
        self.entities: List[Dict] = []

        # NEAT population
        self.active_pilots: Dict[str, NEATAsteroidPilot] = {}
        self.generation = 0
        self.generation_start_time = time.time()

    def initialize(self) -> bool:
        """Initialize game and attempt to connect to Godot."""
        print("[Initializing NEAT Asteroids Game...]")

        if not self.sdk.connect():
            print("[WARNING] Failed to connect to Godot renderer - Running HEADLESS mode")
            self.headless = True
        else:
            print("[OK] Connected to Godot")
            self.headless = False

        # Create initial pilot population
        self._spawn_pilot_population()

        self.state = GameState.PLAYING
        self.current_time = 0.0
        self.generation_start_time = time.time()

        print("[OK] NEAT game initialized")
        return True

    def _spawn_pilot_population(self):
        """Create initial population of pilots."""
        self.active_pilots.clear()

        for i in range(self.population_size):
            genome_id = i + (self.generation * 100)

            # Create simple network (in real NEAT, this would come from NEATEngine)
            network = SimpleNeuralNetwork(
                genome_id=genome_id,
                input_size=8,
                hidden_size=8,
                output_size=3
            )

            # Initialize with random weights
            network.input_to_hidden = [[random.uniform(-1, 1) for _ in range(8)] for _ in range(8)]
            network.hidden_to_output = [[random.uniform(-1, 1) for _ in range(8)] for _ in range(3)]
            network.hidden_bias = [random.uniform(-1, 1) for _ in range(8)]
            network.output_bias = [random.uniform(-1, 1) for _ in range(3)]

            pilot = NEATAsteroidPilot(genome_id, network)
            ship_id = f"pilot_{i}_ship"
            self.active_pilots[ship_id] = pilot

            # Spawn ship entity
            self.entities.append({
                "id": ship_id,
                "type": "ship",
                "x": 80.0 + random.uniform(-20, 20),
                "y": 72.0 + random.uniform(-20, 20),
                "vx": 0.0,
                "vy": 0.0,
                "heading": random.uniform(0, 6.28),
                "radius": 5.0,
                "active": True,
                "pilot_id": i
            })

        print(f"[Spawned {self.population_size} pilots for generation {self.generation}]")

        # Spawn asteroids
        for i in range(3):
            self.entities.append({
                "id": f"asteroid_{i}",
                "type": "asteroid",
                "x": random.uniform(20, 140),
                "y": random.uniform(20, 124),
                "vx": random.uniform(-2, 2),
                "vy": random.uniform(-2, 2),
                "radius": 10.0,
                "active": True
            })

    def run(self) -> None:
        """Run main game loop."""
        if not self.initialize():
            return

        loop_start = time.time()

        try:
            while self.state != GameState.SHUTDOWN:
                frame_start = time.time()

                self._update_frame()

                # Check generation end condition
                if time.time() - self.generation_start_time > self.max_episode_time:
                    self._end_generation()
                    self._spawn_pilot_population()

                # Timing adjustment
                frame_duration = time.time() - frame_start
                sleep_time = self.frame_time - frame_duration

                if sleep_time > 0:
                    time.sleep(sleep_time)

                self.frame_count += 1
                self.current_time = time.time() - loop_start
                self.stats.time_elapsed = self.current_time
                self.stats.total_frames = self.frame_count

                # Print progress every 60 frames
                if self.frame_count % 60 == 0:
                    print(f"Frame {self.frame_count:5d} | Generation {self.generation} | Active Pilots: {len([p for p in self.active_pilots.values() if p.alive])}")

        except KeyboardInterrupt:
            print("\n[Game interrupted by user]")
        except Exception as e:
            print(f"[Game error: {e}]")
        finally:
            self.shutdown()

    def _update_frame(self) -> None:
        """Update single frame."""
        # Get neural network decisions for each pilot
        for ship_id, pilot in self.active_pilots.items():
            ship = next((e for e in self.entities if e.get("id") == ship_id), None)

            if not ship or not ship.get("active"):
                continue

            action = pilot.get_action(ship, self.entities)

            # Apply neural outputs as game commands
            if action["thrust"] > 0.3:
                self._apply_thrust(ship, action["thrust"])

            if abs(action["rotation"]) > 0.3:
                self._apply_rotation(ship, action["rotation"])

            if action["fire"] > 0.5:
                self._fire_projectile(ship)

        # Update physics
        self._update_entities()

        # Check collisions
        self._check_collisions()

        # Send frame to Godot
        self._send_frame_to_renderer()

    def _apply_thrust(self, ship: Dict, intensity: float) -> None:
        """Apply thrust to ship."""
        import math
        heading = ship.get("heading", 0.0)
        accel = 100.0 * intensity

        ship["vx"] = ship.get("vx", 0.0) + math.cos(heading) * accel * self.frame_time
        ship["vy"] = ship.get("vy", 0.0) + math.sin(heading) * accel * self.frame_time

        # Clamp velocity
        vel_mag = (ship["vx"] ** 2 + ship["vy"] ** 2) ** 0.5
        if vel_mag > 200.0:
            ship["vx"] = (ship["vx"] / vel_mag) * 200.0
            ship["vy"] = (ship["vy"] / vel_mag) * 200.0

    def _apply_rotation(self, ship: Dict, direction: float) -> None:
        """Rotate ship."""
        rotation_speed = 3.0
        ship["heading"] = (ship.get("heading", 0.0) + direction * rotation_speed * self.frame_time) % 6.28

    def _fire_projectile(self, ship: Dict) -> None:
        """Fire projectile from ship."""
        import math
        heading = ship.get("heading", 0.0)
        projectile = {
            "id": f"proj_{self.frame_count}",
            "type": "projectile",
            "x": ship["x"] + math.cos(heading) * ship["radius"],
            "y": ship["y"] + math.sin(heading) * ship["radius"],
            "vx": ship.get("vx", 0.0) + math.cos(heading) * 300.0,
            "vy": ship.get("vy", 0.0) + math.sin(heading) * 300.0,
            "radius": 1.0,
            "lifetime": 1.0,
            "active": True
        }
        self.entities.append(projectile)

    def _update_entities(self) -> None:
        """Update entity physics."""
        for entity in self.entities:
            if not entity.get("active"):
                continue

            entity["x"] += entity.get("vx", 0.0) * self.frame_time
            entity["y"] += entity.get("vy", 0.0) * self.frame_time

            # Wrap around screen
            if entity["x"] < 0:
                entity["x"] = 160
            elif entity["x"] > 160:
                entity["x"] = 0

            if entity["y"] < 0:
                entity["y"] = 144
            elif entity["y"] > 144:
                entity["y"] = 0

            # Update projectile lifetime
            if entity.get("type") == "projectile":
                entity["lifetime"] = entity.get("lifetime", 1.0) - self.frame_time
                if entity["lifetime"] <= 0:
                    entity["active"] = False

    def _check_collisions(self) -> None:
        """Check for collisions (simplified)."""
        # Projectile-asteroid collisions
        projectiles = [e for e in self.entities if e.get("type") == "projectile"]
        asteroids = [e for e in self.entities if e.get("type") == "asteroid"]

        for proj in projectiles:
            if not proj.get("active"):
                continue
            for asteroid in asteroids:
                if not asteroid.get("active"):
                    continue

                dx = proj["x"] - asteroid["x"]
                dy = proj["y"] - asteroid["y"]
                dist = (dx**2 + dy**2) ** 0.5

                if dist < (proj.get("radius", 1) + asteroid.get("radius", 10)):
                    proj["active"] = False
                    asteroid["active"] = False

    def _send_frame_to_renderer(self) -> None:
        """Send frame to Godot if connected."""
        if hasattr(self, 'headless') and self.headless:
            return

        hud_data = {
            "score": str(self.stats.score),
            "lives": str(self.stats.lives),
            "wave": f"GEN {self.generation}",
            "status": f"Pilots: {len([p for p in self.active_pilots.values() if p.alive])}/{self.population_size}"
        }

        self.sdk.send_frame(self.entities, hud_data)

    def _end_generation(self) -> None:
        """End current generation and calculate fitness."""
        print(f"\n[Generation {self.generation} Complete]")

        for ship_id, pilot in self.active_pilots.items():
            fitness = pilot.fitness_metrics.calculate_composite_fitness()
            print(f"  Pilot {pilot.genome_id}: Fitness={fitness:.1f}")

        self.generation += 1
        self.generation_start_time = time.time()

    def shutdown(self) -> None:
        """Shutdown game."""
        print("[Shutting down NEAT game]")
        self.state = GameState.SHUTDOWN
        self.sdk.disconnect()
        print("[Shutdown complete]")


if __name__ == "__main__":
    game = AsteroidsNEATGame(
        population_size=5,
        target_fps=60,
        max_episode_time=30.0
    )
    game.run()
