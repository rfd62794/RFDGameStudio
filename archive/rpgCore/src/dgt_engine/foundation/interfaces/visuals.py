"""
Visual Types — Foundation-Tier Shared Protocols

Shared data types for the rendering pipeline. Extracted from the circular
dependency between logic.animator and ui.virtual_ppu.

Both modules import from here instead of from each other.
"""

from typing import Dict, List, Tuple, Optional, Any, TYPE_CHECKING
from dataclasses import dataclass
from enum import Enum

# No TYPE_CHECKING needed - we use Foundation protocols only


# ---------------------------------------------------------------------------
# Animation State (was in logic.animator)
# ---------------------------------------------------------------------------

class AnimationState(Enum):
    """Animation states for kinetic sprites."""
    IDLE = "idle"
    WALKING = "walking"
    RUNNING = "running"
    COMBAT = "combat"
    CASTING = "casting"
    STEALTH = "stealth"
    SLEEPING = "sleeping"
    TALKING = "talking"


# ---------------------------------------------------------------------------
# Sprite Coordinate (was in ui.virtual_ppu)
# ---------------------------------------------------------------------------

@dataclass
class SpriteCoordinate:
    """Coordinate for a sprite in the object layer."""
    x: int
    y: int
    metasprite: "Metasprite"
    priority: int = 0  # Lower priority renders on top
