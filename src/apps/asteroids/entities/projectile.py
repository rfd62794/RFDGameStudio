"""
Projectile Entity for Asteroids
"""
from dataclasses import dataclass
from src.shared.entities.kinetics import KineticBody

@dataclass
class Projectile:
    """Individual projectile"""
    kinetics: KineticBody
    spawn_time: float
    owner_id: str
    lifetime: float = 2.0
    active: bool = True
