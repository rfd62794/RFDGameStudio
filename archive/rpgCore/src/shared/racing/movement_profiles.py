"""Movement profiles for different slime movement types."""

from .movement_type import MovementType
from .race_track import TerrainType

MOVEMENT_PROFILES = {
    MovementType.JUMPER: {
        "jump_height_max": 14,      # px — subtle arc
        "jump_cooldown": 0.35,    # seconds between jumps
        "ground_time": 0.0,     # no ground pause
        "speed_modifier": 1.0,
        "terrain_mods": {
            TerrainType.ROCK: 1.1,  # bounces off rock
            TerrainType.MUD: 0.7, # heavy landing
            TerrainType.WATER: 0.8, # splashes down
        }
    },

    MovementType.scooter: {
        "jump_height_max": 3,       # barely leaves ground
        "jump_cooldown": 0.1,     # rapid tiny pulses
        "ground_time": 0.05,    # hugs ground
        "speed_modifier": 0.95,    # slightly slower base
        "terrain_mods": {
            TerrainType.WATER: 1.1,  # skims surface
            TerrainType.MUD: 0.95, # barely affected
            TerrainType.ROCK: 0.75, # scrapes badly
        }
    },

    MovementType.roller: {
        "jump_height_max": 0,       # never leaves ground
        "jump_cooldown": 0.0,     # continuous roll
        "ground_time": 0.0,
        "speed_modifier": 0.85,    # slow start
        "momentum_buildup": 0.15,    # accelerates over time
        "terrain_mods": {
            TerrainType.GRASS: 1.2,  # rolls fast on flat
            TerrainType.ROCK: 0.6,  # loses traction
            TerrainType.MUD: 0.5, # bogs down badly
            TerrainType.WATER: 0.7, # partially floats
        }
    },
}
