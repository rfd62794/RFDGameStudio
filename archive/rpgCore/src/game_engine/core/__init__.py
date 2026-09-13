"""
Core Layer (Tier 1) - Foundation

Immutable core types, protocols, utilities, and time management.
Zero dependencies except Pydantic v2 for validation.

This layer should never depend on higher layers (engines, systems, UI).
Higher layers depend on this layer.
"""

from src.game_engine.core.clock import SystemClock
from src.game_engine.core.types import Vector2, Vector3

__all__ = [
    "SystemClock",
    "Vector2",
    "Vector3",
]
