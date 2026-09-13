"""
Space Voyager Engine - Physics Runner for Star-Fleet

ADR 130: Newtonian Physics Engine Integration
ADR 195: Kinetic Alignment Sprint — KineticEntity Composition

SpaceShip composes KineticEntity for all position/velocity/heading
state. Physics (inertia, drag, toroidal wrapping) are delegated to
the Tier-2 Kinetic Core rather than managed ad-hoc.
"""

print("DEBUG: Entered space_voyager_engine.py (Top)")
import sys; sys.stdout.flush()

import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field

from loguru import logger
from dgt_engine.systems.body.kinetics import KineticEntity
from dgt_engine.foundation.vector import Vector2
from .ship_genetics import ShipGenome, HullType, WeaponType, EngineType



# ---------------------------------------------------------------------------
# SpaceShip — Tier 3 Entity composing Tier 2 KineticEntity
# ---------------------------------------------------------------------------

@dataclass
class SpaceShip:
    """Space ship entity with KineticEntity physics and genetic traits.

    Composition Pattern:
        All spatial state (position, velocity, heading) lives inside
        ``self.kinetics``.  Convenience properties proxy through to
        the component so that callers reading ``ship.position`` or
        ``ship.heading`` get the canonical value without coupling to
        the internal structure.
    """

    ship_id: str
    genome: ShipGenome
    kinetics: KineticEntity = field(
        default_factory=lambda: KineticEntity(
            position=Vector2(0.0, 0.0),
            velocity=Vector2(0.0, 0.0),
            wrap_bounds=(160, 144),
        )
    )

    # Combat / durability — independent of physics
    health: float = 100.0
    max_health: float = 100.0
    armor: float = 50.0
    weapon_damage: float = 10.0
    fire_rate: float = 1.0

    def __post_init__(self) -> None:
        self._map_genetics_to_physics()

    # -- Proxy Properties ---------------------------------------------------

    @property
    def position(self) -> Vector2:
        """Canonical position — delegates to KineticEntity."""
        return self.kinetics.position

    @property
    def velocity(self) -> Vector2:
        """Canonical velocity — delegates to KineticEntity."""
        return self.kinetics.velocity

    @property
    def heading(self) -> float:
        """Canonical heading (radians) — delegates to KineticEntity."""
        return self.kinetics.heading

    @heading.setter
    def heading(self, value: float) -> None:
        self.kinetics.heading = value

    # -- Genetics → Physics Mapping -----------------------------------------

    def _map_genetics_to_physics(self) -> None:
        """Configure KineticEntity + combat stats from ShipGenome."""
        # Hull → durability
        self.armor = 50.0 * self.genome.plating_density
        self.max_health = 100.0 * self.genome.structural_integrity
        self.health = self.max_health

        # Hull → mass (heavier plating = heavier ship)
        self.kinetics.mass = 1.0 + (self.genome.plating_density * 0.5)

        # Engine → thrust cap (stored as max_velocity for KineticEntity)
        self.kinetics.max_velocity = 10.0 * self.genome.thruster_output

        # Space vacuum — zero drag by default
        self.kinetics.drag = 0.0

        # Weapon systems
        self.weapon_damage = 10.0 * self.genome.weapon_damage
        self.fire_rate = 1.0 * self.genome.fire_rate

    # -- Combat Methods (unchanged) ----------------------------------------

    def apply_damage(self, damage: float) -> float:
        """Apply damage and return actual damage dealt."""
        actual_damage = max(1.0, damage - (self.armor * 0.1))
        self.health = max(0.0, self.health - actual_damage)
        return actual_damage

    def is_alive(self) -> bool:
        """Check if ship is still alive."""
        return self.health > 0.0

    def get_combat_rating(self) -> float:
        """Calculate overall combat rating."""
        damage_potential = self.weapon_damage * self.fire_rate
        survivability = (self.health / self.max_health) * self.armor
        mobility = self.kinetics.max_velocity / max(self.kinetics.mass, 0.01)
        return (damage_potential * 0.5) + (survivability * 0.3) + (mobility * 0.2)


# ---------------------------------------------------------------------------
# SpaceVoyagerEngineRunner — simulation loop
# ---------------------------------------------------------------------------

class SpaceVoyagerEngineRunner:
    """Physics runner for Star-Fleet space combat.

    All per-ship physics are delegated to ``KineticEntity.update(dt)``,
    which provides inertia, drag, velocity clamping, and toroidal
    screen wrapping for free.
    """

    def __init__(self, fleet_size: int = 10) -> None:
        self.fleet_size = fleet_size
        self.ships: Dict[str, SpaceShip] = {}
        self.simulation_time: float = 0.0
        self.dt: float = 0.016  # 60 FPS

        logger.info(f"🚀 SpaceVoyagerEngineRunner initialized: fleet_size={fleet_size}")

    # -- Fleet Management ---------------------------------------------------

    def create_fleet_from_genomes(self, genomes: List[ShipGenome]) -> Dict[str, SpaceShip]:
        """Create fleet from list of genomes, each with a KineticEntity."""
        fleet: Dict[str, SpaceShip] = {}

        for i, genome in enumerate(genomes):
            ship_id = f"ship_{i:03d}"
            kinetics = KineticEntity(
                position=Vector2(float(i * 50), float(100 + (i % 2) * 50)),
                velocity=Vector2(0.0, 0.0),
                wrap_bounds=(160, 144),
            )
            ship = SpaceShip(ship_id=ship_id, genome=genome, kinetics=kinetics)
            fleet[ship_id] = ship

        self.ships = fleet
        logger.info(f"🚀 Created fleet: {len(fleet)} ships")
        return fleet

    # -- Simulation Step ----------------------------------------------------

    def update_simulation(
        self,
        target_assignments: Dict[str, Optional[str]],
        command_confidence: float = 1.0,
    ) -> Dict[str, Any]:
        """Update one frame of simulation using KineticEntity physics."""
        frame_results: Dict[str, Any] = {
            "ships_updated": 0,
            "damage_events": [],
            "deaths": [],
            "simulation_time": self.simulation_time,
        }

        for ship_id, ship in self.ships.items():
            if not ship.is_alive():
                continue

            # Resolve target
            target_ship_id = target_assignments.get(ship_id)
            if target_ship_id and target_ship_id in self.ships:
                target_ship = self.ships[target_ship_id]
                if target_ship.is_alive():
                    # Calculate thrust toward target via KineticEntity
                    direction = target_ship.position - ship.position
                    if direction.magnitude_squared() > 0:
                        ship.kinetics.acceleration = direction.normalize() * (
                            ship.kinetics.max_velocity * command_confidence
                        )
                else:
                    ship.kinetics.acceleration = Vector2.zero()
            else:
                ship.kinetics.acceleration = Vector2.zero()

            # Delegate physics to KineticEntity (inertia, drag, wrap)
            ship.kinetics.update(self.dt)
            frame_results["ships_updated"] += 1

            # Combat: check if within engagement range
            if target_ship_id and target_ship_id in self.ships:
                target_ship = self.ships[target_ship_id]
                if target_ship.is_alive():
                    distance = ship.position.distance_to(target_ship.position)
                    # Engagement range: 20 pixels
                    if distance < 20.0 and random.random() < (ship.fire_rate * self.dt):
                        damage_variance = 0.8 + (random.random() * 0.4)
                        actual_damage = target_ship.apply_damage(
                            ship.weapon_damage * damage_variance
                        )
                        frame_results["damage_events"].append(
                            {
                                "attacker": ship_id,
                                "target": target_ship_id,
                                "damage": actual_damage,
                            }
                        )
                        if not target_ship.is_alive():
                            frame_results["deaths"].append(target_ship_id)

        self.simulation_time += self.dt
        return frame_results

    # -- Fleet Queries ------------------------------------------------------

    def get_fleet_status(self) -> Dict[str, Any]:
        """Get current fleet status."""
        alive_ships = [s for s in self.ships.values() if s.is_alive()]
        dead_ships = [s for s in self.ships.values() if not s.is_alive()]

        if not alive_ships:
            return {
                "alive_count": 0,
                "dead_count": len(dead_ships),
                "total_health": 0.0,
                "avg_health": 0.0,
                "fleet_center": (0.0, 0.0),
            }

        total_health = sum(s.health for s in alive_ships)
        avg_health = total_health / len(alive_ships)

        center_x = sum(s.position.x for s in alive_ships) / len(alive_ships)
        center_y = sum(s.position.y for s in alive_ships) / len(alive_ships)

        return {
            "alive_count": len(alive_ships),
            "dead_count": len(dead_ships),
            "total_health": total_health,
            "avg_health": avg_health,
            "fleet_center": (center_x, center_y),
        }

    def reset_simulation(self) -> None:
        """Reset simulation state."""
        self.simulation_time = 0.0
        for ship in self.ships.values():
            ship.health = ship.max_health
            ship.kinetics.velocity = Vector2.zero()
            ship.kinetics.acceleration = Vector2.zero()
        logger.info("🚀 Simulation reset")

    def get_ship_positions(self) -> Dict[str, Tuple[float, float]]:
        """Get all ship positions via KineticEntity."""
        return {
            ship_id: ship.position.to_tuple()
            for ship_id, ship in self.ships.items()
            if ship.is_alive()
        }


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def create_space_engine_runner(fleet_size: int = 10) -> SpaceVoyagerEngineRunner:
    """Create a SpaceVoyagerEngineRunner instance."""
    return SpaceVoyagerEngineRunner(fleet_size)
