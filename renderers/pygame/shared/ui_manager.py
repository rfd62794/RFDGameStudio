"""
ui_manager.py — Thin wrapper around pygame_gui.UIManager.

Provides init, event processing (with consumed-bool return), update, and draw.
The bool return from handle_event is the event-priority fix: callers check it
first and skip game-input handling for any event the UI consumed.
"""
from __future__ import annotations

from typing import Any

try:
    import pygame_gui
    _PYGAME_GUI_AVAILABLE = True
except ImportError:
    _PYGAME_GUI_AVAILABLE = False


class UIManager:
    """Thin wrapper around pygame_gui.UIManager."""

    def __init__(self, screen_rect: Any) -> None:
        """
        Args:
            screen_rect: pygame.Rect defining screen dimensions.
        """
        if not _PYGAME_GUI_AVAILABLE:
            raise ImportError("pygame_gui is required. Install with: pip install pygame_gui")
        import pygame
        self._screen_rect = screen_rect
        self._manager = pygame_gui.UIManager(screen_rect.size)
        self._initialized = True

    def handle_event(self, event: Any) -> bool:
        """Process a pygame event through the UI system.

        Returns True if pygame_gui consumed the event — caller should
        not also process it as game input.
        """
        if not self._initialized:
            return False
        return self._manager.process_events(event)

    def update(self, dt: float) -> None:
        """Update UI state. dt is seconds since last frame."""
        if not self._initialized:
            return
        self._manager.update(dt)

    def draw_ui(self, surface: Any) -> None:
        """Draw the UI layer onto the given surface."""
        if not self._initialized:
            return
        self._manager.draw_ui(surface)

    @property
    def manager(self) -> Any:
        """Direct access to the underlying pygame_gui.UIManager."""
        return self._manager

    @property
    def initialized(self) -> bool:
        return self._initialized
