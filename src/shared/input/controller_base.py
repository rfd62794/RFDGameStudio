"""
Shared Input Controller Base
SRP: Maps raw pygame events to semantic game actions.
Allows multiple input schemes (WASD, Arrows, NumPad) to trigger the same action.
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Set
import pygame

class InputController(ABC):
    """
    Abstract base for demo-specific controllers.
    Maps physical keys to logical actions.
    """
    
    def __init__(self):
        self.keys_pressed: Set[int] = set()
        self.action_map: Dict[int, str] = {}
        self._define_defaults()
        self.define_actions()

    def _define_defaults(self):
        """Standard mappings common across all demos."""
        # Standard WASD / Arrows / NumPad mapping for generic navigation
        # Note: Demos can override these in define_actions().
        defaults = {
            # Up
            pygame.K_w: "up",
            pygame.K_UP: "up",
            pygame.K_KP8: "up",
            # Down
            pygame.K_s: "down",
            pygame.K_DOWN: "down",
            pygame.K_KP2: "down",
            # Left
            pygame.K_a: "left",
            pygame.K_LEFT: "left",
            pygame.K_KP4: "left",
            # Right
            pygame.K_d: "right",
            pygame.K_RIGHT: "right",
            pygame.K_KP6: "right",
            # Confirm / Fire
            pygame.K_SPACE: "fire",
            pygame.K_RETURN: "confirm",
            pygame.K_KP5: "fire",
            pygame.K_KP_ENTER: "confirm",
            pygame.K_KP0: "fire"
        }
        self.action_map.update(defaults)

    @abstractmethod
    def define_actions(self):
        """Subclasses define their specific action bindings here."""
        pass

    def handle_event(self, event: pygame.event.Event) -> List[str]:
        """Update key state and return list of triggered actions for this event."""
        if event.type == pygame.KEYDOWN:
            self.keys_pressed.add(event.key)
            action = self.action_map.get(event.key)
            return [action] if action else []
        elif event.type == pygame.KEYUP:
            self.keys_pressed.discard(event.key)
            return []
        return []

    def get_active_actions(self) -> Set[str]:
        """Return set of all actions currently 'held' based on pressed keys."""
        active = set()
        for key in self.keys_pressed:
            action = self.action_map.get(key)
            if action:
                active.add(action)
        return active

    def is_action_active(self, action: str) -> bool:
        """Check if a specific logical action is currently active."""
        return action in self.get_active_actions()
