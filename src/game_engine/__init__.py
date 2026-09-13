"""
Game Engine - Generalized Multi-Genre Game Engine Framework

A sophisticated, multi-layered game engine supporting Space Combat, RPG, Tycoon,
and extensible to other genres. Built on principles of SOLID design, component-based
architecture, and clean separation of concerns.

Architecture:
    Tier 1 (Foundation): Core types, protocols, utilities, system clock
    Tier 2 (Engines): SyntheticRealityEngine, ChronosEngine, D20Core, SemanticResolver,
                      NarrativeEngine, PhysicsEngine, RenderingEngine, etc.
    Tier 2B (Systems): Specialized subsystems (ECS, Graphics, Game Logic, AI, Narrative)
    Tier 2C (Assets): Asset loaders, managers, fabricators
    Tier 3 (UI): Rendering adapters, viewports, dashboards
    Tier 3 (Demos): Application-specific game implementations

Usage:
    from src.game_engine.core import SystemClock, Vector2
    from src.game_engine.engines import SyntheticRealityEngine, ChronosEngine
    from src.game_engine.systems import EntityManager, PhysicsSystem
"""

__version__ = "0.1.0"
__author__ = "Game Engine Team"

# Core exports - Foundation layer
from src.game_engine.core import (
    SystemClock,
    Vector2,
    Vector3,
)

__all__ = [
    "SystemClock",
    "Vector2",
    "Vector3",
]
