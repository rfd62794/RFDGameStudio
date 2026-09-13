from abc import ABC
import pygame
from typing import List
from src.shared.ui.base import UIComponent

class SceneBase(ABC):
    """Base class for distinct game screens managing a UI component tree."""
    
    def __init__(self, surface: pygame.Surface):
        self.surface = surface
        self.components: List[UIComponent] = []

    def on_enter(self, **kwargs) -> None:
        """Called when scene becomes active."""
        pass

    def on_exit(self) -> None:
        """Called when scene is unloaded."""
        pass

    def add_component(self, component: UIComponent) -> None:
        """Add component and maintain z-order sorting."""
        if component not in self.components:
            self.components.append(component)
            self._sort_components()

    def remove_component(self, component: UIComponent) -> None:
        """Remove component from scene."""
        if component in self.components:
            self.components.remove(component)

    def _sort_components(self) -> None:
        self.components.sort(key=lambda c: c.z_order)

    def handle_event(self, event: pygame.event.Event) -> bool:
        """
        Route events to components. Returns True if event consumed.
        Iterates in reverse z-order (top components consume first).
        """
        for component in reversed(self.components):
            if hasattr(component, 'handle_event') and callable(getattr(component, 'handle_event')):
                if component.handle_event(event):
                    return True
        return False

    def tick(self, dt_ms: int) -> None:
        """Update all visible components."""
        for component in self.components:
            if component.visible:
                component.tick(dt_ms)

    def render(self) -> None:
        """Render all visible components to surface."""
        for component in self.components:
            if component.visible:
                component.render(self.surface)
