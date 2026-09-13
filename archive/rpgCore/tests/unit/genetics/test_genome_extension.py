"""Tests for extended SlimeGenome with GeneticsComponent fields"""

import pytest
from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CulturalBase


class TestSlimeGenomeExtension:
    """Test extended SlimeGenome functionality"""
    
    def test_culture_expression_defaults_from_cultural_base(self):
        """Test culture_expression is properly initialized from cultural_base"""
        # Test pure culture
        genome_ember = SlimeGenome(
            shape="round", size="medium", base_color=(255, 0, 0),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            cultural_base=CulturalBase.EMBER
        )
        assert genome_ember.culture_expression['ember'] == 1.0
        assert all(expr == 0.0 for culture, expr in genome_ember.culture_expression.items() 
                  if culture != 'ember')
        
        # Test varied culture
        genome_mixed = SlimeGenome(
            shape="round", size="medium", base_color=(128, 128, 128),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            cultural_base=CulturalBase.VOID
        )
        expected_mixed = 1.0 / 6.0  # Equal distribution
        for expr in genome_mixed.culture_expression.values():
            assert abs(expr - expected_mixed) < 0.001
        
        # Test void culture
        genome_void = SlimeGenome(
            shape="round", size="medium", base_color=(64, 0, 128),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            cultural_base=CulturalBase.VOID
        )
        expected_void = 1.0 / 6.0  # Equal distribution
        for expr in genome_void.culture_expression.values():
            assert abs(expr - expected_void) < 0.001
    
    def test_tier_calculation_all_tiers(self):
        """Test tier calculation for all 8 tiers"""
        # Tier 1: Blooded (single culture)
        genome_blooded = SlimeGenome(
            shape="round", size="medium", base_color=(255, 0, 0),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            cultural_base=CulturalBase.EMBER
        )
        assert genome_blooded.tier == 1
        assert genome_blooded.tier_name == 'Blooded'
        
        # Tier 2: Bordered (adjacent cultures)
        genome_bordered = SlimeGenome(
            shape="round", size="medium", base_color=(255, 128, 0),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome_bordered.culture_expression = {
            'ember': 0.5, 'gale': 0.5, 'crystal': 0.0,
            'marsh': 0.0, 'tide': 0.0, 'tundra': 0.0
        }
        assert genome_bordered.tier == 2
        assert genome_bordered.tier_name == 'Bordered'
        
        # Tier 3: Sundered (opposite cultures)
        genome_sundered = SlimeGenome(
            shape="round", size="medium", base_color=(255, 0, 255),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome_sundered.culture_expression = {
            'ember': 0.5, 'crystal': 0.5, 'gale': 0.0,
            'marsh': 0.0, 'tide': 0.0, 'tundra': 0.0
        }
        assert genome_sundered.tier == 3
        assert genome_sundered.tier_name == 'Sundered'
        
        # Tier 4: Drifted (skip-one cultures)
        genome_drifted = SlimeGenome(
            shape="round", size="medium", base_color=(255, 64, 128),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome_drifted.culture_expression = {
            'ember': 0.5, 'tide': 0.5, 'gale': 0.0,
            'crystal': 0.0, 'marsh': 0.0, 'tundra': 0.0
        }
        assert genome_drifted.tier == 4
        assert genome_drifted.tier_name == 'Drifted'
        
        # Tier 5: Threaded (3 cultures)
        genome_threaded = SlimeGenome(
            shape="round", size="medium", base_color=(192, 192, 192),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome_threaded.culture_expression = {
            'ember': 0.33, 'gale': 0.33, 'crystal': 0.34,
            'marsh': 0.0, 'tide': 0.0, 'tundra': 0.0
        }
        assert genome_threaded.tier == 5
        assert genome_threaded.tier_name == 'Threaded'
        
        # Tier 6: Convergent (4 cultures)
        genome_convergent = SlimeGenome(
            shape="round", size="medium", base_color=(128, 128, 128),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome_convergent.culture_expression = {
            'ember': 0.25, 'gale': 0.25, 'crystal': 0.25,
            'marsh': 0.25, 'tide': 0.0, 'tundra': 0.0
        }
        assert genome_convergent.tier == 6
        assert genome_convergent.tier_name == 'Convergent'
        
        # Tier 7: Liminal (5 cultures)
        genome_liminal = SlimeGenome(
            shape="round", size="medium", base_color=(64, 64, 64),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome_liminal.culture_expression = {
            'ember': 0.2, 'gale': 0.2, 'crystal': 0.2,
            'marsh': 0.2, 'tide': 0.2, 'tundra': 0.0
        }
        assert genome_liminal.tier == 7
        assert genome_liminal.tier_name == 'Liminal'
        
        # Tier 8: Void (6 cultures)
        genome_void_tier = SlimeGenome(
            shape="round", size="medium", base_color=(32, 0, 64),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome_void_tier.culture_expression = {
            'ember': 0.167, 'gale': 0.167, 'crystal': 0.167,
            'marsh': 0.167, 'tide': 0.167, 'tundra': 0.166
        }
        assert genome_void_tier.tier == 8
        assert genome_void_tier.tier_name == 'Void'
    
    def test_personality_axes_mapping(self):
        """Test personality axes are properly mapped"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(128, 64, 255),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        genome.culture_expression = {
            'ember': 0.8, 'gale': 0.1, 'crystal': 0.05,
            'marsh': 0.02, 'tide': 0.02, 'tundra': 0.01
        }
        genome.curiosity = 0.5  # Existing personality trait
        
        personality = genome.personality_axes
        
        # Check mapping
        assert personality['aggression'] == 0.8  # ember expression
        assert personality['curiosity'] == 0.1 + 0.5 * 0.1  # gale + existing curiosity
        assert personality['patience'] == 0.02  # marsh expression
        assert personality['caution'] == 0.05  # crystal expression
        assert personality['independence'] == 0.01  # tundra expression
        assert personality['sociability'] == 0.02  # tide expression
    
    def test_lineage_fields(self):
        """Test lineage tracking fields"""
        # Test default values
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(64, 128, 255),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        assert genome.parent_ids is None
        assert genome.mutations == []
        assert genome.generation == 1  # Existing field preserved
        
        # Test setting parent IDs
        parent_genome = SlimeGenome(
            shape="round", size="medium", base_color=(32, 64, 128),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            parent_ids=("parent1_uuid", "parent2_uuid"),
            generation=2
        )
        assert parent_genome.parent_ids == ("parent1_uuid", "parent2_uuid")
        assert parent_genome.generation == 2
    
    def test_mutation_tracking(self):
        """Test mutation history tracking"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(16, 32, 64),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        
        # Add mutation
        mutation = {
            'type': 'color',
            'generation': 2,
            'description': 'Hue shift in ember expression'
        }
        genome.mutations.append(mutation)
        
        assert len(genome.mutations) == 1
        assert genome.mutations[0] == mutation
    
    def test_hexagon_adjacency(self):
        """Test hexagon adjacency map for tier calculation"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(8, 16, 32),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        
        # Test adjacency relationships
        assert 'gale' in genome.HEXAGON_ADJACENCY['ember']
        assert 'marsh' in genome.HEXAGON_ADJACENCY['ember']
        assert 'crystal' not in genome.HEXAGON_ADJACENCY['ember']  # ember and crystal are opposite
        assert 'tundra' not in genome.HEXAGON_ADJACENCY['ember']
        assert 'tide' not in genome.HEXAGON_ADJACENCY['ember']
    
    def test_opposite_cultures(self):
        """Test opposite culture detection"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(4, 8, 16),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        
        # Test known opposites
        assert genome._are_opposite('ember', 'crystal')
        assert genome._are_opposite('crystal', 'ember')
        assert genome._are_opposite('gale', 'tundra')
        assert genome._are_opposite('tundra', 'gale')
        assert genome._are_opposite('marsh', 'tide')
        assert genome._are_opposite('tide', 'marsh')
        
        # Test non-opposites
        assert not genome._are_opposite('ember', 'gale')
        assert not genome._are_opposite('crystal', 'tide')
    
    def test_backward_compatibility(self):
        """Test existing fields and functionality remain unchanged"""
        genome = SlimeGenome(
            shape="round",
            size="medium",
            base_color=(100, 100, 255),
            pattern="spotted",
            pattern_color=(255, 255, 255),
            accessory="none",
            curiosity=0.5,
            energy=0.7,
            affection=0.3,
            shyness=0.2,
            base_hp=25.0,
            base_atk=7.0,
            base_spd=6.0,
            generation=3,
            cultural_base=CulturalBase.EMBER
        )
        
        # All original fields should be accessible
        assert genome.shape == "round"
        assert genome.size == "medium"
        assert genome.base_color == (100, 100, 255)
        assert genome.pattern == "spotted"
        assert genome.pattern_color == (255, 255, 255)
        assert genome.accessory == "none"
        assert genome.curiosity == 0.5
        assert genome.energy == 0.7
        assert genome.affection == 0.3
        assert genome.shyness == 0.2
        assert genome.base_hp == 25.0
        assert genome.base_atk == 7.0
        assert genome.base_spd == 6.0
        assert genome.generation == 3
        assert genome.cultural_base == CulturalBase.EMBER
        
        # New fields should be initialized
        assert len(genome.culture_expression) == 6
        assert genome.culture_expression['ember'] == 1.0
        assert genome.tier == 1
        assert genome.tier_name == 'Blooded'
    
    def test_culture_expression_threshold(self):
        """Test tier calculation respects 0.05 threshold"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(2, 4, 8),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        
        # Culture with expression exactly at threshold should be counted
        genome.culture_expression = {
            'ember': 0.05, 'gale': 0.95, 'crystal': 0.0,
            'marsh': 0.0, 'tide': 0.0, 'tundra': 0.0
        }
        assert genome.tier == 2  # Should be Bordered (2 active cultures: ember and gale are adjacent)
        
        # Culture with expression below threshold should not be counted
        genome.culture_expression = {
            'ember': 0.04, 'gale': 0.96, 'crystal': 0.0,
            'marsh': 0.0, 'tide': 0.0, 'tundra': 0.0
        }
        assert genome.tier == 1  # Should be Blooded (1 active culture: only gale)
