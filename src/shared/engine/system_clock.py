"""
SystemClock — Precise Timing for Game Engine (Extracted from game_engine.core)

Provides deterministic, precise timing with support for:
- Real-time mode (actual elapsed time)
- Deterministic mode (fixed timestep simulation)
- Pausing and time scaling
- Frame counting and statistics
"""

from dataclasses import dataclass
from typing import Optional
from enum import Enum


class TimeMode(Enum):
    """Time progression mode."""
    REAL_TIME = "real_time"
    DETERMINISTIC = "deterministic"
    PAUSED = "paused"


@dataclass
class FrameStats:
    """Statistics about frame timing."""
    frame_count: int = 0
    total_time: float = 0.0
    delta_time: float = 0.0
    fps: float = 0.0
    accumulated_error: float = 0.0


class SystemClock:
    """
    Centralized game clock for precise timing.

    Ensures all systems use consistent time values. Supports both real-time and
    deterministic (fixed timestep) simulation modes.

    Example:
        >>> clock = SystemClock(target_fps=60)
        >>> clock.update(0.016)
        >>> print(f"Delta time: {clock.delta_time:.3f}s")
        Delta time: 0.016s
    """

    def __init__(
        self,
        target_fps: int = 60,
        mode: TimeMode = TimeMode.REAL_TIME,
        fixed_timestep: Optional[float] = None,
    ):
        self.target_fps = target_fps
        self.mode = mode
        self.fixed_timestep = fixed_timestep or (1.0 / target_fps)
        self.time_scale = 1.0
        self.stats = FrameStats()
        self._is_running = True

    @property
    def delta_time(self) -> float:
        return self.stats.delta_time

    @property
    def total_time(self) -> float:
        return self.stats.total_time

    @property
    def frame_count(self) -> int:
        return self.stats.frame_count

    @property
    def fps(self) -> float:
        return self.stats.fps

    def update(self, elapsed_seconds: float) -> None:
        """Update the clock with elapsed time."""
        if self.mode == TimeMode.PAUSED:
            self.stats.delta_time = 0.0
            return

        if self.mode == TimeMode.REAL_TIME:
            self.stats.delta_time = elapsed_seconds * self.time_scale
            self.stats.total_time += self.stats.delta_time
        elif self.mode == TimeMode.DETERMINISTIC:
            self.stats.accumulated_error += elapsed_seconds * self.time_scale
            if self.stats.accumulated_error >= self.fixed_timestep:
                self.stats.delta_time = self.fixed_timestep
                self.stats.accumulated_error -= self.fixed_timestep
                self.stats.total_time += self.stats.delta_time
            else:
                self.stats.delta_time = 0.0

        self.stats.frame_count += 1
        if self.stats.frame_count % 60 == 0 and self.stats.total_time > 0:
            self.stats.fps = self.stats.frame_count / self.stats.total_time

    def set_time_scale(self, scale: float) -> None:
        self.time_scale = max(0.0, scale)

    def pause(self) -> None:
        self.mode = TimeMode.PAUSED

    def resume(self) -> None:
        if self.mode == TimeMode.PAUSED:
            self.mode = TimeMode.REAL_TIME

    def reset(self) -> None:
        self.stats = FrameStats()

    def get_stats(self) -> FrameStats:
        return self.stats
