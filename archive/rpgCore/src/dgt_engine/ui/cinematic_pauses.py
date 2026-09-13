"""
Cinematic Pauses System

Manages cinematic timing and pauses for dialogue delivery.
Slows down the Chronos heartbeat during important narrative moments
and provides "subtitle" scrolling for the terminal view.

This is the "Editor" that controls the pacing of the D&D movie.
"""

import asyncio
import time
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum

from loguru import logger


class PauseType(Enum):
    """Types of cinematic pauses."""
    DIALOGUE = "dialogue"
    COMBAT = "combat"
    DISCOVERY = "discovery"
    TRANSITION = "transition"
    DRAMATIC = "dramatic"
    NARRATIVE = "narrative"


class PausePriority(Enum):
    """Priority levels for cinematic pauses."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class CinematicPause:
    """A cinematic pause with timing and content."""
    pause_id: str
    pause_type: PauseType
    duration: float
    priority: PausePriority
    content: str
    can_skip: bool = True
    auto_resume: bool = True
    created_at: float = 0.0
    
    def __post_init__(self):
        if self.created_at == 0.0:
            self.created_at = time.time()


class DialogueBox:
    """
    Dialogue box for cinematic dialogue display.
    
    Provides typewriter effect and subtitle scrolling.
    """
    
    def __init__(self, max_width: int = 50, max_height: int = 10):
        """
        Initialize dialogue box.
        
        Args:
            max_width: Maximum width of dialogue box
            max_height: Maximum height of dialogue box
        """
        self.max_width = max_width
        self.max_height = max_height
        self.current_text: str = ""
        self.displayed_text: str = ""
        self.typewriter_speed: float = 0.05  # Seconds per character
        self.is_typing: bool = False
        self.typewriter_task: Optional[asyncio.Task] = None
        
        logger.debug("💬 Dialogue box initialized")
    
    async def display_dialogue(self, text: str, typewriter_effect: bool = True) -> None:
        """
        Display dialogue with optional typewriter effect.
        
        Args:
            text: Dialogue text to display
            typewriter_effect: Whether to use typewriter effect
        """
        self.current_text = text
        
        if typewriter_effect:
            await self._typewriter_effect(text)
        else:
            self.displayed_text = text
    
    async def _typewriter_effect(self, text: str) -> None:
        """Display text with typewriter effect."""
        self.is_typing = True
        self.displayed_text = ""
        
        for char in text:
            self.displayed_text += char
            await asyncio.sleep(self.typewriter_speed)
        
        self.is_typing = False
    
    def get_formatted_text(self) -> List[str]:
        """Get formatted text for display."""
        if not self.displayed_text:
            return []
        
        # Word wrap the text
        words = self.displayed_text.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line + word) <= self.max_width:
                current_line += word + " "
            else:
                if current_line:
                    lines.append(current_line.strip())
                current_line = word + " "
        
        if current_line:
            lines.append(current_line.strip())
        
        # Limit to max height
        return lines[-self.max_height:]
    
    def skip_typewriter(self) -> None:
        """Skip typewriter effect and show full text."""
        if self.is_typing:
            self.displayed_text = self.current_text
            self.is_typing = False
            if self.typewriter_task:
                self.typewriter_task.cancel()
                self.typewriter_task = None
    
    def clear(self) -> None:
        """Clear dialogue box."""
        self.current_text = ""
        self.displayed_text = ""
        self.is_typing = False
        if self.typewriter_task:
            self.typewriter_task.cancel()
            self.typewriter_task = None


class CinematicPauses:
    """
    Manages cinematic pauses and timing for the movie experience.
    
    Controls the pacing of the autonomous simulation and provides
    subtitle scrolling for narrative delivery.
    """
    
    def __init__(self, simulator: SimulatorHost):
        """
        Initialize cinematic pauses system.
        
        Args:
            simulator: The unified simulator
        """
        self.simulator = simulator
        self.is_paused: bool = False
        self.pause_queue: List[CinematicPause] = []
        self.active_pause: Optional[CinematicPause] = None
        self.pause_start_time: float = 0.0
        
        # Dialogue box for subtitle display
        self.dialogue_box = DialogueBox()
        
        # Pause timing settings
        self.default_pause_duration = 2.0
        self.dialogue_pause_duration = 3.0
        self.combat_pause_duration = 1.0
        self.discovery_pause_duration = 2.5
        self.dramatic_pause_duration = 4.0
        
        # Event callbacks
        self.on_pause_started: Optional[Callable[[CinematicPause], None]] = None
        self.on_pause_ended: Optional[Callable[[CinematicPause], None]] = None
        self.on_dialogue_displayed: Optional[Callable[[str], None]] = None
        
        logger.info("🎬 Cinematic pauses system initialized")
    
    def add_pause(self, pause_type: PauseType, content: str, 
                  duration: Optional[float] = None, priority: PausePriority = PausePriority.MEDIUM,
                  can_skip: bool = True, auto_resume: bool = True) -> str:
        """
        Add a cinematic pause to the queue.
        
        Args:
            pause_type: Type of pause
            content: Content to display during pause
            duration: Duration of pause (None for default based on type)
            priority: Priority of pause
            can_skip: Whether pause can be skipped
            auto_resume: Whether pause auto-resumes
            
        Returns:
            Pause ID
        """
        if duration is None:
            duration = self._get_default_duration(pause_type)
        
        pause = CinematicPause(
            pause_id=f"pause_{int(time.time())}_{len(self.pause_queue)}",
            pause_type=pause_type,
            duration=duration,
            priority=priority,
            content=content,
            can_skip=can_skip,
            auto_resume=auto_resume
        )
        
        self.pause_queue.append(pause)
        self.pause_queue.sort(key=lambda p: p.priority.value, reverse=True)
        
        logger.debug(f"🎬 Added pause: {pause_type.value} - {content[:50]}...")
        return pause.pause_id
    
    def add_dialogue_pause(self, speaker: str, dialogue: str, 
                          duration: Optional[float] = None) -> str:
        """
        Add a dialogue pause with speaker and dialogue.
        
        Args:
            speaker: Speaker name
            dialogue: Dialogue text
            duration: Duration of pause
            
        Returns:
            Pause ID
        """
        content = f"{speaker}: {dialogue}"
        return self.add_pause(PauseType.DIALOGUE, content, duration, PausePriority.HIGH)
    
    def add_combat_pause(self, combat_description: str) -> str:
        """Add a combat pause."""
        return self.add_pause(PauseType.COMBAT, combat_description, 
                            self.combat_pause_duration, PausePriority.HIGH)
    
    def add_discovery_pause(self, discovery_description: str) -> str:
        """Add a discovery pause."""
        return self.add_pause(PauseType.DISCOVERY, discovery_description, 
                            self.discovery_pause_duration, PausePriority.MEDIUM)
    
    def add_dramatic_pause(self, dramatic_description: str) -> str:
        """Add a dramatic pause."""
        return self.add_pause(PauseType.DRAMATIC, dramatic_description, 
                            self.dramatic_pause_duration, PausePriority.CRITICAL)
    
    async def execute_pause_queue(self) -> None:
        """Execute the pause queue."""
        if self.is_paused or not self.pause_queue:
            return
        
        # Get highest priority pause
        pause = self.pause_queue.pop(0)
        await self._execute_pause(pause)
    
    async def _execute_pause(self, pause: CinematicPause) -> None:
        """Execute a single cinematic pause."""
        self.active_pause = pause
        self.pause_start_time = time.time()
        self.is_paused = True
        
        logger.info(f"🎬 Executing pause: {pause.pause_type.value}")
        
        # Notify pause started
        if self.on_pause_started:
            self.on_pause_started(pause)
        
        # Display content based on pause type
        if pause.pause_type == PauseType.DIALOGUE:
            await self.dialogue_box.display_dialogue(pause.content, typewriter_effect=True)
        else:
            # Display as subtitle
            self.dialogue_box.displayed_text = pause.content
        
        # Notify dialogue displayed
        if self.on_dialogue_displayed:
            self.on_dialogue_displayed(pause.content)
        
        # Wait for pause duration or skip
        if pause.auto_resume:
            await asyncio.sleep(pause.duration)
        
        # End pause
        self._end_pause()
    
    def _end_pause(self) -> None:
        """End the current pause."""
        if self.active_pause:
            logger.info(f"🎬 Ended pause: {self.active_pause.pause_type.value}")
            
            # Notify pause ended
            if self.on_pause_ended:
                self.on_pause_ended(self.active_pause)
            
            self.active_pause = None
        
        self.is_paused = False
        self.pause_start_time = 0.0
        self.dialogue_box.clear()
    
    def skip_current_pause(self) -> bool:
        """
        Skip the current pause if allowed.
        
        Returns:
            True if pause was skipped, False otherwise
        """
        if not self.is_paused or not self.active_pause:
            return False
        
        if not self.active_pause.can_skip:
            return False
        
        logger.info(f"⏩ Skipped pause: {self.active_pause.pause_type.value}")
        self._end_pause()
        return True
    
    def get_pause_status(self) -> Dict[str, Any]:
        """Get current pause status."""
        return {
            'is_paused': self.is_paused,
            'active_pause': {
                'id': self.active_pause.pause_id if self.active_pause else None,
                'type': self.active_pause.pause_type.value if self.active_pause else None,
                'content': self.active_pause.content if self.active_pause else None,
                'duration': self.active_pause.duration if self.active_pause else None,
                'can_skip': self.active_pause.can_skip if self.active_pause else None,
                'elapsed': time.time() - self.pause_start_time if self.is_paused else 0.0
            },
            'queue_length': len(self.pause_queue),
            'dialogue_lines': self.dialogue_box.get_formatted_text()
        }
    
    def _get_default_duration(self, pause_type: PauseType) -> float:
        """Get default duration for pause type."""
        durations = {
            PauseType.DIALOGUE: self.dialogue_pause_duration,
            PauseType.COMBAT: self.combat_pause_duration,
            PauseType.DISCOVERY: self.discovery_pause_duration,
            PauseType.TRANSITION: self.default_pause_duration,
            PauseType.DRAMATIC: self.dramatic_pause_duration,
            PauseType.NARRATIVE: self.default_pause_duration
        }
        return durations.get(pause_type, self.default_pause_duration)
    
    def clear_pause_queue(self) -> None:
        """Clear all pending pauses."""
        self.pause_queue.clear()
        logger.debug("🧹 Pause queue cleared")
    
    def force_end_pause(self) -> None:
        """Force end the current pause."""
        if self.is_paused:
            self._end_pause()
    
    def get_subtitle_text(self) -> List[str]:
        """Get current subtitle text for display."""
        return self.dialogue_box.get_formatted_text()


class SubtitleScroller:
    """
    Subtitle scroller for terminal view.
    
    Provides scrolling subtitles for the terminal view during cinematic pauses.
    """
    
    def __init__(self, max_lines: int = 5):
        """
        Initialize subtitle scroller.
        
        Args:
            max_lines: Maximum number of subtitle lines
        """
        self.max_lines = max_lines
        self.subtitle_history: List[str] = []
        self.current_subtitle: str = ""
        
        logger.debug("📜 Subtitle scroller initialized")
    
    def add_subtitle(self, text: str) -> None:
        """Add subtitle to history."""
        self.current_subtitle = text
        self.subtitle_history.append(text)
        
        # Limit history
        if len(self.subtitle_history) > self.max_lines:
            self.subtitle_history = self.subtitle_history[-self.max_lines:]
    
    def get_scrolling_subtitles(self) -> List[str]:
        """Get scrolling subtitles for display."""
        return self.subtitle_history
    
    def clear_subtitles(self) -> None:
        """Clear subtitle history."""
        self.subtitle_history.clear()
        self.current_subtitle = ""


# Factory for creating cinematic pause components
class CinematicFactory:
    """Factory for creating cinematic components."""
    
    @staticmethod
    def create_cinematic_pauses(simulator: SimulatorHost) -> CinematicPauses:
        """Create cinematic pauses system."""
        return CinematicPauses(simulator)
    
    @staticmethod
    def create_subtitle_scroller(max_lines: int = 5) -> SubtitleScroller:
        """Create subtitle scroller."""
        return SubtitleScroller(max_lines)
