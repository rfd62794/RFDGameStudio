"""
Performance Metrics Collection for DGT System

Provides real-time performance monitoring for the 60 FPS heartbeat loop
and pillar execution times. Uses dataclasses for type safety and
structured logging for observability.
"""

import time
import threading
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any
from collections import deque
from pathlib import Path
import json

from loguru import logger


@dataclass
class FrameMetrics:
    """Metrics for a single frame"""
    timestamp: float
    frame_time: float
    fps: float
    pillar_times: Dict[str, float]
    total_time: float


@dataclass
class PerformanceStats:
    """Aggregated performance statistics"""
    avg_fps: float
    min_fps: float
    max_fps: float
    avg_frame_time: float
    frame_time_variance: float
    pillar_averages: Dict[str, float]
    pillar_max_times: Dict[str, float]
    total_frames: int
    uptime_seconds: float


@dataclass
class PerformanceAlert:
    """Performance alert notification"""
    timestamp: float
    alert_type: str
    message: str
    severity: str  # "warning", "critical"
    metrics: Dict[str, Any]


class PerformanceMonitor:
    """Real-time performance monitoring for DGT System"""
    
    def __init__(self, 
                 target_fps: int = 60,
                 history_size: int = 300,  # 5 seconds at 60 FPS
                 alert_threshold_fps: float = 30.0,
                 critical_threshold_fps: float = 15.0) -> None:
        self.target_fps = target_fps
        self.history_size = history_size
        self.alert_threshold_fps = alert_threshold_fps
        self.critical_threshold_fps = critical_threshold_fps
        
        # Frame history (circular buffer)
        self.frame_history: deque[FrameMetrics] = deque(maxlen=history_size)
        
        # Alert system
        self.alerts: deque[PerformanceAlert] = deque(maxlen=100)
        self.alert_callbacks: List[Callable[[PerformanceAlert], None]] = []
        
        # Timing state
        self.start_time = time.time()
        self.last_frame_time = self.start_time
        self.frame_count = 0
        
        # Thread safety
        self._lock = threading.RLock()
        
        # Pillar timing
        self._pillar_start_times: Dict[str, float] = {}
        
        logger.info(f"📊 Performance Monitor initialized - Target: {target_fps} FPS")
    
    def start_frame(self) -> None:
        """Mark the beginning of a new frame"""
        with self._lock:
            self.last_frame_time = time.time()
            self.frame_count += 1
    
    def start_pillar(self, pillar_name: str) -> None:
        """Start timing a pillar execution"""
        with self._lock:
            self._pillar_start_times[pillar_name] = time.time()
    
    def end_pillar(self, pillar_name: str) -> None:
        """End timing a pillar execution"""
        with self._lock:
            if pillar_name in self._pillar_start_times:
                pillar_time = time.time() - self._pillar_start_times[pillar_name]
                # Store in temporary dict for this frame
                if not hasattr(self, '_current_pillar_times'):
                    self._current_pillar_times = {}
                self._current_pillar_times[pillar_name] = pillar_time
                del self._pillar_start_times[pillar_name]
    
    def end_frame(self) -> None:
        """Mark the end of current frame and record metrics"""
        with self._lock:
            current_time = time.time()
            frame_time = current_time - self.last_frame_time
            fps = 1.0 / frame_time if frame_time > 0 else self.target_fps
            
            # Get pillar times for this frame
            pillar_times = getattr(self, '_current_pillar_times', {})
            total_time = sum(pillar_times.values())
            
            # Create frame metrics
            metrics = FrameMetrics(
                timestamp=current_time,
                frame_time=frame_time,
                fps=fps,
                pillar_times=pillar_times.copy(),
                total_time=total_time
            )
            
            # Add to history
            self.frame_history.append(metrics)
            
            # Clear current pillar times
            if hasattr(self, '_current_pillar_times'):
                delattr(self, '_current_pillar_times')
            
            # Check for performance alerts
            self._check_performance_alerts(metrics)
    
    def _check_performance_alerts(self, metrics: FrameMetrics) -> None:
        """Check for performance issues and generate alerts"""
        if metrics.fps < self.critical_threshold_fps:
            alert = PerformanceAlert(
                timestamp=metrics.timestamp,
                alert_type="fps_critical",
                message=f"Critical FPS drop: {metrics.fps:.1f} < {self.critical_threshold_fps}",
                severity="critical",
                metrics={"fps": metrics.fps, "frame_time": metrics.frame_time}
            )
            self._add_alert(alert)
        
        elif metrics.fps < self.alert_threshold_fps:
            alert = PerformanceAlert(
                timestamp=metrics.timestamp,
                alert_type="fps_warning",
                message=f"FPS drop: {metrics.fps:.1f} < {self.alert_threshold_fps}",
                severity="warning",
                metrics={"fps": metrics.fps, "frame_time": metrics.frame_time}
            )
            self._add_alert(alert)
        
        # Check for pillar-specific issues
        for pillar, pillar_time in metrics.pillar_times.items():
            if pillar_time > 0.016:  # > 16ms (single frame budget)
                alert = PerformanceAlert(
                    timestamp=metrics.timestamp,
                    alert_type="pillar_slow",
                    message=f"Slow pillar {pillar}: {pillar_time*1000:.1f}ms",
                    severity="warning",
                    metrics={"pillar": pillar, "time_ms": pillar_time * 1000}
                )
                self._add_alert(alert)
    
    def _add_alert(self, alert: PerformanceAlert) -> None:
        """Add alert and trigger callbacks"""
        self.alerts.append(alert)
        
        # Log the alert
        if alert.severity == "critical":
            logger.error(f"🚨 {alert.alert_type}: {alert.message}")
        else:
            logger.warning(f"⚠️ {alert.alert_type}: {alert.message}")
        
        # Trigger callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Alert callback failed: {e}")
    
    def get_current_stats(self) -> PerformanceStats:
        """Get current performance statistics"""
        with self._lock:
            if not self.frame_history:
                return PerformanceStats(
                    avg_fps=0.0,
                    min_fps=0.0,
                    max_fps=0.0,
                    avg_frame_time=0.0,
                    frame_time_variance=0.0,
                    pillar_averages={},
                    pillar_max_times={},
                    total_frames=0,
                    uptime_seconds=time.time() - self.start_time
                )
            
            # Calculate FPS statistics
            fps_values = [frame.fps for frame in self.frame_history]
            frame_times = [frame.frame_time for frame in self.frame_history]
            
            avg_fps = sum(fps_values) / len(fps_values)
            min_fps = min(fps_values)
            max_fps = max(fps_values)
            avg_frame_time = sum(frame_times) / len(frame_times)
            
            # Calculate variance
            variance = sum((ft - avg_frame_time) ** 2 for ft in frame_times) / len(frame_times)
            
            # Calculate pillar statistics
            pillar_times: Dict[str, List[float]] = {}
            for frame in self.frame_history:
                for pillar, pillar_time in frame.pillar_times.items():
                    if pillar not in pillar_times:
                        pillar_times[pillar] = []
                    pillar_times[pillar].append(pillar_time)
            
            pillar_averages = {
                pillar: sum(times) / len(times) 
                for pillar, times in pillar_times.items()
            }
            
            pillar_max_times = {
                pillar: max(times) 
                for pillar, times in pillar_times.items()
            }
            
            return PerformanceStats(
                avg_fps=avg_fps,
                min_fps=min_fps,
                max_fps=max_fps,
                avg_frame_time=avg_frame_time,
                frame_time_variance=variance,
                pillar_averages=pillar_averages,
                pillar_max_times=pillar_max_times,
                total_frames=self.frame_count,
                uptime_seconds=time.time() - self.start_time
            )
    
    def get_recent_frames(self, count: int = 60) -> List[FrameMetrics]:
        """Get recent frame metrics"""
        with self._lock:
            return list(self.frame_history)[-count:]
    
    def get_recent_alerts(self, count: int = 10) -> List[PerformanceAlert]:
        """Get recent alerts"""
        with self._lock:
            return list(self.alerts)[-count:]
    
    def add_alert_callback(self, callback: Callable[[PerformanceAlert], None]) -> None:
        """Add callback for alert notifications"""
        self.alert_callbacks.append(callback)
    
    def export_metrics(self, file_path: Path) -> None:
        """Export metrics to JSON file"""
        with self._lock:
            data = {
                "export_time": time.time(),
                "target_fps": self.target_fps,
                "total_frames": self.frame_count,
                "uptime_seconds": time.time() - self.start_time,
                "stats": self.get_current_stats().__dict__,
                "recent_frames": [
                    {
                        "timestamp": f.timestamp,
                        "frame_time": f.frame_time,
                        "fps": f.fps,
                        "pillar_times": f.pillar_times,
                        "total_time": f.total_time
                    }
                    for f in list(self.frame_history)[-60:]  # Last 60 frames
                ],
                "recent_alerts": [
                    {
                        "timestamp": a.timestamp,
                        "alert_type": a.alert_type,
                        "message": a.message,
                        "severity": a.severity,
                        "metrics": a.metrics
                    }
                    for a in list(self.alerts)[-20:]  # Last 20 alerts
                ]
            }
            
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"📊 Metrics exported to {file_path}")
    
    def reset(self) -> None:
        """Reset all metrics"""
        with self._lock:
            self.frame_history.clear()
            self.alerts.clear()
            self.start_time = time.time()
            self.last_frame_time = self.start_time
            self.frame_count = 0
            self._pillar_start_times.clear()
            
            logger.info("📊 Performance metrics reset")


# Singleton instance for global access
_performance_monitor: Optional[PerformanceMonitor] = None


def get_performance_monitor() -> Optional[PerformanceMonitor]:
    """Get the global performance monitor instance"""
    return _performance_monitor


def initialize_performance_monitor(target_fps: int = 60) -> PerformanceMonitor:
    """Initialize the global performance monitor"""
    global _performance_monitor
    _performance_monitor = PerformanceMonitor(target_fps=target_fps)
    return _performance_monitor


def cleanup_performance_monitor() -> None:
    """Cleanup the global performance monitor"""
    global _performance_monitor
    _performance_monitor = None
