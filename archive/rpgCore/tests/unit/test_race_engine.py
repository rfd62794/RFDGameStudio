import pytest
from src.shared.racing.race_engine import RaceEngine
from src.shared.racing.race_track import generate_track, get_terrain_at
from src.shared.teams.roster import RosterSlime
from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CulturalBase

def test_race_track_terrain():
    track = ["grass", "water", "rock"]
    # SEGMENT_LENGTH = 10
    assert get_terrain_at(track, 5) == "grass"
    assert get_terrain_at(track, 15) == "water"
    assert get_terrain_at(track, 25) == "rock"
    assert get_terrain_at(track, 100) == "rock" # clamp

def test_race_engine_simulation():
    # Setup test slimes
    s1 = RosterSlime("s1", "Light", SlimeGenome(
        shape="round", size="small", base_color=(100, 100, 100),
        pattern="solid", pattern_color=(0,0,0), accessory="none",
        curiosity=0.5, energy=1.0, affection=0.5, shyness=0.1,
        cultural_base=CulturalBase.MARSH # Marsh has speed modifier 1.3
    ), level=1)
    
    s2 = RosterSlime("s2", "Heavy", SlimeGenome(
        shape="cubic", size="massive", base_color=(100, 100, 100),
        pattern="solid", pattern_color=(0,0,0), accessory="none",
        curiosity=0.5, energy=0.1, affection=0.5, shyness=0.1,
        cultural_base=CulturalBase.EMBER # Ember has rock advantage, no penalty
    ), level=1)
    
    track = ["grass"] * 100
    engine = RaceEngine([s1, s2], track, length=100)
    
    # Tick simulation
    for _ in range(100):
        engine.tick(0.1)
    
    # With lap-based racing, light slime wins due to faster lap completion
    # Even though heavy slime covers more distance, light slime completes laps faster
    assert engine.participants[0].rank == 1  # Light slime wins
    
    # Run until finish
    for _ in range(1000):
        engine.tick(0.1)
        if engine.is_finished(): break
        
    assert engine.is_finished()
    assert engine.participants[0].finished  # Light slime wins
    assert engine.participants[0].rank == 1

def test_jumper_classification():
    """Test that high wobble, medium size slimes are classified as jumpers."""
    slime = RosterSlime("test", "Jumper", SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 100),
        pattern="solid", pattern_color=(0,0,0), accessory="none",
        curiosity=0.5, energy=1.5, affection=0.5, shyness=0.1,
        cultural_base=CulturalBase.MARSH
    ), level=1)
    
    from src.shared.racing.race_engine import RaceParticipant
    participant = RaceParticipant(slime)
    
    # High wobble frequency should classify as JUMPER
    assert participant.movement_type.value == "jumper"

def test_scooter_classification():
    """Test that low wobble, small slimes are classified as scooters."""
    slime = RosterSlime("test", "Scooter", SlimeGenome(
        shape="round", size="small", base_color=(100, 100, 100),
        pattern="solid", pattern_color=(0,0,0), accessory="none",
        curiosity=0.5, energy=0.3, affection=0.5, shyness=0.1,
        cultural_base=CulturalBase.TUNDRA
    ), level=1)
    
    from src.shared.racing.race_engine import RaceParticipant
    participant = RaceParticipant(slime)
    
    # Low wobble frequency + small size should classify as SCOOTER
    assert participant.movement_type.value == "scooter"

def test_roller_classification():
    """Test that very round, large slimes are classified as rollers."""
    # Create a custom genome with roundness for testing
    from src.shared.genetics.genome import SlimeGenome
    genome = SlimeGenome(
        shape="round", size="large", base_color=(100, 100, 100),
        pattern="solid", pattern_color=(0,0,0), accessory="none",
        curiosity=0.5, energy=0.8, affection=0.5, shyness=0.1,
        cultural_base=CulturalBase.VOID
    )
    # Add roundness attribute for testing
    genome.body_roundness = 0.8  # Very round
    
    slime = RosterSlime("test", "Roller", genome, level=1)
    
    from src.shared.racing.race_engine import RaceParticipant
    participant = RaceParticipant(slime)
    
    # High roundness + large size should classify as ROLLER
    assert participant.movement_type.value == "roller"

def test_jump_height_within_bounds():
    """Test that jump height never exceeds reasonable bounds."""
    from src.shared.racing.race_engine import RaceParticipant
    from src.shared.genetics.inheritance import generate_random
    
    # Test multiple random slimes
    for _ in range(10):
        slime = RosterSlime("test", "Random", generate_random(), level=1)
        participant = RaceParticipant(slime)
        
        # Jump height should be within reasonable bounds (0-18px)
        assert participant.max_jump_height <= 18
        assert participant.max_jump_height >= 0

def test_terrain_influence():
    s = RosterSlime("s", "Racer", SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 100),
        pattern="solid", pattern_color=(0,0,0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
    ), level=1)
    
    # Grass track
    engine_g = RaceEngine([s], ["grass"] * 10, length=50)
    engine_g.tick(1.0)
    dist_grass = engine_g.participants[0].distance
    
    # Water track
    engine_w = RaceEngine([s], ["water"] * 10, length=50)
    engine_w.tick(1.0)
    dist_water = engine_w.participants[0].distance
    
    assert dist_grass > dist_water
