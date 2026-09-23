"""
Base System and Component Classes (Extracted from game_engine.foundation)

Abstract base classes providing lifecycle management (initialize/tick/shutdown),
configuration, performance monitoring, and error handling.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from enum import Enum


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
    priority: int = 0
    update_interval: Optional[float] = None

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
        self.config = config or SystemConfig(name=self.__class__.__name__)
        self.status = SystemStatus.UNINITIALIZED
        self.metrics = PerformanceMetrics()
        self._last_error: Optional[str] = None
        self._initialized = False

        if not self.config.validate():
            raise ValueError(f"Invalid config for {self.__class__.__name__}")

    @abstractmethod
    def initialize(self) -> bool:
        """Initialize the system. Returns True on success."""
        pass

    @abstractmethod
    def tick(self, delta_time: float) -> None:
        """Update the system for the current frame."""
        pass

    @abstractmethod
    def shutdown(self) -> None:
        """Clean shutdown with resource cleanup."""
        pass

    def is_running(self) -> bool:
        return self.status == SystemStatus.RUNNING

    def is_healthy(self) -> bool:
        return (
            self.status in (SystemStatus.RUNNING, SystemStatus.PAUSED)
            and self._last_error is None
        )

    def pause(self) -> None:
        if self.is_running():
            self.status = SystemStatus.PAUSED

    def resume(self) -> None:
        if self.status == SystemStatus.PAUSED:
            self.status = SystemStatus.RUNNING

    def get_last_error(self) -> Optional[str]:
        return self._last_error

    def get_metrics(self) -> PerformanceMetrics:
        return self.metrics

    def _set_error(self, error: str) -> None:
        self._last_error = error
        self.status = SystemStatus.ERROR

    def _record_update_time(self, update_time: float) -> None:
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
    """Lightweight component with initialize/shutdown lifecycle."""

    def __init__(self, name: str):
        self.name = name
        self.enabled = True
        self._initialized = False

    @abstractmethod
    def initialize(self) -> bool:
        pass

    @abstractmethod
    def shutdown(self) -> None:
        pass

    def is_initialized(self) -> bool:
        return self._initialized
