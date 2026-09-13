"""
System Clock - Foundation Tier Time Management
Provides steady 60Hz timing without CPU pegging for Miyoo Mini battery optimization
"""

import time
import threading
from typing import Optional, Callable
from dataclasses import dataclass
from loguru import logger

from dgt_engine.foundation.types import Result


@dataclass
class ClockMetrics:
    """Performance metrics for the system clock"""
    target_fps: float
    actual_fps: float
    frame_time_ms: float
    cpu_usage_percent: float
    frames_dropped: int
    total_frames: int


class SystemClock:
    """High-precision system clock for consistent 60Hz timing"""
    
    def __init__(self, target_fps: float = 60.0, max_cpu_usage: float = 80.0):
        self.target_fps = target_fps
        self.target_frame_time = 1.0 / target_fps
        self.max_cpu_usage = max_cpu_usage
        
        # Timing state
        self.last_frame_time = 0.0
        self.frame_start_time = 0.0
        self.is_running = False
        self.clock_thread: Optional[threading.Thread] = None
        
        # Performance tracking
        self.metrics = ClockMetrics(
            target_fps=target_fps,
            actual_fps=0.0,
            frame_time_ms=0.0,
            cpu_usage_percent=0.0,
            frames_dropped=0,
            total_frames=0
        )
        
        # Frame timing history for FPS calculation
        self.frame_times = []
        self.max_frame_history = 60  # Keep 1 second of history
        
        # Callback for frame updates
        self.frame_callback: Optional[Callable[[], None]] = None
        
        logger.info(f"🕐 SystemClock initialized: {target_fps} FPS target, max CPU: {max_cpu_usage}%")
    
    def set_frame_callback(self, callback: Callable[[], None]) -> Result[bool]:
        """Set the callback function for each frame"""
        try:
            if not callable(callback):
                return Result(success=False, error="Callback must be callable")
            
            self.frame_callback = callback
            logger.info("🕐 Frame callback set")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to set frame callback: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def start(self) -> Result[bool]:
        """Start the system clock"""
        try:
            if self.is_running:
                return Result(success=False, error="Clock already running")
            
            if not self.frame_callback:
                return Result(success=False, error="No frame callback set")
            
            self.is_running = True
            self.last_frame_time = time.perf_counter()
            self.frame_start_time = self.last_frame_time
            
            # Start clock thread
            self.clock_thread = threading.Thread(target=self._clock_loop, daemon=True)
            self.clock_thread.start()
            
            logger.info(f"🕐 SystemClock started at {self.target_fps} FPS")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to start clock: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def stop(self) -> Result[bool]:
        """Stop the system clock"""
        try:
            if not self.is_running:
                return Result(success=False, error="Clock not running")
            
            self.is_running = False
            
            if self.clock_thread and self.clock_thread.is_alive():
                self.clock_thread.join(timeout=1.0)
            
            logger.info("🕐 SystemClock stopped")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to stop clock: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def _clock_loop(self) -> None:
        """Main clock loop running in separate thread"""
        logger.debug("🕐 Clock loop started")
        
        while self.is_running:
            current_time = time.perf_counter()
            
            # Calculate frame timing
            elapsed = current_time - self.last_frame_time
            
            # Check if we need to process this frame
            if elapsed >= self.target_frame_time:
                self._process_frame(current_time, elapsed)
                self.last_frame_time = current_time
            else:
                # Sleep for the remaining time to avoid CPU pegging
                sleep_time = self.target_frame_time - elapsed
                if sleep_time > 0.001:  # Only sleep if more than 1ms
                    time.sleep(sleep_time)
    
    def _process_frame(self, current_time: float, elapsed: float) -> None:
        """Process a single frame"""
        frame_start = current_time
        
        # Call the frame callback
        try:
            if self.frame_callback:
                self.frame_callback()
        except Exception as e:
            logger.error(f"⚠️ Frame callback error: {e}")
        
        # Update metrics
        self._update_metrics(frame_start, time.perf_counter(), elapsed)
    
    def _update_metrics(self, frame_start: float, frame_end: float, elapsed: float) -> None:
        """Update performance metrics"""
        frame_execution_time = frame_end - frame_start
        frame_execution_ms = frame_execution_time * 1000
        
        # Update frame time history (use elapsed time between frames for FPS)
        self.frame_times.append(elapsed)
        if len(self.frame_times) > self.max_frame_history:
            self.frame_times.pop(0)
        
        # Calculate actual FPS
        if len(self.frame_times) >= 2:
            total_time = sum(self.frame_times)
            self.metrics.actual_fps = len(self.frame_times) / total_time
        else:
            self.metrics.actual_fps = self.target_fps
        
        # Update other metrics
        self.metrics.frame_time_ms = frame_execution_ms
        self.metrics.total_frames += 1
        
        # Estimate CPU usage (simplified)
        target_time_ms = self.target_frame_time * 1000
        if frame_execution_ms > target_time_ms:
            self.metrics.cpu_usage_percent = (frame_execution_ms / target_time_ms) * 100
        else:
            self.metrics.cpu_usage_percent = (frame_execution_ms / target_time_ms) * 100
        
        # Check for dropped frames
        if frame_execution_ms > target_time_ms * 1.5:  # 50% over target
            self.metrics.frames_dropped += 1
        
        # Log warnings if CPU usage is too high
        if self.metrics.cpu_usage_percent > self.max_cpu_usage:
            if self.metrics.total_frames % 60 == 0:  # Log every second
                logger.warning(f"⚠️ High CPU usage: {self.metrics.cpu_usage_percent:.1f}%")
    
    def get_metrics(self) -> ClockMetrics:
        """Get current performance metrics"""
        return self.metrics
    
    def is_healthy(self) -> bool:
        """Check if the clock is running within acceptable parameters"""
        if not self.is_running:
            return False
        
        # Check FPS is within acceptable range
        fps_tolerance = self.target_fps * 0.1  # 10% tolerance
        if abs(self.metrics.actual_fps - self.target_fps) > fps_tolerance:
            return False
        
        # Check CPU usage
        if self.metrics.cpu_usage_percent > self.max_cpu_usage:
            return False
        
        # Check frame drop rate
        if self.metrics.total_frames > 0:
            drop_rate = self.metrics.frames_dropped / self.metrics.total_frames
            if drop_rate > 0.05:  # More than 5% dropped frames
                return False
        
        return True
    
    def adjust_for_battery(self, battery_level: float) -> Result[bool]:
        """Adjust target FPS based on battery level for Miyoo Mini optimization"""
        try:
            if battery_level < 0.2:  # Below 20%
                new_fps = 30.0  # Drop to 30 FPS
            elif battery_level < 0.5:  # Below 50%
                new_fps = 45.0  # Drop to 45 FPS
            else:
                new_fps = 60.0  # Full 60 FPS
            
            if new_fps != self.target_fps:
                old_fps = self.target_fps
                self.target_fps = new_fps
                self.target_frame_time = 1.0 / new_fps
                self.metrics.target_fps = new_fps
                
                logger.info(f"🔋 Battery optimization: {old_fps} FPS → {new_fps} FPS (battery: {battery_level*100:.0f}%)")
            
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to adjust for battery: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def force_frame(self) -> Result[bool]:
        """Force a frame update (useful for immediate updates)"""
        try:
            if not self.frame_callback:
                return Result(success=False, error="No frame callback set")
            
            current_time = time.perf_counter()
            self._process_frame(current_time, self.target_frame_time)
            
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to force frame: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def record_frame(self, frame_start: float, frame_end: float) -> None:
        """Record frame metrics from an external loop"""
        elapsed = frame_end - self.last_frame_time if self.last_frame_time > 0 else self.target_frame_time
        self._update_metrics(frame_start, frame_end, elapsed)
        self.last_frame_time = frame_start
        
    def get_sleep_time(self, frame_start: float) -> float:
        """Calculate sleep time needed to maintain target FPS"""
        current_time = time.perf_counter()
        elapsed = current_time - frame_start
        sleep_time = self.target_frame_time - elapsed
        return max(0.0, sleep_time)


# Global system clock instance
_global_clock: Optional[SystemClock] = None


def get_system_clock() -> SystemClock:
    """Get the global system clock instance"""
    global _global_clock
    if _global_clock is None:
        _global_clock = SystemClock()
    return _global_clock


def create_system_clock(target_fps: float = 60.0, max_cpu_usage: float = 80.0) -> SystemClock:
    """Create a new system clock instance"""
    return SystemClock(target_fps, max_cpu_usage)
