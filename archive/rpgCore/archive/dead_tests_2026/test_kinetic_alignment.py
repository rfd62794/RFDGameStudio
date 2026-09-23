"""
Kinetic Alignment Contract Tests

Verifies Option C compliance:
  1. SpaceShip composes KineticEntity (not raw x/y)
  2. Proxy properties delegate correctly
  3. KineticEntity physics are applied during simulation
  4. VFX modules importable from dgt_engine.engines/graphics/fx/
"""

import sys
from pathlib import Path

# Ensure src is on path
_src = str(Path(__file__).resolve().parent.parent / "src")
if _src not in sys.path:
    sys.path.insert(0, _src)

import math
import pytest
from dgt_engine.foundation.vector import Vector2
from dgt_engine.engines.body.kinetics import KineticEntity


# ---------------------------------------------------------------------------
# Phase 1: SpaceShip ↔ KineticEntity Composition
# ---------------------------------------------------------------------------

class TestSpaceShipComposition:
    """Verify SpaceShip delegates all spatial state to KineticEntity."""

    @pytest.fixture
    def genome(self):
        """Minimal ShipGenome for testing."""
        from apps.space.ship_genetics import ShipGenome
        return ShipGenome()

    @pytest.fixture
    def ship(self, genome):
        from apps.space.space_voyager_engine import SpaceShip
        kinetics = KineticEntity(
            position=Vector2(80.0, 72.0),
            velocity=Vector2(0.0, 0.0),
            wrap_bounds=(160, 144),
        )
        return SpaceShip(ship_id="test_001", genome=genome, kinetics=kinetics)

    def test_spaceship_has_kinetic_entity(self, ship):
        """SpaceShip must have a 'kinetics' attribute of type KineticEntity."""
        assert hasattr(ship, "kinetics")
        assert isinstance(ship.kinetics, KineticEntity)

    def test_position_delegates_to_kinetics(self, ship):
        """ship.position must return ship.kinetics.position."""
        assert ship.position is ship.kinetics.position
        assert ship.position.x == 80.0
        assert ship.position.y == 72.0

    def test_velocity_delegates_to_kinetics(self, ship):
        """ship.velocity must return ship.kinetics.velocity."""
        assert ship.velocity is ship.kinetics.velocity

    def test_heading_delegates_to_kinetics(self, ship):
        """ship.heading must return ship.kinetics.heading."""
        ship.kinetics.heading = 1.57
        assert ship.heading == pytest.approx(1.57)

    def test_heading_setter(self, ship):
        """Setting ship.heading must update kinetics.heading."""
        ship.heading = 3.14
        assert ship.kinetics.heading == pytest.approx(3.14)

    def test_genetics_maps_mass(self, ship):
        """Genome.plating_density must configure kinetics.mass."""
        expected_mass = 1.0 + (ship.genome.plating_density * 0.5)
        assert ship.kinetics.mass == pytest.approx(expected_mass)

    def test_genetics_maps_max_velocity(self, ship):
        """Genome.thruster_output must configure kinetics.max_velocity."""
        expected_max_v = 10.0 * ship.genome.thruster_output
        assert ship.kinetics.max_velocity == pytest.approx(expected_max_v)

    def test_zero_drag_in_space(self, ship):
        """Space ships should have zero drag."""
        assert ship.kinetics.drag == 0.0


class TestKineticPhysicsApplied:
    """Verify KineticEntity.update(dt) actually moves the ship."""

    @pytest.fixture
    def genome(self):
        from apps.space.ship_genetics import ShipGenome
        return ShipGenome()

    @pytest.fixture
    def ship(self, genome):
        from apps.space.space_voyager_engine import SpaceShip
        kinetics = KineticEntity(
            position=Vector2(10.0, 10.0),
            velocity=Vector2(5.0, 0.0),
            wrap_bounds=(160, 144),
        )
        return SpaceShip(ship_id="physics_test", genome=genome, kinetics=kinetics)

    def test_velocity_moves_position(self, ship):
        """Position must change when velocity is non-zero after update."""
        initial_x = ship.position.x
        ship.kinetics.update(0.016)
        assert ship.position.x > initial_x

    def test_thrust_applies_acceleration(self, ship):
        """set_thrust must increase velocity magnitude."""
        ship.kinetics.velocity = Vector2.zero()
        ship.kinetics.heading = 0.0  # Thrust rightward
        ship.kinetics.set_thrust(50.0)
        ship.kinetics.update(0.016)
        assert ship.velocity.magnitude() > 0.0

    def test_toroidal_wrapping(self, ship):
        """Ship at boundary should wrap to opposite side."""
        ship.kinetics.position = Vector2(159.0, 72.0)
        ship.kinetics.velocity = Vector2(200.0, 0.0)
        ship.kinetics.update(0.1)
        # After wrapping, x should be < 160
        assert 0 <= ship.position.x < 160


# ---------------------------------------------------------------------------
# Phase 1b: Fleet Operations
# ---------------------------------------------------------------------------

class TestFleetOperations:
    """Verify SpaceVoyagerEngineRunner works with composed ships."""

    @pytest.fixture
    def runner(self):
        from apps.space.space_voyager_engine import SpaceVoyagerEngineRunner
        return SpaceVoyagerEngineRunner(fleet_size=3)

    @pytest.fixture
    def genomes(self):
        from apps.space.ship_genetics import ShipGenome
        return [ShipGenome() for _ in range(3)]

    def test_fleet_creation_uses_kinetic_entity(self, runner, genomes):
        """All ships in fleet must have KineticEntity components."""
        fleet = runner.create_fleet_from_genomes(genomes)
        for ship in fleet.values():
            assert isinstance(ship.kinetics, KineticEntity)

    def test_fleet_positions_via_kinetics(self, runner, genomes):
        """get_ship_positions must return positions from KineticEntity."""
        runner.create_fleet_from_genomes(genomes)
        positions = runner.get_ship_positions()
        assert len(positions) == 3
        for pos in positions.values():
            assert isinstance(pos, tuple)
            assert len(pos) == 2

    def test_simulation_step_updates_positions(self, runner, genomes):
        """One simulation step must change ship positions when targeted."""
        runner.create_fleet_from_genomes(genomes)
        # Assign ship_000 to chase ship_002
        assignments = {"ship_000": "ship_002", "ship_001": None, "ship_002": None}
        initial_pos = runner.ships["ship_000"].position.to_tuple()
        runner.update_simulation(assignments)
        new_pos = runner.ships["ship_000"].position.to_tuple()
        # Ship chasing a target should have moved
        assert initial_pos != new_pos

    def test_reset_clears_velocity(self, runner, genomes):
        """reset_simulation must zero all velocities."""
        runner.create_fleet_from_genomes(genomes)
        runner.ships["ship_000"].kinetics.velocity = Vector2(99.0, 99.0)
        runner.reset_simulation()
        assert runner.ships["ship_000"].velocity.magnitude() == pytest.approx(0.0)


# ---------------------------------------------------------------------------
# Phase 2: VFX Import Verification
# ---------------------------------------------------------------------------

class TestVFXRelocation:
    """Verify VFX modules are importable from new location."""

    def test_particle_effects_import(self):
        """ParticleEffectsSystem must be importable from dgt_engine.engines.graphics.fx."""
        from dgt_engine.engines.graphics.fx.particle_effects import ParticleEffectsSystem
        system = ParticleEffectsSystem()
        assert system is not None

    def test_exhaust_system_import(self):
        """ExhaustSystem must be importable from dgt_engine.engines.graphics.fx."""
        from dgt_engine.engines.graphics.fx.exhaust_system import ExhaustSystem
        system = ExhaustSystem()
        assert system is not None

    def test_package_level_import(self):
        """Top-level engines.graphics.fx must export both systems."""
        from dgt_engine.engines.graphics.fx import ParticleEffectsSystem, ExhaustSystem
        assert ParticleEffectsSystem is not None
        assert ExhaustSystem is not None

    def test_old_location_removed(self):
        """Old files must NOT exist at engines/body/."""
        body_path = Path(__file__).resolve().parent.parent / "src" / "engines" / "body"
        assert not (body_path / "particle_effects.py").exists(), (
            "particle_effects.py still exists in engines/body/"
        )
        assert not (body_path / "exhaust_system.py").exists(), (
            "exhaust_system.py still exists in engines/body/"
        )
