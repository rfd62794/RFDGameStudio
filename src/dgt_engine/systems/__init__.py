"""
Engines Module - The Three Pillars

Service-Oriented Architecture implementation of the Four-Pillar System:
- World Engine: Deterministic world generation with Chaos-Seed Protocol
- Mind Engine: D&D logic with Command Pattern
- Body Engine: 160x144 PPU rendering
- Race Engine: TurboShells deterministic physics and genetics

Each engine implements the Facade pattern for clean interfaces and
complete decoupling between pillars.
"""

from .mind import DD_Engine, DDEngineFactory
from .body import GraphicsEngine, GraphicsEngineFactory, GraphicsEngineSync
from .race import (
    RacePhysicsEngine, PhysicsConstants, SubStepConfig, TurtlePhysics,
    create_race_physics_engine, TerrainSystem, TerrainProperties, 
    GeneticTerrainBonus, TerrainBitmask, create_terrain_system,
    RaceArbiter, ArbiterEvent, EnergyThresholds, RaceMetrics,
    create_race_arbiter
)

__all__ = [
    # Mind Engine  
    "DD_Engine", "DDEngineFactory",
    
    # Body Engine
    "GraphicsEngine", "GraphicsEngineFactory", "GraphicsEngineSync",
    
    # Race Engine
    "RacePhysicsEngine", "PhysicsConstants", "SubStepConfig", "TurtlePhysics",
    "create_race_physics_engine", "TerrainSystem", "TerrainProperties",
    "GeneticTerrainBonus", "TerrainBitmask", "create_terrain_system",
    "RaceArbiter", "ArbiterEvent", "EnergyThresholds", "RaceMetrics",
    "create_race_arbiter"
]
