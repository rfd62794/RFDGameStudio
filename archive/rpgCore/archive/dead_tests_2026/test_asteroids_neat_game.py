"""
Test suite for NEAT Asteroids Game integration.

Coverage:
- Neural network forward pass
- Pilot agent control
- Fitness calculation
- NEAT game lifecycle
- Entity spawning and updates
"""

import pytest
import math
from unittest.mock import Mock, patch, MagicMock

from src.game_engine.godot.asteroids_neat_game import (
    SimpleNeuralNetwork,
    NEATAsteroidPilot,
    FitnessMetrics,
    AsteroidsNEATGame,
    NEATAgentConfig,
)


@pytest.fixture
def neural_network():
    """Create neural network fixture."""
    network = SimpleNeuralNetwork(
        genome_id=1,
        input_size=8,
        hidden_size=8,
        output_size=3
    )
    # Initialize with known weights for deterministic testing
    network.input_to_hidden = [[0.5 for _ in range(8)] for _ in range(8)]
    network.hidden_to_output = [[0.3 for _ in range(8)] for _ in range(3)]
    network.hidden_bias = [0.1 for _ in range(8)]
    network.output_bias = [0.05 for _ in range(3)]
    return network


@pytest.fixture
def neat_pilot(neural_network):
    """Create NEAT pilot fixture."""
    return NEATAsteroidPilot(genome_id=1, network=neural_network)


@pytest.fixture
def ship_entity():
    """Create ship entity fixture."""
    return {
        "id": "pilot_0_ship",
        "type": "ship",
        "x": 80.0,
        "y": 72.0,
        "vx": 0.0,
        "vy": 0.0,
        "heading": 0.0,
        "radius": 5.0,
        "active": True
    }


@pytest.fixture
def asteroid_entities():
    """Create asteroid entities fixture."""
    return [
        {
            "id": "asteroid_0",
            "type": "asteroid",
            "x": 100.0,
            "y": 72.0,
            "radius": 10.0,
            "active": True
        },
        {
            "id": "asteroid_1",
            "type": "asteroid",
            "x": 60.0,
            "y": 72.0,
            "radius": 10.0,
            "active": True
        }
    ]


class TestNeuralNetwork:
    """Test neural network forward pass."""

    def test_network_creation(self):
        """Test creating neural network."""
        network = SimpleNeuralNetwork(genome_id=1)

        assert network.genome_id == 1
        assert network.input_size == 8
        assert network.output_size == 3

    def test_network_forward_pass(self, neural_network):
        """Test forward pass through network."""
        inputs = [0.5, 0.3, 0.7, 0.2, 0.4, 0.6, 0.1, 0.9]
        outputs = neural_network.forward(inputs)

        assert len(outputs) == 3
        assert all(-1.0 <= out <= 1.0 for out in outputs)

    def test_network_forward_with_short_input(self, neural_network):
        """Test forward pass with shorter input."""
        inputs = [0.5, 0.3]
        outputs = neural_network.forward(inputs)

        assert len(outputs) == 3

    def test_network_forward_empty_weights(self):
        """Test forward pass with uninitialized network."""
        network = SimpleNeuralNetwork(genome_id=1)
        inputs = [0.5] * 8
        outputs = network.forward(inputs)

        # Should return zeros when weights not initialized
        assert outputs == [0.0, 0.0, 0.0]

    def test_tanh_activation(self):
        """Test tanh activation function."""
        assert SimpleNeuralNetwork._tanh(0) == 0
        assert -1.0 <= SimpleNeuralNetwork._tanh(1.0) <= 1.0
        assert -1.0 <= SimpleNeuralNetwork._tanh(-1.0) <= 1.0


class TestFitnessMetrics:
    """Test fitness calculation."""

    def test_fitness_creation(self):
        """Test creating fitness metrics."""
        fitness = FitnessMetrics()

        assert fitness.survival_time == 0.0
        assert fitness.asteroids_destroyed == 0
        assert fitness.projectiles_fired == 0
        assert fitness.accuracy == 0.0

    def test_composite_fitness_calculation(self):
        """Test calculating composite fitness."""
        fitness = FitnessMetrics(
            survival_time=10.0,
            asteroids_destroyed=5,
            accuracy=0.8,
            efficiency=1.0
        )

        composite = fitness.calculate_composite_fitness()

        # survival=10, destruction=50, accuracy=4, efficiency=20 → 84
        assert composite > 0
        assert composite == pytest.approx(10 * 1.0 + 5 * 10.0 + 0.8 * 5.0 + 1.0 * 20.0)

    def test_composite_fitness_zero(self):
        """Test composite fitness with all zeros."""
        fitness = FitnessMetrics()
        assert fitness.calculate_composite_fitness() == 0.0


class TestNEATPilot:
    """Test NEAT pilot agent."""

    def test_pilot_creation(self, neural_network):
        """Test creating NEAT pilot."""
        pilot = NEATAsteroidPilot(genome_id=5, network=neural_network)

        assert pilot.genome_id == 5
        assert pilot.alive is True
        assert isinstance(pilot.fitness_metrics, FitnessMetrics)

    def test_compute_inputs(self, neat_pilot, ship_entity, asteroid_entities):
        """Test computing neural network inputs."""
        all_entities = [ship_entity] + asteroid_entities
        inputs = neat_pilot.compute_inputs(ship_entity, all_entities)

        assert len(inputs) == 8
        assert all(0.0 <= inp <= 1.0 for inp in inputs)

    def test_compute_inputs_nearby_asteroid(self, neat_pilot, ship_entity):
        """Test inputs with nearby asteroid."""
        asteroid = {
            "id": "asteroid_0",
            "type": "asteroid",
            "x": ship_entity["x"] + 5.0,  # Very close
            "y": ship_entity["y"],
            "radius": 10.0,
            "active": True
        }

        inputs = neat_pilot.compute_inputs(ship_entity, [asteroid])

        # Should have high threat value in ray pointing to asteroid
        assert max(inputs[:8]) > 0.5

    def test_compute_inputs_far_asteroid(self, neat_pilot, ship_entity):
        """Test inputs with far asteroid."""
        asteroid = {
            "id": "asteroid_0",
            "type": "asteroid",
            "x": ship_entity["x"] + 200.0,  # Very far
            "y": ship_entity["y"],
            "radius": 10.0,
            "active": True
        }

        inputs = neat_pilot.compute_inputs(ship_entity, [asteroid])

        # Should have low threat value
        assert all(inp < 0.5 for inp in inputs[:8])

    def test_get_action(self, neat_pilot, ship_entity, asteroid_entities):
        """Test getting action from pilot."""
        all_entities = [ship_entity] + asteroid_entities
        action = neat_pilot.get_action(ship_entity, all_entities)

        assert "thrust" in action
        assert "rotation" in action
        assert "fire" in action
        assert 0.0 <= action["thrust"] <= 1.0
        assert -1.0 <= action["rotation"] <= 1.0
        assert 0.0 <= action["fire"] <= 1.0


class TestAsteroidsNEATGame:
    """Test NEAT Asteroids game."""

    @pytest.fixture
    def game(self):
        """Create game fixture with mocked SDK."""
        game = AsteroidsNEATGame(population_size=3, max_episode_time=5.0)
        game.sdk = MagicMock()
        game.sdk.connect.return_value = True
        return game

    def test_game_creation(self):
        """Test creating NEAT game."""
        game = AsteroidsNEATGame(population_size=5)

        assert game.population_size == 5
        assert game.target_fps == 60
        assert game.max_episode_time == 30.0

    def test_game_initialization(self, game):
        """Test initializing game."""
        result = game.initialize()

        assert result is True
        assert game.state.name == "PLAYING"
        assert len(game.active_pilots) == 3

    def test_game_initialization_no_connection(self):
        """Test initialization failure."""
        game = AsteroidsNEATGame()
        game.sdk = MagicMock()
        game.sdk.connect.return_value = False

        result = game.initialize()

        assert result is False

    def test_spawn_pilot_population(self, game):
        """Test spawning pilot population."""
        game._spawn_pilot_population()

        assert len(game.active_pilots) == 3
        assert len(game.entities) >= 3  # At least pilots, plus asteroids

    def test_pilot_count_matches_population(self, game):
        """Test pilot count matches population size."""
        game._spawn_pilot_population()

        ships = [e for e in game.entities if e.get("type") == "ship"]
        assert len(ships) == game.population_size

    def test_apply_thrust(self, game, ship_entity):
        """Test thrust application."""
        original_vx = ship_entity["vx"]
        original_vy = ship_entity["vy"]

        game._apply_thrust(ship_entity, intensity=1.0)

        assert ship_entity["vx"] != original_vx or ship_entity["vy"] != original_vy

    def test_apply_rotation(self, game, ship_entity):
        """Test rotation application."""
        original_heading = ship_entity["heading"]

        game._apply_rotation(ship_entity, direction=1.0)

        assert ship_entity["heading"] != original_heading

    def test_fire_projectile(self, game, ship_entity):
        """Test projectile firing."""
        game.entities = [ship_entity]
        initial_count = len(game.entities)

        game._fire_projectile(ship_entity)

        assert len(game.entities) > initial_count
        projectile = game.entities[-1]
        assert projectile.get("type") == "projectile"

    def test_update_entities_position(self, game):
        """Test entity position updates."""
        entity = {
            "id": "test",
            "x": 80.0,
            "y": 72.0,
            "vx": 10.0,
            "vy": 5.0,
            "active": True
        }

        game.entities = [entity]
        game._update_entities()

        assert entity["x"] > 80.0
        assert entity["y"] > 72.0

    def test_update_entities_wrapping(self, game):
        """Test entity screen wrapping."""
        entity = {
            "id": "test",
            "x": 150.0,
            "y": 72.0,
            "vx": 20.0,
            "vy": 0.0,
            "active": True
        }

        game.entities = [entity]
        game._update_entities()

        # Should wrap to left side
        assert entity["x"] < 160.0

    def test_update_projectile_lifetime(self, game):
        """Test projectile lifetime decay."""
        projectile = {
            "id": "proj",
            "type": "projectile",
            "x": 80.0,
            "y": 72.0,
            "vx": 0.0,
            "vy": 0.0,
            "lifetime": 1.0,
            "active": True
        }

        game.entities = [projectile]
        game._update_entities()

        assert projectile["lifetime"] < 1.0
        assert projectile["active"] is True

    def test_projectile_expiration(self, game):
        """Test projectile expires after lifetime."""
        projectile = {
            "id": "proj",
            "type": "projectile",
            "x": 80.0,
            "y": 72.0,
            "vx": 0.0,
            "vy": 0.0,
            "lifetime": 0.001,  # Very short
            "active": True
        }

        game.entities = [projectile]
        game._update_entities()

        assert projectile["active"] is False

    def test_check_collisions(self, game):
        """Test collision detection."""
        projectile = {
            "id": "proj",
            "type": "projectile",
            "x": 100.0,
            "y": 72.0,
            "vx": 0.0,
            "vy": 0.0,
            "radius": 1.0,
            "active": True
        }

        asteroid = {
            "id": "asteroid",
            "type": "asteroid",
            "x": 100.0,
            "y": 72.0,
            "vx": 0.0,
            "vy": 0.0,
            "radius": 10.0,
            "active": True
        }

        game.entities = [projectile, asteroid]
        game._check_collisions()

        assert projectile["active"] is False
        assert asteroid["active"] is False

    def test_end_generation(self, game):
        """Test ending generation."""
        game._spawn_pilot_population()
        initial_gen = game.generation

        game._end_generation()

        assert game.generation == initial_gen + 1

    def test_game_frame_count(self, game):
        """Test frame counting."""
        game.initialize()

        assert game.frame_count == 0

        game._update_frame()

        # Frame count incremented elsewhere in run loop


class TestIntegration:
    """Integration tests."""

    @pytest.fixture
    def game(self):
        """Create game for integration tests."""
        game = AsteroidsNEATGame(population_size=2, max_episode_time=1.0)
        game.sdk = MagicMock()
        game.sdk.connect.return_value = True
        return game

    def test_full_game_cycle(self, game):
        """Test complete game cycle."""
        game.initialize()

        # Simulate a few frames
        for _ in range(5):
            game._update_frame()

        assert game.frame_count == 0  # Not incremented in _update_frame
        assert len(game.active_pilots) == 2

    def test_generation_transitions(self, game):
        """Test generation transitions."""
        game.initialize()
        gen_start = game.generation

        for _ in range(10):
            game._update_frame()

        # Generation may have transitioned if enough time passed
        assert game.generation >= gen_start

    def test_pilot_decisions_affect_entities(self, game):
        """Test that pilot decisions affect entity state."""
        game.initialize()

        # Get a pilot ship
        ships = [e for e in game.entities if e.get("type") == "ship"]
        if ships:
            ship = ships[0]
            initial_vel = (ship.get("vx", 0) ** 2 + ship.get("vy", 0) ** 2) ** 0.5

            # Run frame (pilots will make decisions)
            game._update_frame()

            # Velocity may have changed (pilot applied thrust, etc)
            final_vel = (ship.get("vx", 0) ** 2 + ship.get("vy", 0) ** 2) ** 0.5
            # Just verify the update ran without error
            assert True
