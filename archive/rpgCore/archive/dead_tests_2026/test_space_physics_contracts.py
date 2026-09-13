"""
Space Physics Engine Contract Tests

Phase 1: Interface Definition & Hardening

Contract tests for space physics components ensuring protocol compliance
and architectural integrity. These tests validate that all implementations
adhere to the SOLID principles and maintain the sovereign constraints.
"""

import pytest
import sys
from pathlib import Path
from typing import Dict, Any, List

# Add src to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

from dgt_core.foundation.types import Result, ValidationResult
from interfaces.protocols import (
    PhysicsProtocol, SpaceEntityProtocol, ScrapProtocol,
    TerminalHandshakeProtocol
)
from dgt_engine.engines.space.space_entity import SpaceEntity, EntityType
from dgt_engine.engines.space.vector2 import Vector2


class TestSpaceEntityContracts:
    """Contract tests for SpaceEntity implementation"""
    
    def test_space_entity_protocol_compliance(self):
        """Test that SpaceEntity implements SpaceEntityProtocol"""
        entity = SpaceEntity(
            EntityType.SHIP, 
            Vector2(80, 72), 
            Vector2(0, 0), 
            0.0
        )
        
        # Test protocol interface compliance
        assert hasattr(entity, 'entity_type'), "Missing entity_type property"
        assert hasattr(entity, 'position'), "Missing position property"
        assert hasattr(entity, 'velocity'), "Missing velocity property"
        assert hasattr(entity, 'active'), "Missing active property"
        assert hasattr(entity, 'update'), "Missing update method"
        assert hasattr(entity, 'apply_force'), "Missing apply_force method"
        assert hasattr(entity, 'check_collision'), "Missing check_collision method"
        assert hasattr(entity, 'get_state_dict'), "Missing get_state_dict method"
    
    def test_result_pattern_compliance(self):
        """Test that all public methods return Result[T] pattern"""
        entity = SpaceEntity(
            EntityType.SHIP, 
            Vector2(80, 72), 
            Vector2(0, 0), 
            0.0
        )
        
        # Test update returns Result[None]
        result = entity.update(0.016)  # 60Hz timestep
        assert isinstance(result, Result), "update() must return Result[None]"
        assert result.success is True, "update() should succeed"
        assert result.value is None, "update() should return None on success"
        
        # Test collision check returns Result[bool]
        other = SpaceEntity(
            EntityType.LARGE_ASTEROID,
            Vector2(90, 72),
            Vector2(0, 0),
            0.0
        )
        collision_result = entity.check_collision(other)
        assert isinstance(collision_result, Result), "check_collision() must return Result[bool]"
        assert isinstance(collision_result.value, bool), "check_collision() should return bool"
        
        # Test thrust application returns Result[None]
        thrust_result = entity.apply_thrust(150.0)
        assert isinstance(thrust_result, Result), "apply_thrust() must return Result[None]"
        assert thrust_result.success is True, "apply_thrust() should succeed"
        
        # Test rotation returns Result[None]
        rotation_result = entity.rotate(1.0)
        assert isinstance(rotation_result, Result), "rotate() must return Result[None]"
        assert rotation_result.success is True, "rotate() should succeed"
        
        # Test state serialization returns Result[Dict]
        state_result = entity.get_state_dict()
        assert isinstance(state_result, Result), "get_state_dict() must return Result[Dict]"
        assert isinstance(state_result.value, dict), "get_state_dict() should return dict"
        
        # Test asteroid splitting returns Result[List]
        asteroid = SpaceEntity(
            EntityType.LARGE_ASTEROID,
            Vector2(80, 72),
            Vector2(0, 0),
            0.0
        )
        split_result = asteroid.split_asteroid()
        assert isinstance(split_result, Result), "split_asteroid() must return Result[List]"
        assert isinstance(split_result.value, list), "split_asteroid() should return list"
    
    def test_sovereign_constraint_compliance(self):
        """Test compliance with 160x144 sovereign resolution"""
        entity = SpaceEntity(
            EntityType.SHIP,
            Vector2(80, 72),
            Vector2(0, 0),
            0.0
        )
        
        # Test toroidal wrapping
        entity.position = Vector2(-10, 50)  # Outside left boundary
        entity.update(0.016)
        assert 0 <= entity.position.x < 160, "X coordinate should wrap to sovereign bounds"
        
        entity.position = Vector2(170, 50)  # Outside right boundary
        entity.update(0.016)
        assert 0 <= entity.position.x < 160, "X coordinate should wrap to sovereign bounds"
        
        entity.position = Vector2(80, -10)  # Outside top boundary
        entity.update(0.016)
        assert 0 <= entity.position.y < 144, "Y coordinate should wrap to sovereign bounds"
        
        entity.position = Vector2(80, 150)  # Outside bottom boundary
        entity.update(0.016)
        assert 0 <= entity.position.y < 144, "Y coordinate should wrap to sovereign bounds"
    
    def test_newtonian_physics_compliance(self):
        """Test Newtonian physics implementation"""
        entity = SpaceEntity(
            EntityType.SHIP,
            Vector2(80, 72),
            Vector2(10, 0),  # Moving right
            0.0
        )
        
        initial_position = entity.position.x
        initial_velocity = entity.velocity.x
        
        # Update physics (no friction in Newtonian space)
        dt = 0.016  # 60Hz
        entity.update(dt)
        
        # Position should change based on velocity
        assert entity.position.x > initial_position, "Position should update based on velocity"
        
        # Velocity should remain constant (no friction)
        assert abs(entity.velocity.x - initial_velocity) < 0.001, "Velocity should remain constant"
        
        # Test thrust changes velocity
        entity.apply_thrust(150.0)
        entity.update(dt)
        assert entity.velocity.x > initial_velocity, "Thrust should change velocity"
    
    def test_entity_type_initialization(self):
        """Test proper initialization of different entity types"""
        # Test ship initialization
        ship = SpaceEntity(EntityType.SHIP, Vector2(80, 72), Vector2(0, 0), 0.0)
        assert ship.entity_type == EntityType.SHIP
        assert ship.radius == 4.0
        assert ship.mass == 1.0
        assert ship.thrust_force == 150.0
        assert len(ship.vertices) == 3  # Triangle shape
        
        # Test large asteroid initialization
        asteroid = SpaceEntity(EntityType.LARGE_ASTEROID, Vector2(80, 72), Vector2(0, 0), 0.0)
        assert asteroid.entity_type == EntityType.LARGE_ASTEROID
        assert asteroid.radius == 12.0
        assert asteroid.mass == 4.0
        assert asteroid.velocity.magnitude() > 0  # Should have random velocity
        
        # Test bullet initialization
        bullet = SpaceEntity(EntityType.BULLET, Vector2(80, 72), Vector2(0, 0), 0.0)
        assert bullet.entity_type == EntityType.BULLET
        assert bullet.radius == 1.0
        assert bullet.mass == 0.1
        assert bullet.lifetime == 1.0
        assert bullet.velocity.magnitude() == 300.0  # Fast bullet speed


class TestPhysicsEngineContracts:
    """Contract tests for physics engine components"""
    
    def test_physics_protocol_interface(self):
        """Test physics engine protocol interface compliance"""
        # This would test the actual physics body implementation
        # For now, we test the interface structure
        from dgt_engine.engines.space.physics_body import PhysicsBody
        
        physics = PhysicsBody()
        
        # Test required methods exist
        assert hasattr(physics, 'update'), "Missing update method"
        assert hasattr(physics, 'add_entity'), "Missing add_entity method"
        assert hasattr(physics, 'check_collisions'), "Missing check_collisions method"
    
    def test_error_handling_patterns(self):
        """Test consistent error handling patterns"""
        entity = SpaceEntity(
            EntityType.SHIP,
            Vector2(80, 72),
            Vector2(0, 0),
            0.0
        )
        
        # Test error conditions return proper Result pattern
        # Invalid thrust should still succeed but set thrust to 0 for non-ship
        scrap = SpaceEntity(EntityType.SCRAP, Vector2(80, 72), Vector2(0, 0), 0.0)
        thrust_result = scrap.apply_thrust(150.0)
        assert isinstance(thrust_result, Result), "Should return Result even for invalid operations"
        assert thrust_result.success is True, "Should handle invalid operations gracefully"
        
        # Test collision with inactive entity
        entity.active = False
        collision_result = entity.check_collision(scrap)
        assert collision_result.success is True, "Collision check should succeed"
        assert collision_result.value is False, "Inactive entities should not collide"


class TestScrapSystemContracts:
    """Contract tests for scrap collection system"""
    
    def test_scrap_protocol_interface(self):
        """Test scrap system protocol interface compliance"""
        from dgt_engine.engines.space.scrap_entity import ScrapEntity, ScrapType
        
        scrap = ScrapEntity(Vector2(80, 72), ScrapType.COMMON)
        
        # Test scrap properties
        assert hasattr(scrap, 'scrap_type'), "Missing scrap_type property"
        assert hasattr(scrap, 'scrap_value'), "Missing scrap_value property"
        assert hasattr(scrap, 'scrap_size'), "Missing scrap_size property"
        
        # Test scrap values are valid
        assert scrap.scrap_type in [ScrapType.COMMON, ScrapType.RARE, ScrapType.EPIC]
        assert scrap.scrap_value in [1, 3, 5]  # Valid scrap values
        assert scrap.scrap_size in [1, 2]  # Valid scrap sizes


class TestTerminalHandshakeContracts:
    """Contract tests for terminal notification system"""
    
    def test_terminal_protocol_interface(self):
        """Test terminal handshake protocol interface compliance"""
        from dgt_engine.engines.space.terminal_handshake import TerminalHandshake
        from dgt_engine.engines.space.asteroids_strategy import AsteroidsStrategy
        
        strategy = AsteroidsStrategy()
        terminal = TerminalHandshake(strategy)
        
        # Test required methods exist
        assert hasattr(terminal, 'update'), "Missing update method"
        assert hasattr(terminal, 'get_recent_messages'), "Missing get_recent_messages method"
        assert hasattr(terminal, 'get_system_status'), "Missing get_system_status method"
        assert hasattr(terminal, 'send_notification'), "Missing send_notification method"


class TestDependencyInjectionContracts:
    """Contract tests for dependency injection system"""
    
    def test_space_di_container(self):
        """Test space engine DI container configuration"""
        from dgt_engine.engines.space.space_di import SpaceEngineContainer
        
        container = SpaceEngineContainer()
        
        # Test container configuration
        config_result = container.configure()
        assert isinstance(config_result, Result), "Configure should return Result"
        assert config_result.success is True, "Container configuration should succeed"
        
        # Test dependency resolution
        physics_result = container.get_physics_engine()
        assert isinstance(physics_result, Result), "get_physics_engine should return Result"
        
        scrap_result = container.get_scrap_system()
        assert isinstance(scrap_result, Result), "get_scrap_system should return Result"
        
        terminal_result = container.get_terminal_handshake()
        assert isinstance(terminal_result, Result), "get_terminal_handshake should return Result"
        
        # Test entity creation
        entity_result = container.create_entity("ship", (80, 72), (0, 0), 0.0)
        assert isinstance(entity_result, Result), "create_entity should return Result"
        
        # Test shutdown
        shutdown_result = container.shutdown()
        assert isinstance(shutdown_result, Result), "shutdown should return Result"
        assert shutdown_result.success is True, "Container shutdown should succeed"


if __name__ == "__main__":
    # Run contract tests
    pytest.main([__file__, "-v", "--tb=short"])
