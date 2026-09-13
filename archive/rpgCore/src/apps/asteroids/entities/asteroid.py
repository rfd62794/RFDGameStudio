"""
Asteroid Entity for Asteroids
"""
from dataclasses import dataclass
from typing import Tuple
from src.shared.entities.kinetics import KineticBody

@dataclass
class Asteroid:
    """Asteroid entity fragment"""
    kinetics: KineticBody
    size: int  # 1 = small, 2 = medium, 3 = large
    radius: float
    color: Tuple[int, int, int]
    point_value: int
    active: bool = True
