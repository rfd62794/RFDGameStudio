"""
Comprehensive tests for BreedingSystem allele resolution and genetic inheritance.
"""

import pytest
from unittest.mock import Mock, patch
import random

from src.shared.genetics.breeding_system import BreedingSystem
from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CulturalBase
from src.shared.teams.roster import RosterSlime


class TestBreedingSystem:
    """Test suite for BreedingSystem functionality."""
    
    @pytest.fixture
    def sample_parents(self):
        """Create sample parent slimes for testing."""
        # Parent A: Pure ember culture
        genome_a = SlimeGenome(
            shape='round',
            size='medium',
            base_color=(255, 100, 100),
            pattern='solid',
            pattern_color=(200, 50, 50),
            accessory='none',
            curiosity=0.8,
            energy=0.6,
            affection=0.4,
            shyness=0.2,
            base_hp=20.0,
            base_atk=8.0,
            base_spd=6.0,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=4
        )
        
        # Parent B: Pure marsh culture  
        genome_b = SlimeGenome(
            shape='cubic',
            size='large',
            base_color=(100, 255, 100),
            pattern='spotted',
            pattern_color=(50, 200, 50),
            accessory='crown',
            curiosity=0.3,
            energy=0.4,
            affection=0.7,
            shyness=0.6,
            base_hp=25.0,
            base_atk=5.0,
            base_spd=4.0,
            cultural_base=CulturalBase.MARSH,
            culture_expression={'ember': 0.0, 'gale': 0.0, 'marsh': 1.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=2,
            level=4
        )
        
        parent_a = RosterSlime(
            slime_id='parent_a',
            name='Ember Parent',
            genome=genome_a,
            team='unassigned',
            level=3,
            generation=1
        )
        
        parent_b = RosterSlime(
            slime_id='parent_b', 
            name='Marsh Parent',
            genome=genome_b,
            team='unassigned',
            level=4,
            generation=2
        )
        
        return parent_a, parent_b
    
    @pytest.fixture
    def parents_with_missing_culture(self):
        """Create parents with missing culture_expression (old save data)."""
        # Parent with missing culture_expression
        genome_old = SlimeGenome(
            shape='amorphous',
            size='tiny',
            base_color=(150, 150, 150),
            pattern='iridescent',
            pattern_color=(100, 100, 100),
            accessory='glow',
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            base_hp=18.0,
            base_atk=6.0,
            base_spd=7.0,
            cultural_base=CulturalBase.VOID,
            # culture_expression missing - simulates old save data
            generation=1,
            level=2
        )
        
        parent_old = RosterSlime(
            slime_id='parent_old',
            name='Void Parent',
            genome=genome_old,
            team='unassigned',
            level=2,
            generation=1
        )
        
        return parent_old
    
    def test_can_breed_eligible_parents(self, sample_parents):
        """Test breeding eligibility for valid parents."""
        parent_a, parent_b = sample_parents
        
        eligible, reason = BreedingSystem.can_breed(parent_a, parent_b)
        
        assert eligible is True
        assert reason == "Compatible"
    
    def test_can_breed_self_breed_rejection(self, sample_parents):
        """Test that self-breeding is rejected."""
        parent_a, _ = sample_parents
        
        eligible, reason = BreedingSystem.can_breed(parent_a, parent_a)
        
        assert eligible is False
        assert reason == "Cannot self-breed"
    
    def test_can_breed_level_requirement(self, sample_parents):
        """Test breeding level requirements."""
        parent_a, parent_b = sample_parents
        
        # Create a parent with low level genome (can't breed)
        low_level_genome = SlimeGenome(
            shape='round', size='tiny', base_color=(100, 100, 100),
            pattern='solid', pattern_color=(50, 50, 50), accessory='none',
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            base_hp=10.0, base_atk=3.0, base_spd=3.0,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=1  # Too low to breed
        )
        parent_low = RosterSlime('low', 'Low Parent', low_level_genome, 'unassigned', 1, 1)
        
        eligible, reason = BreedingSystem.can_breed(parent_low, parent_b)
        
        assert eligible is False
        assert "not old enough" in reason
    
    def test_resolve_culture_expression_blending(self, sample_parents):
        """Test culture expression blending between parents."""
        parent_a, parent_b = sample_parents
        
        result = BreedingSystem.resolve_culture_expression(parent_a.genome, parent_b.genome)
        
        # Should have all 6 cultures
        assert len(result) == 6
        assert all(culture in result for culture in ['ember', 'gale', 'marsh', 'crystal', 'tundra', 'tide'])
        
        # Should sum to 1.0 (normalized)
        total = sum(result.values())
        assert abs(total - 1.0) < 0.001
        
        # Should have both parent cultures represented
        assert result['ember'] > 0.0  # From parent A
        assert result['marsh'] > 0.0  # From parent B
    
    def test_resolve_culture_expression_missing_fallback(self, parents_with_missing_culture):
        """Test culture expression fallback for missing data."""
        parent_old = parents_with_missing_culture
        
        # Create another parent with valid culture
        genome_valid = SlimeGenome(
            shape='round', size='medium', base_color=(100, 100, 255),
            pattern='solid', pattern_color=(50, 50, 200), accessory='none',
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            base_hp=20.0, base_atk=5.0, base_spd=5.0,
            cultural_base=CulturalBase.MARSH,
            culture_expression={'ember': 0.0, 'gale': 1.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
        parent_valid = RosterSlime('valid', 'Valid Parent', genome_valid, 'unassigned', 3, 1)
        
        result = BreedingSystem.resolve_culture_expression(parent_old.genome, parent_valid.genome)
        
        # Should still work and have both cultures
        assert len(result) == 6
        assert result['gale'] > 0.0  # From valid parent
        assert result['marsh'] > 0.0  # From fallback (void -> marsh)
    
    def test_resolve_stats_inheritance(self, sample_parents):
        """Test stat inheritance from parents."""
        parent_a, parent_b = sample_parents
        
        result = BreedingSystem.resolve_stats(parent_a.genome, parent_b.genome)
        
        # Should have all three stats
        assert len(result) == 3
        assert 'base_hp' in result
        assert 'base_atk' in result
        assert 'base_spd' in result
        
        # Should be between parent values (approximately)
        assert result['base_hp'] > 0.0
        assert result['base_atk'] > 0.0
        assert result['base_spd'] > 0.0
    
    def test_resolve_visual_inheritance(self, sample_parents):
        """Test visual trait inheritance."""
        parent_a, parent_b = sample_parents
        
        result = BreedingSystem.resolve_visual(
            parent_a.genome, parent_b.genome, 
            {'ember': 0.5, 'marsh': 0.5, 'gale': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0}
        )
        
        # Should have all visual traits
        required_visuals = ['shape', 'size', 'base_color', 'pattern', 'pattern_color', 'accessory']
        assert all(trait in result for trait in required_visuals)
        
        # Should be valid values
        assert result['shape'] in ['round', 'cubic', 'amorphous', 'crystalline', 'elongated']
        assert result['size'] in ['tiny', 'small', 'medium', 'large', 'massive']
        assert len(result['base_color']) == 3  # RGB tuple
        assert all(0 <= c <= 255 for c in result['base_color'])
    
    def test_breed_complete_round_trip(self, sample_parents):
        """Test complete breeding process."""
        parent_a, parent_b = sample_parents
        
        with patch('random.random', return_value=0.5), \
             patch('random.uniform', return_value=0.0), \
             patch('random.randint', return_value=0):
            
            offspring = BreedingSystem.breed(parent_a, parent_b)
            
            assert offspring is not None
            assert isinstance(offspring, SlimeGenome)
            
            # Should have generation increased
            assert offspring.generation == max(parent_a.genome.generation, parent_b.genome.generation) + 1
            
            # Should have parent lineage
            assert offspring.parent_ids == (parent_a.name, parent_b.name)
            
            # Should have valid culture expression
            assert len(offspring.culture_expression) == 6
            assert abs(sum(offspring.culture_expression.values()) - 1.0) < 0.001
    
    def test_breed_ineligible_parents(self, sample_parents):
        """Test breeding with ineligible parents returns None."""
        parent_a, parent_b = sample_parents
        
        # Create a parent with low level genome (can't breed)
        low_level_genome = SlimeGenome(
            shape='round', size='tiny', base_color=(100, 100, 100),
            pattern='solid', pattern_color=(50, 50, 50), accessory='none',
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            base_hp=10.0, base_atk=3.0, base_spd=3.0,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=1  # Too low to breed
        )
        parent_low = RosterSlime('low', 'Low Parent', low_level_genome, 'unassigned', 1, 1)
        
        offspring = BreedingSystem.breed(parent_low, parent_b)
        
        assert offspring is None
    
    def test_dominant_culture_derivation(self):
        """Test dominant culture derivation from expression."""
        # Test ember dominant
        expr_ember = {'ember': 0.8, 'gale': 0.1, 'marsh': 0.05, 'crystal': 0.02, 'tundra': 0.02, 'tide': 0.01}
        dominant = BreedingSystem._dominant_culture(expr_ember)
        assert dominant == CulturalBase.EMBER
        
        # Test tie-breaker culture fallback
        expr_mixed = {'ember': 0.3, 'gale': 0.3, 'marsh': 0.2, 'crystal': 0.1, 'tundra': 0.05, 'tide': 0.05}
        dominant = BreedingSystem._dominant_culture(expr_mixed)
        assert dominant in [CulturalBase.EMBER, CulturalBase.GALE]  # Could be either due to tie
        
        # Test unknown culture fallback
        expr_unknown = {'unknown': 1.0}
        dominant = BreedingSystem._dominant_culture(expr_unknown)
        assert dominant == CulturalBase.VOID
    
    def test_variance_bounds(self, sample_parents):
        """Test that variance stays within reasonable bounds."""
        parent_a, parent_b = sample_parents
        
        # Test many iterations to ensure bounds
        for _ in range(100):
            result = BreedingSystem.resolve_culture_expression(parent_a.genome, parent_b.genome)
            
            # All values should be between 0 and 1
            assert all(0.0 <= value <= 1.0 for value in result.values())
            
            # Should sum to 1.0
            total = sum(result.values())
            assert abs(total - 1.0) < 0.001
    
    def test_personality_inheritance(self, sample_parents):
        """Test personality trait inheritance."""
        parent_a, parent_b = sample_parents
        
        with patch('random.random', return_value=0.5), \
             patch('random.uniform', return_value=0.0):
            
            offspring = BreedingSystem.breed(parent_a, parent_b)
            
            # Should have all personality traits
            assert hasattr(offspring, 'curiosity')
            assert hasattr(offspring, 'energy')
            assert hasattr(offspring, 'affection')
            assert hasattr(offspring, 'shyness')
            
            # Should be between 0 and 1
            assert 0.0 <= offspring.curiosity <= 1.0
            assert 0.0 <= offspring.energy <= 1.0
            assert 0.0 <= offspring.affection <= 1.0
            assert 0.0 <= offspring.shyness <= 1.0
    
    def test_culture_alias_fallback(self, parents_with_missing_culture):
        """Test culture recovery mapping in fallback."""
        parent_old = parents_with_missing_culture
        
        # Create a genome with missing culture_expression to trigger fallback
        genome_marsh = SlimeGenome(
            shape='round', size='medium', base_color=(100, 255, 100),
            pattern='spotted', pattern_color=(50, 200, 50), accessory='none',
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            base_hp=20.0, base_atk=5.0, base_spd=5.0,
            cultural_base=CulturalBase.MARSH,
            # culture_expression missing - will trigger fallback
            generation=1,
            level=3
        )
        
        # Manually clear culture_expression to test fallback
        genome_marsh.culture_expression = {}
        
        expr = BreedingSystem._get_culture_expression_fallback(genome_marsh)
        
        # Should map cultural base enum to expression
        assert 'marsh' in expr
        assert expr['marsh'] == 1.0
    
    def test_generation_tracking(self, sample_parents):
        """Test generation tracking in offspring."""
        parent_a, parent_b = sample_parents
        
        # Test automatic generation increment
        offspring = BreedingSystem.breed(parent_a, parent_b)
        assert offspring.generation == 3  # max(1, 2) + 1
        
        # Test explicit generation override
        offspring_explicit = BreedingSystem.breed(parent_a, parent_b, generation=5)
        assert offspring_explicit.generation == 5
