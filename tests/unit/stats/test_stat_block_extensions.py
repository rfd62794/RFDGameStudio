import pytest
from src.shared.stats.stat_block import StatBlock
from src.shared.genetics.genome import SlimeGenome
from src.shared.entities.creature import Creature
from src.shared.genetics.cultural_base import CulturalBase

@pytest.fixture
def mock_genome():
    genome = SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 255),
        pattern="solid", pattern_color=(255, 255, 255), accessory="none",
        curiosity=1.0, energy=0.5, affection=1.0, shyness=0.0,
        base_hp=20, base_atk=10, base_spd=5,
        cultural_base=CulturalBase.CRYSTAL
    )
    genome.culture_expression = {"crystal": 1.0, "void": 0.0}
    return genome

def test_soft_stats_derived_from_personality(mock_genome):
    """MND: curiosity*8 + energy*4 = 1.0*8 + 0.5*4 = 10.
       RES: (1-shyness)*8 + energy*2 = 1.0*8 + 0.5*2 = 9.
       CHM: affection*8 + (1-shyness)*4 = 1.0*8 + 1.0*4 = 12."""
    block = StatBlock.from_genome(mock_genome)
    
    # Pre-culture values
    assert block.base_mnd == 10.0
    assert block.base_res == 9.0
    assert block.base_chm == 12.0

def test_from_slime_applies_growth_factors(mock_genome):
    slime = Creature(genome=mock_genome, level=2)
    # XP ceiling at level 2 is 100.
    # 50 XP is 0.5 ratio. Growth factor = 0.8 + (0.5 * 0.7) = 1.15.
    slime.vit_xp = 50
    slime.pwr_xp = 100  # ratio 1.0 -> 1.5
    
    block = StatBlock.from_slime(slime)
    
    assert abs(block.hp_growth - 1.15) < 0.001
    assert block.atk_growth == 1.5
    assert block.spd_growth == 0.8  # No xp -> untraind drops to 0.8

def test_from_genome_returns_growth_factor_1_0(mock_genome):
    # from_genome bypasses slime tracking entirely, defaulting to 1.0
    block = StatBlock.from_genome(mock_genome)
    assert block.hp_growth == 1.0
    assert block.atk_growth == 1.0
    assert block.spd_growth == 1.0
    assert block.mnd_growth == 1.0
    assert block.res_growth == 1.0
    assert block.chm_growth == 1.0

def test_vit_growth_affects_final_hp(mock_genome):
    # Base HP is 20
    # Level 1 stage modifier is 0.6
    # No growth (from genome) means HP = 20 * 1.0 * 0.6 + culture_hp(1.0) = 13.
    # We will test manually adjusting the growth to ensure the property scales correctly.
    block = StatBlock.from_genome(mock_genome, level=1)
    hp_normal = block.hp
    
    block.hp_growth = 1.5
    hp_high = block.hp
    
    # 20 * 1.5 * 0.6 + 1.0 = 18 + 1 = 19
    assert hp_high > hp_normal
    assert hp_high == 19

def test_backward_compat_hp_atk_spd_unchanged(mock_genome):
    # The interface hp, atk, spd properties exist and return integers
    block = StatBlock.from_genome(mock_genome, level=4)  # Stage mod = 1.0
    # Crystal HP mod = 1.0. Base = 20. Total = 21.
    assert block.hp == 21
    # Crystal ATK mod = 1.0. Base = 10. Total = 11.
    assert block.atk == 11
    # Crystal SPD mod = 1.0. Base = 5. Total = 6.
    assert block.spd == 6

def test_culture_soft_stat_modifiers_crystal_mnd(mock_genome):
    block = StatBlock.from_genome(mock_genome, level=4)
    # Base check
    # Crystal gives mnd+2.0, res+1.5, chm+0.5
    # Base MND is 10. 10 * 1.0 * 1.0 + 2.0 = 12
    assert block.mnd == 12
    # Base RES is 9. + 1.5 = 10.5 -> 10
    assert block.res == 10
    # Base CHM is 12. + 0.5 = 12.5 -> 12
    assert block.chm == 12

def test_culture_soft_stat_modifiers_tide_chm():
    genome = SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 100),
        pattern="none", pattern_color=(0, 0, 0), accessory="none",
        cultural_base=CulturalBase.TIDE,
        affection=1.0, shyness=0.0, energy=0.0, curiosity=0.0
    )
    # Base CHM: 1.0*8 + 1.0*4 = 12.
    # Tide culture: CHM + 2.5
    genome.culture_expression = {"tide": 1.0}
    block = StatBlock.from_genome(genome, level=4)
    
    assert block.culture_chm == 2.5
    # Final chm = int(12 * 1.0 * 1.0 + 2.5) = 14
    assert block.chm == 14
