import pytest
from unittest.mock import Mock, patch

from src.shared.progression.xp_system import (
    award_xp,
    XPResult,
    training_efficiency,
    critical_training_chance,
    ACTIVITY_REWARDS
)
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CulturalBase

@pytest.fixture
def mock_slime():
    genome = SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 255),
        pattern="solid", pattern_color=(255, 255, 255), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
        cultural_base=CulturalBase.EMBER
    )
    # Force culture expression to pure ember
    genome.culture_expression = {"ember": 1.0, "void": 0.0}
    
    slime = Creature(genome=genome, level=1, experience=0)
    # Set default xp fields just to be safe (they are 0 by default anyway)
    slime.vit_xp = 0
    slime.pwr_xp = 0
    slime.agi_xp = 0
    slime.mnd_xp = 0
    slime.res_xp = 0
    slime.chm_xp = 0
    return slime

@pytest.fixture
def mock_void_slime():
    genome = SlimeGenome(
        shape="round", size="small", base_color=(100, 100, 100),
        pattern="none", pattern_color=(0, 0, 0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
        cultural_base=CulturalBase.VOID
    )
    genome.culture_expression = {"void": 1.0}
    return Creature(genome=genome)

def test_award_xp_sumo_win_returns_correct_totals(mock_void_slime):
    result = award_xp(mock_void_slime, "Sumo win")
    assert result.total_xp_gained == 50
    assert result.stat_xp_gained["vit"] == 30
    assert result.stat_xp_gained["pwr"] == 20
    assert result.stat_xp_gained["agi"] == 0
    assert result.stat_xp_gained["mnd"] == 0
    assert result.stat_xp_gained["res"] == 10
    assert result.stat_xp_gained["chm"] == 5

@patch("random.random", return_value=0.99) # No critical hits
def test_award_xp_applies_culture_amplification_ember(mock_random, mock_slime):
    # Ember amplifies PWR by 1.25x and AGI by 1.1x.
    result = award_xp(mock_slime, "Sumo win")
    
    # Base PWR is 20. 20 * 1.25 = 25.
    assert result.stat_xp_gained["pwr"] == 25
    # Base VIT is 30. Ember has 1.0x.
    assert result.stat_xp_gained["vit"] == 30
    
@patch("random.random", return_value=0.99)
def test_award_xp_applies_culture_amplification_gale(mock_random):
    genome = SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 100),
        pattern="none", pattern_color=(0, 0, 0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
        cultural_base=CulturalBase.GALE
    )
    genome.culture_expression = {"gale": 1.0}
    slime = Creature(genome=genome)
    
    result = award_xp(slime, "Race win")
    # Base AGI is 50. Gale amplifies AGI by 1.25 -> 62.5 -> int(62)
    assert result.stat_xp_gained["agi"] == 62
    # MND is 10. Gale amplifies MND by 1.1 -> 11
    assert result.stat_xp_gained["mnd"] == 11

@patch("random.random", return_value=0.99)
def test_award_xp_mixed_culture_weighted_amplification(mock_random):
    genome = SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 100),
        pattern="none", pattern_color=(0, 0, 0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
        cultural_base=CulturalBase.VOID
    )
    # Mix of Ember (PWR 1.25, VIT 1.0) and Marsh (PWR 1.0, VIT 1.25)
    genome.culture_expression = {"ember": 0.5, "marsh": 0.5}
    slime = Creature(genome=genome)
    
    result = award_xp(slime, "Sumo win")
    # Base PWR is 20. Amp = (0.5*1.25) + (0.5*1.0) = 1.125. 20 * 1.125 = 22.5 -> 22
    assert result.stat_xp_gained["pwr"] == 22
    # Base VIT is 30. Amp = (0.5*1.0) + (0.5*1.25) = 1.125. 30 * 1.125 = 33.75 -> 33
    assert result.stat_xp_gained["vit"] == 33

@patch("random.random", return_value=0.99)
def test_award_xp_void_no_amplification(mock_random, mock_void_slime):
    result = award_xp(mock_void_slime, "Dungeon boss clear")
    # Dungeon boss base: VIT20 PWR40 AGI10 MND20 RES15 CHM0
    assert result.stat_xp_gained["pwr"] == 40
    assert result.stat_xp_gained["vit"] == 20
    assert result.stat_xp_gained["agi"] == 10
    assert result.stat_xp_gained["mnd"] == 20
    assert result.stat_xp_gained["res"] == 15

def test_award_xp_detects_level_up(mock_slime):
    # Level 1 requires 7 XP to level up (5 + 1*2)
    mock_slime.level = 1
    mock_slime.experience = 0
    # Garden idle gives 5 TXP. Not enough.
    res1 = award_xp(mock_slime, "Garden idle (daily)")
    assert not res1.leveled_up
    assert res1.new_level == 1
    
    # Player interaction gives 10 TXP. Total 15.
    # Needs 7 XP to reach lvl 2. (leaves 8). Needs 9 XP to reach lvl 3. (Not enough).
    res2 = award_xp(mock_slime, "Player interaction")
    assert res2.leveled_up
    assert res2.new_level == 2

def test_award_xp_detects_stage_advance(mock_slime):
    mock_slime.level = 1
    mock_slime.experience = 0
    
    old_stage = "Hatchling" 
    
    # Force a massive level up to level 4
    # L1->2=7, L2->3=9, L3->4=11. Total 27.
    # Sumo win gives 50 TXP. Level 1 + 50 TXP > Level 4 (Young)
    result = award_xp(mock_slime, "Sumo win")
    assert result.leveled_up
    assert result.new_level >= 4
    assert result.stage_advanced
    assert result.new_stage == "Young"

@patch("random.random", return_value=0.99)
def test_award_xp_performance_perfect_multiplier(mock_random, mock_void_slime):
    result = award_xp(mock_void_slime, "Training dummy perf", performance="perfect")
    # Base txp 25 -> 37, pwr 25 -> 37
    assert result.total_xp_gained == 37  # int(25 * 1.5)
    assert result.stat_xp_gained["pwr"] == 37  # int(25 * 1.5)

@patch("random.random", return_value=0.99)
def test_award_xp_performance_loss_multiplier(mock_random, mock_void_slime):
    # The game actually has separate "Sumo loss" activity, but we can test performance multiplier.
    # Note: the mock_void_slime base PWR isn't affected, just the raw drop from the dictionary.
    result = award_xp(mock_void_slime, "Sumo win", performance="loss")
    # base txp 50 -> 25. base vit 30 -> 12. base pwr 20 -> 8
    assert result.total_xp_gained == 25
    assert result.stat_xp_gained["vit"] == 12  # int(30 * 0.4)
    assert result.stat_xp_gained["pwr"] == 8   # int(20 * 0.4)

def test_award_xp_does_not_mutate_slime(mock_slime):
    original_mnd_xp = mock_slime.mnd_xp
    original_exp = mock_slime.experience
    
    award_xp(mock_slime, "Dungeon room clear")
    
    # Assert unmodified
    assert mock_slime.mnd_xp == original_mnd_xp
    assert mock_slime.experience == original_exp

def test_training_efficiency_decreases_correctly():
    assert training_efficiency(0) == 1.0
    assert abs(training_efficiency(100) - 0.85) < 0.001
    assert training_efficiency(300) == 0.7  # Clamped

def test_critical_training_doubles_stats(mock_slime):
    with patch("random.random", return_value=0.01): # Guarantee critical
        result = award_xp(mock_slime, "Sumo win")
        assert result.critical_training is True
        # Base PWR is 20. Ember culture = 1.25 (25). Critical = * 2 (50).
        assert result.stat_xp_gained["pwr"] == 50
