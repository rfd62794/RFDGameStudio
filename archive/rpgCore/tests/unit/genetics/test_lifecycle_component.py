"""Tests for LifecycleComponent integration into SlimeGenome"""

import pytest
from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CulturalBase


class TestLifecycleComponent:
    """Test lifecycle functionality integrated into SlimeGenome"""
    
    def test_stage_derivation_all_stages(self):
        """Test stage derivation for all 6 life stages"""
        # Test each stage boundary
        test_cases = [
            (0, 'Hatchling'), (1, 'Hatchling'),
            (2, 'Juvenile'), (3, 'Juvenile'),
            (4, 'Young'), (5, 'Young'),
            (6, 'Prime'), (7, 'Prime'),
            (8, 'Veteran'), (9, 'Veteran'),
            (10, 'Elder'), (15, 'Elder')  # Test above max level
        ]
        
        for level, expected_stage in test_cases:
            genome = SlimeGenome(
                shape="round", size="medium", base_color=(128, 128, 128),
                pattern="solid", pattern_color=(0, 0, 0), accessory="none",
                curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
                level=level
            )
            assert genome.stage == expected_stage, f"Level {level} should be {expected_stage}, got {genome.stage}"
    
    def test_capability_flags_by_stage(self):
        """Test capability flags for each stage"""
        stage_capabilities = {
            'Hatchling': {'can_dispatch': False, 'can_breed': False, 'can_equip': False, 'can_mentor': False},
            'Juvenile': {'can_dispatch': True, 'can_breed': False, 'can_equip': False, 'can_mentor': False},
            'Young': {'can_dispatch': True, 'can_breed': True, 'can_equip': True, 'can_mentor': False},
            'Prime': {'can_dispatch': True, 'can_breed': True, 'can_equip': True, 'can_mentor': False},
            'Veteran': {'can_dispatch': True, 'can_breed': True, 'can_equip': True, 'can_mentor': True},
            'Elder': {'can_dispatch': True, 'can_breed': True, 'can_equip': True, 'can_mentor': True},
        }
        
        for stage, capabilities in stage_capabilities.items():
            # Find level that gives this stage
            level_map = {'Hatchling': 0, 'Juvenile': 2, 'Young': 4, 'Prime': 6, 'Veteran': 8, 'Elder': 10}
            genome = SlimeGenome(
                shape="round", size="medium", base_color=(128, 128, 128),
                pattern="solid", pattern_color=(0, 0, 0), accessory="none",
                curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
                level=level_map[stage]
            )
            
            assert genome.stage == stage
            for capability, expected_value in capabilities.items():
                actual_value = getattr(genome, capability)
                assert actual_value == expected_value, f"{stage} {capability} should be {expected_value}, got {actual_value}"
    
    def test_dispatch_risk_by_stage(self):
        """Test dispatch risk levels by stage"""
        stage_risks = {
            'Hatchling': 'none',
            'Juvenile': 'low',
            'Young': 'standard',
            'Prime': 'standard',
            'Veteran': 'high',
            'Elder': 'critical'
        }
        
        for stage, expected_risk in stage_risks.items():
            level_map = {'Hatchling': 0, 'Juvenile': 2, 'Young': 4, 'Prime': 6, 'Veteran': 8, 'Elder': 10}
            genome = SlimeGenome(
                shape="round", size="medium", base_color=(128, 128, 128),
                pattern="solid", pattern_color=(0, 0, 0), accessory="none",
                curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
                level=level_map[stage]
            )
            
            assert genome.dispatch_risk == expected_risk, f"{stage} risk should be {expected_risk}, got {genome.dispatch_risk}"
    
    def test_tier_stage_interactions(self):
        """Test tier × stage interaction modifiers"""
        # Test special combinations
        test_cases = [
            # (tier, stage, expected_modifier)
            ('Sundered', 'Prime', 'volatile_peak'),
            ('Liminal', 'Elder', 'threshold_legacy'),
            ('Void', 'Hatchling', 'primordial_hatchling'),
            ('Void', 'Prime', 'primordial_prime'),
            ('Void', 'Elder', 'primordial_elder'),
            ('Blooded', 'Young', 'standard'),
            ('Bordered', 'Veteran', 'standard'),
            ('Threaded', 'Juvenile', 'standard'),
        ]
        
        for tier_name, stage_name, expected_modifier in test_cases:
            # Create genome with specific tier and stage
            genome = SlimeGenome(
                shape="round", size="medium", base_color=(128, 128, 128),
                pattern="solid", pattern_color=(0, 0, 0), accessory="none",
                curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
            )
            
            # Set tier by configuring culture_expression
            tier_configs = {
                'Blooded': {'ember': 1.0},
                'Sundered': {'ember': 0.5, 'crystal': 0.5},
                'Liminal': {'ember': 0.2, 'gale': 0.2, 'crystal': 0.2, 'marsh': 0.2, 'tide': 0.2},
                'Void': {'ember': 0.167, 'gale': 0.167, 'crystal': 0.167, 'marsh': 0.167, 'tide': 0.167, 'tundra': 0.166},
                'Threaded': {'ember': 0.33, 'gale': 0.33, 'crystal': 0.34},
                'Bordered': {'ember': 0.5, 'gale': 0.5}
            }
            
            genome.culture_expression = tier_configs.get(tier_name, tier_configs['Blooded'])
            
            # Set level for stage
            level_map = {'Hatchling': 0, 'Juvenile': 2, 'Young': 4, 'Prime': 6, 'Veteran': 8, 'Elder': 10}
            genome.level = level_map.get(stage_name, 0)
            
            assert genome.stage_modifier == expected_modifier, \
                f"{tier_name} + {stage_name} should be {expected_modifier}, got {genome.stage_modifier}"
    
    def test_experience_tracking(self):
        """Test experience tracking fields"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(128, 128, 128),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            level=3, experience_points=150
        )
        
        # Test basic fields
        assert genome.level == 3
        assert genome.experience_points == 150
        assert genome.stage == 'Juvenile'
        
        # Test experience calculation
        assert genome.experience_to_next == 400  # (3+1) * 100
        
        # Test max level
        genome.level = 10
        assert genome.experience_to_next == 0  # Elder is max level
    
    def test_experience_calculation_curve(self):
        """Test experience calculation curve"""
        for level in range(0, 11):
            genome = SlimeGenome(
                shape="round", size="medium", base_color=(128, 128, 128),
                pattern="solid", pattern_color=(0, 0, 0), accessory="none",
                curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
                level=level
            )
            
            if level >= 10:
                expected = 0
            else:
                expected = (level + 1) * 100
            
            assert genome.experience_to_next == expected, \
                f"Level {level} should need {expected} exp, got {genome.experience_to_next}"
    
    def test_backward_compatibility_level_field(self):
        """Test that existing level field is preserved"""
        # Test with existing level field
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(255, 0, 0),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5,
            level=5  # Existing level field
        )
        
        assert genome.level == 5
        assert genome.stage == 'Young'
        assert genome.can_breed == True
        assert genome.can_mentor == False
    
    def test_lifecycle_fields_default_values(self):
        """Test lifecycle fields have proper defaults"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(128, 128, 128),
            pattern="solid", pattern_color=(0, 0, 0), accessory="none",
            curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
        )
        
        # Test defaults
        assert genome.level == 0
        assert genome.experience_points == 0
        assert genome.stage == 'Hatchling'
        assert genome.can_dispatch == False
        assert genome.can_breed == False
        assert genome.can_equip == False
        assert genome.can_mentor == False
        assert genome.dispatch_risk == 'none'
        assert genome.stage_modifier == 'primordial_hatchling'  # Default tier is Void
    
    def test_lifecycle_integration_with_genetics(self):
        """Test lifecycle works with existing genetics fields"""
        genome = SlimeGenome(
            shape="round", size="medium", base_color=(255, 128, 0),
            pattern="spotted", pattern_color=(255, 255, 255), accessory="crown",
            curiosity=0.7, energy=0.8, affection=0.6, shyness=0.3,
            cultural_base=CulturalBase.EMBER,
            level=7, experience_points=250
        )
        
        # Test genetics still work
        assert genome.tier == 1  # Pure ember
        assert genome.tier_name == 'Blooded'
        assert len(genome.personality_axes) == 6
        
        # Test lifecycle works
        assert genome.stage == 'Prime'
        assert genome.can_dispatch == True
        assert genome.can_mentor == False
        assert genome.dispatch_risk == 'standard'
        assert genome.stage_modifier == 'standard'  # Blooded + Prime = standard
