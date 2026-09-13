"""
Movie Engine - Core Cinematic System Logic
Extracted from legacy launch_movie.py with Result[T] pattern compliance
"""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from loguru import logger

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from dgt_engine.foundation.system_clock import SystemClock


class EventType(Enum):
    """Types of cinematic events"""
    MOVEMENT = "movement"
    INTERACTION = "interaction"
    COMBAT = "combat"
    DIALOGUE = "dialogue"
    SCENE_TRANSITION = "scene_transition"
    EFFECT = "effect"


@dataclass
class CinematicEvent:
    """Single cinematic event data structure"""
    event_id: str
    event_type: EventType
    timestamp: float
    duration: float
    position: Optional[Tuple[int, int]] = None
    target_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


@dataclass
class MovieSequence:
    """Complete movie sequence with events"""
    sequence_id: str
    title: str
    events: List[CinematicEvent]
    total_duration: float
    metadata: Optional[Dict[str, Any]] = None


class MovieEngine:
    """Core cinematic engine without UI dependencies"""
    
    def __init__(self, seed: str = "FOREST_GATE_001", target_fps: float = 60.0):
        self.seed = seed
        self.current_sequence: Optional[MovieSequence] = None
        self.current_event_index: int = 0
        self.is_playing: bool = False
        self.playback_start_time: Optional[float] = None
        self.session_log: List[str] = []
        
        # Engine state
        self.world_size = (50, 50)
        self.current_position = (25, 25)  # Center of world
        
        # System clock for steady 60Hz timing
        self.system_clock = SystemClock(target_fps=target_fps, max_cpu_usage=80.0)
        
        logger.info(f"🎬 MovieEngine initialized with seed: {seed} at {target_fps} FPS")
    
    def load_sequence(self, sequence_data: Dict[str, Any]) -> Result[MovieSequence]:
        """Load a movie sequence from data"""
        try:
            # Validate sequence structure
            required_fields = ['sequence_id', 'title', 'events']
            for field in required_fields:
                if field not in sequence_data:
                    return Result(success=False, error=f"Missing required field: {field}")
            
            # Parse events
            events = []
            total_duration = 0.0
            
            for event_data in sequence_data['events']:
                event_result = self._parse_event(event_data)
                if not event_result.success:
                    return Result(success=False, error=f"Failed to parse event: {event_result.error}")
                
                event = event_result.value
                events.append(event)
                total_duration += event.duration
            
            # Create sequence
            sequence = MovieSequence(
                sequence_id=sequence_data['sequence_id'],
                title=sequence_data['title'],
                events=events,
                total_duration=total_duration,
                metadata=sequence_data.get('metadata', {})
            )
            
            logger.info(f"📽️ Loaded sequence: {sequence.title} ({len(events)} events, {total_duration:.1f}s)")
            return Result(success=True, value=sequence)
            
        except Exception as e:
            error_msg = f"Failed to load sequence: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def _parse_event(self, event_data: Dict[str, Any]) -> Result[CinematicEvent]:
        """Parse a single event from data"""
        try:
            # Validate event structure
            required_fields = ['event_id', 'event_type', 'timestamp', 'duration']
            for field in required_fields:
                if field not in event_data:
                    return Result(success=False, error=f"Missing required field: {field}")
            
            # Parse event type
            try:
                event_type = EventType(event_data['event_type'])
            except ValueError:
                return Result(success=False, error=f"Invalid event type: {event_data['event_type']}")
            
            # Create event
            event = CinematicEvent(
                event_id=event_data['event_id'],
                event_type=event_type,
                timestamp=float(event_data['timestamp']),
                duration=float(event_data['duration']),
                position=tuple(event_data['position']) if 'position' in event_data else None,
                target_id=event_data.get('target_id'),
                parameters=event_data.get('parameters', {}),
                description=event_data.get('description')
            )
            
            return Result(success=True, value=event)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to parse event: {str(e)}")
    
    def start_sequence(self, sequence: MovieSequence) -> Result[bool]:
        """Start playing a movie sequence"""
        try:
            if self.is_playing:
                return Result(success=False, error="Sequence already playing")
            
            self.current_sequence = sequence
            self.current_event_index = 0
            self.is_playing = True
            self.playback_start_time = time.time()
            
            self.log_event(f"🎬 Starting sequence: {sequence.title}")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to start sequence: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def stop_sequence(self) -> Result[bool]:
        """Stop the current sequence"""
        try:
            if not self.is_playing:
                return Result(success=False, error="No sequence playing")
            
            self.is_playing = False
            elapsed_time = time.time() - (self.playback_start_time or 0)
            
            self.log_event(f"⏹️ Sequence stopped after {elapsed_time:.1f}s")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to stop sequence: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def get_current_events(self) -> Result[List[CinematicEvent]]:
        """Get events that should be playing at current time"""
        try:
            if not self.is_playing or not self.current_sequence:
                return Result(success=False, error="No sequence playing")
            
            current_time = time.time() - (self.playback_start_time or 0)
            active_events = []
            
            for event in self.current_sequence.events:
                # Check if event should be active
                if event.timestamp <= current_time < event.timestamp + event.duration:
                    active_events.append(event)
            
            return Result(success=True, value=active_events)
            
        except Exception as e:
            error_msg = f"Failed to get current events: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def get_next_events(self, count: int = 3) -> Result[List[CinematicEvent]]:
        """Get the next N events in the sequence"""
        try:
            if not self.current_sequence:
                return Result(success=False, error="No sequence loaded")
            
            next_events = []
            start_index = self.current_event_index
            
            for i in range(count):
                if start_index + i < len(self.current_sequence.events):
                    next_events.append(self.current_sequence.events[start_index + i])
            
            return Result(success=True, value=next_events)
            
        except Exception as e:
            error_msg = f"Failed to get next events: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def advance_to_next_event(self) -> Result[CinematicEvent]:
        """Advance to the next event in sequence"""
        try:
            if not self.current_sequence:
                return Result(success=False, error="No sequence loaded")
            
            if self.current_event_index >= len(self.current_sequence.events):
                return Result(success=False, error="Sequence already completed")
            
            event = self.current_sequence.events[self.current_event_index]
            self.current_event_index += 1
            
            self.log_event(f"🎭 Event: {event.event_type.value} - {event.description or 'No description'}")
            return Result(success=True, value=event)
            
        except Exception as e:
            error_msg = f"Failed to advance to next event: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def process_movement_event(self, event: CinematicEvent) -> Result[bool]:
        """Process a movement event"""
        try:
            if event.event_type != EventType.MOVEMENT:
                return Result(success=False, error="Not a movement event")
            
            if not event.position:
                return Result(success=False, error="Movement event missing position")
            
            # Validate movement bounds
            x, y = event.position
            if 0 <= x < self.world_size[0] and 0 <= y < self.world_size[1]:
                self.current_position = event.position
                self.log_event(f"🚶 Moved to {event.position}")
                return Result(success=True, value=True)
            else:
                self.log_event(f"⚠️ Invalid movement target {event.position} - staying in bounds")
                return Result(success=False, error="Movement out of bounds")
            
        except Exception as e:
            error_msg = f"Failed to process movement: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def process_interaction_event(self, event: CinematicEvent) -> Result[bool]:
        """Process an interaction event"""
        try:
            if event.event_type != EventType.INTERACTION:
                return Result(success=False, error="Not an interaction event")
            
            if not event.target_id:
                return Result(success=False, error="Interaction event missing target_id")
            
            # Simulate interaction
            interaction_type = event.parameters.get('interaction_type', 'examine')
            self.log_event(f"🎯 {interaction_type.title()} with {event.target_id}")
            
            # Simulate D20 check if parameters include it
            if 'difficulty' in event.parameters:
                import random
                random.seed(self.seed + hash(event.target_id))
                roll = random.randint(1, 20)
                difficulty = event.parameters['difficulty']
                success = roll >= difficulty
                
                self.log_event(f"🎲 Roll: {roll} vs DC {difficulty} -> {'SUCCESS' if success else 'FAILURE'}")
                
                if success:
                    self.log_event(f"✅ Successfully {interaction_type} {event.target_id}!")
                else:
                    self.log_event(f"❌ Failed to {interaction_type} {event.target_id}!")
            
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to process interaction: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def process_combat_event(self, event: CinematicEvent) -> Result[bool]:
        """Process a combat event"""
        try:
            if event.event_type != EventType.COMBAT:
                return Result(success=False, error="Not a combat event")
            
            combat_type = event.parameters.get('combat_type', 'standard')
            opponent = event.target_id or "unknown"
            
            self.log_event(f"⚔️ Combat started with {opponent} ({combat_type})")
            
            # Simulate combat resolution
            import random
            random.seed(self.seed + hash(opponent))
            
            voyager_roll = random.randint(1, 20) + 8  # Voyager STR bonus
            opponent_roll = random.randint(1, 20) + 6   # Opponent STR bonus
            
            winner = "voyager" if voyager_roll > opponent_roll else "opponent"
            
            self.log_event(f"🎯 Voyager roll: {voyager_roll}")
            self.log_event(f"🎯 {opponent.title()} roll: {opponent_roll}")
            self.log_event(f"🏆 Winner: {winner.title()}")
            
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to process combat: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def log_event(self, message: str, level: str = "INFO") -> None:
        """Log an event to the session log"""
        timestamp = time.strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] {level}: {message}"
        
        self.session_log.append(formatted_message)
        logger.info(formatted_message)
    
    def get_session_log(self) -> List[str]:
        """Get the complete session log"""
        return self.session_log.copy()
    
    def get_sequence_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the current sequence"""
        if not self.current_sequence:
            return None
        
        return {
            'sequence_id': self.current_sequence.sequence_id,
            'title': self.current_sequence.title,
            'total_events': len(self.current_sequence.events),
            'total_duration': self.current_sequence.total_duration,
            'current_event_index': self.current_event_index,
            'is_playing': self.is_playing,
            'current_position': self.current_position
        }
    
    def create_forest_gate_sequence(self) -> Result[MovieSequence]:
        """Create a default Forest Gate cinematic sequence"""
        try:
            events = [
                CinematicEvent(
                    event_id="spawn_objects",
                    event_type=EventType.SCENE_TRANSITION,
                    timestamp=0.0,
                    duration=2.0,
                    description="Spawn forest objects"
                ),
                CinematicEvent(
                    event_id="voyager_start",
                    event_type=EventType.MOVEMENT,
                    timestamp=2.0,
                    duration=1.0,
                    position=(25, 25),
                    description="Voyager starts at center"
                ),
                CinematicEvent(
                    event_id="move_to_crystal",
                    event_type=EventType.MOVEMENT,
                    timestamp=3.0,
                    duration=2.0,
                    position=(12, 10),
                    description="Move to crystal"
                ),
                CinematicEvent(
                    event_id="examine_crystal",
                    event_type=EventType.INTERACTION,
                    timestamp=5.0,
                    duration=2.0,
                    target_id="crystal",
                    parameters={'interaction_type': 'examine', 'difficulty': 5},
                    description="Examine the crystal"
                ),
                CinematicEvent(
                    event_id="move_to_guardian",
                    event_type=EventType.MOVEMENT,
                    timestamp=7.0,
                    duration=3.0,
                    position=(15, 10),
                    description="Approach Forest Guardian"
                ),
                CinematicEvent(
                    event_id="forest_guardian_battle",
                    event_type=EventType.COMBAT,
                    timestamp=10.0,
                    duration=5.0,
                    target_id="forest_guardian",
                    parameters={'combat_type': 'standard'},
                    description="Forest Guardian battle"
                )
            ]
            
            sequence = MovieSequence(
                sequence_id="forest_gate_premiere",
                title="Forest Gate Premiere",
                events=events,
                total_duration=sum(event.duration for event in events),
                metadata={'seed': self.seed, 'version': '1.0'}
            )
            
            logger.info(f"🎬 Created Forest Gate sequence: {len(events)} events, {sequence.total_duration:.1f}s")
            return Result(success=True, value=sequence)
            
        except Exception as e:
            error_msg = f"Failed to create Forest Gate sequence: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
