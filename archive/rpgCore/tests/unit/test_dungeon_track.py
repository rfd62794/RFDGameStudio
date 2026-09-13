import random
import pytest
from src.shared.dungeon.dungeon_track import generate_dungeon_track, DungeonZoneType
from src.shared.dungeon.dungeon_engine import DungeonEngine

def test_generate_track_has_boss():
    track = generate_dungeon_track(depth=1)
    zone_types = [z.zone_type for z in track.zones]
    assert DungeonZoneType.BOSS in zone_types

def test_generate_track_starts_safe():
    track = generate_dungeon_track(depth=1)
    assert track.zones[0].zone_type == DungeonZoneType.SAFE

def test_engine_pauses_on_combat():
    track = generate_dungeon_track(depth=1)
    engine = DungeonEngine(track, team=[])
    
    # Find a combat zone safely
    combat_zones = [z for z in track.zones if z.zone_type == DungeonZoneType.COMBAT]
    if not combat_zones:
        # If no combat zones, skip this test
        pytest.skip("No combat zones generated in track")
        return
    
    combat_zone = combat_zones[0]
    engine.party.distance = combat_zone.start_dist + 1
    engine._enter_zone(combat_zone)
    assert engine.party.paused == True
    assert engine.party.pause_reason == "combat"

def test_engine_resume_clears_pause():
    track = generate_dungeon_track(depth=1)
    engine = DungeonEngine(track, team=[])
    engine.party.paused = True
    
    # Find a combat zone safely
    combat_zones = [z for z in track.zones if z.zone_type == DungeonZoneType.COMBAT]
    if not combat_zones:
        # If no combat zones, skip this test
        pytest.skip("No combat zones generated in track")
        return
    
    combat_zone = combat_zones[0]
    engine.party.current_zone = combat_zone
    engine.resume()
    assert engine.party.paused == False
    assert combat_zone.resolved == True
