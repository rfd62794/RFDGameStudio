"""
Base System and Component Classes

Abstract base classes that all systems and components inherit from.
Provides lifecycle management, configuration, performance monitoring, and error handling.

These are the foundational building blocks that all higher layers depend on.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from enum import Enum
import time


class SystemStatus(Enum):
    """Lifecycle status of a system."""
    UNINITIALIZED = "uninitialized"
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class SystemConfig:
    """Base configuration for all systems."""
    name: str
    enabled: bool = True
    debug_mode: bool = False
    performance_monitoring: bool = False
    priority: int = 0  # Higher = runs first
    update_interval: Optional[float] = None  # None = run every frame

    def validate(self) -> bool:
        """Validate configuration."""
        return bool(self.name)


@dataclass
class PerformanceMetrics:
    """Performance statistics for a system."""
    last_update_time: float = 0.0
    total_update_time: float = 0.0
    update_count: int = 0
    average_update_time: float = 0.0
    peak_update_time: float = 0.0
    error_count: int = 0


class BaseSystem(ABC):
    """
    Abstract base class for all game systems.

    Provides lifecycle management, configuration, performance monitoring,
    and error handling. All systems should inherit from this class.

    Example:
        >>> class MySystem(BaseSystem):
        ...     def initialize(self) -> bool:
        ...         return True
        ...     def tick(self, delta_time: float) -> None:
        ...         pass
        ...     def shutdown(self) -> None:
        ...         pass
    """

    def __init__(self, config: Optional[SystemConfig] = None):
        """
        Initialize the base system.

        Args:
            config: System configuration object
        """
        self.config = config or SystemConfig(name=self.__class__.__name__)
        self.status = SystemStatus.UNINITIALIZED
        self.metrics = PerformanceMetrics()
        self._last_error: Optional[str] = None
        self._initialized = False

        if not self.config.validate():
            raise ValueError(f"Invalid config for {self.__class__.__name__}")

    @abstractmethod
    def initialize(self) -> bool:
        """
        Initialize the system with all required dependencies.

        Returns:
            True if initialization successful, False otherwise
        """
        pass

    @abstractmethod
    def tick(self, delta_time: float) -> None:
        """
        Update the system for the current frame.

        Args:
            delta_time: Time elapsed since last frame in seconds
        """
        pass

    @abstractmethod
    def shutdown(self) -> None:
        """Clean shutdown with resource cleanup."""
        pass

    def is_running(self) -> bool:
        """Check if system is currently running."""
        return self.status == SystemStatus.RUNNING

    def is_healthy(self) -> bool:
        """Check if system is in healthy state."""
        return (
            self.status in (SystemStatus.RUNNING, SystemStatus.PAUSED)
            and self._last_error is None
        )

    def pause(self) -> None:
        """Pause the system."""
        if self.is_running():
            self.status = SystemStatus.PAUSED

    def resume(self) -> None:
        """Resume a paused system."""
        if self.status == SystemStatus.PAUSED:
            self.status = SystemStatus.RUNNING

    def get_last_error(self) -> Optional[str]:
        """Get the last error message."""
        return self._last_error

    def get_metrics(self) -> PerformanceMetrics:
        """Get performance metrics."""
        return self.metrics

    def _set_error(self, error: str) -> None:
        """Set last error and update status."""
        self._last_error = error
        self.status = SystemStatus.ERROR

    def _record_update_time(self, update_time: float) -> None:
        """Record time for system update."""
        if self.config.performance_monitoring:
            self.metrics.last_update_time = update_time
            self.metrics.total_update_time += update_time
            self.metrics.update_count += 1
            if self.metrics.update_count > 0:
                self.metrics.average_update_time = (
                    self.metrics.total_update_time / self.metrics.update_count
                )
            if update_time > self.metrics.peak_update_time:
                self.metrics.peak_update_time = update_time


class BaseComponent(ABC):
    """
    Abstract base class for smaller components.

    Components are lighter-weight than systems and typically handle
    single responsibilities. Similar lifecycle to systems but simpler.
    """

    def __init__(self, name: str):
        """
        Initialize the component.

        Args:
            name: Component name
        """
        self.name = name
        self.enabled = True
        self._initialized = False

    @abstractmethod
    def initialize(self) -> bool:
        """Initialize the component."""
        pass

    @abstractmethod
    def shutdown(self) -> None:
        """Clean shutdown."""
        pass

    def is_initialized(self) -> bool:
        """Check if component is initialized."""
        return self._initialized
