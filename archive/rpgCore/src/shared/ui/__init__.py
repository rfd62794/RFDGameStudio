"""
UI Component System

Canonical imports for all UI components and utilities.
Use these imports for clean access to the UI system:

from shared.ui import ProfileCard, UITheme, UIEvent
"""

# Core system exports
from .theme import UITheme, DEFAULT_THEME
from .ui_event import UIEvent
from .base import UIComponent

# Component exports
from .profile_card import ProfileCard
from .stats_panel import StatsPanel
from .button import Button
from .label import Label
from .panel import Panel
from .progress_bar import ProgressBar
from .scroll_list import ScrollList
from .text_window import TextWindow

# Legacy compatibility
from .card import Card
from .card_layout import CardLayout
from .scene_base import SceneBase

__all__ = [
    # Core system
    'UITheme',
    'DEFAULT_THEME', 
    'UIEvent',
    'UIComponent',
    
    # Components
    'ProfileCard',
    'StatsPanel', 
    'Button',
    'Label',
    'Panel',
    'ProgressBar',
    'ScrollList',
    'TextWindow',
    
    # Legacy
    'Card',
    'CardLayout',
    'SceneBase',
]
