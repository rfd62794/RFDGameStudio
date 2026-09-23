"""
Actors Module - The Actor Pillar

 The AI Controller - autonomous pathfinding and intent generation with STATE_PONDERING support.
 The Actor bridges the deterministic world and the chaotic narrative through discovery
 and pondering of Interest Points.

 Key Features:
 - A* pathfinding with confidence scoring
 - State machine with STATE_PONDERING for LLM processing
 - Autonomous movie script navigation
 - Interest Point discovery and manifestation
 - Performance tracking and optimization
 - [NEW] AsteroidPilot: Steering behavior AI for KineticEntities
 """

_AI_CONTROLLER_EXPORTS = {
    "AIController", "Spawner", "AIControllerSync",
}

_PAWN_NAVIGATION_EXPORTS = {
    "NavigationGoal", "PathfindingNode", "PathfindingNavigator", "IntentGenerator",
}

_ASTEROID_PILOT_EXPORTS = {
    "AsteroidPilot", "SteeringConfig", "SurvivalLog",
}

__all__ = sorted(
    _AI_CONTROLLER_EXPORTS | _PAWN_NAVIGATION_EXPORTS | _ASTEROID_PILOT_EXPORTS
)


def __getattr__(name: str):
    """Lazy-load submodule symbols on first access."""
    if name in _AI_CONTROLLER_EXPORTS:
        from . import ai_controller as _mod
        return getattr(_mod, name)

    if name in _PAWN_NAVIGATION_EXPORTS:
        from . import pawn_navigation as _mod
        return getattr(_mod, name)
        
    if name in _ASTEROID_PILOT_EXPORTS:
        from . import asteroid_pilot as _mod
        return getattr(_mod, name)

    raise AttributeError(f"module 'actors' has no attribute {name!r}")
