"""
Race Arbiter - DGT Tier 2 Architecture

Monitors race state, handles energy depletion, finish line detection, and emits events.
Provides Result[T] pattern for all race monitoring operations.

This is the "Referee" - ensures fair play and tracks race progress.
"""

from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum
import time

from ...foundation.base import ComponentConfig
from ...systems.base import BaseSystem, SystemConfig
from ...foundation.types import Result
from ...foundation.types.race import (
    TurtleState, RaceSnapshot, RaceResult, TurtleStatus,
    TerrainType, create_turtle_state
)
from pydantic import BaseModel


class RaceEventType(str, Enum):
    """Event types that the arbiter can emit"""
    RACE_STARTED = "race_started"
    RACE_FINISHED = "race_finished"
    TURTLE_FINISHED = "turtle_finished"
    TURTLE_EXHAUSTED = "turtle_exhausted"
    TURTLE_RECOVERED = "turtle_recovered"
    CHECKPOINT_PASSED = "checkpoint_passed"
    ENERGY_WARNING = "energy_warning"
    LEADER_CHANGED = "leader_changed"


class ArbiterEvent(BaseModel):
    """Event emitted by the race arbiter"""
    event_type: RaceEventType
    timestamp: float
    turtle_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'event_type': self.event_type.value,
            'timestamp': self.timestamp,
            'turtle_id': self.turtle_id,
            'data': self.data or {}
        }


@dataclass
class EnergyThresholds:
    """Energy threshold configurations"""
    WARNING_THRESHOLD: float = 20.0      # Energy warning level
    CRITICAL_THRESHOLD: float = 10.0     # Critical energy level
    EXHAUSTION_THRESHOLD: float = 5.0     # Exhaustion level
    RECOVERY_THRESHOLD: float = 50.0      # Recovery completion level


@dataclass
class RaceMetrics:
    """Race performance metrics"""
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    total_ticks: int = 0
    leader_changes: int = 0
    exhaustion_events: int = 0
    recovery_events: int = 0
    checkpoint_passes: int = 0
    
    def duration(self) -> Optional[float]:
        """Get race duration"""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return None
    
    def average_tick_time(self) -> Optional[float]:
        """Get average time per tick"""
        if self.total_ticks > 0 and self.duration():
            return self.duration() / self.total_ticks
        return None


class RaceArbiter(BaseSystem):
    """
    Race monitoring and arbitration system.
    
    Monitors turtle states, enforces race rules, detects finish conditions,
    and emits events for race state changes.
    """
    
    def __init__(self, config: Optional[SystemConfig] = None):
        if config is None:
            config = SystemConfig(
                system_id="race_arbiter",
                system_name="Race Arbiter",
                enabled=True,
                debug_mode=False,
                auto_register=True,
                update_interval=1.0 / 30.0,  # 30Hz monitoring
                priority=2  # High priority
            )
        
        super().__init__(config)
        
        # Arbiter state
        self.energy_thresholds = EnergyThresholds()
        self.race_metrics = RaceMetrics()
        self.event_history: List[ArbiterEvent] = []
        
        # Race monitoring
        self.is_monitoring = False
        self.race_finished = False
        self.finish_order: List[str] = []
        self.current_leader: Optional[str] = None
        
        # Event callbacks
        self.event_callbacks: Dict[str, List[Callable]] = {}
        for event_type in RaceEventType:
            self.event_callbacks[event_type.value] = []
        
        # Previous state tracking
        self.previous_states: Dict[str, TurtleState] = {}
        self.checkpoint_positions: List[float] = []
    
    def _on_initialize(self) -> Result[bool]:
        """Initialize the race arbiter"""
        try:
            self._get_logger().info("🏁 Race Arbiter initialized")
            self._get_logger().info(f"⚡ Monitoring frequency: 30Hz")
            self._get_logger().info(f"🔋 Energy thresholds: Warning={self.energy_thresholds.WARNING_THRESHOLD}%, "
                                   f"Critical={self.energy_thresholds.CRITICAL_THRESHOLD}%, "
                                   f"Exhaustion={self.energy_thresholds.EXHAUSTION_THRESHOLD}%")
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Arbiter initialization failed: {str(e)}")
    
    def _on_shutdown(self) -> Result[None]:
        """Shutdown the race arbiter"""
        try:
            self.stop_monitoring()
            
            self._get_logger().info("🏁 Race Arbiter shutdown")
            self._get_logger().info(f"📊 Total events processed: {len(self.event_history)}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Arbiter shutdown failed: {str(e)}")
    
    def _on_update(self, dt: float) -> Result[None]:
        """Update race monitoring"""
        try:
            if not self.is_monitoring or self.race_finished:
                return Result.success_result(None)
            
            # Get current race snapshot
            snapshot_result = self._get_race_snapshot()
            if not snapshot_result.success:
                return Result.failure_result(f"Failed to get race snapshot: {snapshot_result.error}")
            
            snapshot = snapshot_result.value
            self.race_metrics.total_ticks = snapshot.tick
            
            # Monitor each turtle
            for turtle_state in snapshot.turtles:
                self._monitor_turtle(turtle_state)
            
            # Check race completion
            self._check_race_completion(snapshot)
            
            # Update leader tracking
            self._update_leader_tracking(snapshot)
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Arbiter update failed: {str(e)}")
    
    def _on_handle_event(self, event_type: str, event_data: Dict[str, Any]) -> Result[None]:
        """Handle arbiter events"""
        try:
            if event_type == "start_monitoring":
                return self.start_monitoring(event_data.get("checkpoints", []))
            elif event_type == "stop_monitoring":
                return self.stop_monitoring()
            elif event_type == "get_race_result":
                return self.get_race_result()
            elif event_type == "get_event_history":
                return self.get_event_history()
            elif event_type == "get_race_metrics":
                return self.get_race_metrics()
            elif event_type == "register_callback":
                return self.register_event_callback(
                    event_data.get("event_type"),
                    event_data.get("callback")
                )
            else:
                return Result.success_result(None)
                
        except Exception as e:
            return Result.failure_result(f"Arbiter event handling failed: {str(e)}")
    
    def start_monitoring(self, checkpoint_positions: List[float] = None) -> Result[None]:
        """Start monitoring a race"""
        try:
            self.is_monitoring = True
            self.race_finished = False
            self.race_metrics = RaceMetrics()
            self.race_metrics.start_time = time.perf_counter()
            self.finish_order = []
            self.current_leader = None
            self.previous_states.clear()
            self.event_history.clear()
            
            # Set up checkpoints
            self.checkpoint_positions = checkpoint_positions or []
            
            # Emit race started event
            self._emit_event("race_started", {
                'checkpoints': len(self.checkpoint_positions),
                'start_time': self.race_metrics.start_time
            })
            
            self._get_logger().info("🏁 Race monitoring started")
            self._get_logger().info(f"📍 Checkpoints: {len(self.checkpoint_positions)}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to start monitoring: {str(e)}")
    
    def stop_monitoring(self) -> Result[None]:
        """Stop monitoring the current race"""
        try:
            if not self.is_monitoring:
                return Result.success_result(None)
            
            self.is_monitoring = False
            self.race_metrics.end_time = time.perf_counter()
            
            # Emit race finished event
            self._emit_event("race_finished", {
                'duration': self.race_metrics.duration(),
                'total_ticks': self.race_metrics.total_ticks,
                'finish_order': self.finish_order
            })
            
            self._get_logger().info("🏁 Race monitoring stopped")
            if self.race_metrics.duration():
                self._get_logger().info(f"⏱️ Race duration: {self.race_metrics.duration():.2f}s")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to stop monitoring: {str(e)}")
    
    def _monitor_turtle(self, turtle_state: TurtleState) -> None:
        """Monitor individual turtle state"""
        turtle_id = turtle_state.id
        previous_state = self.previous_states.get(turtle_id)
        
        # Check energy levels
        self._monitor_energy(turtle_state, previous_state)
        
        # Check finish line
        if not turtle_state.finished and previous_state and not previous_state.finished:
            if turtle_state.x >= self._get_track_length():
                self._handle_turtle_finished(turtle_state)
        
        # Check checkpoints
        self._monitor_checkpoints(turtle_state, previous_state)
        
        # Update previous state
        self.previous_states[turtle_id] = turtle_state.copy(deep=True) if hasattr(turtle_state, 'copy') else turtle_state
    
    def _monitor_energy(self, current_state: TurtleState, 
                       previous_state: Optional[TurtleState]) -> None:
        """Monitor turtle energy levels"""
        energy_percentage = current_state.energy_percentage()
        turtle_id = current_state.id
        
        # Check for exhaustion
        if energy_percentage <= self.energy_thresholds.EXHAUSTION_THRESHOLD:
            if current_state.status != TurtleStatus.RESTING:
                self._handle_turtle_exhausted(current_state)
        
        # Check for recovery
        elif energy_percentage >= self.energy_thresholds.RECOVERY_THRESHOLD:
            if previous_state and previous_state.status == TurtleStatus.RESTING:
                self._handle_turtle_recovered(current_state)
        
        # Check for energy warnings
        elif energy_percentage <= self.energy_thresholds.WARNING_THRESHOLD:
            if not previous_state or previous_state.energy_percentage() > self.energy_thresholds.WARNING_THRESHOLD:
                self._emit_event("energy_warning", {
                    'turtle_id': turtle_id,
                    'energy_level': energy_percentage,
                    'status': 'warning'
                }, turtle_id)
        
        # Check for critical energy
        elif energy_percentage <= self.energy_thresholds.CRITICAL_THRESHOLD:
            if not previous_state or previous_state.energy_percentage() > self.energy_thresholds.CRITICAL_THRESHOLD:
                self._emit_event("energy_warning", {
                    'turtle_id': turtle_id,
                    'energy_level': energy_percentage,
                    'status': 'critical'
                }, turtle_id)
    
    def _monitor_checkpoints(self, current_state: TurtleState, 
                           previous_state: Optional[TurtleState]) -> None:
        """Monitor checkpoint passing"""
        if not self.checkpoint_positions:
            return
        
        for checkpoint_pos in self.checkpoint_positions:
            # Check if turtle just passed this checkpoint
            if previous_state and previous_state.x < checkpoint_pos <= current_state.x:
                current_state.checkpoints_passed += 1
                self.race_metrics.checkpoint_passes += 1
                
                self._emit_event("checkpoint_passed", {
                    'checkpoint_position': checkpoint_pos,
                    'total_checkpoints': current_state.checkpoints_passed,
                    'distance': current_state.x
                }, current_state.id)
    
    def _handle_turtle_finished(self, turtle_state: TurtleState) -> None:
        """Handle turtle finishing the race"""
        turtle_id = turtle_state.id
        
        # Update finish order
        if turtle_id not in self.finish_order:
            self.finish_order.append(turtle_id)
            turtle_state.rank = len(self.finish_order)
        
        # Emit finish event
        self._emit_event("turtle_finished", {
            'rank': turtle_state.rank,
            'finish_time': turtle_state.race_time,
            'total_distance': turtle_state.x
        }, turtle_id)
        
        self._get_logger().info(f"🏁 Turtle {turtle_id} finished! Rank: {turtle_state.rank}")
    
    def _handle_turtle_exhausted(self, turtle_state: TurtleState) -> None:
        """Handle turtle exhaustion"""
        turtle_id = turtle_state.id
        turtle_state.status = TurtleStatus.RESTING
        self.race_metrics.exhaustion_events += 1
        
        # Emit exhaustion event
        self._emit_event("turtle_exhausted", {
            'energy_level': turtle_state.energy_percentage(),
            'distance': turtle_state.x,
            'race_time': turtle_state.race_time
        }, turtle_id)
    
    def _handle_turtle_recovered(self, turtle_state: TurtleState) -> None:
        """Handle turtle recovery"""
        turtle_id = turtle_state.id
        turtle_state.status = TurtleStatus.RACING
        self.race_metrics.recovery_events += 1
        
        # Emit recovery event
        self._emit_event("turtle_recovered", {
            'energy_level': turtle_state.energy_percentage(),
            'distance': turtle_state.x,
            'race_time': turtle_state.race_time
        }, turtle_id)
    
    def _update_leader_tracking(self, snapshot: RaceSnapshot) -> None:
        """Update and track race leader"""
        if not snapshot.turtles:
            return
        
        # Find current leader (furthest distance)
        leader = max(snapshot.turtles, key=lambda t: t.x)
        leader_id = leader.id
        
        # Check for leader change
        if self.current_leader != leader_id:
            old_leader = self.current_leader
            self.current_leader = leader_id
            self.race_metrics.leader_changes += 1
            
            # Emit leader change event
            self._emit_event("leader_changed", {
                'new_leader': leader_id,
                'old_leader': old_leader,
                'leader_distance': leader.x,
                'leader_time': leader.race_time
            })
    
    def _check_race_completion(self, snapshot: RaceSnapshot) -> None:
        """Check if race is complete"""
        if self.race_finished:
            return
        
        # Check if all turtles finished
        all_finished = all(turtle.finished for turtle in snapshot.turtles)
        
        if all_finished:
            self.race_finished = True
            self.stop_monitoring()
    
    def _emit_event(self, event_type: str, 
                   data: Optional[Dict[str, Any]] = None,
                   turtle_id: Optional[str] = None) -> None:
        """Emit an arbiter event"""
        event = ArbiterEvent(
            event_type=RaceEventType(event_type),
            timestamp=time.perf_counter(),
            turtle_id=turtle_id,
            data=data
        )
        
        # Add to history
        self.event_history.append(event)
        
        # Call registered callbacks
        for callback in self.event_callbacks[event_type]:
            try:
                callback(event)
            except Exception as e:
                self._get_logger().error(f"Event callback error: {e}")
    
    def register_event_callback(self, event_type: str, 
                               callback: Callable) -> Result[None]:
        """Register a callback for specific events"""
        try:
            # Validate event type
            RaceEventType(event_type)
            self.event_callbacks[event_type].append(callback)
            
            self._get_logger().debug(f"Registered callback for {event_type}")
            return Result.success_result(None)
            
        except ValueError:
            return Result.failure_result(f"Invalid event type: {event_type}")
        except Exception as e:
            return Result.failure_result(f"Failed to register callback: {str(e)}")
    
    def get_race_result(self) -> Result[RaceResult]:
        """Get final race result"""
        try:
            if not self.race_finished:
                return Result.failure_result("Race not finished")
            
            # Get final turtle states
            final_states = list(self.previous_states.values())
            
            # Create race result
            result = RaceResult(
                race_id=f"race_{int(time.time())}",
                course_id="default",
                completed_time=self.race_metrics.duration() or 0.0,
                total_ticks=self.race_metrics.total_ticks,
                winner_id=self.finish_order[0] if self.finish_order else "",
                final_standings=sorted(final_states, key=lambda t: t.rank or float('inf')),
                average_finish_time=sum(t.race_time for t in final_states) / len(final_states),
                fastest_turtle=max(final_states, key=lambda t: t.top_speed).id,
                longest_distance=max(t.x for t in final_states)
            )
            
            return Result.success_result(result)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get race result: {str(e)}")
    
    def get_event_history(self, limit: int = 100) -> Result[List[Dict[str, Any]]]:
        """Get event history"""
        try:
            recent_events = self.event_history[-limit:] if limit > 0 else self.event_history
            
            history = [event.to_dict() for event in recent_events]
            return Result.success_result(history)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get event history: {str(e)}")
    
    def get_race_metrics(self) -> Result[Dict[str, Any]]:
        """Get race performance metrics"""
        try:
            metrics = {
                'start_time': self.race_metrics.start_time,
                'end_time': self.race_metrics.end_time,
                'duration': self.race_metrics.duration(),
                'total_ticks': self.race_metrics.total_ticks,
                'leader_changes': self.race_metrics.leader_changes,
                'exhaustion_events': self.race_metrics.exhaustion_events,
                'recovery_events': self.race_metrics.recovery_events,
                'checkpoint_passes': self.race_metrics.checkpoint_passes,
                'average_tick_time': self.race_metrics.average_tick_time(),
                'current_leader': self.current_leader,
                'finish_order': self.finish_order,
                'race_finished': self.race_finished
            }
            
            return Result.success_result(metrics)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get race metrics: {str(e)}")
    
    def _get_race_snapshot(self) -> Result[RaceSnapshot]:
        """Get current race snapshot (to be implemented by integration)"""
        # This would be implemented by the race engine integration
        return Result.failure_result("Not implemented - requires race engine integration")
    
    def _get_track_length(self) -> float:
        """Get track length (to be implemented by integration)"""
        # This would be implemented by the race engine integration
        return 1500.0  # Default


# Factory function
def create_race_arbiter() -> RaceArbiter:
    """Create a race arbiter instance"""
    return RaceArbiter()


# Export key components
__all__ = [
    'RaceArbiter',
    'ArbiterEvent',
    'EnergyThresholds',
    'RaceMetrics',
    'ArbiterEvent',
    'create_race_arbiter'
]
