"""
Tests for StatBlock computed stats system.
Verifies culture modifiers, stage scaling, and equipment integration.
"""

import pytest
from dataclasses import replace

from src.shared.stats.stat_block import StatBlock
from src.shared.genetics.genome import SlimeGenome
from src.shared.teams.roster import RosterSlime
from src.shared.genetics.cultural_base import CulturalBase


class TestStatBlock:
    """Test suite for StatBlock functionality."""
    
    @pytest.fixture
    def base_genome(self):
        """Create a base genome for testing."""
        return SlimeGenome(
            shape='round',
            size='medium',
            base_color=(100, 150, 200),
            pattern='solid',
            pattern_color=(50, 75, 100),
            accessory='none',
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            base_hp=20.0,
            base_atk=5.0,
            base_spd=5.0,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=5  # Young stage with 1.0x modifier for predictable results
        )
    
    def test_from_genome_pure_ember(self, base_genome):
        """Test pure ember culture gives attack bonus."""
        ember_genome = replace(base_genome,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0}
        )
        
        stat_block = StatBlock.from_genome(ember_genome, level=ember_genome.level)
        
        assert stat_block.culture_atk == 3.0
        assert stat_block.culture_hp == 0.5
        assert stat_block.culture_spd == 0.5
        
        assert stat_block.hp == int((20.0 * 1.0 * 1.0) + 0.5) # 20
        assert stat_block.atk == int((5.0 * 1.0 * 1.0) + 3.0) # 8
        assert stat_block.spd == int((5.0 * 1.0 * 1.0) + 0.5) # 5
    
    def test_from_genome_pure_marsh(self, base_genome):
        """Test pure marsh culture gives HP bonus."""
        marsh_genome = replace(base_genome,
            cultural_base=CulturalBase.MARSH,
            culture_expression={'ember': 0.0, 'gale': 0.0, 'marsh': 1.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0}
        )
        
        stat_block = StatBlock.from_genome(marsh_genome, level=marsh_genome.level)
        
        assert stat_block.culture_atk == 0.5
        assert stat_block.culture_hp == 3.0
        assert stat_block.culture_spd == 0.5
        
        assert stat_block.hp == int((20.0 * 1.0 * 1.0) + 3.0) # 23
        assert stat_block.atk == int((5.0 * 1.0 * 1.0) + 0.5) # 5
        assert stat_block.spd == int((5.0 * 1.0 * 1.0) + 0.5) # 5
    
    def test_from_genome_pure_gale(self, base_genome):
        """Test pure gale culture gives speed bonus."""
        gale_genome = replace(base_genome,
            cultural_base=CulturalBase.GALE,
            culture_expression={'ember': 0.0, 'gale': 1.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0}
        )
        
        stat_block = StatBlock.from_genome(gale_genome, level=gale_genome.level)
        
        assert stat_block.culture_atk == 0.5
        assert stat_block.culture_hp == 0.5
        assert stat_block.culture_spd == 3.0
        
        assert stat_block.hp == int((20.0 * 1.0 * 1.0) + 0.5) # 20
        assert stat_block.atk == int((5.0 * 1.0 * 1.0) + 0.5) # 5
        assert stat_block.spd == int((5.0 * 1.0 * 1.0) + 3.0) # 8
    
    def test_from_genome_void_culture(self, base_genome):
        """Test mixed culture expression gives multiple bonuses."""
        void_genome = replace(base_genome,
            cultural_base=CulturalBase.VOID,
            culture_expression={'ember': 0.5, 'gale': 0.0, 'marsh': 0.5, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0}
        )
        
        stat_block = StatBlock.from_genome(void_genome, level=void_genome.level)
        
        assert stat_block.culture_atk == 1.75
        assert stat_block.culture_hp == 1.75
        assert stat_block.culture_spd == 0.5
        
        assert stat_block.hp == int((20.0 * 1.0) + 1.75) # 21
        assert stat_block.atk == int((5.0 * 1.0) + 1.75) # 6
        assert stat_block.spd == int((5.0 * 1.0) + 0.5) # 5
    
    def test_stage_modifier_hatchling(self, base_genome):
        """Test hatchling stage modifier reduces stats."""
        hatchling_genome = replace(base_genome, level=0)
        
        stat_block = StatBlock.from_genome(hatchling_genome, level=hatchling_genome.level)
        
        assert stat_block.stage_modifier == 0.6
        expected_hp = int((base_genome.base_hp * 1.0 * 0.6) + stat_block.culture_hp)
        assert stat_block.hp == expected_hp
    
    def test_stage_modifier_prime(self, base_genome):
        """Test prime stage modifier increases stats."""
        prime_genome = replace(base_genome, level=6)
        
        stat_block = StatBlock.from_genome(prime_genome, level=prime_genome.level)
        
        assert stat_block.stage_modifier == 1.2
        expected_hp = int((base_genome.base_hp * 1.0 * 1.2) + stat_block.culture_hp)
        assert stat_block.hp == expected_hp
    
    def test_computed_hp_minimum_one(self):
        """Test HP is never less than 1."""
        low_genome = SlimeGenome(
            shape='round', size='tiny', base_color=(100, 100, 100),
            pattern='solid', pattern_color=(50, 50, 50), accessory='none',
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            base_hp=1.0, base_atk=1.0, base_spd=1.0,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1, level=0
        )
        
        stat_block = StatBlock.from_genome(low_genome, level=low_genome.level)
        
        assert stat_block.hp >= 1
        assert stat_block.atk >= 1
        assert stat_block.spd >= 1
    
    def test_with_equipment_modifiers(self, base_genome):
        """Test equipment modifiers are applied correctly."""
        stat_block = StatBlock.from_genome(base_genome, level=base_genome.level)
        equipped_block = stat_block.with_equipment(hp=10.0, atk=5.0, spd=2.0)
        
        assert equipped_block.equipment_hp == 10.0
        assert equipped_block.equipment_atk == 5.0
        assert equipped_block.equipment_spd == 2.0
        
        assert equipped_block.hp > stat_block.hp
        assert equipped_block.atk > stat_block.atk
        assert equipped_block.spd > stat_block.spd
    
    def test_with_equipment_immutable(self, base_genome):
        """Test with_equipment() returns new instance, doesn't mutate original."""
        stat_block = StatBlock.from_genome(base_genome, level=base_genome.level)
        original_hp = stat_block.hp
        
        equipped_block = stat_block.with_equipment(hp=10.0, atk=5.0, spd=2.0)
        
        assert stat_block.hp == original_hp
        assert stat_block.equipment_hp == 0.0
        assert stat_block.equipment_atk == 0.0
        assert stat_block.equipment_spd == 0.0
        
        assert equipped_block.hp > original_hp
        assert equipped_block.equipment_hp == 10.0
    
    def test_to_dict_contains_all_keys(self, base_genome):
        """Test to_dict() returns all expected keys."""
        stat_block = StatBlock.from_genome(base_genome, level=base_genome.level)
        result = stat_block.to_dict()
        
        expected_keys = {
            'hp', 'atk', 'spd', 'mnd', 'res', 'chm',
            'base_hp', 'base_atk', 'base_spd', 'base_mnd', 'base_res', 'base_chm',
            'culture_hp', 'culture_atk', 'culture_spd', 'culture_mnd', 'culture_res', 'culture_chm',
            'hp_growth', 'atk_growth', 'spd_growth', 'mnd_growth', 'res_growth', 'chm_growth',
            'stage_modifier'
        }
        
        assert set(result.keys()) == expected_keys
        assert result['hp'] == stat_block.hp
        assert result['atk'] == stat_block.atk
        assert result['spd'] == stat_block.spd
    
    def test_stat_block_property_on_roster_slime(self, base_genome):
        """Test RosterSlime.stat_block property returns StatBlock instance."""
        slime = RosterSlime(
            slime_id="test_slime",
            name="Test Slime",
            genome=base_genome,
            level=2
        )
        
        stat_block = slime.stat_block
        
        assert isinstance(stat_block, StatBlock)
        assert stat_block.hp >= 1
        assert stat_block.atk >= 1
        assert stat_block.spd >= 1
        
        assert stat_block.base_hp == base_genome.base_hp
        assert stat_block.base_atk == base_genome.base_atk
        assert stat_block.base_spd == base_genome.base_spd
    
    def test_stat_block_culture_tundra_spd_penalty(self, base_genome):
        """Test pure tundra culture applies speed penalty."""
        tundra_genome = replace(base_genome,
            cultural_base=CulturalBase.TUNDRA,
            culture_expression={'ember': 0.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 1.0, 'tide': 0.0}
        )
        
        stat_block = StatBlock.from_genome(tundra_genome, level=tundra_genome.level)
        
        assert stat_block.culture_atk == 0.5
        assert stat_block.culture_hp == 2.0
        assert stat_block.culture_spd == -1.0
        
        assert stat_block.hp == int((20.0 * 1.0 * 1.0) + 2.0)
        assert stat_block.culture_spd < 0
    
    def test_stage_modifier_veteran(self, base_genome):
        """Test veteran stage modifier."""
        veteran_genome = replace(base_genome, level=8)
        stat_block = StatBlock.from_genome(veteran_genome, level=veteran_genome.level)
        
        assert stat_block.stage_modifier == 1.1
        expected_hp = int((base_genome.base_hp * 1.0 * 1.1) + stat_block.culture_hp)
        assert stat_block.hp == expected_hp
    
    def test_stage_modifier_elder(self, base_genome):
        """Test elder stage modifier."""
        elder_genome = replace(base_genome, level=10)
        stat_block = StatBlock.from_genome(elder_genome, level=elder_genome.level)
        
        assert stat_block.stage_modifier == 1.0
        expected_hp = int((base_genome.base_hp * 1.0 * 1.0) + stat_block.culture_hp)
        assert stat_block.hp == expected_hp
