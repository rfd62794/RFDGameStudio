"""Dungeon Track implementation for path-based traversal.
"""

import random
from enum import Enum
from dataclasses import dataclass
from src.shared.simulation.base_track import BaseTrack, BaseZone

class DungeonZoneType(Enum):
    SAFE     = "safe"      # green — move freely
    COMBAT   = "combat"    # red — triggers fight
    TRAP     = "trap"      # orange — stat damage
    REST     = "rest"      # blue — heal between fights
    TREASURE = "treasure"  # gold — loot
    BOSS     = "boss"      # purple — final encounter

@dataclass
class DungeonZone(BaseZone):
    zone_type: DungeonZoneType
    
    def __init__(self, zone_type: DungeonZoneType, start_dist: float, end_dist: float):
        super().__init__(zone_type, start_dist, end_dist)
        self.zone_type = zone_type

class DungeonTrack(BaseTrack):
    def __init__(self, length: float = 2000.0):
        zones = self._generate_dungeon_zones(length)
        # Use simple "stone" segments for dungeon aesthetic
        segments = ["stone"] * int(length / 10.0 + 1)
        super().__init__(segments, zones, length)

    def _generate_dungeon_zones(self, length: float) -> list[DungeonZone]:
        zones = []
        current = 0.0
        
        # Start with a safe zone
        zones.append(DungeonZone(DungeonZoneType.SAFE, 0, 200))
        current = 200.0
        
        while current < length - 300:
            # Randomize zone types except BOSS
            z_type = random.choice([
                DungeonZoneType.COMBAT, 
                DungeonZoneType.TRAP, 
                DungeonZoneType.REST, 
                DungeonZoneType.TREASURE,
                DungeonZoneType.SAFE
            ])
            z_width = random.uniform(150, 300)
            end = min(current + z_width, length - 300)
            zones.append(DungeonZone(z_type, current, end))
            current = end
            
            # Always ensure small safe buffers between action zones
            buffer_end = min(current + 50, length - 300)
            if buffer_end > current:
                zones.append(DungeonZone(DungeonZoneType.SAFE, current, buffer_end))
                current = buffer_end

        # End with BOSS zone
        zones.append(DungeonZone(DungeonZoneType.BOSS, current, length))
        
        return zones
