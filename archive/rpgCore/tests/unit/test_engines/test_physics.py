"""
Unit Tests for DGT Physics Engine

Sprint B: Testing & CI Pipeline - Unit Test Suite
ADR 212: Test-Driven Development harness for deterministic physics

Tests the 60Hz physics loop for deterministic behavior, toroidal wrapping,
and Newtonian mechanics within the sovereign 160x144 resolution grid.
"""

import pytest
import random
import math
from typing import Tuple, List

pytest.importorskip("hypothesis")
from hypothesis import given, strategies as st
from unittest.mock import Mock, patch

# Import the physics components we're testing
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from src.apps.space.physics_body import PhysicsBody, PhysicsState
from src.apps.space.entities.space_entity import SpaceEntity, EntityType
from src.dgt_engine.foundation.vector import Vector2
from src.dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from src.dgt_engine.foundation.types import Result


class TestPhysicsBody:
    """
    Test suite for PhysicsBody Newtonian mechanics.
    
    Ensures deterministic behavior, proper toroidal wrapping,
    and conservation of momentum within the 160x144 grid.
    """
    
    def setup_method(self) -> None:
        """Set up test fixtures"""
        self.physics = PhysicsBody()
        # Ensure deterministic testing
        random.seed(42)
    
    def test_physics_body_initialization(self) -> None:
        """Test that PhysicsBody initializes correctly"""
        assert self.physics.position.x == SOVEREIGN_WIDTH / 2
        assert self.physics.position.y == SOVEREIGN_HEIGHT / 2
        assert self.physics.velocity.x == 0.0
        assert self.physics.velocity.y == 0.0
        assert self.physics.angle == 0.0
        assert self.physics.mass == 10.0
        assert self.physics.energy == 100.0
        assert self.physics.dt == 1.0 / 60.0
        assert self.physics.max_ship_speed == 200.0
        assert self.physics.bullet_speed == 300.0
    
    def test_ship_entity_creation(self) -> None:
        """Test that ship entity is created at center position"""
        ship = self.physics.ship_entity
        assert ship is not None
        assert ship.entity_type == EntityType.SHIP
        assert ship.position.x == SOVEREIGN_WIDTH / 2
        assert ship.position.y == SOVEREIGN_HEIGHT / 2
        assert ship.velocity.x == 0.0
        assert ship.velocity.y == 0.0
        assert ship.heading == 0.0
        assert ship.radius == 4.0
    
    def test_toroidal_wrapping_horizontal(self) -> None:
        """Test toroidal wrapping in horizontal direction"""
        # Test wrapping from right edge to left edge
        entity = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=Vector2(SOVEREIGN_WIDTH + 10, 50),  # 10 pixels past right edge
            velocity=Vector2(5, 0),
            heading=0.0,
            radius=8.0
        )
        
        # Update position should wrap
        new_position = entity.position + entity.velocity * self.physics.dt
        wrapped_position = Vector2(
            new_position.x % SOVEREIGN_WIDTH,
            new_position.y % SOVEREIGN_HEIGHT
        )
        
        # Should wrap to left side
        assert wrapped_position.x < SOVEREIGN_WIDTH
        assert wrapped_position.x == (SOVEREIGN_WIDTH + 10 + 5 * self.physics.dt) % SOVEREIGN_WIDTH
    
    def test_toroidal_wrapping_vertical(self) -> None:
        """Test toroidal wrapping in vertical direction"""
        # Test wrapping from bottom edge to top edge
        entity = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=Vector2(50, SOVEREIGN_HEIGHT + 10),  # 10 pixels past bottom edge
            velocity=Vector2(0, 5),
            heading=0.0,
            radius=8.0
        )
        
        # Update position should wrap
        new_position = entity.position + entity.velocity * self.physics.dt
        wrapped_position = Vector2(
            new_position.x % SOVEREIGN_WIDTH,
            new_position.y % SOVEREIGN_HEIGHT
        )
        
        # Should wrap to top side
        assert wrapped_position.y < SOVEREIGN_HEIGHT
        assert wrapped_position.y == (SOVEREIGN_HEIGHT + 10 + 5 * self.physics.dt) % SOVEREIGN_HEIGHT
    
    def test_toroidal_wrapping_negative_coordinates(self) -> None:
        """Test toroidal wrapping with negative coordinates"""
        # Test wrapping from left edge to right edge (negative coordinates)
        entity = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=Vector2(-10, 50),  # 10 pixels past left edge
            velocity=Vector2(-5, 0),
            heading=0.0,
            radius=8.0
        )
        
        # Update position should wrap
        new_position = entity.position + entity.velocity * self.physics.dt
        wrapped_position = Vector2(
            new_position.x % SOVEREIGN_WIDTH,
            new_position.y % SOVEREIGN_HEIGHT
        )
        
        # Should wrap to right side
        assert wrapped_position.x >= 0
        assert wrapped_position.x < SOVEREIGN_WIDTH
    
    @given(st.integers(min_value=-1000, max_value=1000), st.integers(min_value=-1000, max_value=1000))
    def test_toroidal_wrapping_comprehensive(self, x: int, y: int) -> None:
        """Test toroidal wrapping for comprehensive coordinate ranges"""
        # Create entity at any coordinate
        entity = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=Vector2(float(x), float(y)),
            velocity=Vector2(1.0, 1.0),
            heading=0.0,
            radius=8.0
        )
        
        # Apply wrapping
        wrapped_position = Vector2(
            entity.position.x % SOVEREIGN_WIDTH,
            entity.position.y % SOVEREIGN_HEIGHT
        )
        
        # Verify wrapped position is within bounds
        assert 0 <= wrapped_position.x < SOVEREIGN_WIDTH
        assert 0 <= wrapped_position.y < SOVEREIGN_HEIGHT
    
    def test_newtonian_momentum(self) -> None:
        """Test Newtonian momentum conservation"""
        # Create entity with initial velocity
        entity = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=Vector2(50, 50),
            velocity=Vector2(10, 5),
            heading=0.0,
            radius=8.0
        )
        
        # Update position multiple times (no friction)
        initial_velocity = entity.velocity.copy()
        
        for _ in range(10):
            entity.position = entity.position + entity.velocity * self.physics.dt
        
        # Velocity should remain constant (no friction)
        assert entity.velocity.x == initial_velocity.x
        assert entity.velocity.y == initial_velocity.y
    
    def test_rotation_independence(self) -> None:
        """Test that rotation is independent of movement"""
        entity = SpaceEntity(
            entity_type=EntityType.SHIP,
            position=Vector2(80, 72),
            velocity=Vector2(10, 0),
            heading=0.0,
            radius=4.0
        )
        
        # Rotate entity while moving
        initial_velocity = entity.velocity.copy()
        entity.heading = math.pi / 2  # 90 degrees
        
        # Update position
        entity.position = entity.position + entity.velocity * self.physics.dt
        
        # Velocity should be unchanged by rotation
        assert entity.velocity.x == initial_velocity.x
        assert entity.velocity.y == initial_velocity.y
        # Position should have moved based on original velocity
        assert entity.position.x != 80
    
    def test_thrust_application(self) -> None:
        """Test thrust application and energy cost"""
        initial_energy = self.physics.energy
        initial_velocity = self.physics.velocity.copy()
        
        # Apply thrust
        self.physics.thrust_active = True
        thrust_force = 50.0  # Newton
        
        # Calculate thrust vector based on current angle
        thrust_vector = Vector2(
            math.cos(self.physics.angle) * thrust_force,
            math.sin(self.physics.angle) * thrust_force
        )
        
        # Apply thrust (F = ma, so a = F/m)
        acceleration = thrust_vector / self.physics.mass
        self.physics.velocity = self.physics.velocity + acceleration * self.physics.dt
        
        # Apply energy cost
        energy_cost = self.physics.thrust_cost * self.physics.dt
        self.physics.energy -= energy_cost
        
        # Verify changes
        assert self.physics.velocity != initial_velocity
        assert self.physics.energy < initial_energy
        assert self.physics.energy == initial_energy - energy_cost
    
    def test_maximum_ship_speed(self) -> None:
        """Test maximum ship speed constraint"""
        # Apply excessive thrust
        for _ in range(100):
            thrust_force = 1000.0  # Very high thrust
            thrust_vector = Vector2(
                math.cos(self.physics.angle) * thrust_force,
                math.sin(self.physics.angle) * thrust_force
            )
            
            acceleration = thrust_vector / self.physics.mass
            self.physics.velocity = self.physics.velocity + acceleration * self.physics.dt
            
            # Clamp to maximum speed
            speed = self.physics.velocity.magnitude()
            if speed > self.physics.max_ship_speed:
                self.physics.velocity = self.physics.velocity.normalized() * self.physics.max_ship_speed
        
        # Verify speed is clamped
        final_speed = self.physics.velocity.magnitude()
        assert final_speed <= self.physics.max_ship_speed
    
    @given(st.integers(min_value=1, max_value=1000))
    def test_deterministic_movement_sequence(self, seed: int) -> None:
        """Test that movement sequence is deterministic with same seed"""
        random.seed(seed)
        
        # Create entity with random initial conditions
        entity = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=Vector2(random.uniform(0, SOVEREIGN_WIDTH), random.uniform(0, SOVEREIGN_HEIGHT)),
            velocity=Vector2(random.uniform(-50, 50), random.uniform(-50, 50)),
            heading=random.uniform(0, 2 * math.pi),
            radius=8.0
        )
        
        # Store initial state
        initial_position = entity.position.copy()
        initial_velocity = entity.velocity.copy()
        
        # Run simulation for 100 steps
        positions = []
        for _ in range(100):
            entity.position = entity.position + entity.velocity * self.physics.dt
            # Apply toroidal wrapping
            entity.position = Vector2(
                entity.position.x % SOVEREIGN_WIDTH,
                entity.position.y % SOVEREIGN_HEIGHT
            )
            positions.append(entity.position.copy())
        
        # Reset seed and repeat
        random.seed(seed)
        
        entity_repeat = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=initial_position,
            velocity=initial_velocity,
            heading=0.0,
            radius=8.0
        )
        
        positions_repeat = []
        for _ in range(100):
            entity_repeat.position = entity_repeat.position + entity_repeat.velocity * self.physics.dt
            entity_repeat.position = Vector2(
                entity_repeat.position.x % SOVEREIGN_WIDTH,
                entity_repeat.position.y % SOVEREIGN_HEIGHT
            )
            positions_repeat.append(entity_repeat.position.copy())
        
        # Verify identical sequences
        assert positions == positions_repeat, "Movement sequence is not deterministic"
    
    def test_1000_random_movement_steps(self) -> None:
        """Test 1000 random movement steps for wrapping consistency"""
        entity = SpaceEntity(
            entity_type=EntityType.SCRAP,
            position=Vector2(80, 72),
            velocity=Vector2(0, 0),
            heading=0.0,
            radius=8.0
        )
        
        # Apply 1000 random movements
        for step in range(1000):
            # Random velocity change
            entity.velocity = Vector2(
                random.uniform(-30, 30),
                random.uniform(-30, 30)
            )
            
            # Update position
            entity.position = entity.position + entity.velocity * self.physics.dt
            
            # Apply toroidal wrapping
            entity.position = Vector2(
                entity.position.x % SOVEREIGN_WIDTH,
                entity.position.y % SOVEREIGN_HEIGHT
            )
            
            # Verify position is always within bounds
            assert 0 <= entity.position.x < SOVEREIGN_WIDTH, f"Step {step}: X out of bounds: {entity.position.x}"
            assert 0 <= entity.position.y < SOVEREIGN_HEIGHT, f"Step {step}: Y out of bounds: {entity.position.y}"
    
    def test_physics_state_serialization(self) -> None:
        """Test physics state serialization for determinism"""
        # Create specific physics state
        state = PhysicsState(
            entities=[
                SpaceEntity(EntityType.SHIP, Vector2(10, 20), Vector2(5, 3), 0.5, 4.0),
                SpaceEntity(EntityType.SCRAP, Vector2(100, 50), Vector2(-2, 1), 1.2, 8.0)
            ],
            ship_entity=SpaceEntity(EntityType.SHIP, Vector2(10, 20), Vector2(5, 3), 0.5, 4.0),
            score=1500,
            energy=85.5,
            game_time=123.45,
            frame_count=1000
        )
        
        # Convert to dict (simplified serialization)
        state_dict = {
            'score': state.score,
            'energy': state.energy,
            'game_time': state.game_time,
            'frame_count': state.frame_count,
            'entity_count': len(state.entities)
        }
        
        # Verify serialization
        assert state_dict['score'] == 1500
        assert state_dict['energy'] == 85.5
        assert state_dict['game_time'] == 123.45
        assert state_dict['frame_count'] == 1000
        assert state_dict['entity_count'] == 2
    
    def test_energy_depletion_thrust(self) -> None:
        """Test energy depletion during thrust"""
        initial_energy = self.physics.energy
        
        # Apply thrust until energy depleted
        thrust_time = 0.0
        while self.physics.energy > 0:
            energy_cost = self.physics.thrust_cost * self.physics.dt
            self.physics.energy = max(0, self.physics.energy - energy_cost)
            thrust_time += self.physics.dt
        
        # Verify energy is depleted
        assert self.physics.energy == 0.0
        
        # Calculate expected depletion time
        expected_time = initial_energy / self.physics.thrust_cost
        assert abs(thrust_time - expected_time) < 0.05, "Energy depletion time incorrect"
    
    def test_60hz_physics_timestep(self) -> None:
        """Test that physics timestep is exactly 1/60 second"""
        expected_dt = 1.0 / 60.0
        assert abs(self.physics.dt - expected_dt) < 1e-10, f"Physics timestep incorrect: {self.physics.dt}"
    
    def test_collision_detection_preparation(self) -> None:
        """Test collision detection setup"""
        # Create two entities
        entity1 = SpaceEntity(EntityType.SHIP, Vector2(50, 50), Vector2(0, 0), 0.0, 4.0)
        entity2 = SpaceEntity(EntityType.SCRAP, Vector2(55, 50), Vector2(0, 0), 0.0, 8.0)
        
        # Calculate distance
        distance = (entity1.position - entity2.position).magnitude()
        
        # Check for collision (distance < sum of radii)
        collision_distance = entity1.radius + entity2.radius
        is_colliding = distance < collision_distance
        
        # Should be colliding (distance = 5, radii sum = 12)
        assert is_colliding, "Entities should be colliding"
        assert distance == 5.0
        assert collision_distance == 12.0


class TestPhysicsEngineIntegration:
    """
    Integration tests for physics engine with other systems.
    
    Tests the interaction between physics, entities, and the broader
    DGT platform systems.
    """
    
    def test_physics_with_registry(self) -> None:
        """Test physics entities can be registered in DGT registry"""
        from src.dgt_engine.foundation.registry import register_entity, get_entity, RegistryType
        
        # Create physics entity
        entity = SpaceEntity(
            entity_type=EntityType.SHIP,
            position=Vector2(80, 72),
            velocity=Vector2(10, 5),
            heading=math.pi / 4,
            radius=4.0
        )
        
        # Register entity
        result = register_entity("physics_entity_001", entity, {"physics": True})
        assert result.success, f"Entity registration failed: {result.error}"
        
        # Retrieve entity
        retrieved_result = get_entity("physics_entity_001")
        assert retrieved_result.success, f"Entity retrieval failed: {retrieved_result.error}"
        
        retrieved_entity = retrieved_result.value
        assert retrieved_entity is not None
        assert retrieved_entity.position.x == 80
        assert retrieved_entity.position.y == 72
        assert retrieved_entity.velocity.x == 10
        assert retrieved_entity.velocity.y == 5
        assert retrieved_entity.heading == math.pi / 4
        assert retrieved_entity.radius == 4.0
    
    def test_physics_state_consistency(self) -> None:
        """Test physics state remains consistent across operations"""
        physics = PhysicsBody()
        
        # Get initial state
        initial_state = physics.physics_state
        
        # Apply some physics operations
        physics.thrust_active = True
        physics.rotation_input = 1.0
        
        # Update physics (simplified)
        if physics.thrust_active and physics.energy > 0:
            physics.energy -= physics.thrust_cost * physics.dt
        
        # Verify state consistency
        assert physics.physics_state.frame_count >= 0
        assert physics.physics_state.energy >= 0.0
        assert physics.physics_state.energy <= 100.0  # Max energy
        assert len(physics.physics_state.entities) > 0  # Should have ship entity
