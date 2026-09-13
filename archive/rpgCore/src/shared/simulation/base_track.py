"""Base simulation engine components.
Shared between Racing and Dungeon Path systems.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Any, Optional

class BaseZoneType(Enum):
    """Placeholder for specialized zone types."""
    pass

@dataclass
class BaseZone:
    zone_type: Any
    start_dist: float
    end_dist: float
    
    @property
    def width(self) -> float:
        return self.end_dist - self.start_dist

class BaseTrack:
    def __init__(self, segments: List[str], zones: List[BaseZone], total_length: float):
        self.segments = segments
        self.zones = zones
        self.total_length = total_length

    def get_segment_at(self, distance: float, segment_length: float = 10.0) -> str:
        if not self.segments:
            return "default"
        idx = int(distance / segment_length)
        idx = max(0, min(idx, len(self.segments) - 1))
        return self.segments[idx]

    def get_zone_at(self, distance: float) -> Optional[BaseZone]:
        for zone in self.zones:
            if zone.start_dist <= distance < zone.end_dist:
                return zone
        return None
