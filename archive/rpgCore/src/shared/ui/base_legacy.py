"""
Legacy base component - maintained for backward compatibility.

New components should use UIComponent from base_component.py.
"""

from typing import Any, Optional
import pygame


class UIComponent:
    """Legacy UIComponent for backward compatibility."""
    
    def __init__(self, rect: pygame.Rect, z_order: int = 0):
        self.rect = rect
        self.z_order = z_order

    def render(self, surface: pygame.Surface) -> None:
        """Override in subclasses."""
        pass

    def tick(self, dt_ms: int) -> None:
        """Override in subclasses."""
        pass

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Override in subclasses. Return True if event consumed."""
        return False

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
