"""
Foundation Tier
Shared utilities, constants, and base classes.
"""

import sys
from pathlib import Path

# ADR 215: Python Version Check (Relaxed for 3.14 compatibility)
if sys.version_info < (3, 12, 0):
    current_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    raise RuntimeError(
        f"DGT Platform requires Python 3.12.x or newer. Current version: {current_version}\n"
        "Please upgrade your Python environment."
    )

# Lazy loading of foundation components
_FOUNDATION_EXPORTS = {
    "Vector2", "Result", "Direction", "CollisionType",
}

__all__ = sorted(_FOUNDATION_EXPORTS)

def __getattr__(name: str):
    """Lazy-load foundation submodules."""
    if name == "Vector2":
        from .vector import Vector2
        return Vector2
    
    if name in {"Result"}:
        from .types import Result
        return Result
        
    if name in {"Direction", "CollisionType"}:
        from .constants import Direction, CollisionType
        return getattr(sys.modules[__name__], name) # Fallback for now
        
    raise AttributeError(f"module 'rpg_core.foundation' has no attribute {name!r}")
