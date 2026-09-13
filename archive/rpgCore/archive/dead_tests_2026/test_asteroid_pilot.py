"""
Asteroid Pilot — Unit Tests

Verifies the steering behaviors and survival telemetry.
"""

import math
import sys
from pathlib import Path
import pytest

# Ensure src/ is importable
_src = Path(__file__).resolve().parent.parent / "src"
if str(_src) not in sys.path:
    sys.path.insert(0, str(_src))

from rpg_core.foundation.vector import Vector2
from rpg_core.systems.body.kinetics import KineticEntity
from rpg_core.game_engine.actors.asteroid_pilot import AsteroidPilot
from apps.space.asteroids_slice import Asteroid


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def pilot():
    return AsteroidPilot()

@pytest.fixture
def ship():
    return KineticEntity(
        position=Vector2(80, 72),
        velocity=Vector2.zero(),
        wrap_bounds=(160, 144)
    )

# ---------------------------------------------------------------------------
# Steering Tests
# ---------------------------------------------------------------------------

class TestSteering:
    """Verify individual steering behaviors."""

    def test_seek_steers_toward_waypoint(self, pilot, ship):
        """Pure seek should produce a vector pointing to target."""
        # Target to the right
        waypoint = Vector2(100, 72)
        pilot._current_waypoint = waypoint
        
        # Override config to isolate seek
        pilot.config.seek_weight = 1.0
        pilot.config.avoid_weight = 0.0
        
        steering = pilot.compute_steering(ship, [], (160, 144))
        
        # Should point right (1, 0)
        assert steering.x > 0
        assert abs(steering.y) < 0.1
        
    def test_avoid_steers_away_from_threat(self, pilot, ship):
        """Nearby asteroid should produce repulsion vector."""
        # Asteroid to the right (at 90, 72) — 10px away
        asteroid = Asteroid(
            kinetics=KineticEntity(position=Vector2(90, 72)),
            radius=4.0
        )
        
        pilot.config.seek_weight = 0.0
        pilot.config.avoid_weight = 1.0
        
        steering = pilot.compute_steering(ship, [asteroid], (160, 144))
        
        # Should steer left (away from asteroid)
        assert steering.x < 0
        assert abs(steering.y) < 0.1

    def test_combined_steering(self, pilot, ship):
        """Verify seek and avoid interact."""
        # Waypoint to right (desires +x)
        pilot._current_waypoint = Vector2(120, 72)
        
        # Asteroid directly in path (at 90, 72)
        asteroid = Asteroid(
            kinetics=KineticEntity(position=Vector2(90, 72)),
            radius=4.0
        )
        
        # Dial down seek so avoidance can win without being inside the rock
        pilot.config.seek_weight = 0.01
        pilot.config.avoid_weight = 10.0
        
        steering = pilot.compute_steering(ship, [asteroid], (160, 144))
        
        # Should steer away from asteroid (dominates due to proximity)
        # Even though we want to go right, the rock is RIGHT THERE
        assert steering.x < 0 

    def test_waypoint_selection(self, pilot, ship):
        """Pilot picks a new waypoint when reached."""
        pilot._current_waypoint = Vector2(80, 72) # We are here
        
        # Calling compute_steering should trigger new waypoint selection
        pilot.compute_steering(ship, [], (160, 144))
        
        assert pilot._current_waypoint != Vector2(80, 72)
        assert pilot.log.waypoints_reached == 1


# ---------------------------------------------------------------------------
# Telemetry Tests
# ---------------------------------------------------------------------------

class TestTelemetry:
    """Verify survival logging."""

    def test_maneuver_tracking(self, pilot, ship):
        """Avoidance maneuvers are counted."""
        asteroid = Asteroid(
            kinetics=KineticEntity(position=Vector2(85, 72)), 
            radius=4.0
        )
        # This will trigger avoidance
        pilot.compute_steering(ship, [asteroid], (160, 144))
        
        assert pilot.log.avoidance_maneuvers == 1
        assert pilot.log.closest_call_distance < 10.0

    def test_cooldown_execution(self, pilot, ship):
        """Maneuvers are not spammed every frame."""
        asteroid = Asteroid(
            kinetics=KineticEntity(position=Vector2(85, 72)), 
            radius=4.0
        )
        
        # First frame triggers count
        pilot.compute_steering(ship, [asteroid], (160, 144))
        assert pilot.log.avoidance_maneuvers == 1
        
        # Second frame (within cooldown) should not increment
        pilot.compute_steering(ship, [asteroid], (160, 144))
        assert pilot.log.avoidance_maneuvers == 1

# ---------------------------------------------------------------------------
# Heading Control Tests
# ---------------------------------------------------------------------------

class TestHeadingControl:
    """Verify the apply_to_ship helper."""
    
    def test_turns_toward_steering(self, ship):
        # Ship facing Right (0.0)
        # Steering is Up (0, -1) -> -1.57 rad (-pi/2) -> wrapped to 3pi/2 (4.71)
        steering = Vector2(0, -100)
        
        AsteroidPilot.apply_to_ship(steering, ship, dt=1.0) # Large dt to ensure full turn
        
        # Should be facing Up (3pi/2)
        target = 3 * math.pi / 2
        assert abs(ship.heading - target) < 0.1

    def test_thrusts_when_steering(self, ship):
        steering = Vector2(100, 0)
        AsteroidPilot.apply_to_ship(steering, ship, dt=1.0)
        
        # Should have acceleration
        assert ship.acceleration.magnitude() > 0

    def test_no_thrust_when_idling(self, ship):
        steering = Vector2.zero()
        AsteroidPilot.apply_to_ship(steering, ship, dt=1.0)
        
        assert ship.acceleration.magnitude() == 0
