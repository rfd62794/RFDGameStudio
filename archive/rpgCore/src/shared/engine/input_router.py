"""
InputRouter - Priority-based event routing system for scenes
"""

from typing import Protocol, List, Tuple
import pygame


class InputHandler(Protocol):
    """Protocol for input handlers"""
    def handle_event(self, event: pygame.event.Event) -> bool:
        """
        Handle a pygame event.
        Returns True if the event was consumed, False otherwise.
        """
        ...


class InputRouter:
    """
    Ordered list of handlers. Routes events through handlers in priority order,
    stops at first consumer.
    
    Standard priorities:
        OVERLAY/MODAL: 100
        UI_COMPONENTS: 50
        ENTITY_SELECTION: 25
        SCENE_DEFAULT: 0
    """
    
    def __init__(self):
        self._handlers: List[Tuple[int, InputHandler]] = []
        # (priority, handler) — higher priority first
    
    def register(self, handler: InputHandler, priority: int = 0) -> None:
        """Register a handler with priority (higher priority = first chance)"""
        self._handlers.append((priority, handler))
        # Sort by priority descending (higher priority first)
        self._handlers.sort(key=lambda x: x[0], reverse=True)
    
    def unregister(self, handler: InputHandler) -> None:
        """Unregister a handler"""
        self._handlers = [
            (p, h) for p, h in self._handlers
            if h is not handler
        ]
    
    def route(self, event: pygame.event.Event) -> bool:
        """
        Route an event through handlers in priority order.
        Returns True if any handler consumed the event.
        """
        for priority, handler in self._handlers:
            try:
                if handler.handle_event(event):
                    return True
            except Exception as e:
                # Log error but continue routing
                print(f"Input handler error (priority {priority}): {e}")
        return False
    
    def clear(self) -> None:
        """Remove all handlers"""
        self._handlers.clear()
    
    def get_handler_count(self) -> int:
        """Get number of registered handlers (for debugging)"""
        return len(self._handlers)
    
    def get_handlers_by_priority(self, priority: int) -> List[InputHandler]:
        """Get all handlers with specific priority (for debugging)"""
        return [handler for p, handler in self._handlers if p == priority]


# Common handler priorities
class InputPriority:
    """Standard input handler priorities"""
    OVERLAY = 100
    MODAL = 100
    UI_COMPONENTS = 50
    ENTITY_SELECTION = 25
    SCENE_DEFAULT = 0
    DEBUG = -10
