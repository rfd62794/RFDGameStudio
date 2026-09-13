"""Procedural race track generation for slimes.
Adapted from TurboShells.
"""

import random
from dataclasses import dataclass
from enum import Enum
from src.shared.simulation.base_track import BaseZone

TRACK_LENGTH_LOGIC = 1500
SEGMENT_LENGTH = 10

class TerrainType(Enum):
    GRASS = "grass"        # normal speed
    WATER = "water"        # slow, Tundra advantage
    ROCK = "rock"          # rough, Ember advantage  
    MUD = "mud"           # slow, Marsh advantage
    HURDLE = "hurdle"      # jump required (future)
    PUSHBLOCK = "push_block"  # interactive (future)
    VOID = "void"          # shortcut/hazard (future)

@dataclass
class TerrainZone(BaseZone):
    terrain_type: TerrainType
    
    def __init__(self, terrain_type: TerrainType, start_dist: float, end_dist: float):
        super().__init__(terrain_type, start_dist, end_dist)
        self.terrain_type = terrain_type

# Speed modifiers per terrain
TERRAIN_SPEED_MOD = {
    TerrainType.GRASS: 1.0,
    TerrainType.WATER: 0.65,
    TerrainType.ROCK: 0.75,
    TerrainType.MUD: 0.55,
    TerrainType.HURDLE: 1.0,  # No speed penalty, jump required
    TerrainType.PUSHBLOCK: 1.0,  # No speed penalty, interactive
    TerrainType.VOID: 1.0,  # No speed penalty, hazard
}

# Cultural advantage — double the modifier benefit
CULTURAL_TERRAIN_BONUS = {
    "tundra": TerrainType.WATER,
    "ember": TerrainType.ROCK,
    "marsh": TerrainType.MUD,
    "crystal": None,  # no terrain advantage
    "gale": None,  # no terrain advantage
    "tide": None,  # no terrain advantage
    "void": None,  # random advantage each race
}

def generate_zones(track_length: float, total_laps: int = 3) -> list[TerrainZone]:
    """Generate terrain zones for all laps continuously."""
    all_zones = []
    
    # Generate one lap pattern first
    lap_zones = []
    current = 0.0
    while current < track_length:
        grass_width = random.uniform(200, 400)
        end = min(current + grass_width, track_length)
        lap_zones.append((TerrainType.GRASS, current, end))
        current = end
        
        if current >= track_length: break
        
        terrain = random.choice([TerrainType.WATER, TerrainType.ROCK, TerrainType.MUD])
        obstacle_width = random.uniform(150, 300)
        end = min(current + obstacle_width, track_length)
        lap_zones.append((terrain, current, end))
        current = end

    # Duplicate pattern with offsets
    for lap in range(total_laps):
        offset = lap * track_length
        for terrain, start, end in lap_zones:
            all_zones.append(TerrainZone(terrain, start + offset, end + offset))
    
    return all_zones

def generate_track(length: int = TRACK_LENGTH_LOGIC, total_laps: int = 3):
    """Generate terrain segments for full race distance."""
    total_length = length * total_laps
    segment_count = int(total_length / SEGMENT_LENGTH) + 10
    track = []
    for _ in range(segment_count):
        r = random.random()
        if r < 0.5:
            track.append("grass")
        elif r < 0.7:
            track.append("water")
        elif r < 0.9:
            track.append("rock")
        else:
            track.append("mud")
    return track

def get_terrain_at(track: list[str], distance: float) -> str:
    """Return terrain type for a given logical race distance."""
    if not track:
        return "grass"
    idx = int(distance / SEGMENT_LENGTH)
    idx = max(0, min(idx, len(track) - 1))
    return track[idx]

def get_terrain_speed_modifier(terrain: str, cultural_base: str = None) -> float:
    """Get speed modifier for terrain, applying cultural advantage if applicable."""
    terrain_type = TerrainType(terrain)
    base_mod = TERRAIN_SPEED_MOD.get(terrain_type, 1.0)
    
    # Apply cultural advantage
    if cultural_base and cultural_base in CULTURAL_TERRAIN_BONUS:
        bonus_terrain = CULTURAL_TERRAIN_BONUS[cultural_base]
        if bonus_terrain == terrain_type:
            # Double the benefit (less penalty = faster)
            if base_mod < 1.0:
                return min(1.0, base_mod + (1.0 - base_mod) * 0.5)
    
    return base_mod
