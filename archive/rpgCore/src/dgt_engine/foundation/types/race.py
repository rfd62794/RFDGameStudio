"""
Race Type Definitions - DGT Tier 1 Foundation

Transplanted from TurboShells models.py with Result[T] pattern hardening.
Deterministic race state models with Pydantic validation and error handling.

These models represent the complete race state in a serializable format.
They are the "Source of Truth" for race simulation and rendering.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator
from enum import Enum
import time

from .result import Result


class TerrainType(str, Enum):
    """Terrain types that affect turtle movement"""
    GRASS = "grass"
    MUD = "mud"
    WATER = "water"
    SAND = "sand"
    ROCK = "rock"
    ROUGH = "rough"
    TRACK = "track"
    FINISH = "finish"


class TurtleStatus(str, Enum):
    """Turtle status during race"""
    RACING = "racing"
    RESTING = "resting"
    FINISHED = "finished"
    CRASHED = "crashed"


class TerrainSegment(BaseModel):
    """Terrain segment with properties"""
    start_distance: float = Field(ge=0, description="Start distance of segment")
    end_distance: float = Field(ge=0, description="End distance of segment")
    terrain_type: TerrainType = Field(description="Type of terrain")
    speed_modifier: float = Field(default=1.0, ge=0, description="Speed multiplier for terrain")
    energy_drain: float = Field(default=1.0, ge=0, description="Energy drain multiplier")
    
    @field_validator('end_distance', mode='before')
    @classmethod
    def validate_distance(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate end distance is after start distance"""
        if 'start_distance' in values and v <= values['start_distance']:
            raise ValueError("end_distance must be greater than start_distance")
        return v
    
    def contains_distance(self, distance: float) -> bool:
        """Check if distance is within this segment"""
        return self.start_distance <= distance < self.end_distance


class TurtleState(BaseModel):
    """Complete state of a turtle during a race"""
    
    # Identity
    id: str = Field(description="Unique turtle identifier")
    name: str = Field(description="Turtle name")
    
    # Position
    x: float = Field(default=0.0, ge=0, description="Current X position (distance)")
    y: float = Field(default=0.0, description="Current Y position (lane)")
    angle: float = Field(default=0.0, description="Facing angle in degrees")
    
    # Energy & Status
    current_energy: float = Field(default=100.0, ge=0, description="Current energy level")
    max_energy: float = Field(default=100.0, gt=0, description="Maximum energy")
    is_resting: bool = Field(default=False, description="Currently resting to recover")
    status: TurtleStatus = Field(default=TurtleStatus.RACING, description="Current race status")
    
    # Race Progress
    finished: bool = Field(default=False, description="Has finished the race")
    rank: Optional[int] = Field(default=None, ge=1, description="Finishing position")
    checkpoints_passed: int = Field(default=0, ge=0, description="Number of checkpoints passed")
    
    # Genetics (encoded)
    genome: Optional[str] = Field(default=None, description="Encoded genome data")
    
    # Performance Metrics
    top_speed: float = Field(default=0.0, ge=0, description="Top speed achieved")
    average_speed: float = Field(default=0.0, ge=0, description="Average speed")
    race_time: float = Field(default=0.0, ge=0, description="Time in race")
    
    @field_validator('current_energy', mode='before')
    @classmethod
    def validate_energy(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate current energy doesn't exceed maximum"""
        if 'max_energy' in values and v > values['max_energy']:
            return values['max_energy']
        return v
    
    @field_validator('rank', mode='before')
    @classmethod
    def validate_rank_finished(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate rank only set when finished"""
        if v is not None and not values.get('finished', False):
            raise ValueError("rank can only be set when turtle is finished")
        return v
    
    def energy_percentage(self) -> float:
        """Get energy as percentage of maximum"""
        return (self.current_energy / self.max_energy) * 100
    
    def is_active(self) -> bool:
        """Check if turtle is still actively racing"""
        return self.status == TurtleStatus.RACING and not self.finished
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for broadcasting"""
        return {
            'id': self.id,
            'name': self.name,
            'x': self.x,
            'y': self.y,
            'angle': self.angle,
            'current_energy': self.current_energy,
            'max_energy': self.max_energy,
            'is_resting': self.is_resting,
            'status': self.status.value,
            'finished': self.finished,
            'rank': self.rank,
            'checkpoints_passed': self.checkpoints_passed,
            'genome': self.genome,
            'top_speed': self.top_speed,
            'average_speed': self.average_speed,
            'race_time': self.race_time,
            'energy_percentage': self.energy_percentage(),
            'is_active': self.is_active()
        }


class RaceConfig(BaseModel):
    """Race configuration parameters"""
    
    # Track
    track_length: float = Field(default=1500.0, gt=0, description="Total track length")
    track_width: float = Field(default=800.0, gt=0, description="Track width")
    lane_count: int = Field(default=8, ge=2, le=12, description="Number of lanes")
    
    # Timing
    tick_rate: float = Field(default=30.0, gt=0, description="Simulation ticks per second")
    max_ticks: int = Field(default=10000, ge=0, description="Maximum race ticks")
    max_time: float = Field(default=300.0, gt=0, description="Maximum race time (seconds)")
    
    # Physics
    base_speed: float = Field(default=10.0, gt=0, description="Base movement speed")
    energy_drain_rate: float = Field(default=1.0, gt=0, description="Energy drain rate")
    recovery_rate: float = Field(default=2.0, gt=0, description="Energy recovery rate")
    
    # Terrain
    terrain_segments: List[TerrainSegment] = Field(
        default_factory=list, 
        description="Pre-defined terrain segments"
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'track_length': self.track_length,
            'track_width': self.track_width,
            'lane_count': self.lane_count,
            'tick_rate': self.tick_rate,
            'max_ticks': self.max_ticks,
            'max_time': self.max_time,
            'base_speed': self.base_speed,
            'energy_drain_rate': self.energy_drain_rate,
            'recovery_rate': self.recovery_rate,
            'terrain_segments': [seg.to_dict() for seg in self.terrain_segments]
        }


class RaceSnapshot(BaseModel):
    """
    Complete snapshot of race state at a specific tick.
    
    This is the primary data structure for race communication.
    It contains everything needed to render, analyze, or replay the race.
    """
    
    # Timing
    tick: int = Field(ge=0, description="Current simulation tick")
    elapsed_ms: float = Field(ge=0, description="Elapsed time in milliseconds")
    
    # Race Info
    course_id: str = Field(description="Unique course identifier")
    track_length: float = Field(gt=0, description="Total track length")
    
    # Turtle States
    turtles: List[TurtleState] = Field(description="All turtle states")
    
    # Environment
    terrain_ahead: List[TerrainSegment] = Field(
        default_factory=list,
        description="Upcoming terrain segments"
    )
    
    # Race Status
    finished: bool = Field(default=False, description="Race is finished")
    winner_id: Optional[str] = Field(default=None, description="Winning turtle ID")
    
    # Statistics
    total_turtles: int = Field(ge=0, description="Total number of turtles")
    finished_turtles: int = Field(ge=0, description="Number of finished turtles")
    active_turtles: int = Field(ge=0, description="Number of actively racing turtles")
    
    @field_validator('turtles', mode='before')
    @classmethod
    def validate_turtle_ids(cls, v: Any) -> Any:
        """Validate all turtle IDs are unique"""
        ids = [t.id for t in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Turtle IDs must be unique")
        return v
    
    @field_validator('finished_turtles', mode='before')
    @classmethod
    def validate_finished_count(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate finished count matches turtle states"""
        if 'turtles' in values:
            actual_finished = sum(1 for t in values['turtles'] if t.finished)
            if v != actual_finished:
                return actual_finished
        return v
    
    @field_validator('active_turtles', mode='before')
    @classmethod
    def validate_active_count(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate active count matches turtle states"""
        if 'turtles' in values:
            actual_active = sum(1 for t in values['turtles'] if t.is_active())
            if v != actual_active:
                return actual_active
        return v
    
    def get_turtle_by_id(self, turtle_id: str) -> Optional[TurtleState]:
        """Get turtle state by ID"""
        for turtle in self.turtles:
            if turtle.id == turtle_id:
                return turtle
        return None
    
    def get_leaderboard(self) -> List[TurtleState]:
        """Get turtles sorted by position"""
        return sorted(
            self.turtles,
            key=lambda t: (t.x, t.rank or float('inf')),
            reverse=True
        )
    
    def to_broadcast_json(self) -> Dict[str, Any]:
        """Convert to JSON for broadcasting"""
        return {
            'tick': self.tick,
            'elapsed_ms': self.elapsed_ms,
            'course_id': self.course_id,
            'track_length': self.track_length,
            'turtles': [t.to_dict() for t in self.turtles],
            'terrain_ahead': [seg.to_dict() for seg in self.terrain_ahead],
            'finished': self.finished,
            'winner_id': self.winner_id,
            'total_turtles': self.total_turtles,
            'finished_turtles': self.finished_turtles,
            'active_turtles': self.active_turtles,
            'leaderboard': [t.id for t in self.get_leaderboard()]
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return self.to_broadcast_json()


class RaceResult(BaseModel):
    """Final race results and statistics"""
    
    # Race Info
    race_id: str = Field(description="Unique race identifier")
    course_id: str = Field(description="Course identifier")
    completed_time: float = Field(ge=0, description="Time to complete race")
    total_ticks: int = Field(ge=0, description="Total simulation ticks")
    
    # Results
    winner_id: str = Field(description="Winning turtle ID")
    final_standings: List[TurtleState] = Field(description="Final turtle standings")
    
    # Statistics
    average_finish_time: float = Field(ge=0, description="Average finish time")
    fastest_turtle: str = Field(description="Fastest turtle ID")
    longest_distance: float = Field(ge=0, description="Longest distance traveled")
    
    def get_turtle_result(self, turtle_id: str) -> Optional[TurtleState]:
        """Get result for specific turtle"""
        for turtle in self.final_standings:
            if turtle.id == turtle_id:
                return turtle
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'race_id': self.race_id,
            'course_id': self.course_id,
            'completed_time': self.completed_time,
            'total_ticks': self.total_ticks,
            'winner_id': self.winner_id,
            'final_standings': [t.to_dict() for t in self.final_standings],
            'average_finish_time': self.average_finish_time,
            'fastest_turtle': self.fastest_turtle,
            'longest_distance': self.longest_distance
        }


# Factory functions for creating common configurations

def create_default_race_config() -> RaceConfig:
    """Create a standard race configuration"""
    return RaceConfig()


def create_turtle_state(turtle_id: str, name: str, lane: int = 0, 
                       max_energy: float = 100.0) -> TurtleState:
    """Create a turtle state with default values"""
    return TurtleState(
        id=turtle_id,
        name=name,
        y=float(lane * 40),  # Standard lane spacing
        max_energy=max_energy,
        current_energy=max_energy
    )


def create_race_snapshot(tick: int, turtles: List[TurtleState], 
                        course_id: str = "default") -> RaceSnapshot:
    """Create a race snapshot from turtle states"""
    return RaceSnapshot(
        tick=tick,
        elapsed_ms=0.0,
        course_id=course_id,
        turtles=turtles,
        total_turtles=len(turtles),
        finished_turtles=sum(1 for t in turtles if t.finished),
        active_turtles=sum(1 for t in turtles if t.is_active())
    )


# Validation functions with Result[T] pattern

def validate_race_config(config: Dict[str, Any]) -> Result[RaceConfig]:
    """Validate race configuration dictionary"""
    try:
        race_config = RaceConfig(**config)
        return Result.success_result(race_config)
    except Exception as e:
        return Result.failure_result(f"Invalid race config: {str(e)}")


def validate_turtle_state(state: Dict[str, Any]) -> Result[TurtleState]:
    """Validate turtle state dictionary"""
    try:
        turtle_state = TurtleState(**state)
        return Result.success_result(turtle_state)
    except Exception as e:
        return Result.failure_result(f"Invalid turtle state: {str(e)}")


def validate_race_snapshot(snapshot: Dict[str, Any]) -> Result[RaceSnapshot]:
    """Validate race snapshot dictionary"""
    try:
        race_snapshot = RaceSnapshot(**snapshot)
        return Result.success_result(race_snapshot)
    except Exception as e:
        return Result.failure_result(f"Invalid race snapshot: {str(e)}")


# Export key components
__all__ = [
    'TerrainType',
    'TurtleStatus',
    'TerrainSegment',
    'TurtleState',
    'RaceConfig',
    'RaceSnapshot',
    'RaceResult',
    'create_default_race_config',
    'create_turtle_state',
    'create_race_snapshot',
    'validate_race_config',
    'validate_turtle_state',
    'validate_race_snapshot'
]
