import random
from enum import Enum
from dataclasses import dataclass

class DungeonZoneType(Enum):
    SAFE     = "safe"
    COMBAT   = "combat"
    TRAP     = "trap"
    REST     = "rest"
    TREASURE = "treasure"
    BOSS     = "boss"

ZONE_COLORS = {
    DungeonZoneType.SAFE:     (55,  110, 55),
    DungeonZoneType.COMBAT:   (180, 50,  50),
    DungeonZoneType.TRAP:     (200, 120, 40),
    DungeonZoneType.REST:     (40,  100, 180),
    DungeonZoneType.TREASURE: (200, 170, 40),
    DungeonZoneType.BOSS:     (120, 40,  180),
}

ZONE_LABELS = {
    DungeonZoneType.SAFE:     "SAFE",
    DungeonZoneType.COMBAT:   "⚔ ENEMY",
    DungeonZoneType.TRAP:     "⚠ TRAP",
    DungeonZoneType.REST:     "☾ REST",
    DungeonZoneType.TREASURE: "★ TREASURE",
    DungeonZoneType.BOSS:     "☠ BOSS",
}

@dataclass
class DungeonZone:
    zone_type:  DungeonZoneType
    start_dist: float
    end_dist:   float
    resolved:   bool = False
    squad:      'EnemySquad' = None # Forward ref

@dataclass
class DungeonTrack:
    zones:        list[DungeonZone]
    total_length: float
    depth:        int = 1
    
def generate_dungeon_track(depth: int = 1, seed: int = None) -> DungeonTrack:
    from src.shared.dungeon.enemy_squads import generate_combat_squad, generate_boss_squad
    rng = random.Random(seed if seed is not None else random.randint(0, 99999))
    zones = []
    current = 0.0
    
    # Always start with SAFE zone
    zones.append(DungeonZone(DungeonZoneType.SAFE, 0, 300))
    current = 300.0
    
    # Middle zones
    for i in range(4 + depth):
        safe_w = rng.uniform(150, 250)
        zones.append(DungeonZone(DungeonZoneType.SAFE, current, current + safe_w))
        current += safe_w
        
        zone_type = rng.choices(
            [DungeonZoneType.COMBAT, DungeonZoneType.TRAP, DungeonZoneType.REST, DungeonZoneType.TREASURE],
            weights=[50, 20, 20, 10]
        )[0]
        
        squad = None
        if zone_type == DungeonZoneType.COMBAT:
            squad = generate_combat_squad(depth, rng)
        
        enc_w = rng.uniform(100, 200)
        zones.append(DungeonZone(zone_type, current, current + enc_w, squad=squad))
        current += enc_w
    
    # End with BOSS
    safe_w = rng.uniform(150, 200)
    zones.append(DungeonZone(DungeonZoneType.SAFE, current, current + safe_w))
    current += safe_w
    
    boss_squad = generate_boss_squad(rng)
    zones.append(DungeonZone(DungeonZoneType.BOSS, current, current + 200, squad=boss_squad))
    current += 200
    
    return DungeonTrack(zones=zones, total_length=current, depth=depth)
