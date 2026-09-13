import pytest
from src.shared.ui.dice_visualizer import Die, FAST_DURATION, DECEL_DURATION, LAND_DURATION

def test_die_roll_sets_result_in_range():
    die = Die(20, 0, 0)
    for _ in range(100):
        die.roll()
        assert 1 <= die.result <= 20
        assert die.state == "fast"

def test_die_stutter_seq_ends_on_result():
    die = Die(10, 0, 0)
    for _ in range(50):
        die.roll()
        assert len(die.stutter_seq) > 0
        assert die.stutter_seq[-1] == die.result

def test_die_stutter_seq_no_duplicate_result_in_decoys():
    die = Die(20, 0, 0)
    for _ in range(50):
        die.roll()
        decoys = die.stutter_seq[:-1]
        assert die.result not in decoys
        # Also let's check there are no adjacent duplicates if possible, or just no duplicates at all
        assert len(set(decoys)) == len(decoys)

def test_die_state_machine_progresses_to_settled():
    die = Die(6, 0, 0)
    die.roll()
    
    assert die.state == "fast"
    
    # Progress through fast
    die.update(FAST_DURATION)
    assert die.state == "decel"
    
    # Progress through decel
    die.update(DECEL_DURATION)
    assert die.state == "landing"
    
    # Progress through landing
    die.update(LAND_DURATION)
    assert die.state == "settled"
    
    # Check that after settling it goes idle
    # The settled phase lasts SETTLE_GLOW * 1.6
    # Let's advance a lot of time
    die.update(5.0)
    assert die.state == "idle"
