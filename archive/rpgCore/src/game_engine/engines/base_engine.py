"""
Base Engine Class

All tier 2 engines inherit from this base class to provide consistent
lifecycle management and integration with the game engine framework.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus


class BaseEngine(BaseSystem, ABC):
    """
    Abstract base class for all major game engines.

    Extends BaseSystem with additional features specific to orchestration engines:
    - Initialization with dependencies
    - State management
    - Event processing
    - Integration with game loop
    """

    def __init__(self, config: Optional[SystemConfig] = None):
        """
        Initialize the engine.

        Args:
            config: Engine configuration
        """
        super().__init__(config or SystemConfig(name=self.__class__.__name__))
        self._state: Dict[str, Any] = {}
        self._dependencies: Dict[str, Any] = {}

    def set_dependency(self, name: str, obj: Any) -> None:
        """
        Set a dependency for this engine.

        Args:
            name: Dependency name
            obj: Dependency object
        """
        self._dependencies[name] = obj

    def get_dependency(self, name: str) -> Optional[Any]:
        """
        Get a dependency.

        Args:
            name: Dependency name

        Returns:
            Dependency object or None if not found
        """
        return self._dependencies.get(name)

    def has_dependency(self, name: str) -> bool:
        """Check if a dependency is set."""
        return name in self._dependencies

    def get_state(self) -> Dict[str, Any]:
        """Get the current engine state."""
        return self._state.copy()

    def set_state(self, key: str, value: Any) -> None:
        """Set engine state value."""
        self._state[key] = value

    @abstractmethod
    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process an intent and return the result.

        Args:
            intent: Intent dictionary with action and parameters

        Returns:
            Result dictionary with outcome
        """
        pass
