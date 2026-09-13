"""
Asteroids Core Implementation Tests
Verifies physics, wrapping, projectiles, and fracturing.
"""
import pytest
import math
from src.shared.entities.kinetics import KineticBody, Vector2D
from src.shared.entities.projectiles import ProjectileSystem
from src.shared.entities.fracture import FractureSystem, AsteroidFragment
from src.apps.asteroids.simulation.physics import update_kinetics
from src.apps.asteroids.simulation.collision import check_circle_collision

def test_ship_thrust_increases_velocity():
    """Verify that applying thrust changes the ship's velocity."""
    body = KineticBody(initial_velocity=Vector2D(0, 0), initial_angle=0) # Facing Right
    # Apply thrust for 1 second
    body.apply_thrust(1.0, 1.0)
    assert body.state.velocity.x > 0
    assert body.state.velocity.y == 0

def test_toroidal_wrap():
    """Verify entities wrap around the 160x144 boundary."""
    # Start near right edge, moving right
    body = KineticBody(initial_position=Vector2D(159, 72), initial_velocity=Vector2D(10, 0))
    # Update for 1 second: 159 + 10 = 169. 169 % 160 = 9.
    update_kinetics(body, 1.0, (160, 144))
    assert body.state.position.x == 9.0

def test_projectile_expiration():
    """Verify projectiles are removed after their lifetime."""
    system = ProjectileSystem(max_projectiles=4)
    # Fire at time 0
    system.fire_projectile("player", 80, 72, 0, 0.0)
    assert len(system.active_projectiles) == 1
    
    # Update to 2.1 seconds
    system.update(0.1, 2.1)
    assert len(system.active_projectiles) == 0

def test_asteroid_fracture():
    """Verify a large asteroid splits into two medium ones."""
    system = FractureSystem()
    large = AsteroidFragment(
        kinetic_body=KineticBody(initial_position=Vector2D(80, 72)),
        size=3, health=1, radius=8.0, color=(170,170,170), point_value=20
    )
    fragments = system.fracture_asteroid(large)
    assert len(fragments) == 2
    for f in fragments:
        assert f.size == 2
        assert f.radius == 4.0

def test_collision_logic():
    """Verify circle-to-circle collision detection."""
    # Overlapping
    assert check_circle_collision((80, 72), 5, (82, 72), 5) == True
    # Not overlapping
    assert check_circle_collision((80, 72), 5, (100, 72), 5) == False
