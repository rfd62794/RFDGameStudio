"""
Asteroids Collision Detection
"""
import math
from typing import Tuple

def check_circle_collision(pos1: Tuple[float, float], rad1: float, 
                           pos2: Tuple[float, float], rad2: float) -> bool:
    """Simple circle-to-circle collision check"""
    dist_sq = (pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2
    return dist_sq < (rad1 + rad2)**2
