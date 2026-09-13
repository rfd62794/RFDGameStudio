"""
UITheme - Design Token System

Canonical color and style definitions for all UI components.
This is the key piece that makes colors a single source of truth.
"""

from dataclasses import dataclass, field
from typing import Dict, Tuple, Optional


@dataclass
class UITheme:
    """Design token system with canonical colors and styling."""
    
    # Typography
    font_large: int = 18
    font_medium: int = 14
    font_small: int = 11
    font_tiny: int = 10
    
    # Base surfaces
    background: tuple = (20, 20, 30)
    surface: tuple = (30, 30, 45)
    surface_raised: tuple = (40, 40, 58)
    border: tuple = (60, 60, 80)
    border_active: tuple = (100, 100, 140)
    
    # Text colors  
    text_primary: tuple = (220, 220, 235)
    text_secondary: tuple = (160, 160, 180)
    text_dim: tuple = (100, 100, 120)
    text_accent: tuple = (255, 215, 0)
    
    # Status colors
    success: tuple = (80, 180, 80)
    warning: tuple = (220, 160, 40)
    danger: tuple = (200, 60, 60)
    info: tuple = (80, 140, 220)
    
    # Canonical culture colors
    culture_colors: Dict[str, tuple] = field(
        default_factory=lambda: {
            'ember':   (220, 80,  40),
            'gale':    (135, 206, 235),
            'marsh':   (60, 140, 60),
            'crystal': (220, 220, 240),
            'tundra':  (180, 200, 220),
            'tide':    (80, 80, 220),
            'void':    (180, 100, 220),
        }
    )
    
    # Canonical stage colors
    stage_colors: Dict[str, tuple] = field(
        default_factory=lambda: {
            'Hatchling': (255, 182, 193),
            'Juvenile':  (173, 216, 230),
            'Young':     (144, 238, 144),
            'Prime':     (255, 215, 0),
            'Veteran':   (100, 149, 237),
            'Elder':     (147, 112, 219),
        }
    )
    
    # Canonical tier colors
    tier_colors: Dict[int, tuple] = field(
        default_factory=lambda: {
            1: (200, 200, 200),
            2: (0, 255, 0),
            3: (0, 255, 255),
            4: (255, 255, 0),
            5: (255, 0, 255),
            6: (255, 215, 0),
            7: (255, 140, 0),
            8: (255, 215, 0),
        }
    )
    
    # Canonical team colors
    team_colors: Dict[str, tuple] = field(
        default_factory=lambda: {
            'dungeon': (180, 60, 60),   # dark red
            'racing':  (60, 140, 220),  # race blue
            'garden': (80, 160, 80),   # soft green (unassigned)
            'conquest': (140, 60, 140), # purple
        }
    )
    
    def culture_color(self, culture: str, fallback: tuple = (150, 150, 150)) -> tuple:
        """Get culture color with fallback."""
        key = culture.lower()
        return self.culture_colors.get(key, fallback)
    
    def stage_color(self, stage: str, fallback: tuple = (150, 150, 150)) -> tuple:
        """Get stage color with fallback."""
        return self.stage_colors.get(stage, fallback)
    
    def tier_color(self, tier: int, fallback: tuple = (150, 150, 150)) -> tuple:
        """Get tier color with fallback."""
        return self.tier_colors.get(tier, fallback)
    
    def team_color(self, team: str, fallback: tuple = (150, 150, 150)) -> tuple:
        """Get team color with fallback."""
        return self.team_colors.get(team.lower(), fallback)


# Module-level default instance
DEFAULT_THEME = UITheme()
