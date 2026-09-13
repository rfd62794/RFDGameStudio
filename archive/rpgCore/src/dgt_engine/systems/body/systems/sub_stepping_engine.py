"""
Sub-Stepping Engine - 30Hz to 60Hz Compatibility Layer
Bridges legacy 30Hz race physics to DGT's 60Hz SystemClock

This module implements the sub-stepping approach where race logic
updates every 2 frames of the render loop, ensuring the "Soul" 
of the original simulation remains intact without jitter.
"""

import time
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass
from foundation.types import Result


@dataclass
class RaceSnapshot:
    """Serializable race state snapshot"""
    tick: int
    elapsed_ms: float
    turtles: List['TurtleState']
    finished: bool
    winner_id: Optional[str] = None


@dataclass
class TurtleState:
    """Individual turtle state"""
    id: str
    name: str
    position: float
    energy: float
    max_energy: float
    is_resting: bool
    finished: bool
    rank: Optional[int] = None


class SubSteppingEngine:
    """
    Sub-stepping race engine for 30Hz to 60Hz compatibility.
    
    This engine maintains the deterministic 30Hz physics from the
    legacy system while smoothly interpolating for 60Hz rendering.
    """
    
    def __init__(self, target_tick_rate: float = 30.0, render_fps: float = 60.0):
        """
        Initialize sub-stepping engine
        
        Args:
            target_tick_rate: Legacy physics tick rate (default: 30Hz)
            render_fps: Target render frame rate (default: 60Hz)
        """
        self.target_tick_rate = target_tick_rate
        self.render_fps = render_fps
        self.sub_step_ratio = int(render_fps / target_tick_rate)  # 2 for 60/30
        
        # Timing
        self.start_time = time.perf_counter()
        self.last_physics_tick = self.start_time
        self.accumulated_time = 0.0
        self.physics_dt = 1.0 / target_tick_rate
        
        # Race state
        self.current_tick = 0
        self.race_finished = False
        self.turtles: List[Dict[str, Any]] = []
        self.track_length = 1500.0
        
        # Interpolation
        self.last_snapshot: Optional[RaceSnapshot] = None
        self.current_snapshot: Optional[RaceSnapshot] = None
        self.interpolation_factor = 0.0
        
    def initialize_race(self, turtles_data: List[Dict[str, Any]], track_length: float = 1500.0) -> Result[bool]:
        """
        Initialize race with turtle data
        
        Args:
            turtles_data: List of turtle dictionaries with stats
            track_length: Race track length
            
        Returns:
            Result containing success status
        """
        try:
            self.turtles = turtles_data.copy()
            self.track_length = track_length
            self.current_tick = 0
            self.race_finished = False
            self.accumulated_time = 0.0
            self.last_physics_tick = 0.0
            
            # Reset turtle states
            for turtle in self.turtles:
                turtle['position'] = 0.0
                turtle['energy'] = turtle.get('max_energy', 100.0)
                turtle['is_resting'] = False
                turtle['finished'] = False
                turtle['rank'] = None
            
            # Create initial snapshot
            self.current_snapshot = self._create_snapshot()
            self.last_snapshot = self.current_snapshot
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Race initialization failed: {e}")
    
    def update(self) -> Result[RaceSnapshot]:
        """
        Update engine with sub-stepping logic
        
        Returns:
            Result containing interpolated race snapshot
        """
        try:
            # Get current time
            current_time = time.perf_counter()
            frame_dt = current_time - self.last_physics_tick
            self.last_physics_tick = current_time
            
            # Accumulate time for physics updates
            self.accumulated_time += frame_dt
            
            # Run physics updates if enough time accumulated
            physics_updates_this_frame = 0
            while self.accumulated_time >= self.physics_dt and not self.race_finished:
                self._physics_tick()
                self.accumulated_time -= self.physics_dt
                physics_updates_this_frame += 1
                
                # Prevent infinite loops
                if physics_updates_this_frame > 10:
                    self.accumulated_time = 0.0
                    break
            
            # Calculate interpolation for smooth rendering
            if self.accumulated_time > 0 and not self.race_finished:
                self.interpolation_factor = self.accumulated_time / self.physics_dt
            else:
                self.interpolation_factor = 0.0
            
            # Create interpolated snapshot
            snapshot = self._create_interpolated_snapshot()
            
            return Result(success=True, value=snapshot)
            
        except Exception as e:
            return Result(success=False, error=f"Update failed: {e}")
    
    def _physics_tick(self) -> None:
        """Execute one physics tick (30Hz logic)"""
        self.current_tick += 1
        
        # Store last snapshot for interpolation
        self.last_snapshot = self.current_snapshot
        self.current_snapshot = self._create_snapshot()
        
        # Update turtle physics
        for turtle in self.turtles:
            if turtle['finished']:
                continue
            
            # Simple physics simulation (legacy compatible)
            self._update_turtle_physics(turtle)
            
            # Check finish conditions
            if turtle['position'] >= self.track_length:
                turtle['position'] = self.track_length
                turtle['finished'] = True
                turtle['rank'] = sum(1 for t in self.turtles if t['finished'])
        
        # Check if race is finished
        if all(t['finished'] for t in self.turtles):
            self.race_finished = True
    
    def _update_turtle_physics(self, turtle: Dict[str, Any]) -> None:
        """Update individual turtle physics"""
        # Get turtle stats
        speed = turtle.get('speed', 10.0)
        energy = turtle['energy']
        max_energy = turtle.get('max_energy', 100.0)
        recovery = turtle.get('recovery', 5.0)
        stamina = turtle.get('stamina', 0.0)
        
        # Energy management
        if energy <= 0:
            turtle['is_resting'] = True
            energy = 0
        
        if turtle['is_resting']:
            # Recovery logic with stamina bonus
            stamina_bonus = stamina / 20.0
            recovery_rate = 0.1 * (1 + stamina_bonus)
            energy += recovery * recovery_rate
            
            if energy >= max_energy * 0.8:  # Resume at 80% energy
                turtle['is_resting'] = False
                energy = min(energy, max_energy)
        else:
            # Movement with energy drain
            energy -= 1.0  # Base energy drain per tick
            
            if energy <= 0:
                energy = 0
                turtle['is_resting'] = True
        
        # Update position if not resting
        if not turtle['is_resting']:
            # Apply speed with terrain modifiers (simplified)
            terrain_modifier = 1.0  # Could be based on track position
            distance_moved = speed * terrain_modifier
            turtle['position'] += distance_moved
        
        # Update turtle state
        turtle['energy'] = energy
    
    def _create_snapshot(self) -> RaceSnapshot:
        """Create race state snapshot"""
        turtle_states = []
        winner_id = None
        
        for turtle in self.turtles:
            state = TurtleState(
                id=turtle.get('id', 'unknown'),
                name=turtle.get('name', 'Unknown'),
                position=turtle['position'],
                energy=turtle['energy'],
                max_energy=turtle.get('max_energy', 100.0),
                is_resting=turtle['is_resting'],
                finished=turtle['finished'],
                rank=turtle.get('rank')
            )
            turtle_states.append(state)
            
            if turtle['finished'] and turtle['rank'] == 1:
                winner_id = turtle.get('id')
        
        return RaceSnapshot(
            tick=self.current_tick,
            elapsed_ms=self.current_tick * (1000.0 / self.target_tick_rate),
            turtles=turtle_states,
            finished=self.race_finished,
            winner_id=winner_id
        )
    
    def _create_interpolated_snapshot(self) -> RaceSnapshot:
        """Create interpolated snapshot for smooth rendering"""
        if not self.last_snapshot or not self.current_snapshot:
            return self._create_snapshot()
        
        # Simple linear interpolation between snapshots
        interpolated_turtles = []
        
        for i in range(len(self.current_snapshot.turtles)):
            last_turtle = self.last_snapshot.turtles[i]
            current_turtle = self.current_snapshot.turtles[i]
            
            # Interpolate position for smooth movement
            interpolated_position = (
                last_turtle.position + 
                (current_turtle.position - last_turtle.position) * self.interpolation_factor
            )
            
            # Energy doesn't need interpolation (discrete changes)
            interpolated_energy = current_turtle.energy
            
            interpolated_state = TurtleState(
                id=current_turtle.id,
                name=current_turtle.name,
                position=interpolated_position,
                energy=interpolated_energy,
                max_energy=current_turtle.max_energy,
                is_resting=current_turtle.is_resting,
                finished=current_turtle.finished,
                rank=current_turtle.rank
            )
            
            interpolated_turtles.append(interpolated_state)
        
        return RaceSnapshot(
            tick=self.current_tick,
            elapsed_ms=self.current_snapshot.elapsed_ms,
            turtles=interpolated_turtles,
            finished=self.current_snapshot.finished,
            winner_id=self.current_snapshot.winner_id
        )
    
    def get_timing_info(self) -> Dict[str, Any]:
        """Get timing information for debugging"""
        return {
            'target_tick_rate': self.target_tick_rate,
            'render_fps': self.render_fps,
            'sub_step_ratio': self.sub_step_ratio,
            'physics_dt': self.physics_dt,
            'accumulated_time': self.accumulated_time,
            'interpolation_factor': self.interpolation_factor,
            'current_tick': self.current_tick,
            'race_finished': self.race_finished
        }


def create_sub_stepping_engine(target_tick_rate: float = 30.0, render_fps: float = 60.0) -> SubSteppingEngine:
    """
    Create a sub-stepping engine instance
    
    Args:
        target_tick_rate: Legacy physics tick rate
        render_fps: Target render frame rate
        
    Returns:
        SubSteppingEngine instance
    """
    return SubSteppingEngine(target_tick_rate, render_fps)


def test_sub_stepping_compatibility() -> Result[bool]:
    """
    Test sub-stepping engine compatibility
    
    Returns:
        Result containing test success
    """
    try:
        # Create engine
        engine = create_sub_stepping_engine()
        
        # Create test turtles
        test_turtles = [
            {
                'id': 'turtle1',
                'name': 'Speedster',
                'speed': 12.0,
                'max_energy': 80.0,
                'recovery': 6.0,
                'stamina': 2.0
            },
            {
                'id': 'turtle2',
                'name': 'Tank',
                'speed': 8.0,
                'max_energy': 120.0,
                'recovery': 4.0,
                'stamina': 1.0
            }
        ]
        
        # Initialize race
        init_result = engine.initialize_race(test_turtles, 500.0)
        if not init_result.success:
            return Result(success=False, error=f"Initialization failed: {init_result.error}")
        
        # Simulate 2 seconds of time with manual updates
        simulated_time = 0.0
        frame_dt = 1.0 / 60.0  # 60Hz frame time
        total_frames = 120  # 2 seconds at 60Hz
        
        for frame in range(total_frames):
            # Manually advance time
            engine.last_physics_tick -= frame_dt
            simulated_time += frame_dt
            
            update_result = engine.update()
            if not update_result.success:
                return Result(success=False, error=f"Update failed: {update_result.error}")
            
            snapshot = update_result.value
            
            # Check race completion
            if snapshot.finished:
                break
        
        # Verify timing
        timing = engine.get_timing_info()
        
        # Should have approximately 60 physics ticks (2 seconds * 30Hz)
        expected_ticks = 60
        actual_ticks = timing['current_tick']
        
        if abs(actual_ticks - expected_ticks) > 5:  # Allow 5 tick tolerance
            return Result(success=False, error=f"Timing mismatch: expected {expected_ticks}, got {actual_ticks}")
        
        return Result(success=True, value=True)
        
    except Exception as e:
        return Result(success=False, error=f"Test failed: {e}")
