from enum import Enum, auto
from dataclasses import dataclass
from typing import Dict

class FleetRole(Enum):
    INTERCEPTOR = auto() # High Thrust, Low Armor
    HEAVY = auto()       # Low Thrust, High Armor/Thick Stroke
    SCOUT = auto()       # High Sensor Range, Low Mass

@dataclass(frozen=True)
class RoleModifier:
    thrust_mult: float
    armor_mult: float
    mass_mult: float
    scale: float

ROLE_MAP = {
    FleetRole.INTERCEPTOR: RoleModifier(1.5, 0.7, 0.8, 0.8),
    FleetRole.HEAVY: RoleModifier(0.6, 2.0, 1.5, 1.3),
    FleetRole.SCOUT: RoleModifier(1.2, 0.5, 0.6, 0.7)
}
