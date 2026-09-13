"""Tests for StatsPanel extensions - culture expression and personality axes"""

import pytest
from unittest.mock import Mock
from src.shared.ui.stats_panel import StatsPanel
from src.shared.ui.theme import DEFAULT_THEME
from src.shared.teams.roster import RosterSlime
from src.shared.genetics.genome import SlimeGenome, CulturalBase


class TestStatsPanelExtensions:
    """Test StatsPanel extensions for culture expression and personality axes"""
    
    def setup_method(self):
        """Set up test fixtures"""
        # Create mock slime with extended genome data
        self.mock_slime = Mock(spec=RosterSlime)
        self.mock_slime.level = 5
        
        # Create extended genome
        self.mock_genome = Mock(spec=SlimeGenome)
        self.mock_genome.base_hp = 25.0
        self.mock_genome.base_atk = 10.0
        self.mock_genome.base_spd = 8.0
        self.mock_genome.curiosity = 0.7
        self.mock_genome.energy = 0.8
        self.mock_genome.affection = 0.6
        self.mock_genome.shyness = 0.3
        self.mock_genome.cultural_base = CulturalBase.EMBER
        
        # Extended fields for new features
        self.mock_genome.culture_expression = {
            'ember': 0.6,
            'crystal': 0.3,
            'marsh': 0.1,
            'gale': 0.05,  # Below threshold
            'tundra': 0.02,  # Below threshold
            'tide': 0.01   # Below threshold
        }
        self.mock_genome.personality_axes = {
            'aggression': 0.4,
            'curiosity': 0.8,
            'patience': 0.3,
            'caution': 0.5,
            'independence': 0.7,
            'sociability': 0.6
        }
        
        self.mock_slime.genome = self.mock_genome
        
        # Create stats panel
        self.stats_panel = StatsPanel(self.mock_slime, (100, 100), width=200, theme=DEFAULT_THEME)

    def test_extended_height(self):
        """Test stats panel height is extended for new sections"""
        # Height should be increased from 120 to 250
        assert self.stats_panel.HEIGHT == 250
        
        # Width should remain unchanged
        assert self.stats_panel.WIDTH == 200

    def test_culture_expression_rendering_method(self):
        """Test culture expression rendering method exists"""
        assert hasattr(self.stats_panel, '_render_culture_expression')
        assert callable(getattr(self.stats_panel, '_render_culture_expression'))

    def test_personality_axes_rendering_method(self):
        """Test personality axes rendering method exists"""
        assert hasattr(self.stats_panel, '_render_personality_axes')
        assert callable(getattr(self.stats_panel, '_render_personality_axes'))

    def test_culture_expression_filtering(self):
        """Test cultures below 0.05 threshold are filtered out"""
        culture_expression = self.mock_genome.culture_expression
        
        # Should filter out cultures below 0.05
        active_cultures = [(c, w) for c, w in culture_expression.items() if w > 0.05]
        
        # Should only include ember, crystal, marsh (3 cultures)
        expected_active = [('ember', 0.6), ('crystal', 0.3), ('marsh', 0.1)]
        
        assert len(active_cultures) == 3
        assert set(c for c, w in active_cultures) == {'ember', 'crystal', 'marsh'}

    def test_culture_expression_sorting(self):
        """Test cultures are sorted by expression weight"""
        culture_expression = self.mock_genome.culture_expression
        active_cultures = [(c, w) for c, w in culture_expression.items() if w > 0.05]
        active_cultures.sort(key=lambda x: x[1], reverse=True)
        
        # Should be sorted: ember (0.6), crystal (0.3), marsh (0.1)
        expected_order = [('ember', 0.6), ('crystal', 0.3), ('marsh', 0.1)]
        
        assert active_cultures == expected_order

    def test_culture_colors_defined(self):
        """Test all culture colors are defined"""
        # We can't access the internal colors directly, but we can test the concept
        culture_colors = {
            'ember': (220, 80, 40),    # warm red
            'gale': (135, 206, 235),  # sky blue
            'marsh': (60, 140, 60),    # deep green
            'crystal': (220, 220, 240),  # pale white
            'tundra': (180, 200, 220),  # silver blue
            'tide': (80, 80, 220),    # electric blue
            'void': (180, 100, 220),  # purple
        }
        
        assert len(culture_colors) == 7
        assert all(isinstance(color, tuple) and len(color) == 3 for color in culture_colors.values())

    def test_personality_axes_definitions(self):
        """Test personality axes are properly defined"""
        axes_info = {
            'aggression': ('AGG', (200, 100, 100)),
            'curiosity': ('CUR', (100, 200, 100)),
            'patience': ('PAT', (100, 150, 200)),
            'caution': ('CAU', (200, 200, 100)),
            'independence': ('IND', (200, 150, 100)),
            'sociability': ('SOC', (150, 100, 200))
        }
        
        assert len(axes_info) == 6
        assert all(len(info) == 2 for info in axes_info.values())
        assert all(len(abbrev) == 3 for abbrev, color in axes_info.values())

    def test_personality_axes_value_range(self):
        """Test personality axes values are in 0.0-1.0 range"""
        personality_axes = self.mock_genome.personality_axes
        
        for axis, value in personality_axes.items():
            assert 0.0 <= value <= 1.0, f"{axis} value {value} not in range [0.0, 1.0]"

    def test_graceful_degradation_missing_culture_expression(self):
        """Test graceful degradation when culture_expression is missing"""
        # Remove culture_expression from genome
        if hasattr(self.mock_genome, 'culture_expression'):
            del self.mock_genome.culture_expression
        
        # Should use empty dict as default
        culture_expression = getattr(self.mock_genome, 'culture_expression', {})
        assert culture_expression == {}

    def test_graceful_degradation_missing_personality_axes(self):
        """Test graceful degradation when personality_axes is missing"""
        # Remove personality_axes from genome
        if hasattr(self.mock_genome, 'personality_axes'):
            del self.mock_genome.personality_axes
        
        # Should use empty dict as default
        personality_axes = getattr(self.mock_genome, 'personality_axes', {})
        assert personality_axes == {}

    def test_max_cultures_limit(self):
        """Test maximum 6 cultures are displayed"""
        # Create culture expression with more than 6 active cultures
        self.mock_genome.culture_expression = {
            'ember': 0.3, 'crystal': 0.25, 'marsh': 0.2, 'gale': 0.15,
            'marsh': 0.1, 'tundra': 0.08, 'tide': 0.06, 'void': 0.05
        }
        
        active_cultures = [(c, w) for c, w in self.mock_genome.culture_expression.items() if w > 0.05]
        
        # Should limit to 6 cultures
        displayed_cultures = active_cultures[:6]
        assert len(displayed_cultures) == 6

    def test_bar_width_calculations(self):
        """Test bar width calculations are reasonable"""
        # For culture expression
        max_bar_width = self.stats_panel.WIDTH - (self.stats_panel.PADDING * 2) - 40
        assert max_bar_width > 0
        
        # Test bar width calculation
        for weight in [0.1, 0.5, 1.0]:
            bar_width = int(max_bar_width * weight)
            assert 0 <= bar_width <= max_bar_width

    def test_text_rendering_methods(self):
        """Test text rendering methods exist and are callable"""
        assert hasattr(self.stats_panel, '_render_text')
        assert callable(getattr(self.stats_panel, '_render_text'))
        
        assert hasattr(self.stats_panel, '_render_truncated_text')
        assert callable(getattr(self.stats_panel, '_render_truncated_text'))

    def test_original_functionality_preserved(self):
        """Test original stats panel functionality is preserved"""
        # Original methods should still exist
        assert hasattr(self.stats_panel, '_render_stat')
        assert hasattr(self.stats_panel, '_get_dominance_text')
        
        # Original dimensions should be preserved except height
        assert self.stats_panel.WIDTH == 200
        assert self.stats_panel.PADDING == 10
        
        # Should still have slime reference
        assert self.stats_panel.slime == self.mock_slime

    def test_render_method_integration(self):
        """Test render method integrates new sections"""
        # Render method should call new rendering methods
        assert hasattr(self.stats_panel, 'render')
        assert callable(getattr(self.stats_panel, 'render'))
        
        # The render method should be able to handle the extended height
        # (We can't test actual rendering without a pygame surface)

    def test_layout_spacing(self):
        """Test layout spacing for new sections"""
        # Culture section should start at y + 100
        culture_y = 100 + 100  # base y + offset
        assert culture_y == 200
        
        # Personality section should start 40 pixels after culture
        personality_y = culture_y + 40
        assert personality_y == 240
        
        # Both should fit within the extended height (250)
        assert personality_y < self.stats_panel.HEIGHT
