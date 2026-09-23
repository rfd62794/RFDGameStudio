from enum import Enum
from dataclasses import dataclass
from typing import Tuple, Dict

class CulturalBase(Enum):
    EMBER   = "ember"
    GALE    = "gale"
    MARSH   = "marsh"
    CRYSTAL = "crystal"
    TUNDRA  = "tundra"
    TIDE    = "tide"
    VOID    = "void"

@dataclass
class CulturalParameters:
    """
    Parameter ranges that define visual and stat tendencies.
    """
    body_roundness_range:   Tuple[float, float]
    primary_hue_range:      Tuple[float, float]  # 0.360
    wobble_frequency_range: Tuple[float, float]
    hp_modifier:            float
    attack_modifier:        float
    speed_modifier:         float
    rare_trait_chance:      float

CULTURAL_PARAMETERS: Dict[CulturalBase, CulturalParameters] = {
    CulturalBase.EMBER: CulturalParameters(
        body_roundness_range   = (0.2, 0.5),   # angular
        primary_hue_range      = (0, 30),       # red-orange
        wobble_frequency_range = (1.5, 2.5),    # fast
        hp_modifier            = 0.8,
        attack_modifier        = 1.4,
        speed_modifier         = 1.1,
        rare_trait_chance      = 0.05,
    ),
    CulturalBase.GALE: CulturalParameters(
        body_roundness_range   = (0.3, 0.6),   # angular
        primary_hue_range      = (210, 270),    # blues
        wobble_frequency_range = (2.0, 3.5),    # fast
        hp_modifier            = 0.9,
        attack_modifier        = 0.9,
        speed_modifier         = 1.4,
        rare_trait_chance      = 0.06,
    ),
    CulturalBase.MARSH: CulturalParameters(
        body_roundness_range   = (0.6, 0.9),   # rounded
        primary_hue_range      = (90, 150),     # greens
        wobble_frequency_range = (0.5, 1.0),    # gentle
        hp_modifier            = 1.0,
        attack_modifier        = 0.9,
        speed_modifier         = 1.3,
        rare_trait_chance      = 0.04,
    ),
    CulturalBase.CRYSTAL: CulturalParameters(
        body_roundness_range   = (0.4, 0.7),   # geometric
        primary_hue_range      = (180, 240),    # blue-white
        wobble_frequency_range = (0.3, 0.8),    # slow
        hp_modifier            = 1.4,
        attack_modifier        = 0.8,
        speed_modifier         = 0.7,
        rare_trait_chance      = 0.08,
    ),
    CulturalBase.TUNDRA: CulturalParameters(
        body_roundness_range   = (0.7, 0.9),   # angular
        primary_hue_range      = (180, 210),    # cool blues
        wobble_frequency_range = (0.3, 0.6),    # slow
        hp_modifier            = 1.1,
        attack_modifier        = 0.9,
        speed_modifier         = 0.8,
        rare_trait_chance      = 0.05,
    ),
    CulturalBase.TIDE: CulturalParameters(
        body_roundness_range   = (0.3, 0.6),   # flowing
        primary_hue_range      = (240, 270),   # electric blue-yellow
        wobble_frequency_range = (2.0, 3.5),   # energetic
        hp_modifier            = 1.0,
        attack_modifier        = 1.0,
        speed_modifier         = 1.2,
        rare_trait_chance      = 0.07,
    ),
    CulturalBase.VOID: CulturalParameters(
        body_roundness_range   = (0.1, 0.9),   # unpredictable
        primary_hue_range      = (260, 300),    # dark purple
        wobble_frequency_range = (0.1, 3.0),    # erratic
        hp_modifier            = 1.2,
        attack_modifier        = 1.2,
        speed_modifier         = 1.2,
        rare_trait_chance      = 0.25,
    ),
}
