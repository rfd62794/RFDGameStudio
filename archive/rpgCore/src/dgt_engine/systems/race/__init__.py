"""
Race Engines - DGT Tier 2 Architecture

Deterministic race physics, terrain interactions, and race arbitration.
Transplanted from TurboShells race_engine.py with DGT hardening.
"""

from .physics_engine import (
    RacePhysicsEngine, PhysicsConstants, SubStepConfig, TurtlePhysics,
    create_race_physics_engine
)
from .terrain_system import (
    TerrainSystem, TerrainProperties, GeneticTerrainBonus, TerrainBitmask,
    create_terrain_system
)
from .race_arbiter import (
    RaceArbiter, ArbiterEvent, EnergyThresholds, RaceMetrics,
    create_race_arbiter
)

__all__ = [
    'RacePhysicsEngine',
    'PhysicsConstants',
    'SubStepConfig',
    'TurtlePhysics',
    'create_race_physics_engine',
    'TerrainSystem',
    'TerrainProperties',
    'GeneticTerrainBonus',
    'TerrainBitmask',
    'create_terrain_system',
    'RaceArbiter',
    'ArbiterEvent',
    'EnergyThresholds',
    'RaceMetrics',
    'create_race_arbiter'
]
