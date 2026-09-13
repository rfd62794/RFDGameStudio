"""
Ship Entity for Asteroids
"""
from dataclasses import dataclass, field
from typing import List, Tuple
from src.shared.entities.kinetics import KineticBody, create_player_ship

@dataclass
class Ship:
    """Asteroids player ship"""
    kinetics: KineticBody = field(default_factory=create_player_ship)
    radius: float = 3.0
    alive: bool = True
    
    def get_points(self) -> List[Tuple[float, float]]:
        """Get points for polygon rendering"""
        pos = self.kinetics.get_position_tuple()
        angle = self.kinetics.state.angle
        import math
        return [
            (pos[0] + 6 * math.cos(angle), 
             pos[1] + 6 * math.sin(angle)),
            (pos[0] + 6 * math.cos(angle + 2.4), 
             pos[1] + 6 * math.sin(angle + 2.4)),
            (pos[0] + 6 * math.cos(angle - 2.4), 
             pos[1] + 6 * math.sin(angle - 2.4))
        ]
