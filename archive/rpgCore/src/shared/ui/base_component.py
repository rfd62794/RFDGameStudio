"""
UIComponent Abstract Base Class

Defines the standard interface that all UI components must implement.
This establishes the industry-standard contract for UI components.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional
import pygame


class UIComponent(ABC):
    """
    REQUIRED interface every component must have.
    
    This is the industry standard approach - a base class that defines
    the contract every UI component must fulfill.
    """
    
    def __init__(self, rect: pygame.Rect, theme: Optional['UITheme'] = None, z_order: int = 0):
        """
        rect defines where component renders
        theme controls colors/fonts (see UITheme)
        """
        self.rect = rect
        self.theme = theme
        self.z_order = z_order
        
    @abstractmethod
    def render(self, surface: pygame.Surface, data: Any = None) -> None:
        """
        data is component-specific payload
        surface is where to draw
        Never stores data as instance state — data flows in at render time
        """
        pass
    
    def handle_event(self, event: pygame.event.Event) -> Optional['UIEvent']:
        """
        Returns UIEvent if something happened
        Returns None if event not consumed
        Default implementation returns None
        """
        return None
    
    def tick(self, dt: float) -> None:
        """
        Animation, timers, state transitions
        Default implementation does nothing
        """
        pass
    
    @property
    def bounds(self) -> pygame.Rect:
        """Returns component bounds (alias for rect)"""
        return self.rect
