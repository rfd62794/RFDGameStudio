"""
UIComponent - Standard interface for all UI components

Provides the contract that all UI components must follow.
Maintains backward compatibility while enforcing the new standard.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional
import pygame


class UIComponent(ABC):
    """
    Standard interface that all UI components must follow.
    
    Maintains backward compatibility while enforcing the new contract.
    """
    
    def __init__(self, rect: pygame.Rect, theme: Optional['UITheme'] = None, z_order: int = 0):
        """
        rect defines where component renders
        theme controls colors/fonts (defaults to DEFAULT_THEME)
        """
        self._rect = rect
        self.theme = theme
        self.z_order = z_order
        
        # Legacy compatibility - ensure these attributes exist
        self.visible = True
        
        # Try to import DEFAULT_THEME, fallback to None if not available
        try:
            from .theme import DEFAULT_THEME
            if self.theme is None:
                self.theme = DEFAULT_THEME
        except ImportError:
            # Theme system not available yet
            pass

    @abstractmethod
    def render(self, surface: pygame.Surface, data: Any = None) -> None:
        """
        data is component-specific payload
        surface is where to draw
        Never stores data as instance state — data flows in at render time
        """
        pass

    @abstractmethod
    def handle_event(self, event: pygame.event.Event) -> Optional['UIEvent']:
        """
        Returns UIEvent if something happened
        Returns None if event not consumed
        """
        pass

    def tick(self, dt: float) -> None:
        """
        Animation, timers, state transitions
        Default implementation does nothing
        """
        pass  # default: no animation

    @property
    def rect(self) -> pygame.Rect:
        """Returns component bounds"""
        return self._rect

    @rect.setter
    def rect(self, value: pygame.Rect):
        """Set component bounds"""
        self._rect = value

    # Legacy compatibility methods - preserve existing behavior
    def contains_point(self, x: int, y: int) -> bool:
        """Check if a point is within the component's rect."""
        return self.rect.collidepoint(x, y)

    def set_visible(self, v: bool) -> None:
        """Set component visibility."""
        self.visible = v

    def add_to(self, container: list):
        """Helper to add this component to a list and return self."""
        if self not in container:
            container.append(self)
        return self
