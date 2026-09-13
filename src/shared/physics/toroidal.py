"""
Shared Toroidal Utilities
SRP: Pure wrapping logic for bounded worlds.
"""
from typing import Tuple

def wrap_position(x: float, y: float, width: int, height: int) -> Tuple[float, float]:
    """Wrap coordinates toroidally."""
    return x % width, y % height
