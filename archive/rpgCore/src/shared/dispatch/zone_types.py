"""Zone type definitions and configurations for DispatchSystem"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict

class ZoneType(Enum):
    RACING = "racing"
    DUNGEON = "dungeon"
    FORAGING = "foraging"
    TRADE = "trade"
    MISSION = "mission"
    ARENA = "arena"

@dataclass
class ZoneConfig:
    """Configuration for a specific zone type"""
    zone_type: ZoneType
    min_stage: str          # minimum lifecycle stage to enter
    risk_level: str         # 'none', 'low', 'standard', 'high', 'critical'
    resource_returns: Dict[str, float]  # gold, scrap, food weights
    duration_ticks: int     # how long the dispatch takes
    stat_growth: Dict[str, float]  # which stats grow from this zone

# Zone configurations based on SYSTEMS_MAP_SPECIFICATION.md
ZONE_CONFIGS: Dict[ZoneType, ZoneConfig] = {
    ZoneType.RACING: ZoneConfig(
        zone_type=ZoneType.RACING,
        min_stage="Juvenile",  # Can't dispatch Hatchlings
        risk_level="low",
        resource_returns={"gold": 1.0, "scrap": 0.0, "food": 0.0},
        duration_ticks=300,  # 5 minutes at 60 ticks/sec
        stat_growth={"dexterity": 0.8, "speed": 0.6, "constitution": 0.2}
    ),
    
    ZoneType.DUNGEON: ZoneConfig(
        zone_type=ZoneType.DUNGEON,
        min_stage="Young",  # Need some capability for danger
        risk_level="high",
        resource_returns={"gold": 0.3, "scrap": 1.0, "food": 0.0},
        duration_ticks=600,  # 10 minutes
        stat_growth={"strength": 0.8, "defense": 0.6, "intelligence": 0.4}
    ),
    
    ZoneType.FORAGING: ZoneConfig(
        zone_type=ZoneType.FORAGING,
        min_stage="Juvenile",  # Can start early
        risk_level="low",
        resource_returns={"gold": 0.0, "scrap": 0.2, "food": 1.0},
        duration_ticks=400,  # ~6.5 minutes
        stat_growth={"constitution": 0.8, "perception": 0.6, "patience": 0.4}
    ),
    
    ZoneType.TRADE: ZoneConfig(
        zone_type=ZoneType.TRADE,
        min_stage="Young",  # Need some world experience
        risk_level="standard",
        resource_returns={"gold": 1.0, "scrap": 0.0, "food": 0.2},
        duration_ticks=500,  # ~8 minutes
        stat_growth={"charisma": 0.8, "adaptability": 0.6, "sociability": 0.4}
    ),
    
    ZoneType.MISSION: ZoneConfig(
        zone_type=ZoneType.MISSION,
        min_stage="Prime",  # Experienced slimes only
        risk_level="standard",
        resource_returns={"gold": 0.5, "scrap": 0.5, "food": 0.3},
        duration_ticks=800,  # ~13 minutes
        stat_growth={"intelligence": 0.6, "charisma": 0.4, "adaptability": 0.4}
    ),
    
    ZoneType.ARENA: ZoneConfig(
        zone_type=ZoneType.ARENA,
        min_stage="Young",  # Can start earlier than missions
        risk_level="standard",
        resource_returns={"gold": 0.8, "scrap": 0.0, "food": 0.0},
        duration_ticks=450,  # ~7.5 minutes
        stat_growth={"strength": 0.6, "defense": 0.6, "dexterity": 0.4}
    )
}

def get_zone_config(zone_type: ZoneType) -> ZoneConfig:
    """Get configuration for a zone type"""
    from dataclasses import replace
    return replace(ZONE_CONFIGS[zone_type])  # Return a copy to ensure immutability

def get_all_zone_configs() -> Dict[ZoneType, ZoneConfig]:
    """Get all zone configurations"""
    return ZONE_CONFIGS.copy()
