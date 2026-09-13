"""
SystemClock - Precise Timing for Game Engine

Provides deterministic, precise timing for the game engine. Supports:
- Real-time mode (actual elapsed time)
- Deterministic mode (fixed timestep simulation)
- Pausing and time scaling
- Frame counting and statistics
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class TimeMode(Enum):
    """Time progression mode."""
    REAL_TIME = "real_time"      # Time advances based on actual elapsed time
    DETERMINISTIC = "deterministic"  # Fixed timestep for reproducibility
    PAUSED = "paused"             # Time does not advance


@dataclass
class FrameStats:
    """Statistics about frame timing."""
    frame_count: int = 0          # Total frames processed
    total_time: float = 0.0       # Total elapsed time in seconds
    delta_time: float = 0.0       # Time since last frame in seconds
    fps: float = 0.0              # Estimated frames per second
    accumulated_error: float = 0.0  # Accumulated timing error for deterministic mode


class SystemClock:
    """
    Centralized game clock for precise timing.

    Ensures all systems use consistent time values. Supports both real-time and
    deterministic (fixed timestep) simulation modes.

    Example:
        >>> clock = SystemClock(target_fps=60)
        >>> clock.update(0.016)  # 16ms frame
        >>> print(f"Delta time: {clock.delta_time:.3f}s")
        Delta time: 0.017s
    """

    def __init__(
        self,
        target_fps: int = 60,
        mode: TimeMode = TimeMode.REAL_TIME,
        fixed_timestep: Optional[float] = None,
    ):
        """
        Initialize the system clock.

        Args:
            target_fps: Target frames per second (for statistics)
            mode: Time progression mode (real-time or deterministic)
            fixed_timestep: Fixed timestep for deterministic mode (default: 1/target_fps)
        """
        self.target_fps = target_fps
        self.mode = mode
        self.fixed_timestep = fixed_timestep or (1.0 / target_fps)
        self.time_scale = 1.0

        self.stats = FrameStats()
        self._is_running = True

    @property
    def delta_time(self) -> float:
        """Time elapsed since last frame in seconds."""
        return self.stats.delta_time

    @property
    def total_time(self) -> float:
        """Total elapsed time since clock started in seconds."""
        return self.stats.total_time

    @property
    def frame_count(self) -> int:
        """Number of frames processed."""
        return self.stats.frame_count

    @property
    def fps(self) -> float:
        """Estimated frames per second."""
        return self.stats.fps

    def update(self, elapsed_seconds: float) -> None:
        """
        Update the clock with elapsed time.

        In REAL_TIME mode: elapsed_seconds is the actual time since last frame
        In DETERMINISTIC mode: elapsed_seconds is accumulated and split into fixed timesteps
        In PAUSED mode: time does not advance

        Args:
            elapsed_seconds: Time elapsed since last update in seconds
        """
        if self.mode == TimeMode.PAUSED:
            self.stats.delta_time = 0.0
            return

        if self.mode == TimeMode.REAL_TIME:
            # Real-time: use elapsed time directly (with scale applied)
            self.stats.delta_time = elapsed_seconds * self.time_scale
            self.stats.total_time += self.stats.delta_time

        elif self.mode == TimeMode.DETERMINISTIC:
            # Deterministic: accumulate and split into fixed timesteps
            self.stats.accumulated_error += elapsed_seconds * self.time_scale
            # Use fixed timestep (or whatever accumulated time allows)
            if self.stats.accumulated_error >= self.fixed_timestep:
                self.stats.delta_time = self.fixed_timestep
                self.stats.accumulated_error -= self.fixed_timestep
                self.stats.total_time += self.stats.delta_time
            else:
                self.stats.delta_time = 0.0

        # Update statistics
        self.stats.frame_count += 1
        if self.stats.frame_count % 60 == 0:  # Update FPS every 60 frames
            if self.stats.total_time > 0:
                self.stats.fps = self.stats.frame_count / self.stats.total_time

    def set_time_scale(self, scale: float) -> None:
        """
        Set the time scale multiplier (e.g., 0.5 for slow-motion, 2.0 for fast-forward).

        Args:
            scale: Time scale multiplier (0.0 = paused, 1.0 = normal speed, 2.0 = 2x speed)
        """
        self.time_scale = max(0.0, scale)

    def pause(self) -> None:
        """Pause time progression."""
        self.mode = TimeMode.PAUSED

    def resume(self) -> None:
        """Resume time progression."""
        if self.mode == TimeMode.PAUSED:
            self.mode = TimeMode.REAL_TIME

    def reset(self) -> None:
        """Reset the clock to zero."""
        self.stats = FrameStats()

    def get_stats(self) -> FrameStats:
        """Get current frame statistics."""
        return self.stats
