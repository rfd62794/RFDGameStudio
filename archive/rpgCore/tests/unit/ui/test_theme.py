"""
Tests for UITheme design token system
"""

import pytest
from src.shared.ui.theme import UITheme


class TestUITheme:
    """Test UITheme design token system"""
    
    def test_theme_defaults(self):
        """Test that default theme has all required properties"""
        theme = UITheme()
        
        # Typography
        assert theme.font_large == 18
        assert theme.font_medium == 14
        assert theme.font_small == 11
        assert theme.font_tiny == 10
        
        # Base colors
        assert theme.background == (20, 20, 30)
        assert theme.surface == (30, 30, 45)
        assert theme.surface_raised == (40, 40, 58)
        assert theme.border == (60, 60, 80)
        assert theme.border_active == (100, 100, 140)
        
        # Text colors
        assert theme.text_primary == (220, 220, 235)
        assert theme.text_secondary == (160, 160, 180)
        assert theme.text_dim == (100, 100, 120)
        assert theme.text_accent == (255, 215, 0)
        
        # Status colors
        assert theme.success == (80, 180, 80)
        assert theme.warning == (220, 160, 40)
        assert theme.danger == (200, 60, 60)
        assert theme.info == (80, 140, 220)
    
    def test_culture_colors_complete(self):
        """Test that all expected culture colors are defined"""
        theme = UITheme()
        
        expected_cultures = [
            'ember', 'gale', 'marsh', 'crystal', 'tundra', 'tide', 'void'
        ]
        
        for culture in expected_cultures:
            assert culture in theme.culture_colors
            assert isinstance(theme.culture_colors[culture], tuple)
            assert len(theme.culture_colors[culture]) == 3  # RGB tuple
            assert all(0 <= c <= 255 for c in theme.culture_colors[culture])  # Valid RGB values
    
    def test_stage_colors_complete(self):
        """Test that all expected stage colors are defined"""
        theme = UITheme()
        
        expected_stages = [
            'Hatchling', 'Juvenile', 'Young', 'Prime', 'Veteran', 'Elder'
        ]
        
        for stage in expected_stages:
            assert stage in theme.stage_colors
            assert isinstance(theme.stage_colors[stage], tuple)
            assert len(theme.stage_colors[stage]) == 3  # RGB tuple
            assert all(0 <= c <= 255 for c in theme.stage_colors[stage])  # Valid RGB values
    
    def test_tier_colors_complete(self):
        """Test that all expected tier colors are defined"""
        theme = UITheme()
        
        expected_tiers = [1, 2, 3, 4, 5, 6, 7, 8]
        
        for tier in expected_tiers:
            assert tier in theme.tier_colors
            assert isinstance(theme.tier_colors[tier], tuple)
            assert len(theme.tier_colors[tier]) == 3  # RGB tuple
            assert all(0 <= c <= 255 for c in theme.tier_colors[tier])  # Valid RGB values
    
    def test_theme_helper_methods(self):
        """Test that theme helper methods work correctly"""
        theme = UITheme()
        
        # Test culture_color helper
        assert theme.culture_color('ember') == (220, 80, 40)
        assert theme.culture_color('nonexistent') == (150, 150, 150)  # fallback
        assert theme.culture_color('nonexistent', (100, 100, 100)) == (100, 100, 100)  # custom fallback
        
        # Test stage_color helper
        assert theme.stage_color('Prime') == (255, 215, 0)
        assert theme.stage_color('Unknown') == (150, 150, 150)  # fallback
        
        # Test tier_color helper
        assert theme.tier_color(8) == (255, 215, 0)
        assert theme.tier_color(99) == (150, 150, 150)  # fallback
    
    def test_theme_default_instance(self):
        """Test that DEFAULT_THEME is properly set"""
        from src.shared.ui.theme import DEFAULT_THEME
        assert DEFAULT_THEME is not None
        assert isinstance(DEFAULT_THEME, UITheme)
        assert DEFAULT_THEME.font_large == 18  # Check it's a valid theme
    
    def test_theme_customization(self):
        """Test that theme can be customized"""
        custom_theme = UITheme(
            font_large=20,
            background=(10, 10, 20),
            success=(100, 200, 100)
        )
        
        assert custom_theme.font_large == 20
        assert custom_theme.background == (10, 10, 20)
        assert custom_theme.success == (100, 200, 100)
        # Other defaults should remain
        assert custom_theme.font_medium == 14
        assert custom_theme.surface == (30, 30, 45)
