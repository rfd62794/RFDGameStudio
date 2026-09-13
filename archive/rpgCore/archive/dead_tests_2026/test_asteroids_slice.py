"""
Asteroids Stress Test — Contract Tests

Validates the Asteroids Slice orchestrator:
- Ship creation with KineticEntity
- Asteroid field spawning
- ExhaustSystem wiring
- Frame rendering
- Collision detection
- Full 300-frame stress run
"""

import sys
import math
from pathlib import Path

import pytest

# Ensure src/ is importable
_src = Path(__file__).resolve().parent.parent / "src"
if str(_src) not in sys.path:
    sys.path.insert(0, str(_src))

from dgt_engine.foundation.vector import Vector2
from dgt_engine.engines.body.kinetics import KineticEntity


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def slice_instance():
    """Create a fresh AsteroidsSlice (no field spawned yet)."""
    from apps.space.asteroids_slice import AsteroidsSlice
    return AsteroidsSlice(asteroid_count=50)


@pytest.fixture
def ready_slice(slice_instance):
    """Slice with field spawned and exhaust wired (no perf monitor yet)."""
    slice_instance.spawn_asteroid_field()
    slice_instance.wire_exhaust()
    return slice_instance


# ---------------------------------------------------------------------------
# Ship + KineticEntity
# ---------------------------------------------------------------------------

class TestShipCreation:
    """SpaceShip is created with a proper KineticEntity component."""

    def test_ship_has_kinetics(self, slice_instance):
        assert hasattr(slice_instance.ship, "kinetics")
        assert isinstance(slice_instance.ship.kinetics, KineticEntity)

    def test_ship_starts_at_center(self, slice_instance):
        pos = slice_instance.ship.position
        assert abs(pos.x - 80) < 1
        assert abs(pos.y - 72) < 1

    def test_ship_wraps_toroidally(self, slice_instance):
        ship_k = slice_instance.ship.kinetics
        assert ship_k.wrap_bounds == (160, 144)


# ---------------------------------------------------------------------------
# Asteroid Field
# ---------------------------------------------------------------------------

class TestAsteroidField:
    """50 asteroids are spawned as KineticEntity objects."""

    def test_spawns_correct_count(self, ready_slice):
        assert len(ready_slice.asteroids) == 50

    def test_asteroids_have_kinetics(self, ready_slice):
        for a in ready_slice.asteroids:
            assert isinstance(a.kinetics, KineticEntity)

    def test_asteroids_have_velocity(self, ready_slice):
        moving = [a for a in ready_slice.asteroids
                  if a.kinetics.velocity.magnitude() > 0]
        # With random velocities, nearly all should be non-zero
        assert len(moving) > 40

    def test_asteroids_wrap(self, ready_slice):
        for a in ready_slice.asteroids:
            assert a.kinetics.wrap_bounds == (160, 144)

    def test_asteroid_radii_in_range(self, ready_slice):
        for a in ready_slice.asteroids:
            assert 2.0 <= a.radius <= 6.0


# ---------------------------------------------------------------------------
# Exhaust Wiring
# ---------------------------------------------------------------------------

class TestExhaustWiring:
    """ExhaustSystem is connected to the ship's emitter."""

    def test_emitter_registered(self, ready_slice):
        assert ready_slice.ship.ship_id in ready_slice.exhaust.emitters

    def test_emitter_engine_type(self, ready_slice):
        emitter = ready_slice.exhaust.emitters[ready_slice.ship.ship_id]
        # Should be a valid engine type string
        assert emitter.engine_type in ("ion", "fusion", "antimatter", "solar", "warp")


# ---------------------------------------------------------------------------
# Single-Frame Render
# ---------------------------------------------------------------------------

class TestFrameRender:
    """One simulation frame runs without error."""

    def test_single_frame_no_crash(self, ready_slice):
        from dgt_engine.foundation.utils.performance_monitor import initialize_performance_monitor
        ready_slice.perf = initialize_performance_monitor(target_fps=60)
        ready_slice.perf.start_frame()
        result = ready_slice.update(1.0 / 60.0)
        ready_slice.perf.end_frame()
        assert result["frame"] == 1

    def test_frame_buffer_not_empty(self, ready_slice):
        from dgt_engine.foundation.utils.performance_monitor import initialize_performance_monitor
        ready_slice.perf = initialize_performance_monitor(target_fps=60)
        ready_slice.perf.start_frame()
        ready_slice.update(1.0 / 60.0)
        ready_slice.perf.end_frame()
        # At least some pixels should have been drawn
        non_zero = sum(1 for b in ready_slice.frame_buffer if b != 0)
        assert non_zero > 0


# ---------------------------------------------------------------------------
# Collision Detection
# ---------------------------------------------------------------------------

class TestCollisionDetection:
    """Ship-asteroid collisions are detected."""

    def test_no_collision_when_far(self, slice_instance):
        """Ship at center, asteroid far away → no collision."""
        slice_instance.asteroids = []
        far_ast = type("A", (), {
            "kinetics": KineticEntity(position=Vector2(0, 0)),
            "radius": 3.0,
            "active": True,
        })()
        slice_instance.asteroids.append(far_ast)
        hits = slice_instance._check_collisions()
        assert hits == 0

    def test_collision_when_overlapping(self, slice_instance):
        """Ship and asteroid at same position → collision."""
        slice_instance.asteroids = []
        same_pos = type("A", (), {
            "kinetics": KineticEntity(position=Vector2(80, 72)),
            "radius": 3.0,
            "active": True,
        })()
        slice_instance.asteroids.append(same_pos)
        hits = slice_instance._check_collisions()
        assert hits == 1


# ---------------------------------------------------------------------------
# Toroidal Wrapping
# ---------------------------------------------------------------------------

class TestToroidalWrapping:
    """Asteroids and ship wrap correctly at boundaries."""

    def test_asteroid_wraps_past_right_edge(self):
        k = KineticEntity(
            position=Vector2(159, 72),
            velocity=Vector2(30, 0),
            wrap_bounds=(160, 144),
        )
        k.update(1.0 / 60.0)
        assert 0 <= k.position.x < 160

    def test_asteroid_wraps_past_bottom_edge(self):
        k = KineticEntity(
            position=Vector2(80, 143),
            velocity=Vector2(0, 30),
            wrap_bounds=(160, 144),
        )
        k.update(1.0 / 60.0)
        assert 0 <= k.position.y < 144


# ---------------------------------------------------------------------------
# Full Stress Run
# ---------------------------------------------------------------------------

class TestStressRun:
    """300-frame stress run completes and returns valid metrics."""

    def test_300_frame_run(self):
        from apps.space.asteroids_slice import AsteroidsSlice
        from loguru import logger
        logger.remove()  # Silence during test

        s = AsteroidsSlice(asteroid_count=50)
        report = s.run(frames=300)

        assert report["frames_rendered"] == 300
        assert report["avg_fps"] > 0
        assert report["avg_frame_time_ms"] > 0
        assert "physics" in report["pillar_avg_ms"]
        assert "vfx" in report["pillar_avg_ms"]
        assert "collision" in report["pillar_avg_ms"]
        assert "render" in report["pillar_avg_ms"]

    def test_frame_budget_compliance(self):
        """Average frame time should be well under 16.7ms for this headless sim."""
        from apps.space.asteroids_slice import AsteroidsSlice
        from loguru import logger
        logger.remove()

        s = AsteroidsSlice(asteroid_count=50)
        report = s.run(frames=100)

        # Headless SW rasterizer — should be far under 16ms
        assert report["avg_frame_time_ms"] < 16.667, (
            f"Frame budget exceeded: {report['avg_frame_time_ms']:.3f} ms"
        )
