"""
Tests for SlimeEntityTemplate canonical factory and validation.
"""

import pytest
import uuid
from unittest.mock import patch

from src.shared.genetics.entity_template import SlimeEntityTemplate
from src.shared.genetics.genome import SlimeGenome
from src.shared.teams.roster import RosterSlime
from src.shared.genetics.cultural_base import CulturalBase


class TestSlimeEntityTemplate:
    """Test suite for SlimeEntityTemplate functionality."""
    
    @pytest.fixture
    def valid_genome(self):
        """Create a valid genome for testing."""
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
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
    
    @pytest.fixture
    def invalid_genome(self):
        """Create an invalid genome (missing required fields)."""
        return SlimeGenome(
            shape=None,  # Invalid - None instead of string
            size=None,  # Invalid - None instead of string
            base_color=None,  # Invalid - None instead of tuple
            pattern=None,  # Invalid - None instead of string
            pattern_color=None,  # Invalid - None instead of tuple
            accessory=None,  # Invalid - None instead of string
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
    
    def test_build_valid_genome_returns_slime(self, valid_genome):
        """Test building with full valid genome returns RosterSlime."""
        slime = SlimeEntityTemplate.build(
            genome=valid_genome,
            name="Test Slime"
        )
        
        assert isinstance(slime, RosterSlime)
        assert slime.name == "Test Slime"
        assert slime.genome == valid_genome
        assert slime.team == 'unassigned'
        assert slime.level == 1
        assert slime.generation == 1
    
    def test_build_generates_uuid_if_not_provided(self, valid_genome):
        """Test that build() generates UUID when slime_id not provided."""
        slime = SlimeEntityTemplate.build(
            genome=valid_genome,
            name="Test Slime"
        )
        
        assert slime.slime_id is not None
        assert len(slime.slime_id) == 36  # UUID string length
        # Verify it's a valid UUID format
        uuid.UUID(slime.slime_id)  # Will raise if invalid
    
    def test_build_uses_provided_uuid(self, valid_genome):
        """Test that build() uses provided slime_id."""
        custom_id = "custom-slime-id-123"
        slime = SlimeEntityTemplate.build(
            genome=valid_genome,
            name="Test Slime",
            slime_id=custom_id
        )
        
        assert slime.slime_id == custom_id
    
    def test_build_invalid_genome_raises(self, invalid_genome):
        """Test that build() raises ValueError for invalid genome."""
        with pytest.raises(ValueError) as exc_info:
            SlimeEntityTemplate.build(
                genome=invalid_genome,
                name="Invalid Slime"
            )
        
        error_msg = str(exc_info.value)
        assert "Invalid genome for 'Invalid Slime'" in error_msg
        assert "genome.shape is None" in error_msg
    
    def test_validate_valid_slime_returns_empty(self, valid_genome):
        """Test validate() on good slime returns empty errors list."""
        slime = RosterSlime(
            slime_id="test-id",
            name="Test Slime",
            genome=valid_genome
        )
        
        errors = SlimeEntityTemplate.validate(slime)
        assert errors == []
    
    def test_validate_missing_name_returns_error(self, valid_genome):
        """Test validate() on slime with empty name returns error."""
        slime = RosterSlime(
            slime_id="test-id",
            name="",  # Empty name
            genome=valid_genome
        )
        
        errors = SlimeEntityTemplate.validate(slime)
        assert len(errors) > 0
        assert any("name" in error for error in errors)
    
    def test_validate_missing_slime_id_returns_error(self, valid_genome):
        """Test validate() on slime with missing slime_id returns error."""
        slime = RosterSlime(
            slime_id="",  # Empty slime_id
            name="Test Slime",
            genome=valid_genome
        )
        
        errors = SlimeEntityTemplate.validate(slime)
        assert len(errors) > 0
        assert any("slime_id" in error for error in errors)
    
    def test_validate_genome_missing_required_field(self):
        """Test validate_genome() on genome with None shape returns error."""
        genome = SlimeGenome(
            shape=None,  # Missing required field
            size='medium',
            base_color=(100, 150, 200),
            pattern='solid',
            pattern_color=(50, 75, 100),
            accessory='none',
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
        
        errors = SlimeEntityTemplate.validate_genome(genome)
        assert len(errors) > 0
        assert any("genome.shape is None" in error for error in errors)
    
    def test_validate_genome_empty_string_field(self):
        """Test validate_genome() on genome with empty string returns error."""
        genome = SlimeGenome(
            shape="",  # Empty string instead of None
            size='medium',
            base_color=(100, 150, 200),
            pattern='solid',
            pattern_color=(50, 75, 100),
            accessory='none',
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
        
        errors = SlimeEntityTemplate.validate_genome(genome)
        assert len(errors) > 0
        assert any("genome.shape is empty string" in error for error in errors)
    
    def test_ensure_culture_expression_fills_empty(self):
        """Test that _ensure_culture_expression fills empty culture_expression."""
        genome = SlimeGenome(
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
            cultural_base=CulturalBase.EMBER,
            culture_expression={},  # Empty
            generation=1,
            level=3
        )
        
        SlimeEntityTemplate._ensure_culture_expression(genome)
        
        assert genome.culture_expression is not None
        assert len(genome.culture_expression) > 0
        assert 'ember' in genome.culture_expression
    
    def test_ensure_culture_expression_preserves_existing(self):
        """Test that _ensure_culture_expression preserves existing culture_expression."""
        original_expr = {'ember': 0.7, 'marsh': 0.3}
        genome = SlimeGenome(
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
            cultural_base=CulturalBase.EMBER,
            culture_expression=original_expr.copy(),
            generation=1,
            level=3
        )
        
        SlimeEntityTemplate._ensure_culture_expression(genome)
        
        assert genome.culture_expression == original_expr
    
    def test_build_populates_culture_expression(self):
        """Test that build() populates culture_expression when empty."""
        genome = SlimeGenome(
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
            cultural_base=CulturalBase.EMBER,
            culture_expression={},  # Empty
            generation=1,
            level=3
        )
        
        slime = SlimeEntityTemplate.build(
            genome=genome,
            name="Test Slime"
        )
        
        assert slime.genome.culture_expression is not None
        assert len(slime.genome.culture_expression) > 0
        assert 'ember' in slime.genome.culture_expression
    
    def test_build_with_custom_parameters(self, valid_genome):
        """Test build() with custom parameters."""
        slime = SlimeEntityTemplate.build(
            genome=valid_genome,
            name="Custom Slime",
            slime_id="custom-id",
            team="dungeon",
            level=5,
            generation=3
        )
        
        assert slime.name == "Custom Slime"
        assert slime.slime_id == "custom-id"
        assert slime.team == "dungeon"
        assert slime.level == 5
        assert slime.generation == 3
    
    def test_validate_genome_all_required_fields_present(self, valid_genome):
        """Test validate_genome() passes when all required fields are present."""
        errors = SlimeEntityTemplate.validate_genome(valid_genome)
        assert errors == []
    
    def test_validate_genome_multiple_missing_fields(self):
        """Test validate_genome() returns multiple errors for multiple missing fields."""
        genome = SlimeGenome(
            shape=None,  # Invalid
            size=None,  # Invalid
            base_color=None,  # Invalid
            pattern=None,  # Invalid
            pattern_color=None,  # Invalid
            accessory=None,  # Invalid
            curiosity=0.5,
            energy=0.5,
            affection=0.5,
            shyness=0.5,
            cultural_base=CulturalBase.EMBER,
            culture_expression={'ember': 1.0, 'gale': 0.0, 'marsh': 0.0, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0},
            generation=1,
            level=3
        )
        
        errors = SlimeEntityTemplate.validate_genome(genome)
        assert len(errors) > 5  # Should have multiple errors
        assert any("shape" in error for error in errors)
        assert any("size" in error for error in errors)
        assert any("base_color" in error for error in errors)
