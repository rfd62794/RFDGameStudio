import time
from dataclasses import dataclass, field
from typing import Tuple, Dict, Any

@dataclass
class Effect:
    """Active effect in the game world"""
    effect_type: str
    duration: float
    parameters: Dict[str, Any]
    start_time: float = field(default_factory=time.time)
    
    def is_expired(self) -> bool:
        """Check if effect has expired"""
        return time.time() - self.start_time > self.duration

@dataclass
class Trigger:
    """Interaction trigger in the world"""
    position: Tuple[int, int]
    trigger_type: str
    parameters: Dict[str, Any]
    active: bool = True

@dataclass
class SubtitleEvent:
    """Subtitle event for narrative display"""
    text: str
    duration: float
    style: str = "typewriter"
    timestamp: float = field(default_factory=time.time)
    position: Tuple[int, int] = (0, 0)  # Screen position
    priority: int = 0
    
    def __post_init__(self):
        if isinstance(self.text, str):
            self.text = self.text.strip()
