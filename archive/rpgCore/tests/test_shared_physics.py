"""
Shared Physics Pillar Tests
"""
import pytest
import math
from src.shared.physics.kinematics import Vector2, Kinematics
from src.shared.physics.toroidal import wrap_position
from src.shared.physics.gravity import apply_point_gravity

def test_toroidal_wrap_left_edge():
    """-1 % 160 should be 159."""
    assert wrap_position(-1, 72, 160, 144) == (159, 72)

def test_toroidal_wrap_right_edge():
    """160 % 160 should be 0."""
    assert wrap_position(160, 72, 160, 144) == (0, 72)

def test_toroidal_wrap_top_edge():
    """-1 % 144 should be 143."""
    assert wrap_position(80, -1, 160, 144) == (80, 143)

def test_toroidal_wrap_bottom_edge():
    """144 % 144 should be 0."""
    assert wrap_position(80, 144, 160, 144) == (80, 0)

def test_kinematics_thrust_increases_velocity():
    """Thrust should add to velocity."""
    k = Kinematics(position=Vector2(0,0), velocity=Vector2(0,0))
    # Apply force of (10, 0) for 1 second
    k.apply_force(Vector2(10, 0), 1.0)
    assert k.velocity.x == 10.0
    k.update(1.0)
    assert k.position.x == 10.0

def test_kinematics_drag_reduces_velocity():
    """Drag should slow down the entity."""
    k = Kinematics(position=Vector2(0,0), velocity=Vector2(100, 0), drag=10.0)
    # Drag force = -10 * 100 * dt = -1000 * dt
    # If dt=1.0, it should stop (capped at 0)
    k.update(0.01)
    assert k.velocity.x < 100.0
    
    # Test stopping
    k.velocity = Vector2(1, 0)
    k.drag = 100.0
    k.update(1.0)
    assert k.velocity.x == 0

def test_gravity_attracts_toward_point():
    """Point gravity should pull entity toward center."""
    k = Kinematics(position=Vector2(10, 0), velocity=Vector2(0, 0))
    target = Vector2(0, 0)
    # Pull toward (0,0)
    apply_point_gravity(k, target, strength=10.0, dt=1.0)
    # Force should be in -x direction
    assert k.velocity.x < 0
    assert k.velocity.y == 0
