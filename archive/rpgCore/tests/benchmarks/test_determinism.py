"""
Determinism Benchmark Tests for DGT Platform

Sprint B: Testing & CI Pipeline - Determinism Benchmark
ADR 212: Property-Based Testing for bulletproof deterministic behavior

Runs parallel simulations with identical seeds and asserts that
positions are identical after 10,000 ticks to ensure 60Hz loop consistency.
"""

import pytest
import random
import time
import math
from typing import List, Dict, Any, Tuple
from unittest.mock import Mock, patch
from dataclasses import dataclass, asdict

# Import the components we're testing
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from apps.space.physics_body import PhysicsBody, PhysicsState
from apps.space.entities.space_entity import SpaceEntity, EntityType
from dgt_engine.foundation.vector import Vector2
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, TARGET_FPS
from dgt_engine.foundation.genetics.genome_engine import TurboGenome
from dgt_engine.foundation.registry import DGTRegistry


@dataclass
class SimulationSnapshot:
    """Snapshot of simulation state at a specific time"""
    frame_count: int
    entities: List[Dict[str, Any]]
    ship_position: Tuple[float, float]
    ship_velocity: Tuple[float, float]
    ship_angle: float
    energy: float
    score: int
    game_time: float


class DeterminismBenchmark:
    """
    Benchmark suite for testing simulation determinism.
    
    Runs multiple parallel simulations with identical seeds and
    verifies that all produce identical results after many iterations.
    """
    
    def __init__(self):
        self.test_seed = 12345
        self.simulation_ticks = 10000
        self.tolerance = 1e-10  # Floating point tolerance
    
    def create_deterministic_physics(self, seed: int) -> PhysicsBody:
        """Create physics body with deterministic seed"""
        random.seed(seed)
        
        # Create physics with deterministic initial conditions
        physics = PhysicsBody()
        
        # Set deterministic initial state
        physics.position = Vector2(
            random.uniform(0, SOVEREIGN_WIDTH),
            random.uniform(0, SOVEREIGN_HEIGHT)
        )
        physics.velocity = Vector2(
            random.uniform(-50, 50),
            random.uniform(-50, 50)
        )
        physics.angle = random.uniform(0, 2 * math.pi)
        physics.energy = random.uniform(50, 100)
        
        return physics
    
    def run_simulation(self, physics: PhysicsBody, ticks: int) -> SimulationSnapshot:
        """Run simulation for specified number of ticks"""
        snapshots = []
        
        for tick in range(ticks):
            # Store snapshot every 1000 ticks
            if tick % 1000 == 0:
                snapshot = self._create_snapshot(physics, tick)
                snapshots.append(snapshot)
            
            # Apply deterministic physics updates
            self._update_physics_deterministic(physics, tick)
        
        # Return final snapshot
        return self._create_snapshot(physics, ticks)
    
    def _update_physics_deterministic(self, physics: PhysicsBody, tick: int) -> None:
        """Update physics with deterministic behavior"""
        # Use tick number as part of random seed for deterministic behavior
        random.seed(self.test_seed + tick)
        
        # Apply random thrust (30% chance)
        if random.random() < 0.3 and physics.energy > 0:
            physics.thrust_active = True
            thrust_force = 50.0
            thrust_vector = Vector2(
                math.cos(physics.angle) * thrust_force,
                math.sin(physics.angle) * thrust_force
            )
            acceleration = thrust_vector / physics.mass
            physics.velocity = physics.velocity + acceleration * physics.dt
            
            # Energy cost
            energy_cost = physics.thrust_cost * physics.dt
            physics.energy = max(0, physics.energy - energy_cost)
        else:
            physics.thrust_active = False
        
        # Apply random rotation (20% chance)
        if random.random() < 0.2:
            rotation_input = random.choice([-1.0, 1.0])  # Left or right
            physics.angle += rotation_input * 0.1  # Rotation speed
        
        # Update position
        physics.position = physics.position + physics.velocity * physics.dt
        
        # Apply toroidal wrapping
        physics.position = Vector2(
            physics.position.x % SOVEREIGN_WIDTH,
            physics.position.y % SOVEREIGN_HEIGHT
        )
        
        # Apply speed limit
        speed = physics.velocity.magnitude()
        if speed > physics.max_ship_speed:
            physics.velocity = physics.velocity.normalized() * physics.max_ship_speed
        
        # Update ship entity if exists
        if physics.ship_entity:
            physics.ship_entity.position = physics.position.copy()
            physics.ship_entity.velocity = physics.velocity.copy()
            physics.ship_entity.heading = physics.angle
    
    def _create_snapshot(self, physics: PhysicsBody, frame_count: int) -> SimulationSnapshot:
        """Create snapshot of current simulation state"""
        entities_data = []
        
        for entity in physics.entities:
            entity_data = {
                'type': entity.entity_type.value,
                'position': (entity.position.x, entity.position.y),
                'velocity': (entity.velocity.x, entity.velocity.y),
                'heading': entity.heading,
                'radius': entity.radius
            }
            entities_data.append(entity_data)
        
        return SimulationSnapshot(
            frame_count=frame_count,
            entities=entities_data,
            ship_position=(physics.position.x, physics.position.y),
            ship_velocity=(physics.velocity.x, physics.velocity.y),
            ship_angle=physics.angle,
            energy=physics.energy,
            score=0,  # Would be updated by game logic
            game_time=frame_count / TARGET_FPS
        )
    
    def compare_snapshots(self, snapshot1: SimulationSnapshot, snapshot2: SimulationSnapshot) -> bool:
        """Compare two snapshots for exact equality"""
        # Compare frame count
        if snapshot1.frame_count != snapshot2.frame_count:
            return False
        
        # Compare ship position with tolerance
        pos_diff = (
            abs(snapshot1.ship_position[0] - snapshot2.ship_position[0]),
            abs(snapshot1.ship_position[1] - snapshot2.ship_position[1])
        )
        if pos_diff[0] > self.tolerance or pos_diff[1] > self.tolerance:
            return False
        
        # Compare ship velocity with tolerance
        vel_diff = (
            abs(snapshot1.ship_velocity[0] - snapshot2.ship_velocity[0]),
            abs(snapshot1.ship_velocity[1] - snapshot2.ship_velocity[1])
        )
        if vel_diff[0] > self.tolerance or vel_diff[1] > self.tolerance:
            return False
        
        # Compare ship angle with tolerance
        if abs(snapshot1.ship_angle - snapshot2.ship_angle) > self.tolerance:
            return False
        
        # Compare energy with tolerance
        if abs(snapshot1.energy - snapshot2.energy) > self.tolerance:
            return False
        
        # Compare entities
        if len(snapshot1.entities) != len(snapshot2.entities):
            return False
        
        for entity1, entity2 in zip(snapshot1.entities, snapshot2.entities):
            if entity1['type'] != entity2['type']:
                return False
            
            # Compare positions
            pos1, pos2 = entity1['position'], entity2['position']
            if abs(pos1[0] - pos2[0]) > self.tolerance or abs(pos1[1] - pos2[1]) > self.tolerance:
                return False
            
            # Compare velocities
            vel1, vel2 = entity1['velocity'], entity2['velocity']
            if abs(vel1[0] - vel2[0]) > self.tolerance or abs(vel1[1] - vel2[1]) > self.tolerance:
                return False
        
        return True


class TestDeterminismBenchmark:
    """Test suite for determinism benchmarks"""
    
    def setup_method(self) -> None:
        """Set up benchmark test fixtures"""
        self.benchmark = DeterminismBenchmark()
    
    def test_parallel_simulation_determinism(self) -> None:
        """Test that parallel simulations with same seed produce identical results"""
        # Create two identical physics simulations
        physics1 = self.benchmark.create_deterministic_physics(self.benchmark.test_seed)
        physics2 = self.benchmark.create_deterministic_physics(self.benchmark.test_seed)
        
        # Run both simulations for 10,000 ticks
        snapshot1 = self.benchmark.run_simulation(physics1, self.benchmark.simulation_ticks)
        snapshot2 = self.benchmark.run_simulation(physics2, self.benchmark.simulation_ticks)
        
        # Compare results
        assert self.benchmark.compare_snapshots(snapshot1, snapshot2), \
            "Parallel simulations with same seed produced different results"
    
    def test_multiple_seed_determinism(self) -> None:
        """Test determinism across multiple different seeds"""
        seeds = [12345, 67890, 24680, 13579, 98765]
        snapshots = []
        
        # Run simulation with each seed
        for seed in seeds:
            physics = self.benchmark.create_deterministic_physics(seed)
            snapshot = self.benchmark.run_simulation(physics, 1000)  # Shorter for multiple tests
            snapshots.append((seed, snapshot))
        
        # Verify each seed produces unique but internally consistent results
        for i, (seed1, snapshot1) in enumerate(snapshots):
            # Re-run with same seed to verify consistency
            physics_repeat = self.benchmark.create_deterministic_physics(seed1)
            snapshot_repeat = self.benchmark.run_simulation(physics_repeat, 1000)
            
            assert self.benchmark.compare_snapshots(snapshot1, snapshot_repeat), \
                f"Seed {seed1} produced inconsistent results on repeat"
            
            # Verify different seeds produce different results (high probability)
            for j, (seed2, snapshot2) in enumerate(snapshots):
                if i != j:
                    # Different seeds should likely produce different results
                    # (though there's a small chance they could be the same)
                    if seed1 != seed2:
                        # At least one value should be different
                        same_position = (
                            snapshot1.ship_position == snapshot2.ship_position
                        )
                        same_velocity = (
                            snapshot1.ship_velocity == snapshot2.ship_velocity
                        )
                        same_angle = snapshot1.ship_angle == snapshot2.ship_angle
                        
                        # It's extremely unlikely all three are the same for different seeds
                        assert not (same_position and same_velocity and same_angle), \
                            f"Different seeds {seed1} and {seed2} produced identical results"
    
    def test_genome_determinism(self) -> None:
        """Test that genome operations are deterministic"""
        # Create genomes with deterministic seed
        random.seed(54321)
        
        genomes = []
        for i in range(10):
            genome = TurboGenome(
                shell_base_color=(
                    random.randint(0, 255),
                    random.randint(0, 255),
                    random.randint(0, 255)
                ),
                speed_modifier=random.uniform(0.0, 2.0),
                intelligence_modifier=random.uniform(0.0, 2.0)
            )
            genomes.append(genome)
        
        # Reset seed and repeat
        random.seed(54321)
        
        genomes_repeat = []
        for i in range(10):
            genome = TurboGenome(
                shell_base_color=(
                    random.randint(0, 255),
                    random.randint(0, 255),
                    random.randint(0, 255)
                ),
                speed_modifier=random.uniform(0.0, 2.0),
                intelligence_modifier=random.uniform(0.0, 2.0)
            )
            genomes_repeat.append(genome)
        
        # Verify identical sequences
        for genome, genome_repeat in zip(genomes, genomes_repeat):
            assert genome.shell_base_color == genome_repeat.shell_base_color
            assert genome.speed_modifier == genome_repeat.speed_modifier
            assert genome.intelligence_modifier == genome_repeat.intelligence_modifier
    
    def test_registry_determinism(self) -> None:
        """Test that registry operations are deterministic"""
        # Reset registry
        registry = DGTRegistry()
        
        # Register entities with deterministic sequence
        random.seed(99999)
        
        entity_ids = []
        for i in range(5):
            entity_id = f"entity_{i}_{random.randint(1000, 9999)}"
            entity = SpaceEntity(
                entity_type=EntityType.ASTEROID,
                position=Vector2(random.uniform(0, SOVEREIGN_WIDTH), random.uniform(0, SOVEREIGN_HEIGHT)),
                velocity=Vector2(random.uniform(-30, 30), random.uniform(-30, 30)),
                heading=random.uniform(0, 2 * math.pi),
                radius=random.uniform(5, 15)
            )
            
            result = registry.register(entity_id, entity, registry.registry_type.__class__.ENTITY)
            assert result.success
            entity_ids.append(entity_id)
        
        # Get registry state
        stats_result = registry.get_registry_stats()
        assert stats_result.success
        original_stats = stats_result.value
        
        # Reset and repeat
        registry = DGTRegistry()
        random.seed(99999)
        
        entity_ids_repeat = []
        for i in range(5):
            entity_id = f"entity_{i}_{random.randint(1000, 9999)}"
            entity = SpaceEntity(
                entity_type=EntityType.ASTEROID,
                position=Vector2(random.uniform(0, SOVEREIGN_WIDTH), random.uniform(0, SOVEREIGN_HEIGHT)),
                velocity=Vector2(random.uniform(-30, 30), random.uniform(-30, 30)),
                heading=random.uniform(0, 2 * math.pi),
                radius=random.uniform(5, 15)
            )
            
            result = registry.register(entity_id, entity, registry.registry_type.__class__.ENTITY)
            assert result.success
            entity_ids_repeat.append(entity_id)
        
        # Verify identical sequences
        assert entity_ids == entity_ids_repeat
        
        # Verify registry stats are identical
        stats_result_repeat = registry.get_registry_stats()
        assert stats_result_repeat.success
        repeat_stats = stats_result_repeat.value
        
        assert original_stats['total_registrations'] == repeat_stats['total_registrations']
    
    def test_physics_performance_benchmark(self) -> None:
        """Test physics performance meets 60Hz requirements"""
        physics = self.benchmark.create_deterministic_physics(self.benchmark.test_seed)
        
        # Benchmark 10,000 updates
        start_time = time.perf_counter()
        
        for tick in range(10000):
            self.benchmark._update_physics_deterministic(physics, tick)
        
        end_time = time.perf_counter()
        elapsed_time = end_time - start_time
        
        # Calculate performance metrics
        updates_per_second = 10000 / elapsed_time
        time_per_update = elapsed_time / 10000
        
        # Verify performance meets 60Hz requirements (16.67ms per frame)
        max_frame_time = 1.0 / TARGET_FPS  # ~16.67ms
        
        assert time_per_update < max_frame_time, \
            f"Physics update too slow: {time_per_update*1000:.2f}ms per update (max: {max_frame_time*1000:.2f}ms)"
        
        assert updates_per_second > TARGET_FPS, \
            f"Physics update rate too low: {updates_per_second:.1f} updates/sec (min: {TARGET_FPS})"
    
    def test_long_term_simulation_stability(self) -> None:
        """Test simulation stability over extended periods"""
        physics = self.benchmark.create_deterministic_physics(self.benchmark.test_seed)
        
        # Run for 100,000 ticks (~28 minutes at 60Hz)
        long_term_ticks = 100000
        
        # Track stability metrics
        energy_values = []
        position_values = []
        
        for tick in range(long_term_ticks):
            self.benchmark._update_physics_deterministic(physics, tick)
            
            # Sample metrics every 1000 ticks
            if tick % 1000 == 0:
                energy_values.append(physics.energy)
                position_values.append((physics.position.x, physics.position.y))
                
                # Verify energy stays within valid bounds
                assert 0 <= physics.energy <= 100, f"Energy out of bounds at tick {tick}: {physics.energy}"
                
                # Verify position stays within bounds (due to wrapping)
                assert 0 <= physics.position.x < SOVEREIGN_WIDTH, f"X position out of bounds at tick {tick}"
                assert 0 <= physics.position.y < SOVEREIGN_HEIGHT, f"Y position out of bounds at tick {tick}"
        
        # Verify energy doesn't suddenly jump (indicating instability)
        for i in range(1, len(energy_values)):
            energy_change = abs(energy_values[i] - energy_values[i-1])
            # Energy should change gradually (thrust cost is small)
            assert energy_change < 10.0, f"Large energy jump detected: {energy_change}"
        
        # Verify position continuity (no teleportation)
        for i in range(1, len(position_values)):
            pos1, pos2 = position_values[i-1], position_values[i]
            
            # Calculate direct distance
            direct_distance = math.sqrt((pos2[0] - pos1[0])**2 + (pos2[1] - pos1[1])**2)
            
            # Calculate wrapped distance (accounting for toroidal wrapping)
            wrapped_x = min(abs(pos2[0] - pos1[0]), SOVEREIGN_WIDTH - abs(pos2[0] - pos1[0]))
            wrapped_y = min(abs(pos2[1] - pos1[1]), SOVEREIGN_HEIGHT - abs(pos2[1] - pos1[1]))
            wrapped_distance = math.sqrt(wrapped_x**2 + wrapped_y**2)
            
            # Position change should be reasonable based on max speed
            max_expected_distance = physics.max_ship_speed * (1000 / TARGET_FPS)  # 1000 ticks worth
            assert wrapped_distance < max_expected_distance, f"Unreasonable position change: {wrapped_distance}"
